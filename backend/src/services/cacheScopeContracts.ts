// ─────────────────────────────────────────────────────────────
// Steadfast AI — Cache Scope Contracts
// Domain: safe cache scope policy v1
// All cache decisions must originate from these types.
// ─────────────────────────────────────────────────────────────

/**
 * Cache scope determines the isolation boundary for cached data.
 * No cache decision is valid without an explicit scope.
 */
export type CacheScope =
  | 'no_cache'
  | 'public_static'
  | 'school_static'
  | 'student_state'
  | 'student_session'
  | 'student_artifact'
  | 'student_video'
  | 'verified_source'
  | 'internal_short_lived';

/**
 * Data class identifies what kind of data is being cached.
 * Used in key construction and policy decisions.
 */
export type CacheDataClass =
  | 'tutor_state'
  | 'tutor_turn_context'
  | 'ai_response'
  | 'artifact_context'
  | 'video_context'
  | 'learner_memory'
  | 'mastery_snapshot'
  | 'source_trust'
  | 'public_curriculum'
  | 'school_config'
  | 'research_result'
  | 'unknown';

/**
 * Safe key parts used to construct deterministic cache keys.
 * Never include raw message text, secrets, or raw artifact content.
 */
export interface CacheKeyParts {
  schoolId?: string | null;
  studentId?: string | null;
  sessionId?: string | null;
  userId?: string | null;
  role?: string | null;
  learningMode?: string | null;
  activeSubject?: string | null;
  activeTopic?: string | null;
  primaryLanguage?: string | null;
  supportLanguage?: string | null;
  artifactIds?: string[];
  artifactFingerprint?: string | null;
  videoId?: string | null;
  videoFingerprint?: string | null;
  sourceFingerprint?: string | null;
  masteryFingerprint?: string | null;
  memoryFingerprint?: string | null;
  normalizedMessageHash?: string | null;
  requestShapeHash?: string | null;
}

/**
 * Complete cache policy decision.
 * Returned by CacheScopePolicyService for every cache inquiry.
 */
export interface CachePolicyDecision {
  cacheAllowed: boolean;
  scope: CacheScope;
  dataClass: CacheDataClass;
  ttlSeconds: number | null;
  key: string | null;
  keyParts: CacheKeyParts;
  reason: string;
  warnings: string[];
  createdAt: string;
}

/**
 * Input to CacheScopePolicyService.decide().
 */
export interface CachePolicyInput {
  dataClass: CacheDataClass;
  keyParts: CacheKeyParts;
  requestedTtlSeconds?: number | null;
  allowPublicCache?: boolean;
  allowSchoolCache?: boolean;
  allowStudentCache?: boolean;
  reasonHint?: string;
}

/**
 * Machine-readable reason for cache safety decisions.
 */
export type CacheSafetyReason =
  | 'personalized_ai_response_never_cache'
  | 'tutor_turn_context_never_cache'
  | 'missing_student_scope'
  | 'missing_school_scope'
  | 'missing_artifact_fingerprint'
  | 'missing_source_fingerprint'
  | 'safe_student_state_cache'
  | 'safe_public_static_cache'
  | 'safe_school_static_cache'
  | 'source_trust_requires_fingerprint'
  | 'unknown_data_class_no_cache';
