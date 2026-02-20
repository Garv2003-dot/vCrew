import type { ProjectDemand } from '@repo/types';
import { callGemini } from '../../clients/geminiClient';
import { ensureDemandRoles } from '../../../utils/parseResourceDescription';
import type { AgentContext, DemandAgentResult, OnThinking } from '../types';
import { buildDecisionContext } from '../contextBuilder';

/** Fix common LLM JSON mistakes before parse */
function repairJson(s: string): string {
  return s
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/\n/g, ' ')
    .trim();
}

/**
 * Parses free-text / conversational demand from chat messages.
 * Handles: "I need 2 backend devs and 1 PM", "Add a QA", etc.
 */
export async function parseChatDemand(
  ctx: AgentContext,
  onThinking?: OnThinking
): Promise<DemandAgentResult> {
  onThinking?.({
    agent: 'chatDemandAgent',
    step: 'parse',
    message: 'Analyzing conversational input to extract structured demand...',
  });

  const fullContext = buildDecisionContext(ctx);

  const prompt = `You are a resource allocation assistant. Your ONLY job is to output a single valid JSON object. No markdown, no explanation, no code fences.

CONTEXT:
${fullContext}

USER INPUT:
${ctx.userInput}

RULES:
1. Infer project name from the input (e.g. "airline app" -> "Airline Mobile Application").
2. Extract every role the user asks for. Use standard role names: "Frontend Developer", "Backend Developer", "QA Engineer", "Project Manager", "Full-Stack Developer", "UI/UX Designer", "Dev-Ops Engineer", "Data Engineer", "Senior Frontend Developer", etc. One role per entry.
3. headcount must be a positive integer (default 1 if not specified).
4. requiredSkills: array of objects with skillId (string like "s-0"), name (string), minimumProficiency (number 1-5). Can be empty [] if not specified.
5. experienceLevel: exactly one of "JUNIOR", "MID", "SENIOR".
6. allocationPercent: always 100.
7. demandId: "d1", projectType: "NEW", priority: "HIGH", startDate: "2025-03-01", durationMonths: 6.

OUTPUT FORMAT (copy this structure, replace with extracted values). Output nothing else.
{"demandId":"d1","projectType":"NEW","projectName":"Project Name Here","priority":"HIGH","startDate":"2025-03-01","durationMonths":6,"context":"","roles":[{"roleName":"Frontend Developer","headcount":2,"requiredSkills":[{"skillId":"s-0","name":"React","minimumProficiency":3}],"experienceLevel":"MID","allocationPercent":100},{"roleName":"Backend Developer","headcount":1,"requiredSkills":[{"skillId":"s-1","name":"Node.js","minimumProficiency":3}],"experienceLevel":"MID","allocationPercent":100},{"roleName":"QA Engineer","headcount":1,"requiredSkills":[],"experienceLevel":"MID","allocationPercent":100},{"roleName":"Project Manager","headcount":1,"requiredSkills":[],"experienceLevel":"SENIOR","allocationPercent":100}]}`;

  const raw = await callGemini(prompt);
  let jsonStr = raw.trim();
  const firstBrace = jsonStr.indexOf('{');
  const lastBrace = jsonStr.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
  }
  jsonStr = repairJson(jsonStr);

  let parsed: ProjectDemand;
  try {
    parsed = JSON.parse(jsonStr) as ProjectDemand;
  } catch (e) {
    throw new Error(
      'Could not parse team structure. Please try again with clear roles (e.g. "2 Frontend Developer, 1 Backend Developer, 1 QA Engineer, 1 Project Manager").',
    );
  }

  if (!parsed.roles || !Array.isArray(parsed.roles)) {
    parsed.roles = [];
  }
  parsed.roles = parsed.roles.filter(
    (r) => r && typeof r.roleName === 'string' && r.roleName.trim() && (r.headcount ?? 1) >= 1,
  );
  parsed.roles.forEach((r) => {
    r.headcount = Math.max(1, Number(r.headcount) || 1);
    r.allocationPercent = 100;
    r.experienceLevel = (r.experienceLevel === 'JUNIOR' || r.experienceLevel === 'SENIOR' ? r.experienceLevel : 'MID') as 'JUNIOR' | 'MID' | 'SENIOR';
    r.requiredSkills = Array.isArray(r.requiredSkills) ? r.requiredSkills : [];
  });

  const normalized = ensureDemandRoles(parsed);

  if (!normalized.roles?.length) {
    throw new Error('Could not extract team structure. Please specify roles (e.g., "2 Backend Developer, 1 QA Engineer, 1 Project Manager").');
  }

  onThinking?.({
    agent: 'chatDemandAgent',
    step: 'complete',
    message: `Extracted demand: ${normalized.roles.map((r) => `${r.roleName} x${r.headcount}`).join(', ')}`,
  });

  return {
    demand: normalized,
    reasoning: `Parsed context into structured demand with ${normalized.roles.length} role(s).`,
  };
}
