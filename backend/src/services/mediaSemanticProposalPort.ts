// ─────────────────────────────────────────────────────────────────────────────
// Steadfast AI — Backend Semantic Proposal Port (R5)
// TASK: STEADFAST-BACKEND-MEDIA-AI-HANDOFF-01
//
// The single backend-owned seam through which runtime code may later invoke
// semantic resource intelligence. Pipeline:
//   resolve R2 authorization → build R3 projection → resolve R4 taxonomy →
//   hand to the injected proposer invoker (the accepted AI engine).
//
// LAWS:
// - Output is a PROPOSAL or a typed failure. It is never an approved
//   curriculum mapping, approved resource, recommendation, rights decision,
//   or mastery/evidence state.
// - This task injects NO provider and makes NO model call. Provider
//   activation is a later integration decision (AI-STREAM-1).
// - Failures are typed and never converted into a success.
// ─────────────────────────────────────────────────────────────────────────────

import type {
  ClosedTaxonomyContext,
  MediaSemanticProposal,
  MediaSemanticProposalResult,
  MediaSemanticProposerInvoker,
} from '../contracts/mediaAiHandoffContracts';
import { resolveMediaAiProcessingAuthorization, type CanonicalMediaRightsContext } from './mediaAiProcessingAuthorizationService';
import { buildPermittedMediaProjection } from './permittedMediaProjectionService';
import { buildClosedTaxonomyContext } from './mediaTaxonomyContextService';
import { getMediaAssetById } from './mediaAssetService';
import type { MediaAsset } from './mediaAssetService';
import type { CurriculumFamily } from './task022ContentGovernanceContracts';

/**
 * Resolve canonical media identity ONCE (R1 reuse, performance law), then run
 * the authorization → projection → taxonomy pipeline, then invoke the
 * injected proposer (if any). Independent reads run concurrently.
 */
export async function requestMediaSemanticProposal(args: {
  userId: string;
  mediaAssetId: string;
  /** Canonical curriculum family scoping the closed taxonomy set. */
  curriculumFamily: CurriculumFamily;
  curriculumVersionId?: string;
  /**
   * The proposer invocation seam. When omitted, the port resolves everything
   * up to the AI edge and returns a typed PROPOSER_UNAVAILABLE failure —
   * this task activates no provider.
   */
  proposer?: MediaSemanticProposerInvoker;
  /** Dependency suppliers — overridable for tests and alternate runtimes. */
  dependencies?: {
    getAsset?: typeof getMediaAssetById;
    /**
     * STREAM-3 closure: resolves the canonical rights context for the asset.
     * Explicit DI only — no invented provider activation. When absent or
     * resolving to null, the port fails closed via the typed authorization
     * failure below (never converted to success).
     */
    resolveRightsContext?: (asset: MediaAsset) => Promise<CanonicalMediaRightsContext | null>;
  };
}): Promise<MediaSemanticProposalResult> {
  try {
    const asset: MediaAsset | null = await (args.dependencies?.getAsset ?? getMediaAssetById)({
      userId: args.userId,
      assetId: args.mediaAssetId,
    }).catch((error: unknown) => {
      throw new CanonicalResourceReadError(
        error instanceof Error ? error.message : 'canonical resource read failed',
      );
    });

    if (!asset) {
      return {
        ok: false,
        code: 'AUTHORIZATION_DENIED',
        message: 'Canonical MediaAsset not found for this owner.',
        mediaAssetId: args.mediaAssetId,
      };
    }

    // R2 — explicit, fail-closed authorization from canonical rights only.
    // No metadata authority fallback. Missing/unresolvable rights fail closed.
    let rights: CanonicalMediaRightsContext | null = null;
    if (args.dependencies?.resolveRightsContext) {
      try {
        rights = await args.dependencies.resolveRightsContext(asset);
      } catch {
        rights = null;
      }
    }
    const authorization = resolveMediaAiProcessingAuthorization({
      asset,
      requestedScopes: ['metadata', 'transcript'],
      rights,
    });
    // AI-STREAM-1 R3/R4: the AI_PROCESS (metadata scope) gate controls
    // whether ANY model input may be built. A denied transcript scope does
    // NOT block metadata-only enrichment — the permitted projection omits
    // the transcript and the pipeline continues metadata-only.
    if (authorization.metadata.decision !== 'ALLOWED') {
      return {
        ok: false,
        code: 'AUTHORIZATION_UNRESOLVED',
        message: `AI processing authorization unresolved/denied (${authorization.metadata.reasonCode}${authorization.transcript.decision === 'UNRESOLVED_FAIL_CLOSED' ? `, ${authorization.transcript.reasonCode}` : ''}); fail closed.`,
        mediaAssetId: asset.id,
      };
    }

    // R3 — permitted projection (re-checks the transcript gate internally).
    const projectionResult = buildPermittedMediaProjection({ asset, authorization });
    if (!projectionResult.ok) {
      return {
        ok: false,
        code: 'PROJECTION_BUILD_FAILED',
        message: projectionResult.message,
        mediaAssetId: asset.id,
      };
    }

    // R4 — closed taxonomy context.
    let taxonomyContext: ClosedTaxonomyContext;
    try {
      taxonomyContext = buildClosedTaxonomyContext({
        curriculumFamily: args.curriculumFamily,
        versionId: args.curriculumVersionId,
      });
    } catch (error) {
      return {
        ok: false,
        code: 'TAXONOMY_UNAVAILABLE',
        message: error instanceof Error ? error.message : 'Taxonomy resolution failed.',
        mediaAssetId: asset.id,
      };
    }

    if (taxonomyContext.availability === 'UNAVAILABLE_SOURCE_ERROR') {
      return {
        ok: false,
        code: 'TAXONOMY_UNAVAILABLE',
        message: taxonomyContext.unavailableReason ?? 'Taxonomy context unavailable.',
        mediaAssetId: asset.id,
      };
    }

    // R5 edge — only an injected proposer crosses into AI territory.
    if (!args.proposer) {
      return {
        ok: false,
        code: 'PROPOSER_UNAVAILABLE',
        message: 'No semantic proposer is activated for this backend port (provider activation is a later integration decision).',
        mediaAssetId: asset.id,
      };
    }

    const proposal = await args.proposer({
      ...projectionResult.projection,
      taxonomyContext,
    });

    return { ok: true, proposal };
  } catch (error) {
    if (error instanceof CanonicalResourceReadError) {
      return {
        ok: false,
        code: 'CANONICAL_RESOURCE_READ_FAILED',
        message: `Governance-bound dependency failure while reading canonical MediaAsset: ${error.message}.`,
        mediaAssetId: args.mediaAssetId,
      };
    }
    return {
      ok: false,
      code: 'PROPOSER_FAILED',
      message: error instanceof Error ? error.message : 'Semantic proposal pipeline failed.',
      mediaAssetId: args.mediaAssetId,
    };
  }
}

class CanonicalResourceReadError extends Error {}
