import { describe, it, expect } from 'vitest';
import {
  TASK034_ALLOWED_ENVIRONMENT_TYPES,
  TASK034_FORBIDDEN_ENVIRONMENT_TYPES,
  TASK034_ALLOWED_ROLLOUT_MODES,
  TASK034_FORBIDDEN_ROLLOUT_MODES,
  TASK034_ALLOWED_DATA_MODES,
  TASK034_FORBIDDEN_DATA_MODES,
  TASK034_ALLOWED_SIDE_EFFECT_MODES,
  TASK034_FORBIDDEN_SIDE_EFFECT_MODES,
  TASK034_ALLOWED_ACTOR_ROLES,
  TASK034_DENIED_ACTOR_ROLES,
  TASK034_REQUIRED_DEPENDENCY_COMMITS,
  TASK034_MAX_ROLLOUT_PERCENT,
  TASK034_MAX_EXPANDED_STUDENT_COUNT,
  TASK034_MIN_STAFF_READINESS_SCORE,
  TASK034_ROLLOUT_STAGE_IDS,
  TASK034_VALID_STATE_TRANSITIONS,
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS,
  resolveTask034ActorRole,
  isTask034AdminOperatorRole,
  isTask034DeniedRole,
  createTask034SafeId,
  createTask034SafeTimestamp,
  getTask034RequiredStageIds,
  isTask034ValidStateTransition,
  calculateTask034RolloutDecision,
  calculateTask034SafeToStartTask035,
} from '../contracts/task034ControlledLimitedRolloutContracts';

describe('Task034 Contracts', () => {
  it('TASK034_ALLOWED_ENVIRONMENT_TYPES contains controlled_limited_rollout', () => {
    expect(TASK034_ALLOWED_ENVIRONMENT_TYPES).toContain('controlled_limited_rollout');
    expect(TASK034_ALLOWED_ENVIRONMENT_TYPES).toHaveLength(1);
  });

  it('TASK034_FORBIDDEN_ENVIRONMENT_TYPES contains production, staging, school_wide_launch, open_rollout', () => {
    expect(TASK034_FORBIDDEN_ENVIRONMENT_TYPES).toContain('production');
    expect(TASK034_FORBIDDEN_ENVIRONMENT_TYPES).toContain('staging');
    expect(TASK034_FORBIDDEN_ENVIRONMENT_TYPES).toContain('school_wide_launch');
    expect(TASK034_FORBIDDEN_ENVIRONMENT_TYPES).toContain('open_rollout');
    expect(TASK034_FORBIDDEN_ENVIRONMENT_TYPES.length).toBeGreaterThanOrEqual(4);
  });

  it('TASK034_ALLOWED_ROLLOUT_MODES contains limited_cohort_expansion_only', () => {
    expect(TASK034_ALLOWED_ROLLOUT_MODES).toContain('limited_cohort_expansion_only');
    expect(TASK034_ALLOWED_ROLLOUT_MODES).toHaveLength(1);
  });

  it('TASK034_FORBIDDEN_ROLLOUT_MODES contains school_wide, open_rollout, hundred_percent', () => {
    expect(TASK034_FORBIDDEN_ROLLOUT_MODES).toContain('school_wide');
    expect(TASK034_FORBIDDEN_ROLLOUT_MODES).toContain('open_rollout');
    expect(TASK034_FORBIDDEN_ROLLOUT_MODES).toContain('hundred_percent');
  });

  it('TASK034_DENIED_ACTOR_ROLES contains student, learner, parent, peer, unknown, anonymous', () => {
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('student');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('learner');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('parent');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('peer');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('unknown');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('anonymous');
    expect(TASK034_DENIED_ACTOR_ROLES).toHaveLength(6);
  });

  it('TASK034_ALLOWED_ACTOR_ROLES contains admin and operator roles', () => {
    expect(TASK034_ALLOWED_ACTOR_ROLES).toContain('school_admin');
    expect(TASK034_ALLOWED_ACTOR_ROLES).toContain('system_admin');
    expect(TASK034_ALLOWED_ACTOR_ROLES).toContain('internal_operator');
    expect(TASK034_ALLOWED_ACTOR_ROLES).toContain('authorized_rollout_operator');
    expect(TASK034_ALLOWED_ACTOR_ROLES).toContain('operations_reviewer');
    expect(TASK034_ALLOWED_ACTOR_ROLES).toHaveLength(5);
  });

  it('TASK034_REQUIRED_DEPENDENCY_COMMITS contains 276445d', () => {
    expect(TASK034_REQUIRED_DEPENDENCY_COMMITS).toContain('276445d');
    expect(TASK034_REQUIRED_DEPENDENCY_COMMITS).toHaveLength(1);
  });

  it('TASK034_MAX_ROLLOUT_PERCENT is 25', () => {
    expect(TASK034_MAX_ROLLOUT_PERCENT).toBe(25);
  });

  it('TASK034_MAX_EXPANDED_STUDENT_COUNT is 100', () => {
    expect(TASK034_MAX_EXPANDED_STUDENT_COUNT).toBe(100);
  });

  it('TASK034_MIN_STAFF_READINESS_SCORE is 50', () => {
    expect(TASK034_MIN_STAFF_READINESS_SCORE).toBe(50);
  });

  it('TASK034_ROLLOUT_STAGE_IDS has expected stages', () => {
    expect(TASK034_ROLLOUT_STAGE_IDS).toContain('dependency_check');
    expect(TASK034_ROLLOUT_STAGE_IDS).toContain('environment_gate');
    expect(TASK034_ROLLOUT_STAGE_IDS).toContain('runtime_guard');
    expect(TASK034_ROLLOUT_STAGE_IDS).toContain('health_budget');
    expect(TASK034_ROLLOUT_STAGE_IDS).toContain('evidence_ledger');
    expect(TASK034_ROLLOUT_STAGE_IDS.length).toBeGreaterThanOrEqual(20);
  });

  it('TASK034_VALID_STATE_TRANSITIONS has all expected transitions', () => {
    expect(TASK034_VALID_STATE_TRANSITIONS.created).toContain('dependency_checking');
    expect(TASK034_VALID_STATE_TRANSITIONS.dependency_checking).toContain('dependency_passed');
    expect(TASK034_VALID_STATE_TRANSITIONS.dependency_checking).toContain('blocked');
    expect(TASK034_VALID_STATE_TRANSITIONS.limited_rollout_complete).toEqual([]);
    expect(TASK034_VALID_STATE_TRANSITIONS.kill_switch_enabled).toContain('limited_rollout_complete');
    expect(TASK034_VALID_STATE_TRANSITIONS.blocked).toEqual([]);
  });

  it('resolveTask034ActorRole maps correctly for all roles', () => {
    expect(resolveTask034ActorRole('school_admin')).toBe('school_admin');
    expect(resolveTask034ActorRole('SCHOOL_ADMIN')).toBe('school_admin');
    expect(resolveTask034ActorRole('schooladmin')).toBe('school_admin');
    expect(resolveTask034ActorRole('rollout_operator')).toBe('authorized_rollout_operator');
    expect(resolveTask034ActorRole('student')).toBe('student');
    expect(resolveTask034ActorRole('learner')).toBe('learner');
    expect(resolveTask034ActorRole('unknown_role')).toBe('unknown');
    expect(resolveTask034ActorRole('')).toBe('unknown');
  });

  it('isTask034AdminOperatorRole returns true for admin roles', () => {
    expect(isTask034AdminOperatorRole('school_admin')).toBe(true);
    expect(isTask034AdminOperatorRole('system_admin')).toBe(true);
    expect(isTask034AdminOperatorRole('internal_operator')).toBe(true);
    expect(isTask034AdminOperatorRole('student')).toBe(false);
    expect(isTask034AdminOperatorRole('teacher')).toBe(false);
  });

  it('isTask034DeniedRole returns true for denied roles', () => {
    expect(isTask034DeniedRole('student')).toBe(true);
    expect(isTask034DeniedRole('learner')).toBe(true);
    expect(isTask034DeniedRole('parent')).toBe(true);
    expect(isTask034DeniedRole('peer')).toBe(true);
    expect(isTask034DeniedRole('school_admin')).toBe(false);
    expect(isTask034DeniedRole('internal_operator')).toBe(false);
  });

  it('createTask034SafeId generates a non-empty prefixed id', () => {
    const id1 = createTask034SafeId('test');
    const id2 = createTask034SafeId('test');
    expect(id1).toMatch(/^test_/);
    expect(id2).toMatch(/^test_/);
    expect(id1).not.toBe(id2);
  });

  it('createTask034SafeTimestamp returns ISO string', () => {
    const ts = createTask034SafeTimestamp();
    expect(typeof ts).toBe('string');
    expect(new Date(ts).toISOString()).toBe(ts);
  });

  it('getTask034RequiredStageIds returns all stage ids', () => {
    const ids = getTask034RequiredStageIds();
    expect(ids).toEqual(TASK034_ROLLOUT_STAGE_IDS);
    expect(ids.length).toBe(TASK034_ROLLOUT_STAGE_IDS.length);
  });

  it('isTask034ValidStateTransition returns true for valid transitions', () => {
    expect(isTask034ValidStateTransition('created', 'dependency_checking')).toBe(true);
    expect(isTask034ValidStateTransition('dependency_checking', 'dependency_passed')).toBe(true);
    expect(isTask034ValidStateTransition('limited_rollout_active_internal', 'limited_rollout_paused')).toBe(true);
    expect(isTask034ValidStateTransition('limited_rollout_complete', 'created')).toBe(false);
  });

  it('isTask034ValidStateTransition returns false for invalid transitions', () => {
    expect(isTask034ValidStateTransition('created', 'limited_rollout_complete')).toBe(false);
    expect(isTask034ValidStateTransition('blocked', 'created')).toBe(false);
    expect(isTask034ValidStateTransition('dependency_checking', 'limited_rollout_ready')).toBe(false);
  });

  it('calculateTask034RolloutDecision returns correct decisions', () => {
    expect(calculateTask034RolloutDecision(['pass', 'pass', 'pass'])).toBe('pass');
    expect(calculateTask034RolloutDecision(['pass', 'fail', 'pass'])).toBe('fail');
    expect(calculateTask034RolloutDecision(['pass', 'blocked', 'pass'])).toBe('block');
    expect(calculateTask034RolloutDecision([])).toBe('pause');
  });

  it('calculateTask034SafeToStartTask035 returns true only when all pass', () => {
    expect(calculateTask034SafeToStartTask035(['pass', 'pass', 'pass'])).toBe(true);
    expect(calculateTask034SafeToStartTask035(['pass', 'fail', 'pass'])).toBe(false);
    expect(calculateTask034SafeToStartTask035([])).toBe(false);
  });

  it('TASK034_FORBIDDEN_OUTPUT_FIELDS contains sensitive fields', () => {
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('studentName');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('rawLearnerData');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('hiddenReasoning');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('chainOfThought');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain('rawEmailBody');
    expect(TASK034_FORBIDDEN_OUTPUT_FIELDS.length).toBeGreaterThanOrEqual(20);
  });

  it('TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS contains dangerous operations', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('nodemailer');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('openai');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('prisma.migrate');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('kubectl apply');
  });

  it('TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS contains future task references', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task035');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('school-wide launch');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('backend freeze');
  });

  it('TASK034_ALLOWED_DATA_MODES contains safe_metadata_and_aggregate_only', () => {
    expect(TASK034_ALLOWED_DATA_MODES).toContain('safe_metadata_and_aggregate_only');
    expect(TASK034_ALLOWED_DATA_MODES).toHaveLength(1);
  });

  it('TASK034_FORBIDDEN_DATA_MODES contains raw data modes', () => {
    expect(TASK034_FORBIDDEN_DATA_MODES).toContain('raw_learner_data');
    expect(TASK034_FORBIDDEN_DATA_MODES).toContain('raw_chat');
    expect(TASK034_FORBIDDEN_DATA_MODES).toContain('raw_deen');
  });

  it('TASK034_ALLOWED_SIDE_EFFECT_MODES contains internal_rollout_store_only', () => {
    expect(TASK034_ALLOWED_SIDE_EFFECT_MODES).toContain('internal_rollout_store_only');
    expect(TASK034_ALLOWED_SIDE_EFFECT_MODES).toHaveLength(1);
  });

  it('TASK034_FORBIDDEN_SIDE_EFFECT_MODES contains live operations', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_MODES).toContain('live_notification');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_MODES).toContain('live_ai_call');
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_MODES).toContain('production_mutation');
  });
});
