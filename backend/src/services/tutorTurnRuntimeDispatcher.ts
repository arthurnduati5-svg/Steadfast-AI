import type {
  TutorTurnContext,
  TutorTurnDispatchDecision,
  TutorTurnModeDispatchResult,
  TutorTurnSafeReasonCode,
} from '../contracts/tutorTurnRuntimeContracts';

export async function dispatchTutorTurn(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  if (!context.execute) {
    return {
      dispatchTarget: decision.dispatchTarget,
      modeAction: decision.modeAction,
      dispatchStatus: 'skipped',
      safeEvidenceRefs: context.safeEvidenceRefs,
      safeReasonCodes: ['dispatch_completed'],
    };
  }

  try {
    switch (decision.dispatchTarget) {
      case 'focus_mode':
        return dispatchFocusMode(context, decision);

      case 'exam_mode':
        return dispatchExamMode(context, decision);

      case 'quiz_mode':
        return dispatchQuizMode(context, decision);

      case 'teach_back_mode':
        return dispatchTeachBackMode(context, decision);

      case 'revision_mode':
        return dispatchRevisionMode(context, decision);

      case 'growth_action':
        return dispatchGrowthAction(context, decision);

      case 'tutor_action':
        return dispatchTutorAction(context, decision);

      case 'learning_profile':
        return dispatchLearningProfile(context, decision);

      case 'teacher_support':
        return dispatchTeacherSupport(context, decision);

      case 'content_gap_referral':
        return dispatchContentGapReferral(context, decision);

      case 'deen_referral':
        return dispatchDeenReferral(context, decision);

      case 'learning_mode':
        return dispatchLearningMode(context, decision);

      case 'blocked':
      case 'none':
        return {
          dispatchTarget: decision.dispatchTarget,
          modeAction: decision.modeAction,
          dispatchStatus: 'skipped',
          safeEvidenceRefs: context.safeEvidenceRefs,
          safeReasonCodes: ['dispatch_completed'],
        };

      default:
        return {
          dispatchTarget: 'none',
          dispatchStatus: 'failed',
          failureReasonCode: 'mode_not_found',
          safeEvidenceRefs: context.safeEvidenceRefs,
          safeReasonCodes: ['mode_not_found'],
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown dispatch error';
    return {
      dispatchTarget: decision.dispatchTarget,
      modeAction: decision.modeAction,
      dispatchStatus: 'failed',
      failureReasonCode: errorMessage,
      safeEvidenceRefs: context.safeEvidenceRefs,
      safeReasonCodes: ['mode_dispatch_failed'],
    };
  }
}

async function dispatchFocusMode(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'focus_mode',
    modeAction: decision.modeAction || 'enter',
    modeSessionId: `fm_${Date.now()}`,
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['dispatch_completed'],
  };
}

async function dispatchExamMode(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'exam_mode',
    modeAction: decision.modeAction || 'enter',
    modeSessionId: `em_${Date.now()}`,
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['dispatch_completed'],
  };
}

async function dispatchQuizMode(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'quiz_mode',
    modeAction: decision.modeAction || 'enter',
    modeSessionId: `qm_${Date.now()}`,
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['dispatch_completed'],
  };
}

async function dispatchTeachBackMode(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'teach_back_mode',
    modeAction: decision.modeAction || 'enter',
    modeSessionId: `tb_${Date.now()}`,
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['dispatch_completed'],
  };
}

async function dispatchRevisionMode(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'revision_mode',
    modeAction: decision.modeAction || 'enter',
    modeSessionId: `rv_${Date.now()}`,
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['dispatch_completed'],
  };
}

async function dispatchGrowthAction(
  context: TutorTurnContext,
  _decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'growth_action',
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['dispatch_completed'],
  };
}

async function dispatchTutorAction(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'tutor_action',
    modeAction: decision.modeAction || 'hint',
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['dispatch_completed'],
  };
}

async function dispatchLearningProfile(
  context: TutorTurnContext,
  _decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'learning_profile',
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['dispatch_completed'],
  };
}

async function dispatchTeacherSupport(
  context: TutorTurnContext,
  _decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'teacher_support',
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['referral_teacher_support'],
  };
}

async function dispatchContentGapReferral(
  context: TutorTurnContext,
  _decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'content_gap_referral',
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['content_gap_detected'],
  };
}

async function dispatchDeenReferral(
  context: TutorTurnContext,
  _decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'deen_referral',
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['deen_uncertainty_detected'],
  };
}

async function dispatchLearningMode(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
): Promise<TutorTurnModeDispatchResult> {
  return {
    dispatchTarget: 'learning_mode',
    modeAction: decision.modeAction || 'continue',
    dispatchStatus: 'dispatched',
    safeEvidenceRefs: context.safeEvidenceRefs,
    safeReasonCodes: ['dispatch_completed'],
  };
}
