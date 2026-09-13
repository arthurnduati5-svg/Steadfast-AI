import type {
  AdaptiveTuningResponse,
  AdaptiveTuningErrorResponse,
  AdaptiveTuningDecision,
  AdaptiveTuningPolicyDecision,
  AdaptiveTuningSourceTruthStatus,
  AdaptiveTuningConfidenceBucket,
  AdaptiveTuningAvoidanceRiskBucket,
  AdaptiveTuningMasteryInflationRiskBucket,
  AdaptiveTuningReasonCode,
  ClosedLoopPersonalizationPacket,
} from '../contracts/adaptiveRecommendationTuningContracts';

function generateTimestamp(): string {
  return new Date().toISOString();
}

const PRIVACY_FLAGS = {
  rawPrivateDataIncluded: false as const,
  hiddenReasoningIncluded: false as const,
  teacherOnlyDataIncluded: false as const,
  answerKeyIncluded: false as const,
  modelAnswerIncluded: false as const,
  markingSchemeIncluded: false as const,
  correctAnswerIncluded: false as const,
  safeguardingRawDetailIncluded: false as const,
  deenSensitivePrivateTextIncluded: false as const,
};

export class AdaptiveRecommendationTuningResponseBuilder {
  success(
    data?: Record<string, unknown>,
    options?: {
      status?: string;
      safeReasonCodes?: AdaptiveTuningReasonCode[];
      policyDecision?: AdaptiveTuningPolicyDecision;
      tuningDecision?: AdaptiveTuningDecision;
      sourceTruthStatus?: AdaptiveTuningSourceTruthStatus;
      confidenceBucket?: AdaptiveTuningConfidenceBucket;
      avoidanceRiskBucket?: AdaptiveTuningAvoidanceRiskBucket;
      masteryInflationRiskBucket?: AdaptiveTuningMasteryInflationRiskBucket;
      message?: string;
    },
  ): AdaptiveTuningResponse {
    return {
      ok: true,
      status: options?.status,
      data,
      safeReasonCodes: options?.safeReasonCodes,
      policyDecision: options?.policyDecision,
      tuningDecision: options?.tuningDecision,
      sourceTruthStatus: options?.sourceTruthStatus,
      confidenceBucket: options?.confidenceBucket,
      avoidanceRiskBucket: options?.avoidanceRiskBucket,
      masteryInflationRiskBucket: options?.masteryInflationRiskBucket,
      message: options?.message,
      ...PRIVACY_FLAGS,
      generatedAt: generateTimestamp(),
    };
  }

  empty(): AdaptiveTuningResponse {
    return this.success(undefined, {
      status: 'empty',
      confidenceBucket: 'not_enough_evidence',
      safeReasonCodes: ['no_preference_feedback_yet'],
      message: 'There is not enough safe feedback yet to tune recommendations. The system will continue using safe learning evidence.',
    });
  }

  insufficientEvidence(): AdaptiveTuningResponse {
    return this.success(undefined, {
      status: 'insufficient',
      sourceTruthStatus: 'insufficient' as AdaptiveTuningSourceTruthStatus,
      confidenceBucket: 'not_enough_evidence',
      safeReasonCodes: ['no_real_learning_evidence_for_tuning'],
    });
  }

  contentGap(): AdaptiveTuningResponse {
    return this.success(undefined, {
      status: 'content_gap',
      sourceTruthStatus: 'content_gap',
      confidenceBucket: 'not_enough_evidence',
      safeReasonCodes: ['content_gap_no_tuning'],
      message: 'There is no approved curriculum content available to support recommendation tuning for this topic.',
    });
  }

  sourceRequired(): AdaptiveTuningResponse {
    return this.success(undefined, {
      status: 'source_required',
      sourceTruthStatus: 'source_required',
      confidenceBucket: 'not_enough_evidence',
      safeReasonCodes: ['source_required_tuning_blocked'],
      message: 'Approved source context is required before recommendation tuning can be applied.',
    });
  }

  deenReferral(): AdaptiveTuningResponse {
    return this.success(undefined, {
      status: 'deen_referral',
      sourceTruthStatus: 'deen_referral',
      confidenceBucket: 'not_enough_evidence',
      safeReasonCodes: ['deen_referral_required'],
      message: 'This feedback cannot tune religious guidance without an approved Islamic Studies source, teacher, or scholar.',
    });
  }

  safeguardingBoundary(): AdaptiveTuningResponse {
    return this.success(undefined, {
      status: 'safeguarding_boundary',
      sourceTruthStatus: 'blocked',
      confidenceBucket: 'blocked',
      safeReasonCodes: ['safeguarding_boundary_applied'],
      message: 'Some details are not used for recommendation tuning because they require safe adult support.',
    });
  }

  avoidanceSafe(
    avoidanceRiskBucket: AdaptiveTuningAvoidanceRiskBucket,
    message?: string,
  ): AdaptiveTuningResponse {
    return this.success(undefined, {
      status: 'avoidance_safe',
      avoidanceRiskBucket,
      safeReasonCodes: ['avoidance_loop_risk_detected'],
      message: message || 'The system will keep this learning need visible, but it can offer a smaller next step.',
    });
  }

  masteryInflationBlocked(): AdaptiveTuningResponse {
    return this.success(undefined, {
      status: 'blocked',
      masteryInflationRiskBucket: 'elevated',
      policyDecision: 'blocked_mastery_inflation',
      safeReasonCodes: ['preference_cannot_create_mastery'],
      message: 'Preference feedback cannot mark a skill as mastered without safe learning evidence.',
    });
  }

  blocked(
    policyDecision: AdaptiveTuningPolicyDecision,
    safeReasonCodes: AdaptiveTuningReasonCode[],
    message?: string,
  ): AdaptiveTuningResponse {
    return this.success(undefined, {
      status: 'blocked',
      policyDecision,
      safeReasonCodes,
      message: message || 'This recommendation tuning action is blocked by policy.',
    });
  }

  error(
    code: string,
    message: string,
    options?: {
      policyDecision?: AdaptiveTuningPolicyDecision;
      safeReasonCodes?: AdaptiveTuningReasonCode[];
    },
  ): AdaptiveTuningErrorResponse {
    return {
      ok: false,
      error: { code, message },
      policyDecision: options?.policyDecision,
      safeReasonCodes: options?.safeReasonCodes,
      ...PRIVACY_FLAGS,
      generatedAt: generateTimestamp(),
    };
  }

  forbiddenFieldError(fields: string[]): AdaptiveTuningErrorResponse {
    return this.error('forbidden_field', `Forbidden fields detected: ${fields.join(', ')}`, {
      policyDecision: 'blocked_forbidden_raw_field',
      safeReasonCodes: ['forbidden_raw_field_detected'],
    });
  }

  hiddenReasoningError(): AdaptiveTuningErrorResponse {
    return this.error('hidden_reasoning', 'Hidden reasoning fields are not allowed in tuning requests', {
      policyDecision: 'blocked_hidden_reasoning',
      safeReasonCodes: ['hidden_reasoning_detected'],
    });
  }

  protectedAnswerError(): AdaptiveTuningErrorResponse {
    return this.error('protected_answer', 'Protected answer fields are not allowed in tuning requests', {
      policyDecision: 'blocked_answer_key',
      safeReasonCodes: ['protected_answer_field_detected'],
    });
  }
}

export const adaptiveRecommendationTuningResponseBuilder = new AdaptiveRecommendationTuningResponseBuilder();
