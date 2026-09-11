import type {
  TutorTurnContext,
  TutorTurnPolicyResult,
  TutorTurnPolicyDecision,
  TutorTurnSafeReasonCode,
  TutorTurnIntent,
} from '../contracts/tutorTurnRuntimeContracts';
import { containsForbiddenTutorTurnFields } from './tutorTurnRuntimePrivacyGuard';

export function evaluateTutorTurnPolicy(context: TutorTurnContext): TutorTurnPolicyResult {
  const reasonCodes: TutorTurnSafeReasonCode[] = [];
  const blockReasons: string[] = [];

  if (!context.schoolId) {
    return {
      decision: 'blocked_missing_school_context',
      allowed: false,
      reasonCodes: ['missing_school_context'],
      blockReasons: ['missing_school_context'],
      safeStudentMessage: 'School identity is required to process this turn.',
    };
  }
  reasonCodes.push('school_identity_verified');

  if (!context.studentId) {
    return {
      decision: 'blocked_missing_learner_context',
      allowed: false,
      reasonCodes: ['missing_learner_context'],
      blockReasons: ['missing_learner_context'],
      safeStudentMessage: 'Learner identity is required to process this turn.',
    };
  }
  reasonCodes.push('learner_identity_verified');

  if (containsForbiddenTutorTurnFields(context)) {
    return {
      decision: 'blocked_forbidden_raw_field',
      allowed: false,
      reasonCodes: ['forbidden_field_detected'],
      blockReasons: ['forbidden_field_detected'],
      safeStudentMessage: 'This request contains fields that cannot be processed.',
    };
  }

  if (context.turnIntent === 'blocked_answer_key_request') {
    return {
      decision: 'blocked_answer_key_request',
      allowed: false,
      reasonCodes: ['answer_key_request_detected'],
      blockReasons: ['blocked_answer_key_request'],
      safeStudentMessage: 'I cannot provide answer keys. Let us work through the problem together.',
      suggestedNextIntent: 'submit_attempt_metadata',
    };
  }

  if (context.turnIntent === 'blocked_model_answer_request') {
    return {
      decision: 'blocked_model_answer_request',
      allowed: false,
      reasonCodes: ['model_answer_request_detected'],
      blockReasons: ['blocked_model_answer_request'],
      safeStudentMessage: 'I cannot provide model answers. Let us work through the problem together.',
      suggestedNextIntent: 'submit_attempt_metadata',
    };
  }

  if (context.turnIntent === 'blocked_unsafe_request') {
    return {
      decision: 'blocked_unsafe_request',
      allowed: false,
      reasonCodes: ['unsafe_request_detected'],
      blockReasons: ['blocked_unsafe_request'],
      safeStudentMessage: 'This request cannot be processed. Let us focus on your learning.',
      suggestedNextIntent: 'resolve_growth_action',
    };
  }

  if (context.turnIntent === 'safe_content_gap') {
    return {
      decision: 'blocked_missing_approved_content',
      allowed: false,
      reasonCodes: ['content_gap_detected'],
      blockReasons: ['missing_approved_content'],
      safeStudentMessage: 'I do not have approved content for this target yet. Your teacher can help.',
      suggestedNextIntent: 'teacher_support_needed',
    };
  }

  if (context.turnIntent === 'safe_deen_referral') {
    return {
      decision: 'blocked_deen_sensitive_uncertain',
      allowed: false,
      reasonCodes: ['deen_uncertainty_detected'],
      blockReasons: ['deen_sensitive_uncertain'],
      safeStudentMessage: 'This topic needs an approved source or teacher guidance before I can help further.',
      suggestedNextIntent: 'teacher_support_needed',
    };
  }

  if (context.turnIntent === 'teacher_support_needed') {
    return {
      decision: 'allowed',
      allowed: true,
      reasonCodes: [...reasonCodes, 'referral_teacher_support'],
      blockReasons: [],
      suggestedNextIntent: 'teacher_support_needed',
    };
  }

  if (!context.activeMode && context.turnIntent === 'continue_current_mode') {
    return {
      decision: 'blocked_no_active_session',
      allowed: false,
      reasonCodes: ['no_active_session', 'missing_active_mode'],
      blockReasons: ['no_active_session'],
      safeStudentMessage: 'I do not have an active learning mode yet. I can help choose the next safe step.',
      suggestedNextIntent: 'resolve_growth_action',
    };
  }

  reasonCodes.push('blocked_by_policy');

  return {
    decision: 'allowed',
    allowed: true,
    reasonCodes,
    blockReasons: [],
  };
}
