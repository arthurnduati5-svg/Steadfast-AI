"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYoutubeTranscriptFlow = void 0;
const flow_1 = require("@genkit-ai/flow");
const youtube_transcript_1 = require("youtube-transcript");
const zod_1 = require("zod");
const flow_singleton_1 = require("./flow-singleton");
const youtubeTranscriptInputSchema = zod_1.z.object({ videoId: zod_1.z.string() });
exports.getYoutubeTranscriptFlow = (0, flow_singleton_1.getOrCreateFlow)('getYoutubeTranscriptFlow', () => (0, flow_1.defineFlow)({
    name: 'getYoutubeTranscriptFlow',
    inputSchema: youtubeTranscriptInputSchema,
    outputSchema: zod_1.z.string(),
}, async (input) => {
    try {
        if (!input.videoId) {
            throw new Error("Video ID is missing");
        }
        const transcriptItems = await youtube_transcript_1.YoutubeTranscript.fetchTranscript(input.videoId);
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
}));
//# sourceMappingURL=get-youtube-transcript.js.map