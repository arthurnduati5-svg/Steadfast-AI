import type {
  SchoolIdentityConflict,
  SchoolIdentityConflictType,
  RosterSyncInput,
  ExternalSchoolIdentityPayload,
} from '../contracts/schoolSystemBridgeContracts';

export interface ConflictDetectionInput {
  rosterInput?: RosterSyncInput;
  identityPayloads?: ExternalSchoolIdentityPayload[];
}

export function detectSchoolIdentityConflicts(
  input: ConflictDetectionInput,
): SchoolIdentityConflict[] {
  const conflicts: SchoolIdentityConflict[] = [];

  if (input.identityPayloads) {
    detectPayloadConflicts(input.identityPayloads, conflicts);
  }

  if (input.rosterInput) {
    detectRosterConflicts(input.rosterInput, conflicts);
  }

  return conflicts;
}

function detectPayloadConflicts(
  payloads: ExternalSchoolIdentityPayload[],
  conflicts: SchoolIdentityConflict[],
): void {
  const externalUserMap = new Map<string, ExternalSchoolIdentityPayload[]>();
  const tutorCandidateMap = new Map<string, ExternalSchoolIdentityPayload[]>();

  for (const p of payloads) {
    const userKey = `${p.schoolId}::${p.externalUserId}`;
    const existing = externalUserMap.get(userKey) || [];
    existing.push(p);
    externalUserMap.set(userKey, existing);

    if (p.externalStudentId) {
      const studentKey = `stu::${p.schoolId}::${p.externalStudentId}`;
      const existingStudent = tutorCandidateMap.get(studentKey) || [];
      existingStudent.push(p);
      tutorCandidateMap.set(studentKey, existingStudent);
    }
  }

  for (const [key, entries] of externalUserMap) {
    if (entries.length > 1) {
      const roles = [...new Set(entries.map(e => e.role))];
      if (roles.length > 1) {
        conflicts.push({
          conflictType: 'cross_role_identifier',
          externalUserId: entries[0].externalUserId,
          schoolId: entries[0].schoolId,
          description: `Same external user ID mapped to multiple roles: ${roles.join(', ')}`,
          safeDetails: 'Cross-role identity conflict detected.',
        });
      } else {
        conflicts.push({
          conflictType: 'duplicate_external_user',
          externalUserId: entries[0].externalUserId,
          schoolId: entries[0].schoolId,
          description: `Same external user appears ${entries.length} times in payload`,
          safeDetails: 'Duplicate external user identity.',
        });
      }
    }
  }

  for (const [key, entries] of tutorCandidateMap) {
    if (entries.length > 1) {
      conflicts.push({
        conflictType: 'duplicate_tutor_mapping',
        externalUserId: entries[0].externalUserId,
        tutorLearnerId: `tl-${entries[0].externalStudentId}`,
        schoolId: entries[0].schoolId,
        description: `Same student ID mapped ${entries.length} times`,
        safeDetails: 'Duplicate tutor learner mapping candidate.',
      });
    }
  }
}

function detectRosterConflicts(
  roster: RosterSyncInput,
  conflicts: SchoolIdentityConflict[],
): void {
  for (const student of roster.students) {
    if (student.schoolId && roster.schoolId && student.schoolId !== roster.schoolId) {
      conflicts.push({
        conflictType: 'cross_school_student',
        schoolId: roster.schoolId,
        description: `Student ${student.externalStudentId} belongs to school ${student.schoolId} but roster is for ${roster.schoolId}`,
        safeDetails: 'Cross-school student reference.',
      });
    }
  }

  for (const cls of roster.classes) {
    if (cls.schoolId !== roster.schoolId) {
      conflicts.push({
        conflictType: 'class_school_mismatch',
        schoolId: roster.schoolId,
        description: `Class ${cls.classId} belongs to school ${cls.schoolId} but roster is for ${roster.schoolId}`,
        safeDetails: 'Class school mismatch.',
      });
    }
  }

  for (const subject of roster.subjects) {
    if (subject.schoolId !== roster.schoolId) {
      conflicts.push({
        conflictType: 'subject_school_mismatch',
        schoolId: roster.schoolId,
        description: `Subject ${subject.subjectId} belongs to school ${subject.schoolId} but roster is for ${roster.schoolId}`,
        safeDetails: 'Subject school mismatch.',
      });
    }
  }

  for (const enrollment of roster.enrollments) {
    if (!roster.students.some(s => s.externalStudentId === enrollment.studentId)) {
      conflicts.push({
        conflictType: 'enrollment_missing_student',
        schoolId: roster.schoolId,
        description: `Enrollment references student ${enrollment.studentId} not in roster`,
        safeDetails: 'Missing student record in enrollment.',
      });
    }
    if (!roster.classes.some(c => c.classId === enrollment.classId)) {
      conflicts.push({
        conflictType: 'enrollment_missing_class',
        schoolId: roster.schoolId,
        description: `Enrollment references class ${enrollment.classId} not in roster`,
        safeDetails: 'Missing class record in enrollment.',
      });
    }
  }

  for (const assignment of roster.teacherAssignments) {
    if (!roster.teachers.some(t => t.externalTeacherId === assignment.teacherId)) {
      conflicts.push({
        conflictType: 'assignment_missing_teacher',
        schoolId: roster.schoolId,
        description: `Assignment references teacher ${assignment.teacherId} not in roster`,
        safeDetails: 'Missing teacher record in assignment.',
      });
    }
    if (!roster.classes.some(c => c.classId === assignment.classId)) {
      conflicts.push({
        conflictType: 'assignment_missing_class_subject',
        schoolId: roster.schoolId,
        description: `Assignment references class ${assignment.classId} not in roster`,
        safeDetails: 'Missing class record in teacher assignment.',
      });
    }
  }
}

export function hasBlockingConflicts(conflicts: SchoolIdentityConflict[]): boolean {
  return conflicts.length > 0;
}
