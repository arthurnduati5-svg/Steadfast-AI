export enum GrowthActionAccessDecision {
  ALLOWED = 'allowed',
  BLOCKED_MISSING_SCHOOL_CONTEXT = 'blocked_missing_school_context',
  BLOCKED_MISSING_LEARNER_CONTEXT = 'blocked_missing_learner_context',
  BLOCKED_CROSS_SCHOOL = 'blocked_cross_school',
  BLOCKED_CROSS_STUDENT = 'blocked_cross_student',
  BLOCKED_TEACHER_NO_SCOPE = 'blocked_teacher_no_scope',
  BLOCKED_UNKNOWN_ROLE = 'blocked_unknown_role',
}

export interface AccessPolicyInput {
  schoolId?: string;
  studentId?: string;
  targetStudentId?: string;
  requesterRole?: string;
  requesterUserId?: string;
  requesterSchoolId?: string;
  teacherAssignmentScope?: string[];
}

export interface AccessPolicyResult {
  decision: GrowthActionAccessDecision;
  reasonCodes: string[];
}

export function evaluateGrowthActionAccess(input: AccessPolicyInput): AccessPolicyResult {
  if (!input.schoolId || !input.requesterSchoolId) {
    return {
      decision: GrowthActionAccessDecision.BLOCKED_MISSING_SCHOOL_CONTEXT,
      reasonCodes: ['missing_school_context'],
    };
  }

  if (input.schoolId !== input.requesterSchoolId) {
    return {
      decision: GrowthActionAccessDecision.BLOCKED_CROSS_SCHOOL,
      reasonCodes: ['cross_school_blocked'],
    };
  }

  if (!input.studentId) {
    return {
      decision: GrowthActionAccessDecision.BLOCKED_MISSING_LEARNER_CONTEXT,
      reasonCodes: ['missing_learner_context'],
    };
  }

  const targetStudentId = input.targetStudentId || input.studentId;
  const role = input.requesterRole || 'student';

  switch (role) {
    case 'student':
      if (input.requesterUserId !== targetStudentId) {
        return {
          decision: GrowthActionAccessDecision.BLOCKED_CROSS_STUDENT,
          reasonCodes: ['cross_school_blocked'],
        };
      }
      return {
        decision: GrowthActionAccessDecision.ALLOWED,
        reasonCodes: ['school_identity_verified', 'student_ownership_confirmed', 'role_access_allowed'],
      };

    case 'teacher':
    case 'admin':
      return {
        decision: GrowthActionAccessDecision.ALLOWED,
        reasonCodes: ['school_identity_verified', 'role_access_allowed'],
      };

    default:
      return {
        decision: GrowthActionAccessDecision.BLOCKED_UNKNOWN_ROLE,
        reasonCodes: ['missing_learner_context'],
      };
  }
}

export function requireStudentOwnership(
  requesterUserId: string,
  targetStudentId: string,
  role?: string,
): boolean {
  if (role === 'admin' || role === 'teacher') return true;
  return requesterUserId === targetStudentId;
}
