import { describe, it, expect } from 'vitest';
import { getSchoolWideReadinessRolePermissions035, resolveSchoolWideReadinessRole035 } from '../contracts/task035SchoolWideReadinessContracts';

describe('task035 role security contracts', () => {
  describe('getSchoolWideReadinessRolePermissions035', () => {
    it('gives admin all permissions', () => {
      const perms = getSchoolWideReadinessRolePermissions035('admin');
      expect(perms.canViewStatus).toBe(true);
      expect(perms.canViewReleaseBoard).toBe(true);
      expect(perms.canViewStudentNotice).toBe(true);
      expect(perms.canSimulate).toBe(true);
      expect(perms.canComputeDecision).toBe(true);
      expect(perms.canViewReport).toBe(true);
      expect(perms.canApprove).toBe(true);
    });

    it('gives operator simulation and compute but not approve', () => {
      const perms = getSchoolWideReadinessRolePermissions035('operator');
      expect(perms.canSimulate).toBe(false);
      expect(perms.canComputeDecision).toBe(true);
      expect(perms.canApprove).toBe(false);
      expect(perms.canViewReport).toBe(true);
    });

    it('restricts student to status and notice only', () => {
      const perms = getSchoolWideReadinessRolePermissions035('student');
      expect(perms.canViewStatus).toBe(true);
      expect(perms.canViewStudentNotice).toBe(true);
      expect(perms.canViewReleaseBoard).toBe(false);
      expect(perms.canSimulate).toBe(false);
      expect(perms.canComputeDecision).toBe(false);
      expect(perms.canViewReport).toBe(false);
      expect(perms.canApprove).toBe(false);
    });

    it('restricts teacher to status, release board, and notice only', () => {
      const perms = getSchoolWideReadinessRolePermissions035('teacher');
      expect(perms.canViewStatus).toBe(true);
      expect(perms.canViewReleaseBoard).toBe(true);
      expect(perms.canViewStudentNotice).toBe(true);
      expect(perms.canSimulate).toBe(false);
      expect(perms.canComputeDecision).toBe(false);
      expect(perms.canViewReport).toBe(false);
      expect(perms.canApprove).toBe(false);
    });

    it('returns all false for unknown role', () => {
      const perms = getSchoolWideReadinessRolePermissions035('unknown');
      expect(perms.canViewStatus).toBe(false);
      expect(perms.canViewReleaseBoard).toBe(false);
      expect(perms.canViewStudentNotice).toBe(false);
      expect(perms.canSimulate).toBe(false);
      expect(perms.canComputeDecision).toBe(false);
      expect(perms.canViewReport).toBe(false);
      expect(perms.canApprove).toBe(false);
    });
  });

  describe('resolveSchoolWideReadinessRole035', () => {
    it('resolves admin case-insensitively', () => {
      expect(resolveSchoolWideReadinessRole035('ADMIN')).toBe('admin');
      expect(resolveSchoolWideReadinessRole035('Admin')).toBe('admin');
    });

    it('resolves teacher_lead from hyphenated form', () => {
      expect(resolveSchoolWideReadinessRole035('teacher-lead')).toBe('teacher_lead');
    });

    it('returns unknown for unrecognized role', () => {
      expect(resolveSchoolWideReadinessRole035('headmaster')).toBe('unknown');
    });

    it('returns unknown for empty string', () => {
      expect(resolveSchoolWideReadinessRole035('')).toBe('unknown');
    });
  });
});
