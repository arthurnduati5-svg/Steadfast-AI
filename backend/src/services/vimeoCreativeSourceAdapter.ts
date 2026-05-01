import type { SourceTrustTier } from '../lib/types';
import type { CreativeDeckRequest, ExternalVideoCandidate } from './creativeStreamTypes';

type VimeoSearchResponse = {
  data?: Array<{
    uri?: string;
    name?: string;
    description?: string;
    duration?: number;
    link?: string;
    language?: string;
    created_time?: string;
    release_time?: string;
    embed?: {
      html?: string;
    };
    privacy?: {
      embed?: string;
    };
    user?: {
      name?: string;
    };
    pictures?: {
      sizes?: Array<{
        link?: string;
        width?: number;
      }>;
    };
  }>;
};

const VIMEO_SEARCH_API = 'https://api.vimeo.com/videos';
const VIMEO_TIMEOUT_MS = 9_000;
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

function buildSearchQuery(request: CreativeDeckRequest): string {
  const topic = safeString(request.activeTopic || request.topic).trim();
  const weak = (request.weakTopics || []).map((entry) => safeString(entry).trim()).filter(Boolean)[0] || '';
  const subject = safeString(request.subject).trim();
  const seed = topic || weak || safeString(request.query).trim() || subject || 'science';
  return `${seed} educational explainer`.trim();
}

function inferTrustTier(creatorName: string): SourceTrustTier {
  const channel = creatorName.toLowerCase();
  if (!channel) return 'limited';
  if (/\b(khan|ted|national geographic|crash course)\b/.test(channel)) return 'high';
  if (/\b(academy|education|school|learning|science|math|chemistry|physics|biology)\b/.test(channel)) return 'medium';
  return 'limited';
}

function educationalConfidenceFromText(title: string, description: string, creatorName: string): number {
  const text = `${title} ${description} ${creatorName}`.toLowerCase();
  let score = 0.44;
  if (/\b(explain|explainer|lesson|tutorial|education|revision|science|math|chemistry|physics|biology)\b/.test(text)) score += 0.24;
  if (/\b(official video|music|lyrics|reaction|trailer)\b/.test(text)) score -= 0.3;
  return clamp(score, 0, 1);
}

function clarityEstimate(title: string, description: string): number {
  let score = 0.5;
  if (title.trim().length >= 18 && title.trim().length <= 95) score += 0.16;
  if (description.trim().length >= 30) score += 0.12;
  if (/\b(step|visual|example|concept|why)\b/i.test(`${title} ${description}`)) score += 0.1;
  return clamp(score, 0.3, 0.95);
}

function bestVimeoThumbnail(urls: Array<{ link?: string; width?: number }> | undefined): string | null {
  if (!Array.isArray(urls) || urls.length === 0) return null;
  const sorted = [...urls].sort((left, right) => Number(right.width || 0) - Number(left.width || 0));
  return safeString(sorted[0]?.link).trim() || null;
}

function extractVimeoId(uri: string | null | undefined): string | null {
  const raw = safeString(uri).trim();
  if (!raw) return null;
  const match = raw.match(/\/videos\/(\d+)/);
  return match?.[1] || null;
}

function buildVimeoEmbedUrl(sourceVideoId: string): string {
  return `https://player.vimeo.com/video/${encodeURIComponent(sourceVideoId)}`;
}

async function fetchJson<T>(url: string, accessToken: string): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VIMEO_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
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

export async function fetchVimeoCreativeCandidates(request: CreativeDeckRequest): Promise<ExternalVideoCandidate[]> {
  if (request.allowVimeo === false) return [];
  const accessToken = safeString(process.env.VIMEO_ACCESS_TOKEN).trim();
  if (!accessToken) return [];

  const query = buildSearchQuery(request);
  const cacheKey = JSON.stringify({
    source: 'vimeo',
    query,
    language: normalizeLang(request.language),
    limit: clamp(Number(request.limit || 12), 4, 20),
  });
  const cached = ADAPTER_CACHE.get(cacheKey);
  if (cached && Date.now() - cached.ts < ADAPTER_CACHE_TTL_MS) {
    return cached.candidates;
  }

  const perPage = clamp(Math.ceil((Number(request.limit || 12) || 12) * 1.7), 8, 25);
  const params = new URLSearchParams({
    query,
    sort: 'relevant',
    direction: 'desc',
    per_page: String(perPage),
    page: '1',
    fields:
      'uri,name,description,duration,link,language,created_time,release_time,privacy.embed,user.name,pictures.sizes',
  });
  const response = await fetchJson<VimeoSearchResponse>(`${VIMEO_SEARCH_API}?${params.toString()}`, accessToken);
  const normalized = (response?.data || [])
    .flatMap((item) => {
      const sourceVideoId = extractVimeoId(item.uri);
      if (!sourceVideoId) return [];
      const title = safeString(item.name).trim() || 'Educational video';
      const description = safeString(item.description).trim();
      const creatorName = safeString(item.user?.name).trim() || null;
      const thumbnailUrl = bestVimeoThumbnail(item.pictures?.sizes) || null;
      const durationSeconds =
        typeof item.duration === 'number' && Number.isFinite(item.duration) && item.duration > 0
          ? Math.round(item.duration)
          : null;
      const embeddable = safeString(item.privacy?.embed).trim().toLowerCase() !== 'private';
      const trustTier = inferTrustTier(creatorName || '');
      const educationalConfidence = educationalConfidenceFromText(title, description, creatorName || '');
      const clarityScore = clarityEstimate(title, description);
      const canonicalUrl =
        safeString(item.link).trim() || `https://vimeo.com/${encodeURIComponent(sourceVideoId)}`;
      const candidate: ExternalVideoCandidate = {
        sourceType: 'vimeo' as const,
        sourceVideoId,
        title,
        description: description || null,
        thumbnailUrl,
        canonicalUrl,
        embedUrl: buildVimeoEmbedUrl(sourceVideoId),
        durationSeconds,
        language: normalizeLang(item.language) || normalizeLang(request.language),
        captionsAvailable: null,
        embeddable,
        creatorName,
        publishedAt: safeString(item.release_time || item.created_time).trim() || null,
        trustTier,
        educationalConfidence,
        clarityScore,
        transcriptQualityEstimate: 0.46,
        providerPayload: {
          provider: 'vimeo',
        },
      };
      return [candidate];
    })
    .filter((entry) => entry.educationalConfidence >= 0.42);

  ADAPTER_CACHE.set(cacheKey, { ts: Date.now(), candidates: normalized });
  return normalized;
}
