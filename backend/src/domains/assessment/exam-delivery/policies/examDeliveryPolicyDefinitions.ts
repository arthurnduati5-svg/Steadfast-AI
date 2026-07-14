import {
  AssessmentPolicyDecision,
  AssessmentPolicyFamily,
  AssessmentPolicyStatus,
} from '../../contracts/assessmentPolicyContracts';

export type ExamDeliveryPolicyFamily =
  | 'EXAM_DELIVERY_SESSION'
  | 'EXAM_DELIVERY_ACTIVATION'
  | 'EXAM_VARIANT_ASSIGNMENT'
  | 'EXAM_ATTEMPT_START'
  | 'EXAM_ATTEMPT_TIMING'
  | 'EXAM_ANSWER_CAPTURE'
  | 'EXAM_SUBMISSION_SNAPSHOT'
  | 'EXAM_DELIVERY_PROJECTION';

export const EXAM_DELIVERY_ALLOWED_TEACHER_ROLES = [
  'teacher',
  'lead_teacher',
  'department_head',
  'admin',
  'system_job',
] as const;

export const EXAM_DELIVERY_ALLOWED_STUDENT_ROLES = [
  'student',
  'system_job',
] as const;

export const EXAM_DELIVERY_BLOCKED_MUTATION_ROLES = [
  'guest',
  'unknown',
  'parent',
] as const;

export type ExamDeliveryAllowedTeacherRole = typeof EXAM_DELIVERY_ALLOWED_TEACHER_ROLES[number];
export type ExamDeliveryAllowedStudentRole = typeof EXAM_DELIVERY_ALLOWED_STUDENT_ROLES[number];
export type ExamDeliveryBlockedMutationRole = typeof EXAM_DELIVERY_BLOCKED_MUTATION_ROLES[number];

function policyBlocked(
  family: ExamDeliveryPolicyFamily,
  reasonCode: string,
  safeMessage: string,
  blockedOperation: string,
): AssessmentPolicyDecision {
  return {
    decisionId: `${family}_BLOCKED_${Date.now()}`,
    policyFamily: family as AssessmentPolicyFamily,
    status: 'MISSING' as AssessmentPolicyStatus,
    allowed: false,
    reasonCode,
    safeMessage,
    missingPolicyKeys: [family],
    requiredOwner: family,
    blockedOperation,
    policyVersionRef: 'package-7-v1',
    createdAt: new Date().toISOString(),
  };
}

function policyAllowed(
  family: ExamDeliveryPolicyFamily,
  safeMessage: string,
): AssessmentPolicyDecision {
  return {
    decisionId: `${family}_ALLOWED_${Date.now()}`,
    policyFamily: family as AssessmentPolicyFamily,
    status: 'CONFIGURED' as AssessmentPolicyStatus,
    allowed: true,
    reasonCode: `${family}_ALLOWED`,
    safeMessage,
    missingPolicyKeys: [],
    requiredOwner: family,
    blockedOperation: '',
    policyVersionRef: 'package-7-v1',
    createdAt: new Date().toISOString(),
  };
}

export function assertTeacherRole(actorRole: string): AssessmentPolicyDecision {
  if ((EXAM_DELIVERY_BLOCKED_MUTATION_ROLES as readonly string[]).includes(actorRole)) {
    return policyBlocked('EXAM_DELIVERY_SESSION', 'ROLE_BLOCKED', `Role ${actorRole} is blocked from delivery mutations`, 'delivery_mutation');
  }
  if ((EXAM_DELIVERY_ALLOWED_TEACHER_ROLES as readonly string[]).includes(actorRole)) {
    return policyAllowed('EXAM_DELIVERY_SESSION', `Teacher role ${actorRole} allowed`);
  }
  return policyBlocked('EXAM_DELIVERY_SESSION', 'ROLE_NOT_ALLOWED', `Role ${actorRole} is not allowed for delivery mutations`, 'delivery_mutation');
}

export function assertStudentRole(actorRole: string): AssessmentPolicyDecision {
  if ((EXAM_DELIVERY_BLOCKED_MUTATION_ROLES as readonly string[]).includes(actorRole)) {
    return policyBlocked('EXAM_ATTEMPT_START', 'ROLE_BLOCKED', `Role ${actorRole} is blocked from attempt actions`, 'attempt_action');
  }
  if ((EXAM_DELIVERY_ALLOWED_STUDENT_ROLES as readonly string[]).includes(actorRole)) {
    return policyAllowed('EXAM_ATTEMPT_START', `Student role ${actorRole} allowed`);
  }
  return policyBlocked('EXAM_ATTEMPT_START', 'ROLE_NOT_ALLOWED', `Role ${actorRole} is not allowed for attempt actions`, 'attempt_action');
}

export function assertDeliverySessionPolicy(context: {
  schoolId: string;
  actorRole: string;
}): AssessmentPolicyDecision {
  if (!context.schoolId) {
    return policyBlocked('EXAM_DELIVERY_SESSION', 'SCHOOL_CONTEXT_REQUIRED', 'School context is required', 'session_creation');
  }
  const roleCheck = assertTeacherRole(context.actorRole);
  if (!roleCheck.allowed) return roleCheck;
  return policyAllowed('EXAM_DELIVERY_SESSION', 'Delivery session policy allowed');
}

export function assertActivationPolicy(context: {
  schoolId: string;
  actorRole: string;
  sessionStatus?: string;
}): AssessmentPolicyDecision {
  if (!context.schoolId) {
    return policyBlocked('EXAM_DELIVERY_ACTIVATION', 'SCHOOL_CONTEXT_REQUIRED', 'School context is required', 'session_activation');
  }
  const roleCheck = assertTeacherRole(context.actorRole);
  if (!roleCheck.allowed) return roleCheck;
  return policyAllowed('EXAM_DELIVERY_ACTIVATION', 'Activation policy allowed');
}

export function assertVariantAssignmentPolicy(context: {
  schoolId: string;
  actorRole: string;
}): AssessmentPolicyDecision {
  if (!context.schoolId) {
    return policyBlocked('EXAM_VARIANT_ASSIGNMENT', 'SCHOOL_CONTEXT_REQUIRED', 'School context is required', 'variant_assignment');
  }
  const roleCheck = assertTeacherRole(context.actorRole);
  if (!roleCheck.allowed) return roleCheck;
  return policyAllowed('EXAM_VARIANT_ASSIGNMENT', 'Variant assignment policy allowed');
}

export function assertAttemptStartPolicy(context: {
  schoolId: string;
  actorRole: string;
}): AssessmentPolicyDecision {
  if (!context.schoolId) {
    return policyBlocked('EXAM_ATTEMPT_START', 'SCHOOL_CONTEXT_REQUIRED', 'School context is required', 'attempt_start');
  }
  const roleCheck = assertStudentRole(context.actorRole);
  if (!roleCheck.allowed) return roleCheck;
  return policyAllowed('EXAM_ATTEMPT_START', 'Attempt start policy allowed');
}

export function assertTimingPolicy(context: {
  schoolId: string;
  actorRole: string;
}): AssessmentPolicyDecision {
  if (!context.schoolId) {
    return policyBlocked('EXAM_ATTEMPT_TIMING', 'SCHOOL_CONTEXT_REQUIRED', 'School context is required', 'timing_mutation');
  }
  if ((EXAM_DELIVERY_BLOCKED_MUTATION_ROLES as readonly string[]).includes(context.actorRole)) {
    return policyBlocked('EXAM_ATTEMPT_TIMING', 'ROLE_BLOCKED', `Role ${context.actorRole} is blocked from timing mutations`, 'timing_mutation');
  }
  return policyAllowed('EXAM_ATTEMPT_TIMING', 'Timing policy allowed');
}

export function assertAnswerCapturePolicy(context: {
  schoolId: string;
  actorRole: string;
}): AssessmentPolicyDecision {
  if (!context.schoolId) {
    return policyBlocked('EXAM_ANSWER_CAPTURE', 'SCHOOL_CONTEXT_REQUIRED', 'School context is required', 'answer_capture');
  }
  return policyAllowed('EXAM_ANSWER_CAPTURE', 'Answer capture policy allowed');
}

export function assertSubmissionSnapshotPolicy(context: {
  schoolId: string;
  actorRole: string;
}): AssessmentPolicyDecision {
  if (!context.schoolId) {
    return policyBlocked('EXAM_SUBMISSION_SNAPSHOT', 'SCHOOL_CONTEXT_REQUIRED', 'School context is required', 'snapshot_sealing');
  }
  return policyAllowed('EXAM_SUBMISSION_SNAPSHOT', 'Submission snapshot policy allowed');
}

export function assertDeliveryProjectionPolicy(context: {
  schoolId: string;
  actorRole: string;
}): AssessmentPolicyDecision {
  if (!context.schoolId) {
    return policyBlocked('EXAM_DELIVERY_PROJECTION', 'SCHOOL_CONTEXT_REQUIRED', 'School context is required', 'projection_access');
  }
  return policyAllowed('EXAM_DELIVERY_PROJECTION', 'Projection policy allowed');
}
