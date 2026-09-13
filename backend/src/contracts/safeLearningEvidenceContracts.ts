export const SAFE_LEARNING_EVIDENCE_TYPES = [
  'tutor_turn_received',
  'tutor_turn_routed',
  'tutor_turn_dispatched',
  'mode_entered',
  'mode_exited',
  'mode_summary_created',
  'attempt_started',
  'attempt_submitted',
  'attempt_quality_marked',
  'hint_requested',
  'hint_used',
  'hint_dependency_detected',
  'stuck_detected',
  'recovery_detected',
  'mistake_detected',
  'repeated_mistake_detected',
  'step_successful',
  'reflection_submitted',
  'reflection_quality_marked',
  'teach_back_submitted',
  'teach_back_quality_marked',
  'quiz_recall_checked',
  'quiz_recall_quality_marked',
  'exam_honest_attempt_recorded',
  'focus_step_completed',
  'revision_item_started',
  'revision_item_attempted',
  'revision_item_completed',
  'revision_item_rescheduled',
  'growth_action_resolved',
  'growth_action_executed',
  'why_this_next_generated',
  'content_gap_detected',
  'deen_referral_created',
  'teacher_support_recommended',
  'blocked_answer_key_request',
  'blocked_model_answer_request',
  'blocked_unsafe_request',
] as const;

export type SafeLearningEvidenceType = typeof SAFE_LEARNING_EVIDENCE_TYPES[number];

export const SAFE_LEARNING_EVIDENCE_STRENGTHS = [
  'none',
  'weak',
  'moderate',
  'strong',
  'mastery_candidate',
  'blocked',
  'content_gap',
  'deen_referral',
] as const;

export type SafeLearningEvidenceStrength = typeof SAFE_LEARNING_EVIDENCE_STRENGTHS[number];

export const SAFE_LEARNING_EVIDENCE_SOURCE_MODES = [
  'focus',
  'exam',
  'quiz',
  'teach_back',
  'revision',
  'learning',
  'growth',
  'tutor_turn',
  'content_gap',
  'deen_referral',
  'unknown',
] as const;

export type SafeLearningEvidenceSourceMode = typeof SAFE_LEARNING_EVIDENCE_SOURCE_MODES[number];

export const SAFE_LEARNING_EVIDENCE_SOURCE_TASKS = [
  'task_001',
  'task_002',
  'task_003',
  'task_004',
  'task_005',
  'task_006',
  'task_007',
  'task_008',
  'task_009',
  'task_010',
  'task_011',
  'external',
  'unknown',
] as const;

export type SafeLearningEvidenceSourceTask = typeof SAFE_LEARNING_EVIDENCE_SOURCE_TASKS[number];

export const SAFE_LEARNING_EVIDENCE_SOURCE_TRUTH_STATUSES = [
  'real',
  'demo',
  'fallback',
  'synthetic_test',
  'unknown',
  'stale',
  'expired',
  'content_gap',
  'source_required',
] as const;

export type SafeLearningEvidenceSourceTruthStatus = typeof SAFE_LEARNING_EVIDENCE_SOURCE_TRUTH_STATUSES[number];

export const SAFE_LEARNING_EVIDENCE_DATA_QUALITY_STATUSES = [
  'valid',
  'partial',
  'insufficient',
  'stale',
  'unsafe_rejected',
  'duplicate_ignored',
  'blocked',
  'failed',
] as const;

export type SafeLearningEvidenceDataQualityStatus = typeof SAFE_LEARNING_EVIDENCE_DATA_QUALITY_STATUSES[number];

export const SAFE_LEARNING_EVIDENCE_AGGREGATE_WINDOWS = [
  'current_session',
  'daily',
  'weekly',
  'monthly',
  'term',
  'all_time',
] as const;

export type SafeLearningEvidenceAggregateWindow = typeof SAFE_LEARNING_EVIDENCE_AGGREGATE_WINDOWS[number];

export const SAFE_LEARNING_EVIDENCE_PROOF_STATUSES = [
  'not_enough_evidence',
  'early_signal',
  'growth_observed',
  'mastery_candidate',
  'weakness_detected',
  'revision_needed',
  'teacher_review_needed',
  'blocked',
] as const;

export type SafeLearningEvidenceProofStatus = typeof SAFE_LEARNING_EVIDENCE_PROOF_STATUSES[number];

export const SAFE_LEARNING_EVIDENCE_POLICY_DECISIONS = [
  'allowed',
  'blocked_forbidden_raw_field',
  'blocked_cross_school',
  'blocked_cross_student',
  'blocked_missing_school_context',
  'blocked_missing_learner_context',
  'blocked_missing_role',
  'blocked_unsafe_content',
  'blocked_content_gap',
  'blocked_deen_sensitive',
  'blocked_answer_key_request',
  'blocked_model_answer_request',
  'blocked_no_approved_content',
  'blocked_demo_fallback_as_real_proof',
  'blocked_insufficient_evidence',
  'blocked_stale_evidence',
  'blocked_expired_evidence',
  'duplicate_ignored',
  'unknown',
] as const;

export type SafeLearningEvidencePolicyDecision = typeof SAFE_LEARNING_EVIDENCE_POLICY_DECISIONS[number];

export const SAFE_LEARNING_EVIDENCE_VIEW_SCOPES = [
  'student_self',
  'teacher_safe',
  'admin_diagnostics',
  'parent_safe',
  'system_internal',
] as const;

export type SafeLearningEvidenceViewScope = typeof SAFE_LEARNING_EVIDENCE_VIEW_SCOPES[number];

export const FORBIDDEN_SAFE_LEARNING_EVIDENCE_FIELDS = [
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

export type ForbiddenSafeLearningEvidenceField = typeof FORBIDDEN_SAFE_LEARNING_EVIDENCE_FIELDS[number];

export interface SafeLearningEvidenceIngestRequest {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  conversationId?: string;
  tutorSessionId?: string;
  turnId?: string;
  modeSessionId?: string;
  sourceTask: string;
  sourceMode: string;
  evidenceType: string;
  evidenceStrength: string;
  sourceTruthStatus?: string;
  dataQualityStatus?: string;
  approvedContentRef?: string;
  contentFingerprint?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  targetType?: string;
  targetRef?: string;
  attemptNumber?: number;
  timeSpentBucket?: string;
  difficultyBucket?: string;
  supportNeed?: string;
  hintLevel?: string;
  hintDependencyBucket?: string;
  mistakeCategory?: string;
  misconceptionCategory?: string;
  recallQuality?: string;
  explanationQualityBucket?: string;
  reflectionQualityBucket?: string;
  readinessBucket?: string;
  masterySignal?: string;
  weakTopicSignal?: string;
  revisionSignal?: string;
  growthProofSignal?: string;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: string[];
  idempotencyKey?: string;
  [key: string]: unknown;
}

export interface SafeLearningEvidenceRecord {
  id: string;
  idempotencyKey: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  conversationId?: string;
  tutorSessionId?: string;
  turnId?: string;
  modeSessionId?: string;
  sourceTask: string;
  sourceMode: string;
  evidenceType: string;
  evidenceStrength: string;
  sourceTruthStatus: string;
  dataQualityStatus: string;
  approvedContentRef?: string;
  contentFingerprint?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  targetType?: string;
  targetRef?: string;
  attemptNumber?: number;
  timeSpentBucket?: string;
  difficultyBucket?: string;
  supportNeed?: string;
  hintLevel?: string;
  hintDependencyBucket?: string;
  mistakeCategory?: string;
  misconceptionCategory?: string;
  recallQuality?: string;
  explanationQualityBucket?: string;
  reflectionQualityBucket?: string;
  readinessBucket?: string;
  masterySignal?: string;
  weakTopicSignal?: string;
  revisionSignal?: string;
  growthProofSignal?: string;
  policyDecision: string;
  safeReasonCodesJson: string[];
  safeEvidenceRefsJson: string[];
  safeMetadataJson: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SafeLearningEvidenceContext {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  conversationId?: string;
  tutorSessionId?: string;
  turnId?: string;
  modeSessionId?: string;
  requestId: string;
  timestamp: string;
  role: string;
}

export interface SafeLearningEvidencePolicyResult {
  allowed: boolean;
  policyDecision: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: string;
  dataQualityStatus: string;
}

export interface SafeLearningEvidenceDeduplicationResult {
  duplicate: boolean;
  policyDecision: string;
  safeReasonCodes: string[];
}

export interface SafeLearningEvidencePersistenceResult {
  persisted: boolean;
  record?: SafeLearningEvidenceRecord;
  policyDecision: string;
  dataQualityStatus: string;
  idempotencyKey: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
}

export interface SafeLearningEvidenceAggregate {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  aggregateWindow: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  evidenceCount: number;
  realEvidenceCount: number;
  weakSignalCount: number;
  masterySignalCount: number;
  revisionSignalCount: number;
  mistakeSignalCount: number;
  hintDependencyCount: number;
  reflectionCount: number;
  teachBackCount: number;
  quizRecallCount: number;
  lastEvidenceAt?: string;
  confidenceBucket: string;
  safeSummaryJson: Record<string, unknown>;
}

export interface SafeLearningEvidenceAggregateRequest {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  aggregateWindow: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
}

export interface GrowthProofCandidate {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  proofStatus: string;
  proofStrength: string;
  sourceEvidenceIds: string[];
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  sourceTruthStatus: string;
  confidenceBucket: string;
  createdAt: string;
}

export interface GrowthProofSummary {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  proofStatus: string;
  sourceTruthStatus: string;
  confidenceBucket: string;
  evidenceCount: number;
  realEvidenceCount: number;
  weakSignals: number;
  masterySignals: number;
  revisionSignals: number;
  mistakeSignals: number;
  hintDependencySignals: number;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  studentSafeMessage?: string;
}

export interface MasteryUpdateCandidate {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  masterySignal: string;
  evidenceType: string;
  sourceTruthStatus: string;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  confidenceBucket: string;
  canSupportMastery: boolean;
}

export interface WeakTopicUpdateCandidate {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  weakTopicSignal: string;
  evidenceType: string;
  mistakeCategory?: string;
  hintDependencyBucket?: string;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  confidenceBucket: string;
}

export interface RevisionScheduleCandidate {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  revisionSignal: string;
  evidenceType: string;
  recallQuality?: string;
  mistakeCategory?: string;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  priorityBucket: string;
}

export interface WhyThisNextEvidencePacket {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  safeEvidenceRefs: string[];
  sourceTruthSummary: string;
  confidenceBucket: string;
  safeReasonCodes: string[];
  recommendedEvidenceUse: string[];
}

export interface TeacherSafeEvidenceView {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  safeProgressBucket: string;
  weakTopicCount: number;
  supportNeedBucket: string;
  revisionDueCount: number;
  teacherSupportRecommendation: string;
  safeReasonCodes: string[];
  lastEvidenceAt?: string;
}

export interface LearnerSafeEvidenceView {
  schoolId: string;
  studentId: string;
  proofStatus: string;
  safeProgressSummary: string;
  strengths: string[];
  areasToReview: string[];
  safeReasonCodes: string[];
  lastEvidenceAt?: string;
}

export interface SafeLearningEvidenceTelemetryEvent {
  id: string;
  schoolId: string;
  studentId?: string;
  eventType: string;
  policyDecision: string;
  safeReasonCodes: string[];
  safeMetadataJson: Record<string, unknown>;
  createdAt: string;
}

export interface SafeLearningEvidenceResponse {
  ok: boolean;
  status: string;
  message?: string;
  policyDecision?: string;
  dataQualityStatus?: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  studentSafeMessage?: string;
  evidence?: SafeLearningEvidenceRecord;
  aggregate?: SafeLearningEvidenceAggregate;
  growthProof?: GrowthProofSummary;
  whyThisNextPacket?: WhyThisNextEvidencePacket;
  teacherView?: TeacherSafeEvidenceView;
  learnerView?: LearnerSafeEvidenceView;
  telemetryEvent?: SafeLearningEvidenceTelemetryEvent;
}

export interface SafeLearningEvidenceErrorResponse {
  ok: false;
  code: string;
  message: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
}
