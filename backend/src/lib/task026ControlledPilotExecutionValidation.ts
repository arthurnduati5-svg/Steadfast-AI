import type {
  Task026ExecutionContext, Task026DependencyGateInput,
  Task026ControlledPilotRunInput, Task026ExecutionStateTransition,
  Task026ExecutionGateInput, Task026CohortExecutionScopeInput,
  Task026LearnerAccessGateInput, Task026TeacherMonitoringInput,
  Task026PilotEvidenceEventInput, Task026SafeguardingSignalInput,
  Task026IncidentWatchInput, Task026PauseControlInput,
  Task026ResumeControlInput, Task026RollbackControlInput,
  Task026DailyPilotSummaryInput,
} from '../contracts/task026ControlledPilotExecutionContracts';
import {
  TASK026_FORBIDDEN_FIELDS, TASK026_EXECUTION_STATUSES,
  TASK026_EXECUTION_ACTOR_ROLES, TASK026_EXECUTION_CONTROL_ACTIONS,
  TASK026_EVIDENCE_EVENT_TYPES, TASK026_INCIDENT_SEVERITIES,
  TASK026_PAUSE_REASONS, TASK026_ROLLBACK_REASONS,
  TASK026_SAFEGUARDING_SIGNAL_TYPES, TASK026_DENIED_ROLES,
  ALLOWED_EXECUTION_TRANSITIONS,
} from '../contracts/task026ControlledPilotExecutionContracts';
import type { Task026ExecutionStatus } from '../contracts/task026ControlledPilotExecutionContracts';

export interface Task026ValidationError {
  valid: false;
  code: string;
  safeMessage: string;
  reasonCodes: string[];
}

export interface Task026ValidationSuccess<T> {
  valid: true;
  data: T;
}

export type Task026ValidationResult<T> = Task026ValidationError | Task026ValidationSuccess<T>;

export function createSafeTask026ValidationError(
  code: string, safeMessage: string, reasonCodes: string[],
): Task026ValidationError {
  return { valid: false, code, safeMessage, reasonCodes };
}

export function validateTask026ExecutionContext(
  input: Partial<Task026ExecutionContext>,
): Task026ValidationResult<Task026ExecutionContext> {
  if (!input.schoolId || typeof input.schoolId !== 'string' || input.schoolId.trim() === '') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School identity is required.', ['missing_school_id']);
  }
  if (!input.actorId || typeof input.actorId !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ID', 'Actor identity is required.', ['missing_actor_id']);
  }
  if (!input.actorRole || typeof input.actorRole !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ROLE', 'Actor role is required.', ['missing_actor_role']);
  }
  if (!input.verifiedSchoolIdentity) {
    return createSafeTask026ValidationError('UNVERIFIED_SCHOOL_CONTEXT', 'Verified school context is required.', ['unverified_school_context']);
  }
  if (TASK026_DENIED_ROLES.includes(input.actorRole as any)) {
    return createSafeTask026ValidationError('ROLE_DENIED', `Role "${input.actorRole}" is denied for execution operations.`, ['role_denied']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId.trim(),
      actorId: input.actorId,
      actorRole: input.actorRole,
      requestId: input.requestId || 'unknown',
      verifiedSchoolIdentity: true,
      pilotRunId: input.pilotRunId,
      timestamp: new Date().toISOString(),
    },
  };
}

export function validateTask026DependencyGateInput(
  input: Partial<Task026DependencyGateInput>,
): Task026ValidationResult<Task026DependencyGateInput> {
  if (!input.schoolId || typeof input.schoolId !== 'string' || input.schoolId.trim() === '') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School identity is required.', ['missing_school_id']);
  }
  if (!input.actorId || typeof input.actorId !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ID', 'Actor identity is required.', ['missing_actor_id']);
  }
  if (!input.actorRole || typeof input.actorRole !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ROLE', 'Actor role is required.', ['missing_actor_role']);
  }
  return { valid: true, data: { schoolId: input.schoolId.trim(), actorId: input.actorId, actorRole: input.actorRole } };
}

export function validateTask026ControlledPilotRunInput(
  input: Partial<Task026ControlledPilotRunInput>,
): Task026ValidationResult<Task026ControlledPilotRunInput> {
  if (!input.schoolId || typeof input.schoolId !== 'string' || input.schoolId.trim() === '') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School identity is required.', ['missing_school_id']);
  }
  if (!input.pilotProgramId || typeof input.pilotProgramId !== 'string') {
    return createSafeTask026ValidationError('MISSING_PILOT_PROGRAM_ID', 'Pilot program ID is required.', ['missing_pilot_program_id']);
  }
  if (!input.cohortIds || !Array.isArray(input.cohortIds) || input.cohortIds.length === 0) {
    return createSafeTask026ValidationError('MISSING_COHORT_IDS', 'At least one cohort must be specified.', ['missing_cohort_ids']);
  }
  if (input.cohortIds.length > 5) {
    return createSafeTask026ValidationError('TOO_MANY_COHORTS', 'Maximum 5 cohorts allowed for controlled pilot.', ['too_many_cohorts']);
  }
  if (!input.teacherOwnerId || typeof input.teacherOwnerId !== 'string') {
    return createSafeTask026ValidationError('MISSING_TEACHER_OWNER', 'Teacher owner is required.', ['missing_teacher_owner']);
  }
  if (!input.supportOwnerId || typeof input.supportOwnerId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SUPPORT_OWNER', 'Support owner is required.', ['missing_support_owner']);
  }
  if (!input.safeguardingOwnerId || typeof input.safeguardingOwnerId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SAFEGUARDING_OWNER', 'Safeguarding owner is required.', ['missing_safeguarding_owner']);
  }
  if (!input.pauseOwnerId || typeof input.pauseOwnerId !== 'string') {
    return createSafeTask026ValidationError('MISSING_PAUSE_OWNER', 'Pause owner is required.', ['missing_pause_owner']);
  }
  if (!input.rollbackOwnerId || typeof input.rollbackOwnerId !== 'string') {
    return createSafeTask026ValidationError('MISSING_ROLLBACK_OWNER', 'Rollback owner is required.', ['missing_rollback_owner']);
  }
  if (!input.monitoringOwnerId || typeof input.monitoringOwnerId !== 'string') {
    return createSafeTask026ValidationError('MISSING_MONITORING_OWNER', 'Monitoring owner is required.', ['missing_monitoring_owner']);
  }
  if (!input.approvedCurriculumScopeIds || !Array.isArray(input.approvedCurriculumScopeIds) || input.approvedCurriculumScopeIds.length === 0) {
    return createSafeTask026ValidationError('MISSING_CURRICULUM_SCOPE', 'Approved curriculum scope is required.', ['missing_curriculum_scope']);
  }
  if (!input.approvedSourceScopeIds || !Array.isArray(input.approvedSourceScopeIds) || input.approvedSourceScopeIds.length === 0) {
    return createSafeTask026ValidationError('MISSING_SOURCE_SCOPE', 'Approved source scope is required.', ['missing_source_scope']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId.trim(),
      pilotProgramId: input.pilotProgramId,
      cohortIds: input.cohortIds,
      teacherOwnerId: input.teacherOwnerId,
      supportOwnerId: input.supportOwnerId,
      safeguardingOwnerId: input.safeguardingOwnerId,
      pauseOwnerId: input.pauseOwnerId,
      rollbackOwnerId: input.rollbackOwnerId,
      monitoringOwnerId: input.monitoringOwnerId,
      approvedCurriculumScopeIds: input.approvedCurriculumScopeIds,
      approvedSourceScopeIds: input.approvedSourceScopeIds,
      actorRole: input.actorRole || 'unknown',
      actorId: input.actorId || 'unknown',
    },
  };
}

export function validateTask026ExecutionStateTransition(
  input: Partial<Task026ExecutionStateTransition>,
): Task026ValidationResult<Task026ExecutionStateTransition> {
  if (!input.runId || typeof input.runId !== 'string') {
    return createSafeTask026ValidationError('MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id']);
  }
  if (!input.toStatus || !TASK026_EXECUTION_STATUSES.includes(input.toStatus as any)) {
    return createSafeTask026ValidationError('INVALID_STATUS', `Invalid target status "${input.toStatus}".`, ['invalid_status']);
  }
  if (!input.actorRole || typeof input.actorRole !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ROLE', 'Actor role is required.', ['missing_actor_role']);
  }
  return {
    valid: true,
    data: {
      runId: input.runId,
      fromStatus: input.fromStatus || 'draft',
      toStatus: input.toStatus as Task026ExecutionStatus,
      actorRole: input.actorRole,
      actorId: input.actorId || 'unknown',
      reason: input.reason,
    },
  };
}

export function validateTask026ExecutionGateInput(
  input: Partial<Task026ExecutionGateInput>,
): Task026ValidationResult<Task026ExecutionGateInput> {
  if (!input.runId || typeof input.runId !== 'string') {
    return createSafeTask026ValidationError('MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id']);
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id']);
  }
  if (!input.actorRole || typeof input.actorRole !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ROLE', 'Actor role is required.', ['missing_actor_role']);
  }
  return {
    valid: true,
    data: { runId: input.runId, schoolId: input.schoolId, actorRole: input.actorRole, action: input.action || 'unknown' },
  };
}

export function validateTask026CohortExecutionScopeInput(
  input: Partial<Task026CohortExecutionScopeInput>,
): Task026ValidationResult<Task026CohortExecutionScopeInput> {
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id']);
  }
  if (!input.cohortId || typeof input.cohortId !== 'string') {
    return createSafeTask026ValidationError('MISSING_COHORT_ID', 'Cohort ID is required.', ['missing_cohort_id']);
  }
  if (typeof input.cohortSize !== 'number' || input.cohortSize < 1 || input.cohortSize > 100) {
    return createSafeTask026ValidationError('INVALID_COHORT_SIZE', 'Cohort size must be 1-100.', ['invalid_cohort_size']);
  }
  if (!input.teacherOwnerId || typeof input.teacherOwnerId !== 'string') {
    return createSafeTask026ValidationError('MISSING_TEACHER_OWNER', 'Teacher owner is required.', ['missing_teacher_owner']);
  }
  if (!input.supportOwnerId || typeof input.supportOwnerId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SUPPORT_OWNER', 'Support owner is required.', ['missing_support_owner']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId,
      cohortId: input.cohortId,
      cohortSize: input.cohortSize,
      teacherOwnerId: input.teacherOwnerId,
      supportOwnerId: input.supportOwnerId,
      approvedCurriculumScopeIds: input.approvedCurriculumScopeIds || [],
      approvedSourceScopeIds: input.approvedSourceScopeIds || [],
    },
  };
}

export function validateTask026LearnerAccessGateInput(
  input: Partial<Task026LearnerAccessGateInput>,
): Task026ValidationResult<Task026LearnerAccessGateInput> {
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id']);
  }
  if (!input.learnerId || typeof input.learnerId !== 'string') {
    return createSafeTask026ValidationError('MISSING_LEARNER_ID', 'Learner ID is required.', ['missing_learner_id']);
  }
  if (!input.cohortId || typeof input.cohortId !== 'string') {
    return createSafeTask026ValidationError('MISSING_COHORT_ID', 'Cohort ID is required.', ['missing_cohort_id']);
  }
  if (!input.pilotRunId || typeof input.pilotRunId !== 'string') {
    return createSafeTask026ValidationError('MISSING_PILOT_RUN_ID', 'Pilot run ID is required.', ['missing_pilot_run_id']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId,
      learnerId: input.learnerId,
      cohortId: input.cohortId,
      pilotRunId: input.pilotRunId,
      requestedContentType: input.requestedContentType || 'learning',
    },
  };
}

export function validateTask026TeacherMonitoringInput(
  input: Partial<Task026TeacherMonitoringInput>,
): Task026ValidationResult<Task026TeacherMonitoringInput> {
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id']);
  }
  if (!input.teacherId || typeof input.teacherId !== 'string') {
    return createSafeTask026ValidationError('MISSING_TEACHER_ID', 'Teacher ID is required.', ['missing_teacher_id']);
  }
  if (!input.pilotRunId || typeof input.pilotRunId !== 'string') {
    return createSafeTask026ValidationError('MISSING_PILOT_RUN_ID', 'Pilot run ID is required.', ['missing_pilot_run_id']);
  }
  return { valid: true, data: { schoolId: input.schoolId, teacherId: input.teacherId, pilotRunId: input.pilotRunId } };
}

export function validateTask026PilotEvidenceEventInput(
  input: Partial<Task026PilotEvidenceEventInput>,
): Task026ValidationResult<Task026PilotEvidenceEventInput> {
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id']);
  }
  if (!input.pilotRunId || typeof input.pilotRunId !== 'string') {
    return createSafeTask026ValidationError('MISSING_PILOT_RUN_ID', 'Pilot run ID is required.', ['missing_pilot_run_id']);
  }
  if (!input.eventType || !TASK026_EVIDENCE_EVENT_TYPES.includes(input.eventType as any)) {
    return createSafeTask026ValidationError('INVALID_EVENT_TYPE', 'Valid evidence event type is required.', ['invalid_event_type']);
  }
  if (!input.actorRole || typeof input.actorRole !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ROLE', 'Actor role is required.', ['missing_actor_role']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId,
      pilotRunId: input.pilotRunId,
      eventType: input.eventType as any,
      actorRole: input.actorRole,
      safeSummary: input.safeSummary || '',
      metadataSafeJson: input.metadataSafeJson || {},
    },
  };
}

export function validateTask026SafeguardingSignalInput(
  input: Partial<Task026SafeguardingSignalInput>,
): Task026ValidationResult<Task026SafeguardingSignalInput> {
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id']);
  }
  if (!input.pilotRunId || typeof input.pilotRunId !== 'string') {
    return createSafeTask026ValidationError('MISSING_PILOT_RUN_ID', 'Pilot run ID is required.', ['missing_pilot_run_id']);
  }
  if (!input.signalType || !TASK026_SAFEGUARDING_SIGNAL_TYPES.includes(input.signalType as any)) {
    return createSafeTask026ValidationError('INVALID_SIGNAL_TYPE', 'Valid safeguarding signal type is required.', ['invalid_signal_type']);
  }
  if (!input.source || typeof input.source !== 'string') {
    return createSafeTask026ValidationError('MISSING_SOURCE', 'Signal source is required.', ['missing_source']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId,
      pilotRunId: input.pilotRunId,
      signalType: input.signalType as any,
      severity: input.severity || 'low',
      source: input.source,
      safeSummary: input.safeSummary || '',
      requiresPause: !!input.requiresPause,
      requiresHumanReview: !!input.requiresHumanReview,
    },
  };
}

export function validateTask026IncidentWatchInput(
  input: Partial<Task026IncidentWatchInput>,
): Task026ValidationResult<Task026IncidentWatchInput> {
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id']);
  }
  if (!input.pilotRunId || typeof input.pilotRunId !== 'string') {
    return createSafeTask026ValidationError('MISSING_PILOT_RUN_ID', 'Pilot run ID is required.', ['missing_pilot_run_id']);
  }
  if (!input.severity || !TASK026_INCIDENT_SEVERITIES.includes(input.severity as any)) {
    return createSafeTask026ValidationError('INVALID_SEVERITY', 'Valid incident severity is required.', ['invalid_severity']);
  }
  if (!input.category || typeof input.category !== 'string') {
    return createSafeTask026ValidationError('MISSING_CATEGORY', 'Incident category is required.', ['missing_category']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId,
      pilotRunId: input.pilotRunId,
      severity: input.severity as any,
      category: input.category,
      safeSummary: input.safeSummary || '',
      metadataSafeJson: input.metadataSafeJson || {},
    },
  };
}

export function validateTask026PauseControlInput(
  input: Partial<Task026PauseControlInput>,
): Task026ValidationResult<Task026PauseControlInput> {
  if (!input.runId || typeof input.runId !== 'string') {
    return createSafeTask026ValidationError('MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id']);
  }
  if (!input.actorRole || typeof input.actorRole !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ROLE', 'Actor role is required.', ['missing_actor_role']);
  }
  if (!input.reason || !TASK026_PAUSE_REASONS.includes(input.reason as any)) {
    return createSafeTask026ValidationError('INVALID_PAUSE_REASON', 'Valid pause reason is required.', ['invalid_pause_reason']);
  }
  return {
    valid: true,
    data: {
      runId: input.runId,
      actorRole: input.actorRole,
      actorId: input.actorId || 'unknown',
      reason: input.reason as any,
      details: input.details || '',
    },
  };
}

export function validateTask026ResumeControlInput(
  input: Partial<Task026ResumeControlInput>,
): Task026ValidationResult<Task026ResumeControlInput> {
  if (!input.runId || typeof input.runId !== 'string') {
    return createSafeTask026ValidationError('MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id']);
  }
  if (!input.actorRole || typeof input.actorRole !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ROLE', 'Actor role is required.', ['missing_actor_role']);
  }
  return {
    valid: true,
    data: { runId: input.runId, actorRole: input.actorRole, actorId: input.actorId || 'unknown', gatesRevalidated: !!input.gatesRevalidated },
  };
}

export function validateTask026RollbackControlInput(
  input: Partial<Task026RollbackControlInput>,
): Task026ValidationResult<Task026RollbackControlInput> {
  if (!input.runId || typeof input.runId !== 'string') {
    return createSafeTask026ValidationError('MISSING_RUN_ID', 'Run ID is required.', ['missing_run_id']);
  }
  if (!input.actorRole || typeof input.actorRole !== 'string') {
    return createSafeTask026ValidationError('MISSING_ACTOR_ROLE', 'Actor role is required.', ['missing_actor_role']);
  }
  if (!input.reason || !TASK026_ROLLBACK_REASONS.includes(input.reason as any)) {
    return createSafeTask026ValidationError('INVALID_ROLLBACK_REASON', 'Valid rollback reason is required.', ['invalid_rollback_reason']);
  }
  return {
    valid: true,
    data: {
      runId: input.runId,
      actorRole: input.actorRole,
      actorId: input.actorId || 'unknown',
      reason: input.reason as any,
      details: input.details || '',
    },
  };
}

export function validateTask026DailyPilotSummaryInput(
  input: Partial<Task026DailyPilotSummaryInput>,
): Task026ValidationResult<Task026DailyPilotSummaryInput> {
  if (!input.pilotRunId || typeof input.pilotRunId !== 'string') {
    return createSafeTask026ValidationError('MISSING_PILOT_RUN_ID', 'Pilot run ID is required.', ['missing_pilot_run_id']);
  }
  if (!input.schoolId || typeof input.schoolId !== 'string') {
    return createSafeTask026ValidationError('MISSING_SCHOOL_ID', 'School ID is required.', ['missing_school_id']);
  }
  return { valid: true, data: { pilotRunId: input.pilotRunId, schoolId: input.schoolId } };
}

export function rejectTask026ForbiddenFields(
  obj: Record<string, unknown>, path: string = '',
): Task026ValidationError | null {
  for (const [key, value] of Object.entries(obj)) {
    if (TASK026_FORBIDDEN_FIELDS.includes(key as any)) {
      return createSafeTask026ValidationError(
        'FORBIDDEN_FIELD', `Field "${key}" is forbidden.`, ['forbidden_field', `field:${key}`],
      );
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nestedResult = rejectTask026ForbiddenFields(value as Record<string, unknown>, `${path}.${key}`);
      if (nestedResult) return nestedResult;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== null && typeof value[i] === 'object') {
          const nestedResult = rejectTask026ForbiddenFields(value[i] as Record<string, unknown>, `${path}.${key}[${i}]`);
          if (nestedResult) return nestedResult;
        }
      }
    }
  }
  return null;
}

export function redactTask026SensitiveValue(value: string): string {
  if (!value) return value;
  if (value.length < 4) return '***';
  return value.substring(0, 2) + '***' + value.substring(value.length - 2);
}

export function isTask026ControlRole(role: string): boolean {
  return ['school_admin', 'system_admin', 'internal_operator', 'authorized_pilot_coordinator'].includes(role);
}

export function isTask026MonitoringRole(role: string): boolean {
  return role === 'teacher_assigned_to_pilot' || isTask026ControlRole(role);
}

export function isTask026LearnerRole(role: string): boolean {
  return role === 'learner_in_approved_pilot_cohort';
}
