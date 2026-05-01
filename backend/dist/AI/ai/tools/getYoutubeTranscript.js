"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYoutubeTranscriptTool = getYoutubeTranscriptTool;
const flow_1 = require("@genkit-ai/flow");
const get_youtube_transcript_1 = require("../flows/get-youtube-transcript");
async function getYoutubeTranscriptTool(input) {
    const videoId = String(input?.videoId || '').trim();
    if (!videoId || videoId.length < 4) {
        return { error: 'Invalid videoId' };
    }
    try {
        const transcript = await (0, flow_1.runFlow)(get_youtube_transcript_1.getYoutubeTranscriptFlow, { videoId });
        if (!transcript || transcript.startsWith('Could not')) {
            return { error: 'Transcript not available' };
        }
        return { transcript };
    }
    catch {
        return { error: 'Transcript not available' };
    }
}
//# sourceMappingURL=getYoutubeTranscript.js.map