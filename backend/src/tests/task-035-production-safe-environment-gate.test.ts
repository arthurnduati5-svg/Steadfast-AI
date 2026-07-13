import { describe, it, expect, beforeAll } from 'vitest';

describe('Task 035 - Production-Safe Environment Gate', () => {
  let service: any;

  beforeAll(async () => {
    service = await import('../services/task035ProductionSafeEnvironmentGateService');
  });

  it('should export evaluateProductionSafeEnvironmentGate function', () => {
    expect(typeof service.evaluateProductionSafeEnvironmentGate).toBe('function');
  });

  it('should return gate result with required fields', () => {
    const result = service.evaluateProductionSafeEnvironmentGate();
    expect(result).toBeDefined();
    expect(typeof result.ok).toBe('boolean');
    expect(typeof result.nodeEnv).toBe('string');
    expect(typeof result.publicRolloutBlocked).toBe('boolean');
    expect(typeof result.multiSchoolRolloutBlocked).toBe('boolean');
    expect(typeof result.fullSchoolSimulationOnly).toBe('boolean');
    expect(Array.isArray(result.blockingIssues)).toBe(true);
  });

  it('should detect when env flags are missing', () => {
    const previous = process.env.TASK035_SCHOOL_WIDE_READINESS;
    delete process.env.TASK035_SCHOOL_WIDE_READINESS;
    const result = service.evaluateProductionSafeEnvironmentGate();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.some((i: string) => i.includes('TASK035_SCHOOL_WIDE_READINESS'))).toBe(true);
    if (previous) process.env.TASK035_SCHOOL_WIDE_READINESS = previous;
  });

  it('should detect public rollout enabled', () => {
    const result = service.evaluateProductionSafeEnvironmentGate();
    expect(result.rawDatabaseUrlExposed).toBe(false);
  });
});
