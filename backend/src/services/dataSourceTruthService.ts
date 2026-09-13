// ─────────────────────────────────────────────────────────────
// Steadfast AI — Data Source Truth Service v1
// Classifies, normalizes, and enforces data-source truth
// metadata across all backend services and API responses.
//
// Converts raw source indicators (declaredDemo, isCached, etc.)
// into canonical DataSourceTruthMetadata.
// ─────────────────────────────────────────────────────────────

import type {
  DataSourceKind,
  DataSourceConfidence,
  DataFreshnessStatus,
  DataSourceTruthMetadata,
  DataSourceTruthInput,
  DataSourceTruthPolicyDecision,
} from '../contracts/dataSourceTruthContracts';

import {
  NON_REAL_SOURCE_KINDS,
  SOURCE_KIND_TRUTH_LABELS,
  SOURCE_KIND_SEVERITY,
  SOURCE_KIND_CONFIDENCE_MAP,
} from '../contracts/dataSourceTruthContracts';

function nowISO(): string {
  return new Date().toISOString();
}

// ═══════════════════════════════════════════════════════════════
// Classification
// ═══════════════════════════════════════════════════════════════

export function classifyDataSource(input: DataSourceTruthInput): DataSourceTruthMetadata {
  const kind = _resolveKind(input);
  const freshness = _resolveFreshness(kind, input);
  const confidence = input.confidence || SOURCE_KIND_CONFIDENCE_MAP[kind];

  const canSupportRealMastery = _canSupportRealMastery(kind, freshness);
  const canSupportRealGrowth = _canSupportRealGrowth(kind, freshness);
  const canSupportTeacherInsight = _canSupportTeacherInsight(kind);
  const canBeDisplayedAsReal = _canBeDisplayedAsReal(kind);

  return {
    sourceKind: kind,
    sourceConfidence: confidence,
    freshnessStatus: freshness,
    generatedAt: input.generatedAt,
    observedAt: input.observedAt,
    expiresAt: input.expiresAt,
    truthLabel: SOURCE_KIND_TRUTH_LABELS[kind],
    safeReason: input.safeReason || SOURCE_KIND_TRUTH_LABELS[kind],
    severity: SOURCE_KIND_SEVERITY[kind],
    canSupportRealMastery,
    canSupportRealGrowth,
    canSupportTeacherInsight,
    canBeDisplayedAsReal,
    rawLearnerDataIncluded: false,
    rawPromptIncluded: false,
    rawAiResponseIncluded: false,
    rawTranscriptIncluded: false,
  };
}

export function assertCanUseForRealMastery(metadata: DataSourceTruthMetadata): void {
  if (!metadata.canSupportRealMastery) {
    throw new Error(
      `Cannot claim real mastery from source kind "${metadata.sourceKind}" (${metadata.truthLabel}). ${metadata.safeReason}`,
    );
  }
}

export function assertCanUseForRealGrowth(metadata: DataSourceTruthMetadata): void {
  if (!metadata.canSupportRealGrowth) {
    throw new Error(
      `Cannot claim real growth from source kind "${metadata.sourceKind}" (${metadata.truthLabel}). ${metadata.safeReason}`,
    );
  }
}

export function assertCanDisplayAsReal(metadata: DataSourceTruthMetadata): void {
  if (!metadata.canBeDisplayedAsReal) {
    throw new Error(
      `Cannot display source kind "${metadata.sourceKind}" as real data. ${metadata.safeReason}`,
    );
  }
}

export function buildTruthLabel(metadata: DataSourceTruthMetadata): string {
  const freshnessNote =
    metadata.freshnessStatus === 'stale' ? ' (stale)'
    : metadata.freshnessStatus === 'expired' ? ' (expired)'
    : metadata.freshnessStatus === 'fresh' ? ' (fresh)'
    : '';

  return `${metadata.truthLabel}${freshnessNote}`;
}

export function makePolicyDecision(metadata: DataSourceTruthMetadata): DataSourceTruthPolicyDecision {
  return {
    sourceKind: metadata.sourceKind,
    canProceedWithRealMastery: metadata.canSupportRealMastery,
    canProceedWithRealGrowth: metadata.canSupportRealGrowth,
    canProceedWithTeacherInsight: metadata.canSupportTeacherInsight,
    canDisplayAsReal: metadata.canBeDisplayedAsReal,
    truthLabel: metadata.truthLabel,
    safeReason: metadata.safeReason,
    severity: metadata.severity,
  };
}

// ═══════════════════════════════════════════════════════════════
// Private helpers
// ═══════════════════════════════════════════════════════════════

function _resolveKind(input: DataSourceTruthInput): DataSourceKind {
  // Explicit declared kind takes precedence
  if (input.declaredKind) return input.declaredKind;

  // Explicit boolean flags
  if (input.explicitDemo) return 'demo';
  if (input.explicitFallback) return 'fallback';
  if (input.explicitMock) return 'mock';
  if (input.explicitFixture) return 'fixture';
  if (input.explicitSeeded) return 'seeded_sample';
  if (input.explicitSynthetic) return 'synthetic_test';
  if (input.explicitPlaceholder) return 'placeholder';

  // Cached/stale
  if (input.isCached && input.isStale) return 'stale_real';
  if (input.isCached) return 'cached_real';

  // Nothing specified
  return 'unknown';
}

function _resolveFreshness(kind: DataSourceKind, input: DataSourceTruthInput): DataFreshnessStatus {
  if (input.freshnessStatus) return input.freshnessStatus;
  if (kind === 'stale_real') return 'stale';
  if (kind === 'cached_real') return 'recent';
  if (kind === 'placeholder') return 'not_applicable';
  if (NON_REAL_SOURCE_KINDS.includes(kind)) return 'not_applicable';
  if (kind === 'unknown') return 'unknown';
  return 'fresh';
}

function _canSupportRealMastery(kind: DataSourceKind, freshness: DataFreshnessStatus): boolean {
  if (NON_REAL_SOURCE_KINDS.includes(kind)) return false;
  if (kind === 'unknown') return false;
  if (kind === 'stale_real') return false;
  if (kind === 'cached_real') {
    return freshness === 'fresh' || freshness === 'recent';
  }
  if (kind === 'real') {
    return freshness !== 'stale' && freshness !== 'expired' && freshness !== 'unknown';
  }
  return false;
}

function _canSupportRealGrowth(kind: DataSourceKind, freshness: DataFreshnessStatus): boolean {
  if (NON_REAL_SOURCE_KINDS.includes(kind)) return false;
  if (kind === 'unknown') return false;
  if (kind === 'stale_real') return false;
  if (kind === 'cached_real') {
    return freshness === 'fresh' || freshness === 'recent';
  }
  if (kind === 'real') {
    return freshness !== 'stale' && freshness !== 'expired' && freshness !== 'unknown';
  }
  return false;
}

function _canSupportTeacherInsight(kind: DataSourceKind): boolean {
  if (kind === 'real') return true;
  if (kind === 'cached_real') return true;
  return false;
}

function _canBeDisplayedAsReal(kind: DataSourceKind): boolean {
  return kind === 'real' || kind === 'cached_real';
}

// Singleton
export const dataSourceTruthService = {
  classify: classifyDataSource,
  assertCanUseForRealMastery,
  assertCanUseForRealGrowth,
  assertCanDisplayAsReal,
  buildTruthLabel,
  makePolicyDecision,
};
