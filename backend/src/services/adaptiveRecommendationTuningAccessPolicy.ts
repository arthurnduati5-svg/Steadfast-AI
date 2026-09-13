import type {
  AdaptiveTuningAccessResult,
  AdaptiveTuningPolicyDecision,
  AdaptiveTuningReasonCode,
} from '../contracts/adaptiveRecommendationTuningContracts';

export interface AccessContext {
  schoolId?: string;
  studentId?: string;
  targetSchoolId?: string;
  targetStudentId?: string;
  role?: string;
}

export class AdaptiveRecommendationTuningAccessPolicy {
  evaluateAccess(context: AccessContext): AdaptiveTuningAccessResult {
    if (!context.schoolId || !context.targetSchoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_no_school_context' as AdaptiveTuningPolicyDecision,
        safeReasonCodes: ['learner_ownership_not_proven' as AdaptiveTuningReasonCode],
      };
    }

    if (!context.studentId) {
      return {
        allowed: false,
        policyDecision: 'blocked_no_learner_identity' as AdaptiveTuningPolicyDecision,
        safeReasonCodes: ['learner_ownership_not_proven' as AdaptiveTuningReasonCode],
      };
    }

    if (context.schoolId !== context.targetSchoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_cross_school' as AdaptiveTuningPolicyDecision,
        safeReasonCodes: ['cross_school_access_blocked' as AdaptiveTuningReasonCode],
      };
    }

    if (context.studentId !== context.targetStudentId) {
      if (context.role === 'teacher') {
        return {
          allowed: false,
          policyDecision: 'blocked_cross_learner' as AdaptiveTuningPolicyDecision,
          safeReasonCodes: ['learner_ownership_not_proven' as AdaptiveTuningReasonCode],
        };
      }
      if (context.role === 'parent') {
        return {
          allowed: false,
          policyDecision: 'blocked_cross_learner' as AdaptiveTuningPolicyDecision,
          safeReasonCodes: ['learner_ownership_not_proven' as AdaptiveTuningReasonCode],
        };
      }
      return {
        allowed: false,
        policyDecision: 'blocked_cross_learner' as AdaptiveTuningPolicyDecision,
        safeReasonCodes: ['learner_ownership_not_proven' as AdaptiveTuningReasonCode],
      };
    }

    return {
      allowed: true,
      policyDecision: 'allowed' as AdaptiveTuningPolicyDecision,
      safeReasonCodes: [],
    };
  }

  assertLearnerOwnership(context: AccessContext): void {
    const result = this.evaluateAccess(context);
    if (!result.allowed) {
      throw new Error(`Access denied: ${result.policyDecision}`);
    }
  }
}

export const adaptiveRecommendationTuningAccessPolicy = new AdaptiveRecommendationTuningAccessPolicy();
