import { makeTutorActionDecision, type DecisionServiceInput } from './tutorActionDecisionService';
import type { TutorActionDecision } from '../contracts/tutorActionContracts';

export interface FocusTutorActionBridgeInput {
  schoolId: string;
  studentId: string;
  modeSessionId?: string;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  currentStage?: string;
  answerQuality?: string;
  mistakeCategory?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  safeSignals?: {
    attemptCount?: number;
    hintCount?: number;
    stuckCount?: number;
    recoveryCount?: number;
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

export interface FocusTutorActionBridgeOutput {
  selectedAction: string;
  hintLevel?: string;
  supportLevel: string;
  learnerNeedCategory: string;
  reasonCodes: string[];
  confidenceScore: number;
  contentGap: boolean;
  deenReferral: boolean;
}

export function getNextFocusAction(input: FocusTutorActionBridgeInput): FocusTutorActionBridgeOutput {
  const decisionInput: DecisionServiceInput = {
    schoolId: input.schoolId,
    studentId: input.studentId,
    request: {
      modeSessionId: input.modeSessionId,
      conversationId: input.conversationId,
      mode: 'focus',
      stage: input.currentStage,
      subjectId: input.subjectId,
      topicId: input.topicId,
      skillId: input.skillId,
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
