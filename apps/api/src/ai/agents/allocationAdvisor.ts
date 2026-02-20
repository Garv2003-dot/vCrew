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
import { createHash } from 'crypto';

// Role/job_title synonyms aligned with dataset: roles, job_titles, skills.
// Demand roles (e.g. "Senior Frontend Developer", "Project Manager") match employees by role or job_title.
const ROLE_SYNONYMS: Record<string, string[]> = {
  backend: [
    'backend', 'back end', 'server', 'api', 'node', 'java', 'go', 'python',
    'ror', 'ruby', '.net', 'net', 'architect', 'full-stack', 'full stack',
    'python/sql', 'backend - java', 'senior software engineer', 'software engineer',
    'senior developer', 'technical lead', 'technical architect', 'team lead',
  ],
  frontend: [
    'frontend', 'front end', 'fe engineer', 'fe ', 'ui', 'react', 'angular', 'vue', 'web',
    'frontend developer', 'front end developer', 'full-stack', 'full stack',
    'senior developer', 'software engineer', 'technical lead', 'team lead',
    '.net engineers', 'ui/ux', 'ux ', 'figma', 'dev - full stack', 'dev- full stack',
  ],
  devops: [
    'devops', 'dev-ops', 'infra', 'sre', 'cloud', 'aws', 'platform',
    'docker', 'kubernetes', 'devops operator', 'devops consultant',
  ],
  mobile: ['mobile', 'ios', 'android', 'react native', 'flutter'],
  qa: [
    'qa', 'testing', 'automation', 'sdet', 'quality assurance',
    'qa engineer', 'qa automation', 'tech lead - qa', 'tech lead- qa',
    'team lead qa', 'consultant test engineer', 'selenium', 'cypress',
  ],
  design: [
    'design', 'ux', 'ui', 'product designer', 'ui/ux', 'figma',
    'team lead ui/ux', 'ui/ux consultant', 'ux sme',
  ],
  manager: [
    'manager', 'lead', 'director', 'project manager', 'product manager',
    'delivery manager', 'scrum master', 'scrum', 'product analyst',
    'engagement lead', 'senior ba', 'ba', 'business analyst',
    'technical pm', 'senior project manager', 'senior product manager',
    'senior manager', 'vice president', 'avp', 'svp', 'vp',
    'associate vice president', 'chief ', 'cto', 'coo', 'cfo',
  ],
  data: [
    'data engineer', 'data-qa', 'data/bi', 'bi developer', 'databricks',
    'data - sql', 'data - aiml', 'data bricks', 'lead data', 'senior data engineer',
  ],
};

/** Normalize role text for matching: collapse "front end" -> "frontend", etc. */
function normalizeRoleText(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/front\s+end/g, 'frontend')
    .replace(/back\s+end/g, 'backend')
    .replace(/full\s*stack/g, 'fullstack')
    .replace(/\s*\/\s*/g, ' ');
}

/** True if required skill matches any employee skill (exact or substring, e.g. "Automation (Appium/Selenium)" matches "Selenium"). */
function skillMatches(
  requiredSkill: string,
  employeeSkillNames: Set<string>,
): boolean {
  const r = requiredSkill.toLowerCase();
  if (employeeSkillNames.has(r)) return true;
  for (const emp of employeeSkillNames) {
    if (r.includes(emp) || emp.includes(r)) return true;
  }
  return false;
}

// Simple in-memory cache for allocation results (2 minute TTL)
interface CacheEntry {
  proposal: AllocationProposal;
  timestamp: number;
}

const allocationCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function createCacheKey(demand: ProjectDemand, employees: Employee[], projects: Project[] = []): string {
  // Create hash from demand roles + employee IDs (for availability changes) + relevant project state
  const demandKey = JSON.stringify({
    projectName: demand.projectName,
    projectId: demand.projectId,
    projectType: demand.projectType,
    roles: demand.roles?.map((r) => ({
      roleName: r.roleName,
      headcount: r.headcount,
      requiredSkills: r.requiredSkills?.map((s) => s.name).sort(),
    })),
  });
  const employeeKey = employees.map((e) => `${(e as any).employeeId ?? e.id}:${e.availabilityPercent}`).sort().join(',');
  // Include relevant project state (if existing project, include assigned employees)
  const projectKey = demand.projectId 
    ? projects.find((p) => p.id === demand.projectId)?.assignedEmployees?.map((a) => `${a.employeeId}:${a.allocationPercent}`).sort().join(',') || ''
    : '';
  const combined = `${demandKey}|${employeeKey}|${projectKey}`;
  return createHash('sha256').update(combined).digest('hex');
}

function getCachedAllocation(key: string): AllocationProposal | null {
  const entry = allocationCache.get(key);
  if (!entry) return null;
  
  const age = Date.now() - entry.timestamp;
  if (age > CACHE_TTL_MS) {
    allocationCache.delete(key);
    return null;
  }
  
  return entry.proposal;
}

function setCachedAllocation(key: string, proposal: AllocationProposal): void {
  allocationCache.set(key, {
    proposal,
    timestamp: Date.now(),
  });
  
  // Cleanup old entries periodically (simple cleanup on every 10th set)
  if (allocationCache.size > 100) {
    const now = Date.now();
    for (const [k, v] of allocationCache.entries()) {
      if (now - v.timestamp > CACHE_TTL_MS) {
        allocationCache.delete(k);
      }
    }
  }
}

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
    const roleNorm = normalizeRoleText(r);
    const roleLower = r.toLowerCase();
    const check = (syns: string[]) =>
      syns.some((s) => roleLower.includes(s) || roleNorm.includes(s));
    if (check(ROLE_SYNONYMS.frontend))
      return ['React', 'Angular', 'JavaScript', 'TypeScript', 'Vue.js', 'HTML', 'CSS'];
    if (check(ROLE_SYNONYMS.backend))
      return ['Node.js', 'Java', 'Python', 'PostgreSQL', 'Ruby', 'Ruby on Rails', '.Net', 'C#'];
    if (check(ROLE_SYNONYMS.devops))
      return ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Azure'];
    if (check(ROLE_SYNONYMS.qa))
      return ['Selenium', 'Cypress', 'Automation testing', 'API Testing', 'Jest'];
    if (check(ROLE_SYNONYMS.manager))
      return []; // PM/manager: match by role/job_title only; optional skills Jira/Scrum
    if (check(ROLE_SYNONYMS.design))
      return ['Figma', 'Sketch', 'AdobeXD', 'UI/UX'];
    if (ROLE_SYNONYMS.data && check(ROLE_SYNONYMS.data))
      return ['Python', 'SQL', 'PostgreSQL', 'PowerBI', 'Tableau', 'Spark'];
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
  const filtered = employees.filter((e) => {
    // 1. Availability constraint
    if (e.availabilityPercent < 20) return false;

    // 2. Status constraint
    if ((e.status as string) === 'ON_LEAVE') return false;

    // 3. Role/JobTitle: match on both role and job_title using expanded synonyms
    const jobTitle = (e as any).jobTitle ?? '';
    const eText = normalizeRoleText(e.role + ' ' + jobTitle);
    const eRole = e.role.toLowerCase();
    const rNorm = normalizeRoleText(roleName);
    const rLower = roleName.toLowerCase();

    let match =
      eText.includes(rNorm) ||
      rNorm.includes(eText) ||
      eRole.includes(rLower) ||
      rLower.includes(eRole);

    if (!match) {
      const group = Object.values(ROLE_SYNONYMS).find((synonyms) =>
        synonyms.some((s) => rLower.includes(s) || rNorm.includes(s)),
      );
      if (group) {
        match = group.some(
          (s) =>
            eText.includes(s) ||
            eRole.includes(s) ||
            (jobTitle && (jobTitle as string).toLowerCase().includes(s)),
        );
      }
    }

    if (!match) return false;

    // 4. Skill constraint: match at least one required skill (fuzzy: AI skills like "Automation (Appium/Selenium)" match employee "Selenium")
    if (!requiredSkills || requiredSkills.length === 0) return true;

    const employeeSkills = new Set(e.skills.map((s) => s.name.toLowerCase()));
    const hasSkillMatch = requiredSkills.some((req) => skillMatches(req, employeeSkills));
    if (hasSkillMatch) return true;

    // If role matched but no skill match, still allow (AI often invents skill names not in our catalog)
    return true;
  });
  return filtered;
}

// Deterministic scoring function for pre-filtering
function scoreCandidateDeterministic(
  candidate: Employee,
  roleName: string,
  requiredSkills: string[],
): number {
  let score = 0;

  // 1. Availability weight (0-0.3)
  const availability = candidate.availabilityPercent ?? 100;
  score += (availability / 100) * 0.3;

  // 2. Experience level weight (0-0.2)
  const expMap: Record<string, number> = { SENIOR: 1.0, MID: 0.7, JUNIOR: 0.4 };
  score += (expMap[candidate.experienceLevel] || 0.5) * 0.2;

  // 3. Skill match weight (0-0.4) — fuzzy match so AI-invented skills (e.g. "Automation (Appium/Selenium)") match catalog ("Selenium")
  if (requiredSkills && requiredSkills.length > 0) {
    const employeeSkills = new Set(
      candidate.skills.map((s) => s.name.toLowerCase()),
    );
    const matchedCount = requiredSkills.filter((req) =>
      skillMatches(req, employeeSkills),
    ).length;
    const skillMatchRatio = matchedCount / requiredSkills.length;
    score += skillMatchRatio * 0.4;
  } else {
    score += 0.4;
  }

  // 4. Role/job_title match weight (0-0.1)
  const candidateText = normalizeRoleText(
    candidate.role + ' ' + ((candidate as any).jobTitle ?? ''),
  );
  const roleNorm = normalizeRoleText(roleName);
  const roleLower = roleName.toLowerCase();
  const candidateRoleLower = candidate.role.toLowerCase();
  if (
    candidateText.includes(roleNorm) ||
    roleNorm.includes(candidateText) ||
    candidateRoleLower.includes(roleLower) ||
    roleLower.includes(candidateRoleLower)
  ) {
    score += 0.1;
  }

  return Math.min(1.0, score);
}

// 2️⃣ Rank Candidates with AI (Optimized with deterministic pre-filtering)
async function rankCandidatesWithAI(
  roleName: string,
  candidates: Employee[],
  requiredSkills: string[] = [],
): Promise<{ employeeId: string; confidence: number; reason: string }[]> {
  if (candidates.length === 0) return [];

  // STEP 1: Deterministic pre-scoring and sorting
  const scored = candidates.map((c) => ({
    candidate: c,
    score: scoreCandidateDeterministic(c, roleName, requiredSkills),
  }));

  scored.sort((a, b) => b.score - a.score);

  // STEP 2: If fewer than 5 candidates, skip AI entirely
  if (candidates.length < 5) {
    return scored.map((item, index) => ({
      employeeId: (item.candidate as any).employeeId ?? item.candidate.id,
      confidence: item.score,
      reason: `Deterministic ranking: ${item.candidate.experienceLevel} ${item.candidate.role} with ${item.candidate.availabilityPercent}% availability.`,
    }));
  }

  // STEP 3: Send only top 5 candidates to AI for final ranking
  const topCandidates = scored.slice(0, 5).map((item) => item.candidate);

  const candidateContext = topCandidates
    .map(
      (e) =>
        `- ${e.name} (id: ${(e as any).employeeId ?? e.id}): ${e.role}, ${e.experienceLevel}, Skills: ${e.skills.map((s) => s.name).join(', ')}, Availability: ${e.availabilityPercent}%`,
    )
    .join('\n');

  const prompt = `
You are a senior technical recruiter ranking candidates for the role: ${roleName}.

Candidates (pre-filtered top 5):
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
    const validIds = new Set(topCandidates.map((c) => (c as any).employeeId ?? c.id));

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

    // Merge AI-ranked top candidates with deterministically ranked rest
    const aiRankedIds = new Set(validated.map((v) => v.employeeId));
    const restCandidates = scored
      .slice(5)
      .map((item) => ({
        employeeId: (item.candidate as any).employeeId ?? item.candidate.id,
        confidence: item.score,
        reason: `Deterministic ranking: ${item.candidate.experienceLevel} ${item.candidate.role} with ${item.candidate.availabilityPercent}% availability.`,
      }));

    return [...validated, ...restCandidates];
  } catch (error) {
    console.error('Failed to rank candidates:', error);
    // 🔒 HARD GUARANTEE: fallback to deterministic ranking
    return scored.map((item) => ({
      employeeId: (item.candidate as any).employeeId ?? item.candidate.id,
      confidence: item.score,
      reason: 'Deterministic ranking (AI fallback).',
    }));
  }
}

// 3️⃣ GENERATE ALLOCATION (Refactored for Robustness)
export async function generateAllocation(
  rawDemand: ProjectDemand,
  employees: Employee[],
  projects: Project[] = [],
): Promise<AllocationProposal> {
  // Check cache first (after normalization to ensure consistent key)
  const demand = normalizeProjectDemand(rawDemand, projects);
  const cacheKey = createCacheKey(demand, employees, projects);
  const cached = getCachedAllocation(cacheKey);
  if (cached) {
    console.log('[Allocation] Cache hit for', demand.projectName);
    return cached;
  }

  // Demand already normalized above for cache key

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
          const emp = employees.find((e) => ((e as any).employeeId ?? e.id) === ass.employeeId);
          if (emp) {
            const assRole = ass.roleName || emp.role; // preferred role name

            // Flexible match: if assignment role matches the demand role
            if (assRole.toLowerCase() === roleName.toLowerCase()) {
              existingRecommendations.push({
                employeeId: (emp as any).employeeId ?? emp.id,
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
      const available = candidates.filter((c) => !existingIds.has((c as any).employeeId ?? c.id));

      // Rank
      let rankedStrats: any[] = [];
      if (available.length > 0) {
        rankedStrats = await rankCandidatesWithAI(roleName, available, skills);
      }

      // Select Top N
      const newRecs = rankedStrats
        .slice(0, candidatesNeeded)
        .map((r) => {
          const emp = available.find((e) => ((e as any).employeeId ?? e.id) === r.employeeId);
          if (!emp) return null;

          const targetAlloc = allocationPercent || 100;
          const finalAlloc = Math.min(targetAlloc, emp.availabilityPercent);

          return {
            employeeId: (emp as any).employeeId ?? emp.id,
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

  const proposal: AllocationProposal = {
    projectName: demand.projectName,
    projectId: demand.projectId,
    type: demand.projectType,
    generatedAt: new Date().toISOString(),
    roleAllocations,
  };

  // Cache the result
  setCachedAllocation(cacheKey, proposal);

  return proposal;
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
  const availableCandidates = candidates.filter((e) => !currentIds.has((e as any).employeeId ?? e.id));

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
  const ranked = await rankCandidatesWithAI(roleName, availableCandidates, resolvedSkills || []);

  // 5. Build Selection
  const topCandidates = ranked
    .slice(0, candidatesToAddCount)
    .map((r) => {
      const emp = availableCandidates.find((e) => ((e as any).employeeId ?? e.id) === r.employeeId);
      if (!emp) {
        console.warn(
          `[WARN] Ranked employee ${r.employeeId} not found in availableCandidates`,
        );
        return null;
      }

      const finalAlloc = Math.min(100, emp.availabilityPercent);

      return {
        employeeId: (emp as any).employeeId ?? emp.id,
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
      !currentIds.has((e as any).employeeId ?? e.id) &&
      (!targetName || !e.name.toLowerCase().includes(targetName.toLowerCase())),
  );

  if (availableCandidates.length === 0) {
    return {
      proposal: { ...currentProposal, roleAllocations: updatedAllocations },
      message: `I removed ${targetName} but found NO suitable candidates to take their place.`,
    };
  }

  // Rank
  const ranked = await rankCandidatesWithAI(roleToFill, availableCandidates, resolvedSkills || []);

  if (ranked.length > 0) {
    const top = ranked[0];
    const replacement = availableCandidates.find(
      (e) => ((e as any).employeeId ?? e.id) === top.employeeId,
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
          employeeId: (replacement as any).employeeId ?? replacement.id,
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
      let finalDemand = { ...state.demand };

      // Override roles from Intent if present
      if (intent.roles && intent.roles.length > 0) {
        finalDemand.roles = intent.roles.map((r) => ({
          roleName: r.roleName,
          headcount: r.count,
          requiredSkills: [], // resolveCandidates handles basic role matching without strict skills if needed
          experienceLevel: intent.experienceLevel || 'MID',
          allocationPercent: 100,
        }));
      } else if (intent.role) {
        const roleName = Array.isArray(intent.role)
          ? intent.role[0]
          : intent.role;
        finalDemand.roles = [
          {
            roleName: roleName,
            headcount: intent.employeeCount || 1,
            requiredSkills: [],
            experienceLevel: intent.experienceLevel || 'MID',
            allocationPercent: 100,
          },
        ];
      }

      return {
        proposal: await generateAllocation(
          finalDemand,
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
