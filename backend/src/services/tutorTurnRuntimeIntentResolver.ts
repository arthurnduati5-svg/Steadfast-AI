import type {
  TutorTurnContext,
  TutorTurnDispatchDecision,
  TutorTurnDispatchTarget,
  TutorTurnModeAction,
  TutorTurnSafeReasonCode,
  TutorTurnIntent,
} from '../contracts/tutorTurnRuntimeContracts';

const CONTINUATION_INTENTS: TutorTurnIntent[] = [
  'continue_current_mode',
  'submit_attempt_metadata',
  'submit_reflection_metadata',
  'request_hint',
  'pause_mode',
  'resume_mode',
  'exit_mode',
];

export function resolveTutorIntent(context: TutorTurnContext): TutorTurnDispatchDecision {
  const { turnIntent, activeMode, requestedMode } = context;

  if (CONTINUATION_INTENTS.includes(turnIntent) && activeMode) {
    return resolveContinuationIntent(turnIntent, activeMode);
  }

  if (turnIntent === 'continue_current_mode' && !activeMode) {
    return {
      dispatchTarget: 'growth_action',
      routeReasonCode: 'insufficient_evidence',
      confidenceBucket: 'no_data_yet',
      requiresExecution: false,
    };
  }

  switch (turnIntent) {
    case 'start_focus_mode':
      return {
        dispatchTarget: 'focus_mode',
        modeAction: 'enter',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'start_exam_mode':
      return {
        dispatchTarget: 'exam_mode',
        modeAction: 'enter',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'start_quiz_mode':
      return {
        dispatchTarget: 'quiz_mode',
        modeAction: 'enter',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'start_teach_back_mode':
      return {
        dispatchTarget: 'teach_back_mode',
        modeAction: 'enter',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'start_revision_mode':
      return {
        dispatchTarget: 'revision_mode',
        modeAction: 'enter',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'resolve_growth_action':
      return {
        dispatchTarget: 'growth_action',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'medium',
        requiresExecution: false,
      };

    case 'ask_why_this_next':
      return {
        dispatchTarget: 'growth_action',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'medium',
        requiresExecution: false,
      };

    case 'repair_mistake':
      return {
        dispatchTarget: 'focus_mode',
        modeAction: 'repair',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'medium',
        requiresExecution: true,
      };

    case 'review_weak_topic':
      return {
        dispatchTarget: 'quiz_mode',
        modeAction: 'enter',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'medium',
        requiresExecution: true,
      };

    case 'revise_due_item':
      return {
        dispatchTarget: 'revision_mode',
        modeAction: 'enter',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'request_hint':
      return {
        dispatchTarget: 'tutor_action',
        modeAction: 'hint',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'check_readiness':
      return {
        dispatchTarget: 'learning_profile',
        routeReasonCode: 'school_identity_verified',
        confidenceBucket: 'medium',
        requiresExecution: false,
      };

    case 'safe_content_gap':
      return {
        dispatchTarget: 'content_gap_referral',
        routeReasonCode: 'content_gap_detected',
        confidenceBucket: 'high',
        requiresExecution: false,
      };

    case 'safe_deen_referral':
      return {
        dispatchTarget: 'deen_referral',
        routeReasonCode: 'deen_uncertainty_detected',
        confidenceBucket: 'high',
        requiresExecution: false,
      };

    case 'teacher_support_needed':
      return {
        dispatchTarget: 'teacher_support',
        routeReasonCode: 'referral_teacher_support',
        confidenceBucket: 'high',
        requiresExecution: false,
      };

    case 'blocked_answer_key_request':
    case 'blocked_model_answer_request':
    case 'blocked_unsafe_request':
      return {
        dispatchTarget: 'blocked',
        routeReasonCode: 'blocked_by_policy',
        confidenceBucket: 'high',
        requiresExecution: false,
      };

    case 'no_action_available':
      return {
        dispatchTarget: 'none',
        routeReasonCode: 'no_action_available',
        confidenceBucket: 'none',
        requiresExecution: false,
      };

    case 'submit_attempt_metadata':
    case 'submit_reflection_metadata':
    case 'exit_mode':
    case 'pause_mode':
    case 'resume_mode':
      if (activeMode) {
        return resolveContinuationIntent(turnIntent, activeMode);
      }
      return {
        dispatchTarget: 'growth_action',
        routeReasonCode: 'insufficient_evidence',
        confidenceBucket: 'no_data_yet',
        requiresExecution: false,
      };

    default:
      return {
        dispatchTarget: 'none',
        routeReasonCode: 'no_action_available',
        confidenceBucket: 'none',
        requiresExecution: false,
      };
  }
}

function resolveContinuationIntent(
  intent: TutorTurnIntent,
  activeMode: string,
): TutorTurnDispatchDecision {
  const modeTarget = mapActiveModeToDispatchTarget(activeMode);

  switch (intent) {
    case 'continue_current_mode':
      return {
        dispatchTarget: modeTarget,
        modeAction: 'continue',
        routeReasonCode: 'dispatch_completed',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'submit_attempt_metadata':
      return {
        dispatchTarget: modeTarget,
        modeAction: 'attempt',
        routeReasonCode: 'dispatch_completed',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'submit_reflection_metadata':
      return {
        dispatchTarget: modeTarget,
        modeAction: 'reflect',
        routeReasonCode: 'dispatch_completed',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'request_hint':
      return {
        dispatchTarget: modeTarget,
        modeAction: 'hint',
        routeReasonCode: 'dispatch_completed',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'exit_mode':
      return {
        dispatchTarget: modeTarget,
        modeAction: 'exit',
        routeReasonCode: 'dispatch_completed',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'pause_mode':
      return {
        dispatchTarget: modeTarget,
        modeAction: 'pause',
        routeReasonCode: 'dispatch_completed',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    case 'resume_mode':
      return {
        dispatchTarget: modeTarget,
        modeAction: 'resume',
        routeReasonCode: 'dispatch_completed',
        confidenceBucket: 'high',
        requiresExecution: true,
      };

    default:
      return {
        dispatchTarget: modeTarget,
        modeAction: 'continue',
        routeReasonCode: 'dispatch_completed',
        confidenceBucket: 'medium',
        requiresExecution: true,
      };
  }
}

function mapActiveModeToDispatchTarget(activeMode: string): TutorTurnDispatchTarget {
  switch (activeMode) {
    case 'focus':
    case 'focus_mode':
      return 'focus_mode';
    case 'exam':
    case 'exam_mode':
      return 'exam_mode';
    case 'quiz':
    case 'quiz_mode':
      return 'quiz_mode';
    case 'teach_back':
    case 'teach_back_mode':
      return 'teach_back_mode';
    case 'revision':
    case 'revision_mode':
      return 'revision_mode';
    default:
      return 'learning_mode';
  }
}
