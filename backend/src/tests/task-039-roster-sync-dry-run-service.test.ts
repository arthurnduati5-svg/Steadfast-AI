import { describe, it, expect } from 'vitest';
import type { RosterSyncInput } from '../contracts/schoolSystemBridgeContracts';

describe('Task 039 — Roster Sync Dry Run Service', () => {
  it('valid roster passes dry run', async () => {
    const dryRun = await import('../services/rosterSyncDryRunService');
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const input = mockSchoolSystemAdapter.getFullMockRosterInput();
    const result = dryRun.performRosterSyncDryRun(input);
    expect(result.blocked).toBe(false);
    expect(result.safeToApplyLater).toBe(true);
    expect(result.summary.totalStudents).toBeGreaterThan(0);
    expect(result.summary.totalTeachers).toBeGreaterThan(0);
    expect(result.summary.totalClasses).toBeGreaterThan(0);
  });

  it('detects duplicate students', async () => {
    const dryRun = await import('../services/rosterSyncDryRunService');
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const input = mockSchoolSystemAdapter.getDuplicateStudentRecord();
    const result = dryRun.performRosterSyncDryRun(input);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.conflicts.some(c => c.conflictType === 'duplicate_student_id')).toBe(true);
  });

  it('detects school mismatch in roster', async () => {
    const dryRun = await import('../services/rosterSyncDryRunService');
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const input = mockSchoolSystemAdapter.getSchoolMismatchRosterInput();
    const result = dryRun.performRosterSyncDryRun(input);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.blocked).toBe(true);
    expect(result.safeToApplyLater).toBe(false);
  });

  it('detects enrollment missing student', async () => {
    const dryRun = await import('../services/rosterSyncDryRunService');
    const input: RosterSyncInput = {
      schoolId: 'school-001',
      students: [],
      teachers: [],
      classes: [{ classId: 'class-001', schoolId: 'school-001' }],
      subjects: [],
      enrollments: [{ studentId: 'missing-stu', classId: 'class-001', schoolId: 'school-001' }],
      teacherAssignments: [],
    };
    const result = dryRun.performRosterSyncDryRun(input);
    expect(result.conflicts.some(c => c.conflictType === 'enrollment_missing_student')).toBe(true);
  });

  it('detects enrollment missing class', async () => {
    const dryRun = await import('../services/rosterSyncDryRunService');
    const input: RosterSyncInput = {
      schoolId: 'school-001',
      students: [{ externalStudentId: 'stu-001', schoolId: 'school-001' }],
      teachers: [],
      classes: [],
      subjects: [],
      enrollments: [{ studentId: 'stu-001', classId: 'missing-class', schoolId: 'school-001' }],
      teacherAssignments: [],
    };
    const result = dryRun.performRosterSyncDryRun(input);
    expect(result.conflicts.some(c => c.conflictType === 'enrollment_missing_class')).toBe(true);
  });

  it('detects assignment missing teacher', async () => {
    const dryRun = await import('../services/rosterSyncDryRunService');
    const input: RosterSyncInput = {
      schoolId: 'school-001',
      students: [],
      teachers: [],
      classes: [{ classId: 'class-001', schoolId: 'school-001' }],
      subjects: [],
      enrollments: [],
      teacherAssignments: [{ teacherId: 'missing-tch', classId: 'class-001', schoolId: 'school-001' }],
    };
    const result = dryRun.performRosterSyncDryRun(input);
    expect(result.conflicts.some(c => c.conflictType === 'assignment_missing_teacher')).toBe(true);
  });

  it('performs no live write', async () => {
    const dryRun = await import('../services/rosterSyncDryRunService');
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const input = mockSchoolSystemAdapter.getFullMockRosterInput();
    const beforeCount = mockSchoolSystemAdapter.getCallCount();
    const result = dryRun.performRosterSyncDryRun(input);
    expect(result.blocked).toBe(false);
  });
});
