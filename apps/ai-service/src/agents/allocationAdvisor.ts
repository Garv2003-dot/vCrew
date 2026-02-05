import { ProjectDemand, AllocationProposal, Employee } from '@repo/types';
import { callOllama } from '../clients/ollamaClient';
import { extractAllocationIntent } from './intentAgent';

// Helper to resolve skills from role if missing
function resolvePrimarySkills(
  intent: any,
  originalDemand: ProjectDemand,
): string[] | undefined {
  if (intent.skills && intent.skills.length > 0) {
    return intent.skills;
  }

  const mapRoleToSkills = (r: string) => {
    const roleLower = r.toLowerCase();
    if (roleLower.includes('backend')) return ['Node.js', 'API'];
    if (roleLower.includes('frontend')) return ['React', 'TypeScript'];
    if (roleLower.includes('devops')) return ['Docker', 'Kubernetes'];
    return [];
  };

  if (intent.role) {
    if (Array.isArray(intent.role)) {
      return Array.from(new Set(intent.role.flatMap(mapRoleToSkills)));
    }
    return mapRoleToSkills(intent.role);
  }

  return originalDemand.primarySkills;
}

// Helper to pre-filter candidates ensuring AI only sees viable options
function filterCandidates(
  demand: ProjectDemand,
  employees: Employee[],
  requiredRole?: string | string[] | null,
): Employee[] {
  return employees.filter((e) => {
    // 1. Availability constraint
    if (e.availabilityPercent < 20) return false;

    // 2. Status constraint (explicit 'ON_LEAVE' or implicit via availability)
    if ((e.status as string) === 'ON_LEAVE') return false;

    // 3. Role Constraint (Explicit Intent)
    if (requiredRole) {
      const eRole = e.role.toLowerCase();

      const checkMatch = (req: string) => {
        const rLower = req.toLowerCase();
        // Fuzzy match: allowing "Backend Engineer" to match "Backend Developer" via common "backend"
        // But need to be careful not to match "Senior" with "Junior" if using raw includes.
        // Better: check if key terms match. for now, simple includes.
        return eRole.includes(rLower) || rLower.includes(eRole);
      };

      if (Array.isArray(requiredRole)) {
        if (!requiredRole.some(checkMatch)) return false;
      } else {
        if (!checkMatch(requiredRole)) return false;
      }
    }

    // 4. Skill constraint (Must match at least one primary skill)
    if (!demand.primarySkills || demand.primarySkills.length === 0) return true;

    const employeeSkills = e.skills.map((s) => s.name.toLowerCase());
    const requiredSkills = demand.primarySkills.map((s) => s.toLowerCase());

    const hasSkillMatch = requiredSkills.some((req) =>
      employeeSkills.includes(req),
    );

    return hasSkillMatch;
  });
}

export async function generateAllocation(
  demand: ProjectDemand,
  employees: Employee[],
): Promise<AllocationProposal> {
  // 🔍 Debugging Headcount
  console.log('[DEBUG] generateAllocation called');
  console.log(
    `[DEBUG] Demand Roles: ${JSON.stringify(demand.roles.map((r) => ({ name: r.roleName, count: r.headcount })))}`,
  );

  // 🔍 Pre-filter candidates before AI step
  const filteredEmployees = filterCandidates(demand, employees);

  // Fallback: NONE. If filtered list is empty, AI gets empty context.
  // This prevents hallucination or suggesting wrong roles.
  const candidatesToConsider = filteredEmployees;

  const employeeContext = candidatesToConsider
    .map(
      (e) =>
        `- ${e.name} (id: ${e.id}): ${e.role}, ${e.experienceLevel}, Skills: ${e.skills.map((s) => s.name).join(', ')}, Availability: ${e.availabilityPercent}%, Status: ${e.status}`,
    )
    .join('\n');

  const prompt = `
You are a senior enterprise resource manager.

Your task is to propose employee allocations for the following project demand.

Rules:
- Suggest realistic candidates from the provided employee list
- Assign a confidence score between 0 and 1 using this framework:
  - Skill match: up to 0.5
  - Availability: up to 0.3
  - Experience match: up to 0.2
- Provide a short reason explaining the score breakdown
- Output ONLY valid JSON
- Do NOT include explanations outside JSON
- Do NOT use dynamic keys
- Do NOT wrap output under project name

JSON schema:
{
  "generatedAt": string,
  "roleAllocations": [
    {
      "roleName": string,
      "recommendations": [
        {
          "employeeId": string,
          "employeeName": string,
          "confidence": number,
          "reason": string
        }
      ]
    }
  ]
}

Project Demand:
${JSON.stringify(demand, null, 2)}

Available Employees:
${employeeContext}
`;

  const raw = await callOllama(prompt);
  console.log('[DEBUG] AI RAW:', raw);

  let parsed: any;

  try {
    // Robust extraction: Find first '{' and last '}'
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');

    if (start !== -1 && end !== -1) {
      const jsonStr = raw.substring(start, end + 1);
      parsed = JSON.parse(jsonStr);
    } else {
      throw new Error('No JSON object found in response');
    }
  } catch (e: any) {
    console.error('Failed to parse AI response:', raw);
    throw new Error(`Invalid AI JSON output: ${e.message}`);
  }

  // 🔧 Normalize dynamic root key (vcrew, project name, etc.)
  if (
    typeof parsed === 'object' &&
    !parsed.roleAllocations &&
    Object.keys(parsed).length === 1
  ) {
    const rootKey = Object.keys(parsed)[0];
    parsed = parsed[rootKey];
  }

  // 🔒 Final safety check
  if (!Array.isArray(parsed.roleAllocations)) {
    throw new Error('AI output missing roleAllocations');
  }

  console.log(`[DEBUG] AI returned ${parsed.roleAllocations.length} roles`);

  // Enforce headcount limits strictly
  const enforcedAllocations = parsed.roleAllocations
    .map((alloc: any) => {
      // Strategy:
      // 1. If demand has exactly 1 role, use that headcount (Highest confidence mapping).
      // 2. Else try to match by name.
      // 3. Else default to 5.

      let limit = 5;
      let matchMethod = 'default';
      let targetRoleName = alloc.roleName;

      const match = demand.roles.find(
        (r) => r.roleName.toLowerCase() === alloc.roleName.toLowerCase(),
      );

      if (demand.roles.length === 1) {
        const singleRole = demand.roles[0];
        limit = singleRole.headcount;
        targetRoleName = singleRole.roleName; // FORCE CORRECT NAME
        matchMethod = 'single-role-fallback';
      } else if (match) {
        limit = match.headcount;
        targetRoleName = match.roleName; // Normalize casing
        matchMethod = 'name-match';
      }

      console.log(
        `[DEBUG] Role: ${alloc.roleName} -> ${targetRoleName}, Limit: ${limit} (via ${matchMethod}), Suggestions: ${alloc.recommendations.length}`,
      );

      const sliced = alloc.recommendations.slice(0, limit);

      // Explicitly verify slice worked
      console.log(`[DEBUG] Sliced count: ${sliced.length}`);

      return {
        ...alloc,
        roleName: targetRoleName, // Apply the forced name
        recommendations: sliced,
      };
    })
    .filter((a: any) => a.recommendations.length > 0);

  return {
    projectName: demand.projectName, // always controlled by system
    generatedAt: parsed.generatedAt ?? new Date().toISOString(),
    roleAllocations: enforcedAllocations,
  };
}

// Helper for ADD_EMPLOYEES logic
async function handleAddEmployees(
  intent: any,
  employees: Employee[],
  currentProposal: AllocationProposal,
  originalDemand: ProjectDemand,
): Promise<{ proposal: AllocationProposal; message: string }> {
  try {
    const count = intent.employeeCount || 1;

    // FIX #1 & #2: Resolve primary skills
    const resolvedSkills = resolvePrimarySkills(intent, originalDemand);
    const roleNameDisplay = Array.isArray(intent.role)
      ? intent.role.join('/')
      : intent.role || 'Additional Resource';

    // Create a mini-demand for the addition
    const addDemand: ProjectDemand = {
      ...originalDemand,
      primarySkills: resolvedSkills || [],
      roles: [
        {
          roleName: roleNameDisplay,
          requiredSkills: [],
          experienceLevel: intent.experienceLevel || 'MID',
          allocationPercent: 100,
          headcount: count,
        },
      ],
    };

    // FIX #3: Filter specifically for this addition with ROLE CHECK
    const candidates = filterCandidates(addDemand, employees, intent.role);

    // Exclude already allocated
    const currentIds = new Set(
      currentProposal.roleAllocations.flatMap((r) =>
        r.recommendations.map((re) => re.employeeId),
      ),
    );
    const availableCandidates = candidates.filter((e) => !currentIds.has(e.id));

    // FIX #5: Graceful No-Candidate Handling
    if (availableCandidates.length === 0) {
      const roleStr = Array.isArray(intent.role)
        ? intent.role.join(' or ')
        : intent.role || 'employees';
      return {
        proposal: currentProposal,
        message: `No available ${roleStr} match the requested criteria (Skills: ${resolvedSkills?.join(', ') || 'Any'}). Priority was given to role match.`,
      };
    }

    // Generate specifically for these spots
    const additionProposal = await generateAllocation(
      addDemand,
      availableCandidates.slice(0, count * 3),
    );

    // Merge
    const mergedProposal = { ...currentProposal };
    const newRole = additionProposal.roleAllocations[0];

    if (newRole && newRole.recommendations.length > 0) {
      // Limit to requested count
      newRole.recommendations = newRole.recommendations.slice(0, count);
      mergedProposal.roleAllocations.push(newRole);
    }

    return {
      proposal: mergedProposal,
      message: `I've added ${newRole?.recommendations.length || 0} ${roleNameDisplay} to the team.`,
    };
  } catch (e) {
    console.error('Error adding employees', e);
    return {
      proposal: currentProposal,
      message: 'I failed to add the requested employees.',
    };
  }
}

// Helper for REPLACE_EMPLOYEE logic
async function handleReplaceEmployee(
  intent: any,
  employees: Employee[],
  currentProposal: AllocationProposal,
  originalDemand: ProjectDemand,
): Promise<{ proposal: AllocationProposal; message: string }> {
  const targetName = intent.targetEmployeeName;
  let removedCount = 0;

  const updatedAllocations = currentProposal.roleAllocations.map((role) => {
    const initialLen = role.recommendations.length;
    role.recommendations = role.recommendations.filter(
      (rec) =>
        !targetName ||
        !rec.employeeName.toLowerCase().includes(targetName.toLowerCase()),
    );
    if (role.recommendations.length < initialLen) removedCount++;
    return role;
  });

  if (removedCount === 0) {
    return {
      proposal: currentProposal,
      message: "I couldn't find that employee to replace.",
    };
  }

  // Fill the gap
  const resolvedSkills = resolvePrimarySkills(intent, originalDemand);

  const fillDemand: ProjectDemand = {
    ...originalDemand,
    primarySkills: resolvedSkills || [],
  };

  // Filter with optional role enforcement if intent had one
  const candidates = filterCandidates(fillDemand, employees, intent.role);

  const currentIds = new Set(
    updatedAllocations.flatMap((r) =>
      r.recommendations.map((re) => re.employeeId),
    ),
  );

  // Ensure we don't suggest the person we just removed (if they are still in employees list)
  const availableCandidates = candidates.filter(
    (e) =>
      !currentIds.has(e.id) &&
      (!targetName || !e.name.toLowerCase().includes(targetName.toLowerCase())),
  );

  if (availableCandidates.length === 0) {
    return {
      proposal: { ...currentProposal, roleAllocations: updatedAllocations },
      message: `I removed ${targetName} but found NO suitable candidates to take their place.`,
    };
  }

  const replacementProposal = await generateAllocation(
    fillDemand,
    availableCandidates.slice(0, 3),
  );

  if (replacementProposal.roleAllocations?.[0]?.recommendations?.[0]) {
    const replacement =
      replacementProposal.roleAllocations[0].recommendations[0];
    if (updatedAllocations[0]) {
      updatedAllocations[0].recommendations.push(replacement);
    }
    return {
      proposal: { ...currentProposal, roleAllocations: updatedAllocations },
      message: `I've replaced ${targetName} with ${replacement.employeeName}.`,
    };
  }

  return {
    proposal: { ...currentProposal, roleAllocations: updatedAllocations },
    message: `I removed ${targetName} but couldn't find a suitable replacement.`,
  };
}

// 🧠 The Agent Orchestrator
export async function processAgentInstruction(
  userMessage: string,
  employees: Employee[],
  currentProposal: AllocationProposal | null,
  originalDemand: ProjectDemand,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
): Promise<{ proposal: AllocationProposal; message: string }> {
  // 1. Extract Intent
  const intent = await extractAllocationIntent(
    userMessage,
    conversationHistory,
  );
  console.log('🤖 Agent Intent:', intent);

  // 2. Route Logic
  switch (intent.intentType) {
    case 'CREATE_ALLOCATION': {
      // Allow intent to override original demand (e.g. "Create for 5 people" overrides default 1)
      let finalDemand = { ...originalDemand };

      if (intent.employeeCount || intent.role) {
        // Create roles array if missing
        if (!finalDemand.roles) finalDemand.roles = [];

        finalDemand.roles = finalDemand.roles.map((r) => ({
          ...r,
          headcount: intent.employeeCount || r.headcount,
          // Only override role name if intent has one and it's a single-role project for now
          roleName:
            intent.role &&
            !Array.isArray(intent.role) &&
            finalDemand.roles.length === 1
              ? intent.role
              : r.roleName,
        }));
      }

      return {
        proposal: await generateAllocation(finalDemand, employees),
        message: "I've created a new allocation based on your requirements.",
      };
    }

    case 'ADD_EMPLOYEES': {
      if (!currentProposal) {
        console.warn(
          'Handling ADD_EMPLOYEES checks as CREATE due to missing proposal',
        );
        // Fallback: Treat as CREATE if no proposal exists
        let finalDemand = { ...originalDemand };
        if (intent.employeeCount || intent.role) {
          finalDemand.roles = finalDemand.roles.map((r) => ({
            ...r,
            headcount: intent.employeeCount || r.headcount,
            roleName:
              intent.role &&
              !Array.isArray(intent.role) &&
              finalDemand.roles.length === 1
                ? intent.role
                : r.roleName,
          }));
        }
        return {
          proposal: await generateAllocation(finalDemand, employees),
          message:
            "I've created a new allocation based on your request (started fresh).",
        };
      }
      return handleAddEmployees(
        intent,
        employees,
        currentProposal,
        originalDemand,
      );
    }

    case 'REPLACE_EMPLOYEE': {
      if (!currentProposal) throw new Error('No active allocation to modify.');
      return handleReplaceEmployee(
        intent,
        employees,
        currentProposal,
        originalDemand,
      );
    }

    case 'ASK_EXPLANATION':
      return {
        proposal: currentProposal!,
        message:
          'Analysis: The current allocation is optimized for ' +
          (originalDemand.primarySkills?.join(', ') || 'the requirements') +
          '.',
      };

    default:
      return {
        proposal:
          currentProposal ||
          (await generateAllocation(originalDemand, employees)),
        message: 'I processed your request.',
      };
  }
}
