import type {
  Phase3DailyObjectiveCheckSession,
  Phase3DailyObjectiveCheckLearnerResponse,
  Phase3DailyObjectiveCheckStatus,
} from '../contracts/phase3DailyObjectiveCheckContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function getSafeTitle(): string {
  return 'Daily Objective Check';
}

function getStatusMessage(status: Phase3DailyObjectiveCheckStatus): string {
  switch (status) {
    case 'not_started':
      return 'This objective is ready for a short check.';
    case 'started':
      return 'The check has begun. Follow the steps to confirm your understanding.';
    case 'confidence_before_required':
      return 'Start with how confident you feel before trying.';
    case 'in_progress':
      return 'Good. Keep going through the check steps.';
    case 'awaiting_teach_back':
      return 'Now explain what you have learned in your own words.';
    case 'awaiting_transfer_check':
      return 'Try applying this to a similar situation.';
    case 'awaiting_delayed_recall':
      return 'Recall what you learned without looking back at notes.';
    case 'awaiting_confidence_after':
      return 'Good. Now mark how confident you feel after trying.';
    case 'completed':
      return 'Good. This objective check is complete. Your understanding is becoming more stable.';
    case 'needs_recheck':
      return 'This objective needs another check before it becomes stable. You are getting closer.';
    case 'needs_rescue':
      return 'This objective needs dedicated focus. A similar question will help confirm it.';
    case 'needs_teacher_support':
      return 'This needs teacher support because the source is not ready yet.';
    case 'source_required':
      return 'This objective needs an approved source or teacher confirmation before checks can continue.';
    case 'blocked':
      return 'This objective check cannot proceed right now. Please ask your teacher.';
    case 'expired':
      return 'This check session has expired. Start a new check when you are ready.';
  }
}

function getNextStepMessage(status: Phase3DailyObjectiveCheckStatus, session?: Phase3DailyObjectiveCheckSession): string {
  switch (status) {
    case 'not_started':
    case 'started':
    case 'confidence_before_required':
      return 'Record your confidence before starting the check.';
    case 'in_progress':
      return 'Complete the next check step.';
    case 'awaiting_teach_back':
      return 'Teach this concept to someone learning it for the first time.';
    case 'awaiting_transfer_check':
      return 'Apply what you have learned to a new context.';
    case 'awaiting_delayed_recall':
      return 'Recall what you learned without notes.';
    case 'awaiting_confidence_after':
      return 'Record your confidence after the check.';
    case 'completed':
      return 'Continue reviewing this objective to strengthen your understanding.';
    case 'needs_recheck':
      return 'Try another check step to confirm your understanding.';
    case 'needs_rescue':
      return 'Focus on this objective with dedicated practice.';
    case 'needs_teacher_support':
      return 'Ask your teacher for guidance on this objective.';
    case 'source_required':
      return 'Speak to your teacher about this objective.';
    case 'blocked':
      return 'Speak to your teacher about this objective.';
    case 'expired':
      return 'Start a new check when you are ready.';
  }
}

export class Phase3DailyObjectiveLearnerResponseService {
  createSessionStartedResponse(session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: session.status,
      safeTitle: getSafeTitle(),
      safeMessage: getStatusMessage(session.status),
      nextStep: getNextStepMessage(session.status),
      confidencePrompt: 'How confident do you feel about this objective?',
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }

  createNextStepRequiredResponse(session: Phase3DailyObjectiveCheckSession, nextStep: string): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: session.status,
      safeTitle: getSafeTitle(),
      safeMessage: getStatusMessage(session.status),
      nextStep: getNextStepMessage(session.status),
      modeDestination: nextStep === 'teach_back' ? 'teach_back' : nextStep === 'transfer_check' ? 'quiz' : 'focus',
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }

  createAttemptAcceptedResponse(session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: session.status,
      safeTitle: getSafeTitle(),
      safeMessage: 'Good. Your response has been recorded.',
      nextStep: getNextStepMessage(session.status),
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }

  createConfidenceRecordedResponse(session: Phase3DailyObjectiveCheckSession, checkpointType: string): Phase3DailyObjectiveCheckLearnerResponse {
    const message = checkpointType === 'before'
      ? 'Good. Now try one explanation step.'
      : 'Good. Your confidence has been recorded.';

    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: session.status,
      safeTitle: getSafeTitle(),
      safeMessage: message,
      nextStep: getNextStepMessage(session.status),
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }

  createCheckCompletedResponse(session: Phase3DailyObjectiveCheckSession, masteryStatus?: string): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: session.status,
      safeTitle: getSafeTitle(),
      safeMessage: getStatusMessage(session.status),
      nextStep: getNextStepMessage(session.status),
      modeDestination: masteryStatus === 'confident' ? 'revision' : 'focus',
      masteryStatus,
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }

  createNeedsRecheckResponse(session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: 'needs_recheck',
      safeTitle: getSafeTitle(),
      safeMessage: getStatusMessage('needs_recheck'),
      nextStep: getNextStepMessage('needs_recheck'),
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }

  createNeedsRescueResponse(session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: 'needs_rescue',
      safeTitle: getSafeTitle(),
      safeMessage: getStatusMessage('needs_rescue'),
      nextStep: getNextStepMessage('needs_rescue'),
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }

  createNeedsTeacherSupportResponse(session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: 'needs_teacher_support',
      safeTitle: getSafeTitle(),
      safeMessage: getStatusMessage('needs_teacher_support'),
      nextStep: getNextStepMessage('needs_teacher_support'),
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }

  createSourceRequiredResponse(session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: 'source_required',
      safeTitle: getSafeTitle(),
      safeMessage: getStatusMessage('source_required'),
      nextStep: getNextStepMessage('source_required'),
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }

  createBlockedResponse(session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: 'blocked',
      safeTitle: getSafeTitle(),
      safeMessage: getStatusMessage('blocked'),
      nextStep: getNextStepMessage('blocked'),
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }

  createExpiredResponse(session: Phase3DailyObjectiveCheckSession): Phase3DailyObjectiveCheckLearnerResponse {
    return {
      checkSessionId: session.checkSessionId,
      objectiveId: session.objectiveId,
      dailySeedId: session.dailySeedId,
      status: 'expired',
      safeTitle: getSafeTitle(),
      safeMessage: getStatusMessage('expired'),
      nextStep: getNextStepMessage('expired'),
      safeEvidenceRefs: session.safeEvidenceRefs,
      createdAt: session.createdAt,
      updatedAt: nowISO(),
    };
  }
}

export const phase3DailyObjectiveLearnerResponseService = new Phase3DailyObjectiveLearnerResponseService();
