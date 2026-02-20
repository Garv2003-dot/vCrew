import type {
  ProjectDemand,
  LoadingDemand,
  AllocationProposal,
  Employee,
  Project,
} from '@repo/types';

/** Full context passed to ALL agents - no partial data */
export interface AgentContext {
  employees: Employee[];
  projects: Project[];
  currentProposal: AllocationProposal | null;
  demand: Partial<ProjectDemand> | null;
  loadingDemand: LoadingDemand | null;
  conversation: { role: 'user' | 'assistant'; content: string }[];
  /** Raw user input (message, form data reference, etc.) */
  userInput: string;
  /** Input type hint from orchestrator */
  inputType?: 'chat' | 'simple_demand' | 'loading_table' | 'existing_project' | 'unknown';
}

/** Single thinking step emitted during agent execution */
export interface ThinkingStep {
  agent: string;
  step: string;
  message: string;
  timestamp: string;
}

/** Callback to emit thinking steps for UX visibility */
export type OnThinking = (step: Omit<ThinkingStep, 'timestamp'>) => void;

/** Result from demand agents - structured demand */
export interface DemandAgentResult {
  demand: ProjectDemand;
  reasoning: string;
}

/** Result from allocation agent */
export interface AllocationAgentResult {
  proposal: AllocationProposal;
  reasoning: string;
}

/** Result from analysis agents */
export interface AnalysisAgentResult {
  summary: string;
  details: string[];
  reasoning: string;
}

/** Orchestrator decision: which agent(s) to run next */
export type NextAction =
  | { type: 'parse_demand'; agent: string }
  | { type: 'run_allocation' }
  | { type: 'run_analysis'; agents: string[] }
  | { type: 'respond'; message: string; done: true };
