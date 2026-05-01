import { genkit, z } from 'genkit';
import { openAI } from 'genkitx-openai';

type GenkitGlobals = {
  __steadfastGenkitAi?: ReturnType<typeof genkit>;
  __steadfastSerperSearchTool?: unknown;
};

const globalGenkit = globalThis as typeof globalThis & GenkitGlobals;

export const ai =
  globalGenkit.__steadfastGenkitAi ||
  (globalGenkit.__steadfastGenkitAi = genkit({
    plugins: [
      openAI({
        apiKey: process.env.OPENAI_API_KEY,
      }),
    ],
  }));

export const serperSearchTool =
  (globalGenkit.__steadfastSerperSearchTool as ReturnType<typeof ai.defineTool> | undefined) ||
  (globalGenkit.__steadfastSerperSearchTool = ai.defineTool(
  {
    name: 'serperSearch',
    description: 'Performs a google search using Serper.dev.',
    inputSchema: z.object({
      query: z.string().describe('The search query.'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          title: z.string(),
          link: z.string(),
          snippet: z.string().optional(),
        })
      ).optional(),
    }),
  },
  async (input) => {
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
      const results = data.organic?.map((item: any) => ({
        title: item.title || 'No title',
        link: item.link || '',
        snippet: item.snippet || '',
      })) || [];

      console.log(`[🔍 DEEP TRACE] ✅ API Success. Received ${results.length} results.`);
      return { results };

    } catch (error: any) {
      console.error('[🔍 DEEP TRACE] ❌ CRITICAL TOOL ERROR:', error.message);
      return { results: [] };
    }
  }
));
