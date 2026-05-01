"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.needsWebResearch = needsWebResearch;
const genkit_1 = require("../../ai/genkit");
async function needsWebResearch(query) {
    const prompt = `
Question: "${query}"

Decide if this question REQUIRES real-time or current web information.

Respond ONLY with JSON:
{ "needsWeb": true | false }
`;
    const res = await genkit_1.ai.generate({
        model: 'openai/gpt-4o-mini',
        prompt,
        output: { format: 'json' },
    });
    return Boolean(res.output?.needsWeb);
}
//# sourceMappingURL=research-intent-gate.js.map