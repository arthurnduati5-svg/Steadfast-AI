import type {
  AdaptiveChallengeAccessResult,
  AdaptiveChallengePolicyDecision,
} from '../contracts/adaptiveChallengeContracts';

export interface AccessPolicyInput {
  schoolId: string;
  studentId: string;
  targetSchoolId?: string;
  targetStudentId?: string;
  role?: string;
  isInternal?: boolean;
}

const STUDENT_ROLES = ['student', 'learner'];
const TEACHER_ROLES = ['teacher', 'educator'];
const ADMIN_ROLES = ['school_admin', 'admin'];
const PARENT_ROLES = ['parent', 'guardian'];
const SYSTEM_ROLES = ['system', 'internal'];

export class AdaptiveChallengeAccessPolicy {
  evaluateAccess(input: AccessPolicyInput): AdaptiveChallengeAccessResult {
    if (!input.schoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_no_school_context',
        safeReasonCodes: ['missing_school_context'],
      };
    }

    if (!input.studentId) {
      return {
        allowed: false,
        policyDecision: 'blocked_no_learner_identity',
        safeReasonCodes: ['missing_learner_identity'],
      };
    }

    if (input.targetSchoolId && input.targetSchoolId !== input.schoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_cross_school',
        safeReasonCodes: ['cross_school_access_blocked'],
      };
    }

    const role = (input.role || 'student').toLowerCase();
    const isInternal = input.isInternal === true;

    if (SYSTEM_ROLES.includes(role) && isInternal) {
      return {
        allowed: true,
        policyDecision: 'allowed',
        safeReasonCodes: ['system_internal_operation'],
      };
    }

    if (STUDENT_ROLES.includes(role)) {
      if (!input.targetStudentId || input.targetStudentId === input.studentId) {
        return {
          allowed: true,
          policyDecision: 'allowed',
          safeReasonCodes: ['same_learner_own_challenge'],
        };
      }
      return {
        allowed: false,
        policyDecision: 'blocked_cross_learner',
        safeReasonCodes: ['learner_ownership_not_proven'],
      };
    }

    if (TEACHER_ROLES.includes(role)) {
      if (input.targetStudentId) {
        return {
          allowed: false,
          policyDecision: 'blocked_cross_learner',
          safeReasonCodes: ['teacher_cannot_use_learner_challenge_route'],
        };
      }
      return {
        allowed: false,
        policyDecision: 'blocked_cross_learner',
        safeReasonCodes: ['teacher_blocked_from_learner_challenge_route'],
      };
    }

    if (PARENT_ROLES.includes(role)) {
      return {
        allowed: false,
        policyDecision: 'blocked_cross_learner',
        safeReasonCodes: ['parent_blocked_by_default'],
      };
    }

    if (ADMIN_ROLES.includes(role)) {
      if (input.targetStudentId) {
        return {
          allowed: false,
          policyDecision: 'blocked_cross_learner',
          safeReasonCodes: ['admin_blocked_from_student_challenge_route'],
        };
      }
      return {
        allowed: true,
        policyDecision: 'allowed',
        safeReasonCodes: ['admin_safe_route'],
      };
    }

    return {
      allowed: false,
      policyDecision: 'blocked_cross_learner',
      safeReasonCodes: ['unknown_role_blocked'],
    };
  }
}

export const adaptiveChallengeAccessPolicy = new AdaptiveChallengeAccessPolicy();
