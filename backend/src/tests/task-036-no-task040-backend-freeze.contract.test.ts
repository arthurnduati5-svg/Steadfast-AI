import { describe, it, expect } from 'vitest';
import {
  TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { validateFutureTaskBoundaries, validateForbiddenSideEffects } from '../lib/task036LiveSchoolLaunchValidation';

describe('No Task040 Backend Freeze Contract', () => {
  it('task040 is forbidden in side effect patterns', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('task040');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('task-040');
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('TASK_040');
  });

  it('task040 is forbidden in future task patterns', () => {
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task-040');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('TASK_040');
  });

  it('validateFutureTaskBoundaries catches task040 reference', () => {
    const errors = validateFutureTaskBoundaries('implement task040');
    expect(errors.some((e: string) => e.includes('task040'))).toBe(true);
  });

  it('validateForbiddenSideEffects catches task040 reference', () => {
    const errors = validateForbiddenSideEffects('task040');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('backend freeze is forbidden in both pattern lists', () => {
    expect(TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('backend freeze');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('backend freeze');
  });
});
