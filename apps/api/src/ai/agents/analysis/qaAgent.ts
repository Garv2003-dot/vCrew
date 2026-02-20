import { callGemini } from '../../clients/geminiClient';
import type { AgentContext, AnalysisAgentResult, OnThinking } from '../types';
import { buildAnalysisContext } from '../contextBuilder';

/**
 * QA analysis: identifies risks, bottlenecks, coverage gaps in the allocation.
 */
export async function runQAAgent(
  ctx: AgentContext,
  onThinking?: OnThinking
): Promise<AnalysisAgentResult> {
  onThinking?.({
    agent: 'qaAgent',
    step: 'analyze',
    message: 'Running QA analysis on allocation...',
  });

  const fullContext = buildAnalysisContext(ctx);

  const prompt = `You are a resource allocation QA expert. Analyze the current allocation for risks, bottlenecks, and coverage gaps.

FULL CONTEXT (you have access to everything):
${fullContext}

Provide:
1. A brief summary (2-3 sentences)
2. A bullet list of specific findings (risks, gaps, recommendations)
3. Your reasoning

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
    agent: 'qaAgent',
    step: 'complete',
    message: `QA analysis complete: ${parsed.details?.length || 0} findings.`,
  });

  return {
    summary: parsed.summary || 'No summary.',
    details: Array.isArray(parsed.details) ? parsed.details : [],
    reasoning: parsed.reasoning || '',
  };
}
