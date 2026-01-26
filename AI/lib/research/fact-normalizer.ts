import { ai } from '../../ai/genkit';
import OpenAI from 'openai';
import { enforceNoPersona } from './persona-lock';

export interface NormalizedFact {
  claim: string;
  source: string;
  url: string;
}

export async function normalizeFacts(
  rawText: string,
  source: string,
  url: string
): Promise<NormalizedFact[]> {
  const prompt = enforceNoPersona(`
Extract up to 2 clear factual statements.
Rules:
- Short sentences
- No opinions
- No explanations

TEXT:
${rawText}
`);

  const res = await ai.generate({
    model: 'openai/gpt-4o-mini',
    prompt,
  });

  const facts = res.text
    .split('.')
    .map((f: string) => f.trim()) // ✅ Fixed type error
    .filter(Boolean)
    .slice(0, 2);

  return facts.map((fact: string) => ({ // ✅ Fixed type error
    claim: fact,
    source,
    url,
  }));
}