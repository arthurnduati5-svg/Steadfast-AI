import type { CreativeDeckRequest, ExternalVideoCandidate } from './creativeStreamTypes';
import { fetchVimeoCreativeCandidates } from './vimeoCreativeSourceAdapter';
import { fetchYouTubeCreativeCandidates } from './youtubeCreativeSourceAdapter';

type CandidateServiceResult = {
  candidates: ExternalVideoCandidate[];
  notices: string[];
  sourceHealth: {
    youtubeFetched: boolean;
    vimeoFetched: boolean;
    usedCache: boolean;
  };
};

const SERVICE_CACHE_TTL_MS = 6 * 60 * 1000;
const SERVICE_CACHE = new Map<string, { ts: number; candidates: ExternalVideoCandidate[] }>();

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function buildCacheKey(request: CreativeDeckRequest): string {
  return JSON.stringify({
    query: safeString(request.query).trim().toLowerCase(),
    topic: safeString(request.topic).trim().toLowerCase(),
    activeTopic: safeString(request.activeTopic).trim().toLowerCase(),
    subject: safeString(request.subject).trim().toLowerCase(),
    weak: (request.weakTopics || []).map((entry) => safeString(entry).trim().toLowerCase()).slice(0, 4),
    language: safeString(request.language).trim().toLowerCase(),
    schoolLevel: safeString(request.schoolLevel).trim().toLowerCase(),
    learningNeed: safeString(request.learningNeed).trim().toLowerCase(),
    allowYouTube: request.allowYouTube !== false,
    allowVimeo: request.allowVimeo !== false,
    limit: Number(request.limit || 12),
  });
}

function dedupeCandidates(candidates: ExternalVideoCandidate[]): ExternalVideoCandidate[] {
  const byStableId = new Map<string, ExternalVideoCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.sourceType}:${candidate.sourceVideoId}`;
    const existing = byStableId.get(key);
    if (!existing) {
      byStableId.set(key, candidate);
      continue;
    }
    const existingScore =
      existing.educationalConfidence + existing.clarityScore + (existing.captionsAvailable ? 0.25 : 0);
    const nextScore =
      candidate.educationalConfidence + candidate.clarityScore + (candidate.captionsAvailable ? 0.25 : 0);
    if (nextScore > existingScore) {
      byStableId.set(key, candidate);
    }
  }
  return [...byStableId.values()];
}

export async function fetchExternalCreativeVideoCandidates(
  request: CreativeDeckRequest
): Promise<CandidateServiceResult> {
  const cacheKey = buildCacheKey(request);
  const cached = SERVICE_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < SERVICE_CACHE_TTL_MS) {
    return {
      candidates: cached.candidates,
      notices: [],
      sourceHealth: {
        youtubeFetched: false,
        vimeoFetched: false,
        usedCache: true,
      },
    };
  }

  const tasks: Array<Promise<ExternalVideoCandidate[]>> = [];
  const notices: string[] = [];
  const sourceHealth = {
    youtubeFetched: false,
    vimeoFetched: false,
    usedCache: false,
  };

  if (request.allowYouTube !== false) {
    tasks.push(
      fetchYouTubeCreativeCandidates(request).then((result) => {
        sourceHealth.youtubeFetched = true;
        return result;
      })
    );
  }
  if (request.allowVimeo !== false) {
    tasks.push(
      fetchVimeoCreativeCandidates(request).then((result) => {
        sourceHealth.vimeoFetched = true;
        return result;
      })
    );
  }

  const results = await Promise.all(tasks);
  const merged = dedupeCandidates(results.flat());
  if (merged.length === 0) {
    notices.push('No strong external candidates were returned for this query window.');
  }
  if (sourceHealth.youtubeFetched && !sourceHealth.vimeoFetched && request.allowVimeo !== false) {
    notices.push('Vimeo source was unavailable; the deck used YouTube only.');
  }
  if (!sourceHealth.youtubeFetched && sourceHealth.vimeoFetched) {
    notices.push('YouTube source was unavailable; the deck used Vimeo only.');
  }

  SERVICE_CACHE.set(cacheKey, { ts: Date.now(), candidates: merged });
  return {
    candidates: merged,
    notices,
    sourceHealth,
  };
}
