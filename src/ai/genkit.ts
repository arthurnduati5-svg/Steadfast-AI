import { genkit, z } from 'genkit'; // Correct Genkit and z import
import { googleAI } from '@genkit-ai/googleai'; // Keep this if other flows use it
import OpenAI from 'openai'; // Correct import for OpenAI SDK
import axios from 'axios';
import { ChatCompletionMessageParam, ChatCompletionTool, ChatCompletionToolChoiceOption } from 'openai/resources/chat/completions';

const openaiClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Configure Genkit first to get the 'ai' object
export const ai = genkit({
  plugins: [googleAI()], // Keep googleAI plugin if it's used elsewhere
});

// Define your Google Custom Search tool using 'ai.defineTool'
export const googleCustomSearchTool = ai.defineTool(
  {
    name: 'googleCustomSearch',
    description: 'Performs a Google Custom Search to find up-to-date information online.',
    inputSchema: z.object({
      query: z.string().describe('The search query for Google.'),
    }),
    outputSchema: z.object({
      results: z.array(z.object({
        title: z.string(),
        link: z.string(),
        snippet: z.string(),
      })),
    }),
  },
  async (input: {query: string}) => {
    const { query } = input;

    const apiKey = process.env.GOOGLE_CSE_API_KEY;
    const cxId = process.env.GOOGLE_CSE_CX_ID;

    if (!apiKey || !cxId) {
      console.error('Google Custom Search API Key or CX ID is not set. Please configure them.');
      throw new Error('Google Custom Search API not configured.');
    }

    const GOOGLE_CSE_API_URL = 'https://www.googleapis.com/customsearch/v1';

    try {
      console.log(`Performing Google Custom Search for: "${query}"`);
      const response = await axios.get(GOOGLE_CSE_API_URL, {
        params: {
          key: apiKey,
          cx: cxId,
          q: query,
          num: 5,
        },
      });

      const items = response.data.items || [];
      const searchResults = items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));

      console.log(`Google Custom Search found ${searchResults.length} results.`);
      return { results: searchResults };

    } catch (error: any) {
      console.error('Google Custom Search failed:', error.response?.data || error.message);
      return { results: [] };
    }
  }
);

// Define a custom Genkit model that wraps the OpenAI client using 'ai.defineModel'
export const openAICustomModel = ai.defineModel(
  {
    name: 'openai/gpt-3.5-turbo',
    // Add apiVersion explicitly as required by Genkit 1.x for some model definitions
    apiVersion: 'v2',
  },
  async (request) => {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: request.messages as ChatCompletionMessageParam[],
      tools: request.tools as ChatCompletionTool[] | undefined,
      tool_choice: request.toolChoice as ChatCompletionToolChoiceOption | undefined,
    });

    const message = response.choices[0].message;
    
    let finishReason: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'function_call' | undefined = response.choices[0].finish_reason;
    if (finishReason === 'function_call') {
      finishReason = 'tool_calls'; // Map OpenAI's 'function_call' to Genkit's 'tool_calls'
    }

    // Construct the Genkit.GenerateResponse object
    return {
      candidates: [{
        message: {
          content: [{text: message.content || ''}],
          role: (message.role || 'model') as 'model' | 'user' | 'tool' | 'system',
          toolCalls: message.tool_calls as any || [],
        },
        finishReason: finishReason as any || 'stop',
        index: response.choices[0].index || 0,
      }],
    };
  }
);
