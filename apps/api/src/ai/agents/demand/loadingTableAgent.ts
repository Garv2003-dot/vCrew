import type { ProjectDemand, LoadingDemand, LoadingRow } from '@repo/types';
import { ensureDemandRoles } from '../../../utils/parseResourceDescription';
import type { AgentContext, DemandAgentResult, OnThinking } from '../types';

/**
 * Converts loading table format to ProjectDemand (aggregate by role).
 */
export async function parseLoadingTableDemand(
  ctx: AgentContext,
  onThinking?: OnThinking
): Promise<DemandAgentResult> {
  onThinking?.({
    agent: 'loadingTableAgent',
    step: 'convert',
    message: 'Converting loading table to structured demand...',
  });

  const loading = ctx.loadingDemand;
  if (!loading?.rows?.length) {
    throw new Error('Loading table demand requires loadingDemand with rows.');
  }

  const roles = loading.rows.map((row: LoadingRow) => {
    const values = Object.values(row.intervalAllocations || {}) as number[];
    const headcount = values.length ? Math.max(1, ...values) : 1;
    return {
      roleName: row.roleName,
      requiredSkills: (row.primarySkills || []).map((name: string, i: number) => ({
        skillId: `s-${i}`,
        name,
        minimumProficiency: 3 as 1 | 2 | 3 | 4 | 5,
      })),
      experienceLevel: row.experienceLevel,
      allocationPercent: 100,
      headcount,
    };
  });

  const demand: ProjectDemand = {
    demandId: loading.demandId,
    projectType: loading.projectType || 'NEW',
    projectId: loading.projectId,
    projectName: loading.projectName,
    priority: loading.priority || 'HIGH',
    startDate: loading.startDate,
    durationMonths: loading.durationMonths,
    context: loading.context,
    roles,
  };

  const normalized = ensureDemandRoles(demand);

  onThinking?.({
    agent: 'loadingTableAgent',
    step: 'complete',
    message: `Converted ${loading.rows.length} loading rows to demand with ${normalized.roles.length} role(s).`,
  });

  return {
    demand: normalized,
    reasoning: `Converted loading table (${loading.intervalCount} intervals) to structured demand.`,
  };
}
