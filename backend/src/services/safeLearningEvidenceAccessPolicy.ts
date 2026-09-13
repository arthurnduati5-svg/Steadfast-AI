export type EvidenceRole = 'student' | 'teacher' | 'admin' | 'parent' | 'system' | 'unknown';

export interface EvidenceAccessContext {
  schoolId: string;
  studentId?: string;
  tutorLearnerId?: string;
  role: EvidenceRole;
  requestSchoolId: string;
  requestStudentId?: string;
  teacherAssignmentScope?: string[];
}

export interface EvidenceAccessResult {
  allowed: boolean;
  policyDecision: string;
  safeReasonCodes: string[];
}

export class SafeLearningEvidenceAccessPolicy {
  evaluateEvidenceWriteAccess(ctx: EvidenceAccessContext): EvidenceAccessResult {
    if (!ctx.schoolId || !ctx.requestSchoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_missing_school_context',
        safeReasonCodes: ['missing_school_context'],
      };
    }
    if (ctx.schoolId !== ctx.requestSchoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_cross_school',
        safeReasonCodes: ['cross_school_write_blocked'],
      };
    }
    if (!ctx.studentId && !ctx.requestStudentId) {
      return {
        allowed: false,
        policyDecision: 'blocked_missing_learner_context',
        safeReasonCodes: ['missing_learner_context'],
      };
    }
    if (ctx.role === 'student') {
      if (ctx.studentId !== ctx.requestStudentId) {
        return {
          allowed: false,
          policyDecision: 'blocked_cross_student',
          safeReasonCodes: ['cross_student_write_blocked'],
        };
      }
      return {
        allowed: true,
        policyDecision: 'allowed',
        safeReasonCodes: ['school_identity_verified', 'student_ownership_confirmed'],
      };
    }
    if (ctx.role === 'teacher' || ctx.role === 'admin' || ctx.role === 'system') {
      return {
        allowed: true,
        policyDecision: 'allowed',
        safeReasonCodes: ['school_identity_verified', 'role_access_allowed'],
      };
    }
    if (ctx.role === 'parent') {
      return {
        allowed: false,
        policyDecision: 'blocked_missing_role',
        safeReasonCodes: ['parent_write_blocked'],
      };
    }
    return {
      allowed: false,
      policyDecision: 'blocked_missing_role',
      safeReasonCodes: ['unknown_role_write_blocked'],
    };
  }

  evaluateEvidenceReadAccess(ctx: EvidenceAccessContext): EvidenceAccessResult {
    if (!ctx.schoolId || !ctx.requestSchoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_missing_school_context',
        safeReasonCodes: ['missing_school_context'],
      };
    }
    if (ctx.schoolId !== ctx.requestSchoolId) {
      return {
        allowed: false,
        policyDecision: 'blocked_cross_school',
        safeReasonCodes: ['cross_school_read_blocked'],
      };
    }
    if (ctx.role === 'student') {
      if (!ctx.requestStudentId) {
        return {
          allowed: false,
          policyDecision: 'blocked_missing_learner_context',
          safeReasonCodes: ['missing_learner_context'],
        };
      }
      if (ctx.studentId && ctx.studentId !== ctx.requestStudentId) {
        return {
          allowed: false,
          policyDecision: 'blocked_cross_student',
          safeReasonCodes: ['cross_student_read_blocked'],
        };
      }
      return {
        allowed: true,
        policyDecision: 'allowed',
        safeReasonCodes: ['school_identity_verified', 'student_ownership_confirmed'],
      };
    }
    if (ctx.role === 'teacher') {
      if (ctx.teacherAssignmentScope && ctx.teacherAssignmentScope.length > 0) {
        if (ctx.requestStudentId && !ctx.teacherAssignmentScope.includes(ctx.requestStudentId)) {
          return {
            allowed: false,
            policyDecision: 'blocked_cross_student',
            safeReasonCodes: ['teacher_not_assigned_to_student'],
          };
        }
      }
      return {
        allowed: true,
        policyDecision: 'allowed',
        safeReasonCodes: ['school_identity_verified', 'role_access_allowed', 'teacher_safe_summary_only'],
      };
    }
    if (ctx.role === 'admin') {
      return {
        allowed: true,
        policyDecision: 'allowed',
        safeReasonCodes: ['school_identity_verified', 'role_access_allowed', 'admin_diagnostics_scope'],
      };
    }
    if (ctx.role === 'parent') {
      return {
        allowed: true,
        policyDecision: 'allowed',
        safeReasonCodes: ['school_identity_verified', 'role_access_allowed', 'parent_safe_summary_only'],
      };
    }
    if (ctx.role === 'system') {
      return {
        allowed: true,
        policyDecision: 'allowed',
        safeReasonCodes: ['school_identity_verified', 'system_internal_operation'],
      };
    }
    return {
      allowed: false,
      policyDecision: 'blocked_missing_role',
      safeReasonCodes: ['unknown_role_read_blocked'],
    };
  }

  evaluateTeacherViewAccess(ctx: EvidenceAccessContext): EvidenceAccessResult {
    if (ctx.role !== 'teacher') {
      return {
        allowed: false,
        policyDecision: 'blocked_missing_role',
        safeReasonCodes: ['teacher_role_required'],
      };
    }
    return this.evaluateEvidenceReadAccess(ctx);
  }

  evaluateLearnerViewAccess(ctx: EvidenceAccessContext): EvidenceAccessResult {
    if (ctx.role !== 'student') {
      if (ctx.role === 'parent') {
        return this.evaluateEvidenceReadAccess(ctx);
      }
      return {
        allowed: false,
        policyDecision: 'blocked_missing_role',
        safeReasonCodes: ['student_or_parent_role_required'],
      };
    }
    return this.evaluateEvidenceReadAccess(ctx);
  }
}

export const safeLearningEvidenceAccessPolicy = new SafeLearningEvidenceAccessPolicy();
