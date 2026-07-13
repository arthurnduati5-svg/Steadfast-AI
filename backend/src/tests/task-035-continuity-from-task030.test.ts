import { describe, it, expect } from 'vitest';
import { evaluateProductionSafeEnvironmentGate } from '../services/task035ProductionSafeEnvironmentGateService';

describe('task035 continuity from task030 (staging rehearsal)', () => {
  it('environment gate service importable', () => {
    expect(typeof evaluateProductionSafeEnvironmentGate).toBe('function');
  });

  it('environment gate detects missing env flags', () => {
    const previous = process.env.TASK035_SCHOOL_WIDE_READINESS;
    delete process.env.TASK035_SCHOOL_WIDE_READINESS;
    const result = evaluateProductionSafeEnvironmentGate();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.some((i: string) => i.includes('TASK035_SCHOOL_WIDE_READINESS'))).toBe(true);
    if (previous) process.env.TASK035_SCHOOL_WIDE_READINESS = previous;
  });

  it('environment gate blocks public registration', () => {
    const result = evaluateProductionSafeEnvironmentGate();
    expect(typeof result.publicRolloutBlocked).toBe('boolean');
    expect(typeof result.multiSchoolRolloutBlocked).toBe('boolean');
  });
});
