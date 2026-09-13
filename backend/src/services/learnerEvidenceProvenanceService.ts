import type { LearnerEvidenceProvenance } from '../contracts/learnerEvidenceProvenanceContracts';
import type { LearnerDataSourceKind } from '../contracts/learnerDataReliabilityContracts';
import { evaluateDataFreshness } from './dataFreshnessService';
import { MAX_SAFE_SUMMARY_LENGTH } from '../contracts/learnerEvidenceProvenanceContracts';

function hashId(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `h_${Math.abs(hash).toString(36)}`;
}

export function buildLearnerEvidenceProvenance(input: {
  sourceKind: LearnerDataSourceKind;
  sourceId?: string | null;
  studentId?: string | null;
  schoolId?: string | null;
  observedAt?: string | Date | null;
  storedAt?: string | Date | null;
  confidence?: 'high' | 'medium' | 'low' | 'unknown';
  safeSummary: string;
}): LearnerEvidenceProvenance {
  const freshness = evaluateDataFreshness({
    observedAt: input.observedAt,
    storedAt: input.storedAt,
    sourceKind: input.sourceKind,
  });

  const safeSummary = input.safeSummary.length > MAX_SAFE_SUMMARY_LENGTH
    ? input.safeSummary.slice(0, MAX_SAFE_SUMMARY_LENGTH) + '...'
    : input.safeSummary;

  return {
    sourceKind: input.sourceKind,
    sourceIdHash: hashId(input.sourceId),
    studentIdHash: hashId(input.studentId),
    schoolIdHash: hashId(input.schoolId),
    observedAt: input.observedAt ? new Date(input.observedAt).toISOString() : undefined,
    storedAt: input.storedAt ? new Date(input.storedAt).toISOString() : undefined,
    freshness,
    confidence: input.confidence ?? 'unknown',
    safeSummary,
    rawPrivateDataIncluded: false,
  };
}

export function mergeEvidenceProvenance(
  items: LearnerEvidenceProvenance[]
): LearnerEvidenceProvenance[] {
  const seen = new Map<string, LearnerEvidenceProvenance>();

  for (const item of items) {
    const key = `${item.sourceKind}|${item.sourceIdHash ?? ''}|${item.observedAt ?? ''}`;
    if (!seen.has(key)) {
      seen.set(key, item);
    }
  }

  return Array.from(seen.values());
}
