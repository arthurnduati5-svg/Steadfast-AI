import type {
  StudentLearningSessionSourceTruthStatus,
  StudentLearningSessionConfidenceBucket,
  StudentLearningSessionPolicyDecision,
  StudentLearningSessionReasonCode,
} from '../contracts/studentLearningSessionContracts';

export class StudentLearningSessionSourceTruthPolicy {
  evaluateSourceTruthStatus(
    status: StudentLearningSessionSourceTruthStatus,
  ): {
    canSupportContentSpecificState: boolean;
    confidenceBucket: StudentLearningSessionConfidenceBucket;
    policyDecision: StudentLearningSessionPolicyDecision;
    safeReasonCodes: StudentLearningSessionReasonCode[];
  } {
    switch (status) {
      case 'real':
        return {
          canSupportContentSpecificState: true,
          confidenceBucket: 'high',
          policyDecision: 'allowed',
          safeReasonCodes: ['learner_ownership_verified'],
        };

      case 'mixed':
        return {
          canSupportContentSpecificState: true,
          confidenceBucket: 'medium',
          policyDecision: 'allowed',
          safeReasonCodes: ['learner_ownership_verified'],
        };

      case 'demo':
      case 'fallback':
      case 'synthetic_test':
        return {
          canSupportContentSpecificState: false,
          confidenceBucket: 'low',
          policyDecision: 'allowed',
          safeReasonCodes: ['learner_ownership_verified'],
        };

      case 'unknown':
        return {
          canSupportContentSpecificState: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'allowed',
          safeReasonCodes: ['learner_ownership_verified'],
        };

      case 'stale':
        return {
          canSupportContentSpecificState: false,
          confidenceBucket: 'low',
          policyDecision: 'allowed',
          safeReasonCodes: ['learner_ownership_verified'],
        };

      case 'expired':
        return {
          canSupportContentSpecificState: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'allowed',
          safeReasonCodes: ['learner_ownership_verified'],
        };

      case 'content_gap':
        return {
          canSupportContentSpecificState: false,
          policyDecision: 'blocked_content_gap',
          confidenceBucket: 'blocked',
          safeReasonCodes: ['content_gap'],
        };

      case 'source_required':
        return {
          canSupportContentSpecificState: false,
          policyDecision: 'blocked_source_required',
          confidenceBucket: 'blocked',
          safeReasonCodes: ['source_required'],
        };

      case 'blocked':
        return {
          canSupportContentSpecificState: false,
          policyDecision: 'blocked_source_required',
          confidenceBucket: 'blocked',
          safeReasonCodes: ['source_required'],
        };

      case 'insufficient':
        return {
          canSupportContentSpecificState: false,
          confidenceBucket: 'not_enough_evidence',
          policyDecision: 'allowed',
          safeReasonCodes: ['learner_ownership_verified'],
        };
    }
  }

  assertSourceTruthForContentTransition(
    status: StudentLearningSessionSourceTruthStatus,
  ): void {
    const evaluation = this.evaluateSourceTruthStatus(status);
    if (!evaluation.canSupportContentSpecificState) {
      throw new Error(
        `Cannot transition: source truth status '${status}' cannot support content-specific state (policy: ${evaluation.policyDecision})`,
      );
    }
  }

  isDeenBoundaryActive(
    deenFlag: boolean,
  ): {
    blocked: boolean;
    policyDecision: StudentLearningSessionPolicyDecision;
    safeReasonCodes: StudentLearningSessionReasonCode[];
  } {
    if (deenFlag) {
      return {
        blocked: true,
        policyDecision: 'blocked_deen_referral',
        safeReasonCodes: ['deen_referral_required'],
      };
    }

    return {
      blocked: false,
      policyDecision: 'allowed',
      safeReasonCodes: ['learner_ownership_verified'],
    };
  }

  isSafeguardingBoundaryActive(
    safeguardingFlag: boolean,
  ): {
    blocked: boolean;
    policyDecision: StudentLearningSessionPolicyDecision;
    safeReasonCodes: StudentLearningSessionReasonCode[];
  } {
    if (safeguardingFlag) {
      return {
        blocked: true,
        policyDecision: 'blocked_safeguarding_boundary',
        safeReasonCodes: ['safeguarding_boundary_applied'],
      };
    }

    return {
      blocked: false,
      policyDecision: 'allowed',
      safeReasonCodes: ['learner_ownership_verified'],
    };
  }
}
