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
exports.generalWebResearchFlow = void 0;
const flow_1 = require("@genkit-ai/flow");
const zod_1 = require("zod");
const cheerio = __importStar(require("cheerio"));
const genkit_1 = require("../genkit");
const handlers_1 = require("../tools/handlers");
const source_trust_1 = require("../../lib/research/source-trust");
const redis_1 = require("../../lib/redis");
const flow_singleton_1 = require("./flow-singleton");
const MAX_SOURCES = 4;
const MAX_FACTS = 6;
const MAX_RESULTS_PER_QUERY = 2;
const MAX_TOTAL_RESULTS = 4;
const FETCH_TIMEOUT_MS = 2200;
const SEARCH_TIMEOUT_MS = 1600;
const SYNTHESIS_TIMEOUT_MS = 1800;
const TOTAL_RESEARCH_BUDGET_MS = 3600;
const RESULT_PROCESS_CONCURRENCY = 3;
const CACHE_TTL_SEARCH_SEC = 120;
const CACHE_TTL_PAGE_SEC = 180;
const CACHE_TTL_FINAL_SEC = 180;
const FINAL_REPLY_CACHE_VERSION = 'v2';
const MIN_FACT_LENGTH = 25;
const MAX_FACT_LENGTH = 260;
const memorySearchCache = new Map();
const memoryPageCache = new Map();
const memoryFinalCache = new Map();
const InputSchema = zod_1.z.object({
    query: zod_1.z.string(),
    forceWebSearch: zod_1.z.boolean().default(false),
    gradeHint: zod_1.z.enum(['Primary', 'LowerSecondary', 'UpperSecondary']).optional(),
});
const OutputSchema = zod_1.z.object({
    reply: zod_1.z.string(),
    sources: zod_1.z
        .array(zod_1.z.object({
        sourceName: zod_1.z.string(),
        url: zod_1.z.string(),
    }))
        .optional(),
    mode: zod_1.z.literal('web_research'),
});
function cleanText(text) {
    return text.replace(/(\r\n|\n|\r)/g, ' ').replace(/\s+/g, ' ').trim();
}
function normalizeTeacherResearchTone(text) {
    return cleanText(text)
        .replace(/\b(the detailed mechanisms? and full extent of [^.?!]* not fully specified here)\b/gi, 'Here is what we can confirm clearly so far')
        .replace(/\b(not fully specified here|not specified here|based on (?:the )?(?:information|details|context) provided(?: here)?)\b/gi, 'based on verified facts');
}
function finalizeResearchReply(text) {
    let output = cleanText(text)
        .replace(/^\s*here are the verified facts[.:!\-]?\s*/i, '')
        .replace(/\s*\*\*(.*?)\*\*\s*/g, '$1 ')
        .replace(/\*/g, '')
        .replace(/\(\s+/g, '(')
        .replace(/\s+\)/g, ')')
        .replace(/\s+([,.;!?])/g, '$1')
        .trim();
    // If an unmatched opening parenthesis remains, drop the dangling tail.
    const openCount = (output.match(/\(/g) || []).length;
    const closeCount = (output.match(/\)/g) || []).length;
    if (openCount > closeCount) {
        const lastOpen = output.lastIndexOf('(');
        if (lastOpen >= 0) {
            output = output.slice(0, lastOpen).trim();
        }
    }
    if (/[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\)\s*$/.test(output) && !/[.!?]\s*[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\)\s*$/.test(output)) {
        output = output.replace(/[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\)\s*$/, '').trim();
    }
    const tailWord = output
        .split(/\s+/)
        .pop()
        ?.toLowerCase()
        .replace(/[^a-z]/g, '') || '';
    const danglingTailWords = new Set([
        'and', 'or', 'to', 'with', 'for', 'from', 'that', 'which', 'because',
        'when', 'while', 'if', 'then', 'this', 'these', 'those', 'lead', 'leads',
        'can', 'could', 'would', 'should', 'is', 'are', 'was', 'were', 'be', 'being'
    ]);
    if (danglingTailWords.has(tailWord)) {
        const lastPunctuation = Math.max(output.lastIndexOf('.'), output.lastIndexOf('!'), output.lastIndexOf('?'));
        if (lastPunctuation > 0) {
            output = output.slice(0, lastPunctuation + 1).trim();
        }
    }
    if (output && !/[.!?]$/.test(output)) {
        output = `${output}.`;
    }
    return output;
}
function nowMs() {
    return Date.now();
}
function makeCacheKey(prefix, value) {
    const normalized = cleanText(value).toLowerCase();
    return `${prefix}:${Buffer.from(normalized).toString('base64url')}`;
}
function getMemoryCached(cache, key) {
    const hit = cache.get(key);
    if (!hit)
        return null;
    if (hit.expiresAt <= nowMs()) {
        cache.delete(key);
        return null;
    }
    return hit.value;
}
function setMemoryCached(cache, key, value, ttlSeconds) {
    cache.set(key, { value, expiresAt: nowMs() + ttlSeconds * 1000 });
    if (cache.size > 800) {
        const firstKey = cache.keys().next().value;
        if (firstKey)
            cache.delete(firstKey);
    }
}
async function getRedisCached(key) {
    if (process.env.NODE_ENV === 'test')
        return null;
    try {
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis)
            return null;
        const raw = await redis.get(key);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
async function setRedisCached(key, value, ttlSeconds) {
    if (process.env.NODE_ENV === 'test')
        return;
    try {
        const redis = await (0, redis_1.getRedisClient)();
        if (!redis)
            return;
        await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
    }
    catch {
        // Cache failure should not break responses.
    }
}
function withTimeout(promise, timeoutMs, fallbackValue) {
    if (timeoutMs <= 0)
        return Promise.resolve(fallbackValue);
    let timeoutId = null;
    const timeoutPromise = new Promise((resolve) => {
        timeoutId = setTimeout(() => resolve(fallbackValue), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => {
        if (timeoutId)
            clearTimeout(timeoutId);
    });
}
async function mapWithConcurrency(items, concurrency, worker) {
    if (items.length === 0)
        return [];
    const results = new Array(items.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
        while (true) {
            const index = cursor++;
            if (index >= items.length)
                return;
            results[index] = await worker(items[index], index);
        }
    });
    await Promise.all(workers);
    return results;
}
function parseJsonObject(raw) {
    const text = raw.trim();
    if (!text)
        return null;
    try {
        return JSON.parse(text);
    }
    catch {
        const first = text.indexOf('{');
        const last = text.lastIndexOf('}');
        if (first === -1 || last === -1 || first >= last)
            return null;
        try {
            return JSON.parse(text.slice(first, last + 1));
        }
        catch {
            return null;
        }
    }
}
function normalizePlanQuery(query) {
    return cleanText(query
        .replace(/^[-*\u2022\d\.\)\s]+/, '')
        .replace(/^["']+|["']+$/g, ''));
}
function parsePlanLines(rawText) {
    return rawText
        .split('\n')
        .map((line) => normalizePlanQuery(line))
        .filter(Boolean);
}
function normalizeClaim(claim) {
    return claim.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}
function isLikelyFact(claim) {
    const trimmed = cleanText(claim);
    if (trimmed.length < MIN_FACT_LENGTH || trimmed.length > MAX_FACT_LENGTH) {
        return false;
    }
    const lower = trimmed.toLowerCase();
    const bannedFragments = [
        'cookie',
        'javascript',
        'subscribe',
        'sign in',
        'access denied',
        'captcha',
        'click here',
        'terms of use',
        'privacy policy',
    ];
    if (bannedFragments.some((fragment) => lower.includes(fragment))) {
        return false;
    }
    return /[a-z]/i.test(trimmed);
}
async function shouldUseWeb(query, force) {
    if (force)
        return true;
    const realtimeSignal = /\b(today|latest|current|recent|news|price|stock|weather|forecast|score|election|president|ceo|update)\b/i;
    const explicitWebSignal = /\b(search|look up|web|online|browse|source|citation|verify)\b/i;
    const factualLookupSignal = /\b(who is|when did|where is|population|gdp|exchange rate|market cap|price of)\b/i;
    if (realtimeSignal.test(query) || explicitWebSignal.test(query)) {
        return true;
    }
    return factualLookupSignal.test(query);
}
async function generateResearchPlan(query) {
    const normalizedQuery = normalizePlanQuery(query);
    const candidates = [];
    const lower = normalizedQuery.toLowerCase();
    const asksLatest = /\b(latest|current|today|recent|update|news)\b/.test(lower);
    const asksBiography = /\b(who is|who was)\b/.test(lower);
    if (asksLatest) {
        candidates.push(`${normalizedQuery} official update`);
        candidates.push(`${normalizedQuery} trusted source`);
    }
    else if (asksBiography) {
        candidates.push(`${normalizedQuery} biography official`);
        candidates.push(`${normalizedQuery} verified profile`);
    }
    else {
        candidates.push(`${normalizedQuery} overview`);
        candidates.push(`${normalizedQuery} trusted source`);
    }
    const output = [];
    const seen = new Set();
    const pushUnique = (value) => {
        const q = normalizePlanQuery(value);
        const key = q.toLowerCase();
        if (!q || seen.has(key))
            return;
        seen.add(key);
        output.push(q);
    };
    pushUnique(normalizedQuery);
    for (const c of candidates) {
        pushUnique(c);
        if (output.length >= 4)
            break;
    }
    return output.slice(0, 3);
}
async function scrape(url, timeoutMs = FETCH_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), Math.max(800, timeoutMs));
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            signal: controller.signal,
        });
        if (!response.ok) {
            return '';
        }
        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml') && !contentType.includes('text/plain')) {
            return '';
        }
        const raw = await response.text();
        const text = contentType.includes('text/plain')
            ? cleanText(raw)
            : (() => {
                const $ = cheerio.load(raw);
                $('script, style, nav, footer, header, aside, iframe, img, video, noscript').remove();
                return cleanText($('body').text());
            })();
        if (text.length < 120) {
            return '';
        }
        const lower = text.toLowerCase();
        if (lower.includes('access denied') ||
            lower.includes('security check') ||
            lower.includes('cloudflare') ||
            lower.includes('verify you are human') ||
            lower.includes('enable javascript')) {
            return '';
        }
        return text.slice(0, 8000);
    }
    catch {
        return '';
    }
    finally {
        clearTimeout(timeoutId);
    }
}
async function extractFacts(rawText, source, url, queryTerms) {
    if (!rawText)
        return [];
    const candidates = rawText
        .split(/(?<=[.!?])\s+|\n+/)
        .map((line) => cleanText(line))
        .filter((line) => isLikelyFact(line))
        .map((line) => {
        const lower = line.toLowerCase();
        let score = 0;
        if (/\b\d{2,4}\b|%|\$\d+|ksh|usd|km|kg|cm\b/i.test(line))
            score += 2;
        if (/\b(is|are|was|were|has|have|includes|reported|states|according|founded|launched)\b/i.test(line))
            score += 2;
        if (queryTerms.some((term) => term.length > 2 && lower.includes(term)))
            score += 3;
        if (line.length >= 50 && line.length <= 180)
            score += 1;
        return { line, score };
    })
        .sort((a, b) => b.score - a.score)
        .slice(0, 6);
    const deduped = [];
    const seen = new Set();
    for (const item of candidates) {
        const key = normalizeClaim(item.line);
        if (!key || seen.has(key))
            continue;
        seen.add(key);
        deduped.push(item.line);
        if (deduped.length >= 3)
            break;
    }
    return deduped.map((claim) => ({ claim, source, url }));
}
function fallbackSynthesis(query, facts) {
    if (facts.length === 0) {
        return 'Let us narrow this to one specific part so I can explain it clearly with trusted sources. Which part should we start with?';
    }
    const top = facts.slice(0, 3).map((fact) => fact.claim);
    return `${top.join(' ')} Which part would you like me to explain next?`;
}
async function synthesizeAnswer(query, facts) {
    if (facts.length === 0) {
        return (0, handlers_1.GUARDIAN_SANITIZE)('Let us narrow this to one specific part so I can explain it clearly with trusted sources. Which part should we start with?');
    }
    const prompt = `
You are STEADFAST, an elite teacher who explains verified facts clearly.

Question:
"${query}"

Verified facts:
${facts.map((fact, index) => `${index + 1}. ${fact.claim}`).join('\n')}

Write a concise answer.
Rules:
- Use the verified facts for specific claims.
- Do not invent dates, numbers, names, or studies.
- If facts are incomplete, say only what is verified and continue teaching from confirmed facts.
- Never use phrases like "not fully specified here", "based on information provided", or "details are not specified".
- 4 to 6 sentences.
- End with one short follow-up question.
- Do not mention sources, searching, or tools.
- Do not start with phrases like "Here are the verified facts."
- Do not use markdown, bullets, section headers, or incomplete bracketed fragments.
- Sound like a confident, supportive teacher.
`;
    try {
        const response = await withTimeout(genkit_1.ai.generate({ model: 'openai/gpt-4o-mini', prompt }), SYNTHESIS_TIMEOUT_MS, { text: fallbackSynthesis(query, facts) });
        return (0, handlers_1.GUARDIAN_SANITIZE)(finalizeResearchReply(normalizeTeacherResearchTone(response.text || fallbackSynthesis(query, facts))));
    }
    catch {
        return (0, handlers_1.GUARDIAN_SANITIZE)(finalizeResearchReply(normalizeTeacherResearchTone(fallbackSynthesis(query, facts))));
    }
}
function getQueryTerms(query) {
    return cleanText(query)
        .toLowerCase()
        .split(/\s+/)
        .filter((token) => token.length > 2)
        .slice(0, 12);
}
async function searchWithCache(query, deadlineAt) {
    const key = makeCacheKey('research:search', query);
    const mem = getMemoryCached(memorySearchCache, key);
    if (mem)
        return mem;
    const redisHit = await getRedisCached(key);
    if (redisHit) {
        setMemoryCached(memorySearchCache, key, redisHit, CACHE_TTL_SEARCH_SEC);
        return redisHit;
    }
    const timeLeft = Math.max(0, deadlineAt - nowMs() - 250);
    if (timeLeft < 500)
        return [];
    const response = await withTimeout((0, genkit_1.serperSearchTool)({ query }), Math.min(SEARCH_TIMEOUT_MS, timeLeft), { results: [] });
    const results = (response?.results || [])
        .filter((item) => item?.link && (0, source_trust_1.isTrustedSource)(item.link))
        .slice(0, MAX_RESULTS_PER_QUERY);
    setMemoryCached(memorySearchCache, key, results, CACHE_TTL_SEARCH_SEC);
    void setRedisCached(key, results, CACHE_TTL_SEARCH_SEC);
    return results;
}
async function getPageTextWithCache(url, snippet, deadlineAt) {
    const key = makeCacheKey('research:page', url);
    const mem = getMemoryCached(memoryPageCache, key);
    if (mem)
        return mem;
    const redisHit = await getRedisCached(key);
    if (redisHit) {
        setMemoryCached(memoryPageCache, key, redisHit, CACHE_TTL_PAGE_SEC);
        return redisHit;
    }
    const timeLeft = Math.max(0, deadlineAt - nowMs() - 200);
    let text = '';
    if (timeLeft >= 700) {
        text = await scrape(url, Math.min(FETCH_TIMEOUT_MS, timeLeft));
    }
    if (!text || text.length < 120) {
        text = cleanText(snippet || '');
    }
    if (text) {
        setMemoryCached(memoryPageCache, key, text, CACHE_TTL_PAGE_SEC);
        void setRedisCached(key, text, CACHE_TTL_PAGE_SEC);
    }
    return text;
}
exports.generalWebResearchFlow = (0, flow_singleton_1.getOrCreateFlow)('generalWebResearchFlow', () => (0, flow_1.defineFlow)({
    name: 'generalWebResearchFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
}, async (input) => {
    const useWeb = await shouldUseWeb(input.query, input.forceWebSearch);
    if (!useWeb) {
        return {
            reply: await (0, handlers_1.GUARDIAN_SANITIZE)('This topic does not need web research. I can explain it directly.'),
            mode: 'web_research',
        };
    }
    const normalizedQuery = normalizePlanQuery(input.query);
    const finalCacheKey = makeCacheKey('research:final', `${normalizedQuery}|${input.gradeHint || 'none'}|${FINAL_REPLY_CACHE_VERSION}`);
    const finalMemHit = getMemoryCached(memoryFinalCache, finalCacheKey);
    if (finalMemHit) {
        return { reply: finalMemHit.reply, sources: finalMemHit.sources, mode: 'web_research' };
    }
    const finalRedisHit = await getRedisCached(finalCacheKey);
    if (finalRedisHit) {
        setMemoryCached(memoryFinalCache, finalCacheKey, finalRedisHit, CACHE_TTL_FINAL_SEC);
        return { reply: finalRedisHit.reply, sources: finalRedisHit.sources, mode: 'web_research' };
    }
    const deadlineAt = nowMs() + TOTAL_RESEARCH_BUDGET_MS;
    const plan = await generateResearchPlan(normalizedQuery);
    const queryTerms = getQueryTerms(normalizedQuery);
    const searchBatches = await Promise.all(plan.map((plannedQuery) => searchWithCache(plannedQuery, deadlineAt)));
    const rankedCandidates = new Map();
    for (const batch of searchBatches) {
        for (const result of batch) {
            const link = String(result.link || '').trim();
            if (!link || !(0, source_trust_1.isTrustedSource)(link))
                continue;
            const title = cleanText(result.title || 'Trusted source');
            const snippet = cleanText(result.snippet || '');
            const lower = `${title} ${snippet}`.toLowerCase();
            let rank = 0;
            if (/\.gov|\.edu|\.org/.test(link))
                rank += 2;
            if (snippet.length > 40)
                rank += 1;
            for (const term of queryTerms) {
                if (lower.includes(term))
                    rank += 2;
            }
            const existing = rankedCandidates.get(link);
            if (!existing || rank > existing.rank) {
                rankedCandidates.set(link, { title, link, snippet, rank });
            }
        }
    }
    const candidates = Array.from(rankedCandidates.values())
        .sort((a, b) => b.rank - a.rank)
        .slice(0, MAX_TOTAL_RESULTS);
    const extracted = await mapWithConcurrency(candidates, RESULT_PROCESS_CONCURRENCY, async (candidate) => {
        if (nowMs() >= deadlineAt)
            return null;
        const text = await getPageTextWithCache(candidate.link, candidate.snippet, deadlineAt);
        if (!text)
            return null;
        const facts = await extractFacts(text, candidate.title, candidate.link, queryTerms);
        if (facts.length === 0)
            return null;
        return {
            source: { sourceName: candidate.title, url: candidate.link },
            facts,
        };
    });
    const collectedFacts = [];
    const sources = [];
    const seenFacts = new Set();
    const seenSources = new Set();
    for (const item of extracted) {
        if (!item)
            continue;
        if (sources.length >= MAX_SOURCES || collectedFacts.length >= MAX_FACTS)
            break;
        let sourceHasFact = false;
        for (const fact of item.facts) {
            const key = normalizeClaim(fact.claim);
            if (!key || seenFacts.has(key))
                continue;
            seenFacts.add(key);
            collectedFacts.push(fact);
            sourceHasFact = true;
            if (collectedFacts.length >= MAX_FACTS)
                break;
        }
        if (sourceHasFact && !seenSources.has(item.source.url)) {
            seenSources.add(item.source.url);
            sources.push(item.source);
        }
    }
    // Fallback when nothing trusted comes back: do not fabricate placeholder citations
    if (collectedFacts.length === 0 || sources.length === 0) {
        const reply = `I could not verify enough reliable external sources for ${normalizedQuery} right now.`;
        return { reply, sources: [], mode: 'web_research' };
    }
    const answer = await synthesizeAnswer(input.query, collectedFacts);
    const payload = { reply: answer, sources: sources.slice(0, MAX_SOURCES) };
    setMemoryCached(memoryFinalCache, finalCacheKey, payload, CACHE_TTL_FINAL_SEC);
    void setRedisCached(finalCacheKey, payload, CACHE_TTL_FINAL_SEC);
    return {
        reply: payload.reply,
        sources: payload.sources,
        mode: 'web_research',
    };
}));
//# sourceMappingURL=general_web_search_flow.js.map