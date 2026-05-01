import type { SourceTrustTier } from '../lib/types';
import { inferVideoTrustTier } from './sourceTrustService';
import type { CreativeDeckRequest, ExternalVideoCandidate } from './creativeStreamTypes';

type YouTubeSearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      description?: string;
      channelTitle?: string;
      publishedAt?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
      defaultLanguage?: string;
      defaultAudioLanguage?: string;
    };
  }>;
};

type YouTubeVideoDetailsResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      channelTitle?: string;
      description?: string;
      publishedAt?: string;
      defaultLanguage?: string;
      defaultAudioLanguage?: string;
      thumbnails?: {
        high?: { url?: string };
        medium?: { url?: string };
        default?: { url?: string };
      };
    };
    contentDetails?: {
      duration?: string;
      caption?: string;
    };
    status?: {
      embeddable?: boolean;
    };
  }>;
};

const YOUTUBE_SEARCH_API = 'https://www.googleapis.com/youtube/v3/search';
const YOUTUBE_VIDEOS_API = 'https://www.googleapis.com/youtube/v3/videos';
const YOUTUBE_TIMEOUT_MS = 9_000;
const ADAPTER_CACHE_TTL_MS = 8 * 60 * 1000;
const ADAPTER_CACHE = new Map<string, { ts: number; candidates: ExternalVideoCandidate[] }>();

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeLang(value: unknown): string | null {
  const raw = safeString(value).trim().toLowerCase();
  if (!raw) return null;
  if (raw.length === 2) return raw;
  const compact = raw.split(/[-_]/)[0];
  return compact || null;
}

function buildLearningNeedSuffix(learningNeed?: string | null): string {
  const normalized = safeString(learningNeed).trim().toLowerCase();
  if (!normalized) return 'educational explainer';
  if (normalized.includes('worked')) return 'worked example education';
  if (normalized.includes('quick') || normalized.includes('recap')) return 'short educational recap';
  if (normalized.includes('intuition') || normalized.includes('visual')) return 'visual intuition explainer';
  return 'educational explanation';
}

function buildSearchQuery(request: CreativeDeckRequest): string {
  const topic = safeString(request.activeTopic || request.topic).trim();
  const subject = safeString(request.subject).trim();
  const weak = (request.weakTopics || []).map((entry) => safeString(entry).trim()).filter(Boolean)[0] || '';
  const seed = topic || weak || safeString(request.query).trim() || subject || 'science concept';
  const suffix = buildLearningNeedSuffix(request.learningNeed);
  return `${seed} ${suffix}`.trim();
}

function parseYouTubeDurationToSeconds(duration: string | null | undefined): number | null {
  const raw = safeString(duration).trim();
  if (!raw) return null;
  const match = raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (!match) return null;
  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);
  const total = hours * 3600 + minutes * 60 + seconds;
  return Number.isFinite(total) && total > 0 ? total : null;
}

function educationalConfidenceFromText(title: string, description: string, channel: string): number {
  const text = `${title} ${description} ${channel}`.toLowerCase();
  let score = 0.48;
  if (/\b(explain|explainer|lesson|tutorial|education|revision|learn|science|math|chemistry|physics|biology)\b/.test(text)) score += 0.24;
  if (/\b(khan academy|ted-ed|crash course|free science lessons|national geographic)\b/.test(text)) score += 0.14;
  if (/\b(reaction|lyrics|music video|official video|prank|compilation)\b/.test(text)) score -= 0.4;
  return clamp(score, 0, 1);
}

function clarityEstimate(title: string, description: string): number {
  const cleanTitle = title.trim();
  const cleanDescription = description.trim();
  let score = 0.5;
  if (cleanTitle.length >= 18 && cleanTitle.length <= 95) score += 0.18;
  if (cleanDescription.length >= 30) score += 0.12;
  if (/\b(step by step|visual|example|concept|why)\b/i.test(`${cleanTitle} ${cleanDescription}`)) score += 0.1;
  return clamp(score, 0.3, 0.98);
}

function transcriptQualityEstimate(captionsAvailable: boolean | null): number {
  if (captionsAvailable === true) return 0.9;
  if (captionsAvailable === false) return 0.42;
  return 0.58;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), YOUTUBE_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function resolveDurationPreference(request: CreativeDeckRequest): 'short' | 'medium' | 'any' {
  const learningNeed = safeString(request.learningNeed).trim().toLowerCase();
  if (learningNeed.includes('quick') || learningNeed.includes('intuition')) return 'short';
  if (learningNeed.includes('worked') || learningNeed.includes('deepen')) return 'medium';
  return 'any';
}

export async function fetchYouTubeCreativeCandidates(request: CreativeDeckRequest): Promise<ExternalVideoCandidate[]> {
  if (request.allowYouTube === false) return [];
  const apiKey = safeString(process.env.YOUTUBE_DATA_API_KEY).trim();
  if (!apiKey) return [];

  const query = buildSearchQuery(request);
  const cacheKey = JSON.stringify({
    source: 'youtube',
    query,
    language: normalizeLang(request.language),
    durationPreference: resolveDurationPreference(request),
    schoolLevel: safeString(request.schoolLevel).trim().toLowerCase(),
    limit: clamp(Number(request.limit || 12), 4, 20),
  });
  const cached = ADAPTER_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < ADAPTER_CACHE_TTL_MS) {
    return cached.candidates;
  }

  const maxResults = clamp(Math.ceil((Number(request.limit || 12) || 12) * 2.2), 8, 25);
  const searchParams = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: query,
    maxResults: String(maxResults),
    safeSearch: 'strict',
    order: 'relevance',
    videoEmbeddable: 'true',
    videoSyndicated: 'true',
    key: apiKey,
  });
  const preferredLang = normalizeLang(request.language);
  if (preferredLang) {
    searchParams.set('relevanceLanguage', preferredLang);
  }
  const durationPreference = resolveDurationPreference(request);
  if (durationPreference !== 'any') {
    searchParams.set('videoDuration', durationPreference);
  }

  const searchResponse = await fetchJson<YouTubeSearchResponse>(`${YOUTUBE_SEARCH_API}?${searchParams.toString()}`);
  const videoIds = (searchResponse?.items || [])
    .map((item) => safeString(item.id?.videoId).trim())
    .filter(Boolean);
  if (videoIds.length === 0) {
    ADAPTER_CACHE.set(cacheKey, { ts: Date.now(), candidates: [] });
    return [];
  }

  const detailsParams = new URLSearchParams({
    part: 'snippet,contentDetails,status',
    id: videoIds.join(','),
    key: apiKey,
  });
  const detailsResponse = await fetchJson<YouTubeVideoDetailsResponse>(`${YOUTUBE_VIDEOS_API}?${detailsParams.toString()}`);
  const detailItems = detailsResponse?.items || [];

  const normalized = detailItems
    .flatMap((item) => {
      const sourceVideoId = safeString(item.id).trim();
      if (!sourceVideoId) return [];
      const title = safeString(item.snippet?.title).trim() || 'Educational video';
      const description = safeString(item.snippet?.description).trim();
      const creatorName = safeString(item.snippet?.channelTitle).trim() || null;
      const thumbnailUrl =
        safeString(item.snippet?.thumbnails?.high?.url).trim() ||
        safeString(item.snippet?.thumbnails?.medium?.url).trim() ||
        safeString(item.snippet?.thumbnails?.default?.url).trim() ||
        `https://i.ytimg.com/vi/${sourceVideoId}/hqdefault.jpg`;
      const durationSeconds = parseYouTubeDurationToSeconds(item.contentDetails?.duration || null);
      const captionsAvailable = item.contentDetails?.caption === 'true' ? true : item.contentDetails?.caption === 'false' ? false : null;
      const embeddable = item.status?.embeddable !== false;
      const trustTier = (inferVideoTrustTier(creatorName) || 'limited') as SourceTrustTier;
      const educationalConfidence = educationalConfidenceFromText(title, description, creatorName || '');
      const clarityScore = clarityEstimate(title, description);
      const candidate: ExternalVideoCandidate = {
        sourceType: 'youtube' as const,
        sourceVideoId,
        title,
        description: description || null,
        thumbnailUrl: thumbnailUrl || null,
        canonicalUrl: `https://www.youtube.com/watch?v=${encodeURIComponent(sourceVideoId)}`,
        embedUrl: `https://www.youtube.com/embed/${encodeURIComponent(sourceVideoId)}`,
        durationSeconds,
        language:
          normalizeLang(item.snippet?.defaultAudioLanguage) ||
          normalizeLang(item.snippet?.defaultLanguage) ||
          preferredLang,
        captionsAvailable,
        embeddable,
        creatorName,
        publishedAt: safeString(item.snippet?.publishedAt).trim() || null,
        trustTier,
        educationalConfidence,
        clarityScore,
        transcriptQualityEstimate: transcriptQualityEstimate(captionsAvailable),
        providerPayload: {
          provider: 'youtube',
        },
      };
      return [candidate];
    })
    .filter((entry) => entry.educationalConfidence >= 0.42);

  ADAPTER_CACHE.set(cacheKey, { ts: Date.now(), candidates: normalized });
  return normalized;
}
