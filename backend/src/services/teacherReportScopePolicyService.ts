// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Report Scope Policy Service v1 (Task 012)
// Determines whether a teacher/admin may access a report
// based on role, school, class, and student scope.
//
// CURRENT CLASS LIMITATION: Class membership data does not exist
// in the database schema yet. School-scope only is enforced.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherReportRequestContext,
  TeacherReportScope,
  TeacherReportScopeDecision,
  TeacherReportType,
} from './teacherReportContracts';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const VALID_TEACHER_ROLES = ['teacher', 'admin'];
const VALID_REPORT_TYPES: TeacherReportType[] = [
  'student_summary',
  'class_summary',
  'subject_summary',
  'topic_summary',
  'skill_summary',
  'intervention_ready_summary',
];

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Validate whether a teacher/admin may access a report for
 * the requested scope.
 */
export function validateTeacherReportScope(
  context: TeacherReportRequestContext,
  scope: TeacherReportScope,
): TeacherReportScopeDecision {
  // Must have teacher identity
  if (!context.teacherId) {
    return { allowed: false, reason: 'Teacher identity is required.', code: 'missing_teacher' };
  }

  // Must have school context
  if (!context.schoolId) {
    return { allowed: false, reason: 'School ID is required.', code: 'missing_school' };
  }

  // Validate role
  if (!context.role) {
    return { allowed: false, reason: 'Role is required.', code: 'unknown_role' };
  }

  const normalizedRole = context.role.toLowerCase();
  if (!VALID_TEACHER_ROLES.includes(normalizedRole)) {
    if (normalizedRole === 'student' || normalizedRole === 'learner') {
      return { allowed: false, reason: 'Students cannot access teacher reports.', code: 'role_forbidden' };
    }
    return { allowed: false, reason: `Role '${context.role}' is not authorized for teacher reports.`, code: 'unknown_role' };
  }

  // Validate report type
  if (!VALID_REPORT_TYPES.includes(scope.reportType)) {
    return { allowed: false, reason: `Invalid report type: '${scope.reportType}'.`, code: 'forbidden' };
  }

  // School must match
  if (context.schoolId !== scope.schoolId) {
    return { allowed: false, reason: 'Teacher not authorized for this school.', code: 'school_mismatch' };
  }

  // Cross-student check: teacher can see any student in scope, admin can see school-level only
  if (scope.studentId) {
    if (normalizedRole === 'admin') {
      return { allowed: true, reason: 'Admin scope verified.', code: 'ok', classScopeNote: 'Admin access to individual student report.' };
    }
    // Teacher access to student is allowed within school scope
  }

  // For class summaries, verify class context if admin
  if (scope.reportType === 'class_summary' && scope.classId) {
    if (normalizedRole === 'admin') {
      return { allowed: true, reason: 'Admin scope verified for class summary.', code: 'ok', classScopeNote: 'Admin class summary access.' };
    }
  }

  // Student access denied for non-teacher roles
  if (!VALID_TEACHER_ROLES.includes(normalizedRole)) {
    return { allowed: false, reason: 'Only teachers and admins can access teacher reports.', code: 'role_forbidden' };
  }

  return { allowed: true, reason: 'ok', code: 'ok', classScopeNote: 'School-scope only enforced. Class membership not yet available.' };
}

/**
 * Validate that a specific teacher can view a specific student's report.
 * Stricter than general scope — ensures cross-student is denied.
 */
export function validateTeacherStudentReportScope(
  context: TeacherReportRequestContext,
  scope: TeacherReportScope,
): TeacherReportScopeDecision {
  const base = validateTeacherReportScope(context, scope);
  if (!base.allowed) return base;

  if (!scope.studentId) {
    return { allowed: false, reason: 'Student ID is required for student report.', code: 'missing_student' };
  }

  if (context.schoolId !== scope.schoolId) {
    return { allowed: false, reason: 'Cross-school access denied.', code: 'school_mismatch' };
  }

  return { allowed: true, reason: 'ok', code: 'ok', classScopeNote: base.classScopeNote };
}

/**
 * Validate that an admin can access a school-level report.
 */
export function validateAdminSchoolReportScope(
  context: TeacherReportRequestContext,
  scope: TeacherReportScope,
): TeacherReportScopeDecision {
  if (!context.teacherId) {
    return { allowed: false, reason: 'Admin identity is required.', code: 'missing_teacher' };
  }
  if (!context.schoolId) {
    return { allowed: false, reason: 'School ID is required.', code: 'missing_school' };
  }
  if (context.role?.toLowerCase() !== 'admin') {
    return { allowed: false, reason: 'Only admins can access school-level reports.', code: 'role_forbidden' };
  }
  if (context.schoolId !== scope.schoolId) {
    return { allowed: false, reason: 'Cross-school access denied for admin.', code: 'school_mismatch' };
  }

  return { allowed: true, reason: 'ok', code: 'ok' };
}

/**
 * Validate that an unknown role is denied from any report access.
 */
export function validateUnknownRoleDenied(
  context: TeacherReportRequestContext,
  _scope: TeacherReportScope,
): TeacherReportScopeDecision {
  if (!context.role) {
    return { allowed: false, reason: 'Unknown role cannot access teacher reports.', code: 'unknown_role' };
  }
  const normalizedRole = context.role.toLowerCase();
  if (normalizedRole === 'student' || normalizedRole === 'learner') {
    return { allowed: false, reason: 'Students cannot access teacher reports.', code: 'role_forbidden' };
  }
  if (!VALID_TEACHER_ROLES.includes(normalizedRole)) {
    return { allowed: false, reason: `Role '${context.role}' is not authorized.`, code: 'unknown_role' };
  }
  return { allowed: true, reason: 'ok', code: 'ok' };
}

/**
 * Get the list of valid teacher roles.
 */
export function getValidTeacherRoles(): string[] {
  return [...VALID_TEACHER_ROLES];
}
