import type {
  RosterSyncInput,
  RosterSyncDryRunResult,
  RosterSyncConflict,
  RosterSyncDryRunSummary,
} from '../contracts/schoolSystemBridgeContracts';
import { randomUUID } from 'crypto';

export function performRosterSyncDryRun(input: RosterSyncInput): RosterSyncDryRunResult {
  const conflicts: RosterSyncConflict[] = [];
  let warnings = 0;

  const seenStudentIds = new Set<string>();
  for (const student of input.students) {
    if (seenStudentIds.has(student.externalStudentId)) {
      conflicts.push({
        conflictType: 'duplicate_student_id',
        externalId: student.externalStudentId,
        schoolId: input.schoolId,
        description: `Duplicate student ID: ${student.externalStudentId}`,
        severity: 'high',
        safeDetails: `Student ${student.externalStudentId} appears multiple times in the roster.`,
      });
    }
    seenStudentIds.add(student.externalStudentId);

    if (student.schoolId !== input.schoolId) {
      conflicts.push({
        conflictType: 'student_school_mismatch',
        externalId: student.externalStudentId,
        schoolId: input.schoolId,
        description: `Student ${student.externalStudentId} belongs to school ${student.schoolId} but roster is for ${input.schoolId}`,
        severity: 'high',
        safeDetails: 'School mismatch detected in student record.',
      });
    }
  }

  const seenTeacherIds = new Set<string>();
  for (const teacher of input.teachers) {
    if (seenTeacherIds.has(teacher.externalTeacherId)) {
      conflicts.push({
        conflictType: 'duplicate_teacher_id',
        externalId: teacher.externalTeacherId,
        schoolId: input.schoolId,
        description: `Duplicate teacher ID: ${teacher.externalTeacherId}`,
        severity: 'high',
        safeDetails: `Teacher ${teacher.externalTeacherId} appears multiple times in the roster.`,
      });
    }
    seenTeacherIds.add(teacher.externalTeacherId);

    if (teacher.schoolId !== input.schoolId) {
      conflicts.push({
        conflictType: 'teacher_school_mismatch',
        externalId: teacher.externalTeacherId,
        schoolId: input.schoolId,
        description: `Teacher ${teacher.externalTeacherId} belongs to school ${teacher.schoolId} but roster is for ${input.schoolId}`,
        severity: 'high',
        safeDetails: 'School mismatch detected in teacher record.',
      });
    }
  }

  const seenClassIds = new Set<string>();
  for (const cls of input.classes) {
    if (seenClassIds.has(cls.classId)) {
      conflicts.push({
        conflictType: 'duplicate_class_id',
        externalId: cls.classId,
        schoolId: input.schoolId,
        description: `Duplicate class ID: ${cls.classId}`,
        severity: 'medium',
        safeDetails: `Class ${cls.classId} appears multiple times.`,
      });
    }
    seenClassIds.add(cls.classId);

    if (cls.schoolId !== input.schoolId) {
      conflicts.push({
        conflictType: 'class_school_mismatch',
        externalId: cls.classId,
        schoolId: input.schoolId,
        description: `Class ${cls.classId} belongs to school ${cls.schoolId} but roster is for ${input.schoolId}`,
        severity: 'high',
        safeDetails: 'School mismatch detected in class record.',
      });
    }
  }

  const seenSubjectIds = new Set<string>();
  for (const subject of input.subjects) {
    if (seenSubjectIds.has(subject.subjectId)) {
      conflicts.push({
        conflictType: 'duplicate_subject_id',
        externalId: subject.subjectId,
        schoolId: input.schoolId,
        description: `Duplicate subject ID: ${subject.subjectId}`,
        severity: 'medium',
        safeDetails: `Subject ${subject.subjectId} appears multiple times.`,
      });
    }
    seenSubjectIds.add(subject.subjectId);

    if (subject.schoolId !== input.schoolId) {
      conflicts.push({
        conflictType: 'subject_school_mismatch',
        externalId: subject.subjectId,
        schoolId: input.schoolId,
        description: `Subject ${subject.subjectId} belongs to school ${subject.schoolId} but roster is for ${input.schoolId}`,
        severity: 'high',
        safeDetails: 'School mismatch detected in subject record.',
      });
    }
  }

  // R8-F: pre-indexed membership lookup. seenStudentIds / seenTeacherIds /
  // seenClassIds are fully populated by the duplicate-detection passes above,
  // so enrollment/assignment validation below is O(enrollments + assignments)
  // via Set.has() instead of O(enrollments x students) repeated .some() scans.
  // Overall dry-run shape: O(total roster payload). No contract change.
  for (const enrollment of input.enrollments) {
    if (!seenStudentIds.has(enrollment.studentId)) {
      conflicts.push({
        conflictType: 'enrollment_missing_student',
        externalId: enrollment.studentId,
        schoolId: input.schoolId,
        description: `Enrollment references student ${enrollment.studentId} not in roster`,
        severity: 'high',
        safeDetails: 'Missing student in enrollment.',
      });
      warnings++;
    }
    if (!seenClassIds.has(enrollment.classId)) {
      conflicts.push({
        conflictType: 'enrollment_missing_class',
        externalId: enrollment.classId,
        schoolId: input.schoolId,
        description: `Enrollment references class ${enrollment.classId} not in roster`,
        severity: 'high',
        safeDetails: 'Missing class in enrollment.',
      });
      warnings++;
    }
    if (enrollment.schoolId !== input.schoolId) {
      conflicts.push({
        conflictType: 'enrollment_school_mismatch',
        externalId: enrollment.studentId,
        schoolId: input.schoolId,
        description: `Enrollment for student ${enrollment.studentId} belongs to school ${enrollment.schoolId} but roster is for ${input.schoolId}`,
        severity: 'high',
        safeDetails: 'School mismatch in enrollment.',
      });
    }
  }

  for (const assignment of input.teacherAssignments) {
    if (!seenTeacherIds.has(assignment.teacherId)) {
      conflicts.push({
        conflictType: 'assignment_missing_teacher',
        externalId: assignment.teacherId,
        schoolId: input.schoolId,
        description: `Assignment references teacher ${assignment.teacherId} not in roster`,
        severity: 'high',
        safeDetails: 'Missing teacher in assignment.',
      });
      warnings++;
    }
    if (!seenClassIds.has(assignment.classId)) {
      conflicts.push({
        conflictType: 'assignment_missing_class',
        externalId: assignment.classId,
        schoolId: input.schoolId,
        description: `Assignment references class ${assignment.classId} not in roster`,
        severity: 'high',
        safeDetails: 'Missing class in assignment.',
      });
      warnings++;
    }
    if (assignment.schoolId !== input.schoolId) {
      conflicts.push({
        conflictType: 'assignment_school_mismatch',
        externalId: assignment.teacherId,
        schoolId: input.schoolId,
        description: `Assignment for teacher ${assignment.teacherId} belongs to school ${assignment.schoolId} but roster is for ${input.schoolId}`,
        severity: 'high',
        safeDetails: 'School mismatch in teacher assignment.',
      });
    }
  }

  const summary: RosterSyncDryRunSummary = {
    totalStudents: input.students.length,
    totalTeachers: input.teachers.length,
    totalClasses: input.classes.length,
    totalSubjects: input.subjects.length,
    totalEnrollments: input.enrollments.length,
    totalTeacherAssignments: input.teacherAssignments.length,
    wouldCreate: input.students.length + input.teachers.length + input.classes.length + input.subjects.length,
    wouldUpdate: 0,
    wouldDeactivate: 0,
    conflicts: conflicts.length,
    warnings,
    blocked: conflicts.filter(c => c.severity === 'high').length,
  };

  const hasBlockingConflicts = conflicts.some(c => c.severity === 'high');

  return {
    dryRunId: `dry-run-${randomUUID()}`,
    summary,
    conflicts,
    blocked: hasBlockingConflicts,
    safeToApplyLater: !hasBlockingConflicts,
    reasonCodes: [
      hasBlockingConflicts ? 'blocking_conflicts_found' : 'dry_run_completed',
      `total_conflicts:${conflicts.length}`,
      `blocking_conflicts:${conflicts.filter(c => c.severity === 'high').length}`,
    ],
  };
}
