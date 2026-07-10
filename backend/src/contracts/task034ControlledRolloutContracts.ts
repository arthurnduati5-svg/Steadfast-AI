export type Task034RolloutRole =
  | 'admin'
  | 'operator'
  | 'teacher'
  | 'student'
  | 'unknown';

export type Task034RolloutState =
  | 'draft'
  | 'approved'
  | 'staff_ready'
  | 'learner_notice_ready'
  | 'armed'
  | 'active'
  | 'paused'
  | 'kill_switch_active'
  | 'rollback_in_progress'
  | 'rolled_back'
  | 'completed'
  | 'blocked';

export type Task034RolloutDecision =
  | 'continue_limited_rollout'
  | 'hold_limited_rollout'
  | 'pause_limited_rollout'
  | 'rollback_limited_rollout'
  | 'safe_to_prepare_next_rollout_stage'
  | 'not_safe_to_expand';

export type Task034FinalDecision =
  | 'TASK_034_PASS_SAFE_TO_START_TASK_035'
  | 'TASK_034_FAIL_NOT_SAFE_TO_START_TASK_035';

export type Task034IncidentSignal =
  | 'privacy_risk'
  | 'school_auth_risk'
  | 'rollout_membership_risk'
  | 'socratic_integrity_risk'
  | 'deen_governance_risk'
  | 'curriculum_source_risk'
  | 'safeguarding_risk'
  | 'performance_risk'
  | 'system_error_risk'
  | 'rollback_needed'
  | 'open_rollout_risk'
  | 'school_wide_rollout_risk'
  | 'hundred_percent_rollout_risk';

export type Task034StaffFeedbackCategory =
  | 'student_confusion_pattern'
  | 'curriculum_mismatch'
  | 'pacing_issue'
  | 'socratic_quality_issue'
  | 'safety_concern_summary'
  | 'deen_referral_needed'
  | 'technical_issue'
  | 'positive_learning_signal';

export type Task034StudentSafeFeedbackCategory =
  | 'helpful'
  | 'confusing'
  | 'too_hard'
  | 'too_easy'
  | 'technical_issue'
  | 'needs_teacher_help'
  | 'not_sure';

export interface Task034Task033ProofStatus {
  ok: boolean;
  reportFound: boolean;
  taskId: string;
  safeToStartTask034: boolean;
  finalDecision: string;
  blockingIssuesEmpty: boolean;
  verificationExitCodeZero: boolean;
  canaryObservationScenarioRun: boolean;
  canaryObservationSafeToStartTask034: boolean;
  handoffConsistent: boolean;
  handoffAgreesWithReport: boolean;
  standaloneLogExists: boolean;
  standaloneLogExitZero: boolean;
  privacyScanPassed: boolean;
  jsonValidationPassed: boolean;
  testsPassed: boolean;
  noStalePlaceholders: boolean;
  proofLoaded: boolean;
  blockingIssues: string[];
}

export interface Task034ControlledRolloutConfig {
  rolloutRunId: string;
  rolloutWindowId: string;
  schoolId: string;
  tenantId: string;
  cohortId: string;
  maxControlledRolloutPercent: number;
  maxControlledRolloutStudents: number;
  observationMode: string;
  allowOpenRegistration: boolean;
  allowPublicSignup: boolean;
  allowAllStudents: boolean;
  allowSchoolWideRollout: boolean;
  allowHundredPercentRollout: boolean;
  allowRawChatCapture: boolean;
  allowRawMemoryCapture: boolean;
  allowProviderPromptCapture: boolean;
  allowProviderResponseCapture: boolean;
  requireTask033Proof: boolean;
  requireStaffReadiness: boolean;
  requireLearnerNoticeReadiness: boolean;
  requireAdminApproval: boolean;
  requireOperatorReadiness: boolean;
  requireRollbackReady: boolean;
  envFlagsValid: boolean;
  nodeEnvSafe: boolean;
  blockingIssues: string[];
}

export interface Task034RolloutCapResult {
  ok: boolean;
  eligibleSchoolStudentCount: number;
  previousCanaryStudentCount: number;
  requestedRolloutStudentCount: number;
  requestedRolloutPercent: number;
  effectivePercentCap: number;
  effectiveStudentCap: number;
  percentCapPassed: boolean;
  studentCapPassed: boolean;
  schoolWideRolloutPerformed: boolean;
  hundredPercentRolloutPerformed: boolean;
  blockingIssues: string[];
}

export interface Task034ExpandedCohortMember {
  studentHash: string;
  classId: string;
  subjectId: string;
  active: boolean;
}

export interface Task034ExpandedCohortEligibilityResult {
  ok: boolean;
  approvedSchool: boolean;
  approvedTenant: boolean;
  approvedCohort: boolean;
  eligibleStudentCount: number;
  requestedStudentCount: number;
  effectiveStudentCap: number;
  rolloutCapPassed: boolean;
  ineligibleCount: number;
  rawStudentIdentityExposed: boolean;
  blockingIssues: string[];
}

export interface Task034StaffReadinessAcknowledgement {
  actorHash: string;
  role: Task034RolloutRole;
  acknowledgementType: string;
  acknowledgedAt: string;
}

export interface Task034StaffReadinessResult {
  ok: boolean;
  adminApproved: boolean;
  operatorRunbookAcknowledged: boolean;
  teacherSafeUseAcknowledged: boolean;
  teacherEscalationPathAcknowledged: boolean;
  privacyBoundaryAcknowledged: boolean;
  rollbackOwnerAcknowledged: boolean;
  safeguardingContactAcknowledged: boolean;
  deenReviewContactAcknowledgedIfNeeded: boolean;
  rawStaffPrivateDataExposed: boolean;
  blockingIssues: string[];
}

export interface Task034LearnerNoticeReadinessResult {
  ok: boolean;
  studentNoticeReady: boolean;
  noticeIsCalm: boolean;
  noticeMentionsThinkingFirst: boolean;
  noticeMentionsTeacherSupport: boolean;
  noInternalDetailsExposed: boolean;
  noOtherStudentsExposed: boolean;
  rawPrivateDataExposed: boolean;
  blockingIssues: string[];
}

export interface Task034RolloutStateTransition {
  fromState: Task034RolloutState;
  toState: Task034RolloutState;
  actorRole: Task034RolloutRole;
  actorHash: string;
  reasonCode: string;
  timestamp: string;
  safeSummary: string;
  allowed: boolean;
  blockingIssues: string[];
  rawPrivateDataExposed: boolean;
}

export interface Task034ExpandedRuntimeGateInput {
  actorRole: Task034RolloutRole;
  actorHash: string;
  schoolId: string;
  tenantId: string;
  cohortId: string;
  rolloutRunId: string;
  studentHash?: string;
  teacherHash?: string;
  curriculumScope?: string;
  sourceScope?: string;
  subjectId?: string;
  classId?: string;
  rolloutState: Task034RolloutState;
  pauseActive: boolean;
  killSwitchActive: boolean;
  rollbackActive: boolean;
}

export interface Task034ExpandedRuntimeGateResult {
  allowed: boolean;
  decision: string;
  safeToCreateSession: boolean;
  safeToAccessMemory: boolean;
  safeToCallAi: boolean;
  safeReasonCode: string;
  rawPrivateDataExposed: boolean;
  gateChecks: Record<string, boolean>;
  blockingIssues: string[];
}

export interface Task034ExpandedPrivacyBoundaryResult {
  ok: boolean;
  rawStudentIdentityExposed: boolean;
  rawStudentChatExposed: boolean;
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

export interface Task034HealthBudgetReview {
  ok: boolean;
  latencyBudgetPassed: boolean;
  errorBudgetPassed: boolean;
  privacyBudgetPassed: boolean;
  schoolAuthBudgetPassed: boolean;
  rolloutMembershipBudgetPassed: boolean;
  socraticBudgetPassed: boolean;
  deenBudgetPassed: boolean;
  curriculumBudgetPassed: boolean;
  safeguardingBudgetPassed: boolean;
  openRolloutBudgetPassed: boolean;
  schoolWideRolloutBudgetPassed: boolean;
  hundredPercentRolloutBudgetPassed: boolean;
  overallPassed: boolean;
  blockingIssues: string[];
}

export interface Task034CanaryBaselineComparisonResult {
  ok: boolean;
  baselineLoaded: boolean;
  aggregateOnly: boolean;
  latencyRegressionWithinBudget: boolean;
  errorRegressionWithinBudget: boolean;
  safetyRegressionDetected: boolean;
  hardSafetyRegressionDetected: boolean;
  rawPrivateDataExposed: boolean;
  blockingIssues: string[];
}

export interface Task034ExpandedMonitoringSnapshot {
  rolloutRunId: string;
  schoolId: string;
  tenantId: string;
  cohortId: string;
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  eligibleStudentCount: number;
  approvedRolloutStudentCount: number;
  activeRolloutStudentCount: number;
  rolloutPercent: number;
  sessionCount: number;
  successfulSessionCount: number;
  safeDenialCount: number;
  errorCount: number;
  schoolAuthDenialCount: number;
  rolloutMembershipDenialCount: number;
  curriculumGateDenialCount: number;
  sourceGateDenialCount: number;
  socraticGateDenialCount: number;
  deenGateDenialCount: number;
  privacyGateDenialCount: number;
  aiBeforeGateBlockCount: number;
  memoryBeforeGateBlockCount: number;
  teacherAcknowledgementCount: number;
  studentNoticeReadyCount: number;
  studentSafeFeedbackCount: number;
  incidentSignalCount: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  pauseActive: boolean;
  killSwitchActive: boolean;
  rollbackActive: boolean;
  openRolloutPerformed: boolean;
  schoolWideRolloutPerformed: boolean;
  hundredPercentRolloutPerformed: boolean;
  rawPrivateDataExposed: boolean;
  safeEventSummaries: string[];
}

export interface Task034TeacherAdminReviewResult {
  ok: boolean;
  task033ProofReviewed: boolean;
  controlledRolloutConfigReviewed: boolean;
  rolloutCapReviewed: boolean;
  expandedCohortEligibilityReviewed: boolean;
  staffReadinessReviewed: boolean;
  learnerNoticeReadinessReviewed: boolean;
  activationStateMachineReviewed: boolean;
  expandedRuntimeGuardReviewed: boolean;
  expandedPrivacyBoundaryReviewed: boolean;
  healthBudgetReviewed: boolean;
  canaryBaselineComparisonReviewed: boolean;
  expandedMonitoringSnapshotReviewed: boolean;
  socraticIntegrityReviewed: boolean;
  deenGovernanceReviewed: boolean;
  curriculumSourceReviewed: boolean;
  incidentEscalationBridgeReviewed: boolean;
  rollbackProofReviewed: boolean;
  teacherSafeSummaryOnly: boolean;
  studentOwnStatusOnly: boolean;
  rawPrivateDataExposed: boolean;
  blockingIssues: string[];
}

export interface Task034StudentSafeFeedbackContinuationResult {
  ok: boolean;
  studentHash: string;
  rolloutRunId: string;
  feedbackCategory: Task034StudentSafeFeedbackCategory;
  safeSentiment: string;
  difficultyLevel: string;
  feltHelped: boolean;
  safeNextStepNeeded: string;
  createdAt: string;
  rawFreeformBlocked: boolean;
  blockingIssues: string[];
}

export interface Task034IncidentEscalationBridgeResult {
  ok: boolean;
  signals: Task034IncidentSignal[];
  safeSummaries: string[];
  pauseRecommended: boolean;
  killSwitchRecommended: boolean;
  rollbackRecommended: boolean;
  adminReviewRequired: boolean;
  safeguardingEscalationRequired: boolean;
  privacyEscalationRequired: boolean;
  deenReviewRequired: boolean;
  rawPrivateDataExposed: boolean;
  blockingIssues: string[];
}

export interface Task034RollbackProofResult {
  ok: boolean;
  pauseBlocksRuntime: boolean;
  resumeRequiresGateRecheck: boolean;
  killSwitchBlocksRuntime: boolean;
  killSwitchDisableRequiresRecheck: boolean;
  rollbackBlocksRuntime: boolean;
  safeAuditSummaryPreserved: boolean;
  destructiveLearningEvidenceDeletionAvoided: boolean;
  rawPrivateDataExposed: boolean;
  blockingIssues: string[];
}

export interface Task034SocraticIntegrityReview {
  socraticGatePassed: boolean;
  noFinalAnswerPolicyWeakened: boolean;
  answerKeyExposureDetected: boolean;
  homeworkShortcutDetected: boolean;
  studentReasoningFirstPreserved: boolean;
  safeHintLadderPreserved: boolean;
  teacherEscalationAvailable: boolean;
  blockingIssues: string[];
}

export interface Task034DeenGovernanceReview {
  deenGatePassed: boolean;
  fatwaEngineIntroduced: boolean;
  inventedRulingDetected: boolean;
  sectarianAuthorityClaimDetected: boolean;
  deenSensitivePrivateTextExposed: boolean;
  safeReferralPathPreserved: boolean;
  approvedSourceBoundaryPreserved: boolean;
  blockingIssues: string[];
}

export interface Task034CurriculumSourceReview {
  curriculumGatePassed: boolean;
  approvedCurriculumScopeRequired: boolean;
  approvedSourceScopeRequired: boolean;
  unapprovedSubjectBlocked: boolean;
  teacherOnlyContentExposed: boolean;
  answerKeyExposureDetected: boolean;
  contentGapHandledSafely: boolean;
  blockingIssues: string[];
}

export interface Task034PostLimitedRolloutDecisionReport {
  taskId: string;
  taskName: string;
  generatedAt: string;
  gitBranch: string;
  gitCommit: string;
  workingTreeStatus: string;
  environment: string;
  filesChanged: string[];
  migrationsChanged: string[];
  task033Proof: Record<string, unknown>;
  controlledRolloutConfig: Record<string, unknown>;
  rolloutCap: Record<string, unknown>;
  expandedCohortEligibility: Record<string, unknown>;
  staffReadiness: Record<string, unknown>;
  learnerNoticeReadiness: Record<string, unknown>;
  activationStateMachine: Record<string, unknown>;
  expandedRuntimeGuard: Record<string, unknown>;
  expandedPrivacyBoundary: Record<string, unknown>;
  healthBudget: Record<string, unknown>;
  canaryBaselineComparison: Record<string, unknown>;
  expandedMonitoringSnapshot: Record<string, unknown>;
  teacherAdminReview: Record<string, unknown>;
  studentSafeFeedbackContinuation: Record<string, unknown>;
  incidentRollbackBridge: Record<string, unknown>;
  rollbackProof: Record<string, unknown>;
  socraticIntegrityReview: Record<string, unknown>;
  deenGovernanceReview: Record<string, unknown>;
  curriculumSourceReview: Record<string, unknown>;
  roleBoundaryReview: Record<string, unknown>;
  postLimitedRolloutDecision: Record<string, unknown>;
  privacyLeakChecks: Record<string, unknown>;
  securityGateChecks: Record<string, unknown>;
  deenGateChecks: Record<string, unknown>;
  socraticGateChecks: Record<string, unknown>;
  curriculumGateChecks: Record<string, unknown>;
  rolloutScopeChecks: Record<string, unknown>;
  testResults: Record<string, unknown>[];
  verificationCommands: Record<string, unknown>[];
  blockingIssues: string[];
  knownLimitations: string[];
  safeToStartTask035: boolean;
  finalDecision: Task034FinalDecision;
}

export interface Task034AcceptanceScenarioResult {
  scenarioRun: boolean;
  scenarioMode: string;
  task033ProofLoaded: boolean;
  controlledRolloutConfigPassed: boolean;
  rolloutCapPassed: boolean;
  expandedCohortEligibilityPassed: boolean;
  staffReadinessPassed: boolean;
  learnerNoticeReadinessPassed: boolean;
  activationStateMachinePassed: boolean;
  expandedRuntimeGuardPassed: boolean;
  aiBeforeGateBlocked: boolean;
  memoryBeforeGateBlocked: boolean;
  sessionBeforeGateBlocked: boolean;
  expandedPrivacyBoundaryPassed: boolean;
  healthBudgetPassed: boolean;
  canaryBaselineComparisonPassed: boolean;
  expandedMonitoringSnapshotCaptured: boolean;
  teacherAdminReviewPassed: boolean;
  studentSafeFeedbackContinuationPassed: boolean;
  incidentRollbackBridgePassed: boolean;
  pauseBlocksRuntime: boolean;
  killSwitchBlocksRuntime: boolean;
  rollbackBlocksRuntime: boolean;
  socraticIntegrityPassed: boolean;
  deenGovernancePassed: boolean;
  curriculumSourcePassed: boolean;
  teacherRoleBoundaryPassed: boolean;
  studentRoleBoundaryPassed: boolean;
  unknownRoleDenied: boolean;
  openRolloutPerformed: boolean;
  schoolWideRolloutPerformed: boolean;
  hundredPercentRolloutPerformed: boolean;
  rolloutPercent: number;
  rolloutPercentCap: number;
  rawPrivateDataExposed: boolean;
  postLimitedRolloutDecision: string;
  safeToStartTask035: boolean;
  blockingIssues: string[];
}

export interface Task034VerificationCommand {
  name: string;
  command: string;
  logPath: string;
  exitCode: number;
  result: string;
  durationSeconds: number;
  summary: string;
}

export interface Task034ReleaseGateReport {
  requiredVerificationStepsPassed: boolean;
  controlledRolloutPassed: boolean;
  safeToStartTask035: boolean;
  finalDecision: Task034FinalDecision;
  blockingIssues: string[];
}

export const TASK034_FORBIDDEN_OUTPUT_PATTERNS = [
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

export const TASK034_SAFE_IDENTIFIERS = [
  'school_task034_limited_rollout_safe',
  'tenant_task034_limited_rollout_safe',
  'cohort_task034_limited_rollout_safe',
  'rollout_run_task034_safe',
  'rollout_window_task034_safe',
  'admin_hash_task034_safe_001',
  'operator_hash_task034_safe_001',
  'teacher_hash_task034_safe_001',
  'teacher_hash_task034_safe_002',
  'student_hash_task034_safe_001',
  'student_hash_task034_safe_002',
  'student_hash_task034_safe_003',
  'student_hash_task034_safe_004',
  'class_task034_safe_001',
  'subject_task034_safe_math_001',
  'curriculum_scope_task034_safe_001',
  'source_scope_task034_safe_001',
  'rollback_plan_task034_safe',
  'incident_review_task034_safe',
  'post_limited_rollout_decision_task034_safe',
];

export function getRolloutRolePermissions034(role: Task034RolloutRole): Record<string, boolean> {
  switch (role) {
    case 'admin':
      return {
        canViewAggregateRolloutSummary: true,
        canViewCapStatus: true,
        canViewHealthBudget: true,
        canViewSafeIncidentSummaries: true,
        canSubmitAdminReview: true,
        canGenerateDecision: true,
        canPauseResumeKillSwitchRollback: true,
        canViewReportReferences: true,
        canApprove: true,
        canArm: true,
        canActivate: true,
        canComplete: true,
      };
    case 'operator':
      return {
        canViewAggregateRolloutSummary: true,
        canViewCapStatus: true,
        canViewHealthBudget: true,
        canViewSafeIncidentSummaries: true,
        canSubmitAdminReview: true,
        canGenerateDecision: true,
        canPauseResumeKillSwitchRollback: true,
        canViewReportReferences: true,
        canApprove: false,
        canArm: false,
        canActivate: false,
        canComplete: false,
      };
    case 'teacher':
      return {
        canViewAssignedSafeTeacherSummary: true,
        canSubmitAssignedScopeAcknowledgement: true,
        canSubmitAssignedScopeFeedback: true,
        canViewFullReport: false,
        canTriggerRolloutDecision: false,
        canViewHealthInternals: false,
        canViewIncidents: false,
        canPauseResumeKillSwitchRollback: false,
      };
    case 'student':
      return {
        canViewOwnRolloutStatus: true,
        canSubmitSafeCategoryFeedback: true,
        canViewReports: false,
        canViewHealthInternals: false,
        canViewIncidents: false,
        canViewOtherStudents: false,
        canTriggerControls: false,
      };
    default:
      return {
        canViewAggregateRolloutSummary: false,
        canViewCapStatus: false,
        canViewHealthBudget: false,
        canViewSafeIncidentSummaries: false,
        canSubmitAdminReview: false,
        canGenerateDecision: false,
        canPauseResumeKillSwitchRollback: false,
        canViewReportReferences: false,
        canViewAssignedSafeTeacherSummary: false,
        canSubmitAssignedScopeAcknowledgement: false,
        canSubmitAssignedScopeFeedback: false,
        canSubmitSafeCategoryFeedback: false,
        canViewOwnRolloutStatus: false,
        canViewReports: false,
        canViewHealthInternals: false,
        canViewIncidents: false,
        canViewOtherStudents: false,
        canTriggerControls: false,
        canApprove: false,
        canArm: false,
        canActivate: false,
        canComplete: false,
      };
  }
}

export function resolveRolloutRole034(rawRole: string): Task034RolloutRole {
  const r = rawRole?.toLowerCase() || 'unknown';
  if (r === 'admin') return 'admin';
  if (r === 'operator') return 'operator';
  if (r === 'teacher') return 'teacher';
  if (r === 'student') return 'student';
  return 'unknown';
}
