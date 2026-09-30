// ─────────────────────────────────────────────────────────────────────────────
// Steadfast AI — Permitted Media Projection (R3)
// TASK: STEADFAST-BACKEND-MEDIA-AI-HANDOFF-01
//
// Builds ONE bounded, provider-neutral projection containing ONLY media
// information approved for semantic analysis. Rules:
// - Identity is canonical backend identity only. No request-body authority.
// - NO learner profiling or protected learner state enters this projection.
// - Transcript text enters ONLY when the R2 transcript decision is ALLOWED.
// - Canonical resource reference reuses the existing MediaAsset owner (R1).
// ─────────────────────────────────────────────────────────────────────────────

import type { MediaAsset } from '../services/mediaAssetService';
import type {
  MediaAiProcessingAuthorization,
  PermittedMediaProjection,
} from '../contracts/mediaAiHandoffContracts';

export type PermittedProjectionFailureCode =
  | 'RESOURCE_MISSING'
  | 'METADATA_NOT_AUTHORIZED';

export type PermittedProjectionResult =
  | { ok: true; projection: PermittedMediaProjection }
  | { ok: false; code: PermittedProjectionFailureCode; message: string };

function bounded(value: string | null | undefined, max: number): string | null {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function boundedInt(value: number | null | undefined): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;
}

/**
 * Build the permitted media projection from the canonical MediaAsset and the
 * already-resolved R2 authorization. Transcript inclusion is gated strictly on
 * the explicit ALLOWED transcript decision — presence on the asset is never
 * sufficient.
 */
export function buildPermittedMediaProjection(args: {
  asset: MediaAsset;
  authorization: MediaAiProcessingAuthorization;
}): PermittedProjectionResult {
  const { asset, authorization } = args;

  if (!asset || !asset.id) {
    return { ok: false, code: 'RESOURCE_MISSING', message: 'Canonical MediaAsset not available.' };
  }

  // Fail closed: metadata processing must be explicitly allowed before ANY
  // AI-bound projection is produced.
  if (authorization.metadata.decision !== 'ALLOWED') {
    return {
      ok: false,
      code: 'METADATA_NOT_AUTHORIZED',
      message: `Metadata AI processing is not authorized (${authorization.metadata.reasonCode}); projection withheld (fail closed).`,
    };
  }

  const transcriptAllowed = authorization.transcript.decision === 'ALLOWED';
  const authorizationBindingValid =
    authorization.mediaAssetId === asset.id;

  return {
    ok: true,
    projection: {
      resourceRef: {
        mediaAssetId: asset.id,
        ownedBy: 'backend.mediaAssetService',
      },
      title: bounded(asset.title, 240) ?? 'Untitled media asset',
      description: bounded(asset.summary, 4000),
      language: bounded(asset.language, 40),
      durationSeconds: boundedInt(asset.durationSec),
      resourceType: bounded(asset.assetKind, 80),
      creatorName: null,
      providerType: bounded(asset.videoProvider, 80),
      // THE GATE: transcript present on the asset means nothing here.
      authorizedTranscript: transcriptAllowed && authorizationBindingValid
        ? bounded(asset.transcript, 30000)
        : null,
      authorization,
    },
  };
}
