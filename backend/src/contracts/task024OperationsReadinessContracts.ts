export const TASK024_OPERATION_ENVIRONMENTS = [
  'local', 'test', 'ci', 'staging', 'production_like', 'production_candidate', 'production', 'unknown',
] as const;
export type Task024OperationEnvironment = typeof TASK024_OPERATION_ENVIRONMENTS[number];

export const TASK024_OPERATION_READINESS_DECISIONS = [
  'ready', 'ready_with_warnings', 'not_ready', 'blocked', 'unknown',
] as const;
export type Task024OperationReadinessDecision = typeof TASK024_OPERATION_READINESS_DECISIONS[number];

export const TASK024_MONITORING_STATUSES = [
  'healthy', 'degraded', 'missing_probe', 'missing_metric', 'missing_alert_policy', 'blocked', 'unknown',
] as const;
export type Task024MonitoringStatus = typeof TASK024_MONITORING_STATUSES[number];

export const TASK024_ALERT_SEVERITIES = [
  'info', 'warning', 'error', 'critical', 'security', 'safeguarding', 'privacy', 'blocked', 'unknown',
] as const;
export type Task024AlertSeverity = typeof TASK024_ALERT_SEVERITIES[number];

export const TASK024_ALERT_STATUSES = [
  'active', 'acknowledged', 'resolved', 'blocked', 'unknown',
] as const;
export type Task024AlertStatus = typeof TASK024_ALERT_STATUSES[number];

export const TASK024_INCIDENT_SEVERITIES = [
  'sev0_school_wide_safety_or_privacy', 'sev1_major_learning_or_identity_outage',
  'sev2_degraded_core_learning', 'sev3_limited_feature_degradation', 'sev4_low_priority', 'unknown',
] as const;
export type Task024IncidentSeverity = typeof TASK024_INCIDENT_SEVERITIES[number];

export const TASK024_INCIDENT_STATUSES = [
  'draft', 'detected', 'triaged', 'contained', 'mitigated', 'resolved', 'postmortem_required', 'closed', 'blocked', 'unknown',
] as const;
export type Task024IncidentStatus = typeof TASK024_INCIDENT_STATUSES[number];

export const TASK024_INCIDENT_OWNER_ROLES = [
  'admin', 'operator', 'school_admin', 'safeguarding_lead', 'privacy_lead', 'deen_lead', 'engineering_lead', 'unassigned',
] as const;
export type Task024IncidentOwnerRole = typeof TASK024_INCIDENT_OWNER_ROLES[number];

export const TASK024_BACKUP_READINESS_STATUSES = [
  'ready', 'missing_plan', 'missing_scope', 'missing_owner', 'missing_schedule',
  'missing_integrity_check', 'dry_run_failed', 'blocked', 'unknown',
] as const;
export type Task024BackupReadinessStatus = typeof TASK024_BACKUP_READINESS_STATUSES[number];

export const TASK024_RESTORE_DRILL_STATUSES = [
  'ready', 'dry_run_passed', 'dry_run_failed', 'missing_restore_steps',
  'missing_integrity_verification', 'unsafe_real_restore_attempted', 'blocked', 'unknown',
] as const;
export type Task024RestoreDrillStatus = typeof TASK024_RESTORE_DRILL_STATUSES[number];

export const TASK024_DATA_INTEGRITY_STATUSES = [
  'passed', 'warning', 'failed', 'not_checked', 'blocked', 'unknown',
] as const;
export type Task024DataIntegrityStatus = typeof TASK024_DATA_INTEGRITY_STATUSES[number];

export const TASK024_LOAD_SIMULATION_STATUSES = [
  'not_started', 'passed', 'failed', 'partial', 'blocked', 'unknown',
] as const;
export type Task024LoadSimulationStatus = typeof TASK024_LOAD_SIMULATION_STATUSES[number];

export const TASK024_PERFORMANCE_BASELINE_STATUSES = [
  'baseline_recorded', 'baseline_missing', 'threshold_missing', 'threshold_exceeded', 'blocked', 'unknown',
] as const;
export type Task024PerformanceBaselineStatus = typeof TASK024_PERFORMANCE_BASELINE_STATUSES[number];

export const TASK024_RUNBOOK_VALIDATION_STATUSES = [
  'passed', 'failed', 'missing_required_section', 'blocked', 'unknown',
] as const;
export type Task024RunbookValidationStatus = typeof TASK024_RUNBOOK_VALIDATION_STATUSES[number];

export const TASK024_DEPENDENCY_STATUSES = [
  'passed', 'failed', 'blocked', 'unknown',
] as const;
export type Task024DependencyStatus = typeof TASK024_DEPENDENCY_STATUSES[number];

export const TASK024_DIAGNOSTIC_SEVERITIES = [
  'info', 'warning', 'error', 'critical', 'unknown',
] as const;
export type Task024DiagnosticSeverity = typeof TASK024_DIAGNOSTIC_SEVERITIES[number];

export const TASK024_AUDIT_EVENT_TYPES = [
  'operations_readiness_evaluated', 'monitoring_readiness_evaluated', 'alert_policy_evaluated',
  'incident_workflow_evaluated', 'incident_severity_evaluated', 'backup_readiness_evaluated',
  'restore_drill_dry_run_evaluated', 'data_integrity_evaluated', 'operations_privacy_guard_evaluated',
  'safe_operations_summary_created', 'load_simulation_evaluated', 'performance_baseline_evaluated',
  'runbook_validation_evaluated', 'task023_dependency_evaluated', 'governance_gate_continuity_evaluated',
  'diagnostic_viewed', 'operations_block_returned',
] as const;
export type Task024AuditEventType = typeof TASK024_AUDIT_EVENT_TYPES[number];

export const TASK024_FORBIDDEN_OPERATION_FIELDS = [
  'DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'SESSION_SECRET', 'COOKIE_SECRET',
  'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY', 'GOOGLE_API_KEY', 'PINECONE_API_KEY',
  'PRIVATE_KEY', 'ACCESS_TOKEN', 'REFRESH_TOKEN', 'ID_TOKEN', 'AUTHORIZATION', 'COOKIE',
  'rawBackupFile', 'rawDatabaseDump', 'rawRestorePayload', 'rawEnv', 'rawSecret', 'rawConnectionString',
  'rawStudentData', 'rawLearnerData', 'rawParentData', 'rawTeacherData',
  'rawChat', 'rawMessage', 'rawStudentAnswer', 'rawStudentWork',
  'safeguardingRaw', 'safeguardingCaseNote', 'privateDeenText', 'deenSensitiveRaw',
  'providerPrompt', 'providerResponse', 'rawProviderResponse',
  'chainOfThought', 'hiddenReasoning', 'scratchpad',
  'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
  'incidentRawLog', 'stackTraceWithSecrets',
] as const;

export interface Task024OperationsReadinessContext {
  actorId: string;
  actorRole: string;
  schoolId?: string;
  operationEnvironment: Task024OperationEnvironment;
  requestId?: string;
}

export interface Task024MonitoringReadinessResult {
  status: Task024MonitoringStatus;
  healthProbeCovered: boolean;
  readinessProbeCovered: boolean;
  schoolAuthGateMonitored: boolean;
  task020GovernanceMonitored: boolean;
  task021SchoolIntegrationMonitored: boolean;
  task022ContentGovernanceMonitored: boolean;
  task023ReadinessMonitored: boolean;
  errorRateMonitored: boolean;
  latencyMonitored: boolean;
  aiEgressBlockMonitored: boolean;
  privacyEventMonitored: boolean;
  backupRestoreMonitored: boolean;
  dataIntegrityMonitored: boolean;
  missingCategories: string[];
  safeSummary: string;
}

export interface Task024AlertPolicyResult {
  policyDefined: boolean;
  alertCategories: string[];
  severity: Task024AlertSeverity;
  owner: string;
  escalationPath: string;
  thresholdDefined: boolean;
  safeSummary: string;
}

export interface Task024IncidentResponsePlan {
  incidentId: string;
  category: string;
  severity: Task024IncidentSeverity;
  owner: string;
  escalationPath: string;
  containmentSteps: string[];
  mitigationSteps: string[];
  postmortemRequired: boolean;
  safeSummary: string;
}

export interface Task024IncidentSeverityDecision {
  incidentId: string;
  severity: Task024IncidentSeverity;
  requiresImmediateContainment: boolean;
  requiresSafeguardingEscalation: boolean;
  requiresPrivacyEscalation: boolean;
  requiresSchoolAdminNotification: boolean;
  requiresPostmortem: boolean;
  safeReasonCode: string;
}

export interface Task024BackupReadinessResult {
  status: Task024BackupReadinessStatus;
  scopeDefined: boolean;
  ownerDefined: boolean;
  scheduleDefined: boolean;
  integrityCheckDefined: boolean;
  privacyBoundaryDefined: boolean;
  noRawOutput: boolean;
  safeSummary: string;
}

export interface Task024RestoreDrillDryRunResult {
  status: Task024RestoreDrillStatus;
  dryRunMode: boolean;
  restorePlanDefined: boolean;
  ownerDefined: boolean;
  integrityVerificationDefined: boolean;
  privacyBoundaryDefined: boolean;
  rollbackDefined: boolean;
  realRestoreBlocked: boolean;
  safeSummary: string;
}

export interface Task024OperationalDataIntegrityResult {
  status: Task024DataIntegrityStatus;
  schoolIdentityIntegrity: boolean;
  rosterMappingIntegrity: boolean;
  task020GovernanceIntegrity: boolean;
  task021SchoolIntegrationIntegrity: boolean;
  task022ContentGovernanceIntegrity: boolean;
  task023ReadinessIntegrity: boolean;
  phase3MetadataIntegrity: boolean;
  auditEventIntegrity: boolean;
  noOrphanedCriticalRecords: boolean;
  issues: string[];
  safeSummary: string;
}

export interface Task024OperationsPrivacyGuardResult {
  passed: boolean;
  secretsStripped: boolean;
  rawLearnerDataStripped: boolean;
  rawSafeguardingDataStripped: boolean;
  privateDeenTextStripped: boolean;
  providerPayloadsStripped: boolean;
  answerArtifactsStripped: boolean;
  rawBackupRestorePayloadsStripped: boolean;
  forbiddenFieldsDetected: string[];
  safeSummary: string;
}

export interface Task024SafeOperationsSummary {
  monitoringSummary: string;
  incidentSummary: string;
  backupRestoreSummary: string;
  dataIntegritySummary: string;
  loadPerformanceSummary: string;
  governanceContinuitySummary: string;
  overallSafeSummary: string;
  createdAt: string;
}

export interface Task024LoadSimulationPlan {
  simulationId: string;
  targetComponents: string[];
  concurrentCount: number;
  durationMs: number;
  useLiveAi: boolean;
  useLiveConnectors: boolean;
  safeMockData: boolean;
}

export interface Task024LoadSimulationResult {
  status: Task024LoadSimulationStatus;
  simulationId: string;
  targetComponents: string[];
  durationMs: number;
  throughputPerSecond: number;
  errorCount: number;
  liveAiCalled: boolean;
  liveConnectorCalled: boolean;
  safeSummary: string;
}

export interface Task024PerformanceBaselineResult {
  status: Task024PerformanceBaselineStatus;
  latencyMs: number;
  errorRate: number;
  throughputPerSecond: number;
  backpressureLevel: string;
  thresholdLatencyMs: number;
  thresholdErrorRate: number;
  thresholdThroughput: number;
  thresholdBackpressure: string;
  thresholdExceeded: boolean;
  safeSummary: string;
}

export interface Task024RunbookValidationResult {
  status: Task024RunbookValidationStatus;
  monitoringRunbookValid: boolean;
  incidentRunbookValid: boolean;
  backupRunbookValid: boolean;
  restoreRunbookValid: boolean;
  dataIntegrityRunbookValid: boolean;
  loadSimulationRunbookValid: boolean;
  privacyEscalationRunbookValid: boolean;
  missingSections: string[];
  safeSummary: string;
}

export interface Task024Task023DependencyResult {
  status: Task024DependencyStatus;
  task023ReportAccepted: boolean;
  task023DeploymentNotPerformed: boolean;
  task023PrismaChecksPassed: boolean;
  task023SecretSafetyPassed: boolean;
  task023ReleaseSmokePassed: boolean;
  task023RollbackReadinessPassed: boolean;
  issues: string[];
  safeSummary: string;
}

export interface Task024GovernanceGateContinuityResult {
  status: Task024DependencyStatus;
  task020GovernanceAvailable: boolean;
  task021SchoolScopeAvailable: boolean;
  task022ContentGovernanceAvailable: boolean;
  task017NoAiBypassAvailable: boolean;
  task018ObservabilityAvailable: boolean;
  task019RuntimeControlsAvailable: boolean;
  issues: string[];
  safeSummary: string;
}

export interface Task024OperationsDiagnostic {
  component: string;
  severity: Task024DiagnosticSeverity;
  status: string;
  safeMessage: string;
  reasonCode: string;
  checkedAt: string;
}

export interface Task024OperationsAuditEvent {
  eventId: string;
  schoolId?: string;
  actorId: string;
  actorRole: string;
  operationEnvironment: Task024OperationEnvironment;
  component: string;
  eventType: Task024AuditEventType;
  safeReasonCodes: string[];
  safeMetadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Task024OperationsReadinessDecision {
  decision: Task024OperationReadinessDecision;
  monitoringReady: boolean;
  alertPolicyReady: boolean;
  incidentWorkflowReady: boolean;
  incidentSeverityReady: boolean;
  backupReady: boolean;
  restoreDryRunReady: boolean;
  dataIntegrityReady: boolean;
  privacyGuardReady: boolean;
  loadSimulationReady: boolean;
  performanceBaselineReady: boolean;
  runbookValidationReady: boolean;
  task023DependencyReady: boolean;
  governanceContinuityReady: boolean;
  blockingReasons: string[];
  warningReasons: string[];
  evaluatedAt: string;
}

export interface Task024OperationsReadinessQuery {
  schoolId?: string;
  operationEnvironment?: Task024OperationEnvironment;
  includeDiagnostics?: boolean;
  includeAudit?: boolean;
}
