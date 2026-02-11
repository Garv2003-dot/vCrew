import { GoogleGenerativeAI } from '@google/generative-ai';

// Ensure env is loaded when running as standalone or when API hasn't loaded it
if (typeof process !== 'undefined' && !process.env.GEMINI_API_KEY) {
  try {
    require('dotenv').config();
  } catch {
    // dotenv optional
  }
}

/**
 * Sends a prompt to Gemini and returns the generated text.
 * Same contract as the previous callOllama: (prompt: string) => Promise<string>
 * so existing JSON parsing and validation continue to work unchanged.
 */
export async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not set. Add it to .env (see .env.example).',
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.2,
      topP: 0.95,
      maxOutputTokens: 8192,
    },
  });

  const result = await model.generateContent(prompt);
  const response = result.response;
  if (!response) {
    throw new Error('Gemini returned no response');
  }

  const text = response.text();
  if (text === undefined || text === null) {
    throw new Error('Gemini response had no text');
  }

  return text;
}
