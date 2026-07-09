export type Task030EnvironmentType = 'staging' | 'production' | 'live';

export type Task030DataMode = 'synthetic' | 'live' | 'real_student' | 'production';

export type Task030ExecutionMode = 'dry_run' | 'live' | 'real';

export type Task030ActorRole =
  | 'school_admin'
  | 'system_admin'
  | 'internal_operator'
  | 'authorized_expansion_operator'
  | 'operations_reviewer'
  | 'student'
  | 'learner'
  | 'teacher'
  | 'parent'
  | 'peer'
  | 'unknown'
  | 'anonymous';

export type Task030SyntheticRole =
  | 'synthetic_admin'
  | 'synthetic_operator'
  | 'synthetic_teacher'
  | 'synthetic_learner'
  | 'unknown_role';

export type Task030RehearsalStatus =
  | 'created'
  | 'preflight_running'
  | 'preflight_passed'
  | 'journeys_running'
  | 'operations_rehearsal_running'
  | 'rollback_drill_running'
  | 'training_pack_generated'
  | 'report_generated'
  | 'accepted_ready'
  | 'blocked';

export type Task030RehearsalStageStatus =
  | 'not_started'
  | 'running'
  | 'passed'
  | 'failed'
  | 'blocked'
  | 'skipped';

export type Task030RehearsalDecision = 'ready_for_task031' | 'blocked';

export type Task030GateStatus = 'passed' | 'failed' | 'not_checked';

export interface Task030Task029DependencyProof {
  ok: boolean;
  commit029Acceptance: string;
  commit029Implementation: string;
  reportFound: boolean;
  safeToStartTask030: boolean;
  finalDecision: string;
  blockingIssuesEmpty: boolean;
  focusedTestsPassed: boolean;
  regressionsPassed: boolean;
  fullBackendSuitePassed: boolean;
  typecheckPassed: boolean;
  buildPassed: boolean;
  prismaValidatePassed: boolean;
  prismaGeneratePassed: boolean;
  safetyScansPassed: boolean;
  reportsRepaired: boolean;
  remainingBlockers: string[];
  safeMessage: string;
}

export interface Task030StagingEnvironmentGateInput {
  environmentType: string;
  dataMode: string;
  executionMode: string;
  productionDeploymentRequested: boolean;
  liveStudentAccessRequested: boolean;
  liveNotificationRequested: boolean;
  liveAiRequested: boolean;
  liveSchoolConnectorRequested: boolean;
  productionMutationRequested: boolean;
  canaryRequested: boolean;
  rolloutRequested: boolean;
  schoolWideLaunchRequested: boolean;
}

export interface Task030StagingEnvironmentGateResult {
  ok: boolean;
  environmentType: string;
  dataMode: string;
  executionMode: string;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030SyntheticSchoolFixture {
  schoolId: string;
  adminId: string;
  operatorId: string;
  teacherIds: string[];
  learnerIds: string[];
  parentIds: string[];
  classIds: string[];
  subjectIds: string[];
  cohortIds: string[];
  approvedCurriculumSource: string;
  safeLessonMetadata: Record<string, string>;
  safeObjectiveMetadata: Record<string, string>;
  createdAt: string;
}

export interface Task030SyntheticCohortFixture {
  cohortId: string;
  schoolId: string;
  className: string;
  subjectName: string;
  learnerCount: number;
  teacherCount: number;
  safeCohortLabel: string;
}

export interface Task030SyntheticLearnerFixture {
  learnerId: string;
  schoolId: string;
  cohortIds: string[];
  safeStatus: string;
}

export interface Task030SyntheticTeacherFixture {
  teacherId: string;
  schoolId: string;
  cohortIds: string[];
  safeRole: string;
}

export interface Task030SyntheticParentFixture {
  parentId: string;
  schoolId: string;
  safeRelationship: string;
  noContactData: boolean;
}

export interface Task030RoleToken {
  syntheticRole: Task030SyntheticRole;
  token: string;
  actorIdHash: string;
  permissions: Record<string, boolean>;
}

export interface Task030RoleTokenMatrix {
  matrixId: string;
  tokens: Task030RoleToken[];
  createdAt: string;
}

export interface Task030RehearsalRun {
  runId: string;
  schoolId: string;
  environmentType: string;
  dataMode: string;
  executionMode: string;
  status: Task030RehearsalStatus;
  preflightResult: Task030RehearsalStageResult | null;
  adminOperatorJourneyResult: Task030AdminOperatorJourneyResult | null;
  teacherJourneyResult: Task030TeacherJourneyResult | null;
  studentJourneyResult: Task030StudentJourneyResult | null;
  unknownRoleDenialResult: Task030UnknownRoleDenialResult | null;
  operationsConsoleRehearsalResult: Task030OperationsConsoleRehearsalResult | null;
  controlActionRehearsalResult: Task030ControlActionRehearsalResult | null;
  rollbackDrillResult: Task030RollbackDrillResult | null;
  staffTrainingPack: Task030StaffTrainingPack | null;
  decision: Task030RehearsalDecision | null;
  blockingIssues: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task030RehearsalScenario {
  scenarioId: string;
  runId: string;
  name: string;
  syntheticRole: Task030SyntheticRole;
  status: Task030RehearsalStageStatus;
  safeSummary: string;
}

export interface Task030RehearsalStageResult {
  stageId: string;
  runId: string;
  status: Task030RehearsalStageStatus;
  ok: boolean;
  blockingIssues: string[];
  safeSummary: string;
  details: Record<string, unknown>;
}

export interface Task030AdminOperatorJourneyResult {
  ok: boolean;
  journeySteps: Task030JourneyStepResult[];
  allPassed: boolean;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030TeacherJourneyResult {
  ok: boolean;
  journeySteps: Task030JourneyStepResult[];
  allPassed: boolean;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030StudentJourneyResult {
  ok: boolean;
  journeySteps: Task030JourneyStepResult[];
  allPassed: boolean;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030UnknownRoleDenialResult {
  ok: boolean;
  deniedRoutes: string[];
  allDenied: boolean;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030JourneyStepResult {
  stepName: string;
  syntheticRole: Task030SyntheticRole;
  expectedAllowed: boolean;
  actualAllowed: boolean;
  passed: boolean;
  safeMessage: string;
  reasonCodes: string[];
}

export interface Task030OperationsConsoleRehearsalResult {
  ok: boolean;
  consoleComponents: Task030ConsoleComponentResult[];
  allPassed: boolean;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030ConsoleComponentResult {
  componentName: string;
  accessible: boolean;
  safeSummary: string;
}

export interface Task030ControlActionRehearsalResult {
  ok: boolean;
  actions: Task030ControlActionResult[];
  allPassed: boolean;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030ControlActionResult {
  actionName: string;
  dryRunExecuted: boolean;
  liveActionPrevented: boolean;
  passed: boolean;
  safeSummary: string;
}

export interface Task030RollbackDrillResult {
  ok: boolean;
  drillSteps: Task030RollbackStepResult[];
  allPassed: boolean;
  destructiveDeletePrevented: boolean;
  auditPreserved: boolean;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030RollbackStepResult {
  stepName: string;
  dryRunExecuted: boolean;
  passed: boolean;
  safeSummary: string;
}

export interface Task030StaffTrainingPack {
  packId: string;
  runId: string;
  checklists: Task030TrainingChecklist[];
  generatedAt: string;
}

export interface Task030TrainingChecklist {
  checklistName: string;
  items: Task030ChecklistItem[];
  allChecked: boolean;
}

export interface Task030ChecklistItem {
  itemId: string;
  description: string;
  checked: boolean;
}

export interface Task030SafeEvidenceEvent {
  eventId: string;
  runId: string;
  scenarioId: string;
  stageId: string;
  actorRole: string;
  syntheticRole: string;
  status: string;
  safeSummary: string;
  reasonCodes: string[];
  createdAt: string;
}

export interface Task030EvidenceLedger {
  ledgerId: string;
  runId: string;
  events: Task030SafeEvidenceEvent[];
  createdAt: string;
}

export interface Task030DiagnosticsResult {
  ok: boolean;
  task029ProofLoaderStatus: Task030GateStatus;
  stagingEnvironmentGateStatus: Task030GateStatus;
  fixtureServiceStatus: Task030GateStatus;
  roleTokenMatrixStatus: Task030GateStatus;
  journeyServicesStatus: Task030GateStatus;
  operationsConsoleRehearsalStatus: Task030GateStatus;
  rollbackDrillStatus: Task030GateStatus;
  reportStatus: Task030GateStatus;
  safetyScanReadiness: Task030GateStatus;
  routeMountStatus: Task030GateStatus;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030ControlledStagingReport {
  taskId: string;
  scope: string;
  task029AcceptanceCommit: string;
  task029ImplementationCommit: string;
  task029DependencyVerified: boolean;
  task030Started: boolean;
  task031Started: boolean;
  task032Started: boolean;
  task033Started: boolean;
  task034Started: boolean;
  task035Started: boolean;
  task040Started: boolean;
  frontendUiCreated: boolean;
  productionDeploymentIntroduced: boolean;
  realNotificationsSent: boolean;
  liveAiCallIntroduced: boolean;
  liveSchoolConnectorWriteIntroduced: boolean;
  productionDataMutationExecuted: boolean;
  realStudentDataUsed: boolean;
  syntheticDataOnly: boolean;
  stagingEnvironmentOnly: boolean;
  dryRunOnly: boolean;
  contractsCreatedOrUpdated: boolean;
  validationCreatedOrUpdated: boolean;
  repositoryCreatedOrUpdated: boolean;
  servicesCreatedOrUpdated: boolean;
  routesCreatedOrUpdated: boolean;
  routesMountedOrDirectlyTested: boolean;
  verifiedSchoolContextRequired: boolean;
  task029AcceptanceRequired: boolean;
  stagingEnvironmentGatePassed: boolean;
  syntheticSchoolFixturePassed: boolean;
  roleTokenMatrixPassed: boolean;
  rehearsalRunStateMachinePassed: boolean;
  adminOperatorJourneyPassed: boolean;
  teacherJourneyPassed: boolean;
  studentJourneyPassed: boolean;
  unknownRoleDenialPassed: boolean;
  operationsConsoleRehearsalPassed: boolean;
  controlActionRehearsalPassed: boolean;
  rollbackDrillPassed: boolean;
  staffTrainingPackPassed: boolean;
  evidenceLedgerPassed: boolean;
  diagnosticsPassed: boolean;
  reportPassed: boolean;
  task030FocusedTestsRun: boolean;
  task030FocusedTestsPassed: boolean;
  task030FocusedTestFiles: number;
  task030FocusedTestsPassedCount: number;
  task030FocusedTestsFailedCount: number;
  task020To029RegressionRun: boolean;
  task020To029RegressionPassed: boolean;
  phase3RegressionRun: boolean;
  phase3RegressionPassed: boolean;
  fullBackendSuiteRun: boolean;
  fullBackendSuitePassed: boolean;
  fullBackendSuiteFailedFiles: number;
  fullBackendSuiteFailedTests: number;
  prismaValidateRun: boolean;
  prismaValidatePassed: boolean;
  prismaGenerateRun: boolean;
  prismaGeneratePassed: boolean;
  backendBuildRun: boolean;
  backendBuildPassed: boolean;
  backendTypecheckRun: boolean;
  backendTypecheckPassed: boolean;
  task030VerificationScriptRun: boolean;
  task030VerificationScriptPassed: boolean;
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
  noTask031ToTask040ScanRun: boolean;
  noTask031ToTask040ScanPassed: boolean;
  noFalsePassScanRun: boolean;
  noFalsePassScanPassed: boolean;
  safeToStartTask031: boolean;
  safeToStartTask032: boolean;
  safeToStartTask033: boolean;
  safeToStartTask034: boolean;
  safeToStartTask035: boolean;
  safeToStartTask040: boolean;
  verdict: 'ACCEPTED_READY_YES' | 'ACCEPTED_READY_NO';
  commandsRun: string[];
  filesCreated: string[];
  filesModified: string[];
  filesStaged: string[];
  filesIntentionallyNotStaged: string[];
  remainingBlockers: string[];
}

export interface Task030AcceptanceReport {
  taskId: string;
  verdict: 'ACCEPTED_READY_YES' | 'ACCEPTED_READY_NO';
  safeToStartTask031: boolean;
  safeToStartTask032: boolean;
  safeToStartTask033: boolean;
  safeToStartTask034: boolean;
  safeToStartTask035: boolean;
  safeToStartTask040: boolean;
  remainingBlockers: string[];
}

export const TASK030_ALLOWED_ENVIRONMENT_TYPES = ['staging'];
export const TASK030_FORBIDDEN_ENVIRONMENT_TYPES = ['production', 'live'];
export const TASK030_ALLOWED_DATA_MODES = ['synthetic'];
export const TASK030_FORBIDDEN_DATA_MODES = ['live', 'real_student', 'production'];
export const TASK030_ALLOWED_EXECUTION_MODES = ['dry_run'];
export const TASK030_FORBIDDEN_EXECUTION_MODES = ['live', 'real'];

export const TASK030_ALLOWED_REAL_ACTOR_ROLES: Task030ActorRole[] = [
  'school_admin',
  'system_admin',
  'internal_operator',
  'authorized_expansion_operator',
  'operations_reviewer',
];

export const TASK030_DENIED_REAL_ACTOR_ROLES: Task030ActorRole[] = [
  'student',
  'learner',
  'teacher',
  'parent',
  'peer',
  'unknown',
  'anonymous',
];

export const TASK030_SYNTHETIC_ROLES: Task030SyntheticRole[] = [
  'synthetic_admin',
  'synthetic_operator',
  'synthetic_teacher',
  'synthetic_learner',
  'unknown_role',
];

export const TASK030_REHEARSAL_SCENARIO_IDS = [
  'proof_loader',
  'environment_gate',
  'fixture_creation',
  'role_matrix',
  'preflight',
  'run_lifecycle',
  'admin_journey',
  'teacher_journey',
  'learner_journey',
  'unknown_denial',
  'console_rehearsal',
  'control_actions',
  'rollback_drill',
  'training_pack',
  'evidence_ledger',
  'diagnostics',
  'report',
];

export const TASK030_REHEARSAL_STAGE_IDS = [
  'task029_proof',
  'staging_environment_gate',
  'synthetic_fixture',
  'role_token_matrix',
  'preflight',
  'run_creation',
  'admin_operator_journey',
  'teacher_journey',
  'student_journey',
  'unknown_role_denial',
  'operations_console_rehearsal',
  'control_action_rehearsal',
  'rollback_drill',
  'staff_training_pack',
  'evidence_ledger',
  'diagnostics',
  'report_generation',
];

export const TASK030_CONTROL_ACTION_REHEARSAL_IDS = [
  'pause_rehearsal',
  'resume_rehearsal',
  'request_intervention',
  'kill_switch_enable',
  'kill_switch_disable',
];

export const TASK030_FORBIDDEN_OUTPUT_FIELDS = [
  'rawStudentData',
  'rawLearnerData',
  'rawParentData',
  'rawTeacherData',
  'rawChat',
  'rawMessage',
  'rawStudentAnswer',
  'rawStudentWork',
  'safeguardingRaw',
  'rawSafeguarding',
  'privateDeenText',
  'deenSensitiveRaw',
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
  'rawNotificationPayload',
  'rawEmailBody',
  'rawSmsBody',
  'parentPhone',
  'parentEmail',
  'studentPhone',
  'studentEmail',
];

export const TASK030_FORBIDDEN_SIDE_EFFECT_PATTERNS = [
  'sendEmail',
  'sendSms',
  'sendWhatsApp',
  'nodemailer',
  'twilio',
  'smtp',
  'mailgun',
  'sendgrid',
  'fetch(',
  'axios',
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
  'pg_dump',
  'pg_restore',
  'prisma migrate deploy',
  'prisma db push',
  'prisma migrate reset',
  'kubectl apply',
  'railway up',
  'vercel deploy',
  'fly deploy',
];

export const TASK030_SAFE_TO_NEXT_TASK_STATUSES = {
  safeToStartTask031: true,
  safeToStartTask032: false,
  safeToStartTask033: false,
  safeToStartTask034: false,
  safeToStartTask035: false,
  safeToStartTask040: false,
};

const SYNTHETIC_ADMIN_PERMISSIONS: Record<string, boolean> = {
  canViewConsole: true,
  canTriggerControlActions: true,
  canRunRollbackDrill: true,
  canGenerateReport: true,
  canViewEvidence: true,
  canManageFixtures: true,
  canRunJourneys: true,
};
const SYNTHETIC_OPERATOR_PERMISSIONS: Record<string, boolean> = {
  canViewConsole: true,
  canTriggerControlActions: true,
  canRunRollbackDrill: true,
  canGenerateReport: true,
  canViewEvidence: true,
  canManageFixtures: false,
  canRunJourneys: true,
};
const SYNTHETIC_TEACHER_PERMISSIONS: Record<string, boolean> = {
  canViewConsole: false,
  canTriggerControlActions: false,
  canRunRollbackDrill: false,
  canGenerateReport: false,
  canViewEvidence: false,
  canManageFixtures: false,
  canRunJourneys: false,
};
const SYNTHETIC_LEARNER_PERMISSIONS: Record<string, boolean> = {
  canViewConsole: false,
  canTriggerControlActions: false,
  canRunRollbackDrill: false,
  canGenerateReport: false,
  canViewEvidence: false,
  canManageFixtures: false,
  canRunJourneys: false,
};
const UNKNOWN_ROLE_PERMISSIONS: Record<string, boolean> = {
  canViewConsole: false,
  canTriggerControlActions: false,
  canRunRollbackDrill: false,
  canGenerateReport: false,
  canViewEvidence: false,
  canManageFixtures: false,
  canRunJourneys: false,
};

export function getTask030SyntheticPermissions(role: Task030SyntheticRole): Record<string, boolean> {
  switch (role) {
    case 'synthetic_admin': return { ...SYNTHETIC_ADMIN_PERMISSIONS };
    case 'synthetic_operator': return { ...SYNTHETIC_OPERATOR_PERMISSIONS };
    case 'synthetic_teacher': return { ...SYNTHETIC_TEACHER_PERMISSIONS };
    case 'synthetic_learner': return { ...SYNTHETIC_LEARNER_PERMISSIONS };
    default: return { ...UNKNOWN_ROLE_PERMISSIONS };
  }
}

export function resolveTask030ActorRole(rawRole: string): Task030ActorRole {
  const r = rawRole?.toLowerCase() || 'unknown';
  switch (r) {
    case 'school_admin': return 'school_admin';
    case 'system_admin': return 'system_admin';
    case 'internal_operator': return 'internal_operator';
    case 'authorized_expansion_operator': return 'authorized_expansion_operator';
    case 'operations_reviewer': return 'operations_reviewer';
    case 'student': return 'student';
    case 'learner': return 'learner';
    case 'teacher': return 'teacher';
    case 'parent': return 'parent';
    case 'peer': return 'peer';
    case 'anonymous': return 'anonymous';
    default: return 'unknown';
  }
}

export function isTask030AdminOperatorRole(role: Task030ActorRole): boolean {
  return TASK030_ALLOWED_REAL_ACTOR_ROLES.includes(role);
}

export function isTask030DeniedRealRole(role: string): boolean {
  const resolved = resolveTask030ActorRole(role);
  return TASK030_DENIED_REAL_ACTOR_ROLES.includes(resolved);
}

export function createTask030SafeId(prefix: string, seed: string): string {
  const hash = Array.from(seed + prefix).reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0);
  const suffix = Math.abs(hash % 1000000).toString().padStart(6, '0');
  return `synthetic_${prefix}_${suffix}`;
}

export function getTask030RequiredStageIds(): string[] {
  return [...TASK030_REHEARSAL_STAGE_IDS];
}
