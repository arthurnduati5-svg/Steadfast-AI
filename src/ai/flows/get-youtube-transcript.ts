
import { defineFlow } from '@genkit-ai/flow';
import { YoutubeTranscript } from 'youtube-transcript';
import { z } from 'zod';

const youtubeTranscriptInputSchema = z.object({ videoId: z.string() });

export const getYoutubeTranscriptFlow = defineFlow(
  {
    name: 'getYoutubeTranscriptFlow',
    inputSchema: youtubeTranscriptInputSchema,
    outputSchema: z.string(),
  },
  async (input: z.infer<typeof youtubeTranscriptInputSchema>) => {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(input.videoId);
      return transcript.map((item) => item.text).join(' ');
    } catch (error) {
      console.error('Error fetching YouTube transcript:', error);
      return 'Could not fetch the transcript for this video.';
    }
  }
);
