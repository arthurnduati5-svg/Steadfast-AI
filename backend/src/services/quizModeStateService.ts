import type { QuizModeState } from '../contracts/quizModeContracts';
import { getQuizSessionById, serializeQuizSession } from './quizModeSessionService';
import { getCurrentQuestionState, serializeQuestionState } from './quizModeQuestionStateService';
import { getNextQuizAction } from './quizModeTutorActionBridgeService';
import { evaluateQuizAnswerProtection } from './quizModeAnswerProtectionPolicyService';
import { evaluateFeedbackPolicy } from './quizModeFeedbackPolicyService';
import { classifyRecall } from './quizModeRecallClassificationService';

export interface BuildQuizStateInput {
  quizSession: any;
  currentQuestionState?: any;
  answerQuality?: string;
  mistakeCategory?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  answerKeyRisk?: boolean;
  correctAnswerRisk?: boolean;
  markingSchemeRisk?: boolean;
  modelAnswerRisk?: boolean;
  unsafeRequest?: boolean;
  recallStrengthBucket?: string;
  practiceNeed?: string;
  profileSignals?: {
    masteryLevel?: string;
    masteryStatus?: string;
    profileConfidence?: number;
    weakTopicDetected?: boolean;
    highHintDependency?: boolean;
    repeatedMistakeDetected?: boolean;
  };
}

export function buildQuizState(input: BuildQuizStateInput): QuizModeState {
  const session = serializeQuizSession(input.quizSession);
  const questionState = input.currentQuestionState ? serializeQuestionState(input.currentQuestionState) : undefined;

  const hasAttempt = (input.quizSession.attemptCount || 0) > 0;

  const protectionInput = {
    hasAttempt,
    answerKeyRisk: input.answerKeyRisk || false,
    markingSchemeRisk: input.markingSchemeRisk || input.answerKeyRisk || false,
    modelAnswerRisk: input.modelAnswerRisk || input.answerKeyRisk || false,
    approvedContextAvailable: input.approvedContextAvailable ?? true,
    deenSensitive: input.deenSensitive ?? false,
    unsafeRequest: input.unsafeRequest ?? false,
  };
  const protection = evaluateQuizAnswerProtection(protectionInput);

  const feedbackInput = {
    hasAttempt,
    answerKeyRisk: input.answerKeyRisk || false,
    correctAnswerRisk: input.correctAnswerRisk || input.answerKeyRisk || false,
    markingSchemeRisk: input.markingSchemeRisk || input.answerKeyRisk || false,
    modelAnswerRisk: input.modelAnswerRisk || input.answerKeyRisk || false,
    approvedContextAvailable: input.approvedContextAvailable ?? true,
    deenSensitive: input.deenSensitive ?? false,
    unsafeRequest: input.unsafeRequest ?? false,
    recallStrengthBucket: input.recallStrengthBucket,
    practiceNeed: input.practiceNeed,
    repeatedWeak: (input.quizSession.attemptCount || 0) > 2 && input.answerQuality === 'incorrect',
  };
  const feedbackPolicy = evaluateFeedbackPolicy(feedbackInput);

  let nextAction;
  if (input.quizSession.status === 'active') {
    const action = getNextQuizAction({
      schoolId: input.quizSession.schoolId,
      studentId: input.quizSession.studentId,
      modeSessionId: input.quizSession.modeSessionId,
      conversationId: input.quizSession.conversationId || undefined,
      subjectId: input.quizSession.subjectId || undefined,
      topicId: input.quizSession.topicId || undefined,
      skillId: input.quizSession.skillId || undefined,
      currentStage: input.quizSession.currentStage,
      answerQuality: input.answerQuality,
      mistakeCategory: input.mistakeCategory,
      approvedContextAvailable: input.approvedContextAvailable,
      deenSensitive: input.deenSensitive,
      answerKeyRisk: input.answerKeyRisk,
      safeSignals: {
        attemptCount: input.quizSession.attemptCount,
        hintCount: input.quizSession.hintCount,
        stuckCount: input.quizSession.stuckCount,
        recoveryCount: input.quizSession.recoveryCount,
        skippedCount: input.quizSession.skippedCount,
        flaggedCount: input.quizSession.flaggedCount,
        correctCount: input.quizSession.correctCount,
        partialCount: input.quizSession.partialCount,
        incorrectCount: input.quizSession.incorrectCount,
      },
      profileSignals: input.profileSignals,
    });

    nextAction = {
      selectedAction: action.selectedAction,
      hintLevel: action.hintLevel,
      supportLevel: action.supportLevel,
      learnerNeedCategory: action.learnerNeedCategory,
      reasonCodes: action.reasonCodes,
      recallStrengthBucket: input.recallStrengthBucket,
      practiceNeed: input.practiceNeed,
    };
  }

  return {
    session,
    currentStage: input.quizSession.currentStage,
    currentQuestionState: questionState,
    attemptCount: input.quizSession.attemptCount,
    correctCount: input.quizSession.correctCount,
    partialCount: input.quizSession.partialCount,
    incorrectCount: input.quizSession.incorrectCount,
    hintCount: input.quizSession.hintCount,
    stuckCount: input.quizSession.stuckCount,
    recoveryCount: input.quizSession.recoveryCount,
    skippedCount: input.quizSession.skippedCount,
    flaggedCount: input.quizSession.flaggedCount,
    nextAction,
    feedbackPolicy: {
      decision: feedbackPolicy.decision,
      reasonCodes: feedbackPolicy.reasonCodes,
    },
    answerProtection: {
      decision: protection.decision,
      reasonCodes: protection.reasonCodes,
    },
    safeEvidenceRefs: input.quizSession.safeEvidenceRefsJson || [],
    safeReasonCodes: [],
  };
}

export async function loadQuizState(
  quizSessionId: string,
  options?: {
    answerQuality?: string;
    mistakeCategory?: string;
    approvedContextAvailable?: boolean;
    deenSensitive?: boolean;
    answerKeyRisk?: boolean;
    correctAnswerRisk?: boolean;
    unsafeRequest?: boolean;
    recallStrengthBucket?: string;
    practiceNeed?: string;
    profileSignals?: {
      masteryLevel?: string;
      masteryStatus?: string;
      profileConfidence?: number;
      weakTopicDetected?: boolean;
      highHintDependency?: boolean;
      repeatedMistakeDetected?: boolean;
    };
  },
): Promise<QuizModeState | null> {
  const session = await getQuizSessionById(quizSessionId);
  if (!session) return null;

  const questionState = await getCurrentQuestionState(quizSessionId, session.currentQuestionIndex);

  return buildQuizState({
    quizSession: session,
    currentQuestionState: questionState || undefined,
    ...options,
  });
}
