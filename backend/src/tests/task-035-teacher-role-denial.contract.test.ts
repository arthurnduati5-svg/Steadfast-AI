import { describe, it, expect } from 'vitest';
import { getSchoolWideReadinessRolePermissions035 } from '../contracts/task035SchoolWideReadinessContracts';

describe('task035 teacher-role denial contract', () => {
  it('teacher cannot simulate', () => {
    const perms = getSchoolWideReadinessRolePermissions035('teacher');
    expect(perms.canSimulate).toBe(false);
  });

  it('teacher cannot compute decision', () => {
    const perms = getSchoolWideReadinessRolePermissions035('teacher');
    expect(perms.canComputeDecision).toBe(false);
  });

  it('teacher cannot approve', () => {
    const perms = getSchoolWideReadinessRolePermissions035('teacher');
    expect(perms.canApprove).toBe(false);
  });

  it('teacher cannot view report', () => {
    const perms = getSchoolWideReadinessRolePermissions035('teacher');
    expect(perms.canViewReport).toBe(false);
  });

  it('teacher can view status, release board, and student notice', () => {
    const perms = getSchoolWideReadinessRolePermissions035('teacher');
    expect(perms.canViewStatus).toBe(true);
    expect(perms.canViewReleaseBoard).toBe(true);
    expect(perms.canViewStudentNotice).toBe(true);
  });

  it('teacher_lead has same restrictions as teacher', () => {
    const teacherPerms = getSchoolWideReadinessRolePermissions035('teacher');
    const leadPerms = getSchoolWideReadinessRolePermissions035('teacher_lead');
    expect(teacherPerms).toEqual(leadPerms);
  });
});
