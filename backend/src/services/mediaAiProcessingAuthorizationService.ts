// ─────────────────────────────────────────────────────────────────────────────
// Steadfast AI — Media AI-Processing Authorization (R2)
// TASK: STEADFAST-BACKEND-MEDIA-AI-HANDOFF-01
// REPAIR: STEADFAST-MEDIA-STREAM-3-AI-PROCESS-AUTHORITY-UNIFICATION
//
// Produces an EXPLICIT backend-owned decision for whether a canonical
// MediaAsset (or a particular media datum) may be supplied to AI processing.
//
// CANONICAL OWNERSHIP LAW (STREAM-3 repair): the SINGLE media-rights
// authority is MediaResourceRightsGrant, evaluated through the canonical
// STREAM-3 rights evaluator (`evaluateMediaEligibility` in
// mediaResourceEligibilityService). This module is a compatibility /
// application boundary only: it maps canonical rights eligibility onto the
// compatible MediaAiProcessingAuthorization response. It MUST NOT
// independently decide rights from `MediaAsset.metadata`.
//
// Permission mapping (independently explicit, never implied):
// - `metadata` scope  → requires AI_PROCESS.
// - `transcript` scope → requires AI_PROCESS **and** TRANSCRIPT_READ.
// AI_PROCESS never implies TRANSCRIPT_READ; TRANSCRIPT_READ never implies
// AI_PROCESS.
//
// The legacy `metadata.mediaAiProcessing` flag shape is retained ONLY as a
// legacy read model (types + reader below). It is NEVER consulted as
// authority: a legacy `allow` with no canonical AI_PROCESS grant BLOCKS,
// and canonical grants ALLOW with no metadata flag present.
//
// FAIL-CLOSED: unresolvable canonical identity, unresolvable rights, missing
// AI_PROCESS, or (for transcript use) missing TRANSCRIPT_READ all BLOCK.
// There is no fallback to `metadata.mediaAiProcessing = allow`.
// ─────────────────────────────────────────────────────────────────────────────

import type { MediaAsset } from '../services/mediaAssetService';
import type {
  MediaAiProcessingAuthorization,
  MediaAiProcessingReasonCode,
  MediaAiScopeAuthorization,
  MediaAiProcessingAuthority,
} from '../contracts/mediaAiHandoffContracts';
import {
  evaluateMediaEligibility,
  type MediaAvailabilityStatus,
  type MediaExternalPolicy,
  type MediaResourceRightsGrant,
} from './mediaResourceEligibilityService';

export type MediaAiProcessingFlagValue = 'allow' | 'deny';

export interface MediaAiProcessingFlag {
  metadata?: MediaAiProcessingFlagValue;
  transcript?: MediaAiProcessingFlagValue;
}

// ─────────────────────────────────────────────────────────────────────────────
// Legacy compatibility read model. Retained so existing stored metadata keeps
// parsing; NEVER consulted by the authorization decision below.
// ─────────────────────────────────────────────────────────────────────────────

const FLAG_VALUES = new Set<MediaAiProcessingFlagValue>(['allow', 'deny']);

export function readLegacyProcessingFlag(asset: MediaAsset): { flag: MediaAiProcessingFlag | null; recordId: string } {
  const raw = asset.metadata?.mediaAiProcessing;
  if (
    raw &&
    typeof raw === 'object' &&
    !Array.isArray(raw) &&
    Object.values(raw as Record<string, unknown>).some((v) => typeof v === 'string' && FLAG_VALUES.has(v as MediaAiProcessingFlagValue))
  ) {
    return { flag: raw as MediaAiProcessingFlag, recordId: `metadata.mediaAiProcessing@${asset.id}` };
  }
  return { flag: null, recordId: `none@${asset.id}` };
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical rights input (STREAM-3). Supplied by the caller from the
// canonical MediaResource + MediaResourceRightsGrant store.
// ─────────────────────────────────────────────────────────────────────────────

export interface CanonicalMediaRightsContext {
  resourceId: string | null;
  resourceExists: boolean;
  grants: MediaResourceRightsGrant[];
  availability: MediaAvailabilityStatus | null;
  externalPolicy?: MediaExternalPolicy;
  territory?: string | null;
  schoolId?: string | null;
  now?: number;
}

const DENY_ALL_EXTERNAL_POLICY: MediaExternalPolicy = {
  safetyAllowed: false,
  ageAllowed: false,
  deenAllowed: false,
  answerLeakageAllowed: false,
};

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function unresolvedScope(
  scope: 'metadata' | 'transcript',
  reasonCode: MediaAiProcessingReasonCode,
  authorityRecordId: string,
): MediaAiScopeAuthorization {
  const authority: MediaAiProcessingAuthority = 'default_deny_no_authority_record';
  return {
    scope,
    decision: 'UNRESOLVED_FAIL_CLOSED',
    reasonCode,
    authorizedAt: null,
    authority,
    authorityRecordId,
  };
}

function resolveCanonicalScope(args: {
  scope: 'metadata' | 'transcript';
  asset: MediaAsset;
  rights: CanonicalMediaRightsContext | null | undefined;
  nowMs: number;
  nowIso: string;
}): MediaAiScopeAuthorization {
  const { scope, asset, rights } = args;
  const resourceId = rights ? clean(rights.resourceId) : '';

  // Fail closed: no canonical identity or no canonical resource → BLOCK.
  // Legacy metadata is never consulted here.
  if (!rights || !resourceId) {
    return unresolvedScope(scope, 'MEDIA_RESOURCE_MISSING', `rights:none@${asset.id}`);
  }
  if (!rights.resourceExists) {
    return unresolvedScope(scope, 'MEDIA_RESOURCE_MISSING', `rights:${resourceId}`);
  }

  // Independently explicit permissions: transcript AI use needs BOTH
  // AI_PROCESS and TRANSCRIPT_READ from the SAME canonical grant.
  // Each permission is evaluated on its own against the canonical grants;
  // fragments are never combined across grants (STREAM-3 evaluator is
  // atomic per grant, and this boundary additionally requires a single
  // shared matchedGrantId for the transcript scope — AI-STREAM-1 R4).
  const requiredPermissions = scope === 'metadata' ? ['AI_PROCESS'] : ['AI_PROCESS', 'TRANSCRIPT_READ'];
  const externalPolicy = rights.externalPolicy ?? DENY_ALL_EXTERNAL_POLICY;
  let matchedGrantId: string | null = null;
  for (const permission of requiredPermissions) {
    const result = evaluateMediaEligibility({
      resourceId,
      resourceExists: true,
      requestedPermission: permission,
      territory: rights.territory,
      schoolId: rights.schoolId,
      now: args.nowMs,
      availability: rights.availability,
      grants: rights.grants ?? [],
      externalPolicy,
    });
    if (result.decision !== 'ALLOW') {
      const authority: MediaAiProcessingAuthority = 'rights_owner_record';
      return {
        scope,
        decision: 'DENIED',
        reasonCode: 'MEDIA_DENIED_BY_RIGHTS_GRANT',
        authorizedAt: null,
        authority,
        authorityRecordId: result.matchedGrantId ?? `rights:${resourceId}`,
      };
    }
    if (result.matchedGrantId) {
      if (matchedGrantId === null) {
        matchedGrantId = result.matchedGrantId;
      } else if (matchedGrantId !== result.matchedGrantId) {
        // Conservative production rule (AI-STREAM-1 R4): AI_PROCESS from one
        // grant combined with TRANSCRIPT_READ from a different grant must
        // NOT authorize transcript use. Omit transcript (DENY transcript
        // scope) rather than combining incompatible rights fragments.
        const authority: MediaAiProcessingAuthority = 'rights_owner_record';
        return {
          scope,
          decision: 'DENIED',
          reasonCode: 'MEDIA_DENIED_BY_RIGHTS_GRANT',
          authorizedAt: null,
          authority,
          authorityRecordId: `rights:${resourceId}`,
        };
      }
    }
  }

  const authority: MediaAiProcessingAuthority = 'rights_owner_record';
  return {
    scope,
    decision: 'ALLOWED',
    reasonCode: 'MEDIA_AUTHORIZED_BY_RIGHTS_GRANT',
    authorizedAt: args.nowIso,
    authority,
    authorityRecordId: matchedGrantId ?? `rights:${resourceId}`,
  };
}

/**
 * Resolve the AI-processing authorization for a canonical MediaAsset from the
 * SINGLE canonical rights authority (MediaResourceRightsGrant via the
 * STREAM-3 evaluator). Deterministic, fail-closed, and audit-sufficient.
 * Response shape is unchanged for existing consumers.
 */
export function resolveMediaAiProcessingAuthorization(args: {
  asset: MediaAsset;
  requestedScopes: Array<'metadata' | 'transcript'>;
  rights?: CanonicalMediaRightsContext | null;
}): MediaAiProcessingAuthorization {
  const nowIso = new Date().toISOString();
  const nowMs =
    typeof args.rights?.now === 'number' && Number.isFinite(args.rights.now) ? args.rights.now : Date.now();

  const wantsMetadata = args.requestedScopes.includes('metadata');
  const wantsTranscript = args.requestedScopes.includes('transcript');

  const metadata = wantsMetadata
    ? resolveCanonicalScope({ scope: 'metadata', asset: args.asset, rights: args.rights, nowMs, nowIso })
    : unresolvedScope('metadata', 'MEDIA_UNRESOLVED_NO_AUTHORITY_RECORD', `rights:unrequested@${args.asset.id}`);

  const transcript = wantsTranscript
    ? resolveCanonicalScope({ scope: 'transcript', asset: args.asset, rights: args.rights, nowMs, nowIso })
    : unresolvedScope('transcript', 'MEDIA_UNRESOLVED_NO_AUTHORITY_RECORD', `rights:unrequested@${args.asset.id}`);

  return {
    mediaAssetId: args.asset.id,
    metadata,
    transcript,
    decidedAt: nowIso,
    allScopesAllowed:
      (!wantsMetadata || metadata.decision === 'ALLOWED') &&
      (!wantsTranscript || transcript.decision === 'ALLOWED'),
  };
}
