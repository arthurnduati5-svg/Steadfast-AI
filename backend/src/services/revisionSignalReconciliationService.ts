import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { RevisionItem } from '../lib/types';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function limitText(value: string, maxChars = 220): string {
  const clean = safeString(value).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length <= maxChars ? clean : `${clean.slice(0, maxChars - 3).trimEnd()}...`;
}

function sanitizeTitle(value: string): string {
  const clean = safeString(value)
    .replace(/\s+/g, ' ')
    .replace(/^[^A-Za-z0-9\u0600-\u06FF]+/, '')
    .trim();
  return clean.slice(0, 90) || 'Saved revision note';
}

export type ReconcileWeakSignalArgs = {
  userId: string;
  sourceType: string;
  sourceRef: string;
  curriculumObjectiveId?: string | null;
  curriculumTopicId?: string | null;
  curriculumSkillId?: string | null;
  subject?: string | null;
  safeTitle: string;
  safeSummary: string;
  severity?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type ReconcileWeakSignalResult = {
  revisionItemId: string;
  isNew: boolean;
  item: RevisionItem;
};

export async function reconcileWeakSignal(
  args: ReconcileWeakSignalArgs
): Promise<ReconcileWeakSignalResult> {
  const userId = args.userId;
  const sourceType = safeString(args.sourceType).trim();
  const sourceRef = safeString(args.sourceRef).trim();

  if (!userId || !sourceType || !sourceRef) {
    throw new Error('reconcileWeakSignal: userId, sourceType, and sourceRef are required');
  }

  // Check for existing receipt (idempotent)
  const existingReceipt = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT r.*, i."id" AS "itemId"
      FROM "RevisionSourceSignalReceipt" r
      LEFT JOIN "RevisionItem" i ON i."id" = r."revisionItemId"
      WHERE r."userId" = $1
        AND r."sourceType" = $2
        AND r."sourceRef" = $3
      LIMIT 1
    `,
    userId,
    sourceType,
    sourceRef
  );

  if (existingReceipt.length > 0) {
    const receipt = existingReceipt[0];
    // Load the existing revision item
    const [itemRow] = await prisma.$queryRawUnsafe<any[]>(
      `
        SELECT i.*, c."title" AS "collectionTitle"
        FROM "RevisionItem" i
        LEFT JOIN "RevisionCollection" c ON c."id" = i."collectionId"
        WHERE i."userId" = $1 AND i."id" = $2
        LIMIT 1
      `,
      userId,
      receipt.itemId || receipt.revisionItemId
    );
    if (itemRow) {
      return {
        revisionItemId: receipt.itemId || receipt.revisionItemId,
        isNew: false,
        item: mapRevisionItemRow(itemRow),
      };
    }
  }

  // Create new revision item + receipt in transaction
  const itemId = randomUUID();
  const receiptId = randomUUID();
  const title = sanitizeTitle(args.safeTitle);
  const summary = limitText(args.safeSummary, 180) || title;
  const dedupeKey = `signal:${sourceType}:${sourceRef}`;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create revision item
      await tx.$executeRawUnsafe(
        `
          INSERT INTO "RevisionItem" (
            "id", "userId", "title", "summary", "content", "contentType",
            "subject", "topic", "needsPractice", "isMistakeBased",
            "reviewStatus", "nextReviewAt",
            "curriculumObjectiveId", "curriculumTopicId", "curriculumSkillId",
            "originType", "originRef", "dedupeKey",
            "metadata", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, 'note',
            $6, $7, true, true,
            'review_due', CURRENT_TIMESTAMP,
            $8, $9, $10,
            $11, $12, $13,
            CAST($14 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `,
        itemId,
        userId,
        title,
        summary,
        summary,
        args.subject || null,
        null, // topic derived from title later if needed
        args.curriculumObjectiveId || null,
        args.curriculumTopicId || null,
        args.curriculumSkillId || null,
        sourceType,
        sourceRef,
        dedupeKey,
        JSON.stringify({
          sourceType,
          sourceRef,
          severity: args.severity || null,
          ...args.metadata,
        })
      );

      // Create receipt
      await tx.$executeRawUnsafe(
        `
          INSERT INTO "RevisionSourceSignalReceipt" (
            "id", "userId", "sourceType", "sourceRef", "revisionItemId",
            "curriculumObjectiveId", "curriculumTopicId", "curriculumSkillId",
            "metadata", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8,
            CAST($9 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `,
        receiptId,
        userId,
        sourceType,
        sourceRef,
        itemId,
        args.curriculumObjectiveId || null,
        args.curriculumTopicId || null,
        args.curriculumSkillId || null,
        JSON.stringify(args.metadata || {})
      );

      return { itemId, receiptId };
    });

    // Load the created item
    const [itemRow] = await prisma.$queryRawUnsafe<any[]>(
      `
        SELECT i.*, c."title" AS "collectionTitle"
        FROM "RevisionItem" i
        LEFT JOIN "RevisionCollection" c ON c."id" = i."collectionId"
        WHERE i."userId" = $1 AND i."id" = $2
        LIMIT 1
      `,
      userId,
      itemId
    );

    return {
      revisionItemId: itemId,
      isNew: true,
      item: mapRevisionItemRow(itemRow),
    };
  } catch (error: any) {
    // Handle unique constraint violation (concurrent reconciliation race)
    if (error?.code === 'P2002' || String(error?.message || '').includes('unique')) {
      const retryReceipt = await prisma.$queryRawUnsafe<any[]>(
        `
          SELECT r.*
          FROM "RevisionSourceSignalReceipt" r
          WHERE r."userId" = $1
            AND r."sourceType" = $2
            AND r."sourceRef" = $3
          LIMIT 1
        `,
        userId,
        sourceType,
        sourceRef
      );
      if (retryReceipt.length > 0) {
        const [itemRow] = await prisma.$queryRawUnsafe<any[]>(
          `
            SELECT i.*, c."title" AS "collectionTitle"
            FROM "RevisionItem" i
            LEFT JOIN "RevisionCollection" c ON c."id" = i."collectionId"
            WHERE i."userId" = $1 AND i."id" = $2
            LIMIT 1
          `,
          userId,
          retryReceipt[0].revisionItemId
        );
        return {
          revisionItemId: retryReceipt[0].revisionItemId,
          isNew: false,
          item: mapRevisionItemRow(itemRow),
        };
      }
    }
    throw error;
  }
}

function mapRevisionItemRow(row: any): RevisionItem {
  const metadata = row.metadata && typeof row.metadata === 'object' ? row.metadata : null;
  return {
    id: safeString(row.id),
    userId: safeString(row.userId) || undefined,
    sessionId: safeString(row.sessionId).trim() || null,
    sourceMessageId: safeString(row.sourceMessageId).trim() || null,
    collectionId: safeString(row.collectionId).trim() || null,
    collectionTitle: safeString(row.collectionTitle).trim() || null,
    title: safeString(row.title),
    summary: safeString(row.summary),
    content: safeString(row.content),
    contentType: safeString(row.contentType) as RevisionItem['contentType'],
    subject: safeString(row.subject).trim() || null,
    topic: safeString(row.topic).trim() || null,
    tags: Array.isArray(row.tags) ? row.tags : [],
    artifactLabels: Array.isArray(row.artifactLabels) ? row.artifactLabels : [],
    selectedText: safeString(row.selectedText).trim() || null,
    studentNote: safeString(row.studentNote).trim() || null,
    isPinned: Boolean(row.isPinned),
    mastery: (safeString(row.mastery).trim() || null) as RevisionItem['mastery'],
    needsPractice: Boolean(row.needsPractice),
    isMistakeBased: Boolean(row.isMistakeBased),
    saveMode: (safeString(row.saveMode).trim() || null) as RevisionItem['saveMode'],
    lastPracticedAt: row.lastPracticedAt ? new Date(row.lastPracticedAt).toISOString() : null,
    practiceCount: Number(row.practiceCount || 0),
    reviewStatus: (safeString(row.reviewStatus).trim() || null) as RevisionItem['reviewStatus'],
    lastReviewedAt: row.lastReviewedAt ? new Date(row.lastReviewedAt).toISOString() : null,
    nextReviewAt: row.nextReviewAt ? new Date(row.nextReviewAt).toISOString() : null,
    reviewCount: Number(row.reviewCount || 0),
    successCount: Number(row.successCount || 0),
    struggleCount: Number(row.struggleCount || 0),
    recentOutcome: (safeString(row.recentOutcome).trim() || null) as RevisionItem['recentOutcome'],
    confidenceTrend: (safeString(row.confidenceTrend).trim() || null) as RevisionItem['confidenceTrend'],
    examPriority: Boolean(row.examPriority),
    audioRecapRef: null,
    featuredRank: row.featuredRank == null ? null : Number(row.featuredRank),
    bundleRole: safeString(row.bundleRole).trim() || null,
    sourceRefs: [],
    mediaRefs: [],
    metadata,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}
