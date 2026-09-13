// ─────────────────────────────────────────────────────────────
// Steadfast AI — Source Trust Contracts
// Domain: source trust guard v1
// Every source decision must originate from these types.
// ─────────────────────────────────────────────────────────────

/**
 * Overall status of source trust resolution.
 */
export type SourceTrustStatus =
  | 'verified'
  | 'partial'
  | 'unsupported'
  | 'blocked'
  | 'no_sources'
  | 'not_requested'
  | 'error';

/**
 * Kind/origin of a source candidate.
 */
export type SourceKind =
  | 'web'
  | 'artifact'
  | 'teacher_upload'
  | 'school_resource'
  | 'internal_curriculum'
  | 'research_result'
  | 'unknown';

/**
 * Verification method for a verified source.
 */
export type VerificationMethod =
  | 'retrieval_record'
  | 'artifact_provenance'
  | 'teacher_upload'
  | 'school_registry'
  | 'internal_curriculum'
  | 'manual_review';

/**
 * A source that has passed verification.
 */
export interface VerifiedSourceRecord {
  sourceId: string;
  kind: SourceKind;
  title: string;
  url?: string | null;
  artifactId?: string | null;
  artifactBlockId?: string | null;
  schoolId?: string | null;
  retrievedAt?: string | null;
  verifiedAt: string;
  verificationMethod: VerificationMethod;
  contentFingerprint?: string | null;
  trustStatus: 'verified' | 'partial';
  displayAllowed: boolean;
  citationAllowed: boolean;
  notes: string[];
}

/**
 * A source that was rejected or is unsupported.
 */
export interface UnsupportedSourceRecord {
  attemptedTitle?: string | null;
  attemptedUrl?: string | null;
  reason:
    | 'model_generated_url'
    | 'missing_retrieval_record'
    | 'invalid_url'
    | 'blocked_protocol'
    | 'private_or_local_url'
    | 'placeholder_url'
    | 'untrusted_source'
    | 'source_not_accessible'
    | 'unknown';
  blockedAt: string;
}

/**
 * Complete source trust decision for a turn.
 */
export interface SourceTrustDecision {
  status: SourceTrustStatus;
  verifiedSources: VerifiedSourceRecord[];
  unsupportedSources: UnsupportedSourceRecord[];
  sourceCount: number;
  unsupportedCount: number;
  unsupportedSourcesBlocked: boolean;
  citationPolicy: 'verified_only';
  sourceFingerprint: string | null;
  warnings: string[];
  errors: string[];
  resolvedAt: string;
}

/**
 * Input to SourceTrustService.resolve().
 */
export interface SourceTrustInput {
  schoolId?: string | null;
  studentId?: string | null;
  sessionId?: string | null;
  requestedSources?: SourceCandidate[];
  retrievalRecords?: SourceCandidate[];
  artifactSources?: SourceCandidate[];
  teacherSources?: SourceCandidate[];
  existingVerifiedSources?: VerifiedSourceRecord[];
}

/**
 * A source candidate that needs to be validated.
 */
export interface SourceCandidate {
  title?: string | null;
  url?: string | null;
  sourceId?: string | null;
  kind?: SourceKind;
  artifactId?: string | null;
  artifactBlockId?: string | null;
  retrievalRecordId?: string | null;
  retrievedAt?: string | null;
  contentFingerprint?: string | null;
  provenance?: unknown;
  displayAllowed?: boolean;
}

/**
 * Input to CitationPolicyService.
 */
export interface CitationPolicyInput {
  sourceTrustDecision: SourceTrustDecision;
  responseSources?: unknown[];
  responseText?: string;
}

/**
 * Result of citation policy sanitization.
 */
export interface CitationPolicyResult {
  displaySources: VerifiedSourceRecord[];
  strippedSources: UnsupportedSourceRecord[];
  sourceChipsAllowed: boolean;
  warnings: string[];
}

/**
 * Payload for source chip rendering on the frontend.
 */
export interface SourceChipPayload {
  sourceId: string;
  title: string;
  url?: string | null;
  kind: SourceKind;
  displayAllowed: boolean;
  citationAllowed: boolean;
  trustStatus: 'verified' | 'partial';
}
