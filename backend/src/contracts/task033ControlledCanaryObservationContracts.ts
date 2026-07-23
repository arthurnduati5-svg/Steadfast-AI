export type Task033ObservationEnvironmentType = 'controlled_canary_observation';
export type Task033ObservationMode = 'internal_observation_only';
export type Task033ObservationDataMode = 'safe_aggregate_only';
export type Task033ObservationSideEffectMode = 'internal_observation_store_only';

export type Task033ActorRole =
  | 'school_admin'
  | 'system_admin'
  | 'internal_operator'
  | 'authorized_canary_operator'
  | 'operations_reviewer'
  | 'teacher'
  | 'student'
  | 'learner'
  | 'parent'
  | 'peer'
  | 'unknown'
  | 'anonymous';

export type Task033ObservationSessionStatus =
  | 'created'
  | 'dependency_checking'
  | 'dependency_passed'
  | 'environment_checking'
  | 'environment_passed'
  | 'observation_ready'
  | 'observing_internal'
  | 'aggregation_running'
  | 'aggregation_passed'
  | 'health_observing'
  | 'health_passed'
  | 'privacy_observing'
  | 'privacy_passed'
  | 'governance_observing'
  | 'governance_passed'
  | 'socratic_observing'
  | 'socratic_passed'
  | 'deen_observing'
  | 'deen_passed'
  | 'identity_observing'
  | 'identity_passed'
  | 'incident_observing'
  | 'incident_passed'
  | 'drift_checking'
  | 'drift_passed'
  | 'rollback_readiness_checking'
  | 'rollback_readiness_passed'
  | 'observation_complete'
  | 'paused'
  | 'kill_switch_enabled'
  | 'rollback_requested'
  | 'blocked';

export type Task033ObservationGateStatus = 'pass' | 'fail' | 'blocked' | 'not_checked';
export type Task033ObservationDecision = 'pass' | 'fail' | 'pause' | 'block' | 'rollback_recommended';

export interface Task033Task032DependencyProof {
  ok: boolean;
  commitFound: boolean;
  commitHash: string;
  task032ReportFound: boolean;
  task032OpsReportFound: boolean;
  verdict: string;
  safeToStartTask033: boolean;
  safeToStartTask034: boolean;
  safeToStartTask035: boolean;
  safeToStartTask040: boolean;
  task032FocusedTestsPassed: boolean;
  task020To032RegressionPassed: boolean;
  phase3RegressionPassed: boolean;
  fullBackendSuitePassed: boolean;
  backendBuildPassed: boolean;
  backendTypecheckPassed: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  task032VerificationScriptPassed: boolean;
  privacyScanPassed: boolean;
  noProductionMutationScanPassed: boolean;
  noLiveConnectorAiScanPassed: boolean;
  noLiveNotificationScanPassed: boolean;
  noFrontendUiScanPassed: boolean;
  noTask033ToTask040ScanPassed: boolean;
  noFalsePassScanPassed: boolean;
  correctiveCommitNoForbidden: boolean;
  remainingBlockers: string[];
  blockingIssues: string[];
}

export interface Task033ObservationEnvironmentGateInput {
  environmentType: string;
  observationMode: string;
  dataMode: string;
  sideEffectMode: string;
  task032Accepted: boolean;
  task033Started: boolean;
  task034Started: boolean;
  task035Started: boolean;
  task040Started: boolean;
  rolloutRequested: boolean;
  schoolWideLaunchRequested: boolean;
  backendFreezeRequested: boolean;
  trafficRoutingRequested: boolean;
  cohortExpansionRequested: boolean;
  liveAiRequested: boolean;
  liveConnectorRequested: boolean;
  liveNotificationRequested: boolean;
  productionDeploymentRequested: boolean;
  productionMutationRequested: boolean;
  frontendUiRequested: boolean;
}

export interface Task033ObservationEnvironmentGateResult {
  ok: boolean;
  passed: boolean;
  environmentTypeValid: boolean;
  observationModeValid: boolean;
  dataModeValid: boolean;
  sideEffectModeValid: boolean;
  task032Accepted: boolean;
  task033Started: boolean;
  task034Started: boolean;
  task035Started: boolean;
  task040Started: boolean;
  rolloutBlocked: boolean;
  schoolWideLaunchBlocked: boolean;
  backendFreezeBlocked: boolean;
  trafficRoutingBlocked: boolean;
  cohortExpansionBlocked: boolean;
  liveAiBlocked: boolean;
  liveConnectorBlocked: boolean;
  liveNotificationBlocked: boolean;
  productionDeploymentBlocked: boolean;
  productionMutationBlocked: boolean;
  frontendUiBlocked: boolean;
  blockingIssues: string[];
}

export interface Task033ObservationSessionInput {
  sessionId: string;
  activationId: string;
  schoolId: string;
  cohortId: string;
  actorRole: Task033ActorRole;
}

export interface Task033ObservationSessionRecord {
  sessionId: string;
  activationId: string;
  schoolId: string;
  cohortId: string;
  actorRole: Task033ActorRole;
  status: Task033ObservationSessionStatus;
  observationStage: string;
  createdAt: string;
  updatedAt: string;
  blockingIssues: string[];
}

export interface Task033ObservationEventInput {
  eventId: string;
  sessionId: string;
  activationId: string;
  schoolId: string;
  actorRole: Task033ActorRole;
  safeActorHash: string;
  safeStudentHash: string;
  cohortId: string;
  classId: string;
  subjectId: string;
  eventType: string;
  safeReasonCodes: string[];
  safeSummary: string;
  gateName: string;
  gatePassed: boolean;
  latencyMs: number;
  errorCategory: string;
  createdAt: string;
  forbiddenFields?: Record<string, unknown>;
}

export interface Task033ObservationEventRecord {
  eventId: string;
  sessionId: string;
  activationId: string;
  schoolId: string;
  actorRole: Task033ActorRole;
  safeActorHash: string;
  safeStudentHash: string;
  cohortId: string;
  classId: string;
  subjectId: string;
  eventType: string;
  safeReasonCodes: string[];
  safeSummary: string;
  gateName: string;
  gatePassed: boolean;
  latencyMs: number;
  errorCategory: string;
  createdAt: string;
}

export interface Task033ObservationSafeAggregate {
  sessionId: string;
  totalObservedEvents: number;
  allowedEventCount: number;
  deniedEventCount: number;
  safeDenialCount: number;
  privacyBoundaryPassCount: number;
  privacyBoundaryFailureCount: number;
  schoolIdentityPassCount: number;
  schoolIdentityFailureCount: number;
  contentGovernancePassCount: number;
  contentGovernanceFailureCount: number;
  socraticPassCount: number;
  socraticFailureCount: number;
  deenBoundaryPassCount: number;
  deenBoundaryFailureCount: number;
  runtimeGuardPassCount: number;
  runtimeGuardFailureCount: number;
  incidentSignalCount: number;
  criticalIncidentSignalCount: number;
  rollbackReadinessPassCount: number;
  rollbackReadinessFailureCount: number;
  driftSignalCount: number;
  healthBudgetPassCount: number;
  healthBudgetFailureCount: number;
  generatedAt: string;
}

export interface Task033HealthObservationResult {
  ok: boolean;
  observationLatencyP95Ms: number;
  eventIntakeLatencyP95Ms: number;
  safeReadLatencyP95Ms: number;
  aggregationLatencyP95Ms: number;
  errorRate: number;
  criticalErrorCount: number;
  timeoutCount: number;
  observationStoreErrorCount: number;
  privacyBoundaryFailureCount: number;
  schoolContextBypassCount: number;
  crossSchoolAttemptCount: number;
  runtimeGuardDenialCount: number;
  healthBudgetPassed: boolean;
  blockingIssues: string[];
}

export interface Task033RuntimeGuardObservationResult {
  ok: boolean;
  sessionBeforeSchoolContextBlocked: boolean;
  memoryAccessBeforeSchoolContextBlocked: boolean;
  aiCallBeforeSchoolContextBlocked: boolean;
  tutorContextBeforeApprovedCurriculumBlocked: boolean;
  crossSchoolAccessBlocked: boolean;
  learnerToLearnerVisibilityBlocked: boolean;
  parentRawDetailExposureBlocked: boolean;
  teacherOnlyLeakageBlocked: boolean;
  unsafeDeenAuthorityBlocked: boolean;
  answerBotBehaviorBlocked: boolean;
  blockingIssues: string[];
}

export interface Task033PrivacyObservationResult {
  ok: boolean;
  rawLearnerProfilesBlocked: boolean;
  realEmailsBlocked: boolean;
  realPhoneNumbersBlocked: boolean;
  parentContactDataBlocked: boolean;
  rawChatBlocked: boolean;
  rawStudentAnswersBlocked: boolean;
  rawStudentWorkBlocked: boolean;
  safeguardingRawNotesBlocked: boolean;
  privateDeenTextBlocked: boolean;
  answerKeysBlocked: boolean;
  markingSchemesBlocked: boolean;
  teacherPrivateNotesBlocked: boolean;
  providerPromptsResponsesBlocked: boolean;
  hiddenReasoningBlocked: boolean;
  blockingIssues: string[];
}

export interface Task033ContentGovernanceObservationResult {
  ok: boolean;
  approvedSourceContextRequired: boolean;
  unapprovedSourceUsageDenied: boolean;
  teacherOnlySourceNotExposedToLearnerRoute: boolean;
  answerKeyContentNotExposed: boolean;
  contentGapSafeReferral: boolean;
  noInventedTeachingClaim: boolean;
  curriculumScopePreserved: boolean;
  sourceGovernancePolicyPreserved: boolean;
  blockingIssues: string[];
}

export interface Task033SocraticIntegrityObservationResult {
  ok: boolean;
  hintsFirstBehaviorPreserved: boolean;
  noFinalAnswerLeakage: boolean;
  noAnswerBotShortcut: boolean;
  studentAttemptRequiredForPractice: boolean;
  reflectionPathPreserved: boolean;
  cheatingPreventionPreserved: boolean;
  blockingIssues: string[];
}

export interface Task033DeenBoundaryObservationResult {
  ok: boolean;
  notFatwaEngine: boolean;
  approvedDeenSourceRequired: boolean;
  teacherScholarReferralPreserved: boolean;
  sectarianSafetyPreserved: boolean;
  privateDeenTextNotExposed: boolean;
  noPietyScoring: boolean;
  noUnsafeAuthorityClaim: boolean;
  blockingIssues: string[];
}

export interface Task033SchoolIdentityObservationResult {
  ok: boolean;
  verifiedSchoolIdentityRequired: boolean;
  unknownSchoolDenied: boolean;
  crossSchoolAccessDenied: boolean;
  actorRoleRequired: boolean;
  actorRoleScoped: boolean;
  learnerSeesOwnSafeStatusOnly: boolean;
  teacherSeesSafeClassSummaryWhereAllowed: boolean;
  adminSeesSafeAggregateOnly: boolean;
  blockingIssues: string[];
}

export interface Task033CrossSchoolDenialObservationResult {
  ok: boolean;
  crossSchoolAttemptsBlocked: boolean;
  schoolAContextNotVisibleToSchoolB: boolean;
  noInterSchoolLearnerVisibility: boolean;
  noInterSchoolTeacherDataLeakage: boolean;
  safeAuditOfCrossSchoolAttempts: boolean;
  blockingIssues: string[];
}

export interface Task033IncidentSignalObservationResult {
  ok: boolean;
  incidentSignalCount: number;
  criticalSignalCount: number;
  safeReasonCodes: string[];
  safeSeverity: string;
  safeCategory: string;
  safeSummary: string;
  rollbackRecommended: boolean;
  pauseRecommended: boolean;
  killSwitchRecommended: boolean;
  realAlertSent: boolean;
  realEmailSent: boolean;
  realSmsSent: boolean;
  realWhatsappSent: boolean;
  externalTicketCreated: boolean;
  webhookCalled: boolean;
  rawIncidentDetailsExposed: boolean;
  safeguardingRawExposed: boolean;
  blockingIssues: string[];
}

export interface Task033RollbackReadinessObservationResult {
  ok: boolean;
  rollbackAvailable: boolean;
  pauseAvailable: boolean;
  killSwitchAvailable: boolean;
  rollbackPlanStillValid: boolean;
  rollbackOwnerAssigned: boolean;
  runtimeBlockableByRollback: boolean;
  safeAuditSummaryPreservedOnRollback: boolean;
  blockingIssues: string[];
}

export interface Task033DriftDetectionResult {
  ok: boolean;
  driftDetected: boolean;
  driftCodes: string[];
  rolloutRequestObserved: boolean;
  cohortExpansionRequestObserved: boolean;
  trafficRoutingRequestObserved: boolean;
  schoolWideLaunchRequestObserved: boolean;
  backendFreezeRequestObserved: boolean;
  liveAiRequestObserved: boolean;
  liveConnectorRequestObserved: boolean;
  liveNotificationRequestObserved: boolean;
  productionDeploymentRequestObserved: boolean;
  rawPrivateDataFieldObserved: boolean;
  answerArtifactFieldObserved: boolean;
  recommendation: string;
  blockingIssues: string[];
}

export interface Task033SafeReadModel {
  sessionId: string;
  activationId: string;
  schoolId: string;
  status: Task033ObservationSessionStatus;
  observationStage: string;
  observedEventCount: number;
  safeAggregate: Task033ObservationSafeAggregate | null;
  healthStatus: Task033ObservationGateStatus;
  privacyStatus: Task033ObservationGateStatus;
  governanceStatus: Task033ObservationGateStatus;
  socraticStatus: Task033ObservationGateStatus;
  deenStatus: Task033ObservationGateStatus;
  schoolIdentityStatus: Task033ObservationGateStatus;
  incidentStatus: Task033ObservationGateStatus;
  rollbackReadinessStatus: Task033ObservationGateStatus;
  driftStatus: Task033ObservationGateStatus;
  safeToStartTask034: boolean;
  safeToStartTask035: boolean;
  safeToStartTask040: boolean;
  safeReasonCodes: string[];
  generatedAt: string;
}

export interface Task033EvidenceEvent {
  eventId: string;
  sessionId: string;
  evidenceType: string;
  safeDescription: string;
  safeReasonCodes: string[];
  timestamp: string;
  actorRole: Task033ActorRole;
}

export interface Task033EvidenceLedger {
  sessionId: string;
  events: Task033EvidenceEvent[];
  totalCount: number;
  generatedAt: string;
}

export interface Task033DiagnosticsResult {
  ok: boolean;
  sessionId: string;
  dependencyProofLoaded: boolean;
  environmentGatePassed: boolean;
  stateMachineConsistent: boolean;
  eventIntakeWorking: boolean;
  aggregationWorking: boolean;
  healthObservationWorking: boolean;
  runtimeGuardObservationWorking: boolean;
  privacyObservationWorking: boolean;
  contentGovernanceObservationWorking: boolean;
  socraticObservationWorking: boolean;
  deenObservationWorking: boolean;
  schoolIdentityObservationWorking: boolean;
  crossSchoolDenialObservationWorking: boolean;
  incidentSignalObservationWorking: boolean;
  rollbackReadinessObservationWorking: boolean;
  driftDetectionWorking: boolean;
  safeReadModelWorking: boolean;
  evidenceLedgerWorking: boolean;
  reportGenerationWorking: boolean;
  blockingIssues: string[];
  diagnosticDetails: Record<string, unknown>;
}

export interface Task033ControlledCanaryObservationReport {
  taskId: string;
  scope: string;
  task032DependencyCommit: string;
  task032DependencyVerified: boolean;
  task033Started: boolean;
  task034Started: boolean;
  task035Started: boolean;
  task040Started: boolean;
  frontendUiCreated: boolean;
  rolloutCreated: boolean;
  schoolWideLaunchCreated: boolean;
  backendFreezeCreated: boolean;
  productionDeploymentIntroduced: boolean;
  realNotificationsSent: boolean;
  liveAiCallIntroduced: boolean;
  liveSchoolConnectorWriteIntroduced: boolean;
  productionDataMutationExecuted: boolean;
  rawPrivateDataStored: boolean;
  controlledCanaryObservationCreated: boolean;
  controlledCanaryRolloutCreated: boolean;
  schoolWideLaunchReadinessCreated: boolean;
  contractsCreatedOrUpdated: boolean;
  validationCreatedOrUpdated: boolean;
  repositoryCreatedOrUpdated: boolean;
  servicesCreatedOrUpdated: boolean;
  routesCreatedOrUpdated: boolean;
  routesMountedOrDirectlyTested: boolean;
  verifiedSchoolContextRequired: boolean;
  task032AcceptanceRequired: boolean;
  observationEnvironmentGatePassed: boolean;
  observationSessionStateMachinePassed: boolean;
  observationEventIntakePassed: boolean;
  safeAggregationPassed: boolean;
  healthObservationPassed: boolean;
  runtimeGuardObservationPassed: boolean;
  privacyObservationPassed: boolean;
  contentGovernanceObservationPassed: boolean;
  socraticIntegrityObservationPassed: boolean;
  deenBoundaryObservationPassed: boolean;
  schoolIdentityObservationPassed: boolean;
  crossSchoolDenialObservationPassed: boolean;
  incidentSignalObservationPassed: boolean;
  rollbackReadinessObservationPassed: boolean;
  driftDetectionPassed: boolean;
  safeReadModelPassed: boolean;
  evidenceLedgerPassed: boolean;
  diagnosticsPassed: boolean;
  reportPassed: boolean;
  task033FocusedTestsRun: boolean;
  task033FocusedTestsPassed: boolean;
  task033FocusedTestFiles: number;
  task033FocusedTestsPassedCount: number;
  task033FocusedTestsFailedCount: number;
  task020To032RegressionRun: boolean;
  task020To032RegressionPassed: boolean;
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
  task033VerificationScriptRun: boolean;
  task033VerificationScriptPassed: boolean;
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
  noTask034ToTask040ScanRun: boolean;
  noTask034ToTask040ScanPassed: boolean;
  noFalsePassScanRun: boolean;
  noFalsePassScanPassed: boolean;
  safeToStartTask034: boolean;
  safeToStartTask035: boolean;
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

export interface Task033AcceptanceReport {
  ok: boolean;
  verdict: 'ACCEPTED_READY_YES' | 'ACCEPTED_READY_NO';
  safeToStartTask034: boolean;
  safeToStartTask035: boolean;
  safeToStartTask040: boolean;
  remainingBlockers: string[];
  details: Record<string, unknown>;
  generatedAt: string;
}

export const TASK033_ALLOWED_ENVIRONMENT_TYPES: readonly string[] = ['controlled_canary_observation'];
export const TASK033_FORBIDDEN_ENVIRONMENT_TYPES: readonly string[] = ['production', 'staging', 'controlled_rollout', 'school_wide_launch'];
export const TASK033_ALLOWED_OBSERVATION_MODES: readonly string[] = ['internal_observation_only'];
export const TASK033_FORBIDDEN_OBSERVATION_MODES: readonly string[] = ['rollout', 'limited_rollout', 'school_wide_launch'];
export const TASK033_ALLOWED_DATA_MODES: readonly string[] = ['safe_aggregate_only'];
export const TASK033_FORBIDDEN_DATA_MODES: readonly string[] = ['raw_learner_data', 'raw_chat', 'raw_answers', 'raw_safeguarding', 'raw_deen'];
export const TASK033_ALLOWED_SIDE_EFFECT_MODES: readonly string[] = ['internal_observation_store_only'];
export const TASK033_FORBIDDEN_SIDE_EFFECT_MODES: readonly string[] = ['live_notification', 'live_ai_call', 'live_connector_write', 'production_mutation', 'external_observability_vendor'];
export const TASK033_ALLOWED_ACTOR_ROLES: readonly Task033ActorRole[] = ['school_admin', 'system_admin', 'internal_operator', 'authorized_canary_operator', 'operations_reviewer'];
export const TASK033_DENIED_ACTOR_ROLES: readonly Task033ActorRole[] = ['student', 'learner', 'parent', 'peer', 'unknown', 'anonymous'];
export const TASK033_REQUIRED_DEPENDENCY_COMMITS: readonly string[] = ['276445d'];
export const TASK033_OBSERVATION_STAGE_IDS: readonly string[] = [
  'dependency_check', 'environment_gate', 'session_init', 'event_intake',
  'safe_aggregation', 'health_observe', 'runtime_guard_observe', 'privacy_observe',
  'governance_observe', 'socratic_observe', 'deen_observe', 'identity_observe',
  'cross_school_observe', 'incident_observe', 'rollback_observe', 'drift_detect',
  'safe_read', 'evidence_ledger', 'diagnostics', 'report_generate',
];
export const TASK033_VALID_STATE_TRANSITIONS: Record<Task033ObservationSessionStatus, Task033ObservationSessionStatus[]> = {
  created: ['dependency_checking'],
  dependency_checking: ['dependency_passed', 'blocked'],
  dependency_passed: ['environment_checking'],
  environment_checking: ['environment_passed', 'blocked'],
  environment_passed: ['observation_ready'],
  observation_ready: ['observing_internal'],
  observing_internal: ['aggregation_running', 'paused', 'kill_switch_enabled', 'rollback_requested'],
  aggregation_running: ['aggregation_passed', 'blocked', 'paused'],
  aggregation_passed: ['health_observing'],
  health_observing: ['health_passed', 'blocked', 'paused'],
  health_passed: ['privacy_observing'],
  privacy_observing: ['privacy_passed', 'blocked', 'paused'],
  privacy_passed: ['governance_observing'],
  governance_observing: ['governance_passed', 'blocked', 'paused'],
  governance_passed: ['socratic_observing'],
  socratic_observing: ['socratic_passed', 'blocked', 'paused'],
  socratic_passed: ['deen_observing'],
  deen_observing: ['deen_passed', 'blocked', 'paused'],
  deen_passed: ['identity_observing'],
  identity_observing: ['identity_passed', 'blocked', 'paused'],
  identity_passed: ['incident_observing'],
  incident_observing: ['incident_passed', 'blocked', 'paused'],
  incident_passed: ['drift_checking'],
  drift_checking: ['drift_passed', 'blocked', 'paused'],
  drift_passed: ['rollback_readiness_checking'],
  rollback_readiness_checking: ['rollback_readiness_passed', 'blocked', 'paused'],
  rollback_readiness_passed: ['observation_complete'],
  observation_complete: [],
  paused: ['observing_internal', 'aggregation_running', 'health_observing', 'privacy_observing', 'governance_observing', 'socratic_observing', 'deen_observing', 'identity_observing', 'incident_observing', 'drift_checking', 'rollback_readiness_checking', 'kill_switch_enabled', 'rollback_requested'],
  kill_switch_enabled: [],
  rollback_requested: [],
  blocked: [],
};

export const TASK033_FORBIDDEN_OUTPUT_FIELDS: readonly string[] = [
  'studentName', 'studentEmail', 'studentPhone', 'parentName', 'parentEmail', 'parentPhone',
  'rawLearnerData', 'rawChat', 'rawMessage', 'rawStudentAnswer', 'rawStudentWork',
  'safeguardingRaw', 'privateDeenText', 'answerKey', 'correctAnswer', 'modelAnswer',
  'markingScheme', 'teacherPrivateNotes', 'providerPrompt', 'providerResponse',
  'hiddenReasoning', 'chainOfThought', 'rawNotificationPayload', 'rawEmailBody',
  'rawSmsBody',
];

export const TASK033_FORBIDDEN_SIDE_EFFECT_PATTERNS: readonly string[] = [
  'sendEmail', 'sendSms', 'sendWhatsapp', 'nodemailer', 'twilio', 'smtp',
  'fetch(', 'axios', 'openai', 'anthropic', 'gemini', 'provider.generate',
  'chat.completions', 'webhook', 'liveConnector', 'sisClient',
  'prisma.migrate', 'prisma.db.push', 'pg_dump', 'DROP TABLE',
  'kubectl apply', 'vercel deploy', 'railway up',
];

export const TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS: readonly string[] = [
  'task034', 'task035', 'task040', 'limited rollout', 'controlled rollout',
  'school-wide launch', 'backend freeze',
];

export function resolveTask033ActorRole(rawRole: string): Task033ActorRole {
  const r = rawRole?.toLowerCase() || 'unknown';
  if (r === 'school_admin' || r === 'schooladmin') return 'school_admin';
  if (r === 'system_admin' || r === 'systemadmin') return 'system_admin';
  if (r === 'internal_operator' || r === 'internaloperator') return 'internal_operator';
  if (r === 'authorized_canary_operator' || r === 'canary_operator') return 'authorized_canary_operator';
  if (r === 'operations_reviewer' || r === 'operationsreviewer') return 'operations_reviewer';
  if (r === 'teacher') return 'teacher';
  if (r === 'student') return 'student';
  if (r === 'learner') return 'learner';
  if (r === 'parent') return 'parent';
  if (r === 'peer') return 'peer';
  if (r === 'anonymous') return 'anonymous';
  return 'unknown';
}

export function isTask033AdminOperatorRole(role: Task033ActorRole): boolean {
  return TASK033_ALLOWED_ACTOR_ROLES.includes(role);
}

export function isTask033DeniedRole(role: Task033ActorRole): boolean {
  return TASK033_DENIED_ACTOR_ROLES.includes(role);
}

export function createTask033SafeId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${ts}_${rand}`;
}

export function getTask033RequiredStageIds(): string[] {
  return [...TASK033_OBSERVATION_STAGE_IDS];
}

export function calculateTask033ObservationDecision(
  gateResults: Task033ObservationGateStatus[],
): Task033ObservationDecision {
  if (gateResults.some(g => g === 'blocked')) return 'block';
  if (gateResults.some(g => g === 'fail')) return 'fail';
  if (gateResults.every(g => g === 'pass')) return 'pass';
  return 'pause';
}

export function isTask033ValidStateTransition(
  from: Task033ObservationSessionStatus,
  to: Task033ObservationSessionStatus,
): boolean {
  const allowed = TASK033_VALID_STATE_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

export function createTask033SafeTimestamp(): string {
  return new Date().toISOString();
}
