import { describe, it, expect } from 'vitest';
import { getSchoolWideReadinessRolePermissions035 } from '../contracts/task035SchoolWideReadinessContracts';

describe('task035 student-role denial contract', () => {
  it('student cannot simulate', () => {
    const perms = getSchoolWideReadinessRolePermissions035('student');
    expect(perms.canSimulate).toBe(false);
  });

  it('student cannot compute decision', () => {
    const perms = getSchoolWideReadinessRolePermissions035('student');
    expect(perms.canComputeDecision).toBe(false);
  });

  it('student cannot approve', () => {
    const perms = getSchoolWideReadinessRolePermissions035('student');
    expect(perms.canApprove).toBe(false);
  });

  it('student cannot view release board', () => {
    const perms = getSchoolWideReadinessRolePermissions035('student');
    expect(perms.canViewReleaseBoard).toBe(false);
  });

  it('student cannot view report', () => {
    const perms = getSchoolWideReadinessRolePermissions035('student');
    expect(perms.canViewReport).toBe(false);
  });

  it('student can only view status and student notice', () => {
    const perms = getSchoolWideReadinessRolePermissions035('student');
    const allowed = Object.entries(perms).filter(([, v]) => v).map(([k]) => k);
    expect(allowed).toEqual(['canViewStatus', 'canViewStudentNotice']);
  });
});
