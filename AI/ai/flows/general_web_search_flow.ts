import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import * as cheerio from 'cheerio';
import { ai, serperSearchTool } from '../genkit';
import { GUARDIAN_SANITIZE } from '../tools/handlers';
import { isTrustedSource } from '../../lib/research/source-trust';
import { getRedisClient } from '../../lib/redis';
import { getOrCreateFlow } from './flow-singleton';

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

const memorySearchCache = new Map<string, { value: SearchResult[]; expiresAt: number }>();
const memoryPageCache = new Map<string, { value: string; expiresAt: number }>();
const memoryFinalCache = new Map<string, { value: FinalResearchPayload; expiresAt: number }>();

interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
}

type ResearchFlowNotice = {
  code:
    | 'limited_source_support'
    | 'partial_research'
    | 'research_timeout'
    | 'research_confidence_low'
    | 'source_reuse_hit'
    | 'source_reuse_miss';
  message: string;
  severity?: 'info' | 'warning';
};

type ResearchConfidenceState = 'high' | 'medium' | 'low' | 'mixed' | 'insufficient';

type FinalResearchPayload = {
  reply: string;
  sources: { sourceName: string; url: string }[];
  queryUsed: string;
  queryPlan: string[];
  searchCount: number;
  sourceReuseId: string;
  reuseHit: boolean;
  confidenceState: ResearchConfidenceState;
  triggerType:
    | 'mode_explicit'
    | 'explicit_user_request'
    | 'research_action'
    | 'intent_gate'
    | 'followup_reverify'
    | 'followup_reuse';
  latencyMs: number;
  firstUsefulLatencyMs?: number;
  notices: ResearchFlowNotice[];
};

const InputSchema = z.object({
  query: z.string(),
  forceWebSearch: z.boolean().default(false),
  gradeHint: z.enum(['Primary', 'LowerSecondary', 'UpperSecondary']).optional(),
});

const OutputSchema = z.object({
  reply: z.string(),
  sources: z
    .array(
      z.object({
        sourceName: z.string(),
        url: z.string(),
      })
    )
    .optional(),
  queryUsed: z.string().optional(),
  queryPlan: z.array(z.string()).optional(),
  searchCount: z.number().optional(),
  sourceReuseId: z.string().optional(),
  reuseHit: z.boolean().optional(),
  confidenceState: z.enum(['high', 'medium', 'low', 'mixed', 'insufficient']).optional(),
  triggerType: z
    .enum([
      'mode_explicit',
      'explicit_user_request',
      'research_action',
      'intent_gate',
      'followup_reverify',
      'followup_reuse',
    ])
    .optional(),
  latencyMs: z.number().optional(),
  firstUsefulLatencyMs: z.number().optional(),
  notices: z
    .array(
      z.object({
        code: z.string(),
        message: z.string(),
        severity: z.enum(['info', 'warning']).optional(),
      })
    )
    .optional(),
  mode: z.literal('web_research'),
});

interface Fact {
  claim: string;
  source: string;
  url: string;
}

function cleanText(text: string): string {
  return text.replace(/(\r\n|\n|\r)/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeTeacherResearchTone(text: string): string {
  return cleanText(text)
    .replace(
      /\b(the detailed mechanisms? and full extent of [^.?!]* not fully specified here)\b/gi,
      'Here is what we can confirm clearly so far'
    )
    .replace(
      /\b(not fully specified here|not specified here|based on (?:the )?(?:information|details|context) provided(?: here)?)\b/gi,
      'based on verified facts'
    );
}

function finalizeResearchReply(text: string): string {
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

function nowMs(): number {
  return Date.now();
}

function buildSourceReuseId(query: string, gradeHint?: string): string {
  return Buffer.from(`${cleanText(query).toLowerCase()}|${gradeHint || 'none'}`)
    .toString('base64url')
    .slice(0, 48);
}

function makeCacheKey(prefix: string, value: string): string {
  const normalized = cleanText(value).toLowerCase();
  return `${prefix}:${Buffer.from(normalized).toString('base64url')}`;
}

function getMemoryCached<T>(cache: Map<string, { value: T; expiresAt: number }>, key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= nowMs()) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

function setMemoryCached<T>(
  cache: Map<string, { value: T; expiresAt: number }>,
  key: string,
  value: T,
  ttlSeconds: number
): void {
  cache.set(key, { value, expiresAt: nowMs() + ttlSeconds * 1000 });
  if (cache.size > 800) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

async function getRedisCached<T>(key: string): Promise<T | null> {
  if (process.env.NODE_ENV === 'test') return null;
  try {
    const redis = await getRedisClient();
    if (!redis) return null;
    const raw = await redis.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function setRedisCached<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (process.env.NODE_ENV === 'test') return;
  try {
    const redis = await getRedisClient();
    if (!redis) return;
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // Cache failure should not break responses.
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallbackValue: T): Promise<T> {
  if (timeoutMs <= 0) return Promise.resolve(fallbackValue);
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<T>((resolve) => {
    timeoutId = setTimeout(() => resolve(fallbackValue), timeoutMs);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) clearTimeout(timeoutId);
  }) as Promise<T>;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

function parseJsonObject<T>(raw: string): T | null {
  const text = raw.trim();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first === -1 || last === -1 || first >= last) return null;
    try {
      return JSON.parse(text.slice(first, last + 1)) as T;
    } catch {
      return null;
    }
  }
}

function normalizePlanQuery(query: string): string {
  return cleanText(
    query
      .replace(/^[-*\u2022\d\.\)\s]+/, '')
      .replace(/^["']+|["']+$/g, '')
  );
}

function parsePlanLines(rawText: string): string[] {
  return rawText
    .split('\n')
    .map((line) => normalizePlanQuery(line))
    .filter(Boolean);
}

function inferConfidenceState(sourceCount: number, factCount: number): ResearchConfidenceState {
  if (sourceCount >= 3 && factCount >= 5) return 'high';
  if (sourceCount >= 2 && factCount >= 3) return 'medium';
  if (sourceCount >= 1 && factCount >= 2) return 'low';
  if (sourceCount >= 2 && factCount <= 1) return 'mixed';
  return 'insufficient';
}

function normalizeClaim(claim: string): string {
  return claim.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
}

function isLikelyFact(claim: string): boolean {
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

async function shouldUseWeb(query: string, force: boolean): Promise<boolean> {
  if (force) return true;

  const realtimeSignal =
    /\b(today|latest|current|recent|news|price|stock|weather|forecast|score|election|president|ceo|update)\b/i;
  const explicitWebSignal = /\b(search|look up|web|online|browse|source|citation|verify)\b/i;
  const factualLookupSignal = /\b(who is|when did|where is|population|gdp|exchange rate|market cap|price of)\b/i;
  if (realtimeSignal.test(query) || explicitWebSignal.test(query)) {
    return true;
  }
  return factualLookupSignal.test(query);
}

async function generateResearchPlan(query: string): Promise<string[]> {
  const normalizedQuery = normalizePlanQuery(query);
  const candidates: string[] = [];
  const lower = normalizedQuery.toLowerCase();
  const asksLatest = /\b(latest|current|today|recent|update|news)\b/.test(lower);
  const asksBiography = /\b(who is|who was)\b/.test(lower);

  if (asksLatest) {
    candidates.push(`${normalizedQuery} official update`);
    candidates.push(`${normalizedQuery} trusted source`);
  } else if (asksBiography) {
    candidates.push(`${normalizedQuery} biography official`);
    candidates.push(`${normalizedQuery} verified profile`);
  } else {
    candidates.push(`${normalizedQuery} overview`);
    candidates.push(`${normalizedQuery} trusted source`);
  }

  const output: string[] = [];
  const seen = new Set<string>();

  const pushUnique = (value: string) => {
    const q = normalizePlanQuery(value);
    const key = q.toLowerCase();
    if (!q || seen.has(key)) return;
    seen.add(key);
    output.push(q);
  };

  pushUnique(normalizedQuery);
  for (const c of candidates) {
    pushUnique(c);
    if (output.length >= 4) break;
  }

  return output.slice(0, 3);
}

async function scrape(url: string, timeoutMs: number = FETCH_TIMEOUT_MS): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.max(800, timeoutMs));

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
    if (
      lower.includes('access denied') ||
      lower.includes('security check') ||
      lower.includes('cloudflare') ||
      lower.includes('verify you are human') ||
      lower.includes('enable javascript')
    ) {
      return '';
    }

    return text.slice(0, 8000);
  } catch {
    return '';
  } finally {
    clearTimeout(timeoutId);
  }
}

async function extractFacts(rawText: string, source: string, url: string, queryTerms: string[]): Promise<Fact[]> {
  if (!rawText) return [];

  const candidates = rawText
    .split(/(?<=[.!?])\s+|\n+/)
    .map((line) => cleanText(line))
    .filter((line) => isLikelyFact(line))
    .map((line) => {
      const lower = line.toLowerCase();
      let score = 0;
      if (/\b\d{2,4}\b|%|\$\d+|ksh|usd|km|kg|cm\b/i.test(line)) score += 2;
      if (/\b(is|are|was|were|has|have|includes|reported|states|according|founded|launched)\b/i.test(line)) score += 2;
      if (queryTerms.some((term) => term.length > 2 && lower.includes(term))) score += 3;
      if (line.length >= 50 && line.length <= 180) score += 1;
      return { line, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const deduped: string[] = [];
  const seen = new Set<string>();
  for (const item of candidates) {
    const key = normalizeClaim(item.line);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    deduped.push(item.line);
    if (deduped.length >= 3) break;
  }

  return deduped.map((claim) => ({ claim, source, url }));
}

function fallbackSynthesis(query: string, facts: Fact[]): string {
  if (facts.length === 0) {
    return 'Let us narrow this to one specific part so I can explain it clearly with trusted sources. Which part should we start with?';
  }
  const top = facts.slice(0, 3).map((fact) => fact.claim);
  return `${top.join(' ')} Which part would you like me to explain next?`;
}

async function synthesizeAnswer(query: string, facts: Fact[]): Promise<string> {
  if (facts.length === 0) {
    return GUARDIAN_SANITIZE(
      'Let us narrow this to one specific part so I can explain it clearly with trusted sources. Which part should we start with?'
    );
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
    const response = await withTimeout(
      ai.generate({ model: 'openai/gpt-4o-mini', prompt }),
      SYNTHESIS_TIMEOUT_MS,
      { text: fallbackSynthesis(query, facts) } as any
    );
    return GUARDIAN_SANITIZE(
      finalizeResearchReply(normalizeTeacherResearchTone(response.text || fallbackSynthesis(query, facts)))
    );
  } catch {
    return GUARDIAN_SANITIZE(finalizeResearchReply(normalizeTeacherResearchTone(fallbackSynthesis(query, facts))));
  }
}

function getQueryTerms(query: string): string[] {
  return cleanText(query)
    .toLowerCase()
    .split(/\s+/)
    .filter((token) => token.length > 2)
    .slice(0, 12);
}

async function searchWithCache(query: string, deadlineAt: number): Promise<SearchResult[]> {
  const key = makeCacheKey('research:search', query);
  const mem = getMemoryCached(memorySearchCache, key);
  if (mem) return mem;

  const redisHit = await getRedisCached<SearchResult[]>(key);
  if (redisHit) {
    setMemoryCached(memorySearchCache, key, redisHit, CACHE_TTL_SEARCH_SEC);
    return redisHit;
  }

  const timeLeft = Math.max(0, deadlineAt - nowMs() - 250);
  if (timeLeft < 500) return [];

  const response = await withTimeout(
    serperSearchTool({ query }),
    Math.min(SEARCH_TIMEOUT_MS, timeLeft),
    { results: [] } as any
  );

  const results = ((response?.results || []) as SearchResult[])
    .filter((item) => item?.link && isTrustedSource(item.link))
    .slice(0, MAX_RESULTS_PER_QUERY);

  setMemoryCached(memorySearchCache, key, results, CACHE_TTL_SEARCH_SEC);
  void setRedisCached(key, results, CACHE_TTL_SEARCH_SEC);
  return results;
}

async function getPageTextWithCache(url: string, snippet: string | undefined, deadlineAt: number): Promise<string> {
  const key = makeCacheKey('research:page', url);
  const mem = getMemoryCached(memoryPageCache, key);
  if (mem) return mem;

  const redisHit = await getRedisCached<string>(key);
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

export const generalWebResearchFlow = getOrCreateFlow('generalWebResearchFlow', () => defineFlow(
  {
    name: 'generalWebResearchFlow',
    inputSchema: InputSchema,
    outputSchema: OutputSchema,
  },
  async (input) => {
    const startedAt = nowMs();
    const useWeb = await shouldUseWeb(input.query, input.forceWebSearch);
    const normalizedQuery = normalizePlanQuery(input.query);
    const sourceReuseId = buildSourceReuseId(normalizedQuery, input.gradeHint);
    const triggerType: FinalResearchPayload['triggerType'] = input.forceWebSearch
      ? 'mode_explicit'
      : 'intent_gate';
    if (!useWeb) {
      const reply = await GUARDIAN_SANITIZE('This topic does not need web research. I can explain it directly.');
      return {
        reply,
        queryUsed: normalizedQuery,
        queryPlan: [normalizedQuery].filter(Boolean),
        searchCount: 0,
        sourceReuseId,
        reuseHit: false,
        confidenceState: 'insufficient' as const,
        triggerType,
        latencyMs: Math.max(0, nowMs() - startedAt),
        notices: [
          {
            code: 'source_reuse_miss',
            message: 'Web research was not required for this turn.',
            severity: 'info' as const,
          },
        ],
        mode: 'web_research' as const,
      };
    }

    const finalCacheKey = makeCacheKey(
      'research:final',
      `${normalizedQuery}|${input.gradeHint || 'none'}|${FINAL_REPLY_CACHE_VERSION}`
    );

    const finalMemHit = getMemoryCached(memoryFinalCache, finalCacheKey);
    if (finalMemHit) {
      return {
        ...finalMemHit,
        reuseHit: true,
        notices: [
          ...((finalMemHit.notices || []).filter((notice) => notice.code !== 'source_reuse_hit') as ResearchFlowNotice[]),
          {
            code: 'source_reuse_hit',
            message: 'Reused recent source context for faster follow-up.',
            severity: 'info' as const,
          },
        ],
        latencyMs: Math.max(0, nowMs() - startedAt),
        mode: 'web_research' as const,
      };
    }

    const finalRedisHit = await getRedisCached<FinalResearchPayload>(
      finalCacheKey
    );
    if (finalRedisHit) {
      setMemoryCached(memoryFinalCache, finalCacheKey, finalRedisHit, CACHE_TTL_FINAL_SEC);
      return {
        ...finalRedisHit,
        reuseHit: true,
        notices: [
          ...((finalRedisHit.notices || []).filter((notice) => notice.code !== 'source_reuse_hit') as ResearchFlowNotice[]),
          {
            code: 'source_reuse_hit',
            message: 'Reused recent source context for faster follow-up.',
            severity: 'info' as const,
          },
        ],
        latencyMs: Math.max(0, nowMs() - startedAt),
        mode: 'web_research' as const,
      };
    }

    const deadlineAt = nowMs() + TOTAL_RESEARCH_BUDGET_MS;
    const plan = await generateResearchPlan(normalizedQuery);
    const queryTerms = getQueryTerms(normalizedQuery);
    let firstUsefulLatencyMs: number | undefined;

    const searchBatches = await Promise.all(
      plan.map((plannedQuery) => searchWithCache(plannedQuery, deadlineAt))
    );

    if (searchBatches.some((batch) => batch.length > 0)) {
      firstUsefulLatencyMs = Math.max(0, nowMs() - startedAt);
    }

    const rankedCandidates = new Map<string, SearchResult & { rank: number }>();
    for (const batch of searchBatches) {
      for (const result of batch) {
        const link = String(result.link || '').trim();
        if (!link || !isTrustedSource(link)) continue;
        const title = cleanText(result.title || 'Trusted source');
        const snippet = cleanText(result.snippet || '');
        const lower = `${title} ${snippet}`.toLowerCase();

        let rank = 0;
        if (/\.gov|\.edu|\.org/.test(link)) rank += 2;
        if (snippet.length > 40) rank += 1;
        for (const term of queryTerms) {
          if (lower.includes(term)) rank += 2;
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

    const extracted = await mapWithConcurrency(
      candidates,
      RESULT_PROCESS_CONCURRENCY,
      async (candidate) => {
        if (nowMs() >= deadlineAt) return null as null | { source: { sourceName: string; url: string }; facts: Fact[] };

        const text = await getPageTextWithCache(candidate.link, candidate.snippet, deadlineAt);
        if (!text) return null as null | { source: { sourceName: string; url: string }; facts: Fact[] };

        const facts = await extractFacts(text, candidate.title, candidate.link, queryTerms);
        if (facts.length === 0) return null as null | { source: { sourceName: string; url: string }; facts: Fact[] };

        return {
          source: { sourceName: candidate.title, url: candidate.link },
          facts,
        };
      }
    );

    const collectedFacts: Fact[] = [];
    const sources: { sourceName: string; url: string }[] = [];
    const seenFacts = new Set<string>();
    const seenSources = new Set<string>();

    for (const item of extracted) {
      if (!item) continue;
      if (sources.length >= MAX_SOURCES || collectedFacts.length >= MAX_FACTS) break;

      let sourceHasFact = false;
      for (const fact of item.facts) {
        const key = normalizeClaim(fact.claim);
        if (!key || seenFacts.has(key)) continue;
        seenFacts.add(key);
        collectedFacts.push(fact);
        sourceHasFact = true;
        if (collectedFacts.length >= MAX_FACTS) break;
      }

      if (sourceHasFact && !seenSources.has(item.source.url)) {
        seenSources.add(item.source.url);
        sources.push(item.source);
      }
    }

    if (!firstUsefulLatencyMs && (sources.length > 0 || collectedFacts.length > 0)) {
      firstUsefulLatencyMs = Math.max(0, nowMs() - startedAt);
    }

    // Fallback when nothing trusted comes back: do not fabricate placeholder citations
    if (collectedFacts.length === 0 || sources.length === 0) {
      const reply = `I could not verify enough reliable external sources for ${normalizedQuery} right now.`;
      return {
        reply,
        sources: [],
        queryUsed: normalizedQuery,
        queryPlan: plan,
        searchCount: plan.length,
        sourceReuseId,
        reuseHit: false,
        confidenceState: 'insufficient' as const,
        triggerType,
        latencyMs: Math.max(0, nowMs() - startedAt),
        firstUsefulLatencyMs,
        notices: [
          {
            code: 'limited_source_support',
            message: 'Reliable external sources were limited for this query.',
            severity: 'warning' as const,
          },
          {
            code: 'research_confidence_low',
            message: 'Confidence is low because source coverage was insufficient.',
            severity: 'warning' as const,
          },
        ],
        mode: 'web_research' as const,
      };
    }

    const answer = await synthesizeAnswer(input.query, collectedFacts);
    const confidenceState = inferConfidenceState(sources.length, collectedFacts.length);
    const timedOut = nowMs() >= deadlineAt;
    const payload: FinalResearchPayload = {
      reply: answer,
      sources: sources.slice(0, MAX_SOURCES),
      queryUsed: normalizedQuery,
      queryPlan: plan,
      searchCount: plan.length,
      sourceReuseId,
      reuseHit: false,
      confidenceState,
      triggerType,
      latencyMs: Math.max(0, nowMs() - startedAt),
      firstUsefulLatencyMs,
      notices: [
        ...(confidenceState === 'low' || confidenceState === 'insufficient'
          ? [
              {
                code: 'research_confidence_low' as const,
                message: 'Confidence is limited; consider asking for another trusted source.',
                severity: 'warning' as const,
              },
            ]
          : []),
        ...(timedOut
          ? [
              {
                code: 'research_timeout' as const,
                message: 'Research stopped early to keep the response fast.',
                severity: 'info' as const,
              },
            ]
          : []),
      ],
    };

    setMemoryCached(memoryFinalCache, finalCacheKey, payload, CACHE_TTL_FINAL_SEC);
    void setRedisCached(finalCacheKey, payload, CACHE_TTL_FINAL_SEC);

    return {
      ...payload,
      mode: 'web_research' as const,
    };
  }
));
