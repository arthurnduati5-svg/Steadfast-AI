export const TASK025_PILOT_READINESS_ACTOR_ROLES = [
  'school_admin',
  'system_admin',
  'internal_operator',
  'authorized_pilot_coordinator',
] as const;

export type Task025PilotReadinessActorRole = typeof TASK025_PILOT_READINESS_ACTOR_ROLES[number];

export const TASK025_PILOT_READINESS_DECISIONS = [
  'ready_to_start_task026',
  'not_ready',
  'manual_review_required',
] as const;

export type Task025PilotReadinessDecision = typeof TASK025_PILOT_READINESS_DECISIONS[number];

export const TASK025_PILOT_READINESS_STATUSES = [
  'pending',
  'in_review',
  'ready',
  'not_ready',
  'blocked',
] as const;

export type Task025PilotReadinessStatus = typeof TASK025_PILOT_READINESS_STATUSES[number];

export const TASK025_PILOT_SCOPE_STATUSES = [
  'scope_defined',
  'scope_approved',
  'scope_blocked',
  'scope_pending_review',
] as const;

export type Task025PilotScopeStatus = typeof TASK025_PILOT_SCOPE_STATUSES[number];

export const TASK025_COHORT_READINESS_STATUSES = [
  'cohort_pending',
  'cohort_ready',
  'cohort_blocked',
  'cohort_manual_review',
] as const;

export type Task025CohortReadinessStatus = typeof TASK025_COHORT_READINESS_STATUSES[number];

export const TASK025_STAKEHOLDER_READINESS_STATUSES = [
  'stakeholder_pending',
  'stakeholder_ready',
  'stakeholder_blocked',
] as const;

export type Task025StakeholderReadinessStatus = typeof TASK025_STAKEHOLDER_READINESS_STATUSES[number];

export const TASK025_TEACHER_WORKFLOW_STATUSES = [
  'teacher_workflow_pending',
  'teacher_workflow_validated',
  'teacher_workflow_blocked',
] as const;

export type Task025TeacherWorkflowStatus = typeof TASK025_TEACHER_WORKFLOW_STATUSES[number];

export const TASK025_ADMIN_ACCEPTANCE_STATUSES = [
  'admin_acceptance_pending',
  'admin_acceptance_confirmed',
  'admin_acceptance_blocked',
] as const;

export type Task025AdminAcceptanceStatus = typeof TASK025_ADMIN_ACCEPTANCE_STATUSES[number];

export const TASK025_PARENT_COMMUNICATION_STATUSES = [
  'parent_communication_pending',
  'parent_communication_ready',
  'parent_communication_blocked',
] as const;

export type Task025ParentCommunicationStatus = typeof TASK025_PARENT_COMMUNICATION_STATUSES[number];

export const TASK025_SAFEGUARDING_READINESS_STATUSES = [
  'safeguarding_pending',
  'safeguarding_ready',
  'safeguarding_blocked',
] as const;

export type Task025SafeguardingReadinessStatus = typeof TASK025_SAFEGUARDING_READINESS_STATUSES[number];

export const TASK025_MONITORING_READINESS_STATUSES = [
  'monitoring_pending',
  'monitoring_ready',
  'monitoring_blocked',
] as const;

export type Task025MonitoringReadinessStatus = typeof TASK025_MONITORING_READINESS_STATUSES[number];

export const TASK025_PAUSE_ROLLBACK_STATUSES = [
  'pause_rollback_pending',
  'pause_rollback_ready',
  'pause_rollback_blocked',
] as const;

export type Task025PauseRollbackStatus = typeof TASK025_PAUSE_ROLLBACK_STATUSES[number];

export const TASK025_RISK_LEVELS = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export type Task025RiskLevel = typeof TASK025_RISK_LEVELS[number];

export const TASK025_BLOCKER_TYPES = [
  'school_identity',
  'pilot_scope',
  'cohort_readiness',
  'teacher_workflow',
  'admin_acceptance',
  'parent_communication',
  'safeguarding_escalation',
  'support_operations',
  'monitoring_gate',
  'pause_rollback',
  'data_privacy',
  'governance_continuity',
  'content_governance',
  'deployment_readiness',
  'operations_readiness',
] as const;

export type Task025BlockerType = typeof TASK025_BLOCKER_TYPES[number];

export const TASK025_AUDIT_EVENTS = [
  'readiness_check_run',
  'scope_evaluated',
  'cohort_readiness_checked',
  'teacher_workflow_validated',
  'admin_acceptance_checked',
  'parent_communication_checked',
  'safeguarding_escalation_checked',
  'support_operations_checked',
  'monitoring_gate_checked',
  'pause_rollback_checked',
  'data_privacy_checked',
  'decision_evaluated',
  'report_generated',
  'diagnostics_viewed',
  'audit_viewed',
] as const;

export type Task025AuditEvent = typeof TASK025_AUDIT_EVENTS[number];

export const TASK025_FORBIDDEN_FIELDS = [
  'rawStudentData',
  'rawLearnerData',
  'rawParentData',
  'rawTeacherData',
  'rawSafeguardingNote',
  'rawSafeguardingCase',
  'safeguardingRaw',
  'privateDeenText',
  'deenSensitiveRaw',
  'rawChat',
  'rawMessage',
  'rawStudentAnswer',
  'rawStudentWork',
  'answerKey',
  'correctAnswer',
  'modelAnswer',
  'markingScheme',
  'teacherOnlyContent',
  'teacherOnlyNote',
  'providerPrompt',
  'providerResponse',
  'rawProviderResponse',
  'chainOfThought',
  'hiddenReasoning',
  'scratchpad',
  'rawNotificationPayload',
  'rawEmailBody',
  'rawSmsBody',
  'parentPhone',
  'parentEmail',
  'studentPhone',
  'studentEmail',
  'livePilotActivation',
  'liveInvitationSend',
] as const;

export type Task025ForbiddenField = typeof TASK025_FORBIDDEN_FIELDS[number];

export interface Task025PilotReadinessContext {
  schoolId: string;
  actorId: string;
  actorRole: string;
  requestId: string;
  verifiedSchoolIdentity: boolean;
  schoolName?: string;
  pilotCoordinatorName?: string;
  timestamp: string;
}

export interface Task025PilotScopeInput {
  schoolId: string;
  pilotPurpose: string;
  cohortSize: number;
  pilotDurationWeeks: number;
  teacherCoverageAvailable: boolean;
  adminOwner: string;
  supportOwner: string;
  monitoringOwner: string;
  pauseOwner: string;
  rollbackOwner: string;
  safeguardingEscalationPathDefined: boolean;
  parentCommunicationMaterialPrepared: boolean;
  deenSourceReferralPathDefined: boolean;
  curriculumSourceGovernanceReady: boolean;
  privacyGovernanceReady: boolean;
  operationsMonitoringReady: boolean;
}

export interface Task025PilotScopeAssessment {
  scopeStatus: Task025PilotScopeStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  task026SafeToStart: boolean;
}

export interface Task025CandidateCohortInput {
  schoolId: string;
  cohortId: string;
  cohortSize: number;
  teacherOwner: string;
  supportOwner: string;
  sourceApprovedCurriculumContext: boolean;
  safeLearningContextAvailable: boolean;
}

export interface Task025CandidateCohortReadiness {
  cohortStatus: Task025CohortReadinessStatus;
  recommendedCohortType: string;
  readinessScore: number;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  manualReviewRequired: boolean;
}

export interface Task025StakeholderReadinessInput {
  schoolId: string;
  teacherIds: string[];
  adminIds: string[];
  supportStaffIds: string[];
  safeguardingOwnerId: string;
}

export interface Task025TeacherWorkflowValidation {
  teacherWorkflowStatus: Task025TeacherWorkflowStatus;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  teacherCount: number;
  validatedTeachers: number;
}

export interface Task025AdminAcceptanceReadiness {
  adminAcceptanceStatus: Task025AdminAcceptanceStatus;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  adminOwner: string;
  approvalNotes: string;
}

export interface Task025ParentCommunicationReadiness {
  parentCommunicationStatus: Task025ParentCommunicationStatus;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  templatesReady: boolean;
  privacySummaryIncluded: boolean;
  optOutPathDefined: boolean;
}

export interface Task025SafeguardingEscalationReadiness {
  safeguardingStatus: Task025SafeguardingReadinessStatus;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  safeguardingOwnerExists: boolean;
  escalationRouteDefined: boolean;
  humanReviewPathExists: boolean;
}

export interface Task025SupportOperationsReadiness {
  supportStatus: Task025StakeholderReadinessStatus;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  supportOwnerAssigned: boolean;
  incidentOwnerAssigned: boolean;
}

export interface Task025MonitoringGateReadiness {
  monitoringStatus: Task025MonitoringReadinessStatus;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  task024MonitoringReady: boolean;
  incidentDrillAvailable: boolean;
  backupRestoreDrillAvailable: boolean;
  pauseSignalPathDefined: boolean;
  rollbackSignalPathDefined: boolean;
}

export interface Task025PauseRollbackReadiness {
  pauseRollbackStatus: Task025PauseRollbackStatus;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  pauseOwnerExists: boolean;
  rollbackOwnerExists: boolean;
  pauseCriteriaDefined: boolean;
  rollbackCriteriaDefined: boolean;
  incidentSeverityMappingExists: boolean;
}

export interface Task025DataPrivacyReadiness {
  privacyStatus: Task025StakeholderReadinessStatus;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  dataClassificationApplied: boolean;
  roleMatrixApplied: boolean;
  retentionExportDeleteFoundationNotBypassed: boolean;
  aiEgressGuardNotBypassed: boolean;
}

export interface Task025ReadinessBlocker {
  type: Task025BlockerType;
  severity: 'high' | 'medium' | 'low';
  safeDescription: string;
  requiredAction: string;
}

export interface Task025ReadinessDecision {
  decision: Task025PilotReadinessDecision;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  requiredActions: string[];
  task026SafeToStart: boolean;
  createdAt: string;
  auditRef: string;
}

export interface Task025ReadinessDiagnostics {
  schoolId: string;
  schoolVerified: boolean;
  scopeGatePassed: boolean;
  cohortReadinessPassed: boolean;
  teacherWorkflowPassed: boolean;
  adminAcceptancePassed: boolean;
  parentCommunicationPassed: boolean;
  safeguardingPassed: boolean;
  supportOperationsPassed: boolean;
  monitoringGatePassed: boolean;
  pauseRollbackPassed: boolean;
  dataPrivacyPassed: boolean;
  task020ContinuityPassed: boolean;
  task021ContinuityPassed: boolean;
  task022ContinuityPassed: boolean;
  task023ContinuityPassed: boolean;
  task024ContinuityPassed: boolean;
  overallDecision: Task025PilotReadinessDecision;
  blockingBlockerCount: number;
  warningCount: number;
  safeSummary: string;
}

export interface Task025ReadinessAuditEvent {
  id: string;
  schoolId: string;
  actorRole: string;
  eventType: Task025AuditEvent;
  safeSummary: string;
  createdAt: string;
  requestId: string;
}

export interface Task025SafeReadinessReport {
  taskId: string;
  reportGeneratedAt: string;
  schoolId: string;
  schoolVerified: boolean;
  scopeGateStatus: string;
  cohortReadinessStatus: string;
  teacherWorkflowStatus: string;
  adminAcceptanceStatus: string;
  parentCommunicationStatus: string;
  safeguardingStatus: string;
  supportOperationsStatus: string;
  monitoringGateStatus: string;
  pauseRollbackStatus: string;
  dataPrivacyStatus: string;
  overallDecision: string;
  blockingBlockerCount: number;
  safeSummary: string;
  requiredActions: string[];
  task026SafeToStart: boolean;
}
