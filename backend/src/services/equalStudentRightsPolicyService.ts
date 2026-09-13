// ─────────────────────────────────────────────────────────────
// Steadfast AI — Equal Student Rights Policy Service v1
// Returns the same base rights for every student regardless of
// grade, mastery, or teacher/admin approval. Personalization
// affects support mode and challenge level only.
//
// DOCTRINE:
// - Every student has the same system rights.
// - No student receives extra answer rights.
// - No student receives lower privacy rights.
// - No student receives different academic integrity rules.
// - Personalization changes the learning path, not the permission level.
// ─────────────────────────────────────────────────────────────

import type { EqualStudentRightsPolicy } from './socraticTutorPolicyContracts';

const BASE_STUDENT_RIGHTS: EqualStudentRightsPolicy = {
  canAccessTutor: true,
  canAccessHints: true,
  canAccessPractice: true,
  canAccessArtifactHelp: true,
  canAccessVideoSupport: true,
  canAccessRevisionSupport: true,
  canReceiveSocraticGuidance: true,
  canReceiveFinalAnswers: false,
  canBypassAcademicIntegrity: false,
  canBypassSafeguardingPolicy: false,
};

/**
 * Return the equal student rights policy for any student.
 * Every student receives the same base rights regardless of
 * grade, mastery, learning history, or teacher/admin approval.
 */
export function getEqualStudentRightsPolicy(_studentId: string): EqualStudentRightsPolicy {
  return { ...BASE_STUDENT_RIGHTS };
}

/**
 * Assert that all provided policies are identical.
 * Returns true if all policies match the base rights.
 * This is a testable invariant — any difference means a privilege tier exists.
 */
export function assertNoStudentPrivilegeDifference(policies: EqualStudentRightsPolicy[]): boolean {
  if (policies.length === 0) return true;
  return policies.every((p) => {
    return (
      p.canAccessTutor === BASE_STUDENT_RIGHTS.canAccessTutor &&
      p.canAccessHints === BASE_STUDENT_RIGHTS.canAccessHints &&
      p.canAccessPractice === BASE_STUDENT_RIGHTS.canAccessPractice &&
      p.canAccessArtifactHelp === BASE_STUDENT_RIGHTS.canAccessArtifactHelp &&
      p.canAccessVideoSupport === BASE_STUDENT_RIGHTS.canAccessVideoSupport &&
      p.canAccessRevisionSupport === BASE_STUDENT_RIGHTS.canAccessRevisionSupport &&
      p.canReceiveSocraticGuidance === BASE_STUDENT_RIGHTS.canReceiveSocraticGuidance &&
      p.canReceiveFinalAnswers === BASE_STUDENT_RIGHTS.canReceiveFinalAnswers &&
      p.canBypassAcademicIntegrity === BASE_STUDENT_RIGHTS.canBypassAcademicIntegrity &&
      p.canBypassSafeguardingPolicy === BASE_STUDENT_RIGHTS.canBypassSafeguardingPolicy
    );
  });
}

/**
 * Explain the equal student rights policy to a student, teacher, or admin.
 * Returns a human-readable explanation.
 */
export function explainStudentRightsPolicy(): string {
  return (
    'Every student has the same rights: access to the Socratic tutor, hints, practice, ' +
    'artifact help, video support, revision support, and Socratic guidance. ' +
    'No student can receive final answers, bypass academic integrity rules, or bypass safeguarding policy. ' +
    'Teacher or admin approval cannot increase a student\'s normal rights. ' +
    'Personalization adapts the learning path (support mode, challenge level) but not the permission level.'
  );
}
