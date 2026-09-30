// STREAM-12 — canonical server-owned media policy, classification state,
// and bounded background ingestion/health refresh.
//
// ONE canonical resolver: resolveMediaExternalPolicy. It is a
// composition/read layer only — it never owns Deen, safeguarding,
// curriculum, Socratic, age, or rights truth. Every dimension resolves
// independently; unknown/unavailable/missing is false. No ALLOW_ALL, no
// default-true, no catch-true.
//
// Classification state: one current canonical projection per resource with
// explicit UNKNOWN support, provenance, version, classifiedAt, and review
// expiry. Persisted additively inside MediaResource.metadata
// ("mediaClassification.v1"); no new table, no event sourcing.
//
// Background refresh: bounded cursor/batch, idempotent per resource, bounded
// retries for transient failures only, fail-closed availability via the
// existing STREAM-3 MediaResourceAvailabilityState owner. Provider queries
// carry technical resource identity ONLY — never learner-private context.
// This module never writes Learning Evidence, Mastery, Growth,
// Misconception, or Revision state.

import prisma from '../lib/prisma';
import type { MediaExternalPolicy } from './mediaResourceEligibilityService';
import { createAvailabilityState } from './mediaResourceEligibilityService';
import type { MediaAvailabilityStatus } from './mediaResourceEligibilityService';
import { deenSourcePolicyService } from './task022DeenSourcePolicyService';

export type MediaClassificationStatus = 'ALLOWED' | 'BLOCKED' | 'UNKNOWN';

export interface MediaResourceClassification {
  resourceId: string;
  safety: MediaClassificationStatus;
  age: MediaClassificationStatus;
  deen: MediaClassificationStatus;
  answerLeakage: MediaClassificationStatus;
  provenance: string;
  version: number;
  classifiedAt: number;
  reviewAt: number | null;
}

export const MEDIA_CLASSIFICATION_VERSION = 1;
const CLASSIFICATION_METADATA_KEY = 'mediaClassification.v1';

function fail(code: string, message: string): never {
  throw new Error(`[${code}] ${message}`);
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function norm(value: unknown): string {
  return clean(value).toLowerCase();
}

function blankClassification(resourceId: string, now: number): MediaResourceClassification {
  return {
    resourceId,
    safety: 'UNKNOWN',
    age: 'UNKNOWN',
    deen: 'UNKNOWN',
    answerLeakage: 'UNKNOWN',
    provenance: 'stream12:unclassified',
    version: MEDIA_CLASSIFICATION_VERSION,
    classifiedAt: now,
    reviewAt: null,
  };
}

function asStatus(value: unknown): MediaClassificationStatus {
  const text = norm(value);
  if (text === 'allowed') return 'ALLOWED';
  if (text === 'blocked') return 'BLOCKED';
  return 'UNKNOWN';
}

function readStoredClassification(resourceId: string, metadata: unknown, now: number): MediaResourceClassification {
  const base = blankClassification(resourceId, now);
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return base;
  const stored = (metadata as Record<string, unknown>)[CLASSIFICATION_METADATA_KEY];
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return base;
  const row = stored as Record<string, unknown>;
  return {
    ...base,
    safety: asStatus(row.safety),
    age: asStatus(row.age),
    deen: asStatus(row.deen),
    answerLeakage: asStatus(row.answerLeakage),
    provenance: clean(row.provenance) || base.provenance,
    version: typeof row.version === 'number' && Number.isFinite(row.version) ? Math.floor(row.version) : base.version,
    classifiedAt:
      typeof row.classifiedAt === 'number' && Number.isFinite(row.classifiedAt) ? Math.floor(row.classifiedAt) : now,
    reviewAt: typeof row.reviewAt === 'number' && Number.isFinite(row.reviewAt) ? Math.floor(row.reviewAt) : null,
  };
}

// ── Classification store ─────────────────────────────────────────────

export interface MediaClassificationStore {
  getClassification(resourceId: string): Promise<MediaResourceClassification | null>;
  saveClassification(next: MediaResourceClassification): Promise<MediaResourceClassification>;
}

export function createMemoryMediaClassificationStore(): MediaClassificationStore & {
  recordCount(): number;
} {
  const rows = new Map<string, MediaResourceClassification>();
  const locks = new Map<string, Promise<unknown>>();
  function serialize<T>(key: string, work: () => Promise<T> | T): Promise<T> {
    const prior = locks.get(key) ?? Promise.resolve();
    const next = (prior as Promise<unknown>).then(() => work());
    locks.set(key, next.catch(() => undefined));
    return next as Promise<T>;
  }
  return {
    recordCount: () => rows.size,
    async getClassification(resourceId: string) {
      return rows.get(clean(resourceId)) ?? null;
    },
    async saveClassification(next: MediaResourceClassification) {
      return serialize(`media-class:${clean(next.resourceId)}`, () => {
        rows.set(clean(next.resourceId), { ...next });
        return { ...next };
      });
    },
  };
}

type MetadataRow = { id: string; metadata: unknown };

export const prismaMediaClassificationStore: MediaClassificationStore = {
  async getClassification(resourceId: string) {
    const id = clean(resourceId);
    if (!id) return null;
    const rows = await prisma.$queryRawUnsafe<MetadataRow[]>(
      `SELECT "id", "metadata" FROM "MediaResource" WHERE "id" = $1 LIMIT 1`,
      id,
    );
    if (!rows[0]) return null;
    let metadata: unknown = rows[0].metadata;
    if (typeof metadata === 'string' && metadata.trim()) {
      try {
        metadata = JSON.parse(metadata);
      } catch {
        metadata = {};
      }
    }
    return readStoredClassification(id, metadata ?? {}, Date.now());
  },
  async saveClassification(next: MediaResourceClassification) {
    const id = clean(next.resourceId);
    if (!id) fail('MEDIA_CLASSIFICATION_INVALID_INPUT', 'Classification requires a resourceId.');
    const existing = await prisma.$queryRawUnsafe<MetadataRow[]>(
      `SELECT "id", "metadata" FROM "MediaResource" WHERE "id" = $1 LIMIT 1`,
      id,
    );
    if (!existing[0]) fail('MEDIA_CLASSIFICATION_NOT_FOUND', 'Canonical media resource was not found.');
    let metadata: Record<string, unknown> = {};
    const raw = existing[0].metadata;
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) metadata = { ...(raw as Record<string, unknown>) };
    else if (typeof raw === 'string' && raw.trim()) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          metadata = { ...(parsed as Record<string, unknown>) };
        }
      } catch {
        metadata = {};
      }
    }
    metadata[CLASSIFICATION_METADATA_KEY] = { ...next, resourceId: id };
    await prisma.$queryRawUnsafe(
      `UPDATE "MediaResource" SET "metadata" = $2::jsonb, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
      id,
      JSON.stringify(metadata),
    );
    return { ...next, resourceId: id };
  },
};

// ── Canonical policy resolver (exactly one) ──────────────────────────

export interface MediaPolicyLearnerFacts {
  grade: string | null;
}

export interface MediaPolicyResourceFacts {
  grades: string[];
}

function normalizeGrade(value: unknown): string {
  return norm(value).replace(/[\s_]+/g, '_');
}

function gradesCompatible(learnerGrade: string | null, resourceGrades: string[]): boolean {
  const learner = normalizeGrade(learnerGrade);
  if (!learner) return false;
  const known = resourceGrades.map(normalizeGrade).filter(Boolean);
  if (known.length === 0) return false;
  return known.includes(learner);
}

export async function resolveMediaExternalPolicy(
  args: {
    resourceId: string;
    learner: MediaPolicyLearnerFacts;
    resource: MediaPolicyResourceFacts;
    now?: number;
  },
  store: MediaClassificationStore = prismaMediaClassificationStore,
): Promise<MediaExternalPolicy> {
  const closed: MediaExternalPolicy = {
    safetyAllowed: false,
    ageAllowed: false,
    deenAllowed: false,
    answerLeakageAllowed: false,
  };
  const resourceId = clean(args.resourceId);
  if (!resourceId) return closed;
  let classification: MediaResourceClassification | null = null;
  try {
    classification = await store.getClassification(resourceId);
  } catch {
    return closed;
  }
  if (!classification) return closed;
  const now = typeof args.now === 'number' && Number.isFinite(args.now) ? args.now : Date.now();
  // Stale/expired classification fails closed until refresh re-proves it.
  if (classification.reviewAt !== null && now >= classification.reviewAt) return closed;
  const safetyAllowed = classification.safety === 'ALLOWED';
  const deenAllowed = classification.deen === 'ALLOWED';
  const answerLeakageAllowed = classification.answerLeakage === 'ALLOWED';
  // Age requires BOTH canonical facts: known learner grade AND a resource
  // grade set that explicitly contains it. Unknown either side blocks.
  const ageAllowed =
    classification.age === 'ALLOWED' && gradesCompatible(args.learner?.grade ?? null, args.resource?.grades ?? []);
  return { safetyAllowed, ageAllowed, deenAllowed, answerLeakageAllowed };
}

// ── Classification derivation (refresh-time, backend-owned facts) ────

export interface RefreshableMediaResource {
  id: string;
  provider: string | null;
  providerResourceId: string | null;
  safetyStatus: string | null;
  metadata: Record<string, unknown>;
}

// Public grade-facts projection for route wiring: canonical resource grade
// facts only, no guessing, no title scans.
export function extractResourceGrades(metadata: Record<string, unknown>): string[] {
  if (!metadata || typeof metadata !== 'object') return [];
  return readGrades(metadata);
}

function readGrades(metadata: Record<string, unknown>): string[] {
  const out: string[] = [];
  const push = (value: unknown): void => {
    const text = clean(value);
    if (text && !out.includes(text)) out.push(text);
  };
  const bands = metadata.gradeBands;
  if (Array.isArray(bands)) bands.forEach(push);
  else push(bands);
  const grades = metadata.grades;
  if (Array.isArray(grades)) grades.forEach(push);
  else push(grades);
  push(metadata.gradeBand);
  push(metadata.grade);
  push(metadata.ageRange);
  return out;
}

// Safety maps the existing registry safetyStatus vocabulary explicitly.
// "No safeguarding case" is NOT "safe": anything outside the approved
// vocabulary stays UNKNOWN and blocks.
function deriveSafety(resource: RefreshableMediaResource): MediaClassificationStatus {
  const status = norm(resource.safetyStatus);
  if (status === 'approved' || status === 'safe' || status === 'verified') return 'ALLOWED';
  if (status === 'blocked' || status === 'unsafe' || status === 'rejected' || status === 'quarantined') {
    return 'BLOCKED';
  }
  return 'UNKNOWN';
}

// Age classifiability: the resource states explicit grade/age suitability
// facts (no name/title guessing). Compatibility itself is proven at resolve
// time against the canonical learner grade.
function deriveAge(resource: RefreshableMediaResource): MediaClassificationStatus {
  const grades = readGrades(resource.metadata);
  if (grades.length > 0) return 'ALLOWED';
  const blocked = norm(resource.metadata.ageBlocked);
  if (blocked === 'true' || blocked === 'yes' || blocked === 'blocked') return 'BLOCKED';
  return 'UNKNOWN';
}

// Deen reuses the established Deen source governance service when the
// resource carries Deen source fields; ordinary non-Deen academic media
// follows its persisted governance verdict, never keyword guesses.
function deriveDeen(resource: RefreshableMediaResource): MediaClassificationStatus {
  const meta = resource.metadata;
  const stored = norm(meta.deenApproval);
  if (stored === 'approved') return 'ALLOWED';
  if (stored === 'blocked') return 'BLOCKED';
  if (stored === 'review_required' || stored === 'referral_required') return 'BLOCKED';
  const sourceType = clean(meta.deenSourceType);
  const approvalStatus = clean(meta.deenApprovalStatus);
  if (sourceType && approvalStatus) {
    try {
      const decision = deenSourcePolicyService.decideDeenSourcePolicy({
        sourceType,
        curriculumFamily: clean(meta.curriculumFamily),
        deenCategory: clean(meta.deenCategory) || undefined,
        approvalStatus,
        visibilityScope: clean(meta.visibilityScope) || 'school',
      });
      const codes = decision.reasonCodes.join(',');
      if (/unapproved-deen-source-blocked/.test(codes)) return 'BLOCKED';
      if (decision.referralRequired) return 'BLOCKED';
      if (/approved-deen-source|deen-source-policy-default/.test(codes)) return 'ALLOWED';
    } catch {
      return 'UNKNOWN';
    }
  }
  const nonDeen = norm(meta.deenContext);
  if (nonDeen === 'none' && norm(meta.sourceTrust) === 'approved') return 'ALLOWED';
  return 'UNKNOWN';
}

// Answer leakage uses only established integrity/source facts persisted on
// the resource. Missing facts persist UNKNOWN and block — never title scans.
function deriveAnswerLeakage(resource: RefreshableMediaResource): MediaClassificationStatus {
  const verdict = norm(resource.metadata.answerLeakage);
  if (verdict === 'safe' || verdict === 'allowed') return 'ALLOWED';
  if (verdict === 'leaks' || verdict === 'blocked') return 'BLOCKED';
  return 'UNKNOWN';
}

export function deriveResourceClassification(
  resource: RefreshableMediaResource,
  now: number,
  previous: MediaResourceClassification | null,
): MediaResourceClassification {
  const next: MediaResourceClassification = {
    resourceId: clean(resource.id),
    safety: deriveSafety(resource),
    age: deriveAge(resource),
    deen: deriveDeen(resource),
    answerLeakage: deriveAnswerLeakage(resource),
    provenance: 'stream12:background-refresh',
    version: MEDIA_CLASSIFICATION_VERSION,
    classifiedAt: now,
    // Re-prove at least every 30 days; blocked safety re-proves every 7.
    reviewAt: now + 30 * 24 * 60 * 60 * 1000,
  };
  if (previous) {
    const unchanged =
      previous.safety === next.safety &&
      previous.age === next.age &&
      previous.deen === next.deen &&
      previous.answerLeakage === next.answerLeakage &&
      previous.version === next.version;
    if (unchanged) return { ...previous, reviewAt: next.reviewAt };
  }
  return next;
}

// ── Provider refresh query (privacy-safe by construction) ────────────

export interface ProviderRefreshQuery {
  provider: string;
  providerResourceId: string;
}

// Only technical resource identity leaves the backend. The type carries no
// learner, teacher, mastery, misconception, safeguarding, Deen-private, or
// note fields, so providers cannot receive them through this path.
export function buildProviderRefreshQuery(resource: {
  provider: string | null;
  providerResourceId: string | null;
}): ProviderRefreshQuery | null {
  const provider = norm(resource.provider);
  const providerResourceId =
    typeof resource.providerResourceId === 'string' ? resource.providerResourceId.trim() : '';
  if (!provider || !providerResourceId) return null;
  return { provider, providerResourceId };
}

export type ProviderRefreshOutcome = 'AVAILABLE' | 'NOT_FOUND' | 'TRANSIENT' | 'MALFORMED';

export interface ProviderRefreshResult {
  outcome: ProviderRefreshOutcome;
  providerStatus: string | null;
  metadataPatch: Record<string, unknown> | null;
}

export type MediaRefreshProbe = (query: ProviderRefreshQuery) => Promise<ProviderRefreshResult>;

// Maps the existing adapter playback result vocabulary onto refresh
// outcomes without adding a new provider integration.
export function mapPlaybackToRefreshOutcome(reason: string | null, ready: boolean): ProviderRefreshOutcome {
  if (ready) return 'AVAILABLE';
  const code = clean(reason).toUpperCase();
  if (code === 'NOT_FOUND') return 'NOT_FOUND';
  if (code === 'TEMPORARILY_UNAVAILABLE') return 'TRANSIENT';
  return 'MALFORMED';
}

// ── Bounded background refresh ───────────────────────────────────────

export interface MediaRefreshDueResource extends RefreshableMediaResource {
  availability: {
    status: MediaAvailabilityStatus;
    unavailableReason: string | null;
  } | null;
}

export interface MediaRefreshStore {
  listDueResources(cursor: string | null, limit: number, now: number): Promise<MediaRefreshDueResource[]>;
  applyRefreshResult(args: {
    resource: MediaRefreshDueResource;
    probe: ProviderRefreshResult | null;
    classification: MediaResourceClassification;
    availabilityStatus: MediaAvailabilityStatus;
    providerStatus: string | null;
    unavailableReason: string | null;
    nextCheckAt: number | null;
    now: number;
  }): Promise<void>;
}

const REFRESH_DEFAULT_BATCH = 25;
const REFRESH_MAX_BATCH = 50;
const RETRY_BASE_MS = 60 * 1000;
const RETRY_MAX_MS = 60 * 60 * 1000;
const AVAILABLE_RECHECK_MS = 24 * 60 * 60 * 1000;

function transientAttemptCount(reason: string | null): number {
  const match = /transient_failure attempt (\d+)/.exec(clean(reason));
  return match ? Math.max(1, parseInt(match[1], 10)) : 0;
}

function nextRetryAt(now: number, attempt: number): number {
  const backoff = Math.min(RETRY_BASE_MS * 2 ** Math.min(attempt, 6), RETRY_MAX_MS);
  return now + backoff;
}

export interface MediaRefreshBatchResult {
  processed: number;
  nextCursor: string | null;
}

const refreshLocks = new Map<string, Promise<unknown>>();
function serializeRefresh<T>(key: string, work: () => Promise<T>): Promise<T> {
  const prior = refreshLocks.get(key) ?? Promise.resolve();
  const next = (prior as Promise<unknown>).then(() => work());
  refreshLocks.set(key, next.catch(() => undefined));
  return next as Promise<T>;
}

// Bounded, idempotent refresh. One batch per call; caller paginates with
// nextCursor. No unbounded scan. No infinite loop.
export async function refreshMediaResources(
  args: { cursor?: string | null; batchSize?: number; now?: number },
  deps: {
    store: MediaRefreshStore;
    classificationStore: MediaClassificationStore;
    probe: MediaRefreshProbe;
  },
): Promise<MediaRefreshBatchResult> {
  const requested = typeof args.batchSize === 'number' ? Math.floor(args.batchSize) : REFRESH_DEFAULT_BATCH;
  const limit = Math.min(Math.max(1, requested || REFRESH_DEFAULT_BATCH), REFRESH_MAX_BATCH);
  const now = typeof args.now === 'number' && Number.isFinite(args.now) ? Math.floor(args.now) : Date.now();
  const cursor = clean(args.cursor);
  const due = await deps.store.listDueResources(cursor || null, limit, now);
  for (const resource of due) {
    await serializeRefresh(`media-refresh:${resource.id}`, async () => {
      const query = buildProviderRefreshQuery(resource);
      let probe: ProviderRefreshResult | null = null;
      if (query) {
        try {
          probe = await deps.probe(query);
        } catch {
          probe = { outcome: 'TRANSIENT', providerStatus: 'probe_threw', metadataPatch: null };
        }
      } else {
        // No provider identity: nothing external to check. Keep last-known
        // metadata; availability stays fail-closed UNKNOWN.
        probe = null;
      }
      const previous = await deps.classificationStore.getClassification(resource.id).catch(() => null);
      const merged: RefreshableMediaResource =
        probe?.metadataPatch && typeof probe.metadataPatch === 'object'
          ? { ...resource, metadata: { ...resource.metadata, ...probe.metadataPatch } }
          : resource;
      const classification = deriveResourceClassification(merged, now, previous);
      let status: MediaAvailabilityStatus;
      let providerStatus: string | null = null;
      let reason: string | null = null;
      let nextCheckAt: number | null = null;
      if (probe === null) {
        status = 'UNKNOWN';
        reason = 'no_provider_identity';
        nextCheckAt = now + AVAILABLE_RECHECK_MS;
      } else if (probe.outcome === 'AVAILABLE') {
        status = 'AVAILABLE';
        providerStatus = clean(probe.providerStatus) || 'ok';
        nextCheckAt = now + AVAILABLE_RECHECK_MS;
      } else if (probe.outcome === 'NOT_FOUND') {
        // Rights may still be valid, but the bytes are gone: unavailable.
        // Canonical metadata is preserved, never deleted.
        status = 'UNAVAILABLE';
        providerStatus = clean(probe.providerStatus) || 'not_found';
        reason = 'provider_not_found';
        nextCheckAt = now + AVAILABLE_RECHECK_MS;
      } else if (probe.outcome === 'TRANSIENT') {
        const attempt = transientAttemptCount(resource.availability?.unavailableReason ?? null) + 1;
        status = 'TEMPORARILY_UNAVAILABLE';
        providerStatus = clean(probe.providerStatus) || 'transient';
        reason = `transient_failure attempt ${attempt}`;
        nextCheckAt = nextRetryAt(now, attempt);
      } else {
        status = 'UNKNOWN';
        providerStatus = clean(probe.providerStatus) || 'malformed';
        reason = 'malformed_provider_metadata';
        nextCheckAt = nextRetryAt(now, 1);
      }
      await deps.classificationStore.saveClassification(classification);
      await deps.store.applyRefreshResult({
        resource,
        probe,
        classification,
        availabilityStatus: status,
        providerStatus,
        unavailableReason: reason,
        nextCheckAt,
        now,
      });
    });
  }
  return {
    processed: due.length,
    nextCursor: due.length > 0 ? clean(due[due.length - 1].id) : cursor || null,
  };
}

export function createMemoryMediaRefreshStore(
  resources: MediaRefreshDueResource[],
  availability: Map<string, { status: MediaAvailabilityStatus; nextCheckAt: number | null }>,
): MediaRefreshStore {
  return {
    async listDueResources(cursor: string | null, limit: number, now: number) {
      const ordered = [...resources]
        .filter((entry) => !cursor || clean(entry.id) > cursor)
        .sort((a, b) => (clean(a.id) < clean(b.id) ? -1 : 1))
        .slice(0, limit);
      return ordered.filter((entry) => {
        const state = availability.get(entry.id);
        if (!state) return true;
        if (state.nextCheckAt === null) return true;
        return state.nextCheckAt <= now;
      });
    },
    async applyRefreshResult(args) {
      availability.set(args.resource.id, { status: args.availabilityStatus, nextCheckAt: args.nextCheckAt });
      const current = resources.find((entry) => entry.id === args.resource.id);
      if (current && args.probe?.metadataPatch && typeof args.probe.metadataPatch === 'object') {
        current.metadata = { ...current.metadata, ...args.probe.metadataPatch };
      }
    },
  };
}

// Production refresh store: bounded id-ordered due selection over the
// existing STREAM-2/3 tables; availability upsert reuses the STREAM-3 state
// shape via the established parameterized raw-query pattern.
export const prismaMediaRefreshStore: MediaRefreshStore = {
  async listDueResources(cursor: string | null, limit: number, now: number) {
    const rows = await prisma.$queryRawUnsafe<
      Array<{
        id: string;
        provider: string | null;
        providerResourceId: string | null;
        safetyStatus: string | null;
        metadata: unknown;
        availabilityStatus: string | null;
        unavailableReason: string | null;
      }>
    >(
      `SELECT r."id", r."provider", r."providerResourceId", r."safetyStatus", r."metadata",
              a."status" AS "availabilityStatus", a."unavailableReason"
       FROM "MediaResource" r
       LEFT JOIN "MediaResourceAvailabilityState" a ON a."resourceId" = r."id"
       WHERE ($1 = '' OR r."id" > $1)
         AND (a."resourceId" IS NULL OR a."nextCheckAt" IS NULL OR a."nextCheckAt" <= to_timestamp($2 / 1000.0))
       ORDER BY r."id" ASC LIMIT $3`,
      cursor ?? '',
      now,
      limit,
    );
    return rows.map((row) => {
      let metadata: Record<string, unknown> = {};
      const raw = row.metadata;
      if (raw && typeof raw === 'object' && !Array.isArray(raw)) metadata = raw as Record<string, unknown>;
      else if (typeof raw === 'string' && raw.trim()) {
        try {
          const parsed: unknown = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            metadata = parsed as Record<string, unknown>;
          }
        } catch {
          metadata = {};
        }
      }
      return {
        id: clean(row.id),
        provider: clean(row.provider) || null,
        providerResourceId:
          typeof row.providerResourceId === 'string' ? row.providerResourceId.trim() || null : null,
        safetyStatus: clean(row.safetyStatus) || null,
        metadata,
        availability: row.availabilityStatus
          ? {
              status: clean(row.availabilityStatus).toUpperCase() as MediaAvailabilityStatus,
              unavailableReason: clean(row.unavailableReason) || null,
            }
          : null,
      };
    });
  },
  async applyRefreshResult(args) {
    const state = createAvailabilityState({
      resourceId: args.resource.id,
      status: args.availabilityStatus,
      providerStatus: args.providerStatus,
      unavailableReason: args.unavailableReason,
      nextCheckAt: args.nextCheckAt,
      now: args.now,
    });    await prisma.$queryRawUnsafe(
      `INSERT INTO "MediaResourceAvailabilityState"
         ("id","resourceId","status","checkedAt","nextCheckAt","providerStatus","unavailableReason","updatedAt")
       VALUES (gen_random_uuid(), $1, $2, to_timestamp($3 / 1000.0),
               CASE WHEN $4::bigint IS NULL THEN NULL ELSE to_timestamp($4::bigint / 1000.0) END, $5, $6, CURRENT_TIMESTAMP)
       ON CONFLICT ("resourceId") DO UPDATE SET
         "status" = EXCLUDED."status",
         "checkedAt" = EXCLUDED."checkedAt",
         "nextCheckAt" = EXCLUDED."nextCheckAt",
         "providerStatus" = EXCLUDED."providerStatus",
         "unavailableReason" = EXCLUDED."unavailableReason",
         "updatedAt" = CURRENT_TIMESTAMP`,
      state.resourceId,
      state.status,
      state.checkedAt,
      state.nextCheckAt,
      state.providerStatus,
      state.unavailableReason,
    );
    // Canonical metadata is preserved on failure; safe provider metadata
    // patches merge additively and never delete existing keys.
    if (args.probe?.metadataPatch && typeof args.probe.metadataPatch === 'object') {
      const rows = await prisma.$queryRawUnsafe<MetadataRow[]>(
        `SELECT "id", "metadata" FROM "MediaResource" WHERE "id" = $1 LIMIT 1`,
        args.resource.id,
      );
      if (rows[0]) {
        let metadata: Record<string, unknown> = {};
        const raw = rows[0].metadata;
        if (raw && typeof raw === 'object' && !Array.isArray(raw)) metadata = { ...(raw as Record<string, unknown>) };
        metadata = { ...metadata, ...args.probe.metadataPatch };
        await prisma.$queryRawUnsafe(
          `UPDATE "MediaResource" SET "metadata" = $2::jsonb, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
          args.resource.id,
          JSON.stringify(metadata),
        );
      }
    }
  },
};

// STREAM-13 — registry refresh bridge (additive). STREAM-12 due resource
// (provider + providerResourceId only) -> registry adapter -> typed refresh
// result -> existing STREAM-12 availability/classification flow. ONE remote
// attempt per execution; STREAM-12 owns all retry timing.
import type { MediaProviderRegistry } from './mediaProviderPort';
import { REFRESH_TIMEOUT_MS } from './mediaProviderPort';
import { executeBoundedRefresh, type OperationObserver } from './mediaProviderOperationsService';

export function createRegistryMediaRefreshProbe(
  registry: MediaProviderRegistry,
  options: { observer?: OperationObserver | null } = {},
): MediaRefreshProbe {
  return async (query: ProviderRefreshQuery): Promise<ProviderRefreshResult> => {
    const providerKey = clean(query?.provider);
    const providerResourceId = typeof query?.providerResourceId === 'string' ? query.providerResourceId.trim() : '';
    if (!providerKey || !providerResourceId) {
      return { outcome: 'MALFORMED', providerStatus: 'missing_provider_identity', metadataPatch: null };
    }
    const adapter = registry.get(providerKey);
    if (!adapter) {
      return { outcome: 'MALFORMED', providerStatus: 'provider_not_registered', metadataPatch: null };
    }
    const result = await executeBoundedRefresh(
      adapter,
      { providerResourceId },
      { timeoutMs: REFRESH_TIMEOUT_MS, observer: options.observer ?? null },
    );
    if (result.status === 'AVAILABLE') {
      return { outcome: 'AVAILABLE', providerStatus: result.providerStatus, metadataPatch: result.metadataPatch };
    }
    if (result.status === 'NOT_FOUND') {
      return { outcome: 'NOT_FOUND', providerStatus: result.providerStatus, metadataPatch: null };
    }
    if (result.status === 'UNCONFIGURED') {
      // Unconfigured provider is dependency-unavailable for refresh; STREAM-12
      // transient handling applies. Never fake AVAILABLE.
      return { outcome: 'TRANSIENT', providerStatus: result.providerStatus, metadataPatch: null };
    }
    if (result.status === 'TRANSIENT') {
      return { outcome: 'TRANSIENT', providerStatus: result.providerStatus, metadataPatch: null };
    }
    return { outcome: 'MALFORMED', providerStatus: result.providerStatus, metadataPatch: null };
  };
}
