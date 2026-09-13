import type { ExamModeState, ExamModeSession, ExamModeQuestionState } from '../contracts/examModeContracts';
import { getExamSessionById, serializeExamSession } from './examModeSessionService';
import { getCurrentQuestionState, serializeQuestionState } from './examModeQuestionStateService';
import { getNextExamAction } from './examModeTutorActionBridgeService';
import { evaluateAnswerProtection } from './examModeAnswerProtectionPolicyService';
import { buildTimerState } from './examModeTimingService';

export interface BuildExamStateInput {
  examSession: any;
  currentQuestionState?: any;
  answerQuality?: string;
  mistakeCategory?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  answerKeyRisk?: boolean;
  unsafeRequest?: boolean;
  profileSignals?: {
    masteryLevel?: string;
    masteryStatus?: string;
    profileConfidence?: number;
    weakTopicDetected?: boolean;
    highHintDependency?: boolean;
    repeatedMistakeDetected?: boolean;
  };
}

export function buildExamState(input: BuildExamStateInput): ExamModeState {
  const session = serializeExamSession(input.examSession);
  const questionState = input.currentQuestionState ? serializeQuestionState(input.currentQuestionState) : undefined;

  const protectionInput = {
    hasAttempt: (input.examSession.attemptCount || 0) > 0,
    answerKeyRisk: input.answerKeyRisk || false,
    markingSchemeRisk: input.answerKeyRisk || false,
    modelAnswerRisk: input.answerKeyRisk || false,
    approvedContextAvailable: input.approvedContextAvailable ?? true,
    deenSensitive: input.deenSensitive ?? false,
    unsafeRequest: input.unsafeRequest ?? false,
  };
  const protection = evaluateAnswerProtection(protectionInput);

  let nextAction;
  if (input.examSession.status === 'active') {
    const action = getNextExamAction({
      schoolId: input.examSession.schoolId,
      studentId: input.examSession.studentId,
      modeSessionId: input.examSession.modeSessionId,
      conversationId: input.examSession.conversationId || undefined,
      subjectId: input.examSession.subjectId || undefined,
      topicId: input.examSession.topicId || undefined,
      skillId: input.examSession.skillId || undefined,
      currentStage: input.examSession.currentStage,
      answerQuality: input.answerQuality,
      mistakeCategory: input.mistakeCategory,
      approvedContextAvailable: input.approvedContextAvailable,
      deenSensitive: input.deenSensitive,
      answerKeyRisk: input.answerKeyRisk,
      safeSignals: {
        attemptCount: input.examSession.attemptCount,
        hintCount: input.examSession.hintCount,
        stuckCount: input.examSession.stuckCount,
        recoveryCount: input.examSession.recoveryCount,
        skippedCount: input.examSession.skippedCount,
        flaggedCount: input.examSession.flaggedCount,
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

  const timerState = buildTimerState(input.examSession);

  return {
    session,
    currentStage: input.examSession.currentStage,
    currentQuestionState: questionState,
    attemptCount: input.examSession.attemptCount,
    hintCount: input.examSession.hintCount,
    stuckCount: input.examSession.stuckCount,
    recoveryCount: input.examSession.recoveryCount,
    skippedCount: input.examSession.skippedCount,
    flaggedCount: input.examSession.flaggedCount,
    nextAction,
    answerProtection: {
      decision: protection.decision,
      reasonCodes: protection.reasonCodes,
    },
    timerState,
    safeEvidenceRefs: input.examSession.safeEvidenceRefsJson || [],
    safeReasonCodes: [],
  };
}

export async function loadExamState(
  examSessionId: string,
  options?: {
    answerQuality?: string;
    mistakeCategory?: string;
    approvedContextAvailable?: boolean;
    deenSensitive?: boolean;
    answerKeyRisk?: boolean;
    unsafeRequest?: boolean;
    profileSignals?: {
      masteryLevel?: string;
      masteryStatus?: string;
      profileConfidence?: number;
      weakTopicDetected?: boolean;
      highHintDependency?: boolean;
      repeatedMistakeDetected?: boolean;
    };
  },
): Promise<ExamModeState | null> {
  const session = await getExamSessionById(examSessionId);
  if (!session) return null;

  const questionState = await getCurrentQuestionState(examSessionId, session.currentQuestionIndex);

  return buildExamState({
    examSession: session,
    currentQuestionState: questionState || undefined,
    ...options,
  });
}
