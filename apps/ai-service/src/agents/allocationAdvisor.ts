import { ProjectDemand, AllocationProposal, Employee } from '@repo/types';
import { callOllama } from '../clients/ollamaClient';
import { extractAllocationIntent } from './intentAgent';

const ROLE_SYNONYMS: Record<string, string[]> = {
  backend: ['backend', 'server', 'api', 'node', 'java', 'go', 'python'],
  frontend: ['frontend', 'ui', 'react', 'angular', 'vue', 'web'],
  devops: ['devops', 'infra', 'sre', 'cloud', 'aws', 'platform'],
  mobile: ['mobile', 'ios', 'android', 'react native', 'flutter'],
  qa: ['qa', 'testing', 'automation', 'sdet'],
  design: ['design', 'ux', 'ui', 'product designer'],
  manager: ['manager', 'lead', 'em', 'director'],
};

// Explicit State Container
interface AgentState {
  demand: ProjectDemand;
  employees: Employee[];
  currentProposal: AllocationProposal | null;
  history: { role: 'user' | 'assistant'; content: string }[];
}

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
    if (ROLE_SYNONYMS.backend.some((s) => roleLower.includes(s)))
      return ['Node.js', 'API'];
    if (ROLE_SYNONYMS.frontend.some((s) => roleLower.includes(s)))
      return ['React', 'TypeScript'];
    if (ROLE_SYNONYMS.devops.some((s) => roleLower.includes(s)))
      return ['Docker', 'Kubernetes'];
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

// 1️⃣ Resolve Candidates: Deterministic Filtering with Synonyms
function resolveCandidates(
  roleName: string,
  requiredSkills: string[],
  employees: Employee[],
): Employee[] {
  return employees.filter((e) => {
    // 1. Availability constraint
    if (e.availabilityPercent < 20) return false;

    // 2. Status constraint
    if ((e.status as string) === 'ON_LEAVE') return false;

    // 3. Role Constraint (STRICT but SYNONYM-AWARE)
    const eRole = e.role.toLowerCase();
    const rLower = roleName.toLowerCase();

    // Check direct inclusion first
    let match = eRole.includes(rLower);

    // If no direct match, check synonyms
    if (!match) {
      // Find which canonical group the requested role belongs to
      const group = Object.values(ROLE_SYNONYMS).find((synonyms) =>
        synonyms.some((s) => rLower.includes(s)),
      );
      if (group) {
        // If requested role is in a group, check if employee role is also in that group
        match = group.some((s) => eRole.includes(s));
      }
    }

    if (!match) return false;

    // 4. Skill constraint (Must match at least one primary skill)
    if (!requiredSkills || requiredSkills.length === 0) return true;

    const employeeSkills = new Set(e.skills.map((s) => s.name.toLowerCase()));
    const reqSkillsLower = requiredSkills.map((s) => s.toLowerCase());

    return reqSkillsLower.some((req) => employeeSkills.has(req));
  });
}

// 2️⃣ Rank Candidates with AI (Validated)
async function rankCandidatesWithAI(
  roleName: string,
  candidates: Employee[],
): Promise<{ employeeId: string; confidence: number; reason: string }[]> {
  if (candidates.length === 0) return [];

  const candidateContext = candidates
    .map(
      (e) =>
        `- ${e.name} (id: ${e.id}): ${e.role}, ${e.experienceLevel}, Skills: ${e.skills.map((s) => s.name).join(', ')}, Availability: ${e.availabilityPercent}%`,
    )
    .join('\n');

  const prompt = `
You are a senior technical recruiter ranking candidates for the role: ${roleName}.

Candidates:
${candidateContext}

Return ONLY valid JSON:
{
  "rankedCandidates": [
    { "employeeId": string, "confidence": number, "reason": string }
  ]
}

Rules:
- Rank candidates best suited for ${roleName}.
- Confidence 0-1 (1 = perfect match).
- Reason must be short and specific.
- Return ALL candidates provided in the list.
`;

  try {
    const raw = await callOllama(prompt);
    console.log('[DEBUG] AI Ranking RAW:', raw);

    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON found');

    const jsonStr = raw.substring(start, end + 1);

    // Attempt basic fix for common trailing comma issues
    const fixedJsonStr = jsonStr.replace(/,\s*]/g, ']').replace(/,\s*}/g, '}');

    let parsed;
    try {
      parsed = JSON.parse(fixedJsonStr);
    } catch (parseError) {
      console.warn(
        'JSON Parse failed, attempting aggressive repair',
        parseError,
      );
      // Aggressive repair: if missing closing braces/brackets
      try {
        parsed = JSON.parse(fixedJsonStr + ']}');
      } catch (error_) {
        try {
          parsed = JSON.parse(fixedJsonStr + '}');
        } catch (error__) {
          throw parseError; // Give up
        }
      }
    }

    if (!Array.isArray(parsed.rankedCandidates)) return [];

    // 🛡️ Post-AI Validation
    const seen = new Set<string>();
    const validated = [];
    const validIds = new Set(candidates.map((c) => c.id));

    for (const r of parsed.rankedCandidates) {
      if (
        validIds.has(r.employeeId) && // Must be a real candidate we sent
        !seen.has(r.employeeId) // Must not be a duplicate
      ) {
        seen.add(r.employeeId);
        validated.push(r);
      }
    }

    return validated;
  } catch (error) {
    console.error('Failed to rank candidates:', error);
    // 🔒 HARD GUARANTEE: preserve candidate identity + order
    return candidates.map((c, index) => ({
      employeeId: c.id,
      confidence: 0.5 - index * 0.01, // deterministic tie-break
      reason: 'Default ranking due to AI parsing failure.',
    }));
  }
}

export async function generateAllocation(
  demand: ProjectDemand,
  employees: Employee[],
): Promise<AllocationProposal> {
  console.log('[DEBUG] generateAllocation (Refactored) called');

  const roleAllocations = [];

  for (const roleDemand of demand.roles) {
    // 1️⃣ Resolve
    // Fix type mismatch: ensure skills are strings
    const rawReqSkills =
      roleDemand.requiredSkills || demand.primarySkills || [];
    const safeReqSkills = rawReqSkills.map((s: any) =>
      typeof s === 'string' ? s : s.name,
    );

    const candidates = resolveCandidates(
      roleDemand.roleName,
      safeReqSkills,
      employees,
    );

    // 2️⃣ Rank
    let ranked: { employeeId: string; confidence: number; reason: string }[] =
      [];
    if (candidates.length > 0) {
      ranked = await rankCandidatesWithAI(roleDemand.roleName, candidates);
    }

    // 3️⃣ Build Proposal (Slice to headcount)
    // Map ranked results back to full recommendation objects
    const finalRecommendations = ranked
      .map((r) => {
        const emp = candidates.find((c) => c.id === r.employeeId);
        if (!emp) {
          console.warn(
            `[WARN] Ranked employee ${r.employeeId} not found in candidates`,
          );
          return null;
        }
        return {
          employeeId: emp.id,
          employeeName: emp.name,
          currentRole: emp.role,
          confidence: r.confidence,
          reason: r.reason,
        };
      })
      .filter((r) => r !== null)
      .slice(0, roleDemand.headcount); // Strict headcount enforcement

    roleAllocations.push({
      roleName: roleDemand.roleName,
      recommendations: finalRecommendations as any,
    });
  }

  return {
    projectName: demand.projectName,
    generatedAt: new Date().toISOString(),
    roleAllocations,
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
    // Ensure structure exists
    if (!currentProposal.roleAllocations) {
      currentProposal.roleAllocations = [];
    }

    // Determine invalid intent (no roles at all)
    const hasRole =
      intent.role && (!Array.isArray(intent.role) || intent.role.length > 0);
    const hasRolesArray = intent.roles && intent.roles.length > 0;

    if (!hasRole && !hasRolesArray) {
      return {
        proposal: currentProposal,
        message:
          "Please specify which role you'd like to add (e.g., 'Add a backend developer').",
      };
    }

    // Normalize to array of requests
    const roleRequests: { roleName: string; count: number }[] =
      intent.roles && intent.roles.length > 0
        ? intent.roles
        : [
            {
              roleName: Array.isArray(intent.role)
                ? intent.role[0]
                : intent.role,
              count: intent.employeeCount || 1,
            },
          ];

    let updatedProposal = { ...currentProposal };
    const messages: string[] = [];

    for (const req of roleRequests) {
      const { roleName, count } = req;

      const result = await handleAddSingleRole(
        roleName,
        count,
        employees,
        updatedProposal,
        originalDemand,
        intent,
      );

      updatedProposal = result.proposal;
      if (result.message) {
        messages.push(result.message);
      }
    }

    return {
      proposal: updatedProposal,
      message: messages.join(' '),
    };
  } catch (e) {
    console.error('Error adding employees', e);
    return {
      proposal: currentProposal,
      message: 'I failed to add the requested employees.',
    };
  }
}

async function handleAddSingleRole(
  roleName: string,
  count: number,
  employees: Employee[],
  currentProposal: AllocationProposal,
  originalDemand: ProjectDemand,
  intent: any,
): Promise<{ proposal: AllocationProposal; message: string }> {
  // 2. Resolve Skills
  const resolvedSkills = resolvePrimarySkills(intent, originalDemand);

  // 3. Resolve Candidates (Strict)
  const candidates = resolveCandidates(
    roleName,
    resolvedSkills || [],
    employees,
  );

  // Filter out already allocated
  const currentIds = new Set(
    currentProposal.roleAllocations.flatMap((r) =>
      r.recommendations.map((re) => re.employeeId),
    ),
  );
  const availableCandidates = candidates.filter((e) => !currentIds.has(e.id));

  if (availableCandidates.length === 0) {
    return {
      proposal: currentProposal,
      message: `I couldn't find any available ${roleName} candidates matching the criteria.`,
    };
  }

  // 4. Rank
  const ranked = await rankCandidatesWithAI(roleName, availableCandidates);

  // 5. Build Selection
  const topCandidates = ranked
    .slice(0, count)
    .map((r) => {
      const emp = availableCandidates.find((e) => e.id === r.employeeId);
      if (!emp) {
        console.warn(
          `[WARN] Ranked employee ${r.employeeId} not found in availableCandidates`,
        );
        return null;
      }
      return {
        employeeId: emp.id,
        employeeName: emp.name,
        currentRole: emp.role,
        confidence: r.confidence,
        reason: r.reason,
      };
    })
    .filter((r) => r !== null);

  // 6. Append/Merge
  const mergedProposal = { ...currentProposal };
  // Double check roleAllocations exists on mergedProposal
  if (!mergedProposal.roleAllocations) mergedProposal.roleAllocations = [];

  const existingRole = mergedProposal.roleAllocations.find(
    (r) => r.roleName.toLowerCase() === roleName.toLowerCase(),
  );

  // Soft Cap Check
  const MAX_EXTRA_PER_ROLE = 3;
  const currentCount = existingRole ? existingRole.recommendations.length : 0;

  // Find original demand head count if possible, else assume 0 baseline
  const originalRole = (originalDemand.roles || []).find(
    (r) => r.roleName.toLowerCase() === roleName.toLowerCase(),
  );
  const baseCount = originalRole ? originalRole.headcount : 0;

  if (currentCount + topCandidates.length > baseCount + MAX_EXTRA_PER_ROLE) {
    return {
      proposal: currentProposal,
      message: `I cannot add more ${roleName}s. This role already has sufficient coverage (Limit: ${baseCount + MAX_EXTRA_PER_ROLE}).`,
    };
  }

  if (existingRole) {
    existingRole.recommendations.push(...(topCandidates as any));
  } else {
    mergedProposal.roleAllocations.push({
      roleName: roleName,
      recommendations: topCandidates as any,
    });
  }

  return {
    proposal: mergedProposal,
    message: `I've added ${topCandidates.length} ${roleName}(s) to the allocation.`,
  };
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
  let removedRoleName = '';

  const updatedAllocations = currentProposal.roleAllocations.map((role) => {
    const initialLen = role.recommendations.length;
    role.recommendations = role.recommendations.filter(
      (rec) =>
        !targetName ||
        !rec.employeeName.toLowerCase().includes(targetName.toLowerCase()),
    );
    if (role.recommendations.length < initialLen) {
      removedCount++;
      removedRoleName = role.roleName;
    }
    return role;
  });

  if (removedCount === 0) {
    return {
      proposal: currentProposal,
      message: "I couldn't find that employee to replace.",
    };
  }

  // Determine what to look for (prefer removed role, then intent role)
  let roleToFill = removedRoleName;
  if (intent.role) {
    roleToFill = Array.isArray(intent.role) ? intent.role[0] : intent.role;
  }

  // Fill the gap
  const resolvedSkills = resolvePrimarySkills(intent, originalDemand);

  // Strict Resolve
  const candidates = resolveCandidates(
    roleToFill,
    resolvedSkills || [],
    employees,
  );

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

  // Rank
  const ranked = await rankCandidatesWithAI(roleToFill, availableCandidates);

  if (ranked.length > 0) {
    const top = ranked[0];
    const replacement = availableCandidates.find(
      (e) => e.id === top.employeeId,
    );

    if (replacement) {
      // Find the role to put them in
      const targetRole = updatedAllocations.find(
        (r) => r.roleName === removedRoleName,
      );
      if (targetRole) {
        targetRole.recommendations.push({
          employeeId: replacement.id,
          employeeName: replacement.name,
          currentRole: replacement.role,
          confidence: top.confidence,
          reason: top.reason,
        });
      }
      return {
        proposal: { ...currentProposal, roleAllocations: updatedAllocations },
        message: `I've replaced ${targetName} with ${replacement.name}.`,
      };
    }
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
  // Construct Explicit State
  const state: AgentState = {
    demand: originalDemand,
    employees: employees,
    currentProposal: currentProposal,
    history: conversationHistory,
  };

  // 1. Extract Intent
  const intent = await extractAllocationIntent(userMessage, state.history);
  console.log('🤖 Agent Intent:', intent);

  // 2. Route Logic
  switch (intent.intentType) {
    case 'CREATE_ALLOCATION': {
      // Allow intent to override original demand (e.g. "Create for 5 people" overrides default 1)
      let finalDemand = { ...state.demand };

      if (intent.role) {
        // If intent specifies roles, WE CREATE THEM (overriding or seeding empty demand)
        const roleNames = Array.isArray(intent.role)
          ? intent.role
          : [intent.role];

        finalDemand.roles = roleNames.map((r) => ({
          roleName: r,
          headcount: intent.employeeCount || 1, // Default to 1 if not specified
          requiredSkills: [], // resolveCandidates will handle this lookup or defaults
          experienceLevel: intent.experienceLevel || 'MID',
          allocationPercent: 100,
        }));
      } else if (
        intent.employeeCount &&
        finalDemand.roles &&
        finalDemand.roles.length > 0
      ) {
        // If only count is specified, update EXISTING roles
        finalDemand.roles = finalDemand.roles.map((r) => ({
          ...r,
          headcount: intent.employeeCount || r.headcount,
        }));
      }

      return {
        proposal: await generateAllocation(finalDemand, state.employees),
        message: "I've created a new allocation based on your requirements.",
      };
    }

    case 'ADD_EMPLOYEES': {
      if (!state.currentProposal) {
        console.warn(
          'Handling ADD_EMPLOYEES checks as CREATE due to missing proposal',
        );
        // Fallback: Treat as CREATE if no proposal exists
        let finalDemand = { ...state.demand };
        if (intent.employeeCount || intent.role) {
          finalDemand.roles = finalDemand.roles.map((r) => {
            let targetRoleName = r.roleName;
            if (
              intent.role &&
              !Array.isArray(intent.role) &&
              finalDemand.roles.length === 1
            ) {
              targetRoleName = intent.role;
            }
            return {
              ...r,
              headcount: intent.employeeCount || r.headcount,
              roleName: targetRoleName,
            };
          });
        }
        return {
          proposal: await generateAllocation(finalDemand, state.employees),
          message:
            "I've created a new allocation based on your request (started fresh).",
        };
      }
      return handleAddEmployees(
        intent,
        state.employees,
        state.currentProposal,
        state.demand,
      );
    }

    case 'REPLACE_EMPLOYEE': {
      if (!state.currentProposal)
        throw new Error('No active allocation to modify.');
      return handleReplaceEmployee(
        intent,
        state.employees,
        state.currentProposal,
        state.demand,
      );
    }

    case 'ASK_EXPLANATION':
      return {
        proposal: state.currentProposal!,
        message:
          'Analysis: The current allocation is optimized for ' +
          (state.demand.primarySkills?.join(', ') || 'the requirements') +
          '.',
      };

    default:
      return {
        proposal:
          state.currentProposal ||
          (await generateAllocation(state.demand, state.employees)),
        message: 'I processed your request.',
      };
  }
}
