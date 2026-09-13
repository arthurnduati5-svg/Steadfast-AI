import type { ApiScopeDecision, ApiScopeCheckInput } from '../contracts/apiScopeContracts';

export function checkBasicScope(input: ApiScopeCheckInput): ApiScopeDecision {
  if (!input.actorId || !input.actorSchoolId) {
    return {
      allowed: false,
      reason: 'missing_auth',
      actorId: input.actorId,
      schoolId: input.actorSchoolId,
      role: input.actorRole,
    };
  }

  if (input.requiredRole && input.actorRole !== input.requiredRole) {
    return {
      allowed: false,
      reason: 'role_forbidden',
      actorId: input.actorId,
      schoolId: input.actorSchoolId,
      role: input.actorRole,
    };
  }

  if (input.targetSchoolId && input.targetSchoolId !== input.actorSchoolId) {
    return {
      allowed: false,
      reason: 'cross_school_forbidden',
      actorId: input.actorId,
      schoolId: input.actorSchoolId,
      targetSchoolId: input.targetSchoolId,
      role: input.actorRole,
    } as ApiScopeDecision;
  }

  if (input.targetStudentId && input.actorRole === 'student' && input.targetStudentId !== input.actorId) {
    return {
      allowed: false,
      reason: 'cross_student_forbidden',
      actorId: input.actorId,
      studentId: input.targetStudentId,
      schoolId: input.actorSchoolId,
      role: input.actorRole,
    };
  }

  return {
    allowed: true,
    reason: 'allowed',
    actorId: input.actorId,
    studentId: input.targetStudentId,
    schoolId: input.actorSchoolId,
    role: input.actorRole,
  };
}
