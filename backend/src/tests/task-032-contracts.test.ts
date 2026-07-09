import { describe, it, expect } from 'vitest';
import {
  TASK032_ALLOWED_ENVIRONMENT_TYPES,
  TASK032_FORBIDDEN_ENVIRONMENT_TYPES,
  TASK032_ALLOWED_ACTIVATION_MODES,
  TASK032_FORBIDDEN_ACTIVATION_MODES,
  TASK032_ALLOWED_DATA_MODES,
  TASK032_FORBIDDEN_DATA_MODES,
  TASK032_ALLOWED_SIDE_EFFECT_MODES,
  TASK032_FORBIDDEN_SIDE_EFFECT_MODES,
  TASK032_ALLOWED_REAL_ACTOR_ROLES,
  TASK032_DENIED_REAL_ACTOR_ROLES,
  TASK032_SYNTHETIC_ROLES,
  TASK032_CANARY_STAGE_IDS,
  TASK032_CONTROL_ACTION_IDS,
  TASK032_FORBIDDEN_OUTPUT_FIELDS,
  TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK032_REQUIRED_DEPENDENCY_COMMITS,
  TASK032_VALID_STATE_TRANSITIONS,
  resolveTask032ActorRole,
  isTask032AdminOperatorRole,
  isTask032DeniedRealRole,
  createTask032SafeId,
  getTask032RequiredStageIds,
  calculateTask032CanaryActivationDecision,
  isTask032ValidStateTransition,
} from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 Activation Contracts - Constants', () => {
  it('should have exactly one allowed environment type: controlled_canary', () => {
    expect(TASK032_ALLOWED_ENVIRONMENT_TYPES).toEqual(['controlled_canary']);
    expect(TASK032_ALLOWED_ENVIRONMENT_TYPES.length).toBe(1);
  });

  it('should have two forbidden environment types', () => {
    expect(TASK032_FORBIDDEN_ENVIRONMENT_TYPES).toContain('production_uncontrolled');
    expect(TASK032_FORBIDDEN_ENVIRONMENT_TYPES).toContain('live_unverified');
    expect(TASK032_FORBIDDEN_ENVIRONMENT_TYPES.length).toBe(2);
  });

  it('should have exactly one allowed activation mode: internal_controlled_activation', () => {
    expect(TASK032_ALLOWED_ACTIVATION_MODES).toEqual(['internal_controlled_activation']);
  });

  it('should have three forbidden activation modes', () => {
    expect(TASK032_FORBIDDEN_ACTIVATION_MODES).toContain('live_external_activation');
    expect(TASK032_FORBIDDEN_ACTIVATION_MODES).toContain('broad_rollout');
    expect(TASK032_FORBIDDEN_ACTIVATION_MODES).toContain('school_wide');
    expect(TASK032_FORBIDDEN_ACTIVATION_MODES.length).toBe(3);
  });

  it('should have exactly one allowed data mode: approved_canary_fixture', () => {
    expect(TASK032_ALLOWED_DATA_MODES).toEqual(['approved_canary_fixture']);
  });

  it('should have two forbidden data modes', () => {
    expect(TASK032_FORBIDDEN_DATA_MODES).toContain('raw_live_student_payload');
    expect(TASK032_FORBIDDEN_DATA_MODES).toContain('production_roster_payload');
  });

  it('should have exactly one allowed side effect mode: internal_state_only', () => {
    expect(TASK032_ALLOWED_SIDE_EFFECT_MODES).toEqual(['internal_state_only']);
  });

  it('should have four forbidden side effect modes', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_MODES).toContain('external_write');
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_MODES).toContain('send_notifications');
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_MODES).toContain('call_live_ai');
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_MODES).toContain('connector_write');
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_MODES.length).toBe(4);
  });

  it('TASK032_ALLOWED_REAL_ACTOR_ROLES should contain admin and operator roles', () => {
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).toContain('school_admin');
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).toContain('system_admin');
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).toContain('internal_operator');
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).toContain('authorized_canary_operator');
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).toContain('operations_reviewer');
  });

  it('TASK032_ALLOWED_REAL_ACTOR_ROLES should not contain denied roles', () => {
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).not.toContain('student');
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).not.toContain('teacher');
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).not.toContain('parent');
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).not.toContain('peer');
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).not.toContain('unknown');
    expect(TASK032_ALLOWED_REAL_ACTOR_ROLES).not.toContain('anonymous');
  });

  it('TASK032_DENIED_REAL_ACTOR_ROLES should contain student teacher parent peer unknown anonymous', () => {
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('student');
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('learner');
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('teacher');
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('parent');
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('peer');
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('unknown');
    expect(TASK032_DENIED_REAL_ACTOR_ROLES).toContain('anonymous');
    expect(TASK032_DENIED_REAL_ACTOR_ROLES.length).toBe(7);
  });

  it('TASK032_SYNTHETIC_ROLES should contain three synthetic roles', () => {
    expect(TASK032_SYNTHETIC_ROLES).toEqual(['synthetic_admin', 'synthetic_operator', 'synthetic_reviewer']);
  });

  it('TASK032_CANARY_STAGE_IDS should have 14 stages', () => {
    expect(TASK032_CANARY_STAGE_IDS.length).toBe(14);
    expect(TASK032_CANARY_STAGE_IDS[0]).toBe('task031_dependency_check');
    expect(TASK032_CANARY_STAGE_IDS).toContain('environment_gate');
    expect(TASK032_CANARY_STAGE_IDS).toContain('runtime_guard');
    expect(TASK032_CANARY_STAGE_IDS).toContain('activation_state_machine');
    expect(TASK032_CANARY_STAGE_IDS).toContain('evidence_ledger');
    expect(TASK032_CANARY_STAGE_IDS).toContain('report_generation');
  });

  it('TASK032_CONTROL_ACTION_IDS should contain five allowed actions', () => {
    expect(TASK032_CONTROL_ACTION_IDS).toContain('pause_internal_canary');
    expect(TASK032_CONTROL_ACTION_IDS).toContain('resume_internal_canary');
    expect(TASK032_CONTROL_ACTION_IDS).toContain('enable_internal_kill_switch');
    expect(TASK032_CONTROL_ACTION_IDS).toContain('disable_internal_kill_switch');
    expect(TASK032_CONTROL_ACTION_IDS).toContain('request_internal_rollback');
    expect(TASK032_CONTROL_ACTION_IDS.length).toBe(5);
  });

  it('TASK032_FORBIDDEN_OUTPUT_FIELDS should block private student data fields', () => {
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('studentName');
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('studentEmail');
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('studentPhone');
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('parentName');
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('rawLearnerData');
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('rawChat');
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS).toContain('privateDeenText');
    expect(TASK032_FORBIDDEN_OUTPUT_FIELDS.length).toBeGreaterThan(10);
  });

  it('TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS should block live side effects', () => {
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendEmail');
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('sendSms');
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('callLiveAi');
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('deployProduction');
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('schoolWideEnable');
    expect(TASK032_FORBIDDEN_SIDE_EFFECT_PATTERNS.length).toBe(10);
  });

  it('TASK032_REQUIRED_DEPENDENCY_COMMITS should include bfcf5af', () => {
    expect(TASK032_REQUIRED_DEPENDENCY_COMMITS).toContain('bfcf5af');
    expect(TASK032_REQUIRED_DEPENDENCY_COMMITS.length).toBe(1);
  });
});

describe('Task 032 Activation Contracts - Functions', () => {
  it('resolveTask032ActorRole should resolve all allowed admin roles', () => {
    expect(resolveTask032ActorRole('school_admin')).toBe('school_admin');
    expect(resolveTask032ActorRole('system_admin')).toBe('system_admin');
    expect(resolveTask032ActorRole('internal_operator')).toBe('internal_operator');
    expect(resolveTask032ActorRole('authorized_canary_operator')).toBe('authorized_canary_operator');
    expect(resolveTask032ActorRole('operations_reviewer')).toBe('operations_reviewer');
  });

  it('resolveTask032ActorRole should resolve all denied roles', () => {
    expect(resolveTask032ActorRole('student')).toBe('student');
    expect(resolveTask032ActorRole('learner')).toBe('learner');
    expect(resolveTask032ActorRole('teacher')).toBe('teacher');
    expect(resolveTask032ActorRole('parent')).toBe('parent');
    expect(resolveTask032ActorRole('peer')).toBe('peer');
    expect(resolveTask032ActorRole('anonymous')).toBe('anonymous');
  });

  it('resolveTask032ActorRole should default to unknown for unrecognized roles', () => {
    expect(resolveTask032ActorRole('')).toBe('unknown');
    expect(resolveTask032ActorRole('super_admin')).toBe('unknown');
    expect(resolveTask032ActorRole('principal')).toBe('unknown');
  });

  it('resolveTask032ActorRole should be case-insensitive', () => {
    expect(resolveTask032ActorRole('SCHOOL_ADMIN')).toBe('school_admin');
    expect(resolveTask032ActorRole('Student')).toBe('student');
    expect(resolveTask032ActorRole('TEACHER')).toBe('teacher');
  });

  it('isTask032AdminOperatorRole should return true for allowed roles', () => {
    expect(isTask032AdminOperatorRole('school_admin')).toBe(true);
    expect(isTask032AdminOperatorRole('system_admin')).toBe(true);
    expect(isTask032AdminOperatorRole('internal_operator')).toBe(true);
    expect(isTask032AdminOperatorRole('authorized_canary_operator')).toBe(true);
    expect(isTask032AdminOperatorRole('operations_reviewer')).toBe(true);
  });

  it('isTask032AdminOperatorRole should return false for denied roles', () => {
    expect(isTask032AdminOperatorRole('student')).toBe(false);
    expect(isTask032AdminOperatorRole('teacher')).toBe(false);
    expect(isTask032AdminOperatorRole('parent')).toBe(false);
    expect(isTask032AdminOperatorRole('peer')).toBe(false);
    expect(isTask032AdminOperatorRole('unknown')).toBe(false);
    expect(isTask032AdminOperatorRole('anonymous')).toBe(false);
  });

  it('isTask032DeniedRealRole should return true for student teacher parent peer unknown anonymous', () => {
    expect(isTask032DeniedRealRole('student')).toBe(true);
    expect(isTask032DeniedRealRole('teacher')).toBe(true);
    expect(isTask032DeniedRealRole('parent')).toBe(true);
    expect(isTask032DeniedRealRole('peer')).toBe(true);
    expect(isTask032DeniedRealRole('unknown')).toBe(true);
    expect(isTask032DeniedRealRole('anonymous')).toBe(true);
  });

  it('isTask032DeniedRealRole should return false for admin and operator roles', () => {
    expect(isTask032DeniedRealRole('school_admin')).toBe(false);
    expect(isTask032DeniedRealRole('system_admin')).toBe(false);
    expect(isTask032DeniedRealRole('internal_operator')).toBe(false);
    expect(isTask032DeniedRealRole('authorized_canary_operator')).toBe(false);
    expect(isTask032DeniedRealRole('operations_reviewer')).toBe(false);
  });

  it('createTask032SafeId should produce consistently formatted safe IDs', () => {
    const id = createTask032SafeId('test', 'hello');
    expect(id).toMatch(/^test_task032_safe_\d{4}$/);
    expect(id).toContain('task032_safe');
    const id2 = createTask032SafeId('school', 'world');
    expect(id2).toMatch(/^school_task032_safe_\d{4}$/);
  });

  it('createTask032SafeId should produce deterministic output for same seed', () => {
    const id1 = createTask032SafeId('test', 'deterministic_seed');
    const id2 = createTask032SafeId('test', 'deterministic_seed');
    expect(id1).toBe(id2);
  });

  it('getTask032RequiredStageIds should return all 14 stage IDs in order', () => {
    const stages = getTask032RequiredStageIds();
    expect(stages).toEqual(TASK032_CANARY_STAGE_IDS);
    expect(stages.length).toBe(14);
    expect(stages[0]).toBe('task031_dependency_check');
    expect(stages[stages.length - 1]).toBe('report_generation');
  });

  it('calculateTask032CanaryActivationDecision should return activated when all stages pass', () => {
    const allPass: Record<string, boolean> = {};
    for (const id of TASK032_CANARY_STAGE_IDS) {
      allPass[id] = true;
    }
    const decision = calculateTask032CanaryActivationDecision(allPass);
    expect(decision).toBe('activated_internal_ready_for_task033_observation');
  });

  it('calculateTask032CanaryActivationDecision should return blocked when any stage fails', () => {
    const allPass: Record<string, boolean> = {};
    for (const id of TASK032_CANARY_STAGE_IDS) {
      allPass[id] = true;
    }
    allPass['runtime_guard'] = false;
    const decision = calculateTask032CanaryActivationDecision(allPass);
    expect(decision).toBe('blocked_not_safe');
  });

  it('calculateTask032CanaryActivationDecision should return blocked when multiple stages fail', () => {
    const result: Record<string, boolean> = {
      task031_dependency_check: true,
      environment_gate: false,
      approved_school_config: true,
      cohort_eligibility: false,
    };
    for (const id of TASK032_CANARY_STAGE_IDS) {
      if (!(id in result)) result[id] = true;
    }
    expect(calculateTask032CanaryActivationDecision(result)).toBe('blocked_not_safe');
  });

  it('isTask032ValidStateTransition should allow valid transitions from created', () => {
    expect(isTask032ValidStateTransition('created', 'dependency_checking')).toBe(true);
    expect(isTask032ValidStateTransition('created', 'blocked')).toBe(true);
  });

  it('isTask032ValidStateTransition should reject direct jump from created to activated_internal', () => {
    expect(isTask032ValidStateTransition('created', 'activated_internal')).toBe(false);
  });

  it('isTask032ValidStateTransition should allow full activation path end-to-end', () => {
    const path: [string, string][] = [
      ['created', 'dependency_checking'],
      ['dependency_checking', 'dependency_passed'],
      ['dependency_passed', 'config_checking'],
      ['config_checking', 'config_passed'],
      ['config_passed', 'cohort_checking'],
      ['cohort_passed', 'consent_authorization_checking'],
      ['consent_authorization_checking', 'consent_authorization_passed'],
      ['consent_authorization_passed', 'privacy_boundary_checking'],
      ['privacy_boundary_checking', 'privacy_boundary_passed'],
      ['privacy_boundary_passed', 'runtime_guard_checking'],
      ['runtime_guard_checking', 'runtime_guard_passed'],
      ['runtime_guard_passed', 'health_budget_checking'],
      ['health_budget_checking', 'health_budget_passed'],
      ['health_budget_passed', 'activation_ready'],
      ['activation_ready', 'activated_internal'],
    ];
    for (const [from, to] of path) {
      expect(isTask032ValidStateTransition(from as any, to as any)).toBe(true);
    }
  });

  it('isTask032ValidStateTransition should support pause resume and kill switch from activated_internal', () => {
    expect(isTask032ValidStateTransition('activated_internal', 'paused')).toBe(true);
    expect(isTask032ValidStateTransition('activated_internal', 'kill_switch_enabled')).toBe(true);
    expect(isTask032ValidStateTransition('activated_internal', 'rollback_requested')).toBe(true);
  });

  it('isTask032ValidStateTransition should support resume from paused back to activated_internal', () => {
    expect(isTask032ValidStateTransition('paused', 'activated_internal')).toBe(true);
  });

  it('isTask032ValidStateTransition should reject transitions from blocked to any non-blocked state', () => {
    expect(isTask032ValidStateTransition('blocked', 'created')).toBe(false);
    expect(isTask032ValidStateTransition('blocked', 'activated_internal')).toBe(false);
    expect(isTask032ValidStateTransition('blocked', 'paused')).toBe(false);
  });

  it('TASK032_VALID_STATE_TRANSITIONS should cover all defined statuses', () => {
    const statuses = Object.keys(TASK032_VALID_STATE_TRANSITIONS);
    expect(statuses).toContain('created');
    expect(statuses).toContain('blocked');
    expect(statuses).toContain('activated_internal');
    expect(statuses).toContain('paused');
    expect(statuses).toContain('kill_switch_enabled');
    expect(statuses).toContain('rollback_requested');
    expect(statuses.length).toBeGreaterThanOrEqual(14);
  });
});
