export interface SourceTruthContext {
  sourceTruthStatus: string;
  evidenceStrength: string;
  evidenceType: string;
  isBlockedAnswerKey: boolean;
  isBlockedModelAnswer: boolean;
  isDeenSensitive: boolean;
  isContentGap: boolean;
}

export interface SourceTruthResult {
  canSupportRealGrowthClaim: boolean;
  canSupportMasteryCandidate: boolean;
  canSupportTeacherSafeSummary: boolean;
  effectiveStatus: string;
  safeReasonCodes: string[];
  confidenceBucket: string;
}

export class SafeLearningEvidenceSourceTruthPolicy {
  evaluate(context: SourceTruthContext): SourceTruthResult {
    const codes: string[] = [];
    const status = context.sourceTruthStatus;

    if (status === 'real') {
      if (context.isBlockedAnswerKey) {
        return {
          canSupportRealGrowthClaim: false,
          canSupportMasteryCandidate: false,
          canSupportTeacherSafeSummary: false,
          effectiveStatus: 'blocked',
          safeReasonCodes: ['blocked_answer_key_event_safety_evidence_only'],
          confidenceBucket: 'none',
        };
      }
      if (context.isBlockedModelAnswer) {
        return {
          canSupportRealGrowthClaim: false,
          canSupportMasteryCandidate: false,
          canSupportTeacherSafeSummary: false,
          effectiveStatus: 'blocked',
          safeReasonCodes: ['blocked_model_answer_event_safety_evidence_only'],
          confidenceBucket: 'none',
        };
      }
      codes.push('real_evidence_can_support_growth_claim');
      let canMastery = true;
      if (context.evidenceStrength === 'weak' || context.evidenceStrength === 'none') {
        canMastery = false;
        codes.push('weak_evidence_cannot_support_mastery_alone');
      }
      return {
        canSupportRealGrowthClaim: true,
        canSupportMasteryCandidate: canMastery,
        canSupportTeacherSafeSummary: true,
        effectiveStatus: 'real',
        safeReasonCodes: codes,
        confidenceBucket: 'high',
      };
    }

    if (status === 'demo' || status === 'fallback') {
      return {
        canSupportRealGrowthClaim: false,
        canSupportMasteryCandidate: false,
        canSupportTeacherSafeSummary: false,
        effectiveStatus: 'non_real_evidence_only',
        safeReasonCodes: ['non_real_evidence_cannot_support_growth_claim'],
        confidenceBucket: 'low',
      };
    }

    if (status === 'synthetic_test') {
      return {
        canSupportRealGrowthClaim: false,
        canSupportMasteryCandidate: false,
        canSupportTeacherSafeSummary: false,
        effectiveStatus: 'non_real_evidence_only',
        safeReasonCodes: ['synthetic_test_evidence_cannot_support_real_learner_proof'],
        confidenceBucket: 'low',
      };
    }

    if (status === 'unknown') {
      return {
        canSupportRealGrowthClaim: false,
        canSupportMasteryCandidate: false,
        canSupportTeacherSafeSummary: false,
        effectiveStatus: 'unknown',
        safeReasonCodes: ['unknown_evidence_cannot_support_mastery'],
        confidenceBucket: 'low',
      };
    }

    if (status === 'stale') {
      codes.push('stale_evidence_reduces_confidence');
      let canMastery = context.evidenceStrength === 'mastery_candidate';
      if (!canMastery) {
        codes.push('stale_evidence_cannot_support_new_mastery');
      }
      return {
        canSupportRealGrowthClaim: true,
        canSupportMasteryCandidate: canMastery,
        canSupportTeacherSafeSummary: true,
        effectiveStatus: 'stale',
        safeReasonCodes: codes,
        confidenceBucket: 'medium',
      };
    }

    if (status === 'expired') {
      return {
        canSupportRealGrowthClaim: false,
        canSupportMasteryCandidate: false,
        canSupportTeacherSafeSummary: false,
        effectiveStatus: 'expired',
        safeReasonCodes: ['expired_evidence_cannot_support_mastery'],
        confidenceBucket: 'none',
      };
    }

    if (status === 'content_gap') {
      return {
        canSupportRealGrowthClaim: false,
        canSupportMasteryCandidate: false,
        canSupportTeacherSafeSummary: true,
        effectiveStatus: 'content_gap',
        safeReasonCodes: ['content_gap_evidence_cannot_invent_teaching_claims'],
        confidenceBucket: 'low',
      };
    }

    if (status === 'source_required') {
      if (context.isDeenSensitive) {
        return {
          canSupportRealGrowthClaim: false,
          canSupportMasteryCandidate: false,
          canSupportTeacherSafeSummary: false,
          effectiveStatus: 'deen_referral',
          safeReasonCodes: ['deen_uncertainty_requires_scholar_referral'],
          confidenceBucket: 'none',
        };
      }
      return {
        canSupportRealGrowthClaim: false,
        canSupportMasteryCandidate: false,
        canSupportTeacherSafeSummary: false,
        effectiveStatus: 'source_required',
        safeReasonCodes: ['approved_source_context_missing'],
        confidenceBucket: 'none',
      };
    }

    return {
      canSupportRealGrowthClaim: false,
      canSupportMasteryCandidate: false,
      canSupportTeacherSafeSummary: false,
      effectiveStatus: 'unknown',
      safeReasonCodes: ['unrecognized_source_truth_status'],
      confidenceBucket: 'none',
    };
  }

  isRealEvidence(status: string): boolean {
    return status === 'real';
  }

  isNonRealEvidence(status: string): boolean {
    return ['demo', 'fallback', 'synthetic_test'].includes(status);
  }

  canBeRealProof(status: string): boolean {
    return this.isRealEvidence(status);
  }
}

export const safeLearningEvidenceSourceTruthPolicy = new SafeLearningEvidenceSourceTruthPolicy();
