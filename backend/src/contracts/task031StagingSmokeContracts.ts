export type Task031StagingSmokeRole =
  | 'admin'
  | 'operator'
  | 'teacher'
  | 'student'
  | 'unknown';

export type Task031StagingSmokePermission =
  | 'canRunStagingSmoke'
  | 'canViewObservabilityBaseline'
  | 'canViewCanaryReadinessReport'
  | 'canTriggerStagingFailureDrill'
  | 'canViewOwnStudentStatus'
  | 'canViewAssignedOversightSmoke';

export type Task031SmokeStatus =
  | 'not_started'
  | 'running'
  | 'passed'
  | 'failed'
  | 'blocked'
  | 'skipped_with_reason';

export type Task031FinalDecision =
  | 'TASK_031_PASS_SAFE_TO_START_TASK_032'
  | 'TASK_031_FAIL_NOT_SAFE_TO_START_TASK_032';

export type Task031CanaryDecision =
  | 'safe_to_proceed'
  | 'blocked_missing_task030_proof'
  | 'blocked_invalid_environment'
  | 'blocked_live_student_risk'
  | 'blocked_role_matrix'
  | 'blocked_embed_handoff'
  | 'blocked_copilot_bootstrap'
  | 'blocked_student_preflight'
  | 'blocked_teacher_oversight'
  | 'blocked_admin_operator_monitoring'
  | 'blocked_observability'
  | 'blocked_latency_error_budget'
  | 'blocked_privacy_risk'
  | 'blocked_report_inconsistent';

export interface Task031Task030ProofStatus {
  ok: boolean;
  reportFound: boolean;
  taskId: string;
  safeToStartTask031: boolean;
  finalDecision: string;
  blockingIssuesEmpty: boolean;
  verificationExitCodeZero: boolean;
  stagingRehearsalResultFound: boolean;
  stagingRehearsalSafeToStartTask031: boolean;
  handoffConsistent: boolean;
  proofLoaded: boolean;
  blockingIssues: string[];
}

export interface Task031StagingSchoolIdentityFixture {
  schoolId: string;
  tenantId: string;
  embedId: string;
  handoffId: string;
  studentActorIdHash: string;
  teacherActorIdHash: string;
  adminActorIdHash: string;
  operatorActorIdHash: string;
  unknownActorIdHash: string;
  classId: string;
  subjectId: string;
  curriculumScope: string;
  sessionId: string;
  verifiedSchoolContext: Record<string, unknown>;
  adminAuthContext: Record<string, unknown>;
  operatorAuthContext: Record<string, unknown>;
  teacherAuthContext: Record<string, unknown>;
  studentAuthContext: Record<string, unknown>;
  unknownAuthContext: Record<string, unknown>;
  safeEmbedHandoffPayload: Record<string, unknown>;
  safeCopilotBootstrapPayload: Record<string, unknown>;
  safeStudentPreflightPayload: Record<string, unknown>;
  safeObservabilityEventPayload: Record<string, unknown>;
}

export interface Task031StagingActorFixture {
  role: Task031StagingSmokeRole;
  actorIdHash: string;
  permissions: Record<string, boolean>;
}

export interface Task031EmbedHandoffSmokeResult {
  ok: boolean;
  routeOrServiceValidated: boolean;
  requiresSchoolContext: boolean;
  requiresAuthenticatedActor: boolean;
  unknownDenied: boolean;
  safeMetadataOnly: boolean;
  rawTokenExposed: boolean;
  secretsExposed: boolean;
  otherStudentsExposed: boolean;
  blockingIssues: string[];
}

export interface Task031CopilotBootstrapSmokeResult {
  ok: boolean;
  schoolAuthRequired: boolean;
  safeMinimalContextOnly: boolean;
  rawPrivateMemoryExposed: boolean;
  rawChatHistoryExposed: boolean;
  teacherOnlyNotesExposed: boolean;
  answerKeysExposed: boolean;
  aiProviderCallMade: boolean;
  unknownDenied: boolean;
  blockingIssues: string[];
}

export interface Task031StudentPreflightSmokeResult {
  ok: boolean;
  schoolIdentityVerified: boolean;
  stagingScopeChecked: boolean;
  curriculumScopeChecked: boolean;
  socraticGateActive: boolean;
  deenGateActive: boolean;
  privacyGateActive: boolean;
  aiCallMade: boolean;
  memoryAccessBeforeGate: boolean;
  safeDenialPathTested: boolean;
  blockingIssues: string[];
}

export interface Task031TeacherOversightSmokeResult {
  ok: boolean;
  teacherStagingContextValid: boolean;
  assignedOversightViewSafe: boolean;
  adminControlsDenied: boolean;
  fullCanaryReportDenied: boolean;
  rawPrivateDataHidden: boolean;
  emptyStateSafe: boolean;
  blockingIssues: string[];
}

export interface Task031AdminOperatorSmokeResult {
  ok: boolean;
  stagingSmokeSummaryVisible: boolean;
  observabilityBaselineVisible: boolean;
  canaryReadinessVisible: boolean;
  aggregateMetricsOnly: boolean;
  rawPrivateDataHidden: boolean;
  failureDrillStagingOnly: boolean;
  liveRolloutActivationUnavailable: boolean;
  blockingIssues: string[];
}

export interface Task031ObservabilityBaseline {
  smokeRunId: string;
  generatedAt: string;
  scenarioMode: string;
  requestCount: number;
  successCount: number;
  deniedCount: number;
  errorCount: number;
  roleDenialCount: number;
  schoolAuthDenialCount: number;
  curriculumGateDenialCount: number;
  socraticGateDenialCount: number;
  deenGateDenialCount: number;
  privacyGateDenialCount: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  safeEventSummaries: string[];
  rawPrivateDataExposed: boolean;
}

export interface Task031LatencyErrorBudget {
  maxP95LatencyMs: number;
  maxErrorCount: number;
  maxPrivacyGateFailuresAllowed: number;
  maxSocraticGateFailuresAllowed: number;
  maxDeenGateFailuresAllowed: number;
  maxSchoolAuthBypassAllowed: number;
  latencyBudgetPassed: boolean;
  errorBudgetPassed: boolean;
  privacyBudgetPassed: boolean;
  socraticBudgetPassed: boolean;
  deenBudgetPassed: boolean;
  schoolAuthBudgetPassed: boolean;
  overallPassed: boolean;
  blockingIssues: string[];
}

export interface Task031NoLiveStudentGuardResult {
  ok: boolean;
  liveStudentEmailDetected: boolean;
  liveStudentNameDetected: boolean;
  livePhoneNumberDetected: boolean;
  realRosterDetected: boolean;
  rawStudentChatUsed: boolean;
  privateLearnerMemoryUsed: boolean;
  productionCohortModified: boolean;
  productionDatabaseTouched: boolean;
  liveProductionRolloutPerformed: boolean;
  blockingIssues: string[];
}

export interface Task031StagingEnvironmentGateResult {
  ok: boolean;
  stagingSmokeEnabled: boolean;
  noLiveStudentsEnabled: boolean;
  syntheticSchoolIdentityEnabled: boolean;
  nodeEnvClassification: string;
  databaseUrlClassification: string;
  redisUrlClassification: string;
  rawDatabaseUrlExposed: boolean;
  rawRedisUrlExposed: boolean;
  productionLikeBlocked: boolean;
  blockingIssues: string[];
}

export interface Task031CanaryReadinessResult {
  safeToStartTask032: boolean;
  finalDecision: Task031FinalDecision;
  task030ProofValid: boolean;
  stagingEnvironmentPassed: boolean;
  noLiveStudentGuardPassed: boolean;
  stagingSchoolIdentityFixtureValid: boolean;
  roleMatrixPassed: boolean;
  embedHandoffSmokePassed: boolean;
  copilotBootstrapSmokePassed: boolean;
  studentPreflightSmokePassed: boolean;
  teacherOversightSmokePassed: boolean;
  adminOperatorMonitoringSmokePassed: boolean;
  observabilityBaselineCaptured: boolean;
  latencyErrorBudgetPassed: boolean;
  privacyGatePassed: boolean;
  securityGatePassed: boolean;
  deenGatePassed: boolean;
  socraticGatePassed: boolean;
  curriculumGatePassed: boolean;
  allTestsPassed: boolean;
  verificationScriptExitedZero: boolean;
  reportValidated: boolean;
  blockingIssues: string[];
  knownLimitations: string[];
}

export interface Task031VerificationCommand {
  command: string;
  logPath: string;
  exitCode: number;
  result: string;
  summary: string;
}

export interface Task031ReleaseGateReport {
  taskId: string;
  taskName: string;
  generatedAt: string;
  gitBranch: string;
  gitCommit: string;
  workingTreeStatus: string;
  environment: string;
  filesChanged: string[];
  migrationsChanged: string[];
  task030Proof: Record<string, unknown>;
  stagingEnvironmentGate: Record<string, unknown>;
  noLiveStudentGuard: Record<string, unknown>;
  stagingSchoolIdentityFixture: Record<string, unknown>;
  roleMatrix: Record<string, unknown>;
  embedHandoffSmoke: Record<string, unknown>;
  copilotBootstrapSmoke: Record<string, unknown>;
  studentPreflightSmoke: Record<string, unknown>;
  teacherOversightSmoke: Record<string, unknown>;
  adminOperatorMonitoringSmoke: Record<string, unknown>;
  observabilityBaseline: Record<string, unknown>;
  latencyErrorBudget: Record<string, unknown>;
  canaryReadinessDecision: Record<string, unknown>;
  privacyLeakChecks: Record<string, unknown>;
  securityGateChecks: Record<string, unknown>;
  deenGateChecks: Record<string, unknown>;
  socraticGateChecks: Record<string, unknown>;
  curriculumGateChecks: Record<string, unknown>;
  testResults: Record<string, unknown>[];
  verificationCommands: Record<string, unknown>[];
  blockingIssues: string[];
  knownLimitations: string[];
  safeToStartTask032: boolean;
  finalDecision: Task031FinalDecision;
}

export const TASK031_FORBIDDEN_OUTPUT_PATTERNS = [
  'raw student chat', 'private learner memory', 'teacher-only notes',
  'safeguarding raw details', 'Deen-sensitive private text',
  'AI prompt', 'provider response', 'answer key',
  'teacher-only content', 'protected rubric',
  'postgres://', 'postgresql://', 'mysql://',
  'Bearer ', 'sk-proj-', 'sk-ant-',
  'authorization header', 'raw exception object',
  'unredacted stack trace',
];

export const TASK031_SAFE_IDENTIFIER_SUFFIX = 'task031_safe';

export const TASK031_SAFE_IDENTIFIERS = [
  'school_task031_staging_safe',
  'tenant_task031_staging_safe',
  'embed_task031_staging_safe',
  'handoff_task031_staging_safe',
  'student_hash_task031_safe',
  'teacher_hash_task031_safe',
  'admin_hash_task031_safe',
  'operator_hash_task031_safe',
  'unknown_hash_task031_safe',
  'session_task031_safe_001',
  'class_task031_safe_001',
  'subject_task031_safe_math_001',
  'curriculum_scope_task031_safe_001',
];

export function getRolePermissions031(role: Task031StagingSmokeRole): Record<string, boolean> {
  switch (role) {
    case 'admin':
      return {
        canRunStagingSmoke: true,
        canViewObservabilityBaseline: true,
        canViewCanaryReadinessReport: true,
        canTriggerStagingFailureDrill: true,
        canViewOwnStudentStatus: false,
        canViewAssignedOversightSmoke: false,
      };
    case 'operator':
      return {
        canRunStagingSmoke: true,
        canViewObservabilityBaseline: true,
        canViewCanaryReadinessReport: true,
        canTriggerStagingFailureDrill: true,
        canViewOwnStudentStatus: false,
        canViewAssignedOversightSmoke: false,
      };
    case 'teacher':
      return {
        canRunStagingSmoke: false,
        canViewObservabilityBaseline: false,
        canViewCanaryReadinessReport: false,
        canTriggerStagingFailureDrill: false,
        canViewOwnStudentStatus: false,
        canViewAssignedOversightSmoke: true,
      };
    case 'student':
      return {
        canRunStagingSmoke: false,
        canViewObservabilityBaseline: false,
        canViewCanaryReadinessReport: false,
        canTriggerStagingFailureDrill: false,
        canViewOwnStudentStatus: true,
        canViewAssignedOversightSmoke: false,
      };
    default:
      return {
        canRunStagingSmoke: false,
        canViewObservabilityBaseline: false,
        canViewCanaryReadinessReport: false,
        canTriggerStagingFailureDrill: false,
        canViewOwnStudentStatus: false,
        canViewAssignedOversightSmoke: false,
      };
  }
}

export function resolveStagingRole031(rawRole: string): Task031StagingSmokeRole {
  const r = rawRole?.toLowerCase() || 'unknown';
  if (r === 'admin') return 'admin';
  if (r === 'operator') return 'operator';
  if (r === 'teacher') return 'teacher';
  if (r === 'student') return 'student';
  return 'unknown';
}
