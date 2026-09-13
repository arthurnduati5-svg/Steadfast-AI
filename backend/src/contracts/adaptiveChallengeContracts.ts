export const ADAPTIVE_CHALLENGE_TYPES = [
  'foundation_remediation',
  'prerequisite_review',
  'similar_practice',
  'light_challenge',
  'standard_challenge',
  'stretch_challenge',
  'transfer_challenge',
  'teach_back_challenge',
  'revision_recall_challenge',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_READINESS_LEVELS = [
  'not_ready',
  'ready_for_foundation',
  'ready_for_similar_practice',
  'ready_for_light_challenge',
  'ready_for_standard_challenge',
  'ready_for_stretch_challenge',
  'teacher_support_recommended',
  'source_required',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_DIFFICULTY_BANDS = [
  'foundation',
  'easy',
  'standard',
  'challenging',
  'stretch',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_DIFFICULTY_DELTAS = [
  'decrease_two',
  'decrease_one',
  'keep_same',
  'increase_one',
  'increase_two',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_MASTERY_BUCKETS = [
  'not_started',
  'emerging',
  'developing',
  'secure',
  'strong',
  'mixed',
  'insufficient',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_PREREQUISITE_STATUSES = [
  'met',
  'partially_met',
  'missing',
  'unknown',
  'source_required',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_HINT_SCAFFOLD_LEVELS = [
  'none',
  'orientation_only',
  'concept_cue',
  'strategy_step',
  'step_check',
  'guided_retry',
  'teacher_support',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_REMEDIATION_TYPES = [
  'foundation_rebuild',
  'prerequisite_repair',
  'similar_practice',
  'hint_scaffolded_retry',
  'revision_recall',
  'teach_back_repair',
  'teacher_support',
  'source_required',
  'deen_referral',
  'safeguarding_boundary',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_ATTEMPT_OUTCOME_BUCKETS = [
  'not_attempted',
  'attempted',
  'independent_success',
  'success_with_hint',
  'partial_progress',
  'stuck',
  'repeated_mistake',
  'overchallenged',
  'needs_prerequisite',
  'teacher_support_needed',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_POLICY_DECISIONS = [
  'allowed',
  'allowed_with_scaffold',
  'allowed_as_remediation',
  'blocked_no_school_context',
  'blocked_no_learner_identity',
  'blocked_cross_school',
  'blocked_cross_learner',
  'blocked_forbidden_raw_field',
  'blocked_hidden_reasoning',
  'blocked_answer_key',
  'blocked_model_answer',
  'blocked_marking_scheme',
  'blocked_correct_answer',
  'blocked_source_required',
  'blocked_content_gap',
  'blocked_deen_referral',
  'blocked_safeguarding_boundary',
  'blocked_not_ready',
  'blocked_prerequisite_missing',
  'blocked_fake_readiness',
  'blocked_live_ai',
  'blocked_live_school_connector',
] as const;

export const ADAPTIVE_CHALLENGE_SOURCE_TRUTH_STATUSES = [
  'real',
  'mixed',
  'demo',
  'fallback',
  'synthetic_test',
  'unknown',
  'stale',
  'expired',
  'content_gap',
  'source_required',
  'blocked',
  'insufficient',
] as const;

export const ADAPTIVE_CHALLENGE_CONFIDENCE_BUCKETS = [
  'not_enough_evidence',
  'low',
  'medium',
  'high',
  'mixed',
  'blocked',
] as const;

export const ADAPTIVE_CHALLENGE_REASON_CODES = [
  'not_enough_real_evidence_for_challenge',
  'non_real_evidence_cannot_support_real_challenge_readiness',
  'missing_prerequisite_detected',
  'evidence_supports_challenge',
  'deen_referral_required',
  'safeguarding_boundary_applied',
  'forbidden_raw_field_detected',
  'hidden_reasoning_detected',
  'protected_answer_field_detected',
  'learner_ownership_not_proven',
  'cross_school_access_blocked',
  'cross_learner_access_blocked',
  'mastery_low',
  'struggle_detected',
  'insufficient_evidence',
  'developing_mastery',
  'repeated_mistakes',
  'hint_dependency',
  'developing_improving',
  'independent_success',
  'developing_needs_more_evidence',
  'secure_mastery',
  'revision_due',
  'unexpected_mistakes',
  'ready_for_challenge',
  'strong_mastery',
  'ready_for_stretch',
  'unknown_mastery_state',
  'learner_preference_considered',
  'learner_preference_gentler_path',
  'safety_fallback',
  'deen_teacher_referral_boundary',
] as const;

export const FORBIDDEN_ADAPTIVE_CHALLENGE_FIELDS = [
  'rawText',
  'rawMessage',
  'studentMessage',
  'messageBody',
  'rawNote',
  'noteText',
  'revisionText',
  'savedText',
  'questionText',
  'rawQuestion',
  'promptText',
  'answerText',
  'studentAnswer',
  'rawAnswer',
  'studentExplanation',
  'rawExplanation',
  'explanationText',
  'solution',
  'fullSolution',
  'finalAnswer',
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
  'teacherOnlyRubric',
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

export type AdaptiveChallengeType = typeof ADAPTIVE_CHALLENGE_TYPES[number];
export type AdaptiveChallengeReadinessLevel = typeof ADAPTIVE_CHALLENGE_READINESS_LEVELS[number];
export type AdaptiveChallengeDifficultyBand = typeof ADAPTIVE_CHALLENGE_DIFFICULTY_BANDS[number];
export type AdaptiveChallengeDifficultyDelta = typeof ADAPTIVE_CHALLENGE_DIFFICULTY_DELTAS[number];
export type AdaptiveChallengeMasteryBucket = typeof ADAPTIVE_CHALLENGE_MASTERY_BUCKETS[number];
export type AdaptiveChallengePrerequisiteStatus = typeof ADAPTIVE_CHALLENGE_PREREQUISITE_STATUSES[number];
export type AdaptiveChallengeHintScaffoldLevel = typeof ADAPTIVE_CHALLENGE_HINT_SCAFFOLD_LEVELS[number];
export type AdaptiveChallengeRemediationType = typeof ADAPTIVE_CHALLENGE_REMEDIATION_TYPES[number];
export type AdaptiveChallengeAttemptOutcomeBucket = typeof ADAPTIVE_CHALLENGE_ATTEMPT_OUTCOME_BUCKETS[number];
export type AdaptiveChallengePolicyDecision = typeof ADAPTIVE_CHALLENGE_POLICY_DECISIONS[number];
export type AdaptiveChallengeSourceTruthStatus = typeof ADAPTIVE_CHALLENGE_SOURCE_TRUTH_STATUSES[number];
export type AdaptiveChallengeConfidenceBucket = typeof ADAPTIVE_CHALLENGE_CONFIDENCE_BUCKETS[number];
export type AdaptiveChallengeReasonCode = typeof ADAPTIVE_CHALLENGE_REASON_CODES[number];

export interface AdaptiveChallengeContext {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
}

export interface AdaptiveChallengeRequest {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  challengeType?: AdaptiveChallengeType;
  readinessLevel?: AdaptiveChallengeReadinessLevel;
  masteryBucket?: AdaptiveChallengeMasteryBucket;
  prerequisiteStatus?: AdaptiveChallengePrerequisiteStatus;
  difficultyBand?: AdaptiveChallengeDifficultyBand;
  hintScaffoldLevel?: AdaptiveChallengeHintScaffoldLevel;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: string[];
}

export interface ChallengeReadinessInput {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  masteryBucket: AdaptiveChallengeMasteryBucket;
  safeEvidenceRefs?: string[];
  recentAttemptOutcomeBuckets?: AdaptiveChallengeAttemptOutcomeBucket[];
  hintDependencyBucket?: string;
  mistakePatternBucket?: string;
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
  revisionStatus?: string;
  teachBackStatus?: string;
  prerequisiteStatus?: AdaptiveChallengePrerequisiteStatus;
  supportLevel?: string;
  tuningDecision?: string;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
}

export interface ChallengeReadinessResult {
  readinessLevel: AdaptiveChallengeReadinessLevel;
  challengeType: AdaptiveChallengeType;
  policyDecision: AdaptiveChallengePolicyDecision;
  safeReasonCodes: string[];
  confidenceBucket: AdaptiveChallengeConfidenceBucket;
  sourceTruthStatus: AdaptiveChallengeSourceTruthStatus;
}

export interface PrerequisiteResolutionInput {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  knownPrerequisiteRefs?: string[];
  safeEvidenceRefs?: string[];
  masteryBucket?: AdaptiveChallengeMasteryBucket;
  mistakePatternBucket?: string;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
}

export interface PrerequisiteResolutionResult {
  prerequisiteStatus: AdaptiveChallengePrerequisiteStatus;
  missingPrerequisiteRefs: string[];
  safePrerequisiteLabels: string[];
  safeReasonCodes: string[];
  confidenceBucket: AdaptiveChallengeConfidenceBucket;
  sourceTruthStatus: AdaptiveChallengeSourceTruthStatus;
}

export interface DifficultySignalInput {
  masteryBucket: AdaptiveChallengeMasteryBucket;
  recentAttemptOutcomeBuckets: AdaptiveChallengeAttemptOutcomeBucket[];
  hintDependencyBucket?: string;
  mistakePatternBucket?: string;
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
  revisionDueBucket?: string;
  teachBackBucket?: string;
  supportLevel?: string;
  challengeFeedback?: string;
  readinessLevel?: AdaptiveChallengeReadinessLevel;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
}

export interface DifficultySignalAggregate {
  recommendedDifficultyBand: AdaptiveChallengeDifficultyBand;
  difficultyDelta: AdaptiveChallengeDifficultyDelta;
  riskFlags: string[];
  safeReasonCodes: string[];
  confidenceBucket: AdaptiveChallengeConfidenceBucket;
}

export interface DifficultyCalibrationRequest {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  difficultySignalInput: DifficultySignalInput;
}

export interface DifficultyCalibrationResult {
  difficultyBand: AdaptiveChallengeDifficultyBand;
  difficultyDelta: AdaptiveChallengeDifficultyDelta;
  safeReasonCodes: string[];
  confidenceBucket: AdaptiveChallengeConfidenceBucket;
}

export interface ChallengeBlueprintRequest {
  schoolId: string;
  studentId: string;
  challengeType: AdaptiveChallengeType;
  readinessLevel: AdaptiveChallengeReadinessLevel;
  difficultyBand: AdaptiveChallengeDifficultyBand;
  difficultyDelta: AdaptiveChallengeDifficultyDelta;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  prerequisiteStatus?: AdaptiveChallengePrerequisiteStatus;
  hintScaffoldLevel?: AdaptiveChallengeHintScaffoldLevel;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: string[];
}

export interface ChallengeBlueprint {
  id: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  challengeType: AdaptiveChallengeType;
  readinessLevel: AdaptiveChallengeReadinessLevel;
  difficultyBand: AdaptiveChallengeDifficultyBand;
  difficultyDelta: AdaptiveChallengeDifficultyDelta;
  prerequisiteStatus: AdaptiveChallengePrerequisiteStatus;
  hintScaffoldLevel: AdaptiveChallengeHintScaffoldLevel;
  attemptMode: string;
  safeInstruction: string;
  safeSuccessCriteria: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: AdaptiveChallengeSourceTruthStatus;
  confidenceBucket: AdaptiveChallengeConfidenceBucket;
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

export interface AdaptiveChallengeRuntimeResult {
  ok: boolean;
  status: string;
  data?: ChallengeBlueprint | RemediationPath;
  challengeType?: AdaptiveChallengeType;
  readinessLevel?: AdaptiveChallengeReadinessLevel;
  difficultyBand?: AdaptiveChallengeDifficultyBand;
  policyDecision?: AdaptiveChallengePolicyDecision;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
  safeReasonCodes: string[];
  message?: string;
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

export interface HintScaffoldPolicyResult {
  hintScaffoldLevel: AdaptiveChallengeHintScaffoldLevel;
  allowedHintLevels: AdaptiveChallengeHintScaffoldLevel[];
  safeReasonCodes: string[];
}

export interface RemediationReadinessResult {
  remediationRequired: boolean;
  remediationType: AdaptiveChallengeRemediationType;
  safeReasonCodes: string[];
  confidenceBucket: AdaptiveChallengeConfidenceBucket;
}

export interface RemediationPath {
  remediationType: AdaptiveChallengeRemediationType;
  safeTitle: string;
  safeInstruction: string;
  estimatedStepCount: number;
  recommendedMode: string;
  hintScaffoldLevel: AdaptiveChallengeHintScaffoldLevel;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: AdaptiveChallengeSourceTruthStatus;
  confidenceBucket: AdaptiveChallengeConfidenceBucket;
  privacyFlags: Record<string, boolean>;
}

export interface ChallengeAttemptMetadata {
  challengeId: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  challengeType: AdaptiveChallengeType;
  difficultyBand: AdaptiveChallengeDifficultyBand;
  hintScaffoldLevel: AdaptiveChallengeHintScaffoldLevel;
  attemptOutcomeBucket: AdaptiveChallengeAttemptOutcomeBucket;
  safeMistakePatternBucket?: string;
  safeHintDependencyBucket?: string;
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
  safeReasonCodes: string[];
  safeEvidenceRefs?: string[];
  createdAt: string;
}

export interface ChallengeAttemptIntegrationResult {
  ok: boolean;
  status: string;
  safeReasonCodes: string[];
}

export interface AdaptiveChallengeAuditEvent {
  eventType: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  challengeId?: string;
  challengeType?: string;
  readinessLevel?: string;
  difficultyBand?: string;
  policyDecision: string;
  safeReasonCodes: string[];
  createdAt: string;
}

export interface AdaptiveChallengeAccessResult {
  allowed: boolean;
  policyDecision: AdaptiveChallengePolicyDecision;
  safeReasonCodes: string[];
}

export interface AdaptiveChallengePrivacyResult {
  safe: boolean;
  policyDecision?: AdaptiveChallengePolicyDecision;
  safeReasonCodes: string[];
}

export interface AdaptiveChallengeResponse {
  ok: boolean;
  status: string;
  data?: unknown;
  safeReasonCodes?: string[];
  policyDecision?: AdaptiveChallengePolicyDecision;
  challengeType?: AdaptiveChallengeType;
  readinessLevel?: AdaptiveChallengeReadinessLevel;
  difficultyBand?: AdaptiveChallengeDifficultyBand;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
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

export interface AdaptiveChallengeErrorResponse {
  ok: false;
  status: string;
  policyDecision: AdaptiveChallengePolicyDecision;
  safeReasonCodes: string[];
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
