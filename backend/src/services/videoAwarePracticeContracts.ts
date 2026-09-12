// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Practice Loop Contracts v1
// Domain: evidence-based, video-linked practice with safe
// answer evaluation, misconception tracking, decision loop,
// and spaced review scheduling.
// ─────────────────────────────────────────────────────────────

// ── Status Enums ──

export type VideoAwarePracticeStatus =
  | 'not_started'
  | 'generated'
  | 'answered'
  | 'reviewed'
  | 'reteach_needed'
  | 'practice_more'
  | 'advance_ready'
  | 'scheduled_review'
  | 'completed'
  | 'abandoned';

export type VideoAwarePracticeItemType =
  | 'recall'
  | 'worked_example'
  | 'concept_check'
  | 'error_spotting'
  | 'application'
  | 'teach_back'
  | 'reflection';

export type VideoAwareAnswerStatus =
  | 'not_answered'
  | 'correct'
  | 'partially_correct'
  | 'incorrect'
  | 'needs_review'
  | 'invalid';

export type VideoAwarePracticeDecision =
  | 'reteach'
  | 'review_video_segment'
  | 'give_similar_practice'
  | 'give_harder_practice'
  | 'advance'
  | 'schedule_spaced_review'
  | 'ask_clarification';

export type VideoAwareMisconceptionStatus =
  | 'suspected'
  | 'confirmed'
  | 'resolved'
  | 'needs_review';

// ── Core Contracts ──

export interface VideoAwarePracticeSourceVideo {
  title: string;
  provider?: string | null;
  providerVideoId?: string | null;
  canonicalUrl?: string | null;
  watchedPercent?: number | null;
  lastKnownPositionSeconds?: number | null;
}

export interface VideoAwarePracticeBasis {
  triggerMessage?: string | null;
  triggerIntent?: string | null;
  checkpointIds: string[];
  learnerWeaknessIds: string[];
  masterySignalsUsed: string[];
  memorySignalsUsed: string[];
  videoProgressUsed: boolean;
  artifactContextUsed: boolean;
}

export interface VideoAwarePracticeDecisionResult {
  currentDecision: VideoAwarePracticeDecision;
  reason: string;
  nextActionPrompt?: string | null;
  recommendedReviewAt?: string | null;
  dueAt?: string | null;
}

export interface VideoAwarePracticeSafety {
  rawTranscriptUsed: false;
  rawTranscriptStored: false;
  answerKeyVisibleToLearner: false;
  warnings: string[];
}

export interface VideoAwarePracticeItem {
  practiceItemId: string;
  type: VideoAwarePracticeItemType;
  prompt: string;
  expectedAnswerSummary?: string | null;
  rubricPoints: string[];
  linkedVideoTimestampSeconds?: number | null;
  linkedCheckpointId?: string | null;
  linkedSkillIds: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  status: VideoAwareAnswerStatus;
  learnerAnswerSummary?: string | null;
  feedbackSummary?: string | null;
  createdAt: string;
  answeredAt?: string | null;
}

export interface VideoAwareMisconception {
  misconceptionId: string;
  label: string;
  evidence: string[];
  linkedSkillIds: string[];
  status: VideoAwareMisconceptionStatus;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface VideoAwarePracticeSession {
  videoPracticeSessionId: string;
  sessionVideoId: string;
  tutorSessionId?: string | null;

  status: VideoAwarePracticeStatus;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];
  syllabusObjectiveIds: string[];
  activeArtifactIds: string[];

  sourceVideo: VideoAwarePracticeSourceVideo;
  basis: VideoAwarePracticeBasis;
  items: VideoAwarePracticeItem[];
  misconceptionSummary: VideoAwareMisconception[];
  decision: VideoAwarePracticeDecisionResult;
  safety: VideoAwarePracticeSafety;

  createdAt: string;
  updatedAt: string;
}

export interface VideoAwarePracticeState {
  activePracticeSession?: VideoAwarePracticeSession | null;
  recentPracticeSessions: VideoAwarePracticeSession[];
  updatedAt: string;
}

// ── Request Contracts ──

export interface GenerateVideoAwarePracticeRequest {
  sessionId?: string | null;
  sessionVideoId?: string | null;
  requestedItemCount?: number;
  preferredTypes?: VideoAwarePracticeItemType[];
  difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
  includeArtifactContext?: boolean;
}

export interface AnswerVideoAwarePracticeRequest {
  videoPracticeSessionId: string;
  practiceItemId: string;
  learnerAnswerSummary: string;
}

export interface ReviewVideoAwarePracticeRequest {
  videoPracticeSessionId: string;
}

export interface NextVideoAwarePracticeRequest {
  videoPracticeSessionId: string;
}

export interface ScheduleVideoAwarePracticeRequest {
  videoPracticeSessionId: string;
}

export interface CompleteVideoAwarePracticeRequest {
  videoPracticeSessionId: string;
}

export interface AbandonVideoAwarePracticeRequest {
  videoPracticeSessionId: string;
}

export interface GetVideoAwarePracticeSessionQuery {
  videoPracticeSessionId?: string;
}

export interface GetVideoAwarePracticeHistoryQuery {
  maxResults?: number;
}

// ── Response Contracts ──

export interface VideoAwarePracticeResponse {
  ok: true;
  status: VideoAwarePracticeStatus;
  activePracticeSession?: VideoAwarePracticeSession | null;
  recentPracticeSessions: VideoAwarePracticeSession[];
  warnings: string[];
}

export interface VideoAwarePracticeEvaluateResult {
  status: VideoAwareAnswerStatus;
  feedbackSummary: string;
  rubricHits: string[];
  rubricMisses: string[];
  suspectedMisconceptions: VideoAwareMisconception[];
  warnings: string[];
}

export interface VideoAwarePracticeDecisionOutput {
  decision: VideoAwarePracticeDecision;
  reason: string;
  nextActionPrompt?: string | null;
  recommendedReviewAt?: string | null;
  dueAt?: string | null;
  warnings: string[];
}

export interface VideoAwarePracticeSafeContextSummary {
  hasActiveVideoPractice: boolean;
  topic?: string | null;
  skillIds: string[];
  currentDecision?: VideoAwarePracticeDecision | null;
  misconceptionSummary: string[];
  nextActionPrompt?: string | null;
  dueReviewSummary?: string | null;
  warnings: string[];
}

export interface VideoAwarePracticeResolverOutput {
  activePracticeSession?: VideoAwarePracticeSession | null;
  recentPracticeSessions: VideoAwarePracticeSession[];
  safeContextSummary: VideoAwarePracticeSafeContextSummary;
}

// ── Identity ──

export interface VideoAwarePracticeIdentity {
  schoolId: string;
  studentId: string;
  sessionId?: string | null;
}

// ── Constants ──

export const PRACTICE_DIFFICULTIES = ['easy', 'medium', 'hard', 'adaptive'] as const;
export const PRACTICE_ITEM_TYPES: VideoAwarePracticeItemType[] = [
  'recall', 'worked_example', 'concept_check', 'error_spotting',
  'application', 'teach_back', 'reflection',
];

export const MIN_WATCHED_PERCENT_FOR_MEANINGFUL_PRACTICE = 30;
export const MAX_PRACTICE_SESSION_ITEMS = 5;
export const MIN_PRACTICE_SESSION_ITEMS = 1;
export const DEFAULT_PRACTICE_SESSION_ITEMS = 3;
export const MAX_RECENT_PRACTICE_SESSIONS = 5;
export const MAX_EVIDENCE_STRINGS = 5;
export const MAX_EVIDENCE_CHARS = 240;
export const MAX_RUBRIC_POINTS = 5;
export const MAX_MISCONCEPTION_EVIDENCE = 5;
