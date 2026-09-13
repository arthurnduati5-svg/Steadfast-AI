export const TEACHER_SAFE_INSIGHT_TYPES = [
  'learner_summary',
  'class_summary',
  'weak_topic_cluster',
  'support_need_queue',
  'revision_attention_queue',
  'mastery_progress_summary',
  'growth_proof_summary',
  'hint_dependency_summary',
  'mistake_pattern_summary',
  'teach_back_quality_summary',
  'quiz_recall_summary',
  'exam_honest_attempt_summary',
  'focus_recovery_summary',
  'teacher_next_action',
  'learner_safe_progress',
  'content_gap_summary',
  'deen_referral_summary',
  'safeguarding_safe_signal_summary',
] as const;
export type TeacherSafeInsightType = typeof TEACHER_SAFE_INSIGHT_TYPES[number];

export const TEACHER_SAFE_REPORT_SCOPES = [
  'learner',
  'class',
  'subject',
  'topic',
  'skill',
  'objective',
  'teacher_assignment',
  'school_admin',
] as const;
export type TeacherSafeReportScope = typeof TEACHER_SAFE_REPORT_SCOPES[number];

export const TEACHER_SAFE_VIEW_AUDIENCES = [
  'teacher',
  'school_admin',
  'safeguarding_authorized',
  'student',
  'parent_safe_if_enabled',
  'system_internal',
] as const;
export type TeacherSafeViewAudience = typeof TEACHER_SAFE_VIEW_AUDIENCES[number];

export const TEACHER_SAFE_NEXT_ACTION_TYPES = [
  'review_weak_topic',
  'assign_revision',
  'start_small_group_support',
  'check_in_privately',
  'recommend_focus_mode',
  'recommend_quiz_mode',
  'recommend_teach_back',
  'recommend_revision_mode',
  'clarify_content_gap',
  'refer_deen_question',
  'escalate_safeguarding_if_authorized',
  'no_action_needed',
] as const;
export type TeacherSafeNextActionType = typeof TEACHER_SAFE_NEXT_ACTION_TYPES[number];

export const TEACHER_SAFE_SUPPORT_PRIORITIES = [
  'none',
  'low',
  'medium',
  'high',
  'urgent_safe_escalation',
] as const;
export type TeacherSafeSupportPriority = typeof TEACHER_SAFE_SUPPORT_PRIORITIES[number];

export const TEACHER_SAFE_SOURCE_TRUTH_STATUSES = [
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
] as const;
export type TeacherSafeSourceTruthStatus = typeof TEACHER_SAFE_SOURCE_TRUTH_STATUSES[number];

export const TEACHER_SAFE_CONFIDENCE_BUCKETS = [
  'not_enough_evidence',
  'low',
  'medium',
  'high',
  'mixed',
  'blocked',
] as const;
export type TeacherSafeConfidenceBucket = typeof TEACHER_SAFE_CONFIDENCE_BUCKETS[number];

export const TEACHER_SAFE_POLICY_DECISIONS = [
  'allowed',
  'blocked_no_school_context',
  'blocked_no_teacher_identity',
  'blocked_student_role',
  'blocked_parent_role',
  'blocked_unknown_role',
  'blocked_cross_school',
  'blocked_cross_class',
  'blocked_cross_student',
  'blocked_scope_not_proven',
  'blocked_forbidden_raw_field',
  'blocked_safeguarding_route_requires_authorization',
  'blocked_insufficient_evidence',
  'blocked_demo_fallback_evidence',
  'blocked_content_gap',
  'blocked_system_internal_only',
] as const;
export type TeacherSafePolicyDecision = typeof TEACHER_SAFE_POLICY_DECISIONS[number];

export const TEACHER_SAFE_REASON_CODES = [
  'no_safe_learning_evidence_yet',
  'no_real_learning_evidence_yet',
  'non_real_evidence_cannot_support_teacher_insight',
  'teacher_scope_not_proven',
  'forbidden_raw_field_detected',
  'cross_school_access_blocked',
  'cross_class_access_blocked',
  'student_role_blocked_from_teacher_report',
  'parent_role_not_enabled',
  'unknown_role_blocked',
  'safeguarding_role_required',
  'evidence_too_sparse',
  'evidence_stale',
  'evidence_expired',
  'evidence_demo_only',
  'evidence_fallback_only',
  'evidence_synthetic_only',
  'content_gap_no_curriculum_context',
  'deen_referral_created',
  'safeguarding_signal_separated',
  'insufficient_real_evidence',
  'answer_key_safety_event',
  'model_answer_safety_event',
  'marking_scheme_safety_event',
  'correct_answer_safety_event',
] as const;
export type TeacherSafeReasonCode = typeof TEACHER_SAFE_REASON_CODES[number];

export const FORBIDDEN_TEACHER_SAFE_REPORT_FIELDS = [
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
export type ForbiddenTeacherSafeReportField = typeof FORBIDDEN_TEACHER_SAFE_REPORT_FIELDS[number];

export interface TeacherSafeInsightContext {
  schoolId: string;
  teacherId: string;
  role: string;
  classId?: string;
  studentId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  requestId: string;
}

export interface TeacherSafeInsightRequest {
  schoolId: string;
  teacherId: string;
  classId?: string;
  studentId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  insightType: TeacherSafeInsightType;
  reportScope: TeacherSafeReportScope;
  viewAudience: TeacherSafeViewAudience;
}

export interface TeacherSafeLearnerSummaryRequest extends TeacherSafeInsightRequest {
  insightType: 'learner_summary' | 'learner_safe_progress' | 'deen_referral_summary' | 'safeguarding_safe_signal_summary';
  studentId: string;
}

export interface TeacherSafeClassSummaryRequest extends TeacherSafeInsightRequest {
  insightType: 'class_summary';
  classId: string;
}

export interface TeacherSafeSupportQueueRequest extends TeacherSafeInsightRequest {
  insightType: 'support_need_queue';
  classId: string;
}

export interface TeacherSafeNextActionRequest extends TeacherSafeInsightRequest {
  insightType: 'teacher_next_action';
  studentId?: string;
  classId?: string;
}

export interface TeacherSafeDashboardEvidenceRequest extends TeacherSafeInsightRequest {
  insightType: 'mastery_progress_summary' | 'growth_proof_summary';
  studentId?: string;
  classId?: string;
}

export interface TeacherSafeScopePolicyResult {
  allowed: boolean;
  decision: TeacherSafePolicyDecision;
  reasonCodes: TeacherSafeReasonCode[];
  detail?: string;
}

export interface TeacherSafePrivacyResult {
  safe: boolean;
  forbiddenFieldsFound: string[];
  redacted: boolean;
  reasonCodes: TeacherSafeReasonCode[];
}

export interface TeacherSafeSourceTruthResult {
  status: TeacherSafeSourceTruthStatus;
  canSupportTeacherInsight: boolean;
  realCount: number;
  nonRealCount: number;
  reasonCodes: TeacherSafeReasonCode[];
}

export interface TeacherSafeEvidencePacket {
  safeEvidenceRefs: string[];
  sourceTruthStatus: TeacherSafeSourceTruthStatus;
  confidenceBucket: TeacherSafeConfidenceBucket;
  evidenceCount: number;
  safeReasonCodes: TeacherSafeReasonCode[];
  topicId?: string;
  skillId?: string;
  supportNeedBucket?: string;
  masteryBucket?: string;
  revisionNeedBucket?: string;
  growthProofBucket?: string;
  lastEvidenceAt?: string;
}

export interface TeacherSafeLearnerSummary {
  id: string;
  schoolId: string;
  teacherId: string;
  classId?: string;
  studentId: string;
  tutorLearnerId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  insightType: 'learner_summary';
  reportScope: TeacherSafeReportScope;
  viewAudience: TeacherSafeViewAudience;
  safeSummary: string;
  safeReasonCodes: TeacherSafeReasonCode[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: TeacherSafeSourceTruthStatus;
  confidenceBucket: TeacherSafeConfidenceBucket;
  supportPriority: TeacherSafeSupportPriority;
  nextActionType?: TeacherSafeNextActionType;
  progressBucket?: string;
  recentGrowthSignal?: string;
  weakTopicBucket?: string;
  revisionNeedBucket?: string;
  hintDependencyBucket?: string;
  teachBackQualityBucket?: string;
  quizRecallBucket?: string;
  supportNeedBucket?: string;
  recommendedTeacherAction?: string;
  createdAt: string;
  updatedAt: string;
  rawPrivateDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
}

export interface TeacherSafeClassSummary {
  id: string;
  schoolId: string;
  teacherId: string;
  classId: string;
  studentCount: number;
  evidenceCount: number;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  insightType: 'class_summary';
  reportScope: TeacherSafeReportScope;
  viewAudience: TeacherSafeViewAudience;
  safeSummary: string;
  safeReasonCodes: TeacherSafeReasonCode[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: TeacherSafeSourceTruthStatus;
  confidenceBucket: TeacherSafeConfidenceBucket;
  supportPriority: TeacherSafeSupportPriority;
  commonWeakTopicClusters: string[];
  commonRevisionNeeds: string[];
  commonSupportNeeds: string[];
  safeRecommendedGroupActions: string[];
  createdAt: string;
  updatedAt: string;
  rawPrivateDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
}

export interface TeacherSafeWeakTopicCluster {
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
  difficultyBucket?: string;
  mistakeCategory?: string;
  hintDependencyBucket?: string;
  revisionNeedBucket?: string;
  studentCount: number;
  evidenceCount: number;
  safeSummary: string;
  safeReasonCodes: TeacherSafeReasonCode[];
  safeEvidenceRefs: string[];
  confidenceBucket: TeacherSafeConfidenceBucket;
}

export interface TeacherSafeSupportQueueItem {
  studentId: string;
  classId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  supportPriority: TeacherSafeSupportPriority;
  supportNeedBucket: string;
  recommendedAction: string;
  safeSummary: string;
  safeReasonCodes: TeacherSafeReasonCode[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: TeacherSafeSourceTruthStatus;
  confidenceBucket: TeacherSafeConfidenceBucket;
}

export interface TeacherSafeRevisionAttentionItem {
  studentId: string;
  subjectId: string;
  topicId: string;
  skillId: string;
  priority: TeacherSafeSupportPriority;
  reason: string;
  safeEvidenceRefs: string[];
}

export interface TeacherSafeNextActionRecommendation {
  studentId?: string;
  classId?: string;
  actionType: TeacherSafeNextActionType;
  priority: TeacherSafeSupportPriority;
  safeSummary: string;
  safeReasonCodes: TeacherSafeReasonCode[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: TeacherSafeSourceTruthStatus;
  confidenceBucket: TeacherSafeConfidenceBucket;
}

export interface TeacherSafeDashboardEvidencePacket {
  summaryCards: TeacherSafeLearnerSummary[];
  supportQueuePreview: TeacherSafeSupportQueueItem[];
  weakTopicClusters: TeacherSafeWeakTopicCluster[];
  revisionAttentionPreview: TeacherSafeRevisionAttentionItem[];
  growthProofSnapshot: TeacherSafeLearnerSummary[];
  teacherNextActions: TeacherSafeNextActionRecommendation[];
  sourceTruthSummary: {
    status: TeacherSafeSourceTruthStatus;
    realCount: number;
    nonRealCount: number;
  };
  safeReasonCodes: TeacherSafeReasonCode[];
  rawPrivateDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
}

export type TeacherSafeReportAuditEventType =
  | 'teacher_safe_report_requested'
  | 'teacher_safe_report_returned'
  | 'teacher_safe_report_blocked'
  | 'teacher_safe_scope_denied'
  | 'teacher_safe_raw_field_rejected'
  | 'teacher_safe_safeguarding_route_used'
  | 'teacher_safe_report_failed';

export interface TeacherSafeReportAuditEvent {
  id: string;
  schoolId: string;
  teacherId: string;
  classId?: string;
  studentId?: string;
  reportType: TeacherSafeInsightType;
  policyDecision: TeacherSafePolicyDecision;
  safeReasonCodes: TeacherSafeReasonCode[];
  createdAt: string;
}

export interface TeacherSafeInsightResponse {
  ok: boolean;
  status: 'ok' | 'empty' | 'insufficient' | 'blocked';
  reportType: TeacherSafeInsightType;
  scope: TeacherSafeReportScope;
  data: unknown;
  safeReasonCodes: TeacherSafeReasonCode[];
  sourceTruthStatus: TeacherSafeSourceTruthStatus;
  confidenceBucket: TeacherSafeConfidenceBucket;
  generatedAt: string;
  rawPrivateDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
}

export interface TeacherSafeInsightErrorResponse {
  ok: false;
  status: 'blocked' | 'error';
  policyDecision?: TeacherSafePolicyDecision;
  safeReasonCodes: TeacherSafeReasonCode[];
  generatedAt: string;
  rawPrivateDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
}
