import type {
  LearnerTransparencyConfidenceBucket,
  LearnerTransparencySourceTruthStatus,
  LearnerTransparencyReasonCode,
} from '../contracts/learnerTransparencyContracts';

export interface DetermineConfidenceBucketParams {
  realEvidenceCount: number;
  nonRealEvidenceCount: number;
  unknownEvidenceCount: number;
  staleEvidenceCount: number;
  hasContentGap: boolean;
  hasDeenSignal: boolean;
  hasSafeguarding: boolean;
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
}

export function determineConfidenceBucket(
  params: DetermineConfidenceBucketParams,
): LearnerTransparencyConfidenceBucket {
  const {
    realEvidenceCount,
    nonRealEvidenceCount,
    unknownEvidenceCount,
    staleEvidenceCount,
    hasContentGap,
    hasDeenSignal,
    hasSafeguarding,
    sourceTruthStatus,
  } = params;

  const totalEvidence =
    realEvidenceCount + nonRealEvidenceCount + unknownEvidenceCount + staleEvidenceCount;

  if (totalEvidence === 0) {
    return 'not_enough_evidence';
  }

  if (hasContentGap || sourceTruthStatus === 'source_required') {
    return 'blocked';
  }

  if (hasDeenSignal) {
    return 'blocked';
  }

  if (hasSafeguarding) {
    return 'blocked';
  }

  if (realEvidenceCount >= 5 && staleEvidenceCount === 0) {
    return 'high';
  }

  if (realEvidenceCount >= 2) {
    return 'medium';
  }

  if (realEvidenceCount >= 1) {
    return 'low';
  }

  const hasReal = realEvidenceCount > 0;
  const hasNonReal = nonRealEvidenceCount > 0;

  if (hasReal && hasNonReal) {
    return 'mixed';
  }

  if (nonRealEvidenceCount > 0 && realEvidenceCount === 0 && unknownEvidenceCount === 0 && staleEvidenceCount === 0) {
    return 'not_enough_evidence';
  }

  if (unknownEvidenceCount >= realEvidenceCount && unknownEvidenceCount >= nonRealEvidenceCount && unknownEvidenceCount >= staleEvidenceCount) {
    return 'low';
  }

  if (staleEvidenceCount >= realEvidenceCount && staleEvidenceCount >= nonRealEvidenceCount && staleEvidenceCount >= unknownEvidenceCount) {
    return 'low';
  }

  return 'not_enough_evidence';
}

export function buildUncertaintyText(
  bucket: LearnerTransparencyConfidenceBucket,
  safeReasonCodes?: LearnerTransparencyReasonCode[],
): string | undefined {
  if (bucket === 'not_enough_evidence') {
    return 'There is not enough safe learning evidence yet for a confident explanation.';
  }

  if (bucket === 'low') {
    return 'The system has limited evidence, so this explanation may not fully reflect your progress.';
  }

  if (bucket === 'mixed') {
    return 'The evidence is mixed, so this explanation may not be complete.';
  }

  return undefined;
}

export interface DetermineTransparencyStatusParams {
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
  hasContentGap: boolean;
  hasDeenReferral: boolean;
  hasSafeguardingBoundary: boolean;
  hasEvidence: boolean;
}

export function determineTransparencyStatus(
  params: DetermineTransparencyStatusParams,
): 'ok' | 'empty' | 'insufficient' | 'blocked' | 'content_gap' | 'source_required' | 'safeguarding_boundary' | 'deen_referral' {
  const {
    sourceTruthStatus,
    confidenceBucket,
    hasContentGap,
    hasDeenReferral,
    hasSafeguardingBoundary,
    hasEvidence,
  } = params;

  if (hasSafeguardingBoundary) {
    return 'safeguarding_boundary';
  }

  if (hasDeenReferral) {
    return 'deen_referral';
  }

  if (hasContentGap || sourceTruthStatus === 'content_gap') {
    return 'content_gap';
  }

  if (sourceTruthStatus === 'source_required') {
    return 'source_required';
  }

  if (confidenceBucket === 'blocked') {
    return 'blocked';
  }

  if (!hasEvidence) {
    return 'empty';
  }

  if (confidenceBucket === 'not_enough_evidence' || confidenceBucket === 'low' || confidenceBucket === 'mixed') {
    return 'insufficient';
  }

  return 'ok';
}

export function assertNoOverstatedConfidence(
  bucket: LearnerTransparencyConfidenceBucket,
  realEvidenceCount: number,
): void {
  if (bucket === 'high' && realEvidenceCount < 5) {
    throw new Error(
      `Assertion failed: confidence bucket is 'high' but realEvidenceCount is ${realEvidenceCount}. High confidence requires at least 5 real evidence items.`,
    );
  }
}
