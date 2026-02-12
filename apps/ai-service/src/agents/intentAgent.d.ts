export interface AllocationIntent {
    intentType: 'CREATE_ALLOCATION' | 'ADD_EMPLOYEES' | 'REPLACE_EMPLOYEE' | 'MODIFY_CONSTRAINTS' | 'ASK_EXPLANATION';
    role: string | string[] | null;
    skills: string[] | null;
    experienceLevel: 'JUNIOR' | 'MID' | 'SENIOR' | null;
    employeeCount: number | null;
    targetEmployeeName?: string | null;
    constraints: {
        minAvailabilityPercent: number | null;
    } | null;
    roles?: {
        roleName: string;
        count: number;
    }[];
    incremental?: boolean | null;
    autoSuggestCount?: boolean;
}
export declare function extractAllocationIntent(userMessage: string, conversationHistory?: {
    role: 'user' | 'assistant';
    content: string;
}[]): Promise<AllocationIntent>;
//# sourceMappingURL=intentAgent.d.ts.map