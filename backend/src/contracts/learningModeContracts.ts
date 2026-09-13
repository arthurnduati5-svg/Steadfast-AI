// ── Phase 2: Learning Mode Runtime & Safe Signal Backbone ──

export const LEARNING_MODES = [
  'normal',
  'focus',
  'exam',
  'quiz',
  'teach_back',
  'plan',
  'revision',
  'study_stream',
  'creative_stream',
  'course',
] as const;
export type LearningMode = typeof LEARNING_MODES[number];

export const MODE_SESSION_STATUSES = [
  'requested',
  'started',
  'active',
  'paused',
  'resumed',
  'completed',
  'cancelled',
  'expired',
  'failed',
] as const;
export type ModeSessionStatus = typeof MODE_SESSION_STATUSES[number];

export const MODE_STAGES = [
  'entry',
  'context_check',
  'goal_set',
  'attempting',
  'hinting',
  'repairing',
  'reflecting',
  'summarizing',
  'completed',
  'cancelled',
] as const;
export type ModeStage = typeof MODE_STAGES[number];

export const SIGNAL_TYPES = [
  'mode_entered',
  'mode_exited',
  'mode_stage_changed',
  'goal_set',
  'attempt_started',
  'attempt_submitted',
  'answer_quality_marked',
  'hint_requested',
  'hint_given',
  'stuck_detected',
  'recovery_detected',
  'mistake_detected',
  'repeated_mistake_detected',
  'step_successful',
  'reflection_detected',
  'teach_back_submitted',
  'readiness_check_submitted',
  'mode_summary_created',
  'support_action_selected',
  'support_action_effective',
] as const;
export type SignalType = typeof SIGNAL_TYPES[number];

export const HINT_LEVELS = [
  'attention_hint',
  'direction_hint',
  'rephrased_question',
  'smaller_step',
  'micro_example',
  'guided_completion',
] as const;
export type HintLevel = typeof HINT_LEVELS[number];

export const TIME_SPENT_BUCKETS = [
  'very_fast',
  'fast',
  'normal',
  'slow',
  'very_slow',
  'extreme',
] as const;
export type TimeSpentBucket = typeof TIME_SPENT_BUCKETS[number];

export const DIFFICULTY_BUCKETS = [
  'very_easy',
  'easy',
  'medium',
  'hard',
  'very_hard',
] as const;
export type DifficultyBucket = typeof DIFFICULTY_BUCKETS[number];

export const ANSWER_QUALITIES = [
  'correct',
  'partially_correct',
  'incorrect',
  'unclear',
  'skipped',
] as const;
export type AnswerQuality = typeof ANSWER_QUALITIES[number];

export const MISTAKE_CATEGORIES = [
  'conceptual',
  'procedural',
  'careless',
  'misreading',
  'prerequisite_gap',
  'language_barrier',
  'unknown',
] as const;
export type MistakeCategory = typeof MISTAKE_CATEGORIES[number];

export const RECOMMENDED_NEXT_ACTIONS = [
  'review_topic',
  'practice_more',
  'move_to_next_topic',
  'retake_assessment',
  'revision_suggested',
  'teacher_consult',
  'focus_mode_suggested',
  'exam_mode_suggested',
  'teach_back_suggested',
  'study_stream_suggested',
] as const;
export type RecommendedNextAction = typeof RECOMMENDED_NEXT_ACTIONS[number];

export const STUCK_SIGNALS = [
  'multiple_failed_attempts',
  'short_unclear_answer',
  'repeated_same_mistake',
  'long_inactivity_bucket',
  'student_confusion_signal',
  'off_topic_drift',
  'hint_ladder_escalation',
] as const;
export type StuckSignal = typeof STUCK_SIGNALS[number];

export const RECOVERY_SIGNALS = [
  'correct_after_hint',
  'improved_after_rephrase',
  'completed_micro_step',
  'explained_reasoning',
  'successful_teach_back',
  'self_corrected',
] as const;
export type RecoverySignal = typeof RECOVERY_SIGNALS[number];

export const SUPPORT_ACTION_TYPES = [
  'simplify',
  'use_example',
  'revisit_prerequisite',
  'ask_recall',
  'break_down',
  'visual_aid',
  'analogy',
  'rephrase',
  'mini_quiz',
  'teach_back_invite',
  'raise_confidence',
] as const;
export type SupportActionType = typeof SUPPORT_ACTION_TYPES[number];

export const CONFIDENCE_SIGNALS = [
  'high',
  'medium',
  'low',
  'very_low',
  'unknown',
] as const;
export type ConfidenceSignal = typeof CONFIDENCE_SIGNALS[number];

export const SOURCE_TYPES = [
  'student_initiated',
  'system_initiated',
  'teacher_initiated',
  'auto_detected',
] as const;
export type SourceType = typeof SOURCE_TYPES[number];

export const FORBIDDEN_METADATA_KEYS = [
  'rawText',
  'messageBody',
  'studentMessage',
  'aiResponse',
  'prompt',
  'providerResponse',
  'answerKey',
  'teacherOnlyNote',
  'safeguardingRawDetail',
  'token',
  'apiKey',
  'authorization',
  'cookie',
  'privateKey',
  'databaseUrl',
] as const;
export type ForbiddenMetadataKey = typeof FORBIDDEN_METADATA_KEYS[number];

// ── Request/Response Types ──

export interface StartModeSessionRequest {
  mode: LearningMode;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
}

export interface TransitionModeRequest {
  status?: ModeSessionStatus;
  stage?: ModeStage;
  reason?: string;
}

export interface RecordSignalRequest {
  signalType: SignalType;
  stage?: ModeStage;
  topicId?: string;
  subjectId?: string;
  skillId?: string;
  attemptNumber?: number;
  hintLevel?: HintLevel;
  answerQuality?: AnswerQuality;
  mistakeCategory?: MistakeCategory;
  supportActionType?: SupportActionType;
  confidenceSignal?: ConfidenceSignal;
  timeSpentBucket?: TimeSpentBucket;
  difficultyBucket?: DifficultyBucket;
  sourceType?: SourceType;
}

export interface RecordAttemptRequest {
  stage: ModeStage;
  attemptNumber: number;
  answerQuality?: AnswerQuality;
  isCorrect?: boolean;
  mistakeCategory?: MistakeCategory;
  usedHint?: boolean;
  hintLevel?: HintLevel;
  timeSpentBucket?: TimeSpentBucket;
  topicId?: string;
  skillId?: string;
}

export interface RecordHintRequest {
  hintLevel: HintLevel;
  stage?: ModeStage;
  attemptNumber?: number;
  wasRequestedByStudent?: boolean;
  wasSuggestedBySystem?: boolean;
}

export interface ModeSessionResponse {
  id: string;
  schoolId: string;
  studentId: string;
  conversationId?: string;
  mode: string;
  status: string;
  stage: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  requestedAt: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModeExitSummaryResponse {
  id: string;
  modeSessionId: string;
  mode: string;
  topicId?: string;
  subjectId?: string;
  skillsTouched: string[];
  strengthSignals: string[];
  weaknessSignals: string[];
  hintsUsedCount: number;
  attemptsCount: number;
  stuckCount: number;
  recoveryCount: number;
  finalUnderstandingLevel?: string;
  recommendedNextAction?: string;
  createdAt: string;
}
