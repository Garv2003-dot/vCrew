import type { ProjectDemand } from '@repo/types';
import { ensureDemandRoles } from '../../../utils/parseResourceDescription';
import type { AgentContext, DemandAgentResult, OnThinking } from '../types';

/**
 * Handles simple demand (form-submitted ProjectDemand).
 * Already structured - minimal processing.
 */
export async function parseSimpleDemand(
  ctx: AgentContext,
  onThinking?: OnThinking
): Promise<DemandAgentResult> {
  onThinking?.({
    agent: 'simpleDemandAgent',
    step: 'validate',
    message: 'Validating and normalizing simple demand form data...',
  });

  const demand = ctx.demand as ProjectDemand;
  if (!demand || !demand.roles?.length) {
    throw new Error('Simple demand requires structured demand with roles.');
  }

  const normalized = ensureDemandRoles(demand);

  onThinking?.({
    agent: 'simpleDemandAgent',
    step: 'complete',
    message: `Validated demand: ${normalized.projectName} with ${normalized.roles.length} role(s).`,
  });

  return {
    demand: normalized,
    reasoning: 'Simple demand passed through validation and normalization.',
  };
}
