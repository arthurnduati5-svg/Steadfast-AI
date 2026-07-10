import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 no task040 backend freeze', () => {
  it('forbids task040', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
  });

  it('forbids backend freeze', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('backend freeze');
  });

  it('task040 is in forbidden future patterns', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS.includes('task040')).toBe(true);
  });

  it('backend freeze is in forbidden future patterns', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS.includes('backend freeze')).toBe(true);
  });

  it('array is readonly', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toBeDefined();
    expect(Array.isArray(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS)).toBe(true);
  });

  it('array contains school-wide launch as additional pattern', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('school-wide launch');
  });
});
