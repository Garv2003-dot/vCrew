import { callGemini } from '../../clients/geminiClient';
import type { AgentContext, AnalysisAgentResult, OnThinking } from '../types';
import { buildAnalysisContext } from '../contextBuilder';

/**
 * Skill gap analysis: compares demand skills vs allocated employees' skills.
 */
export async function runSkillGapAgent(
  ctx: AgentContext,
  onThinking?: OnThinking
): Promise<AnalysisAgentResult> {
  onThinking?.({
    agent: 'skillGapAgent',
    step: 'analyze',
    message: 'Analyzing skill gaps between demand and allocated team...',
  });

  const fullContext = buildAnalysisContext(ctx);

  const prompt = `You are a skills matching expert. Analyze the gap between required skills (from demand) and the skills of allocated/recommended employees.

FULL CONTEXT (you have access to everything):
${fullContext}

Identify:
1. Roles where skill coverage is strong
2. Roles where there are skill gaps (missing or low proficiency)
3. Recommendations to address gaps (training, different candidates, etc.)

Output JSON:
{
  "summary": "string",
  "details": ["string", "string", ...],
  "reasoning": "string"
}`;

  const raw = await callGemini(prompt);
  let jsonStr = raw;
  const firstBrace = raw.indexOf('{');
  const lastBrace = raw.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    jsonStr = raw.substring(firstBrace, lastBrace + 1);
  }

  const parsed = JSON.parse(jsonStr);

  onThinking?.({
    agent: 'skillGapAgent',
    step: 'complete',
    message: `Skill gap analysis complete.`,
  });

  return {
    summary: parsed.summary || 'No summary.',
    details: Array.isArray(parsed.details) ? parsed.details : [],
    reasoning: parsed.reasoning || '',
  };
}
