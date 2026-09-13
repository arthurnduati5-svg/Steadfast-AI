import type { FocusModeState, FocusModeSession, FocusModeStep } from '../contracts/focusModeContracts';
import { getFocusSessionById, serializeFocusSession } from './focusModeSessionService';
import { getActiveStepForSession, serializeFocusStep } from './focusModeStepService';
import { getNextFocusAction } from './focusModeTutorActionBridgeService';

export interface BuildStateInput {
  focusSession: any;
  activeStep?: any;
  answerQuality?: string;
  mistakeCategory?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  profileSignals?: {
    masteryLevel?: string;
    masteryStatus?: string;
    profileConfidence?: number;
    weakTopicDetected?: boolean;
    highHintDependency?: boolean;
    repeatedMistakeDetected?: boolean;
  };
}

export function buildFocusState(input: BuildStateInput): FocusModeState {
  const session = serializeFocusSession(input.focusSession);
  const activeStep = input.activeStep ? serializeFocusStep(input.activeStep) : undefined;

  let nextAction;
  if (input.focusSession.status === 'active') {
    const action = getNextFocusAction({
      schoolId: input.focusSession.schoolId,
      studentId: input.focusSession.studentId,
      modeSessionId: input.focusSession.modeSessionId,
      conversationId: input.focusSession.conversationId || undefined,
      subjectId: input.focusSession.subjectId || undefined,
      topicId: input.focusSession.topicId || undefined,
      skillId: input.focusSession.skillId || undefined,
      currentStage: input.focusSession.currentStage,
      answerQuality: input.answerQuality,
      mistakeCategory: input.mistakeCategory,
      approvedContextAvailable: input.approvedContextAvailable,
      deenSensitive: input.deenSensitive,
      safeSignals: {
        attemptCount: input.focusSession.attemptCount,
        hintCount: input.focusSession.hintCount,
        stuckCount: input.focusSession.stuckCount,
        recoveryCount: input.focusSession.recoveryCount,
      },
      profileSignals: input.profileSignals,
    });

    nextAction = {
      selectedAction: action.selectedAction,
      hintLevel: action.hintLevel,
      supportLevel: action.supportLevel,
      learnerNeedCategory: action.learnerNeedCategory,
      reasonCodes: action.reasonCodes,
    };
  }

  return {
    session,
    currentStage: input.focusSession.currentStage,
    currentStep: activeStep,
    attemptCount: input.focusSession.attemptCount,
    hintCount: input.focusSession.hintCount,
    stuckCount: input.focusSession.stuckCount,
    recoveryCount: input.focusSession.recoveryCount,
    nextAction,
    safeEvidenceRefs: input.focusSession.safeEvidenceRefsJson || [],
    safeReasonCodes: [],
  };
}

export async function loadFocusState(
  focusSessionId: string,
  options?: {
    answerQuality?: string;
    mistakeCategory?: string;
    approvedContextAvailable?: boolean;
    deenSensitive?: boolean;
    profileSignals?: {
      masteryLevel?: string;
      masteryStatus?: string;
      profileConfidence?: number;
      weakTopicDetected?: boolean;
      highHintDependency?: boolean;
      repeatedMistakeDetected?: boolean;
    };
  },
): Promise<FocusModeState | null> {
  const session = await getFocusSessionById(focusSessionId);
  if (!session) return null;

  const activeStep = await getActiveStepForSession(focusSessionId);

  return buildFocusState({
    focusSession: session,
    activeStep: activeStep || undefined,
    ...options,
  });
}
