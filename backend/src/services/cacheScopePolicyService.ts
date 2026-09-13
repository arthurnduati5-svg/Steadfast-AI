// ─────────────────────────────────────────────────────────────
// Steadfast AI — Cache Scope Policy Service
// Centralizes all cache decisions for the Tutor Context Kernel.
// This service does NOT talk to Redis directly.
// ─────────────────────────────────────────────────────────────

import type {
  CacheScope,
  CacheDataClass,
  CacheKeyParts,
  CachePolicyDecision,
  CachePolicyInput,
} from './cacheScopeContracts';

const KEY_PREFIX = 'steadfast:v1';

/**
 * Deterministic rules: which data classes are never cached.
 */
const NEVER_CACHE_DATA_CLASSES: Set<CacheDataClass> = new Set([
  'tutor_turn_context',
  'ai_response',
  'artifact_context',
  'video_context',
  'learner_memory',
  'mastery_snapshot',
]);

function nowISO(): string {
  return new Date().toISOString();
}

function isNonEmpty(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Build the deterministic cache key scope (the first segment after prefix).
 */
function resolveScopeFromInput(input: CachePolicyInput): CacheScope {
  const parts = input.keyParts;
  const dataClass = input.dataClass;

  // Default rules based on data class
  switch (dataClass) {
    case 'tutor_turn_context':
    case 'ai_response':
    case 'artifact_context':
    case 'video_context':
    case 'learner_memory':
    case 'mastery_snapshot':
      return 'no_cache';

    case 'tutor_state':
      if (isNonEmpty(parts.schoolId) && isNonEmpty(parts.studentId)) {
        return 'student_state';
      }
      return 'no_cache';

    case 'source_trust':
      if (isNonEmpty(parts.schoolId) && isNonEmpty(parts.sourceFingerprint)) {
        return 'verified_source';
      }
      return 'no_cache';

    case 'public_curriculum':
      return 'public_static';

    case 'school_config':
      if (isNonEmpty(parts.schoolId)) {
        return 'school_static';
      }
      return 'no_cache';

    case 'research_result':
      if (isNonEmpty(parts.schoolId) && isNonEmpty(parts.studentId)) {
        return 'student_session';
      }
      if (isNonEmpty(parts.schoolId)) {
        return 'school_static';
      }
      return 'public_static';

    default:
      return 'no_cache';
  }
}

/**
 * Resolve TTL based on scope and data class.
 */
function resolveTtl(scope: CacheScope, dataClass: CacheDataClass, requestedTtl?: number | null): number | null {
  if (scope === 'no_cache') return null;

  // Use requested TTL if provided and reasonable
  if (typeof requestedTtl === 'number' && requestedTtl > 0 && requestedTtl <= 86400) {
    return requestedTtl;
  }

  // Default TTLs by scope
  switch (scope) {
    case 'student_state':
      return 300; // 5 minutes
    case 'student_session':
      return 600; // 10 minutes
    case 'student_artifact':
      return 600;
    case 'student_video':
      return 600;
    case 'verified_source':
      return 3600; // 1 hour
    case 'school_static':
      return 3600;
    case 'public_static':
      return 7200; // 2 hours
    case 'internal_short_lived':
      return 60; // 1 minute
    default:
      return null;
  }
}

/**
 * Build a deterministic cache key from parts and scope.
 * Returns null if caching is not allowed.
 */
function buildCacheKey(parts: CacheKeyParts, scope: CacheScope, dataClass: CacheDataClass): string | null {
  if (scope === 'no_cache') return null;

  const segments: string[] = [KEY_PREFIX, dataClass, scope];

  // Always include schoolId for scoped data
  if (isNonEmpty(parts.schoolId)) {
    segments.push('school', parts.schoolId!.trim());
  }

  // Include studentId for personalized data
  if (isNonEmpty(parts.studentId) && scope.startsWith('student_')) {
    segments.push('student', parts.studentId!.trim());
  }

  // Include sessionId when available
  if (isNonEmpty(parts.sessionId)) {
    segments.push('session', parts.sessionId!.trim());
  }

  // Include learningMode
  if (isNonEmpty(parts.learningMode)) {
    segments.push('mode', parts.learningMode!.trim());
  }

  // Include topic hash
  if (isNonEmpty(parts.activeTopic)) {
    const topicHash = simpleHash(parts.activeTopic!.trim());
    segments.push('topic', topicHash);
  }

  // Include artifact fingerprint
  if (isNonEmpty(parts.artifactFingerprint)) {
    segments.push('artifact', parts.artifactFingerprint!.trim());
  } else if (parts.artifactIds && parts.artifactIds.length > 0) {
    const fp = simpleHash([...parts.artifactIds].sort().join(','));
    segments.push('artifact', fp);
  }

  // Include video fingerprint
  if (isNonEmpty(parts.videoFingerprint)) {
    segments.push('video', parts.videoFingerprint!.trim());
  } else if (isNonEmpty(parts.videoId)) {
    segments.push('video', parts.videoId!.trim());
  }

  // Include source fingerprint
  if (isNonEmpty(parts.sourceFingerprint)) {
    segments.push('source', parts.sourceFingerprint!.trim());
  }

  // Include message hash (for non-personalized static cache)
  if (isNonEmpty(parts.normalizedMessageHash) && scope === 'public_static') {
    segments.push('msg', parts.normalizedMessageHash!.trim());
  }

  // Include request shape hash (for non-personalized)
  if (isNonEmpty(parts.requestShapeHash) && (scope === 'public_static' || scope === 'school_static')) {
    segments.push('req', parts.requestShapeHash!.trim());
  }

  return segments.join(':');
}

/**
 * Simple non-cryptographic hash for cache key segments.
 * Deterministic and safe for key construction.
 */
function simpleHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Resolve the reason string for a cache decision.
 */
function resolveReason(scope: CacheScope, dataClass: CacheDataClass, warnings: string[]): string {
  if (scope === 'no_cache') {
    switch (dataClass) {
      case 'tutor_turn_context':
        return 'tutor_turn_context_never_cache';
      case 'ai_response':
        return 'personalized_ai_response_never_cache';
      case 'artifact_context':
        return 'missing_artifact_fingerprint';
      case 'video_context':
        return 'missing_video_fingerprint';
      case 'learner_memory':
        return 'missing_memory_fingerprint';
      case 'mastery_snapshot':
        return 'missing_mastery_fingerprint';
      default: {
        const kp = warnings.length > 0 ? warnings[0] : 'unknown_data_class_no_cache';
        return kp;
      }
    }
  }

  switch (scope) {
    case 'student_state':
      return 'safe_student_state_cache';
    case 'public_static':
      return 'safe_public_static_cache';
    case 'school_static':
      return 'safe_school_static_cache';
    case 'verified_source':
      return 'source_trust_requires_fingerprint';
    default:
      return `safe_${scope}_cache`;
  }
}

export class CacheScopePolicyService {
  /**
   * Decide whether caching is allowed and build the cache key.
   */
  decide(input: CachePolicyInput): CachePolicyDecision {
    const warnings: string[] = [];
    const keyParts = input.keyParts;

    // Resolve scope
    const scope = resolveScopeFromInput(input);

    // Add warnings for missing scope requirements
    if (scope.startsWith('student_')) {
      if (!isNonEmpty(keyParts.schoolId)) {
        warnings.push('Missing schoolId for student-scoped cache');
      }
      if (!isNonEmpty(keyParts.studentId)) {
        warnings.push('Missing studentId for student-scoped cache');
      }
    }

    if (scope === 'verified_source') {
      if (!isNonEmpty(keyParts.sourceFingerprint)) {
        warnings.push('Missing sourceFingerprint for source-scoped cache');
      }
    }

    // Additional warnings
    if (scope === 'no_cache') {
      warnings.push(`Data class "${input.dataClass}" is not eligible for caching`);
    }

    const cacheAllowed = scope !== 'no_cache';
    const ttlSeconds = resolveTtl(scope, input.dataClass, input.requestedTtlSeconds);

    return {
      cacheAllowed,
      scope,
      dataClass: input.dataClass,
      ttlSeconds,
      key: cacheAllowed ? buildCacheKey(keyParts, scope, input.dataClass) : null,
      keyParts,
      reason: resolveReason(scope, input.dataClass, warnings),
      warnings,
      createdAt: nowISO(),
    };
  }

  /**
   * Build a cache key from parts and a partial decision (without key).
   * Returns null if caching is not allowed.
   */
  buildKey(parts: CacheKeyParts, decision: Omit<CachePolicyDecision, 'key'>): string | null {
    if (!decision.cacheAllowed) return null;
    return buildCacheKey(parts, decision.scope, decision.dataClass);
  }

  /**
   * Assert that a decision allows cache read.
   * Throws if cache is not allowed.
   */
  assertSafeForRead(decision: CachePolicyDecision): void {
    if (!decision.cacheAllowed) {
      throw new Error(
        `Cache read not allowed: ${decision.dataClass} (scope=${decision.scope}, reason=${decision.reason})`,
      );
    }
    if (!decision.key) {
      throw new Error(
        `Cache key is null: cannot read cache for ${decision.dataClass}`,
      );
    }
  }

  /**
   * Assert that a decision allows cache write.
   * Throws if cache is not allowed.
   */
  assertSafeForWrite(decision: CachePolicyDecision): void {
    if (!decision.cacheAllowed) {
      throw new Error(
        `Cache write not allowed: ${decision.dataClass} (scope=${decision.scope}, reason=${decision.reason})`,
      );
    }
    if (!decision.key) {
      throw new Error(
        `Cache key is null: cannot write cache for ${decision.dataClass}`,
      );
    }
  }

  /**
   * Produce a safe no_cache decision for TutorTurnContext.
   * Convenience method for the resolver integration point.
   */
  noCacheForTurnContext(keyParts: CacheKeyParts): CachePolicyDecision {
    return this.decide({
      dataClass: 'tutor_turn_context',
      keyParts,
    });
  }

  /**
   * Produce a no_cache decision for AI responses.
   */
  noCacheForAiResponse(keyParts: CacheKeyParts): CachePolicyDecision {
    return this.decide({
      dataClass: 'ai_response',
      keyParts,
    });
  }

  /**
   * Produce a safe cache decision for TutorState GET.
   */
  cacheForTutorState(keyParts: CacheKeyParts): CachePolicyDecision {
    return this.decide({
      dataClass: 'tutor_state',
      keyParts,
      allowStudentCache: true,
    });
  }

  /**
   * Produce a safe cache decision for source trust.
   */
  cacheForSourceTrust(keyParts: CacheKeyParts): CachePolicyDecision {
    return this.decide({
      dataClass: 'source_trust',
      keyParts,
    });
  }
}

// Singleton export for convenience
export const cacheScopePolicyService = new CacheScopePolicyService();
