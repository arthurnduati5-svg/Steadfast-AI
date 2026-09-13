import type {
  AdaptiveChallengeSourceTruthStatus,
  AdaptiveChallengeConfidenceBucket,
  AdaptiveChallengePolicyDecision,
} from '../contracts/adaptiveChallengeContracts';

export interface SourceTruthEvaluationInput {
  sourceTruthStatus: AdaptiveChallengeSourceTruthStatus;
  isDeenSensitive: boolean;
  isSafeguardingBoundary: boolean;
  hasApprovedSourceContext: boolean;
}

export interface SourceTruthEvaluationResult {
  canGenerateChallenge: boolean;
  canSupportReadiness: boolean;
  confidenceBucket: AdaptiveChallengeConfidenceBucket;
  policyDecision: AdaptiveChallengePolicyDecision;
  sourceTruthStatus: AdaptiveChallengeSourceTruthStatus;
  safeReasonCodes: string[];
  message?: string;
}

export class AdaptiveChallengeSourceTruthPolicy {
  evaluate(input: SourceTruthEvaluationInput): SourceTruthEvaluationResult {
    const { sourceTruthStatus, isDeenSensitive, isSafeguardingBoundary, hasApprovedSourceContext } = input;

    if (isSafeguardingBoundary) {
      return {
        canGenerateChallenge: false,
        canSupportReadiness: false,
        confidenceBucket: 'blocked',
        policyDecision: 'blocked_safeguarding_boundary',
        sourceTruthStatus: 'blocked',
        safeReasonCodes: ['safeguarding_boundary_applied'],
        message: 'This cannot be turned into a challenge because it requires safe adult support.',
      };
    }

    if (isDeenSensitive && !hasApprovedSourceContext) {
      return {
        canGenerateChallenge: false,
        canSupportReadiness: false,
        confidenceBucket: 'blocked',
        policyDecision: 'blocked_deen_referral',
        sourceTruthStatus: 'source_required',
        safeReasonCodes: ['deen_referral_required'],
        message: 'This challenge needs an approved Islamic Studies source, teacher, or scholar before it can be generated.',
      };
    }

    switch (sourceTruthStatus) {
      case 'real':
        return {
          canGenerateChallenge: true,
          canSupportReadiness: true,
          confidenceBucket: 'high',
          policyDecision: 'allowed',
          sourceTruthStatus: 'real',
          safeReasonCodes: ['real_evidence_supports_challenge_readiness'],
        };

      case 'mixed':
        return {
          canGenerateChallenge: true,
          canSupportReadiness: true,
          confidenceBucket: 'medium',
          policyDecision: 'allowed',
          sourceTruthStatus: 'mixed',
          safeReasonCodes: ['mixed_evidence_supports_cautious_readiness'],
        };

      case 'demo':
        return {
          canGenerateChallenge: false,
          canSupportReadiness: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'blocked_fake_readiness',
          sourceTruthStatus: 'demo',
          safeReasonCodes: ['non_real_evidence_cannot_support_real_challenge_readiness'],
          message: 'Demo evidence cannot support real challenge readiness.',
        };

      case 'fallback':
        return {
          canGenerateChallenge: false,
          canSupportReadiness: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'blocked_fake_readiness',
          sourceTruthStatus: 'fallback',
          safeReasonCodes: ['non_real_evidence_cannot_support_real_challenge_readiness'],
          message: 'Fallback evidence cannot support real challenge readiness.',
        };

      case 'synthetic_test':
        return {
          canGenerateChallenge: false,
          canSupportReadiness: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'blocked_fake_readiness',
          sourceTruthStatus: 'synthetic_test',
          safeReasonCodes: ['non_real_evidence_cannot_support_real_challenge_readiness'],
          message: 'Synthetic test evidence cannot support real challenge readiness.',
        };

      case 'unknown':
        return {
          canGenerateChallenge: true,
          canSupportReadiness: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'allowed_with_scaffold',
          sourceTruthStatus: 'unknown',
          safeReasonCodes: ['unknown_evidence_cannot_produce_high_confidence_challenge'],
          message: 'Unknown evidence status; cannot produce high-confidence challenge.',
        };

      case 'stale':
        return {
          canGenerateChallenge: true,
          canSupportReadiness: true,
          confidenceBucket: 'low',
          policyDecision: 'allowed_with_scaffold',
          sourceTruthStatus: 'stale',
          safeReasonCodes: ['stale_evidence_reduces_confidence'],
          message: 'Evidence is stale; confidence is reduced.',
        };

      case 'expired':
        return {
          canGenerateChallenge: false,
          canSupportReadiness: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'blocked_not_ready',
          sourceTruthStatus: 'expired',
          safeReasonCodes: ['expired_evidence_cannot_support_active_challenge'],
          message: 'Expired evidence cannot support active challenge readiness.',
        };

      case 'content_gap':
        return {
          canGenerateChallenge: false,
          canSupportReadiness: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'blocked_content_gap',
          sourceTruthStatus: 'content_gap',
          safeReasonCodes: ['content_gap_cannot_invent_challenge_content'],
          message: 'Content gap detected; cannot invent challenge content.',
        };

      case 'source_required':
        return {
          canGenerateChallenge: false,
          canSupportReadiness: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'blocked_source_required',
          sourceTruthStatus: 'source_required',
          safeReasonCodes: ['source_required_for_challenge_generation'],
          message: 'An approved source is required before this challenge can be generated.',
        };

      case 'insufficient':
      case 'blocked':
      default:
        return {
          canGenerateChallenge: false,
          canSupportReadiness: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'blocked_not_ready',
          sourceTruthStatus: 'insufficient',
          safeReasonCodes: ['not_enough_real_evidence_for_challenge'],
          message: 'There is not enough safe learning evidence for a challenge yet.',
        };
    }
  }
}

export const adaptiveChallengeSourceTruthPolicy = new AdaptiveChallengeSourceTruthPolicy();
