// ─────────────────────────────────────────────────────────────
// Steadfast AI — Socratic Tutor Cache Policy v1
// Determines caching rules for Socratic policy decisions.
// Policy decisions are never cached for personalized contexts.
// Public or non-personalized decisions may be cached with
// short TTL.
// ─────────────────────────────────────────────────────────────

import type { SocraticSupportMode, SocraticRiskLevel } from './socraticTutorPolicyContracts';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export type SocraticCacheDecision =
  | 'never_cache'
  | 'short_lived_session'
  | 'public_static';

export interface SocraticCachePolicyInput {
  supportMode: SocraticSupportMode;
  riskLevel: SocraticRiskLevel;
  hasStudentId: boolean;
  hasSafeguardingSignal: boolean;
  hasIntegritySignal: boolean;
  requestedTtlSeconds?: number;
}

export interface SocraticCachePolicyOutput {
  cacheAllowed: boolean;
  decision: SocraticCacheDecision;
  maxTtlSeconds: number | null;
  reason: string;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════
// Cache Policy Rules
// ═══════════════════════════════════════════════════════════════

/**
 * Determine whether a Socratic policy decision can be cached.
 *
 * Rules:
 * - Never cache safeguarding decisions (high risk).
 * - Never cache personalized policy decisions (with student ID).
 * - Never cache decisions with active integrity signals.
 * - Cache non-personalized, public-static decisions with short TTL.
 */
export function decideSocraticCachePolicy(input: SocraticCachePolicyInput): SocraticCachePolicyOutput {
  const warnings: string[] = [];

  // 1. Safeguarding signals — never cache
  if (input.hasSafeguardingSignal) {
    warnings.push('Safeguarding signals present — policy decision not cached.');
    return {
      cacheAllowed: false,
      decision: 'never_cache',
      maxTtlSeconds: null,
      reason: 'safeguarding_policy_never_cache',
      warnings,
    };
  }

  // 2. Personalized decisions (with student ID) — never cache
  if (input.hasStudentId) {
    return {
      cacheAllowed: false,
      decision: 'never_cache',
      maxTtlSeconds: null,
      reason: 'personalized_policy_never_cache',
      warnings,
    };
  }

  // 3. Active integrity signals — never cache
  if (input.hasIntegritySignal) {
    warnings.push('Active integrity signals present — policy decision not cached.');
    return {
      cacheAllowed: false,
      decision: 'never_cache',
      maxTtlSeconds: null,
      reason: 'integrity_signal_present_never_cache',
      warnings,
    };
  }

  // 4. Medium or high risk — never cache
  if (input.riskLevel === 'medium' || input.riskLevel === 'high' || input.riskLevel === 'urgent') {
    warnings.push(`Risk level "${input.riskLevel}" present — policy decision not cached.`);
    return {
      cacheAllowed: false,
      decision: 'never_cache',
      maxTtlSeconds: null,
      reason: 'risk_level_never_cache',
      warnings,
    };
  }

  // 5. Personalized support modes — never cache
  if (
    input.supportMode === 'misconception_check' ||
    input.supportMode === 'concept_reteach' ||
    input.supportMode === 'challenge_extension' ||
    input.supportMode === 'safeguarding_escalation'
  ) {
    warnings.push(`Support mode "${input.supportMode}" is personalized — policy decision not cached.`);
    return {
      cacheAllowed: false,
      decision: 'never_cache',
      maxTtlSeconds: null,
      reason: 'personalized_support_mode_never_cache',
      warnings,
    };
  }

  // 6. Non-personalized, low-risk, generic decisions — short cache allowed
  const useRequestedTtl = typeof input.requestedTtlSeconds === 'number' &&
    input.requestedTtlSeconds > 0 &&
    input.requestedTtlSeconds <= 300;

  return {
    cacheAllowed: true,
    decision: 'public_static',
    maxTtlSeconds: (useRequestedTtl ? input.requestedTtlSeconds : 60) ?? null,
    reason: 'non_personalized_low_risk_public_static_cache',
    warnings: [],
  };
}

/**
 * Assert that a policy decision should not be cached.
 * Throws if caching would be unsafe.
 */
export function assertNoUnsafeCaching(input: SocraticCachePolicyInput): void {
  const result = decideSocraticCachePolicy(input);
  if (result.cacheAllowed) {
    throw new Error(
      `Unsafe caching detected: policy decision with supportMode=${input.supportMode}, ` +
      `riskLevel=${input.riskLevel}, hasStudentId=${input.hasStudentId} would be cached. ` +
      `Reason: ${result.reason}`,
    );
  }
}

/**
 * Explain the cache policy for Socratic decisions.
 */
export function explainSocraticCachePolicy(): string {
  return (
    'Socratic tutor policy decisions are never cached for personalized or high-risk contexts. ' +
    'This includes: decisions with student ID, safeguarding signals, active integrity signals, ' +
    'medium/high/urgent risk levels, and personalized support modes (misconception check, ' +
    'concept reteach, challenge extension, safeguarding escalation). ' +
    'Non-personalized, low-risk, generic decisions may be cached for up to 60 seconds.'
  );
}
