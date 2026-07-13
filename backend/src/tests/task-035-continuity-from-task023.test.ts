import { describe, it, expect } from 'vitest';
import {
  validateTask023DeploymentReadinessContext,
  validateTask023EnvironmentType,
  validateTask023EnvironmentGateResult,
  validateTask023ReleaseSmokeResult,
  validateTask023RollbackReadinessResult,
} from '../lib/task023DeploymentReadinessValidation';

describe('task035 continuity from task023 (deployment readiness)', () => {
  it('deployment readiness validators are importable', () => {
    expect(typeof validateTask023DeploymentReadinessContext).toBe('function');
    expect(typeof validateTask023EnvironmentType).toBe('function');
    expect(typeof validateTask023EnvironmentGateResult).toBe('function');
  });

  it('validates deployment context requires actorId and actorRole', () => {
    expect(validateTask023DeploymentReadinessContext({})).toBe(false);
    expect(validateTask023DeploymentReadinessContext({ actorId: 'a', actorRole: 'b' })).toBe(true);
  });

  it('validates environment types correctly', () => {
    expect(validateTask023EnvironmentType('production')).toBe(true);
    expect(validateTask023EnvironmentType('staging')).toBe(true);
    expect(validateTask023EnvironmentType('unknown')).toBe(true);
    expect(validateTask023EnvironmentType('')).toBe(false);
  });

  it('validates environment gate result shape', () => {
    expect(validateTask023EnvironmentGateResult({ passed: true, requirements: [] })).toBe(true);
    expect(validateTask023EnvironmentGateResult({ passed: false, requirements: ['a'] })).toBe(true);
    expect(validateTask023EnvironmentGateResult({})).toBe(false);
    expect(validateTask023EnvironmentGateResult(null)).toBe(false);
  });

  it('validates release smoke result shape', () => {
    expect(validateTask023ReleaseSmokeResult({ passed: true, testsRun: 5 })).toBe(true);
    expect(validateTask023ReleaseSmokeResult({ passed: false, testsRun: 0 })).toBe(true);
    expect(validateTask023ReleaseSmokeResult({ passed: true })).toBe(false);
  });

  it('validates rollback readiness result requires planExists', () => {
    expect(validateTask023RollbackReadinessResult({ passed: true, planExists: true })).toBe(true);
    expect(validateTask023RollbackReadinessResult({ passed: false, planExists: false })).toBe(true);
    expect(validateTask023RollbackReadinessResult({})).toBe(false);
  });
});
