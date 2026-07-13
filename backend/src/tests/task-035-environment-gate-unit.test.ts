import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { evaluateProductionSafeEnvironmentGate } from '../services/task035ProductionSafeEnvironmentGateService';

const ENV_BACKUP: Record<string, string | undefined> = {};

function setAllFlags(val: string) {
  process.env.TASK035_SCHOOL_WIDE_READINESS = val;
  process.env.TASK035_REQUIRE_TASK034_PROOF = val;
  process.env.TASK035_NO_PUBLIC_ROLLOUT = val;
  process.env.TASK035_NO_MULTI_SCHOOL_ROLLOUT = val;
  process.env.TASK035_PRIVACY_SAFE_EVIDENCE = val;
  process.env.TASK035_REQUIRE_RELEASE_BOARD = val;
  process.env.TASK035_REQUIRE_ROLLBACK_READY = val;
  process.env.TASK035_FULL_SCHOOL_SIMULATION_ONLY = val;
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgres://localhost:5432/testdb';
  process.env.PUBLIC_SIGNUP_ENABLED = 'false';
  process.env.OPEN_REGISTRATION_ENABLED = 'false';
  process.env.MULTI_SCHOOL_ROLLOUT_ENABLED = 'false';
  process.env.PAYMENTS_ENABLED = 'false';
  process.env.MARKETING_LAUNCH_ENABLED = 'false';
}

describe('task035 environment gate unit', () => {
  beforeEach(() => {
    for (const key of Object.keys(process.env)) {
      ENV_BACKUP[key] = process.env[key];
    }
  });

  afterEach(() => {
    for (const key of Object.keys(ENV_BACKUP)) {
      if (ENV_BACKUP[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = ENV_BACKUP[key];
      }
    }
  });

  it('passes when all required flags are set to 1', () => {
    setAllFlags('1');
    const result = evaluateProductionSafeEnvironmentGate();
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('fails when TASK035_SCHOOL_WIDE_READINESS is missing', () => {
    setAllFlags('1');
    delete process.env.TASK035_SCHOOL_WIDE_READINESS;
    const result = evaluateProductionSafeEnvironmentGate();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('TASK035_SCHOOL_WIDE_READINESS not enabled');
  });

  it('fails when TASK035_REQUIRE_TASK034_PROOF is missing', () => {
    setAllFlags('1');
    delete process.env.TASK035_REQUIRE_TASK034_PROOF;
    const result = evaluateProductionSafeEnvironmentGate();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('TASK035_REQUIRE_TASK034_PROOF not enabled');
  });

  it('fails when TASK035_NO_PUBLIC_ROLLOUT is missing', () => {
    setAllFlags('1');
    delete process.env.TASK035_NO_PUBLIC_ROLLOUT;
    const result = evaluateProductionSafeEnvironmentGate();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('TASK035_NO_PUBLIC_ROLLOUT not enabled');
  });

  it('fails when PUBLIC_SIGNUP_ENABLED is true', () => {
    setAllFlags('1');
    process.env.PUBLIC_SIGNUP_ENABLED = 'true';
    const result = evaluateProductionSafeEnvironmentGate();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('PUBLIC_SIGNUP_ENABLED is true');
  });

  it('reports multiple blocking issues when several flags are missing', () => {
    setAllFlags('1');
    delete process.env.TASK035_SCHOOL_WIDE_READINESS;
    delete process.env.TASK035_PRIVACY_SAFE_EVIDENCE;
    delete process.env.TASK035_REQUIRE_ROLLBACK_READY;
    const result = evaluateProductionSafeEnvironmentGate();
    expect(result.blockingIssues.length).toBeGreaterThanOrEqual(3);
  });
});
