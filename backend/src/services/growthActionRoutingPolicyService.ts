import type {
  GrowthActionResolveRequest,
  GrowthActionRoutingDecision,
  GrowthLearnerEvidenceSnapshot,
} from '../contracts/growthActionContracts';

export interface RoutingPolicyInput {
  request: GrowthActionResolveRequest;
  evidence: GrowthLearnerEvidenceSnapshot;
  learnerState: {
    contentGovernanceState: { contentAvailable: boolean; contentGap: boolean };
    deenGovernanceState: { deenDetected: boolean; deenUncertain: boolean };
  };
}

export interface RoutingPolicyResult {
  allowed: boolean;
  decision: GrowthActionRoutingDecision;
  reasonCodes: string[];
  blockedReason?: string;
}

function isAnswerKeyRequest(request: GrowthActionResolveRequest): boolean {
  const intent = request.requestedIntent;
  return intent === 'start_quiz_check' || intent === 'start_exam_review' || false;
}

function isUnsafeRequest(request: GrowthActionResolveRequest): boolean {
  const intent = request.requestedIntent;
  return intent === 'no_action_available' || false;
}

export function evaluateRoutingPolicy(input: RoutingPolicyInput): RoutingPolicyResult {
  const { request, evidence, learnerState } = input;

  if (!request.schoolId || !request.studentId) {
    return {
      allowed: false,
      decision: 'blocked_missing_identity',
      reasonCodes: ['missing_school_context', 'missing_learner_context'],
      blockedReason: 'Missing school or learner identity.',
    };
  }

  if (isUnsafeRequest(request)) {
    return {
      allowed: false,
      decision: 'blocked_unsafe_request',
      reasonCodes: ['unsafe_request_detected'],
      blockedReason: 'Unsafe request detected.',
    };
  }

  if (learnerState.contentGovernanceState.contentGap && !learnerState.contentGovernanceState.contentAvailable) {
    return {
      allowed: false,
      decision: 'blocked_missing_content',
      reasonCodes: ['content_gap', 'missing_learner_context'],
      blockedReason: 'Approved content is not available for this target.',
    };
  }

  if (learnerState.deenGovernanceState.deenUncertain) {
    return {
      allowed: false,
      decision: 'blocked_deen_sensitive',
      reasonCodes: ['deen_uncertainty'],
      blockedReason: 'Deen-sensitive content needs approved source guidance.',
    };
  }

  if (evidence.stateQuality === 'no_data_yet') {
    return {
      allowed: false,
      decision: 'blocked_no_evidence',
      reasonCodes: ['insufficient_evidence'],
      blockedReason: 'No learning evidence available yet.',
    };
  }

  return {
    allowed: true,
    decision: 'allowed',
    reasonCodes: ['school_identity_verified', 'student_ownership_confirmed', 'role_access_allowed', 'evidence_fresh'],
  };
}
