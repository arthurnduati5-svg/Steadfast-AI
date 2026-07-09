import { describe, it, expect } from 'vitest';
import { isTask031AdminOperatorRole, resolveStagingRole031, getRolePermissions031, isTask031DeniedRealRole } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - teacher is denied staging smoke run', () => {
  it('should not be admin operator role', () => {
    expect(isTask031AdminOperatorRole('teacher')).toBe(false);
  });

  it('should resolve to teacher', () => {
    expect(resolveStagingRole031('teacher')).toBe('teacher');
  });

  it('should be in denied real actor roles', () => {
    expect(isTask031DeniedRealRole('teacher')).toBe(true);
  });

  it('should not have canRunStagingSmoke permission', () => {
    const perms = getRolePermissions031('teacher');
    expect(perms.canRunStagingSmoke).toBe(false);
    expect(perms.canViewObservabilityBaseline).toBe(false);
    expect(perms.canViewCanaryReadinessReport).toBe(false);
  });

  it('should have only canViewAssignedOversightSmoke', () => {
    const perms = getRolePermissions031('teacher');
    expect(perms.canViewAssignedOversightSmoke).toBe(true);
    expect(perms.canViewOwnStudentStatus).toBe(false);
  });

  it('should be denied from triggering failure drills', () => {
    const perms = getRolePermissions031('teacher');
    expect(perms.canTriggerStagingFailureDrill).toBe(false);
  });
});
