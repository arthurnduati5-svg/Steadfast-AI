export const EXAM_MODE_STATUSES = [
  'active',
  'paused',
  'submitted',
  'completed',
  'cancelled',
  'expired',
  'failed',
] as const;
export type ExamModeStatus = typeof EXAM_MODE_STATUSES[number];

export const EXAM_MODE_STAGES = [
  'awaiting_exam_target',
  'ready_to_start',
  'reading_question',
  'attempting_question',
  'answer_submitted',
  'feedback_locked',
  'reviewing_process',
  'repairing_mistake',
  'reflection_check',
  'moving_next',
  'summary_ready',
  'submitted',
  'completed',
  'cancelled',
  'failed',
] as const;
export type ExamModeStage = typeof EXAM_MODE_STAGES[number];

export const EXAM_MODE_SESSION_TYPES = [
  'practice_exam',
  'timed_practice',
  'past_paper_practice',
  'topic_exam',
  'weak_topic_exam',
  'teacher_assigned_exam',
  'quick_check',
] as const;
export type ExamModeSessionType = typeof EXAM_MODE_SESSION_TYPES[number];

export const EXAM_MODE_TARGET_TYPES = [
  'paper',
  'section',
  'question_set',
  'single_question',
  'teacher_assigned_item',
  'approved_content_item',
  'weak_topic_set',
  'past_paper_item',
] as const;
export type ExamModeTargetType = typeof EXAM_MODE_TARGET_TYPES[number];

export const EXAM_MODE_GOAL_CATEGORIES = [
  'prepare_for_test',
  'practice_under_time',
  'review_weak_topic',
  'complete_teacher_assignment',
  'past_paper_practice',
  'diagnose_readiness',
  'build_confidence',
] as const;
export type ExamModeGoalCategory = typeof EXAM_MODE_GOAL_CATEGORIES[number];

export const EXAM_MODE_TIMER_MODES = [
  'untimed',
  'soft_timer',
  'strict_timer',
  'teacher_assigned_timer',
] as const;
export type ExamModeTimerMode = typeof EXAM_MODE_TIMER_MODES[number];

export const EXAM_MODE_DURATION_BUCKETS = [
  'under_5_min',
  '5_10_min',
  '10_20_min',
  '20_40_min',
  '40_60_min',
  'over_60_min',
  'unknown',
] as const;
export type ExamModeDurationBucket = typeof EXAM_MODE_DURATION_BUCKETS[number];

export const EXAM_MODE_TIME_PRESSURE_SIGNALS = [
  'none',
  'rushed',
  'slow_start',
  'ran_out_of_time',
  'paced_well',
  'unknown',
] as const;
export type ExamModeTimePressureSignal = typeof EXAM_MODE_TIME_PRESSURE_SIGNALS[number];

export const EXAM_MODE_QUESTION_STATUSES = [
  'not_started',
  'active',
  'attempted',
  'flagged',
  'skipped',
  'locked_for_review',
  'completed',
] as const;
export type ExamModeQuestionStatus = typeof EXAM_MODE_QUESTION_STATUSES[number];

export const EXAM_MODE_ANSWER_QUALITIES = [
  'unanswered',
  'blank',
  'unclear',
  'incorrect',
  'partially_correct',
  'mostly_correct',
  'correct',
  'not_evaluated',
] as const;
export type ExamModeAnswerQuality = typeof EXAM_MODE_ANSWER_QUALITIES[number];

export const EXAM_MODE_MISTAKE_CATEGORIES = [
  'conceptual',
  'procedural',
  'careless',
  'prerequisite_gap',
  'language_confusion',
  'time_management',
  'question_misread',
  'off_topic',
  'unknown',
  'none',
] as const;
export type ExamModeMistakeCategory = typeof EXAM_MODE_MISTAKE_CATEGORIES[number];

export const EXAM_MODE_SCORE_BUCKETS = [
  'not_scored',
  'zero',
  'low',
  'partial',
  'near_full',
  'full',
] as const;
export type ExamModeScoreBucket = typeof EXAM_MODE_SCORE_BUCKETS[number];

export const EXAM_MODE_EXIT_REASONS = [
  'student_submitted',
  'student_exited',
  'student_cancelled',
  'time_expired',
  'teacher_ended',
  'system_error',
  'replaced_by_new_session',
] as const;
export type ExamModeExitReason = typeof EXAM_MODE_EXIT_REASONS[number];

export const EXAM_MODE_ANSWER_PROTECTION_DECISIONS = [
  'allow_process_help',
  'require_attempt_first',
  'allow_hint_only',
  'allow_feedback_on_attempt',
  'block_answer_key_request',
  'safe_content_gap_referral',
  'safe_deen_referral',
  'block_unsafe_request',
] as const;
export type ExamModeAnswerProtectionDecision = typeof EXAM_MODE_ANSWER_PROTECTION_DECISIONS[number];

export const EXAM_MODE_REASON_CODES = [
  'exam_started',
  'exam_target_set',
  'question_started',
  'question_attempted',
  'answer_quality_marked',
  'question_skipped',
  'question_flagged',
  'mistake_detected',
  'repeated_mistake_detected',
  'stuck_detected',
  'recovery_detected',
  'hint_requested',
  'hint_given',
  'time_pressure_detected',
  'reflection_detected',
  'support_action_selected',
  'exam_summary_created',
  'exam_submitted',
  'exam_exited',
  'exam_cancelled',
  'exam_replaced',
  'content_gap',
  'deen_uncertain',
  'answer_key_blocked',
  'unsafe_blocked',
  'no_active_session',
  'invalid_transition',
] as const;
export type ExamModeReasonCode = typeof EXAM_MODE_REASON_CODES[number];

export const FORBIDDEN_EXAM_MODE_FIELDS = [
  'rawText',
  'questionText',
  'examQuestionText',
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
export type ForbiddenExamModeField = typeof FORBIDDEN_EXAM_MODE_FIELDS[number];

export const CONFIDENCE_BUCKETS = [
  'very_low',
  'low',
  'medium',
  'high',
  'very_high',
] as const;
export type ConfidenceBucket = typeof CONFIDENCE_BUCKETS[number];

export const ESTIMATED_READINESS_BUCKETS = [
  'not_ready',
  'developing',
  'almost_ready',
  'ready',
  'confident',
  'unknown',
] as const;
export type EstimatedReadinessBucket = typeof ESTIMATED_READINESS_BUCKETS[number];

export const MASTERY_SIGNALS = [
  'mastered',
  'developing',
  'emerging',
  'not_started',
  'unknown',
] as const;
export type MasterySignal = typeof MASTERY_SIGNALS[number];

export interface ExamModeSession {
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
  paperRef?: string;
  examSetRef?: string;
  targetType: string;
  examGoalCategory: string;
  examSessionType: string;
  timerMode: string;
  status: string;
  currentStage: string;
  currentQuestionIndex: number;
  questionCount: number;
  attemptCount: number;
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

export interface ExamModeQuestionState {
  id: string;
  examSessionId: string;
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
  selectedTutorAction?: string;
  hintLevel?: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ExamModeAttempt {
  id: string;
  examSessionId: string;
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
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface ExamModeSummary {
  id: string;
  examSessionId: string;
  modeSessionId: string;
  finalStage: string;
  exitReason: string;
  questionCount: number;
  attemptCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  skippedCount: number;
  flaggedCount: number;
  estimatedReadinessBucket?: string;
  masterySignal?: string;
  summarySignal: Record<string, unknown>;
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface ExamModeState {
  session: ExamModeSession;
  currentStage: string;
  currentQuestionState?: ExamModeQuestionState;
  attemptCount: number;
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
  };
  answerProtection?: {
    decision: string;
    reasonCodes: string[];
  };
  timerState?: {
    timerMode: string;
    timeSpentBucket?: string;
    timePressureSignal?: string;
  };
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export interface ExamModeStartRequest {
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  targetType: string;
  approvedContentRef?: string;
  paperRef?: string;
  examSetRef?: string;
  examGoalCategory: string;
  examSessionType: string;
  timerMode?: string;
  questionCount: number;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  replaceExisting?: boolean;
}

export interface ExamModeQuestionAdvanceRequest {
  questionKey: string;
  questionIndex: number;
  questionRef?: string;
  questionFingerprint?: string;
}

export interface ExamModeAttemptRequest {
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

export interface ExamModeHintRequest {
  requestedByStudent?: boolean;
}

export interface ExamModeSubmitRequest {
  reason?: string;
}

export interface ExamModeExitRequest {
  reason?: string;
}

export interface ExamModeStateResponse {
  ok: boolean;
  examMode: {
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
    timerState?: {
      timerMode: string;
    };
    attemptCount: number;
    hintCount: number;
    stuckCount: number;
    recoveryCount: number;
    skippedCount: number;
    flaggedCount: number;
    safeReasonCodes: string[];
  };
}
