import { describe, it, expect } from 'vitest';
import { isTask031AdminOperatorRole, resolveStagingRole031, getRolePermissions031 } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - admin/operator can access smoke routes (contract check)', () => {
  it('should return true for admin role', () => {
    expect(isTask031AdminOperatorRole('admin')).toBe(true);
  });

  it('should return true for operator role', () => {
    expect(isTask031AdminOperatorRole('operator')).toBe(true);
  });

  it('should return false for teacher role', () => {
    expect(isTask031AdminOperatorRole('teacher')).toBe(false);
  });

  it('should return false for student role', () => {
    expect(isTask031AdminOperatorRole('student')).toBe(false);
  });

  it('should return false for unknown role', () => {
    expect(isTask031AdminOperatorRole('unknown')).toBe(false);
  });

  it('should resolve admin via resolveStagingRole031', () => {
    expect(resolveStagingRole031('admin')).toBe('admin');
  });

  it('should resolve operator via resolveStagingRole031', () => {
    expect(resolveStagingRole031('operator')).toBe('operator');
  });

  it('should give admin canRunStagingSmoke permission', () => {
    const perms = getRolePermissions031('admin');
    expect(perms.canRunStagingSmoke).toBe(true);
    expect(perms.canViewObservabilityBaseline).toBe(true);
    expect(perms.canViewCanaryReadinessReport).toBe(true);
    expect(perms.canTriggerStagingFailureDrill).toBe(true);
  });

  it('should give operator the same admin permissions', () => {
    const perms = getRolePermissions031('operator');
    expect(perms.canRunStagingSmoke).toBe(true);
    expect(perms.canViewObservabilityBaseline).toBe(true);
    expect(perms.canViewCanaryReadinessReport).toBe(true);
    expect(perms.canTriggerStagingFailureDrill).toBe(true);
  });
});
