import type {
  AdaptiveChallengeMasteryBucket,
  AdaptiveChallengeConfidenceBucket,
  AdaptiveChallengeSourceTruthStatus,
  AdaptiveChallengeReadinessLevel,
  AdaptiveChallengeType,
} from '../contracts/adaptiveChallengeContracts';

export interface FakeReadinessDetectionInput {
  learnerRequestedChallenge: boolean;
  tooEasyFeedbackCount: number;
  independentSuccessCount: number;
  masteryBucket: AdaptiveChallengeMasteryBucket;
  confidenceBucket: AdaptiveChallengeConfidenceBucket;
  sourceTruthStatus: AdaptiveChallengeSourceTruthStatus;
  prerequisiteStatus: string;
  repeatedMistakeCount: number;
  hintDependencyLevel: number;
}

export interface FakeReadinessDetectionResult {
  hasFakeReadinessRisk: boolean;
  riskFlags: string[];
  safeAlternative: AdaptiveChallengeType;
  safeReasonCodes: string[];
  safeReadinessLevel: AdaptiveChallengeReadinessLevel;
}

export class NoFakeChallengeReadinessGuard {
  detectFakeChallengeReadinessRisk(input: FakeReadinessDetectionInput): FakeReadinessDetectionResult {
    const riskFlags: string[] = [];
    const reasonCodes: string[] = [];

    if (input.learnerRequestedChallenge && input.masteryBucket === 'not_started') {
      riskFlags.push('learner_requested_challenge_without_evidence');
      reasonCodes.push('learner_requested_challenge_without_evidence');
    }

    if (input.tooEasyFeedbackCount > 0 && !['secure', 'strong'].includes(input.masteryBucket)) {
      riskFlags.push('too_easy_feedback_without_mastery');
      reasonCodes.push('too_easy_feedback_without_mastery');
    }

    if (input.independentSuccessCount <= 1 && ['secure', 'strong'].includes(input.masteryBucket)) {
      riskFlags.push('single_success_claimed_as_mastery');
      reasonCodes.push('single_success_claimed_as_mastery');
    }

    if (input.confidenceBucket === 'high' && input.independentSuccessCount < 2) {
      riskFlags.push('confidence_high_but_evidence_weak');
      reasonCodes.push('confidence_high_but_evidence_weak');
    }

    if (['demo', 'fallback', 'synthetic_test'].includes(input.sourceTruthStatus)) {
      riskFlags.push(`${input.sourceTruthStatus}_evidence_claimed_as_real`);
      reasonCodes.push('non_real_evidence_cannot_support_real_challenge_readiness');
    }

    if (input.prerequisiteStatus === 'missing' || input.prerequisiteStatus === 'blocked') {
      riskFlags.push('missing_prerequisite_ignored');
      reasonCodes.push('missing_prerequisite_detected');
    }

    if (input.repeatedMistakeCount > 1) {
      riskFlags.push('repeated_mistake_ignored');
      reasonCodes.push('repeated_mistakes_detected');
    }

    if (input.hintDependencyLevel > 2) {
      riskFlags.push('hint_dependency_ignored');
      reasonCodes.push('high_hint_dependency_detected');
    }

    const hasFakeReadinessRisk = riskFlags.length > 0;

    if (!hasFakeReadinessRisk) {
      return {
        hasFakeReadinessRisk: false,
        riskFlags: [],
        safeAlternative: 'standard_challenge',
        safeReasonCodes: ['no_fake_readiness_detected'],
        safeReadinessLevel: 'ready_for_standard_challenge',
      };
    }

    const hasMissedPrereq = reasonCodes.includes('missing_prerequisite_detected');
    const hasRepeatedMistakes = reasonCodes.includes('repeated_mistakes_detected');
    const hasHighHintDep = reasonCodes.includes('high_hint_dependency_detected');
    const hasNonRealEvidence = riskFlags.some(r => r.includes('evidence_claimed_as_real'));

    let safeAlternative: AdaptiveChallengeType = 'similar_practice';
    let safeReadinessLevel: AdaptiveChallengeReadinessLevel = 'ready_for_similar_practice';

    if (hasMissedPrereq) {
      safeAlternative = 'prerequisite_review';
      safeReadinessLevel = 'ready_for_foundation';
    } else if (hasNonRealEvidence) {
      safeAlternative = 'foundation_remediation';
      safeReadinessLevel = 'ready_for_foundation';
    } else if (hasRepeatedMistakes || hasHighHintDep) {
      safeAlternative = 'similar_practice';
      safeReadinessLevel = 'ready_for_similar_practice';
    } else {
      safeAlternative = 'similar_practice';
      safeReadinessLevel = 'ready_for_similar_practice';
    }

    return {
      hasFakeReadinessRisk,
      riskFlags,
      safeAlternative,
      safeReasonCodes: reasonCodes,
      safeReadinessLevel,
    };
  }
}

export const noFakeChallengeReadinessGuard = new NoFakeChallengeReadinessGuard();
