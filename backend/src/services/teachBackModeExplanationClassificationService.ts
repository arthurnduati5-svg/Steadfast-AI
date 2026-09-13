import type { ExplanationClassificationResult } from '../contracts/teachBackModeContracts';

export interface ClassificationInput {
  explanationQuality: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  confidenceBucket?: string;
  misconceptionSignal?: string;
  attemptNumber: number;
  usedHint: boolean;
  hintLevel?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
}

export function classifyExplanation(input: ClassificationInput): ExplanationClassificationResult {
  const quality = input.explanationQuality;
  const coverage = input.conceptCoverageBucket || 'unknown';
  const clarity = input.clarityBucket || 'unknown';
  const misconception = input.misconceptionSignal || 'none';
  const hintUsed = input.usedHint;
  const attemptNum = input.attemptNumber;
  const approvedContext = input.approvedContextAvailable ?? true;
  const deenSensitive = input.deenSensitive ?? false;

  // Handle missing approved context
  if (!approvedContext) {
    return {
      explanationStrengthBucket: 'unknown',
      masterySignal: 'no_data_yet',
      readinessSignal: 'needs_review',
      supportNeed: 'content_gap_referral',
      safeReasonCodes: ['content_gap'],
    };
  }

  // Handle Deen sensitive without source
  if (deenSensitive) {
    return {
      explanationStrengthBucket: 'unknown',
      masterySignal: 'no_data_yet',
      readinessSignal: 'needs_review',
      supportNeed: 'deen_referral',
      safeReasonCodes: ['deen_uncertain'],
    };
  }

  // Blank / not attempted
  if (quality === 'blank' || quality === 'not_attempted') {
    return {
      explanationStrengthBucket: 'not_attempted',
      masterySignal: 'no_data_yet',
      readinessSignal: 'needs_retry',
      supportNeed: 'try_again',
      safeReasonCodes: ['require_explanation_before_feedback'],
    };
  }

  // Incorrect with confirmed misconception
  if (quality === 'incorrect' && (misconception === 'confirmed_misconception' || misconception === 'overconfident_wrong')) {
    const isOverconfident = misconception === 'overconfident_wrong';
    return {
      explanationStrengthBucket: 'weak',
      masterySignal: 'not_ready',
      readinessSignal: isOverconfident ? 'teacher_review_recommended' : 'needs_review',
      supportNeed: isOverconfident ? 'teacher_support' : 'repair_misconception',
      safeReasonCodes: ['misconception_detected'],
    };
  }

  // Unclear or fragmented
  if (quality === 'unclear' || quality === 'fragmented') {
    return {
      explanationStrengthBucket: 'weak',
      masterySignal: 'not_ready',
      readinessSignal: 'needs_retry',
      supportNeed: misconception !== 'none' && misconception !== 'unknown' ? 'repair_misconception' : 'give_smaller_prompt',
      safeReasonCodes: ['weak_explanation_detected'],
    };
  }

  // Mentions core idea + somewhat clear → emerging
  if (coverage === 'mentions_core_idea' && clarity === 'somewhat_clear') {
    return {
      explanationStrengthBucket: 'emerging',
      masterySignal: 'emerging',
      readinessSignal: 'almost_ready',
      supportNeed: 'ask_clarifying_question',
      safeReasonCodes: ['partial_explanation_detected'],
    };
  }

  // Partial coverage + clear → developing
  if (coverage === 'partial_coverage' && (clarity === 'clear' || clarity === 'somewhat_clear')) {
    return {
      explanationStrengthBucket: 'developing',
      masterySignal: 'developing',
      readinessSignal: 'almost_ready',
      supportNeed: 'none',
      safeReasonCodes: ['partial_explanation_detected'],
    };
  }

  // Mostly complete + clear → strong or ready with support
  if (coverage === 'mostly_complete' && (clarity === 'clear' || clarity === 'very_clear')) {
    if (hintUsed) {
      return {
        explanationStrengthBucket: 'developing',
        masterySignal: 'ready_with_support',
        readinessSignal: 'almost_ready',
        supportNeed: 'none',
        safeReasonCodes: ['partial_explanation_detected', 'high_hint_dependency'],
      };
    }
    return {
      explanationStrengthBucket: 'strong',
      masterySignal: 'ready_with_support',
      readinessSignal: 'ready_to_move_on',
      supportNeed: 'none',
      safeReasonCodes: ['strong_explanation_detected'],
    };
  }

  // Complete + very_clear + no misconception → strong
  if (coverage === 'complete' && clarity === 'very_clear' && (misconception === 'none' || misconception === 'unknown')) {
    return {
      explanationStrengthBucket: 'strong',
      masterySignal: 'ready_independent',
      readinessSignal: 'ready_to_move_on',
      supportNeed: 'none',
      safeReasonCodes: ['strong_explanation_detected'],
    };
  }

  // Strong quality directly
  if (quality === 'strong' || quality === 'clear') {
    if (hintUsed) {
      return {
        explanationStrengthBucket: 'developing',
        masterySignal: 'ready_with_support',
        readinessSignal: 'almost_ready',
        supportNeed: 'none',
        safeReasonCodes: ['partial_explanation_detected'],
      };
    }
    return {
      explanationStrengthBucket: 'strong',
      masterySignal: 'ready_independent',
      readinessSignal: 'ready_to_move_on',
      supportNeed: 'none',
      safeReasonCodes: ['strong_explanation_detected'],
    };
  }

  // Overconfident wrong
  if (misconception === 'overconfident_wrong') {
    return {
      explanationStrengthBucket: 'weak',
      masterySignal: 'not_ready',
      readinessSignal: 'teacher_review_recommended',
      supportNeed: 'teacher_support',
      safeReasonCodes: ['misconception_detected'],
    };
  }

  // Default: partially_clear or mostly_clear
  if (quality === 'partially_clear' || quality === 'mostly_clear') {
    return {
      explanationStrengthBucket: 'emerging',
      masterySignal: 'emerging',
      readinessSignal: 'almost_ready',
      supportNeed: 'ask_clarifying_question',
      safeReasonCodes: ['partial_explanation_detected'],
    };
  }

  // Fallback
  return {
    explanationStrengthBucket: 'unknown',
    masterySignal: 'no_data_yet',
    readinessSignal: 'unknown',
    supportNeed: 'none',
    safeReasonCodes: ['no_data_yet'],
  };
}
