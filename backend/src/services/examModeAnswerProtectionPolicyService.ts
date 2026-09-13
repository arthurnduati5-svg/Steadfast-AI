import type { ExamModeAnswerProtectionDecision } from '../contracts/examModeContracts';

export interface AnswerProtectionInput {
  hasAttempt: boolean;
  answerKeyRisk: boolean;
  markingSchemeRisk: boolean;
  modelAnswerRisk: boolean;
  approvedContextAvailable: boolean;
  deenSensitive: boolean;
  unsafeRequest: boolean;
}

export interface AnswerProtectionResult {
  decision: ExamModeAnswerProtectionDecision;
  reasonCodes: string[];
  allowProcessHelp: boolean;
  allowHintOnly: boolean;
  allowFeedbackOnAttempt: boolean;
}

export function evaluateAnswerProtection(input: AnswerProtectionInput): AnswerProtectionResult {
  if (input.unsafeRequest) {
    return {
      decision: 'block_unsafe_request',
      reasonCodes: ['unsafe_request_blocked'],
      allowProcessHelp: false,
      allowHintOnly: false,
      allowFeedbackOnAttempt: false,
    };
  }

  if (input.answerKeyRisk || input.markingSchemeRisk || input.modelAnswerRisk) {
    return {
      decision: 'block_answer_key_request',
      reasonCodes: ['answer_key_request_detected'],
      allowProcessHelp: true,
      allowHintOnly: true,
      allowFeedbackOnAttempt: false,
    };
  }

  if (!input.approvedContextAvailable) {
    return {
      decision: 'safe_content_gap_referral',
      reasonCodes: ['content_context_missing'],
      allowProcessHelp: false,
      allowHintOnly: false,
      allowFeedbackOnAttempt: false,
    };
  }

  if (input.deenSensitive) {
    return {
      decision: 'safe_deen_referral',
      reasonCodes: ['deen_sensitive_uncertain'],
      allowProcessHelp: false,
      allowHintOnly: false,
      allowFeedbackOnAttempt: false,
    };
  }

  if (!input.hasAttempt) {
    return {
      decision: 'require_attempt_first',
      reasonCodes: ['no_attempt_observed'],
      allowProcessHelp: false,
      allowHintOnly: false,
      allowFeedbackOnAttempt: false,
    };
  }

  return {
    decision: 'allow_feedback_on_attempt',
    reasonCodes: ['attempt_observed'],
    allowProcessHelp: true,
    allowHintOnly: true,
    allowFeedbackOnAttempt: true,
  };
}

export function isAnswerKeySeeking(input: Pick<AnswerProtectionInput, 'answerKeyRisk' | 'markingSchemeRisk' | 'modelAnswerRisk'>): boolean {
  return input.answerKeyRisk || input.markingSchemeRisk || input.modelAnswerRisk;
}
