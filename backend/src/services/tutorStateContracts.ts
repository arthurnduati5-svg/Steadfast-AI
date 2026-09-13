// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State and Tutor Turn Context Contracts
// Domain: tutoring context kernel v1
// ─────────────────────────────────────────────────────────────

/**
 * Quality/status flags used throughout the context kernel.
 * These distinguish "no data yet" from "system not integrated" from "error".
 */
export type ContextStatus =
  | 'resolved'
  | 'partial'
  | 'no_data_yet'
  | 'not_integrated_yet'
  | 'unavailable'
  | 'error';

export type ContextQuality =
  | 'resolved'
  | 'partial'
  | 'degraded'
  | 'error';

export type LearnerStage = 'support' | 'developing' | 'secure';
export type RecommendedMode = 'guided' | 'practice' | 'challenge';
export type LearningMode =
  | 'learn'
  | 'practice'
  | 'review'
  | 'revision'
  | 'research'
  | 'artifact_help'
  | 'video_help';

export type EvidenceSource =
  | 'request'
  | 'session'
  | 'profile'
  | 'preference'
  | 'memory'
  | 'artifact'
  | 'video'
  | 'default'
  | 'system';

// ── TutorStateEvidence ──
export interface TutorStateEvidence {
  source: EvidenceSource;
  field: string;
  valueSummary: string;
  confidence: number;
  resolvedAt: string;
}

// ── TutorState ──
export interface TutorState {
  id: string;
  studentId: string;
  schoolId: string;
  sessionId?: string | null;

  activeSubject?: string | null;
  activeTopic?: string | null;
  activeSkillIds: string[];

  activeArtifactIds: string[];
  activeVideoId?: string | null;

  learningMode: LearningMode;

  primaryLanguage: string;
  supportLanguage?: string | null;

  stateQuality: ContextStatus;

  evidence: TutorStateEvidence[];

  /**
   * Video learning session state — tracks recommended, selected, active,
   * and completed video sessions for the learner.
   * Added by Video Learning Session v1. Optional/backward compatible.
   */
  videoLearningSession?: import('./videoLearningSessionContracts').VideoLearningSessionState | null;

  /**
   * Artifact-aware practice state — tracks active and recent artifact-linked
   * practice sessions for the learner.
   * Added by Artifact-Aware Practice Loop v1. Optional/backward compatible.
   */
  artifactAwarePractice?: import('./artifactAwarePracticeContracts').ArtifactAwarePracticeState | null;

  createdAt: string;
  updatedAt: string;
  lastResolvedAt?: string | null;
  stateVersion: number;
}

// ── ContextSignal ──
export interface ContextSignal {
  id: string;
  label: string;
  summary: string;
  source: string;
  confidence: number;
  updatedAt?: string | null;
}

// ── TutorTurnContext ──
export interface TutorTurnContext {
  identity: {
    studentId: string;
    schoolId: string;
    userId?: string | null;
    role?: string | null;
    grade?: string | null;
    ageBand?: string | null;
  };

  session: {
    sessionId?: string | null;
    learningMode: LearningMode;
    activeSubject?: string | null;
    activeTopic?: string | null;
    activeSkillIds: string[];
    primaryLanguage: string;
    supportLanguage?: string | null;
  };

  tutorState: TutorState;

  learnerProfile: {
    status: ContextStatus;
    strengths: ContextSignal[];
    weaknesses: ContextSignal[];
    recentMistakes: ContextSignal[];
    misconceptionSignals: ContextSignal[];
    masterySignals: ContextSignal[];
    notes: string[];
    practiceContext?: {
      status: ContextStatus;
      nextPracticeRecommendations: any[];
      reviewDueSignals: ContextSignal[];
      notes: string[];
    };
  };

  artifactContext: {
    status: ContextStatus;
    activeArtifactIds: string[];
    relevantBlocks: unknown[];
    summaries: ContextSignal[];
    notes: string[];
  };

  videoContext: {
    status: ContextStatus;
    activeVideoId?: string | null;
    transcriptBlocks: unknown[];
    recommendedVideoIds: string[];
    notes: string[];
  };

  /**
   * Optional video-aware practice context, populated when video-aware
   * practice sessions exist. Added by Video-Aware Practice Loop v1.
   * Contains only safe summaries — no answer keys, no raw learner answers.
   */
  videoAwarePracticeContext?: {
    activePracticeSession?: import('./videoAwarePracticeContracts').VideoAwarePracticeSession | null;
    safeContextSummary: import('./videoAwarePracticeContracts').VideoAwarePracticeSafeContextSummary;
  } | null;

  /**
   * Optional artifact-aware practice context, populated when artifact-aware
   * practice sessions exist. Added by Artifact-Aware Practice Loop v1.
   * Contains only safe summaries — no answer keys, no raw artifact text.
   */
  artifactAwarePracticeContext?: {
    activePracticeSession?: import('./artifactAwarePracticeContracts').ArtifactAwarePracticeSession | null;
    safeContextSummary: import('./artifactAwarePracticeContracts').ArtifactAwarePracticeSafeContextSummary;
  } | null;

  sourceTrust: {
    status: ContextStatus | 'verified' | 'unsupported' | 'blocked' | 'no_sources' | 'not_requested';
    allowedSourceIds: string[];
    verifiedSources: unknown[];
    unsupportedSourcesBlocked: boolean;
    notes: string[];
  };

  cacheScope: {
    cacheAllowed: boolean;
    scope: 'no_cache' | 'student_session' | 'student_artifact' | 'school_static' | 'public_static' | 'student_state' | 'verified_source' | 'internal_short_lived';
    keyParts: {
      schoolId: string;
      studentId: string;
      sessionId?: string | null;
      activeSubject?: string | null;
      activeTopic?: string | null;
      learningMode: string;
      artifactHash?: string | null;
      videoHash?: string | null;
    };
    reason: string;
  };

  resolverMeta: {
    contextQuality: ContextQuality;
    resolvedAt: string;
    resolverVersion: 'tutor-context-kernel-v1';
    warnings: string[];
    errors: string[];
  };

  /**
   * Optional intent resolution, populated when the resolve request includes a message.
   * Added by Intelligent Intent Resolver v1. Never cached.
   */
  intentResolution?: any | null;
}

// ── Request Contracts ──
export interface ResolveTutorStateRequest {
  sessionId?: string;
  message?: string;
  learningMode?: LearningMode;
  activeSubject?: string;
  activeTopic?: string;
  activeSkillIds?: string[];
  activeArtifactIds?: string[];
  activeVideoId?: string | null;
  primaryLanguage?: string;
  supportLanguage?: string | null;
  includeDebug?: boolean;
}

export interface PatchTutorStateRequest {
  sessionId?: string | null;
  activeSubject?: string | null;
  activeTopic?: string | null;
  activeSkillIds?: string[];
  activeArtifactIds?: string[];
  activeVideoId?: string | null;
  learningMode?: LearningMode;
  primaryLanguage?: string;
  supportLanguage?: string | null;
}

// ── Response Contracts ──
export interface TutorStateResponse {
  ok: true;
  tutorState: TutorState;
}

export interface ResolveTutorContextResponse {
  ok: true;
  context: TutorTurnContext;
}

// ── Identity ──
export interface ResolvedTutorIdentity {
  studentId: string;
  schoolId: string;
  userId?: string;
  role?: string;
  grade?: string;
  ageBand?: string;
}
