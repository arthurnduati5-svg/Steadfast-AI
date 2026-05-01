"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateChatTitle = generateChatTitle;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
const FORBIDDEN_TITLES = new Set([
    'new chat',
    'untitled',
    'general discussion',
    'conversation',
    'chat session',
    'session',
    'understood',
    'okay',
    'ok',
    'yes',
    'sure',
]);
const EN_STOPWORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'so', 'of', 'to', 'for', 'in', 'on', 'at', 'by', 'with',
    'from', 'into', 'about', 'over', 'under', 'after', 'before', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'it', 'this', 'that', 'these', 'those', 'as', 'can', 'could', 'should', 'would', 'will', 'may', 'might', 'do',
    'does', 'did', 'done', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'they', 'their', 'he', 'she', 'his', 'her',
    'who', 'what', 'when', 'where', 'why', 'how', 'please', 'help', 'explain', 'tell', 'learn', 'understand'
]);
function normalizeWhitespace(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
}
function cleanCandidate(raw) {
    const line = String(raw || '')
        .replace(/^[\s"']+|[\s"']+$/g, '')
        .replace(/^title\s*:\s*/i, '')
        .split('\n')[0];
    return normalizeWhitespace(line
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
        .replace(/[|]/g, ' ')
        .replace(/[.!?]+$/g, ''));
}
function extractKeywordTitle(text, maxWords = 5) {
    const cleaned = normalizeWhitespace(String(text || '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/`[^`]*`/g, ' ')
        .replace(/\[[^\]]+\]\([^)]+\)/g, ' ')
        .replace(/[^A-Za-z0-9\u0600-\u06FF\s-]/g, ' '));
    const words = cleaned.split(/\s+/).filter(Boolean);
    const keywordWords = words.filter((word) => {
        const lower = word.toLowerCase();
        if (lower.length < 3)
            return false;
        if (EN_STOPWORDS.has(lower))
            return false;
        return true;
    });
    const selected = (keywordWords.length > 0 ? keywordWords : words).slice(0, maxWords);
    if (selected.length === 0)
        return '';
    const joined = selected.join(' ');
    return joined.charAt(0).toUpperCase() + joined.slice(1);
}
function fallbackTitleFromSource(sourceText) {
    const candidate = extractKeywordTitle(sourceText) || 'Learning Topic';
    return FORBIDDEN_TITLES.has(candidate.toLowerCase()) ? 'Learning Topic' : candidate;
}
function sanitizeTitle(candidate, sourceText) {
    let title = cleanCandidate(candidate);
    const lower = title.toLowerCase();
    if (!title)
        return fallbackTitleFromSource(sourceText);
    if (FORBIDDEN_TITLES.has(lower))
        return fallbackTitleFromSource(sourceText);
    if (title.split(/\s+/).length > 7 || /,/.test(title)) {
        title = title.split(',')[0].trim();
    }
    if (/^(it|this|that|there|here)\b/i.test(title)) {
        const rebuilt = fallbackTitleFromSource(sourceText);
        if (rebuilt)
            title = rebuilt;
    }
    title = title.replace(/\b(and|or|but|because|which|that|to|for|with|it)\b$/i, '').trim();
    if (!title || title.length < 3)
        return fallbackTitleFromSource(sourceText);
    if (title.split(/\s+/).length > 6)
        title = extractKeywordTitle(title, 6) || fallbackTitleFromSource(sourceText);
    if (FORBIDDEN_TITLES.has(title.toLowerCase()))
        return fallbackTitleFromSource(sourceText);
    return title;
}
async function generateChatTitle(history, currentMessage) {
    const relevantHistory = history.slice(-3);
    const conversationSnippet = [
        ...relevantHistory,
        { role: 'user', content: currentMessage }
    ].map(m => `${m.role.toUpperCase()}: ${m.content}`).join('\n');
    const systemPrompt = `
  TASK: Generate one clear chat title that reflects the student's main topic.
  OUTPUT FORMAT: Return ONLY the title text.
  RULES:
  - 2 to 5 words.
  - Use a noun phrase, not a sentence.
  - No quotes, no punctuation-heavy output.
  - Must be specific to the topic.
  - Never return generic words like "Understood", "Okay", "Conversation", or "New Chat".
  `;
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `CONVERSATION LOG:\n${conversationSnippet}` }
            ],
            temperature: 0.2,
            max_tokens: 16,
        });
        const rawTitle = completion.choices[0].message.content || '';
        return sanitizeTitle(rawTitle, currentMessage);
    }
    catch (error) {
        console.error(`[TITLE GEN] Error:`, error);
        return sanitizeTitle('', currentMessage);
    }
}
//# sourceMappingURL=title-generator.js.map