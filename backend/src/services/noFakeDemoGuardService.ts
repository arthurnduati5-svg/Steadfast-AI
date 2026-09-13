// ─────────────────────────────────────────────────────────────
// Steadfast AI — NoFakeDemo Guard Service v1
// Guards against demo, fallback, mock, fixture, seeded_sample,
// synthetic_test, placeholder, stale_real, and unknown data
// being treated as real learning proof.
//
// Integrates with:
// - Data source truth service (classification)
// - Data source metadata validator (consistency)
// - Growth proof (no fake mastery/growth)
// - Learning evidence ledger (source quality)
// - Teacher-safe summaries (no fake student state)
// ─────────────────────────────────────────────────────────────

import type {
  DataSourceTruthMetadata,
  DataSourceTruthPolicyDecision,
} from '../contracts/dataSourceTruthContracts';

import {
  classifyDataSource,
  makePolicyDecision,
} from './dataSourceTruthService';

import {
  validateDataSourceMetadata,
} from './dataSourceMetadataValidator';

export interface NoFakeDemoGuardResult {
  safe: boolean;
  violations: string[];
  checkedAt: string;
  policyDecision: DataSourceTruthPolicyDecision;
}

function nowISO(): string {
  return new Date().toISOString();
}

// ═══════════════════════════════════════════════════════════════
// NoFakeDemo Guard - Full Check
// ═══════════════════════════════════════════════════════════════

export function runNoFakeDemoGuard(
  metadata: DataSourceTruthMetadata,
): NoFakeDemoGuardResult {
  const violations: string[] = [];
  const checkedAt = nowISO();

  // Validate metadata consistency
  const validation = validateDataSourceMetadata(metadata);
  if (!validation.valid) {
    violations.push(...validation.errors.map((e) => `metadata_invalid: ${e}`));
  }

  // Check: cannot support real mastery from non-real data
  if (!metadata.canSupportRealMastery) {
    violations.push(`cannot_support_real_mastery: sourceKind=${metadata.sourceKind}`);
  }

  // Check: cannot support real growth from non-real data
  if (!metadata.canSupportRealGrowth) {
    violations.push(`cannot_support_real_growth: sourceKind=${metadata.sourceKind}`);
  }

  // Check: cannot be displayed as real if non-real
  if (!metadata.canBeDisplayedAsReal) {
    violations.push(`cannot_display_as_real: sourceKind=${metadata.sourceKind}`);
  }

  // Check: privacy guarantees
  if (metadata.rawLearnerDataIncluded !== false) {
    violations.push('raw_learner_data_included_flag');
  }
  if (metadata.rawPromptIncluded !== false) {
    violations.push('raw_prompt_included_flag');
  }
  if (metadata.rawAiResponseIncluded !== false) {
    violations.push('raw_ai_response_included_flag');
  }
  if (metadata.rawTranscriptIncluded !== false) {
    violations.push('raw_transcript_included_flag');
  }

  const policyDecision = makePolicyDecision(metadata);

  return {
    safe: violations.length === 0,
    violations,
    checkedAt,
    policyDecision,
  };
}

// ═══════════════════════════════════════════════════════════════
// NoFakeDemo Guard - Quick Checks
// ═══════════════════════════════════════════════════════════════

export function assertNoFakeDemoMasteryClaim(metadata: DataSourceTruthMetadata): void {
  const result = runNoFakeDemoGuard(metadata);
  if (!result.safe) {
    throw new Error(
      `NoFakeDemo guard blocked mastery claim: ${result.violations.join('; ')}`,
    );
  }
}

export function assertNoFakeDemoGrowthClaim(metadata: DataSourceTruthMetadata): void {
  const result = runNoFakeDemoGuard(metadata);
  if (!result.safe) {
    throw new Error(
      `NoFakeDemo guard blocked growth claim: ${result.violations.join('; ')}`,
    );
  }
}

export function assertNoFakeDemoDisplay(metadata: DataSourceTruthMetadata): void {
  const result = runNoFakeDemoGuard(metadata);
  if (!result.safe) {
    throw new Error(
      `NoFakeDemo guard blocked display: ${result.violations.join('; ')}`,
    );
  }
}
