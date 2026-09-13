import { makeTutorActionDecision } from './tutorActionDecisionService';
import type { TutorActionDecision, TutorActionDecisionRequest } from '../contracts/tutorActionContracts';

export interface TutorActionBridgeInput {
  modeSessionId: string;
  conversationId?: string;
  stage: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  promptRef?: string;
  questionRef?: string;
  contentFingerprint?: string;
  explanationQuality?: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  misconceptionSignal?: string;
  masterySignal?: string;
  readinessSignal?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  answerKeyRisk?: boolean;
  modelAnswerRisk?: boolean;
  attemptCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  reflectionCount: number;
  strongExplanationCount: number;
  partialExplanationCount: number;
  weakExplanationCount: number;
  misconceptionCount: number;
  profileSignals?: {
    masteryLevel?: string;
    masteryStatus?: string;
    profileConfidence?: number;
    weakTopicDetected?: boolean;
    highHintDependency?: boolean;
    repeatedMistakeDetected?: boolean;
  };
}

export async function getNextTeachBackAction(input: TutorActionBridgeInput): Promise<{
  selectedAction: string;
  hintLevel?: string;
  supportLevel: string;
  learnerNeedCategory: string;
  reasonCodes: string[];
  explanationStrengthBucket?: string;
  supportNeed?: string;
}> {
  // Handle content gap
  if (input.approvedContextAvailable === false) {
    return {
      selectedAction: 'safe_content_gap_referral',
      supportLevel: 'teacher_referral',
      learnerNeedCategory: 'content_context_missing',
      reasonCodes: ['content_context_missing'],
    };
  }

  // Handle deen sensitive
  if (input.deenSensitive) {
    return {
      selectedAction: 'safe_deen_referral',
      supportLevel: 'teacher_referral',
      learnerNeedCategory: 'deen_sensitive_uncertain',
      reasonCodes: ['deen_sensitive_uncertain'],
    };
  }

  // Handle answer key seeking
  if (input.answerKeyRisk) {
    return {
      selectedAction: 'block_answer_key_request',
      supportLevel: 'moderate',
      learnerNeedCategory: 'answer_key_seeking',
      reasonCodes: ['answer_key_request_detected'],
    };
  }

  // Handle model answer seeking
  if (input.modelAnswerRisk) {
    return {
      selectedAction: 'ask_student_to_try_first',
      supportLevel: 'low',
      learnerNeedCategory: 'first_attempt_needed',
      reasonCodes: ['no_attempt_observed'],
    };
  }

  // No attempt yet
  if (input.attemptCount === 0) {
    return {
      selectedAction: 'ask_teach_back',
      supportLevel: 'minimal',
      learnerNeedCategory: 'ready_for_teach_back',
      reasonCodes: ['no_attempt_observed'],
    };
  }

  // Try to use the Tutor Action Decision Service
  try {
    const decision = makeTutorActionDecision({
      schoolId: '',
      studentId: '',
      request: {
        modeSessionId: input.modeSessionId,
        conversationId: input.conversationId,
        mode: 'teach_back',
        stage: input.stage,
        subjectId: input.subjectId,
        topicId: input.topicId,
        skillId: input.skillId,
        requestCategory: 'teach_back',
        answerQuality: input.explanationQuality,
        approvedContextAvailable: input.approvedContextAvailable ?? true,
        deenSensitive: input.deenSensitive ?? false,
      },
    });

    return {
      selectedAction: decision.selectedAction,
      hintLevel: decision.hintLevel,
      supportLevel: decision.supportLevel,
      learnerNeedCategory: decision.learnerNeedCategory,
      reasonCodes: decision.decisionReasonCodes,
    };
  } catch {
    // Fallback to deterministic decision
    return getFallbackAction(input);
  }
}

function getFallbackAction(input: TutorActionBridgeInput): {
  selectedAction: string;
  hintLevel?: string;
  supportLevel: string;
  learnerNeedCategory: string;
  reasonCodes: string[];
} {
  const quality = input.explanationQuality;
  const misconception = input.misconceptionSignal;

  if (!quality || quality === 'blank' || quality === 'not_attempted') {
    return {
      selectedAction: 'ask_teach_back',
      supportLevel: 'minimal',
      learnerNeedCategory: 'first_attempt_needed',
      reasonCodes: ['no_attempt_observed'],
    };
  }

  if (quality === 'unclear' || quality === 'fragmented') {
    if (misconception && misconception !== 'none' && misconception !== 'unknown') {
      return {
        selectedAction: 'repair_misconception',
        supportLevel: 'moderate',
        learnerNeedCategory: 'incorrect_conceptual',
        reasonCodes: ['conceptual_mistake'],
      };
    }
    return {
      selectedAction: 'ask_clarifying_question',
      supportLevel: 'low',
      learnerNeedCategory: 'partially_correct',
      reasonCodes: ['partial_attempt'],
    };
  }

  if (quality === 'incorrect') {
    if (misconception === 'overconfident_wrong') {
      return {
        selectedAction: 'recommend_teacher_support',
        supportLevel: 'high',
        learnerNeedCategory: 'needs_teacher_support',
        reasonCodes: ['teacher_referral_needed'],
      };
    }
    return {
      selectedAction: 'repair_misconception',
      supportLevel: 'moderate',
      learnerNeedCategory: 'incorrect_conceptual',
      reasonCodes: ['conceptual_mistake'],
    };
  }

  if (quality === 'partially_clear' || quality === 'mostly_clear') {
    return {
      selectedAction: 'ask_clarifying_question',
      supportLevel: 'low',
      learnerNeedCategory: 'partially_correct',
      reasonCodes: ['partial_attempt'],
    };
  }

  if (quality === 'clear' || quality === 'strong') {
    return {
      selectedAction: 'check_readiness',
      supportLevel: 'minimal',
      learnerNeedCategory: 'ready_for_challenge',
      reasonCodes: ['mastery_developing'],
    };
  }

  return {
    selectedAction: 'ask_teach_back',
    supportLevel: 'low',
    learnerNeedCategory: 'no_data_yet',
    reasonCodes: ['no_data_yet'],
  };
}
