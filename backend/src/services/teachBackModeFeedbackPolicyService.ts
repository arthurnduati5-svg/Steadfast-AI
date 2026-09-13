import type { FeedbackPolicyResult } from '../contracts/teachBackModeContracts';

export interface FeedbackPolicyInput {
  hasAttempt: boolean;
  explanationQuality?: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  misconceptionSignal?: string;
  approvedContextAvailable: boolean;
  deenSensitive: boolean;
  answerKeyRisk: boolean;
  correctAnswerRisk: boolean;
  markingSchemeRisk: boolean;
  modelAnswerRisk: boolean;
  unsafeRequest: boolean;
  attemptCount: number;
  weakExplanationCount: number;
}

export function evaluateFeedbackPolicy(input: FeedbackPolicyInput): FeedbackPolicyResult {
  // Unsafe request
  if (input.unsafeRequest) {
    return {
      decision: 'block_unsafe_request',
      reasonCodes: ['unsafe_blocked'],
      allowClaritySignalOnly: false,
      allowProcessFeedback: false,
      allowRetry: false,
      allowSmallerPrompt: false,
      allowReflection: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  // Model answer risk
  if (input.modelAnswerRisk) {
    return {
      decision: 'block_model_answer_request',
      reasonCodes: ['model_answer_blocked'],
      allowClaritySignalOnly: false,
      allowProcessFeedback: false,
      allowRetry: false,
      allowSmallerPrompt: true,
      allowReflection: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  // Answer key / correct answer / marking scheme risk
  if (input.answerKeyRisk || input.correctAnswerRisk || input.markingSchemeRisk) {
    return {
      decision: 'block_answer_key_request',
      reasonCodes: ['answer_key_blocked'],
      allowClaritySignalOnly: false,
      allowProcessFeedback: false,
      allowRetry: false,
      allowSmallerPrompt: true,
      allowReflection: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  // Deen uncertainty
  if (input.deenSensitive) {
    return {
      decision: 'safe_deen_referral',
      reasonCodes: ['deen_uncertain'],
      allowClaritySignalOnly: false,
      allowProcessFeedback: false,
      allowRetry: false,
      allowSmallerPrompt: false,
      allowReflection: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: true,
    };
  }

  // Content gap
  if (!input.approvedContextAvailable) {
    return {
      decision: 'safe_content_gap_referral',
      reasonCodes: ['content_gap'],
      allowClaritySignalOnly: false,
      allowProcessFeedback: false,
      allowRetry: false,
      allowSmallerPrompt: false,
      allowReflection: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: true,
    };
  }

  // No attempt yet
  if (!input.hasAttempt) {
    return {
      decision: 'require_explanation_first',
      reasonCodes: ['require_explanation_before_feedback'],
      allowClaritySignalOnly: false,
      allowProcessFeedback: false,
      allowRetry: false,
      allowSmallerPrompt: false,
      allowReflection: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  const quality = input.explanationQuality || 'not_attempted';
  const misconception = input.misconceptionSignal || 'none';

  // Strong explanation
  if (quality === 'strong' || quality === 'clear') {
    return {
      decision: 'allow_move_next',
      reasonCodes: ['strong_explanation_detected'],
      allowClaritySignalOnly: false,
      allowProcessFeedback: true,
      allowRetry: false,
      allowSmallerPrompt: false,
      allowReflection: true,
      allowMoveNext: true,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  // Check for repeated weak explanations
  if (input.weakExplanationCount >= 3) {
    return {
      decision: 'recommend_teacher_support',
      reasonCodes: ['weak_explanation_detected', 'teacher_referral_needed'],
      allowClaritySignalOnly: true,
      allowProcessFeedback: true,
      allowRetry: true,
      allowSmallerPrompt: true,
      allowReflection: false,
      allowMoveNext: false,
      recommendRevision: true,
      recommendTeacherSupport: true,
    };
  }

  // Weak explanation (but not repeated enough for teacher)
  if (quality === 'unclear' || quality === 'fragmented' || quality === 'incorrect') {
    const allowSmaller = misconception !== 'none' && misconception !== 'unknown' ? false : true;
    return {
      decision: misconception !== 'none' && misconception !== 'unknown' ? 'allow_retry' : 'allow_smaller_prompt',
      reasonCodes: ['weak_explanation_detected'],
      allowClaritySignalOnly: true,
      allowProcessFeedback: true,
      allowRetry: true,
      allowSmallerPrompt: allowSmaller,
      allowReflection: false,
      allowMoveNext: false,
      recommendRevision: input.weakExplanationCount >= 2,
      recommendTeacherSupport: false,
    };
  }

  // Emerging/developing explanation
  if (quality === 'partially_clear' || quality === 'mostly_clear') {
    return {
      decision: 'allow_process_feedback',
      reasonCodes: ['partial_explanation_detected'],
      allowClaritySignalOnly: true,
      allowProcessFeedback: true,
      allowRetry: true,
      allowSmallerPrompt: false,
      allowReflection: true,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  // Fallback
  return {
    decision: 'allow_process_feedback',
    reasonCodes: ['partial_explanation_detected'],
    allowClaritySignalOnly: true,
    allowProcessFeedback: true,
    allowRetry: true,
    allowSmallerPrompt: false,
    allowReflection: true,
    allowMoveNext: false,
    recommendRevision: false,
    recommendTeacherSupport: false,
  };
}
