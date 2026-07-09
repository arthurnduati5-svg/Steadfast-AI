import { describe, it, expect } from 'vitest';
import {
  TASK030_ALLOWED_ENVIRONMENT_TYPES,
  TASK030_FORBIDDEN_ENVIRONMENT_TYPES,
  TASK030_ALLOWED_DATA_MODES,
  TASK030_FORBIDDEN_DATA_MODES,
  TASK030_ALLOWED_EXECUTION_MODES,
  TASK030_FORBIDDEN_EXECUTION_MODES,
  TASK030_ALLOWED_REAL_ACTOR_ROLES,
  TASK030_DENIED_REAL_ACTOR_ROLES,
  TASK030_SYNTHETIC_ROLES,
  TASK030_REHEARSAL_SCENARIO_IDS,
  TASK030_REHEARSAL_STAGE_IDS,
  TASK030_CONTROL_ACTION_REHEARSAL_IDS,
  TASK030_FORBIDDEN_OUTPUT_FIELDS,
  TASK030_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK030_SAFE_TO_NEXT_TASK_STATUSES,
  resolveTask030ActorRole,
  isTask030AdminOperatorRole,
  isTask030DeniedRealRole,
  createTask030SafeId,
  getTask030RequiredStageIds,
  getTask030SyntheticPermissions,
} from '../contracts/task030ControlledStagingRehearsalContracts';

describe('Task 030 - Contract assertions (controlled staging rehearsal)', () => {
  it('should define allowed environment types containing staging', () => {
    expect(TASK030_ALLOWED_ENVIRONMENT_TYPES).toContain('staging');
    expect(TASK030_ALLOWED_ENVIRONMENT_TYPES).toHaveLength(1);
  });

  it('should forbid environment types production and live', () => {
    expect(TASK030_FORBIDDEN_ENVIRONMENT_TYPES).toContain('production');
    expect(TASK030_FORBIDDEN_ENVIRONMENT_TYPES).toContain('live');
  });

  it('should allow only synthetic data mode', () => {
    expect(TASK030_ALLOWED_DATA_MODES).toContain('synthetic');
    expect(TASK030_ALLOWED_DATA_MODES).toHaveLength(1);
  });

  it('should forbid live, real_student, and production data modes', () => {
    expect(TASK030_FORBIDDEN_DATA_MODES).toContain('live');
    expect(TASK030_FORBIDDEN_DATA_MODES).toContain('real_student');
    expect(TASK030_FORBIDDEN_DATA_MODES).toContain('production');
  });

  it('should allow only dry_run execution mode', () => {
    expect(TASK030_ALLOWED_EXECUTION_MODES).toContain('dry_run');
    expect(TASK030_ALLOWED_EXECUTION_MODES).toHaveLength(1);
  });

  it('should forbid live and real execution modes', () => {
    expect(TASK030_FORBIDDEN_EXECUTION_MODES).toContain('live');
    expect(TASK030_FORBIDDEN_EXECUTION_MODES).toContain('real');
  });

  it('should have allowed real actor roles for admin operators', () => {
    expect(TASK030_ALLOWED_REAL_ACTOR_ROLES).toContain('school_admin');
    expect(TASK030_ALLOWED_REAL_ACTOR_ROLES).toContain('internal_operator');
    expect(TASK030_ALLOWED_REAL_ACTOR_ROLES).not.toContain('student');
    expect(TASK030_ALLOWED_REAL_ACTOR_ROLES).not.toContain('teacher');
  });

  it('should have denied real actor roles including student, learner, teacher, parent', () => {
    expect(TASK030_DENIED_REAL_ACTOR_ROLES).toContain('student');
    expect(TASK030_DENIED_REAL_ACTOR_ROLES).toContain('learner');
    expect(TASK030_DENIED_REAL_ACTOR_ROLES).toContain('teacher');
    expect(TASK030_DENIED_REAL_ACTOR_ROLES).toContain('parent');
    expect(TASK030_DENIED_REAL_ACTOR_ROLES).toContain('peer');
    expect(TASK030_DENIED_REAL_ACTOR_ROLES).toContain('unknown');
    expect(TASK030_DENIED_REAL_ACTOR_ROLES).toContain('anonymous');
  });

  it('should have synthetic roles', () => {
    expect(TASK030_SYNTHETIC_ROLES).toContain('synthetic_admin');
    expect(TASK030_SYNTHETIC_ROLES).toContain('synthetic_operator');
    expect(TASK030_SYNTHETIC_ROLES).toContain('synthetic_teacher');
    expect(TASK030_SYNTHETIC_ROLES).toContain('synthetic_learner');
    expect(TASK030_SYNTHETIC_ROLES).toContain('unknown_role');
  });

  it('should have rehearsal scenario ids', () => {
    expect(TASK030_REHEARSAL_SCENARIO_IDS).toContain('proof_loader');
    expect(TASK030_REHEARSAL_SCENARIO_IDS).toContain('environment_gate');
    expect(TASK030_REHEARSAL_SCENARIO_IDS).toContain('report');
  });

  it('should have rehearsal stage ids', () => {
    expect(TASK030_REHEARSAL_STAGE_IDS).toContain('task029_proof');
    expect(TASK030_REHEARSAL_STAGE_IDS).toContain('staging_environment_gate');
    expect(TASK030_REHEARSAL_STAGE_IDS).toContain('report_generation');
  });

  it('should have control action rehearsal ids', () => {
    expect(TASK030_CONTROL_ACTION_REHEARSAL_IDS).toContain('pause_rehearsal');
    expect(TASK030_CONTROL_ACTION_REHEARSAL_IDS).toContain('kill_switch_enable');
    expect(TASK030_CONTROL_ACTION_REHEARSAL_IDS).toContain('kill_switch_disable');
  });

  it('should have forbidden output fields', () => {
    expect(TASK030_FORBIDDEN_OUTPUT_FIELDS).toContain('rawStudentData');
    expect(TASK030_FORBIDDEN_OUTPUT_FIELDS).toContain('rawChat');
    expect(TASK030_FORBIDDEN_OUTPUT_FIELDS).toContain('chainOfThought');
    expect(TASK030_FORBIDDEN_OUTPUT_FIELDS).toContain('correctAnswer');
    expect(TASK030_FORBIDDEN_OUTPUT_FIELDS).toContain('parentEmail');
  });

  it('should have forbidden side effect patterns', () => {
    expect(TASK030_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('openai');
    expect(TASK030_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('twilio');
    expect(TASK030_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('fetch(');
  });

  it('should define safe to next task statuses with only task031 as safe', () => {
    expect(TASK030_SAFE_TO_NEXT_TASK_STATUSES.safeToStartTask031).toBe(true);
    expect(TASK030_SAFE_TO_NEXT_TASK_STATUSES.safeToStartTask032).toBe(false);
    expect(TASK030_SAFE_TO_NEXT_TASK_STATUSES.safeToStartTask040).toBe(false);
  });

  it('should resolve actor roles correctly', () => {
    expect(resolveTask030ActorRole('school_admin')).toBe('school_admin');
    expect(resolveTask030ActorRole('student')).toBe('student');
    expect(resolveTask030ActorRole('')).toBe('unknown');
    expect(resolveTask030ActorRole('garbage')).toBe('unknown');
  });

  it('should detect admin operator roles', () => {
    expect(isTask030AdminOperatorRole('school_admin')).toBe(true);
    expect(isTask030AdminOperatorRole('student')).toBe(false);
    expect(isTask030AdminOperatorRole('teacher')).toBe(false);
  });

  it('should detect denied real roles', () => {
    expect(isTask030DeniedRealRole('student')).toBe(true);
    expect(isTask030DeniedRealRole('teacher')).toBe(true);
    expect(isTask030DeniedRealRole('school_admin')).toBe(false);
  });

  it('should create safe IDs with synthetic_ prefix', () => {
    const id = createTask030SafeId('school', 'testseed');
    expect(id).toMatch(/^synthetic_school_\d{6}$/);
  });

  it('should get required stage ids as a copy', () => {
    const ids = getTask030RequiredStageIds();
    expect(ids).toEqual(TASK030_REHEARSAL_STAGE_IDS);
    expect(ids).not.toBe(TASK030_REHEARSAL_STAGE_IDS);
  });

  it('should return synthetic permissions for each role', () => {
    const adminPerms = getTask030SyntheticPermissions('synthetic_admin');
    expect(adminPerms.canViewConsole).toBe(true);
    expect(adminPerms.canTriggerControlActions).toBe(true);

    const learnerPerms = getTask030SyntheticPermissions('synthetic_learner');
    expect(learnerPerms.canViewConsole).toBe(false);

    const unknownPerms = getTask030SyntheticPermissions('unknown_role');
    expect(unknownPerms.canViewConsole).toBe(false);
  });
});
