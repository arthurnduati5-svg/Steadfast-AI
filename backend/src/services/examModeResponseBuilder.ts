import type { ExamModeState, ExamModeStateResponse, ExamModeSummary } from '../contracts/examModeContracts';
import { redactForbiddenExamFields } from './examModePrivacyGuard';

export function buildStudentExamStateResponse(state: ExamModeState): ExamModeStateResponse {
  return {
    ok: true,
    examMode: {
      sessionId: state.session.id,
      modeSessionId: state.session.modeSessionId,
      status: state.session.status,
      currentStage: state.currentStage,
      currentQuestionIndex: state.session.currentQuestionIndex,
      questionCount: state.session.questionCount,
      currentQuestionState: state.currentQuestionState ? {
        questionKey: state.currentQuestionState.questionKey,
        questionIndex: state.currentQuestionState.questionIndex,
        status: state.currentQuestionState.status,
      } : undefined,
      nextAction: state.nextAction ? {
        selectedAction: state.nextAction.selectedAction,
        supportLevel: state.nextAction.supportLevel,
        learnerNeedCategory: state.nextAction.learnerNeedCategory,
      } : undefined,
      answerProtection: state.answerProtection ? {
        decision: state.answerProtection.decision,
      } : undefined,
      timerState: state.timerState ? {
        timerMode: state.timerState.timerMode,
      } : undefined,
      attemptCount: state.attemptCount,
      hintCount: state.hintCount,
      stuckCount: state.stuckCount,
      recoveryCount: state.recoveryCount,
      skippedCount: state.skippedCount,
      flaggedCount: state.flaggedCount,
      safeReasonCodes: state.safeReasonCodes,
    },
  };
}

export function buildExamSummaryResponse(summary: any) {
  const safe = redactForbiddenExamFields(summary as any);
  return {
    ok: true,
    summary: safe,
  };
}

export function buildEmptyActiveExamResponse() {
  return {
    ok: true,
    activeExamMode: null,
  };
}

export function buildExamErrorResponse(message: string, code = 'error') {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}
