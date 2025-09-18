
// src/ai/genkit.ts
import { genkit, z } from 'genkit';
import { openAI } from 'genkitx-openai';
import axios from 'axios';

// Create the Genkit ai instance
export const ai = genkit({
  plugins: [
    openAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  ],
});

// --- Define SerpAPI Tool ---
export const serpApiSearchTool = ai.defineTool(
  {
    name: 'serpApiSearch',
    description: 'Performs a web search using the SerpAPI to find up-to-date information online.',
    inputSchema: z.object({
      query: z.string().describe('The search query for SerpAPI.'),
    }),
    outputSchema: z.object({
      results: z.array(
        z.object({
          title: z.string(),
          link: z.string(),
          snippet: z.string(),
        })
      ),
    }),
  },
  async (input) => {
    // console.log(`🔍 Executing SerpAPI search with query: ${input.query}`); // Removed or commented out

    try {
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          q: input.query,
          api_key: process.env.SERPAPI_API_KEY,
        },
      });

      // Map SerpAPI response into expected output format
      const results =
        response.data.organic_results?.map((item: any) => ({
          title: item.title || 'No title',
          link: item.link || '',
          snippet: item.snippet || '',
        })) || [];

      return { results };
    } catch (error: any) {
      console.error('❌ SerpAPI call failed:', error.response?.data || error.message);

      // Graceful fallback with dummy data
      return {
        results: [
          {
            title: `Fallback result for "${input.query}"`,
            link: `https://example.com/search?q=${encodeURIComponent(input.query)}`,
            snippet: `This is a fallback search result for your query: ${input.query}.`,
          },
        ],
      };
    }
  }
);

// --- Export ai instance and tool ---
// Other modules can now import { ai, serpApiSearchTool } from './genkit'
export { serpApiSearchTool as serperSearchTool };
