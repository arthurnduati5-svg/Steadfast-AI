import type {
  StudentLearningSessionContext,
  StudentLearningSessionAccessResult,
  StudentLearningSessionPolicyDecision,
  StudentLearningSessionReasonCode,
} from '../contracts/studentLearningSessionContracts';

export class StudentLearningSessionAccessPolicy {
  checkAccess(
    context: StudentLearningSessionContext,
    targetSchoolId: string,
    targetStudentId: string,
    targetTutorLearnerId: string,
  ): StudentLearningSessionAccessResult {
    if (!context.schoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_no_school_context',
        safeReasonCodes: ['learner_ownership_not_proven'],
      };
    }

    if (!context.studentId) {
      return {
        allowed: false,
        policyDecision: 'blocked_no_learner_identity',
        safeReasonCodes: ['learner_ownership_not_proven'],
      };
    }

    if (context.schoolId !== targetSchoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_cross_school',
        safeReasonCodes: ['cross_school_blocked'],
      };
    }

    if (context.studentId !== targetStudentId && context.tutorLearnerId !== targetTutorLearnerId) {
      return {
        allowed: false,
        policyDecision: 'blocked_cross_learner',
        safeReasonCodes: ['cross_learner_blocked'],
      };
    }

    return {
      allowed: true,
      policyDecision: 'allowed',
      safeReasonCodes: ['learner_ownership_verified'],
    };
  }

  assertSessionOwnership(
    context: StudentLearningSessionContext,
    targetSchoolId: string,
    targetStudentId: string,
    targetTutorLearnerId: string,
  ): void {
    const result = this.checkAccess(context, targetSchoolId, targetStudentId, targetTutorLearnerId);
    if (!result.allowed) {
      throw new Error(`Session ownership assertion failed: ${result.policyDecision}`);
    }
  }

  canCreateSession(
    context: StudentLearningSessionContext,
    targetSchoolId: string,
    targetStudentId: string,
    targetTutorLearnerId: string,
  ): boolean {
    return this.checkAccess(context, targetSchoolId, targetStudentId, targetTutorLearnerId).allowed;
  }

  canResumeSession(
    context: StudentLearningSessionContext,
    targetSchoolId: string,
    targetStudentId: string,
    targetTutorLearnerId: string,
  ): boolean {
    return this.checkAccess(context, targetSchoolId, targetStudentId, targetTutorLearnerId).allowed;
  }

  canTransitionSession(
    context: StudentLearningSessionContext,
    targetSchoolId: string,
    targetStudentId: string,
    targetTutorLearnerId: string,
  ): boolean {
    return this.checkAccess(context, targetSchoolId, targetStudentId, targetTutorLearnerId).allowed;
  }

  canReadSession(
    context: StudentLearningSessionContext,
    targetSchoolId: string,
    targetStudentId: string,
    targetTutorLearnerId: string,
  ): boolean {
    return this.checkAccess(context, targetSchoolId, targetStudentId, targetTutorLearnerId).allowed;
  }
}
