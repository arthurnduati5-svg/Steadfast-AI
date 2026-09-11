export enum TutorTurnAccessDecision {
  ALLOWED = 'allowed',
  BLOCKED_MISSING_SCHOOL_CONTEXT = 'blocked_missing_school_context',
  BLOCKED_MISSING_LEARNER_CONTEXT = 'blocked_missing_learner_context',
  BLOCKED_CROSS_SCHOOL = 'blocked_cross_school',
  BLOCKED_CROSS_STUDENT = 'blocked_cross_student',
  BLOCKED_TEACHER_NO_SCOPE = 'blocked_teacher_no_scope',
  BLOCKED_UNKNOWN_ROLE = 'blocked_unknown_role',
  BLOCKED_FORBIDDEN_RAW_FIELD = 'blocked_forbidden_raw_field',
}

export interface TutorTurnAccessPolicyInput {
  schoolId?: string;
  studentId?: string;
  targetStudentId?: string;
  requesterRole?: string;
  requesterUserId?: string;
  requesterSchoolId?: string;
  teacherAssignmentScope?: string[];
  hasForbiddenFields?: boolean;
}

export interface TutorTurnAccessPolicyResult {
  decision: TutorTurnAccessDecision;
  reasonCodes: string[];
}

export function evaluateTutorTurnAccess(input: TutorTurnAccessPolicyInput): TutorTurnAccessPolicyResult {
  if (!input.schoolId || !input.requesterSchoolId) {
    return {
      decision: TutorTurnAccessDecision.BLOCKED_MISSING_SCHOOL_CONTEXT,
      reasonCodes: ['missing_school_context'],
    };
  }

  if (input.schoolId !== input.requesterSchoolId) {
    return {
      decision: TutorTurnAccessDecision.BLOCKED_CROSS_SCHOOL,
      reasonCodes: ['cross_school_blocked'],
    };
  }

  if (!input.studentId) {
    return {
      decision: TutorTurnAccessDecision.BLOCKED_MISSING_LEARNER_CONTEXT,
      reasonCodes: ['missing_learner_context'],
    };
  }

  const targetStudentId = input.targetStudentId || input.studentId;
  const role = input.requesterRole || 'student';

  switch (role) {
    case 'student':
      if (input.requesterUserId !== targetStudentId) {
        return {
          decision: TutorTurnAccessDecision.BLOCKED_CROSS_STUDENT,
          reasonCodes: ['cross_student_blocked'],
        };
      }
      return {
        decision: TutorTurnAccessDecision.ALLOWED,
        reasonCodes: ['school_identity_verified', 'student_ownership_confirmed', 'role_access_allowed'],
      };

    case 'teacher':
      return {
        decision: TutorTurnAccessDecision.ALLOWED,
        reasonCodes: ['school_identity_verified', 'role_access_allowed'],
      };

    case 'admin':
      return {
        decision: TutorTurnAccessDecision.ALLOWED,
        reasonCodes: ['school_identity_verified', 'role_access_allowed'],
      };

    case 'system':
      return {
        decision: TutorTurnAccessDecision.ALLOWED,
        reasonCodes: ['school_identity_verified', 'role_access_allowed'],
      };

    default:
      return {
        decision: TutorTurnAccessDecision.BLOCKED_UNKNOWN_ROLE,
        reasonCodes: ['blocked_by_policy'],
      };
  }
}

export function requireTutorTurnOwnership(
  requesterUserId: string,
  targetStudentId: string,
): boolean {
  if (!requesterUserId || !targetStudentId) return false;
  return requesterUserId === targetStudentId;
}
