
import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import * as youtubeSearch from 'youtube-search-api';

const webSearchFlowInputSchema = z.object({
  query: z.string(),
});

// Define a more robust YouTubeVideo type based on observed API responses
interface YouTubeVideo {
  id: string;
  title: string;
  channel?: { // Make channel optional
    name?: string; // Make channel name optional
  };
}

export const webSearchFlow = defineFlow(
  {
    name: 'webSearchFlow',
    inputSchema: webSearchFlowInputSchema,
    outputSchema: z.object({
      results: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          channel: z.string().optional(), // Make channel optional in output schema
        })
      ),
    }),
  },
  async (input: z.infer<typeof webSearchFlowInputSchema>) => {
    const response = await youtubeSearch.GetListByKeyword(input.query, false, 5, [{type: 'video'}]);

    return {
      results: response.items.map((video: YouTubeVideo) => ({
        id: video.id,
        title: video.title,
        // Safely access channel name, providing undefined if not available
        channel: video.channel?.name, 
      })),
    };
  }
);
