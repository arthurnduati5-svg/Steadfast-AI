// ─────────────────────────────────────────────────────────────
// Steadfast AI — Data Source Metadata Validator v1
// Validates that DataSourceTruthMetadata is internally
// consistent and meets all safety/truth requirements.
//
// Rejects:
// - Contradictory metadata (e.g. demo + canBeDisplayedAsReal)
// - Missing required fields
// - Raw private data flags that are not false
// ─────────────────────────────────────────────────────────────

import type {
  DataSourceTruthMetadata,
  DataSourceTruthValidationResult,
  DataSourceKind,
} from '../contracts/dataSourceTruthContracts';

import { NON_REAL_SOURCE_KINDS } from '../contracts/dataSourceTruthContracts';

export function validateDataSourceMetadata(
  metadata: DataSourceTruthMetadata,
): DataSourceTruthValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // ── Required fields ──
  if (!metadata.sourceKind) {
    errors.push('sourceKind is required');
  }

  if (!metadata.sourceConfidence) {
    errors.push('sourceConfidence is required');
  }

  if (!metadata.freshnessStatus) {
    errors.push('freshnessStatus is required');
  }

  if (!metadata.truthLabel || metadata.truthLabel.length === 0) {
    errors.push('truthLabel is required');
  }

  // ── Consistency: non-real source must not claim real capabilities ──
  if (NON_REAL_SOURCE_KINDS.includes(metadata.sourceKind) || metadata.sourceKind === 'unknown') {
    if (metadata.canSupportRealMastery !== false) {
      errors.push(`Contradiction: ${metadata.sourceKind} cannot support real mastery`);
    }
    if (metadata.canSupportRealGrowth !== false) {
      errors.push(`Contradiction: ${metadata.sourceKind} cannot support real growth`);
    }
    if (metadata.canBeDisplayedAsReal !== false) {
      errors.push(`Contradiction: ${metadata.sourceKind} cannot be displayed as real`);
    }
  }

  // ── Stale real must not claim real mastery/growth alone ──
  if (metadata.sourceKind === 'stale_real') {
    if (metadata.canSupportRealMastery !== false) {
      errors.push('Contradiction: stale_real cannot support real mastery alone');
    }
    if (metadata.canSupportRealGrowth !== false) {
      errors.push('Contradiction: stale_real cannot support real growth alone');
    }
  }

  // ── Cached real must have meaningful freshness ──
  if (metadata.sourceKind === 'cached_real') {
    if (metadata.freshnessStatus === 'not_applicable' || metadata.freshnessStatus === 'unknown') {
      warnings.push('cached_real data should have a meaningful freshness status');
    }
  }

  // ── Real data must not be contradictory ──
  if (metadata.sourceKind === 'real') {
    if (metadata.canSupportRealMastery === false && metadata.freshnessStatus !== 'stale' && metadata.freshnessStatus !== 'expired') {
      warnings.push('real source kind should support real mastery unless stale/expired');
    }
  }

  // ── Unknown data must be treated cautiously ──
  if (metadata.sourceKind === 'unknown') {
    if (metadata.canSupportTeacherInsight !== false) {
      errors.push('Contradiction: unknown source cannot support teacher insight');
    }
  }

  // ── Non-real data should not support teacher insight ──
  if (NON_REAL_SOURCE_KINDS.includes(metadata.sourceKind)) {
    if (metadata.canSupportTeacherInsight !== false) {
      errors.push(`Contradiction: ${metadata.sourceKind} cannot support teacher insight as real data`);
    }
  }

  // ── Demo/fallback severity must include blocks_real_data_claim ──
  if (metadata.sourceKind === 'demo' || metadata.sourceKind === 'fallback') {
    if (!metadata.severity.includes('blocks_real_data_claim')) {
      errors.push(`Contradiction: ${metadata.sourceKind} must include blocks_real_data_claim severity`);
    }
  }

  // ── Privacy guarantees ──
  if (metadata.rawLearnerDataIncluded !== false) {
    errors.push('rawLearnerDataIncluded must be false');
  }
  if (metadata.rawPromptIncluded !== false) {
    errors.push('rawPromptIncluded must be false');
  }
  if (metadata.rawAiResponseIncluded !== false) {
    errors.push('rawAiResponseIncluded must be false');
  }
  if (metadata.rawTranscriptIncluded !== false) {
    errors.push('rawTranscriptIncluded must be false');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function assertValidDataSourceMetadata(
  metadata: DataSourceTruthMetadata,
): void {
  const result = validateDataSourceMetadata(metadata);
  if (!result.valid) {
    throw new Error(
      `DataSourceTruth validation failed: ${result.errors.join('; ')}`,
    );
  }
}
