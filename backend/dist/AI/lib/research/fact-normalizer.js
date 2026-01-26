import { ai } from '../../ai/genkit';
import { enforceNoPersona } from './persona-lock';
export async function normalizeFacts(rawText, source, url) {
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
        .map((f) => f.trim()) // ✅ Fixed type error
        .filter(Boolean)
        .slice(0, 2);
    return facts.map((fact) => ({
        claim: fact,
        source,
        url,
    }));
}
//# sourceMappingURL=fact-normalizer.js.map