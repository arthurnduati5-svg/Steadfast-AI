import { makeTutorActionDecision, type DecisionServiceInput } from './tutorActionDecisionService';

export interface QuizTutorActionBridgeInput {
  schoolId: string;
  studentId: string;
  modeSessionId?: string;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  questionRef?: string;
  questionFingerprint?: string;
  currentStage?: string;
  requestCategory?: string;
  answerQuality?: string;
  mistakeCategory?: string;
  retrievalSignal?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  answerKeyRisk?: boolean;
  quizIntegrityRisk?: boolean;
  safeSignals?: {
    attemptCount?: number;
    hintCount?: number;
    stuckCount?: number;
    recoveryCount?: number;
    skippedCount?: number;
    flaggedCount?: number;
    correctCount?: number;
    partialCount?: number;
    incorrectCount?: number;
  };
  profileSignals?: {
    masteryLevel?: string;
    masteryStatus?: string;
    profileConfidence?: number;
    weakTopicDetected?: boolean;
    highHintDependency?: boolean;
    repeatedMistakeDetected?: boolean;
  };
}

export interface QuizTutorActionBridgeOutput {
  selectedAction: string;
  hintLevel?: string;
  supportLevel: string;
  learnerNeedCategory: string;
  reasonCodes: string[];
  confidenceScore: number;
  contentGap: boolean;
  deenReferral: boolean;
}

export function getNextQuizAction(input: QuizTutorActionBridgeInput): QuizTutorActionBridgeOutput {
  const decisionInput: DecisionServiceInput = {
    schoolId: input.schoolId,
    studentId: input.studentId,
    request: {
      modeSessionId: input.modeSessionId,
      conversationId: input.conversationId,
      mode: 'quiz',
      stage: input.currentStage,
      subjectId: input.subjectId,
      topicId: input.topicId,
      skillId: input.skillId,
      requestCategory: input.requestCategory,
      answerQuality: input.answerQuality,
      mistakeCategory: input.mistakeCategory,
      approvedContextAvailable: input.approvedContextAvailable,
      deenSensitive: input.deenSensitive,
    },
    safeSignals: input.safeSignals,
    profileSignals: input.profileSignals,
  };

  const decision = makeTutorActionDecision(decisionInput);

  return {
    selectedAction: decision.selectedAction,
    hintLevel: decision.hintLevel,
    supportLevel: decision.supportLevel,
    learnerNeedCategory: decision.learnerNeedCategory,
    reasonCodes: decision.decisionReasonCodes,
    confidenceScore: decision.confidenceScore,
    contentGap: decision.contentPolicy.contentGap,
    deenReferral: decision.contentPolicy.deenSensitive && decision.contentPolicy.referralRequired,
  };
}
