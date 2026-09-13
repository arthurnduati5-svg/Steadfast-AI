import type { TeacherAssignmentScope } from './task021SchoolIntegrationContracts';
import { logger } from '../utils/logger';

interface TeacherAssignment {
  teacherId: string;
  schoolId: string;
  classId: string;
  subjectId?: string;
  assignedStudentIds: string[];
  status: 'active' | 'removed' | 'inactive';
  addedAt: string;
  removedAt?: string;
}

const assignmentStore = new Map<string, TeacherAssignment>();

export function clearAssignmentStore(): void {
  assignmentStore.clear();
}

export function addTeacherAssignment(
  teacherId: string,
  schoolId: string,
  classId: string,
  subjectId?: string,
  assignedStudentIds?: string[],
): void {
  const key = `${schoolId}::${teacherId}::${classId}${subjectId ? `::${subjectId}` : ''}`;
  const existing = assignmentStore.get(key);

  if (existing && existing.status === 'removed') {
    existing.status = 'active';
    existing.assignedStudentIds = assignedStudentIds || [];
    existing.removedAt = undefined;
    return;
  }

  assignmentStore.set(key, {
    teacherId,
    schoolId,
    classId,
    subjectId,
    assignedStudentIds: assignedStudentIds || [],
    status: 'active',
    addedAt: new Date().toISOString(),
  });
}

export function removeTeacherAssignment(
  teacherId: string,
  schoolId: string,
  classId: string,
  subjectId?: string,
): void {
  const key = `${schoolId}::${teacherId}::${classId}${subjectId ? `::${subjectId}` : ''}`;
  const existing = assignmentStore.get(key);
  if (existing) {
    existing.status = 'removed';
    existing.removedAt = new Date().toISOString();
    logger.info({ teacherId, classId, schoolId }, '[TeacherAssignmentScope] Assignment removed');
  }
}

export function getTeacherAssignmentScope(
  teacherId: string,
  schoolId: string,
  classId: string,
  subjectId?: string,
): TeacherAssignmentScope | undefined {
  const key = `${schoolId}::${teacherId}::${classId}${subjectId ? `::${subjectId}` : ''}`;
  const assignment = assignmentStore.get(key);
  if (!assignment || assignment.status !== 'active') return undefined;

  return {
    teacherId,
    schoolId,
    classId,
    subjectId: assignment.subjectId,
    assignedStudentIds: assignment.assignedStudentIds,
    status: 'active',
  };
}

export function isTeacherAssignedToStudent(
  teacherId: string,
  studentId: string,
  schoolId: string,
): boolean {
  for (const [key, assignment] of assignmentStore.entries()) {
    if (
      assignment.teacherId === teacherId &&
      assignment.schoolId === schoolId &&
      assignment.status === 'active' &&
      assignment.assignedStudentIds.includes(studentId)
    ) {
      return true;
    }
  }
  return false;
}

export function isTeacherAssignedAnywhere(
  teacherId: string,
  schoolId: string,
): boolean {
  for (const [key, assignment] of assignmentStore.entries()) {
    if (assignment.teacherId === teacherId && assignment.schoolId === schoolId && assignment.status === 'active') {
      return true;
    }
  }
  return false;
}

export function getTeacherAssignedStudentIds(
  teacherId: string,
  schoolId: string,
): string[] {
  const studentIds = new Set<string>();
  for (const [key, assignment] of assignmentStore.entries()) {
    if (assignment.teacherId === teacherId && assignment.schoolId === schoolId && assignment.status === 'active') {
      for (const sid of assignment.assignedStudentIds) {
        studentIds.add(sid);
      }
    }
  }
  return Array.from(studentIds);
}

export function getTeacherAssignedClassIds(
  teacherId: string,
  schoolId: string,
): string[] {
  const classIds = new Set<string>();
  for (const [key, assignment] of assignmentStore.entries()) {
    if (assignment.teacherId === teacherId && assignment.schoolId === schoolId && assignment.status === 'active') {
      classIds.add(assignment.classId);
    }
  }
  return Array.from(classIds);
}

export function getTeacherAssignmentCounts(schoolId: string): {
  active: number;
  removed: number;
  inactive: number;
} {
  let active = 0;
  let removed = 0;
  let inactive = 0;

  for (const [key, assignment] of assignmentStore.entries()) {
    if (assignment.schoolId !== schoolId) continue;
    if (assignment.status === 'active') active++;
    else if (assignment.status === 'removed') removed++;
    else if (assignment.status === 'inactive') inactive++;
  }

  return { active, removed, inactive };
}
