// STREAM-3 — media usage rights + availability + deterministic eligibility.
// Answers: may this canonical media resource be used for this requested
// operation, for this school/context, right now?
//
// Ownership: rights grants, availability state, rights evaluation,
// availability evaluation, final eligibility composition. This module does
// NOT own mastery, Growth, Evidence, ranking, recommendations, provider
// search/playback, AI classification, diagnosis, curriculum truth, Deen
// policy definitions, safety definitions, or answer-key definitions — it
// only consumes their already-resolved external decisions via
// MediaExternalPolicy. No model call. No provider call. No ranking.
//
// Fail-closed throughout: absence of permission is NOT GRANTED, unknown
// availability never allows use, and a playable URL never implies rights.

import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';

export const MEDIA_PERMISSIONS = [
  'PLAY_STREAM',
  'EMBED',
  'TRANSCRIPT_READ',
  'AI_PROCESS',
  'CLIP',
  'TRANSLATE',
  'DOWNLOAD',
  'OFFLINE',
  'DERIVATIVE',
  'THUMBNAIL_USE',
] as const;

export type MediaPermission = (typeof MEDIA_PERMISSIONS)[number];

const PERMISSION_SET = new Set<string>(MEDIA_PERMISSIONS);

export const MEDIA_GRANT_SOURCES = [
  'PROVIDER_TERMS',
  'DIRECT_LICENSE',
  'SCHOOL_OWNED',
  'STEADFAST_OWNED',
  'OPEN_LICENSE',
  'PUBLIC_DOMAIN',
] as const;

export type MediaGrantSource = (typeof MEDIA_GRANT_SOURCES)[number];

const GRANT_SOURCE_SET = new Set<string>(MEDIA_GRANT_SOURCES);

export type MediaSchoolScope = 'GLOBAL' | 'SCHOOL';

export const MEDIA_AVAILABILITY_STATUSES = [
  'AVAILABLE',
  'TEMPORARILY_UNAVAILABLE',
  'UNAVAILABLE',
  'UNKNOWN',
] as const;

export type MediaAvailabilityStatus = (typeof MEDIA_AVAILABILITY_STATUSES)[number];

export const MEDIA_ELIGIBILITY_REASON_CODES = [
  'RIGHTS_NOT_FOUND',
  'PERMISSION_NOT_GRANTED',
  'RIGHTS_NOT_YET_VALID',
  'RIGHTS_EXPIRED',
  'RIGHTS_REVOKED',
  'TERRITORY_NOT_ALLOWED',
  'SCHOOL_NOT_ALLOWED',
  'AVAILABILITY_UNKNOWN',
  'RESOURCE_TEMPORARILY_UNAVAILABLE',
  'RESOURCE_UNAVAILABLE',
  'SAFETY_BLOCKED',
  'AGE_BLOCKED',
  'DEEN_BLOCKED',
  'ANSWER_LEAKAGE_BLOCKED',
] as const;

export type MediaEligibilityReasonCode = (typeof MEDIA_ELIGIBILITY_REASON_CODES)[number];

// Explicit global marker for grant territory sets. An empty territory list
// is NEVER worldwide — it covers nothing.
export const GLOBAL_TERRITORY_MARKER = 'GLOBAL';

export interface MediaResourceRightsGrant {
  id: string;
  resourceId: string;
  grantSource: MediaGrantSource;
  evidenceRef: string | null;
  permissions: string[];
  territories: string[];
  schoolScope: MediaSchoolScope;
  schoolId: string | null;
  // Millisecond epoch bounds. Null = unbounded on that side.
  validFrom: number | null;
  validUntil: number | null;
  revokedAt: number | null;
  revocationReason: string | null;
  attributionRequired: boolean;
  attributionText: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface MediaResourceAvailabilityState {
  resourceId: string;
  status: MediaAvailabilityStatus;
  checkedAt: number;
  nextCheckAt: number | null;
  providerStatus: string | null;
  unavailableReason: string | null;
  createdAt: number;
  updatedAt: number;
}

// Decisions owned elsewhere, supplied by the caller as resolved values.
// This module never infers or reimplements them.
export interface MediaExternalPolicy {
  safetyAllowed: boolean;
  ageAllowed: boolean;
  deenAllowed: boolean;
  answerLeakageAllowed: boolean;
}

export interface EvaluateMediaEligibilityInput {
  resourceId: string;
  resourceExists: boolean;
  requestedPermission: string;
  territory?: string | null;
  schoolId?: string | null;
  now: number;
  availability: MediaAvailabilityStatus | null;
  grants: MediaResourceRightsGrant[];
  externalPolicy: MediaExternalPolicy;
}

export interface MediaEligibilityResult {
  decision: 'ALLOW' | 'BLOCK';
  reasonCodes: MediaEligibilityReasonCode[];
  matchedGrantId?: string;
}

function fail(code: string, message: string): never {
  throw new Error(`[${code}] ${message}`);
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTerritory(value: unknown): string {
  return clean(value).toUpperCase();
}

function normalizeTerritories(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  for (const entry of values) {
    const code = normalizeTerritory(entry);
    if (code && !out.includes(code)) out.push(code);
  }
  return out;
}

function normalizePermissions(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const out: string[] = [];
  for (const entry of values) {
    const permission = clean(entry);
    if (permission && !out.includes(permission)) out.push(permission);
  }
  return out;
}

type GrantTimeState = 'OK' | 'REVOKED' | 'NOT_YET_VALID' | 'EXPIRED';

function grantTimeState(grant: MediaResourceRightsGrant, now: number): GrantTimeState {
  if (grant.revokedAt !== null) return 'REVOKED';
  if (grant.validFrom !== null && now < grant.validFrom) return 'NOT_YET_VALID';
  if (grant.validUntil !== null && now >= grant.validUntil) return 'EXPIRED';
  return 'OK';
}

function grantMatchesTerritory(grant: MediaResourceRightsGrant, territory: string | null | undefined): boolean {
  const territories = normalizeTerritories(grant.territories);
  if (territories.includes(GLOBAL_TERRITORY_MARKER)) return true;
  const requested = normalizeTerritory(territory);
  if (!requested) return false;
  return territories.includes(requested);
}

function grantMatchesSchool(grant: MediaResourceRightsGrant, schoolId: string | null | undefined): boolean {
  if (grant.schoolScope === 'GLOBAL') return true;
  if (grant.schoolScope !== 'SCHOOL') return false;
  const grantSchool = clean(grant.schoolId);
  if (!grantSchool) return false;
  return grantSchool === clean(schoolId);
}

const REASON_ORDER = new Map<string, number>(
  MEDIA_ELIGIBILITY_REASON_CODES.map((code, index) => [code, index]),
);

function orderReasons(codes: Set<MediaEligibilityReasonCode>): MediaEligibilityReasonCode[] {
  return [...codes].sort((a, b) => (REASON_ORDER.get(a) ?? 99) - (REASON_ORDER.get(b) ?? 99));
}

/**
 * Deterministic eligibility composition. Policy order: resource existence →
 * external safety/policy gates → availability → rights grants → requested
 * permission → validity → territory → school scope → ALLOW.
 */
export function evaluateMediaEligibility(input: EvaluateMediaEligibilityInput): MediaEligibilityResult {
  const blocked = new Set<MediaEligibilityReasonCode>();

  // 1. Canonical resource must exist. Without it there are no rights to check.
  if (!input.resourceExists) {
    return { decision: 'BLOCK', reasonCodes: ['RIGHTS_NOT_FOUND'] };
  }

  // 2. Externally-owned gates (resolved elsewhere, consumed here).
  if (!input.externalPolicy.safetyAllowed) blocked.add('SAFETY_BLOCKED');
  if (!input.externalPolicy.ageAllowed) blocked.add('AGE_BLOCKED');
  if (!input.externalPolicy.deenAllowed) blocked.add('DEEN_BLOCKED');
  if (!input.externalPolicy.answerLeakageAllowed) blocked.add('ANSWER_LEAKAGE_BLOCKED');

  // 3. Availability is operational truth, separate from licensing truth.
  const availability = input.availability;
  if (availability !== 'AVAILABLE') {
    if (availability === 'TEMPORARILY_UNAVAILABLE') blocked.add('RESOURCE_TEMPORARILY_UNAVAILABLE');
    else if (availability === 'UNAVAILABLE') blocked.add('RESOURCE_UNAVAILABLE');
    else blocked.add('AVAILABILITY_UNKNOWN');
  }

  // 4–8. Rights grants, evaluated atomically: one grant must independently
  // satisfy permission + validity + territory + school scope. Fragments from
  // incompatible grants are never combined.
  const requested = clean(input.requestedPermission);
  const grants = (input.grants ?? []).filter((grant) => grant.resourceId === input.resourceId);
  if (!PERMISSION_SET.has(requested)) {
    // Unknown permission fails closed, same as an ungranted one.
    blocked.add('PERMISSION_NOT_GRANTED');
  } else if (grants.length === 0) {
    blocked.add('RIGHTS_NOT_FOUND');
  } else {
    const withPermission = grants.filter((grant) => normalizePermissions(grant.permissions).includes(requested));
    if (withPermission.length === 0) {
      blocked.add('PERMISSION_NOT_GRANTED');
    } else {
      let matched: MediaResourceRightsGrant | null = null;
      const grantBlocks = new Set<MediaEligibilityReasonCode>();
      for (const grant of withPermission) {
        const timeState = grantTimeState(grant, input.now);
        if (timeState === 'REVOKED') {
          grantBlocks.add('RIGHTS_REVOKED');
          continue;
        }
        if (timeState === 'NOT_YET_VALID') {
          grantBlocks.add('RIGHTS_NOT_YET_VALID');
          continue;
        }
        if (timeState === 'EXPIRED') {
          grantBlocks.add('RIGHTS_EXPIRED');
          continue;
        }
        if (!grantMatchesTerritory(grant, input.territory)) {
          grantBlocks.add('TERRITORY_NOT_ALLOWED');
          continue;
        }
        if (!grantMatchesSchool(grant, input.schoolId)) {
          grantBlocks.add('SCHOOL_NOT_ALLOWED');
          continue;
        }
        matched = grant;
        break;
      }
      if (matched && blocked.size === 0) {
        return { decision: 'ALLOW', reasonCodes: [], matchedGrantId: matched.id };
      }
      for (const code of grantBlocks) blocked.add(code);
    }
  }

  return { decision: 'BLOCK', reasonCodes: orderReasons(blocked) };
}

export interface CreateRightsGrantInput {
  resourceId: string;
  grantSource: string;
  evidenceRef?: string | null;
  permissions: string[];
  territories: string[];
  schoolScope: MediaSchoolScope;
  schoolId?: string | null;
  validFrom?: number | null;
  validUntil?: number | null;
  attributionRequired?: boolean;
  attributionText?: string | null;
  now?: number;
}

export function createRightsGrant(input: CreateRightsGrantInput): MediaResourceRightsGrant {
  const resourceId = clean(input.resourceId);
  if (!resourceId) fail('MEDIA_RIGHTS_INVALID_GRANT', 'Rights grant requires a resourceId.');
  if (!GRANT_SOURCE_SET.has(clean(input.grantSource))) {
    fail('MEDIA_RIGHTS_INVALID_GRANT', `Unknown grantSource: ${clean(input.grantSource) || 'empty'}.`);
  }
  const permissions = normalizePermissions(input.permissions);
  for (const permission of permissions) {
    if (!PERMISSION_SET.has(permission)) {
      fail('MEDIA_RIGHTS_INVALID_PERMISSION', `Unknown permission: ${permission}.`);
    }
  }
  if (permissions.length === 0) fail('MEDIA_RIGHTS_INVALID_GRANT', 'Rights grant requires at least one permission.');
  if (input.schoolScope !== 'GLOBAL' && input.schoolScope !== 'SCHOOL') {
    fail('MEDIA_RIGHTS_INVALID_GRANT', `Unknown schoolScope: ${clean(input.schoolScope) || 'empty'}.`);
  }
  if (input.schoolScope === 'SCHOOL' && !clean(input.schoolId)) {
    fail('MEDIA_RIGHTS_INVALID_GRANT', 'SCHOOL-scoped grants require a schoolId.');
  }
  const now = typeof input.now === 'number' && Number.isFinite(input.now) ? input.now : Date.now();
  return {
    id: randomUUID(),
    resourceId,
    grantSource: clean(input.grantSource) as MediaGrantSource,
    evidenceRef: clean(input.evidenceRef) || null,
    permissions,
    territories: normalizeTerritories(input.territories),
    schoolScope: input.schoolScope,
    schoolId: clean(input.schoolId) || null,
    validFrom: typeof input.validFrom === 'number' ? input.validFrom : null,
    validUntil: typeof input.validUntil === 'number' ? input.validUntil : null,
    revokedAt: null,
    revocationReason: null,
    attributionRequired: input.attributionRequired === true,
    attributionText: clean(input.attributionText) || null,
    createdAt: now,
    updatedAt: now,
  };
}

// Rights history is preserved: revocation stamps why an old grant stopped
// applying instead of mutating it into an unrelated contract.
export function revokeRightsGrant(
  grant: MediaResourceRightsGrant,
  args: { reason: string; evidenceRef?: string | null; now?: number },
): MediaResourceRightsGrant {
  if (!clean(args.reason)) fail('MEDIA_RIGHTS_INVALID_GRANT', 'Revocation requires a reason.');
  const now = typeof args.now === 'number' && Number.isFinite(args.now) ? args.now : Date.now();
  return {
    ...grant,
    revokedAt: now,
    revocationReason: clean(args.reason),
    evidenceRef: clean(args.evidenceRef) || grant.evidenceRef,
    updatedAt: now,
  };
}

export function createAvailabilityState(args: {
  resourceId: string;
  status?: MediaAvailabilityStatus;
  providerStatus?: string | null;
  unavailableReason?: string | null;
  nextCheckAt?: number | null;
  now?: number;
}): MediaResourceAvailabilityState {
  const resourceId = clean(args.resourceId);
  if (!resourceId) fail('MEDIA_AVAILABILITY_INVALID_STATE', 'Availability state requires a resourceId.');
  const status: MediaAvailabilityStatus = args.status ?? 'UNKNOWN';
  if (!(MEDIA_AVAILABILITY_STATUSES as readonly string[]).includes(status)) {
    fail('MEDIA_AVAILABILITY_INVALID_STATE', `Unknown availability status: ${clean(args.status) || 'empty'}.`);
  }
  const now = typeof args.now === 'number' && Number.isFinite(args.now) ? args.now : Date.now();
  return {
    resourceId,
    status,
    checkedAt: now,
    nextCheckAt: typeof args.nextCheckAt === 'number' ? args.nextCheckAt : null,
    providerStatus: clean(args.providerStatus) || null,
    unavailableReason: clean(args.unavailableReason) || null,
    createdAt: now,
    updatedAt: now,
  };
}

export interface MediaEligibilityStore {
  resourceExists(resourceId: string): Promise<boolean>;
  listGrants(resourceId: string): Promise<MediaResourceRightsGrant[]>;
  findAvailability(resourceId: string): Promise<MediaResourceAvailabilityState | null>;
}

export function createMemoryMediaEligibilityStore(): MediaEligibilityStore & {
  addResource(resourceId: string): void;
  saveGrant(grant: MediaResourceRightsGrant): void;
  saveAvailability(state: MediaResourceAvailabilityState): void;
} {
  const resources = new Set<string>();
  const grants = new Map<string, MediaResourceRightsGrant[]>();
  const availability = new Map<string, MediaResourceAvailabilityState>();
  return {
    addResource(resourceId: string): void {
      if (clean(resourceId)) resources.add(clean(resourceId));
    },
    saveGrant(grant: MediaResourceRightsGrant): void {
      const list = grants.get(grant.resourceId) ?? [];
      const index = list.findIndex((entry) => entry.id === grant.id);
      if (index >= 0) list[index] = grant;
      else list.push(grant);
      grants.set(grant.resourceId, list);
    },
    saveAvailability(state: MediaResourceAvailabilityState): void {
      availability.set(state.resourceId, state);
    },
    async resourceExists(resourceId: string): Promise<boolean> {
      return resources.has(clean(resourceId));
    },
    async listGrants(resourceId: string): Promise<MediaResourceRightsGrant[]> {
      return [...(grants.get(clean(resourceId)) ?? [])];
    },
    async findAvailability(resourceId: string): Promise<MediaResourceAvailabilityState | null> {
      return availability.get(clean(resourceId)) ?? null;
    },
  };
}

export async function evaluateMediaResourceEligibility(  args: {
    resourceId: string;
    requestedPermission: string;
    territory?: string | null;
    schoolId?: string | null;
    now: number;
    externalPolicy: MediaExternalPolicy;
  },
  store: MediaEligibilityStore,
): Promise<MediaEligibilityResult> {
  const resourceId = clean(args.resourceId);
  if (!resourceId) return { decision: 'BLOCK', reasonCodes: ['RIGHTS_NOT_FOUND'] };
  const [exists, grantList, availabilityState] = await Promise.all([
    store.resourceExists(resourceId),
    store.listGrants(resourceId),
    store.findAvailability(resourceId),
  ]);
  return evaluateMediaEligibility({
    resourceId,
    resourceExists: exists,
    requestedPermission: args.requestedPermission,
    territory: args.territory,
    schoolId: args.schoolId,
    now: args.now,
    availability: availabilityState ? availabilityState.status : null,
    grants: grantList,
    externalPolicy: args.externalPolicy,
  });
}

type GrantRow = Record<string, unknown>;
type AvailabilityRow = Record<string, unknown>;

function ms(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
  return null;
}

function rowToGrant(row: GrantRow): MediaResourceRightsGrant {
  const num = (value: unknown, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) ? Math.floor(value) : fallback;
  return {
    id: clean(row.id),
    resourceId: clean(row.resourceId),
    grantSource: clean(row.grantSource) as MediaGrantSource,
    evidenceRef: clean(row.evidenceRef) || null,
    permissions: normalizePermissions(row.permissions),
    territories: normalizeTerritories(row.territories),
    schoolScope: (clean(row.schoolScope) || 'GLOBAL') as MediaSchoolScope,
    schoolId: clean(row.schoolId) || null,
    validFrom: ms(row.validFrom),
    validUntil: ms(row.validUntil),
    revokedAt: ms(row.revokedAt),
    revocationReason: clean(row.revocationReason) || null,
    attributionRequired: row.attributionRequired === true,
    attributionText: clean(row.attributionText) || null,
    createdAt: ms(row.createdAt) ?? num(row.createdAt, 0),
    updatedAt: ms(row.updatedAt) ?? num(row.updatedAt, 0),
  };
}

function rowToAvailability(row: AvailabilityRow): MediaResourceAvailabilityState {
  return {
    resourceId: clean(row.resourceId),
    status: clean(row.status) as MediaAvailabilityStatus,
    checkedAt: ms(row.checkedAt) ?? 0,
    nextCheckAt: ms(row.nextCheckAt),
    providerStatus: clean(row.providerStatus) || null,
    unavailableReason: clean(row.unavailableReason) || null,
    createdAt: ms(row.createdAt) ?? 0,
    updatedAt: ms(row.updatedAt) ?? 0,
  };
}

// STREAM-4 production store: persisted STREAM-2/3 tables via the established
// parameterized raw-query pattern. No runtime DDL; no evaluator duplication.
export const prismaMediaEligibilityStore: MediaEligibilityStore = {
  async resourceExists(resourceId: string): Promise<boolean> {
    const rows = await prisma.$queryRawUnsafe<Array<{ one: number }>>(
      `SELECT 1 AS one FROM "MediaResource" WHERE "id" = $1 LIMIT 1`,
      clean(resourceId),
    );
    return rows.length > 0;
  },
  async listGrants(resourceId: string): Promise<MediaResourceRightsGrant[]> {
    const rows = await prisma.$queryRawUnsafe<GrantRow[]>(
      `SELECT * FROM "MediaResourceRightsGrant" WHERE "resourceId" = $1`,
      clean(resourceId),
    );
    return rows.map(rowToGrant);
  },
  async findAvailability(resourceId: string): Promise<MediaResourceAvailabilityState | null> {
    const rows = await prisma.$queryRawUnsafe<AvailabilityRow[]>(
      `SELECT * FROM "MediaResourceAvailabilityState" WHERE "resourceId" = $1 LIMIT 1`,
      clean(resourceId),
    );
    return rows[0] ? rowToAvailability(rows[0]) : null;
  },
};

// Production ProviderRightsGrantStore: durable adapter over the existing
// MediaResourceRightsGrant table (STREAM-3 authority). No new table, no
// second registry. saveGrant persists the deterministic grant row by id
// (INSERT ... ON CONFLICT(id) DO NOTHING + read-back); listGrants reads the
// existing table. Failures propagate; never falls back to memory.
export const prismaProviderRightsGrantStore: ProviderRightsGrantStore = {
  async listGrants(resourceId: string): Promise<MediaResourceRightsGrant[]> {
    return prismaMediaEligibilityStore.listGrants(resourceId);
  },
  async saveGrant(grant: MediaResourceRightsGrant): Promise<MediaResourceRightsGrant> {
    await prisma.$queryRawUnsafe(
      `INSERT INTO "MediaResourceRightsGrant"
         ("id","resourceId","grantSource","evidenceRef","permissions","territories","schoolScope","schoolId",
          "validFrom","validUntil","revokedAt","revocationReason","attributionRequired","attributionText","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,$5::text[],$6::text[],$7,$8,
               CASE WHEN $9::bigint IS NULL THEN NULL ELSE to_timestamp($9::bigint / 1000.0) END,
               CASE WHEN $10::bigint IS NULL THEN NULL ELSE to_timestamp($10::bigint / 1000.0) END,
               CASE WHEN $11::bigint IS NULL THEN NULL ELSE to_timestamp($11::bigint / 1000.0) END,
               $12,$13,$14,to_timestamp($15 / 1000.0),to_timestamp($15 / 1000.0))
       ON CONFLICT ("id") DO NOTHING`,
      clean(grant.id),
      clean(grant.resourceId),
      grant.grantSource,
      grant.evidenceRef,
      grant.permissions,
      grant.territories,
      grant.schoolScope,
      grant.schoolId,
      grant.validFrom,
      grant.validUntil,
      grant.revokedAt,
      grant.revocationReason,
      grant.attributionRequired,
      grant.attributionText,
      Date.now(),
    );
    const rows = await prisma.$queryRawUnsafe<GrantRow[]>(
      `SELECT * FROM "MediaResourceRightsGrant" WHERE "id" = $1 LIMIT 1`,
      clean(grant.id),
    );
    if (!rows[0]) fail('MEDIA_RIGHTS_DB_ERROR', 'Provider rights persistence failed.');
    return rowToGrant(rows[0]);
  },
};

// STREAM-13 — idempotent provider-derived rights persistence (additive).
// Provider evidence is validated here and translated into the existing
// STREAM-3 rights authority. No new table, no replacement of STREAM-3.

import { createHash } from 'crypto';
import type { MediaProviderSupplyClass, ProviderRightsEvidence } from './mediaProviderPort';

const PROVIDER_EVIDENCE_SOURCES = new Set(['PROVIDER_TERMS', 'DIRECT_LICENSE', 'OPEN_LICENSE', 'PUBLIC_DOMAIN']);

export function deriveProviderRightsGrantId(args: {
  resourceId: string;
  providerKey: string;
  evidenceRef: string;
}): string {
  const canonical = `${clean(args.resourceId)}|${clean(args.providerKey).toLowerCase()}|${clean(args.evidenceRef)}`;
  return `prights_${createHash('sha256').update(canonical).digest('hex').slice(0, 32)}`;
}

export interface ValidatedProviderGrantInput {
  resourceId: string;
  grantSource: MediaGrantSource;
  evidenceRef: string;
  permissions: string[];
  territories: string[];
  schoolScope: MediaSchoolScope;
  schoolId: string | null;
  validFrom: number | null;
  validUntil: number | null;
  attributionRequired: boolean;
  attributionText: string | null;
}

export function validateProviderRightsEvidence(args: {
  evidence: ProviderRightsEvidence;
  supplyClass: MediaProviderSupplyClass | undefined;
  resourceId: string;
  verifiedSchoolId: string | null;
  now?: number;
}): { ok: true; grant: ValidatedProviderGrantInput } | { ok: false; reason: string } {
  const evidence = args.evidence;
  const evidenceRef = clean(evidence?.evidenceRef);
  if (!evidenceRef) return { ok: false, reason: 'INVALID_RIGHTS_EVIDENCE:empty_evidenceRef' };
  if (!PROVIDER_EVIDENCE_SOURCES.has(clean(evidence?.source))) {
    return { ok: false, reason: 'INVALID_RIGHTS_EVIDENCE:unknown_source' };
  }
  const source = clean(evidence.source) as MediaGrantSource;
  // Licensed supply class law: only LICENSED adapters may emit DIRECT_LICENSE.
  if (source === 'DIRECT_LICENSE' && args.supplyClass !== 'LICENSED') {
    return { ok: false, reason: 'INVALID_RIGHTS_EVIDENCE:public_adapter_direct_license' };
  }
  const permissions = Array.isArray(evidence.permissions) ? evidence.permissions.map(clean).filter(Boolean) : [];
  if (permissions.length === 0) return { ok: false, reason: 'INVALID_RIGHTS_EVIDENCE:empty_permissions' };
  for (const permission of permissions) {
    if (!PERMISSION_SET.has(permission)) return { ok: false, reason: `INVALID_RIGHTS_EVIDENCE:unknown_permission:${permission}` };
  }
  const territories = Array.isArray(evidence.territories)
    ? [...new Set(evidence.territories.map((entry) => clean(entry).toUpperCase()).filter(Boolean))]
    : [];
  // Territory list is explicit: empty covers nothing, so reject the evidence.
  if (territories.length === 0) return { ok: false, reason: 'INVALID_RIGHTS_EVIDENCE:empty_territories' };
  const parseBound = (value: unknown): number | null | 'INVALID' => {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number' && Number.isFinite(value)) return Math.floor(value);
    if (typeof value === 'string' && value.trim()) {
      const parsed = Date.parse(value.trim());
      if (!Number.isFinite(parsed)) return 'INVALID';
      return parsed;
    }
    return 'INVALID';
  };
  const validFrom = parseBound(evidence.validFrom);
  const validUntil = parseBound(evidence.validUntil);
  if (validFrom === 'INVALID' || validUntil === 'INVALID') {
    return { ok: false, reason: 'INVALID_RIGHTS_EVIDENCE:bad_validity' };
  }
  if (validFrom !== null && validUntil !== null && validUntil <= validFrom) {
    return { ok: false, reason: 'INVALID_RIGHTS_EVIDENCE:inverted_validity' };
  }
  const attributionRequired = evidence.attributionRequired === true;
  const attributionText = clean(evidence.attributionText) || null;
  if (attributionRequired && !attributionText) {
    return { ok: false, reason: 'INVALID_RIGHTS_EVIDENCE:attribution_incoherent' };
  }
  const scope = clean(evidence.scope) === 'REQUESTING_SCHOOL' ? 'REQUESTING_SCHOOL' : 'GLOBAL';
  if (scope === 'REQUESTING_SCHOOL') {
    // Provider can never choose an arbitrary tenant: only the verified
    // internal school may be bound, and only when it exists.
    const verified = clean(args.verifiedSchoolId);
    if (!verified) return { ok: false, reason: 'INVALID_RIGHTS_EVIDENCE:no_verified_school' };
    return {
      ok: true,
      grant: {
        resourceId: clean(args.resourceId),
        grantSource: source,
        evidenceRef,
        permissions,
        territories,
        schoolScope: 'SCHOOL',
        schoolId: verified,
        validFrom,
        validUntil,
        attributionRequired,
        attributionText,
      },
    };
  }
  return {
    ok: true,
    grant: {
      resourceId: clean(args.resourceId),
      grantSource: source,
      evidenceRef,
      permissions,
      territories,
      schoolScope: 'GLOBAL',
      schoolId: null,
      validFrom,
      validUntil,
      attributionRequired,
      attributionText,
    },
  };
}

export interface ProviderRightsGrantStore {
  saveGrant(grant: MediaResourceRightsGrant): Promise<MediaResourceRightsGrant> | MediaResourceRightsGrant | void;
  listGrants?(resourceId: string): Promise<MediaResourceRightsGrant[]>;
}

// Deterministic identity: resourceId + providerKey + evidenceRef.
// INSERT ... ON CONFLICT(id) DO UPDATE equivalent: same identity converges.
export async function upsertProviderRightsGrant(
  args: { resourceId: string; providerKey: string; grant: ValidatedProviderGrantInput; now?: number },
  store: ProviderRightsGrantStore,
): Promise<MediaResourceRightsGrant> {
  const now = typeof args.now === 'number' && Number.isFinite(args.now) ? args.now : Date.now();
  const id = deriveProviderRightsGrantId({
    resourceId: args.resourceId,
    providerKey: args.providerKey,
    evidenceRef: args.grant.evidenceRef,
  });
  const existing = await store.listGrants?.(clean(args.resourceId)).catch(() => [] as MediaResourceRightsGrant[]);
  const same = (existing ?? []).find((entry) => entry.id === id);
  if (same) return same;
  const created: MediaResourceRightsGrant = {
    id,
    resourceId: clean(args.resourceId),
    grantSource: args.grant.grantSource,
    evidenceRef: args.grant.evidenceRef,
    permissions: [...args.grant.permissions],
    territories: [...args.grant.territories],
    schoolScope: args.grant.schoolScope,
    schoolId: args.grant.schoolId,
    validFrom: args.grant.validFrom,
    validUntil: args.grant.validUntil,
    revokedAt: null,
    revocationReason: null,
    attributionRequired: args.grant.attributionRequired,
    attributionText: args.grant.attributionText,
    createdAt: now,
    updatedAt: now,
  };
  const saved = await store.saveGrant(created);
  return (saved as MediaResourceRightsGrant | void | undefined) instanceof Object
    ? (saved as MediaResourceRightsGrant)
    : created;
}

// Production persistence through the existing rights table. History is
// preserved: a new evidenceRef yields a new row; repeats converge by id.
// Single durable write path: delegates to upsertProviderRightsGrant with the
// production prismaProviderRightsGrantStore (sole SQL owner).
export async function persistProviderRightsGrant(args: {
  resourceId: string;
  providerKey: string;
  grant: ValidatedProviderGrantInput;
  now?: number;
}): Promise<MediaResourceRightsGrant> {
  return upsertProviderRightsGrant(args, prismaProviderRightsGrantStore);
}
