import { describe, it, expect } from 'vitest';
import { isTask031AdminOperatorRole, resolveStagingRole031, getRolePermissions031, isTask031DeniedRealRole } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - student role is denied admin smoke operations', () => {
  it('should not be admin operator role', () => {
    expect(isTask031AdminOperatorRole('student')).toBe(false);
  });

  it('should resolve to student via resolveStagingRole031', () => {
    expect(resolveStagingRole031('student')).toBe('student');
  });

  it('should be in denied real actor roles', () => {
    expect(isTask031DeniedRealRole('student')).toBe(true);
  });

  it('should not have canRunStagingSmoke permission', () => {
    const perms = getRolePermissions031('student');
    expect(perms.canRunStagingSmoke).toBe(false);
    expect(perms.canViewObservabilityBaseline).toBe(false);
    expect(perms.canViewCanaryReadinessReport).toBe(false);
    expect(perms.canTriggerStagingFailureDrill).toBe(false);
  });

  it('should only have canViewOwnStudentStatus', () => {
    const perms = getRolePermissions031('student');
    expect(perms.canViewOwnStudentStatus).toBe(true);
    expect(perms.canViewAssignedOversightSmoke).toBe(false);
  });

  it('should be denied with case insensitive check', () => {
    expect(isTask031DeniedRealRole('STUDENT')).toBe(true);
  });
});
