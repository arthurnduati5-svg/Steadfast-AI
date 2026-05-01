"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.youtubeSearchFlow = exports.YoutubeSearchFlowOutputSchema = void 0;
const flow_1 = require("@genkit-ai/flow");
const zod_1 = require("zod");
const youtubeSearch = __importStar(require("youtube-search-api"));
const flow_singleton_1 = require("./flow-singleton");
exports.YoutubeSearchFlowOutputSchema = zod_1.z.object({
    id: zod_1.z.string(),
    title: zod_1.z.string(),
    channel: zod_1.z.string().optional(),
    channelTitle: zod_1.z.string().optional(),
    thumbnailUrl: zod_1.z.string().optional(),
    videoId: zod_1.z.string(),
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
exports.youtubeSearchFlow = (0, flow_singleton_1.getOrCreateFlow)('youtubeSearchFlow', () => (0, flow_1.defineFlow)({
    name: 'youtubeSearchFlow',
    inputSchema: zod_1.z.object({ query: zod_1.z.string() }),
    outputSchema: zod_1.z.array(exports.YoutubeSearchFlowOutputSchema),
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
}));
//# sourceMappingURL=youtube-search-flow.js.map