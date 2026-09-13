import type { TeachBackModeState, TeachBackModeStateResponse, TeachBackModeSummary } from '../contracts/teachBackModeContracts';
import { redactForbiddenTeachBackFields } from './teachBackModePrivacyGuard';

export function buildStudentTeachBackStateResponse(state: TeachBackModeState): TeachBackModeStateResponse {
  return {
    ok: true,
    teachBackMode: {
      sessionId: state.session.id,
      modeSessionId: state.session.modeSessionId,
      status: state.session.status,
      currentStage: state.currentStage,
      currentPromptIndex: state.session.currentPromptIndex,
      promptCount: state.session.promptCount,
      currentPromptState: state.currentPromptState ? {
        promptKey: state.currentPromptState.promptKey,
        promptIndex: state.currentPromptState.promptIndex,
        status: state.currentPromptState.status,
      } : undefined,
      nextAction: state.nextAction ? {
        selectedAction: state.nextAction.selectedAction,
        supportLevel: state.nextAction.supportLevel,
        learnerNeedCategory: state.nextAction.learnerNeedCategory,
      } : undefined,
      answerProtection: state.answerProtection ? {
        decision: state.answerProtection.decision,
      } : undefined,
      feedbackPolicy: state.feedbackPolicy ? {
        decision: state.feedbackPolicy.decision,
      } : undefined,
      attemptCount: state.attemptCount,
      strongExplanationCount: state.strongExplanationCount,
      partialExplanationCount: state.partialExplanationCount,
      weakExplanationCount: state.weakExplanationCount,
      misconceptionCount: state.misconceptionCount,
      hintCount: state.hintCount,
      stuckCount: state.stuckCount,
      recoveryCount: state.recoveryCount,
      reflectionCount: state.reflectionCount,
      safeReasonCodes: state.safeReasonCodes,
    },
  };
}

export function buildTeachBackSummaryResponse(summary: any) {
  const safe = redactForbiddenTeachBackFields(summary as any);
  return {
    ok: true,
    summary: safe,
  };
}

export function buildEmptyActiveTeachBackResponse() {
  return {
    ok: true,
    activeTeachBackMode: null,
  };
}

export function buildTeachBackErrorResponse(message: string, code = 'error') {
  return {
    ok: false,
    error: { code, message },
  };
}
