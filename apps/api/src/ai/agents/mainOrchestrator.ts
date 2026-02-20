import type {
  ProjectDemand,
  AllocationProposal,
  Employee,
  Project,
  LoadingDemand,
} from '@repo/types';
import { callGemini } from '../clients/geminiClient';
import { buildFullContextString } from './contextBuilder';
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

  const fullContext = buildFullContextString(ctx);

  console.log('[Orchestrator] Starting, userInput:', input.userInput?.slice(0, 80));

  // Step 1: Orchestrator decides input type and first action
  emit({
    agent: 'mainOrchestrator',
    step: 'decide',
    message: 'Analyzing input and deciding which agents to invoke...',
  });

  const decidePrompt = `You are the main orchestrator for a resource allocation AI system.

Your job: Analyze the user input and FULL CONTEXT, then decide the next action.

INPUT TYPES:
- chat: Free text / conversational (e.g., "I need 2 backend devs", "Add a QA")
- simple_demand: Structured form demand (demand object with roles)
- loading_table: Loading table format (rows with interval allocations)
- existing_project: Demand for existing project (has projectId)

FULL CONTEXT:
${fullContext}

USER INPUT: "${input.userInput}"

Output JSON only:
{
  "inputType": "chat" | "simple_demand" | "loading_table" | "existing_project" | "unknown",
  "nextAction": "parse_demand" | "run_allocation" | "run_analysis" | "respond",
  "demandAgent": "chatDemandAgent" | "simpleDemandAgent" | "existingProjectAgent" | "loadingTableAgent" | null,
  "runAnalysis": ["qaAgent", "skillGapAgent", "capacityAgent"] | [],
  "reasoning": "string"
}

Rules:
- If user input is conversational and no structured demand, use chatDemandAgent.
- If demand object exists with roles, use simpleDemandAgent.
- If loadingDemand exists with rows, use loadingTableAgent.
- If demand has projectId and projectType EXISTING, use existingProjectAgent.
- If we have a proposal and user asks for analysis (e.g., "summarize", "bottlenecks", "skill gaps"), set run_analysis.
- If we need allocation and have demand, set nextAction run_allocation.
- For chat follow-ups (add, replace, etc.), we'll use processAgentInstruction - set nextAction respond.`;

  const decideRaw = await callGemini(decidePrompt);
  let decideStr = decideRaw;
  const db = decideRaw.indexOf('{');
  const de = decideRaw.lastIndexOf('}');
  if (db !== -1 && de !== -1) decideStr = decideRaw.substring(db, de + 1);

  let decision: {
    inputType: string;
    nextAction: string;
    demandAgent: string | null;
    runAnalysis: string[];
    reasoning: string;
  };
  try {
    decision = JSON.parse(decideStr);
  } catch {
    decision = {
      inputType: 'chat',
      nextAction: 'parse_demand',
      demandAgent: 'chatDemandAgent',
      runAnalysis: [],
      reasoning: 'Fallback: treating as chat demand.',
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

  // Step 2: Parse demand if needed
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

  // Step 3: Check if this is a conversational follow-up (add, replace, etc.)
  const isFollowUp =
    proposal &&
    /add|replace|remove|swap|change|more|another|adjust/i.test(input.userInput);

  if (isFollowUp && proposal && demand) {
    emit({
      agent: 'mainOrchestrator',
      step: 'follow_up',
      message: 'Processing as conversational follow-up (add/replace/modify)...',
    });
    const result = await processAgentInstruction(
      input.userInput,
      input.employees,
      proposal,
      demand,
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

  // Step 4: Run allocation if we have demand
  if (demand && (decision.nextAction === 'run_allocation' || !proposal)) {
    const allocResult = await runAllocationAgent(demand, ctx, emit);
    proposal = allocResult.proposal;
    message = allocResult.reasoning;
  }

  // Step 5: Run analysis agents if requested
  if (decision.runAnalysis?.length && proposal) {
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
