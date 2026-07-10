import { describe, it, expect } from 'vitest';
import {
  TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS,
  TASK034_FORBIDDEN_OUTPUT_FIELDS,
  TASK034_FORBIDDEN_SIDE_EFFECT_MODES,
  TASK034_ALLOWED_ENVIRONMENT_TYPES,
  TASK034_ALLOWED_ROLLOUT_MODES,
  TASK034_ALLOWED_ACTOR_ROLES,
  TASK034_DENIED_ACTOR_ROLES,
  TASK034_MAX_ROLLOUT_PERCENT,
  TASK034_MAX_EXPANDED_STUDENT_COUNT,
  TASK034_ROLLOUT_STAGE_IDS,
} from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 verification script smoke', () => {
  it('TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS is a frozen array', () => {
    expect(Object.isFrozen(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS)).toBe(true);
    expect(Array.isArray(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS)).toBe(true);
  });

  it('TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS is a frozen array', () => {
    expect(Object.isFrozen(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS)).toBe(true);
    expect(Array.isArray(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS)).toBe(true);
  });

  it('TASK034_FORBIDDEN_OUTPUT_FIELDS is a frozen array', () => {
    expect(Object.isFrozen(TASK034_FORBIDDEN_OUTPUT_FIELDS)).toBe(true);
    expect(Array.isArray(TASK034_FORBIDDEN_OUTPUT_FIELDS)).toBe(true);
  });

  it('TASK034_FORBIDDEN_SIDE_EFFECT_MODES is a frozen array', () => {
    expect(Object.isFrozen(TASK034_FORBIDDEN_SIDE_EFFECT_MODES)).toBe(true);
    expect(Array.isArray(TASK034_FORBIDDEN_SIDE_EFFECT_MODES)).toBe(true);
  });

  it('TASK034_ALLOWED_ENVIRONMENT_TYPES is a frozen array with 1 element', () => {
    expect(Object.isFrozen(TASK034_ALLOWED_ENVIRONMENT_TYPES)).toBe(true);
    expect(TASK034_ALLOWED_ENVIRONMENT_TYPES).toHaveLength(1);
    expect(TASK034_ALLOWED_ENVIRONMENT_TYPES[0]).toBe('controlled_limited_rollout');
  });

  it('TASK034_ALLOWED_ROLLOUT_MODES is a frozen array with 1 element', () => {
    expect(Object.isFrozen(TASK034_ALLOWED_ROLLOUT_MODES)).toBe(true);
    expect(TASK034_ALLOWED_ROLLOUT_MODES).toHaveLength(1);
    expect(TASK034_ALLOWED_ROLLOUT_MODES[0]).toBe('limited_cohort_expansion_only');
  });

  it('TASK034_ALLOWED_ACTOR_ROLES is a frozen array with admin/operator roles', () => {
    expect(Object.isFrozen(TASK034_ALLOWED_ACTOR_ROLES)).toBe(true);
    expect(TASK034_ALLOWED_ACTOR_ROLES).toContain('school_admin');
    expect(TASK034_ALLOWED_ACTOR_ROLES).toContain('internal_operator');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('student');
    expect(TASK034_DENIED_ACTOR_ROLES).toContain('learner');
  });

  it('TASK034_MAX_ROLLOUT_PERCENT is 25 and MAX_EXPANDED_STUDENT_COUNT is 100', () => {
    expect(TASK034_MAX_ROLLOUT_PERCENT).toBe(25);
    expect(TASK034_MAX_ROLLOUT_PERCENT).toBeGreaterThan(0);
    expect(TASK034_MAX_EXPANDED_STUDENT_COUNT).toBe(100);
    expect(TASK034_MAX_EXPANDED_STUDENT_COUNT).toBeGreaterThan(0);
  });

  it('TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS contains all categories', () => {
    const categories = {
      notification: ['sendEmail', 'sendSms', 'sendWhatsapp', 'nodemailer', 'twilio', 'smtp'],
      ai: ['fetch(', 'axios', 'openai', 'anthropic', 'gemini'],
      connector: ['liveConnector', 'sisClient'],
      mutation: ['prisma.migrate', 'prisma.db.push', 'pg_dump', 'DROP TABLE'],
      deployment: ['kubectl apply', 'vercel deploy', 'railway up'],
    };
    for (const [, patterns] of Object.entries(categories)) {
      for (const p of patterns) {
        expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain(p);
      }
    }
  });

  it('TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS contains all future task references', () => {
    const expected = ['task035', 'task040', 'school-wide launch', 'backend freeze', '100 percent rollout', 'hundred percent rollout'];
    for (const p of expected) {
      expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain(p);
    }
  });

  it('TASK034_ROLLOUT_STAGE_IDS is a frozen array with expected stages', () => {
    expect(Object.isFrozen(TASK034_ROLLOUT_STAGE_IDS)).toBe(true);
    expect(TASK034_ROLLOUT_STAGE_IDS).toContain('dependency_check');
    expect(TASK034_ROLLOUT_STAGE_IDS).toContain('environment_gate');
    expect(TASK034_ROLLOUT_STAGE_IDS).toContain('runtime_guard');
    expect(TASK034_ROLLOUT_STAGE_IDS).toContain('health_budget');
    expect(TASK034_ROLLOUT_STAGE_IDS.length).toBeGreaterThanOrEqual(20);
  });

  it('TASK034_FORBIDDEN_OUTPUT_FIELDS covers all sensitive areas', () => {
    const sensitiveGroups = [
      ['studentName', 'studentEmail', 'studentPhone'],
      ['parentName', 'parentEmail', 'parentPhone'],
      ['rawLearnerData', 'rawChat', 'rawMessage'],
      ['answerKey', 'correctAnswer', 'modelAnswer'],
      ['hiddenReasoning', 'chainOfThought'],
      ['rawEmailBody', 'rawSmsBody'],
    ];
    for (const group of sensitiveGroups) {
      for (const field of group) {
        expect(TASK034_FORBIDDEN_OUTPUT_FIELDS).toContain(field);
      }
    }
  });

  it('all contract arrays are readonly (frozen)', () => {
    const arrays = [
      TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS,
      TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS,
      TASK034_FORBIDDEN_OUTPUT_FIELDS,
      TASK034_FORBIDDEN_SIDE_EFFECT_MODES,
      TASK034_ALLOWED_ENVIRONMENT_TYPES,
      TASK034_ALLOWED_ROLLOUT_MODES,
      TASK034_ALLOWED_ACTOR_ROLES,
      TASK034_DENIED_ACTOR_ROLES,
      TASK034_ROLLOUT_STAGE_IDS,
    ];
    for (const arr of arrays) {
      expect(Object.isFrozen(arr)).toBe(true);
    }
  });
});
