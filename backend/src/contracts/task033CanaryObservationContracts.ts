export type Task033ObservationRole =
  | 'admin'
  | 'operator'
  | 'teacher'
  | 'student'
  | 'unknown';

export type Task033ObservationWindowStatus =
  | 'not_started'
  | 'collecting'
  | 'reviewing'
  | 'blocked'
  | 'paused'
  | 'rolled_back'
  | 'completed';

export type Task033ObservationEvidenceType =
  | 'aggregate_session_count'
  | 'aggregate_gate_denial_count'
  | 'aggregate_latency'
  | 'aggregate_error_count'
  | 'safe_event_summary'
  | 'hashed_actor_reference';

export type Task033FeedbackSource =
  | 'teacher'
  | 'student_safe'
  | 'admin_review'
  | 'operator_review';

export type Task033HealthBudgetStatus =
  | 'passed'
  | 'failed';

export type Task033PostCanaryDecision =
  | 'continue_observation'
  | 'hold_canary'
  | 'pause_canary'
  | 'rollback_canary'
  | 'safe_to_prepare_next_controlled_rollout_step'
  | 'not_safe_to_expand';

export type Task033FinalDecision =
  | 'TASK_033_PASS_SAFE_TO_START_TASK_034'
  | 'TASK_033_FAIL_NOT_SAFE_TO_START_TASK_034';

export type Task033IncidentSignal =
  | 'privacy_risk'
  | 'school_auth_risk'
  | 'canary_membership_risk'
  | 'socratic_integrity_risk'
  | 'deen_governance_risk'
  | 'curriculum_source_risk'
  | 'safeguarding_risk'
  | 'performance_risk'
  | 'system_error_risk'
  | 'rollback_needed';

export type Task033TeacherFeedbackCategory =
  | 'student_confusion_pattern'
  | 'curriculum_mismatch'
  | 'pacing_issue'
  | 'socratic_quality_issue'
  | 'safety_concern_summary'
  | 'deen_referral_needed'
  | 'technical_issue'
  | 'positive_learning_signal';

export type Task033StudentSafeFeedbackCategory =
  | 'helpful'
  | 'confusing'
  | 'too_hard'
  | 'too_easy'
  | 'technical_issue'
  | 'needs_teacher_help'
  | 'not_sure';

export interface Task033Task032ProofStatus {
  ok: boolean;
  reportFound: boolean;
  taskId: string;
  safeToStartTask033: boolean;
  finalDecision: string;
  blockingIssuesEmpty: boolean;
  verificationExitCodeZero: boolean;
  controlledCanaryScenarioRun: boolean;
  controlledCanarySafeToStartTask033: boolean;
  handoffConsistent: boolean;
  handoffAgreesWithReport: boolean;
  standaloneLogExists: boolean;
  standaloneLogExitZero: boolean;
  privacyScanPassed: boolean;
  testsPassed: boolean;
  noStalePlaceholders: boolean;
  proofLoaded: boolean;
  blockingIssues: string[];
}

export interface Task033CanaryObservationConfig {
  observationRunId: string;
  observationWindowId: string;
  canaryRunId: string;
  schoolId: string;
  tenantId: string;
  cohortId: string;
  maxCanaryPercent: number;
  maxCanaryStudents: number;
  observationMode: string;
  allowOpenRollout: boolean;
  allowSchoolWideRollout: boolean;
  allowRawChatCapture: boolean;
  allowRawMemoryCapture: boolean;
  allowProviderPromptCapture: boolean;
  allowProviderResponseCapture: boolean;
  requireTeacherReview: boolean;
  requireAdminReview: boolean;
  requireRollbackReady: boolean;
  envFlagsValid: boolean;
  nodeEnvSafe: boolean;
  blockingIssues: string[];
}

export interface Task033ObservationEvidenceResult {
  ok: boolean;
  observationRunId: string;
  evidenceCaptured: boolean;
  aggregateOnly: boolean;
  rawPrivateDataCaptured: boolean;
  safeEvidenceItemCount: number;
  sessionCount: number;
  successfulGatedSessionCount: number;
  safeDenialCount: number;
  schoolAuthDenialCount: number;
  cohortDenialCount: number;
  curriculumGateDenialCount: number;
  sourceGateDenialCount: number;
  socraticPolicyBlockCount: number;
  deenReferralCount: number;
  privacyBlockCount: number;
  aiBeforeGateBlockCount: number;
  memoryBeforeGateBlockCount: number;
  pauseStateCount: number;
  killSwitchStateCount: number;
  rollbackStateCount: number;
  aggregateLatencyMs: number;
  aggregateErrorCount: number;
  safeEventSummaries: string[];
  blockingIssues: string[];
}

export interface Task033AggregateMonitoringSnapshot {
  observationRunId: string;
  canaryRunId: string;
  schoolId: string;
  cohortId: string;
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  approvedCanaryStudentCount: number;
  activeCanaryStudentCount: number;
  canarySessionCount: number;
  successfulSessionCount: number;
  safeDenialCount: number;
  errorCount: number;
  schoolAuthDenialCount: number;
  cohortMembershipDenialCount: number;
  curriculumGateDenialCount: number;
  sourceGateDenialCount: number;
  socraticGateDenialCount: number;
  deenGateDenialCount: number;
  privacyGateDenialCount: number;
  aiBeforeGateBlockCount: number;
  memoryBeforeGateBlockCount: number;
  teacherFeedbackCount: number;
  studentSafeFeedbackCount: number;
  incidentSignalCount: number;
  rollbackReady: boolean;
  pauseActive: boolean;
  killSwitchActive: boolean;
  schoolWideRolloutPerformed: boolean;
  openRolloutPerformed: boolean;
  rawPrivateDataExposed: boolean;
  safeEventSummaries: string[];
}

export interface Task033TeacherFeedbackItem {
  feedbackId: string;
  teacherHash: string;
  canaryRunId: string;
  category: Task033TeacherFeedbackCategory;
  safeSummary: string;
  createdAt: string;
  assignmentScope: string[];
  rawChatExposed: boolean;
  privateMemoryExposed: boolean;
  blockingIssues: string[];
}

export interface Task033StudentSafeFeedbackItem {
  studentHash: string;
  canaryRunId: string;
  feedbackCategory: Task033StudentSafeFeedbackCategory;
  safeSentiment: string;
  difficultyLevel: string;
  feltHelped: boolean;
  safeNextStepNeeded: string;
  createdAt: string;
}

export interface Task033AdminReviewItem {
  reviewId: string;
  actorRole: string;
  actorHash: string;
  canaryRunId: string;
  observationRunId: string;
  task032ProofReviewed: boolean;
  observationConfigReviewed: boolean;
  aggregateSnapshotReviewed: boolean;
  teacherFeedbackCategoriesReviewed: boolean;
  studentSafeFeedbackCategoriesReviewed: boolean;
  healthBudgetReviewed: boolean;
  learningQualityReviewed: boolean;
  deenGovernanceReviewed: boolean;
  curriculumSourceReviewed: boolean;
  privacyReviewed: boolean;
  incidentBridgeReviewed: boolean;
  rollbackReadinessReviewed: boolean;
  blockingIssues: string[];
  decision: Task033PostCanaryDecision;
  reviewedAt: string;
}

export interface Task033IncidentReviewItem {
  signal: Task033IncidentSignal;
  detectedAt: string;
  safeSummary: string;
  pauseRecommended: boolean;
  killSwitchRecommended: boolean;
  rollbackRecommended: boolean;
  adminReviewRequired: boolean;
  safeguardingEscalationRequired: boolean;
  privacyEscalationRequired: boolean;
  deenReviewRequired: boolean;
}

export interface Task033LearningQualityReview {
  socraticGatePassed: boolean;
  noFinalAnswerPolicyWeakened: boolean;
  answerKeyExposureDetected: boolean;
  homeworkShortcutDetected: boolean;
  studentReasoningFirstPreserved: boolean;
  safeHintLadderUsed: boolean;
  teacherEscalationAvailable: boolean;
  blockingIssues: string[];
}

export interface Task033DeenGovernanceReview {
  deenGatePassed: boolean;
  fatwaEngineIntroduced: boolean;
  inventedRulingDetected: boolean;
  sectarianAuthorityClaimDetected: boolean;
  deenSensitivePrivateTextExposed: boolean;
  safeReferralPathPreserved: boolean;
  approvedSourceBoundaryPreserved: boolean;
  blockingIssues: string[];
}

export interface Task033CurriculumSourceReview {
  curriculumGatePassed: boolean;
  approvedCurriculumScopeRequired: boolean;
  approvedSourceScopeRequired: boolean;
  unapprovedSubjectBlocked: boolean;
  teacherOnlyContentExposed: boolean;
  answerKeyExposureDetected: boolean;
  contentGapHandledSafely: boolean;
  blockingIssues: string[];
}

export interface Task033PrivacyReview {
  privacyGatePassed: boolean;
  rawStudentChatExposed: boolean;
  rawStudentIdentityExposed: boolean;
  privateLearnerMemoryExposed: boolean;
  teacherOnlyNotesExposed: boolean;
  safeguardingRawDetailsExposed: boolean;
  deenSensitivePrivateTextExposed: boolean;
  tokensSecretsExposed: boolean;
  databaseUrlsExposed: boolean;
  authHeadersExposed: boolean;
  cookiesExposed: boolean;
  answerKeysExposed: boolean;
  teacherOnlyContentExposed: boolean;
  protectedRubricsExposed: boolean;
  aiPromptsExposed: boolean;
  providerResponsesExposed: boolean;
  blockingIssues: string[];
}

export interface Task033HealthBudgetReview {
  ok: boolean;
  latencyBudgetPassed: boolean;
  errorBudgetPassed: boolean;
  privacyBudgetPassed: boolean;
  schoolAuthBudgetPassed: boolean;
  canaryMembershipBudgetPassed: boolean;
  socraticBudgetPassed: boolean;
  deenBudgetPassed: boolean;
  safeguardingBudgetPassed: boolean;
  openRolloutBudgetPassed: boolean;
  schoolWideRolloutBudgetPassed: boolean;
  overallPassed: boolean;
  blockingIssues: string[];
}

export interface Task033RollbackReadinessReview {
  rollbackPlanExists: boolean;
  rollbackOwnerAssigned: boolean;
  killSwitchAvailable: boolean;
  pauseAvailable: boolean;
  runtimeAccessBlockedByRollback: boolean;
  safeAuditSummaryPreserved: boolean;
  destructiveLearningEvidenceDeletionAvoided: boolean;
  rollbackDrillStillValidFromTask032: boolean;
  blockingIssues: string[];
}

export interface Task033PostCanaryDecisionReport {
  taskId: string;
  taskName: string;
  generatedAt: string;
  gitBranch: string;
  gitCommit: string;
  workingTreeStatus: string;
  environment: string;
  filesChanged: string[];
  migrationsChanged: string[];
  task032Proof: Record<string, unknown>;
  observationConfig: Record<string, unknown>;
  approvedCanaryScope: Record<string, unknown>;
  evidenceCollector: Record<string, unknown>;
  aggregateMonitoringSnapshot: Record<string, unknown>;
  teacherFeedbackReview: Record<string, unknown>;
  studentSafeFeedback: Record<string, unknown>;
  adminReviewWorkflow: Record<string, unknown>;
  healthBudgetReview: Record<string, unknown>;
  learningQualityReview: Record<string, unknown>;
  deenGovernanceReview: Record<string, unknown>;
  curriculumSourceReview: Record<string, unknown>;
  privacyReview: Record<string, unknown>;
  incidentBridgeReview: Record<string, unknown>;
  rollbackReadinessReview: Record<string, unknown>;
  runtimeGuardReview: Record<string, unknown>;
  roleBoundaryReview: Record<string, unknown>;
  postCanaryDecision: Record<string, unknown>;
  privacyLeakChecks: Record<string, unknown>;
  securityGateChecks: Record<string, unknown>;
  deenGateChecks: Record<string, unknown>;
  socraticGateChecks: Record<string, unknown>;
  curriculumGateChecks: Record<string, unknown>;
  testResults: Record<string, unknown>[];
  verificationCommands: Record<string, unknown>[];
  blockingIssues: string[];
  knownLimitations: string[];
  safeToStartTask034: boolean;
  finalDecision: Task033FinalDecision;
}

export interface Task033AcceptanceScenarioResult {
  scenarioRun: boolean;
  scenarioMode: string;
  task032ProofLoaded: boolean;
  observationConfigPassed: boolean;
  approvedCanaryScopePassed: boolean;
  evidenceCollectorPassed: boolean;
  aggregateMonitoringSnapshotCaptured: boolean;
  teacherFeedbackReviewPassed: boolean;
  studentSafeFeedbackPassed: boolean;
  adminReviewWorkflowPassed: boolean;
  healthBudgetPassed: boolean;
  learningQualityReviewPassed: boolean;
  deenGovernanceReviewPassed: boolean;
  curriculumSourceReviewPassed: boolean;
  privacyReviewPassed: boolean;
  incidentBridgeReviewPassed: boolean;
  rollbackReadinessPassed: boolean;
  runtimeGuardStillEnforced: boolean;
  aiBeforeGateBlocked: boolean;
  memoryBeforeGateBlocked: boolean;
  pauseBlocksRuntime: boolean;
  killSwitchBlocksRuntime: boolean;
  rollbackBlocksRuntime: boolean;
  teacherRoleBoundaryPassed: boolean;
  studentRoleBoundaryPassed: boolean;
  unknownRoleDenied: boolean;
  openRolloutPerformed: boolean;
  schoolWideRolloutPerformed: boolean;
  rawPrivateDataExposed: boolean;
  postCanaryDecision: string;
  safeToStartTask034: boolean;
  blockingIssues: string[];
}

export interface Task033VerificationCommand {
  name: string;
  command: string;
  logPath: string;
  exitCode: number;
  result: string;
  durationSeconds: number;
  summary: string;
}

export const TASK033_FORBIDDEN_OUTPUT_PATTERNS = [
  'raw student chat', 'private learner memory', 'teacher-only notes',
  'safeguarding raw details', 'Deen-sensitive private text',
  'AI prompt', 'provider response', 'answer key',
  'teacher-only content', 'protected rubric',
  'postgres://', 'postgresql://', 'mysql://',
  'Bearer ', 'sk-proj-', 'sk-ant-',
  'authorization header', 'raw exception object',
  'unredacted stack trace', 'student email', 'student phone',
  'real roster', 'raw database url',
];

export const TASK033_SAFE_IDENTIFIERS = [
  'school_task032_canary_safe',
  'tenant_task032_canary_safe',
  'canary_cohort_task032_safe',
  'canary_run_task032_safe',
  'student_hash_task032_safe_001',
  'student_hash_task032_safe_002',
  'teacher_hash_task032_safe_001',
  'admin_hash_task032_safe_001',
  'operator_hash_task032_safe_001',
  'observation_run_task033_safe',
  'observation_window_task033_safe',
  'teacher_feedback_task033_safe',
  'student_feedback_task033_safe',
  'incident_review_task033_safe',
  'post_canary_decision_task033_safe',
];

export function getObservationRolePermissions033(role: Task033ObservationRole): Record<string, boolean> {
  switch (role) {
    case 'admin':
      return {
        canViewAggregateObservationSummary: true,
        canViewHealthBudget: true,
        canViewSafeIncidentSummaries: true,
        canSubmitAdminReview: true,
        canGeneratePostCanaryDecision: true,
        canViewReportReferences: true,
        canTriggerPause: true,
        canTriggerKillSwitch: true,
        canTriggerRollback: true,
      };
    case 'operator':
      return {
        canViewAggregateObservationSummary: true,
        canViewHealthBudget: true,
        canViewSafeIncidentSummaries: true,
        canSubmitAdminReview: true,
        canGeneratePostCanaryDecision: true,
        canViewReportReferences: true,
        canTriggerPause: true,
        canTriggerKillSwitch: true,
        canTriggerRollback: true,
      };
    case 'teacher':
      return {
        canViewAssignedSafeTeacherSummary: true,
        canSubmitAssignedScopeFeedback: true,
        canViewFullReport: false,
        canTriggerAdminReview: false,
        canTriggerRolloutDecision: false,
        canTriggerPause: false,
        canTriggerKillSwitch: false,
        canTriggerRollback: false,
      };
    case 'student':
      return {
        canSubmitSafeCategoryFeedback: true,
        canViewOwnCanaryStatus: true,
        canViewReports: false,
        canViewHealthInternals: false,
        canViewIncidents: false,
        canViewOtherStudents: false,
        canTriggerControls: false,
      };
    default:
      return {
        canViewAggregateObservationSummary: false,
        canViewHealthBudget: false,
        canViewSafeIncidentSummaries: false,
        canSubmitAdminReview: false,
        canGeneratePostCanaryDecision: false,
        canViewReportReferences: false,
        canViewAssignedSafeTeacherSummary: false,
        canSubmitAssignedScopeFeedback: false,
        canSubmitSafeCategoryFeedback: false,
        canViewOwnCanaryStatus: false,
        canViewReports: false,
        canViewHealthInternals: false,
        canViewIncidents: false,
        canViewOtherStudents: false,
        canTriggerControls: false,
      };
  }
}

export function resolveObservationRole033(rawRole: string): Task033ObservationRole {
  const r = rawRole?.toLowerCase() || 'unknown';
  if (r === 'admin') return 'admin';
  if (r === 'operator') return 'operator';
  if (r === 'teacher') return 'teacher';
  if (r === 'student') return 'student';
  return 'unknown';
}
