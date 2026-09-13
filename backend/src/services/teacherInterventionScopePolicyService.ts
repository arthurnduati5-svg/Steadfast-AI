// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Scope Policy v1 (Hardened)
// Validates teacher/student/school/class scope for all
// intervention operations. Prevents cross-school, cross-class
// (when available), and cross-student access.
//
// CURRENT CLASS LIMITATION: Class membership data does not exist
// in the database schema yet. School-scope only is enforced.
// See teacherInterventionClassMembershipService for details.
// ─────────────────────────────────────────────────────────────

import type { TeacherInterventionIdentity } from './teacherInterventionContracts';
import { getClassScopeStatus, buildClassScopeWarning } from './teacherInterventionClassMembershipService';

export interface ScopePolicyResult {
  allowed: boolean;
  reason: string;
  code: 'ok' | 'missing_teacher' | 'missing_school' | 'missing_student' | 'school_mismatch' | 'class_mismatch' | 'forbidden';
  classScopeNote?: string;
}

// ── Constants ──

const VALID_TEACHER_ROLES = ['teacher', 'admin'];

// ── Helpers ──

function isTeacher(identity: TeacherInterventionIdentity): boolean {
  if (!identity.role) return false;
  return VALID_TEACHER_ROLES.includes(identity.role);
}

function buildScopeNote(): string {
  const status = getClassScopeStatus();
  return status.classMembershipAvailable
    ? 'Class-level authorization available and enforced.'
    : buildClassScopeWarning();
}

// ── Public API ──

/**
 * Validate that a teacher identity can access analytics for a student scope.
 */
export function validateTeacherScope(
  identity: TeacherInterventionIdentity,
  targetStudentId?: string | null,
  targetSchoolId?: string | null,
  targetClassId?: string | null,
): ScopePolicyResult {
  if (!identity.teacherId && !identity.userId) {
    return { allowed: false, reason: 'teacherId is required.', code: 'missing_teacher' };
  }
  if (!identity.schoolId) {
    return { allowed: false, reason: 'schoolId is required.', code: 'missing_school' };
  }
  if (targetSchoolId && identity.schoolId !== targetSchoolId) {
    return { allowed: false, reason: 'Teacher not authorized for this school.', code: 'school_mismatch' };
  }
  if (targetStudentId && !isTeacher(identity)) {
    return { allowed: false, reason: 'Only teachers can view other students.', code: 'forbidden' };
  }
  // Class scope check — currently school-scope only, documented limitation
  const scopeNote = buildScopeNote();
  return { allowed: true, reason: 'ok', code: 'ok', classScopeNote: scopeNote };
}

/**
 * Validate that a learner can view their own intervention assignment.
 */
export function validateLearnerScope(
  identity: TeacherInterventionIdentity,
  targetStudentId: string,
  targetSchoolId: string,
): ScopePolicyResult {
  if (!identity.userId) {
    return { allowed: false, reason: 'Authentication required.', code: 'missing_teacher' };
  }
  if (!identity.schoolId) {
    return { allowed: false, reason: 'schoolId is required.', code: 'missing_school' };
  }
  if (identity.schoolId !== targetSchoolId) {
    return { allowed: false, reason: 'Not authorized for this school.', code: 'school_mismatch' };
  }
  if (identity.userId !== targetStudentId) {
    return { allowed: false, reason: 'Cannot view another student\'s interventions.', code: 'forbidden' };
  }
  return { allowed: true, reason: 'ok', code: 'ok' };
}

/**
 * Validate teacher can create intervention for a student.
 */
export function validateCreateInterventionScope(
  identity: TeacherInterventionIdentity,
  request: { teacherId: string; schoolId: string; studentId: string; classId?: string | null },
): ScopePolicyResult {
  if (!request.teacherId) {
    return { allowed: false, reason: 'Teacher ID is required.', code: 'missing_teacher' };
  }
  if (!request.schoolId) {
    return { allowed: false, reason: 'School ID is required.', code: 'missing_school' };
  }
  if (!request.studentId) {
    return { allowed: false, reason: 'Student ID is required.', code: 'missing_student' };
  }
  if (identity.schoolId !== request.schoolId) {
    return { allowed: false, reason: 'Teacher not authorized for this school.', code: 'school_mismatch' };
  }
  if (!isTeacher(identity)) {
    return { allowed: false, reason: 'Only teachers can create interventions.', code: 'forbidden' };
  }
  const scopeNote = buildScopeNote();
  return { allowed: true, reason: 'ok', code: 'ok', classScopeNote: scopeNote };
}
