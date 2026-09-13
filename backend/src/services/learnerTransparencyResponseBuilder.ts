import type {
  LearnerTransparencyResponse,
  LearnerTransparencyErrorResponse,
  LearnerTransparencyPacket,
  LearnerTransparencySurface,
  LearnerTransparencyStatus,
  LearnerTransparencySourceTruthStatus,
  LearnerTransparencyConfidenceBucket,
  LearnerTransparencyPolicyDecision,
  LearnerTransparencyReasonCode,
  LearnerTransparencyNextStepType,
  LearnerAgencyOptionType,
} from '../contracts/learnerTransparencyContracts';

type PrivacyFlags = {
  rawPrivateDataIncluded: false;
  hiddenReasoningIncluded: false;
  teacherOnlyDataIncluded: false;
  answerKeyIncluded: false;
  modelAnswerIncluded: false;
  markingSchemeIncluded: false;
  correctAnswerIncluded: false;
  safeguardingRawDetailIncluded: false;
  deenSensitivePrivateTextIncluded: false;
};

const FALSE_PRIVACY_FLAGS: PrivacyFlags = {
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

export function generateGeneratedAt(): string {
  return new Date().toISOString();
}

export function buildSuccessResponse(params: {
  surface: LearnerTransparencySurface;
  packet: LearnerTransparencyPacket;
}): LearnerTransparencyResponse {
  return {
    ok: true,
    status: 'ok',
    surface: params.surface,
    data: params.packet,
    safeReasonCodes: params.packet.safeReasonCodes,
    sourceTruthStatus: params.packet.sourceTruthStatus,
    confidenceBucket: params.packet.confidenceBucket,
    generatedAt: generateGeneratedAt(),
    ...FALSE_PRIVACY_FLAGS,
  };
}

export function buildEmptyResponse(surface: LearnerTransparencySurface): LearnerTransparencyResponse {
  return {
    ok: true,
    status: 'empty',
    surface,
    safeReasonCodes: ['no_safe_learning_evidence_yet'],
    sourceTruthStatus: 'insufficient',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: generateGeneratedAt(),
    ...FALSE_PRIVACY_FLAGS,
  };
}

export function buildInsufficientEvidenceResponse(surface: LearnerTransparencySurface): LearnerTransparencyResponse {
  return {
    ok: true,
    status: 'insufficient',
    surface,
    safeReasonCodes: ['no_real_learning_evidence_yet'],
    sourceTruthStatus: 'insufficient',
    confidenceBucket: 'not_enough_evidence',
    generatedAt: generateGeneratedAt(),
    ...FALSE_PRIVACY_FLAGS,
  };
}

export function buildContentGapResponse(surface: LearnerTransparencySurface): LearnerTransparencyResponse {
  return {
    ok: true,
    status: 'content_gap',
    surface,
    safeReasonCodes: ['content_gap_no_curriculum_context'],
    sourceTruthStatus: 'content_gap',
    confidenceBucket: 'blocked',
    generatedAt: generateGeneratedAt(),
    ...FALSE_PRIVACY_FLAGS,
  };
}

export function buildSourceRequiredResponse(surface: LearnerTransparencySurface): LearnerTransparencyResponse {
  return {
    ok: true,
    status: 'source_required',
    surface,
    safeReasonCodes: ['content_gap_no_curriculum_context'],
    sourceTruthStatus: 'source_required',
    confidenceBucket: 'blocked',
    generatedAt: generateGeneratedAt(),
    ...FALSE_PRIVACY_FLAGS,
  };
}

export function buildDeenReferralResponse(surface: LearnerTransparencySurface): LearnerTransparencyResponse {
  return {
    ok: true,
    status: 'deen_referral',
    surface,
    safeReasonCodes: ['deen_referral_required'],
    sourceTruthStatus: 'source_required',
    confidenceBucket: 'blocked',
    generatedAt: generateGeneratedAt(),
    ...FALSE_PRIVACY_FLAGS,
  };
}

export function buildSafeguardingBoundaryResponse(surface: LearnerTransparencySurface): LearnerTransparencyResponse {
  return {
    ok: true,
    status: 'safeguarding_boundary',
    surface,
    safeReasonCodes: ['safeguarding_boundary_applied'],
    sourceTruthStatus: 'blocked',
    confidenceBucket: 'blocked',
    generatedAt: generateGeneratedAt(),
    ...FALSE_PRIVACY_FLAGS,
  };
}

export function buildBlockedResponse(params: {
  surface: LearnerTransparencySurface;
  policyDecision: LearnerTransparencyPolicyDecision;
  safeReasonCodes: LearnerTransparencyReasonCode[];
}): LearnerTransparencyResponse {
  return {
    ok: true,
    status: 'blocked',
    surface: params.surface,
    safeReasonCodes: params.safeReasonCodes,
    sourceTruthStatus: 'blocked',
    confidenceBucket: 'blocked',
    generatedAt: generateGeneratedAt(),
    ...FALSE_PRIVACY_FLAGS,
  };
}

export function buildErrorResponse(params: {
  policyDecision: LearnerTransparencyPolicyDecision;
  safeReasonCodes: LearnerTransparencyReasonCode[];
}): LearnerTransparencyErrorResponse {
  return {
    ok: false,
    status: 'blocked',
    policyDecision: params.policyDecision,
    safeReasonCodes: params.safeReasonCodes,
    generatedAt: generateGeneratedAt(),
    ...FALSE_PRIVACY_FLAGS,
  };
}
