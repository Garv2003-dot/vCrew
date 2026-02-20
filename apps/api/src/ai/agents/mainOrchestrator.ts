import type {
  ProjectDemand,
  AllocationProposal,
  Employee,
  Project,
  LoadingDemand,
} from '@repo/types';
import type { AgentContext, ThinkingStep, OnThinking, DemandAgentResult } from './types';
import { parseChatDemand } from './demand/chatDemandAgent';
import { parseSimpleDemand } from './demand/simpleDemandAgent';
import { parseExistingProjectDemand } from './demand/existingProjectAgent';
import { parseLoadingTableDemand } from './demand/loadingTableAgent';
import { runAllocationAgent } from './allocation/allocationAgent';
import { runQAAgent } from './analysis/qaAgent';
import { runSkillGapAgent } from './analysis/skillGapAgent';
import { runCapacityAgent } from './analysis/capacityAgent';
import { processAgentInstruction } from './allocationAdvisor';

export interface OrchestratorInput {
  userInput: string;
  demand?: Partial<ProjectDemand> | null;
  loadingDemand?: LoadingDemand | null;
  currentProposal?: AllocationProposal | null;
  conversation: { role: 'user' | 'assistant'; content: string }[];
  employees: Employee[];
  projects: Project[];
}

export interface OrchestratorResult {
  proposal: AllocationProposal | null;
  message: string;
  thinkingSteps: ThinkingStep[];
  reasoning: string;
  analysis?: {
    qa?: { summary: string; details: string[] };
    skillGap?: { summary: string; details: string[] };
    capacity?: { summary: string; details: string[] };
  };
}

/**
 * Main orchestrator: decides which agents to run, reruns after each step.
 * All agents receive full context. Emits thinking steps for UX visibility.
 */
export async function runMainOrchestrator(
  input: OrchestratorInput,
  onThinking?: OnThinking
): Promise<OrchestratorResult> {
  const thinkingSteps: ThinkingStep[] = [];
  const emit: OnThinking = (step) => {
    const full = { ...step, timestamp: new Date().toISOString() };
    thinkingSteps.push(full);
    onThinking?.(step);
  };

  const ctx: AgentContext = {
    employees: input.employees,
    projects: input.projects,
    currentProposal: input.currentProposal || null,
    demand: input.demand || null,
    loadingDemand: input.loadingDemand || null,
    conversation: input.conversation,
    userInput: input.userInput,
  };

  console.log('[Orchestrator] Starting, userInput:', input.userInput?.slice(0, 80));

  // Step 1: Deterministic routing (no Gemini call)
  emit({
    agent: 'mainOrchestrator',
    step: 'decide',
    message: 'Determining routing based on input structure...',
  });

  // Deterministic routing rules
  let decision: {
    inputType: string;
    nextAction: string;
    demandAgent: string | null;
    runAnalysis: string[];
    reasoning: string;
  };

  // Rule 1: If loadingDemand exists → use loadingTableAgent
  if (input.loadingDemand && input.loadingDemand.rows?.length > 0) {
    decision = {
      inputType: 'loading_table',
      nextAction: 'parse_demand',
      demandAgent: 'loadingTableAgent',
      runAnalysis: [],
      reasoning: 'Detected loading table format.',
    };
  }
  // Rule 2: If demand.projectType === "EXISTING" → use existingProjectAgent
  else if (input.demand?.projectType === 'EXISTING' && input.demand?.projectId) {
    decision = {
      inputType: 'existing_project',
      nextAction: input.demand.roles?.length ? 'run_allocation' : 'parse_demand',
      demandAgent: 'existingProjectAgent',
      runAnalysis: [],
      reasoning: 'Detected existing project demand.',
    };
  }
  // Rule 3: If demand.roles exists → use simpleDemandAgent
  else if (input.demand?.roles && Array.isArray(input.demand.roles) && input.demand.roles.length > 0) {
    decision = {
      inputType: 'simple_demand',
      nextAction: 'run_allocation',
      demandAgent: null,
      runAnalysis: [],
      reasoning: 'Detected structured demand with roles.',
    };
  }
  // Rule 4: If currentProposal exists and user message contains add/replace/remove/swap/change → use processAgentInstruction
  else if (input.currentProposal && /add|replace|remove|swap|change|more|another|adjust/i.test(input.userInput)) {
    decision = {
      inputType: 'chat',
      nextAction: 'respond',
      demandAgent: null,
      runAnalysis: [],
      reasoning: 'Detected follow-up instruction (add/replace/modify).',
    };
  }
  // Rule 5: Check for analysis requests
  else if (input.currentProposal && /summarize|bottleneck|skill gap|capacity|analysis|qa|quality/i.test(input.userInput)) {
    const analysisAgents: string[] = [];
    if (/qa|quality|test/i.test(input.userInput)) analysisAgents.push('qaAgent');
    if (/skill|gap/i.test(input.userInput)) analysisAgents.push('skillGapAgent');
    if (/capacity|bottleneck/i.test(input.userInput)) analysisAgents.push('capacityAgent');
    if (analysisAgents.length === 0) {
      // Default to all analysis if just "analysis" or "summarize"
      analysisAgents.push('qaAgent', 'skillGapAgent', 'capacityAgent');
    }
    decision = {
      inputType: 'chat',
      nextAction: 'run_analysis',
      demandAgent: null,
      runAnalysis: analysisAgents,
      reasoning: 'Detected analysis request.',
    };
  }
  // Rule 6: Default → use chatDemandAgent
  else {
    decision = {
      inputType: 'chat',
      nextAction: 'parse_demand',
      demandAgent: 'chatDemandAgent',
      runAnalysis: [],
      reasoning: 'Default: treating as conversational demand.',
    };
  }

  ctx.inputType = decision.inputType as AgentContext['inputType'];
  emit({
    agent: 'mainOrchestrator',
    step: 'decided',
    message: `Decision: ${decision.nextAction} (${decision.reasoning})`,
  });

  let demand: ProjectDemand | null = null;
  let proposal: AllocationProposal | null = input.currentProposal || null;
  let message = '';
  const analysis: OrchestratorResult['analysis'] = {};

  // Step 2: Handle follow-up instructions immediately (before parsing)
  if (decision.nextAction === 'respond' && proposal && input.demand) {
    emit({
      agent: 'mainOrchestrator',
      step: 'follow_up',
      message: 'Processing as conversational follow-up (add/replace/modify)...',
    });
    const result = await processAgentInstruction(
      input.userInput,
      input.employees,
      proposal,
      input.demand as ProjectDemand,
      input.conversation,
      input.projects
    );
    return {
      proposal: result.proposal,
      message: result.message,
      thinkingSteps,
      reasoning: `Processed follow-up instruction via allocation advisor.`,
    };
  }

  // Step 3: Parse demand if needed
  if (decision.nextAction === 'parse_demand' && decision.demandAgent) {
    try {
      let result: DemandAgentResult;
      switch (decision.demandAgent) {
        case 'chatDemandAgent':
          result = await parseChatDemand(ctx, emit);
          break;
        case 'simpleDemandAgent':
          result = await parseSimpleDemand(ctx, emit);
          break;
        case 'existingProjectAgent':
          result = await parseExistingProjectDemand(ctx, emit);
          break;
        case 'loadingTableAgent':
          result = await parseLoadingTableDemand(ctx, emit);
          break;
        default:
          result = await parseChatDemand(ctx, emit);
      }
      demand = result.demand;
      message = result.reasoning;
    } catch (e) {
      emit({
        agent: 'mainOrchestrator',
        step: 'error',
        message: `Demand parse failed: ${e instanceof Error ? e.message : String(e)}`,
      });
      return {
        proposal: input.currentProposal ?? null,
        message: `Failed to parse demand: ${e instanceof Error ? e.message : String(e)}`,
        thinkingSteps,
        reasoning: decision.reasoning,
      };
    }
  } else if (ctx.demand && (ctx.demand as ProjectDemand).roles?.length) {
    demand = ctx.demand as ProjectDemand;
  }

  // Step 4: Run allocation if we have demand
  if (demand && (decision.nextAction === 'run_allocation' || !proposal)) {
    const allocResult = await runAllocationAgent(demand, ctx, emit);
    proposal = allocResult.proposal;
    message = allocResult.reasoning;
  }

  // Step 5: Run analysis agents if requested
  if (decision.nextAction === 'run_analysis' && decision.runAnalysis?.length && proposal) {
    ctx.currentProposal = proposal;
    for (const agentName of decision.runAnalysis) {
      try {
        let result;
        switch (agentName) {
          case 'qaAgent':
            result = await runQAAgent(ctx, emit);
            analysis.qa = { summary: result.summary, details: result.details };
            break;
          case 'skillGapAgent':
            result = await runSkillGapAgent(ctx, emit);
            analysis.skillGap = { summary: result.summary, details: result.details };
            break;
          case 'capacityAgent':
            result = await runCapacityAgent(ctx, emit);
            analysis.capacity = { summary: result.summary, details: result.details };
            break;
          default:
            continue;
        }
        message = message ? `${message}\n\n${result.summary}` : result.summary;
      } catch (e) {
        emit({
          agent: 'mainOrchestrator',
          step: 'analysis_error',
          message: `${agentName} failed: ${e instanceof Error ? e.message : String(e)}`,
        });
      }
    }
  }

  // Step 6: If we still have no message, generate one
  if (!message && proposal) {
    message = `Allocation for ${proposal.projectName} is ready. ${proposal.roleAllocations?.length || 0} role(s) with recommendations.`;
  }
  if (!message) {
    message = "I've processed your request. How can I help further?";
  }

  return {
    proposal,
    message,
    thinkingSteps,
    reasoning: decision.reasoning,
    analysis: Object.keys(analysis).length > 0 ? analysis : undefined,
  };
}
