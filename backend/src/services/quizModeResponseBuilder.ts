import type { QuizModeState, QuizModeStateResponse, QuizModeSummary } from '../contracts/quizModeContracts';
import { redactForbiddenQuizFields } from './quizModePrivacyGuard';

export function buildStudentQuizStateResponse(state: QuizModeState): QuizModeStateResponse {
  return {
    ok: true,
    quizMode: {
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
      feedbackPolicy: state.feedbackPolicy ? {
        decision: state.feedbackPolicy.decision,
      } : undefined,
      attemptCount: state.attemptCount,
      correctCount: state.correctCount,
      partialCount: state.partialCount,
      incorrectCount: state.incorrectCount,
      hintCount: state.hintCount,
      stuckCount: state.stuckCount,
      recoveryCount: state.recoveryCount,
      skippedCount: state.skippedCount,
      flaggedCount: state.flaggedCount,
      safeReasonCodes: state.safeReasonCodes,
    },
  };
}

export function buildQuizSummaryResponse(summary: any) {
  const safe = redactForbiddenQuizFields(summary as any);
  return {
    ok: true,
    summary: safe,
  };
}

export function buildEmptyActiveQuizResponse() {
  return {
    ok: true,
    activeQuizMode: null,
  };
}

export function buildQuizErrorResponse(message: string, code = 'error') {
  return {
    ok: false,
    error: {
      code,
      message,
    },
  };
}
