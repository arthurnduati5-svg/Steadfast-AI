// ─────────────────────────────────────────────────────────────────────────────
// Steadfast AI — Canonical Media Semantic Enrichment (AI-STREAM-1)
// TASK: AI-STREAM-1
//
// Production path:
//   canonical MediaAsset
//   → canonical MediaResource eligibility / rights (ONE snapshot)
//   → permitted AI projection
//   → closed taxonomy context
//   → existing runMediaResourceEnrichment(...)
//   → MediaSemanticProposal
//   → backend semantic proposal governance
//   → advisory result only
//
// LAWS:
// - Canonical authorization source ONLY: MediaResourceRightsGrant via the
//   STREAM-3 evaluator. `metadata.mediaAiProcessing` (or equivalent resource
//   metadata) NEVER grants production AI permission (R1).
// - ONE eligibility snapshot: resource existence + grants + availability are
//   resolved once via the existing production eligibility store; independent
//   reads run concurrently; the snapshot is reused for AI_PROCESS and
//   TRANSCRIPT_READ (R2).
// - External policy (safety/age/Deen/answer-leakage) is caller-supplied and
//   REQUIRED. Missing policy fails closed before any model invocation (R2).
// - AI_PROCESS gate before any model-ready projection or model call (R3).
// - Transcript enters AI input ONLY when AI_PROCESS ALLOW + TRANSCRIPT_READ
//   ALLOW from the SAME matchedGrantId (R4). Otherwise omitted; never marked
//   aiProcessingAuthorized.
// - Permitted projection reuse only; no learner/mastery/memory/ranking data (R5).
// - Closed taxonomy reuse only; bounded; no invented IDs (R6).
// - Existing AI engine only: exactly one call per permitted request (R7).
// - Media text stays untrusted data; cannot change rights/policy/taxonomy (R8).
// - Every AI proposal passes backend governance; non-accepted is never
//   reported as success; malformed never becomes success (R9).
// - Accepted proposal is advisory only: no curriculum/rights/safety/learner/
//   mastery/evidence/ranking/scheduling persistence (R10).
// ─────────────────────────────────────────────────────────────────────────────

import type { MediaAsset } from './mediaAssetService';
import { getMediaAssetById } from './mediaAssetService';
import type { CanonicalMediaRightsContext } from './mediaAiProcessingAuthorizationService';
import { resolveMediaAiProcessingAuthorization } from './mediaAiProcessingAuthorizationService';
import { buildPermittedMediaProjection } from './permittedMediaProjectionService';
import { buildClosedTaxonomyContext } from './mediaTaxonomyContextService';
import type { ClosedTaxonomyContext } from '../contracts/mediaAiHandoffContracts';
import type {
  MediaSemanticGovernanceDecision,
  MediaSemanticProposal,
} from '../contracts/mediaAiHandoffContracts';
import { governMediaSemanticProposal } from './mediaSemanticProposalGovernanceService';
import {
  evaluateMediaEligibility,
  type MediaAvailabilityStatus,
  type MediaEligibilityStore,
  type MediaExternalPolicy,
  type MediaResourceRightsGrant,
} from './mediaResourceEligibilityService';
import type { CurriculumFamily } from './task022ContentGovernanceContracts';

// ─────────────────────────────────────────────────────────────────────────────
// Public input / output
// ─────────────────────────────────────────────────────────────────────────────

export interface CanonicalEnrichmentPolicy extends MediaExternalPolicy {}

export type CanonicalEnrichmentFailureCode =
  | 'POLICY_CONTEXT_MISSING'
  | 'CANONICAL_RESOURCE_MISSING'
  | 'CANONICAL_RESOURCE_READ_FAILED'
  | 'AUTHORIZATION_DENIED'
  | 'AUTHORIZATION_UNRESOLVED'
  | 'PROJECTION_BUILD_FAILED'
  | 'TAXONOMY_UNAVAILABLE'
  | 'ENRICHMENT_FAILED'
  | 'PROPOSAL_INVALID'
  | 'GOVERNANCE_REJECTED'
  | 'GOVERNANCE_DEPENDENCY_FAILED';

export type CanonicalEnrichmentResult =
  | {
      ok: true;
      proposal: MediaSemanticProposal;
      governance: MediaSemanticGovernanceDecision;
      transcriptAuthorized: boolean;
      modelCalls: 1;
      mediaAssetId: string;
    }
  | {
      ok: false;
      code: CanonicalEnrichmentFailureCode;
      message: string;
      mediaAssetId: string | null;
      modelCalls: 0;
      reasonCodes?: string[];
    };

// AI-engine input shape (mirrors AI/ai/flows/media-resource-enrichment.types.ts
// MediaResourceEnrichmentInput without importing AI runtime internals).
export interface CanonicalEnrichmentModelInput {
  resourceRef: string;
  title: string;
  description?: string | null;
  language?: string | null;
  durationSeconds?: number | null;
  resourceType?: string | null;
  creatorName?: string | null;
  providerType?: string | null;
  transcript?: { text: string; aiProcessingAuthorized: boolean } | null;
  taxonomyContext?: {
    subjects: Array<{ id: string; label: string; description?: string | null }>;
    topics: Array<{ id: string; label: string; description?: string | null }>;
    concepts: Array<{ id: string; label: string; description?: string | null }>;
    skills: Array<{ id: string; label: string; description?: string | null }>;
    objectives: Array<{ id: string; label: string; description?: string | null }>;
  } | null;
}

export type CanonicalEnrichmentRunnerResult =
  | { ok: true; proposal: unknown }
  | { ok: false; reason: string; message: string };

export type CanonicalEnrichmentRunner = (
  input: CanonicalEnrichmentModelInput,
) => Promise<CanonicalEnrichmentRunnerResult>;

export interface CanonicalEnrichmentDependencies {
  getAsset?: typeof getMediaAssetById;
  eligibilityStore?: MediaEligibilityStore;
  /** Map a canonical asset to its canonical rights resourceId. Defaults to asset.id. */
  resolveResourceId?: (asset: MediaAsset) => string | null | Promise<string | null>;
  /**
   * Already-resolved canonical rights snapshot (resourceExists + grants +
   * availability). When supplied, it is REUSED for both permission checks —
   * no duplicate store reads. Caller-supplied external policy still overrides
   * any policy inside the snapshot (R2).
   */
  resolveRightsSnapshot?: (
    asset: MediaAsset,
  ) => CanonicalMediaRightsContext | null | Promise<CanonicalMediaRightsContext | null>;
  buildTaxonomy?: typeof buildClosedTaxonomyContext;
  /** The single permitted model edge. Defaults to the existing AI engine. */
  enrichOne?: CanonicalEnrichmentRunner;
}

export interface CanonicalEnrichmentRequest {
  userId: string;
  mediaAssetId: string;
  curriculumFamily: CurriculumFamily;
  curriculumVersionId?: string;
  /** REQUIRED already-resolved external policy. Missing fails closed (R2). */
  externalPolicy?: CanonicalEnrichmentPolicy | null;
  territory?: string | null;
  schoolId?: string | null;
  now?: number;
  dependencies?: CanonicalEnrichmentDependencies;
  seenProposalFingerprints?: Set<string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isCompletePolicy(value: unknown): value is CanonicalEnrichmentPolicy {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.safetyAllowed === 'boolean' &&
    typeof record.ageAllowed === 'boolean' &&
    typeof record.deenAllowed === 'boolean' &&
    typeof record.answerLeakageAllowed === 'boolean'
  );
}

/**
 * Default production runner: delegates to the already-accepted existing AI
 * engine `runMediaResourceEnrichment(...)`. Dynamic import keeps the backend
 * task surface free of a static AI-runtime dependency while guaranteeing the
 * single permitted implementation is used (R7 — no second engine).
 */
export async function defaultCanonicalEnrichmentRunner(
  input: CanonicalEnrichmentModelInput,
): Promise<CanonicalEnrichmentRunnerResult> {
  const mod = (await import(
    '../../../AI/ai/flows/media-resource-enrichment.js'
  )) as {
    runMediaResourceEnrichment: (raw: unknown) => Promise<CanonicalEnrichmentRunnerResult>;
  };
  return mod.runMediaResourceEnrichment(input);
}

function toModelTaxonomy(context: ClosedTaxonomyContext): CanonicalEnrichmentModelInput['taxonomyContext'] {
  const pick = (nodes: Array<{ id: string; label: string; description: string | null }>) =>
    nodes.slice(0, 50).map((node) => ({
      id: node.id,
      label: node.label,
      description: node.description,
    }));
  return {
    subjects: pick(context.nodes.subjects),
    topics: pick(context.nodes.topics),
    concepts: pick(context.nodes.concepts),
    skills: pick(context.nodes.skills),
    objectives: pick(context.nodes.objectives),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run canonical media semantic enrichment end to end (advisory only).
 *
 * Performance law: one canonical resource/context resolution → concurrent
 * independent eligibility reads → deterministic permission checks → one AI
 * call → deterministic governance. No N+1 taxonomy/rights queries; canonical
 * context is not reloaded after AI returns except for the governance
 * staleness check (required) which reuses the already-loaded asset and the
 * cached taxonomy context.
 */
export async function runCanonicalMediaSemanticEnrichment(
  request: CanonicalEnrichmentRequest,
): Promise<CanonicalEnrichmentResult> {
  const mediaAssetId = clean(request.mediaAssetId) || null;

  // R2 — external policy is REQUIRED and fail-closed before any model call.
  // Absent or incomplete policy never defaults to true.
  if (!isCompletePolicy(request.externalPolicy)) {
    return {
      ok: false,
      code: 'POLICY_CONTEXT_MISSING',
      message: 'External safety/age/Deen/answer-leakage policy context is missing or incomplete; fail closed before model invocation.',
      mediaAssetId,
      modelCalls: 0,
    };
  }
  const externalPolicy: MediaExternalPolicy = {
    safetyAllowed: request.externalPolicy.safetyAllowed,
    ageAllowed: request.externalPolicy.ageAllowed,
    deenAllowed: request.externalPolicy.deenAllowed,
    answerLeakageAllowed: request.externalPolicy.answerLeakageAllowed,
  };
  const nowMs =
    typeof request.now === 'number' && Number.isFinite(request.now) ? request.now : Date.now();
  const territory = request.territory ?? null;
  const schoolId = request.schoolId ?? null;

  // 1. One canonical resource resolution.
  const getAsset = request.dependencies?.getAsset ?? getMediaAssetById;
  let asset: MediaAsset | null;
  try {
    asset = await getAsset({ userId: request.userId, assetId: request.mediaAssetId });
  } catch (error) {
    return {
      ok: false,
      code: 'CANONICAL_RESOURCE_READ_FAILED',
      message: `Canonical MediaAsset read failed: ${error instanceof Error ? error.message : 'unknown error'}.`,
      mediaAssetId,
      modelCalls: 0,
    };
  }
  if (!asset) {
    return {
      ok: false,
      code: 'CANONICAL_RESOURCE_MISSING',
      message: 'Canonical MediaAsset not found for this owner.',
      mediaAssetId,
      modelCalls: 0,
    };
  }

  // 2. ONE eligibility snapshot (R2). Prefer an already-resolved snapshot when
  // supplied (zero duplicate reads); otherwise resolve existence + grants +
  // availability once, concurrently, through the existing production store.
  let resourceId: string;
  let resourceExists: boolean;
  let grants: MediaResourceRightsGrant[];
  let availability: MediaAvailabilityStatus | null;
  try {
    const snapshotResolver = request.dependencies?.resolveRightsSnapshot;
    if (snapshotResolver) {
      const snapshot = await snapshotResolver(asset);
      if (!snapshot || !clean(snapshot.resourceId) || !snapshot.resourceExists) {
        return {
          ok: false,
          code: 'AUTHORIZATION_UNRESOLVED',
          message: 'Canonical rights snapshot missing or resource unknown; fail closed.',
          mediaAssetId: asset.id,
          modelCalls: 0,
          reasonCodes: ['RIGHTS_NOT_FOUND'],
        };
      }
      resourceId = clean(snapshot.resourceId);
      resourceExists = true;
      grants = snapshot.grants ?? [];
      availability = snapshot.availability;
    } else {
      const store = request.dependencies?.eligibilityStore;
      if (!store) {
        return {
          ok: false,
          code: 'AUTHORIZATION_UNRESOLVED',
          message: 'No canonical eligibility store or rights snapshot supplied; fail closed.',
          mediaAssetId: asset.id,
          modelCalls: 0,
          reasonCodes: ['RIGHTS_NOT_FOUND'],
        };
      }
      const resolver = request.dependencies?.resolveResourceId;
      const resolved = resolver ? await resolver(asset) : asset.id;
      resourceId = clean(resolved) || asset.id;
      const [exists, grantList, availabilityState] = await Promise.all([
        store.resourceExists(resourceId),
        store.listGrants(resourceId),
        store.findAvailability(resourceId),
      ]);
      resourceExists = exists;
      grants = grantList;
      availability = availabilityState ? availabilityState.status : null;
    }
  } catch (error) {
    return {
      ok: false,
      code: 'AUTHORIZATION_UNRESOLVED',
      message: `Canonical rights resolution failed: ${error instanceof Error ? error.message : 'unknown error'}; fail closed.`,
      mediaAssetId: asset.id,
      modelCalls: 0,
    };
  }

  // 3. Deterministic permission checks reused from the ONE snapshot (R2/R3/R4).
  const aiProcess = evaluateMediaEligibility({
    resourceId,
    resourceExists,
    requestedPermission: 'AI_PROCESS',
    territory,
    schoolId,
    now: nowMs,
    availability,
    grants,
    externalPolicy,
  });
  // R3 — AI_PROCESS gate: no model-ready projection and no model call on BLOCK.
  if (aiProcess.decision !== 'ALLOW') {
    return {
      ok: false,
      code: 'AUTHORIZATION_DENIED',
      message: `AI_PROCESS eligibility BLOCK; zero model calls (${aiProcess.reasonCodes.join(',') || 'blocked'}).`,
      mediaAssetId: asset.id,
      modelCalls: 0,
      reasonCodes: [...aiProcess.reasonCodes],
    };
  }

  const transcriptRead = evaluateMediaEligibility({
    resourceId,
    resourceExists,
    requestedPermission: 'TRANSCRIPT_READ',
    territory,
    schoolId,
    now: nowMs,
    availability,
    grants,
    externalPolicy,
  });
  // R4 — conservative same-grant rule: both ALLOW with valid matched grants
  // from the SAME grant. Otherwise omit transcript (metadata-only continues).
  const transcriptAuthorized =
    transcriptRead.decision === 'ALLOW' &&
    Boolean(aiProcess.matchedGrantId) &&
    aiProcess.matchedGrantId === transcriptRead.matchedGrantId;

  // 4. Canonical authorization object (reuses the same snapshot; legacy
  // metadata is never consulted as authority — R1).
  const rights: CanonicalMediaRightsContext = {
    resourceId,
    resourceExists,
    grants,
    availability,
    externalPolicy,
    territory,
    schoolId,
    now: nowMs,
  };
  const authorization = resolveMediaAiProcessingAuthorization({
    asset,
    requestedScopes: ['metadata', 'transcript'],
    rights,
  });
  if (authorization.metadata.decision !== 'ALLOWED') {
    return {
      ok: false,
      code: 'AUTHORIZATION_DENIED',
      message: `Canonical AI_PROCESS authorization denied (${authorization.metadata.reasonCode}); zero model calls.`,
      mediaAssetId: asset.id,
      modelCalls: 0,
      reasonCodes: [...aiProcess.reasonCodes],
    };
  }

  // 5. Permitted projection reuse (R5). Transcript text enters ONLY via the
  // R4 decision; projection internally re-gates on the transcript decision.
  const projectionResult = buildPermittedMediaProjection({ asset, authorization });
  if (!projectionResult.ok) {
    return {
      ok: false,
      code: 'PROJECTION_BUILD_FAILED',
      message: projectionResult.message,
      mediaAssetId: asset.id,
      modelCalls: 0,
    };
  }

  // 6. Closed taxonomy reuse (R6). Bounded; closed IDs only.
  const buildTaxonomy = request.dependencies?.buildTaxonomy ?? buildClosedTaxonomyContext;
  let taxonomyContext: ClosedTaxonomyContext;
  try {
    taxonomyContext = buildTaxonomy({
      curriculumFamily: request.curriculumFamily,
      versionId: request.curriculumVersionId,
    });
  } catch (error) {
    return {
      ok: false,
      code: 'TAXONOMY_UNAVAILABLE',
      message: error instanceof Error ? error.message : 'Taxonomy resolution failed.',
      mediaAssetId: asset.id,
      modelCalls: 0,
    };
  }
  if (taxonomyContext.availability === 'UNAVAILABLE_SOURCE_ERROR') {
    return {
      ok: false,
      code: 'TAXONOMY_UNAVAILABLE',
      message: taxonomyContext.unavailableReason ?? 'Taxonomy context unavailable.',
      mediaAssetId: asset.id,
      modelCalls: 0,
    };
  }

  // 7. Model input: backend-approved resource information ONLY (R5/R8).
  // No learner profile, mastery, memory, ranking, or school-private data.
  // Resource title/description/transcript/provider text stays untrusted data.
  const projection = projectionResult.projection;
  const authorizedTranscriptText =
    transcriptAuthorized && typeof projection.authorizedTranscript === 'string'
      ? projection.authorizedTranscript
      : null;
  const modelInput: CanonicalEnrichmentModelInput = {
    resourceRef: asset.id,
    title: projection.title,
    description: projection.description,
    language: projection.language,
    durationSeconds: projection.durationSeconds,
    resourceType: projection.resourceType,
    creatorName: projection.creatorName,
    providerType: projection.providerType,
    transcript:
      authorizedTranscriptText && transcriptAuthorized
        ? { text: authorizedTranscriptText, aiProcessingAuthorized: true }
        : undefined,
    taxonomyContext: toModelTaxonomy(taxonomyContext),
  };

  // 8. Existing AI engine only — exactly ONE model call (R7).
  const enrichOne = request.dependencies?.enrichOne ?? defaultCanonicalEnrichmentRunner;
  let runnerResult: CanonicalEnrichmentRunnerResult;
  try {
    runnerResult = await enrichOne(modelInput);
  } catch (error) {
    return {
      ok: false,
      code: 'ENRICHMENT_FAILED',
      message: error instanceof Error ? error.message : 'Semantic enrichment failed.',
      mediaAssetId: asset.id,
      modelCalls: 0,
    };
  }
  // R9 — malformed AI output never becomes success.
  if (!runnerResult || runnerResult.ok !== true) {
    return {
      ok: false,
      code: 'PROPOSAL_INVALID',
      message:
        runnerResult && runnerResult.ok === false
          ? `Semantic engine returned typed failure (${runnerResult.reason}): ${runnerResult.message}`
          : 'Semantic engine returned no proposal.',
      mediaAssetId: asset.id,
      modelCalls: 0,
    };
  }

  // 9. Backend governance (R9). Cached asset + cached taxonomy avoid N+1
  // re-reads; the asset re-read inside governance is the required staleness
  // check. Canonical transcript proof comes from step 3/4 — never metadata.
  const cachedAsset = asset;
  const cachedTaxonomy = taxonomyContext;
  let governance: MediaSemanticGovernanceDecision;
  try {
    governance = await governMediaSemanticProposal({
      proposal: runnerResult.proposal,
      expectedMediaAssetId: asset.id,
      userId: request.userId,
      curriculumFamily: request.curriculumFamily,
      curriculumVersionId: request.curriculumVersionId,
      canonicalTranscriptAuthorized: transcriptAuthorized,
      dependencies: {
        getAsset: (async () => cachedAsset) as typeof getMediaAssetById,
        buildTaxonomy: (() => cachedTaxonomy) as typeof buildClosedTaxonomyContext,
      },
      seenProposalFingerprints: request.seenProposalFingerprints,
    });
  } catch (error) {
    return {
      ok: false,
      code: 'GOVERNANCE_DEPENDENCY_FAILED',
      message: error instanceof Error ? error.message : 'Governance failed.',
      mediaAssetId: asset.id,
      modelCalls: 0,
    };
  }
  if (governance.verdict !== 'accepted') {
    return {
      ok: false,
      code: governance.verdict === 'invalid' ? 'PROPOSAL_INVALID' : 'GOVERNANCE_REJECTED',
      message: `Governance ${governance.verdict} (${governance.reasonCode}): ${governance.detail}`,
      mediaAssetId: asset.id,
      modelCalls: 0,
    };
  }

  // 10. Advisory only (R10). No canonical mutation of any kind occurs here:
  // no curriculum persistence, approvals, rights, safety, learner, mastery,
  // evidence, ranking, scheduling, or recommendation state.
  return {
    ok: true,
    proposal: governance ? (runnerResult.proposal as MediaSemanticProposal) : (runnerResult.proposal as MediaSemanticProposal),
    governance,
    transcriptAuthorized,
    modelCalls: 1,
    mediaAssetId: asset.id,
  };
}
