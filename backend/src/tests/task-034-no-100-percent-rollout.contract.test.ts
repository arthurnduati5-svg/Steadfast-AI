import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 no 100 percent rollout', () => {
  it('forbids 100 percent rollout', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('100 percent rollout');
  });

  it('forbids hundred percent rollout', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('hundred percent rollout');
  });

  it('100 percent rollout is in forbidden future patterns', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS.includes('100 percent rollout')).toBe(true);
  });

  it('hundred percent rollout is in forbidden future patterns', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS.includes('hundred percent rollout')).toBe(true);
  });

  it('array includes task035 and task040', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task035');
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
  });

  it('array includes school-wide launch', () => {
    expect(TASK034_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('school-wide launch');
  });
});
