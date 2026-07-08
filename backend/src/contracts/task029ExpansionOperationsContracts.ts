export type ExpansionOperationsRole =
  | 'school_admin'
  | 'system_admin'
  | 'internal_operator'
  | 'authorized_expansion_operator'
  | 'authorized_expansion_reviewer'
  | 'operations_reviewer'
  | 'safeguarding_reviewer'
  | 'content_governance_reviewer'
  | 'deen_source_reviewer'
  | 'teacher_assigned_to_expansion'
  | 'teacher_assigned_to_pilot'
  | 'learner_in_approved_expanded_cohort'
  | 'unknown';

export interface Task029OperationsContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId?: string;
}

export interface Task029Task028DependencyInput {
  requireProof: boolean;
}

export interface Task029Task028DependencyResult {
  ok: boolean;
  proofFound: boolean;
  commitHash: string;
  acceptanceVerdict: string;
  safeToStartTask029: boolean;
  safeToStartTask030: boolean;
  safeToStartTask040: boolean;
  typecheckPassed: boolean;
  buildPassed: boolean;
  suitePassed: boolean;
  safetyScansPassed: boolean;
  blockingIssues: string[];
}

export interface Task029OperationsPermissionInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
}

export interface Task029OperationsPermissionResult {
  ok: boolean;
  role: string;
  permissions: string[];
  blockingIssues: string[];
}

export interface Task029OperationsDashboardInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId?: string;
}

export interface Task029OperationsDashboard {
  schoolId: string;
  expansionRunId?: string;
  task028ProofStatus: { ok: boolean; safeToStartTask029: boolean; blockingIssues: string[] };
  runStatus: string;
  cohortSafeCounts: { approved: number; active: number; blocked: number; rolledBack: number };
  stageSafeCounts: { total: number; active: number; paused: number; completed: number };
  healthRiskLevel: string;
  operationsRiskLevel: string;
  privacyRiskLevel: string;
  safeguardingRiskLevel: string;
  contentGovernanceRiskLevel: string;
  deenContentRiskLevel: string;
  socraticRiskLevel: string;
  interventionQueueCounts: { total: number; open: number; critical: number };
  incidentCounts: { total: number; open: number; critical: number };
  rollbackReadinessStatus: string;
  teacherOversightCounts: { assigned: number; reviewNeeded: number };
  safeNextActionLabels: string[];
  allowedControlActions: string[];
  blockedControlActions: string[];
  lastAuditEventAt: string;
  generatedAt: string;
}

export interface Task029ExpansionRunOperationsStatus {
  runId: string;
  schoolId: string;
  status: string;
  currentStage: number;
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  pausedAt: string;
  rolledBackAt: string;
  completedAt: string;
  safeSummary: string;
  pauseState: string;
  rollbackState: string;
  killSwitchState: string;
  safeStatusReasonCodes: string[];
}

export interface Task029CohortOperationsSummary {
  approvedCohortCount: number;
  approvedLearnerSafeCount: number;
  activeLearnerSafeCount: number;
  blockedLearnerSafeCount: number;
  rolledBackLearnerSafeCount: number;
  teacherSafeCount: number;
  supportOwnerSafeCount: number;
  outOfScopeAccessDeniedCount: number;
  crossSchoolDeniedCount: number;
}

export interface Task029StageOperationsSummary {
  stageId: string;
  stageNumber: number;
  status: string;
  plannedSafeLearnerCount: number;
  activeSafeLearnerCount: number;
  blockedSafeLearnerCount: number;
  safeSubjectScopeCount: number;
  safeCurriculumScopeCount: number;
  startedAt: string;
  pausedAt: string;
  completedAt: string;
  safeSummary: string;
}

export interface Task029HealthOperationsSummary {
  latestHealthStatus: string;
  operationsRiskLevel: string;
  privacyRiskLevel: string;
  safeguardingRiskLevel: string;
  contentGovernanceRiskLevel: string;
  deenContentRiskLevel: string;
  socraticRiskLevel: string;
  blockedAccessCount: number;
  supportNeededCount: number;
  interventionCount: number;
  incidentCount: number;
  rollbackReadinessStatus: string;
  recommendedControlAction: string;
  safeReasonCodes: string[];
}

export interface Task029TeacherOversightOperationsSummary {
  teacherAssignedSafeCount: number;
  teacherOversightViewCount: number;
  teacherReviewNeededCount: number;
  supportNeededCount: number;
  interventionNeededCount: number;
  safeNextActionLabels: string[];
  pauseRecommendationMetadata: string;
  rollbackRecommendationMetadata: string;
}

export interface Task029LearnerOwnStatusInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  learnerSafeRef: string;
  expansionRunId?: string;
}

export interface Task029LearnerOwnStatus {
  learnerSafeRef: string;
  schoolId: string;
  expansionRunId: string;
  isInApprovedExpandedCohort: boolean;
  accessStatus: string;
  pauseStatus: string;
  rollbackStatus: string;
  safeMessage: string;
  nextSafeActionLabel: string;
  supportAvailable: boolean;
}

export interface Task029InterventionQueueOperationsInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId: string;
}

export interface Task029InterventionQueueOperationsSummary {
  queueItemId: string;
  reasonCode: string;
  status: string;
  severity: string;
  assignedRole: string;
  createdAt: string;
  updatedAt: string;
  requiresTeacherReview: boolean;
  requiresAdminReview: boolean;
  requiresPrivacyReview: boolean;
  requiresSafeguardingReview: boolean;
  requiresContentReview: boolean;
  requiresDeenReview: boolean;
  requiresSocraticReview: boolean;
  recommendedControlAction: string;
  safeSummary: string;
}

export interface Task029IncidentOperationsInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId: string;
}

export interface Task029IncidentOperationsSummary {
  incidentId: string;
  severity: string;
  status: string;
  safeCategory: string;
  recommendedControlAction: string;
  requiresSafeguardingReview: boolean;
  requiresPrivacyReview: boolean;
  requiresAdminReview: boolean;
  requiresRollbackReview: boolean;
  createdAt: string;
  safeSummary: string;
}

export interface Task029RollbackCommandInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId: string;
  rollbackReason: string;
}

export interface Task029RollbackCommandResult {
  ok: boolean;
  rollbackId: string;
  status: string;
  expandedAccessBlocked: boolean;
  auditPreserved: boolean;
  dataDestructivelyDeleted: boolean;
  safeMessage: string;
  reasonCodes: string[];
}

export interface Task029ControlActionPreflightInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId: string;
  action: string;
}

export interface Task029ControlActionPreflightResult {
  ok: boolean;
  action: string;
  checksPassed: boolean;
  schoolContextVerified: boolean;
  task028ProofAccepted: boolean;
  sameSchool: boolean;
  actorPermissionGranted: boolean;
  expansionRunExists: boolean;
  runStateAllowsAction: boolean;
  actionAllowed: boolean;
  actionIsStagingRehearsal: boolean;
  actionIsCanary: boolean;
  actionIsRollout: boolean;
  actionIsSchoolWide: boolean;
  privacyBoundaryClear: boolean;
  safeguardingBoundaryClear: boolean;
  contentGovernanceBoundaryClear: boolean;
  rollbackReadiness: boolean;
  auditWritePathAvailable: boolean;
  blockingIssues: string[];
}

export interface Task029ControlActionInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId: string;
  action: string;
  reason?: string;
}

export interface Task029ControlActionResult {
  ok: boolean;
  action: string;
  status: string;
  safeMessage: string;
  reasonCodes: string[];
}

export interface Task029SafeAuditTimelineInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId: string;
}

export interface Task029SafeAuditTimeline {
  schoolId: string;
  expansionRunId: string;
  events: Task029SafeAuditEvent[];
}

export interface Task029SafeAuditEvent {
  eventId: string;
  eventType: string;
  createdAt: string;
  actorRole: string;
  safeSummary: string;
}

export interface Task029EvidenceSummaryInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId: string;
}

export interface Task029EvidenceSummary {
  evidenceEventCount: number;
  accessAllowedCount: number;
  accessDeniedCount: number;
  interventionCount: number;
  incidentCount: number;
  rollbackCount: number;
  teacherOversightCount: number;
  safeLatestEventAt: string;
  safeEvidenceCategories: string[];
}

export interface Task029CompletionReviewSummaryInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId: string;
}

export interface Task029CompletionReviewSummary {
  safeToStartTask029: boolean;
  safeToStartTask030Candidate: boolean;
  remainingBlockers: string[];
  privacyBoundaryStatus: string;
  safeguardingBoundaryStatus: string;
  deenContentBoundaryStatus: string;
  socraticIntegrityStatus: string;
  rollbackReadinessStatus: string;
  safeSummary: string;
}

export interface Task029OperationsDiagnosticsInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
}

export interface Task029OperationsDiagnostics {
  task028ProofStatus: string;
  routeMountStatus: string;
  dashboardReadModelStatus: string;
  permissionMatrixStatus: string;
  controlActionServiceStatus: string;
  reportGenerationStatus: string;
  safetyScanStatus: string;
  blockedDependencyList: string[];
  safeRemediationLabels: string[];
}

export interface Task029OperationsReport {
  taskId: string;
  scope: string;
  task028DependencyCommit: string;
  task030Started: boolean;
  tasks031To035Started: boolean;
  task040Started: boolean;
  frontendUiCreated: boolean;
  stagingRehearsalCreated: boolean;
  canaryReadinessCreated: boolean;
  canaryCreated: boolean;
  rolloutCreated: boolean;
  schoolWideLaunchCreated: boolean;
  productionDeploymentIntroduced: boolean;
  realNotificationsSent: boolean;
  liveAiCallIntroduced: boolean;
  liveSchoolConnectorWriteIntroduced: boolean;
  productionDataMutationExecuted: boolean;
  contractsCreatedOrUpdated: boolean;
  validationCreatedOrUpdated: boolean;
  repositoryCreatedOrUpdated: boolean;
  servicesCreatedOrUpdated: boolean;
  routesCreatedOrUpdated: boolean;
  routesMountedOrDirectlyTested: boolean;
  verifiedSchoolContextRequired: boolean;
  task028AcceptanceRequired: boolean;
  operationsPermissionMatrixPassed: boolean;
  dashboardReadModelPassed: boolean;
  runStatusPanelPassed: boolean;
  cohortSummaryPassed: boolean;
  stageSummaryPassed: boolean;
  healthSummaryPassed: boolean;
  teacherOversightOperationsPassed: boolean;
  learnerOwnStatusBoundaryPassed: boolean;
  interventionQueueOperationsPassed: boolean;
  incidentOperationsPassed: boolean;
  controlActionPreflightPassed: boolean;
  controlActionExecutionPassed: boolean;
  rollbackCommandPassed: boolean;
  safeAuditTimelinePassed: boolean;
  evidenceSummaryPassed: boolean;
  completionReviewSummaryPassed: boolean;
  diagnosticsPassed: boolean;
  reportPassed: boolean;
  task029FocusedTestsRun: boolean;
  task029FocusedTestsPassed: boolean;
  task020To028RegressionRun: boolean;
  task020To028RegressionPassed: boolean;
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
  noTask030StagingScanRun: boolean;
  noTask030StagingScanPassed: boolean;
  noCanaryRolloutSchoolWideScanRun: boolean;
  noCanaryRolloutSchoolWideScanPassed: boolean;
  noFalsePassScanRun: boolean;
  noFalsePassScanPassed: boolean;
  safeToStartTask030: boolean;
  safeToStartTask031: boolean;
  safeToStartTask040: boolean;
  verdict: string;
  commandsRun: string[];
  filesCreated: string[];
  filesModified: string[];
  filesStaged: string[];
  filesIntentionallyNotStaged: string[];
  remainingBlockers: string[];
}

export interface Task028ProofStatus {
  reportFound: boolean;
  taskId: string;
  safeToStartTask029: boolean;
  finalDecision: string;
  blockingIssuesEmpty: boolean;
  acceptanceScenarioPass: boolean;
  verificationExitCodeZero: boolean;
  proofValid: boolean;
  blockingIssues: string[];
}

export interface Task029AcceptanceReport {
  taskId: string;
  scope: string;
  task028DependencyCommitHash: string;
  safeToStartTask030: boolean;
  safeToStartTask031: boolean;
  safeToStartTask040: boolean;
  verdict: string;
  blockingIssues: string[];
}

export const TASK029_OPERATION_PANEL_IDS = [
  'dashboard', 'run-status', 'cohort-summary', 'stage-summary',
  'health-summary', 'teacher-oversight', 'learner-own-status',
  'intervention-queue', 'incident-panel', 'audit-timeline',
  'evidence-summary', 'completion-review', 'diagnostics', 'report',
] as const;

export const TASK029_OPERATION_ACTIONS = [
  'pause_expansion', 'resume_expansion', 'request_intervention',
  'request_rollback', 'execute_kill_switch',
] as const;

export const TASK029_OPERATION_ACTION_STATUSES = [
  'pending', 'preflight_ok', 'preflight_blocked', 'executed', 'failed',
] as const;

export const TASK029_OPERATION_ROLES = [
  'school_admin', 'system_admin', 'internal_operator',
  'authorized_expansion_operator', 'authorized_expansion_reviewer',
  'operations_reviewer', 'safeguarding_reviewer',
  'content_governance_reviewer', 'deen_source_reviewer',
  'teacher_assigned_to_expansion', 'teacher_assigned_to_pilot',
  'learner_in_approved_expanded_cohort',
] as const;

export const TASK029_OPERATION_PERMISSIONS = [
  'view_operations_dashboard', 'view_run_status', 'view_cohort_summary',
  'view_stage_summary', 'view_health_summary', 'view_teacher_oversight',
  'view_intervention_queue', 'view_incident_panel', 'view_audit_timeline',
  'view_evidence_summary', 'view_completion_review_summary',
  'run_control_preflight', 'pause_expansion', 'resume_expansion',
  'request_intervention', 'request_rollback', 'execute_kill_switch',
  'view_learner_own_status', 'generate_task029_report', 'view_diagnostics',
] as const;

export const TASK029_OPERATION_RISK_LEVELS = [
  'low', 'medium', 'high', 'critical',
] as const;

export const TASK029_OPERATION_DECISIONS = [
  'proceed', 'block', 'pause', 'rollback', 'review',
] as const;

export const TASK029_OPERATION_BLOCKER_TYPES = [
  'task028_proof_missing', 'task028_not_accepted',
  'school_context_missing', 'cross_school_access_denied',
  'role_denied', 'expansion_run_not_found',
  'action_not_allowed_in_state', 'privacy_boundary_violation',
  'safeguarding_boundary_violation', 'content_governance_violation',
  'deen_content_violation', 'socratic_integrity_violation',
  'rollback_not_ready', 'audit_write_failed',
  'staging_rehearsal_not_allowed', 'canary_not_allowed',
  'rollout_not_allowed', 'school_wide_not_allowed',
] as const;

export const TASK029_OPERATION_AUDIT_EVENTS = [
  'operation_viewed', 'dashboard_viewed', 'control_preflight_passed',
  'control_preflight_blocked', 'pause_requested', 'pause_completed',
  'resume_requested', 'resume_completed', 'intervention_requested',
  'rollback_requested', 'rollback_completed', 'kill_switch_enabled',
  'kill_switch_disabled', 'diagnostics_viewed', 'report_generated',
] as const;

export const TASK029_OPERATION_EVIDENCE_EVENT_TYPES = [
  'access_allowed', 'access_denied', 'intervention_created',
  'incident_created', 'rollback_executed', 'teacher_oversight_viewed',
] as const;

export const TASK029_FORBIDDEN_FIELDS = [
  'rawStudentData', 'rawLearnerData', 'rawParentData', 'rawTeacherData',
  'rawStudentProfile', 'rawParentProfile', 'rawTeacherProfile',
  'rawSafeguardingNote', 'rawSafeguardingCase', 'safeguardingRaw',
  'privateDeenText', 'deenSensitiveRaw', 'rawChat', 'rawMessage',
  'rawStudentAnswer', 'rawStudentWork', 'answerKey', 'correctAnswer',
  'modelAnswer', 'markingScheme', 'teacherOnlyContent', 'teacherOnlyNote',
  'providerPrompt', 'providerResponse', 'rawProviderResponse',
  'chainOfThought', 'hiddenReasoning', 'scratchpad',
  'rawSsoToken', 'rawJwt', 'rawAccessToken', 'rawRefreshToken', 'rawIdToken',
  'authorization', 'cookie', 'apiKey', 'privateKey',
  'DATABASE_URL', 'REDIS_URL', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY',
  'rawNotificationPayload', 'rawEmailBody', 'rawSmsBody', 'rawWhatsappBody',
  'parentPhone', 'parentEmail', 'studentPhone', 'studentEmail',
  'productionDeploymentCommand', 'productionRollbackCommand',
  'liveAiProviderPayload', 'liveSchoolConnectorPayload',
  'externalWebhookPayload', 'stagingRehearsalPayload',
  'frontendDashboardPayload',
] as const;

export const TASK029_FORBIDDEN_OUTPUT_PATTERNS = TASK029_FORBIDDEN_FIELDS;

export const TASK029_SAFE_TO_NEXT_TASK_STATUS = [
  'task030_ready', 'task030_blocked', 'task031_blocked', 'task040_blocked',
] as const;

export function resolveExpansionOpsRole(rawRole: string): ExpansionOperationsRole {
  const r = rawRole?.toLowerCase() || 'unknown';
  if (r === 'school_admin' || r === 'admin') return 'school_admin';
  if (r === 'system_admin') return 'system_admin';
  if (r === 'internal_operator' || r === 'operator') return 'internal_operator';
  if (r === 'authorized_expansion_operator') return 'authorized_expansion_operator';
  if (r === 'authorized_expansion_reviewer') return 'authorized_expansion_reviewer';
  if (r === 'operations_reviewer') return 'operations_reviewer';
  if (r === 'safeguarding_reviewer') return 'safeguarding_reviewer';
  if (r === 'content_governance_reviewer') return 'content_governance_reviewer';
  if (r === 'deen_source_reviewer') return 'deen_source_reviewer';
  if (r === 'teacher_assigned_to_expansion' || r === 'teacher') return 'teacher_assigned_to_expansion';
  if (r === 'teacher_assigned_to_pilot') return 'teacher_assigned_to_pilot';
  if (r === 'learner_in_approved_expanded_cohort' || r === 'student') return 'learner_in_approved_expanded_cohort';
  return 'unknown';
}

export function getRolePermissionsList(role: ExpansionOperationsRole): string[] {
  switch (role) {
    case 'school_admin':
    case 'system_admin':
    case 'internal_operator':
      return [
        'view_operations_dashboard', 'view_run_status', 'view_cohort_summary',
        'view_stage_summary', 'view_health_summary', 'view_teacher_oversight',
        'view_intervention_queue', 'view_incident_panel', 'view_audit_timeline',
        'view_evidence_summary', 'view_completion_review_summary',
        'run_control_preflight', 'pause_expansion', 'resume_expansion',
        'request_intervention', 'request_rollback', 'execute_kill_switch',
        'generate_task029_report', 'view_diagnostics',
      ];
    case 'authorized_expansion_operator':
      return [
        'view_operations_dashboard', 'view_run_status', 'view_cohort_summary',
        'view_stage_summary', 'view_health_summary', 'view_teacher_oversight',
        'view_intervention_queue', 'view_incident_panel', 'view_audit_timeline',
        'view_evidence_summary', 'view_completion_review_summary',
        'run_control_preflight', 'pause_expansion', 'resume_expansion',
        'request_intervention', 'request_rollback', 'execute_kill_switch',
        'generate_task029_report', 'view_diagnostics',
      ];
    case 'authorized_expansion_reviewer':
    case 'operations_reviewer':
      return [
        'view_operations_dashboard', 'view_run_status', 'view_cohort_summary',
        'view_stage_summary', 'view_health_summary', 'view_teacher_oversight',
        'view_intervention_queue', 'view_incident_panel', 'view_audit_timeline',
        'view_evidence_summary', 'view_completion_review_summary',
        'request_intervention',
      ];
    case 'safeguarding_reviewer':
      return [
        'view_operations_dashboard', 'view_run_status', 'view_cohort_summary',
        'view_health_summary', 'view_intervention_queue', 'view_incident_panel',
        'request_intervention',
      ];
    case 'content_governance_reviewer':
      return [
        'view_operations_dashboard', 'view_run_status',
        'view_intervention_queue', 'request_intervention',
      ];
    case 'deen_source_reviewer':
      return [
        'view_operations_dashboard', 'view_run_status',
        'view_intervention_queue',
      ];
    case 'teacher_assigned_to_expansion':
    case 'teacher_assigned_to_pilot':
      return [
        'view_teacher_oversight',
      ];
    case 'learner_in_approved_expanded_cohort':
      return [
        'view_learner_own_status',
      ];
    default:
      return [];
  }
}
