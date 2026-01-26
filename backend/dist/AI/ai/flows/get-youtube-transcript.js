import { defineFlow } from '@genkit-ai/flow';
import { YoutubeTranscript } from 'youtube-transcript';
import { z } from 'zod';
const youtubeTranscriptInputSchema = z.object({ videoId: z.string() });
export const getYoutubeTranscriptFlow = defineFlow({
    name: 'getYoutubeTranscriptFlow',
    inputSchema: youtubeTranscriptInputSchema,
    outputSchema: z.string(),
}, async (input) => {
    try {
        if (!input.videoId) {
            throw new Error("Video ID is missing");
        }
        const transcriptItems = await YoutubeTranscript.fetchTranscript(input.videoId);
        if (!transcriptItems || transcriptItems.length === 0) {
            return 'Could not fetch the transcript for this video (it might not have captions).';
        }
        // Join text with spaces, replacing newlines to create a continuous block of text
        return transcriptItems
            .map((item) => item.text)
            .join(' ')
            .replace(/\n/g, ' ')
            .trim();
    }
    catch (error) {
        console.error('Error fetching YouTube transcript:', error);
        return 'Could not fetch the transcript for this video.';
    }
});
//# sourceMappingURL=get-youtube-transcript.js.map