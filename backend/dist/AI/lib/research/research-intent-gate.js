import { ai } from '../../ai/genkit';
export async function needsWebResearch(query) {
    const prompt = `
Question: "${query}"

Decide if this question REQUIRES real-time or current web information.

Respond ONLY with JSON:
{ "needsWeb": true | false }
`;
    const res = await ai.generate({
        model: 'openai/gpt-4o-mini',
        prompt,
        output: { format: 'json' },
    });
    return Boolean(res.output?.needsWeb);
}
//# sourceMappingURL=research-intent-gate.js.map