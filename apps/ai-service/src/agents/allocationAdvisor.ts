import {
  ProjectDemand,
  AllocationProposal,
  Employee,
  Project,
  CanonicalProjectDemand,
  DemandChangeLog,
} from '@repo/types';
import { callGemini } from '../clients/geminiClient';
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
  demand: CanonicalProjectDemand; // Strict typing
  employees: Employee[];
  projects: Project[];
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

// 1️⃣ ADAPTER: Normalize Project Demand
export function normalizeProjectDemand(
  demand: ProjectDemand,
  projects: Project[],
  previousDemand?: CanonicalProjectDemand,
): CanonicalProjectDemand {
  // If already canonical, return (or re-verify)
  if ((demand as any).isCanonical) {
    return demand as CanonicalProjectDemand;
  }

  let canonicalRoles = [...(demand.roles || [])];

  // If EXISTING, merge with actual project state + any manual changes
  if (demand.projectType === 'EXISTING' && demand.projectId) {
    const project = projects.find((p) => p.id === demand.projectId);

    if (project && project.assignedEmployees) {
      // Map existing assignments to roles
      const existingRolesMap = new Map<string, number>();

      project.assignedEmployees.forEach((ass) => {
        // Determine role name (from assignment or fetch from employee if we had access here, assuming ass.roleName exists)
        const roleName = ass.roleName || 'Unknown Role';
        existingRolesMap.set(
          roleName,
          (existingRolesMap.get(roleName) || 0) + 1,
        );
      });

      // Merge: Ensure canonicalRoles contains these, with AT LEAST this headcount
      existingRolesMap.forEach((count, role) => {
        const existingDemandRole = canonicalRoles.find(
          (r) => r.roleName === role,
        );
        if (existingDemandRole) {
          // Drift prevention: The demand SHOULD reflect reality + openness
          // If demand says 0 but we have 2, demand is 2 (filled).
          existingDemandRole.headcount = Math.max(
            existingDemandRole.headcount,
            count,
          );
        } else {
          // Add implied role from existing team
          canonicalRoles.push({
            roleName: role,
            headcount: count,
            requiredSkills: [], // derived or default
            experienceLevel: 'MID', // default
            allocationPercent: 100,
          });
        }
      });
    }
  }

  // Preserve change log or init new
  const changeLog = previousDemand?.changeLog || [];

  return {
    ...demand,
    roles: canonicalRoles,
    isCanonical: true,
    changeLog: changeLog,
  };
}

// 2️⃣ Resolve Candidates: Deterministic Filtering with Synonyms
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
    const raw = await callGemini(prompt);
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
      // 2️⃣ Never trust repaired JSON silently - FAIL LOUDLY
      console.error(
        'AI ranking output INVALID. Falling back to deterministic ranking.',
        parseError,
      );
      throw parseError; // Force fallback
    }

    if (!Array.isArray(parsed.rankedCandidates)) {
      throw new Error(
        'Invalid ranking payload: rankedCandidates is not an array',
      );
    }

    // 1️⃣ Enforce ranking output schema: employeeId string, confidence number or string (LLM may return "1.0")
    if (
      !parsed.rankedCandidates.every(
        (r: any) =>
          typeof r.employeeId === 'string' &&
          (typeof r.confidence === 'number' ||
            (typeof r.confidence === 'string' &&
              !Number.isNaN(Number(r.confidence)))),
      )
    ) {
      throw new Error('Invalid ranking payload: schema mismatch');
    }

    // 🛡️ Post-AI Validation + normalize confidence to number
    const seen = new Set<string>();
    const validated: {
      employeeId: string;
      confidence: number;
      reason: string;
    }[] = [];
    const validIds = new Set(candidates.map((c) => c.id));

    for (const r of parsed.rankedCandidates) {
      if (
        validIds.has(r.employeeId) && // Must be a real candidate we sent
        !seen.has(r.employeeId) // Must not be a duplicate
      ) {
        seen.add(r.employeeId);
        const confidence =
          typeof r.confidence === 'number'
            ? r.confidence
            : Math.min(1, Math.max(0, Number(r.confidence)));
        validated.push({
          employeeId: r.employeeId,
          confidence,
          reason: typeof r.reason === 'string' ? r.reason : 'Ranked by AI',
        });
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

// 3️⃣ GENERATE ALLOCATION (Refactored for Robustness)
export async function generateAllocation(
  rawDemand: ProjectDemand,
  employees: Employee[],
  projects: Project[] = [],
): Promise<AllocationProposal> {
  console.log('[DEBUG] generateAllocation (Refactored) called');

  // 1. Normalize Demand (Adapter Pattern)
  // This handles merging existing projects, open roles, and preventing drift
  const demand = normalizeProjectDemand(rawDemand, projects);

  const roleAllocations: {
    roleName: string;
    recommendations: {
      employeeId: string;
      employeeName: string;
      currentRole: string;
      confidence: number;
      reason: string;
      status: 'EXISTING' | 'NEW' | 'REMOVED';
      allocationPercent: number;
    }[];
  }[] = [];

  // 2. Process each role in the canonical demand
  for (const roleDemand of demand.roles) {
    const { roleName, headcount, requiredSkills, allocationPercent } =
      roleDemand;

    // A. Identify Existing Assignments (from normalization source or passed in projects)
    // Since we normalized, we can look up existing assignments from the project if available,
    // but normalizeProjectDemand mostly ensures the *demand* reflects reality.
    // We need to actually Populate the 'EXISTING' recommendations.

    const existingRecommendations: any[] = [];

    if (demand.projectId && demand.projectType === 'EXISTING') {
      const project = projects.find((p) => p.id === demand.projectId);
      if (project && project.assignedEmployees) {
        project.assignedEmployees.forEach((ass) => {
          // Check if this assignment maps to current role
          // (Simple matching or synonym check could go here, for now assumes roleName matches or fallback)
          const emp = employees.find((e) => e.id === ass.employeeId);
          if (emp) {
            const assRole = ass.roleName || emp.role; // preferred role name

            // Flexible match: if assignment role matches the demand role
            if (assRole.toLowerCase() === roleName.toLowerCase()) {
              existingRecommendations.push({
                employeeId: emp.id,
                employeeName: emp.name,
                currentRole: emp.role,
                confidence: 1.0,
                reason: 'Already assigned to this project.',
                status: 'EXISTING',
                allocationPercent: ass.allocationPercent,
              });
            }
          }
        });
      }
    }

    // B. Determine Net Need (Derived Headcount)
    // Fulfilled = Existing
    // Need = Target - Fulfilled
    const currentHeadcount = existingRecommendations.length;
    const candidatesNeeded = Math.max(0, headcount - currentHeadcount);

    let finalRecs = [...existingRecommendations];

    if (candidatesNeeded > 0) {
      // Resolve Candidates
      const skills = requiredSkills.map((s) => s.name); // extract names
      const candidates = resolveCandidates(roleName, skills, employees);

      // Exclude Existing
      const existingIds = new Set(
        existingRecommendations.map((r) => r.employeeId),
      );
      const available = candidates.filter((c) => !existingIds.has(c.id));

      // Rank
      let rankedStrats: any[] = [];
      if (available.length > 0) {
        rankedStrats = await rankCandidatesWithAI(roleName, available);
      }

      // Select Top N
      const newRecs = rankedStrats
        .slice(0, candidatesNeeded)
        .map((r) => {
          const emp = available.find((e) => e.id === r.employeeId);
          if (!emp) return null;

          const targetAlloc = allocationPercent || 100;
          const finalAlloc = Math.min(targetAlloc, emp.availabilityPercent);

          return {
            employeeId: emp.id,
            employeeName: emp.name,
            currentRole: emp.role,
            confidence: r.confidence,
            reason: r.reason,
            status: 'NEW',
            allocationPercent: finalAlloc,
          };
        })
        .filter((r) => r !== null);

      finalRecs = [...finalRecs, ...newRecs];
    }

    roleAllocations.push({
      roleName: roleName,
      recommendations: finalRecs,
    });
  }

  return {
    projectName: demand.projectName,
    projectId: demand.projectId,
    type: demand.projectType,
    generatedAt: new Date().toISOString(),
    roleAllocations,
  };
}

// Helper to determine headcount dynamically
async function recommendHeadcount(
  roleName: string,
  currentProposal: AllocationProposal,
  originalDemand: ProjectDemand,
): Promise<number> {
  console.log(`[DEBUG] Recommending headcount for ${roleName}`);

  const currentAllocationSummary = currentProposal.roleAllocations
    .map((r) => `${r.roleName}: ${r.recommendations.length}`)
    .join(', ');

  const prompt = `
You are a resource planning expert.
Project: ${originalDemand.projectName}
Type: ${originalDemand.projectType}
Context: ${originalDemand.context || 'None'}
Current Allocation: ${currentAllocationSummary || 'None'}

User wants to add: "${roleName}".
Decide the appropriate number of "${roleName}" resources to add.

Rules:
- Analyze standard ratios (e.g., 1 QA per 3-4 Devs, 1 DevOps per project or per 5-10 Devs).
- Consider project context.
- Returns ONLY the integer number.
- Default to 1 if unsure or if the request implies a single resource (e.g., "add a devops").
- Be conservative. Do not add too many unless strictly necessary.
`;

  try {
    const raw = await callGemini(prompt);
    const num = Number.parseInt(raw.trim(), 10);
    return Number.isNaN(num) ? 1 : num;
  } catch (e) {
    console.error('Failed to recommend headcount', e);
    return 1;
  }
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
      const { roleName } = req;
      let { count } = req;

      // Dynamic Headcount Logic
      if (intent.autoSuggestCount) {
        count = await recommendHeadcount(
          roleName,
          updatedProposal,
          originalDemand,
        );
        messages.push(`(AI suggested adding ${count} ${roleName}(s))`);
      }

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

  // --- DELTA LOGIC START ---
  // Find current count for this role
  const existingRole = currentProposal.roleAllocations.find(
    (r) => r.roleName.toLowerCase() === roleName.toLowerCase(),
  );

  const currentCount = existingRole ? existingRole.recommendations.length : 0;

  // If incremental -> add `count`
  // If NOT incremental -> target is `count`, so add `count - currentCount`
  const candidatesToAddCount = intent.incremental
    ? count
    : Math.max(0, count - currentCount);

  if (candidatesToAddCount <= 0) {
    return {
      proposal: currentProposal,
      message: `You already have ${currentCount} ${roleName}(s) allocated (Target: ${count}). No more needed.`,
    };
  }
  // --- DELTA LOGIC END ---

  // 4. Rank
  const ranked = await rankCandidatesWithAI(roleName, availableCandidates);

  // 5. Build Selection
  const topCandidates = ranked
    .slice(0, candidatesToAddCount)
    .map((r) => {
      const emp = availableCandidates.find((e) => e.id === r.employeeId);
      if (!emp) {
        console.warn(
          `[WARN] Ranked employee ${r.employeeId} not found in availableCandidates`,
        );
        return null;
      }

      const finalAlloc = Math.min(100, emp.availabilityPercent);

      return {
        employeeId: emp.id,
        employeeName: emp.name,
        currentRole: emp.role,
        confidence: r.confidence,
        reason: r.reason,
        status: 'NEW', // Mark as NEW
        allocationPercent: finalAlloc,
      };
    })
    .filter((r) => r !== null);

  // 6. Append/Merge
  const mergedProposal = { ...currentProposal };
  // Double check roleAllocations exists on mergedProposal
  if (!mergedProposal.roleAllocations) mergedProposal.roleAllocations = [];

  // Re-find to be safe (though we have existingRole above, we're mutating mergedProposal)
  const targetRoleRef = mergedProposal.roleAllocations.find(
    (r) => r.roleName.toLowerCase() === roleName.toLowerCase(),
  );

  // Soft Cap Check
  const MAX_EXTRA_PER_ROLE = 3;
  // Use existing recommendations length or 0
  const finalCount =
    (targetRoleRef ? targetRoleRef.recommendations.length : 0) +
    topCandidates.length;

  // Find original demand head count if possible, else assume 0 baseline
  const originalRole = (originalDemand.roles || []).find(
    (r) => r.roleName.toLowerCase() === roleName.toLowerCase(),
  );
  const baseCount = originalRole ? originalRole.headcount : 0;

  if (finalCount > baseCount + MAX_EXTRA_PER_ROLE) {
    return {
      proposal: currentProposal,
      message: `I cannot add more ${roleName}s. This role already has sufficient coverage (Limit: ${baseCount + MAX_EXTRA_PER_ROLE}).`,
    };
  }

  if (targetRoleRef) {
    targetRoleRef.recommendations.push(...(topCandidates as any));
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
  // Removed employee data to restore stats if needed, or just track
  let removedRec: any = null;

  const updatedAllocations = currentProposal.roleAllocations.map((role) => {
    const initialLen = role.recommendations.length;
    // Find who we are removing
    const toRemove = role.recommendations.find(
      (rec) =>
        targetName &&
        rec.employeeName.toLowerCase().includes(targetName.toLowerCase()),
    );

    if (toRemove) {
      removedRec = toRemove;
      role.recommendations = role.recommendations.filter((r) => r !== toRemove);
      removedCount++;
      removedRoleName = role.roleName;
      // Mark as REMOVED if we were tracking partial state, but here we physically remove from list
      // If we wanted to keep track of removed ones visually, we'd change status to 'REMOVED' instead of filtering.
      // For now, let's filter out to keep list clean, but AI response says "replaced".
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
        // Inherit allocation but respect replacement's availability
        const inherited = removedRec ? removedRec.allocationPercent : 100;
        const finalAlloc = Math.min(inherited, replacement.availabilityPercent);

        targetRole.recommendations.push({
          employeeId: replacement.id,
          employeeName: replacement.name,
          currentRole: replacement.role,
          confidence: top.confidence,
          reason: top.reason,
          status: 'NEW',
          allocationPercent: finalAlloc,
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
// 4️⃣ AGENT INSTRUCTION PROCESSOR
export async function processAgentInstruction(
  userMessage: string,
  employees: Employee[],
  currentProposal: AllocationProposal | null,
  originalDemand: ProjectDemand, // This comes from API/Client
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  projects: Project[] = [],
): Promise<{ proposal: AllocationProposal; message: string }> {
  // Normalize immediately to Ensure Canonical State
  const canonicalDemand = normalizeProjectDemand(originalDemand, projects);

  // Construct Explicit State
  const state: AgentState = {
    demand: canonicalDemand,
    employees: employees,
    projects: projects,
    currentProposal: currentProposal,
    history: conversationHistory,
  };

  // 1. Extract Intent
  const intent = await extractAllocationIntent(userMessage, state.history);
  console.log('🤖 Agent Intent:', intent);

  // 2. Route Logic
  switch (intent.intentType) {
    case 'CREATE_ALLOCATION': {
      return {
        proposal: await generateAllocation(
          state.demand,
          state.employees,
          state.projects,
        ),
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
          proposal: await generateAllocation(
            finalDemand,
            state.employees,
            state.projects,
          ),
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
          (await generateAllocation(
            state.demand,
            state.employees,
            state.projects,
          )),
        message: 'I processed your request.',
      };
  }
}
