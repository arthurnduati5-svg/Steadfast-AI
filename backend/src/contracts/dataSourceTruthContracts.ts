// ─────────────────────────────────────────────────────────────
// Steadfast AI — Data Source Truth Contracts v1
// Canonical data-source truth metadata for all backend services,
// API responses, shared/frontend types, learning evidence events,
// growth proof, revision queue, tutor state, practice/mastery,
// and teacher-safe summaries.
//
// Prevents demo, fallback, mock, fixture, seeded, synthetic,
// placeholder, cached, stale, and unknown data from being
// silently treated as real learning proof.
//
// Never includes raw learner data, raw prompts, raw AI responses,
// or raw transcripts.
// ─────────────────────────────────────────────────────────────

export type DataSourceKind =
  | 'real'
  | 'demo'
  | 'fallback'
  | 'mock'
  | 'fixture'
  | 'seeded_sample'
  | 'synthetic_test'
  | 'placeholder'
  | 'cached_real'
  | 'stale_real'
  | 'unknown';

export type DataSourceConfidence =
  | 'verified'
  | 'declared'
  | 'inferred'
  | 'unknown';

export type DataFreshnessStatus =
  | 'fresh'
  | 'recent'
  | 'stale'
  | 'expired'
  | 'not_applicable'
  | 'unknown';

export type DataTruthSeverity =
  | 'none'
  | 'informational'
  | 'caution'
  | 'blocks_mastery'
  | 'blocks_growth'
  | 'blocks_teacher_claim'
  | 'blocks_real_data_claim';

export interface DataSourceTruthMetadata {
  sourceKind: DataSourceKind;
  sourceConfidence: DataSourceConfidence;
  freshnessStatus: DataFreshnessStatus;
  generatedAt?: string;
  observedAt?: string;
  expiresAt?: string;
  truthLabel: string;
  safeReason: string;
  severity: DataTruthSeverity[];
  canSupportRealMastery: boolean;
  canSupportRealGrowth: boolean;
  canSupportTeacherInsight: boolean;
  canBeDisplayedAsReal: boolean;
  rawLearnerDataIncluded: false;
  rawPromptIncluded: false;
  rawAiResponseIncluded: false;
  rawTranscriptIncluded: false;
}

export interface DataSourceTruthInput {
  declaredKind?: DataSourceKind;
  explicitDemo?: boolean;
  explicitFallback?: boolean;
  explicitMock?: boolean;
  explicitFixture?: boolean;
  explicitSeeded?: boolean;
  explicitSynthetic?: boolean;
  explicitPlaceholder?: boolean;
  isCached?: boolean;
  isStale?: boolean;
  freshnessStatus?: DataFreshnessStatus;
  confidence?: DataSourceConfidence;
  generatedAt?: string;
  observedAt?: string;
  expiresAt?: string;
  safeReason?: string;
}

export interface DataSourceTruthValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface DataSourceTruthPolicyDecision {
  sourceKind: DataSourceKind;
  canProceedWithRealMastery: boolean;
  canProceedWithRealGrowth: boolean;
  canProceedWithTeacherInsight: boolean;
  canDisplayAsReal: boolean;
  truthLabel: string;
  safeReason: string;
  severity: DataTruthSeverity[];
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

export const NON_REAL_SOURCE_KINDS: DataSourceKind[] = [
  'demo',
  'fallback',
  'mock',
  'fixture',
  'seeded_sample',
  'synthetic_test',
  'placeholder',
];

export const SOURCE_KIND_TRUTH_LABELS: Record<DataSourceKind, string> = {
  real: 'Real learning data',
  demo: 'Demo data — not real student work',
  fallback: 'Fallback data — not real student work',
  mock: 'Mock data — not real student work',
  fixture: 'Test fixture data — not real student work',
  seeded_sample: 'Sample data — not real student work',
  synthetic_test: 'Synthetic test data — not real student work',
  placeholder: 'Placeholder data — not real student work',
  cached_real: 'Cached real data — freshness may vary',
  stale_real: 'Stale real data — not sufficient for current claims',
  unknown: 'Unknown data source — cannot verify authenticity',
};

export const SOURCE_KIND_SEVERITY: Record<DataSourceKind, DataTruthSeverity[]> = {
  real: ['none'],
  demo: ['caution', 'blocks_mastery', 'blocks_growth', 'blocks_teacher_claim', 'blocks_real_data_claim'],
  fallback: ['caution', 'blocks_mastery', 'blocks_growth', 'blocks_teacher_claim', 'blocks_real_data_claim'],
  mock: ['caution', 'blocks_mastery', 'blocks_growth', 'blocks_teacher_claim', 'blocks_real_data_claim'],
  fixture: ['caution', 'blocks_mastery', 'blocks_growth', 'blocks_teacher_claim', 'blocks_real_data_claim'],
  seeded_sample: ['informational', 'blocks_mastery', 'blocks_growth', 'blocks_teacher_claim', 'blocks_real_data_claim'],
  synthetic_test: ['informational', 'blocks_mastery', 'blocks_growth', 'blocks_teacher_claim', 'blocks_real_data_claim'],
  placeholder: ['caution', 'blocks_mastery', 'blocks_growth', 'blocks_teacher_claim', 'blocks_real_data_claim'],
  cached_real: ['informational'],
  stale_real: ['caution', 'blocks_mastery', 'blocks_growth'],
  unknown: ['caution', 'blocks_mastery', 'blocks_growth', 'blocks_teacher_claim', 'blocks_real_data_claim'],
};

export const SOURCE_KIND_CONFIDENCE_MAP: Record<DataSourceKind, DataSourceConfidence> = {
  real: 'verified',
  demo: 'declared',
  fallback: 'declared',
  mock: 'declared',
  fixture: 'declared',
  seeded_sample: 'declared',
  synthetic_test: 'declared',
  placeholder: 'declared',
  cached_real: 'inferred',
  stale_real: 'inferred',
  unknown: 'unknown',
};

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

export function isNonRealSourceKind(kind: DataSourceKind): boolean {
  return NON_REAL_SOURCE_KINDS.includes(kind);
}

export function canSourceSupportRealMastery(metadata: DataSourceTruthMetadata): boolean {
  return metadata.canSupportRealMastery;
}

export function canSourceSupportRealGrowth(metadata: DataSourceTruthMetadata): boolean {
  return metadata.canSupportRealGrowth;
}

export function canSourceBeDisplayedAsReal(metadata: DataSourceTruthMetadata): boolean {
  return metadata.canBeDisplayedAsReal;
}

export function getDefaultTruthMetadata(input?: Partial<DataSourceTruthInput>): DataSourceTruthMetadata {
  return {
    sourceKind: 'unknown',
    sourceConfidence: 'unknown',
    freshnessStatus: 'unknown',
    truthLabel: SOURCE_KIND_TRUTH_LABELS.unknown,
    safeReason: 'No source metadata provided — classified as unknown.',
    severity: SOURCE_KIND_SEVERITY.unknown,
    canSupportRealMastery: false,
    canSupportRealGrowth: false,
    canSupportTeacherInsight: false,
    canBeDisplayedAsReal: false,
    rawLearnerDataIncluded: false,
    rawPromptIncluded: false,
    rawAiResponseIncluded: false,
    rawTranscriptIncluded: false,
  };
}
