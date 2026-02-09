import { callOllama } from '../clients/ollamaClient';

export interface AllocationIntent {
  intentType:
    | 'CREATE_ALLOCATION'
    | 'ADD_EMPLOYEES'
    | 'REPLACE_EMPLOYEE'
    | 'MODIFY_CONSTRAINTS'
    | 'ASK_EXPLANATION';

  role: string | string[] | null;
  skills: string[] | null;
  experienceLevel: 'JUNIOR' | 'MID' | 'SENIOR' | null;
  employeeCount: number | null;
  targetEmployeeName?: string | null; // Added to help with "Replace Bob"

  constraints: {
    minAvailabilityPercent: number | null;
  } | null;

  // New multi-role support
  roles?: {
    roleName: string;
    count: number;
  }[];

  // Incremental update flag
  incremental?: boolean | null;
}

export async function extractAllocationIntent(
  userMessage: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = [],
): Promise<AllocationIntent> {
  const historyContext = conversationHistory
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const prompt = `
You are an expert AI intent extractor for a resource allocation system.

Your task is to analyze the User Message and extract the structured intent.

Rules:
- You are NOT allocating employees.
- You are ONLY extracting intent.
- Do NOT suggest names.
- Do NOT explain.
- Do NOT hallucinate.
- Output ONLY valid JSON.
- If identifying a replacement target (e.g. "Replace Bob"), put "Bob" in targetEmployeeName.
- **CONTEXT MATTERS:** Look at the conversation history. If the user says "add one more", check previous messages to know WHAT to add.
- If the user uses words like: "more", "another", "additional", "one more", Set "incremental": true.

Distinguish carefully:
- "Create", "New", "Generate", "I need team for..." -> CREATE_ALLOCATION
- "Add", "Append", "Include more", "Also need..." -> ADD_EMPLOYEES
- "Replace", "Swap", "Change", "Remove X and add Y" -> REPLACE_EMPLOYEE
- If the user says "Add..." but it seems like a new request, still prefer ADD_EMPLOYEES.
- **Micro-Instruction**: If the user asks for multiple distinct roles/counts (e.g., "Add 1 frontend and 2 backend"):
  - Extract them into the "roles" array.
  - Each role must have its **OWN** count.
  - Do NOT merge counts across roles.
  - **Do NOT populate "role" or "employeeCount" fields in this case** (leave them null).


Intent Schema:
{
  "intentType": "CREATE_ALLOCATION" | "ADD_EMPLOYEES" | "REPLACE_EMPLOYEE" | "MODIFY_CONSTRAINTS" | "ASK_EXPLANATION",
  "role": string | string[] | null,
  "skills": string[] | null,
  "experienceLevel": "JUNIOR" | "MID" | "SENIOR" | null,
  "employeeCount": number | null,
  "targetEmployeeName": string | null,
  "constraints": {
    "minAvailabilityPercent": number | null
  } | null,
  "roles": [
    {
      "roleName": string,
      "count": number
    }
  ] | null,
  "incremental": boolean | null
}

Conversation History:
${historyContext}

User Message: "${userMessage}"
`;

  const raw = await callOllama(prompt);

  try {
    let jsonStr = raw;
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = raw.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonStr);

    // Normalize and safe return
    return {
      intentType: parsed.intentType || 'ASK_EXPLANATION',
      role: parsed.role || null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : null,
      experienceLevel: parsed.experienceLevel || null,
      employeeCount:
        typeof parsed.employeeCount === 'number' ? parsed.employeeCount : null,
      targetEmployeeName: parsed.targetEmployeeName || null,
      constraints: parsed.constraints || null,
      roles: Array.isArray(parsed.roles) ? parsed.roles : undefined,
      incremental:
        typeof parsed.incremental === 'boolean' ? parsed.incremental : null,
    };
  } catch (error) {
    console.error('Failed to parse intent JSON', error);
    // Fallback intent
    return {
      intentType: 'ASK_EXPLANATION',
      role: null,
      skills: null,
      experienceLevel: null,
      employeeCount: null,
      constraints: null,
      roles: undefined,
    };
  }
}
