import type {
  Task025PilotReadinessContext,
  Task025PilotScopeInput,
  Task025CandidateCohortInput,
  Task025StakeholderReadinessInput,
  Task025TeacherWorkflowValidation,
  Task025AdminAcceptanceReadiness,
  Task025ParentCommunicationReadiness,
  Task025SafeguardingEscalationReadiness,
  Task025MonitoringGateReadiness,
  Task025PauseRollbackReadiness,
  Task025DataPrivacyReadiness,
  Task025ReadinessBlocker,
} from '../contracts/task025ControlledPilotReadinessContracts';
import { TASK025_FORBIDDEN_FIELDS, TASK025_PILOT_READINESS_ACTOR_ROLES } from '../contracts/task025ControlledPilotReadinessContracts';

export interface Task025ValidationError {
  valid: false;
  code: string;
  safeMessage: string;
  reasonCodes: string[];
}

export interface Task025ValidationSuccess<T> {
  valid: true;
  data: T;
}

export type Task025ValidationResult<T> = Task025ValidationError | Task025ValidationSuccess<T>;

const LEARNER_LIKE_ROLES = ['learner', 'student', 'parent', 'peer', 'anonymous', 'unknown'];
const ALLOWED_ACTOR_ROLES_FOR_CONTROL = new Set(TASK025_PILOT_READINESS_ACTOR_ROLES);

export function validateTask025PilotReadinessContext(
  input: Partial<Task025PilotReadinessContext>,
): Task025ValidationResult<Task025PilotReadinessContext> {
  if (!input.schoolId || typeof input.schoolId !== 'string' || input.schoolId.trim() === '') {
    return createSafeTask025ValidationError('MISSING_SCHOOL_ID', 'School identity is required for pilot readiness evaluation.', ['missing_school_id']);
  }
  if (!input.actorId || typeof input.actorId !== 'string') {
    return createSafeTask025ValidationError('MISSING_ACTOR_ID', 'Actor identity is required.', ['missing_actor_id']);
  }
  if (!input.actorRole || typeof input.actorRole !== 'string') {
    return createSafeTask025ValidationError('MISSING_ACTOR_ROLE', 'Actor role is required.', ['missing_actor_role']);
  }
  if (!input.verifiedSchoolIdentity) {
    return createSafeTask025ValidationError('UNVERIFIED_SCHOOL_CONTEXT', 'Verified school context is required for pilot readiness operations.', ['unverified_school_context']);
  }
  const roleLower = input.actorRole.toLowerCase();
  if (LEARNER_LIKE_ROLES.includes(roleLower)) {
    return createSafeTask025ValidationError('LEARNER_PARENT_PEER_DENIED', 'Learners, parents, and peers are not authorized for pilot readiness operations.', ['actor_role_denied']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId.trim(),
      actorId: input.actorId,
      actorRole: input.actorRole,
      requestId: input.requestId || 'unknown',
      verifiedSchoolIdentity: true,
      schoolName: input.schoolName,
      pilotCoordinatorName: input.pilotCoordinatorName,
      timestamp: new Date().toISOString(),
    },
  };
}

export function validateTask025PilotScopeInput(
  input: Partial<Task025PilotScopeInput>,
  contextSchoolId: string,
): Task025ValidationResult<Task025PilotScopeInput> {
  if (!input.schoolId || input.schoolId !== contextSchoolId) {
    return createSafeTask025ValidationError('CROSS_SCHOOL_SCOPE', 'Pilot scope must belong to the verified school context.', ['cross_school_denied']);
  }
  if (!input.pilotPurpose || typeof input.pilotPurpose !== 'string' || input.pilotPurpose.trim() === '') {
    return createSafeTask025ValidationError('MISSING_PILOT_PURPOSE', 'Pilot purpose must be defined.', ['missing_pilot_purpose']);
  }
  if (typeof input.cohortSize !== 'number' || input.cohortSize < 1 || input.cohortSize > 100) {
    return createSafeTask025ValidationError('INVALID_COHORT_SIZE', 'Cohort size must be between 1 and 100 for controlled pilot.', ['invalid_cohort_size']);
  }
  if (typeof input.pilotDurationWeeks !== 'number' || input.pilotDurationWeeks < 1 || input.pilotDurationWeeks > 52) {
    return createSafeTask025ValidationError('INVALID_PILOT_DURATION', 'Pilot duration must be between 1 and 52 weeks.', ['invalid_pilot_duration']);
  }
  if (!input.adminOwner || typeof input.adminOwner !== 'string' || input.adminOwner.trim() === '') {
    return createSafeTask025ValidationError('MISSING_ADMIN_OWNER', 'An admin owner must be assigned to the pilot.', ['missing_admin_owner']);
  }
  if (!input.supportOwner || typeof input.supportOwner !== 'string' || input.supportOwner.trim() === '') {
    return createSafeTask025ValidationError('MISSING_SUPPORT_OWNER', 'A support owner must be assigned to the pilot.', ['missing_support_owner']);
  }
  if (!input.monitoringOwner || typeof input.monitoringOwner !== 'string' || input.monitoringOwner.trim() === '') {
    return createSafeTask025ValidationError('MISSING_MONITORING_OWNER', 'A monitoring owner must be assigned to the pilot.', ['missing_monitoring_owner']);
  }
  if (!input.pauseOwner || typeof input.pauseOwner !== 'string' || input.pauseOwner.trim() === '') {
    return createSafeTask025ValidationError('MISSING_PAUSE_OWNER', 'A pause owner must be assigned to the pilot.', ['missing_pause_owner']);
  }
  if (!input.rollbackOwner || typeof input.rollbackOwner !== 'string' || input.rollbackOwner.trim() === '') {
    return createSafeTask025ValidationError('MISSING_ROLLBACK_OWNER', 'A rollback owner must be assigned to the pilot.', ['missing_rollback_owner']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId,
      pilotPurpose: input.pilotPurpose.trim(),
      cohortSize: input.cohortSize,
      pilotDurationWeeks: input.pilotDurationWeeks,
      teacherCoverageAvailable: !!input.teacherCoverageAvailable,
      adminOwner: input.adminOwner.trim(),
      supportOwner: input.supportOwner.trim(),
      monitoringOwner: input.monitoringOwner.trim(),
      pauseOwner: input.pauseOwner.trim(),
      rollbackOwner: input.rollbackOwner.trim(),
      safeguardingEscalationPathDefined: !!input.safeguardingEscalationPathDefined,
      parentCommunicationMaterialPrepared: !!input.parentCommunicationMaterialPrepared,
      deenSourceReferralPathDefined: !!input.deenSourceReferralPathDefined,
      curriculumSourceGovernanceReady: !!input.curriculumSourceGovernanceReady,
      privacyGovernanceReady: !!input.privacyGovernanceReady,
      operationsMonitoringReady: !!input.operationsMonitoringReady,
    },
  };
}

export function validateTask025CandidateCohortInput(
  input: Partial<Task025CandidateCohortInput>,
  contextSchoolId: string,
): Task025ValidationResult<Task025CandidateCohortInput> {
  if (!input.schoolId || input.schoolId !== contextSchoolId) {
    return createSafeTask025ValidationError('CROSS_SCHOOL_COHORT', 'Cohort must belong to the verified school context.', ['cross_school_denied']);
  }
  if (!input.cohortId || typeof input.cohortId !== 'string' || input.cohortId.trim() === '') {
    return createSafeTask025ValidationError('MISSING_COHORT_ID', 'Cohort identity is required.', ['missing_cohort_id']);
  }
  if (typeof input.cohortSize !== 'number' || input.cohortSize < 1 || input.cohortSize > 100) {
    return createSafeTask025ValidationError('INVALID_COHORT_SIZE', 'Cohort size must be between 1 and 100.', ['invalid_cohort_size_cohort']);
  }
  if (!input.teacherOwner || typeof input.teacherOwner !== 'string' || input.teacherOwner.trim() === '') {
    return createSafeTask025ValidationError('MISSING_TEACHER_OWNER', 'A teacher owner must be assigned to the cohort.', ['missing_teacher_owner']);
  }
  if (!input.supportOwner || typeof input.supportOwner !== 'string' || input.supportOwner.trim() === '') {
    return createSafeTask025ValidationError('MISSING_SUPPORT_OWNER_COHORT', 'A support owner must be assigned to the cohort.', ['missing_support_owner_cohort']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId,
      cohortId: input.cohortId.trim(),
      cohortSize: input.cohortSize,
      teacherOwner: input.teacherOwner.trim(),
      supportOwner: input.supportOwner.trim(),
      sourceApprovedCurriculumContext: !!input.sourceApprovedCurriculumContext,
      safeLearningContextAvailable: !!input.safeLearningContextAvailable,
    },
  };
}

export function validateTask025StakeholderReadinessInput(
  input: Partial<Task025StakeholderReadinessInput>,
  contextSchoolId: string,
): Task025ValidationResult<Task025StakeholderReadinessInput> {
  if (!input.schoolId || input.schoolId !== contextSchoolId) {
    return createSafeTask025ValidationError('CROSS_SCHOOL_STAKEHOLDER', 'Stakeholder validation must belong to the verified school context.', ['cross_school_denied']);
  }
  if (!input.teacherIds || !Array.isArray(input.teacherIds) || input.teacherIds.length === 0) {
    return createSafeTask025ValidationError('MISSING_TEACHER_IDS', 'At least one teacher must be identified for stakeholder readiness.', ['missing_teacher_ids']);
  }
  if (!input.adminIds || !Array.isArray(input.adminIds) || input.adminIds.length === 0) {
    return createSafeTask025ValidationError('MISSING_ADMIN_IDS', 'At least one admin must be identified.', ['missing_admin_ids']);
  }
  if (!input.safeguardingOwnerId || typeof input.safeguardingOwnerId !== 'string') {
    return createSafeTask025ValidationError('MISSING_SAFEGUARDING_OWNER', 'A safeguarding escalation owner must be identified.', ['missing_safeguarding_owner']);
  }
  return {
    valid: true,
    data: {
      schoolId: input.schoolId,
      teacherIds: input.teacherIds,
      adminIds: input.adminIds,
      supportStaffIds: input.supportStaffIds || [],
      safeguardingOwnerId: input.safeguardingOwnerId,
    },
  };
}

export function validateTask025TeacherWorkflowInput(
  input: Partial<Task025TeacherWorkflowValidation>,
): Task025ValidationResult<{ teacherCount: number; validatedTeachers: number }> {
  if (typeof input.teacherCount !== 'number' || input.teacherCount < 0) {
    return createSafeTask025ValidationError('INVALID_TEACHER_COUNT', 'Teacher count must be a non-negative number.', ['invalid_teacher_count']);
  }
  if (typeof input.validatedTeachers !== 'number' || input.validatedTeachers < 0) {
    return createSafeTask025ValidationError('INVALID_VALIDATED_TEACHERS', 'Validated teacher count must be a non-negative number.', ['invalid_validated_teachers']);
  }
  if (input.validatedTeachers > input.teacherCount) {
    return createSafeTask025ValidationError('VALIDATED_EXCEEDS_TOTAL', 'Validated teacher count cannot exceed total teacher count.', ['validated_exceeds_total']);
  }
  return {
    valid: true,
    data: {
      teacherCount: input.teacherCount,
      validatedTeachers: input.validatedTeachers,
    },
  };
}

export function validateTask025AdminAcceptanceInput(
  input: Partial<Task025AdminAcceptanceReadiness>,
): Task025ValidationResult<{ adminOwner: string; approvalNotes: string }> {
  if (!input.adminOwner || typeof input.adminOwner !== 'string' || input.adminOwner.trim() === '') {
    return createSafeTask025ValidationError('MISSING_ADMIN_ACCEPTANCE_OWNER', 'Admin acceptance owner must be identified.', ['missing_admin_acceptance_owner']);
  }
  if (input.approvalNotes && typeof input.approvalNotes === 'string' && input.approvalNotes.length > 2000) {
    return createSafeTask025ValidationError('APPROVAL_NOTES_TOO_LONG', 'Approval notes must not exceed 2000 characters.', ['approval_notes_too_long']);
  }
  const safeNotes = input.approvalNotes ? input.approvalNotes.trim().substring(0, 2000) : '';
  return {
    valid: true,
    data: {
      adminOwner: input.adminOwner.trim(),
      approvalNotes: safeNotes,
    },
  };
}

export function validateTask025ParentCommunicationInput(
  input: Partial<Task025ParentCommunicationReadiness>,
): Task025ValidationResult<{ templatesReady: boolean; privacySummaryIncluded: boolean; optOutPathDefined: boolean }> {
  return {
    valid: true,
    data: {
      templatesReady: !!input.templatesReady,
      privacySummaryIncluded: !!input.privacySummaryIncluded,
      optOutPathDefined: !!input.optOutPathDefined,
    },
  };
}

export function validateTask025SafeguardingReadinessInput(
  input: Partial<Task025SafeguardingEscalationReadiness>,
): Task025ValidationResult<{ safeguardingOwnerExists: boolean; escalationRouteDefined: boolean; humanReviewPathExists: boolean }> {
  return {
    valid: true,
    data: {
      safeguardingOwnerExists: !!input.safeguardingOwnerExists,
      escalationRouteDefined: !!input.escalationRouteDefined,
      humanReviewPathExists: !!input.humanReviewPathExists,
    },
  };
}

export function validateTask025MonitoringReadinessInput(
  input: Partial<Task025MonitoringGateReadiness>,
): Task025ValidationResult<{ task024MonitoringReady: boolean; incidentDrillAvailable: boolean; backupRestoreDrillAvailable: boolean }> {
  return {
    valid: true,
    data: {
      task024MonitoringReady: !!input.task024MonitoringReady,
      incidentDrillAvailable: !!input.incidentDrillAvailable,
      backupRestoreDrillAvailable: !!input.backupRestoreDrillAvailable,
    },
  };
}

export function validateTask025PauseRollbackInput(
  input: Partial<Task025PauseRollbackReadiness>,
): Task025ValidationResult<{ pauseOwnerExists: boolean; rollbackOwnerExists: boolean; pauseCriteriaDefined: boolean; rollbackCriteriaDefined: boolean }> {
  return {
    valid: true,
    data: {
      pauseOwnerExists: !!input.pauseOwnerExists,
      rollbackOwnerExists: !!input.rollbackOwnerExists,
      pauseCriteriaDefined: !!input.pauseCriteriaDefined,
      rollbackCriteriaDefined: !!input.rollbackCriteriaDefined,
    },
  };
}

export function validateTask025DataPrivacyInput(
  input: Partial<Task025DataPrivacyReadiness>,
): Task025ValidationResult<{ dataClassificationApplied: boolean; roleMatrixApplied: boolean; aiEgressGuardNotBypassed: boolean }> {
  return {
    valid: true,
    data: {
      dataClassificationApplied: !!input.dataClassificationApplied,
      roleMatrixApplied: !!input.roleMatrixApplied,
      aiEgressGuardNotBypassed: !!input.aiEgressGuardNotBypassed,
    },
  };
}

export function rejectTask025ForbiddenFields(
  obj: Record<string, unknown>,
  path: string = '',
): Task025ValidationError | null {
  for (const [key, value] of Object.entries(obj)) {
    if (TASK025_FORBIDDEN_FIELDS.includes(key as any)) {
      return createSafeTask025ValidationError(
        'FORBIDDEN_FIELD',
        `Field "${key}" is forbidden in pilot readiness context.`,
        ['forbidden_field', `field:${key}`],
      );
    }
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      const nestedResult = rejectTask025ForbiddenFields(value as Record<string, unknown>, `${path}.${key}`);
      if (nestedResult) return nestedResult;
    }
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        if (value[i] !== null && typeof value[i] === 'object') {
          const nestedResult = rejectTask025ForbiddenFields(value[i] as Record<string, unknown>, `${path}.${key}[${i}]`);
          if (nestedResult) return nestedResult;
        }
      }
    }
  }
  return null;
}

export function createSafeTask025ValidationError(
  code: string,
  safeMessage: string,
  reasonCodes: string[],
): Task025ValidationError {
  return { valid: false, code, safeMessage, reasonCodes };
}
