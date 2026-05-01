"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serperSearchTool = exports.ai = void 0;
const genkit_1 = require("genkit");
const genkitx_openai_1 = require("genkitx-openai");
const globalGenkit = globalThis;
exports.ai = globalGenkit.__steadfastGenkitAi ||
    (globalGenkit.__steadfastGenkitAi = (0, genkit_1.genkit)({
        plugins: [
            (0, genkitx_openai_1.openAI)({
                apiKey: process.env.OPENAI_API_KEY,
            }),
        ],
    }));
exports.serperSearchTool = globalGenkit.__steadfastSerperSearchTool ||
    (globalGenkit.__steadfastSerperSearchTool = exports.ai.defineTool({
        name: 'serperSearch',
        description: 'Performs a google search using Serper.dev.',
        inputSchema: genkit_1.z.object({
            query: genkit_1.z.string().describe('The search query.'),
        }),
        outputSchema: genkit_1.z.object({
            results: genkit_1.z.array(genkit_1.z.object({
                title: genkit_1.z.string(),
                link: genkit_1.z.string(),
                snippet: genkit_1.z.string().optional(),
            })).optional(),
        }),
    }, async (input) => {
        console.log(`[🔍 DEEP TRACE] Tool 'serperSearch' called with query: "${input.query}"`);
        const apiKey = process.env.SERPER_API_KEY;
        if (!apiKey) {
            console.warn("[🔍 DEEP TRACE] ❌ NO API KEY FOUND in .env (SERPER_API_KEY). Returning empty results.");
            return { results: [] };
        }
        try {
            console.log(`[🔍 DEEP TRACE] 📡 Sending request to Serper.dev...`);
            const response = await fetch('https://google.serper.dev/search', {
                method: 'POST',
                headers: {
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ q: input.query }),
            });
            console.log(`[🔍 DEEP TRACE] 📡 API Response Status: ${response.status}`);
            // SPECIFIC CHECK FOR KEY MISMATCH
            if (response.status === 403) {
                console.error(`[🔍 DEEP TRACE] ⛔️ 403 FORBIDDEN. This usually means you are using a SerpAPI key (starts with 'e...') for Serper.dev. You need a Serper.dev key (starts with 'gl...').`);
                return { results: [] };
            }
            if (!response.ok) {
                console.error(`[🔍 DEEP TRACE] ❌ API Error: ${response.statusText}`);
                return { results: [] };
            }
            const data = await response.json();
            const results = data.organic?.map((item) => ({
                title: item.title || 'No title',
                link: item.link || '',
                snippet: item.snippet || '',
            })) || [];
            console.log(`[🔍 DEEP TRACE] ✅ API Success. Received ${results.length} results.`);
            return { results };
        }
        catch (error) {
            console.error('[🔍 DEEP TRACE] ❌ CRITICAL TOOL ERROR:', error.message);
            return { results: [] };
        }
    }));
//# sourceMappingURL=genkit.js.map