export const TASK028_EXECUTION_STATUSES = [
  'draft', 'preflight_pending', 'ready', 'active_controlled_expansion',
  'paused', 'intervention_required', 'rollback_pending', 'rolled_back',
  'completed', 'blocked', 'cancelled',
] as const;
export type Task028ExecutionStatus = typeof TASK028_EXECUTION_STATUSES[number];

export const TASK028_EXECUTION_DECISIONS = [
  'do_not_execute', 'prepare_only', 'activate_controlled_expansion',
  'continue_monitoring', 'pause_and_fix', 'rollback_required',
  'complete_expansion', 'cancel_expansion',
] as const;
export type Task028ExecutionDecision = typeof TASK028_EXECUTION_DECISIONS[number];

export const TASK028_ACTOR_ROLES = [
  'school_admin', 'system_admin', 'internal_operator',
  'authorized_pilot_coordinator', 'authorized_expansion_reviewer', 'authorized_expansion_operator',
  'teacher_assigned_to_expansion', 'teacher_assigned_to_pilot',
  'operations_reviewer', 'safeguarding_reviewer', 'content_governance_reviewer', 'deen_source_reviewer',
  'learner_in_approved_expanded_cohort',
] as const;
export type Task028ActorRole = typeof TASK028_ACTOR_ROLES[number];

export const TASK028_DENIED_ROLES = [
  'unauthenticated', 'unknown', 'cross_school_actor',
  'learner_not_in_expanded_cohort', 'parent', 'peer',
  'teacher_not_assigned_to_expansion', 'teacher_without_expansion_permission',
  'pilot_participant_without_expansion_scope',
] as const;

export const TASK028_CONTROL_ROLES = [
  'school_admin', 'system_admin', 'internal_operator',
  'authorized_pilot_coordinator', 'authorized_expansion_reviewer', 'authorized_expansion_operator',
] as const;

export const TASK028_EXPANDED_COHORT_STATUSES = [
  'pending', 'activated', 'blocked', 'rolled_back',
] as const;
export type Task028ExpandedCohortStatus = typeof TASK028_EXPANDED_COHORT_STATUSES[number];

export const TASK028_EXPANDED_LEARNER_ACCESS_STATUSES = [
  'allowed', 'denied_school_context', 'denied_not_in_cohort',
  'denied_run_not_active', 'denied_run_paused', 'denied_curriculum_scope',
  'denied_safeguarding', 'denied_content_governance', 'denied_socratic',
  'denied_teacher_only_content', 'denied_answer_key_request', 'denied_general',
] as const;
export type Task028ExpandedLearnerAccessStatus = typeof TASK028_EXPANDED_LEARNER_ACCESS_STATUSES[number];

export const TASK028_TEACHER_OVERSIGHT_STATUSES = [
  'healthy', 'watch', 'needs_review', 'critical',
] as const;
export type Task028TeacherOversightStatus = typeof TASK028_TEACHER_OVERSIGHT_STATUSES[number];

export const TASK028_RUNTIME_GUARD_STATUSES = [
  'passed', 'blocked_school_context', 'blocked_role_scope',
  'blocked_run_not_active', 'blocked_cohort', 'blocked_learner_relation',
  'blocked_curriculum_scope', 'blocked_privacy', 'blocked_safeguarding',
  'blocked_deen', 'blocked_socratic', 'blocked_rate_health',
  'blocked_pause_rollback', 'blocked_general',
] as const;
export type Task028RuntimeGuardStatus = typeof TASK028_RUNTIME_GUARD_STATUSES[number];

export const TASK028_HEALTH_SNAPSHOT_STATUSES = [
  'healthy', 'watch', 'degraded', 'critical',
] as const;
export type Task028HealthSnapshotStatus = typeof TASK028_HEALTH_SNAPSHOT_STATUSES[number];

export const TASK028_INTERVENTION_QUEUE_STATUSES = [
  'open', 'in_review', 'resolved', 'escalated', 'cancelled',
] as const;
export type Task028InterventionQueueStatus = typeof TASK028_INTERVENTION_QUEUE_STATUSES[number];

export const TASK028_INCIDENT_SEVERITIES = [
  'low', 'medium', 'high', 'critical',
] as const;
export type Task028IncidentSeverity = typeof TASK028_INCIDENT_SEVERITIES[number];

export const TASK028_ROLLBACK_STATUSES = [
  'requested', 'in_progress', 'completed', 'failed',
] as const;
export type Task028RollbackStatus = typeof TASK028_ROLLBACK_STATUSES[number];

export const TASK028_EVIDENCE_EVENT_TYPES = [
  'expanded_access_allowed', 'expanded_access_denied',
  'expanded_session_started', 'expanded_session_blocked',
  'teacher_oversight_viewed', 'support_needed',
  'intervention_required', 'expansion_paused', 'expansion_resumed',
  'rollback_requested', 'rollback_completed',
  'incident_signal_recorded', 'safeguarding_signal_recorded',
  'daily_summary_generated', 'completion_review_generated',
] as const;
export type Task028EvidenceEventType = typeof TASK028_EVIDENCE_EVENT_TYPES[number];

export const TASK028_DEPENDENCY_GATE_STATUSES = [
  'passed', 'failed_task027_not_found', 'failed_task027_not_accepted',
  'failed_task027_safeToStart028_false', 'failed_task027_blocking_issues',
  'failed_decision_mismatch', 'failed_evidence_missing',
  'failed_review_not_passed', 'failed_continuity',
] as const;
export type Task028DependencyGateStatus = typeof TASK028_DEPENDENCY_GATE_STATUSES[number];

export const TASK028_RISK_LEVELS = [
  'low', 'medium', 'high', 'critical',
] as const;
export type Task028RiskLevel = typeof TASK028_RISK_LEVELS[number];

export const TASK028_BLOCKER_TYPES = [
  'task027_not_found', 'task027_not_accepted', 'school_not_verified',
  'role_not_permitted', 'cross_school_access', 'learner_not_in_cohort',
  'teacher_not_in_scope', 'curriculum_not_approved', 'deen_not_approved',
  'safeguarding_block', 'privacy_block', 'socratic_block',
  'operations_degraded', 'rollback_not_ready', 'expansion_already_active',
  'proposal_not_approved', 'rate_limit_exceeded', 'internal_error',
] as const;
export type Task028BlockerType = typeof TASK028_BLOCKER_TYPES[number];

export const TASK028_AUDIT_EVENTS = [
  'expansion_run_created', 'preflight_completed', 'expansion_activated',
  'expansion_paused', 'expansion_resumed', 'intervention_requested',
  'rollback_requested', 'rollback_completed', 'expansion_completed',
  'expansion_cancelled', 'expansion_blocked', 'cohort_activated',
  'learner_access_granted', 'learner_access_denied',
  'runtime_guard_passed', 'runtime_guard_blocked',
  'teacher_oversight_viewed', 'health_snapshot_generated',
  'daily_summary_generated', 'completion_review_generated',
  'evidence_recorded', 'report_generated',
] as const;
export type Task028AuditEventType = typeof TASK028_AUDIT_EVENTS[number];

export const TASK028_FORBIDDEN_FIELDS = [
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
  'DATABASE_URL', 'REDIS_URL', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GEMINI_API_KEY',
  'rawNotificationPayload', 'rawEmailBody', 'rawSmsBody', 'rawWhatsappBody',
  'parentPhone', 'parentEmail', 'studentPhone', 'studentEmail',
  'productionDeploymentCommand', 'productionRollbackCommand',
  'liveAiProviderPayload', 'liveSchoolConnectorPayload',
  'externalWebhookPayload', 'schoolWideActivationPayload',
  'canaryActivationPayload', 'rolloutActivationPayload',
  'expansionOperationsConsolePayload',
] as const;

export const VALID_STATE_TRANSITIONS: Record<string, string[]> = {
  draft: ['preflight_pending'],
  preflight_pending: ['ready', 'blocked', 'cancelled'],
  ready: ['active_controlled_expansion', 'blocked', 'cancelled'],
  active_controlled_expansion: ['paused', 'intervention_required', 'rollback_pending', 'completed', 'blocked', 'cancelled'],
  paused: ['active_controlled_expansion', 'rollback_pending', 'blocked', 'cancelled'],
  intervention_required: ['paused', 'active_controlled_expansion', 'rollback_pending', 'blocked'],
  rollback_pending: ['rolled_back', 'blocked'],
  rolled_back: ['blocked'],
  completed: ['blocked'],
  blocked: [],
  cancelled: [],
};

export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_STATE_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}

export function nowISO(): string {
  return new Date().toISOString();
}

export interface Task028ExecutionContext {
  schoolId: string;
  schoolVerified: boolean;
  actorId: string;
  actorRole: string;
  expansionRunId?: string;
  requestId?: string;
}

export interface Task028Task027DependencyGateInput {
  schoolId: string;
  proposalId: string;
  reportPath?: string;
}

export interface Task028Task027DependencyGateResult {
  gatePassed: boolean;
  task027CommitHash: string;
  task027Accepted: boolean;
  safeToStartTask028: boolean;
  blockingIssues: string[];
  gateStatus: Task028DependencyGateStatus;
  proofSummary: Record<string, unknown>;
}

export interface Task028ApprovedExpansionPlanInput {
  schoolId: string;
  proposalId: string;
  governanceDecisionId: string;
}

export interface Task028ApprovedExpansionPlan {
  schoolId: string;
  proposalId: string;
  governanceDecisionId: string;
  pilotRunId: string;
  expansionScopeLabels: string[];
  approvedCohortIds: string[];
  approvedLearnerSafeRefs: string[];
  approvedTeacherSafeRefs: string[];
  approvedSupportOwnerSafeRefs: string[];
  curriculumSourceScopeIds: string[];
  deenSourceScopeIds: string[];
  operationsMonitoringPlanId: string;
  pauseRollbackPlanId: string;
  approvedStartWindow: string;
  safeConditions: Record<string, unknown>;
}

export interface Task028ControlledExpansionRunInput {
  schoolId: string;
  proposalId: string;
  governanceDecisionId: string;
  pilotRunId: string;
  approvedPlan: Task028ApprovedExpansionPlan;
  actorRole: string;
  actorId: string;
}

export interface Task028ControlledExpansionRun {
  runId: string;
  schoolId: string;
  proposalId: string;
  status: Task028ExecutionStatus;
  approvedPlan: Task028ApprovedExpansionPlan;
  createdAt: string;
  stateHistory: Task028ExpansionStateTransitionResult[];
}

export interface Task028ExpansionStateTransitionInput {
  runId: string;
  fromStatus: string;
  toStatus: string;
  actorRole: string;
  actorId: string;
  reason?: string;
}

export interface Task028ExpansionStateTransitionResult {
  ok: boolean;
  runId: string;
  fromStatus: string;
  toStatus: string;
  reasonCodes: string[];
  safeMessage: string;
  timestamp: string;
}

export interface Task028ExpandedCohortActivationInput {
  runId: string;
  schoolId: string;
  cohortIds: string[];
  learnerSafeRefs: string[];
  teacherSafeRefs: string[];
  supportOwnerSafeRefs: string[];
  curriculumScopeIds: string[];
  deenScopeIds: string[];
  actorRole: string;
  actorId: string;
}

export interface Task028ExpandedCohortActivationResult {
  ok: boolean;
  cohortIds: string[];
  activationStatus: Task028ExpandedCohortStatus;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task028ExpandedLearnerAccessGateInput {
  schoolId: string;
  learnerId: string;
  runId: string;
  curriculumScopeId?: string;
  requestType: string;
}

export interface Task028ExpandedLearnerAccessGateResult {
  allowed: boolean;
  status: Task028ExpandedLearnerAccessStatus;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task028ExpandedRuntimeGuardInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  runId: string;
  action: string;
}

export interface Task028ExpandedRuntimeGuardResult {
  passed: boolean;
  guardStatus: Task028RuntimeGuardStatus;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task028TeacherOversightInput {
  runId: string;
  schoolId: string;
  teacherId: string;
}

export interface Task028TeacherOversightSnapshot {
  runId: string;
  schoolId: string;
  teacherId: string;
  oversightStatus: Task028TeacherOversightStatus;
  expansionRunStatus: string;
  expandedCohortSafeCount: number;
  safeEngagementCount: number;
  blockedEventCount: number;
  supportNeededCount: number;
  interventionNeededCount: number;
  safeguardingSignalCount: number;
  incidentCount: number;
  safeNextActions: string[];
  pauseRecommended: boolean;
  rollbackRecommended: boolean;
  generatedAt: string;
}

export interface Task028ExpansionMonitoringEventInput {
  runId: string;
  schoolId: string;
  actorRole: string;
  actorId: string;
  eventType: string;
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
}

export interface Task028ExpansionMonitoringEvent {
  eventId: string;
  runId: string;
  schoolId: string;
  eventType: string;
  safeSummary: string;
  metadataSafeJson: Record<string, unknown>;
  createdAt: string;
}

export interface Task028ExpansionHealthSnapshotInput {
  runId: string;
  schoolId: string;
  expandedLearnerSafeCount: number;
  activeSessions: number;
  blockedAccessCount: number;
  supportNeededCount: number;
  interventionCount: number;
  incidentCount: number;
  safeguardingSignalCount: number;
  teacherOversightCount: number;
}

export interface Task028ExpansionHealthSnapshot {
  runId: string;
  schoolId: string;
  status: Task028HealthSnapshotStatus;
  expandedLearnerSafeCount: number;
  activeSessions: number;
  blockedAccessCount: number;
  supportNeededCount: number;
  interventionCount: number;
  incidentCount: number;
  safeguardingSignalCount: number;
  teacherOversightCount: number;
  operationsRiskLevel: Task028RiskLevel;
  learningRiskLevel: Task028RiskLevel;
  privacyRiskLevel: Task028RiskLevel;
  deenContentRiskLevel: Task028RiskLevel;
  socraticRiskLevel: Task028RiskLevel;
  rollbackReadinessStatus: string;
  recommendedControlAction: string;
  generatedAt: string;
}

export interface Task028InterventionQueueInput {
  runId: string;
  schoolId: string;
  interventionReason: string;
  actorRole: string;
  actorId: string;
  safeSummary: string;
}

export interface Task028InterventionQueueItem {
  itemId: string;
  runId: string;
  schoolId: string;
  interventionReason: string;
  status: Task028InterventionQueueStatus;
  actorRole: string;
  createdAt: string;
  safeSummary: string;
}

export interface Task028IncidentBridgeInput {
  runId: string;
  schoolId: string;
  severity: Task028IncidentSeverity;
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
}

export interface Task028IncidentBridgeResult {
  ok: boolean;
  incidentId: string;
  severity: Task028IncidentSeverity;
  recommendedAction: string;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task028RollbackExecutionInput {
  runId: string;
  schoolId: string;
  actorRole: string;
  actorId: string;
  reason: string;
}

export interface Task028RollbackExecutionResult {
  ok: boolean;
  runId: string;
  rollbackStatus: Task028RollbackStatus;
  learnerAccessBlocked: boolean;
  auditPreserved: boolean;
  dataDestructivelyDeleted: boolean;
  reasonCodes: string[];
  safeMessage: string;
}

export interface Task028ExpansionEvidenceEventInput {
  runId: string;
  schoolId: string;
  eventType: Task028EvidenceEventType;
  safeMetadata: Record<string, unknown>;
  actorRole: string;
  actorId: string;
}

export interface Task028ExpansionEvidenceEvent {
  eventId: string;
  runId: string;
  schoolId: string;
  eventType: Task028EvidenceEventType;
  safeMetadata: Record<string, unknown>;
  actorRole: string;
  createdAt: string;
}

export interface Task028DailyExpansionSummaryInput {
  runId: string;
  schoolId: string;
}

export interface Task028DailyExpansionSummary {
  runId: string;
  schoolId: string;
  expandedCohortSafeCount: number;
  sessionsStartedCount: number;
  sessionsBlockedCount: number;
  supportNeededCount: number;
  interventionCount: number;
  incidentCount: number;
  safeguardingSignalCount: number;
  pauseRollbackState: string;
  safeNextActions: string[];
  riskLevel: Task028RiskLevel;
  generatedAt: string;
}

export interface Task028ExpansionCompletionReviewInput {
  runId: string;
  schoolId: string;
}

export interface Task028ExpansionCompletionReview {
  runId: string;
  schoolId: string;
  runStatus: string;
  safeExecutionSummary: string;
  safeLearningQualitySummary: string;
  safeTeacherOversightSummary: string;
  safeInterventionSummary: string;
  safeIncidentSummary: string;
  privacyBoundaryStatus: string;
  safeguardingBoundaryStatus: string;
  deenContentBoundaryStatus: string;
  socraticIntegrityStatus: string;
  rollbackReadinessStatus: string;
  safeToStartTask029: boolean;
  remainingBlockers: string[];
  generatedAt: string;
}

export interface Task028ExecutionDiagnostics {
  runId: string;
  schoolId: string;
  runStatus: string;
  stateHistoryCount: number;
  activeCohortCount: number;
  totalAccessDecisions: number;
  healthSnapshotCount: number;
  interventionCount: number;
  incidentCount: number;
  evidenceEventCount: number;
  auditEventCount: number;
  uptimeSeconds: number;
  safeMessage: string;
}

export interface Task028ExecutionAuditEvent {
  eventId: string;
  runId?: string;
  schoolId?: string;
  actorRole: string;
  action: string;
  safeSummary: string;
  metadataSafeJson: Record<string, unknown>;
  createdAt: string;
}

export interface Task028SafeExpansionExecutionReport {
  taskId: string;
  scope: string;
  task027DependencyCommit: string;
  task027GatePassed: boolean;
  stateMachineResult: string;
  cohortActivationResult: string;
  learnerAccessGateResult: string;
  runtimeGuardResult: string;
  teacherOversightResult: string;
  healthSnapshotResult: string;
  interventionResult: string;
  incidentBridgeResult: string;
  rollbackExecutionResult: string;
  evidenceLedgerResult: string;
  completionReviewResult: string;
  safeToStartTask029: boolean;
  safeToStartTask030: boolean;
  safeToStartTask040: boolean;
  remainingBlockers: string[];
  generatedAt: string;
}

export interface Task028AcceptanceReport {
  taskId: string;
  verdict: string;
  contractsCreatedOrUpdated: boolean;
  validationCreatedOrUpdated: boolean;
  repositoryCreatedOrUpdated: boolean;
  servicesCreatedOrUpdated: boolean;
  routesCreatedOrUpdated: boolean;
  routesMountedOrDirectlyTested: boolean;
  focusedTestsRun: boolean;
  focusedTestsPassed: boolean;
  backendSuiteRun: boolean;
  backendSuitePassed: boolean;
  buildPassed: boolean;
  typecheckPassed: boolean;
  safetyScansPassed: boolean;
  safeToStartTask029: boolean;
  safeToStartTask030: boolean;
  safeToStartTask040: boolean;
  remainingBlockers: string[];
}
