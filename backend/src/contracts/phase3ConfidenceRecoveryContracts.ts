export const PHASE3_CONFIDENCE_LEVELS = [
  'not_sure',
  'confused',
  'partly_know',
  'know_this',
  'very_confident',
  'not_reported',
] as const;

export type Phase3ConfidenceLevel = (typeof PHASE3_CONFIDENCE_LEVELS)[number];

export const PHASE3_CONFIDENCE_MISMATCH_TYPES = [
  'none',
  'overconfidence_wrong',
  'overconfidence_explanation_gap',
  'underconfidence_correct',
  'underconfidence_improving',
  'unstable_confidence',
  'confidence_not_reported',
  'source_required',
  'teacher_support_required',
  'blocked',
] as const;

export type Phase3ConfidenceMismatchType = (typeof PHASE3_CONFIDENCE_MISMATCH_TYPES)[number];

export const PHASE3_MICRO_MASTERY_STATUSES = [
  'not_started',
  'early_signal',
  'developing',
  'nearly_stable',
  'stable',
  'needs_recheck',
  'needs_repair',
  'needs_teacher_support',
  'source_required',
  'blocked',
] as const;

export type Phase3MicroMasteryStatus = (typeof PHASE3_MICRO_MASTERY_STATUSES)[number];

export const PHASE3_RECOVERY_STATUSES = [
  'not_needed',
  'watch',
  'practice_next',
  'revisit_next',
  'teach_back_next',
  'revision_next',
  'needs_recheck',
  'needs_repair',
  'needs_teacher_support',
  'source_required',
  'blocked',
  'completed',
] as const;

export type Phase3RecoveryStatus = (typeof PHASE3_RECOVERY_STATUSES)[number];

export const PHASE3_RECOVERY_ACTIONS = [
  'start_recall_check',
  'start_teach_back',
  'open_revision_node',
  'open_focus_mode',
  'open_quiz_mode',
  'open_study_plan_step',
  'review_mistake_pattern',
  'review_weak_topic',
  'ask_teacher_for_help',
  'ask_teacher_for_source',
  'no_action_needed',
] as const;

export type Phase3RecoveryAction = (typeof PHASE3_RECOVERY_ACTIONS)[number];

export const PHASE3_RECOVERY_SOURCE_TYPES = [
  'objective_mastery',
  'daily_objective_check',
  'daily_learning_feed',
  'study_plan',
  'growth_page',
  'living_revision',
  'safe_learning_evidence',
  'teacher_safe_insight',
  'confidence_self_report',
  'micro_mastery_signal',
  'recovery_planner',
] as const;

export type Phase3RecoverySourceType = (typeof PHASE3_RECOVERY_SOURCE_TYPES)[number];

export const PHASE3_RECOVERY_SIGNAL_TYPES = [
  'confidence_reported',
  'confidence_missing',
  'confidence_aligned',
  'overconfidence_wrong',
  'overconfidence_explanation_gap',
  'underconfidence_correct',
  'underconfidence_improving',
  'objective_still_learning',
  'objective_getting_better',
  'objective_nearly_stable',
  'objective_confident',
  'weak_topic_repeated',
  'mistake_pattern_repeated',
  'revision_due',
  'study_plan_due',
  'daily_check_needs_recheck',
  'teach_back_needed',
  'source_required',
  'teacher_support_required',
  'blocked',
] as const;

export type Phase3RecoverySignalType = (typeof PHASE3_RECOVERY_SIGNAL_TYPES)[number];

export const PHASE3_RECOVERY_PRIORITIES = [
  'low',
  'medium',
  'high',
  'urgent',
  'blocked',
] as const;

export type Phase3RecoveryPriority = (typeof PHASE3_RECOVERY_PRIORITIES)[number];

export const PHASE3_RECOVERY_AUDIT_EVENTS = [
  'confidence_observation_recorded',
  'confidence_calibration_created',
  'confidence_mismatch_detected',
  'micro_mastery_signal_created',
  'weak_topic_recovery_plan_created',
  'weak_topic_recovery_step_completed',
  'recovery_action_card_created',
  'confidence_recovery_learner_viewed',
  'confidence_recovery_teacher_overview_viewed',
  'confidence_recovery_source_required_returned',
  'confidence_recovery_teacher_support_returned',
  'confidence_recovery_empty_state_returned',
] as const;

export type Phase3ConfidenceRecoveryAuditEventType = (typeof PHASE3_RECOVERY_AUDIT_EVENTS)[number];

export const PHASE3_CONFIDENCE_RECOVERY_FORBIDDEN_FIELDS = [
  'rawChat',
  'rawMessage',
  'rawAnswer',
  'rawStudentAnswer',
  'rawExplanation',
  'rawPrompt',
  'rawResponse',
  'providerPrompt',
  'providerResponse',
  'rawProviderResponse',
  'chainOfThought',
  'hiddenReasoning',
  'scratchpad',
  'answerKey',
  'correctAnswer',
  'modelAnswer',
  'markingScheme',
  'teacherOnlyNotes',
  'safeguardingRaw',
  'deenSensitiveRaw',
  'authorization',
  'cookie',
  'apiKey',
  'DATABASE_URL',
  'REDIS_URL',
  'connectionString',
  'privateKey',
  'riskScore',
  'diagnosis',
  'pietyScore',
  'leaderboardRank',
  'classmateComparison',
] as const;

export interface Phase3ConfidenceRecoveryContext {
  schoolId: string;
  studentId: string;
  teacherId?: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
}

export interface Phase3ConfidenceObservation {
  observationId: string;
  schoolId: string;
  studentId: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  confidenceLevel: Phase3ConfidenceLevel;
  sourceType: Phase3RecoverySourceType;
  sourceRef: string;
  evidenceStrength: number;
  safeReasonCodes: string[];
  safeSummary: string;
  createdAt: string;
}

export interface Phase3ConfidenceCalibrationResult {
  calibrationId: string;
  schoolId: string;
  studentId: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  confidenceLevel: Phase3ConfidenceLevel;
  evidenceStrength: number;
  alignmentStatus: 'aligned' | 'over_confident' | 'under_confident' | 'unstable' | 'missing' | 'blocked';
  safeSummary: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  recommendedRecoveryAction: Phase3RecoveryAction;
  createdAt: string;
  updatedAt: string;
}

export interface Phase3ConfidenceMismatch {
  mismatchId: string;
  schoolId: string;
  studentId: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  mismatchType: Phase3ConfidenceMismatchType;
  confidenceLevel: Phase3ConfidenceLevel;
  evidenceStrength: number;
  safeSummary: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  recommendedRecoveryAction: Phase3RecoveryAction;
  createdAt: string;
}

export interface Phase3MicroMasterySignal {
  signalId: string;
  schoolId: string;
  studentId: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  microMasteryStatus: Phase3MicroMasteryStatus;
  evidenceStrength: number;
  safeSummary: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Phase3WeakTopicRecoveryStep {
  stepId: string;
  stepType: 'recall_check' | 'teach_back' | 'revision_revisit' | 'focus_mode_step' | 'quiz_mode_step' | 'study_plan_step' | 'mistake_pattern_review' | 'teacher_support' | 'source_confirmation';
  safeTitle: string;
  safeSummary: string;
  order: number;
  completed: boolean;
  completedAt?: string;
  actionType: Phase3RecoveryAction;
  actionAvailable: boolean;
  safeUnavailableReason?: string;
  fallbackAction?: Phase3RecoveryAction;
}

export interface Phase3WeakTopicRecoveryPlan {
  planId: string;
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveIds: string[];
  status: Phase3RecoveryStatus;
  priority: Phase3RecoveryPriority;
  safeTitle: string;
  safeSummary: string;
  steps: Phase3WeakTopicRecoveryStep[];
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  sourceTruthStatus: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase3RecoveryActionCard {
  actionId: string;
  schoolId: string;
  studentId: string;
  planId?: string;
  mismatchId?: string;
  signalId?: string;
  actionType: Phase3RecoveryAction;
  safeTitle: string;
  safeSummary: string;
  actionAvailable: boolean;
  safeUnavailableReason?: string;
  fallbackAction?: Phase3RecoveryAction;
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  createdAt: string;
  completedAt?: string;
}

export interface Phase3ConfidenceRecoverySafeEvidenceRef {
  sourceType: Phase3RecoverySourceType;
  sourceId: string;
  safeSummary: string;
  safeReasonCodes: string[];
  sourceTruthStatus: string;
}

export interface Phase3ConfidenceRecoverySourceTruth {
  sourceTruthStatus: 'approved' | 'teacher_created' | 'school_created' | 'learner_created_visible' | 'source_required' | 'content_gap' | 'blocked' | 'unknown';
  requiresApprovedDeenSource?: boolean;
  approvedSourceRef?: string;
}

export interface Phase3ConfidenceRecoveryLearnerView {
  schoolId: string;
  studentId: string;
  generatedAt: string;
  safeHeadline: string;
  safeSummary: string;
  confidenceCalibration?: Phase3ConfidenceCalibrationResult;
  microMasterySignals: Phase3MicroMasterySignal[];
  recoveryPlans: Phase3WeakTopicRecoveryPlan[];
  recoveryActions: Phase3RecoveryActionCard[];
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
}

export interface Phase3ConfidenceRecoveryTeacherLearnerRow {
  studentId: string;
  confidenceSignalCount: number;
  mismatchCount: number;
  recoveryPlanCount: number;
  microMasterySignalCount: number;
  sourceRequiredCount: number;
  teacherSupportNeeded: number;
  safePatternSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: string[];
}

export interface Phase3ConfidenceRecoveryTeacherTopicRow {
  topicId: string;
  skillId?: string;
  objectiveIds: string[];
  learnersAffectedCount: number;
  mismatchCount: number;
  recoveryPlanCount: number;
  microMasterySignalCount: number;
  sourceRequiredCount: number;
  teacherSupportCount: number;
  safePatternSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: string[];
}

export interface Phase3ConfidenceRecoveryTeacherOverview {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  generatedAt: string;
  totalLearnersWithConfidenceSignals: number;
  totalConfidenceMismatches: number;
  totalWeakTopicRecoveryPlans: number;
  totalMicroMasterySignals: number;
  totalSourceRequired: number;
  totalTeacherSupportNeeded: number;
  learnerRows: Phase3ConfidenceRecoveryTeacherLearnerRow[];
  topicRows: Phase3ConfidenceRecoveryTeacherTopicRow[];
  safeSummary: string;
  recommendedTeacherActions: string[];
}

export interface Phase3ConfidenceRecoveryAuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  calibrationId?: string;
  mismatchId?: string;
  microMasterySignalId?: string;
  recoveryPlanId?: string;
  recoveryActionId?: string;
  eventType: Phase3ConfidenceRecoveryAuditEventType;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface Phase3ConfidenceRecoveryQuery {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
}

export interface Phase3ConfidenceRecoveryTeacherQuery {
  schoolId: string;
  teacherId: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
}
