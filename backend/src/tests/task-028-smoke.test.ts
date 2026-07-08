import { describe, it, expect } from 'vitest';
import {
  TASK028_EXECUTION_STATUSES,
  TASK028_EXECUTION_DECISIONS,
  TASK028_ACTOR_ROLES,
  TASK028_EXPANDED_COHORT_STATUSES,
  TASK028_EXPANDED_LEARNER_ACCESS_STATUSES,
  TASK028_TEACHER_OVERSIGHT_STATUSES,
  TASK028_RUNTIME_GUARD_STATUSES,
  TASK028_HEALTH_SNAPSHOT_STATUSES,
  TASK028_INTERVENTION_QUEUE_STATUSES,
  TASK028_INCIDENT_SEVERITIES,
  TASK028_ROLLBACK_STATUSES,
  TASK028_EVIDENCE_EVENT_TYPES,
  TASK028_DEPENDENCY_GATE_STATUSES,
  TASK028_RISK_LEVELS,
  TASK028_BLOCKER_TYPES,
  TASK028_AUDIT_EVENTS,
  TASK028_FORBIDDEN_FIELDS,
  VALID_STATE_TRANSITIONS,
  isValidTransition,
  nowISO,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028ExecutionContext,
  validateTask028Task027DependencyGateInput,
  validateTask028ControlledExpansionRunInput,
  validateTask028ExpansionStateTransitionInput,
  validateTask028ExpandedCohortActivationInput,
  validateTask028ExpandedLearnerAccessGateInput,
  validateTask028ExpandedRuntimeGuardInput,
  validateTask028TeacherOversightInput,
  validateTask028ExpansionMonitoringEventInput,
  validateTask028ExpansionHealthSnapshotInput,
  validateTask028InterventionQueueInput,
  validateTask028IncidentBridgeInput,
  validateTask028RollbackExecutionInput,
  validateTask028ExpansionEvidenceEventInput,
  validateTask028DailyExpansionSummaryInput,
  validateTask028ExpansionCompletionReviewInput,
  rejectTask028ForbiddenFields,
  redactTask028SensitiveValue,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

describe('Task 028 - Smoke Tests', () => {
  it('exports all contract constants', () => {
    expect(TASK028_EXECUTION_STATUSES).toBeDefined();
    expect(TASK028_EXECUTION_DECISIONS).toBeDefined();
    expect(TASK028_ACTOR_ROLES).toBeDefined();
    expect(TASK028_EXPANDED_COHORT_STATUSES).toBeDefined();
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES).toBeDefined();
    expect(TASK028_TEACHER_OVERSIGHT_STATUSES).toBeDefined();
    expect(TASK028_RUNTIME_GUARD_STATUSES).toBeDefined();
    expect(TASK028_HEALTH_SNAPSHOT_STATUSES).toBeDefined();
    expect(TASK028_INTERVENTION_QUEUE_STATUSES).toBeDefined();
    expect(TASK028_INCIDENT_SEVERITIES).toBeDefined();
    expect(TASK028_ROLLBACK_STATUSES).toBeDefined();
    expect(TASK028_EVIDENCE_EVENT_TYPES).toBeDefined();
    expect(TASK028_DEPENDENCY_GATE_STATUSES).toBeDefined();
    expect(TASK028_RISK_LEVELS).toBeDefined();
    expect(TASK028_BLOCKER_TYPES).toBeDefined();
    expect(TASK028_AUDIT_EVENTS).toBeDefined();
    expect(TASK028_FORBIDDEN_FIELDS).toBeDefined();
    expect(VALID_STATE_TRANSITIONS).toBeDefined();
  });

  it('isValidTransition works', () => {
    expect(isValidTransition('draft', 'preflight_pending')).toBe(true);
    expect(isValidTransition('active_controlled_expansion', 'completed')).toBe(true);
  });

  it('nowISO returns ISO string', () => {
    const iso = nowISO();
    expect(() => new Date(iso)).not.toThrow();
  });

  it('exports all validation functions', () => {
    expect(validateTask028ExecutionContext).toBeDefined();
    expect(validateTask028Task027DependencyGateInput).toBeDefined();
    expect(validateTask028ControlledExpansionRunInput).toBeDefined();
    expect(validateTask028ExpansionStateTransitionInput).toBeDefined();
    expect(validateTask028ExpandedCohortActivationInput).toBeDefined();
    expect(validateTask028ExpandedLearnerAccessGateInput).toBeDefined();
    expect(validateTask028ExpandedRuntimeGuardInput).toBeDefined();
    expect(validateTask028TeacherOversightInput).toBeDefined();
    expect(validateTask028ExpansionMonitoringEventInput).toBeDefined();
    expect(validateTask028ExpansionHealthSnapshotInput).toBeDefined();
    expect(validateTask028InterventionQueueInput).toBeDefined();
    expect(validateTask028IncidentBridgeInput).toBeDefined();
    expect(validateTask028RollbackExecutionInput).toBeDefined();
    expect(validateTask028ExpansionEvidenceEventInput).toBeDefined();
    expect(validateTask028DailyExpansionSummaryInput).toBeDefined();
    expect(validateTask028ExpansionCompletionReviewInput).toBeDefined();
    expect(rejectTask028ForbiddenFields).toBeDefined();
    expect(redactTask028SensitiveValue).toBeDefined();
    expect(createSafeTask028ValidationError).toBeDefined();
  });

  it('validation rejects missing inputs', () => {
    expect(validateTask028ExecutionContext({}).length).toBeGreaterThan(0);
    expect(validateTask028ControlledExpansionRunInput({}).length).toBeGreaterThan(0);
    expect(validateTask028ExpandedCohortActivationInput({}).length).toBeGreaterThan(0);
    expect(validateTask028RollbackExecutionInput({}).length).toBeGreaterThan(0);
  });

  it('forbidden fields are rejected by validation', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawLearnerData: 'test' }, errors);
    expect(errors).toContain('forbidden_field_rawLearnerData');
  });

  it('redact masks sensitive values', () => {
    expect(redactTask028SensitiveValue('test')).toBe('****');
    expect(redactTask028SensitiveValue('')).toBe('****');
  });

  it('safe validation error returns correct shape', () => {
    const err = createSafeTask028ValidationError('blocked', ['reason1']);
    expect(err.ok).toBe(false);
    expect(err.safeMessage).toBe('blocked');
    expect(err.reasonCodes).toContain('reason1');
  });

  it('cohort activation rejects empty cohort IDs', () => {
    const errors = validateTask028ExpandedCohortActivationInput({
      runId: 'r1', schoolId: 's1',
      cohortIds: [], learnerSafeRefs: [],
    });
    expect(errors).toContain('cohortIds_required');
  });

  it('state transition rejects invalid transitions', () => {
    const errors = validateTask028ExpansionStateTransitionInput({
      runId: 'r1', fromStatus: 'completed', toStatus: 'active_controlled_expansion',
      actorRole: 'admin', actorId: 'u1',
    });
    expect(errors).toContain('invalid_transition_completed_to_active_controlled_expansion');
  });
});
