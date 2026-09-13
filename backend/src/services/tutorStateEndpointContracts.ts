// ─────────────────────────────────────────────────────────────
// Steadfast AI — Dedicated Tutor State Endpoint Contracts v1
// Domain: one durable, authenticated, tenant-safe, state-aware
// endpoint that formalizes the tutor's current understanding of
// the learner across sessions, topics, artifacts, videos,
// practice, mastery, memory, source trust, and cache policy.
// ─────────────────────────────────────────────────────────────

import type { ArtifactAwarePracticeDecision } from './artifactAwarePracticeContracts';
import type { LearnerMemoryKind } from './learnerMemoryContracts';
import type { MasteryLevel } from './practiceMasteryContracts';

// ── Enums ──

export type TutorStateEndpointStatus =
  | 'resolved'
  | 'empty'
  | 'partial'
  | 'updated'
  | 'reset'
  | 'snapshot_created'
  | 'validation_failed'
  | 'forbidden'
  | 'error';

export type TutorStateViewMode =
  | 'learner_safe'
  | 'tutor_internal'
  | 'teacher_audit'
  | 'system_debug';

export type TutorStatePatchOperation =
  | 'set_active_topic'
  | 'set_learning_mode'
  | 'set_active_artifacts'
  | 'clear_active_artifacts'
  | 'set_active_video_session'
  | 'clear_active_video_session'
  | 'set_next_action'
  | 'clear_next_action'
  | 'reset_session_state'
  | 'append_note'
  | 'acknowledge_warning';

export type TutorStateResetScope =
  | 'session_only'
  | 'active_topic'
  | 'active_artifacts'
  | 'active_video'
  | 'active_practice'
  | 'next_action'
  | 'all_ephemeral';

export type TutorStateSourceDomain =
  | 'identity'
  | 'session'
  | 'topic'
  | 'artifact'
  | 'video'
  | 'practice'
  | 'mastery'
  | 'learner_memory'
  | 'source_trust'
  | 'cache_policy'
  | 'intent'
  | 'chat'
  | 'system';

export type TutorNextActionType =
  | 'ask_clarification'
  | 'continue_chat'
  | 'continue_video'
  | 'generate_video_practice'
  | 'generate_artifact_practice'
  | 'reteach'
  | 'review'
  | 'advance'
  | 'schedule_review'
  | 'teacher_review';

// ── Sub-Contracts ──

export interface TutorNextAction {
  actionType: TutorNextActionType;
  reason: string;
  prompt?: string | null;
  dueAt?: string | null;
}

export interface TutorStatePracticeSummary {
  status: string;
  topic?: string | null;
  itemCount: number;
  correctCount: number;
  currentDecision?: string | null;
  nextActionPrompt?: string | null;
}

export interface TutorStateVideoSummary {
  sessionVideoId: string;
  title: string;
  channelTitle?: string | null;
  status: string;
  watchedPercent?: number | null;
  topic?: string | null;
}

export interface TutorStateMasterySummary {
  levels: Array<{
    skillId: string;
    skillLabel: string;
    level: MasteryLevel;
    confidenceScore: number;
  }>;
  recentAttemptCount: number;
  averageConfidence: number;
}

export interface TutorStateMisconceptionSummary {
  label: string;
  status: string;
  linkedSkillIds: string[];
  observationCount: number;
}

export interface TutorScheduledReviewSummary {
  skillLabel: string;
  dueAt: string;
  reason: string;
  status: string;
}

export interface TutorStateSafePromptContext {
  allowed: boolean;
  summary: string;
  excluded: string[];
  warnings: string[];
}

// ── Main Contract ──

export interface DedicatedTutorState {
  stateId: string;
  stateVersion: number;
  status: TutorStateEndpointStatus;
  viewMode: TutorStateViewMode;

  identity: {
    schoolScoped: boolean;
    studentScoped: boolean;
    sessionScoped: boolean;
  };

  session: {
    sessionId?: string | null;
    tutorSessionId?: string | null;
    startedAt?: string | null;
    lastUpdatedAt: string;
  };

  currentLearning: {
    subject?: string | null;
    topic?: string | null;
    skillIds: string[];
    syllabusObjectiveIds: string[];
    learningMode?: string | null;
    nextAction?: TutorNextAction | null;
  };

  artifacts: {
    activeArtifactIds: string[];
    safeSummary?: string | null;
    artifactAwarePractice?: TutorStatePracticeSummary | null;
    warnings: string[];
  };

  videos: {
    activeVideoSession?: TutorStateVideoSummary | null;
    videoAwarePractice?: TutorStatePracticeSummary | null;
    warnings: string[];
  };

  practice: {
    masterySummary?: TutorStateMasterySummary | null;
    misconceptionSummary: TutorStateMisconceptionSummary[];
    activePracticeSummary?: TutorStatePracticeSummary | null;
    scheduledReviews: TutorScheduledReviewSummary[];
    warnings: string[];
  };

  learnerMemory: {
    available: boolean;
    safeSummary?: string | null;
    strengths: string[];
    weaknesses: string[];
    recentSignals: string[];
    warnings: string[];
  };

  sourceTrust: {
    status?: string | null;
    allowedSourceIds: string[];
    blockedSourceIds: string[];
    warnings: string[];
  };

  cachePolicy: {
    cacheAllowed: boolean;
    scope: string;
    reason: string;
  };

  intent: {
    lastIntent?: string | null;
    lastTaskKind?: string | null;
    confidence?: number | null;
    clarificationNeeded?: boolean;
  };

  safePromptContext: TutorStateSafePromptContext;

  metadata: {
    createdAt: string;
    updatedAt: string;
    resolvedAt: string;
    domainsIncluded: TutorStateSourceDomain[];
    domainsPartial: TutorStateSourceDomain[];
    domainsExcluded: TutorStateSourceDomain[];
    warnings: string[];
  };
}

// ── Request Contracts ──

export interface TutorStatePatchRequest {
  sessionId?: string | null;
  operation: TutorStatePatchOperation;
  value?: unknown;
  reason?: string | null;
  expectedStateVersion?: number | null;
}

export interface TutorStateResolveRequest {
  sessionId?: string | null;
  includeDomains?: TutorStateSourceDomain[];
  viewMode?: TutorStateViewMode;
}

export interface TutorStateResetRequest {
  sessionId?: string | null;
  scope: TutorStateResetScope;
  reason?: string | null;
}

export interface TutorStateSnapshotRequest {
  sessionId?: string | null;
  reason?: string | null;
  includeSafePromptContext?: boolean;
}

export interface TutorStateValidateRequest {
  sessionId?: string | null;
  state: Partial<DedicatedTutorState>;
}

// ── Response Contracts ──

export interface TutorStateEndpointResponse {
  ok: true;
  status: TutorStateEndpointStatus;
  state: DedicatedTutorState;
  warnings: string[];
}

export interface TutorStateSnapshotSummary {
  snapshotId: string;
  stateVersion: number;
  createdAt: string;
  reason?: string | null;
  domainsIncluded: TutorStateSourceDomain[];
  topic?: string | null;
}

export interface TutorStateHistoryResponse {
  ok: true;
  status: TutorStateEndpointStatus;
  snapshots: TutorStateSnapshotSummary[];
  warnings: string[];
}

// ── Constants ──

export const MAX_SAFE_SUMMARY_CHARS = 800;
export const MAX_STRENGTH_CHARS = 120;
export const MAX_WEAKNESS_CHARS = 120;
export const MAX_SIGNAL_CHARS = 200;
export const MAX_WARNINGS = 10;
export const MAX_HISTORY_SNAPSHOTS = 20;
export const MAX_DOMAINS = 20;

export const FORBIDDEN_BODY_FIELDS = [
  'schoolId', 'studentId', 'teacherId', 'role', 'tenant', 'permissions',
  'rawArtifactText', 'rawOcrText', 'rawTranscript', 'fullTranscript',
  'answerKey', 'rawAnswerKey', 'markingSchemeRaw',
  'hiddenPrompt', 'systemPrompt', 'developerPrompt',
] as const;

export const LEARNER_SAFE_PATCH_OPERATIONS: TutorStatePatchOperation[] = [
  'set_active_topic',
  'set_learning_mode',
  'set_active_artifacts',
  'clear_active_artifacts',
  'append_note',
  'acknowledge_warning',
];

export const TEACHER_PATCH_OPERATIONS: TutorStatePatchOperation[] = [
  ...LEARNER_SAFE_PATCH_OPERATIONS,
  'set_active_video_session',
  'clear_active_video_session',
  'set_next_action',
  'clear_next_action',
  'reset_session_state',
];

export const FORBIDDEN_PATCH_OPERATIONS_LEARNER: TutorStatePatchOperation[] = [
  'set_active_video_session',
  'clear_active_video_session',
  'set_next_action',
  'clear_next_action',
  'reset_session_state',
];
