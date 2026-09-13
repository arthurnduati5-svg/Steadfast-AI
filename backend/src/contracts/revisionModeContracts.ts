export const REVISION_MODE_STATUSES = [
  'active', 'paused', 'submitted', 'completed', 'cancelled', 'expired', 'failed',
] as const;
export type RevisionModeStatus = typeof REVISION_MODE_STATUSES[number];

export const REVISION_MODE_STAGES = [
  'awaiting_revision_target', 'building_queue', 'ready_to_start', 'reviewing_item',
  'recalling', 'recall_submitted', 'feedback_locked', 'feedback_ready',
  'repairing_gap', 'retrying_item', 'reflection_check',
  'scheduling_next_review', 'moving_next', 'summary_ready',
  'submitted', 'completed', 'cancelled', 'failed',
] as const;
export type RevisionModeStage = typeof REVISION_MODE_STAGES[number];

export const REVISION_MODE_SESSION_TYPES = [
  'quick_revision', 'spaced_review', 'weak_topic_revision',
  'mistake_repair_revision', 'post_quiz_revision', 'post_exam_revision',
  'post_teach_back_revision', 'teacher_assigned_revision',
  'mixed_revision', 'diagnostic_revision',
] as const;
export type RevisionModeSessionType = typeof REVISION_MODE_SESSION_TYPES[number];

export const REVISION_MODE_QUEUE_TYPES = [
  'manual_revision_queue', 'weak_topic_queue', 'spaced_review_queue',
  'mistake_repair_queue', 'post_quiz_queue', 'post_exam_queue',
  'post_teach_back_queue', 'teacher_assigned_queue', 'mixed_queue',
  'diagnostic_queue',
] as const;
export type RevisionModeQueueType = typeof REVISION_MODE_QUEUE_TYPES[number];

export const REVISION_MODE_QUEUE_STATUSES = [
  'draft', 'active', 'paused', 'completed', 'cancelled', 'expired', 'failed',
] as const;
export type RevisionModeQueueStatus = typeof REVISION_MODE_QUEUE_STATUSES[number];

export const REVISION_MODE_SOURCE_TYPES = [
  'manual', 'learning_profile', 'weak_topic_detection', 'mistake_pattern',
  'quiz_summary', 'exam_summary', 'teach_back_summary', 'focus_summary',
  'teacher_assignment', 'approved_content', 'mixed',
] as const;
export type RevisionModeSourceType = typeof REVISION_MODE_SOURCE_TYPES[number];

export const REVISION_MODE_TARGET_TYPES = [
  'concept', 'topic', 'skill', 'revision_item', 'weak_topic',
  'mistake_pattern', 'quiz_item', 'exam_item', 'teach_back_item',
  'focus_item', 'teacher_assigned_item', 'approved_content_item',
  'mixed_review_item',
] as const;
export type RevisionModeTargetType = typeof REVISION_MODE_TARGET_TYPES[number];

export const REVISION_MODE_GOAL_CATEGORIES = [
  'recall_practice', 'strengthen_weak_topic', 'repair_mistake',
  'spaced_review', 'post_quiz_reinforce', 'post_exam_review',
  'post_teach_back_review', 'teacher_assigned_review',
  'mixed_review', 'diagnostic_assessment',
] as const;
export type RevisionModeGoalCategory = typeof REVISION_MODE_GOAL_CATEGORIES[number];

export const REVISION_MODE_ITEM_STATUSES = [
  'not_started', 'active', 'attempted', 'feedback_ready',
  'retry_requested', 'scheduled', 'pinned', 'skipped',
  'completed', 'cancelled', 'failed',
] as const;
export type RevisionModeItemStatus = typeof REVISION_MODE_ITEM_STATUSES[number];

export const REVISION_MODE_RECALL_QUALITIES = [
  'not_attempted', 'blank', 'forgotten', 'unclear', 'incorrect',
  'partial', 'mostly_recalled', 'recalled', 'strong_recall', 'not_evaluated',
] as const;
export type RevisionModeRecallQuality = typeof REVISION_MODE_RECALL_QUALITIES[number];

export const REVISION_MODE_RETRIEVAL_SIGNALS = [
  'not_attempted', 'retrieved_fast', 'retrieved_slow',
  'retrieved_with_hint', 'partial_recall', 'failed_recall',
  'recognition_only', 'unknown',
] as const;
export type RevisionModeRetrievalSignal = typeof REVISION_MODE_RETRIEVAL_SIGNALS[number];

export const REVISION_MODE_MISTAKE_CATEGORIES = [
  'none', 'conceptual', 'procedural', 'careless',
  'prerequisite_gap', 'language_confusion', 'retrieval_failure',
  'misread_prompt', 'off_topic', 'unknown',
] as const;
export type RevisionModeMistakeCategory = typeof REVISION_MODE_MISTAKE_CATEGORIES[number];

export const REVISION_MODE_SUPPORT_NEEDS = [
  'none', 'try_again', 'review_foundation', 'repair_mistake',
  'use_focus_mode', 'use_quiz_mode', 'use_teach_back_mode',
  'schedule_spaced_review', 'teacher_support', 'content_gap_referral',
  'deen_referral',
] as const;
export type RevisionModeSupportNeed = typeof REVISION_MODE_SUPPORT_NEEDS[number];

export const REVISION_MODE_MASTERY_SIGNALS = [
  'no_data_yet', 'not_ready', 'emerging', 'developing',
  'ready_with_support', 'ready_independent', 'strong',
] as const;
export type RevisionModeMasterySignal = typeof REVISION_MODE_MASTERY_SIGNALS[number];

export const REVISION_MODE_READINESS_SIGNALS = [
  'unknown', 'needs_review', 'needs_retry', 'almost_ready',
  'ready_to_move_on', 'ready_for_challenge', 'teacher_review_recommended',
] as const;
export type RevisionModeReadinessSignal = typeof REVISION_MODE_READINESS_SIGNALS[number];

export const REVISION_MODE_RECALL_STRENGTH_BUCKETS = [
  'unknown', 'not_attempted', 'weak', 'emerging', 'stable', 'strong',
] as const;
export type RevisionModeRecallStrengthBucket = typeof REVISION_MODE_RECALL_STRENGTH_BUCKETS[number];

export const REVISION_MODE_REVIEW_INTERVAL_BUCKETS = [
  'none', 'same_session_retry', 'later_today', 'tomorrow',
  'three_days', 'one_week', 'two_weeks', 'one_month',
  'teacher_review', 'content_gap', 'deen_referral',
] as const;
export type RevisionModeReviewIntervalBucket = typeof REVISION_MODE_REVIEW_INTERVAL_BUCKETS[number];

export const REVISION_MODE_BRIDGE_RECOMMENDATIONS = [
  'continue_revision', 'start_quiz_mode', 'start_teach_back_mode',
  'start_focus_mode', 'recommend_teacher_support',
  'safe_content_gap_referral', 'safe_deen_referral',
] as const;
export type RevisionModeBridgeRecommendation = typeof REVISION_MODE_BRIDGE_RECOMMENDATIONS[number];

export const REVISION_MODE_EXIT_REASONS = [
  'student_completed', 'student_exited', 'teacher_ended', 'time_expired',
  'all_items_completed', 'student_cancelled', 'session_failed',
  'content_gap', 'deen_referral', 'teacher_review_recommended',
] as const;
export type RevisionModeExitReason = typeof REVISION_MODE_EXIT_REASONS[number];

export const REVISION_MODE_REASON_CODES = [
  'teacher_assigned_priority', 'weak_topic_detected', 'mistake_pattern_detected',
  'post_quiz_weakness', 'post_exam_weakness', 'post_teach_back_weakness',
  'spaced_review_due', 'student_requested', 'curriculum_aligned',
  'content_gap_detected', 'deen_uncertainty_detected', 'answer_key_risk',
  'model_answer_risk', 'revision_integrity_risk', 'block_unsafe',
  'block_answer_key', 'block_model_answer', 'low_confidence',
] as const;
export type RevisionModeReasonCode = typeof REVISION_MODE_REASON_CODES[number];

export const FORBIDDEN_REVISION_MODE_FIELDS = [
  'rawText', 'revisionText', 'savedText', 'noteText', 'rawNote',
  'questionText', 'promptText', 'studentMessage', 'messageBody',
  'answerText', 'studentAnswer', 'rawAnswer', 'studentExplanation',
  'rawExplanation', 'explanationText', 'aiResponse', 'prompt',
  'providerResponse', 'answerKey', 'markingScheme', 'modelAnswer',
  'correctAnswer', 'expectedAnswer', 'teacherOnlyNote',
  'safeguardingRawDetail', 'deenSensitivePrivateText', 'privateDisclosure',
  'rawConversation', 'rawTranscript', 'transcript', 'audioBlob',
  'audioUrl', 'recordingUrl', 'token', 'apiKey', 'authorization',
  'cookie', 'privateKey', 'databaseUrl', 'connectionString',
] as const;
export type ForbiddenRevisionModeField = typeof FORBIDDEN_REVISION_MODE_FIELDS[number];

export interface RevisionModeSession {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  modeSessionId: string;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  approvedContentRef?: string;
  targetRef?: string;
  revisionGoalCategory: string;
  revisionSessionType: string;
  status: string;
  currentStage: string;
  currentItemIndex: number;
  itemCount: number;
  attemptCount: number;
  weakRecallCount: number;
  strongRecallCount: number;
  mistakeCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  reflectionCount: number;
  completedItemCount: number;
  skippedItemCount: number;
  pinnedItemCount: number;
  safeEvidenceRefsJson: any;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date;
  submittedAt?: Date;
  endedAt?: Date;
}

export interface RevisionModeQueue {
  id: string;
  schoolId: string;
  studentId: string;
  revisionSessionId?: string;
  modeSessionId?: string;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  queueType: string;
  queueStatus: string;
  sourceType: string;
  sourceRefsJson: any;
  itemCount: number;
  currentItemIndex: number;
  dueItemCount: number;
  completedItemCount: number;
  skippedItemCount: number;
  pinnedItemCount: number;
  safeReasonCodesJson: any;
  safeEvidenceRefsJson: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface RevisionModeItemState {
  id: string;
  schoolId: string;
  studentId: string;
  revisionSessionId: string;
  revisionQueueId?: string;
  modeSessionId: string;
  itemKey: string;
  itemIndex: number;
  targetType: string;
  targetRef?: string;
  approvedContentRef?: string;
  sourceMode?: string;
  sourceSessionRef?: string;
  sourceSummaryRef?: string;
  contentFingerprint?: string;
  topicId?: string;
  skillId?: string;
  difficultyBucket?: string;
  priorityBucket?: string;
  status: string;
  attemptNumber: number;
  recallQuality?: string;
  retrievalSignal?: string;
  mistakeCategory?: string;
  explanationQuality?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
  selectedTutorAction?: string;
  hintLevel?: string;
  dueAt?: Date;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  reviewIntervalBucket?: string;
  safeReasonCodesJson: any;
  safeEvidenceRefsJson: any;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface RevisionModeAttempt {
  id: string;
  schoolId: string;
  studentId: string;
  revisionSessionId: string;
  revisionQueueId?: string;
  revisionItemStateId?: string;
  modeSessionId: string;
  itemKey: string;
  itemIndex: number;
  targetRef?: string;
  stage: string;
  attemptNumber: number;
  recallQuality: string;
  retrievalSignal?: string;
  mistakeCategory?: string;
  explanationQuality?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
  usedHint: boolean;
  hintLevel?: string;
  safeEvidenceRefsJson: any;
  createdAt: Date;
}

export interface RevisionModeSummary {
  id: string;
  schoolId: string;
  studentId: string;
  revisionSessionId: string;
  revisionQueueId?: string;
  modeSessionId: string;
  finalStage: string;
  exitReason: string;
  itemCount: number;
  attemptCount: number;
  weakRecallCount: number;
  strongRecallCount: number;
  mistakeCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  reflectionCount: number;
  completedItemCount: number;
  skippedItemCount: number;
  pinnedItemCount: number;
  estimatedRecallStrengthBucket?: string;
  estimatedReadinessSignal?: string;
  masterySignal?: string;
  nextReviewAt?: Date;
  summarySignalJson: any;
  safeEvidenceRefsJson: any;
  createdAt: Date;
}

export interface RevisionModeState {
  session: RevisionModeSession;
  queue?: RevisionModeQueue;
  currentItem?: RevisionModeItemState;
  attempts: RevisionModeAttempt[];
  summary?: RevisionModeSummary;
}

export interface RevisionModeStartRequest {
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  approvedContentRef?: string;
  targetRef?: string;
  revisionGoalCategory?: string;
  revisionSessionType?: string;
  replaceExisting?: boolean;
  conversationId?: string;
  queueType?: string;
  sourceType?: string;
  targetRefs?: string[];
}

export interface RevisionModeQueueCreateRequest {
  queueType: string;
  sourceType: string;
  targetRefs?: string[];
}

export interface RevisionModeItemAddRequest {
  targetType: string;
  targetRef?: string;
  approvedContentRef?: string;
  sourceMode?: string;
  sourceSessionRef?: string;
  sourceSummaryRef?: string;
  contentFingerprint?: string;
  topicId?: string;
  skillId?: string;
  difficultyBucket?: string;
  priorityBucket?: string;
  itemKey?: string;
}

export interface RevisionModeItemAdvanceRequest {
  itemKey: string;
}

export interface RevisionModeAttemptRequest {
  itemKey: string;
  recallQuality: string;
  retrievalSignal?: string;
  mistakeCategory?: string;
  explanationQuality?: string;
  usedHint?: boolean;
  hintLevel?: string;
}

export interface RevisionModeHintRequest {
  itemKey: string;
}

export interface RevisionModeReflectRequest {
  itemKey: string;
  readinessSignal?: string;
  masterySignal?: string;
}

export interface RevisionModeScheduleRequest {
  itemKey: string;
}

export interface RevisionModeBridgeRequest {
  itemKey?: string;
  targetMode?: string;
}

export interface RevisionModeSubmitRequest {
  exitReason?: string;
}

export interface RevisionModeExitRequest {
  exitReason: string;
}

export interface RevisionModeStateResponse {
  ok: boolean;
  revisionMode: RevisionModeState | null;
  meta: {
    requestId: string;
    timestamp: string;
    route: string;
    method: string;
    contractVersion: string;
  };
}

export interface RecallClassificationResult {
  recallStrengthBucket: string;
  masterySignal: string;
  readinessSignal: string;
  supportNeed: string;
  nextReviewIntervalBucket: string;
  safeReasonCodes: string[];
}

export interface RevisionScheduleResult {
  nextReviewIntervalBucket: string;
  nextReviewAt?: Date;
  scheduleReasonCodes: string[];
}

export interface RevisionRecommendationResult {
  selectedItemKey?: string;
  selectedItemIndex?: number;
  selectedTargetRef?: string;
  selectionReasonCodes: string[];
  recommendedMode: string;
}

export interface RevisionModeBridgeResult {
  recommendation: string;
  targetSessionId?: string;
  targetMode?: string;
  targetRefs?: string[];
  reasonCodes: string[];
}
