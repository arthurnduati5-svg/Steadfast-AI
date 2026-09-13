import type {
  AdaptiveChallengeResponse,
  AdaptiveChallengeErrorResponse,
  AdaptiveChallengePolicyDecision,
  AdaptiveChallengeType,
  AdaptiveChallengeReadinessLevel,
  AdaptiveChallengeDifficultyBand,
  AdaptiveChallengeSourceTruthStatus,
  AdaptiveChallengeConfidenceBucket,
} from '../contracts/adaptiveChallengeContracts';

function nowISO(): string {
  return new Date().toISOString();
}

export function buildChallengeResponse(params: {
  data?: unknown;
  safeReasonCodes?: string[];
  policyDecision?: AdaptiveChallengePolicyDecision;
  challengeType?: AdaptiveChallengeType;
  readinessLevel?: AdaptiveChallengeReadinessLevel;
  difficultyBand?: AdaptiveChallengeDifficultyBand;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
  message?: string;
}): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'challenge_ready',
    data: params.data,
    safeReasonCodes: params.safeReasonCodes || [],
    policyDecision: params.policyDecision || 'allowed',
    challengeType: params.challengeType,
    readinessLevel: params.readinessLevel,
    difficultyBand: params.difficultyBand,
    sourceTruthStatus: params.sourceTruthStatus,
    confidenceBucket: params.confidenceBucket,
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildRemediationResponse(params: {
  data?: unknown;
  safeReasonCodes?: string[];
  policyDecision?: AdaptiveChallengePolicyDecision;
  readinessLevel?: AdaptiveChallengeReadinessLevel;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
  message?: string;
}): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'remediation',
    data: params.data,
    safeReasonCodes: params.safeReasonCodes || [],
    policyDecision: params.policyDecision || 'allowed_as_remediation',
    readinessLevel: params.readinessLevel,
    sourceTruthStatus: params.sourceTruthStatus || 'insufficient',
    confidenceBucket: params.confidenceBucket || 'not_enough_evidence',
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildReadinessResponse(params: {
  readinessLevel?: AdaptiveChallengeReadinessLevel;
  safeReasonCodes?: string[];
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
  sourceTruthStatus?: AdaptiveChallengeSourceTruthStatus;
  message?: string;
}): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'readiness_evaluated',
    safeReasonCodes: params.safeReasonCodes || [],
    readinessLevel: params.readinessLevel,
    confidenceBucket: params.confidenceBucket,
    sourceTruthStatus: params.sourceTruthStatus,
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildDifficultyResponse(params: {
  difficultyBand?: AdaptiveChallengeDifficultyBand;
  safeReasonCodes?: string[];
  confidenceBucket?: AdaptiveChallengeConfidenceBucket;
}): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'difficulty_calibrated',
    safeReasonCodes: params.safeReasonCodes || [],
    difficultyBand: params.difficultyBand,
    confidenceBucket: params.confidenceBucket,
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildEmptyResponse(message?: string): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'insufficient',
    safeReasonCodes: ['not_enough_real_evidence_for_challenge'],
    readinessLevel: 'ready_for_foundation',
    confidenceBucket: 'not_enough_evidence',
    sourceTruthStatus: 'insufficient',
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildInsufficientEvidenceResponse(): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'insufficient',
    safeReasonCodes: ['not_enough_real_evidence_for_challenge'],
    readinessLevel: 'ready_for_foundation',
    confidenceBucket: 'not_enough_evidence',
    sourceTruthStatus: 'insufficient',
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildContentGapResponse(): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'content_gap',
    safeReasonCodes: ['content_gap_cannot_invent_challenge_content'],
    sourceTruthStatus: 'content_gap',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildSourceRequiredResponse(): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'source_required',
    safeReasonCodes: ['source_required_for_challenge_generation'],
    sourceTruthStatus: 'source_required',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildDeenReferralResponse(): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'deen_referral',
    safeReasonCodes: ['deen_referral_required'],
    sourceTruthStatus: 'source_required',
    policyDecision: 'blocked_deen_referral',
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildSafeguardingBoundaryResponse(): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'safeguarding_boundary',
    safeReasonCodes: ['safeguarding_boundary_applied'],
    sourceTruthStatus: 'blocked',
    policyDecision: 'blocked_safeguarding_boundary',
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildBlockedNotReadyResponse(message?: string): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'blocked',
    safeReasonCodes: ['not_ready_for_challenge'],
    readinessLevel: 'not_ready',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildProtectedAnswerBlockedResponse(): AdaptiveChallengeResponse {
  return {
    ok: true,
    status: 'blocked',
    safeReasonCodes: ['protected_answer_field_detected'],
    policyDecision: 'blocked_answer_key',
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}

export function buildErrorResponse(
  policyDecision: AdaptiveChallengePolicyDecision,
  safeReasonCodes: string[],
): AdaptiveChallengeErrorResponse {
  return {
    ok: false,
    status: 'error',
    policyDecision,
    safeReasonCodes,
    generatedAt: nowISO(),
    rawPrivateDataIncluded: false,
    hiddenReasoningIncluded: false,
    teacherOnlyDataIncluded: false,
    answerKeyIncluded: false,
    modelAnswerIncluded: false,
    markingSchemeIncluded: false,
    correctAnswerIncluded: false,
    safeguardingRawDetailIncluded: false,
    deenSensitivePrivateTextIncluded: false,
  };
}
