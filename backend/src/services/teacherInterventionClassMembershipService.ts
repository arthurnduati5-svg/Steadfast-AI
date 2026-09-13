// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Class Membership Service v1
// Provides class membership and scope verification for teacher
// interventions.
//
// CURRENT LIMITATION: The database schema does not have explicit
// teacher-to-class or student-to-class membership models (no
// Class, Enrollment, or TeacherClass model exists). Therefore:
//   - Class-level authorization is NOT enforced at database level.
//   - School-scope only is the enforced boundary.
//   - classId is stored for future class-scope enforcement when
//     class membership data becomes available.
//   - This limitation is documented, tested, and tracked.
//
// When class membership models are added to the schema:
//   1. Add teacher-to-class membership query here.
//   2. Add student-to-class membership query here.
//   3. Update validateTeacherClassScope() to query membership.
//   4. Remove school-only fallback constant.
// ─────────────────────────────────────────────────────────────

import type { TeacherInterventionIdentity } from './teacherInterventionContracts';

export type ClassMembershipResult =
  | { available: true; teacherInClass: boolean; studentInClass: boolean }
  | { available: false; reason: string };

export type ClassScopeFallback = 'school_scope_only' | 'class_scope_available';

/**
 * Current class scope fallback behavior.
 * Set to 'school_scope_only' because the database has no
 * class/enrollment model. When class membership is added,
 * update this to 'class_scope_available'.
 */
export const CLASS_SCOPE_FALLBACK: ClassScopeFallback = 'school_scope_only';

/**
 * Check if a teacher belongs to a class.
 * CURRENTLY: Returns unavailable with documented reason because
 * no class membership data exists in the database.
 */
export async function checkTeacherClassMembership(
  identity: TeacherInterventionIdentity,
  classId: string,
): Promise<ClassMembershipResult> {
  return {
    available: false,
    reason: 'Class membership data is not available in the current schema. School-scope only is enforced.',
  };
}

/**
 * Check if a student belongs to a class.
 * CURRENTLY: Returns unavailable with documented reason because
 * no class membership data exists in the database.
 */
export async function checkStudentClassMembership(
  studentId: string,
  classId: string,
  schoolId: string,
): Promise<ClassMembershipResult> {
  return {
    available: false,
    reason: 'Class membership data is not available in the current schema. School-scope only is enforced.',
  };
}

/**
 * Get the current class scope status.
 */
export function getClassScopeStatus(): {
  fallback: ClassScopeFallback;
  classMembershipAvailable: boolean;
  description: string;
} {
  return {
    fallback: CLASS_SCOPE_FALLBACK,
    classMembershipAvailable: CLASS_SCOPE_FALLBACK === 'class_scope_available',
    description: CLASS_SCOPE_FALLBACK === 'school_scope_only'
      ? 'School-scope only. No class/enrollment models exist in the database schema yet.'
      : 'Class-scope available. Teacher-student-class membership can be verified.',
  };
}

/**
 * Generate a warning about class scope limitations.
 */
export function buildClassScopeWarning(): string {
  return 'Class membership data is unavailable — school-scope only authorization is enforced. When class/enrollment models are added to the schema, update teacherInterventionClassMembershipService to enforce class-level boundaries.';
}
