import type { AnswerProtectionResult } from '../contracts/teachBackModeContracts';

export interface AnswerProtectionInput {
  hasAttempt: boolean;
  answerKeyRisk: boolean;
  correctAnswerRisk: boolean;
  markingSchemeRisk: boolean;
  modelAnswerRisk: boolean;
  approvedContextAvailable: boolean;
  deenSensitive: boolean;
  unsafeRequest: boolean;
}

export function evaluateTeachBackAnswerProtection(input: AnswerProtectionInput): AnswerProtectionResult {
  if (input.unsafeRequest) {
    return {
      decision: 'block_unsafe_request',
      reasonCodes: ['unsafe_blocked'],
      allowProcessHelp: false,
      allowFeedbackOnExplanation: false,
      allowSmallerPrompt: false,
    };
  }

  if (input.modelAnswerRisk) {
    return {
      decision: 'block_model_answer_request',
      reasonCodes: ['model_answer_blocked'],
      allowProcessHelp: false,
      allowFeedbackOnExplanation: false,
      allowSmallerPrompt: true,
    };
  }

  if (input.answerKeyRisk || input.correctAnswerRisk || input.markingSchemeRisk) {
    return {
      decision: 'block_answer_key_request',
      reasonCodes: ['answer_key_blocked'],
      allowProcessHelp: false,
      allowFeedbackOnExplanation: false,
      allowSmallerPrompt: true,
    };
  }

  if (input.deenSensitive) {
    return {
      decision: 'safe_deen_referral',
      reasonCodes: ['deen_uncertain'],
      allowProcessHelp: false,
      allowFeedbackOnExplanation: false,
      allowSmallerPrompt: false,
    };
  }

  if (!input.approvedContextAvailable) {
    return {
      decision: 'safe_content_gap_referral',
      reasonCodes: ['content_gap'],
      allowProcessHelp: false,
      allowFeedbackOnExplanation: false,
      allowSmallerPrompt: false,
    };
  }

  if (!input.hasAttempt) {
    return {
      decision: 'require_explanation_first',
      reasonCodes: ['require_explanation_before_feedback'],
      allowProcessHelp: false,
      allowFeedbackOnExplanation: false,
      allowSmallerPrompt: false,
    };
  }

  return {
    decision: 'allow_feedback_on_explanation',
    reasonCodes: ['process_feedback_allowed'],
    allowProcessHelp: true,
    allowFeedbackOnExplanation: true,
    allowSmallerPrompt: true,
  };
}
