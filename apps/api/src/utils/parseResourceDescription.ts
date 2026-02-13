import { ProjectDemand } from '@repo/types';

/**
 * Parses natural language resource description like
 * "2 Backend, 3 Frontend, 1 Project Manager, 2 QA" into demand roles.
 */
export function parseResourceDescription(
  text: string,
): ProjectDemand['roles'] {
  if (!text || !text.trim()) return [];

  const roles: ProjectDemand['roles'] = [];
  // Split by comma, then each part can be "2 Backend" or "Backend" (implies 1)
  const parts = text.split(',').map((p) => p.trim()).filter(Boolean);

  for (const part of parts) {
    const match = part.match(/^(\d+)\s+(.+)$/);
    const headcount = match ? Math.max(1, parseInt(match[1], 10)) : 1;
    const roleName = match ? match[2].trim() : part.trim();
    if (!roleName) continue;

    roles.push({
      roleName,
      headcount,
      requiredSkills: [],
      experienceLevel: 'MID',
      allocationPercent: 100,
    });
  }

  return roles;
}

/**
 * If demand has resourceDescription and no/empty roles, parse and populate roles.
 */
export function ensureDemandRoles(demand: ProjectDemand): ProjectDemand {
  const hasExplicitRoles =
    demand.roles && demand.roles.length > 0;
  if (hasExplicitRoles) return demand;

  if (demand.resourceDescription && demand.resourceDescription.trim()) {
    const parsed = parseResourceDescription(demand.resourceDescription);
    if (parsed.length > 0) {
      return { ...demand, roles: parsed };
    }
  }

  return demand;
}
