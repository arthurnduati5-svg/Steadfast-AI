import { describe, it, expect } from 'vitest';
import {
  TASK028_EXECUTION_STATUSES,
  TASK028_EXECUTION_DECISIONS,
  TASK028_ACTOR_ROLES,
  TASK028_DENIED_ROLES,
  TASK028_CONTROL_ROLES,
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

describe('Task 028 Controlled Expansion Execution Contracts', () => {
  it('should have all execution statuses defined', () => {
    expect(TASK028_EXECUTION_STATUSES).toContain('draft');
    expect(TASK028_EXECUTION_STATUSES).toContain('preflight_pending');
    expect(TASK028_EXECUTION_STATUSES).toContain('ready');
    expect(TASK028_EXECUTION_STATUSES).toContain('active_controlled_expansion');
    expect(TASK028_EXECUTION_STATUSES).toContain('paused');
    expect(TASK028_EXECUTION_STATUSES).toContain('intervention_required');
    expect(TASK028_EXECUTION_STATUSES).toContain('rollback_pending');
    expect(TASK028_EXECUTION_STATUSES).toContain('rolled_back');
    expect(TASK028_EXECUTION_STATUSES).toContain('completed');
    expect(TASK028_EXECUTION_STATUSES).toContain('blocked');
    expect(TASK028_EXECUTION_STATUSES).toContain('cancelled');
    expect(TASK028_EXECUTION_STATUSES.length).toBe(11);
  });

  it('should have all execution decisions defined', () => {
    expect(TASK028_EXECUTION_DECISIONS).toContain('do_not_execute');
    expect(TASK028_EXECUTION_DECISIONS).toContain('prepare_only');
    expect(TASK028_EXECUTION_DECISIONS).toContain('activate_controlled_expansion');
    expect(TASK028_EXECUTION_DECISIONS).toContain('continue_monitoring');
    expect(TASK028_EXECUTION_DECISIONS).toContain('pause_and_fix');
    expect(TASK028_EXECUTION_DECISIONS).toContain('rollback_required');
    expect(TASK028_EXECUTION_DECISIONS).toContain('complete_expansion');
    expect(TASK028_EXECUTION_DECISIONS).toContain('cancel_expansion');
    expect(TASK028_EXECUTION_DECISIONS.length).toBe(8);
  });

  it('should have all actor roles defined', () => {
    expect(TASK028_ACTOR_ROLES).toContain('school_admin');
    expect(TASK028_ACTOR_ROLES).toContain('system_admin');
    expect(TASK028_ACTOR_ROLES).toContain('teacher_assigned_to_expansion');
    expect(TASK028_ACTOR_ROLES).toContain('learner_in_approved_expanded_cohort');
    expect(TASK028_ACTOR_ROLES.length).toBe(13);
  });

  it('should have denied roles that cannot access expansion', () => {
    expect(TASK028_DENIED_ROLES).toContain('unauthenticated');
    expect(TASK028_DENIED_ROLES).toContain('learner_not_in_expanded_cohort');
    expect(TASK028_DENIED_ROLES).toContain('parent');
    expect(TASK028_DENIED_ROLES).toContain('peer');
    expect(TASK028_DENIED_ROLES).toContain('teacher_not_assigned_to_expansion');
    expect(TASK028_DENIED_ROLES.length).toBeGreaterThanOrEqual(8);
  });

  it('should have control roles that can perform actions', () => {
    expect(TASK028_CONTROL_ROLES).toContain('school_admin');
    expect(TASK028_CONTROL_ROLES).toContain('system_admin');
    expect(TASK028_CONTROL_ROLES).toContain('authorized_pilot_coordinator');
    expect(TASK028_CONTROL_ROLES).toContain('authorized_expansion_operator');
    expect(TASK028_CONTROL_ROLES.length).toBe(6);
  });

  it('should have all expanded cohort statuses', () => {
    expect(TASK028_EXPANDED_COHORT_STATUSES).toEqual(['pending', 'activated', 'blocked', 'rolled_back']);
    expect(TASK028_EXPANDED_COHORT_STATUSES.length).toBe(4);
  });

  it('should have all learner access statuses', () => {
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES).toContain('allowed');
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES).toContain('denied_not_in_cohort');
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES).toContain('denied_run_not_active');
    expect(TASK028_EXPANDED_LEARNER_ACCESS_STATUSES.length).toBe(12);
  });

  it('should have all runtime guard statuses', () => {
    expect(TASK028_RUNTIME_GUARD_STATUSES).toContain('passed');
    expect(TASK028_RUNTIME_GUARD_STATUSES).toContain('blocked_school_context');
    expect(TASK028_RUNTIME_GUARD_STATUSES).toContain('blocked_role_scope');
    expect(TASK028_RUNTIME_GUARD_STATUSES).toContain('blocked_privacy');
    expect(TASK028_RUNTIME_GUARD_STATUSES.length).toBeGreaterThanOrEqual(14);
  });

  it('should have valid state transitions defined for every status', () => {
    for (const status of TASK028_EXECUTION_STATUSES) {
      expect(VALID_STATE_TRANSITIONS).toHaveProperty(status);
      expect(Array.isArray(VALID_STATE_TRANSITIONS[status])).toBe(true);
    }
  });

  it('should transition from draft to preflight_pending', () => {
    expect(VALID_STATE_TRANSITIONS.draft).toContain('preflight_pending');
  });

  it('should transition from ready to active_controlled_expansion', () => {
    expect(VALID_STATE_TRANSITIONS.ready).toContain('active_controlled_expansion');
  });

  it('should transition from active_controlled_expansion to paused', () => {
    expect(VALID_STATE_TRANSITIONS.active_controlled_expansion).toContain('paused');
  });

  it('should transition from paused to active_controlled_expansion', () => {
    expect(VALID_STATE_TRANSITIONS.paused).toContain('active_controlled_expansion');
  });

  it('should have blocked and cancelled as terminal states', () => {
    expect(VALID_STATE_TRANSITIONS.blocked).toEqual([]);
    expect(VALID_STATE_TRANSITIONS.cancelled).toEqual([]);
  });

  it('should validate transitions via isValidTransition', () => {
    expect(isValidTransition('draft', 'preflight_pending')).toBe(true);
    expect(isValidTransition('draft', 'ready')).toBe(false);
    expect(isValidTransition('ready', 'active_controlled_expansion')).toBe(true);
    expect(isValidTransition('rolled_back', 'blocked')).toBe(true);
    expect(isValidTransition('completed', 'ready')).toBe(false);
  });

  it('should have all evidence event types', () => {
    expect(TASK028_EVIDENCE_EVENT_TYPES).toContain('expanded_access_allowed');
    expect(TASK028_EVIDENCE_EVENT_TYPES).toContain('rollback_completed');
    expect(TASK028_EVIDENCE_EVENT_TYPES).toContain('daily_summary_generated');
    expect(TASK028_EVIDENCE_EVENT_TYPES).toContain('completion_review_generated');
    expect(TASK028_EVIDENCE_EVENT_TYPES.length).toBeGreaterThanOrEqual(14);
  });

  it('should have all audit event types', () => {
    expect(TASK028_AUDIT_EVENTS).toContain('expansion_run_created');
    expect(TASK028_AUDIT_EVENTS).toContain('cohort_activated');
    expect(TASK028_AUDIT_EVENTS).toContain('rollback_completed');
    expect(TASK028_AUDIT_EVENTS).toContain('report_generated');
    expect(TASK028_AUDIT_EVENTS.length).toBeGreaterThanOrEqual(20);
  });

  it('should have all forbidden fields defined', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawStudentData');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('answerKey');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('providerPrompt');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('chainOfThought');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawSsoToken');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('DATABASE_URL');
    expect(TASK028_FORBIDDEN_FIELDS).toContain('parentEmail');
    expect(TASK028_FORBIDDEN_FIELDS.length).toBeGreaterThanOrEqual(50);
  });

  it('should have all blocker types defined', () => {
    expect(TASK028_BLOCKER_TYPES).toContain('task027_not_found');
    expect(TASK028_BLOCKER_TYPES).toContain('school_not_verified');
    expect(TASK028_BLOCKER_TYPES).toContain('learner_not_in_cohort');
    expect(TASK028_BLOCKER_TYPES).toContain('safeguarding_block');
    expect(TASK028_BLOCKER_TYPES.length).toBeGreaterThanOrEqual(17);
  });

  it('should return ISO string from nowISO', () => {
    const iso = nowISO();
    expect(typeof iso).toBe('string');
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
