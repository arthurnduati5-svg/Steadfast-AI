import { createHash, randomUUID } from 'crypto';
import prisma from '../lib/prisma';

// STREAM-2 — canonical media resource registry + learner state separation.
// MediaResource owns canonical content identity. UserMediaResourceState owns
// one learner's relationship to a resource. MediaAsset remains only for
// generated/private compatibility and must not become a second registry.

export type MediaResourceScope = 'GLOBAL' | 'SCHOOL' | 'USER';

export interface UpsertMediaResourceInput {
  scope: MediaResourceScope;
  schoolId?: string | null;
  ownerUserId?: string | null;
  mediaKind: string;
  title: string;
  description?: string | null;
  summary?: string | null;
  subject?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  language?: string | null;
  tags?: string[];
  provider?: string | null;
  providerResourceId?: string | null;
  sourceUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
  sourceTrust?: string | null;
  safetyStatus?: string | null;
  metadata?: Record<string, unknown> | null;
  stableResourceKey?: string | null;
}

export interface MediaResource {
  id: string;
  canonicalKey: string;
  scope: MediaResourceScope;
  schoolId: string | null;
  ownerUserId: string | null;
  mediaKind: string;
  title: string;
  description: string | null;
  summary: string | null;
  subject: string | null;
  topic: string | null;
  subtopic: string | null;
  language: string | null;
  tags: string[];
  provider: string | null;
  providerResourceId: string | null;
  sourceUrl: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
  sourceTrust: string | null;
  safetyStatus: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UserMediaResourceState {
  id: string;
  userId: string;
  resourceId: string;
  schoolId: string | null;
  isSaved: boolean;
  isPinned: boolean;
  isCompleted: boolean;
  isHelpful: boolean | null;
  playbackPositionSec: number;
  interactionCount: number;
  completionCount: number;
  lastOpenedAt: string | null;
  lastPlayedAt: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ResourceStateAction =
  | 'open'
  | 'play'
  | 'complete'
  | 'helpful'
  | 'unhelpful'
  | 'save'
  | 'unsave'
  | 'pin'
  | 'unpin';

function fail(code: string, message: string): never {
  throw new Error(`[${code}] ${message}`);
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeProvider(provider: unknown): string {
  return clean(provider).toLowerCase();
}

function normalizeProviderId(providerResourceId: unknown): string {
  // Preserve meaningful case (provider IDs may be case-sensitive);
  // remove surrounding whitespace only.
  return typeof providerResourceId === 'string' ? providerResourceId.trim() : '';
}

function normalizeUrl(raw: unknown): string {
  const url = clean(raw);
  if (!url) return '';
  // Bounded normalization: whitespace + trailing slash only.
  // No tracking-query rewriting without an established helper.
  return url.replace(/\/+$/, '');
}

function sha1Hex(value: string): string {
  return createHash('sha1').update(value).digest('hex');
}

export function buildProviderCanonicalKey(provider: unknown, providerResourceId: unknown): string {
  const p = normalizeProvider(provider);
  const id = normalizeProviderId(providerResourceId);
  if (!p || !id) fail('MEDIA_RESOURCE_INVALID_IDENTITY', 'Provider identity requires provider and providerResourceId.');
  return `provider:${p}:${id}`;
}

export function buildUrlCanonicalKey(sourceUrl: unknown): string {
  const url = normalizeUrl(sourceUrl);
  if (!url) fail('MEDIA_RESOURCE_INVALID_IDENTITY', 'URL identity requires a source URL.');
  return `url:${sha1Hex(url.toLowerCase())}`;
}

export function buildUserCanonicalKey(ownerUserId: unknown, stableKey: unknown): string {
  const owner = clean(ownerUserId);
  const key = clean(stableKey);
  if (!owner) fail('MEDIA_RESOURCE_USER_SCOPE_NO_OWNER', 'USER scope requires ownerUserId.');
  if (!key) fail('MEDIA_RESOURCE_INVALID_IDENTITY', 'USER scope requires a stable resource key.');
  return `user:${owner}:${sha1Hex(key)}`;
}

export function buildSchoolCanonicalKey(schoolId: unknown, stableKey: unknown): string {
  const school = clean(schoolId);
  const key = clean(stableKey);
  if (!school) fail('MEDIA_RESOURCE_SCHOOL_SCOPE_NO_SCHOOL', 'SCHOOL scope requires schoolId.');
  if (!key) fail('MEDIA_RESOURCE_INVALID_IDENTITY', 'SCHOOL scope requires a stable resource key.');
  return `school:${school}:${sha1Hex(key)}`;
}

export function buildCanonicalKey(input: {
  scope: MediaResourceScope;
  provider?: string | null;
  providerResourceId?: string | null;
  sourceUrl?: string | null;
  schoolId?: string | null;
  ownerUserId?: string | null;
  stableResourceKey?: string | null;
}): string {
  const scope = input.scope;
  if (scope !== 'GLOBAL' && scope !== 'SCHOOL' && scope !== 'USER') {
    fail('MEDIA_RESOURCE_INVALID_SCOPE', `Unknown scope: ${clean(scope) || 'empty'}.`);
  }
  if (scope === 'USER') {
    if (!clean(input.ownerUserId)) fail('MEDIA_RESOURCE_USER_SCOPE_NO_OWNER', 'USER scope requires ownerUserId.');
    if (clean(input.providerResourceId) && clean(input.provider)) {
      return `user:${clean(input.ownerUserId)}:${normalizeProvider(input.provider)}:${normalizeProviderId(input.providerResourceId)}`;
    }
    return buildUserCanonicalKey(input.ownerUserId, input.stableResourceKey ?? input.sourceUrl);
  }
  if (scope === 'SCHOOL') {
    if (!clean(input.schoolId)) fail('MEDIA_RESOURCE_SCHOOL_SCOPE_NO_SCHOOL', 'SCHOOL scope requires schoolId.');
    if (clean(input.providerResourceId) && clean(input.provider)) {
      return `school:${clean(input.schoolId)}:${normalizeProvider(input.provider)}:${normalizeProviderId(input.providerResourceId)}`;
    }
    return buildSchoolCanonicalKey(input.schoolId, input.stableResourceKey ?? input.sourceUrl);
  }
  // GLOBAL: provider identity preferred; URL fallback only when no provider ID.
  if (clean(input.provider) && clean(input.providerResourceId)) {
    return buildProviderCanonicalKey(input.provider, input.providerResourceId);
  }
  if (clean(input.sourceUrl)) return buildUrlCanonicalKey(input.sourceUrl);
  fail('MEDIA_RESOURCE_INVALID_IDENTITY', 'GLOBAL scope requires provider identity or a canonical URL.');
}

function validateUpsertInput(input: UpsertMediaResourceInput): void {
  if (!clean(input.mediaKind)) fail('MEDIA_RESOURCE_INVALID_IDENTITY', 'mediaKind is required.');
  if (!clean(input.title)) fail('MEDIA_RESOURCE_INVALID_IDENTITY', 'title is required.');
  if (input.scope === 'USER' && !clean(input.ownerUserId)) {
    fail('MEDIA_RESOURCE_USER_SCOPE_NO_OWNER', 'USER scope requires ownerUserId.');
  }
  if (input.scope === 'SCHOOL' && !clean(input.schoolId)) {
    fail('MEDIA_RESOURCE_SCHOOL_SCOPE_NO_SCHOOL', 'SCHOOL scope requires schoolId.');
  }
  // Never silently promote USER content to GLOBAL: caller must pass scope USER.
  if (input.scope === 'GLOBAL' && clean(input.ownerUserId) && !clean(input.provider) && !clean(input.sourceUrl)) {
    fail('MEDIA_RESOURCE_INVALID_IDENTITY', 'Private generated content must use USER scope.');
  }
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => clean(entry)).filter(Boolean);
}

type ResourceRow = Record<string, unknown>;
type StateRow = Record<string, unknown>;

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return typeof value === 'string' ? value : '';
}

function mapResourceRow(row: ResourceRow): MediaResource {
  const rawTags = row.tags;
  const tags = Array.isArray(rawTags) ? toStringArray(rawTags) : toStringArray([]);
  let metadata: Record<string, unknown> = {};
  const rawMeta = row.metadata;
  if (rawMeta && typeof rawMeta === 'object' && !Array.isArray(rawMeta)) metadata = rawMeta as Record<string, unknown>;
  else if (typeof rawMeta === 'string' && rawMeta.trim()) {
    try {
      const parsed: unknown = JSON.parse(rawMeta);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) metadata = parsed as Record<string, unknown>;
    } catch { metadata = {}; }
  }
  return {
    id: clean(row.id),
    canonicalKey: clean(row.canonicalKey),
    scope: (clean(row.scope) || 'GLOBAL') as MediaResourceScope,
    schoolId: clean(row.schoolId) || null,
    ownerUserId: clean(row.ownerUserId) || null,
    mediaKind: clean(row.mediaKind),
    title: clean(row.title),
    description: clean(row.description) || null,
    summary: clean(row.summary) || null,
    subject: clean(row.subject) || null,
    topic: clean(row.topic) || null,
    subtopic: clean(row.subtopic) || null,
    language: clean(row.language) || null,
    tags,
    provider: clean(row.provider) || null,
    providerResourceId: typeof row.providerResourceId === 'string' ? row.providerResourceId.trim() || null : null,
    sourceUrl: clean(row.sourceUrl) || null,
    thumbnailUrl: clean(row.thumbnailUrl) || null,
    durationSec: typeof row.durationSec === 'number' ? row.durationSec : null,
    sourceTrust: clean(row.sourceTrust) || null,
    safetyStatus: clean(row.safetyStatus) || null,
    metadata,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

function mapStateRow(row: StateRow): UserMediaResourceState {
  const bool = (value: unknown, fallback: boolean): boolean =>
    typeof value === 'boolean' ? value : fallback;
  const num = (value: unknown): number =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return {
    id: clean(row.id),
    userId: clean(row.userId),
    resourceId: clean(row.resourceId),
    schoolId: clean(row.schoolId) || null,
    isSaved: bool(row.isSaved, false),
    isPinned: bool(row.isPinned, false),
    isCompleted: bool(row.isCompleted, false),
    isHelpful: typeof row.isHelpful === 'boolean' ? row.isHelpful : null,
    playbackPositionSec: num(row.playbackPositionSec),
    interactionCount: num(row.interactionCount),
    completionCount: num(row.completionCount),
    lastOpenedAt: clean(row.lastOpenedAt) || null,
    lastPlayedAt: clean(row.lastPlayedAt) || null,
    lastReviewedAt: clean(row.lastReviewedAt) || null,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

let assertRegistrySchemaPromise: Promise<void> | null = null;

// STREAM-2 schema ownership: Prisma migration
// 20260930000000_stream2_media_resource_registry provisions MediaResource +
// UserMediaResourceState. Production runtime assumes the migration ran and
// fails explicitly when the schema is missing. No runtime DDL here.
export async function assertMediaRegistrySchema(): Promise<void> {
  if (!assertRegistrySchemaPromise) {
    assertRegistrySchemaPromise = (async () => {
      try {
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "MediaResource" LIMIT 1`);
        await prisma.$queryRawUnsafe(`SELECT 1 FROM "UserMediaResourceState" LIMIT 1`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (/does not exist|42P01|relation .* not/i.test(message)) {
          fail(
            'MEDIA_RESOURCE_SCHEMA_MISSING',
            'Media registry schema is not provisioned. Apply Prisma migrations before serving registry traffic.',
          );
        }
        throw error;
      }
    })().catch((error) => {
      assertRegistrySchemaPromise = null;
      throw error;
    });
  }
  return assertRegistrySchemaPromise;
}

// Store abstraction: Prisma-backed by default; tests inject the memory store.
export interface MediaResourceStore {
  findResourceByKey(canonicalKey: string): Promise<MediaResource | null>;
  findResourcesByKeys?(keys: string[]): Promise<MediaResource[]>;
  findResourceById(resourceId: string): Promise<MediaResource | null>;
  insertResourceIgnoreConflict(resource: MediaResource): Promise<MediaResource>;
  findState(userId: string, resourceId: string): Promise<UserMediaResourceState | null>;
  insertStateIgnoreConflict(state: UserMediaResourceState): Promise<UserMediaResourceState>;
  saveState(state: UserMediaResourceState): Promise<UserMediaResourceState>;
  resourceExists(resourceId: string): Promise<boolean>;
}

function rowToInsertable(resource: MediaResource): unknown[] {
  return [
    resource.id,
    resource.canonicalKey,
    resource.scope,
    resource.schoolId,
    resource.ownerUserId,
    resource.mediaKind,
    resource.title,
    resource.description,
    resource.summary,
    resource.subject,
    resource.topic,
    resource.subtopic,
    resource.language,
    resource.tags,
    resource.provider,
    resource.providerResourceId,
    resource.sourceUrl,
    resource.thumbnailUrl,
    resource.durationSec,
    resource.sourceTrust,
    resource.safetyStatus,
    JSON.stringify(resource.metadata || {}),
  ];
}

export const prismaMediaResourceStore: MediaResourceStore = {
  async findResourceByKey(canonicalKey: string) {
    await assertMediaRegistrySchema();
    const rows = await prisma.$queryRawUnsafe<ResourceRow[]>(
      `SELECT * FROM "MediaResource" WHERE "canonicalKey" = $1 LIMIT 1`,
      canonicalKey,
    );
    return rows[0] ? mapResourceRow(rows[0]) : null;
  },
  async findResourceById(resourceId: string) {
    await assertMediaRegistrySchema();
    const rows = await prisma.$queryRawUnsafe<ResourceRow[]>(
      `SELECT * FROM "MediaResource" WHERE "id" = $1 LIMIT 1`,
      resourceId,
    );
    return rows[0] ? mapResourceRow(rows[0]) : null;
  },
  async findResourcesByKeys(keys: string[]) {
    await assertMediaRegistrySchema();
    const deduped = [...new Set(keys.map((key) => clean(key)).filter(Boolean))].slice(0, 120);
    if (deduped.length === 0) return [];
    const rows = await prisma.$queryRawUnsafe<ResourceRow[]>(
      `SELECT * FROM "MediaResource" WHERE "canonicalKey" = ANY($1::text[])`,
      deduped,
    );
    return rows.map(mapResourceRow);
  },
  async insertResourceIgnoreConflict(resource: MediaResource) {
    await assertMediaRegistrySchema();
    // DB uniqueness on canonicalKey is the final authority; concurrent
    // equivalent upserts collapse to one row via ON CONFLICT DO NOTHING.
    await prisma.$queryRawUnsafe(
      `INSERT INTO "MediaResource" ("id","canonicalKey","scope","schoolId","ownerUserId","mediaKind","title","description","summary","subject","topic","subtopic","language","tags","provider","providerResourceId","sourceUrl","thumbnailUrl","durationSec","sourceTrust","safetyStatus","metadata")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::text[],$15,$16,$17,$18,$19,$20,$21,$22::jsonb)
       ON CONFLICT ("canonicalKey") DO NOTHING`,
      ...rowToInsertable(resource),
    );
    const rows = await prisma.$queryRawUnsafe<ResourceRow[]>(
      `SELECT * FROM "MediaResource" WHERE "canonicalKey" = $1 LIMIT 1`,
      resource.canonicalKey,
    );
    if (!rows[0]) fail('MEDIA_RESOURCE_DB_ERROR', 'Canonical resource persistence failed.');
    return mapResourceRow(rows[0]);
  },
  async findState(userId: string, resourceId: string) {
    await assertMediaRegistrySchema();
    const rows = await prisma.$queryRawUnsafe<StateRow[]>(
      `SELECT * FROM "UserMediaResourceState" WHERE "userId" = $1 AND "resourceId" = $2 LIMIT 1`,
      userId,
      resourceId,
    );
    return rows[0] ? mapStateRow(rows[0]) : null;
  },
  async insertStateIgnoreConflict(state: UserMediaResourceState) {
    await assertMediaRegistrySchema();
    await prisma.$queryRawUnsafe(
      `INSERT INTO "UserMediaResourceState" ("id","userId","resourceId","schoolId","isSaved","isPinned","isCompleted","isHelpful","playbackPositionSec","interactionCount","completionCount","lastOpenedAt","lastPlayedAt","lastReviewedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT ("userId","resourceId") DO NOTHING`,
      state.id, state.userId, state.resourceId, state.schoolId, state.isSaved, state.isPinned,
      state.isCompleted, state.isHelpful, state.playbackPositionSec, state.interactionCount,
      state.completionCount, state.lastOpenedAt, state.lastPlayedAt, state.lastReviewedAt,
    );
    const rows = await prisma.$queryRawUnsafe<StateRow[]>(
      `SELECT * FROM "UserMediaResourceState" WHERE "userId" = $1 AND "resourceId" = $2 LIMIT 1`,
      state.userId,
      state.resourceId,
    );
    if (!rows[0]) fail('MEDIA_RESOURCE_DB_ERROR', 'Learner state persistence failed.');
    return mapStateRow(rows[0]);
  },
  async saveState(state: UserMediaResourceState) {
    await assertMediaRegistrySchema();
    const rows = await prisma.$queryRawUnsafe<StateRow[]>(
      `UPDATE "UserMediaResourceState"
       SET "schoolId" = $3, "isSaved" = $4, "isPinned" = $5, "isCompleted" = $6, "isHelpful" = $7,
           "playbackPositionSec" = $8, "interactionCount" = $9, "completionCount" = $10,
           "lastOpenedAt" = $11, "lastPlayedAt" = $12, "lastReviewedAt" = $13,
           "updatedAt" = CURRENT_TIMESTAMP
       WHERE "userId" = $1 AND "resourceId" = $2 RETURNING *`,
      state.userId, state.resourceId, state.schoolId, state.isSaved, state.isPinned,
      state.isCompleted, state.isHelpful, state.playbackPositionSec, state.interactionCount,
      state.completionCount, state.lastOpenedAt, state.lastPlayedAt, state.lastReviewedAt,
    );
    if (!rows[0]) fail('MEDIA_RESOURCE_NOT_FOUND', 'Learner state row is missing.');
    return mapStateRow(rows[0]);
  },
  async resourceExists(resourceId: string) {
    await assertMediaRegistrySchema();
    const rows = await prisma.$queryRawUnsafe<Array<{ one: number }>>(
      `SELECT 1 AS one FROM "MediaResource" WHERE "id" = $1 LIMIT 1`,
      resourceId,
    );
    return rows.length > 0;
  },
};

export function createMemoryMediaResourceStore(): MediaResourceStore & {
  resourceCount(): number;
  stateCount(): number;
} {
  const byKey = new Map<string, MediaResource>();
  const byId = new Map<string, MediaResource>();
  const states = new Map<string, UserMediaResourceState>();
  // Promise-chain mutex per canonicalKey + per state key: concurrent
  // equivalent upserts serialize and resolve to ONE row.
  const locks = new Map<string, Promise<unknown>>();
  function serialize<T>(key: string, work: () => Promise<T> | T): Promise<T> {
    const prior = locks.get(key) ?? Promise.resolve();
    const next = (prior as Promise<unknown>).then(() => work());
    locks.set(key, next.catch(() => undefined));
    return next as Promise<T>;
  }
  const stateKey = (userId: string, resourceId: string): string => `${userId}::${resourceId}`;
  return {
    resourceCount: () => byId.size,
    stateCount: () => states.size,
    async findResourceByKey(canonicalKey: string) {
      return byKey.get(canonicalKey) ?? null;
    },
    async findResourceById(resourceId: string) {
      return byId.get(resourceId) ?? null;
    },
    async findResourcesByKeys(keys: string[]) {
      const deduped = [...new Set(keys.map((key) => clean(key)).filter(Boolean))].slice(0, 120);
      const found: MediaResource[] = [];
      for (const key of deduped) {
        const resource = byKey.get(key);
        if (resource) found.push(resource);
      }
      return found;
    },
    async insertResourceIgnoreConflict(resource: MediaResource) {
      return serialize(`resource:${resource.canonicalKey}`, () => {
        const existing = byKey.get(resource.canonicalKey);
        if (existing) return existing;
        byKey.set(resource.canonicalKey, resource);
        byId.set(resource.id, resource);
        return resource;
      });
    },
    async findState(userId: string, resourceId: string) {
      return states.get(stateKey(userId, resourceId)) ?? null;
    },
    async insertStateIgnoreConflict(state: UserMediaResourceState) {
      return serialize(`state:${stateKey(state.userId, state.resourceId)}`, () => {
        const existing = states.get(stateKey(state.userId, state.resourceId));
        if (existing) return existing;
        states.set(stateKey(state.userId, state.resourceId), state);
        return state;
      });
    },
    async saveState(state: UserMediaResourceState) {
      return serialize(`state:${stateKey(state.userId, state.resourceId)}`, () => {
        const key = stateKey(state.userId, state.resourceId);
        if (!states.has(key)) fail('MEDIA_RESOURCE_NOT_FOUND', 'Learner state row is missing.');
        states.set(key, state);
        return state;
      });
    },
    async resourceExists(resourceId: string) {
      return byId.has(resourceId);
    },
  };
}

function buildResourceFromInput(input: UpsertMediaResourceInput, canonicalKey: string): MediaResource {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    canonicalKey,
    scope: input.scope,
    schoolId: clean(input.schoolId) || null,
    ownerUserId: clean(input.ownerUserId) || null,
    mediaKind: clean(input.mediaKind),
    title: clean(input.title) || 'Untitled media resource',
    description: clean(input.description) || null,
    summary: clean(input.summary) || null,
    subject: clean(input.subject) || null,
    topic: clean(input.topic) || null,
    subtopic: clean(input.subtopic) || null,
    language: clean(input.language) || null,
    tags: toStringArray(input.tags),
    provider: normalizeProvider(input.provider) || null,
    providerResourceId: normalizeProviderId(input.providerResourceId) || null,
    sourceUrl: normalizeUrl(input.sourceUrl) || null,
    thumbnailUrl: clean(input.thumbnailUrl) || null,
    durationSec:
      typeof input.durationSec === 'number' && Number.isFinite(input.durationSec)
        ? Math.max(0, Math.round(input.durationSec))
        : null,
    sourceTrust: clean(input.sourceTrust) || null,
    safetyStatus: clean(input.safetyStatus) || null,
    metadata: input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
    createdAt: now,
    updatedAt: now,
  };
}

export async function upsertMediaResource(
  input: UpsertMediaResourceInput,
  store: MediaResourceStore = prismaMediaResourceStore,
): Promise<MediaResource> {
  validateUpsertInput(input);
  const canonicalKey = buildCanonicalKey({
    scope: input.scope,
    provider: input.provider,
    providerResourceId: input.providerResourceId,
    sourceUrl: input.sourceUrl,
    schoolId: input.schoolId,
    ownerUserId: input.ownerUserId,
    stableResourceKey: input.stableResourceKey,
  });
  try {
    return await store.insertResourceIgnoreConflict(buildResourceFromInput(input, canonicalKey));
  } catch (error) {
    if (error instanceof Error && error.message.includes('MEDIA_RESOURCE_')) throw error;
    fail('MEDIA_RESOURCE_DB_ERROR', 'Canonical resource persistence failed.');
  }
}

function assertStateScope(args: { userId: string; schoolId?: string | null; state: UserMediaResourceState }): void {
  if (!clean(args.userId)) fail('MEDIA_RESOURCE_UNAUTHORIZED', 'Learner identity is required.');
  if (args.state.userId !== args.userId) {
    fail('MEDIA_RESOURCE_UNAUTHORIZED', 'Cross-user state access is denied.');
  }
  const callerSchool = clean(args.schoolId);
  const rowSchool = clean(args.state.schoolId);
  // Fail closed: an authoritative caller school must exactly match the row.
  // A missing row school never satisfies an authoritative caller school.
  if (callerSchool && rowSchool !== callerSchool) {
    fail('MEDIA_RESOURCE_UNAUTHORIZED', 'Cross-school state access is denied.');
  }
}

export async function getOrCreateUserMediaResourceState(
  args: { userId: string; resourceId: string; schoolId?: string | null },
  store: MediaResourceStore = prismaMediaResourceStore,
): Promise<UserMediaResourceState> {
  const userId = clean(args.userId);
  const resourceId = clean(args.resourceId);
  if (!userId) fail('MEDIA_RESOURCE_UNAUTHORIZED', 'Learner identity is required.');
  if (!resourceId) fail('MEDIA_RESOURCE_NOT_FOUND', 'Resource identity is required.');
  let exists = false;
  try {
    exists = await store.resourceExists(resourceId);
  } catch {
    fail('MEDIA_RESOURCE_DB_ERROR', 'Learner state persistence failed.');
  }
  if (!exists) fail('MEDIA_RESOURCE_NOT_FOUND', 'Canonical resource does not exist.');
  const now = new Date().toISOString();
  try {
    const created = await store.insertStateIgnoreConflict({
      id: randomUUID(),
      userId,
      resourceId,
      schoolId: clean(args.schoolId) || null,
      isSaved: false,
      isPinned: false,
      isCompleted: false,
      isHelpful: null,
      playbackPositionSec: 0,
      interactionCount: 0,
      completionCount: 0,
      lastOpenedAt: null,
      lastPlayedAt: null,
      lastReviewedAt: null,
      createdAt: now,
      updatedAt: now,
    });
    assertStateScope({ userId, schoolId: args.schoolId, state: created });
    return created;
  } catch (error) {
    if (error instanceof Error && error.message.includes('MEDIA_RESOURCE_')) throw error;
    fail('MEDIA_RESOURCE_DB_ERROR', 'Learner state persistence failed.');
  }
}

export interface UpdateUserMediaResourceStateInput {
  userId: string;
  resourceId: string;
  schoolId?: string | null;
  isSaved?: boolean;
  isPinned?: boolean;
  isCompleted?: boolean;
  isHelpful?: boolean | null;
  playbackPositionSec?: number;
  recordOpen?: boolean;
  recordPlay?: boolean;
  recordReview?: boolean;
}

export async function updateUserMediaResourceState(
  input: UpdateUserMediaResourceStateInput,
  store: MediaResourceStore = prismaMediaResourceStore,
): Promise<UserMediaResourceState> {
  const current = await getOrCreateUserMediaResourceState(
    { userId: input.userId, resourceId: input.resourceId, schoolId: input.schoolId },
    store,
  );
  const now = new Date().toISOString();
  const next: UserMediaResourceState = {
    ...current,
    isSaved: typeof input.isSaved === 'boolean' ? input.isSaved : current.isSaved,
    isPinned: typeof input.isPinned === 'boolean' ? input.isPinned : current.isPinned,
    isCompleted: typeof input.isCompleted === 'boolean' ? input.isCompleted : current.isCompleted,
    isHelpful: typeof input.isHelpful === 'undefined' ? current.isHelpful : input.isHelpful,
    playbackPositionSec:
      typeof input.playbackPositionSec === 'number' && Number.isFinite(input.playbackPositionSec)
        ? Math.max(0, Math.round(input.playbackPositionSec))
        : current.playbackPositionSec,
    interactionCount: current.interactionCount + 1,
    completionCount:
      input.isCompleted === true && current.isCompleted === false
        ? current.completionCount + 1
        : current.completionCount,
    lastOpenedAt: input.recordOpen ? now : current.lastOpenedAt,
    lastPlayedAt: input.recordPlay ? now : current.lastPlayedAt,
    lastReviewedAt:
      input.recordReview || input.isCompleted === true ? now : current.lastReviewedAt,
    updatedAt: now,
  };
  try {
    return await store.saveState(next);
  } catch (error) {
    if (error instanceof Error && error.message.includes('MEDIA_RESOURCE_')) throw error;
    fail('MEDIA_RESOURCE_DB_ERROR', 'Learner state persistence failed.');
  }
}

export function readUserMediaResourceState(
  args: { userId: string; schoolId?: string | null; state: UserMediaResourceState | null },
): UserMediaResourceState {
  if (!args.state) fail('MEDIA_RESOURCE_NOT_FOUND', 'Learner state does not exist.');
  assertStateScope({ userId: args.userId, schoolId: args.schoolId, state: args.state as UserMediaResourceState });
  return args.state as UserMediaResourceState;
}

// Compatibility bridge: legacy MediaAsset-shaped input → registry identity.
// Provider-backed assets resolve to the shared canonical key; generated or
// private assets without provider identity stay USER-scoped and are never
// globally deduplicated. Title is NEVER used for identity.
export function resolveRegistryIdentityForLegacyAsset(asset: {
  userId: string;
  videoProvider?: string | null;
  videoId?: string | null;
  sourceUrl?: string | null;
  dedupeKey?: string | null;
  schoolId?: string | null;
  assetKind?: string | null;
}): { scope: MediaResourceScope; stableResourceKey: string | null } {
  const provider = normalizeProvider(asset.videoProvider);
  const providerId = normalizeProviderId(asset.videoId);
  const url = normalizeUrl(asset.sourceUrl);
  const schoolId = clean(asset.schoolId);
  if (provider && providerId) {
    // Genuinely shared external content may be GLOBAL; private generated
    // recap/note kinds stay USER-scoped even with provider metadata.
    const generatedKinds = new Set(['audio_recap', 'video_recap', 'video_note', 'image_note']);
    if (schoolId) return { scope: 'SCHOOL', stableResourceKey: null };
    if (asset.assetKind && generatedKinds.has(clean(asset.assetKind))) {
      return { scope: 'USER', stableResourceKey: `legacy:${clean(asset.dedupeKey) || providerId}` };
    }
    return { scope: 'GLOBAL', stableResourceKey: null };
  }
  if (url && schoolId) return { scope: 'SCHOOL', stableResourceKey: `legacy:${clean(asset.dedupeKey) || sha1Hex(url)}` };
  if (url && !provider) {
    // External URL without provider ID: shared GLOBAL by normalized URL hash.
    return { scope: 'GLOBAL', stableResourceKey: null };
  }
  return { scope: 'USER', stableResourceKey: `legacy:${clean(asset.dedupeKey) || clean(asset.assetKind) || 'asset'}` };
}

// Migration/backfill: map one legacy MediaAsset row onto registry inputs.
// Pure + deterministic; never deletes or merges by title similarity.
export function mapLegacyMediaAssetToRegistryInputs(asset: {
  userId: string;
  assetKind: string;
  title: string;
  summary?: string | null;
  subject?: string | null;
  topic?: string | null;
  language?: string | null;
  tags?: string[];
  videoProvider?: string | null;
  videoId?: string | null;
  sourceUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
  sourceTrust?: string | null;
  safetyStatus?: string | null;
  dedupeKey?: string | null;
  schoolId?: string | null;
}): { resource: UpsertMediaResourceInput; stateSeed: Record<string, unknown> } {
  const identity = resolveRegistryIdentityForLegacyAsset(asset);
  const legacy = asset as Record<string, unknown>;
  const resource: UpsertMediaResourceInput = {
    scope: identity.scope,
    schoolId: clean(asset.schoolId) || null,
    ownerUserId: identity.scope === 'USER' ? clean(asset.userId) : null,
    mediaKind: clean(asset.assetKind) || 'generated_document',
    title: clean(asset.title) || 'Untitled media resource',
    summary: clean(asset.summary) || null,
    subject: clean(asset.subject) || null,
    topic: clean(asset.topic) || null,
    language: clean(asset.language) || null,
    tags: Array.isArray(asset.tags) ? asset.tags : [],
    provider: normalizeProvider(asset.videoProvider) || null,
    providerResourceId: normalizeProviderId(asset.videoId) || null,
    sourceUrl: normalizeUrl(asset.sourceUrl) || null,
    thumbnailUrl: clean(asset.thumbnailUrl) || null,
    durationSec: typeof asset.durationSec === 'number' ? asset.durationSec : null,
    sourceTrust: clean(asset.sourceTrust) || null,
    safetyStatus: clean(asset.safetyStatus) || null,
    metadata: { backfilledFrom: 'MediaAsset' },
    stableResourceKey: identity.stableResourceKey,
  };
  const meta = (legacy.metadata && typeof legacy.metadata === 'object' ? legacy.metadata : {}) as Record<string, unknown>;
  const pickBool = (value: unknown): boolean | undefined => (typeof value === 'boolean' ? value : undefined);
  const pickNum = (value: unknown): number | undefined =>
    typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.round(value)) : undefined;
  const pickStr = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined;
  const stateSeed: Record<string, unknown> = {
    isSaved: pickBool(meta.isSaved) ?? true,
    isPinned: pickBool(meta.isPinned) ?? false,
    isCompleted: pickBool(meta.isCompleted) ?? false,
    isHelpful: typeof meta.isHelpful === 'boolean' ? meta.isHelpful : null,
    playbackPositionSec: pickNum(meta.playbackPosition) ?? 0,
    interactionCount: pickNum(meta.interactionCount) ?? 0,
    completionCount: pickNum(meta.completionCount) ?? 0,
    lastOpenedAt: pickStr(meta.lastOpenedAt) ?? null,
    lastPlayedAt: pickStr(meta.lastPlayedAt) ?? null,
    lastReviewedAt: pickStr(meta.lastReviewedAt) ?? null,
  };
  return { resource, stateSeed };
}

// Bounded executable backfill (R9): legacy MediaAsset rows → canonical
// registry. Caller reads a bounded batch of legacy rows ordered by asset id
// ("SELECT ... WHERE id > cursor ORDER BY id ASC LIMIT n") and passes them
// here; this function maps each row, upserts MediaResource, and creates or
// merges UserMediaResourceState. Idempotent/rerunnable (canonical-key upsert
// + monotonic state merge), never deletes MediaAsset, never dedupes by title.
export interface LegacyMediaAssetBackfillRow {
  id: string;
  userId: string;
  assetKind: string;
  title: string;
  summary?: string | null;
  subject?: string | null;
  topic?: string | null;
  language?: string | null;
  tags?: string[];
  videoProvider?: string | null;
  videoId?: string | null;
  sourceUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
  sourceTrust?: string | null;
  safetyStatus?: string | null;
  dedupeKey?: string | null;
  schoolId?: string | null;
  isSaved?: boolean;
  isPinned?: boolean;
  isCompleted?: boolean;
  isHelpful?: boolean | null;
  playbackPositionSec?: number;
  interactionCount?: number;
  completionCount?: number;
  lastOpenedAt?: string | null;
  lastPlayedAt?: string | null;
  lastReviewedAt?: string | null;
}

export interface BackfillBatchResult {
  processed: number;
  nextCursor: string | null;
  resourceIds: string[];
}

const BACKFILL_DEFAULT_BATCH_SIZE = 50;
const BACKFILL_MAX_BATCH_SIZE = 200;

export async function backfillLegacyMediaAssetsToRegistry(
  args: {
    assets: LegacyMediaAssetBackfillRow[];
    afterCursor?: string | null;
    batchSize?: number;
  },
  store: MediaResourceStore = prismaMediaResourceStore,
): Promise<BackfillBatchResult> {
  const requested = typeof args.batchSize === 'number' ? Math.floor(args.batchSize) : BACKFILL_DEFAULT_BATCH_SIZE;
  const batchSize = Math.min(Math.max(1, requested || BACKFILL_DEFAULT_BATCH_SIZE), BACKFILL_MAX_BATCH_SIZE);
  const cursor = clean(args.afterCursor);
  // Deterministic cursor: ordered asset id; only rows after the checkpoint run.
  const ordered = [...(args.assets || [])]
    .filter((row) => row && clean(row.id) && (!cursor || clean(row.id) > cursor))
    .sort((a, b) => (clean(a.id) < clean(b.id) ? -1 : clean(a.id) > clean(b.id) ? 1 : 0))
    .slice(0, batchSize);
  const resourceIds: string[] = [];
  for (const row of ordered) {
    const userId = clean(row.userId);
    if (!userId) fail('MEDIA_RESOURCE_UNAUTHORIZED', 'Backfill row is missing learner identity.');
    const mapped = mapLegacyMediaAssetToRegistryInputs({
      userId,
      assetKind: row.assetKind,
      title: row.title,
      summary: row.summary,
      subject: row.subject,
      topic: row.topic,
      language: row.language,
      tags: row.tags,
      videoProvider: row.videoProvider,
      videoId: row.videoId,
      sourceUrl: row.sourceUrl,
      thumbnailUrl: row.thumbnailUrl,
      durationSec: row.durationSec,
      sourceTrust: row.sourceTrust,
      safetyStatus: row.safetyStatus,
      dedupeKey: row.dedupeKey,
      schoolId: row.schoolId,
    });
    const resource = await upsertMediaResource(mapped.resource, store);
    resourceIds.push(resource.id);
    const seed = {
      isSaved: row.isSaved === true,
      isPinned: row.isPinned === true,
      isCompleted: row.isCompleted === true,
      isHelpful: typeof row.isHelpful === 'boolean' ? row.isHelpful : null,
      playbackPositionSec:
        typeof row.playbackPositionSec === 'number' && Number.isFinite(row.playbackPositionSec)
          ? Math.max(0, Math.round(row.playbackPositionSec))
          : 0,
      interactionCount:
        typeof row.interactionCount === 'number' && Number.isFinite(row.interactionCount)
          ? Math.max(0, Math.round(row.interactionCount))
          : 0,
      completionCount:
        typeof row.completionCount === 'number' && Number.isFinite(row.completionCount)
          ? Math.max(0, Math.round(row.completionCount))
          : 0,
    };
    const schoolId = clean(row.schoolId) || null;
    const existing = await store.findState(userId, resource.id);
    if (!existing) {
      const created = await store.insertStateIgnoreConflict({
        id: randomUUID(),
        userId,
        resourceId: resource.id,
        schoolId,
        isSaved: false,
        isPinned: false,
        isCompleted: false,
        isHelpful: null,
        playbackPositionSec: 0,
        interactionCount: 0,
        completionCount: 0,
        lastOpenedAt: null,
        lastPlayedAt: null,
        lastReviewedAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      // Preserve the legacy learner state exactly on first backfill.
      await store.saveState({
        ...created,
        schoolId: created.schoolId ?? schoolId,
        isSaved: seed.isSaved,
        isPinned: seed.isPinned,
        isCompleted: seed.isCompleted,
        isHelpful: seed.isHelpful,
        playbackPositionSec: seed.playbackPositionSec,
        interactionCount: seed.interactionCount,
        completionCount: seed.completionCount,
        lastOpenedAt: clean(row.lastOpenedAt) || null,
        lastPlayedAt: clean(row.lastPlayedAt) || null,
        lastReviewedAt: clean(row.lastReviewedAt) || null,
        updatedAt: new Date().toISOString(),
      });
    } else {
      // Rerunnable merge: monotonic only, never clobbers newer learner state.
      // School mismatch on rerun fails closed via the scope assertion.
      assertStateScope({ userId, schoolId: schoolId ?? existing.schoolId, state: existing });
      await store.saveState({
        ...existing,
        isSaved: existing.isSaved || seed.isSaved,
        isPinned: existing.isPinned || seed.isPinned,
        isCompleted: existing.isCompleted || seed.isCompleted,
        isHelpful: existing.isHelpful ?? seed.isHelpful,
        playbackPositionSec: Math.max(existing.playbackPositionSec, seed.playbackPositionSec),
        interactionCount: Math.max(existing.interactionCount, seed.interactionCount),
        completionCount: Math.max(existing.completionCount, seed.completionCount),
        lastOpenedAt: existing.lastOpenedAt ?? (clean(row.lastOpenedAt) || null),
        lastPlayedAt: existing.lastPlayedAt ?? (clean(row.lastPlayedAt) || null),
        lastReviewedAt: existing.lastReviewedAt ?? (clean(row.lastReviewedAt) || null),
        updatedAt: new Date().toISOString(),
      });
    }
  }
  return {
    processed: ordered.length,
    nextCursor: ordered.length > 0 ? clean(ordered[ordered.length - 1].id) : cursor || null,
    resourceIds,
  };
}
 
// STREAM-4 canonical resource read: by-ID production lookup for playback
// orchestration. Returns null when missing; no manufactured identity, no
// title fallback, no fuzzy provider matching.
export async function getMediaResourceById(
  resourceId: string,
  store: MediaResourceStore = prismaMediaResourceStore,
): Promise<MediaResource | null> {
  const id = clean(resourceId);
  if (!id) return null;
  return store.findResourceById(id);
}

// STREAM-6 bounded batch read: ONE registry lookup for at most 120
// deduplicated canonical keys. Parameterized query, no DDL, no writes.
export async function getMediaResourcesByCanonicalKeys(
  keys: string[],
  store: MediaResourceStore = prismaMediaResourceStore,
): Promise<MediaResource[]> {
  const deduped = [...new Set((keys || []).map((key) => clean(key)).filter(Boolean))].slice(0, 120);
  if (deduped.length === 0) return [];
  if (typeof store.findResourcesByKeys === 'function') {
    return store.findResourcesByKeys(deduped);
  }
  const found: MediaResource[] = [];
  for (const key of deduped) {
    const resource = await store.findResourceByKey(key);
    if (resource) found.push(resource);
  }
  return found;
}

export interface LegacyAssetIdentityInput {
  id: string;
  userId: string;
  videoProvider?: string | null;
  videoId?: string | null;
  sourceUrl?: string | null;
  dedupeKey?: string | null;
  schoolId?: string | null;
  assetKind?: string | null;
}

// STREAM-6 canonical identity bridge: resolve ranked legacy MediaAsset
// candidates onto existing canonical MediaResources. Deterministic key
// computation, ONE bounded registry read, no creation, no backfill, no
// mutation. Assets that cannot resolve stay in the legacy flat stream and
// never enter canonical sections. Maximum 120 candidates.
export async function resolveCanonicalResourcesForLegacyAssets(
  assets: LegacyAssetIdentityInput[],
  store: MediaResourceStore = prismaMediaResourceStore,
): Promise<Map<string, MediaResource>> {
  const mapping = new Map<string, MediaResource>();
  const ordered = [...(assets || [])]
    .filter((asset) => asset && clean(asset.id))
    .slice(0, 120);
  if (ordered.length === 0) return mapping;
  const keyByAssetId = new Map<string, string>();
  const keys: string[] = [];
  for (const asset of ordered) {
    const assetId = clean(asset.id);
    if (keyByAssetId.has(assetId)) continue;
    let canonicalKey = '';
    try {
      const identity = resolveRegistryIdentityForLegacyAsset({
        userId: asset.userId,
        videoProvider: asset.videoProvider,
        videoId: asset.videoId,
        sourceUrl: asset.sourceUrl,
        dedupeKey: asset.dedupeKey,
        schoolId: asset.schoolId,
        assetKind: asset.assetKind,
      });
      canonicalKey = buildCanonicalKey({
        scope: identity.scope,
        provider: asset.videoProvider,
        providerResourceId: asset.videoId,
        sourceUrl: asset.sourceUrl,
        schoolId: asset.schoolId,
        ownerUserId: asset.userId,
        stableResourceKey: identity.stableResourceKey,
      });
    } catch {
      continue;
    }
    if (!canonicalKey) continue;
    keyByAssetId.set(assetId, canonicalKey);
    keys.push(canonicalKey);
  }
  const resources = await getMediaResourcesByCanonicalKeys(keys, store);
  const byKey = new Map(resources.map((resource) => [resource.canonicalKey, resource] as const));
  for (const [assetId, key] of keyByAssetId) {
    const resource = byKey.get(key);
    if (resource) mapping.set(assetId, resource);
  }
  return mapping;
}

// STREAM-5 bounded learner-state read: at most 100 rows for one learner,
// fail-closed across schools (userId exact match AND schoolId exact match).
// Watching/progress returned here is preference/interaction state only.
export async function listUserMediaResourceStates(args: {
  userId: string;
  schoolId?: string | null;
  limit?: number;
}): Promise<UserMediaResourceState[]> {
  const userId = clean(args.userId);
  if (!userId) fail('MEDIA_RESOURCE_UNAUTHORIZED', 'Learner identity is required.');
  const schoolId = clean(args.schoolId);
  if (!schoolId) fail('MEDIA_RESOURCE_UNAUTHORIZED', 'School identity is required.');
  const requested = typeof args.limit === 'number' ? Math.floor(args.limit) : 100;
  const limit = Math.min(Math.max(1, requested || 100), 100);
  await assertMediaRegistrySchema();
  const rows = await prisma.$queryRawUnsafe<StateRow[]>(
    `SELECT * FROM "UserMediaResourceState" WHERE "userId" = $1 AND "schoolId" = $2 ORDER BY "updatedAt" DESC LIMIT $3`,
    userId,
    schoolId,
    limit,
  );
  return rows.map(mapStateRow);
}

// Compatibility projection: legacy MediaAsset DTO view over (resource, state).
// Legacy fields are a projection, not a second authority.
export function projectLegacyMediaAssetView(args: {
  assetId: string;
  userId: string;
  resource: MediaResource;
  state: UserMediaResourceState;
}): Record<string, unknown> {
  return {
    id: args.assetId,
    userId: args.userId,
    assetKind: args.resource.mediaKind,
    title: args.resource.title,
    summary: args.resource.summary,
    subject: args.resource.subject,
    topic: args.resource.topic,
    tags: args.resource.tags,
    language: args.resource.language,
    sourceUrl: args.resource.sourceUrl,
    videoId: args.resource.providerResourceId,
    videoProvider: args.resource.provider,
    thumbnailUrl: args.resource.thumbnailUrl,
    durationSec: args.resource.durationSec,
    safetyStatus: args.resource.safetyStatus,
    sourceTrust: args.resource.sourceTrust,
    resourceId: args.resource.id,
    canonicalKey: args.resource.canonicalKey,
    isSaved: args.state.isSaved,
    isPinned: args.state.isPinned,
    isCompleted: args.state.isCompleted,
    isHelpful: args.state.isHelpful,
    playbackPosition: args.state.playbackPositionSec,
    interactionCount: args.state.interactionCount,
    completionCount: args.state.completionCount,
    lastOpenedAt: args.state.lastOpenedAt,
    lastPlayedAt: args.state.lastPlayedAt,
    lastReviewedAt: args.state.lastReviewedAt,
  };
}
