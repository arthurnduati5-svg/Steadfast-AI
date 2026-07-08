export type ExpansionExecutionStatus =
  | 'not_started'
  | 'preflight_required'
  | 'preflight_failed'
  | 'ready'
  | 'stage_1_active'
  | 'stage_1_paused'
  | 'stage_2_active'
  | 'stage_2_paused'
  | 'stage_3_active'
  | 'stage_3_paused'
  | 'paused'
  | 'rollback_requested'
  | 'rolled_back'
  | 'completed'
  | 'blocked'
  | 'failed';

export type ExpansionStageStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'blocked'
  | 'rolled_back';

export type ExpansionExecutionDecision =
  | 'do_not_execute'
  | 'prepare_only'
  | 'activate_stage_1'
  | 'continue_stage'
  | 'pause_and_fix'
  | 'rollback_required'
  | 'complete_expansion';

export type ExpansionRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type ExpansionParticipantActivationStatus =
  | 'pending'
  | 'active'
  | 'blocked'
  | 'removed'
  | 'rolled_back';

export type ExpansionHealthStatus =
  | 'healthy'
  | 'watch'
  | 'degraded'
  | 'critical';

export type ExpansionOversightItemType =
  | 'teacher_review_needed'
  | 'admin_review_needed'
  | 'privacy_review_needed'
  | 'deen_review_needed'
  | 'socratic_quality_review'
  | 'curriculum_source_review'
  | 'technical_issue'
  | 'blocked_student_access'
  | 'content_gap'
  | 'critical_safety_signal'
  | 'rollback_recommendation';

export type ExpansionOversightSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type ExpansionInterventionType =
  | 'pause_execution'
  | 'pause_stage'
  | 'resume_execution'
  | 'resume_stage'
  | 'kill_switch_enable'
  | 'kill_switch_disable'
  | 'rollback_execution';

export type ExpansionCompletionReviewDecision =
  | 'continue_controlled_expansion'
  | 'pause_and_fix'
  | 'rollback_required'
  | 'ready_for_larger_school_rollout'
  | 'do_not_expand_further';

export const EXPANSION_EXECUTION_STATUSES: ExpansionExecutionStatus[] = [
  'not_started', 'preflight_required', 'preflight_failed', 'ready',
  'stage_1_active', 'stage_1_paused', 'stage_2_active', 'stage_2_paused',
  'stage_3_active', 'stage_3_paused', 'paused', 'rollback_requested', 'rolled_back',
  'completed', 'blocked', 'failed',
];

export const EXPANSION_STAGE_STATUSES: ExpansionStageStatus[] = [
  'pending', 'active', 'paused', 'completed', 'blocked', 'rolled_back',
];

export const EXPANSION_EXECUTION_DECISIONS: ExpansionExecutionDecision[] = [
  'do_not_execute', 'prepare_only', 'activate_stage_1', 'continue_stage',
  'pause_and_fix', 'rollback_required', 'complete_expansion',
];

export const EXPANSION_RISK_LEVELS: ExpansionRiskLevel[] = [
  'low', 'medium', 'high', 'critical',
];

export const EXPANSION_PARTICIPANT_ACTIVATION_STATUSES: ExpansionParticipantActivationStatus[] = [
  'pending', 'active', 'blocked', 'removed', 'rolled_back',
];

export const EXPANSION_HEALTH_STATUSES: ExpansionHealthStatus[] = [
  'healthy', 'watch', 'degraded', 'critical',
];

export const EXPANSION_OVERSIGHT_ITEM_TYPES: ExpansionOversightItemType[] = [
  'teacher_review_needed', 'admin_review_needed', 'privacy_review_needed',
  'deen_review_needed', 'socratic_quality_review', 'curriculum_source_review',
  'technical_issue', 'blocked_student_access', 'content_gap',
  'critical_safety_signal', 'rollback_recommendation',
];

export const EXPANSION_COMPLETION_REVIEW_DECISIONS: ExpansionCompletionReviewDecision[] = [
  'continue_controlled_expansion', 'pause_and_fix', 'rollback_required',
  'ready_for_larger_school_rollout', 'do_not_expand_further',
];

export const VALID_EXECUTION_TRANSITIONS: Record<ExpansionExecutionStatus, ExpansionExecutionStatus[]> = {
  not_started: ['preflight_required', 'blocked', 'failed'],
  preflight_required: ['ready', 'preflight_failed', 'blocked', 'failed'],
  preflight_failed: ['preflight_required', 'blocked', 'failed'],
  ready: ['stage_1_active', 'blocked', 'failed'],
  stage_1_active: ['stage_1_paused', 'stage_2_active', 'paused', 'rollback_requested', 'completed', 'blocked', 'failed'],
  stage_1_paused: ['stage_1_active', 'rollback_requested', 'blocked', 'failed'],
  stage_2_active: ['stage_2_paused', 'stage_3_active', 'paused', 'rollback_requested', 'completed', 'blocked', 'failed'],
  stage_2_paused: ['stage_2_active', 'rollback_requested', 'blocked', 'failed'],
  stage_3_active: ['stage_3_paused', 'paused', 'rollback_requested', 'completed', 'blocked', 'failed'],
  stage_3_paused: ['stage_3_active', 'rollback_requested', 'blocked', 'failed'],
  paused: ['stage_1_active', 'stage_2_active', 'stage_3_active', 'rollback_requested', 'blocked', 'failed'],
  rollback_requested: ['rolled_back', 'blocked', 'failed'],
  rolled_back: ['blocked', 'failed'],
  completed: ['blocked', 'failed'],
  blocked: [],
  failed: [],
};

export interface ExpansionExecutionRunInput {
  expansionProposalId: string;
  pilotProgramId: string;
  schoolId: string;
  approvedDecisionRef?: string;
  task027ReportRef?: string;
  safeSummary: string;
  stagePlan: Record<string, unknown>;
  approvedScopeSnapshot: Record<string, unknown>;
  startedByRole?: string;
  startedByActorIdHash?: string;
  metadataSafeJson?: Record<string, unknown>;
}

export interface ExpansionExecutionStageInput {
  executionRunId: string;
  expansionProposalId: string;
  schoolId: string;
  stageNumber: number;
  plannedStudentCount: number;
  plannedTeacherCount: number;
  allowedClassIds: string[];
  allowedSubjectIds: string[];
  allowedCurriculumScopes: string[];
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
}

export interface ExpandedParticipantInput {
  executionRunId: string;
  stageId?: string;
  pilotProgramId: string;
  schoolId: string;
  actorIdHash: string;
  role: string;
  classId?: string;
  subjectIds?: string[];
  curriculumScopes?: string[];
  activationStatus?: ExpansionParticipantActivationStatus;
  activationReasonCodes?: string[];
  metadataSafeJson?: Record<string, unknown>;
}

export interface ExpansionRuntimeGateDecision {
  allowed: boolean;
  reasonCodes: string[];
  safeMessage: string;
  gateSnapshot: Record<string, unknown>;
}

export interface ExpansionMonitoringEventInput {
  executionRunId: string;
  stageId?: string;
  pilotProgramId: string;
  schoolId: string;
  actorRole: string;
  actorIdHash?: string;
  eventType: string;
  eventStatus: string;
  safeSummary: string;
  reasonCodes?: string[];
  metadataSafeJson?: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
}

export interface ExpansionHealthSnapshotInput {
  executionRunId: string;
  stageId?: string;
  pilotProgramId: string;
  schoolId: string;
  activeExpandedSessions: number;
  allowedExpandedSessionStarts: number;
  blockedExpandedSessionStarts: number;
  schoolAuthBlocks: number;
  cohortScopeBlocks: number;
  curriculumGateBlocks: number;
  socraticGateBlocks: number;
  deenGateBlocks: number;
  privacyGateBlocks: number;
  aiCallBlocks: number;
  memoryAccessBlocks: number;
  evidenceWriteBlocks: number;
  feedbackCount: number;
  oversightItemCount: number;
  interventionCount: number;
  incidentBridgeCount: number;
  errorCount: number;
  p95LatencyMs?: number;
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
}

export interface ExpansionOversightItemInput {
  executionRunId: string;
  stageId?: string;
  pilotProgramId: string;
  schoolId: string;
  itemType: ExpansionOversightItemType;
  severity: ExpansionOversightSeverity;
  source: string;
  safeSummary: string;
  reasonCodes?: string[];
  assignedRole?: string;
  requiresTeacherReview: boolean;
  requiresAdminReview: boolean;
  requiresPrivacyReview: boolean;
  requiresDeenReview: boolean;
  requiresSocraticReview: boolean;
  requiresCurriculumReview: boolean;
  requiresPause: boolean;
  requiresRollback: boolean;
  metadataSafeJson?: Record<string, unknown>;
}

export interface ExpansionInterventionInput {
  executionRunId: string;
  stageId?: string;
  pilotProgramId: string;
  schoolId: string;
  interventionType: ExpansionInterventionType;
  actorRole: string;
  actorIdHash?: string;
  safeSummary: string;
  reasonCodes?: string[];
  beforeSnapshot?: Record<string, unknown>;
  afterSnapshot?: Record<string, unknown>;
  metadataSafeJson?: Record<string, unknown>;
}

export interface ExpansionRollbackInput {
  executionRunId: string;
  stageId?: string;
  pilotProgramId: string;
  schoolId: string;
  rollbackReason: string;
  safeSummary: string;
  previousScopeSnapshot: Record<string, unknown>;
  metadataSafeJson?: Record<string, unknown>;
}

export interface ExpansionCompletionReviewInput {
  executionRunId: string;
  pilotProgramId: string;
  schoolId: string;
  safeSummary: string;
  learningQualitySummary: Record<string, unknown>;
  safetySummary: Record<string, unknown>;
  privacySummary: Record<string, unknown>;
  deenSummary: Record<string, unknown>;
  socraticSummary: Record<string, unknown>;
  curriculumSummary: Record<string, unknown>;
  operationsSummary: Record<string, unknown>;
  teacherAdminSummary: Record<string, unknown>;
  rollbackSummary: Record<string, unknown>;
  recommendedDecision: ExpansionCompletionReviewDecision;
  safeToStartNextTask: boolean;
  blockingIssues?: string[];
  knownLimitations?: string[];
  artifactPaths?: string[];
}

export const EXPANSION_MONITORING_EVENT_TYPES = [
  'expansion_preflight_requested',
  'expansion_preflight_passed',
  'expansion_preflight_failed',
  'expansion_stage_activation_requested',
  'expansion_stage_activated',
  'expansion_stage_blocked',
  'expanded_session_start_allowed',
  'expanded_session_start_denied',
  'ai_call_blocked_before_guard',
  'memory_access_blocked_before_guard',
  'evidence_write_blocked_before_guard',
  'curriculum_gate_blocked',
  'socratic_gate_blocked',
  'deen_gate_blocked',
  'privacy_gate_blocked',
  'feedback_received',
  'oversight_item_created',
  'intervention_requested',
  'intervention_completed',
  'expansion_paused',
  'expansion_resumed',
  'rollback_requested',
  'rollback_completed',
  'completion_review_generated',
];

export const FORBIDDEN_CONTENT_PATTERNS = [
  'raw student chat', 'private learner memory', 'teacher-only notes',
  'safeguarding raw details', 'Deen-sensitive private text',
  'AI prompt', 'provider response', 'answer key',
  'teacher-only content', 'protected rubric', 'Bearer ',
  'postgres://', 'postgresql://', 'mysql://',
  'sk-proj-', 'sk-ant-',
];

export function nowISO(): string {
  return new Date().toISOString();
}
