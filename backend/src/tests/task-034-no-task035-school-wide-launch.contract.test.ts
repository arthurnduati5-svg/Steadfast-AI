import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 no task035 school-wide launch', () => {
  it('forbids task035', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task035');
  });

  it('forbids school-wide launch', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('school-wide launch');
  });

  it('task035 is in forbidden future patterns', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS.includes('task035')).toBe(true);
  });

  it('school-wide launch is in forbidden future patterns', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS.includes('school-wide launch')).toBe(true);
  });

  it('array length is at least 5 patterns', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  it('array is frozen', () => {
    expect(Object.isFrozen(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS)).toBe(true);
  });
});
