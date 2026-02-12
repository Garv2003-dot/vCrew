import { ProjectDemand, AllocationProposal, Employee, Project, CanonicalProjectDemand } from '@repo/types';
export declare function normalizeProjectDemand(demand: ProjectDemand, projects: Project[], previousDemand?: CanonicalProjectDemand): CanonicalProjectDemand;
export declare function generateAllocation(rawDemand: ProjectDemand, employees: Employee[], projects?: Project[]): Promise<AllocationProposal>;
export declare function processAgentInstruction(userMessage: string, employees: Employee[], currentProposal: AllocationProposal | null, originalDemand: ProjectDemand, // This comes from API/Client
conversationHistory?: {
    role: 'user' | 'assistant';
    content: string;
}[], projects?: Project[]): Promise<{
    proposal: AllocationProposal;
    message: string;
}>;
//# sourceMappingURL=allocationAdvisor.d.ts.map