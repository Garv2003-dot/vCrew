import { callGemini } from '../../clients/geminiClient';
import type { AgentContext, OnThinking } from '../types';
import { buildAnalysisContext } from '../contextBuilder';

export interface UnifiedAnalysisResult {
  qa: { summary: string; details: string[]; reasoning: string };
  capacity: { summary: string; details: string[]; reasoning: string };
  skillGap: { summary: string; details: string[]; reasoning: string };
}

/**
 * Unified analysis: Performs QA, Capacity, and Skill Gap analysis in a single LLM call.
 */
export async function runUnifiedAnalysisAgent(
  ctx: AgentContext,
  onThinking?: OnThinking,
): Promise<UnifiedAnalysisResult> {
  onThinking?.({
    agent: 'unifiedAnalysisAgent',
    step: 'analyze',
    message: 'Running consolidated QA, Capacity, and Skill Gap analysis...',
  });

  const fullContext = buildAnalysisContext(ctx);

  const prompt = `You are a unified resource allocation expert. Your task is to perform QA, Capacity, and Skill Gap analysis simultaneously on the current allocation.

FULL CONTEXT (you have access to everything):
${fullContext}

Instructions:
1. QA Analysis: analyze the allocation for risks, bottlenecks, and coverage gaps.
2. Capacity Analysis: check availability, overallocation, bench capacity, and feasibility.
3. Skill Gap Analysis: compare required skills (from demand) vs allocated team's skills, identifying strengths, gaps, and recommendations.

Provide your response ONLY as a JSON object with the exact following structure:
{
  "qa": {
    "summary": "Brief 2-3 sentence summary of QA findings.",
    "details": ["Bullet 1", "Bullet 2"],
    "reasoning": "Explanation of QA conclusions"
  },
  "capacity": {
    "summary": "Brief 2-3 sentence summary of capacity findings.",
    "details": ["Bullet 1", "Bullet 2"],
    "reasoning": "Explanation of capacity conclusions"
  },
  "skillGap": {
    "summary": "Brief 2-3 sentence summary of skill gap findings.",
    "details": ["Bullet 1", "Bullet 2"],
    "reasoning": "Explanation of skill gap conclusions"
  }
}`;

  const defaultFallback: UnifiedAnalysisResult = {
    qa: { summary: 'Analysis skipped or failed.', details: [], reasoning: '' },
    capacity: {
      summary: 'Analysis skipped or failed.',
      details: [],
      reasoning: '',
    },
    skillGap: {
      summary: 'Analysis skipped or failed.',
      details: [],
      reasoning: '',
    },
  };

  try {
    const raw = await callGemini(prompt);
    let jsonStr = raw;
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = raw.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(jsonStr) as Partial<UnifiedAnalysisResult>;

    onThinking?.({
      agent: 'unifiedAnalysisAgent',
      step: 'complete',
      message: 'Unified analysis complete.',
    });

    return {
      qa: {
        summary: parsed.qa?.summary || defaultFallback.qa.summary,
        details: Array.isArray(parsed.qa?.details) ? parsed.qa.details : [],
        reasoning: parsed.qa?.reasoning || '',
      },
      capacity: {
        summary: parsed.capacity?.summary || defaultFallback.capacity.summary,
        details: Array.isArray(parsed.capacity?.details)
          ? parsed.capacity.details
          : [],
        reasoning: parsed.capacity?.reasoning || '',
      },
      skillGap: {
        summary: parsed.skillGap?.summary || defaultFallback.skillGap.summary,
        details: Array.isArray(parsed.skillGap?.details)
          ? parsed.skillGap.details
          : [],
        reasoning: parsed.skillGap?.reasoning || '',
      },
    };
  } catch (error) {
    console.error(
      'Failed to run unified analysis agent. Serving fallback.',
      error,
    );
    onThinking?.({
      agent: 'unifiedAnalysisAgent',
      step: 'error',
      message: 'Unified analysis failed to parse. Returning safe fallback.',
    });
    return defaultFallback;
  }
}
