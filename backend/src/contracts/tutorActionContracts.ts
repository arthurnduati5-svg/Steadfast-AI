export const TUTOR_ACTION_TYPES = [
  'ask_next_question',
  'ask_clarifying_question',
  'ask_student_to_try_first',
  'give_attention_hint',
  'give_direction_hint',
  'rephrase_question',
  'simplify_concept',
  'break_into_micro_step',
  'give_micro_example',
  'guided_completion',
  'ask_reflection_question',
  'ask_teach_back',
  'summarize_progress',
  'repair_misconception',
  'check_foundation',
  'check_readiness',
  'recommend_practice',
  'recommend_revision',
  'recommend_video',
  'recommend_course_step',
  'recommend_teacher_support',
  'safe_content_gap_referral',
  'safe_deen_referral',
  'block_answer_key_request',
  'block_unsafe_request',
  'continue_current_mode',
  'exit_mode_summary',
] as const;
export type TutorActionType = typeof TUTOR_ACTION_TYPES[number];

export const HINT_LADDER_LEVELS = [
  'attention_hint',
  'direction_hint',
  'rephrased_question',
  'smaller_step',
  'micro_example',
  'guided_completion',
] as const;
export type HintLadderLevel = typeof HINT_LADDER_LEVELS[number];

export const SUPPORT_LEVELS = [
  'minimal',
  'low',
  'moderate',
  'high',
  'intensive',
  'teacher_referral',
] as const;
export type SupportLevel = typeof SUPPORT_LEVELS[number];

export const LEARNER_NEED_CATEGORIES = [
  'no_attempt_yet',
  'first_attempt_needed',
  'partially_correct',
  'incorrect_conceptual',
  'incorrect_procedural',
  'careless_error',
  'prerequisite_gap',
  'language_confusion',
  'repeated_same_mistake',
  'high_hint_dependency',
  'stuck_without_recovery',
  'recovering_after_hint',
  'ready_for_challenge',
  'ready_for_teach_back',
  'needs_revision',
  'needs_practice',
  'needs_teacher_support',
  'answer_key_seeking',
  'unsafe_request',
  'content_context_missing',
  'deen_sensitive_uncertain',
  'off_topic',
  'low_confidence_profile',
  'no_data_yet',
] as const;
export type LearnerNeedCategory = typeof LEARNER_NEED_CATEGORIES[number];

export const ACTION_REASON_CODES = [
  'no_attempt_observed',
  'partial_attempt',
  'conceptual_mistake',
  'procedural_mistake',
  'careless_error',
  'repeated_error',
  'prerequisite_gap',
  'language_barrier',
  'high_hint_dependency',
  'stuck_no_recovery',
  'recovery_observed',
  'ready_for_challenge',
  'mastery_secure',
  'mastery_developing',
  'mastery_emerging',
  'mastery_unknown',
  'weak_topic',
  'low_confidence',
  'mode_focus_active',
  'mode_exam_active',
  'mode_quiz_active',
  'mode_teach_back_active',
  'mode_revision_active',
  'mode_normal_active',
  'socratic_support',
  'hint_ladder_level_1',
  'hint_ladder_level_2',
  'hint_ladder_level_3',
  'hint_ladder_level_4',
  'hint_ladder_level_5',
  'hint_ladder_level_6',
  'answer_key_request_detected',
  'unsafe_content_detected',
  'content_context_missing',
  'deen_sensitive_uncertain',
  'policy_override',
  'empty_state_default',
  'no_profile_data',
  'no_mode_session',
  'teacher_referral_needed',
  'profile_confidence_low',
] as const;
export type ActionReasonCode = typeof ACTION_REASON_CODES[number];

export const ANSWER_POLICY_FLAGS = [
  'finalAnswerAllowed',
  'answerKeyRisk',
  'requiresStudentAttempt',
  'requiresSocraticQuestion',
] as const;
export type AnswerPolicyFlag = typeof ANSWER_POLICY_FLAGS[number];

export const CONTENT_POLICY_FLAGS = [
  'approvedContextAvailable',
  'contentGap',
  'deenSensitive',
  'referralRequired',
] as const;
export type ContentPolicyFlag = typeof CONTENT_POLICY_FLAGS[number];

export const ACTION_EFFECTIVENESS_SIGNALS = [
  'helped_recovery',
  'helped_correct',
  'helped_progress',
  'no_effect',
  'confused_more',
  'abandoned_session',
  'requested_teacher',
] as const;
export type ActionEffectivenessSignal = typeof ACTION_EFFECTIVENESS_SIGNALS[number];

export const FORBIDDEN_TUTOR_ACTION_FIELDS = [
  'rawText',
  'studentMessage',
  'messageBody',
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
  'rawConversation',
  'rawTranscript',
  'privateDisclosure',
] as const;
export type ForbiddenTutorActionField = typeof FORBIDDEN_TUTOR_ACTION_FIELDS[number];

export interface TutorActionDecision {
  id?: string;
  schoolId: string;
  studentId?: string;
  tutorLearnerId?: string;
  modeSessionId?: string;
  conversationId?: string;
  mode?: string;
  stage?: string;

  selectedAction: TutorActionType;
  rankedActions: Array<{
    action: TutorActionType;
    score: number;
    reasonCodes: string[];
  }>;

  hintLevel?: HintLadderLevel;
  supportLevel: SupportLevel;
  learnerNeedCategory: LearnerNeedCategory;

  answerPolicy: {
    finalAnswerAllowed: boolean;
    answerKeyRisk: boolean;
    requiresStudentAttempt: boolean;
    requiresSocraticQuestion: boolean;
  };

  contentPolicy: {
    approvedContextAvailable: boolean;
    contentGap: boolean;
    deenSensitive: boolean;
    referralRequired: boolean;
  };

  decisionReasonCodes: string[];
  safeEvidenceRefs: string[];
  confidenceScore: number;

  nextSignalType?: string;
  nextModeStage?: string;
  createdAt: string;
}

export interface TutorActionDecisionRequest {
  modeSessionId?: string;
  conversationId?: string;
  mode?: string;
  stage?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  requestCategory?: string;
  answerQuality?: string;
  mistakeCategory?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
}

export interface HintLadderAdvanceRequest {
  modeSessionId?: string;
  topicId?: string;
  skillId?: string;
  currentHintLevel?: string;
  hintGiven: boolean;
  studentAttempted: boolean;
  studentRecovered: boolean;
}

export interface TutorActionEffectivenessRequest {
  decisionId: string;
  effectivenessSignal: string;
  recoveryDetected: boolean;
  safeEvidenceRefs?: string[];
}

export interface HintLadderStateResponse {
  id?: string;
  schoolId: string;
  studentId: string;
  currentHintLevel: string;
  hintCount: number;
  lastHintAt?: string;
  stuckCount: number;
  recoveryCount: number;
  status: string;
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export const HINT_LADDER_ORDER: HintLadderLevel[] = [
  'attention_hint',
  'direction_hint',
  'rephrased_question',
  'smaller_step',
  'micro_example',
  'guided_completion',
];
