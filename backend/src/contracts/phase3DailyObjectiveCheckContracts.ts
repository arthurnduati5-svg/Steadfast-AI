export const PHASE3_DAILY_OBJECTIVE_CHECK_STATUSES = [
  'not_started',
  'started',
  'confidence_before_required',
  'in_progress',
  'awaiting_teach_back',
  'awaiting_transfer_check',
  'awaiting_delayed_recall',
  'awaiting_confidence_after',
  'completed',
  'needs_recheck',
  'needs_rescue',
  'needs_teacher_support',
  'source_required',
  'blocked',
  'expired',
] as const;

export type Phase3DailyObjectiveCheckStatus = typeof PHASE3_DAILY_OBJECTIVE_CHECK_STATUSES[number];

export const PHASE3_DAILY_OBJECTIVE_SIGNAL_BUCKETS = [
  'attempt_completed',
  'hint_used',
  'confidence_marked',
  'teach_back_quality_bucket',
  'quiz_recall_bucket',
  'revision_completed',
  'objective_check_passed',
  'objective_check_unstable',
  'mistake_pattern_detected',
  'weak_topic_repeated',
  'transfer_check_attempted',
  'transfer_check_passed',
  'transfer_check_unstable',
  'delayed_recall_attempted',
  'delayed_recall_passed',
  'delayed_recall_unstable',
  'explanation_quality_strong',
  'explanation_quality_partial',
  'explanation_quality_weak',
  'high_hint_dependency',
  'low_hint_dependency',
] as const;

export type Phase3DailyObjectiveSignalBucket = typeof PHASE3_DAILY_OBJECTIVE_SIGNAL_BUCKETS[number];

export const PHASE3_DAILY_OBJECTIVE_COMPLETION_STATUSES = [
  'completed',
  'needs_recheck',
  'needs_rescue',
  'needs_teacher_support',
  'source_required',
  'blocked',
] as const;

export type Phase3DailyObjectiveCompletionStatus = typeof PHASE3_DAILY_OBJECTIVE_COMPLETION_STATUSES[number];

export const PHASE3_DAILY_OBJECTIVE_RECOMMENDED_ACTIONS = [
  'no_action_needed',
  'assign_short_recall',
  'run_teach_back_check',
  'reteach_objective',
  'review_prerequisite',
  'provide_approved_source',
  'small_group_support',
  'teacher_support_needed',
] as const;

export type Phase3DailyObjectiveRecommendedAction = typeof PHASE3_DAILY_OBJECTIVE_RECOMMENDED_ACTIONS[number];

export const PHASE3_DAILY_OBJECTIVE_CONFIDENCE_SHIFT_PATTERNS = [
  'confidence_aligned',
  'confidence_overstated',
  'confidence_understated',
  'confidence_improving',
  'confidence_unstable',
] as const;

export type Phase3DailyObjectiveConfidenceShiftPattern = typeof PHASE3_DAILY_OBJECTIVE_CONFIDENCE_SHIFT_PATTERNS[number];

export const PHASE3_DAILY_OBJECTIVE_AUDIT_EVENT_TYPES = [
  'daily_objective_check_session_started',
  'daily_objective_confidence_before_recorded',
  'daily_objective_attempt_signal_recorded',
  'daily_objective_required_step_completed',
  'daily_objective_confidence_after_recorded',
  'daily_objective_check_completed',
  'daily_objective_check_needs_recheck',
  'daily_objective_check_needs_rescue',
  'daily_objective_check_needs_teacher_support',
  'daily_objective_check_blocked',
  'daily_objective_check_expired',
] as const;

export type Phase3DailyObjectiveAuditEventType = typeof PHASE3_DAILY_OBJECTIVE_AUDIT_EVENT_TYPES[number];

export const PHASE3_DAILY_OBJECTIVE_FORBIDDEN_FIELDS = [
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
] as const;

export type Phase3DailyObjectiveForbiddenField = typeof PHASE3_DAILY_OBJECTIVE_FORBIDDEN_FIELDS[number];

export interface Phase3DailyObjectiveCheckSession {
  checkSessionId: string;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  classId: string;
  subjectId: string;
  topicId: string;
  skillId?: string;
  objectiveId: string;
  dailySeedId?: string;
  blueprintId: string;
  sourceTruthStatus: string;
  status: Phase3DailyObjectiveCheckStatus;
  requiredSteps: string[];
  completedSteps: string[];
  confidenceBefore?: string;
  confidenceAfter?: string;
  safeSignalBuckets: string[];
  safeEvidenceRefs: string[];
  modeDestinationsUsed: string[];
  attemptCount: number;
  hintUsageBucket?: string;
  explanationQualityBucket?: string;
  recallQualityBucket?: string;
  teachBackQualityBucket?: string;
  transferCheckBucket?: string;
  delayedRecallBucket?: string;
  antiCheatSignalLabels: string[];
  learnerSafeReason: string;
  teacherSafeReason: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Phase3DailyObjectiveCheckStep {
  stepId: string;
  checkSessionId: string;
  stepType: string;
  stepLabel: string;
  modeDestination: string;
  completed: boolean;
  safeEvidenceRef?: string;
  completedAt?: string;
}

export interface Phase3DailyObjectiveCheckAttempt {
  attemptId: string;
  checkSessionId: string;
  schoolId: string;
  studentId: string;
  objectiveId: string;
  attemptType: string;
  signalBucket: string;
  hintUsageBucket?: string;
  explanationQualityBucket?: string;
  recallQualityBucket?: string;
  teachBackQualityBucket?: string;
  transferCheckBucket?: string;
  delayedRecallBucket?: string;
  antiCheatLabels: string[];
  timeSpentSeconds?: number;
  safeEvidenceRef?: string;
  createdAt: string;
}

export interface Phase3DailyObjectiveCheckConfidenceCheckpoint {
  checkpointId: string;
  checkSessionId: string;
  schoolId: string;
  studentId: string;
  objectiveId: string;
  checkpointType: 'before' | 'after';
  confidenceLevel: string;
  derivedPattern?: string;
  safeEvidenceRef?: string;
  recordedAt: string;
}

export interface Phase3DailyObjectiveCheckCompletionResult {
  checkSessionId: string;
  objectiveId: string;
  schoolId: string;
  studentId: string;
  previousStatus: string;
  completionStatus: Phase3DailyObjectiveCompletionStatus;
  missingRequiredSteps: string[];
  evidenceBridgeResultId?: string;
  masteryUpdated: boolean;
  newMasteryStatus?: string;
  dailySeedUpdated: boolean;
  safeEvidenceRefs: string[];
  learnerSafeResponse: string;
  teacherSafeReason: string;
  completedAt: string;
}

export interface Phase3DailyObjectiveCheckSafeSignal {
  checkSessionId: string;
  signalBucket: string;
  hintUsageBucket?: string;
  explanationQualityBucket?: string;
  recallQualityBucket?: string;
  teachBackQualityBucket?: string;
  transferCheckBucket?: string;
  delayedRecallBucket?: string;
  antiCheatLabels: string[];
  safeEvidenceRef?: string;
  createdAt: string;
}

export interface Phase3DailyObjectiveCheckLearnerResponse {
  checkSessionId: string;
  objectiveId: string;
  dailySeedId?: string;
  status: Phase3DailyObjectiveCheckStatus;
  safeTitle: string;
  safeMessage: string;
  nextStep: string;
  modeDestination?: string;
  confidencePrompt?: string;
  safeEvidenceRefs: string[];
  masteryStatus?: string;
  estimatedTimeMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Phase3DailyObjectiveCheckTeacherSummary {
  checkSessionId: string;
  objectiveId: string;
  classId: string;
  subjectId: string;
  topicId: string;
  skillId?: string;
  studentId: string;
  status: Phase3DailyObjectiveCheckStatus;
  masteryStatus: string;
  safePatternSummary: string;
  hintDependencyBucket?: string;
  explanationQualityBucket?: string;
  recallQualityBucket?: string;
  teachBackQualityBucket?: string;
  transferCheckStatus?: string;
  delayedRecallStatus?: string;
  safeReasonCodes: string[];
  recommendedTeacherAction: Phase3DailyObjectiveRecommendedAction;
  safeEvidenceRefs: string[];
  updatedAt: string;
}

export interface Phase3DailyObjectiveCheckAuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  studentId: string;
  objectiveId: string;
  dailySeedId?: string;
  checkSessionId: string;
  eventType: Phase3DailyObjectiveAuditEventType;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  createdAt: string;
}

export interface Phase3DailyObjectiveCheckSessionStartInput {
  schoolId: string;
  studentId: string;
  classId?: string;
  subjectId: string;
  topicId?: string;
  skillId?: string;
  objectiveId: string;
  dailySeedId?: string;
  blueprintId?: string;
  tutorLearnerId?: string;
  sourceTruthStatus: string;
}

export interface Phase3DailyObjectiveCheckAttemptInput {
  checkSessionId: string;
  schoolId: string;
  studentId: string;
  attemptType?: string;
  signalBucket: string;
  hintUsageBucket?: string;
  explanationQualityBucket?: string;
  recallQualityBucket?: string;
  teachBackQualityBucket?: string;
  transferCheckBucket?: string;
  delayedRecallBucket?: string;
  antiCheatLabels?: string[];
  timeSpentSeconds?: number;
  safeEvidenceRef?: string;
}

export interface Phase3DailyObjectiveConfidenceInput {
  checkSessionId: string;
  schoolId: string;
  studentId: string;
  confidenceLevel: string;
  checkpointType: 'before' | 'after';
}

export interface Phase3DailyObjectiveCheckCompletionInput {
  checkSessionId: string;
  schoolId: string;
  studentId: string;
}

export interface Phase3DailyObjectiveCheckQuery {
  schoolId: string;
  studentId?: string;
  objectiveId?: string;
  dailySeedId?: string;
  status?: string;
  limit?: number;
}
