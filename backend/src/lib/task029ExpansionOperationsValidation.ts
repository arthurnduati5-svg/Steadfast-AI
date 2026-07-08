import {
  TASK029_FORBIDDEN_FIELDS,
  TASK029_OPERATION_ACTIONS,
  resolveExpansionOpsRole,
} from '../contracts/task029ExpansionOperationsContracts';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isApprovedControlAction(action: string): boolean {
  return (TASK029_OPERATION_ACTIONS as readonly string[]).includes(action);
}

function checkActionRestrictions(action: string, errors: string[]): void {
  if (!action) return;
  if (!isApprovedControlAction(action)) {
    errors.push('unapproved_control_action');
  }
  const a = action.toLowerCase();
  if (a.includes('staging') || a.includes('rehearsal')) {
    errors.push('staging_rehearsal_not_allowed');
  }
  if (a.startsWith('canary') || a.includes('canary')) {
    errors.push('canary_not_allowed');
  }
  if (a.startsWith('rollout') || a.includes('rollout')) {
    errors.push('rollout_not_allowed');
  }
  if (a.includes('school_wide') || a.includes('schoolwide')) {
    errors.push('school_wide_not_allowed');
  }
}

function checkRoleRestrictions(actorRole: string, contextLabel: string, errors: string[]): void {
  const raw = (actorRole || '').toLowerCase();
  if (raw === 'parent') { errors.push('parent_console_request_denied'); return; }
  if (raw === 'peer') { errors.push('peer_console_request_denied'); return; }
  const resolved = resolveExpansionOpsRole(actorRole);
  if (resolved === 'unknown') { errors.push('role_not_permitted'); return; }
  if (resolved === 'learner_in_approved_expanded_cohort' && contextLabel !== 'learner_own_status') {
    errors.push('learner_console_request_denied');
  }
  if (
    (resolved === 'teacher_assigned_to_expansion' || resolved === 'teacher_assigned_to_pilot') &&
    contextLabel !== 'teacher_oversight'
  ) {
    errors.push('teacher_outside_expansion_scope');
  }
}

function collectForbiddenFieldErrors(obj: any, errors: string[]): void {
  const forbidden = rejectTask029ForbiddenFields(obj);
  for (const f of forbidden) {
    errors.push(`forbidden_field_${f}`);
  }
}

// ---------------------------------------------------------------------------
// Primary validators
// ---------------------------------------------------------------------------

export function validateTask029OperationsContext(ctx: any): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!ctx || typeof ctx !== 'object') return { ok: false, errors: ['input_required'] };
  if (!ctx.schoolId) errors.push('schoolId_required');
  if (!ctx.actorId) errors.push('actorId_required');
  if (!ctx.actorRole) errors.push('actorRole_required');
  if (ctx.schoolVerified !== true) errors.push('school_not_verified');
  if (!ctx.task028ProofAccepted) errors.push('task028_proof_missing');
  if (ctx.actorSchoolId && ctx.schoolId && ctx.actorSchoolId !== ctx.schoolId) {
    errors.push('cross_school_access_denied');
  }
  collectForbiddenFieldErrors(ctx, errors);
  return { ok: errors.length === 0, errors };
}

export function validateTask029Task028DependencyInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (typeof input.requireProof !== 'boolean') errors.push('requireProof_must_be_boolean');
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029OperationsPermissionInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  checkRoleRestrictions(input.actorRole, 'permissions', errors);
  if (input.actorSchoolId && input.schoolId && input.actorSchoolId !== input.schoolId) {
    errors.push('cross_school_access_denied');
  }
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029OperationsDashboardInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  checkRoleRestrictions(input.actorRole, 'dashboard', errors);
  if (input.actorSchoolId && input.schoolId && input.actorSchoolId !== input.schoolId) {
    errors.push('cross_school_access_denied');
  }
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029LearnerOwnStatusInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.learnerSafeRef) errors.push('learnerSafeRef_required');
  if (input.learnerSafeRef && input.actorId && input.learnerSafeRef !== input.actorId) {
    errors.push('learner_ref_mismatch_actor_id');
  }
  checkRoleRestrictions(input.actorRole, 'learner_own_status', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029InterventionQueueOperationsInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.expansionRunId) errors.push('expansionRunId_required');
  checkRoleRestrictions(input.actorRole, 'intervention_queue', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029IncidentOperationsInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.expansionRunId) errors.push('expansionRunId_required');
  checkRoleRestrictions(input.actorRole, 'incident_panel', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029RollbackCommandInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.expansionRunId) errors.push('expansionRunId_required');
  if (!input.rollbackReason) errors.push('rollbackReason_required');
  checkRoleRestrictions(input.actorRole, 'rollback', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029ControlActionPreflightInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.expansionRunId) errors.push('expansionRunId_required');
  if (!input.action) errors.push('action_required');
  checkActionRestrictions(input.action, errors);
  checkRoleRestrictions(input.actorRole, 'control_action', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029ControlActionInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.expansionRunId) errors.push('expansionRunId_required');
  if (!input.action) errors.push('action_required');
  checkActionRestrictions(input.action, errors);
  checkRoleRestrictions(input.actorRole, 'control_action', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029SafeAuditTimelineInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.expansionRunId) errors.push('expansionRunId_required');
  checkRoleRestrictions(input.actorRole, 'audit_timeline', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029EvidenceSummaryInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.expansionRunId) errors.push('expansionRunId_required');
  checkRoleRestrictions(input.actorRole, 'evidence', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029CompletionReviewSummaryInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  if (!input.expansionRunId) errors.push('expansionRunId_required');
  checkRoleRestrictions(input.actorRole, 'completion_review', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

export function validateTask029OperationsDiagnosticsInput(input: any): string[] {
  const errors: string[] = [];
  if (!input || typeof input !== 'object') return ['input_required'];
  if (!input.schoolId) errors.push('schoolId_required');
  if (!input.actorId) errors.push('actorId_required');
  if (!input.actorRole) errors.push('actorRole_required');
  checkRoleRestrictions(input.actorRole, 'diagnostics', errors);
  collectForbiddenFieldErrors(input, errors);
  return errors;
}

// ---------------------------------------------------------------------------
// Shared guards
// ---------------------------------------------------------------------------

export function rejectTask029ForbiddenFields(obj: any): string[] {
  if (!obj || typeof obj !== 'object') return [];
  const forbiddenSet = new Set<string>(TASK029_FORBIDDEN_FIELDS as unknown as string[]);
  return Object.keys(obj).filter(k => forbiddenSet.has(k));
}

export function redactTask029SensitiveValue(val: any): string {
  if (val === null || val === undefined) return '[REDACTED]';
  return '[REDACTED]';
}

export function createSafeTask029ValidationError(
  title: string,
  message: string,
  reasonCodes: string[],
): { title: string; message: string; reasonCodes: string[]; nextAction: string } {
  return {
    title,
    message,
    reasonCodes,
    nextAction: 'review_validation_errors_and_resubmit',
  };
}
