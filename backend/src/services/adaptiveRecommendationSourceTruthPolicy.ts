import type {
  AdaptiveTuningSourceTruthStatus,
  AdaptiveTuningConfidenceBucket,
  AdaptiveTuningReasonCode,
} from '../contracts/adaptiveRecommendationTuningContracts';

export interface SourceTruthContext {
  evidenceSource?: string;
  evidenceConfidence?: number;
  evidenceAgeMs?: number;
  isDeenSensitive?: boolean;
  isSafeguardingActive?: boolean;
  hasContentGap?: boolean;
  hasAnswerKeyBlock?: boolean;
}

export interface SourceTruthResult {
  sourceTruthStatus: AdaptiveTuningSourceTruthStatus;
  confidenceBucket: AdaptiveTuningConfidenceBucket;
  canTune: boolean;
  safeReasonCodes: AdaptiveTuningReasonCode[];
}

const STALE_EVIDENCE_MS = 7 * 24 * 60 * 60 * 1000;
const EXPIRED_EVIDENCE_MS = 30 * 24 * 60 * 60 * 1000;

export class AdaptiveRecommendationSourceTruthPolicy {
  evaluateSourceTruth(context: SourceTruthContext): SourceTruthResult {
    const reasonCodes: AdaptiveTuningReasonCode[] = [];

    if (context.isDeenSensitive) {
      return {
        sourceTruthStatus: 'deen_referral',
        confidenceBucket: 'blocked',
        canTune: false,
        safeReasonCodes: ['preference_cannot_bypass_deen_boundary'],
      };
    }

    if (context.isSafeguardingActive) {
      return {
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
        canTune: false,
        safeReasonCodes: ['preference_cannot_bypass_safeguarding_boundary'],
      };
    }

    if (context.hasContentGap) {
      return {
        sourceTruthStatus: 'content_gap',
        confidenceBucket: 'not_enough_evidence',
        canTune: false,
        safeReasonCodes: ['content_gap_no_tuning'],
      };
    }

    if (context.hasAnswerKeyBlock) {
      return {
        sourceTruthStatus: 'blocked',
        confidenceBucket: 'blocked',
        canTune: false,
        safeReasonCodes: ['protected_answer_field_detected'],
      };
    }

    if (!context.evidenceSource) {
      return {
        sourceTruthStatus: 'unknown',
        confidenceBucket: 'not_enough_evidence',
        canTune: false,
        safeReasonCodes: ['no_real_learning_evidence_for_tuning'],
      };
    }

    if (context.evidenceSource === 'demo' || context.evidenceSource === 'synthetic_test') {
      return {
        sourceTruthStatus: context.evidenceSource as AdaptiveTuningSourceTruthStatus,
        confidenceBucket: 'not_enough_evidence',
        canTune: false,
        safeReasonCodes: ['non_real_evidence_cannot_support_real_tuning'],
      };
    }

    if (context.evidenceSource === 'fallback') {
      return {
        sourceTruthStatus: 'fallback',
        confidenceBucket: 'not_enough_evidence',
        canTune: false,
        safeReasonCodes: ['non_real_evidence_cannot_support_real_tuning'],
      };
    }

    if (context.evidenceAgeMs !== undefined) {
      if (context.evidenceAgeMs > EXPIRED_EVIDENCE_MS) {
        return {
          sourceTruthStatus: 'expired',
          confidenceBucket: 'not_enough_evidence',
          canTune: false,
          safeReasonCodes: ['expired_evidence_blocks_tuning'],
        };
      }
      if (context.evidenceAgeMs > STALE_EVIDENCE_MS) {
        reasonCodes.push('stale_evidence_reduces_confidence');
      }
    }

    if (context.evidenceSource === 'real_evidence' || context.evidenceSource === 'mixed_evidence') {
      const confidence: AdaptiveTuningConfidenceBucket =
        context.evidenceSource === 'real_evidence'
          ? (context.evidenceAgeMs && context.evidenceAgeMs > STALE_EVIDENCE_MS ? 'low_confidence' : 'medium_confidence')
          : 'low_confidence';

      if (context.evidenceConfidence !== undefined && context.evidenceConfidence >= 0.8) {
        return {
          sourceTruthStatus: context.evidenceSource as AdaptiveTuningSourceTruthStatus,
          confidenceBucket: 'high_confidence',
          canTune: true,
          safeReasonCodes: reasonCodes.length > 0 ? reasonCodes : [],
        };
      }

      return {
        sourceTruthStatus: context.evidenceSource as AdaptiveTuningSourceTruthStatus,
        confidenceBucket: confidence,
        canTune: true,
        safeReasonCodes: reasonCodes.length > 0 ? reasonCodes : [],
      };
    }

    return {
      sourceTruthStatus: 'unknown',
      confidenceBucket: 'not_enough_evidence',
      canTune: false,
      safeReasonCodes: ['no_real_learning_evidence_for_tuning'],
    };
  }
}

export const adaptiveRecommendationSourceTruthPolicy = new AdaptiveRecommendationSourceTruthPolicy();
