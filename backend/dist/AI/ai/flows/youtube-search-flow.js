import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import * as youtubeSearch from 'youtube-search-api';
export const YoutubeSearchFlowOutputSchema = z.object({
    id: z.string(),
    title: z.string(),
    channel: z.string().optional(),
    channelTitle: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    videoId: z.string(),
});
// 🛑 STRICT EDUCATIONAL FILTER
const BANNED_KEYWORDS = [
    "official video", "lyrics", "music video", "song", "mp3",
    "remix", "cover", "vevo", "karaoke", "concert", "live performance",
    "album", "single", "ft.", "feat."
];
function isEducational(video) {
    const text = (video.title + " " + (video.channel?.name || "")).toLowerCase();
    return !BANNED_KEYWORDS.some(keyword => text.includes(keyword));
}
export const youtubeSearchFlow = defineFlow({
    name: 'youtubeSearchFlow',
    inputSchema: z.object({ query: z.string() }),
    outputSchema: z.array(YoutubeSearchFlowOutputSchema),
}, async (input) => {
    try {
        console.log(`[🔍 DEEP TRACE] 🚀 YouTube search: "${input.query}"`);
        // Request 10 videos so we have enough buffer after filtering
        const response = await youtubeSearch.GetListByKeyword(input.query, false, 10, [{ type: 'video' }]);
        if (!response || !response.items || response.items.length === 0) {
            return [];
        }
        // Filter and Map
        const cleanedResults = response.items
            .filter(isEducational) // ✅ APPLY HARD FILTER
            .map((video) => {
            let safeChannel = video.channel?.name || '';
            if (safeChannel === 'Unknown Channel' || safeChannel === 'undefined')
                safeChannel = '';
            return {
                id: video.id,
                title: video.title || 'Educational Video',
                channel: safeChannel,
                channelTitle: safeChannel,
                thumbnailUrl: video.thumbnail?.url || `https://img.youtube.com/vi/${video.id}/0.jpg`, // Fallback
                videoId: video.id,
            };
        })
            .slice(0, 3); // Return top 3 filtered results
        console.log(`[🔍 DEEP TRACE] ✅ Found ${cleanedResults.length} Educational videos.`);
        return cleanedResults;
    }
    catch (error) {
        console.error('[🔍 DEEP TRACE] ❌ Error in youtubeSearchFlow:', error);
        return [];
    }
});
//# sourceMappingURL=youtube-search-flow.js.map