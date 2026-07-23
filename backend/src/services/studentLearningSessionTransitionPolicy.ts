import type {
  StudentLearningSessionStatus,
  StudentLearningSessionStage,
  StudentLearningSessionMode,
  StudentLearningSessionTransitionType,
  StudentLearningSessionTransitionResult,
  StudentLearningSessionPolicyDecision,
  StudentLearningSessionReasonCode,
  StudentLearningSessionSourceTruthStatus,
} from '../contracts/studentLearningSessionContracts';
import {
  STUDENT_LEARNING_SESSION_TRANSITION_TYPES,
} from '../contracts/studentLearningSessionContracts';
import {
  canTransitionSession,
  transitionSessionState,
  buildBlockedTransitionResult,
} from './studentLearningSessionStateMachine';

const BLOCKED_SOURCE_TRUTH_STATUSES: StudentLearningSessionSourceTruthStatus[] = [
  'source_required', 'content_gap', 'blocked', 'insufficient',
];

export class StudentLearningSessionTransitionPolicy {
  evaluateSessionTransition(
    currentStatus: StudentLearningSessionStatus,
    currentStage: StudentLearningSessionStage,
    currentMode: StudentLearningSessionMode,
    transitionType: StudentLearningSessionTransitionType,
    requestedMode: StudentLearningSessionMode | undefined,
    sourceTruthStatus: StudentLearningSessionSourceTruthStatus,
    safeguardingBoundary: boolean,
    deenBoundary: boolean,
    challengeReady: boolean,
    remediationNeeded: boolean,
  ): StudentLearningSessionTransitionResult {
    if (safeguardingBoundary) {
      return buildBlockedTransitionResult(
        currentMode,
        currentMode,
        transitionType,
        'blocked_safeguarding_boundary',
        ['safeguarding_boundary_applied'],
      );
    }

    if (deenBoundary) {
      return buildBlockedTransitionResult(
        currentMode,
        currentMode,
        transitionType,
        'blocked_deen_referral',
        ['deen_referral_required'],
      );
    }

    if (BLOCKED_SOURCE_TRUTH_STATUSES.includes(sourceTruthStatus)) {
      const policyDecision: StudentLearningSessionPolicyDecision =
        sourceTruthStatus === 'source_required' ? 'blocked_source_required' : 'blocked_content_gap';
      const reasonCodes: StudentLearningSessionReasonCode[] =
        sourceTruthStatus === 'source_required' ? ['source_required'] : ['content_gap'];
      return buildBlockedTransitionResult(
        currentMode,
        currentMode,
        transitionType,
        policyDecision,
        reasonCodes,
      );
    }

    const basicResult = transitionSessionState(currentStatus, currentStage, currentMode, transitionType, requestedMode);

    if (!basicResult.allowed) {
      return basicResult;
    }

    if (transitionType === 'enter_challenge' && !challengeReady) {
      return buildBlockedTransitionResult(
        currentMode,
        'challenge',
        transitionType,
        'blocked_invalid_transition',
        ['invalid_transition'],
      );
    }

    if (transitionType === 'enter_remediation' && !remediationNeeded) {
      return buildBlockedTransitionResult(
        currentMode,
        'remediation',
        transitionType,
        'blocked_invalid_transition',
        ['invalid_transition'],
      );
    }

    return basicResult;
  }

  getAllowedTransitions(
    currentStatus: StudentLearningSessionStatus,
    currentStage: StudentLearningSessionStage,
    currentMode: StudentLearningSessionMode,
    sourceTruthStatus: StudentLearningSessionSourceTruthStatus,
    safeguardingBoundary: boolean,
    deenBoundary: boolean,
  ): StudentLearningSessionTransitionType[] {
    const allowed: StudentLearningSessionTransitionType[] = [];

    for (const tt of STUDENT_LEARNING_SESSION_TRANSITION_TYPES) {
      if (!canTransitionSession(currentStatus, currentStage, currentMode, tt)) continue;
      if (safeguardingBoundary) continue;
      if (deenBoundary) continue;
      if (BLOCKED_SOURCE_TRUTH_STATUSES.includes(sourceTruthStatus)) continue;
      allowed.push(tt);
    }

    return allowed;
  }

  getBlockedTransitions(
    currentStatus: StudentLearningSessionStatus,
    currentStage: StudentLearningSessionStage,
    currentMode: StudentLearningSessionMode,
    sourceTruthStatus: StudentLearningSessionSourceTruthStatus,
    safeguardingBoundary: boolean,
    deenBoundary: boolean,
  ): StudentLearningSessionTransitionType[] {
    const allowed = this.getAllowedTransitions(currentStatus, currentStage, currentMode, sourceTruthStatus, safeguardingBoundary, deenBoundary);
    return STUDENT_LEARNING_SESSION_TRANSITION_TYPES.filter(tt => !allowed.includes(tt));
  }

  assertTransitionAllowed(
    currentStatus: StudentLearningSessionStatus,
    currentStage: StudentLearningSessionStage,
    currentMode: StudentLearningSessionMode,
    transitionType: StudentLearningSessionTransitionType,
    requestedMode: StudentLearningSessionMode | undefined,
    sourceTruthStatus: StudentLearningSessionSourceTruthStatus,
    safeguardingBoundary: boolean,
    deenBoundary: boolean,
    challengeReady: boolean,
    remediationNeeded: boolean,
  ): void {
    const result = this.evaluateSessionTransition(
      currentStatus, currentStage, currentMode, transitionType, requestedMode,
      sourceTruthStatus, safeguardingBoundary, deenBoundary,
      challengeReady, remediationNeeded,
    );
    if (!result.allowed) {
      throw new Error(
        `Session transition blocked: status=${currentStatus}, stage=${currentStage}, mode=${currentMode}, ` +
        `transition=${transitionType}, policy=${result.policyDecision}`,
      );
    }
  }

  buildTransitionReasonCodes(
    currentStatus: StudentLearningSessionStatus,
    currentStage: StudentLearningSessionStage,
    currentMode: StudentLearningSessionMode,
    transitionType: StudentLearningSessionTransitionType,
    sourceTruthStatus: StudentLearningSessionSourceTruthStatus,
    safeguardingBoundary: boolean,
    deenBoundary: boolean,
    challengeReady: boolean,
    remediationNeeded: boolean,
  ): StudentLearningSessionReasonCode[] {
    const codes: StudentLearningSessionReasonCode[] = [];

    if (safeguardingBoundary) {
      codes.push('safeguarding_boundary_applied');
    }
    if (deenBoundary) {
      codes.push('deen_referral_required');
    }
    if (sourceTruthStatus === 'source_required') {
      codes.push('source_required');
    }
    if (sourceTruthStatus === 'content_gap') {
      codes.push('content_gap');
    }
    if (transitionType === 'enter_challenge' && !challengeReady) {
      codes.push('invalid_transition');
    }
    if (transitionType === 'enter_remediation' && !remediationNeeded) {
      codes.push('invalid_transition');
    }

    return codes;
  }

  buildSafeTransitionAlternatives(
    currentStatus: StudentLearningSessionStatus,
    currentStage: StudentLearningSessionStage,
    currentMode: StudentLearningSessionMode,
    transitionType: StudentLearningSessionTransitionType,
    sourceTruthStatus: StudentLearningSessionSourceTruthStatus,
    safeguardingBoundary: boolean,
    deenBoundary: boolean,
  ): StudentLearningSessionTransitionType[] {
    const blockedPolicyResult = this.evaluateSessionTransition(
      currentStatus, currentStage, currentMode, transitionType, undefined,
      sourceTruthStatus, safeguardingBoundary, deenBoundary,
      false, false,
    );

    if (blockedPolicyResult.allowed) return [];

    const allTransitions = this.getAllowedTransitions(
      currentStatus, currentStage, currentMode,
      sourceTruthStatus, safeguardingBoundary, deenBoundary,
    );

    return allTransitions.filter(t => t !== transitionType);
  }
}
