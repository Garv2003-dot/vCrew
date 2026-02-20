import type { ProjectDemand, AllocationProposal } from '@repo/types';
import { generateAllocation } from '../allocationAdvisor';
import type { AgentContext, AllocationAgentResult, OnThinking } from '../types';
import { buildFullContextString } from '../contextBuilder';

/**
 * Generates allocation proposal from structured demand.
 * Uses full context for candidate selection.
 */
export async function runAllocationAgent(
  demand: ProjectDemand,
  ctx: AgentContext,
  onThinking?: OnThinking
): Promise<AllocationAgentResult> {
  onThinking?.({
    agent: 'allocationAgent',
    step: 'resolve',
    message: `Resolving candidates for ${demand.roles?.length || 0} roles...`,
  });

  const proposal = await generateAllocation(
    demand,
    ctx.employees,
    ctx.projects
  );

  onThinking?.({
    agent: 'allocationAgent',
    step: 'rank',
    message: `Ranked and selected ${proposal.roleAllocations?.reduce((s, r) => s + r.recommendations.length, 0) || 0} employees across roles.`,
  });

  const roleSummary = proposal.roleAllocations
    ?.map((r) => `${r.roleName}: ${r.recommendations.length}`)
    .join(', ');

  return {
    proposal,
    reasoning: `Generated allocation for ${demand.projectName}: ${roleSummary}.`,
  };
}
