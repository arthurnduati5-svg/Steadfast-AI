import { describe, it, expect } from 'vitest';
import {
  TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS,
} from '../contracts/task036LiveSchoolLaunchContracts';
import {
  validateFutureTaskBoundaries,
} from '../lib/task036LiveSchoolLaunchValidation';

describe('Task036 Forbidden Future Task', () => {
  it('list contains all expected future task patterns', () => {
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task-040');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('TASK_040');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('backend freeze');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('public SaaS');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('multi-school rollout');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('marketing launch');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('payment activation');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('billing flow');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('frontend dashboard');
    expect(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('browser launch dashboard');
  });

  it('patterns list has no duplicates', () => {
    const unique = new Set(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS);
    expect(unique.size).toBe(TASK036_FORBIDDEN_FUTURE_TASK_PATTERNS.length);
  });

  it('validateFutureTaskBoundaries detects all patterns', () => {
    const code = 'TODO: implement task040, backend freeze, multi-school rollout, marketing launch';
    const errors = validateFutureTaskBoundaries(code);
    expect(errors.length).toBeGreaterThanOrEqual(4);
    expect(errors.some((e: string) => e.includes('task040'))).toBe(true);
    expect(errors.some((e: string) => e.includes('backend freeze'))).toBe(true);
    expect(errors.some((e: string) => e.includes('multi-school rollout'))).toBe(true);
  });

  it('validateFutureTaskBoundaries passes for clean code', () => {
    const code = 'export function handler() { return "current task work"; }';
    expect(validateFutureTaskBoundaries(code)).toEqual([]);
  });

  it('TASK_040 variants are detected', () => {
    const errors = validateFutureTaskBoundaries('TASK_040 implementation');
    expect(errors).toContain('future_task_pattern_detected:TASK_040');
  });

  it('payment and billing patterns are detected', () => {
    const errors = validateFutureTaskBoundaries('payment activation and billing flow');
    expect(errors.some((e: string) => e.includes('payment activation'))).toBe(true);
    expect(errors.some((e: string) => e.includes('billing flow'))).toBe(true);
  });
});
