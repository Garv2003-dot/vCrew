import type { ProjectDemand } from '@repo/types';
import { callGemini } from '../../clients/geminiClient';
import { ensureDemandRoles } from '../../../utils/parseResourceDescription';
import type { AgentContext, DemandAgentResult, OnThinking } from '../types';
import { buildDecisionContext } from '../contextBuilder';

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

  const prompt = `You are a resource allocation assistant. Extract a team structure from the user's free-text input.

FULL CONTEXT:
${fullContext}

USER INPUT:
${ctx.userInput}

Return ONLY valid JSON. Infer project name, roles, and headcounts from the context. Each role needs: roleName, headcount, requiredSkills (array of {skillId, name, minimumProficiency}), experienceLevel ("JUNIOR"|"MID"|"SENIOR"), allocationPercent:100.

Schema:
{"demandId":"d1","projectType":"NEW","projectName":"string","priority":"HIGH","startDate":"2025-03-01","durationMonths":8,"context":"user input","roles":[{"roleName":"string","headcount":number,"requiredSkills":[{"skillId":"s-0","name":"string","minimumProficiency":3}],"experienceLevel":"MID","allocationPercent":100}]}`;

  const raw = await callGemini(prompt);
  let jsonStr = raw;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonStr = raw.substring(firstBrace, lastBrace + 1);
  }

  let parsed = JSON.parse(jsonStr) as ProjectDemand;

  const normalized = ensureDemandRoles(parsed);

  if (!normalized.roles?.length) {
    throw new Error('Could not extract team structure. Please specify roles (e.g., "2 backend, 1 PM, 2 QA").');
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
