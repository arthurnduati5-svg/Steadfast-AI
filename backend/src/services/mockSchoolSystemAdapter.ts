import type {
  ExternalSchoolIdentityPayload,
  ExternalClassRecord,
  ExternalSubjectRecord,
  ExternalEnrollmentRecord,
  ExternalTeacherAssignmentRecord,
  RosterSyncInput,
  RosterSyncDryRunResult,
  SchoolSystemProviderName,
} from '../contracts/schoolSystemBridgeContracts';
import {
  SCHOOL_CONNECTOR_SAFE_IDENTIFIERS,
  getDefaultSchoolProviderMode,
} from '../contracts/schoolSystemBridgeContracts';
import { randomUUID } from 'crypto';

export class MockSchoolSystemAdapter {
  public readonly name: SchoolSystemProviderName = 'mock_school_system';
  public readonly mode = getDefaultSchoolProviderMode();
  private callCount = 0;

  getCallCount(): number {
    return this.callCount;
  }

  getVerifiedSchoolIdentity(studentId?: string): ExternalSchoolIdentityPayload {
    this.callCount++;
    const sid = studentId || SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalStudentId;
    return {
      externalUserId: `mock-ext-${sid}`,
      schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
      role: 'student',
      externalStudentId: sid,
      classId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockClassId,
      subjectId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSubjectId,
      schoolYear: '2025-2026',
      term: 'term_1',
      issuedAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      issuer: 'mock-school-system',
      audience: 'steadfast-tutor',
    };
  }

  getVerifiedTeacherIdentity(): ExternalSchoolIdentityPayload {
    this.callCount++;
    return {
      externalUserId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalUserId,
      schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
      role: 'teacher',
      externalTeacherId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalTeacherId,
      classId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockClassId,
      subjectId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSubjectId,
      schoolYear: '2025-2026',
      term: 'term_1',
      issuedAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      issuer: 'mock-school-system',
      audience: 'steadfast-tutor',
    };
  }

  getVerifiedAdminIdentity(): ExternalSchoolIdentityPayload {
    this.callCount++;
    return {
      externalUserId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalAdminId,
      schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
      role: 'school_admin',
      schoolYear: '2025-2026',
      term: 'term_1',
      issuedAt: new Date(Date.now() - 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      issuer: 'mock-school-system',
      audience: 'steadfast-tutor',
    };
  }

  getMissingSchoolContext(): ExternalSchoolIdentityPayload {
    this.callCount++;
    return {
      externalUserId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalUserId,
      schoolId: '',
      role: 'student',
      externalStudentId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalStudentId,
    };
  }

  getExpiredIdentity(): ExternalSchoolIdentityPayload {
    this.callCount++;
    return {
      externalUserId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalUserId,
      schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
      role: 'student',
      externalStudentId: 'mock-stu-expired',
      expiresAt: new Date(Date.now() - 86400000).toISOString(),
      issuer: 'mock-school-system',
      audience: 'steadfast-tutor',
    };
  }

  getRevokedIdentityPayload(): ExternalSchoolIdentityPayload {
    this.callCount++;
    return {
      externalUserId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalUserId,
      schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
      role: 'student',
      externalStudentId: 'mock-stu-revoked',
      expiresAt: new Date(Date.now() - 86400000 * 365).toISOString(),
      issuer: 'mock-school-system',
      audience: 'steadfast-tutor',
    };
  }

  getInvalidRoleIdentity(): ExternalSchoolIdentityPayload {
    this.callCount++;
    return {
      externalUserId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockExternalUserId,
      schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
      role: 'invalid_role_xyz',
      externalStudentId: 'mock-stu-invalid-role',
    };
  }

  getDuplicateStudentRecord(): RosterSyncInput {
    this.callCount++;
    return {
      schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
      schoolYear: '2025-2026',
      students: [
        {
          externalStudentId: 'dup-stu-001',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Student A',
          classId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockClassId,
        },
        {
          externalStudentId: 'dup-stu-001',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Student A Duplicate',
          classId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockClassId,
        },
      ],
      teachers: [],
      classes: [],
      subjects: [],
      enrollments: [],
      teacherAssignments: [],
    };
  }

  getFullMockRosterInput(): RosterSyncInput {
    this.callCount++;
    return {
      schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
      schoolYear: '2025-2026',
      term: 'term_1',
      students: [
        {
          externalStudentId: 'mock-stu-001',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Student One',
          grade: 'Grade 10',
          classId: 'mock-class-001',
          subjectIds: ['mock-sub-001', 'mock-sub-002'],
          enrollmentStatus: 'active',
        },
        {
          externalStudentId: 'mock-stu-002',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Student Two',
          grade: 'Grade 10',
          classId: 'mock-class-001',
          subjectIds: ['mock-sub-001'],
          enrollmentStatus: 'active',
        },
        {
          externalStudentId: 'mock-stu-003',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Student Three',
          grade: 'Grade 11',
          classId: 'mock-class-002',
          subjectIds: ['mock-sub-002'],
          enrollmentStatus: 'inactive',
        },
      ],
      teachers: [
        {
          externalTeacherId: 'mock-tch-001',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Teacher One',
          assignedClassIds: ['mock-class-001'],
          assignedSubjectIds: ['mock-sub-001'],
        },
        {
          externalTeacherId: 'mock-tch-002',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Teacher Two',
          assignedClassIds: ['mock-class-002'],
          assignedSubjectIds: ['mock-sub-002'],
        },
      ],
      classes: [
        {
          classId: 'mock-class-001',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Class 10A',
          grade: 'Grade 10',
        },
        {
          classId: 'mock-class-002',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Class 11B',
          grade: 'Grade 11',
        },
      ],
      subjects: [
        {
          subjectId: 'mock-sub-001',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Mathematics',
          code: 'MATH-10',
        },
        {
          subjectId: 'mock-sub-002',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          name: 'Fake Science',
          code: 'SCI-10',
        },
      ],
      enrollments: [
        {
          studentId: 'mock-stu-001',
          classId: 'mock-class-001',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          subjectId: 'mock-sub-001',
          status: 'active',
        },
        {
          studentId: 'mock-stu-002',
          classId: 'mock-class-001',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          subjectId: 'mock-sub-001',
          status: 'active',
        },
        {
          studentId: 'mock-stu-003',
          classId: 'mock-class-002',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          subjectId: 'mock-sub-002',
          status: 'inactive',
        },
      ],
      teacherAssignments: [
        {
          teacherId: 'mock-tch-001',
          classId: 'mock-class-001',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          subjectId: 'mock-sub-001',
          status: 'active',
        },
        {
          teacherId: 'mock-tch-002',
          classId: 'mock-class-002',
          schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
          subjectId: 'mock-sub-002',
          status: 'active',
        },
      ],
    };
  }

  getSchoolMismatchRosterInput(): RosterSyncInput {
    this.callCount++;
    return {
      schoolId: SCHOOL_CONNECTOR_SAFE_IDENTIFIERS.mockSchoolId,
      schoolYear: '2025-2026',
      students: [
        {
          externalStudentId: 'mock-stu-001',
          schoolId: 'different-school-999',
          name: 'Fake Student Other School',
        },
      ],
      teachers: [],
      classes: [],
      subjects: [],
      enrollments: [],
      teacherAssignments: [],
    };
  }
}

export const mockSchoolSystemAdapter = new MockSchoolSystemAdapter();
