// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learner Transparency Source Truth Policy v1
// Evaluates evidence source truth and determines whether the
// available evidence can support progress narratives,
// explanations, evidence cards, and agency options for a
// learner transparency surface.
// ─────────────────────────────────────────────────────────────

import type {
  LearnerTransparencySourceTruthResult,
  LearnerTransparencySourceTruthStatus,
  LearnerTransparencyConfidenceBucket,
  LearnerTransparencyStatus,
  LearnerTransparencyReasonCode,
} from '../contracts/learnerTransparencyContracts';

// ═══════════════════════════════════════════════════════════════
// Source truth evaluation
// ═══════════════════════════════════════════════════════════════

export function evaluateLearnerTransparencySourceTruth(evidence: {
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  realEvidenceCount: number;
  nonRealEvidenceCount: number;
  unknownEvidenceCount: number;
  staleEvidenceCount: number;
  hasContentGap: boolean;
  hasDeenReferral: boolean;
  hasSafeguardingBoundary: boolean;
  hasAnswerKeyEvent: boolean;
  hasModelAnswerEvent: boolean;
  hasMarkingSchemeEvent: boolean;
  hasCorrectAnswerEvent: boolean;
}): LearnerTransparencySourceTruthResult {
  const {
    sourceTruthStatus,
    realEvidenceCount,
    nonRealEvidenceCount,
    unknownEvidenceCount,
    staleEvidenceCount,
    hasContentGap,
    hasDeenReferral,
    hasSafeguardingBoundary,
    hasAnswerKeyEvent,
    hasModelAnswerEvent,
    hasMarkingSchemeEvent,
    hasCorrectAnswerEvent,
  } = evidence;

  if (hasDeenReferral) {
    return _result('source_required', 'blocked', 'deen_referral', ['deen_referral_required'], false, false, false, false);
  }

  if (hasSafeguardingBoundary) {
    return _result('blocked', 'blocked', 'safeguarding_boundary', ['safeguarding_boundary_applied'], false, false, false, false);
  }

  if (hasAnswerKeyEvent || hasModelAnswerEvent || hasMarkingSchemeEvent || hasCorrectAnswerEvent) {
    return _result('blocked', 'blocked', 'blocked', ['blocked_by_source_truth_policy'], false, false, false, false);
  }

  if (hasContentGap) {
    return _result('content_gap', 'not_enough_evidence', 'content_gap', ['content_gap_no_curriculum_context'], false, false, false, false);
  }

  if (sourceTruthStatus === 'real' && realEvidenceCount >= 3) {
    return _result('real', 'high', 'ok', [], true, true, true, true);
  }

  if (sourceTruthStatus === 'real' && realEvidenceCount >= 1) {
    return _result('real', 'medium', 'ok', [], true, true, true, true);
  }

  if (sourceTruthStatus === 'expired') {
    return _result('expired', 'blocked', 'blocked', ['blocked_by_source_truth_policy'], false, false, false, false);
  }

  if (sourceTruthStatus === 'mixed' && realEvidenceCount > 0 && nonRealEvidenceCount > 0) {
    return _result('mixed', 'mixed', 'ok', ['mixed_evidence_uncertainty'], true, true, true, true);
  }

  if (sourceTruthStatus === 'demo') {
    return _result('demo', 'not_enough_evidence', 'insufficient', ['demo_evidence_no_real_progress_claim'], false, false, false, false);
  }

  if (sourceTruthStatus === 'fallback') {
    return _result('fallback', 'not_enough_evidence', 'insufficient', ['fallback_evidence_no_real_progress_claim'], false, false, false, false);
  }

  if (sourceTruthStatus === 'synthetic_test') {
    return _result('synthetic_test', 'not_enough_evidence', 'insufficient', ['synthetic_evidence_no_real_progress_claim'], false, false, false, false);
  }

  if (sourceTruthStatus === 'unknown') {
    return _result('unknown', 'low', 'insufficient', ['insufficient_evidence_for_narrative'], false, false, false, false);
  }

  if (sourceTruthStatus === 'stale' && staleEvidenceCount > 0 && realEvidenceCount === 0 && nonRealEvidenceCount === 0 && unknownEvidenceCount === 0) {
    return _result('stale', 'low', 'insufficient', ['stale_evidence_low_confidence'], false, false, false, false);
  }

  if (realEvidenceCount === 0 && nonRealEvidenceCount > 0) {
    return _result('insufficient', 'not_enough_evidence', 'insufficient', ['insufficient_evidence_for_narrative'], false, false, false, false);
  }

  if (realEvidenceCount === 0 && nonRealEvidenceCount === 0 && unknownEvidenceCount === 0 && staleEvidenceCount === 0) {
    return _result('insufficient', 'not_enough_evidence', 'empty', ['no_safe_learning_evidence_yet'], false, false, false, false);
  }

  return _result('insufficient', 'not_enough_evidence', 'insufficient', ['insufficient_evidence_for_narrative'], false, false, false, false);
}

// ═══════════════════════════════════════════════════════════════
// Assertions
// ═══════════════════════════════════════════════════════════════

export function assertSourceTruthCanSupportNarrative(result: LearnerTransparencySourceTruthResult): void {
  if (!result.canSupportNarrative) {
    throw new Error(
      `Source truth cannot support a progress narrative. Status "${result.sourceTruthStatus}" (bucket "${result.confidenceBucket}"). ${_describeCodes(result.safeReasonCodes)}`,
    );
  }
}

export function assertSourceTruthCanSupportExplanation(result: LearnerTransparencySourceTruthResult): void {
  if (!result.canSupportExplanation) {
    throw new Error(
      `Source truth cannot support an explanation. Status "${result.sourceTruthStatus}" (bucket "${result.confidenceBucket}"). ${_describeCodes(result.safeReasonCodes)}`,
    );
  }
}

export function assertSourceTruthCanSupportEvidenceCard(result: LearnerTransparencySourceTruthResult): void {
  if (!result.canSupportEvidenceCard) {
    throw new Error(
      `Source truth cannot support an evidence card. Status "${result.sourceTruthStatus}" (bucket "${result.confidenceBucket}"). ${_describeCodes(result.safeReasonCodes)}`,
    );
  }
}

export function assertSourceTruthCanSupportAgencyOptions(result: LearnerTransparencySourceTruthResult): void {
  if (!result.canSupportAgencyOptions) {
    throw new Error(
      `Source truth cannot support agency options. Status "${result.sourceTruthStatus}" (bucket "${result.confidenceBucket}"). ${_describeCodes(result.safeReasonCodes)}`,
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// Internal helpers
// ═══════════════════════════════════════════════════════════════

function _result(
  sourceTruthStatus: LearnerTransparencySourceTruthStatus,
  confidenceBucket: LearnerTransparencyConfidenceBucket,
  transparencyStatus: LearnerTransparencyStatus,
  safeReasonCodes: LearnerTransparencyReasonCode[],
  canSupportNarrative: boolean,
  canSupportExplanation: boolean,
  canSupportEvidenceCard: boolean,
  canSupportAgencyOptions: boolean,
): LearnerTransparencySourceTruthResult {
  return {
    sourceTruthStatus,
    confidenceBucket,
    transparencyStatus,
    safeReasonCodes,
    canSupportNarrative,
    canSupportExplanation,
    canSupportEvidenceCard,
    canSupportAgencyOptions,
  };
}

function _describeCodes(codes: LearnerTransparencyReasonCode[]): string {
  return codes.length > 0 ? `Reason codes: ${codes.join(', ')}` : 'No reason codes.';
}
