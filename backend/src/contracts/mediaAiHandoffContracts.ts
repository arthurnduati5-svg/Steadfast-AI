// ─────────────────────────────────────────────────────────────────────────────
// Steadfast AI — Backend Media → AI Semantic Handoff Contracts v1
// TASK: STEADFAST-BACKEND-MEDIA-AI-HANDOFF-01
//
// OWNERSHIP LAW:
// - The backend is AUTHORITATIVE. AI remains ADVISORY.
// - Every AI-bound datum crosses an explicit backend authorization decision.
// - A proposal is never approval, rights, safety, curriculum authority,
//   recommendation, mastery, or persistence authority.
// - Authorization and governance FAIL CLOSED: unresolved permission is DENY,
//   governance dependency failure can never yield `accepted`.
//
// Shared-contract convention: this file mirrors the proposal semantics already
// frozen in AI/ai/flows/media-resource-enrichment.types.ts without importing
// AI implementation internals. Field names, closed enums, and bounds match the
// AI schema exactly so the two sides express one semantic boundary.
// ─────────────────────────────────────────────────────────────────────────────

// ---------------------------------------------------------------------------
// R2 — MEDIA AI-PROCESSING AUTHORIZATION
// Distinct from: resource existence, transcript availability, source trust,
// safety status, and playback entitlement. None of those imply this decision.
// ---------------------------------------------------------------------------

export type MediaAiProcessingScope = 'metadata' | 'transcript';

export type MediaAiProcessingDecision =
  | 'ALLOWED'
  | 'DENIED'
  | 'UNRESOLVED_FAIL_CLOSED';

/** Audit-sufficient provenance of the authorization decision. */
export type MediaAiProcessingAuthority =
  | 'explicit_media_metadata_flag'      // explicit backend-owned flag on the MediaAsset
  | 'rights_owner_record'               // composed from existing rights/consent logic
  | 'default_deny_no_authority_record'; // no authority record exists → fail closed

export interface MediaAiScopeAuthorization {
  scope: MediaAiProcessingScope;
  decision: MediaAiProcessingDecision;
  reasonCode: MediaAiProcessingReasonCode;
  /** Only ALLOWED decisions carry this. */
  authorizedAt: string | null;
  authority: MediaAiProcessingAuthority;
  /** Identifier of the record that produced the decision, for audit. */
  authorityRecordId: string | null;
}

export type MediaAiProcessingReasonCode =
  | 'MEDIA_AUTHORIZED_BY_EXPLICIT_FLAG'
  | 'MEDIA_DENIED_BY_EXPLICIT_FLAG'
  | 'MEDIA_AUTHORIZED_BY_RIGHTS_GRANT'
  | 'MEDIA_DENIED_BY_RIGHTS_GRANT'
  | 'MEDIA_UNRESOLVED_NO_AUTHORITY_RECORD'
  | 'MEDIA_UNRESOLVED_AUTHORITY_ERROR'
  | 'MEDIA_UNRESOLVED_CONSENT_STATE'
  | 'MEDIA_DENIED_ASSET_STATE'
  | 'MEDIA_RESOURCE_MISSING';

export interface MediaAiProcessingAuthorization {
  /** Canonical MediaAsset id this decision is bound to. */
  mediaAssetId: string;
  metadata: MediaAiScopeAuthorization;
  transcript: MediaAiScopeAuthorization;
  decidedAt: string;
  /** True only when every requested scope is explicitly ALLOWED. */
  allScopesAllowed: boolean;
}

// ---------------------------------------------------------------------------
// R3 — PERMITTED MEDIA PROJECTION
// Provider-neutral, learner-free projection of ONLY AI-authorized media data.
// Transcripts enter only with an explicit ALLOWED transcript decision.
// ---------------------------------------------------------------------------

/** Canonical reference to the backend-owned MediaAsset (R1 — reused owner). */
export interface MediaCanonicalResourceRef {
  mediaAssetId: string;
  /** Canonical owner service of this identity. */
  ownedBy: 'backend.mediaAssetService';
}

export interface PermittedMediaProjection {
  resourceRef: MediaCanonicalResourceRef;
  title: string;
  description: string | null;
  language: string | null;
  durationSeconds: number | null;
  resourceType: string | null;
  creatorName: string | null;
  providerType: string | null;
  /** Present ONLY when the transcript scope decision is ALLOWED. */
  authorizedTranscript: string | null;
  /** The authorization record that gated this projection. */
  authorization: MediaAiProcessingAuthorization;
}

// ---------------------------------------------------------------------------
// R4 — CLOSED TAXONOMY CONTEXT
// Canonical IDs only, sourced from existing curriculum/content governance.
// Free-text tags are never promoted to canonical IDs.
// ---------------------------------------------------------------------------

export type MediaTaxonomyCategory =
  | 'subjects'
  | 'topics'
  | 'concepts'
  | 'skills'
  | 'objectives';

export interface MediaTaxonomyNode {
  id: string;
  label: string;
  description: string | null;
}

export type MediaTaxonomyContextByCategory = Record<MediaTaxonomyCategory, MediaTaxonomyNode[]>;

export type MediaTaxonomyAvailability =
  | 'AVAILABLE'
  | 'EMPTY'
  | 'UNAVAILABLE_SOURCE_ERROR';

export interface ClosedTaxonomyContext {
  availability: MediaTaxonomyAvailability;
  /** Bounded closed set: the ONLY taxonomy IDs governance will accept back. */
  nodes: MediaTaxonomyContextByCategory;
  /** Canonical source of the IDs, for audit. */
  sourceDescription: string;
  /** When UNAVAILABLE_SOURCE_ERROR: typed reason. Never silently empty. */
  unavailableReason: string | null;
  resolvedAt: string;
}

// ---------------------------------------------------------------------------
// R5 — SEMANTIC PROPOSAL PORT (backend-owned; provider-neutral)
// Output is a PROPOSAL or typed failure. Never an approved decision.
// ---------------------------------------------------------------------------

/** Mirrors MEDIA_SEMANTIC_PROPOSAL_VERSION in the AI proposal contract. */
export const MEDIA_SEMANTIC_PROPOSAL_VERSION = 'media-semantic-proposal.v1' as const;

export interface MediaSemanticProposal {
  proposalVersion: typeof MEDIA_SEMANTIC_PROPOSAL_VERSION;
  resourceRef: string;
  analysisBasis: 'METADATA_ONLY' | 'METADATA_AND_AUTHORIZED_TRANSCRIPT';
  transcriptUsed: boolean;
  academic: {
    subjects: MediaSemanticCandidate[];
    topics: MediaSemanticCandidate[];
    concepts: MediaSemanticCandidate[];
    skills: MediaSemanticCandidate[];
    prerequisites: MediaSemanticCandidate[];
    learningPurposes: MediaSemanticCandidate[];
    misconceptionTargets: MediaSemanticCandidate[];
    difficulty: { level: string; confidence: number };
    educationalLevel: {
      labels: string[];
      confidence: number;
      evidenceBasis: 'metadata' | 'authorized_transcript' | 'mixed' | 'insufficient';
    };
  };
  creative: {
    families: Array<{ family: string; confidence: number }>;
    curiosityTags: MediaSemanticCandidate[];
    practicalApplications: MediaSemanticCandidate[];
    adjacentDomains: MediaSemanticCandidate[];
    broadeningDomains: MediaSemanticCandidate[];
  };
  content: {
    summary: string;
    keyPoints: string[];
    pedagogicalRoles: MediaSemanticCandidate[];
  };
  confidence: number;
  warnings: string[];
  provenance: {
    engine: string;
    model: string | null;
    generatedAt: string;
  };
}

export interface MediaSemanticCandidate {
  label: string;
  taxonomyId: string | null;
  confidence: number;
}

export type MediaSemanticPortFailureCode =
  | 'AUTHORIZATION_DENIED'
  | 'AUTHORIZATION_UNRESOLVED'
  | 'PROJECTION_BUILD_FAILED'
  | 'TAXONOMY_UNAVAILABLE'
  | 'PROPOSER_UNAVAILABLE'
  | 'PROPOSER_FAILED'
  | 'PROPOSAL_INVALID'
  | 'CANONICAL_RESOURCE_READ_FAILED';

export interface MediaSemanticProposalFailure {
  ok: false;
  code: MediaSemanticPortFailureCode;
  message: string;
  mediaAssetId: string | null;
}

export type MediaSemanticProposalResult =
  | { ok: true; proposal: MediaSemanticProposal }
  | MediaSemanticProposalFailure;

/**
 * The only outbound edge of the port: a pure invocation seam over the accepted
 * AI engine. This task injects NO provider; provider activation is out of scope
 * and remains a later integration decision (AI-STREAM-1).
 */
export type MediaSemanticProposerInvoker = (
  input: PermittedMediaProjection & { taxonomyContext: ClosedTaxonomyContext },
) => Promise<MediaSemanticProposal>;

// ---------------------------------------------------------------------------
// R6 — PROPOSAL GOVERNANCE (backend accept/reject boundary)
// ---------------------------------------------------------------------------

export type MediaSemanticGovernanceVerdict =
  | 'accepted'
  | 'rejected'
  | 'stale'
  | 'invalid';

export type MediaSemanticGovernanceReasonCode =
  | 'GOVERNANCE_DEPENDENCY_FAILED'          // always fails closed → never accepted
  | 'PROPOSAL_MALFORMED'
  | 'UNSUPPORTED_PROPOSAL_VERSION'
  | 'RESOURCE_MISSING'
  | 'RESOURCE_REF_MISMATCH'
  | 'TAXONOMY_ID_NOT_IN_CLOSED_SET'
  | 'TRANSCRIPT_PROVENANCE_UNAUTHORIZED'
  | 'UNAUTHORIZED_AUTHORITY_CLAIM'
  | 'BOUNDS_EXCEEDED'
  | 'PROPOSAL_STALE_OR_SUPERSEDED'
  | 'PROPOSAL_ACCEPTED';

export interface MediaSemanticGovernanceDecision {
  verdict: MediaSemanticGovernanceVerdict;
  reasonCode: MediaSemanticGovernanceReasonCode;
  detail: string;
  mediaAssetId: string;
  /** Set for `accepted` — the governance gate identity that accepted it. */
  acceptedByGate: string | null;
  decidedAt: string;
  /** Acceptance at this boundary does NOT imply persistence. */
  persisted: false;
}

export const MEDIA_SEMANTIC_GOVERNANCE_GATE = 'backend.media-semantic-proposal-governance.v1';

/** Bounds mirrored from AI INPUT/OUTPUT bounds; enforced by governance. */
export const MEDIA_SEMANTIC_GOVERNANCE_BOUNDS = {
  resourceRefMax: 200,
  summaryMax: 700,
  warningsMax: 8,
  keyPointsMax: 8,
  candidateLabelMax: 180,
  candidatesPerArrayMax: 12,
  confidenceMin: 0,
  confidenceMax: 1,
} as const;

/**
 * Authority names the proposal may reference as its own provenance.
 * Any claim of backend-owned authority (rights, approval, safety,
 * curriculum authority, persistence) is rejected.
 */
export const FORBIDDEN_PROPOSAL_AUTHORITY_CLAIMS = [
  'approved_curriculum_mapping',
  'approved_resource',
  'recommendation_decision',
  'rights_decision',
  'mastery_state',
  'evidence_state',
  'persistence_authority',
  'safety_approval',
  'curriculum_authority',
] as const;
