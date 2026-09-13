// ── Phase 2 Task 004: Focus Mode Runtime + One-Problem Learning Chamber ──

export const FOCUS_MODE_STATUSES = [
  'active',
  'paused',
  'completed',
  'cancelled',
  'expired',
  'failed',
] as const;
export type FocusModeStatus = typeof FOCUS_MODE_STATUSES[number];

export const FOCUS_MODE_STAGES = [
  'awaiting_problem',
  'understanding_problem',
  'finding_first_step',
  'guided_question',
  'checking_answer',
  'repairing_misconception',
  'micro_step_support',
  'reflection_check',
  'summary_ready',
  'completed',
  'cancelled',
  'failed',
] as const;
export type FocusModeStage = typeof FOCUS_MODE_STAGES[number];

export const FOCUS_MODE_TARGET_TYPES = [
  'problem',
  'question',
  'concept',
  'worked_example',
  'mistake_review',
  'revision_item',
  'teacher_assigned_item',
  'approved_content_item',
] as const;
export type FocusModeTargetType = typeof FOCUS_MODE_TARGET_TYPES[number];

export const FOCUS_MODE_STEP_TYPES = [
  'orient',
  'notice',
  'try_first',
  'micro_question',
  'hint_attention',
  'hint_direction',
  'rephrase',
  'smaller_step',
  'micro_example',
  'repair_misconception',
  'reflect',
  'teach_back',
  'summary',
  'exit',
] as const;
export type FocusModeStepType = typeof FOCUS_MODE_STEP_TYPES[number];

export const FOCUS_MODE_STEP_STATUSES = [
  'active',
  'completed',
  'skipped',
  'cancelled',
  'failed',
] as const;
export type FocusModeStepStatus = typeof FOCUS_MODE_STEP_STATUSES[number];

export const FOCUS_MODE_GOAL_CATEGORIES = [
  'understand_one_problem',
  'master_one_concept',
  'review_one_mistake',
  'complete_one_step',
  'practice_one_skill',
  'work_through_example',
] as const;
export type FocusModeGoalCategory = typeof FOCUS_MODE_GOAL_CATEGORIES[number];

export const FOCUS_MODE_EXIT_REASONS = [
  'student_completed',
  'student_cancelled',
  'time_expired',
  'teacher_ended',
  'system_error',
  'replaced_by_new_session',
] as const;
export type FocusModeExitReason = typeof FOCUS_MODE_EXIT_REASONS[number];

export const FOCUS_MODE_ANSWER_QUALITIES = [
  'unanswered',
  'unclear',
  'incorrect',
  'partially_correct',
  'mostly_correct',
  'correct',
] as const;
export type FocusModeAnswerQuality = typeof FOCUS_MODE_ANSWER_QUALITIES[number];

export const FOCUS_MODE_MISTAKE_CATEGORIES = [
  'conceptual',
  'procedural',
  'careless',
  'prerequisite_gap',
  'language_confusion',
  'off_topic',
  'unknown',
  'none',
] as const;
export type FocusModeMistakeCategory = typeof FOCUS_MODE_MISTAKE_CATEGORIES[number];

export const FOCUS_MODE_REASON_CODES = [
  'focus_started',
  'target_set',
  'stage_changed',
  'step_advanced',
  'attempt_recorded',
  'hint_given',
  'hint_advanced',
  'stuck_detected',
  'recovery_detected',
  'mistake_detected',
  'reflection_recorded',
  'summary_created',
  'session_exited',
  'session_cancelled',
  'session_replaced',
  'content_gap',
  'deen_uncertain',
  'answer_key_blocked',
  'unsafe_blocked',
  'no_active_session',
  'invalid_transition',
] as const;
export type FocusModeReasonCode = typeof FOCUS_MODE_REASON_CODES[number];

export const FORBIDDEN_FOCUS_MODE_FIELDS = [
  'rawText',
  'problemText',
  'questionText',
  'studentMessage',
  'messageBody',
  'answerText',
  'studentAnswer',
  'aiResponse',
  'prompt',
  'providerResponse',
  'answerKey',
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
export type ForbiddenFocusModeField = typeof FORBIDDEN_FOCUS_MODE_FIELDS[number];

// ── Request Types ──

export interface FocusModeSession {
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
  problemRef?: string;
  problemFingerprint?: string;
  targetType: string;
  focusGoalCategory: string;
  status: string;
  currentStage: string;
  currentStepKey?: string;
  attemptCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  endedAt?: string;
}

export interface FocusModeStep {
  id: string;
  focusSessionId: string;
  modeSessionId: string;
  stepKey: string;
  stepType: string;
  stage: string;
  status: string;
  selectedTutorAction?: string;
  hintLevel?: string;
  supportLevel?: string;
  learnerNeedCategory?: string;
  attemptNumber?: number;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
  completedAt?: string;
}

export interface FocusModeAttempt {
  id: string;
  focusSessionId: string;
  modeSessionId: string;
  stepKey?: string;
  stage: string;
  attemptNumber: number;
  answerQuality?: string;
  isCorrect?: boolean;
  mistakeCategory?: string;
  usedHint: boolean;
  hintLevel?: string;
  timeSpentBucket?: string;
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface FocusModeSummary {
  id: string;
  focusSessionId: string;
  modeSessionId: string;
  finalStage: string;
  exitReason: string;
  attemptCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  masterySignal?: string;
  summarySignal: Record<string, unknown>;
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface FocusModeState {
  session: FocusModeSession;
  currentStage: string;
  currentStep?: FocusModeStep;
  attemptCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  nextAction?: {
    selectedAction: string;
    hintLevel?: string;
    supportLevel: string;
    learnerNeedCategory: string;
    reasonCodes: string[];
  };
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export interface FocusModeStartRequest {
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  targetType: string;
  approvedContentRef?: string;
  problemRef?: string;
  problemFingerprint?: string;
  focusGoalCategory: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  replaceExisting?: boolean;
}

export interface FocusModeAdvanceRequest {
  stepKey?: string;
  action?: string;
}

export interface FocusModeAttemptRequest {
  stepKey?: string;
  answerQuality: string;
  mistakeCategory?: string;
  usedHint?: boolean;
  timeSpentBucket?: string;
  safeEvidenceRefs?: string[];
}

export interface FocusModeHintRequest {
  stepKey?: string;
  requestedByStudent?: boolean;
}

export interface FocusModeExitRequest {
  reason?: string;
}

export interface FocusModeStateResponse {
  ok: boolean;
  focusMode: {
    sessionId: string;
    modeSessionId: string;
    status: string;
    currentStage: string;
    currentStep?: {
      stepKey: string;
      stepType: string;
      status: string;
    };
    nextAction?: {
      selectedAction: string;
      supportLevel: string;
      learnerNeedCategory: string;
    };
    attemptCount: number;
    hintCount: number;
    stuckCount: number;
    recoveryCount: number;
    safeReasonCodes: string[];
  };
}
