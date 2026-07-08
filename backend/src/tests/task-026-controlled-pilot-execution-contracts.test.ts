import { describe, it, expect } from 'vitest';
import {
  TASK026_EXECUTION_MODES, TASK026_EXECUTION_STATUSES, TASK026_EXECUTION_DECISIONS,
  TASK026_EXECUTION_ACTOR_ROLES, TASK026_EXECUTION_CONTROL_ACTIONS, TASK026_EXECUTION_GATE_STATUSES,
  TASK026_LEARNER_ACCESS_STATUSES, TASK026_TEACHER_MONITOR_STATUSES, TASK026_COHORT_EXECUTION_STATUSES,
  TASK026_EVIDENCE_EVENT_TYPES, TASK026_INCIDENT_SEVERITIES, TASK026_PAUSE_REASONS,
  TASK026_ROLLBACK_REASONS, TASK026_SAFEGUARDING_SIGNAL_TYPES, TASK026_DEPENDENCY_GATE_STATUSES,
  TASK026_RISK_LEVELS, TASK026_BLOCKER_TYPES, TASK026_AUDIT_EVENTS, TASK026_FORBIDDEN_FIELDS,
  TASK026_ALLOWED_HIGH_CONTROL_ROLES, TASK026_ALLOWED_MONITORING_ROLES, TASK026_ALLOWED_LEARNER_ROLES,
  TASK026_DENIED_ROLES, TASK026_INCIDENT_RECOMMENDED_ACTIONS, ALLOWED_EXECUTION_TRANSITIONS,
} from '../contracts/task026ControlledPilotExecutionContracts';

describe('task026ControlledPilotExecutionContracts', () => {
  it('should define exactly one execution mode: controlled_pilot', () => {
    expect(TASK026_EXECUTION_MODES).toEqual(['controlled_pilot']);
  });

  it('should define all 10 execution statuses', () => {
    expect(TASK026_EXECUTION_STATUSES).toContain('draft');
    expect(TASK026_EXECUTION_STATUSES).toContain('preflight_pending');
    expect(TASK026_EXECUTION_STATUSES).toContain('ready');
    expect(TASK026_EXECUTION_STATUSES).toContain('active_controlled');
    expect(TASK026_EXECUTION_STATUSES).toContain('paused');
    expect(TASK026_EXECUTION_STATUSES).toContain('rollback_pending');
    expect(TASK026_EXECUTION_STATUSES).toContain('rolled_back');
    expect(TASK026_EXECUTION_STATUSES).toContain('completed');
    expect(TASK026_EXECUTION_STATUSES).toContain('blocked');
    expect(TASK026_EXECUTION_STATUSES).toContain('cancelled');
    expect(TASK026_EXECUTION_STATUSES.length).toBe(10);
  });

  it('should define all 6 execution decisions', () => {
    expect(TASK026_EXECUTION_DECISIONS).toContain('accept');
    expect(TASK026_EXECUTION_DECISIONS).toContain('reject');
    expect(TASK026_EXECUTION_DECISIONS).toContain('pause');
    expect(TASK026_EXECUTION_DECISIONS).toContain('resume');
    expect(TASK026_EXECUTION_DECISIONS).toContain('rollback');
    expect(TASK026_EXECUTION_DECISIONS).toContain('cancel');
    expect(TASK026_EXECUTION_DECISIONS.length).toBe(6);
  });

  it('should define all actor roles', () => {
    expect(TASK026_EXECUTION_ACTOR_ROLES).toContain('school_admin');
    expect(TASK026_EXECUTION_ACTOR_ROLES).toContain('system_admin');
    expect(TASK026_EXECUTION_ACTOR_ROLES).toContain('internal_operator');
    expect(TASK026_EXECUTION_ACTOR_ROLES).toContain('authorized_pilot_coordinator');
    expect(TASK026_EXECUTION_ACTOR_ROLES).toContain('teacher_assigned_to_pilot');
    expect(TASK026_EXECUTION_ACTOR_ROLES).toContain('learner_in_approved_pilot_cohort');
    expect(TASK026_EXECUTION_ACTOR_ROLES.length).toBe(6);
  });

  it('should define control actions', () => {
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).toContain('create_run');
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).toContain('activate_run');
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).toContain('pause_run');
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).toContain('resume_run');
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).toContain('request_rollback');
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).toContain('complete_rollback');
    expect(TASK026_EXECUTION_CONTROL_ACTIONS).toContain('cancel_run');
    expect(TASK026_EXECUTION_CONTROL_ACTIONS.length).toBe(15);
  });

  it('should define learner access statuses', () => {
    expect(TASK026_LEARNER_ACCESS_STATUSES).toContain('access_allowed');
    expect(TASK026_LEARNER_ACCESS_STATUSES).toContain('access_denied_no_school');
    expect(TASK026_LEARNER_ACCESS_STATUSES).toContain('access_denied_not_in_cohort');
    expect(TASK026_LEARNER_ACCESS_STATUSES).toContain('access_denied_pilot_not_active');
    expect(TASK026_LEARNER_ACCESS_STATUSES.length).toBe(11);
  });

  it('should define forbidden fields list', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawStudentData');
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawLearnerData');
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawSafeguardingNote');
    expect(TASK026_FORBIDDEN_FIELDS).toContain('privateDeenText');
    expect(TASK026_FORBIDDEN_FIELDS).toContain('answerKey');
    expect(TASK026_FORBIDDEN_FIELDS).toContain('chainOfThought');
    expect(TASK026_FORBIDDEN_FIELDS).toContain('productionDeploymentCommand');
    expect(TASK026_FORBIDDEN_FIELDS).toContain('liveAiProviderPayload');
    expect(TASK026_FORBIDDEN_FIELDS.length).toBeGreaterThan(40);
  });

  it('should define denied roles', () => {
    expect(TASK026_DENIED_ROLES).toContain('unauthenticated');
    expect(TASK026_DENIED_ROLES).toContain('parent');
    expect(TASK026_DENIED_ROLES).toContain('peer');
    expect(TASK026_DENIED_ROLES).toContain('cross_school_actor');
    expect(TASK026_DENIED_ROLES).toContain('teacher_not_assigned_to_pilot');
  });

  it('should define ALLOWED_EXECUTION_TRANSITIONS correctly', () => {
    expect(ALLOWED_EXECUTION_TRANSITIONS.draft).toContain('preflight_pending');
    expect(ALLOWED_EXECUTION_TRANSITIONS.draft).toContain('blocked');
    expect(ALLOWED_EXECUTION_TRANSITIONS.ready).toContain('active_controlled');
    expect(ALLOWED_EXECUTION_TRANSITIONS.ready).toContain('cancelled');
    expect(ALLOWED_EXECUTION_TRANSITIONS.active_controlled).toContain('paused');
    expect(ALLOWED_EXECUTION_TRANSITIONS.active_controlled).toContain('completed');
    expect(ALLOWED_EXECUTION_TRANSITIONS.paused).toContain('active_controlled');
    expect(ALLOWED_EXECUTION_TRANSITIONS.rollback_pending).toContain('rolled_back');
    expect(ALLOWED_EXECUTION_TRANSITIONS.blocked).toEqual([]);
    expect(ALLOWED_EXECUTION_TRANSITIONS.cancelled).toEqual([]);
  });

  it('should define incident recommended actions', () => {
    expect(TASK026_INCIDENT_RECOMMENDED_ACTIONS).toContain('continue_monitoring');
    expect(TASK026_INCIDENT_RECOMMENDED_ACTIONS).toContain('manual_review');
    expect(TASK026_INCIDENT_RECOMMENDED_ACTIONS).toContain('pause_pilot');
    expect(TASK026_INCIDENT_RECOMMENDED_ACTIONS).toContain('rollback_pilot');
    expect(TASK026_INCIDENT_RECOMMENDED_ACTIONS).toContain('block_execution');
    expect(TASK026_INCIDENT_RECOMMENDED_ACTIONS.length).toBe(5);
  });
});
