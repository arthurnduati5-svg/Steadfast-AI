export type Task036EnvironmentType =
  | 'controlled_live_school_launch'
  | 'development'
  | 'test'
  | 'staging'
  | 'production';

export type Task036LaunchMode =
  | 'single_school_controlled_live_launch'
  | 'pilot_execution'
  | 'canary_activation'
  | 'limited_rollout'
  | 'school_wide_readiness';

export type Task036LaunchWindowStatus =
  | 'pending'
  | 'active'
  | 'expired'
  | 'not_started';

export type Task036LaunchActorRole =
  | 'school_admin'
  | 'internal_operator'
  | 'technical_operator'
  | 'privacy_owner'
  | 'safeguarding_owner'
  | 'content_governance_owner'
  | 'deen_review_owner'
  | 'rollback_owner'
  | 'support_owner'
  | 'student'
  | 'teacher'
  | 'parent'
  | 'unknown';

export type Task036LaunchStatus =
  | 'created'
  | 'dependency_checking'
  | 'dependency_passed'
  | 'environment_checking'
  | 'environment_passed'
  | 'launch_window_checking'
  | 'launch_window_passed'
  | 'approval_checking'
  | 'approval_passed'
  | 'single_school_scope_checking'
  | 'single_school_scope_passed'
  | 'runtime_guard_checking'
  | 'runtime_guard_passed'
  | 'health_budget_checking'
  | 'health_budget_passed'
  | 'privacy_boundary_checking'
  | 'privacy_boundary_passed'
  | 'content_governance_checking'
  | 'content_governance_passed'
  | 'socratic_integrity_checking'
  | 'socratic_integrity_passed'
  | 'deen_boundary_checking'
  | 'deen_boundary_passed'
  | 'school_identity_checking'
  | 'school_identity_passed'
  | 'incident_readiness_checking'
  | 'incident_readiness_passed'
  | 'rollback_readiness_checking'
  | 'rollback_readiness_passed'
  | 'launch_ready'
  | 'launch_active_controlled'
  | 'launch_paused'
  | 'rollback_requested'
  | 'kill_switch_enabled'
  | 'launch_complete'
  | 'blocked';

export type Task036GateStatus = 'pending' | 'passed' | 'failed' | 'blocked';

export type Task036Decision =
  | 'TASK_036_PASS_SAFE_TO_START_TASK_040'
  | 'TASK_036_BLOCKED'
  | 'TASK_036_PAUSE_REQUESTED'
  | 'TASK_036_ROLLBACK_REQUESTED'
  | 'TASK_036_KILL_SWITCH_ENABLED';

export type Task036FinalDecision =
  | 'TASK_036_PASS_SAFE_TO_START_TASK_040'
  | 'TASK_036_BLOCKED';

export interface Task036Task035DependencyProof {
  ok: boolean;
  handoffExists: boolean;
  reportExists: boolean;
  jsonReportExists: boolean;
  verdictIsAcceptedReadyYes: boolean;
  safeToStartTask036: boolean;
  safeToStartTask040: boolean;
  remainingBlockersEmpty: boolean;
  focusedTestsPassed: boolean;
  continuityTestsPassed: boolean;
  routeContractsPassed: boolean;
  roleSecurityTestsPassed: boolean;
  noSafetyTestsPassed: boolean;
  verificationScriptPassed: boolean;
  task020To034RegressionPassed: boolean;
  phase3RegressionPassed: boolean;
  fullBackendSuitePassed: boolean;
  typeScriptPassed: boolean;
  backendBuildPassed: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  noTask036InsideTask035: boolean;
  noTask040InsideTask035: boolean;
  noFrontendUiInsideTask035: boolean;
  noLiveLaunchInsideTask035: boolean;
  blockingIssues: string[];
  loadedAt: string;
}

export interface Task036LaunchEnvironmentGateInput {
  environmentType: Task036EnvironmentType;
  launchMode: Task036LaunchMode;
  dataMode: string;
  sideEffectMode: string;
  task035Accepted: boolean;
  task036Started: boolean;
  task040Started: boolean;
  singleSchoolScope: boolean;
  multiSchoolScope: boolean;
  publicLaunchRequested: boolean;
  marketingLaunchRequested: boolean;
  paymentLaunchRequested: boolean;
  backendFreezeRequested: boolean;
  frontendUiRequested: boolean;
  liveAiExpansionRequested: boolean;
  liveConnectorWriteExpansionRequested: boolean;
  externalNotificationRequested: boolean;
  productionDeploymentRequested: boolean;
  productionMutationRequested: boolean;
}

export interface Task036LaunchEnvironmentGateResult {
  ok: boolean;
  passed: boolean;
  environmentType: string;
  launchMode: string;
  dataMode: string;
  sideEffectMode: string;
  task035Accepted: boolean;
  task036Started: boolean;
  task040Started: boolean;
  singleSchoolScope: boolean;
  multiSchoolScope: boolean;
  publicLaunchRequested: boolean;
  marketingLaunchRequested: boolean;
  paymentLaunchRequested: boolean;
  backendFreezeRequested: boolean;
  frontendUiRequested: boolean;
  liveAiExpansionRequested: boolean;
  liveConnectorWriteExpansionRequested: boolean;
  externalNotificationRequested: boolean;
  productionDeploymentRequested: boolean;
  productionMutationRequested: boolean;
  blockingIssues: string[];
}

export interface Task036LaunchWindowInput {
  launchWindowId: string;
  schoolId: string;
  tenantId: string;
  approvedStartAt: string;
  approvedEndAt: string;
  approvalReferenceId: string;
  rollbackPlanId: string;
  pausePlanId: string;
  killSwitchId: string;
  operatorId: string;
  createdAt: string;
}

export interface Task036LaunchWindowResult {
  ok: boolean;
  passed: boolean;
  launchWindowId: string;
  schoolId: string;
  tenantId: string;
  approvedStartAt: string;
  approvedEndAt: string;
  approvalReferenceId: string;
  rollbackPlanId: string;
  pausePlanId: string;
  killSwitchId: string;
  operatorId: string;
  isExpired: boolean;
  isOpenEnded: boolean;
  isWithinApprovedTime: boolean;
  hasRollbackPlan: boolean;
  hasPausePlan: boolean;
  hasKillSwitch: boolean;
  blockingIssues: string[];
}

export interface Task036LaunchApprovalInput {
  approvalId: string;
  sessionId: string;
  role: Task036LaunchActorRole;
  schoolId: string;
  tenantId: string;
  approvedAt: string;
  approvalRefersToRawPrivateData: boolean;
  approvalRequestsPublicLaunch: boolean;
  approvalRequestsMultiSchoolLaunch: boolean;
  approvalRequestsBackendFreeze: boolean;
}

export interface Task036LaunchApprovalResult {
  ok: boolean;
  passed: boolean;
  approvalId: string;
  role: string;
  roleValid: boolean;
  roleHasApprovalAuthority: boolean;
  withinSchoolScope: boolean;
  noRawPrivateDataReference: boolean;
  noPublicLaunchRequest: boolean;
  noMultiSchoolLaunchRequest: boolean;
  noBackendFreezeRequest: boolean;
  blockingIssues: string[];
}

export interface Task036SingleSchoolScopeInput {
  schoolId: string;
  tenantId: string;
  approvedSchoolConfigExists: boolean;
  approvedRosterSnapshotExists: boolean;
  singleSchoolScope: boolean;
  multiSchoolScope: boolean;
  crossSchoolAccessDenied: boolean;
  publicSignupDisabled: boolean;
  openRegistrationDisabled: boolean;
  paymentFlowDisabled: boolean;
  marketingLaunchDisabled: boolean;
}

export interface Task036SingleSchoolScopeResult {
  ok: boolean;
  passed: boolean;
  schoolId: string;
  tenantId: string;
  approvedSchoolConfigExists: boolean;
  approvedRosterSnapshotExists: boolean;
  singleSchoolScope: boolean;
  multiSchoolScope: boolean;
  crossSchoolAccessDenied: boolean;
  publicSignupDisabled: boolean;
  openRegistrationDisabled: boolean;
  paymentFlowDisabled: boolean;
  marketingLaunchDisabled: boolean;
  blockingIssues: string[];
}

export type Task036LiveLaunchSessionInput = Record<string, unknown>;

export interface Task036LiveLaunchSessionRecord {
  sessionId: string;
  schoolId: string;
  tenantId: string;
  status: Task036LaunchStatus;
  launchWindowId: string;
  approvalId: string;
  operatorId: string;
  createdAt: string;
  updatedAt: string;
  blockingIssues: string[];
}

export type Task036LaunchEventInput = Record<string, unknown>;

export interface Task036LaunchEventRecord {
  eventId: string;
  sessionId: string;
  eventType: string;
  safeSummary: string;
  timestamp: string;
}

export interface Task036RuntimeMonitoringResult {
  ok: boolean;
  activeLaunchSessionCount: number;
  safeRequestCount: number;
  safeDeniedRequestCount: number;
  runtimeGuardDenialCount: number;
  schoolContextBypassAttemptCount: number;
  crossSchoolAttemptCount: number;
  privacyBoundaryFailureCount: number;
  contentGovernanceFailureCount: number;
  socraticIntegrityFailureCount: number;
  deenBoundaryFailureCount: number;
  incidentSignalCount: number;
  criticalIncidentSignalCount: number;
  pauseRecommended: boolean;
  rollbackRecommended: boolean;
  killSwitchRecommended: boolean;
  generatedAt: string;
  blockingIssues: string[];
}

export interface Task036HealthBudgetResult {
  ok: boolean;
  launchLatencyP95Ms: number;
  safeReadLatencyP95Ms: number;
  runtimeMonitorLatencyP95Ms: number;
  errorRate: number;
  criticalErrorCount: number;
  timeoutCount: number;
  privacyBoundaryFailureCount: number;
  schoolContextBypassCount: number;
  crossSchoolAttemptCount: number;
  rollbackReadinessFailureCount: number;
  healthBudgetPassed: boolean;
  pauseRecommended: boolean;
  rollbackRecommended: boolean;
  killSwitchRecommended: boolean;
  blockingIssues: string[];
}

export interface Task036IncidentReadinessResult {
  ok: boolean;
  incidentDetectionReady: boolean;
  incidentClassificationReady: boolean;
  incidentResponseReady: boolean;
  incidentEscalationReady: boolean;
  incidentAuditReady: boolean;
  pausePlanReady: boolean;
  rollbackPlanReady: boolean;
  killSwitchReady: boolean;
  blockingIssues: string[];
}

export interface Task036PauseControlResult {
  ok: boolean;
  paused: boolean;
  pauseReasonCodes: string[];
  sessionId: string;
  pausedAt: string;
  auditPreserved: boolean;
  externalNotificationSent: boolean;
  productionMutated: boolean;
  blockingIssues: string[];
}

export interface Task036RollbackControlResult {
  ok: boolean;
  rollbackRequested: boolean;
  rollbackReasonCodes: string[];
  sessionId: string;
  rollbackRequestedAt: string;
  auditPreserved: boolean;
  destructiveDatabaseCommandsRun: boolean;
  deploymentPerformed: boolean;
  externalServicesCalled: boolean;
  blockingIssues: string[];
}

export interface Task036KillSwitchControlResult {
  ok: boolean;
  killSwitchEnabled: boolean;
  killSwitchReasonCodes: string[];
  sessionId: string;
  killSwitchEnabledAt: string;
  auditPreserved: boolean;
  dataDeleted: boolean;
  externalServicesCalled: boolean;
  blockingIssues: string[];
}

export interface Task036PrivacyBoundaryResult {
  ok: boolean;
  passed: boolean;
  rawStudentChatExposed: boolean;
  rawAnswersExposed: boolean;
  rawSafeguardingNotesExposed: boolean;
  rawDeenTextExposed: boolean;
  rawProviderPayloadExposed: boolean;
  parentContactExposed: boolean;
  teacherPrivateNotesExposed: boolean;
  hiddenReasoningExposed: boolean;
  secretsExposed: boolean;
  answerKeyExposed: boolean;
  markingSchemeExposed: boolean;
  blockingIssues: string[];
}

export interface Task036ContentGovernanceResult {
  ok: boolean;
  passed: boolean;
  approvedSourceRequired: boolean;
  unapprovedContentBlocked: boolean;
  curriculumGatePassed: boolean;
  teacherOnlyContentProtected: boolean;
  noInventedTeachingClaim: boolean;
  blockingIssues: string[];
}

export interface Task036SocraticIntegrityResult {
  ok: boolean;
  passed: boolean;
  socraticGuidancePreserved: boolean;
  noFinalAnswerBotBehavior: boolean;
  cheatingPreventionPreserved: boolean;
  noHomeworkShortcut: boolean;
  blockingIssues: string[];
}

export interface Task036DeenBoundaryResult {
  ok: boolean;
  passed: boolean;
  noFatwaEngineMode: boolean;
  approvedDeenSourceRequired: boolean;
  teacherScholarReferralPreserved: boolean;
  noPietyScoring: boolean;
  noUnsafeDeenAuthority: boolean;
  deenSensitiveTextProtected: boolean;
  blockingIssues: string[];
}

export interface Task036SchoolIdentityResult {
  ok: boolean;
  passed: boolean;
  schoolIdentityVerified: boolean;
  schoolContextVerified: boolean;
  tenantMatchVerified: boolean;
  sessionRequiresVerifiedIdentity: boolean;
  memoryRequiresVerifiedIdentity: boolean;
  evidenceRequiresVerifiedIdentity: boolean;
  aiCallRequiresVerifiedIdentity: boolean;
  actionRequiresVerifiedIdentity: boolean;
  blockingIssues: string[];
}

export interface Task036CrossSchoolDenialResult {
  ok: boolean;
  passed: boolean;
  crossSchoolAccessDenied: boolean;
  crossLearnerVisibilityDenied: boolean;
  parentRawDetailDenied: boolean;
  unknownSchoolBlocked: boolean;
  tenantMismatchBlocked: boolean;
  blockingIssues: string[];
}

export interface Task036SafeLaunchReadModel {
  ok: boolean;
  sessionId: string;
  schoolId: string;
  status: string;
  launchWindowResult: Task036LaunchWindowResult | null;
  environmentGateResult: Task036LaunchEnvironmentGateResult | null;
  approvalResult: Task036LaunchApprovalResult | null;
  singleSchoolScopeResult: Task036SingleSchoolScopeResult | null;
  privacyBoundaryResult: Task036PrivacyBoundaryResult | null;
  contentGovernanceResult: Task036ContentGovernanceResult | null;
  socraticIntegrityResult: Task036SocraticIntegrityResult | null;
  deenBoundaryResult: Task036DeenBoundaryResult | null;
  schoolIdentityResult: Task036SchoolIdentityResult | null;
  crossSchoolDenialResult: Task036CrossSchoolDenialResult | null;
  runtimeMonitoringResult: Task036RuntimeMonitoringResult | null;
  healthBudgetResult: Task036HealthBudgetResult | null;
  incidentReadinessResult: Task036IncidentReadinessResult | null;
  safeSummariesOnly: boolean;
  generatedAt: string;
}

export interface Task036EvidenceEvent {
  eventId: string;
  sessionId: string;
  eventType: string;
  safeSummary: string;
  actorRole: string;
  timestamp: string;
}

export interface Task036EvidenceLedger {
  sessionId: string;
  events: Task036EvidenceEvent[];
  totalEventCount: number;
  generatedAt: string;
}

export interface Task036DiagnosticsResult {
  ok: boolean;
  sessionId: string;
  status: string;
  totalGates: number;
  gatesPassed: number;
  gatesFailed: number;
  gatesPending: number;
  blockingIssueCount: number;
  healthBudgetPassed: boolean;
  incidentReadinessPassed: boolean;
  pauseReady: boolean;
  rollbackReady: boolean;
  killSwitchReady: boolean;
  generatedAt: string;
}

export interface Task036FinalLaunchDecision {
  safeToStartTask040: boolean;
  finalDecision: Task036FinalDecision;
  remainingBlockers: string[];
  allGatesPassed: boolean;
  dependencyProofPassed: boolean;
  environmentGatePassed: boolean;
  launchWindowPassed: boolean;
  launchApprovalPassed: boolean;
  singleSchoolScopePassed: boolean;
  privacyBoundaryPassed: boolean;
  contentGovernancePassed: boolean;
  socraticIntegrityPassed: boolean;
  deenBoundaryPassed: boolean;
  schoolIdentityPassed: boolean;
  crossSchoolDenialPassed: boolean;
  runtimeMonitoringPassed: boolean;
  healthBudgetPassed: boolean;
  incidentReadinessPassed: boolean;
  computedAt: string;
}

export interface Task036LiveSchoolLaunchReport {
  taskId: string;
  scope: string;
  task035DependencyVerified: boolean;
  task036Started: boolean;
  task040Started: boolean;
  frontendUiCreated: boolean;
  publicLaunchCreated: boolean;
  multiSchoolRolloutCreated: boolean;
  backendFreezeCreated: boolean;
  productionDeploymentIntroduced: boolean;
  realNotificationsSent: boolean;
  liveAiExpansionIntroduced: boolean;
  liveSchoolConnectorWriteExpansionIntroduced: boolean;
  productionDataMutationExecuted: boolean;
  rawPrivateDataStored: boolean;
  controlledLiveSchoolLaunchCreated: boolean;
  contractsCreatedOrUpdated: boolean;
  validationCreatedOrUpdated: boolean;
  repositoryCreatedOrUpdated: boolean;
  servicesCreatedOrUpdated: boolean;
  routesCreatedOrUpdated: boolean;
  routesMountedOrDirectlyTested: boolean;
  verifiedSchoolContextRequired: boolean;
  task035AcceptanceRequired: boolean;
  launchEnvironmentGatePassed: boolean;
  launchWindowControlPassed: boolean;
  launchApprovalPassed: boolean;
  singleSchoolScopePassed: boolean;
  liveLaunchStateMachinePassed: boolean;
  runtimeMonitoringPassed: boolean;
  healthBudgetPassed: boolean;
  incidentReadinessPassed: boolean;
  pauseControlPassed: boolean;
  rollbackControlPassed: boolean;
  killSwitchControlPassed: boolean;
  privacyBoundaryPassed: boolean;
  contentGovernancePassed: boolean;
  socraticIntegrityPassed: boolean;
  deenBoundaryPassed: boolean;
  schoolIdentityPassed: boolean;
  crossSchoolDenialPassed: boolean;
  safeLaunchReadModelPassed: boolean;
  evidenceLedgerPassed: boolean;
  diagnosticsPassed: boolean;
  finalLaunchDecisionPassed: boolean;
  reportPassed: boolean;
  task036FocusedTestsRun: boolean;
  task036FocusedTestsPassed: boolean;
  task036FocusedTestFiles: number;
  task036FocusedTestsPassedCount: number;
  task036FocusedTestsFailedCount: number;
  task020To035RegressionRun: boolean;
  task020To035RegressionPassed: boolean;
  phase3RegressionRun: boolean;
  phase3RegressionPassed: boolean;
  fullBackendSuiteRun: boolean;
  fullBackendSuitePassed: boolean;
  fullBackendSuiteFailedFiles: string[];
  fullBackendSuiteFailedTests: string[];
  prismaValidateRun: boolean;
  prismaValidatePassed: boolean;
  prismaGenerateRun: boolean;
  prismaGeneratePassed: boolean;
  backendBuildRun: boolean;
  backendBuildPassed: boolean;
  backendTypecheckRun: boolean;
  backendTypecheckPassed: boolean;
  task036VerificationScriptRun: boolean;
  task036VerificationScriptPassed: boolean;
  privacyScanRun: boolean;
  privacyScanPassed: boolean;
  noProductionMutationScanRun: boolean;
  noProductionMutationScanPassed: boolean;
  noLiveConnectorAiScanRun: boolean;
  noLiveConnectorAiScanPassed: boolean;
  noLiveNotificationScanRun: boolean;
  noLiveNotificationScanPassed: boolean;
  noFrontendUiScanRun: boolean;
  noFrontendUiScanPassed: boolean;
  noTask040ScanRun: boolean;
  noTask040ScanPassed: boolean;
  noFalsePassScanRun: boolean;
  noFalsePassScanPassed: boolean;
  safeToStartTask040: boolean;
  verdict: string;
  commandsRun: string[];
  filesCreated: string[];
  filesModified: string[];
  filesStaged: string[];
  filesIntentionallyNotStaged: string[];
  remainingBlockers: string[];
  generatedAt: string;
}

export interface Task036AcceptanceReport {
  taskId: string;
  verdict: string;
  safeToStartTask040: boolean;
  remainingBlockers: string[];
  gatesSummary: Record<string, string>;
  generatedAt: string;
}

export const TASK036_ALLOWED_ENVIRONMENT_TYPES: Task036EnvironmentType[] = [
  'controlled_live_school_launch',
  'development',
  'test',
  'staging',
];

export const TASK036_FORBIDDEN_ENVIRONMENT_TYPES: string[] = [
  'production',
];

export const TASK036_ALLOWED_LAUNCH_MODES: Task036LaunchMode[] = [
  'single_school_controlled_live_launch',
];

export const TASK036_FORBIDDEN_LAUNCH_MODES: string[] = [
  'pilot_execution',
  'canary_activation',
  'limited_rollout',
  'school_wide_readiness',
];

export const TASK036_ALLOWED_ACTOR_ROLES: Task036LaunchActorRole[] = [
  'school_admin',
  'internal_operator',
  'technical_operator',
  'privacy_owner',
  'safeguarding_owner',
  'content_governance_owner',
  'deen_review_owner',
  'rollback_owner',
  'support_owner',
];

export const TASK036_DENIED_ACTOR_ROLES: Task036LaunchActorRole[] = [
  'student',
  'teacher',
  'parent',
  'unknown',
];

export const TASK036_REQUIRED_DEPENDENCY_COMMITS: string[] = [
  '5eedd358beaee6329984e63a24631bda9fc65494',
];

export const TASK036_REQUIRED_STAGE_IDS: string[] = [
  'task035_accepted',
  'task035_safeToStartTask036_true',
  'task035_no_task036_implementation',
  'task035_no_task040_implementation',
  'task035_no_frontend_ui',
  'task035_no_live_launch',
];

export const TASK036_VALID_STATE_TRANSITIONS: Record<Task036LaunchStatus, Task036LaunchStatus[]> = {
  created: ['dependency_checking', 'blocked'],
  dependency_checking: ['dependency_passed', 'blocked'],
  dependency_passed: ['environment_checking', 'blocked'],
  environment_checking: ['environment_passed', 'blocked'],
  environment_passed: ['launch_window_checking', 'blocked'],
  launch_window_checking: ['launch_window_passed', 'blocked'],
  launch_window_passed: ['approval_checking', 'blocked'],
  approval_checking: ['approval_passed', 'blocked'],
  approval_passed: ['single_school_scope_checking', 'blocked'],
  single_school_scope_checking: ['single_school_scope_passed', 'blocked'],
  single_school_scope_passed: ['runtime_guard_checking', 'blocked'],
  runtime_guard_checking: ['runtime_guard_passed', 'blocked'],
  runtime_guard_passed: ['health_budget_checking', 'blocked'],
  health_budget_checking: ['health_budget_passed', 'blocked'],
  health_budget_passed: ['privacy_boundary_checking', 'blocked'],
  privacy_boundary_checking: ['privacy_boundary_passed', 'blocked'],
  privacy_boundary_passed: ['content_governance_checking', 'blocked'],
  content_governance_checking: ['content_governance_passed', 'blocked'],
  content_governance_passed: ['socratic_integrity_checking', 'blocked'],
  socratic_integrity_checking: ['socratic_integrity_passed', 'blocked'],
  socratic_integrity_passed: ['deen_boundary_checking', 'blocked'],
  deen_boundary_checking: ['deen_boundary_passed', 'blocked'],
  deen_boundary_passed: ['school_identity_checking', 'blocked'],
  school_identity_checking: ['school_identity_passed', 'blocked'],
  school_identity_passed: ['incident_readiness_checking', 'blocked'],
  incident_readiness_checking: ['incident_readiness_passed', 'blocked'],
  incident_readiness_passed: ['rollback_readiness_checking', 'blocked'],
  rollback_readiness_checking: ['rollback_readiness_passed', 'blocked'],
  rollback_readiness_passed: ['launch_ready', 'blocked'],
  launch_ready: ['launch_active_controlled', 'blocked'],
  launch_active_controlled: ['launch_paused', 'rollback_requested', 'kill_switch_enabled', 'launch_complete'],
  launch_paused: ['launch_active_controlled', 'rollback_requested', 'kill_switch_enabled'],
  rollback_requested: ['launch_complete', 'blocked'],
  kill_switch_enabled: ['launch_complete', 'blocked'],
  launch_complete: [],
  blocked: [],
};

export const TASK036_FORBIDDEN_OUTPUT_FIELDS: string[] = [
  'rawLearnerData',
  'rawChat',
  'rawAnswer',
  'parentContact',
  'teacherPrivateNote',
  'providerPayload',
  'hiddenReasoning',
  'secret',
  'privateDeenText',
  'answerKey',
  'markingScheme',
  'rawSafeguardingNote',
  'studentPhone',
  'studentEmail',
  'parentPhone',
  'parentEmail',
];

export const TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS: string[] = [
  'fetch(',
  'axios.',
  'http.request',
  'https.request',
  'openai',
  'anthropic',
  'gemini',
  'provider.generate',
  'generateContent',
  'chat.completions',
  'webhook',
  'liveConnector',
  'sisClient',
  'googleClassroom',
  'microsoftGraph',
  'curriculumVendorClient',
  'sendEmail',
  'sendSms',
  'sendWhatsapp',
  'sendWhatsApp',
  'nodemailer',
  'twilio',
  'smtp.',
  'mailgun',
  'sendgrid',
  'pg_dump',
  'pg_restore',
  'mysqldump',
  'mongodump',
  'mongorestore',
  'prisma migrate deploy',
  'prisma db push',
  'prisma migrate reset',
  'DROP TABLE',
  'TRUNCATE TABLE',
  'DELETE FROM',
  'kubectl apply',
  'railway up',
  'vercel deploy',
  'fly deploy',
  'aws ',
  'gcloud ',
  'az ',
  '.env',
  'task040',
  'task-040',
  'TASK_040',
  'backend freeze',
];

export const TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS: string[] = [
  'task040',
  'task-040',
  'TASK_040',
  'backend freeze',
  'public SaaS',
  'multi-school rollout',
  'marketing launch',
  'payment activation',
  'billing flow',
  'frontend dashboard',
  'browser launch dashboard',
];

export const REQUIRED_APPROVAL_ROLES: Task036LaunchActorRole[] = [
  'school_admin',
  'internal_operator',
  'technical_operator',
  'privacy_owner',
  'safeguarding_owner',
  'content_governance_owner',
  'deen_review_owner',
  'rollback_owner',
  'support_owner',
];

export function resolveTask036ActorRole(roleString: string): Task036LaunchActorRole {
  const normalized = roleString.toLowerCase().replace(/[\s-]+/g, '_');
  const validRoles: Task036LaunchActorRole[] = [
    'school_admin', 'internal_operator', 'technical_operator',
    'privacy_owner', 'safeguarding_owner', 'content_governance_owner',
    'deen_review_owner', 'rollback_owner', 'support_owner',
    'student', 'teacher', 'parent', 'unknown',
  ];
  if (validRoles.includes(normalized as Task036LaunchActorRole)) {
    return normalized as Task036LaunchActorRole;
  }
  return 'unknown';
}

export function isTask036LaunchOperatorRole(role: Task036LaunchActorRole): boolean {
  return TASK036_ALLOWED_ACTOR_ROLES.includes(role);
}

export function isTask036DeniedRole(role: Task036LaunchActorRole): boolean {
  return TASK036_DENIED_ACTOR_ROLES.includes(role);
}

export function createTask036SafeId(): string {
  return `task036_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

export function createTask036SafeTimestamp(): string {
  return new Date().toISOString();
}

export function getTask036RequiredStageIds(): string[] {
  return [...TASK036_REQUIRED_STAGE_IDS];
}

export function isTask036ValidStateTransition(from: Task036LaunchStatus, to: Task036LaunchStatus): boolean {
  const allowed = TASK036_VALID_STATE_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function calculateTask036FinalLaunchDecision(
  gates: Record<string, boolean>
): Task036FinalLaunchDecision {
  const hasGates = Object.keys(gates).length > 0;
  const allPassed = hasGates && Object.values(gates).every(Boolean);
  const failedGates = Object.entries(gates)
    .filter(([_, passed]) => !passed)
    .map(([name]) => name);

  return {
    safeToStartTask040: allPassed,
    finalDecision: allPassed ? 'TASK_036_PASS_SAFE_TO_START_TASK_040' : 'TASK_036_BLOCKED',
    remainingBlockers: failedGates,
    allGatesPassed: allPassed,
    dependencyProofPassed: gates.dependencyProofPassed ?? false,
    environmentGatePassed: gates.environmentGatePassed ?? false,
    launchWindowPassed: gates.launchWindowPassed ?? false,
    launchApprovalPassed: gates.launchApprovalPassed ?? false,
    singleSchoolScopePassed: gates.singleSchoolScopePassed ?? false,
    privacyBoundaryPassed: gates.privacyBoundaryPassed ?? false,
    contentGovernancePassed: gates.contentGovernancePassed ?? false,
    socraticIntegrityPassed: gates.socraticIntegrityPassed ?? false,
    deenBoundaryPassed: gates.deenBoundaryPassed ?? false,
    schoolIdentityPassed: gates.schoolIdentityPassed ?? false,
    crossSchoolDenialPassed: gates.crossSchoolDenialPassed ?? false,
    runtimeMonitoringPassed: gates.runtimeMonitoringPassed ?? false,
    healthBudgetPassed: gates.healthBudgetPassed ?? false,
    incidentReadinessPassed: gates.incidentReadinessPassed ?? false,
    computedAt: new Date().toISOString(),
  };
}

export function calculateTask036SafeToStartTask040(gates: Record<string, boolean>): boolean {
  return Object.values(gates).every(Boolean);
}
