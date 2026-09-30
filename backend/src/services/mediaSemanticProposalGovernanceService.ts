// ─────────────────────────────────────────────────────────────────────────────
// Steadfast AI — Media Semantic Proposal Governance (R6)
// TASK: STEADFAST-BACKEND-MEDIA-AI-HANDOFF-01
//
// The backend accept/reject validation boundary for incoming semantic
// proposals. Every verdict is typed: accepted | rejected | stale | invalid.
//
// FAIL-CLOSED LAW: if any governance dependency (canonical resource read,
// closed-set taxonomy lookup) throws or is unavailable, the verdict can never
// be `accepted`. Governance dependency failure is explicit and typed.
//
// Acceptance here does NOT persist anything. Persistence of accepted mappings
// is not part of this task (no accepted canonical mapping owner exists).
// ─────────────────────────────────────────────────────────────────────────────

import type {
  MediaSemanticGovernanceDecision,
  MediaSemanticGovernanceReasonCode,
  MediaSemanticGovernanceVerdict,
  MediaSemanticProposal,
} from '../contracts/mediaAiHandoffContracts';
import {
  FORBIDDEN_PROPOSAL_AUTHORITY_CLAIMS,
  MEDIA_SEMANTIC_GOVERNANCE_BOUNDS,
  MEDIA_SEMANTIC_GOVERNANCE_GATE,
  MEDIA_SEMANTIC_PROPOSAL_VERSION,
} from '../contracts/mediaAiHandoffContracts';
import { getMediaAssetById } from './mediaAssetService';
import { buildClosedTaxonomyContext, isTaxonomyIdInClosedSet } from './mediaTaxonomyContextService';
import type { CurriculumFamily } from './task022ContentGovernanceContracts';

export interface MediaSemanticGovernanceInput {
  proposal: unknown;
  expectedMediaAssetId: string;
  userId: string;
  curriculumFamily: CurriculumFamily;
  curriculumVersionId?: string;
  /**
   * Canonical transcript authorization proof (AI-STREAM-1 R1/R4/R9).
   * The obsolete `metadata.mediaAiProcessing` flag is NEVER authoritative
   * and is not consulted here. A transcript-bearing proposal is accepted
   * only when the caller supplies explicit canonical proof that
   * AI_PROCESS + TRANSCRIPT_READ are ALLOW from the SAME grant
   * (or an equivalent canonical authorization decision). When absent,
   * transcript-bearing proposals fail closed.
   */
  canonicalTranscriptAuthorized?: boolean | null;
  /** Governance dependency suppliers — overridable for fail-closed tests. */
  dependencies?: {
    getAsset?: typeof getMediaAssetById;
    buildTaxonomy?: typeof buildClosedTaxonomyContext;
    /**
     * Canonical transcript authorization resolver. When supplied, it is
     * consulted as the authority for transcript provenance; the legacy
     * metadata flag is never consulted regardless.
     */
    isTranscriptAuthorized?: (asset: Awaited<ReturnType<typeof getMediaAssetById>>) => boolean | Promise<boolean>;
  };
  /**
   * Deterministic clock for staleness checks. Defaults to the system clock;
   * injected for tests.
   */
  now?: () => Date;
  /** Optional registry of already-seen proposal fingerprints for replay rejection. */
  seenProposalFingerprints?: Set<string>;
}

const GOVERNANCE_DEPENDENCY_CODE: MediaSemanticGovernanceReasonCode = 'GOVERNANCE_DEPENDENCY_FAILED';

function failClosed(mediaAssetId: string, detail: string): MediaSemanticGovernanceDecision {
  return {
    verdict: 'invalid',
    reasonCode: GOVERNANCE_DEPENDENCY_CODE,
    detail,
    mediaAssetId,
    acceptedByGate: null,
    decidedAt: new Date().toISOString(),
    persisted: false,
  };
}

function reject(
  mediaAssetId: string,
  reasonCode: MediaSemanticGovernanceReasonCode,
  detail: string,
): MediaSemanticGovernanceDecision {
  return {
    verdict: reasonCode === 'PROPOSAL_STALE_OR_SUPERSEDED' ? 'stale' : 'rejected',
    reasonCode,
    detail,
    mediaAssetId,
    acceptedByGate: null,
    decidedAt: new Date().toISOString(),
    persisted: false,
  };
}

function rejectInvalid(
  mediaAssetId: string,
  reasonCode: MediaSemanticGovernanceReasonCode,
  detail: string,
): MediaSemanticGovernanceDecision {
  return {
    verdict: 'invalid',
    reasonCode,
    detail,
    mediaAssetId,
    acceptedByGate: null,
    decidedAt: new Date().toISOString(),
    persisted: false,
  };
}

function collectTaxonomyIds(value: unknown, found: Set<string>): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const entry of value) collectTaxonomyIds(entry, found);
    return;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.taxonomyId === 'string' && record.taxonomyId.trim()) {
    found.add(record.taxonomyId);
  }
  for (const child of Object.values(record)) {
    if (child && typeof child === 'object') collectTaxonomyIds(child, found);
  }
}

function collectStringsDeep(value: unknown, found: string[], depth = 0): void {
  if (depth > 6 || value === null || value === undefined) return;
  if (typeof value === 'string') {
    found.push(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectStringsDeep(entry, found, depth + 1);
    return;
  }
  if (typeof value === 'object') {
    for (const child of Object.values(value as Record<string, unknown>)) {
      collectStringsDeep(child, found, depth + 1);
    }
  }
}

/**
 * Normalize a string for authority-claim matching: separators collapse to the
 * canonical underscore token form, so 'approved curriculum mapping',
 * 'approved-curriculum-mapping' and 'approved_curriculum_mapping' all match.
 */
function normalizeForAuthorityMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function countCandidates(value: unknown): number {
  if (!value || typeof value !== 'object') return 0;
  if (Array.isArray(value)) return value.length;
  let total = 0;
  for (const child of Object.values(value as Record<string, unknown>)) {
    total += countCandidates(child);
  }
  return total;
}

function assertCandidateShape(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return 'Candidate entry is not an object.';
    }
    const rec = entry as Record<string, unknown>;
    if (typeof rec.label !== 'string' || !rec.label.trim()) {
      return 'Candidate label missing or not a string.';
    }
    if (
      typeof rec.confidence !== 'number' ||
      !Number.isFinite(rec.confidence) ||
      rec.confidence < MEDIA_SEMANTIC_GOVERNANCE_BOUNDS.confidenceMin ||
      rec.confidence > MEDIA_SEMANTIC_GOVERNANCE_BOUNDS.confidenceMax
    ) {
      return 'Candidate confidence out of bounds.';
    }
    if (rec.taxonomyId !== null && rec.taxonomyId !== undefined && typeof rec.taxonomyId !== 'string') {
      return 'Candidate taxonomyId must be a string or null.';
    }
  }
  return null;
}

/**
 * Validate a semantic proposal at the backend governance boundary.
 */
export async function governMediaSemanticProposal(
  input: MediaSemanticGovernanceInput,
): Promise<MediaSemanticGovernanceDecision> {
  const mediaAssetId = input.expectedMediaAssetId;
  const now = input.now ?? (() => new Date());

  // ── 1. Governance dependency: canonical resource (fail closed) ──────────
  let asset: Awaited<ReturnType<typeof getMediaAssetById>> = null;
  try {
    const getAsset = input.dependencies?.getAsset ?? getMediaAssetById;
    asset = await getAsset({ userId: input.userId, assetId: mediaAssetId });
  } catch (error) {
    return failClosed(
      mediaAssetId,
      `Governance dependency failure while reading canonical MediaAsset: ${error instanceof Error ? error.message : 'unknown error'}.`,
    );
  }
  if (!asset) {
    return reject(mediaAssetId, 'RESOURCE_MISSING', 'Canonical MediaAsset does not exist.');
  }

  // ── 2. Proposal shape and version ────────────────────────────────────────
  if (!input.proposal || typeof input.proposal !== 'object' || Array.isArray(input.proposal)) {
    return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'Proposal is not an object.');
  }
  const proposal = input.proposal as Record<string, unknown>;

  if (proposal.proposalVersion !== MEDIA_SEMANTIC_PROPOSAL_VERSION) {
    return rejectInvalid(
      mediaAssetId,
      'UNSUPPORTED_PROPOSAL_VERSION',
      `Unsupported proposalVersion; expected '${MEDIA_SEMANTIC_PROPOSAL_VERSION}'.`,
    );
  }

  const expectedRef = mediaAssetId;
  if (proposal.resourceRef !== expectedRef) {
    return reject(
      mediaAssetId,
      'RESOURCE_REF_MISMATCH',
      `Proposal resourceRef '${String(proposal.resourceRef)}' does not match expected canonical resource '${expectedRef}'.`,
    );
  }

  // ── 3. Duplicate/replayed proposal rejection ─────────────────────────────
  if (input.seenProposalFingerprints) {
    let fingerprint: string;
    try {
      fingerprint = JSON.stringify([
        proposal.resourceRef,
        proposal.proposalVersion,
        (proposal.provenance as Record<string, unknown> | undefined)?.generatedAt ?? null,
      ]);
    } catch {
      return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'Proposal fingerprinting failed.');
    }
    if (input.seenProposalFingerprints.has(fingerprint)) {
      return reject(
        mediaAssetId,
        'PROPOSAL_STALE_OR_SUPERSEDED',
        'Duplicate/replayed proposal fingerprint already governed.',
      );
    }
    input.seenProposalFingerprints.add(fingerprint);
  }

  // ── 4. Staleness ─────────────────────────────────────────────────────────
  const provenance = proposal.provenance;
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) {
    return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'Proposal provenance missing.');
  }
  const generatedAt = (provenance as Record<string, unknown>).generatedAt;
  if (typeof generatedAt !== 'string' || Number.isNaN(Date.parse(generatedAt))) {
    return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'Proposal provenance.generatedAt missing or unparseable.');
  }

  const assetUpdatedAt = Date.parse(asset.updatedAt);
  if (Number.isFinite(assetUpdatedAt) && Date.parse(generatedAt) < assetUpdatedAt) {
    return reject(
      mediaAssetId,
      'PROPOSAL_STALE_OR_SUPERSEDED',
      'Proposal was generated before the canonical resource was last updated.',
    );
  }

  // ── 5. Bounds ────────────────────────────────────────────────────────────
  const content = proposal.content;
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'Proposal content section missing.');
  }
  const summary = (content as Record<string, unknown>).summary;
  if (typeof summary !== 'string' || summary.length > MEDIA_SEMANTIC_GOVERNANCE_BOUNDS.summaryMax) {
    return reject(
      mediaAssetId,
      'BOUNDS_EXCEEDED',
      `content.summary exceeds ${MEDIA_SEMANTIC_GOVERNANCE_BOUNDS.summaryMax} characters.`,
    );
  }
  const keyPoints = (content as Record<string, unknown>).keyPoints;
  if (!Array.isArray(keyPoints) || keyPoints.length > MEDIA_SEMANTIC_GOVERNANCE_BOUNDS.keyPointsMax) {
    return reject(mediaAssetId, 'BOUNDS_EXCEEDED', `content.keyPoints exceeds ${MEDIA_SEMANTIC_GOVERNANCE_BOUNDS.keyPointsMax}.`);
  }
  const warnings = proposal.warnings;
  if (!Array.isArray(warnings) || warnings.length > MEDIA_SEMANTIC_GOVERNANCE_BOUNDS.warningsMax) {
    return reject(mediaAssetId, 'BOUNDS_EXCEEDED', `warnings exceeds ${MEDIA_SEMANTIC_GOVERNANCE_BOUNDS.warningsMax}.`);
  }
  const totalCandidates = countCandidates(proposal.academic) + countCandidates(proposal.creative) + countCandidates(proposal.content);
  if (totalCandidates > 40) {
    return reject(mediaAssetId, 'BOUNDS_EXCEEDED', `Total candidate count ${totalCandidates} exceeds bound.`);
  }

  // ── 6. Candidate shape ───────────────────────────────────────────────────
  for (const section of [proposal.academic, proposal.creative, proposal.content]) {
    if (!section || typeof section !== 'object' || Array.isArray(section)) {
      return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'Proposal section missing or malformed.');
    }
  }
  const arraysToCheck: unknown[] = [];
  const academicSection = proposal.academic as Record<string, unknown>;
  const creativeSection = proposal.creative as Record<string, unknown>;
  const CANDIDATE_ARRAY_KEYS = [
    'subjects', 'topics', 'concepts', 'skills', 'prerequisites', 'learningPurposes', 'misconceptionTargets',
    'curiosityTags', 'practicalApplications', 'adjacentDomains', 'broadeningDomains',
  ];
  for (const key of CANDIDATE_ARRAY_KEYS) {
    const value = academicSection[key] ?? creativeSection[key];
    if (value !== undefined && !Array.isArray(value)) {
      return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', `Proposal candidate array '${key}' is not an array.`);
    }
    if (Array.isArray(value)) arraysToCheck.push(value);
  }
  const families = creativeSection.families;
  if (families !== undefined && !Array.isArray(families)) {
    return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'creative.families must be an array.');
  }
  if (Array.isArray(families)) {
    for (const entry of families) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry) || typeof (entry as Record<string, unknown>).family !== 'string' || typeof (entry as Record<string, unknown>).confidence !== 'number') {
        return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'creative.families entry malformed.');
      }
    }
  }
  const pedagogicalRoles = (proposal.content as Record<string, unknown>).pedagogicalRoles;
  if (pedagogicalRoles !== undefined && !Array.isArray(pedagogicalRoles)) {
    return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'content.pedagogicalRoles must be an array.');
  }
  if (Array.isArray(pedagogicalRoles)) arraysToCheck.push(pedagogicalRoles);
  for (const arr of arraysToCheck) {
    const shapeError = assertCandidateShape(arr);
    if (shapeError) {
      return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', shapeError);
    }
  }

  // ── 7. Taxonomy IDs must be inside the backend-supplied closed set ───────
  const taxonomyIds = new Set<string>();
  collectTaxonomyIds(proposal, taxonomyIds);
  if (taxonomyIds.size > 0) {
    let context: Awaited<ReturnType<typeof buildClosedTaxonomyContext>>;
    try {
      const buildTaxonomy = input.dependencies?.buildTaxonomy ?? buildClosedTaxonomyContext;
      context = buildTaxonomy({
        curriculumFamily: input.curriculumFamily,
        versionId: input.curriculumVersionId,
      });
    } catch (error) {
      return failClosed(
        mediaAssetId,
        `Governance dependency failure while resolving closed taxonomy set: ${error instanceof Error ? error.message : 'unknown error'}.`,
      );
    }
    if (context.availability === 'UNAVAILABLE_SOURCE_ERROR') {
      return failClosed(
        mediaAssetId,
        `Governance dependency failure: closed taxonomy set unavailable (${context.unavailableReason ?? 'unknown'}).`,
      );
    }
    for (const id of taxonomyIds) {
      if (!isTaxonomyIdInClosedSet(context, id)) {
        return reject(
          mediaAssetId,
          'TAXONOMY_ID_NOT_IN_CLOSED_SET',
          `Taxonomy id '${id}' is not inside the backend-supplied closed set.`,
        );
      }
    }
  }

  // ── 8. Unauthorized authority claims ─────────────────────────────────────
  const strings: string[] = [];
  collectStringsDeep(proposal, strings);
  const forbiddenHit = strings.find((s) => {
    const normalized = normalizeForAuthorityMatch(s);
    return FORBIDDEN_PROPOSAL_AUTHORITY_CLAIMS.some((claim) => normalized.includes(claim));
  });
  if (forbiddenHit !== undefined) {
    return reject(
      mediaAssetId,
      'UNAUTHORIZED_AUTHORITY_CLAIM',
      'Proposal claims backend-owned authority (approval, rights, safety, curriculum, recommendation, mastery, or persistence).',
    );
  }

  // ── 9. Transcript provenance must be authorized ─────────────────────────
  const transcriptUsed = proposal.transcriptUsed;
  if (typeof transcriptUsed !== 'boolean') {
    return rejectInvalid(mediaAssetId, 'PROPOSAL_MALFORMED', 'transcriptUsed missing or not a boolean.');
  }
  if (transcriptUsed === true) {
    const analysisBasis = proposal.analysisBasis;
    if (analysisBasis !== 'METADATA_AND_AUTHORIZED_TRANSCRIPT') {
      return reject(
        mediaAssetId,
        'TRANSCRIPT_PROVENANCE_UNAUTHORIZED',
        'Proposal claims transcript use without the authorized analysis basis.',
      );
    }
    // AI-STREAM-1 R1/R9: transcript provenance authority is the canonical
    // media eligibility/rights decision only. The legacy
    // `metadata.mediaAiProcessing` flag is NEVER consulted as authority
    // (it may persist for migration/evidence compatibility, but grants
    // nothing). A proposal may not grant itself transcript provenance.
    let canonicalProof: boolean | null = null;
    if (typeof input.canonicalTranscriptAuthorized === 'boolean') {
      canonicalProof = input.canonicalTranscriptAuthorized;
    } else if (input.dependencies?.isTranscriptAuthorized) {
      try {
        canonicalProof = (await input.dependencies.isTranscriptAuthorized(asset)) === true;
      } catch (error) {
        return failClosed(
          mediaAssetId,
          `Governance dependency failure while resolving canonical transcript authorization: ${error instanceof Error ? error.message : 'unknown error'}.`,
        );
      }
    }
    if (canonicalProof !== true) {
      return reject(
        mediaAssetId,
        'TRANSCRIPT_PROVENANCE_UNAUTHORIZED',
        'Proposal claims transcript use but canonical transcript AI-processing authorization is absent.',
      );
    }
  }

  // ── 10. Accept ───────────────────────────────────────────────────────────
  return {
    verdict: 'accepted',
    reasonCode: 'PROPOSAL_ACCEPTED',
    detail: 'Proposal passed backend semantic governance (non-authoritative; not persisted).',
    mediaAssetId,
    acceptedByGate: MEDIA_SEMANTIC_GOVERNANCE_GATE,
    decidedAt: now().toISOString(),
    persisted: false,
  };
}
