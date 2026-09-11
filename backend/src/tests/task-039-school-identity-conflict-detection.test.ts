import { describe, it, expect } from 'vitest';
import type { ExternalSchoolIdentityPayload, RosterSyncInput } from '../contracts/schoolSystemBridgeContracts';

describe('Task 039 — School Identity Conflict Detection', () => {
  it('detects duplicate external user identity', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const payloads: ExternalSchoolIdentityPayload[] = [
      { externalUserId: 'ext-user-001', schoolId: 'school-001', role: 'student', externalStudentId: 'stu-001' },
      { externalUserId: 'ext-user-001', schoolId: 'school-001', role: 'student', externalStudentId: 'stu-001' },
    ];
    const result = conflict.detectSchoolIdentityConflicts({ identityPayloads: payloads });
    expect(result.some(c => c.conflictType === 'duplicate_external_user')).toBe(true);
  });

  it('detects cross-role identifier conflict', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const payloads: ExternalSchoolIdentityPayload[] = [
      { externalUserId: 'ext-user-001', schoolId: 'school-001', role: 'student', externalStudentId: 'stu-001' },
      { externalUserId: 'ext-user-001', schoolId: 'school-001', role: 'teacher', externalTeacherId: 'tch-001' },
    ];
    const result = conflict.detectSchoolIdentityConflicts({ identityPayloads: payloads });
    expect(result.some(c => c.conflictType === 'cross_role_identifier')).toBe(true);
  });

  it('detects duplicate tutor learner mapping', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const payloads: ExternalSchoolIdentityPayload[] = [
      { externalUserId: 'ext-a', schoolId: 'school-001', role: 'student', externalStudentId: 'stu-001' },
      { externalUserId: 'ext-b', schoolId: 'school-001', role: 'student', externalStudentId: 'stu-001' },
    ];
    const result = conflict.detectSchoolIdentityConflicts({ identityPayloads: payloads });
    expect(result.some(c => c.conflictType === 'duplicate_tutor_mapping')).toBe(true);
  });

  it('detects cross-school student', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const roster: RosterSyncInput = {
      schoolId: 'school-001',
      students: [{ externalStudentId: 'stu-001', schoolId: 'other-school' }],
      teachers: [],
      classes: [],
      subjects: [],
      enrollments: [],
      teacherAssignments: [],
    };
    const result = conflict.detectSchoolIdentityConflicts({ rosterInput: roster });
    expect(result.some(c => c.conflictType === 'cross_school_student')).toBe(true);
  });

  it('detects class school mismatch', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const roster: RosterSyncInput = {
      schoolId: 'school-001',
      students: [],
      teachers: [],
      classes: [{ classId: 'class-001', schoolId: 'other-school' }],
      subjects: [],
      enrollments: [],
      teacherAssignments: [],
    };
    const result = conflict.detectSchoolIdentityConflicts({ rosterInput: roster });
    expect(result.some(c => c.conflictType === 'class_school_mismatch')).toBe(true);
  });

  it('detects subject school mismatch', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const roster: RosterSyncInput = {
      schoolId: 'school-001',
      students: [],
      teachers: [],
      classes: [],
      subjects: [{ subjectId: 'sub-001', schoolId: 'other-school' }],
      enrollments: [],
      teacherAssignments: [],
    };
    const result = conflict.detectSchoolIdentityConflicts({ rosterInput: roster });
    expect(result.some(c => c.conflictType === 'subject_school_mismatch')).toBe(true);
  });

  it('detects enrollment missing student', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const roster: RosterSyncInput = {
      schoolId: 'school-001',
      students: [],
      teachers: [],
      classes: [{ classId: 'class-001', schoolId: 'school-001' }],
      subjects: [],
      enrollments: [{ studentId: 'missing-stu', classId: 'class-001', schoolId: 'school-001' }],
      teacherAssignments: [],
    };
    const result = conflict.detectSchoolIdentityConflicts({ rosterInput: roster });
    expect(result.some(c => c.conflictType === 'enrollment_missing_student')).toBe(true);
  });

  it('detects enrollment missing class', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const roster: RosterSyncInput = {
      schoolId: 'school-001',
      students: [{ externalStudentId: 'stu-001', schoolId: 'school-001' }],
      teachers: [],
      classes: [],
      subjects: [],
      enrollments: [{ studentId: 'stu-001', classId: 'missing-class', schoolId: 'school-001' }],
      teacherAssignments: [],
    };
    const result = conflict.detectSchoolIdentityConflicts({ rosterInput: roster });
    expect(result.some(c => c.conflictType === 'enrollment_missing_class')).toBe(true);
  });

  it('detects assignment missing teacher', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const roster: RosterSyncInput = {
      schoolId: 'school-001',
      students: [],
      teachers: [],
      classes: [{ classId: 'class-001', schoolId: 'school-001' }],
      subjects: [],
      enrollments: [],
      teacherAssignments: [{ teacherId: 'missing-tch', classId: 'class-001', schoolId: 'school-001' }],
    };
    const result = conflict.detectSchoolIdentityConflicts({ rosterInput: roster });
    expect(result.some(c => c.conflictType === 'assignment_missing_teacher')).toBe(true);
  });

  it('hasBlockingConflicts returns true when conflicts exist', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const payloads: ExternalSchoolIdentityPayload[] = [
      { externalUserId: 'ext-user-001', schoolId: 'school-001', role: 'student', externalStudentId: 'stu-001' },
      { externalUserId: 'ext-user-001', schoolId: 'school-001', role: 'student', externalStudentId: 'stu-001' },
    ];
    const result = conflict.detectSchoolIdentityConflicts({ identityPayloads: payloads });
    expect(conflict.hasBlockingConflicts(result)).toBe(true);
  });

  it('returns no conflicts for clean input', async () => {
    const conflict = await import('../services/schoolIdentityConflictDetectionService');
    const payloads: ExternalSchoolIdentityPayload[] = [
      { externalUserId: 'ext-a', schoolId: 'school-001', role: 'student', externalStudentId: 'stu-a' },
      { externalUserId: 'ext-b', schoolId: 'school-001', role: 'teacher', externalTeacherId: 'tch-b' },
    ];
    const result = conflict.detectSchoolIdentityConflicts({ identityPayloads: payloads });
    expect(result.length).toBe(0);
  });
});
