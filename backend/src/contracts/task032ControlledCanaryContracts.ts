export type Task032CanaryRole =
  | 'admin'
  | 'operator'
  | 'teacher'
  | 'student'
  | 'unknown';

export type Task032CanaryPermission =
  | 'canActivateCanary'
  | 'canPauseCanary'
  | 'canResumeCanary'
  | 'canKillSwitchCanary'
  | 'canRollbackCanary'
  | 'canCompleteCanary'
  | 'canViewCanaryReport'
  | 'canViewMonitoringSnapshot'
  | 'canViewAssignedTeacherSummary'
  | 'canViewOwnStudentStatus'
  | 'canViewHealthBudget';

export type Task032GuardianPolicyStatus =
  | 'not_required_by_school_policy'
  | 'required_and_satisfied'
  | 'required_and_missing'
  | 'unknown_policy';

export type Task032CanaryRunState =
  | 'draft'
  | 'approved'
  | 'armed'
  | 'active'
  | 'paused'
  | 'kill_switch_active'
  | 'rollback_in_progress'
  | 'rolled_back'
  | 'completed'
  | 'blocked';

export type Task032RuntimeGateDecision =
  | 'allow_canary_runtime'
  | 'deny_missing_school_identity'
  | 'deny_unapproved_school'
  | 'deny_unapproved_cohort'
  | 'deny_not_in_canary'
  | 'deny_inactive_student'
  | 'deny_missing_consent_authorization'
  | 'deny_canary_not_active'
  | 'deny_canary_paused'
  | 'deny_kill_switch_active'
  | 'deny_rollback_active'
  | 'deny_missing_curriculum_scope'
  | 'deny_missing_source_scope'
  | 'deny_socratic_gate_failed'
  | 'deny_deen_gate_failed'
  | 'deny_privacy_gate_failed';

export type Task032FinalDecision =
  | 'TASK_032_PASS_SAFE_TO_START_TASK_033'
  | 'TASK_032_FAIL_NOT_SAFE_TO_START_TASK_033';

export type Task032CanaryControlActionType =
  | 'pause_canary'
  | 'resume_canary'
  | 'enable_kill_switch'
  | 'disable_kill_switch'
  | 'start_rollback'
  | 'complete_rollback'
  | 'complete_canary';

export type Task032IncidentSignal =
  | 'privacy_risk'
  | 'school_auth_risk'
  | 'canary_membership_risk'
  | 'socratic_integrity_risk'
  | 'deen_governance_risk'
  | 'safeguarding_risk'
  | 'performance_risk'
  | 'system_error_risk';

export interface Task032Task031ProofStatus {
  ok: boolean;
  reportFound: boolean;
  taskId: string;
  safeToStartTask032: boolean;
  finalDecision: string;
  blockingIssuesEmpty: boolean;
  verificationExitCodeZero: boolean;
  stagingSmokeScenarioRun: boolean;
  stagingSmokeSafeToStartTask032: boolean;
  handoffConsistent: boolean;
  handoffAgreesWithReport: boolean;
  standaloneLogExists: boolean;
  proofLoaded: boolean;
  blockingIssues: string[];
}

export interface Task032CanaryEnvironmentGateResult {
  ok: boolean;
  controlledCanaryEnabled: boolean;
  dryRunMode: boolean;
  approvedSchoolRequired: boolean;
  liveStudentProtectionEnabled: boolean;
  openRolloutBlocked: boolean;
  maxCanaryPercent: number;
  maxCanaryStudents: number;
  nodeEnvClassification: string;
  databaseUrlClassification: string;
  redisUrlClassification: string;
  rawDatabaseUrlExposed: boolean;
  rawRedisUrlExposed: boolean;
  rawSecretsExposed: boolean;
  blockingIssues: string[];
}

export interface Task032ApprovedSchoolCanaryConfig {
  schoolId: string;
  tenantId: string;
  canaryCohortId: string;
  canaryRunId: string;
  canaryName: string;
  approvedByRole: string;
  approvedByActorHash: string;
  approvalTimestamp: string;
  maxCanaryPercent: number;
  maxCanaryStudents: number;
  eligibleStudentCount: number;
  requestedStudentCount: number;
  effectiveStudentCap: number;
  curriculumScopes: string[];
  sourceScopes: string[];
  subjectScopes: string[];
  teacherAssignmentScopes: string[];
  monitoringWindowStart: string;
  monitoringWindowEnd: string;
  rollbackOwnerActorHash: string;
  safeguardingEscalationActorHash: string;
  deenReviewActorHash?: string;
  studentNoticeReady: boolean;
  teacherNoticeReady: boolean;
  adminRunbookReady: boolean;
  rollbackPlanReady: boolean;
  killSwitchReady: boolean;
}

export interface Task032CanaryConsentMatrix {
  schoolAuthorized: boolean;
  adminApproved: boolean;
  teacherNotified: boolean;
  studentNoticeReady: boolean;
  guardianPolicyStatus: Task032GuardianPolicyStatus;
  guardianConsentSatisfiedIfRequired: boolean;
  guardianConsentProofSummaryFieldExists: boolean;
  rollbackOwnerAssigned: boolean;
  safeguardingContactAssigned: boolean;
  deenReviewContactAssignedIfNeeded: boolean;
  privacyBoundaryAccepted: boolean;
  canarySizeAccepted: boolean;
  monitoringAccepted: boolean;
}

export interface Task032ConsentAuthorizationResult {
  ok: boolean;
  schoolAuthorized: boolean;
  adminApproved: boolean;
  teacherNotified: boolean;
  studentNoticeReady: boolean;
  guardianPolicyStatus: Task032GuardianPolicyStatus;
  guardianConsentSatisfiedIfRequired: boolean;
  rollbackOwnerAssigned: boolean;
  safeguardingContactAssigned: boolean;
  deenReviewContactAssignedIfNeeded: boolean;
  privacyBoundaryAccepted: boolean;
  canarySizeAccepted: boolean;
  monitoringAccepted: boolean;
  rawGuardianDataExposed: boolean;
  blockingIssues: string[];
}

export interface Task032CanaryCohortMember {
  studentHash: string;
  approvedSchoolId: string;
  approvedCohortId: string;
  isActive: boolean;
  curriculumScope: string;
  consentStatus: string;
  excludedByPolicy: boolean;
}

export interface Task032CanaryCohortEligibilityResult {
  ok: boolean;
  approvedSchool: boolean;
  approvedCohort: boolean;
  eligibleStudentCount: number;
  requestedStudentCount: number;
  effectiveStudentCap: number;
  canaryCapPassed: boolean;
  ineligibleCount: number;
  rawStudentIdentityExposed: boolean;
  blockingIssues: string[];
}

export interface Task032LiveStudentPrivacyBoundaryResult {
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

export interface Task032StateTransition {
  fromState: Task032CanaryRunState;
  toState: Task032CanaryRunState;
  actorRole: Task032CanaryRole;
  actorHash: string;
  reasonCode: string;
  timestamp: string;
  safeSummary: string;
  allowed: boolean;
  blockingIssues: string[];
}

export interface Task032RuntimeGateInput {
  actorRole: Task032CanaryRole;
  actorHash: string;
  schoolId: string;
  cohortId: string;
  canaryRunId: string;
  studentHash?: string;
  curriculumScope?: string;
  sourceScope?: string;
  subjectId?: string;
  classId?: string;
}

export interface Task032RuntimeGateResult {
  allowed: boolean;
  decision: Task032RuntimeGateDecision;
  safeToCreateSession: boolean;
  safeToAccessMemory: boolean;
  safeToCallAi: boolean;
  safeReasonCode: string;
  rawPrivateDataExposed: boolean;
  gateChecks: Task032GateCheckResult[];
  blockingIssues: string[];
}

export interface Task032GateCheckResult {
  gateName: string;
  passed: boolean;
  reasonCode: string;
}

export interface Task032CanaryMonitoringSnapshot {
  canaryRunId: string;
  schoolId: string;
  cohortId: string;
  generatedAt: string;
  windowStart: string;
  windowEnd: string;
  eligibleStudentCount: number;
  activatedStudentCount: number;
  activeSessionCount: number;
  requestCount: number;
  successfulRequestCount: number;
  safeDenialCount: number;
  errorCount: number;
  roleDenialCount: number;
  schoolAuthDenialCount: number;
  canaryMembershipDenialCount: number;
  curriculumGateDenialCount: number;
  socraticGateDenialCount: number;
  deenGateDenialCount: number;
  privacyGateDenialCount: number;
  memoryGateDenialCount: number;
  aiGateDenialCount: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  killSwitchActive: boolean;
  paused: boolean;
  rollbackActive: boolean;
  safeEventSummaries: string[];
  rawPrivateDataExposed: boolean;
}

export interface Task032CanaryHealthBudget {
  maxP95LatencyMs: number;
  maxErrorRatePercent: number;
  maxPrivacyLeakCount: number;
  maxSchoolAuthBypassCount: number;
  maxCanaryMembershipBypassCount: number;
  maxSocraticBypassCount: number;
  maxDeenBypassCount: number;
  maxUnhandledSafeguardingCount: number;
  latencyBudgetPassed: boolean;
  errorBudgetPassed: boolean;
  privacyBudgetPassed: boolean;
  schoolAuthBudgetPassed: boolean;
  canaryMembershipBudgetPassed: boolean;
  socraticBudgetPassed: boolean;
  deenBudgetPassed: boolean;
  safeguardingBudgetPassed: boolean;
  overallPassed: boolean;
  blockingIssues: string[];
}

export interface Task032CanaryControlActionResult {
  ok: boolean;
  action: Task032CanaryControlActionType;
  previousState: Task032CanaryRunState;
  nextState: Task032CanaryRunState;
  runtimeAccessBlocked: boolean;
  safeAuditSummary: string;
  safeAuditSummaryWritten: boolean;
  rawPrivateDataExposed: boolean;
  blockingIssues: string[];
}

export interface Task032RollbackPlan {
  rollbackId: string;
  canaryRunId: string;
  initiatedByRole: Task032CanaryRole;
  initiatedByActorHash: string;
  rollbackReason: string;
  startedAt: string;
  preserveSafeAuditSummary: boolean;
  avoidDestructiveLearningEvidenceDeletion: boolean;
  runtimeAccessBlocked: boolean;
}

export interface Task032RollbackResult {
  ok: boolean;
  rollbackId: string;
  runtimeAccessBlocked: boolean;
  safeAuditSummaryPreserved: boolean;
  destructiveDeletionAvoided: boolean;
  rawPrivateDataExposed: boolean;
  blockingIssues: string[];
}

export interface Task032TeacherOversightSummary {
  cohortId: string;
  canaryRunId: string;
  teacherHash: string;
  assignmentScope: string[];
  eligibleStudentCount: number;
  activeSessionCount: number;
  needsAttentionCount: number;
  safeAggregateLearningSignal: string;
  rawChatExposed: boolean;
  privateMemoryExposed: boolean;
  safeguardingDetailsExposed: boolean;
  deenSensitiveTextExposed: boolean;
  adminControlsVisible: boolean;
  safeSummary: string;
}

export interface Task032StudentStatusView {
  available: boolean;
  statusLabel: string;
  safeNextStepMessage: string;
  otherStudentsVisible: boolean;
  monitoringInternalsVisible: boolean;
  teacherAdminNotesVisible: boolean;
  reportsVisible: boolean;
  controlActionsVisible: boolean;
}

export interface Task032AdminOperatorCanarySummary {
  canaryRunId: string;
  cohortId: string;
  state: Task032CanaryRunState;
  aggregateMetrics: {
    eligibleStudentCount: number;
    activatedStudentCount: number;
    activeSessionCount: number;
    requestCount: number;
    successfulRequestCount: number;
    safeDenialCount: number;
    errorCount: number;
  };
  budgetStatus: string;
  controlAvailable: boolean;
  safeEventSummaries: string[];
  blockingIssues: string[];
}

export interface Task032IncidentBridgeResult {
  ok: boolean;
  signals: Task032IncidentSignal[];
  safeSummaries: string[];
  canaryActionRequired: boolean;
  pauseRecommended: boolean;
  killSwitchRecommended: boolean;
  rawPrivateDataExposed: boolean;
  safeguardingEscalationRequired: boolean;
  blockingIssues: string[];
}

export interface Task032AcceptanceScenarioResult {
  scenarioRun: boolean;
  scenarioMode: string;
  task031ProofLoaded: boolean;
  canaryEnvironmentPassed: boolean;
  approvedSchoolConfigPassed: boolean;
  consentAuthorizationPassed: boolean;
  cohortEligibilityPassed: boolean;
  canaryCapPassed: boolean;
  privacyBoundaryPassed: boolean;
  activationStateMachinePassed: boolean;
  runtimeGuardPassed: boolean;
  aiBeforeGateBlocked: boolean;
  memoryBeforeGateBlocked: boolean;
  teacherRoleBoundaryPassed: boolean;
  studentRoleBoundaryPassed: boolean;
  unknownRoleDenied: boolean;
  monitoringSnapshotCaptured: boolean;
  healthBudgetPassed: boolean;
  pauseResumePassed: boolean;
  killSwitchPassed: boolean;
  rollbackPassed: boolean;
  incidentBridgePassed: boolean;
  socraticGatePassed: boolean;
  deenGatePassed: boolean;
  curriculumGatePassed: boolean;
  liveProductionSchoolWideRolloutPerformed: boolean;
  rawPrivateDataExposed: boolean;
  safeToStartTask033: boolean;
  blockingIssues: string[];
}

export interface Task032ReleaseGateReport {
  taskId: string;
  taskName: string;
  generatedAt: string;
  gitBranch: string;
  gitCommit: string;
  workingTreeStatus: string;
  environment: string;
  filesChanged: string[];
  migrationsChanged: string[];
  task031Proof: Record<string, unknown>;
  canaryEnvironmentGate: Record<string, unknown>;
  approvedSchoolCanaryConfig: Record<string, unknown>;
  consentAuthorizationMatrix: Record<string, unknown>;
  cohortEligibility: Record<string, unknown>;
  canaryCap: Record<string, unknown>;
  liveStudentPrivacyBoundary: Record<string, unknown>;
  activationStateMachine: Record<string, unknown>;
  runtimeGuard: Record<string, unknown>;
  aiMemoryBeforeGateProof: Record<string, unknown>;
  teacherRoleBoundary: Record<string, unknown>;
  studentRoleBoundary: Record<string, unknown>;
  unknownRoleDenial: Record<string, unknown>;
  monitoringSnapshot: Record<string, unknown>;
  healthBudget: Record<string, unknown>;
  controlActions: Record<string, unknown>;
  rollbackProof: Record<string, unknown>;
  safeViews: Record<string, unknown>;
  incidentBridge: Record<string, unknown>;
  privacyLeakChecks: Record<string, unknown>;
  securityGateChecks: Record<string, unknown>;
  deenGateChecks: Record<string, unknown>;
  socraticGateChecks: Record<string, unknown>;
  curriculumGateChecks: Record<string, unknown>;
  testResults: Record<string, unknown>[];
  verificationCommands: Record<string, unknown>[];
  blockingIssues: string[];
  knownLimitations: string[];
  safeToStartTask033: boolean;
  finalDecision: Task032FinalDecision;
}

export interface Task032VerificationCommand {
  command: string;
  logPath: string;
  exitCode: number;
  result: string;
  summary: string;
}

export const TASK032_FORBIDDEN_OUTPUT_PATTERNS = [
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

export const TASK032_SAFE_IDENTIFIERS = [
  'school_task032_canary_safe',
  'tenant_task032_canary_safe',
  'canary_cohort_task032_safe',
  'canary_run_task032_safe',
  'student_hash_task032_safe_001',
  'student_hash_task032_safe_002',
  'teacher_hash_task032_safe_001',
  'admin_hash_task032_safe_001',
  'operator_hash_task032_safe_001',
  'unknown_hash_task032_safe_001',
  'class_task032_safe_001',
  'subject_task032_safe_math_001',
  'curriculum_scope_task032_safe_001',
];

export const ALLOWED_CANARY_STATE_TRANSITIONS: Record<Task032CanaryRunState, Task032CanaryRunState[]> = {
  draft: ['approved'],
  approved: ['armed'],
  armed: ['active'],
  active: ['paused', 'kill_switch_active', 'rollback_in_progress', 'completed'],
  paused: ['active', 'kill_switch_active', 'rollback_in_progress'],
  kill_switch_active: ['rollback_in_progress'],
  rollback_in_progress: ['rolled_back'],
  rolled_back: ['blocked'],
  completed: ['blocked'],
  blocked: [],
};

export function getRolePermissions032(role: Task032CanaryRole): Record<string, boolean> {
  switch (role) {
    case 'admin':
      return {
        canActivateCanary: true,
        canPauseCanary: true,
        canResumeCanary: true,
        canKillSwitchCanary: true,
        canRollbackCanary: true,
        canCompleteCanary: true,
        canViewCanaryReport: true,
        canViewMonitoringSnapshot: true,
        canViewAssignedTeacherSummary: false,
        canViewOwnStudentStatus: false,
        canViewHealthBudget: true,
      };
    case 'operator':
      return {
        canActivateCanary: false,
        canPauseCanary: true,
        canResumeCanary: true,
        canKillSwitchCanary: true,
        canRollbackCanary: true,
        canCompleteCanary: true,
        canViewCanaryReport: true,
        canViewMonitoringSnapshot: true,
        canViewAssignedTeacherSummary: false,
        canViewOwnStudentStatus: false,
        canViewHealthBudget: true,
      };
    case 'teacher':
      return {
        canActivateCanary: false,
        canPauseCanary: false,
        canResumeCanary: false,
        canKillSwitchCanary: false,
        canRollbackCanary: false,
        canCompleteCanary: false,
        canViewCanaryReport: false,
        canViewMonitoringSnapshot: false,
        canViewAssignedTeacherSummary: true,
        canViewOwnStudentStatus: false,
        canViewHealthBudget: false,
      };
    case 'student':
      return {
        canActivateCanary: false,
        canPauseCanary: false,
        canResumeCanary: false,
        canKillSwitchCanary: false,
        canRollbackCanary: false,
        canCompleteCanary: false,
        canViewCanaryReport: false,
        canViewMonitoringSnapshot: false,
        canViewAssignedTeacherSummary: false,
        canViewOwnStudentStatus: true,
        canViewHealthBudget: false,
      };
    default:
      return {
        canActivateCanary: false,
        canPauseCanary: false,
        canResumeCanary: false,
        canKillSwitchCanary: false,
        canRollbackCanary: false,
        canCompleteCanary: false,
        canViewCanaryReport: false,
        canViewMonitoringSnapshot: false,
        canViewAssignedTeacherSummary: false,
        canViewOwnStudentStatus: false,
        canViewHealthBudget: false,
      };
  }
}

export function resolveCanaryRole032(rawRole: string): Task032CanaryRole {
  const r = rawRole?.toLowerCase() || 'unknown';
  if (r === 'admin') return 'admin';
  if (r === 'operator') return 'operator';
  if (r === 'teacher') return 'teacher';
  if (r === 'student') return 'student';
  return 'unknown';
}

export function isAllowedTransition(from: Task032CanaryRunState, to: Task032CanaryRunState): boolean {
  const allowed = ALLOWED_CANARY_STATE_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}
