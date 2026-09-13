export type Task030RehearsalRole =
  | 'admin'
  | 'operator'
  | 'teacher'
  | 'student'
  | 'unknown';

export type Task030JourneyStatus =
  | 'not_started'
  | 'running'
  | 'passed'
  | 'failed'
  | 'blocked'
  | 'skipped_with_reason';

export type Task030FinalDecision =
  | 'TASK_030_PASS_SAFE_TO_START_TASK_031'
  | 'TASK_030_FAIL_NOT_SAFE_TO_START_TASK_031';

export type Task030RehearsalDecision =
  | 'safe_to_rehearse'
  | 'blocked_missing_task029_proof'
  | 'blocked_live_student_risk'
  | 'blocked_invalid_environment'
  | 'blocked_role_matrix_failed'
  | 'blocked_privacy_risk'
  | 'blocked_rollout_controls_failed'
  | 'blocked_report_inconsistent';

export interface Task030RehearsalPermission {
  canViewOperationsDashboard: boolean;
  canTriggerPause: boolean;
  canTriggerResume: boolean;
  canTriggerKillSwitch: boolean;
  canTriggerRollback: boolean;
  canGenerateCompletionReview: boolean;
  canViewReports: boolean;
  canViewAssignedOversight: boolean;
  canViewStudentPrivateData: boolean;
  canViewOwnStatus: boolean;
  canViewOversight: boolean;
  canViewHealthInternals: boolean;
}

export interface Task030SyntheticSchoolFixture {
  schoolId: string;
  pilotProgramId: string;
  expansionProposalId: string;
  executionRunId: string;
  stageId: string;
  adminActorIdHash: string;
  operatorActorIdHash: string;
  teacherActorIdHash: string;
  studentActorIdHash: string;
  unknownActorIdHash: string;
  classId: string;
  subjectId: string;
  curriculumScope: string;
  safeOversightItem: Record<string, unknown>;
  safeHealthSnapshot: Record<string, unknown>;
  safeMonitoringEvent: Record<string, unknown>;
  safeRollbackFixture: Record<string, unknown>;
  safeCompletionReviewFixture: Record<string, unknown>;
}

export interface Task030RoleTokenFixture {
  role: Task030RehearsalRole;
  actorIdHash: string;
  permissions: Task030RehearsalPermission;
}

export interface Task030JourneyStep {
  stepName: string;
  role: Task030RehearsalRole;
  expectedAllowed: boolean;
  actualAllowed: boolean;
  safeMessage: string;
  reasonCodes: string[];
  passed: boolean;
}

export interface Task030RoleJourney {
  role: Task030RehearsalRole;
  status: Task030JourneyStatus;
  steps: Task030JourneyStep[];
  blockingReason?: string;
}

export interface Task030JourneyResult {
  role: Task030RehearsalRole;
  steps: Task030JourneyStep[];
  allPassed: boolean;
  blockedReason?: string;
}

export interface Task030NoLiveStudentGuardResult {
  ok: boolean;
  liveStudentDataDetected: boolean;
  productionDataTouched: boolean;
  allowedFixtureMode: string;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030StagingEnvironmentGateResult {
  ok: boolean;
  stagingRehearsalEnabled: boolean;
  noLiveStudentsEnabled: boolean;
  nodeEnv: string;
  nodeEnvClassification: string;
  databaseUrlPresent: boolean;
  databaseUrlClassification: string;
  rawDatabaseUrlExposed: boolean;
  liveRolloutEnabled: boolean;
  productionLikeBlocked: boolean;
  blockingIssues: string[];
  safeSummary: string;
}

export interface Task030ExpansionRehearsalResult {
  scenarioRun: boolean;
  scenarioMode: string;
  task029ProofLoaded: boolean;
  stagingEnvironmentPassed: boolean;
  noLiveStudentGuardPassed: boolean;
  roleMatrixGenerated: boolean;
  adminJourneyPassed: boolean;
  teacherJourneyPassed: boolean;
  studentJourneyPassed: boolean;
  unknownRoleDenied: boolean;
  operationsConsoleRehearsed: boolean;
  pauseRehearsed: boolean;
  resumeRehearsed: boolean;
  killSwitchRehearsed: boolean;
  rollbackRehearsed: boolean;
  completionReviewRehearsed: boolean;
  privacyGatePassed: boolean;
  deenGatePassed: boolean;
  socraticGatePassed: boolean;
  curriculumGatePassed: boolean;
  staffTrainingPackGenerated: boolean;
  liveProductionExpansionPerformed: boolean;
  rawPrivateDataUsed: boolean;
  safeToStartTask031: boolean;
  blockingIssues: string[];
}

export interface Task030StaffTrainingArtifact {
  name: string;
  path: string;
  exists: boolean;
  privacySafe: boolean;
}

export interface Task030ReleaseGateReport {
  taskId: string;
  taskName: string;
  generatedAt: string;
  gitBranch: string;
  gitCommit: string;
  workingTreeStatus: string;
  environment: string;
  filesChanged: string[];
  migrationsChanged: string[];
  task029Proof: Record<string, unknown>;
  stagingEnvironmentGate: Record<string, unknown>;
  noLiveStudentGuard: Record<string, unknown>;
  syntheticSchoolFixture: Record<string, unknown>;
  roleTokenMatrix: Record<string, unknown>;
  adminOperatorJourney: Record<string, unknown>;
  teacherJourney: Record<string, unknown>;
  studentJourney: Record<string, unknown>;
  unknownRoleJourney: Record<string, unknown>;
  operationsConsoleRehearsal: Record<string, unknown>;
  controlActionRehearsal: Record<string, unknown>;
  rollbackDrill: Record<string, unknown>;
  completionReviewRehearsal: Record<string, unknown>;
  staffTrainingPack: Record<string, unknown>;
  privacyLeakChecks: Record<string, unknown>;
  securityGateChecks: Record<string, unknown>;
  deenGateChecks: Record<string, unknown>;
  socraticGateChecks: Record<string, unknown>;
  curriculumGateChecks: Record<string, unknown>;
  testResults: Record<string, unknown>[];
  verificationCommands: Record<string, unknown>[];
  blockingIssues: string[];
  knownLimitations: string[];
  safeToStartTask031: boolean;
  finalDecision: Task030FinalDecision;
}

export interface Task030VerificationCommand {
  name: string;
  command: string;
  logPath: string;
  exitCode: number;
  result: string;
  durationSeconds: number;
  summary: string;
}

export const TASK030_FORBIDDEN_OUTPUT_PATTERNS = [
  'raw student chat', 'private learner memory', 'teacher-only notes',
  'safeguarding raw details', 'Deen-sensitive private text',
  'AI prompt', 'provider response', 'answer key',
  'teacher-only content', 'protected rubric',
  'postgres://', 'postgresql://', 'mysql://',
  'Bearer ', 'sk-proj-', 'sk-ant-',
  'authorization header', 'raw exception object',
  'unredacted stack trace',
];

export const TASK030_SAFE_IDENTIFIER_SUFFIX = 'task030_safe';

export function getRolePermissions030(role: Task030RehearsalRole): Task030RehearsalPermission {
  switch (role) {
    case 'admin':
    case 'operator':
      return {
        canViewOperationsDashboard: true,
        canTriggerPause: true,
        canTriggerResume: true,
        canTriggerKillSwitch: true,
        canTriggerRollback: true,
        canGenerateCompletionReview: true,
        canViewReports: true,
        canViewAssignedOversight: false,
        canViewStudentPrivateData: false,
        canViewOwnStatus: false,
        canViewOversight: true,
        canViewHealthInternals: true,
      };
    case 'teacher':
      return {
        canViewOperationsDashboard: false,
        canTriggerPause: false,
        canTriggerResume: false,
        canTriggerKillSwitch: false,
        canTriggerRollback: false,
        canGenerateCompletionReview: false,
        canViewReports: false,
        canViewAssignedOversight: true,
        canViewStudentPrivateData: false,
        canViewOwnStatus: false,
        canViewOversight: false,
        canViewHealthInternals: false,
      };
    case 'student':
      return {
        canViewOperationsDashboard: false,
        canTriggerPause: false,
        canTriggerResume: false,
        canTriggerKillSwitch: false,
        canTriggerRollback: false,
        canGenerateCompletionReview: false,
        canViewReports: false,
        canViewAssignedOversight: false,
        canViewStudentPrivateData: false,
        canViewOwnStatus: true,
        canViewOversight: false,
        canViewHealthInternals: false,
      };
    default:
      return {
        canViewOperationsDashboard: false,
        canTriggerPause: false,
        canTriggerResume: false,
        canTriggerKillSwitch: false,
        canTriggerRollback: false,
        canGenerateCompletionReview: false,
        canViewReports: false,
        canViewAssignedOversight: false,
        canViewStudentPrivateData: false,
        canViewOwnStatus: false,
        canViewOversight: false,
        canViewHealthInternals: false,
      };
  }
}

export function resolveRehearsalRole030(rawRole: string): Task030RehearsalRole {
  const r = rawRole?.toLowerCase() || 'unknown';
  if (r === 'admin') return 'admin';
  if (r === 'operator') return 'operator';
  if (r === 'teacher') return 'teacher';
  if (r === 'student') return 'student';
  return 'unknown';
}
