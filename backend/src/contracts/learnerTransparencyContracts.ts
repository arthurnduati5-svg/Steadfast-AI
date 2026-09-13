export const LEARNER_TRANSPARENCY_SURFACES = [
  'progress_narrative',
  'why_this_next',
  'safe_evidence_card',
  'safe_evidence_card_list',
  'learner_agency_options',
  'recommendation_transparency',
  'revision_reason',
  'mastery_progress_reason',
  'weak_topic_reason',
  'practice_reason',
  'focus_mode_reason',
  'quiz_mode_reason',
  'teach_back_reason',
  'content_gap_notice',
  'deen_referral_notice',
  'safeguarding_boundary_notice',
  'source_truth_notice',
  'empty_state_notice',
] as const;

export type LearnerTransparencySurface = typeof LEARNER_TRANSPARENCY_SURFACES[number];

export const LEARNER_TRANSPARENCY_NEXT_STEP_TYPES = [
  'continue_current_step',
  'start_focus_mode',
  'start_quiz_mode',
  'start_teach_back_mode',
  'start_revision_mode',
  'practice_weak_topic',
  'review_safe_evidence_cards',
  'ask_for_hint',
  'ask_teacher_for_help',
  'ask_deen_teacher_or_scholar',
  'wait_for_more_evidence',
  'choose_different_topic',
  'no_action_needed',
] as const;

export type LearnerTransparencyNextStepType = typeof LEARNER_TRANSPARENCY_NEXT_STEP_TYPES[number];

export const LEARNER_AGENCY_OPTION_TYPES = [
  'recommended',
  'alternative',
  'support',
  'reflection',
  'teacher_help',
  'source_gap_referral',
  'deen_referral',
  'blocked_for_safety',
] as const;

export type LearnerAgencyOptionType = typeof LEARNER_AGENCY_OPTION_TYPES[number];

export const LEARNER_TRANSPARENCY_SOURCE_TRUTH_STATUSES = [
  'real',
  'demo',
  'fallback',
  'synthetic_test',
  'unknown',
  'stale',
  'expired',
  'content_gap',
  'source_required',
  'mixed',
  'insufficient',
  'blocked',
] as const;

export type LearnerTransparencySourceTruthStatus = typeof LEARNER_TRANSPARENCY_SOURCE_TRUTH_STATUSES[number];

export const LEARNER_TRANSPARENCY_CONFIDENCE_BUCKETS = [
  'not_enough_evidence',
  'low',
  'medium',
  'high',
  'mixed',
  'blocked',
] as const;

export type LearnerTransparencyConfidenceBucket = typeof LEARNER_TRANSPARENCY_CONFIDENCE_BUCKETS[number];

export const LEARNER_TRANSPARENCY_STATUSES = [
  'ok',
  'empty',
  'insufficient',
  'blocked',
  'content_gap',
  'source_required',
  'safeguarding_boundary',
  'deen_referral',
] as const;

export type LearnerTransparencyStatus = typeof LEARNER_TRANSPARENCY_STATUSES[number];

export const LEARNER_TRANSPARENCY_POLICY_DECISIONS = [
  'allowed',
  'blocked_no_school_context',
  'blocked_no_learner_identity',
  'blocked_cross_school',
  'blocked_cross_learner',
  'blocked_teacher_only_report',
  'blocked_parent_scope',
  'blocked_forbidden_raw_field',
  'blocked_hidden_reasoning',
  'blocked_answer_key',
  'blocked_model_answer',
  'blocked_marking_scheme',
  'blocked_correct_answer',
  'blocked_safeguarding_raw_detail',
  'blocked_deen_sensitive_private_text',
  'blocked_content_gap',
  'blocked_source_required',
  'blocked_live_ai',
  'blocked_live_school_connector',
] as const;

export type LearnerTransparencyPolicyDecision = typeof LEARNER_TRANSPARENCY_POLICY_DECISIONS[number];

export const LEARNER_TRANSPARENCY_REASON_CODES = [
  'no_safe_learning_evidence_yet',
  'no_real_learning_evidence_yet',
  'non_real_evidence_cannot_support_progress_claim',
  'learner_ownership_not_proven',
  'forbidden_raw_field_detected',
  'hidden_reasoning_detected',
  'protected_answer_field_detected',
  'content_gap_no_curriculum_context',
  'deen_referral_required',
  'safeguarding_boundary_applied',
  'teacher_only_field_detected',
  'answer_key_detected',
  'model_answer_detected',
  'marking_scheme_detected',
  'correct_answer_detected',
  'cross_school_access_denied',
  'cross_learner_access_denied',
  'parent_scope_not_implemented',
  'no_school_context',
  'no_learner_identity',
  'blocked_by_access_policy',
  'blocked_by_privacy_guard',
  'blocked_by_source_truth_policy',
  'insufficient_evidence_for_narrative',
  'insufficient_evidence_for_explanation',
  'stale_evidence_low_confidence',
  'demo_evidence_no_real_progress_claim',
  'fallback_evidence_no_real_progress_claim',
  'synthetic_evidence_no_real_progress_claim',
  'mixed_evidence_uncertainty',
] as const;

export type LearnerTransparencyReasonCode = typeof LEARNER_TRANSPARENCY_REASON_CODES[number];

export const FORBIDDEN_LEARNER_TRANSPARENCY_FIELDS = [
  'rawText',
  'rawMessage',
  'studentMessage',
  'messageBody',
  'rawNote',
  'noteText',
  'revisionText',
  'savedText',
  'questionText',
  'promptText',
  'answerText',
  'studentAnswer',
  'rawAnswer',
  'studentExplanation',
  'rawExplanation',
  'explanationText',
  'aiResponse',
  'prompt',
  'providerResponse',
  'chainOfThought',
  'hiddenReasoning',
  'internalReasoning',
  'modelReasoning',
  'reasoningTrace',
  'scratchpad',
  'teacherOnlyNote',
  'teacherOnlyReport',
  'teacherInsight',
  'teacherReport',
  'answerKey',
  'markingScheme',
  'modelAnswer',
  'correctAnswer',
  'expectedAnswer',
  'safeguardingRawDetail',
  'safeguardingCaseNote',
  'deenSensitivePrivateText',
  'privateDisclosure',
  'rawConversation',
  'rawTranscript',
  'transcript',
  'audioBlob',
  'audioUrl',
  'recordingUrl',
  'token',
  'apiKey',
  'authorization',
  'cookie',
  'privateKey',
  'databaseUrl',
  'connectionString',
] as const;

export type ForbiddenLearnerTransparencyField = typeof FORBIDDEN_LEARNER_TRANSPARENCY_FIELDS[number];

export const FORBIDDEN_HIDDEN_REASONING_FIELDS = [
  'chainOfThought',
  'hiddenReasoning',
  'internalReasoning',
  'modelReasoning',
  'reasoningTrace',
  'scratchpad',
  'deliberation',
  'privateScratchpad',
  'prompt',
  'systemPrompt',
  'developerPrompt',
  'providerResponse',
  'aiResponse',
  'rawCompletion',
  'modelInternalState',
] as const;

export type ForbiddenHiddenReasoningField = typeof FORBIDDEN_HIDDEN_REASONING_FIELDS[number];

export const FORBIDDEN_PROTECTED_ANSWER_FIELDS = [
  'answerKey',
  'modelAnswer',
  'markingScheme',
  'correctAnswer',
  'expectedAnswer',
] as const;

export type ForbiddenProtectedAnswerField = typeof FORBIDDEN_PROTECTED_ANSWER_FIELDS[number];

export interface LearnerTransparencyContext {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  userId: string;
  role: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
}

export interface LearnerTransparencyRequest {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  surface?: LearnerTransparencySurface;
  nextStepType?: LearnerTransparencyNextStepType;
  agencyOptionType?: LearnerAgencyOptionType;
  sourceTruthStatus?: LearnerTransparencySourceTruthStatus;
  confidenceBucket?: LearnerTransparencyConfidenceBucket;
  page?: number;
  limit?: number;
  timeWindow?: string;
}

export interface LearnerProgressNarrativeRequest {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
}

export interface LearnerWhyThisNextRequest {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  nextStepType?: LearnerTransparencyNextStepType;
}

export interface LearnerSafeEvidenceCardRequest {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  cardId?: string;
  page?: number;
  limit?: number;
}

export interface LearnerAgencyOptionsRequest {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  nextStepType?: LearnerTransparencyNextStepType;
}

export interface LearnerTransparencyAccessResult {
  allowed: boolean;
  policyDecision: LearnerTransparencyPolicyDecision;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  schoolId: string;
  studentId: string;
  role: string;
}

export interface LearnerTransparencyPrivacyResult {
  safe: boolean;
  redacted: boolean;
  redactionReasons: string[];
  policyDecision?: LearnerTransparencyPolicyDecision;
  safeReasonCodes: LearnerTransparencyReasonCode[];
}

export interface LearnerTransparencySourceTruthResult {
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
  transparencyStatus: LearnerTransparencyStatus;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  canSupportNarrative: boolean;
  canSupportExplanation: boolean;
  canSupportEvidenceCard: boolean;
  canSupportAgencyOptions: boolean;
}

export interface LearnerSafeEvidenceCard {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  surface: LearnerTransparencySurface;
  safeTitle: string;
  safeSummary: string;
  safeEvidenceRefs: string[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  createdAt: string;
  updatedAt?: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
}

export interface LearnerProgressNarrative {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  safeProgressBucket: string;
  safeMasteryBucket: string;
  safeRevisionNeedBucket: string;
  safeGrowthStatusBucket: string;
  learnerSafeSummary: string;
  encouragementText: string;
  uncertaintyText?: string;
  safeEvidenceCardIds: string[];
  safeReasonCodes: LearnerTransparencyReasonCode[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
  createdAt: string;
  updatedAt?: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
}

export interface LearnerWhyThisNextExplanation {
  id: string;
  schoolId: string;
  studentId: string;
  recommendedNextStepType: LearnerTransparencyNextStepType;
  whyThisNextText: string;
  safeBecauseText: string;
  whatYouCanDoText: string;
  whatIsNotShownText: string;
  uncertaintyText?: string;
  safeEvidenceCardIds: string[];
  safeReasonCodes: LearnerTransparencyReasonCode[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
  createdAt: string;
  updatedAt?: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
}

export interface LearnerAgencyOption {
  id: string;
  optionType: LearnerAgencyOptionType;
  nextStepType: LearnerTransparencyNextStepType;
  label: string;
  safeDescription: string;
  priority: number;
  enabled: boolean;
  disabledReasonCode?: LearnerTransparencyReasonCode;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
}

export interface LearnerTransparencyPacket {
  surface: LearnerTransparencySurface;
  status: LearnerTransparencyStatus;
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
  policyDecision: LearnerTransparencyPolicyDecision;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  progressNarrative?: LearnerProgressNarrative;
  whyThisNextExplanation?: LearnerWhyThisNextExplanation;
  safeEvidenceCards?: LearnerSafeEvidenceCard[];
  agencyOptions?: LearnerAgencyOption[];
  learnerSafeMessage?: string;
  generatedAt: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
}

export interface LearnerTransparencyAuditEvent {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  surface: LearnerTransparencySurface;
  policyDecision: LearnerTransparencyPolicyDecision;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
  createdAt: string;
}

export type LearnerTransparencyAuditEventType =
  | 'learner_transparency_requested'
  | 'learner_transparency_returned'
  | 'learner_transparency_blocked'
  | 'learner_transparency_raw_field_rejected'
  | 'learner_transparency_hidden_reasoning_blocked'
  | 'learner_transparency_answer_leak_blocked'
  | 'learner_transparency_deen_referral_returned'
  | 'learner_transparency_safeguarding_boundary_returned'
  | 'learner_transparency_failed';

export interface LearnerTransparencyResponse {
  ok: boolean;
  status: LearnerTransparencyStatus;
  surface: LearnerTransparencySurface;
  data?: LearnerTransparencyPacket;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
  generatedAt: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
}

export interface LearnerTransparencyErrorResponse {
  ok: false;
  status: LearnerTransparencyStatus;
  policyDecision: LearnerTransparencyPolicyDecision;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  generatedAt: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
}
