// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Recommendation Cache Policy v1
// Dedicated cache policy for video recommendation responses.
// Cache key MUST include: studentId, schoolId, grade, age band,
// topic, skillId, language, artifactId, questionId, learningMode,
// safety policy version, ranking policy version, provider.
// NEVER cache by message text only.
// ─────────────────────────────────────────────────────────────

// ── Cache Policy Input Interface ──
// studentId and schoolId are required for cache scoping.
// These are separate from VideoRecommendationRequest because
// identity is passed via the service, not the request body.

export interface VideoCachePolicyInput {
  studentId: string;
  schoolId?: string | null;
  grade?: string | null;
  topic?: string | null;
  skillId?: string | null;
  language?: string | null;
  artifactId?: string | null;
  questionId?: string | null;
  learningMode?: string | null;
}

export interface VideoCacheDecision {
  mode: 'no_cache' | 'scoped_cache';
  keyParts: string[];
  key?: string | null;
  reason: string;
  ttlSeconds: number | null;
  warnings: string[];
}

const CACHE_POLICY_VERSION = 'v1';
const RANKING_POLICY_VERSION = 'v1';

/**
 * Simple non-cryptographic hash for cache key segments.
 */
function simpleHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

export class VideoRecommendationCachePolicy {
  /**
   * Decide cache policy for a video recommendation request.
   */
  decide(request: VideoCachePolicyInput): VideoCacheDecision {
    const warnings: string[] = [];
    const keyParts: string[] = [];

    // Always require student-scoping
    if (!request.studentId) {
      return {
        mode: 'no_cache',
        keyParts: [],
        key: null,
        reason: 'Missing studentId — cannot scope cache',
        ttlSeconds: null,
        warnings: ['studentId is required for cache scoping'],
      };
    }

    // Build key parts
    keyParts.push(`student:${request.studentId}`);
    if (request.schoolId) keyParts.push(`school:${request.schoolId}`);
    if (request.grade) keyParts.push(`grade:${request.grade}`);
    if (request.topic) keyParts.push(`topic:${simpleHash(request.topic)}`);
    if (request.skillId) keyParts.push(`skill:${request.skillId}`);
    if (request.language) keyParts.push(`lang:${simpleHash(request.language)}`);
    if (request.artifactId) keyParts.push(`artifact:${request.artifactId}`);
    if (request.questionId) keyParts.push(`question:${request.questionId}`);
    if (request.learningMode) keyParts.push(`mode:${request.learningMode}`);

    // Policy versioning ensures cache invalidation on policy changes
    keyParts.push(`safety:${CACHE_POLICY_VERSION}`);
    keyParts.push(`ranking:${RANKING_POLICY_VERSION}`);

    // Provider
    keyParts.push('provider:multi');

    // Build final key
    const key = keyParts.join(':');

    // Determine TTL
    const ttlSeconds = 300; // 5 minutes — video content doesn't change rapidly

    return {
      mode: 'scoped_cache',
      keyParts,
      key,
      reason: `Scoped cache for video recommendations (student + topic + language + policy)`,
      ttlSeconds,
      warnings,
    };
  }

  /**
   * Check whether a cache entry can be reused for a new request.
   */
  canReuseCache(
    cachedRequest: VideoCachePolicyInput,
    newRequest: VideoCachePolicyInput,
  ): { canReuse: boolean; reason: string } {
    if (cachedRequest.studentId !== newRequest.studentId) {
      return { canReuse: false, reason: 'Different student' };
    }
    if (cachedRequest.schoolId !== newRequest.schoolId) {
      return { canReuse: false, reason: 'Different school' };
    }
    if (cachedRequest.topic !== newRequest.topic) {
      return { canReuse: false, reason: 'Different topic' };
    }
    if (cachedRequest.language !== newRequest.language) {
      return { canReuse: false, reason: 'Different language' };
    }
    if (cachedRequest.learningMode !== newRequest.learningMode) {
      return { canReuse: false, reason: 'Different learning mode' };
    }
    return { canReuse: true, reason: 'Cache key matches' };
  }

  /**
   * Build a no_cache decision (forced).
   */
  forceNoCache(reason: string): VideoCacheDecision {
    return {
      mode: 'no_cache',
      keyParts: [],
      key: null,
      reason,
      ttlSeconds: null,
      warnings: [],
    };
  }
}

export const videoRecommendationCachePolicy = new VideoRecommendationCachePolicy();
