import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import * as youtubeSearch from 'youtube-search-api';

// Define the expected raw structure from the youtube-search-api
interface YouTubeSearchAPIResult {
  id: string;
  title: string;
  channel?: {
    name?: string;
  };
  thumbnail: {
    url: string;
    width: number;
    height: number;
  };
}

// Define the clean output schema for our flow
export const YoutubeSearchFlowOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  channel: z.string().optional(),
  channelTitle: z.string().optional(), // Added channelTitle
  thumbnailUrl: z.string().optional(),
  videoId: z.string(), // Added videoId
});

export type YoutubeSearchFlowOutput = z.infer<typeof YoutubeSearchFlowOutputSchema>;

export const youtubeSearchFlow = defineFlow(
  {
    name: 'youtubeSearchFlow',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(YoutubeSearchFlowOutputSchema),
  },
  async (input: { query: string }): Promise<YoutubeSearchFlowOutput[]> => {
    try {
      console.log(`🚀 Performing YouTube search for: "${input.query}"`);
      const response = await youtubeSearch.GetListByKeyword(input.query, false, 5, [{ type: 'video' }]);

      if (!response || !response.items || response.items.length === 0) {
        console.warn('⚠️ No YouTube video results found.');
        return [];
      }

      // Map and clean the results to match our defined output schema
      const cleanedResults: YoutubeSearchFlowOutput[] = response.items.map((video: YouTubeSearchAPIResult) => ({
        id: video.id,
        title: video.title,
        channel: video.channel?.name,
        channelTitle: video.channel?.name, // Mapped channel name to channelTitle
        thumbnailUrl: video.thumbnail?.url,
        videoId: video.id, // Mapped id to videoId
      }));

      console.log(`✅ Found ${cleanedResults.length} YouTube videos.`);
      return cleanedResults;

    } catch (error) {
      console.error('❌ Error in youtubeSearchFlow:', error);
      // Return an empty array on error to ensure the calling function doesn't break
      return [];
    }
  }
);
