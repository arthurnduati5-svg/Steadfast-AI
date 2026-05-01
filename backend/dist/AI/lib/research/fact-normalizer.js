"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeFacts = normalizeFacts;
const genkit_1 = require("../../ai/genkit");
const persona_lock_1 = require("./persona-lock");
async function normalizeFacts(rawText, source, url) {
    const prompt = (0, persona_lock_1.enforceNoPersona)(`
Extract up to 2 clear factual statements.
Rules:
- Short sentences
- No opinions
- No explanations

TEXT:
${rawText}
`);
    const res = await genkit_1.ai.generate({
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