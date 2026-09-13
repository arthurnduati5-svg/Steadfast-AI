import { SourceTruthSummary } from './whyThisNextContracts';

export interface SourceTruthConfig {
  realEvidenceCount: number;
  nonRealEvidenceCount: number;
  unknownEvidenceCount: number;
  staleEvidenceCount: number;
  hasRealDataSources: boolean;
}

export function buildSourceTruthSummary(config: SourceTruthConfig): SourceTruthSummary {
  const realEvidenceCount = Math.max(0, config.realEvidenceCount);
  const nonRealEvidenceCount = Math.max(0, config.nonRealEvidenceCount);
  const unknownEvidenceCount = Math.max(0, config.unknownEvidenceCount);
  const staleEvidenceCount = Math.max(0, config.staleEvidenceCount);

  const totalKnown = realEvidenceCount + nonRealEvidenceCount + unknownEvidenceCount;

  let explanationConfidence: SourceTruthSummary['explanationConfidence'];

  if (totalKnown === 0) {
    explanationConfidence = 'low';
  } else if (!config.hasRealDataSources || realEvidenceCount === 0) {
    explanationConfidence = 'low';
  } else if (nonRealEvidenceCount > realEvidenceCount) {
    explanationConfidence = 'low';
  } else if (staleEvidenceCount > realEvidenceCount * 0.5) {
    explanationConfidence = 'medium';
  } else if (unknownEvidenceCount > realEvidenceCount * 0.5) {
    explanationConfidence = 'medium';
  } else if (realEvidenceCount >= 2) {
    explanationConfidence = 'high';
  } else {
    explanationConfidence = 'medium';
  }

  return {
    realEvidenceCount,
    nonRealEvidenceCount,
    unknownEvidenceCount,
    staleEvidenceCount,
    explanationConfidence,
  };
}

export function canSupportRealClaim(summary: SourceTruthSummary): boolean {
  return summary.realEvidenceCount > 0 && summary.nonRealEvidenceCount === 0 && summary.unknownEvidenceCount === 0;
}

export function hasOnlyNonRealEvidence(summary: SourceTruthSummary): boolean {
  return summary.realEvidenceCount === 0 && (summary.nonRealEvidenceCount > 0 || summary.unknownEvidenceCount > 0);
}

export function sourceTruthToConfidenceLabel(summary: SourceTruthSummary): string {
  switch (summary.explanationConfidence) {
    case 'high':
      return 'based on strong learning evidence';
    case 'medium':
      return 'based on available evidence';
    case 'low':
      return 'based on limited evidence';
  }
}

export function buildEvidenceCountText(summary: SourceTruthSummary): string {
  const parts: string[] = [];
  if (summary.realEvidenceCount > 0) {
    parts.push(`${summary.realEvidenceCount} confirmed learning signal${summary.realEvidenceCount !== 1 ? 's' : ''}`);
  }
  if (summary.nonRealEvidenceCount > 0) {
    parts.push(`${summary.nonRealEvidenceCount} practice attempt${summary.nonRealEvidenceCount !== 1 ? 's' : ''}`);
  }
  if (parts.length === 0) {
    return 'No learning evidence yet';
  }
  return parts.join(', ');
}
