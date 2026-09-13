export const QUIZ_MODE_STATUSES = [
  'active',
  'paused',
  'submitted',
  'completed',
  'cancelled',
  'expired',
  'failed',
] as const;
export type QuizModeStatus = typeof QUIZ_MODE_STATUSES[number];

export const QUIZ_MODE_STAGES = [
  'awaiting_quiz_target',
  'ready_to_start',
  'reading_question',
  'attempting_question',
  'answer_submitted',
  'feedback_locked',
  'feedback_ready',
  'reviewing_feedback',
  'repairing_mistake',
  'reflection_check',
  'moving_next',
  'summary_ready',
  'submitted',
  'completed',
  'cancelled',
  'failed',
] as const;
export type QuizModeStage = typeof QUIZ_MODE_STAGES[number];

export const QUIZ_MODE_SESSION_TYPES = [
  'quick_quiz',
  'topic_quiz',
  'weak_topic_quiz',
  'retrieval_practice',
  'spaced_review_quiz',
  'teacher_assigned_quiz',
  'mixed_review_quiz',
  'diagnostic_quiz',
] as const;
export type QuizModeSessionType = typeof QUIZ_MODE_SESSION_TYPES[number];

export const QUIZ_MODE_TARGET_TYPES = [
  'quiz_set',
  'single_question',
  'topic_question_set',
  'weak_topic_set',
  'spaced_review_set',
  'teacher_assigned_item',
  'approved_content_item',
  'diagnostic_set',
  'mixed_review_set',
] as const;
export type QuizModeTargetType = typeof QUIZ_MODE_TARGET_TYPES[number];

export const QUIZ_MODE_GOAL_CATEGORIES = [
  'check_understanding',
  'practice_recall',
  'review_weak_topic',
  'spaced_repetition',
  'prepare_for_test',
  'complete_teacher_assignment',
  'diagnose_readiness',
  'build_confidence',
] as const;
export type QuizModeGoalCategory = typeof QUIZ_MODE_GOAL_CATEGORIES[number];

export const QUIZ_MODE_QUESTION_STATUSES = [
  'not_started',
  'active',
  'attempted',
  'feedback_ready',
  'flagged',
  'skipped',
  'locked_for_review',
  'completed',
] as const;
export type QuizModeQuestionStatus = typeof QUIZ_MODE_QUESTION_STATUSES[number];

export const QUIZ_MODE_ANSWER_QUALITIES = [
  'unanswered',
  'blank',
  'unclear',
  'incorrect',
  'partially_correct',
  'mostly_correct',
  'correct',
  'not_evaluated',
] as const;
export type QuizModeAnswerQuality = typeof QUIZ_MODE_ANSWER_QUALITIES[number];

export const QUIZ_MODE_MISTAKE_CATEGORIES = [
  'conceptual',
  'procedural',
  'careless',
  'prerequisite_gap',
  'language_confusion',
  'retrieval_failure',
  'misread_question',
  'off_topic',
  'unknown',
  'none',
] as const;
export type QuizModeMistakeCategory = typeof QUIZ_MODE_MISTAKE_CATEGORIES[number];

export const QUIZ_MODE_SCORE_BUCKETS = [
  'not_scored',
  'zero',
  'low',
  'partial',
  'near_full',
  'full',
] as const;
export type QuizModeScoreBucket = typeof QUIZ_MODE_SCORE_BUCKETS[number];

export const QUIZ_MODE_RETRIEVAL_SIGNALS = [
  'not_attempted',
  'retrieved_fast',
  'retrieved_slow',
  'retrieved_with_hint',
  'partial_recall',
  'failed_recall',
  'recognition_only',
  'unknown',
] as const;
export type QuizModeRetrievalSignal = typeof QUIZ_MODE_RETRIEVAL_SIGNALS[number];

export const QUIZ_MODE_RECALL_STRENGTH_BUCKETS = [
  'unknown',
  'not_attempted',
  'weak',
  'emerging',
  'stable',
  'strong',
] as const;
export type QuizModeRecallStrengthBucket = typeof QUIZ_MODE_RECALL_STRENGTH_BUCKETS[number];

export const QUIZ_MODE_PRACTICE_NEEDS = [
  'try_again_now',
  'review_foundation',
  'add_to_revision',
  'schedule_spaced_review',
  'move_next',
  'increase_challenge',
  'teacher_support',
] as const;
export type QuizModePracticeNeed = typeof QUIZ_MODE_PRACTICE_NEEDS[number];

export const QUIZ_MODE_FEEDBACK_POLICY_DECISIONS = [
  'require_attempt_first',
  'allow_correctness_signal_only',
  'allow_process_feedback',
  'allow_hint_only',
  'allow_retry',
  'allow_move_next',
  'recommend_revision',
  'recommend_teacher_support',
  'block_answer_key_request',
  'safe_content_gap_referral',
  'safe_deen_referral',
  'block_unsafe_request',
] as const;
export type QuizModeFeedbackPolicyDecision = typeof QUIZ_MODE_FEEDBACK_POLICY_DECISIONS[number];

export const QUIZ_MODE_ANSWER_PROTECTION_DECISIONS = [
  'allow_process_help',
  'require_attempt_first',
  'allow_hint_only',
  'allow_feedback_on_attempt',
  'block_answer_key_request',
  'safe_content_gap_referral',
  'safe_deen_referral',
  'block_unsafe_request',
] as const;
export type QuizModeAnswerProtectionDecision = typeof QUIZ_MODE_ANSWER_PROTECTION_DECISIONS[number];

export const QUIZ_MODE_EXIT_REASONS = [
  'student_submitted',
  'student_exited',
  'student_cancelled',
  'time_expired',
  'teacher_ended',
  'system_error',
  'replaced_by_new_session',
] as const;
export type QuizModeExitReason = typeof QUIZ_MODE_EXIT_REASONS[number];

export const QUIZ_MODE_REASON_CODES = [
  'quiz_started',
  'quiz_target_set',
  'question_started',
  'question_attempted',
  'answer_quality_marked',
  'recall_success_detected',
  'partial_recall_detected',
  'recall_failure_detected',
  'question_skipped',
  'question_flagged',
  'mistake_detected',
  'repeated_mistake_detected',
  'stuck_detected',
  'recovery_detected',
  'hint_requested',
  'hint_given',
  'reflection_detected',
  'support_action_selected',
  'quiz_summary_created',
  'quiz_submitted',
  'quiz_exited',
  'quiz_cancelled',
  'quiz_replaced',
  'content_gap',
  'deen_uncertain',
  'answer_key_blocked',
  'unsafe_blocked',
  'no_active_session',
  'invalid_transition',
] as const;
export type QuizModeReasonCode = typeof QUIZ_MODE_REASON_CODES[number];

export const FORBIDDEN_QUIZ_MODE_FIELDS = [
  'rawText',
  'questionText',
  'quizQuestionText',
  'studentMessage',
  'messageBody',
  'answerText',
  'studentAnswer',
  'rawAnswer',
  'aiResponse',
  'prompt',
  'providerResponse',
  'answerKey',
  'markingScheme',
  'modelAnswer',
  'correctAnswer',
  'expectedAnswer',
  'teacherOnlyNote',
  'safeguardingRawDetail',
  'deenSensitivePrivateText',
  'privateDisclosure',
  'rawConversation',
  'rawTranscript',
  'token',
  'apiKey',
  'authorization',
  'cookie',
  'privateKey',
  'databaseUrl',
  'connectionString',
] as const;
export type ForbiddenQuizModeField = typeof FORBIDDEN_QUIZ_MODE_FIELDS[number];

export const QUIZ_MODE_CONFIDENCE_BUCKETS = [
  'very_low',
  'low',
  'medium',
  'high',
  'very_high',
] as const;
export type QuizModeConfidenceBucket = typeof QUIZ_MODE_CONFIDENCE_BUCKETS[number];

export const QUIZ_MODE_TIME_SPENT_BUCKETS = [
  'under_1_min',
  '1_5_min',
  '5_10_min',
  '10_20_min',
  '20_40_min',
  'over_40_min',
  'unknown',
] as const;
export type QuizModeTimeSpentBucket = typeof QUIZ_MODE_TIME_SPENT_BUCKETS[number];

export const QUIZ_MODE_RECALL_STRENGTH_SIGNALS = [
  'retrieved_strong',
  'retrieved_stable',
  'retrieved_emerging',
  'retrieved_weak',
  'not_retrieved',
  'unknown',
] as const;
export type QuizModeRecallStrengthSignal = typeof QUIZ_MODE_RECALL_STRENGTH_SIGNALS[number];

export interface QuizModeSession {
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
  quizSetRef?: string;
  targetType: string;
  quizGoalCategory: string;
  quizSessionType: string;
  status: string;
  currentStage: string;
  currentQuestionIndex: number;
  questionCount: number;
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  skippedCount: number;
  flaggedCount: number;
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  submittedAt?: string;
  endedAt?: string;
}

export interface QuizModeQuestionState {
  id: string;
  quizSessionId: string;
  modeSessionId: string;
  questionKey: string;
  questionIndex: number;
  questionRef?: string;
  questionFingerprint?: string;
  topicId?: string;
  skillId?: string;
  difficultyBucket?: string;
  status: string;
  attemptNumber: number;
  answerQuality?: string;
  isCorrect?: boolean;
  mistakeCategory?: string;
  confidenceBucket?: string;
  timeSpentBucket?: string;
  scoreBucket?: string;
  retrievalSignal?: string;
  selectedTutorAction?: string;
  hintLevel?: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface QuizModeAttempt {
  id: string;
  quizSessionId: string;
  modeSessionId: string;
  questionKey: string;
  questionIndex: number;
  questionRef?: string;
  stage: string;
  attemptNumber: number;
  answerQuality?: string;
  isCorrect?: boolean;
  mistakeCategory?: string;
  usedHint: boolean;
  hintLevel?: string;
  timeSpentBucket?: string;
  confidenceBucket?: string;
  scoreBucket?: string;
  retrievalSignal?: string;
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface QuizModeSummary {
  id: string;
  quizSessionId: string;
  modeSessionId: string;
  finalStage: string;
  exitReason: string;
  questionCount: number;
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  skippedCount: number;
  flaggedCount: number;
  estimatedRecallStrengthBucket?: string;
  estimatedReadinessBucket?: string;
  masterySignal?: string;
  summarySignal: Record<string, unknown>;
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface QuizModeState {
  session: QuizModeSession;
  currentStage: string;
  currentQuestionState?: QuizModeQuestionState;
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  skippedCount: number;
  flaggedCount: number;
  nextAction?: {
    selectedAction: string;
    hintLevel?: string;
    supportLevel: string;
    learnerNeedCategory: string;
    reasonCodes: string[];
    recallStrengthBucket?: string;
    practiceNeed?: string;
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

export interface QuizModeStartRequest {
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  targetType: string;
  approvedContentRef?: string;
  quizSetRef?: string;
  quizGoalCategory: string;
  quizSessionType: string;
  questionCount: number;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  replaceExisting?: boolean;
}

export interface QuizModeQuestionAdvanceRequest {
  questionKey: string;
  questionIndex: number;
  questionRef?: string;
  questionFingerprint?: string;
}

export interface QuizModeAttemptRequest {
  questionKey: string;
  questionIndex: number;
  questionRef?: string;
  questionFingerprint?: string;
  answerQuality: string;
  mistakeCategory?: string;
  usedHint?: boolean;
  timeSpentBucket?: string;
  confidenceBucket?: string;
  scoreBucket?: string;
  safeEvidenceRefs?: string[];
}

export interface QuizModeHintRequest {
  requestedByStudent?: boolean;
}

export interface QuizModeFeedbackRequest {
  questionKey: string;
  questionIndex: number;
}

export interface QuizModeSubmitRequest {
  reason?: string;
}

export interface QuizModeExitRequest {
  reason?: string;
}

export interface QuizModeStateResponse {
  ok: boolean;
  quizMode: {
    sessionId: string;
    modeSessionId: string;
    status: string;
    currentStage: string;
    currentQuestionIndex: number;
    questionCount: number;
    currentQuestionState?: {
      questionKey: string;
      questionIndex: number;
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
    correctCount: number;
    partialCount: number;
    incorrectCount: number;
    hintCount: number;
    stuckCount: number;
    recoveryCount: number;
    skippedCount: number;
    flaggedCount: number;
    safeReasonCodes: string[];
  };
}

export interface RecallClassificationResult {
  retrievalSignal: string;
  recallStrengthBucket: string;
  practiceNeed: string;
  safeReasonCodes: string[];
}

export interface FeedbackPolicyResult {
  decision: string;
  reasonCodes: string[];
  allowCorrectnessSignal: boolean;
  allowProcessFeedback: boolean;
  allowHintOnly: boolean;
  allowRetry: boolean;
  allowMoveNext: boolean;
  recommendRevision: boolean;
  recommendTeacherSupport: boolean;
}

export interface AnswerProtectionResult {
  decision: string;
  reasonCodes: string[];
  allowProcessHelp: boolean;
  allowHintOnly: boolean;
  allowFeedbackOnAttempt: boolean;
}
