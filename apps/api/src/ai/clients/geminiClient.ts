import { GoogleGenAI } from '@google/genai';

// Ensure env is loaded when running as standalone or when API hasn't loaded it
if (typeof process !== 'undefined' && !process.env.GEMINI_API_KEY) {
  try {
    require('dotenv').config();
  } catch {}
}
export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to .env (see .env.example).',
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  let lastError: any;
  for (let i = 0; i < 3; i++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text;
      if (!text) {
        throw new Error('Gemini response had no text');
      }

      return text;
    } catch (e: any) {
      lastError = e;
      const status = e.status || e.code || (e.response && e.response.status);
      if ((status === 503 || status === 429) && i < 2) {
        console.warn(`Gemini API error ${status}, retrying (${i + 1}/3)...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1))); // Simple backoff
        continue;
      }
      throw e;
    }
  }
  throw lastError || new Error('Gemini API failed after retries');
}