// ─────────────────────────────────────────────────────────────
// Steadfast AI — Canonical Specialist Contracts (AI-INTELLIGENCE-03)
//
// ONE canonical specialist contract. Specialists are SUBORDINATE
// capabilities of the canonical tutor runtime. They may propose
// evidence, reasoning context, and directives. They must never
// bypass canonical policy, persist protected learner state, or
// produce learner-facing responses.
//
// All fields are bounded and safe by construction:
// no raw provider output, raw artifact bodies, raw learner memory,
// private learner fields, chain of thought, answer keys, or secrets.
// ─────────────────────────────────────────────────────────────

import type { VerifiedSource } from '../sourceVerificationContracts';

export type TutorSpecialistKind =
  | 'none'
  | 'math'
  | 'research'
  | 'artifact'
  | 'video';

export type TutorSpecialistStatus =
  | 'not_needed'
  | 'ready'
  | 'degraded'
  | 'blocked';

export interface TutorSpecialistDecision {
  kind: TutorSpecialistKind;
  reasonCode: string;
  confidence: 'low' | 'medium' | 'high';
  requiresExternalRetrieval: boolean;
  usesPreparedContext: boolean;
}

export interface TutorSpecialistResult {
  kind: TutorSpecialistKind;
  status: TutorSpecialistStatus;
  /** Max 6 items, each ≤ 220 chars. Content/reasoning instructions only — never language or policy overrides. */
  promptDirectives: string[];
  /** Max 6 items, each ≤ 700 chars. Bounded evidence summaries only. */
  evidenceSections: string[];
  /** Only sources that passed the canonical trust/verification path. Never fabricated. */
  verifiedSources: VerifiedSource[];
  /** Max 5 warnings. */
  warnings: string[];
  /** Bounded safe metadata only (scalar strings/numbers/booleans). */
  metadata: Record<string, string | number | boolean>;
}

// ── AI-STREAM-2: bounded resource-aware video context ──

export interface ActiveVideoRef {
  sessionVideoId: string;
  provider: string | null;
  providerVideoId: string | null;
}

export interface PreparedMediaResourceTutorSemantic {
  proposalVersion: string;
  analysisBasis: 'METADATA_ONLY' | 'METADATA_AND_AUTHORIZED_TRANSCRIPT';
  transcriptUsed: boolean;
  summary: string;
  keyPoints: string[];
  subjects: string[];
  topics: string[];
  concepts: string[];
  skills: string[];
  prerequisites: string[];
  misconceptionTargets: string[];
  pedagogicalRoles: string[];
  difficulty?: string | null;
  confidence: number;
  warnings: string[];
}

export interface PreparedMediaResourceTutorContext {
  status: 'semantic_ready' | 'safe_session_fallback' | 'blocked' | 'unavailable';
  mediaAssetId?: string;
  semantic?: PreparedMediaResourceTutorSemantic;
  fallbackSummary?: string | null;
  reasonCode?: string;
}

/**
 * AI-STREAM-2 R15 — extended prepared video context. Existing
 * recommendation behavior (status/recommendationCount/summary) remains
 * compatible; resourceContext is additive supporting context only.
 */
export interface PreparedVideoTutorContext {
  status?: string;
  recommendationCount?: number;
  summary?: string;
  activeVideoRef?: ActiveVideoRef | null;
  resourceContext?: PreparedMediaResourceTutorContext | null;
}

const BOUNDED_STRING = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.slice(0, max) : '';

const BOUNDED_ARRAY = (values: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(values)
    ? values
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .slice(0, maxItems)
        .map((v) => v.slice(0, maxLen))
    : [];

/**
 * Enforce the bounded, safe shape of a specialist result.
 * Guards against accidental leakage of oversized or unsafe payloads.
 */
export function boundTutorSpecialistResult(
  result: TutorSpecialistResult,
): TutorSpecialistResult {
  const boundedMetadata: Record<string, string | number | boolean> = {};
  const keys = Object.keys(result.metadata || {}).slice(0, 10);
  for (const key of keys) {
    const value = result.metadata[key];
    if (typeof value === 'string') boundedMetadata[key.slice(0, 40)] = value.slice(0, 120);
    else if (typeof value === 'number' || typeof value === 'boolean') boundedMetadata[key.slice(0, 40)] = value;
  }
  return {
    kind: result.kind,
    status: result.status,
    promptDirectives: BOUNDED_ARRAY(result.promptDirectives, 6, 220),
    evidenceSections: BOUNDED_ARRAY(result.evidenceSections, 6, 700),
    verifiedSources: Array.isArray(result.verifiedSources)
      ? result.verifiedSources.slice(0, 5)
      : [],
    warnings: BOUNDED_ARRAY(result.warnings, 5, 200),
    metadata: boundedMetadata,
  };
}
