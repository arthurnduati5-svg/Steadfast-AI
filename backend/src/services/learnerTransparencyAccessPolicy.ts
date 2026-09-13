// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learner Transparency Access Policy v1
// Enforces school, learner, and role-based access for learner
// transparency surfaces. Produces safe, audit-friendly policy
// decisions with reason codes.
// ─────────────────────────────────────────────────────────────

import type {
  LearnerTransparencyAccessResult,
  LearnerTransparencyPolicyDecision,
  LearnerTransparencyReasonCode,
} from '../contracts/learnerTransparencyContracts';

// ═══════════════════════════════════════════════════════════════
// Access enforcement
// ═══════════════════════════════════════════════════════════════

export function enforceLearnerTransparencyAccess(params: {
  schoolId: string;
  studentId: string;
  userId: string;
  role: string;
  targetSchoolId: string;
  targetStudentId: string;
}): LearnerTransparencyAccessResult {
  const { schoolId, studentId, userId, role, targetSchoolId, targetStudentId } = params;

  if (!schoolId || !targetSchoolId) {
    return _deny('blocked_no_school_context', ['no_school_context']);
  }

  if (!studentId || !targetStudentId) {
    return _deny('blocked_no_learner_identity', ['no_learner_identity']);
  }

  if (schoolId !== targetSchoolId) {
    return _deny('blocked_cross_school', ['cross_school_access_denied']);
  }

  if (targetStudentId !== studentId) {
    return _deny('blocked_cross_learner', ['cross_learner_access_denied']);
  }

  if (role === 'student') {
    if (studentId === targetStudentId && schoolId === targetSchoolId) {
      return _allow();
    }
    return _deny('blocked_cross_learner', ['cross_learner_access_denied']);
  }

  if (role === 'parent') {
    return _deny('blocked_parent_scope', ['parent_scope_not_implemented']);
  }

  if (role === 'teacher') {
    return _deny('blocked_teacher_only_report', ['teacher_only_field_detected']);
  }

  if (role === 'school_admin') {
    return _deny('blocked_teacher_only_report', ['blocked_by_access_policy']);
  }

  if (role === 'system_internal') {
    return _allow();
  }

  return _deny('blocked_no_school_context', ['blocked_by_access_policy']);
}

// ═══════════════════════════════════════════════════════════════
// Assertions
// ═══════════════════════════════════════════════════════════════

export function assertLearnerOwnership(params: {
  schoolId: string;
  studentId: string;
  targetSchoolId: string;
  targetStudentId: string;
}): void {
  if (!params.schoolId || !params.targetSchoolId || params.schoolId !== params.targetSchoolId) {
    throw new Error('Cross-school learner ownership check failed. Request does not match the authenticated school context.');
  }
  if (!params.studentId || !params.targetStudentId || params.studentId !== params.targetStudentId) {
    throw new Error('Cross-learner ownership check failed. Request does not match the authenticated learner identity.');
  }
}

export function assertSchoolContext(params: { schoolId?: string }): void {
  if (!params.schoolId) {
    throw new Error('School context is missing. A valid school identifier is required to access learner transparency data.');
  }
}

// ═══════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════

function _allow(): LearnerTransparencyAccessResult {
  return {
    allowed: true,
    policyDecision: 'allowed',
    safeReasonCodes: [],
    schoolId: '',
    studentId: '',
    role: '',
  };
}

function _deny(
  policyDecision: LearnerTransparencyPolicyDecision,
  safeReasonCodes: LearnerTransparencyReasonCode[],
): LearnerTransparencyAccessResult {
  return {
    allowed: false,
    policyDecision,
    safeReasonCodes,
    schoolId: '',
    studentId: '',
    role: '',
  };
}
