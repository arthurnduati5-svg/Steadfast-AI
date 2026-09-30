// ─────────────────────────────────────────────────────────────
// Steadfast AI — AI-STREAM-2 Resource-Aware Tutor Context (SUPPORTING ONLY)
//
// Converts: canonical media resource → authorized advisory semantic context
// → bounded tutor-specialist context. No persistence. No learner-facing
// generation. No mastery/evidence writes. The canonical tutor turn
// (orchestrateTutorTurn → composePedagogyPrompt → generateTutorMessage →
// validateOrchestrationOutput) remains the sole learner-facing owner.
//
// Dependency law (AI-STREAM-2 production wiring):
// - Canonical owners are Git-tracked: mediaResourceRegistryService,
//   mediaResourceEligibilityService, mediaExternalPolicyService,
//   mediaAiProcessingAuthorizationService,
//   mediaCanonicalSemanticEnrichmentService, mediaAssetService.
// - createProductionMediaResourceTutorDependencies composes ONLY those
//   existing owners (no duplicate rights/policy/enrichment logic).
// - Tests inject memory stores + counting spies through the same factory;
//   ALLOW is proven through real canonical evaluators, never by injecting
//   a pre-approved verdict.
// ─────────────────────────────────────────────────────────────

import {
  findMediaAssetByVideoReference,
  getMediaAssetById,
  type MediaAsset,
} from '../mediaAssetService';
import {
  resolveRegistryIdentityForLegacyAsset,
  buildCanonicalKey,
  prismaMediaResourceStore,
  type MediaResource,
  type MediaResourceStore,
} from '../mediaResourceRegistryService';
import {
  prismaMediaEligibilityStore,
  type MediaEligibilityStore,
} from '../mediaResourceEligibilityService';
import {
  resolveMediaExternalPolicy,
  extractResourceGrades,
  prismaMediaClassificationStore,
  type MediaClassificationStore,
} from '../mediaExternalPolicyService';
import {
  resolveMediaAiProcessingAuthorization,
  type CanonicalMediaRightsContext,
} from '../mediaAiProcessingAuthorizationService';
import {
  runCanonicalMediaSemanticEnrichment,
  type CanonicalEnrichmentRunner,
  type CanonicalEnrichmentPolicy,
} from '../mediaCanonicalSemanticEnrichmentService';

export type MediaResourceTutorStatus =
  | 'semantic_ready'
  | 'safe_session_fallback'
  | 'blocked'
  | 'unavailable';

export type CurriculumFamily =
  | 'cambridge_academic'
  | 'madrasa_deen'
  | 'school_custom'
  | 'system_seed';

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
  status: MediaResourceTutorStatus;
  mediaAssetId?: string;
  semantic?: PreparedMediaResourceTutorSemantic;
  fallbackSummary?: string | null;
  reasonCode?: string;
}

/** Minimal structural asset view — never carries transcript or raw proposal. */
export interface MinimalMediaAssetRef {
  id: string;
  updatedAt: string;
}

export interface ResourceExternalPolicy {
  safetyAllowed: boolean;
  ageAllowed: boolean;
  deenAllowed: boolean;
  answerLeakageAllowed: boolean;
}

export interface ResourceRightsVerdict {
  aiProcessAllowed: boolean;
  transcriptReadAllowed: boolean;
  availabilityKnown: boolean;
  reasonCode?: string;
}

export type AssetResolution =
  | { outcome: 'resolved'; asset: MinimalMediaAssetRef }
  | { outcome: 'not_found'; reasonCode: string }
  | { outcome: 'ambiguous'; reasonCode: string };

/** Raw advisory proposal supplied by the (injected) governed enrichment runner. */
export interface RawSemanticProposal {
  proposalVersion?: string;
  summary?: string;
  keyPoints?: string[];
  subjects?: string[];
  topics?: string[];
  concepts?: string[];
  skills?: string[];
  prerequisites?: string[];
  misconceptionTargets?: string[];
  pedagogicalRoles?: string[];
  difficulty?: string | null;
  confidence?: number;
  warnings?: string[];
}

export type EnrichmentResult =
  | { ok: true; proposal: RawSemanticProposal; transcriptUsed: boolean }
  | { ok: false; code: string };

export interface MediaResourceTutorDependencies {
  resolveAsset?: (ref: ActiveVideoRef) => Promise<AssetResolution>;
  checkRights?: (asset: MinimalMediaAssetRef) => Promise<ResourceRightsVerdict | null>;
  resolvePolicy?: (asset: MinimalMediaAssetRef) => Promise<ResourceExternalPolicy | null>;
  enrich?: (args: {
    asset: MinimalMediaAssetRef;
    policy: ResourceExternalPolicy;
    curriculumFamily: CurriculumFamily;
    transcriptAllowed: boolean;
  }) => Promise<EnrichmentResult>;
  now?: () => number;
}

export interface PrepareMediaResourceTutorInput {
  schoolId: string;
  studentId: string;
  userId: string;
  activeVideoRef: ActiveVideoRef | null;
  curriculumFamily: CurriculumFamily | null;
  curriculumVersionId?: string | null;
  fallbackSummary?: string | null;
  dependencies?: MediaResourceTutorDependencies;
}

// ── Bounds (frozen R6) ──────────────────────────────────────────
const MAX_SUMMARY = 700;
const MAX_KEY_POINTS = 5;
const MAX_KEY_POINT_LEN = 180;
const MAX_LABEL_ITEMS = 4;
const MAX_LABEL_LEN = 120;
const MAX_ROLES = 4;
const MAX_WARNINGS = 4;
const MAX_WARNING_LEN = 180;
export const MEDIA_RESOURCE_TUTOR_CACHE_MAX = 128;
export const MEDIA_RESOURCE_TUTOR_CACHE_TTL_MS = 10 * 60 * 1000;

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function boundText(value: unknown, max: number): string {
  const text = clean(value);
  return text.slice(0, max);
}

function boundList(values: unknown, maxItems: number, maxLen: number): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim().slice(0, maxLen))
    .slice(0, maxItems);
}

function isCompletePolicy(value: unknown): value is ResourceExternalPolicy {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.safetyAllowed === 'boolean' &&
    typeof record.ageAllowed === 'boolean' &&
    typeof record.deenAllowed === 'boolean' &&
    typeof record.answerLeakageAllowed === 'boolean'
  );
}

// ── Cache (acceleration only, never canonical state) ────────────
interface CacheEntry {
  semantic: PreparedMediaResourceTutorSemantic;
  storedAt: number;
}

const semanticCache = new Map<string, CacheEntry>();
const singleFlight = new Map<string, Promise<PreparedMediaResourceTutorContext>>();

export function buildMediaResourceCacheKey(args: {
  schoolId: string;
  studentId: string;
  mediaAssetId: string;
  assetUpdatedAt: string;
  curriculumFamily: CurriculumFamily;
  curriculumVersionId?: string | null;
}): string {
  return [
    clean(args.schoolId),
    clean(args.studentId),
    clean(args.mediaAssetId),
    clean(args.assetUpdatedAt),
    clean(args.curriculumFamily),
    clean(args.curriculumVersionId) || 'none',
  ].join('|');
}

export function clearMediaResourceTutorCache(): void {
  semanticCache.clear();
  singleFlight.clear();
}

export function getMediaResourceTutorCacheSize(): number {
  return semanticCache.size;
}

function readCacheEntry(key: string, now: number): PreparedMediaResourceTutorSemantic | null {
  const entry = semanticCache.get(key);
  if (!entry) return null;
  if (now - entry.storedAt > MEDIA_RESOURCE_TUTOR_CACHE_TTL_MS) {
    semanticCache.delete(key);
    return null;
  }
  return entry.semantic;
}

function storeCacheEntry(key: string, semantic: PreparedMediaResourceTutorSemantic, now: number): void {
  if (semanticCache.has(key)) semanticCache.delete(key);
  // Evict expired entries on access/insert.
  for (const [k, v] of semanticCache) {
    if (now - v.storedAt > MEDIA_RESOURCE_TUTOR_CACHE_TTL_MS) semanticCache.delete(k);
  }
  while (semanticCache.size >= MEDIA_RESOURCE_TUTOR_CACHE_MAX) {
    const oldest = semanticCache.keys().next();
    if (oldest.done) break;
    semanticCache.delete(oldest.value);
  }
  semanticCache.set(key, { semantic, storedAt: now });
}

// ── Trigger gate (frozen R16 — canonical signals only) ──────────
export function shouldPrepareResourceContext(resolvedIntent: {
  primaryIntent?: string | null;
  task?: { taskKind?: string | null } | null;
} | null | undefined): boolean {
  if (!resolvedIntent) return false;
  if (resolvedIntent.primaryIntent === 'video_help') return true;
  if (resolvedIntent.task?.taskKind === 'explain_video_context') return true;
  return false;
}

// ── Proposal projection (bounded labels only, never raw) ────────
export function projectProposalToSemantic(
  proposal: RawSemanticProposal,
  transcriptUsed: boolean,
): PreparedMediaResourceTutorSemantic {
  const warnings = boundList(proposal.warnings, MAX_WARNINGS, MAX_WARNING_LEN);
  return {
    proposalVersion: clean(proposal.proposalVersion) || 'v1',
    analysisBasis: transcriptUsed ? 'METADATA_AND_AUTHORIZED_TRANSCRIPT' : 'METADATA_ONLY',
    transcriptUsed,
    summary: boundText(proposal.summary, MAX_SUMMARY),
    keyPoints: boundList(proposal.keyPoints, MAX_KEY_POINTS, MAX_KEY_POINT_LEN),
    subjects: boundList(proposal.subjects, MAX_LABEL_ITEMS, MAX_LABEL_LEN),
    topics: boundList(proposal.topics, MAX_LABEL_ITEMS, MAX_LABEL_LEN),
    concepts: boundList(proposal.concepts, MAX_LABEL_ITEMS, MAX_LABEL_LEN),
    skills: boundList(proposal.skills, MAX_LABEL_ITEMS, MAX_LABEL_LEN),
    prerequisites: boundList(proposal.prerequisites, MAX_LABEL_ITEMS, MAX_LABEL_LEN),
    misconceptionTargets: boundList(proposal.misconceptionTargets, MAX_LABEL_ITEMS, MAX_LABEL_LEN),
    pedagogicalRoles: boundList(proposal.pedagogicalRoles, MAX_ROLES, MAX_LABEL_LEN),
    difficulty: clean(proposal.difficulty) ? clean(proposal.difficulty).slice(0, MAX_LABEL_LEN) : null,
    confidence: typeof proposal.confidence === 'number' && Number.isFinite(proposal.confidence)
      ? Math.min(1, Math.max(0, proposal.confidence))
      : 0.5,
    warnings,
  };
}

function toFallback(
  reasonCode: string,
  fallbackSummary?: string | null,
  mediaAssetId?: string,
): PreparedMediaResourceTutorContext {
  if (clean(fallbackSummary)) {
    return {
      status: 'safe_session_fallback',
      mediaAssetId,
      fallbackSummary: boundText(fallbackSummary, MAX_SUMMARY),
      reasonCode,
    };
  }
  return { status: 'unavailable', mediaAssetId, reasonCode };
}

// ── Main preparation ────────────────────────────────────────────
export async function prepareMediaResourceTutorContext(
  input: PrepareMediaResourceTutorInput,
): Promise<PreparedMediaResourceTutorContext> {
  const deps = input.dependencies ?? {};
  const nowFn = deps.now ?? (() => Date.now());
  const now = nowFn();
  const fallbackSummary = clean(input.fallbackSummary) ? boundText(input.fallbackSummary, MAX_SUMMARY) : null;

  const ref = input.activeVideoRef;
  if (!ref || !clean(ref.sessionVideoId)) {
    return { status: 'unavailable', reasonCode: 'NO_ACTIVE_VIDEO' };
  }
  if (!input.curriculumFamily) {
    return toFallback('CURRICULUM_UNRESOLVED', fallbackSummary);
  }

  // Deterministic canonical resolution via injected resolver (R5).
  if (!deps.resolveAsset) {
    return toFallback('RESOURCE_RESOLVER_UNAVAILABLE', fallbackSummary);
  }
  let resolution: AssetResolution;
  try {
    resolution = await deps.resolveAsset(ref);
  } catch {
    return toFallback('RESOURCE_READ_FAILED', fallbackSummary);
  }
  if (resolution.outcome === 'not_found') {
    return toFallback(resolution.reasonCode || 'RESOURCE_NOT_FOUND', fallbackSummary);
  }
  if (resolution.outcome === 'ambiguous') {
    return toFallback(resolution.reasonCode || 'RESOURCE_AMBIGUOUS', fallbackSummary);
  }
  const asset = resolution.asset;
  const cacheKey = buildMediaResourceCacheKey({
    schoolId: input.schoolId,
    studentId: input.studentId,
    mediaAssetId: asset.id,
    assetUpdatedAt: asset.updatedAt,
    curriculumFamily: input.curriculumFamily,
    curriculumVersionId: input.curriculumVersionId ?? null,
  });

  // Cache-hit path still gates on CURRENT rights + policy (R11).
  const cached = readCacheEntry(cacheKey, now);
  if (cached) {
    const [rights, policy] = await Promise.all([
      deps.checkRights ? deps.checkRights(asset).catch(() => null) : Promise.resolve(null),
      deps.resolvePolicy ? deps.resolvePolicy(asset).catch(() => null) : Promise.resolve(null),
    ]);
    if (!rights || !rights.aiProcessAllowed || !rights.availabilityKnown) {
      return toFallback(rights?.reasonCode || 'RIGHTS_REVOKED_OR_UNKNOWN', fallbackSummary, asset.id);
    }
    if (cached.transcriptUsed && !rights.transcriptReadAllowed) {
      return toFallback('TRANSCRIPT_RIGHT_REVOKED', fallbackSummary, asset.id);
    }
    if (!isCompletePolicy(policy)) {
      return toFallback('POLICY_MISSING', fallbackSummary, asset.id);
    }
    if (!policy.safetyAllowed || !policy.ageAllowed || !policy.deenAllowed || !policy.answerLeakageAllowed) {
      return toFallback('POLICY_BLOCKED', fallbackSummary, asset.id);
    }
    return { status: 'semantic_ready', mediaAssetId: asset.id, semantic: cached };
  }

  // Single-flight collapse for concurrent identical misses (R13).
  const inflight = singleFlight.get(cacheKey);
  if (inflight) return inflight;

  const operation: Promise<PreparedMediaResourceTutorContext> = (async () => {
    // Current authorization gates every use (R7) — before any model call.
    const [rights, policy] = await Promise.all([
      deps.checkRights ? deps.checkRights(asset).catch(() => null) : Promise.resolve(null),
      deps.resolvePolicy ? deps.resolvePolicy(asset).catch(() => null) : Promise.resolve(null),
    ]);
    if (!rights || !rights.aiProcessAllowed || !rights.availabilityKnown) {
      return toFallback(rights?.reasonCode || 'AI_PROCESS_BLOCKED', fallbackSummary, asset.id);
    }
    if (!isCompletePolicy(policy)) {
      return toFallback('POLICY_MISSING', fallbackSummary, asset.id);
    }
    if (!policy.safetyAllowed || !policy.ageAllowed || !policy.deenAllowed || !policy.answerLeakageAllowed) {
      return toFallback('POLICY_BLOCKED', fallbackSummary, asset.id);
    }
    if (!deps.enrich) {
      return toFallback('ENRICHMENT_UNAVAILABLE', fallbackSummary, asset.id);
    }
    // Transcript enters enrichment ONLY when same-grant TRANSCRIPT_READ holds (R7F/G).
    const transcriptAllowed = rights.transcriptReadAllowed === true;
    let result: EnrichmentResult;
    try {
      result = await deps.enrich({
        asset,
        policy,
        curriculumFamily: input.curriculumFamily as CurriculumFamily,
        transcriptAllowed,
      });
    } catch {
      return toFallback('ENRICHMENT_FAILED', fallbackSummary, asset.id);
    }
    if (!result.ok) {
      return toFallback(result.code || 'ENRICHMENT_FAILED', fallbackSummary, asset.id);
    }
    // A transcript-derived proposal without transcript rights is rejected.
    if (result.transcriptUsed && !transcriptAllowed) {
      return toFallback('TRANSCRIPT_UNAUTHORIZED', fallbackSummary, asset.id);
    }
    const semantic = projectProposalToSemantic(result.proposal, result.transcriptUsed);
    // Stale guard (R28O): store only under the requesting version key.
    storeCacheEntry(cacheKey, semantic, nowFn());
    return { status: 'semantic_ready', mediaAssetId: asset.id, semantic };
  })();

  singleFlight.set(cacheKey, operation);
  try {
    return await operation;
  } finally {
    singleFlight.delete(cacheKey);
  }
}

// ── Bounded observability (R26 — never raw content) ─────────────
export interface MediaResourceTutorTelemetry {
  requestId: string;
  mediaAssetId: string | null;
  videoContextStatus: string;
  semanticContextStatus: MediaResourceTutorStatus;
  semanticCacheHit: boolean;
  semanticEnrichmentAttempted: boolean;
  semanticEnrichmentSucceeded: boolean;
  semanticTranscriptUsed: boolean;
  specialistKind: string;
  specialistStatus: string;
  degradationReasonCode: string | null;
}

export function buildMediaResourceTutorTelemetry(args: {
  requestId: string;
  mediaAssetId?: string | null;
  videoContextStatus?: string;
  context: PreparedMediaResourceTutorContext;
  cacheHit: boolean;
  enrichmentAttempted: boolean;
}): MediaResourceTutorTelemetry {
  const context = args.context;
  return {
    requestId: clean(args.requestId),
    mediaAssetId: clean(args.mediaAssetId) || clean(context.mediaAssetId) || null,
    videoContextStatus: clean(args.videoContextStatus) || 'unknown',
    semanticContextStatus: context.status,
    semanticCacheHit: args.cacheHit === true,
    semanticEnrichmentAttempted: args.enrichmentAttempted === true,
    semanticEnrichmentSucceeded: context.status === 'semantic_ready',
    semanticTranscriptUsed: context.semantic?.transcriptUsed === true,
    specialistKind: 'video',
    specialistStatus: context.status === 'semantic_ready' ? 'ready' : 'degraded',
    degradationReasonCode: clean(context.reasonCode) || null,
  };
}

// ── Production dependency factory (AI-STREAM-2 final wiring) ─────
// Composes ONLY existing canonical owners. One factory instance serves one
// tutor turn: the rights/availability/policy snapshot is memoized per
// MediaAsset and reused by checkRights, resolvePolicy gating, and the
// governed enrichment call (resolveRightsSnapshot) — no second grants or
// availability reads.
export interface ProductionMediaResourceTutorArgs {
  userId: string;
  schoolId: string;
  learnerGrade?: string | null;
  curriculumVersionId?: string | null;
  now?: number;
  resourceStore?: MediaResourceStore;
  eligibilityStore?: MediaEligibilityStore;
  classificationStore?: MediaClassificationStore;
  findAssetByVideoRef?: typeof findMediaAssetByVideoReference;
  getAssetById?: typeof getMediaAssetById;
  enrichmentRunner?: CanonicalEnrichmentRunner;
}

interface ProductionBundle {
  fullAsset: MediaAsset;
  resource: MediaResource;
  policy: CanonicalEnrichmentPolicy;
  snapshot: CanonicalMediaRightsContext;
}

function candidateLabels(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  for (const entry of values) {
    if (entry && typeof entry === 'object' && typeof (entry as { label?: unknown }).label === 'string') {
      const label = ((entry as { label: string }).label || '').trim();
      if (label) out.push(label);
    } else if (typeof entry === 'string' && entry.trim()) {
      out.push(entry.trim());
    }
  }
  return out;
}

export function createProductionMediaResourceTutorDependencies(
  args: ProductionMediaResourceTutorArgs,
): MediaResourceTutorDependencies {
  const userId = clean(args.userId);
  const schoolId = clean(args.schoolId);
  const learnerGrade = clean(args.learnerGrade) || null;
  const nowMs = typeof args.now === 'number' && Number.isFinite(args.now) ? args.now : Date.now();
  const resourceStore = args.resourceStore ?? prismaMediaResourceStore;
  const eligibilityStore = args.eligibilityStore ?? prismaMediaEligibilityStore;
  const classificationStore = args.classificationStore ?? prismaMediaClassificationStore;
  const findAssetByVideoRef = args.findAssetByVideoRef ?? findMediaAssetByVideoReference;
  const getAssetById = args.getAssetById ?? getMediaAssetById;

  const fullAssetCache = new Map<string, Promise<MediaAsset | null>>();
  const bundleCache = new Map<string, Promise<{ ok: true; bundle: ProductionBundle } | { ok: false; code: string }>>();

  function loadFullAsset(assetId: string): Promise<MediaAsset | null> {
    const id = clean(assetId);
    const cached = fullAssetCache.get(id);
    if (cached) return cached;
    const pending = (async () => {
      try {
        return await getAssetById({ userId, assetId: id });
      } catch {
        return null;
      }
    })();
    fullAssetCache.set(id, pending);
    return pending;
  }

  function loadBundle(assetId: string): Promise<{ ok: true; bundle: ProductionBundle } | { ok: false; code: string }> {
    const id = clean(assetId);
    const cached = bundleCache.get(id);
    if (cached) return cached;
    const pending = (async (): Promise<{ ok: true; bundle: ProductionBundle } | { ok: false; code: string }> => {
      const fullAsset = await loadFullAsset(id);
      if (!fullAsset) return { ok: false, code: 'CANONICAL_ASSET_MISSING' };
      // Canonical MediaResource identity: SAME law as
      // applyLegacyInteractionCanonicalBridge (provider identity preferred,
      // never title, never URL substring).
      let resource: MediaResource | null = null;
      try {
        const identity = resolveRegistryIdentityForLegacyAsset({
          userId,
          videoProvider: fullAsset.videoProvider ?? null,
          videoId: fullAsset.videoId ?? null,
          sourceUrl: fullAsset.sourceUrl ?? null,
          dedupeKey: fullAsset.dedupeKey ?? null,
          assetKind: fullAsset.assetKind ?? null,
        });
        const canonicalKey = buildCanonicalKey({
          scope: identity.scope,
          provider: fullAsset.videoProvider ?? null,
          providerResourceId: fullAsset.videoId ?? null,
          sourceUrl: fullAsset.sourceUrl ?? null,
          schoolId: null,
          ownerUserId: identity.scope === 'USER' ? userId : null,
          stableResourceKey: identity.stableResourceKey,
        });
        resource = await resourceStore.findResourceByKey(canonicalKey);
      } catch {
        return { ok: false, code: 'CANONICAL_MEDIA_RESOURCE_MISSING' };
      }
      if (!resource) return { ok: false, code: 'CANONICAL_MEDIA_RESOURCE_MISSING' };
      // Tenant/resource scope check: GLOBAL proceeds; SCHOOL must match the
      // verified school; USER must match the verified learner owner. MediaAsset
      // ownership alone never authorizes the canonical resource.
      if (resource.scope === 'SCHOOL' && clean(resource.schoolId) !== schoolId) {
        return { ok: false, code: 'TENANT_SCOPE_MISMATCH' };
      }
      if (resource.scope === 'USER' && clean(resource.ownerUserId) !== userId) {
        return { ok: false, code: 'TENANT_SCOPE_MISMATCH' };
      }
      // ONE current authorization bundle: independent reads concurrently.
      const [exists, grants, availabilityState, policy] = await Promise.all([
        eligibilityStore.resourceExists(resource.id).catch(() => false),
        eligibilityStore.listGrants(resource.id).catch(() => []),
        eligibilityStore.findAvailability(resource.id).catch(() => null),
        resolveMediaExternalPolicy(
          {
            resourceId: resource.id,
            learner: { grade: learnerGrade },
            resource: { grades: extractResourceGrades((resource.metadata ?? {}) as Record<string, unknown>) },
            now: nowMs,
          },
          classificationStore,
        ).catch(() => null),
      ]);
      if (!policy) return { ok: false, code: 'POLICY_MISSING' };
      const availability = availabilityState ? availabilityState.status : null;
      const snapshot: CanonicalMediaRightsContext = {
        resourceId: resource.id,
        resourceExists: exists,
        grants,
        availability,
        externalPolicy: policy,
        territory: null,
        schoolId,
        now: nowMs,
      };
      return { ok: true, bundle: { fullAsset, resource, policy, snapshot } };
    })();
    bundleCache.set(id, pending);
    return pending;
  }

  return {
    resolveAsset: async (ref) => {
      if (!ref.provider || !ref.providerVideoId) {
        return { outcome: 'not_found', reasonCode: 'RESOURCE_NOT_FOUND' };
      }
      try {
        const found = await findAssetByVideoRef({
          userId,
          videoProvider: ref.provider,
          videoId: ref.providerVideoId,
        });
        if (found.outcome === 'resolved') {
          return { outcome: 'resolved', asset: { id: found.asset.id, updatedAt: found.asset.updatedAt } };
        }
        return found.outcome === 'ambiguous'
          ? { outcome: 'ambiguous', reasonCode: 'RESOURCE_AMBIGUOUS' }
          : { outcome: 'not_found', reasonCode: 'RESOURCE_NOT_FOUND' };
      } catch {
        return { outcome: 'not_found', reasonCode: 'RESOURCE_READ_FAILED' };
      }
    },
    checkRights: async (asset) => {
      let loaded: { ok: true; bundle: ProductionBundle } | { ok: false; code: string };
      try {
        loaded = await loadBundle(asset.id);
      } catch {
        return { aiProcessAllowed: false, transcriptReadAllowed: false, availabilityKnown: false, reasonCode: 'RIGHTS_READ_FAILED' };
      }
      if (!loaded.ok) {
        return { aiProcessAllowed: false, transcriptReadAllowed: false, availabilityKnown: false, reasonCode: loaded.code };
      }
      const authorization = resolveMediaAiProcessingAuthorization({
        asset: loaded.bundle.fullAsset,
        requestedScopes: ['metadata', 'transcript'],
        rights: loaded.bundle.snapshot,
      });
      const availabilityKnown =
        loaded.bundle.snapshot.availability !== null && loaded.bundle.snapshot.availability !== 'UNKNOWN';
      const aiProcessAllowed = authorization.metadata.decision === 'ALLOWED';
      const transcriptReadAllowed = authorization.transcript.decision === 'ALLOWED';
      return {
        aiProcessAllowed,
        transcriptReadAllowed,
        availabilityKnown,
        reasonCode: aiProcessAllowed ? undefined : 'AI_PROCESS_BLOCKED',
      };
    },
    resolvePolicy: async (asset) => {
      try {
        const loaded = await loadBundle(asset.id);
        if (!loaded.ok) return null;
        const policy = loaded.bundle.policy;
        return {
          safetyAllowed: policy.safetyAllowed,
          ageAllowed: policy.ageAllowed,
          deenAllowed: policy.deenAllowed,
          answerLeakageAllowed: policy.answerLeakageAllowed,
        };
      } catch {
        return null;
      }
    },
    enrich: async ({ asset, policy, curriculumFamily, transcriptAllowed }) => {
      let loaded: { ok: true; bundle: ProductionBundle } | { ok: false; code: string };
      try {
        loaded = await loadBundle(asset.id);
      } catch {
        return { ok: false, code: 'ENRICHMENT_FAILED' };
      }
      if (!loaded.ok) return { ok: false, code: loaded.code };
      const { bundle } = loaded;
      try {
        const result = await runCanonicalMediaSemanticEnrichment({
          userId,
          mediaAssetId: asset.id,
          curriculumFamily: curriculumFamily as 'cambridge_academic' | 'madrasa_deen' | 'school_custom' | 'system_seed',
          curriculumVersionId: clean(args.curriculumVersionId) || undefined,
          externalPolicy: {
            safetyAllowed: policy.safetyAllowed,
            ageAllowed: policy.ageAllowed,
            deenAllowed: policy.deenAllowed,
            answerLeakageAllowed: policy.answerLeakageAllowed,
          },
          schoolId,
          now: nowMs,
          dependencies: {
            getAsset: async () => bundle.fullAsset,
            resolveRightsSnapshot: async () => bundle.snapshot,
            ...(args.enrichmentRunner ? { enrichOne: args.enrichmentRunner } : {}),
          },
        });
        if (!result.ok) return { ok: false, code: result.code };
        const proposal = result.proposal;
        return {
          ok: true as const,
          proposal: {
            proposalVersion: proposal.proposalVersion,
            summary: proposal.content?.summary ?? '',
            keyPoints: Array.isArray(proposal.content?.keyPoints) ? proposal.content.keyPoints : [],
            subjects: candidateLabels(proposal.academic?.subjects),
            topics: candidateLabels(proposal.academic?.topics),
            concepts: candidateLabels(proposal.academic?.concepts),
            skills: candidateLabels(proposal.academic?.skills),
            prerequisites: candidateLabels(proposal.academic?.prerequisites),
            misconceptionTargets: candidateLabels(proposal.academic?.misconceptionTargets),
            pedagogicalRoles: candidateLabels(proposal.content?.pedagogicalRoles),
            difficulty: proposal.academic?.difficulty?.level ?? null,
            confidence: proposal.confidence,
            warnings: Array.isArray(proposal.warnings) ? proposal.warnings : [],
          },
          transcriptUsed: result.transcriptAuthorized === true && transcriptAllowed,
        };
      } catch {
        return { ok: false, code: 'ENRICHMENT_FAILED' };
      }
    },
    now: () => nowMs,
  };
}
