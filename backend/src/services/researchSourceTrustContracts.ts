// ─────────────────────────────────────────────────────────────
// Steadfast AI — Research Source Trust Contracts v1
// Domain: research source trust final seal
// Every research source must be classified and carry evidence.
// ─────────────────────────────────────────────────────────────

/**
 * 7-class source classification model.
 */
export type ResearchSourceKind =
  | 'verified_web'
  | 'verified_internal_artifact'
  | 'verified_video_context'
  | 'unverified_reference'
  | 'model_generated'
  | 'blocked'
  | 'missing';

/**
 * Trust status for a research source.
 */
export type ResearchSourceTrustStatus =
  | 'verified'
  | 'unverified'
  | 'blocked'
  | 'missing'
  | 'redacted';

/**
 * Origin of a research source.
 */
export type ResearchSourceOrigin =
  | 'web_search'
  | 'research_tool'
  | 'artifact_context'
  | 'video_context'
  | 'tutor_context'
  | 'learner_memory'
  | 'model_output'
  | 'fallback'
  | 'unknown';

/**
 * Citation display policy for a source.
 */
export type ResearchCitationDisplayPolicy =
  | 'show_as_verified_citation'
  | 'show_as_internal_reference'
  | 'show_as_context_note'
  | 'hide'
  | 'block_response';

/**
 * Reason a source was blocked.
 */
export type ResearchSourceBlockReason =
  | 'invalid_url'
  | 'missing_evidence'
  | 'model_generated_url'
  | 'fallback_url'
  | 'prompt_injection'
  | 'unsafe_content'
  | 'cross_tenant_risk'
  | 'raw_content_leak'
  | 'unsupported_origin'
  | 'placeholder_url'
  | 'blocked_protocol';

/**
 * Evidence that a source was actually retrieved.
 */
export interface ResearchSourceEvidence {
  evidenceId: string;
  origin: ResearchSourceOrigin;
  retrievedAt?: string | null;
  toolName?: string | null;
  toolCallId?: string | null;
  url?: string | null;
  domain?: string | null;
  title?: string | null;
  snippet?: string | null;
  artifactId?: string | null;
  videoId?: string | null;
  contextId?: string | null;
  hash?: string | null;
}

/**
 * A fully classified and trusted source.
 */
export interface ResearchTrustedSource {
  sourceId: string;
  kind: ResearchSourceKind;
  trustStatus: ResearchSourceTrustStatus;
  displayPolicy: ResearchCitationDisplayPolicy;
  origin: ResearchSourceOrigin;

  url?: string | null;
  domain?: string | null;
  title?: string | null;
  snippet?: string | null;

  artifactId?: string | null;
  artifactTitle?: string | null;
  videoId?: string | null;
  videoTitle?: string | null;

  evidence: ResearchSourceEvidence[];

  safeSummary?: string | null;
  blockReasons: ResearchSourceBlockReason[];
  warnings: string[];

  createdAt: string;
}

/**
 * Complete source trust packet for a research turn.
 */
export interface ResearchSourceTrustPacket {
  packetId: string;
  noCache: true;
  sources: ResearchTrustedSource[];
  verifiedWebSources: ResearchTrustedSource[];
  internalReferences: ResearchTrustedSource[];
  unverifiedReferences: ResearchTrustedSource[];
  blockedSources: ResearchTrustedSource[];
  missingSourceReason?: string | null;

  usage: {
    sourceCount: number;
    verifiedWebCount: number;
    internalReferenceCount: number;
    unverifiedCount: number;
    blockedCount: number;
    citationDisplayCount: number;
  };

  safety: {
    fabricatedUrlsBlocked: boolean;
    fallbackUrlsBlocked: boolean;
    modelGeneratedUrlsBlocked: boolean;
    promptInjectionBlocked: boolean;
    rawContentRedacted: boolean;
    warnings: string[];
  };

  createdAt: string;
}

/**
 * Frontend-safe response metadata for sources.
 */
export interface ResearchSourceResponseMetadata {
  hasVerifiedSources: boolean;
  sourceCount: number;
  verifiedWebCount: number;
  internalReferenceCount: number;
  blockedCount: number;
  displaySources: ResearchTrustedSource[];
  missingSourceReason?: string | null;
  warnings: string[];
}

/**
 * A source candidate that needs classification.
 */
export interface ResearchSourceCandidate {
  title?: string | null;
  url?: string | null;
  snippet?: string | null;
  sourceId?: string | null;
  kind?: ResearchSourceKind;
  origin?: ResearchSourceOrigin;
  artifactId?: string | null;
  videoId?: string | null;
  retrievalRecordId?: string | null;
  toolName?: string | null;
  toolCallId?: string | null;
  retrievedAt?: string | null;
  contentHash?: string | null;
  displayAllowed?: boolean;
}

/**
 * Validation/classification violation.
 */
export interface ResearchSourceViolation {
  code: string;
  sourceId?: string;
  kind?: ResearchSourceKind;
  message: string;
  severity: 'warning' | 'error';
}

/**
 * Input to the source trust seal pipeline.
 */
export interface ResearchSourceSealInput {
  candidates: ResearchSourceCandidate[];
  existingTrustedSources?: ResearchTrustedSource[];
  authenticatedSchoolId: string;
  authenticatedStudentId?: string | null;
  authenticatedSessionId?: string | null;
}

/**
 * Output from the source trust seal pipeline.
 */
export interface ResearchSourceSealOutput {
  ok: boolean;
  packet: ResearchSourceTrustPacket;
  metadata: ResearchSourceResponseMetadata;
  violations: ResearchSourceViolation[];
}
