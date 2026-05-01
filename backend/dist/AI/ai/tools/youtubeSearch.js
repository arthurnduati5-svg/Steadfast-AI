"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeSearchTool = youtubeSearchTool;
const flow_1 = require("@genkit-ai/flow");
const youtube_search_flow_1 = require("../flows/youtube-search-flow");
function hasRunnableFlow(flow) {
    return Boolean(flow) && typeof flow === 'object' && 'inputSchema' in flow;
}
async function youtubeSearchTool(input) {
    const query = String(input?.query || '').trim();
    if (!query) {
        return { results: [] };
    }
    try {
        if (!hasRunnableFlow(youtube_search_flow_1.youtubeSearchFlow)) {
            return { results: [] };
        }
        const max = Math.max(1, Math.min(5, input.maxResults || 3));
        const results = await (0, flow_1.runFlow)(youtube_search_flow_1.youtubeSearchFlow, { query });
        return {
            results: results.slice(0, max).map((video) => ({
                id: video.id,
                title: video.title || 'Educational Video',
                channel: video.channel || video.channelTitle,
                url: `https://www.youtube.com/watch?v=${video.id}`,
            })),
        };
    }
    catch {
        return { results: [] };
    }
}
//# sourceMappingURL=youtubeSearch.js.map