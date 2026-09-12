// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Session Contracts v1
// Domain: tutor-state-aware video learning session state
// Safe, bounded types for session tracking, checkpoints,
// follow-up practice, and tutor context integration.
// ─────────────────────────────────────────────────────────────

// ── Status Enums ──

export type VideoLearningSessionStatus =
  | 'recommended'
  | 'selected'
  | 'active'
  | 'paused'
  | 'completed'
  | 'abandoned'
  | 'cleared';

export type VideoLearningProgressSource =
  | 'learner_selected'
  | 'chat_recommendation'
  | 'watch_progress'
  | 'learner_reported'
  | 'checkpoint_answer'
  | 'system_inferred'
  | 'teacher_marked';

export type VideoLearningCheckpointStatus =
  | 'not_started'
  | 'asked'
  | 'answered'
  | 'passed'
  | 'needs_review'
  | 'skipped';

export type VideoFollowUpStatus =
  | 'not_created'
  | 'recommended'
  | 'assigned'
  | 'completed'
  | 'skipped';

// ── Core Session Contracts ──

export interface VideoLearningCheckpoint {
  checkpointId: string;
  videoTimestampSeconds?: number | null;
  topic?: string | null;
  prompt: string;
  expectedAnswerSummary?: string | null;
  learnerAnswerSummary?: string | null;
  status: VideoLearningCheckpointStatus;
  createdAt: string;
  answeredAt?: string | null;
}

export interface VideoLearningSessionSafety {
  sourceTrustStatus?: string | null;
  ageSuitabilityStatus?: string | null;
  islamicAppropriatenessStatus?: string | null;
  languageSuitabilityStatus?: string | null;
  needsTeacherReview: boolean;
  warnings: string[];
}

export interface VideoLearningSessionProgress {
  watchedSeconds?: number | null;
  watchedPercent?: number | null;
  lastKnownPositionSeconds?: number | null;
  completedAt?: string | null;
  updatedAt: string;
  source: VideoLearningProgressSource;
}

export interface VideoLearningSessionFollowUp {
  status: VideoFollowUpStatus;
  recommendedPracticeIds: string[];
  nextPracticePrompt?: string | null;
  dueAt?: string | null;
}

export interface VideoLearningSession {
  sessionVideoId: string;
  tutorSessionId?: string | null;

  provider?: string | null;
  providerVideoId?: string | null;
  canonicalUrl?: string | null;

  title: string;
  channelTitle?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;

  status: VideoLearningSessionStatus;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];
  syllabusObjectiveIds: string[];
  activeArtifactIds: string[];

  triggerMessage?: string | null;
  triggerIntent?: string | null;
  triggerTaskKind?: string | null;

  recommendationId?: string | null;
  recommendationReasons: string[];
  recommendationWarnings: string[];

  safety: VideoLearningSessionSafety;

  progress: VideoLearningSessionProgress;

  checkpoints: VideoLearningCheckpoint[];

  followUp: VideoLearningSessionFollowUp;

  createdAt: string;
  updatedAt: string;
}

export interface VideoLearningSessionState {
  activeVideoSession?: VideoLearningSession | null;
  recentVideoSessions: VideoLearningSession[];
  recommendedVideoSessions: VideoLearningSession[];

  /**
   * Optional video-aware practice loop state.
   * Tracks generated, answered, and reviewed practice sessions
   * linked to video learning. Added by Video-Aware Practice Loop v1.
   */
  videoAwarePractice?: import('./videoAwarePracticeContracts').VideoAwarePracticeState | null;

  updatedAt: string;
}

// ── Request Contracts ──

export interface SelectVideoLearningSessionRequest {
  sessionId?: string | null;
  recommendationId?: string | null;
  provider?: string | null;
  providerVideoId?: string | null;
  canonicalUrl?: string | null;
  title: string;
  channelTitle?: string | null;
  thumbnailUrl?: string | null;
  durationSeconds?: number | null;
  subject?: string | null;
  topic?: string | null;
  skillIds?: string[];
  activeArtifactIds?: string[];
  recommendationReasons?: string[];
  recommendationWarnings?: string[];
  safety?: Partial<VideoLearningSessionSafety>;
}

export interface UpdateVideoLearningProgressRequest {
  sessionVideoId: string;
  watchedSeconds?: number | null;
  watchedPercent?: number | null;
  lastKnownPositionSeconds?: number | null;
  source?: VideoLearningProgressSource;
}

export interface CreateVideoLearningCheckpointRequest {
  sessionVideoId: string;
  videoTimestampSeconds?: number | null;
  topic?: string | null;
  prompt: string;
  expectedAnswerSummary?: string | null;
}

export interface AnswerVideoLearningCheckpointRequest {
  sessionVideoId: string;
  checkpointId: string;
  learnerAnswerSummary: string;
}

export interface CompleteVideoLearningSessionRequest {
  sessionVideoId: string;
  watchedSeconds?: number | null;
  watchedPercent?: number | null;
  completionReason?: string | null;
}

export interface PauseVideoLearningSessionRequest {
  sessionVideoId: string;
}

export interface AbandonVideoLearningSessionRequest {
  sessionVideoId: string;
}

export interface ClearVideoLearningSessionRequest {
  sessionVideoId?: string | null;
}

// ── Response Contracts ──

export interface VideoLearningSessionResponse {
  ok: true;
  state: VideoLearningSessionState;
  activeVideoSession?: VideoLearningSession | null;
  warnings: string[];
}

// ── Resolver Contracts ──

export interface VideoLearningSessionSafeContextSummary {
  hasActiveVideo: boolean;
  title?: string | null;
  topic?: string | null;
  skillIds: string[];
  progressSummary?: string | null;
  checkpointSummary?: string | null;
  followUpSummary?: string | null;
  warnings: string[];
}

export interface VideoLearningSessionResolverOutput {
  activeVideoSession?: VideoLearningSession | null;
  recentVideoSessions: VideoLearningSession[];
  safeContextSummary: VideoLearningSessionSafeContextSummary;
}

// ── Identity for video learning session operations ──

export interface VideoLearningSessionIdentity {
  schoolId: string;
  studentId: string;
  sessionId?: string | null;
}
