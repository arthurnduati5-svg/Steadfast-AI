import {
  TeacherSafeInsightContext,
  TeacherSafeScopePolicyResult,
  TeacherSafePolicyDecision,
  TeacherSafeReasonCode,
} from '../contracts/teacherSafeInsightContracts';

const VALID_TEACHER_ROLES = ['teacher', 'admin'];
const SAFEGUARDING_ROLES = ['safeguarding_authorized', 'admin'];

export function evaluateTeacherSafeAccessPolicy(
  context: TeacherSafeInsightContext,
  requestedStudentId?: string,
  requestedClassId?: string,
): TeacherSafeScopePolicyResult {
  if (!context.schoolId) {
    return blocked('blocked_no_school_context', ['teacher_scope_not_proven']);
  }

  if (!context.teacherId) {
    return blocked('blocked_no_teacher_identity', ['teacher_scope_not_proven']);
  }

  const role = context.role?.toLowerCase() || '';
  if (!role) {
    return blocked('blocked_unknown_role', ['unknown_role_blocked']);
  }

  if (role === 'student' || role === 'learner') {
    return blocked('blocked_student_role', ['student_role_blocked_from_teacher_report']);
  }

  if (role === 'parent' || role === 'guardian') {
    return blocked('blocked_parent_role', ['parent_role_not_enabled']);
  }

  if (!VALID_TEACHER_ROLES.includes(role) && !SAFEGUARDING_ROLES.includes(role)) {
    return blocked('blocked_unknown_role', ['unknown_role_blocked']);
  }

  if (requestedStudentId && context.studentId && requestedStudentId !== context.studentId) {
    return blocked('blocked_cross_student', ['cross_school_access_blocked']);
  }

  if (requestedClassId && context.classId && requestedClassId !== context.classId) {
    return blocked('blocked_cross_class', ['cross_class_access_blocked']);
  }

  if (requestedStudentId && !requestedClassId && !context.classId) {
    return {
      allowed: true,
      decision: 'allowed',
      reasonCodes: [],
      detail: 'Scope verified within same school.',
    };
  }

  return {
    allowed: true,
    decision: 'allowed',
    reasonCodes: [],
    detail: 'Scope verified.',
  };
}

export function evaluateSafeguardingAccessPolicy(
  context: TeacherSafeInsightContext,
): TeacherSafeScopePolicyResult {
  const role = context.role?.toLowerCase() || '';
  if (!SAFEGUARDING_ROLES.includes(role)) {
    return blocked('blocked_safeguarding_route_requires_authorization', ['safeguarding_role_required']);
  }
  if (!context.schoolId) {
    return blocked('blocked_no_school_context', ['teacher_scope_not_proven']);
  }
  return {
    allowed: true,
    decision: 'allowed',
    reasonCodes: [],
    detail: 'Safeguarding authorized scope verified.',
  };
}

function blocked(
  decision: TeacherSafePolicyDecision,
  reasonCodes: TeacherSafeReasonCode[],
): TeacherSafeScopePolicyResult {
  return {
    allowed: false,
    decision,
    reasonCodes,
  };
}
