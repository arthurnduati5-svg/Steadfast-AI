import type {
  MasteryInflationPolicyResult,
  AdaptiveTuningMasteryInflationRiskBucket,
  AdaptiveTuningReasonCode,
} from '../contracts/adaptiveRecommendationTuningContracts';

export interface MasteryInflationContext {
  feedbackType?: string;
  choiceType?: string;
  masteryEvidenceLevel?: string;
  masteryConfidence?: number;
  realEvidenceExists: boolean;
  demoEvidenceOnly: boolean;
  fallbackEvidenceOnly: boolean;
  syntheticTestEvidenceOnly: boolean;
  singleAttemptEvidence: boolean;
  learnerSaysIKnowIt: boolean;
  recentHintUseCount: number;
  recentRecallEvidenceCount: number;
  recentAttemptCount: number;
  difficultyCalibration?: number;
}

export class NoMasteryInflationPolicyService {
  detectMasteryInflationRisk(context: MasteryInflationContext): MasteryInflationPolicyResult {
    const signals: string[] = [];
    let risk: AdaptiveTuningMasteryInflationRiskBucket = 'none';

    if (context.learnerSaysIKnowIt && !context.realEvidenceExists) {
      signals.push('learner_says_i_know_it_without_evidence');
      risk = 'high';
    }

    if (context.feedbackType === 'too_easy' && !context.realEvidenceExists) {
      signals.push('too_easy_feedback_with_weak_evidence');
      risk = risk === 'none' ? 'elevated' : 'high';
    }

    if (context.feedbackType === 'want_challenge' && context.masteryEvidenceLevel !== 'proficient' && context.masteryEvidenceLevel !== 'mastered') {
      signals.push('challenge_request_with_insufficient_mastery');
      risk = risk === 'none' ? 'elevated' : risk;
    }

    if (context.recentHintUseCount === 0 && context.recentRecallEvidenceCount === 0 && !context.singleAttemptEvidence) {
      signals.push('low_hint_use_but_no_recall_evidence');
      risk = risk === 'none' ? 'low' : risk;
    }

    if (context.masteryConfidence !== undefined && context.masteryConfidence >= 0.8 && context.recentRecallEvidenceCount === 0) {
      signals.push('confidence_high_but_recall_weak');
      risk = risk === 'none' ? 'elevated' : risk;
    }

    if (context.demoEvidenceOnly) {
      signals.push('demo_evidence_claimed_as_real');
      risk = 'high';
    }

    if (context.fallbackEvidenceOnly) {
      signals.push('fallback_evidence_claimed_as_real');
      risk = 'high';
    }

    if (context.syntheticTestEvidenceOnly) {
      signals.push('synthetic_test_evidence_claimed_as_real');
      risk = risk === 'none' ? 'elevated' : 'high';
    }

    if (context.singleAttemptEvidence && context.recentAttemptCount <= 1) {
      signals.push('single_attempt_claimed_as_mastery');
      risk = risk === 'none' ? 'low' : risk;
    }

    const reasonCodes: AdaptiveTuningReasonCode[] = signals.length > 0
      ? ['mastery_inflation_risk_detected']
      : [];

    if (risk === 'high') {
      return {
        decision: 'blocked_mastery_inflation',
        masteryInflationRiskBucket: 'high',
        safeReasonCodes: reasonCodes,
        safeAdjustment: 'Mastery requires safe learning evidence. Preference feedback alone cannot mark a skill as mastered.',
      };
    }

    if (risk === 'elevated') {
      return {
        decision: 'blocked_insufficient_evidence',
        masteryInflationRiskBucket: 'elevated',
        safeReasonCodes: reasonCodes,
        safeAdjustment: 'There is not enough safe learning evidence yet to support a challenge or mastery claim.',
      };
    }

    return {
      decision: 'allowed',
      masteryInflationRiskBucket: risk,
      safeReasonCodes: reasonCodes,
    };
  }

  evaluateMasteryInflationPolicy(context: MasteryInflationContext): MasteryInflationPolicyResult {
    return this.detectMasteryInflationRisk(context);
  }

  assertPreferenceDoesNotCreateMastery(context: MasteryInflationContext): void {
    const result = this.detectMasteryInflationRisk(context);
    if (result.decision !== 'allowed') {
      throw new Error(`Mastery inflation blocked: ${result.safeReasonCodes.join(', ')}`);
    }
  }

  assertTuningDoesNotInflateMastery(result: MasteryInflationPolicyResult): void {
    if (result.decision !== 'allowed') {
      throw new Error(`Tuning would inflate mastery: ${result.safeReasonCodes.join(', ')}`);
    }
  }

  buildMasterySafeAdjustment(result: MasteryInflationPolicyResult): string {
    return result.safeAdjustment || 'Preference feedback can adjust support but cannot create mastery.';
  }
}

export const noMasteryInflationPolicyService = new NoMasteryInflationPolicyService();
