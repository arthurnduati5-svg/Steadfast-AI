import { runFlow } from '@genkit-ai/flow';
import { ai } from '../genkit';
import { setMode } from '../../lib/research/research-state';
import { detectResearchIntent } from './intent-detector';
import { generalWebResearchFlow } from './general_web_search_flow';
import { webSearchFlow } from './web_search_flow';
import { youtubeSearchFlow } from './youtube-search-flow';
const FORBIDDEN_TOPICS = [
    "sex", "dating", "romance", "violence", "kill", "suicide", "harm",
    "drug", "alcohol", "politics", "vote", "gambling", "betting",
    "hack", "cybercrime", "cheat", "porn", "nude", "terror", "boyfriend", "girlfriend",
    "bhang", "weed", "smoke", "doggy", "yacht", "yatch",
    "music video", "lyrics", "official video", "song", "mp3", "playlist"
];
function isSafeQuery(query) {
    const lower = query.toLowerCase();
    return !FORBIDDEN_TOPICS.some(topic => lower.includes(topic));
}
// ✅ UPGRADED: STRICT CONTEXT REWRITER
async function generateVideoQuery(userQuery, topic) {
    // If no topic exists, we must use the user's query, but strip noise
    if (!topic)
        return userQuery;
    // HEURISTIC: If query contains vague reference words, FORCE topic use.
    const lower = userQuery.toLowerCase();
    const vagueWords = ["better", "another", "more", "different", "best", "good", "suggest", "show", "video", "youtube", "this", "that", "it", "same topic"];
    // If the query is dominated by vague words, REVERT TO TOPIC
    const isVague = vagueWords.some(w => lower.includes(w));
    if (isVague) {
        // AI Rewriter for nuance (e.g. "focus on heart")
        const prompt = `
        Active Topic: "${topic}"
        User Request: "${userQuery}"
        
        TASK: Create a clean YouTube search query.
        
        RULES:
        1. IGNORE adjectives like "better", "best", "good", "another".
        2. REPLACE "this", "that", "it" with "${topic}".
        3. IF user adds a specific detail (e.g. "focus on lungs"), append it.
        4. IF user just wants "another video", output ONLY "${topic} educational".
        5. OUTPUT ONLY THE STRING.
        `;
        const res = await ai.generate({ model: 'openai/gpt-4o-mini', prompt });
        return res.text.trim().replace(/"/g, '');
    }
    return userQuery;
}
export async function runResearchOrchestrator(input) {
    setMode('research');
    console.log(`[🔍 DEEP TRACE] Orchestrator Input: "${input.query}" | Context: "${input.lastSearchTopic}"`);
    const history = input.chatHistory || [];
    // 🛡️ STEP 1: SAFETY CHECK
    if (!isSafeQuery(input.query)) {
        console.log(`[🔍 DEEP TRACE] 🛑 BLOCKED Forbidden Topic.`);
        return await runFlow(webSearchFlow, {
            query: input.query,
            chatHistory: history,
            lastSearchTopic: input.lastSearchTopic,
            awaitingPracticeQuestion: false,
            awaitingPracticeAnswer: false,
            attempts: 0,
        });
    }
    // 🧠 STEP 2: DETECT INTENT
    const intent = await detectResearchIntent(input.query, input.lastSearchTopic);
    console.log(`[🔍 DEEP TRACE] Intent: ${intent}`);
    // 🎬 STEP 3: VIDEO LOOKUP (WITH INTELLIGENT REWRITING)
    if (intent === 'video_lookup') {
        // ✅ FORCE REWRITING. Never pass raw query directly if context exists.
        const effectiveQuery = await generateVideoQuery(input.query, input.lastSearchTopic);
        console.log(`[🔍 DEEP TRACE] 🔄 Video Query Rewritten: "${input.query}" -> "${effectiveQuery}"`);
        const videos = await runFlow(youtubeSearchFlow, { query: effectiveQuery });
        // Filter bad results (Music, Lyrics, etc)
        const filteredVideos = videos.filter(v => {
            const t = v.title.toLowerCase();
            return !t.includes("official video") &&
                !t.includes("lyrics") &&
                !t.includes("music") &&
                !t.includes("reaction") &&
                !t.includes("song");
        });
        const video = filteredVideos.length > 0 ? filteredVideos[0] : null;
        const safeChannel = (video?.channel || video?.channelTitle || '').replace('Unknown Channel', '');
        return {
            mode: 'teaching',
            response: video
                ? `I found a relevant video on **${effectiveQuery}**. Watch below!`
                : `I searched for videos on "${effectiveQuery}" but couldn't find a perfect educational match right now.`,
            videoData: video ? { id: video.id, title: video.title, channel: safeChannel, thumbnail: video.thumbnailUrl } : undefined
        };
    }
    // 🟢 STEP 4: CHAT / TEACHING
    if (intent === 'dialogue_continuation' || intent === 'greeting' || intent === 'clarification' || intent === 'definition' || intent === 'concept_explanation') {
        return await runFlow(webSearchFlow, {
            query: input.query,
            chatHistory: history,
            lastSearchTopic: input.lastSearchTopic,
            awaitingPracticeQuestion: false,
            awaitingPracticeAnswer: false,
            attempts: 0,
        });
    }
    // 🔵 STEP 5: DEEP RESEARCH
    if (intent === 'fact_lookup' || intent === 'deep_research' || input.forceWebSearch) {
        return await runFlow(generalWebResearchFlow, {
            query: input.query,
            forceWebSearch: true,
        });
    }
    // 🔴 STEP 6: FALLBACK
    return await runFlow(webSearchFlow, {
        query: input.query,
        chatHistory: history,
        lastSearchTopic: input.lastSearchTopic,
        awaitingPracticeQuestion: false,
        awaitingPracticeAnswer: false,
        attempts: 0,
    });
}
//# sourceMappingURL=research-orchestrator.js.map