import { describe, it, expect } from 'vitest';
import { getSchoolWideReadinessRolePermissions035, resolveSchoolWideReadinessRole035 } from '../contracts/task035SchoolWideReadinessContracts';

describe('task035 unknown-role denial contract', () => {
  it('unknown role gets all permissions set to false', () => {
    const perms = getSchoolWideReadinessRolePermissions035('unknown');
    const allValues = Object.values(perms);
    expect(allValues.every(v => v === false)).toBe(true);
  });

  it('unknown role cannot view status', () => {
    const perms = getSchoolWideReadinessRolePermissions035('unknown');
    expect(perms.canViewStatus).toBe(false);
  });

  it('unknown role cannot view release board', () => {
    const perms = getSchoolWideReadinessRolePermissions035('unknown');
    expect(perms.canViewReleaseBoard).toBe(false);
  });

  it('unknown role cannot access any route', () => {
    const perms = getSchoolWideReadinessRolePermissions035('unknown');
    expect(perms.canViewStatus).toBe(false);
    expect(perms.canViewReleaseBoard).toBe(false);
    expect(perms.canViewStudentNotice).toBe(false);
    expect(perms.canSimulate).toBe(false);
    expect(perms.canComputeDecision).toBe(false);
    expect(perms.canViewReport).toBe(false);
    expect(perms.canApprove).toBe(false);
  });

  it('resolveSchoolWideReadinessRole035 returns unknown for unregistered roles', () => {
    expect(resolveSchoolWideReadinessRole035('guest')).toBe('unknown');
    expect(resolveSchoolWideReadinessRole035('superadmin')).toBe('unknown');
    expect(resolveSchoolWideReadinessRole035('moderator')).toBe('unknown');
  });
});
