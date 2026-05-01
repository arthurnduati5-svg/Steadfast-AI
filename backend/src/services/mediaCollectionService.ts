import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import {
  getMediaAssetById,
  isCoreMediaAssetKind,
  listMediaAssets,
  setMediaAssetCollectionIds,
  type MediaAsset,
} from './mediaAssetService';

type MediaCollectionRow = Record<string, unknown>;

export interface MediaCollection {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  subject: string | null;
  topic: string | null;
  metadata: Record<string, unknown>;
  itemCount: number;
  items: MediaAsset[];
  nextAssetId: string | null;
  progressLabel: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMediaCollectionInput {
  userId: string;
  title: string;
  description?: string | null;
  subject?: string | null;
  topic?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface UpdateMediaCollectionInput {
  userId: string;
  collectionId: string;
  patch: {
    title?: string;
    description?: string | null;
    subject?: string | null;
    topic?: string | null;
    metadata?: Record<string, unknown> | null;
  };
}

let ensureMediaCollectionTablesPromise: Promise<void> | null = null;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function safeJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return safeString(value);
}

function clampText(value: unknown, max = 160): string {
  const normalized = safeString(value).replace(/\s+/g, ' ').trim();
  if (!normalized) return '';
  return normalized.length <= max ? normalized : `${normalized.slice(0, max - 3).trimEnd()}...`;
}

function mapMediaCollectionRow(row: MediaCollectionRow): Omit<MediaCollection, 'items' | 'itemCount' | 'nextAssetId' | 'progressLabel'> {
  return {
    id: safeString(row.id),
    userId: safeString(row.userId),
    title: safeString(row.title).trim() || 'Media collection',
    description: safeString(row.description).trim() || null,
    subject: safeString(row.subject).trim() || null,
    topic: safeString(row.topic).trim() || null,
    metadata: parseJsonObject(row.metadata),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function withItems(base: Omit<MediaCollection, 'items' | 'itemCount' | 'nextAssetId' | 'progressLabel'>, items: MediaAsset[]): MediaCollection {
  const completedCount = items.filter((item) => Boolean(item.isCompleted)).length;
  return {
    ...base,
    itemCount: items.length,
    items,
    nextAssetId: items[0]?.id || null,
    progressLabel: items.length ? `${completedCount}/${items.length} reviewed` : null,
  };
}

export async function ensureMediaCollectionTables(): Promise<void> {
  if (!ensureMediaCollectionTablesPromise) {
    ensureMediaCollectionTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MediaCollection" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NULL,
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MediaCollection_userId_updatedAt_idx"
        ON "MediaCollection" ("userId", "updatedAt" DESC);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MediaCollection_userId_title_idx"
        ON "MediaCollection" ("userId", "title");
      `);
    })().catch((error) => {
      ensureMediaCollectionTablesPromise = null;
      throw error;
    });
  }
  return ensureMediaCollectionTablesPromise;
}

async function getMediaCollectionRow(args: { userId: string; collectionId: string }): Promise<MediaCollectionRow | null> {
  await ensureMediaCollectionTables();
  const rows = await prisma.$queryRawUnsafe<MediaCollectionRow[]>(
    `
      SELECT *
      FROM "MediaCollection"
      WHERE "userId" = $1
        AND "id" = $2
      LIMIT 1
    `,
    args.userId,
    args.collectionId
  );
  return rows[0] || null;
}

export async function getMediaCollectionById(args: {
  userId: string;
  collectionId: string;
  includeItems?: boolean;
  itemLimit?: number;
}): Promise<MediaCollection | null> {
  const row = await getMediaCollectionRow(args);
  if (!row) return null;
  const base = mapMediaCollectionRow(row);
  const includeItems = args.includeItems !== false;
  const items = includeItems
    ? await listMediaAssets({
        userId: args.userId,
        collectionId: base.id,
        sortBy: 'recommended',
        limit: Math.max(1, Math.min(48, Number(args.itemLimit) || 24)),
        onlyCore: true,
        requireSourceContext: true,
      })
    : [];
  return withItems(base, items);
}

export async function listMediaCollections(args: {
  userId: string;
  subject?: string;
  topic?: string;
  query?: string;
  sortBy?: 'recent' | 'title';
  limit?: number;
  includeItems?: boolean;
  onlyWithItems?: boolean;
  itemLimit?: number;
}): Promise<MediaCollection[]> {
  await ensureMediaCollectionTables();
  const conditions: string[] = [`"userId" = $1`];
  const values: unknown[] = [args.userId];
  let index = values.length;

  if (safeString(args.subject).trim()) {
    index += 1;
    conditions.push(`LOWER(COALESCE("subject", '')) = LOWER($${index})`);
    values.push(safeString(args.subject).trim());
  }
  if (safeString(args.topic).trim()) {
    index += 1;
    conditions.push(`LOWER(COALESCE("topic", '')) LIKE LOWER($${index})`);
    values.push(`%${safeString(args.topic).trim()}%`);
  }
  if (safeString(args.query).trim()) {
    index += 1;
    conditions.push(`(
      LOWER(COALESCE("title", '')) LIKE LOWER($${index})
      OR LOWER(COALESCE("description", '')) LIKE LOWER($${index})
      OR LOWER(COALESCE("subject", '')) LIKE LOWER($${index})
      OR LOWER(COALESCE("topic", '')) LIKE LOWER($${index})
    )`);
    values.push(`%${safeString(args.query).trim()}%`);
  }

  index += 1;
  values.push(Math.min(100, Math.max(1, Number(args.limit) || 30)));

  const orderBy = args.sortBy === 'title' ? `"title" ASC, "updatedAt" DESC` : `"updatedAt" DESC`;
  const rows = await prisma.$queryRawUnsafe<MediaCollectionRow[]>(
    `
      SELECT *
      FROM "MediaCollection"
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy}
      LIMIT $${index}
    `,
    ...values
  );

  const includeItems = args.includeItems !== false;
  const collections = await Promise.all(
    rows.map(async (row) => {
      const base = mapMediaCollectionRow(row);
      const items = includeItems
        ? await listMediaAssets({
            userId: args.userId,
            collectionId: base.id,
            sortBy: 'recommended',
            limit: Math.max(1, Math.min(48, Number(args.itemLimit) || 24)),
            onlyCore: true,
            requireSourceContext: true,
          })
        : [];
      return withItems(base, items);
    })
  );

  if (args.onlyWithItems) {
    return collections.filter((collection) => collection.itemCount > 0);
  }
  return collections;
}

export async function createMediaCollection(input: CreateMediaCollectionInput): Promise<MediaCollection> {
  await ensureMediaCollectionTables();
  const title = clampText(input.title, 90);
  if (!title) throw new Error('A collection title is required.');

  const id = randomUUID();
  const rows = await prisma.$queryRawUnsafe<MediaCollectionRow[]>(
    `
      INSERT INTO "MediaCollection" (
        "id",
        "userId",
        "title",
        "description",
        "subject",
        "topic",
        "metadata"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
      RETURNING *
    `,
    id,
    input.userId,
    title,
    clampText(input.description, 240) || null,
    clampText(input.subject, 80) || null,
    clampText(input.topic, 120) || null,
    JSON.stringify(safeJsonObject(input.metadata || {}))
  );

  const base = mapMediaCollectionRow(rows[0]);
  return withItems(base, []);
}

export async function updateMediaCollection(input: UpdateMediaCollectionInput): Promise<MediaCollection | null> {
  await ensureMediaCollectionTables();
  const sets: string[] = [];
  const values: unknown[] = [input.collectionId, input.userId];
  let index = values.length;
  const patch = input.patch || {};

  if (Object.prototype.hasOwnProperty.call(patch, 'title')) {
    const normalizedTitle = clampText(patch.title, 90);
    if (!normalizedTitle) throw new Error('A collection title is required.');
    index += 1;
    sets.push(`"title" = $${index}`);
    values.push(normalizedTitle);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'description')) {
    index += 1;
    sets.push(`"description" = $${index}`);
    values.push(clampText(patch.description, 240) || null);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'subject')) {
    index += 1;
    sets.push(`"subject" = $${index}`);
    values.push(clampText(patch.subject, 80) || null);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'topic')) {
    index += 1;
    sets.push(`"topic" = $${index}`);
    values.push(clampText(patch.topic, 120) || null);
  }
  if (Object.prototype.hasOwnProperty.call(patch, 'metadata')) {
    index += 1;
    sets.push(`"metadata" = $${index}::jsonb`);
    values.push(JSON.stringify(safeJsonObject(patch.metadata || {})));
  }

  if (!sets.length) {
    return getMediaCollectionById({
      userId: input.userId,
      collectionId: input.collectionId,
      includeItems: true,
    });
  }

  const rows = await prisma.$queryRawUnsafe<MediaCollectionRow[]>(
    `
      UPDATE "MediaCollection"
      SET ${sets.join(', ')},
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "userId" = $2
      RETURNING *
    `,
    ...values
  );

  if (!rows[0]) return null;
  return getMediaCollectionById({
    userId: input.userId,
    collectionId: safeString(rows[0].id),
    includeItems: true,
  });
}

export async function addMediaAssetToCollection(args: {
  userId: string;
  collectionId: string;
  assetId: string;
}): Promise<{ collection: MediaCollection; asset: MediaAsset } | null> {
  const existingCollection = await getMediaCollectionById({
    userId: args.userId,
    collectionId: args.collectionId,
    includeItems: false,
  });
  if (!existingCollection) return null;
  const existingAsset = await getMediaAssetById({ userId: args.userId, assetId: args.assetId });
  if (!existingAsset) return null;
  if (!isCoreMediaAssetKind(existingAsset.assetKind)) return null;

  const nextCollectionIds = Array.from(new Set([...(existingAsset.collectionIds || []), args.collectionId]));
  const updatedAsset = await setMediaAssetCollectionIds({
    userId: args.userId,
    assetId: args.assetId,
    collectionIds: nextCollectionIds,
  });
  if (!updatedAsset) return null;

  await prisma.$executeRawUnsafe(
    `
      UPDATE "MediaCollection"
      SET "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "userId" = $2
    `,
    args.collectionId,
    args.userId
  );

  const collection = await getMediaCollectionById({
    userId: args.userId,
    collectionId: args.collectionId,
    includeItems: true,
  });
  if (!collection) return null;
  return { collection, asset: updatedAsset };
}

export async function removeMediaAssetFromCollection(args: {
  userId: string;
  collectionId: string;
  assetId: string;
}): Promise<{ collection: MediaCollection; asset: MediaAsset } | null> {
  const existingCollection = await getMediaCollectionById({
    userId: args.userId,
    collectionId: args.collectionId,
    includeItems: false,
  });
  if (!existingCollection) return null;
  const existingAsset = await getMediaAssetById({ userId: args.userId, assetId: args.assetId });
  if (!existingAsset) return null;
  if (!isCoreMediaAssetKind(existingAsset.assetKind)) return null;

  const nextCollectionIds = (existingAsset.collectionIds || []).filter((entry) => entry !== args.collectionId);
  const updatedAsset = await setMediaAssetCollectionIds({
    userId: args.userId,
    assetId: args.assetId,
    collectionIds: nextCollectionIds,
  });
  if (!updatedAsset) return null;

  await prisma.$executeRawUnsafe(
    `
      UPDATE "MediaCollection"
      SET "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "userId" = $2
    `,
    args.collectionId,
    args.userId
  );

  const collection = await getMediaCollectionById({
    userId: args.userId,
    collectionId: args.collectionId,
    includeItems: true,
  });
  if (!collection) return null;
  return { collection, asset: updatedAsset };
}
