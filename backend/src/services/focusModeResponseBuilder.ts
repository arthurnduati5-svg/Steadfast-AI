import type { FocusModeState, FocusModeStateResponse, FocusModeSummary } from '../contracts/focusModeContracts';
import { redactForbiddenFocusFields } from './focusModePrivacyGuard';

export function buildStudentStateResponse(state: FocusModeState): FocusModeStateResponse {
  const safeState = redactForbiddenFocusFields(state as any) as unknown as FocusModeState;

  return {
    ok: true,
    focusMode: {
      sessionId: safeState.session.id,
      modeSessionId: safeState.session.modeSessionId,
      status: safeState.session.status,
      currentStage: safeState.currentStage,
      currentStep: safeState.currentStep ? {
        stepKey: safeState.currentStep.stepKey,
        stepType: safeState.currentStep.stepType,
        status: safeState.currentStep.status,
      } : undefined,
      nextAction: safeState.nextAction ? {
        selectedAction: safeState.nextAction.selectedAction,
        supportLevel: safeState.nextAction.supportLevel,
        learnerNeedCategory: safeState.nextAction.learnerNeedCategory,
      } : undefined,
      attemptCount: safeState.attemptCount,
      hintCount: safeState.hintCount,
      stuckCount: safeState.stuckCount,
      recoveryCount: safeState.recoveryCount,
      safeReasonCodes: safeState.safeReasonCodes,
    },
  };
}

export function buildSummaryResponse(summary: any) {
  const safe = redactForbiddenFocusFields(summary as any);
  return {
    ok: true,
    summary: safe,
  };
}

export function buildEmptyActiveResponse() {
  return {
    ok: true,
    activeFocusMode: null,
  };
}

export function buildErrorResponse(message: string, code = 'error') {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}
