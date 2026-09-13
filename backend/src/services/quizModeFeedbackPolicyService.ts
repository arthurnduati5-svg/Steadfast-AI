import type { FeedbackPolicyResult } from '../contracts/quizModeContracts';

export interface FeedbackPolicyInput {
  hasAttempt: boolean;
  answerKeyRisk: boolean;
  correctAnswerRisk: boolean;
  markingSchemeRisk: boolean;
  modelAnswerRisk: boolean;
  approvedContextAvailable: boolean;
  deenSensitive: boolean;
  unsafeRequest: boolean;
  recallStrengthBucket?: string;
  practiceNeed?: string;
  repeatedWeak?: boolean;
}

export function evaluateFeedbackPolicy(input: FeedbackPolicyInput): FeedbackPolicyResult {
  if (input.unsafeRequest) {
    return {
      decision: 'block_unsafe_request',
      reasonCodes: ['unsafe_request_blocked'],
      allowCorrectnessSignal: false,
      allowProcessFeedback: false,
      allowHintOnly: false,
      allowRetry: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  if (input.answerKeyRisk || input.correctAnswerRisk || input.markingSchemeRisk || input.modelAnswerRisk) {
    return {
      decision: 'block_answer_key_request',
      reasonCodes: ['answer_key_request_detected'],
      allowCorrectnessSignal: false,
      allowProcessFeedback: false,
      allowHintOnly: true,
      allowRetry: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  if (!input.approvedContextAvailable) {
    return {
      decision: 'safe_content_gap_referral',
      reasonCodes: ['content_context_missing'],
      allowCorrectnessSignal: false,
      allowProcessFeedback: false,
      allowHintOnly: false,
      allowRetry: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  if (input.deenSensitive) {
    return {
      decision: 'safe_deen_referral',
      reasonCodes: ['deen_sensitive_uncertain'],
      allowCorrectnessSignal: false,
      allowProcessFeedback: false,
      allowHintOnly: false,
      allowRetry: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  if (!input.hasAttempt) {
    return {
      decision: 'require_attempt_first',
      reasonCodes: ['no_attempt_observed'],
      allowCorrectnessSignal: false,
      allowProcessFeedback: false,
      allowHintOnly: false,
      allowRetry: false,
      allowMoveNext: false,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  if (input.repeatedWeak && input.recallStrengthBucket === 'weak') {
    return {
      decision: 'recommend_teacher_support',
      reasonCodes: ['repeated_weak_recall'],
      allowCorrectnessSignal: true,
      allowProcessFeedback: true,
      allowHintOnly: true,
      allowRetry: true,
      allowMoveNext: false,
      recommendRevision: true,
      recommendTeacherSupport: true,
    };
  }

  if (input.recallStrengthBucket === 'weak') {
    return {
      decision: 'allow_retry',
      reasonCodes: ['weak_recall_recommend_retry'],
      allowCorrectnessSignal: true,
      allowProcessFeedback: true,
      allowHintOnly: true,
      allowRetry: true,
      allowMoveNext: false,
      recommendRevision: true,
      recommendTeacherSupport: false,
    };
  }

  if (input.recallStrengthBucket === 'emerging') {
    return {
      decision: 'allow_retry',
      reasonCodes: ['emerging_recall_recommend_retry'],
      allowCorrectnessSignal: true,
      allowProcessFeedback: true,
      allowHintOnly: true,
      allowRetry: true,
      allowMoveNext: true,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  if (input.recallStrengthBucket === 'stable' || input.recallStrengthBucket === 'strong') {
    return {
      decision: 'allow_move_next',
      reasonCodes: ['good_recall_move_next'],
      allowCorrectnessSignal: true,
      allowProcessFeedback: true,
      allowHintOnly: false,
      allowRetry: false,
      allowMoveNext: true,
      recommendRevision: false,
      recommendTeacherSupport: false,
    };
  }

  return {
    decision: 'allow_correctness_signal_only',
    reasonCodes: ['attempt_observed'],
    allowCorrectnessSignal: true,
    allowProcessFeedback: true,
    allowHintOnly: true,
    allowRetry: false,
    allowMoveNext: true,
    recommendRevision: false,
    recommendTeacherSupport: false,
  };
}
