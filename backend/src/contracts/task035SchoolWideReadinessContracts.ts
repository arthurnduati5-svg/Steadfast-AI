export type Task035LaunchRole =
  | 'admin'
  | 'operator'
  | 'teacher_lead'
  | 'teacher'
  | 'student'
  | 'privacy_reviewer'
  | 'deen_reviewer'
  | 'safeguarding_reviewer'
  | 'unknown';

export type Task035SchoolWideReadinessState =
  | 'draft'
  | 'task034_proof_loaded'
  | 'school_boundary_validated'
  | 'simulation_complete'
  | 'staff_release_board_ready'
  | 'student_notice_ready'
  | 'teacher_admin_readiness_complete'
  | 'runtime_guard_simulated'
  | 'health_budget_reviewed'
  | 'rollback_ready'
  | 'privacy_reviewed'
  | 'socratic_reviewed'
  | 'deen_reviewed'
  | 'curriculum_source_reviewed'
  | 'release_board_package_generated'
  | 'decision_computed'
  | 'blocked';

export type Task035LaunchDecision =
  | 'safe_to_prepare_school_launch'
  | 'hold_school_launch'
  | 'pause_school_launch'
  | 'rollback_school_launch'
  | 'not_safe_to_launch';

export type Task035FinalDecision =
  | 'TASK_035_PASS_SAFE_TO_START_TASK_036'
  | 'TASK_035_FAIL_NOT_SAFE_TO_START_TASK_036';

export interface Task035Task034ProofStatus {
  ok: boolean;
  reportFound: boolean;
  taskId: string;
  safeToStartTask035: boolean;
  finalDecision: string;
  blockingIssuesEmpty: boolean;
  verificationExitCodeZero: boolean;
  controlledRolloutScenarioRun: boolean;
  controlledRolloutSafeToStartTask035: boolean;
  controlledRolloutRolloutPercent: number;
  controlledRolloutOpenRolloutPerformed: boolean;
  controlledRolloutSchoolWideRolloutPerformed: boolean;
  controlledRolloutHundredPercentRolloutPerformed: boolean;
  handoffConsistent: boolean;
  handoffAgreesWithReport: boolean;
  standaloneLogExists: boolean;
  standaloneLogExitZero: boolean;
  privacyScanPassed: boolean;
  jsonValidationPassed: boolean;
  testsPassed: boolean;
  noStalePlaceholders: boolean;
  safeToRunTask035: boolean;
  safeToStartTask036: boolean;
  blockingIssues: string[];
}

export interface Task035SchoolBoundaryConfig {
  approvedSchoolId: string;
  approvedTenantId: string;
  approvedRosterScope: string;
  teacherAssignmentScope: string;
  studentMembershipScope: string;
  crossSchoolAccessBlocked: boolean;
  unknownSchoolBlocked: boolean;
  tenantMismatchBlocked: boolean;
  realRosterExportExposed: boolean;
  ok: boolean;
  blockingIssues: string[];
}

export interface Task035ProductionSafeEnvironmentGateResult {
  ok: boolean;
  nodeEnv: string;
  databaseUrlPresent: boolean;
  databaseUrlClassification: string;
  rawDatabaseUrlExposed: boolean;
  publicRolloutBlocked: boolean;
  multiSchoolRolloutBlocked: boolean;
  fullSchoolSimulationOnly: boolean;
  releaseBoardRequired: boolean;
  rollbackReadyRequired: boolean;
  task034ProofRequired: boolean;
  blockingIssues: string[];
}

export interface Task035FullSchoolSimulationResult {
  ok: boolean;
  scenarioRun: boolean;
  scenarioMode: string;
  approvedSchoolOnly: boolean;
  fullSchoolRosterSimulated: boolean;
  simulatedCoveragePercent: number;
  liveActivationPerformed: boolean;
  publicActivationPerformed: boolean;
  multiSchoolActivationPerformed: boolean;
  crossSchoolAccessBlocked: boolean;
  unknownSchoolBlocked: boolean;
  staffReleaseBoardPassed: boolean;
  studentSafeNoticeReady: boolean;
  runtimeGuardPassed: boolean;
  rollbackReadinessPassed: boolean;
  healthCapacityBudgetPassed: boolean;
  privacyReviewPassed: boolean;
  socraticIntegrityPassed: boolean;
  deenGovernancePassed: boolean;
  curriculumSourcePassed: boolean;
  finalLaunchDecision: Task035LaunchDecision;
  safeToStartTask036: boolean;
  blockingIssues: string[];
}

export interface Task035StaffReleaseBoardAcknowledgement {
  actorHash: string;
  role: Task035LaunchRole;
  acknowledgementType: string;
  acknowledgedAt: string;
}

export interface Task035StaffReleaseBoardResult {
  ok: boolean;
  releaseBoardId: string;
  adminApprovalPresent: boolean;
  operatorReadinessPresent: boolean;
  teacherLeadReadinessPresent: boolean;
  privacyReviewPresent: boolean;
  deenGovernanceReviewPresent: boolean;
  safeguardingReviewPresent: boolean;
  rollbackOwnerAssigned: boolean;
  killSwitchOwnerAssigned: boolean;
  supportProcessConfirmed: boolean;
  incidentEscalationProcessConfirmed: boolean;
  studentSafeNoticeApproved: boolean;
  allRequiredRolesAcknowledged: boolean;
  allRequiredChecksPassed: boolean;
  missingRoles: string[];
  roleSupported: boolean;
  mappedToAdminReview: boolean;
  safeSummary: string;
  blockingIssues: string[];
}

export interface Task035StudentSafeNoticeResult {
  ok: boolean;
  noticeReady: boolean;
  noticeIsCalm: boolean;
  noticeNonTechnical: boolean;
  noticeMentionsGuidedLearning: boolean;
  noticeMentionsTeacherHelp: boolean;
  noInternalRolloutDetailsExposed: boolean;
  noPrivateStudentStatus: boolean;
  noOtherStudentInfo: boolean;
  noTeacherOnlyNotes: boolean;
  noAnswerKeys: boolean;
  noAiProviderDetails: boolean;
  noDebugDetails: boolean;
  safeNoticeMessage: string;
  blockingIssues: string[];
}

export interface Task035TeacherAdminReadinessResult {
  ok: boolean;
  teachersKnowEscalationRoute: boolean;
  teachersKnowSocraticPolicy: boolean;
  teachersKnowNoAnswerKeyRule: boolean;
  adminsKnowKillSwitchLocation: boolean;
  adminsKnowRollbackProcess: boolean;
  staffKnowNoRawChatCopyRule: boolean;
  staffKnowDeenReferralPath: boolean;
  staffKnowSafeguardingEscalationBoundary: boolean;
  staffKnowCurriculumGapPath: boolean;
  supportChannelReady: boolean;
  allItemsComplete: boolean;
  blockingIssues: string[];
}

export interface Task035RuntimeGuardSimulationResult {
  ok: boolean;
  sessionBeforeSchoolGateBlocked: boolean;
  aiBeforeSchoolGateBlocked: boolean;
  memoryBeforeSchoolGateBlocked: boolean;
  evidenceBeforeSchoolGateBlocked: boolean;
  unknownStudentBlocked: boolean;
  studentOutsideSchoolBlocked: boolean;
  teacherOutsideAssignmentBlocked: boolean;
  unapprovedSubjectBlocked: boolean;
  contentGapHandledSafely: boolean;
  pauseBlocksRuntime: boolean;
  killSwitchBlocksRuntime: boolean;
  rollbackBlocksRuntime: boolean;
  blockingIssues: string[];
}

export interface Task035HealthCapacityBudgetResult {
  ok: boolean;
  budgetMode: string;
  schoolWideSimulationLatencyBudgetPassed: boolean;
  schoolWideSimulationErrorBudgetPassed: boolean;
  authGateBudgetPassed: boolean;
  privacyGateBudgetPassed: boolean;
  socraticGateBudgetPassed: boolean;
  deenGateBudgetPassed: boolean;
  curriculumGateBudgetPassed: boolean;
  memoryBudgetPassed: boolean;
  aiCallBudgetPassed: boolean;
  voiceReadinessClassified: boolean;
  observabilityReady: boolean;
  rollbackAlertingReady: boolean;
  blockingIssues: string[];
}

export interface Task035RollbackReadinessResult {
  ok: boolean;
  rollbackPlanExists: boolean;
  rollbackOwnerAssigned: boolean;
  killSwitchOwnerAssigned: boolean;
  pauseAvailable: boolean;
  killSwitchAvailable: boolean;
  rollbackBlocksRuntime: boolean;
  rollbackPreservesAudit: boolean;
  rollbackAvoidsDestructiveLearningEvidenceDeletion: boolean;
  studentSafeUnavailableMessageReady: boolean;
  teacherAdminNotificationReady: boolean;
  blockingIssues: string[];
}

export interface Task035PrivacyReviewResult {
  ok: boolean;
  rawStudentChatExposed: boolean;
  privateLearnerMemoryExposed: boolean;
  teacherOnlyNotesExposed: boolean;
  safeguardingRawDetailsExposed: boolean;
  deenSensitivePrivateTextExposed: boolean;
  aiPromptsExposed: boolean;
  providerResponsesExposed: boolean;
  tokensSecretsExposed: boolean;
  databaseUrlsExposed: boolean;
  answerKeysExposed: boolean;
  teacherOnlyContentExposed: boolean;
  protectedRubricsExposed: boolean;
  realStudentEmailsExposed: boolean;
  realPhoneNumbersExposed: boolean;
  realRosterExportExposed: boolean;
  blockingIssues: string[];
}

export interface Task035SocraticIntegrityReviewResult {
  ok: boolean;
  socraticGatePassed: boolean;
  noFinalAnswerPolicyWeakened: boolean;
  answerKeyExposureDetected: boolean;
  homeworkShortcutDetected: boolean;
  studentReasoningFirstPreserved: boolean;
  hintLadderPreserved: boolean;
  teacherEscalationAvailable: boolean;
  blockingIssues: string[];
}

export interface Task035DeenGovernanceReviewResult {
  ok: boolean;
  deenGatePassed: boolean;
  fatwaEngineIntroduced: boolean;
  inventedRulingDetected: boolean;
  sectarianAuthorityClaimDetected: boolean;
  deenSensitivePrivateTextExposed: boolean;
  safeReferralPathPreserved: boolean;
  approvedSourceBoundaryPreserved: boolean;
  blockingIssues: string[];
}

export interface Task035CurriculumSourceReviewResult {
  ok: boolean;
  curriculumGatePassed: boolean;
  approvedCurriculumScopeRequired: boolean;
  approvedSourceScopeRequired: boolean;
  unapprovedSubjectBlocked: boolean;
  teacherOnlyContentExposed: boolean;
  answerKeyExposureDetected: boolean;
  contentGapHandledSafely: boolean;
  fullSchoolSubjectCoverageClassified: boolean;
  blockingIssues: string[];
}

export interface Task035ReleaseBoardPackage {
  task034ProofSummary: Record<string, unknown>;
  schoolBoundarySummary: Record<string, unknown>;
  fullSchoolSimulationSummary: Record<string, unknown>;
  productionSafeEnvironmentGate: Record<string, unknown>;
  staffReleaseBoardSummary: Record<string, unknown>;
  studentSafeNoticeSummary: Record<string, unknown>;
  teacherAdminReadinessSummary: Record<string, unknown>;
  runtimeGuardSimulationSummary: Record<string, unknown>;
  healthCapacityBudgetSummary: Record<string, unknown>;
  rollbackKillSwitchSummary: Record<string, unknown>;
  privacyReviewSummary: Record<string, unknown>;
  socraticReviewSummary: Record<string, unknown>;
  deenReviewSummary: Record<string, unknown>;
  curriculumSourceReviewSummary: Record<string, unknown>;
  blockingIssues: string[];
  knownLimitations: string[];
  safeToStartTask036: boolean;
  finalDecision: Task035FinalDecision;
  generatedAt: string;
}

export interface Task035AcceptanceScenarioResult {
  scenarioRun: boolean;
  scenarioMode: string;
  task034ProofLoaded: boolean;
  productionEnvironmentGatePassed: boolean;
  approvedSchoolBoundaryPassed: boolean;
  fullSchoolRosterSimulated: boolean;
  simulatedCoveragePercent: number;
  liveActivationPerformed: boolean;
  publicActivationPerformed: boolean;
  multiSchoolActivationPerformed: boolean;
  crossSchoolAccessBlocked: boolean;
  staffReleaseBoardPassed: boolean;
  studentSafeNoticeReady: boolean;
  teacherAdminReadinessPassed: boolean;
  runtimeGuardPassed: boolean;
  aiBeforeGateBlocked: boolean;
  memoryBeforeGateBlocked: boolean;
  sessionBeforeGateBlocked: boolean;
  evidenceBeforeGateBlocked: boolean;
  healthCapacityBudgetPassed: boolean;
  rollbackReadinessPassed: boolean;
  pauseBlocksRuntime: boolean;
  killSwitchBlocksRuntime: boolean;
  rollbackBlocksRuntime: boolean;
  privacyReviewPassed: boolean;
  socraticIntegrityPassed: boolean;
  deenGovernancePassed: boolean;
  curriculumSourcePassed: boolean;
  openRegistrationEnabled: boolean;
  publicSignupEnabled: boolean;
  allSchoolsEnabled: boolean;
  rawPrivateDataExposed: boolean;
  finalLaunchDecision: Task035LaunchDecision;
  safeToStartTask036: boolean;
  blockingIssues: string[];
}

export interface Task035Report {
  taskId: string;
  taskName: string;
  generatedAt: string;
  gitBranch: string;
  gitCommit: string;
  workingTreeStatus: string;
  environment: string;
  filesChanged: string[];
  migrationsChanged: string[];
  task034Proof: Record<string, unknown>;
  productionEnvironmentGate: Record<string, unknown>;
  approvedSchoolBoundary: Record<string, unknown>;
  fullSchoolRolloutSimulation: Record<string, unknown>;
  staffReleaseBoard: Record<string, unknown>;
  studentSafeLaunchNotice: Record<string, unknown>;
  teacherAdminReadiness: Record<string, unknown>;
  runtimeGuardSimulation: Record<string, unknown>;
  healthCapacityBudget: Record<string, unknown>;
  rollbackReadiness: Record<string, unknown>;
  privacyReview: Record<string, unknown>;
  socraticIntegrityReview: Record<string, unknown>;
  deenGovernanceReview: Record<string, unknown>;
  curriculumSourceReview: Record<string, unknown>;
  releaseBoardPackage: Record<string, unknown>;
  finalSchoolLaunchDecision: Record<string, unknown>;
  privacyLeakChecks: Record<string, unknown>;
  securityGateChecks: Record<string, unknown>;
  deenGateChecks: Record<string, unknown>;
  socraticGateChecks: Record<string, unknown>;
  curriculumGateChecks: Record<string, unknown>;
  schoolBoundaryChecks: Record<string, unknown>;
  publicRolloutChecks: Record<string, unknown>;
  testResults: Record<string, unknown>[];
  verificationCommands: Record<string, unknown>[];
  blockingIssues: string[];
  knownLimitations: string[];
  safeToStartTask036: boolean;
  finalDecision: Task035FinalDecision;
}

export interface Task035VerificationCommand {
  name: string;
  command: string;
  logPath: string;
  exitCode: number;
  result: string;
  durationSeconds: number;
  summary: string;
}

export const TASK035_FORBIDDEN_OUTPUT_PATTERNS = [
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

export const TASK035_SAFE_IDENTIFIERS = [
  'school_task035_full_school_safe',
  'tenant_task035_full_school_safe',
  'rolloutRunId: school_wide_rollout_task035_safe',
  'releaseBoardId: release_board_task035_safe',
  'student_hash_task035_safe',
  'teacher_hash_task035_safe',
  'admin_hash_task035_safe',
  'operator_hash_task035_safe',
  'school_task035_full_school_safe',
  'tenant_task035_full_school_safe',
  'rolloutRunId: school_wide_rollout_task035_safe',
  'releaseBoardId: release_board_task035_safe',
  'student_hash_task035_safe_',
  'teacher_hash_task035_safe_',
  'admin_hash_task035_safe',
  'operator_hash_task035_safe',
  'task-035', 'TASK_035', 'task035',
  'safeToStartTask036', 'safe_to_prepare_school_launch',
  'controlled_school_wide_readiness_simulation',
];

export function getSchoolWideReadinessRolePermissions035(role: Task035LaunchRole): Record<string, boolean> {
  switch (role) {
    case 'admin':
      return {
        canViewStatus: true,
        canViewReleaseBoard: true,
        canViewStudentNotice: true,
        canSimulate: true,
        canComputeDecision: true,
        canViewReport: true,
        canApprove: true,
      };
    case 'operator':
      return {
        canViewStatus: true,
        canViewReleaseBoard: true,
        canViewStudentNotice: false,
        canSimulate: false,
        canComputeDecision: true,
        canViewReport: true,
        canApprove: false,
      };
    case 'teacher_lead':
    case 'teacher':
      return {
        canViewStatus: true,
        canViewReleaseBoard: true,
        canViewStudentNotice: true,
        canSimulate: false,
        canComputeDecision: false,
        canViewReport: false,
        canApprove: false,
      };
    case 'student':
      return {
        canViewStatus: true,
        canViewReleaseBoard: false,
        canViewStudentNotice: true,
        canSimulate: false,
        canComputeDecision: false,
        canViewReport: false,
        canApprove: false,
      };
    default:
      return {
        canViewStatus: false,
        canViewReleaseBoard: false,
        canViewStudentNotice: false,
        canSimulate: false,
        canComputeDecision: false,
        canViewReport: false,
        canApprove: false,
      };
  }
}

export function resolveSchoolWideReadinessRole035(rawRole: string): Task035LaunchRole {
  const r = rawRole?.toLowerCase() || 'unknown';
  if (r === 'admin') return 'admin';
  if (r === 'operator') return 'operator';
  if (r === 'teacher_lead' || r === 'teacher-lead') return 'teacher_lead';
  if (r === 'teacher') return 'teacher';
  if (r === 'student') return 'student';
  if (r === 'privacy_reviewer' || r === 'privacy-reviewer') return 'privacy_reviewer';
  if (r === 'deen_reviewer' || r === 'deen-reviewer') return 'deen_reviewer';
  if (r === 'safeguarding_reviewer' || r === 'safeguarding-reviewer') return 'safeguarding_reviewer';
  return 'unknown';
}
