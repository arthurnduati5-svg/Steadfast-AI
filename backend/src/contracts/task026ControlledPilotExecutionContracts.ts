export const TASK026_EXECUTION_MODES = ['controlled_pilot'] as const;
export type Task026ExecutionMode = (typeof TASK026_EXECUTION_MODES)[number];

export const TASK026_EXECUTION_STATUSES = [
  'draft', 'preflight_pending', 'ready', 'active_controlled',
  'paused', 'rollback_pending', 'rolled_back', 'completed',
  'blocked', 'cancelled',
] as const;
export type Task026ExecutionStatus = (typeof TASK026_EXECUTION_STATUSES)[number];

export const TASK026_EXECUTION_DECISIONS = [
  'accept', 'reject', 'pause', 'resume', 'rollback', 'cancel',
] as const;
export type Task026ExecutionDecision = (typeof TASK026_EXECUTION_DECISIONS)[number];

export const TASK026_EXECUTION_ACTOR_ROLES = [
  'school_admin', 'system_admin', 'internal_operator',
  'authorized_pilot_coordinator', 'teacher_assigned_to_pilot',
  'learner_in_approved_pilot_cohort',
] as const;
export type Task026ExecutionActorRole = (typeof TASK026_EXECUTION_ACTOR_ROLES)[number];

export const TASK026_EXECUTION_CONTROL_ACTIONS = [
  'create_run', 'activate_run', 'pause_run', 'resume_run',
  'request_rollback', 'complete_rollback', 'cancel_run',
  'evaluate_cohort_scope', 'evaluate_learner_access',
  'record_evidence', 'record_safeguarding_signal',
  'record_incident', 'generate_summary', 'view_diagnostics',
  'view_audit', 'view_report',
] as const;
export type Task026ExecutionControlAction = (typeof TASK026_EXECUTION_CONTROL_ACTIONS)[number];

export const TASK026_EXECUTION_GATE_STATUSES = [
  'gate_not_checked', 'gate_passed', 'gate_blocked', 'gate_error',
] as const;
export type Task026ExecutionGateStatus = (typeof TASK026_EXECUTION_GATE_STATUSES)[number];

export const TASK026_LEARNER_ACCESS_STATUSES = [
  'access_allowed', 'access_denied_no_school', 'access_denied_not_in_cohort',
  'access_denied_pilot_not_active', 'access_denied_pilot_paused',
  'access_denied_pilot_rolled_back', 'access_denied_pilot_blocked',
  'access_denied_no_curriculum', 'access_denied_safeguarding',
  'access_denied_answer_key_request', 'access_denied_teacher_only_request',
] as const;
export type Task026LearnerAccessStatus = (typeof TASK026_LEARNER_ACCESS_STATUSES)[number];

export const TASK026_TEACHER_MONITOR_STATUSES = [
  'monitoring_allowed', 'monitoring_denied_not_assigned',
  'monitoring_denied_pilot_not_found',
] as const;
export type Task026TeacherMonitorStatus = (typeof TASK026_TEACHER_MONITOR_STATUSES)[number];

export const TASK026_COHORT_EXECUTION_STATUSES = [
  'cohort_approved', 'cohort_denied_not_verified',
  'cohort_denied_cross_school', 'cohort_denied_not_approved',
  'cohort_denied_size_exceeded', 'cohort_denied_missing_teacher',
] as const;
export type Task026CohortExecutionStatus = (typeof TASK026_COHORT_EXECUTION_STATUSES)[number];

export const TASK026_EVIDENCE_EVENT_TYPES = [
  'learner_access_allowed', 'learner_access_denied',
  'session_started', 'session_blocked', 'support_needed',
  'teacher_monitor_viewed', 'pilot_paused', 'pilot_resumed',
  'pilot_rolled_back', 'safeguarding_signal_recorded',
  'incident_signal_recorded', 'summary_generated',
] as const;
export type Task026EvidenceEventType = (typeof TASK026_EVIDENCE_EVENT_TYPES)[number];

export const TASK026_INCIDENT_SEVERITIES = [
  'low', 'medium', 'high', 'critical',
] as const;
export type Task026IncidentSeverity = (typeof TASK026_INCIDENT_SEVERITIES)[number];

export const TASK026_PAUSE_REASONS = [
  'manual_pause', 'safeguarding_signal', 'incident_detected',
  'content_governance_block', 'operations_degradation',
  'teacher_request', 'admin_request', 'scheduled_maintenance',
] as const;
export type Task026PauseReason = (typeof TASK026_PAUSE_REASONS)[number];

export const TASK026_ROLLBACK_REASONS = [
  'manual_rollback', 'critical_incident', 'data_integrity_issue',
  'privacy_breach', 'safeguarding_escalation', 'admin_decision',
] as const;
export type Task026RollbackReason = (typeof TASK026_ROLLBACK_REASONS)[number];

export const TASK026_SAFEGUARDING_SIGNAL_TYPES = [
  'concerning_learner_behavior', 'concerning_content_request',
  'privacy_violation_attempt', 'socratic_boundary_violation',
  'unsafe_learner_state', 'teacher_reported_concern',
  'system_detected_pattern',
] as const;
export type Task026SafeguardingSignalType = (typeof TASK026_SAFEGUARDING_SIGNAL_TYPES)[number];

export const TASK026_DEPENDENCY_GATE_STATUSES = [
  'not_checked', 'passed', 'blocked', 'error',
] as const;
export type Task026DependencyGateStatus = (typeof TASK026_DEPENDENCY_GATE_STATUSES)[number];

export const TASK026_RISK_LEVELS = [
  'none', 'low', 'medium', 'high', 'critical',
] as const;
export type Task026RiskLevel = (typeof TASK026_RISK_LEVELS)[number];

export const TASK026_BLOCKER_TYPES = [
  'missing_school_context', 'task025_not_ready', 'task024_not_ready',
  'task020_not_ready', 'task021_not_ready', 'task022_not_ready',
  'task023_not_ready', 'cohort_not_approved', 'learner_not_in_cohort',
  'teacher_not_assigned', 'cross_school_access', 'role_not_authorized',
  'pilot_not_active', 'pilot_paused', 'pilot_rolled_back',
  'missing_curriculum_scope', 'safeguarding_block',
  'answer_key_request', 'teacher_only_request',
] as const;
export type Task026BlockerType = (typeof TASK026_BLOCKER_TYPES)[number];

export const TASK026_AUDIT_EVENTS = [
  'run_created', 'run_activated', 'run_paused', 'run_resumed',
  'rollback_requested', 'run_rolled_back', 'run_completed',
  'run_cancelled', 'run_blocked', 'cohort_scope_evaluated',
  'learner_access_evaluated', 'teacher_monitor_snapshot',
  'evidence_recorded', 'safeguarding_signal_recorded',
  'incident_watch_recorded', 'summary_generated',
  'diagnostics_viewed', 'audit_viewed', 'report_viewed',
] as const;
export type Task026AuditEvent = (typeof TASK026_AUDIT_EVENTS)[number];

export const TASK026_FORBIDDEN_FIELDS = [
  'rawStudentData', 'rawLearnerData', 'rawParentData', 'rawTeacherData',
  'rawStudentProfile', 'rawParentProfile', 'rawTeacherProfile',
  'rawSafeguardingNote', 'rawSafeguardingCase', 'safeguardingRaw',
  'privateDeenText', 'deenSensitiveRaw',
  'rawChat', 'rawMessage', 'rawStudentAnswer', 'rawStudentWork',
  'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
  'teacherOnlyContent', 'teacherOnlyNote',
  'providerPrompt', 'providerResponse', 'rawProviderResponse',
  'chainOfThought', 'hiddenReasoning', 'scratchpad',
  'rawSsoToken', 'rawJwt', 'rawAccessToken', 'rawRefreshToken', 'rawIdToken',
  'authorization', 'cookie', 'apiKey', 'privateKey',
  'DATABASE_URL', 'REDIS_URL',
  'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY',
  'rawNotificationPayload', 'rawEmailBody', 'rawSmsBody', 'rawWhatsappBody',
  'parentPhone', 'parentEmail', 'studentPhone', 'studentEmail',
  'productionDeploymentCommand', 'productionRollbackCommand',
  'liveAiProviderPayload', 'liveSchoolConnectorPayload',
  'externalWebhookPayload',
] as const;
export type Task026ForbiddenField = (typeof TASK026_FORBIDDEN_FIELDS)[number];

export interface Task026ExecutionContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  requestId: string;
  verifiedSchoolIdentity: boolean;
  pilotRunId?: string;
  timestamp: string;
}

export interface Task026DependencyGateInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
}

export interface Task026DependencyGateResult {
  gate: string;
  status: Task026DependencyGateStatus;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task026ControlledPilotRunInput {
  schoolId: string;
  pilotProgramId: string;
  cohortIds: string[];
  teacherOwnerId: string;
  supportOwnerId: string;
  safeguardingOwnerId: string;
  pauseOwnerId: string;
  rollbackOwnerId: string;
  monitoringOwnerId: string;
  approvedCurriculumScopeIds: string[];
  approvedSourceScopeIds: string[];
  actorRole: string;
  actorId: string;
}

export interface Task026ControlledPilotRun {
  id: string;
  schoolId: string;
  pilotProgramId: string;
  status: Task026ExecutionStatus;
  cohortIds: string[];
  teacherOwnerId: string;
  supportOwnerId: string;
  safeguardingOwnerId: string;
  pauseOwnerId: string;
  rollbackOwnerId: string;
  monitoringOwnerId: string;
  approvedCurriculumScopeIds: string[];
  approvedSourceScopeIds: string[];
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
  pausedAt: string | null;
  rolledBackAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  blockingIssues: string[];
}

export interface Task026ExecutionStateTransition {
  runId: string;
  fromStatus: Task026ExecutionStatus;
  toStatus: Task026ExecutionStatus;
  actorRole: string;
  actorId: string;
  reason?: string;
}

export interface Task026ExecutionGateInput {
  runId: string;
  schoolId: string;
  actorRole: string;
  action: string;
}

export interface Task026ExecutionGateResult {
  allowed: boolean;
  reasonCodes: string[];
  safeMessage: string;
  gateResults: Record<string, boolean>;
}

export interface Task026CohortExecutionScopeInput {
  schoolId: string;
  cohortId: string;
  cohortSize: number;
  teacherOwnerId: string;
  supportOwnerId: string;
  approvedCurriculumScopeIds: string[];
  approvedSourceScopeIds: string[];
}

export interface Task026CohortExecutionScopeResult {
  status: Task026CohortExecutionStatus;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task026LearnerAccessGateInput {
  schoolId: string;
  learnerId: string;
  cohortId: string;
  pilotRunId: string;
  requestedContentType: string;
}

export interface Task026LearnerAccessGateResult {
  status: Task026LearnerAccessStatus;
  allowed: boolean;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task026TeacherMonitoringInput {
  schoolId: string;
  teacherId: string;
  pilotRunId: string;
}

export interface Task026TeacherMonitoringSnapshot {
  status: Task026TeacherMonitorStatus;
  pilotRunStatus: string;
  cohortSafeCount: number;
  engagementSafeCount: number;
  blockedEventCount: number;
  supportNeededCount: number;
  safeguardingSignalCount: number;
  safeNextActions: string[];
  pauseRecommendationMetadata: Record<string, unknown>;
  reasonCodes: string[];
}

export interface Task026PilotEvidenceEventInput {
  schoolId: string;
  pilotRunId: string;
  eventType: Task026EvidenceEventType;
  actorRole: string;
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
}

export interface Task026PilotEvidenceEvent {
  id: string;
  schoolId: string;
  pilotRunId: string;
  eventType: string;
  actorRole: string;
  safeSummary: string;
  metadataSafeJson: Record<string, unknown>;
  createdAt: string;
}

export interface Task026SafeguardingSignalInput {
  schoolId: string;
  pilotRunId: string;
  signalType: Task026SafeguardingSignalType;
  severity: Task026RiskLevel;
  source: string;
  safeSummary: string;
  requiresPause: boolean;
  requiresHumanReview: boolean;
}

export interface Task026SafeguardingSignalResult {
  recorded: boolean;
  signalId: string;
  pauseRecommended: boolean;
  humanReviewRequired: boolean;
  safeMessage: string;
}

export interface Task026IncidentWatchInput {
  schoolId: string;
  pilotRunId: string;
  severity: Task026IncidentSeverity;
  category: string;
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
}

export interface Task026IncidentWatchResult {
  recorded: boolean;
  incidentId: string;
  recommendedAction: string;
  safeMessage: string;
}

export interface Task026PauseControlInput {
  runId: string;
  actorRole: string;
  actorId: string;
  reason: Task026PauseReason;
  details: string;
}

export interface Task026PauseControlResult {
  ok: boolean;
  learnerAccessBlocked: boolean;
  auditPreserved: boolean;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task026ResumeControlInput {
  runId: string;
  actorRole: string;
  actorId: string;
  gatesRevalidated: boolean;
}

export interface Task026ResumeControlResult {
  ok: boolean;
  gatesPassed: boolean;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task026RollbackControlInput {
  runId: string;
  actorRole: string;
  actorId: string;
  reason: Task026RollbackReason;
  details: string;
}

export interface Task026RollbackControlResult {
  ok: boolean;
  learnerAccessBlocked: boolean;
  dataPreserved: boolean;
  auditPreserved: boolean;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task026DailyPilotSummaryInput {
  pilotRunId: string;
  schoolId: string;
}

export interface Task026DailyPilotSummary {
  pilotRunId: string;
  schoolId: string;
  cohortSafeCount: number;
  sessionsStartedCount: number;
  sessionsBlockedCount: number;
  supportNeededCount: number;
  incidentCount: number;
  safeguardingSignalCount: number;
  pauseRollbackState: string;
  safeNextActions: string[];
  riskLevel: Task026RiskLevel;
  generatedAt: string;
}

export interface Task026ExecutionDiagnostics {
  runId: string;
  status: string;
  dependencyGates: Task026DependencyGateResult[];
  gateStatus: string;
  incidentCount: number;
  safeguardingSignalCount: number;
  evidenceEventCount: number;
  lastStateTransition: string;
  uptimeStatus: string;
}

export interface Task026ExecutionAuditEvent {
  id: string;
  runId?: string;
  schoolId: string;
  actorRole: string;
  action: Task026AuditEvent;
  safeSummary: string;
  metadataSafeJson: Record<string, unknown>;
  createdAt: string;
}

export interface Task026SafeExecutionReport {
  taskId: string;
  executionStatus: string;
  dependencyGateResults: Task026DependencyGateResult[];
  routeProtectionResult: string;
  testProofSummary: Record<string, unknown>;
  safetyScanSummary: Record<string, unknown>;
  commitHash: string;
  safeToStartTask027: boolean;
  remainingBlockers: string[];
}

export interface Task026AcceptanceReport {
  taskId: string;
  verdict: string;
  safeToStartTask027: boolean;
  safeToStartTask028: boolean;
  safeToStartTask040: boolean;
}

export const ALLOWED_EXECUTION_TRANSITIONS: Record<Task026ExecutionStatus, Task026ExecutionStatus[]> = {
  draft: ['preflight_pending', 'blocked'],
  preflight_pending: ['ready', 'blocked'],
  ready: ['active_controlled', 'cancelled', 'blocked'],
  active_controlled: ['paused', 'rollback_pending', 'completed', 'blocked'],
  paused: ['active_controlled', 'rollback_pending', 'cancelled', 'blocked'],
  rollback_pending: ['rolled_back', 'blocked'],
  rolled_back: ['blocked'],
  completed: ['blocked'],
  blocked: [],
  cancelled: [],
};

export const TASK026_ALLOWED_HIGH_CONTROL_ROLES = [
  'school_admin', 'system_admin', 'internal_operator', 'authorized_pilot_coordinator',
] as const;

export const TASK026_ALLOWED_MONITORING_ROLES = [
  'teacher_assigned_to_pilot',
] as const;

export const TASK026_ALLOWED_LEARNER_ROLES = [
  'learner_in_approved_pilot_cohort',
] as const;

export const TASK026_DENIED_ROLES = [
  'unauthenticated', 'unknown', 'cross_school_actor',
  'learner_not_in_pilot', 'parent', 'peer',
  'teacher_not_assigned_to_pilot', 'teacher_without_pilot_permission',
] as const;

export const TASK026_INCIDENT_RECOMMENDED_ACTIONS = [
  'continue_monitoring', 'manual_review', 'pause_pilot',
  'rollback_pilot', 'block_execution',
] as const;
