import type { ProjectDemand, Project } from '@repo/types';
import { ensureDemandRoles } from '../../../utils/parseResourceDescription';
import type { AgentContext, DemandAgentResult, OnThinking } from '../types';

/**
 * Handles demand for existing projects - merges existing assignments with new requirements.
 */
export async function parseExistingProjectDemand(
  ctx: AgentContext,
  onThinking?: OnThinking
): Promise<DemandAgentResult> {
  onThinking?.({
    agent: 'existingProjectAgent',
    step: 'merge',
    message: 'Merging existing project assignments with new demand...',
  });

  const demand = ctx.demand as ProjectDemand;
  if (!demand?.projectId) {
    throw new Error('Existing project demand requires projectId.');
  }

  const project = ctx.projects.find((p) => p.id === demand.projectId);
  if (!project) {
    throw new Error(`Project ${demand.projectId} not found.`);
  }

  const existingRoles = new Map<string, number>();
  project.assignedEmployees?.forEach((a) => {
    const role = a.roleName || 'Unknown';
    existingRoles.set(role, (existingRoles.get(role) || 0) + 1);
  });

  const mergedRoles = [...(demand.roles || [])];
  existingRoles.forEach((count, roleName) => {
    const existing = mergedRoles.find((r) => r.roleName.toLowerCase() === roleName.toLowerCase());
    if (!existing) {
      mergedRoles.push({
        roleName,
        headcount: count,
        requiredSkills: [],
        experienceLevel: 'MID',
        allocationPercent: 100,
      });
    } else {
      existing.headcount = Math.max(existing.headcount, count);
    }
  });

  const merged: ProjectDemand = {
    ...demand,
    projectType: 'EXISTING',
    projectName: project.name,
    roles: mergedRoles,
  };

  const normalized = ensureDemandRoles(merged);

  onThinking?.({
    agent: 'existingProjectAgent',
    step: 'complete',
    message: `Merged demand for ${project.name}: ${normalized.roles.length} role(s) including existing assignments.`,
  });

  return {
    demand: normalized,
    reasoning: `Merged existing project ${project.name} with ${project.assignedEmployees?.length || 0} current assignments.`,
  };
}
