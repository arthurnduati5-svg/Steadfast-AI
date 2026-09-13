import type { LearnerPreferenceFeedbackType, LearnerSupportLevel } from '../services/learnerPreferenceFeedbackContracts';

export const ADAPTIVE_TUNING_FEEDBACK_TYPES = [
  'helped', 'not_helpful', 'too_easy', 'too_hard', 'confusing', 'clear',
  'want_hint', 'want_less_help', 'want_more_help', 'want_challenge',
  'want_foundation_review', 'want_revision', 'want_quiz', 'want_teach_back',
  'want_focus_mode', 'want_teacher_help', 'not_now', 'still_stuck',
  'understood_after', 'prefer_shorter_step', 'prefer_more_examples',
  'source_needed', 'deen_teacher_referral_needed', 'safety_boundary_needed',
] as const;

export const ADAPTIVE_TUNING_CHOICE_TYPES = [
  'accepted_recommended', 'chose_alternative', 'asked_for_hint',
  'asked_teacher_help', 'asked_deen_teacher_or_scholar', 'chose_revision',
  'chose_quiz', 'chose_focus_mode', 'chose_teach_back', 'chose_practice',
  'skipped_for_now', 'changed_topic', 'declined_support',
  'requested_more_support', 'requested_less_support',
] as const;

export const ADAPTIVE_TUNING_RECOMMENDATION_TYPES = [
  'continue_current_step', 'start_focus_mode', 'start_quiz_mode',
  'start_teach_back_mode', 'start_revision_mode', 'practice_weak_topic',
  'review_safe_evidence_cards', 'ask_for_hint', 'ask_teacher_for_help',
  'ask_deen_teacher_or_scholar', 'wait_for_more_evidence',
  'choose_different_topic', 'no_action_needed',
] as const;

export const ADAPTIVE_TUNING_SUPPORT_LEVELS = [
  'minimal', 'light', 'standard', 'guided', 'high_support',
  'teacher_support_recommended', 'blocked',
] as const;

export const ADAPTIVE_TUNING_HINT_PACING_BUCKETS = [
  'no_hints_yet', 'slow_hint_pacing', 'standard_hint_pacing',
  'faster_hint_pacing', 'high_hint_dependency', 'blocked',
] as const;

export const ADAPTIVE_TUNING_EFFECTIVENESS_SIGNALS = [
  'helped_recover', 'helped_continue', 'reduced_confusion',
  'increased_confusion', 'no_effect', 'still_stuck', 'over_supported',
  'under_supported', 'avoidance_detected', 'teacher_help_needed',
  'not_enough_evidence',
] as const;

export const ADAPTIVE_TUNING_DECISIONS = [
  'keep_current', 'increase_support', 'decrease_support',
  'shift_to_foundation', 'shift_to_revision', 'shift_to_focus',
  'shift_to_quiz', 'shift_to_teach_back', 'suggest_teacher_help',
  'suggest_deen_referral', 'wait_for_more_evidence', 'block_tuning',
] as const;

export const ADAPTIVE_TUNING_POLICY_DECISIONS = [
  'allowed', 'blocked_no_school_context', 'blocked_no_learner_identity',
  'blocked_cross_school', 'blocked_cross_learner',
  'blocked_forbidden_raw_field', 'blocked_hidden_reasoning',
  'blocked_answer_key', 'blocked_model_answer', 'blocked_marking_scheme',
  'blocked_correct_answer', 'blocked_safeguarding_raw_detail',
  'blocked_deen_sensitive_private_text', 'blocked_live_ai',
  'blocked_live_school_connector', 'blocked_avoidance_loop',
  'blocked_mastery_inflation', 'blocked_source_required',
  'blocked_content_gap',
] as const;

export const ADAPTIVE_TUNING_SOURCE_TRUTH_STATUSES = [
  'real_evidence', 'mixed_evidence', 'uncertain', 'demo', 'fallback',
  'synthetic_test', 'unknown', 'stale', 'expired', 'content_gap',
  'source_required', 'deen_referral', 'blocked',
] as const;

export const ADAPTIVE_TUNING_CONFIDENCE_BUCKETS = [
  'high_confidence', 'medium_confidence', 'low_confidence',
  'not_enough_evidence', 'blocked',
] as const;

export const ADAPTIVE_TUNING_AVOIDANCE_RISK_BUCKETS = [
  'none', 'low', 'elevated', 'high', 'blocked',
] as const;

export const ADAPTIVE_TUNING_MASTERY_INFLATION_RISK_BUCKETS = [
  'none', 'low', 'elevated', 'high', 'blocked',
] as const;

export const ADAPTIVE_TUNING_REASON_CODES = [
  'learner_feedback_received', 'learner_choice_recorded',
  'support_increased', 'support_decreased', 'hint_pacing_adjusted',
  'foundation_review_suggested', 'teacher_help_suggested',
  'deen_referral_required', 'safeguarding_boundary_applied',
  'avoidance_loop_risk_detected', 'mastery_inflation_risk_detected',
  'forbidden_raw_field_detected', 'hidden_reasoning_detected',
  'protected_answer_field_detected', 'no_real_learning_evidence_for_tuning',
  'non_real_evidence_cannot_support_real_tuning',
  'no_preference_feedback_yet', 'source_required_tuning_blocked',
  'content_gap_no_tuning', 'learner_ownership_not_proven',
  'cross_school_access_blocked', 'preference_cannot_create_mastery',
  'preference_cannot_erase_weak_topic',
  'preference_cannot_disable_revision_debt',
  'preference_cannot_reveal_answers',
  'preference_cannot_bypass_deen_boundary',
  'preference_cannot_bypass_safeguarding_boundary',
  'stale_evidence_reduces_confidence', 'expired_evidence_blocks_tuning',
  'dean_sensitive_text_handled',
  'safeguarding_concern_flagged',
] as const;

export const FORBIDDEN_ADAPTIVE_TUNING_FIELDS = [
  'rawText', 'rawMessage', 'studentMessage', 'messageBody',
  'rawNote', 'noteText', 'revisionText', 'savedText',
  'questionText', 'promptText', 'answerText', 'studentAnswer',
  'rawAnswer', 'studentExplanation', 'rawExplanation', 'explanationText',
  'aiResponse', 'prompt', 'providerResponse', 'chainOfThought',
  'hiddenReasoning', 'internalReasoning', 'modelReasoning',
  'reasoningTrace', 'scratchpad', 'teacherOnlyNote', 'teacherOnlyReport',
  'teacherInsight', 'teacherReport', 'answerKey', 'markingScheme',
  'modelAnswer', 'correctAnswer', 'expectedAnswer',
  'safeguardingRawDetail', 'safeguardingCaseNote',
  'deenSensitivePrivateText', 'privateDisclosure',
  'rawConversation', 'rawTranscript', 'transcript',
  'audioBlob', 'audioUrl', 'recordingUrl',
  'token', 'apiKey', 'authorization', 'cookie',
  'privateKey', 'databaseUrl', 'connectionString',
] as const;

export type AdaptiveTuningFeedbackType = typeof ADAPTIVE_TUNING_FEEDBACK_TYPES[number];
export type AdaptiveTuningChoiceType = typeof ADAPTIVE_TUNING_CHOICE_TYPES[number];
export type AdaptiveTuningRecommendationType = typeof ADAPTIVE_TUNING_RECOMMENDATION_TYPES[number];
export type AdaptiveTuningSupportLevel = typeof ADAPTIVE_TUNING_SUPPORT_LEVELS[number];
export type AdaptiveTuningHintPacingBucket = typeof ADAPTIVE_TUNING_HINT_PACING_BUCKETS[number];
export type AdaptiveTuningEffectivenessSignal = typeof ADAPTIVE_TUNING_EFFECTIVENESS_SIGNALS[number];
export type AdaptiveTuningDecision = typeof ADAPTIVE_TUNING_DECISIONS[number];
export type AdaptiveTuningPolicyDecision = typeof ADAPTIVE_TUNING_POLICY_DECISIONS[number];
export type AdaptiveTuningSourceTruthStatus = typeof ADAPTIVE_TUNING_SOURCE_TRUTH_STATUSES[number];
export type AdaptiveTuningConfidenceBucket = typeof ADAPTIVE_TUNING_CONFIDENCE_BUCKETS[number];
export type AdaptiveTuningAvoidanceRiskBucket = typeof ADAPTIVE_TUNING_AVOIDANCE_RISK_BUCKETS[number];
export type AdaptiveTuningMasteryInflationRiskBucket = typeof ADAPTIVE_TUNING_MASTERY_INFLATION_RISK_BUCKETS[number];
export type AdaptiveTuningReasonCode = typeof ADAPTIVE_TUNING_REASON_CODES[number];

export interface AdaptiveTuningContext {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
}

export interface LearnerPreferenceFeedbackRequest {
  feedbackType: LearnerPreferenceFeedbackType | AdaptiveTuningFeedbackType;
  recommendationId?: string;
  agencyOptionId?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  sessionId?: string;
  sourceTruthStatus?: string;
  confidenceBucket?: string;
}

export interface LearnerChoiceSignalRequest {
  choiceType: AdaptiveTuningChoiceType;
  recommendationId?: string;
  recommendationType?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  sessionId?: string;
}

export interface SupportCalibrationRequest {
  recentTooHardCount: number;
  recentTooEasyCount: number;
  recentConfusionCount: number;
  recentCorrectCount: number;
  recentIncorrectCount: number;
  recentIndependentSuccessCount: number;
  recentHintDependencyCount: number;
  hintDependencyBucket?: string;
  effortPatternBucket?: string;
  recallSignal?: string;
  teachBackSignal?: string;
  revisionCompletionSignal?: string;
  stuckSignal?: string;
  recoverySignal?: string;
  confidenceBucket?: string;
  sourceTruthStatus?: string;
  safeEvidenceRefs?: string[];
}

export interface RecommendationTuningRequest {
  feedbackType: LearnerPreferenceFeedbackType | AdaptiveTuningFeedbackType;
  choiceType?: AdaptiveTuningChoiceType;
  context: AdaptiveTuningContext;
  recentTooHardCount: number;
  recentTooEasyCount: number;
  recentConfusionCount: number;
  recentChallengeRequestCount: number;
  recentTeacherHelpRequestCount: number;
  recentSkipCount: number;
  recentAvoidanceSignalCount?: number;
  masteryEvidenceLevel?: string;
  sourceTruthStatus?: string;
  safeEvidenceRefs?: string[];
}

export interface AdaptiveTuningAccessResult {
  allowed: boolean;
  policyDecision: AdaptiveTuningPolicyDecision;
  safeReasonCodes: AdaptiveTuningReasonCode[];
}

export interface AdaptiveTuningPrivacyResult {
  safe: boolean;
  policyDecision: AdaptiveTuningPolicyDecision;
  forbiddenFieldsFound: string[];
  safeReasonCodes: AdaptiveTuningReasonCode[];
}

export interface PreferenceSafetyResult {
  safe: boolean;
  policyDecision: AdaptiveTuningPolicyDecision;
  safeReasonCodes: AdaptiveTuningReasonCode[];
  canTuneSupport: boolean;
  canTuneHints: boolean;
  canReorderOptions: boolean;
  bypassesSourceTruth: boolean;
  bypassesDeenBoundary: boolean;
  bypassesSafeguardingBoundary: boolean;
  bypassesRevisionDebt: boolean;
  erasesWeakTopic: boolean;
  revealsAnswers: boolean;
  convertsFallbackToReal: boolean;
}

export interface AvoidanceLoopPolicyResult {
  decision: 'allowed' | 'allowed_with_shorter_step' | 'allowed_with_revision_anchor' | 'allowed_with_teacher_help_suggestion' | 'blocked_avoidance_loop' | 'needs_more_evidence';
  avoidanceRiskBucket: AdaptiveTuningAvoidanceRiskBucket;
  safeReasonCodes: AdaptiveTuningReasonCode[];
  safeAlternativeSuggestion?: string;
}

export interface MasteryInflationPolicyResult {
  decision: 'allowed' | 'blocked_mastery_inflation' | 'blocked_insufficient_evidence' | 'needs_more_evidence';
  masteryInflationRiskBucket: AdaptiveTuningMasteryInflationRiskBucket;
  safeReasonCodes: AdaptiveTuningReasonCode[];
  safeAdjustment?: string;
}

export interface SupportCalibrationResult {
  supportLevel: AdaptiveTuningSupportLevel;
  hintPacingBucket: AdaptiveTuningHintPacingBucket;
  safeReasonCodes: AdaptiveTuningReasonCode[];
  sourceTruthStatus: AdaptiveTuningSourceTruthStatus;
  confidenceBucket: AdaptiveTuningConfidenceBucket;
}

export interface RecommendationTuningDecision {
  tuningDecision: AdaptiveTuningDecision;
  supportLevel: AdaptiveTuningSupportLevel;
  hintPacingBucket: AdaptiveTuningHintPacingBucket;
  safeModeRankingHints: string[];
  safeAgencyRankingHints: string[];
  teacherHelpSuggestion: boolean;
  uncertaintyLabel?: string;
  safeReasonCodes: AdaptiveTuningReasonCode[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: AdaptiveTuningSourceTruthStatus;
  confidenceBucket: AdaptiveTuningConfidenceBucket;
}

export interface ClosedLoopPersonalizationPacket {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  recommendationId?: string;
  tuningDecision: AdaptiveTuningDecision;
  supportLevel: AdaptiveTuningSupportLevel;
  hintPacingBucket: AdaptiveTuningHintPacingBucket;
  safeModeRankingHints: string[];
  safeAgencyRankingHints: string[];
  avoidanceRiskBucket: AdaptiveTuningAvoidanceRiskBucket;
  masteryInflationRiskBucket: AdaptiveTuningMasteryInflationRiskBucket;
  sourceTruthStatus: AdaptiveTuningSourceTruthStatus;
  confidenceBucket: AdaptiveTuningConfidenceBucket;
  safeReasonCodes: AdaptiveTuningReasonCode[];
  safeEvidenceRefs: string[];
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

export interface LearnerPreferenceFeedbackRecord {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  recommendationId: string;
  recommendationType: string;
  feedbackType: string;
  supportLevelBefore?: string;
  supportLevelAfter?: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: string;
  confidenceBucket: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
  createdAt: string;
}

export interface LearnerChoiceSignalRecord {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  recommendationId?: string;
  recommendationType?: string;
  choiceType: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  safeReasonCodes: string[];
  createdAt: string;
}

export interface AdaptiveTuningSnapshot {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  supportLevel: string;
  hintPacingBucket: string;
  preferredModeHints: string[];
  effectiveModeHints: string[];
  avoidanceRiskBucket: string;
  masteryInflationRiskBucket: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: string;
  confidenceBucket: string;
  updatedAt: string;
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

export interface AdaptiveTuningAuditEvent {
  eventType: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  recommendationId?: string;
  feedbackType?: string;
  choiceType?: string;
  tuningDecision?: string;
  policyDecision?: string;
  safeReasonCodes: string[];
  createdAt: string;
}

export interface AdaptiveTuningResponse {
  ok: boolean;
  status?: string;
  data?: Record<string, unknown>;
  safeReasonCodes?: string[];
  policyDecision?: string;
  tuningDecision?: string;
  sourceTruthStatus?: string;
  confidenceBucket?: string;
  avoidanceRiskBucket?: string;
  masteryInflationRiskBucket?: string;
  message?: string;
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
  generatedAt: string;
}

export interface AdaptiveTuningErrorResponse {
  ok: false;
  error: {
    code: string;
    message: string;
  };
  policyDecision?: string;
  safeReasonCodes?: string[];
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
  generatedAt: string;
}
