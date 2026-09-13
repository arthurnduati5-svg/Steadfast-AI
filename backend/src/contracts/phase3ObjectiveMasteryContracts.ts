export const PHASE3_OBJECTIVE_TYPES = [
  'lesson_objective',
  'topic_objective',
  'skill_objective',
  'study_plan_objective',
  'revision_objective',
  'teacher_daily_objective',
  'exam_preparation_objective',
  'group_challenge_objective',
] as const;

export type Phase3ObjectiveType = typeof PHASE3_OBJECTIVE_TYPES[number];

export const PHASE3_MASTERY_STATUSES = [
  'not_started',
  'early_signal',
  'still_learning',
  'getting_better',
  'almost_there',
  'confident',
  'needs_rescue',
  'needs_teacher_support',
  'source_required',
  'blocked',
] as const;

export type Phase3MasteryStatus = typeof PHASE3_MASTERY_STATUSES[number];

export const PHASE3_ANTI_CHEAT_LABELS = [
  'needs_verification',
  'inconsistent_understanding',
  'explanation_gap',
  'overconfidence_wrong',
  'answer_pattern_unstable',
  'high_correctness_low_explanation_signal',
] as const;

export type Phase3AntiCheatLabel = typeof PHASE3_ANTI_CHEAT_LABELS[number];

export const PHASE3_CONFIDENCE_LABELS = [
  'confused',
  'partly_know',
  'know_this',
  'not_sure',
] as const;

export type Phase3ConfidenceLabel = typeof PHASE3_CONFIDENCE_LABELS[number];

export const PHASE3_SOURCE_TRUTH_STATUSES = [
  'approved',
  'teacher_created',
  'school_created',
  'source_required',
  'content_gap',
  'blocked',
  'unknown',
] as const;

export type Phase3SourceTruthStatus = typeof PHASE3_SOURCE_TRUTH_STATUSES[number];

export const PHASE3_RECOMMENDED_ACTIONS = [
  'complete_daily_objective',
  'start_focus_mode',
  'start_quiz_mode',
  'start_teach_back_mode',
  'start_revision_mode',
  'ask_teacher_for_help',
] as const;

export type Phase3RecommendedAction = typeof PHASE3_RECOMMENDED_ACTIONS[number];

export const PHASE3_MODE_DESTINATIONS = [
  'focus',
  'quiz',
  'teach_back',
  'revision',
  'exam',
  'none',
] as const;

export type Phase3ModeDestination = typeof PHASE3_MODE_DESTINATIONS[number];

export const PHASE3_DIFFICULTY_BUCKETS = [
  'foundation',
  'core',
  'challenge',
  'advanced',
] as const;

export type Phase3DifficultyBucket = typeof PHASE3_DIFFICULTY_BUCKETS[number];

export const PHASE3_SEED_SOURCE_TYPES = [
  'teacher_objective',
  'daily_objective_check',
  'mastery_recheck',
] as const;

export type Phase3SeedSourceType = typeof PHASE3_SEED_SOURCE_TYPES[number];

export const PHASE3_AUDIT_EVENT_TYPES = [
  'objective_created',
  'objective_updated',
  'objective_archived',
  'objective_check_blueprint_created',
  'objective_evidence_linked',
  'objective_mastery_updated',
  'teacher_objective_progress_viewed',
  'learner_objective_progress_viewed',
  'daily_objective_seed_created',
] as const;

export type Phase3AuditEventType = typeof PHASE3_AUDIT_EVENT_TYPES[number];

export const PHASE3_MASTERY_REASON_CODES = [
  'no_evidence',
  'first_evidence_received',
  'weak_recall_signal',
  'high_hint_dependency',
  'improvement_detected',
  'strong_recent_evidence',
  'multiple_successful_attempts',
  'teach_back_passed',
  'transfer_check_passed',
  'delayed_recall_passed',
  'spaced_revisit_passed',
  'confidence_aligns_with_evidence',
  'failed_recall',
  'failed_teach_back',
  'repeated_unstable_check',
  'source_context_missing',
  'school_identity_missing',
  'privacy_boundary',
  'deen_boundary',
  'safeguarding_boundary',
  'policy_boundary',
  'teacher_support_requested',
] as const;

export type Phase3MasteryReasonCode = typeof PHASE3_MASTERY_REASON_CODES[number];

export const PHASE3_FORBIDDEN_FIELDS = [
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

export type Phase3ForbiddenField = typeof PHASE3_FORBIDDEN_FIELDS[number];

export interface Phase3LearningSpineContext {
  schoolId: string;
  teacherId?: string;
  learnerId?: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  role?: string;
}

export interface Phase3SafeEvidenceRef {
  evidenceId: string;
  source: string;
  sourceMode: string;
  evidenceType: string;
  evidenceStrength: string;
  createdAt: string;
}

export interface Phase3SourceTruthStatusObject {
  status: Phase3SourceTruthStatus;
  requiresApprovedDeenSource?: boolean;
  requiresApprovedSourceContext?: boolean;
}

export interface Phase3ObjectiveTypeConfig {
  type: Phase3ObjectiveType;
  description: string;
  requiresSkillId?: boolean;
  requiresTopicId?: boolean;
  requiresSubjectId?: boolean;
  requiresClassId?: boolean;
}

export interface Phase3ObjectiveSuccessCriterion {
  criterionId: string;
  description: string;
  measurableIndicator: string;
  successThreshold?: string;
  orderIndex: number;
}

export interface Phase3Objective {
  objectiveId: string;
  schoolId: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  teacherId?: string;
  creatorId: string;
  creatorRole: string;
  objectiveType: Phase3ObjectiveType;
  difficultyBucket: Phase3DifficultyBucket;
  title: string;
  safeDescription: string;
  successCriteria: Phase3ObjectiveSuccessCriterion[];
  sourceTruthStatus: Phase3SourceTruthStatusObject;
  isArchived: boolean;
  safeTags: string[];
  estimatedMinutes: number;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}

export interface Phase3ObjectiveCheckPolicy {
  requiresConfidenceBefore: boolean;
  requiresConfidenceAfter: boolean;
  requiresTeachBack: boolean;
  requiresTransferQuestion: boolean;
  requiresDelayedRecall: boolean;
  hintPolicy: 'allow_hints' | 'limit_hints' | 'no_hints';
  antiCheatPolicy: 'standard' | 'enhanced' | 'strict';
  evidencePolicy: 'basic' | 'standard' | 'full';
  maxAttempts?: number;
  minTimeSeconds?: number;
}

export interface Phase3ObjectiveCheckBlueprint {
  blueprintId: string;
  objectiveId: string;
  schoolId: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  recommendedModeDestination: Phase3ModeDestination;
  checkItems: Phase3ObjectiveCheckItem[];
  successCriteriaRefs: string[];
  checkPolicy: Phase3ObjectiveCheckPolicy;
  confidenceBeforeRequired: boolean;
  confidenceAfterRequired: boolean;
  teachBackRequired: boolean;
  transferQuestionRequired: boolean;
  delayedRecallRequired: boolean;
  sourceTruthStatus: Phase3SourceTruthStatusObject;
  safeInstructions: string;
  createdAt: string;
}

export interface Phase3ObjectiveCheckItem {
  itemId: string;
  itemType: 'recall' | 'understanding' | 'application' | 'teach_back' | 'transfer' | 'confidence';
  promptSafeRef: string;
  orderIndex: number;
  modeDestination: Phase3ModeDestination;
  estimatedTimeMinutes: number;
}

export interface Phase3ObjectiveCheckAttemptSignal {
  signalId: string;
  objectiveId: string;
  blueprintId?: string;
  schoolId: string;
  learnerId: string;
  attemptType: string;
  signalStrength: 'weak' | 'moderate' | 'strong';
  evidenceRef: string;
  antiCheatLabels?: Phase3AntiCheatLabel[];
  confidenceLabel?: Phase3ConfidenceLabel;
  hintUsed: boolean;
  hintLevel?: string;
  timeSpentSeconds?: number;
  mistakeCategory?: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Phase3ObjectiveEvidenceBridgeInput {
  objectiveId: string;
  schoolId: string;
  learnerId: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  modeSessionId?: string;
  evidenceType: string;
  evidenceStrength: string;
  sourceMode: string;
  safeEvidenceRef: string;
  signalBuckets: Record<string, string>;
  antiCheatLabels?: Phase3AntiCheatLabel[];
  confidenceLabel?: Phase3ConfidenceLabel;
  attemptNumber?: number;
  hintUsed: boolean;
  timeSpentBucket?: string;
  reasonCodes: string[];
  idempotencyKey: string;
}

export interface Phase3ObjectiveEvidenceBridgeResult {
  bridgeId: string;
  objectiveId: string;
  schoolId: string;
  learnerId: string;
  evidenceRef: Phase3SafeEvidenceRef;
  signalsDetected: string[];
  antiCheatSignals: Phase3AntiCheatLabel[];
  masteryUpdated: boolean;
  newMasteryStatus?: Phase3MasteryStatus;
  reasonCodes: string[];
  safeSummary: string;
  createdAt: string;
}

export interface Phase3ObjectiveMasteryStatus {
  status: Phase3MasteryStatus;
  reasonCodes: Phase3MasteryReasonCode[];
  evidenceCount: number;
  strongEvidenceCount: number;
  weakEvidenceCount: number;
  lastEvidenceAt?: string;
  lastStatusChangeAt?: string;
}

export interface Phase3ObjectiveMasterySnapshot {
  snapshotId: string;
  objectiveId: string;
  schoolId: string;
  learnerId: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  status: Phase3MasteryStatus;
  reasonCodes: Phase3MasteryReasonCode[];
  evidenceCount: number;
  strongEvidenceCount: number;
  weakEvidenceCount: number;
  attemptCount: number;
  hintDependencyCount: number;
  teachBackPassCount: number;
  transferCheckPassCount: number;
  lastEvidenceAt?: string;
  lastStatusChangeAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase3ObjectiveAntiCheatSignal {
  signalId: string;
  objectiveId: string;
  schoolId: string;
  learnerId: string;
  label: Phase3AntiCheatLabel;
  evidenceRef: string;
  detectedAt: string;
  safeDescription: string;
}

export interface Phase3ObjectiveProgressUpdate {
  objectiveId: string;
  schoolId: string;
  learnerId: string;
  previousStatus: Phase3MasteryStatus;
  newStatus: Phase3MasteryStatus;
  reasonCodes: Phase3MasteryReasonCode[];
  changed: boolean;
  updatedAt: string;
}

export interface Phase3TeacherObjectiveProgressRow {
  objectiveId: string;
  classId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveTitle: string;
  successCriteriaCount: number;
  studentsNotStartedCount: number;
  studentsEarlySignalCount: number;
  studentsStillLearningCount: number;
  studentsGettingBetterCount: number;
  studentsAlmostThereCount: number;
  studentsConfidentCount: number;
  studentsNeedingRescueCount: number;
  studentsNeedingTeacherSupportCount: number;
  studentsSourceRequiredCount: number;
  safeCommonPatternSummary: string;
  recommendedTeacherAction: string;
  safeEvidenceRefs: Phase3SafeEvidenceRef[];
  updatedAt: string;
}

export interface Phase3TeacherObjectiveProgressView {
  schoolId: string;
  classId?: string;
  teacherId: string;
  rows: Phase3TeacherObjectiveProgressRow[];
  totalObjectives: number;
  generatedAt: string;
}

export interface Phase3LearnerObjectiveProgressCard {
  objectiveId: string;
  title: string;
  safeDescription: string;
  masteryStatus: Phase3MasteryStatus;
  statusReason: string;
  nextAction: Phase3RecommendedAction;
  modeDestination: Phase3ModeDestination;
  safeEvidenceRefs: Phase3SafeEvidenceRef[];
  confidencePrompt?: string;
  estimatedTimeMinutes: number;
  updatedAt: string;
}

export interface Phase3LearnerObjectiveProgressView {
  schoolId: string;
  learnerId: string;
  classId?: string;
  cards: Phase3LearnerObjectiveProgressCard[];
  totalObjectives: number;
  confidentCount: number;
  needingSupportCount: number;
  generatedAt: string;
}

export interface Phase3DailyObjectiveCheckSeed {
  seedId: string;
  schoolId: string;
  studentId: string;
  classId?: string;
  sourceType: Phase3SeedSourceType;
  title: string;
  safeDescription: string;
  targetObjectiveId: string;
  topicId?: string;
  skillId?: string;
  modeDestination: Phase3ModeDestination;
  priority: 'low' | 'medium' | 'high';
  estimatedTimeMinutes: number;
  reasonCode: string;
  antiCheatPolicy: string;
  evidencePolicy: string;
  completionStatus: 'pending' | 'completed' | 'skipped';
  safeEvidenceRefs: Phase3SafeEvidenceRef[];
  createdAt: string;
  dueAt: string;
  completedAt?: string;
}

export interface Phase3LearnerSafeObjectiveExplanation {
  objectiveId: string;
  title: string;
  safeExplanation: string;
  status: Phase3MasteryStatus;
  nextStep: string;
  modeDestination: Phase3ModeDestination;
  estimatedTimeMinutes: number;
  safeEvidenceRefs: Phase3SafeEvidenceRef[];
}

export interface Phase3TeacherSafeObjectiveSummary {
  objectiveId: string;
  title: string;
  classId: string;
  subjectId?: string;
  topicId?: string;
  totalStudents: number;
  confidentCount: number;
  rescueCount: number;
  teacherSupportCount: number;
  safeSummary: string;
  recommendedAction: string;
  safeEvidenceRefs: Phase3SafeEvidenceRef[];
  updatedAt: string;
}

export interface Phase3ObjectiveGrowthActionBridgeSignal {
  objectiveId: string;
  studentId: string;
  schoolId: string;
  topicId?: string;
  skillId?: string;
  masteryStatus: Phase3MasteryStatus;
  reasonCodes: Phase3MasteryReasonCode[];
  recommendedAction: Phase3RecommendedAction;
  modeDestination: Phase3ModeDestination;
  safeEvidenceRefs: Phase3SafeEvidenceRef[];
}

export interface Phase3ObjectiveAuditEvent {
  eventId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
  targetLearnerId?: string;
  objectiveId?: string;
  classId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  eventType: Phase3AuditEventType;
  reasonCodes: string[];
  safeEvidenceRefs: Phase3SafeEvidenceRef[];
  createdAt: string;
}
