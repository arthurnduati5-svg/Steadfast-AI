import { createHash, randomUUID } from 'crypto';
import prisma from '../lib/prisma';

export type MediaAssetKind =
  | 'audio_recap'
  | 'video_recap'
  | 'annotated_image'
  | 'visual_explainer'
  | 'worksheet_explainer'
  | 'media_card'
  | 'media_collection_item'
  | 'video_note'
  | 'image_note'
  | 'generated_image'
  | 'document_note'
  | 'generated_document';

export const CORE_MEDIA_ASSET_KINDS = [
  'audio_recap',
  'video_recap',
  'annotated_image',
  'visual_explainer',
  'worksheet_explainer',
  'generated_image',
  'generated_document',
] as const;

export type CoreMediaAssetKind = (typeof CORE_MEDIA_ASSET_KINDS)[number];

export type MediaAssetInteractionAction =
  | 'open'
  | 'play'
  | 'complete'
  | 'helpful'
  | 'unhelpful'
  | 'save_to_revision'
  | 'quick_check'
  | 'show_more_like_this'
  | 'explain_simply'
  | 'open_long_lesson'
  | 'similar_topic'
  | 'quiz_me'
  | 'similar_question';

export interface MediaAsset {
  id: string;
  userId: string;
  assetKind: MediaAssetKind;
  title: string;
  summary: string | null;
  body?: string | null;
  subject: string | null;
  topic: string | null;
  subtopic?: string | null;
  tags: string[];
  language: string | null;
  sessionId: string | null;
  sourceChatSessionId?: string | null;
  sourceChatMessageId?: string | null;
  revisionItemId: string | null;
  sourceMessageId?: string | null;
  linkedRevisionItemId?: string | null;
  linkedWeakTopicId?: string | null;
  collectionIds?: string[];
  sourceUrl: string | null;
  videoId: string | null;
  videoProvider?: string | null;
  dataUrl: string | null;
  assetUrl: string | null;
  thumbnailUrl: string | null;
  durationSec: number | null;
  transcript?: string | null;
  transcriptSnippet?: string | null;
  imageUrl?: string | null;
  annotationData?: Record<string, unknown> | null;
  aspectRatio?: string | null;
  generationSource?: string | null;
  recapText: string | null;
  keyPoints: string[];
  quickChecks: string[];
  bestUse?: string | null;
  keyIdea?: string | null;
  nextMove?: string | null;
  difficulty?: string | null;
  schoolLevel?: string | null;
  masteryRelevance?: string | null;
  weakTopicRelevance?: string | null;
  examRelevance?: string | null;
  revisionRelevance?: string | null;
  isSaved?: boolean;
  isPinned?: boolean;
  isCompleted?: boolean;
  isHelpful?: boolean;
  lastOpenedAt?: string | null;
  lastPlayedAt?: string | null;
  lastReviewedAt?: string | null;
  recommendedScore?: number | null;
  streamRankScore?: number | null;
  playbackPosition?: number | null;
  interactionCount?: number;
  completionCount?: number;
  metadata: Record<string, unknown>;
  safetyStatus: string | null;
  sourceTrust: string | null;
  dedupeKey: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMediaAssetInput {
  userId: string;
  assetKind: MediaAssetKind;
  title: string;
  summary?: string | null;
  body?: string | null;
  subject?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  tags?: string[];
  language?: string | null;
  sessionId?: string | null;
  sourceChatSessionId?: string | null;
  sourceChatMessageId?: string | null;
  revisionItemId?: string | null;
  sourceMessageId?: string | null;
  linkedRevisionItemId?: string | null;
  linkedWeakTopicId?: string | null;
  collectionIds?: string[];
  sourceUrl?: string | null;
  videoId?: string | null;
  videoProvider?: string | null;
  dataUrl?: string | null;
  assetUrl?: string | null;
  thumbnailUrl?: string | null;
  durationSec?: number | null;
  transcript?: string | null;
  transcriptSnippet?: string | null;
  imageUrl?: string | null;
  annotationData?: Record<string, unknown> | null;
  aspectRatio?: string | null;
  generationSource?: string | null;
  recapText?: string | null;
  keyPoints?: string[];
  quickChecks?: string[];
  bestUse?: string | null;
  keyIdea?: string | null;
  nextMove?: string | null;
  difficulty?: string | null;
  schoolLevel?: string | null;
  masteryRelevance?: string | null;
  weakTopicRelevance?: string | null;
  examRelevance?: string | null;
  revisionRelevance?: string | null;
  isSaved?: boolean;
  isPinned?: boolean;
  isCompleted?: boolean;
  isHelpful?: boolean;
  lastOpenedAt?: string | null;
  lastPlayedAt?: string | null;
  lastReviewedAt?: string | null;
  recommendedScore?: number | null;
  streamRankScore?: number | null;
  playbackPosition?: number | null;
  interactionCount?: number;
  completionCount?: number;
  metadata?: Record<string, unknown> | null;
  safetyStatus?: string | null;
  sourceTrust?: string | null;
  dedupeKey?: string | null;
}

type MediaAssetRow = Record<string, unknown>;

const MEDIA_ASSET_KINDS = new Set<MediaAssetKind>([
  'audio_recap',
  'video_recap',
  'annotated_image',
  'visual_explainer',
  'worksheet_explainer',
  'media_card',
  'media_collection_item',
  'video_note',
  'image_note',
  'generated_image',
  'document_note',
  'generated_document',
]);

const CORE_MEDIA_ASSET_KIND_SET = new Set<MediaAssetKind>(CORE_MEDIA_ASSET_KINDS);

let ensureMediaAssetTablesPromise: Promise<void> | null = null;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function safeJsonObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseJsonArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => safeString(entry).trim())
      .filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.map((entry) => safeString(entry).trim()).filter(Boolean)
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseJsonObject(value: unknown): Record<string, unknown> {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  if (typeof value === 'string' && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return {};
}

function parseBooleanMaybe(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return undefined;
}

function parseNumberMaybe(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function isCoreMediaAssetKind(kind: unknown): kind is CoreMediaAssetKind {
  return CORE_MEDIA_ASSET_KIND_SET.has(safeString(kind).trim() as MediaAssetKind);
}

function mapMediaAssetRow(row: MediaAssetRow): MediaAsset {
  const metadata = parseJsonObject(row.metadata);
  const metadataCollectionIds = Array.isArray(metadata.collectionIds)
    ? (metadata.collectionIds as unknown[]).map((entry) => safeString(entry).trim()).filter(Boolean)
    : [];
  return {
    id: safeString(row.id),
    userId: safeString(row.userId),
    assetKind: (safeString(row.assetKind) || 'generated_document') as MediaAssetKind,
    title: safeString(row.title),
    summary: safeString(row.summary).trim() || null,
    body: safeString(metadata.body).trim() || null,
    subject: safeString(row.subject).trim() || null,
    topic: safeString(row.topic).trim() || null,
    subtopic: safeString(metadata.subtopic).trim() || null,
    tags: parseJsonArray(row.tags),
    language: safeString(row.language).trim() || null,
    sessionId: safeString(row.sessionId).trim() || null,
    sourceChatSessionId: safeString(metadata.sourceChatSessionId).trim() || safeString(row.sessionId).trim() || null,
    sourceChatMessageId: safeString(metadata.sourceChatMessageId).trim() || null,
    revisionItemId: safeString(row.revisionItemId).trim() || null,
    sourceMessageId: safeString(metadata.sourceMessageId).trim() || null,
    linkedRevisionItemId: safeString(metadata.linkedRevisionItemId).trim() || null,
    linkedWeakTopicId: safeString(metadata.linkedWeakTopicId).trim() || null,
    collectionIds: metadataCollectionIds,
    sourceUrl: safeString(row.sourceUrl).trim() || null,
    videoId: safeString(row.videoId).trim() || null,
    videoProvider: safeString(metadata.videoProvider).trim() || null,
    dataUrl: safeString(row.dataUrl).trim() || null,
    assetUrl: safeString(row.assetUrl).trim() || null,
    thumbnailUrl: safeString(row.thumbnailUrl).trim() || null,
    durationSec: typeof row.durationSec === 'number' ? row.durationSec : Number(row.durationSec || 0) || null,
    transcript: safeString(metadata.transcript).trim() || null,
    transcriptSnippet: safeString(metadata.transcriptSnippet).trim() || null,
    imageUrl: safeString(metadata.imageUrl).trim() || null,
    annotationData: safeJsonObject(metadata.annotationData || null),
    aspectRatio: safeString(metadata.aspectRatio).trim() || null,
    generationSource: safeString(metadata.generationSource).trim() || null,
    recapText: safeString(row.recapText).trim() || null,
    keyPoints: parseJsonArray(row.keyPoints),
    quickChecks: parseJsonArray(row.quickChecks),
    bestUse: safeString(metadata.bestUse).trim() || null,
    keyIdea: safeString(metadata.keyIdea).trim() || null,
    nextMove: safeString(metadata.nextMove).trim() || null,
    difficulty: safeString(metadata.difficulty).trim() || null,
    schoolLevel: safeString(metadata.schoolLevel).trim() || null,
    masteryRelevance: safeString(metadata.masteryRelevance).trim() || null,
    weakTopicRelevance: safeString(metadata.weakTopicRelevance).trim() || null,
    examRelevance: safeString(metadata.examRelevance).trim() || null,
    revisionRelevance: safeString(metadata.revisionRelevance).trim() || null,
    isSaved: parseBooleanMaybe(metadata.isSaved) ?? true,
    isPinned: parseBooleanMaybe(metadata.isPinned) ?? false,
    isCompleted: parseBooleanMaybe(metadata.isCompleted) ?? false,
    isHelpful: parseBooleanMaybe(metadata.isHelpful) ?? false,
    lastOpenedAt: safeString(metadata.lastOpenedAt).trim() || null,
    lastPlayedAt: safeString(metadata.lastPlayedAt).trim() || null,
    lastReviewedAt: safeString(metadata.lastReviewedAt).trim() || null,
    recommendedScore: parseNumberMaybe(metadata.recommendedScore) ?? null,
    streamRankScore: parseNumberMaybe(metadata.streamRankScore) ?? null,
    playbackPosition: parseNumberMaybe(metadata.playbackPosition) ?? null,
    interactionCount: parseNumberMaybe(metadata.interactionCount) ?? 0,
    completionCount: parseNumberMaybe(metadata.completionCount) ?? 0,
    metadata,
    safetyStatus: safeString(row.safetyStatus).trim() || null,
    sourceTrust: safeString(row.sourceTrust).trim() || null,
    dedupeKey: safeString(row.dedupeKey).trim() || null,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : safeString(row.createdAt),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : safeString(row.updatedAt),
  };
}

export function buildMediaAssetDedupeKey(parts: Array<string | null | undefined>): string {
  const normalized = parts
    .map((part) => safeString(part).trim().toLowerCase())
    .filter(Boolean)
    .join('|');
  return createHash('sha1').update(normalized).digest('hex');
}

export async function ensureMediaAssetTables(): Promise<void> {
  if (!ensureMediaAssetTablesPromise) {
    ensureMediaAssetTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MediaAsset" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "assetKind" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "summary" TEXT NULL,
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "language" TEXT NULL,
          "sessionId" TEXT NULL,
          "revisionItemId" TEXT NULL,
          "sourceUrl" TEXT NULL,
          "videoId" TEXT NULL,
          "dataUrl" TEXT NULL,
          "assetUrl" TEXT NULL,
          "thumbnailUrl" TEXT NULL,
          "durationSec" INTEGER NULL,
          "recapText" TEXT NULL,
          "keyPoints" JSONB NULL,
          "quickChecks" JSONB NULL,
          "metadata" JSONB NULL,
          "safetyStatus" TEXT NULL,
          "sourceTrust" TEXT NULL,
          "dedupeKey" TEXT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MediaAsset_userId_updatedAt_idx"
        ON "MediaAsset" ("userId", "updatedAt" DESC);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MediaAsset_userId_assetKind_updatedAt_idx"
        ON "MediaAsset" ("userId", "assetKind", "updatedAt" DESC);
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MediaAsset_userId_topic_idx"
        ON "MediaAsset" ("userId", "topic");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "MediaAsset_revisionItemId_idx"
        ON "MediaAsset" ("revisionItemId");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "MediaAsset_userId_dedupeKey_unique"
        ON "MediaAsset" ("userId", "dedupeKey")
        WHERE "dedupeKey" IS NOT NULL;
      `);
    })().catch((error) => {
      ensureMediaAssetTablesPromise = null;
      throw error;
    });
  }
  return ensureMediaAssetTablesPromise;
}

export async function getMediaAssetById(args: { userId: string; assetId: string }): Promise<MediaAsset | null> {
  await ensureMediaAssetTables();
  const rows = await prisma.$queryRawUnsafe<MediaAssetRow[]>(
    `
      SELECT *
      FROM "MediaAsset"
      WHERE "userId" = $1
        AND "id" = $2
      LIMIT 1
    `,
    args.userId,
    args.assetId
  );
  return rows[0] ? mapMediaAssetRow(rows[0]) : null;
}

export async function findMediaAssetByDedupeKey(args: {
  userId: string;
  dedupeKey: string;
}): Promise<MediaAsset | null> {
  await ensureMediaAssetTables();
  const userId = safeString(args.userId).trim();
  const dedupeKey = safeString(args.dedupeKey).trim();
  if (!userId || !dedupeKey) return null;
  const rows = await prisma.$queryRawUnsafe<MediaAssetRow[]>(
    `
      SELECT *
      FROM "MediaAsset"
      WHERE "userId" = $1
        AND "dedupeKey" = $2
      LIMIT 1
    `,
    userId,
    dedupeKey
  );
  return rows[0] ? mapMediaAssetRow(rows[0]) : null;
}

export async function createMediaAsset(input: CreateMediaAssetInput): Promise<MediaAsset> {
  await ensureMediaAssetTables();
  if (!MEDIA_ASSET_KINDS.has(input.assetKind)) {
    throw new Error('Unsupported media asset kind.');
  }

  const normalizedSourceChatSessionId =
    safeString(input.sourceChatSessionId).trim() ||
    safeString(input.sessionId).trim() ||
    null;
  const normalizedSourceChatMessageId =
    safeString(input.sourceChatMessageId).trim() ||
    safeString(input.sourceMessageId).trim() ||
    null;

  const dedupeKey = safeString(input.dedupeKey).trim() || null;
  if (dedupeKey) {
    const existing = await prisma.$queryRawUnsafe<MediaAssetRow[]>(
      `
        SELECT *
        FROM "MediaAsset"
        WHERE "userId" = $1
          AND "dedupeKey" = $2
        LIMIT 1
      `,
      input.userId,
      dedupeKey
    );
    if (existing[0]) {
      const existingMetadata = parseJsonObject(existing[0].metadata);
      const mergedExistingMetadata = {
        ...existingMetadata,
        ...(normalizedSourceChatSessionId ? { sourceChatSessionId: normalizedSourceChatSessionId } : {}),
        ...(normalizedSourceChatMessageId ? { sourceChatMessageId: normalizedSourceChatMessageId } : {}),
      };
      const updatedRows = await prisma.$queryRawUnsafe<MediaAssetRow[]>(
        `
          UPDATE "MediaAsset"
          SET "sessionId" = COALESCE($2, "sessionId"),
              "metadata" = $3::jsonb,
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = $1
          RETURNING *
        `,
        safeString(existing[0].id),
        normalizedSourceChatSessionId,
        JSON.stringify(mergedExistingMetadata)
      );
      if (updatedRows[0]) return mapMediaAssetRow(updatedRows[0]);
      await prisma.$executeRawUnsafe(
        `
          UPDATE "MediaAsset"
          SET "updatedAt" = CURRENT_TIMESTAMP
          WHERE "id" = $1
        `,
        safeString(existing[0].id)
      );
      return mapMediaAssetRow(existing[0]);
    }
  }

  const id = randomUUID();
  const mergedMetadata = {
    ...safeJsonObject(input.metadata || {}),
    ...(normalizedSourceChatSessionId ? { sourceChatSessionId: normalizedSourceChatSessionId } : {}),
    ...(normalizedSourceChatMessageId ? { sourceChatMessageId: normalizedSourceChatMessageId } : {}),
    ...(safeString(input.body).trim() ? { body: safeString(input.body).trim() } : {}),
    ...(safeString(input.subtopic).trim() ? { subtopic: safeString(input.subtopic).trim() } : {}),
    ...(safeString(input.sourceMessageId).trim() ? { sourceMessageId: safeString(input.sourceMessageId).trim() } : {}),
    ...(safeString(input.linkedRevisionItemId).trim() ? { linkedRevisionItemId: safeString(input.linkedRevisionItemId).trim() } : {}),
    ...(safeString(input.linkedWeakTopicId).trim() ? { linkedWeakTopicId: safeString(input.linkedWeakTopicId).trim() } : {}),
    ...(Array.isArray(input.collectionIds) && input.collectionIds.length
      ? { collectionIds: input.collectionIds.map((entry) => safeString(entry).trim()).filter(Boolean) }
      : {}),
    ...(safeString(input.videoProvider).trim() ? { videoProvider: safeString(input.videoProvider).trim() } : {}),
    ...(safeString(input.transcript).trim() ? { transcript: safeString(input.transcript).trim() } : {}),
    ...(safeString(input.transcriptSnippet).trim() ? { transcriptSnippet: safeString(input.transcriptSnippet).trim() } : {}),
    ...(safeString(input.imageUrl).trim() ? { imageUrl: safeString(input.imageUrl).trim() } : {}),
    ...(input.annotationData && typeof input.annotationData === 'object' ? { annotationData: input.annotationData } : {}),
    ...(safeString(input.aspectRatio).trim() ? { aspectRatio: safeString(input.aspectRatio).trim() } : {}),
    ...(safeString(input.generationSource).trim() ? { generationSource: safeString(input.generationSource).trim() } : {}),
    ...(safeString(input.bestUse).trim() ? { bestUse: safeString(input.bestUse).trim() } : {}),
    ...(safeString(input.keyIdea).trim() ? { keyIdea: safeString(input.keyIdea).trim() } : {}),
    ...(safeString(input.nextMove).trim() ? { nextMove: safeString(input.nextMove).trim() } : {}),
    ...(safeString(input.difficulty).trim() ? { difficulty: safeString(input.difficulty).trim() } : {}),
    ...(safeString(input.schoolLevel).trim() ? { schoolLevel: safeString(input.schoolLevel).trim() } : {}),
    ...(safeString(input.masteryRelevance).trim() ? { masteryRelevance: safeString(input.masteryRelevance).trim() } : {}),
    ...(safeString(input.weakTopicRelevance).trim() ? { weakTopicRelevance: safeString(input.weakTopicRelevance).trim() } : {}),
    ...(safeString(input.examRelevance).trim() ? { examRelevance: safeString(input.examRelevance).trim() } : {}),
    ...(safeString(input.revisionRelevance).trim() ? { revisionRelevance: safeString(input.revisionRelevance).trim() } : {}),
    ...(typeof input.isSaved === 'boolean' ? { isSaved: input.isSaved } : {}),
    ...(typeof input.isPinned === 'boolean' ? { isPinned: input.isPinned } : {}),
    ...(typeof input.isCompleted === 'boolean' ? { isCompleted: input.isCompleted } : {}),
    ...(typeof input.isHelpful === 'boolean' ? { isHelpful: input.isHelpful } : {}),
    ...(safeString(input.lastOpenedAt).trim() ? { lastOpenedAt: safeString(input.lastOpenedAt).trim() } : {}),
    ...(safeString(input.lastPlayedAt).trim() ? { lastPlayedAt: safeString(input.lastPlayedAt).trim() } : {}),
    ...(safeString(input.lastReviewedAt).trim() ? { lastReviewedAt: safeString(input.lastReviewedAt).trim() } : {}),
    ...(typeof input.recommendedScore === 'number' ? { recommendedScore: input.recommendedScore } : {}),
    ...(typeof input.streamRankScore === 'number' ? { streamRankScore: input.streamRankScore } : {}),
    ...(typeof input.playbackPosition === 'number' ? { playbackPosition: input.playbackPosition } : {}),
    ...(typeof input.interactionCount === 'number' ? { interactionCount: Math.max(0, Math.round(input.interactionCount)) } : {}),
    ...(typeof input.completionCount === 'number' ? { completionCount: Math.max(0, Math.round(input.completionCount)) } : {}),
  };

  const rows = await prisma.$queryRawUnsafe<MediaAssetRow[]>(
    `
      INSERT INTO "MediaAsset" (
        "id",
        "userId",
        "assetKind",
        "title",
        "summary",
        "subject",
        "topic",
        "tags",
        "language",
        "sessionId",
        "revisionItemId",
        "sourceUrl",
        "videoId",
        "dataUrl",
        "assetUrl",
        "thumbnailUrl",
        "durationSec",
        "recapText",
        "keyPoints",
        "quickChecks",
        "metadata",
        "safetyStatus",
        "sourceTrust",
        "dedupeKey"
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8::text[],$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19::jsonb,$20::jsonb,$21::jsonb,$22,$23,$24
      )
      RETURNING *
    `,
    id,
    input.userId,
    input.assetKind,
    safeString(input.title).trim() || 'Untitled media asset',
    safeString(input.summary).trim() || null,
    safeString(input.subject).trim() || null,
    safeString(input.topic).trim() || null,
    (input.tags || []).map((tag) => safeString(tag).trim()).filter(Boolean),
    safeString(input.language).trim() || null,
    normalizedSourceChatSessionId || null,
    safeString(input.revisionItemId).trim() || null,
    safeString(input.sourceUrl).trim() || null,
    safeString(input.videoId).trim() || null,
    safeString(input.dataUrl).trim() || null,
    safeString(input.assetUrl).trim() || null,
    safeString(input.thumbnailUrl).trim() || null,
    typeof input.durationSec === 'number' && Number.isFinite(input.durationSec)
      ? Math.max(0, Math.round(input.durationSec))
      : null,
    safeString(input.recapText).trim() || null,
    JSON.stringify(input.keyPoints || []),
    JSON.stringify(input.quickChecks || []),
    JSON.stringify(mergedMetadata),
    safeString(input.safetyStatus).trim() || null,
    safeString(input.sourceTrust).trim() || null,
    dedupeKey
  );

  return mapMediaAssetRow(rows[0]);
}

export async function listMediaAssets(args: {
  userId: string;
  assetKind?: MediaAssetKind | 'all';
  subject?: string;
  topic?: string;
  subtopic?: string;
  linkedWeakTopicId?: string;
  collectionId?: string;
  sessionId?: string;
  revisionItemId?: string;
  onlySaved?: boolean;
  onlyCompleted?: boolean;
  onlyHelpful?: boolean;
  sortBy?: 'recent' | 'useful' | 'recommended';
  query?: string;
  limit?: number;
  onlyCore?: boolean;
  requireSourceContext?: boolean;
}): Promise<MediaAsset[]> {
  await ensureMediaAssetTables();
  const conditions: string[] = [`"userId" = $1`];
  const values: unknown[] = [args.userId];
  let index = values.length;

  if (args.onlyCore !== false) {
    index += 1;
    conditions.push(`"assetKind" = ANY($${index}::text[])`);
    values.push([...CORE_MEDIA_ASSET_KINDS]);
  }
  if (args.requireSourceContext !== false) {
    conditions.push(`(
      NULLIF(COALESCE("metadata"->>'sourceChatSessionId', ''), '') IS NOT NULL
      OR NULLIF(COALESCE("sessionId", ''), '') IS NOT NULL
    )`);
  }

  if (args.assetKind && args.assetKind !== 'all' && MEDIA_ASSET_KINDS.has(args.assetKind)) {
    index += 1;
    conditions.push(`"assetKind" = $${index}`);
    values.push(args.assetKind);
  }
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
  if (safeString(args.subtopic).trim()) {
    index += 1;
    conditions.push(`LOWER(COALESCE("metadata"->>'subtopic', '')) LIKE LOWER($${index})`);
    values.push(`%${safeString(args.subtopic).trim()}%`);
  }
  if (safeString(args.linkedWeakTopicId).trim()) {
    index += 1;
    conditions.push(`LOWER(COALESCE("metadata"->>'linkedWeakTopicId', '')) = LOWER($${index})`);
    values.push(safeString(args.linkedWeakTopicId).trim());
  }
  if (safeString(args.collectionId).trim()) {
    index += 1;
    conditions.push(`("metadata"->'collectionIds') ? $${index}`);
    values.push(safeString(args.collectionId).trim());
  }
  if (safeString(args.sessionId).trim()) {
    index += 1;
    conditions.push(`"sessionId" = $${index}`);
    values.push(safeString(args.sessionId).trim());
  }
  if (safeString(args.revisionItemId).trim()) {
    index += 1;
    conditions.push(`"revisionItemId" = $${index}`);
    values.push(safeString(args.revisionItemId).trim());
  }
  if (typeof args.onlySaved === 'boolean') {
    index += 1;
    conditions.push(`COALESCE(("metadata"->>'isSaved')::boolean, true) = $${index}`);
    values.push(args.onlySaved);
  }
  if (typeof args.onlyCompleted === 'boolean') {
    index += 1;
    conditions.push(`COALESCE(("metadata"->>'isCompleted')::boolean, false) = $${index}`);
    values.push(args.onlyCompleted);
  }
  if (typeof args.onlyHelpful === 'boolean') {
    index += 1;
    conditions.push(`COALESCE(("metadata"->>'isHelpful')::boolean, false) = $${index}`);
    values.push(args.onlyHelpful);
  }
  if (safeString(args.query).trim()) {
    index += 1;
    conditions.push(`(
      LOWER(COALESCE("title", '')) LIKE LOWER($${index})
      OR LOWER(COALESCE("summary", '')) LIKE LOWER($${index})
      OR LOWER(COALESCE("topic", '')) LIKE LOWER($${index})
      OR LOWER(COALESCE("recapText", '')) LIKE LOWER($${index})
    )`);
    values.push(`%${safeString(args.query).trim()}%`);
  }

  index += 1;
  values.push(Math.min(100, Math.max(1, Number(args.limit) || 30)));

  const orderByClause =
    args.sortBy === 'recommended'
      ? `COALESCE(("metadata"->>'streamRankScore')::numeric, ("metadata"->>'recommendedScore')::numeric, 0) DESC, "updatedAt" DESC`
      : args.sortBy === 'useful'
        ? `COALESCE(("metadata"->>'isHelpful')::boolean, false) DESC, COALESCE(("metadata"->>'completionCount')::int, 0) DESC, "updatedAt" DESC`
        : `"updatedAt" DESC`;

  const rows = await prisma.$queryRawUnsafe<MediaAssetRow[]>(
    `
      SELECT *
      FROM "MediaAsset"
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderByClause}
      LIMIT $${index}
    `,
    ...values
  );
  return rows.map(mapMediaAssetRow);
}

export async function linkMediaAssetToRevision(args: {
  userId: string;
  assetId: string;
  revisionItemId: string;
}): Promise<MediaAsset | null> {
  await ensureMediaAssetTables();
  const rows = await prisma.$queryRawUnsafe<MediaAssetRow[]>(
    `
      UPDATE "MediaAsset"
      SET "revisionItemId" = $3,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "userId" = $2
      RETURNING *
    `,
    args.assetId,
    args.userId,
    args.revisionItemId
  );
  return rows[0] ? mapMediaAssetRow(rows[0]) : null;
}

export async function setMediaAssetCollectionIds(args: {
  userId: string;
  assetId: string;
  collectionIds: string[];
}): Promise<MediaAsset | null> {
  await ensureMediaAssetTables();
  const existing = await getMediaAssetById({ userId: args.userId, assetId: args.assetId });
  if (!existing) return null;

  const collectionIds = Array.from(
    new Set((args.collectionIds || []).map((entry) => safeString(entry).trim()).filter(Boolean))
  ).slice(0, 48);
  const nextMetadata = {
    ...safeJsonObject(existing.metadata || {}),
    collectionIds,
  };

  const rows = await prisma.$queryRawUnsafe<MediaAssetRow[]>(
    `
      UPDATE "MediaAsset"
      SET "metadata" = $3::jsonb,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "userId" = $2
      RETURNING *
    `,
    args.assetId,
    args.userId,
    JSON.stringify(nextMetadata)
  );

  return rows[0] ? mapMediaAssetRow(rows[0]) : null;
}

export async function recordMediaAssetInteraction(args: {
  userId: string;
  assetId: string;
  action: MediaAssetInteractionAction;
  revisionItemId?: string | null;
}): Promise<MediaAsset | null> {
  await ensureMediaAssetTables();
  const existing = await getMediaAssetById({ userId: args.userId, assetId: args.assetId });
  if (!existing) return null;

  const nowIso = new Date().toISOString();
  const nextMetadata = {
    ...safeJsonObject(existing.metadata || {}),
  };

  const currentInteractionCount = Number(nextMetadata.interactionCount || existing.interactionCount || 0) || 0;
  nextMetadata.interactionCount = currentInteractionCount + 1;
  nextMetadata.lastInteractionAt = nowIso;
  const practiceActions = new Set<MediaAssetInteractionAction>(['quick_check', 'quiz_me', 'similar_question', 'complete']);

  if (args.action === 'open') {
    nextMetadata.lastOpenedAt = nowIso;
  } else if (args.action === 'play') {
    nextMetadata.lastPlayedAt = nowIso;
  } else if (args.action === 'complete') {
    const currentCompletionCount = Number(nextMetadata.completionCount || existing.completionCount || 0) || 0;
    nextMetadata.completionCount = currentCompletionCount + 1;
    nextMetadata.isCompleted = true;
    nextMetadata.lastReviewedAt = nowIso;
  } else if (args.action === 'helpful') {
    nextMetadata.isHelpful = true;
  } else if (args.action === 'unhelpful') {
    nextMetadata.isHelpful = false;
  } else if (args.action === 'save_to_revision') {
    nextMetadata.isSaved = true;
  } else if (args.action === 'quick_check') {
    nextMetadata.lastReviewedAt = nowIso;
  } else if (args.action === 'show_more_like_this') {
    nextMetadata.lastDiscoveryBoostAt = nowIso;
  } else if (args.action === 'explain_simply') {
    nextMetadata.lastSimplifyRequestAt = nowIso;
  } else if (args.action === 'open_long_lesson') {
    nextMetadata.lastLongLessonOpenAt = nowIso;
  } else if (args.action === 'similar_topic') {
    nextMetadata.lastSimilarTopicRequestAt = nowIso;
  } else if (args.action === 'quiz_me') {
    nextMetadata.lastQuizRequestAt = nowIso;
  } else if (args.action === 'similar_question') {
    nextMetadata.lastSimilarQuestionRequestAt = nowIso;
  }

  if (practiceActions.has(args.action)) {
    nextMetadata.lastPracticeActionAt = nowIso;
    if (safeString(nextMetadata.lastOpenedAt).trim() && !safeString(nextMetadata.openToPracticeConversionAt).trim()) {
      nextMetadata.openToPracticeConversionAt = nowIso;
    }
  }
  if (args.action === 'save_to_revision') {
    const hasOpened = Boolean(safeString(nextMetadata.lastOpenedAt).trim());
    const hasPractice = Boolean(
      safeString(nextMetadata.lastPracticeActionAt).trim() ||
      safeString(nextMetadata.openToPracticeConversionAt).trim()
    );
    if (hasOpened && !safeString(nextMetadata.openToSaveConversionAt).trim()) {
      nextMetadata.openToSaveConversionAt = nowIso;
    }
    if (hasOpened && hasPractice && !safeString(nextMetadata.openPracticeSaveConversionAt).trim()) {
      nextMetadata.openPracticeSaveConversionAt = nowIso;
    }
  }

  const recommendedBase = Number(nextMetadata.recommendedScore || existing.recommendedScore || 0) || 0;
  const actionBoost =
    args.action === 'complete'
      ? 12
      : args.action === 'helpful'
        ? 10
        : args.action === 'play'
          ? 4
          : args.action === 'open'
            ? 2
            : args.action === 'quick_check'
              ? 6
              : args.action === 'save_to_revision'
                ? 8
                : args.action === 'show_more_like_this'
                  ? 5
                  : args.action === 'explain_simply'
                    ? 7
                    : args.action === 'open_long_lesson'
                      ? 4
                      : args.action === 'similar_topic'
                        ? 5
                        : args.action === 'quiz_me'
                          ? 8
                          : args.action === 'similar_question'
                            ? 7
                : -4;
  nextMetadata.recommendedScore = Math.max(0, Math.min(200, recommendedBase + actionBoost));
  nextMetadata.streamRankScore = Number(nextMetadata.recommendedScore || 0);

  const revisionItemId = safeString(args.revisionItemId).trim() || safeString(existing.revisionItemId).trim() || null;

  const rows = await prisma.$queryRawUnsafe<MediaAssetRow[]>(
    `
      UPDATE "MediaAsset"
      SET "metadata" = $3::jsonb,
          "revisionItemId" = $4,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "userId" = $2
      RETURNING *
    `,
    args.assetId,
    args.userId,
    JSON.stringify(nextMetadata),
    revisionItemId
  );

  return rows[0] ? mapMediaAssetRow(rows[0]) : null;
}
