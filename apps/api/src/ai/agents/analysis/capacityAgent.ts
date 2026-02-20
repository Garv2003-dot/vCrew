import { callGemini } from '../../clients/geminiClient';
import type { AgentContext, AnalysisAgentResult, OnThinking } from '../types';
import { buildAnalysisContext } from '../contextBuilder';

/**
 * Capacity analysis: checks availability, overallocation, bench capacity.
 */
export async function runCapacityAgent(
  ctx: AgentContext,
  onThinking?: OnThinking
): Promise<AnalysisAgentResult> {
  onThinking?.({
    agent: 'capacityAgent',
    step: 'analyze',
    message: 'Analyzing capacity and availability...',
  });

  const fullContext = buildAnalysisContext(ctx);

  const prompt = `You are a capacity planning expert. Analyze:
1. Current allocation vs employee availability (any overallocation?)
2. Bench capacity (unallocated employees by role)
3. Whether the proposed allocation is feasible
4. Capacity risks (e.g., key person dependency, low availability)

FULL CONTEXT (you have access to everything):
${fullContext}

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
    agent: 'capacityAgent',
    step: 'complete',
    message: `Capacity analysis complete.`,
  });

  return {
    summary: parsed.summary || 'No summary.',
    details: Array.isArray(parsed.details) ? parsed.details : [],
    reasoning: parsed.reasoning || '',
  };
}
