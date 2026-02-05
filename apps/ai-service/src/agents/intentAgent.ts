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

Distinguish carefully:
- "Create", "New", "Generate", "I need team for..." -> CREATE_ALLOCATION
- "Add", "Append", "Include more", "Also need..." -> ADD_EMPLOYEES
- "Replace", "Swap", "Change", "Remove X and add Y" -> REPLACE_EMPLOYEE
- If the user says "Add..." but it seems like a new request, still prefer ADD_EMPLOYEES.

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
  } | null
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
    };
  }
}
