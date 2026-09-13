export const TEACH_BACK_MODE_STATUSES = [
  'active', 'paused', 'submitted', 'completed', 'cancelled', 'expired', 'failed',
] as const;
export type TeachBackModeStatus = typeof TEACH_BACK_MODE_STATUSES[number];

export const TEACH_BACK_MODE_STAGES = [
  'awaiting_teach_back_target', 'ready_to_start', 'reading_prompt', 'explaining',
  'explanation_submitted', 'feedback_locked', 'feedback_ready', 'reviewing_feedback',
  'repairing_gap', 'retrying_explanation', 'reflection_check', 'moving_next',
  'summary_ready', 'submitted', 'completed', 'cancelled', 'failed',
] as const;
export type TeachBackModeStage = typeof TEACH_BACK_MODE_STAGES[number];

export const TEACH_BACK_MODE_SESSION_TYPES = [
  'single_concept_teach_back', 'topic_teach_back', 'weak_topic_teach_back',
  'post_quiz_teach_back', 'post_exam_review_teach_back', 'teacher_assigned_teach_back',
  'revision_teach_back', 'diagnostic_teach_back',
] as const;
export type TeachBackModeSessionType = typeof TEACH_BACK_MODE_SESSION_TYPES[number];

export const TEACH_BACK_MODE_TARGET_TYPES = [
  'concept', 'topic', 'skill', 'single_question', 'quiz_item', 'exam_item',
  'revision_item', 'teacher_assigned_item', 'approved_content_item',
  'weak_topic_set', 'misconception_review',
] as const;
export type TeachBackModeTargetType = typeof TEACH_BACK_MODE_TARGET_TYPES[number];

export const TEACH_BACK_MODE_GOAL_CATEGORIES = [
  'prove_understanding', 'strengthen_concept', 'repair_misconception',
  'review_weak_topic', 'after_quiz_reflection', 'after_exam_reflection',
  'prepare_for_test', 'complete_teacher_assignment', 'build_confidence',
] as const;
export type TeachBackModeGoalCategory = typeof TEACH_BACK_MODE_GOAL_CATEGORIES[number];

export const TEACH_BACK_MODE_PROMPT_STATUSES = [
  'not_started', 'active', 'explained', 'feedback_ready', 'retry_requested',
  'reflection_ready', 'completed', 'skipped', 'cancelled', 'failed',
] as const;
export type TeachBackModePromptStatus = typeof TEACH_BACK_MODE_PROMPT_STATUSES[number];

export const TEACH_BACK_MODE_EXPLANATION_QUALITIES = [
  'not_attempted', 'blank', 'unclear', 'incorrect', 'fragmented',
  'partially_clear', 'mostly_clear', 'clear', 'strong', 'not_evaluated',
] as const;
export type TeachBackModeExplanationQuality = typeof TEACH_BACK_MODE_EXPLANATION_QUALITIES[number];

export const TEACH_BACK_MODE_CONCEPT_COVERAGE_BUCKETS = [
  'unknown', 'missing_core_idea', 'mentions_core_idea', 'partial_coverage',
  'mostly_complete', 'complete', 'overextended_or_off_topic',
] as const;
export type TeachBackModeConceptCoverageBucket = typeof TEACH_BACK_MODE_CONCEPT_COVERAGE_BUCKETS[number];

export const TEACH_BACK_MODE_CLARITY_BUCKETS = [
  'unknown', 'very_unclear', 'unclear', 'somewhat_clear', 'clear', 'very_clear',
] as const;
export type TeachBackModeClarityBucket = typeof TEACH_BACK_MODE_CLARITY_BUCKETS[number];

export const TEACH_BACK_MODE_CONFIDENCE_BUCKETS = [
  'very_low', 'low', 'medium', 'high', 'very_high',
] as const;
export type TeachBackModeConfidenceBucket = typeof TEACH_BACK_MODE_CONFIDENCE_BUCKETS[number];

export const TEACH_BACK_MODE_MISCONCEPTION_SIGNALS = [
  'none', 'possible_misconception', 'confirmed_misconception', 'prerequisite_gap',
  'language_confusion', 'off_topic', 'overconfident_wrong', 'unknown',
] as const;
export type TeachBackModeMisconceptionSignal = typeof TEACH_BACK_MODE_MISCONCEPTION_SIGNALS[number];

export const TEACH_BACK_MODE_SUPPORT_NEEDS = [
  'none', 'try_again', 'ask_clarifying_question', 'review_foundation',
  'repair_misconception', 'give_smaller_prompt', 'teacher_support',
  'content_gap_referral', 'deen_referral',
] as const;
export type TeachBackModeSupportNeed = typeof TEACH_BACK_MODE_SUPPORT_NEEDS[number];

export const TEACH_BACK_MODE_MASTERY_SIGNALS = [
  'no_data_yet', 'not_ready', 'emerging', 'developing',
  'ready_with_support', 'ready_independent', 'strong',
] as const;
export type TeachBackModeMasterySignal = typeof TEACH_BACK_MODE_MASTERY_SIGNALS[number];

export const TEACH_BACK_MODE_READINESS_SIGNALS = [
  'unknown', 'needs_review', 'needs_retry', 'almost_ready',
  'ready_to_move_on', 'ready_for_challenge', 'teacher_review_recommended',
] as const;
export type TeachBackModeReadinessSignal = typeof TEACH_BACK_MODE_READINESS_SIGNALS[number];

export const TEACH_BACK_MODE_EXPLANATION_STRENGTH_BUCKETS = [
  'unknown', 'not_attempted', 'weak', 'emerging', 'developing', 'strong',
] as const;
export type TeachBackModeExplanationStrengthBucket = typeof TEACH_BACK_MODE_EXPLANATION_STRENGTH_BUCKETS[number];

export const TEACH_BACK_MODE_FEEDBACK_POLICY_DECISIONS = [
  'require_explanation_first', 'allow_clarity_signal_only', 'allow_process_feedback',
  'allow_retry', 'allow_smaller_prompt', 'allow_reflection', 'allow_move_next',
  'recommend_revision', 'recommend_teacher_support', 'block_model_answer_request',
  'block_answer_key_request', 'safe_content_gap_referral', 'safe_deen_referral',
  'block_unsafe_request',
] as const;
export type TeachBackModeFeedbackPolicyDecision = typeof TEACH_BACK_MODE_FEEDBACK_POLICY_DECISIONS[number];

export const TEACH_BACK_MODE_ANSWER_PROTECTION_DECISIONS = [
  'allow_process_help', 'require_explanation_first', 'allow_smaller_prompt',
  'allow_feedback_on_explanation', 'block_model_answer_request', 'block_answer_key_request',
  'safe_content_gap_referral', 'safe_deen_referral', 'block_unsafe_request',
] as const;
export type TeachBackModeAnswerProtectionDecision = typeof TEACH_BACK_MODE_ANSWER_PROTECTION_DECISIONS[number];

export const TEACH_BACK_MODE_EXIT_REASONS = [
  'student_submitted', 'student_exited', 'student_cancelled', 'time_expired',
  'teacher_ended', 'system_error', 'replaced_by_new_session',
] as const;
export type TeachBackModeExitReason = typeof TEACH_BACK_MODE_EXIT_REASONS[number];

export const TEACH_BACK_MODE_REASON_CODES = [
  'teach_back_started', 'teach_back_target_set', 'prompt_started', 'explanation_submitted',
  'explanation_quality_marked', 'strong_explanation_detected', 'partial_explanation_detected',
  'weak_explanation_detected', 'misconception_detected', 'repeated_misconception_detected',
  'stuck_detected', 'recovery_detected', 'hint_requested', 'hint_given',
  'reflection_detected', 'support_action_selected', 'teach_back_summary_created',
  'teach_back_submitted', 'teach_back_exited', 'teach_back_cancelled',
  'teach_back_replaced', 'content_gap', 'deen_uncertain', 'answer_key_blocked',
  'model_answer_blocked', 'unsafe_blocked', 'no_active_session', 'invalid_transition',
  'require_explanation_before_feedback',
] as const;
export type TeachBackModeReasonCode = typeof TEACH_BACK_MODE_REASON_CODES[number];

export const FORBIDDEN_TEACH_BACK_MODE_FIELDS = [
  'rawText', 'promptText', 'teachBackPromptText', 'studentExplanation',
  'rawExplanation', 'explanationText', 'studentMessage', 'messageBody',
  'answerText', 'studentAnswer', 'rawAnswer', 'aiResponse', 'prompt',
  'providerResponse', 'answerKey', 'markingScheme', 'modelAnswer', 'correctAnswer',
  'expectedAnswer', 'teacherOnlyNote', 'safeguardingRawDetail',
  'deenSensitivePrivateText', 'privateDisclosure', 'rawConversation',
  'rawTranscript', 'transcript', 'audioBlob', 'audioUrl', 'recordingUrl',
  'token', 'apiKey', 'authorization', 'cookie', 'privateKey',
  'databaseUrl', 'connectionString',
] as const;
export type ForbiddenTeachBackModeField = typeof FORBIDDEN_TEACH_BACK_MODE_FIELDS[number];

export interface TeachBackModeSession {
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
  promptSetRef?: string;
  targetType: string;
  teachBackGoalCategory: string;
  teachBackSessionType: string;
  status: string;
  currentStage: string;
  currentPromptIndex: number;
  promptCount: number;
  attemptCount: number;
  strongExplanationCount: number;
  partialExplanationCount: number;
  weakExplanationCount: number;
  misconceptionCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  reflectionCount: number;
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  submittedAt?: string;
  endedAt?: string;
}

export interface TeachBackModePromptState {
  id: string;
  teachBackSessionId: string;
  modeSessionId: string;
  promptKey: string;
  promptIndex: number;
  promptRef?: string;
  questionRef?: string;
  contentFingerprint?: string;
  topicId?: string;
  skillId?: string;
  difficultyBucket?: string;
  status: string;
  attemptNumber: number;
  explanationQuality?: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  confidenceBucket?: string;
  misconceptionSignal?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
  selectedTutorAction?: string;
  hintLevel?: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface TeachBackModeAttempt {
  id: string;
  teachBackSessionId: string;
  modeSessionId: string;
  promptKey: string;
  promptIndex: number;
  promptRef?: string;
  stage: string;
  attemptNumber: number;
  explanationQuality: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  confidenceBucket?: string;
  misconceptionSignal?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
  usedHint: boolean;
  hintLevel?: string;
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface TeachBackModeSummary {
  id: string;
  teachBackSessionId: string;
  modeSessionId: string;
  finalStage: string;
  exitReason: string;
  promptCount: number;
  attemptCount: number;
  strongExplanationCount: number;
  partialExplanationCount: number;
  weakExplanationCount: number;
  misconceptionCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  reflectionCount: number;
  estimatedExplanationStrengthBucket?: string;
  estimatedReadinessSignal?: string;
  masterySignal?: string;
  summarySignal: Record<string, unknown>;
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface TeachBackModeState {
  session: TeachBackModeSession;
  currentStage: string;
  currentPromptState?: TeachBackModePromptState;
  attemptCount: number;
  strongExplanationCount: number;
  partialExplanationCount: number;
  weakExplanationCount: number;
  misconceptionCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  reflectionCount: number;
  nextAction?: {
    selectedAction: string;
    hintLevel?: string;
    supportLevel: string;
    learnerNeedCategory: string;
    reasonCodes: string[];
    explanationStrengthBucket?: string;
    supportNeed?: string;
  };
  feedbackPolicy?: {
    decision: string;
    reasonCodes: string[];
  };
  answerProtection?: {
    decision: string;
    reasonCodes: string[];
  };
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export interface TeachBackModeStartRequest {
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  targetType: string;
  approvedContentRef?: string;
  targetRef?: string;
  promptSetRef?: string;
  teachBackGoalCategory: string;
  teachBackSessionType: string;
  promptCount: number;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  replaceExisting?: boolean;
}

export interface TeachBackModePromptAdvanceRequest {
  promptKey: string;
  promptIndex: number;
  promptRef?: string;
  questionRef?: string;
  contentFingerprint?: string;
}

export interface TeachBackModeExplanationAttemptRequest {
  promptKey: string;
  promptIndex: number;
  promptRef?: string;
  questionRef?: string;
  contentFingerprint?: string;
  explanationQuality: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  confidenceBucket?: string;
  misconceptionSignal?: string;
  usedHint?: boolean;
  safeEvidenceRefs?: string[];
}

export interface TeachBackModeHintRequest {
  requestedByStudent?: boolean;
}

export interface TeachBackModeFeedbackRequest {
  promptKey: string;
  promptIndex: number;
}

export interface TeachBackModeSubmitRequest {
  reason?: string;
}

export interface TeachBackModeExitRequest {
  reason?: string;
}

export interface TeachBackModeStateResponse {
  ok: boolean;
  teachBackMode: {
    sessionId: string;
    modeSessionId: string;
    status: string;
    currentStage: string;
    currentPromptIndex: number;
    promptCount: number;
    currentPromptState?: {
      promptKey: string;
      promptIndex: number;
      status: string;
    };
    nextAction?: {
      selectedAction: string;
      supportLevel: string;
      learnerNeedCategory: string;
    };
    answerProtection?: {
      decision: string;
    };
    feedbackPolicy?: {
      decision: string;
    };
    attemptCount: number;
    strongExplanationCount: number;
    partialExplanationCount: number;
    weakExplanationCount: number;
    misconceptionCount: number;
    hintCount: number;
    stuckCount: number;
    recoveryCount: number;
    reflectionCount: number;
    safeReasonCodes: string[];
  };
}

export interface ExplanationClassificationResult {
  explanationStrengthBucket: string;
  masterySignal: string;
  readinessSignal: string;
  supportNeed: string;
  safeReasonCodes: string[];
}

export interface FeedbackPolicyResult {
  decision: string;
  reasonCodes: string[];
  allowClaritySignalOnly: boolean;
  allowProcessFeedback: boolean;
  allowRetry: boolean;
  allowSmallerPrompt: boolean;
  allowReflection: boolean;
  allowMoveNext: boolean;
  recommendRevision: boolean;
  recommendTeacherSupport: boolean;
}

export interface AnswerProtectionResult {
  decision: string;
  reasonCodes: string[];
  allowProcessHelp: boolean;
  allowFeedbackOnExplanation: boolean;
  allowSmallerPrompt: boolean;
}
