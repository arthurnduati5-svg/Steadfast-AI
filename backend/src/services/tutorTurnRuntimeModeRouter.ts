import type {
  TutorTurnDispatchTarget,
  TutorTurnDispatchDecision,
  TutorTurnSafeReasonCode,
} from '../contracts/tutorTurnRuntimeContracts';

export const VALID_DISPATCH_TARGETS: Set<TutorTurnDispatchTarget> = new Set([
  'learning_mode',
  'focus_mode',
  'exam_mode',
  'quiz_mode',
  'teach_back_mode',
  'revision_mode',
  'growth_action',
  'tutor_action',
  'learning_profile',
  'teacher_support',
  'content_gap_referral',
  'deen_referral',
  'blocked',
  'none',
]);

export function routeModeDispatch(decision: TutorTurnDispatchDecision): {
  valid: boolean;
  reasonCode: TutorTurnSafeReasonCode;
} {
  if (!VALID_DISPATCH_TARGETS.has(decision.dispatchTarget)) {
    return {
      valid: false,
      reasonCode: 'mode_not_found',
    };
  }

  if (decision.dispatchTarget === 'blocked' || decision.dispatchTarget === 'none') {
    return {
      valid: true,
      reasonCode: decision.routeReasonCode,
    };
  }

  if (decision.dispatchTarget === 'content_gap_referral' || decision.dispatchTarget === 'deen_referral') {
    return {
      valid: true,
      reasonCode: decision.routeReasonCode,
    };
  }

  if (decision.dispatchTarget === 'teacher_support') {
    return {
      valid: true,
      reasonCode: 'referral_teacher_support',
    };
  }

  return {
    valid: true,
    reasonCode: 'dispatch_completed',
  };
}
