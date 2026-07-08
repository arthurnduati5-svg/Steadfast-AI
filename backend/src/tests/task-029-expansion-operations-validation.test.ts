import { describe, it, expect } from 'vitest';
import {
  validateTask029OperationsContext,
  validateTask029Task028DependencyInput,
  validateTask029OperationsPermissionInput,
  validateTask029OperationsDashboardInput,
  validateTask029LearnerOwnStatusInput,
  validateTask029InterventionQueueOperationsInput,
  validateTask029IncidentOperationsInput,
  validateTask029RollbackCommandInput,
  validateTask029ControlActionPreflightInput,
  validateTask029ControlActionInput,
  validateTask029SafeAuditTimelineInput,
  validateTask029EvidenceSummaryInput,
  validateTask029CompletionReviewSummaryInput,
  validateTask029OperationsDiagnosticsInput,
  rejectTask029ForbiddenFields,
  redactTask029SensitiveValue,
  createSafeTask029ValidationError,
} from '../lib/task029ExpansionOperationsValidation';

describe('validateTask029OperationsContext', () => {
  it('should return ok:false with errors when input is null', () => {
    const result = validateTask029OperationsContext(null);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('input_required');
  });

  it('should return ok:false with errors when input is undefined', () => {
    const result = validateTask029OperationsContext(undefined);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('input_required');
  });

  it('should return ok:false with errors when input is not an object', () => {
    const result = validateTask029OperationsContext('string');
    expect(result.ok).toBe(false);
    expect(result.errors).toContain('input_required');
  });

  it('should return errors when schoolId is missing', () => {
    const result = validateTask029OperationsContext({ actorId: 'a', actorRole: 'school_admin' });
    expect(result.errors).toContain('schoolId_required');
  });

  it('should return errors when actorId is missing', () => {
    const result = validateTask029OperationsContext({ schoolId: 's1', actorRole: 'school_admin' });
    expect(result.errors).toContain('actorId_required');
  });

  it('should return errors when actorRole is missing', () => {
    const result = validateTask029OperationsContext({ schoolId: 's1', actorId: 'a1' });
    expect(result.errors).toContain('actorRole_required');
  });

  it('should return error when schoolVerified is not true', () => {
    const result = validateTask029OperationsContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.errors).toContain('school_not_verified');
  });

  it('should return error when task028ProofAccepted is missing', () => {
    const result = validateTask029OperationsContext({ schoolId: 's1', actorId: 'a1', actorRole: 'school_admin', schoolVerified: true });
    expect(result.errors).toContain('task028_proof_missing');
  });

  it('should return cross_school_access_denied when actorSchoolId differs', () => {
    const result = validateTask029OperationsContext({
      schoolId: 'school-a', actorId: 'a1', actorRole: 'admin',
      schoolVerified: true, task028ProofAccepted: true,
      actorSchoolId: 'school-b',
    });
    expect(result.errors).toContain('cross_school_access_denied');
  });

  it('should return ok:true for valid minimal input', () => {
    const result = validateTask029OperationsContext({
      schoolId: 's1', actorId: 'a1', actorRole: 'school_admin',
      schoolVerified: true, task028ProofAccepted: true,
    });
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect forbidden fields in context', () => {
    const result = validateTask029OperationsContext({
      schoolId: 's1', actorId: 'a1', actorRole: 'school_admin',
      schoolVerified: true, task028ProofAccepted: true,
      rawStudentData: 'leak',
    });
    expect(result.errors).toContain('forbidden_field_rawStudentData');
  });
});

describe('validateTask029Task028DependencyInput', () => {
  it('should return input_required for null', () => {
    expect(validateTask029Task028DependencyInput(null)).toEqual(['input_required']);
  });

  it('should return error when requireProof is not boolean', () => {
    const errs = validateTask029Task028DependencyInput({ requireProof: 'yes' });
    expect(errs).toContain('requireProof_must_be_boolean');
  });

  it('should return empty errors for valid input', () => {
    const errs = validateTask029Task028DependencyInput({ requireProof: true });
    expect(errs).toEqual([]);
  });

  it('should detect forbidden fields', () => {
    const errs = validateTask029Task028DependencyInput({ requireProof: false, chainOfThought: 'hidden' });
    expect(errs).toContain('forbidden_field_chainOfThought');
  });
});

describe('validateTask029OperationsPermissionInput', () => {
  it('should reject parent role', () => {
    const errs = validateTask029OperationsPermissionInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'parent',
    });
    expect(errs).toContain('parent_console_request_denied');
  });

  it('should reject peer role', () => {
    const errs = validateTask029OperationsPermissionInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'peer',
    });
    expect(errs).toContain('peer_console_request_denied');
  });
});

describe('validateTask029LearnerOwnStatusInput', () => {
  it('should return learnerSafeRef_required when missing', () => {
    const errs = validateTask029LearnerOwnStatusInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'learner_in_approved_expanded_cohort',
    });
    expect(errs).toContain('learnerSafeRef_required');
  });

  it('should return learner_ref_mismatch_actor_id when ref differs from actorId', () => {
    const errs = validateTask029LearnerOwnStatusInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'a2',
    });
    expect(errs).toContain('learner_ref_mismatch_actor_id');
  });

  it('should not error when learnerSafeRef matches actorId', () => {
    const errs = validateTask029LearnerOwnStatusInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'learner_in_approved_expanded_cohort',
      learnerSafeRef: 'a1',
    });
    expect(errs).not.toContain('learner_ref_mismatch_actor_id');
  });
});

describe('validateTask029ControlActionPreflightInput and ControlActionInput', () => {
  it('should reject staging action in preflight', () => {
    const errs = validateTask029ControlActionPreflightInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'school_admin',
      expansionRunId: 'run1', action: 'staging_rehearsal',
    });
    expect(errs).toContain('staging_rehearsal_not_allowed');
  });

  it('should reject rollout action in control action', () => {
    const errs = validateTask029ControlActionInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'school_admin',
      expansionRunId: 'run1', action: 'rollout_now',
    });
    expect(errs).toContain('rollout_not_allowed');
  });

  it('should reject canary action', () => {
    const errs = validateTask029ControlActionPreflightInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'school_admin',
      expansionRunId: 'run1', action: 'canary_activate',
    });
    expect(errs).toContain('canary_not_allowed');
  });

  it('should reject school_wide action', () => {
    const errs = validateTask029ControlActionPreflightInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'school_admin',
      expansionRunId: 'run1', action: 'school_wide_launch',
    });
    expect(errs).toContain('school_wide_not_allowed');
  });

  it('should accept valid approved action', () => {
    const errs = validateTask029ControlActionPreflightInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'school_admin',
      expansionRunId: 'run1', action: 'pause_expansion',
    });
    expect(errs).not.toContain('unapproved_control_action');
  });
});

describe('validateTask029RollbackCommandInput', () => {
  it('should require rollbackReason', () => {
    const errs = validateTask029RollbackCommandInput({
      schoolId: 's1', actorId: 'a1', actorRole: 'school_admin',
      expansionRunId: 'run1',
    });
    expect(errs).toContain('rollbackReason_required');
  });
});

describe('rejectTask029ForbiddenFields', () => {
  it('should return empty for null', () => {
    expect(rejectTask029ForbiddenFields(null)).toEqual([]);
  });

  it('should detect forbidden field names', () => {
    const result = rejectTask029ForbiddenFields({ rawStudentData: 'x', safeField: 'y' });
    expect(result).toEqual(['rawStudentData']);
  });

  it('should detect multiple forbidden fields', () => {
    const result = rejectTask029ForbiddenFields({ rawStudentData: 'x', apiKey: 'y', safeField: 'z' });
    expect(result).toContain('rawStudentData');
    expect(result).toContain('apiKey');
  });
});

describe('redactTask029SensitiveValue', () => {
  it('should return [REDACTED] for any value', () => {
    expect(redactTask029SensitiveValue('secret')).toBe('[REDACTED]');
  });

  it('should return [REDACTED] for null', () => {
    expect(redactTask029SensitiveValue(null)).toBe('[REDACTED]');
  });

  it('should return [REDACTED] for undefined', () => {
    expect(redactTask029SensitiveValue(undefined)).toBe('[REDACTED]');
  });
});

describe('createSafeTask029ValidationError', () => {
  it('should return structured error with fixed nextAction', () => {
    const err = createSafeTask029ValidationError('Bad Input', 'Field X is missing', ['field_x_missing']);
    expect(err).toEqual({
      title: 'Bad Input',
      message: 'Field X is missing',
      reasonCodes: ['field_x_missing'],
      nextAction: 'review_validation_errors_and_resubmit',
    });
  });
});
