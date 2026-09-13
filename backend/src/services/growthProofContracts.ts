// ─────────────────────────────────────────────────────────────
// Steadfast AI — Growth Proof Contracts v1
// Evidence-backed growth proof. Prevents fake mastery, fake
// growth, and unsupported claims. Requires real evidence for
// each verdict level.
// ─────────────────────────────────────────────────────────────

import type {
  LearningEvidenceStrength,
  MistakeTaxonomyCode,
} from './learningEvidenceLedgerContracts';

// ═══════════════════════════════════════════════════════════════
// Growth Proof Verdict
// ═══════════════════════════════════════════════════════════════

export type GrowthProofVerdict =
  | 'insufficient_evidence'
  | 'early_signal'
  | 'growth_observed'
  | 'mastery_candidate'
  | 'mastery_not_supported';

// ═══════════════════════════════════════════════════════════════
// Growth Proof
// ═══════════════════════════════════════════════════════════════

export interface GrowthProof {
  /** Hashed learner identifier — never the raw student ID */
  learnerIdHash?: string;

  /** Subject identifier */
  subjectId?: string;

  /** Skill identifier */
  skillId?: string;

  /** Topic identifier */
  topicId?: string;

  /** The growth proof verdict */
  verdict: GrowthProofVerdict;

  /** Safe, human-readable reason for the verdict — no raw private data */
  safeReason: string;

  /** Evidence event IDs supporting this verdict */
  supportingEvidenceEventIds: string[];

  /** The strongest evidence strength found */
  evidenceStrength: LearningEvidenceStrength;

  /** Mistake pattern detected, if applicable */
  mistakePattern?: MistakeTaxonomyCode;

  /** Whether revision is recommended */
  revisionRecommended: boolean;

  /** Whether a mastery claim is allowed */
  masteryClaimAllowed: boolean;

  /** Confidence score for this proof (0-1) */
  confidenceScore: number;

  /** Compile-time guarantee: no raw private data */
  rawPrivateDataIncluded: false;
}

// ═══════════════════════════════════════════════════════════════
// Growth Proof Input
// ═══════════════════════════════════════════════════════════════

export interface GrowthProofInput {
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  evidenceEvents: GrowthProofEvidenceEvent[];
}

export interface GrowthProofEvidenceEvent {
  eventId: string;
  eventType: string;
  evidenceStrength: LearningEvidenceStrength;
  sourceQuality: string;
  freshness: string;
  mistakeType?: MistakeTaxonomyCode;
  correctionObserved?: boolean;
  reflectionObserved?: boolean;
  transferObserved?: boolean;
  attemptCount?: number;
  hintLevel?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Growth Proof Output
// ═══════════════════════════════════════════════════════════════

export interface GrowthProofOutput {
  proof: GrowthProof;
  warnings: string[];
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

export const GROWTH_PROOF_RULES = {
  /** Minimum real evidence events for growth_observed verdict */
  MIN_EVENTS_FOR_GROWTH: 3,

  /** Minimum real evidence events for mastery_candidate verdict */
  MIN_EVENTS_FOR_MASTERY_CANDIDATE: 5,

  /** Minimum strong evidence events for mastery_candidate verdict */
  MIN_STRONG_EVENTS_FOR_MASTERY_CANDIDATE: 2,

  /** Maximum weak evidence events allowed for growth_observed */
  MAX_WEAK_FOR_GROWTH: 1,

  /** Minimum events for early_signal verdict */
  MIN_EVENTS_FOR_EARLY_SIGNAL: 1,

  /** Hint level threshold for hint dependency */
  HINT_DEPENDENCY_THRESHOLD: 5,

  /** Maximum hint events allowed for mastery_candidate */
  MAX_HINT_EVENTS_FOR_MASTERY: 1,
} as const;
