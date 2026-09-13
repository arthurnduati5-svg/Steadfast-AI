import type {
  RosterSyncBatch,
  RosterDiffEntry,
  RosterDiffResult,
  RosterDiffCategory,
  ExternalStudentIdentity,
  ExternalTeacherIdentity,
} from './task021SchoolIntegrationContracts';
import {
  resolveExternalIdentity,
} from './task021SchoolIdentityMappingService';

export async function computeRosterDiff(batch: RosterSyncBatch): Promise<RosterDiffResult> {
  const entries: RosterDiffEntry[] = [];
  const batchId = batch.syncBatchId;

  for (const student of batch.students) {
    const existing = await resolveExternalIdentity(batch.schoolId, student.externalStudentId);
    const diffEntry = diffStudent(student, existing);
    if (diffEntry) entries.push(diffEntry);
  }

  for (const teacher of batch.teachers) {
    const existing = await resolveExternalIdentity(batch.schoolId, teacher.externalTeacherId);
    const diffEntry = diffTeacher(teacher, existing);
    if (diffEntry) entries.push(diffEntry);
  }

  for (const enrollment of (batch.enrollments || [])) {
    const diffEntry = diffEnrollment(enrollment, batch.schoolId);
    if (diffEntry) entries.push(diffEntry);
  }

  for (const assignment of batch.teacherAssignments || []) {
    const diffEntry = diffTeacherAssignment(assignment, batch.schoolId);
    if (diffEntry) entries.push(diffEntry);
  }

  const conflictsFound = entries.filter(
    e => e.category === 'conflict_duplicate_external_id' || e.category === 'conflict_duplicate_tutor_mapping',
  ).length;

  return {
    batchId,
    entries,
    totalChanges: entries.length,
    conflictsFound,
  };
}

function diffStudent(
  incoming: ExternalStudentIdentity,
  existing: any,
): RosterDiffEntry | undefined {
  const incomingStatus = incoming.enrollmentStatus || 'active';

  if (!existing) {
    return {
      category: 'new_student_mapping_needed',
      externalId: incoming.externalStudentId,
      schoolId: incoming.schoolId,
      role: 'student',
      incomingStatus,
      details: 'New student needs tutor learner mapping',
    };
  }

  if (existing.status === 'inactive' && incomingStatus === 'active') {
    return {
      category: 'student_reactivated',
      externalId: incoming.externalStudentId,
      schoolId: incoming.schoolId,
      role: 'student',
      currentStatus: existing.status,
      incomingStatus,
      details: 'Student reactivation detected',
    };
  }

  if (existing.status === 'active' && (incomingStatus === 'inactive' || incomingStatus === 'transferred' || incomingStatus === 'left_school')) {
    return {
      category: 'student_inactivated',
      externalId: incoming.externalStudentId,
      schoolId: incoming.schoolId,
      role: 'student',
      currentStatus: existing.status,
      incomingStatus,
      details: `Student status change: ${existing.status} → ${incomingStatus}`,
    };
  }

  if (existing.status === 'active' && incomingStatus === 'active') {
    return {
      category: 'existing_student_unchanged',
      externalId: incoming.externalStudentId,
      schoolId: incoming.schoolId,
      role: 'student',
      currentStatus: existing.status,
      incomingStatus,
      details: 'Student mapping unchanged',
    };
  }

  return undefined;
}

function diffTeacher(
  incoming: ExternalTeacherIdentity,
  existing: any,
): RosterDiffEntry | undefined {
  if (!existing) {
    return {
      category: 'new_student_mapping_needed',
      externalId: incoming.externalTeacherId,
      schoolId: incoming.schoolId,
      role: 'teacher',
      incomingStatus: 'active',
      details: 'New teacher identity mapping needed',
    };
  }

  return undefined;
}

function diffEnrollment(
  enrollment: { studentId: string; classId: string; subjectId?: string; status?: string },
  schoolId: string,
): RosterDiffEntry | undefined {
  const status = enrollment.status || 'active';

  if (status === 'active') {
    return {
      category: 'class_enrollment_added',
      externalId: `${enrollment.studentId}::${enrollment.classId}`,
      schoolId,
      role: 'student',
      incomingStatus: 'active',
      details: `Student ${enrollment.studentId} enrolled in class ${enrollment.classId}`,
    };
  }

  if (status === 'inactive' || status === 'removed') {
    return {
      category: 'class_enrollment_removed',
      externalId: `${enrollment.studentId}::${enrollment.classId}`,
      schoolId,
      role: 'student',
      currentStatus: 'active',
      incomingStatus: status,
      details: `Student ${enrollment.studentId} removed from class ${enrollment.classId}`,
    };
  }

  return undefined;
}

function diffTeacherAssignment(
  assignment: { teacherId: string; classId: string; subjectId?: string },
  schoolId: string,
): RosterDiffEntry | undefined {
  return {
    category: 'teacher_assignment_added',
    externalId: `${assignment.teacherId}::${assignment.classId}`,
    schoolId,
    role: 'teacher',
    incomingStatus: 'active',
    details: `Teacher ${assignment.teacherId} assigned to class ${assignment.classId}`,
  };
}
