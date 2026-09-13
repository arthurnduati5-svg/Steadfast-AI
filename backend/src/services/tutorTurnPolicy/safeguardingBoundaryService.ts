import type { SafetyPolicyResult } from './safetyPolicyContracts';

export interface SafeguardingBoundaryInput {
  requestId: string;
  safety: SafetyPolicyResult;
}

export interface SafeguardingBoundaryResult {
  safeguardingCandidate: boolean;
  shouldContinueNormalTutoring: boolean;
  boundaryReason: string;
  safeStudentMessage?: string;
}

export function evaluateSafeguardingBoundary(input: SafeguardingBoundaryInput): SafeguardingBoundaryResult {
  const { safety } = input;

  if (!safety) {
    return {
      safeguardingCandidate: false,
      shouldContinueNormalTutoring: true,
      boundaryReason: 'no_safety_data',
    };
  }

  if (safety.seriousRisk && safety.safeguardingCandidate) {
    return {
      safeguardingCandidate: true,
      shouldContinueNormalTutoring: false,
      boundaryReason: `serious_risk_${safety.riskCategory}_${safety.riskLevel}`,
      safeStudentMessage: safety.safeStudentMessage || 'I hear you. Please talk to a trusted adult.',
    };
  }

  if (safety.riskCategory === 'normal_learning_frustration') {
    return {
      safeguardingCandidate: false,
      shouldContinueNormalTutoring: true,
      boundaryReason: 'normal_learning_frustration_not_safeguarding',
    };
  }

  return {
    safeguardingCandidate: false,
    shouldContinueNormalTutoring: true,
    boundaryReason: 'no_safeguarding_concern',
  };
}
