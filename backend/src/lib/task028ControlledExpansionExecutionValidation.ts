import {
  TASK028_FORBIDDEN_FIELDS,
  TASK028_EXECUTION_STATUSES,
  TASK028_ACTOR_ROLES,
  TASK028_EXPANDED_COHORT_STATUSES,
  TASK028_INTERVENTION_QUEUE_STATUSES,
  TASK028_INCIDENT_SEVERITIES,
  TASK028_ROLLBACK_STATUSES,
  TASK028_EVIDENCE_EVENT_TYPES,
  TASK028_RISK_LEVELS,
  VALID_STATE_TRANSITIONS,
  TASK028_DENIED_ROLES,
  nowISO,
} from '../contracts/task028ControlledExpansionExecutionContracts';

export function validateTask028ExecutionContext(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (input.schoolVerified !== true) errors.push('school_not_verified');
  if (input.actorRole && TASK028_DENIED_ROLES.includes(input.actorRole)) {
    errors.push('role_not_permitted');
  }
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028Task027DependencyGateInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.proposalId) errors.push('proposalId_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ApprovedExpansionPlanInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.proposalId) errors.push('proposalId_required');
  if (!input.governanceDecisionId) errors.push('governanceDecisionId_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ControlledExpansionRunInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.proposalId) errors.push('proposalId_required');
  if (!input.governanceDecisionId) errors.push('governanceDecisionId_required');
  if (!input.pilotRunId) errors.push('pilotRunId_required');
  if (!input.approvedPlan) errors.push('approvedPlan_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.actorId) errors.push('actorId_required');
  if (input.actorRole && TASK028_DENIED_ROLES.includes(input.actorRole)) {
    errors.push('role_not_permitted_for_run');
  }
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ExpansionStateTransitionInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.fromStatus) errors.push('fromStatus_required');
  if (!input.toStatus) errors.push('toStatus_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.actorId) errors.push('actorId_required');
  if (input.fromStatus && input.toStatus) {
    if (!isValidTransition(input.fromStatus, input.toStatus)) {
      errors.push(`invalid_transition_${input.fromStatus}_to_${input.toStatus}`);
    }
  }
  if (input.toStatus && !TASK028_EXECUTION_STATUSES.includes(input.toStatus)) {
    errors.push(`unknown_status_${input.toStatus}`);
  }
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ExpandedCohortActivationInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.cohortIds || !Array.isArray(input.cohortIds) || input.cohortIds.length === 0) {
    errors.push('cohortIds_required');
  }
  if (!input.learnerSafeRefs || !Array.isArray(input.learnerSafeRefs)) {
    errors.push('learnerSafeRefs_required');
  }
  if (input.cohortIds && Array.isArray(input.cohortIds) && input.cohortIds.length > 50) {
    errors.push('cohort_set_too_large_no_school_wide');
  }
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ExpandedLearnerAccessGateInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.learnerId) errors.push('learnerId_required');
  if (!input.runId) errors.push('runId_required');
  if (!input.requestType) errors.push('requestType_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ExpandedRuntimeGuardInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.runId) errors.push('runId_required');
  if (!input.action) errors.push('action_required');
  if (input.actorRole && TASK028_DENIED_ROLES.includes(input.actorRole)) {
    errors.push('role_not_permitted');
  }
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028TeacherOversightInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.teacherId) errors.push('teacherId_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ExpansionMonitoringEventInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.eventType) errors.push('eventType_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.safeSummary) errors.push('safeSummary_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ExpansionHealthSnapshotInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028InterventionQueueInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.interventionReason) errors.push('interventionReason_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.safeSummary) errors.push('safeSummary_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028IncidentBridgeInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.severity) errors.push('severity_required');
  if (input.severity && !TASK028_INCIDENT_SEVERITIES.includes(input.severity)) {
    errors.push(`unknown_severity_${input.severity}`);
  }
  if (!input.safeSummary) errors.push('safeSummary_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028RollbackExecutionInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.reason) errors.push('reason_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ExpansionEvidenceEventInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.eventType) errors.push('eventType_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.actorId) errors.push('actorId_required');
  rejectTask028ForbiddenFields(input, errors);
  if (input.safeMetadata) {
    rejectTask028ForbiddenFields(input.safeMetadata, errors);
  }
  return errors;
}

export function validateTask028DailyExpansionSummaryInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function validateTask028ExpansionCompletionReviewInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.runId) errors.push('runId_required');
  if (!input.schoolId) errors.push('schoolId_required');
  rejectTask028ForbiddenFields(input, errors);
  return errors;
}

export function rejectTask028ForbiddenFields(obj: any, errors: string[]): void {
  if (!obj || typeof obj !== 'object') return;
  for (const key of Object.keys(obj)) {
    if (TASK028_FORBIDDEN_FIELDS.includes(key as any)) {
      errors.push(`forbidden_field_${key}`);
    }
  }
}

export function redactTask028SensitiveValue(value: string): string {
  if (typeof value !== 'string') return String(value);
  if (value.length <= 4) return '****';
  return value.substring(0, 2) + '****' + value.substring(value.length - 2);
}

export function createSafeTask028ValidationError(message: string, reasonCodes: string[]): { ok: false; safeMessage: string; reasonCodes: string[] } {
  return {
    ok: false,
    safeMessage: message,
    reasonCodes,
  };
}

export function isValidTransition(from: string, to: string): boolean {
  const allowed = VALID_STATE_TRANSITIONS[from];
  return !!allowed && allowed.includes(to);
}
