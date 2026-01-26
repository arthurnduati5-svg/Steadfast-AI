// Real implementation should fetch transcripts server-side and sanitize them.
export async function getYoutubeTranscriptTool(input) {
    if (!input || typeof input.videoId !== 'string' || input.videoId.length < 4) {
        return { error: 'Invalid videoId' };
    }
    // Stub behavior: return a short sample transcript or an error if id unknown
    if (input.videoId === 'vid123') {
        return { transcript: 'This is a short sample transcript for the educational video.' };
    }
    return { error: 'Transcript not available' };
}
//# sourceMappingURL=getYoutubeTranscript.js.map