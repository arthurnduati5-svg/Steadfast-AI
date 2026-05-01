import { randomUUID } from 'crypto';
import prisma from '../utils/prismaClient';
import type {
  MetacognitiveStateSnapshot,
  RevisionCollection,
  RevisionCollectionKind,
  RevisionContentType,
  RevisionEventOutcome,
  RevisionItem,
  RevisionMediaRef,
  RevisionMediaType,
  RevisionMastery,
  RevisionOverview,
  RevisionReviewStatus,
  RevisionSaveType,
  RevisionSaveMode,
  RevisionSourceType,
  RevisionSubject,
  SourceCitation,
  TutorArtifact,
  TutorRevisionNote,
  TutorState,
} from '../lib/types';
import {
  type RawRevisionSourceMessage,
  buildMediaRefs as buildNormalizedMediaRefs,
  buildRevisionTags as buildNormalizedRevisionTags,
  deriveRevisionBody,
  deriveRevisionSaveMode,
  deriveRevisionSubtopic,
  deriveRevisionSummary as deriveNormalizedRevisionSummary,
  deriveRevisionTitle as deriveNormalizedRevisionTitle,
  extractTranscriptSnippet,
  inferRevisionMediaType,
  inferRevisionSaveType,
  inferRevisionSourceType,
  inferRevisionSubject,
  limitRevisionText,
  mapRevisionSaveTypeToContentType,
  normalizeRevisionSubject,
  sanitizeRevisionTitle,
} from './revisionNormalizationService';
import {
  attachConnectedGraphToRevisionItem,
  attachConnectedGraphToRevisionItems,
  ensureRevisionGraphTables,
  refreshRevisionGraphForUser,
} from './revisionGraphService';

type RawMessageLike = RawRevisionSourceMessage;

type SaveRevisionItemArgs = {
  userId: string;
  sessionId?: string;
  sourceMessageId?: string;
  sourceMessage?: RawMessageLike | null;
  tutorActionId?: string;
  targetContent: string;
  selectedText?: string;
  topic?: string;
  subject?: string;
  saveType?: RevisionSaveType | null;
  overrideTitle?: string;
  overrideSummary?: string;
  collectionId?: string | null;
  createCollectionTitle?: string | null;
  tutorState?: TutorState;
  tutorArtifacts?: TutorArtifact[];
  sources?: SourceCitation[];
  videoData?: {
    id?: string;
    title?: string;
    thumbnailUrl?: string;
  } | null;
  studentNote?: string | null;
  saveMode?: RevisionSaveMode | null;
  needsPractice?: boolean;
  isMistakeBased?: boolean;
  contentType?: RevisionContentType | null;
  examPriority?: boolean;
  reflection?: MetacognitiveStateSnapshot | null;
  sourceKind?: string | null;
};

type CreateRevisionCollectionArgs = {
  userId: string;
  title: string;
  subject?: string | null;
  topic?: string | null;
  description?: string | null;
  pinned?: boolean;
  sourceSessionId?: string | null;
};

type UpdateRevisionCollectionArgs = {
  userId: string;
  collectionId: string;
  patch: {
    title?: string;
    subject?: string | null;
    topic?: string | null;
    description?: string | null;
    kind?: RevisionCollectionKind | null;
    bundleSummary?: string | null;
    featuredItemIds?: string[] | null;
    coverRef?: Record<string, unknown> | null;
    metadata?: Record<string, unknown> | null;
  };
};

export type DeleteRevisionCollectionMode = 'dissolve' | 'delete_with_items';

export type DeleteRevisionCollectionArgs = {
  userId: string;
  collectionId: string;
  mode?: DeleteRevisionCollectionMode;
};

export type DeleteRevisionCollectionResult = {
  mode: DeleteRevisionCollectionMode;
  deleted: boolean;
  dissolvedItemCount: number;
  deletedItemCount: number;
};

let ensureRevisionTablesPromise: Promise<void> | null = null;

const REVISION_OVERVIEW_LIMIT = 12;
const REVISION_PREVIEW_ITEMS_PER_COLLECTION = 3;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseRevisionCollectionKind(value: unknown): RevisionCollectionKind | null {
  const normalized = safeString(value).trim();
  return normalized === 'standard' || normalized === 'bundle'
    ? normalized
    : null;
}

function parseRevisionEventOutcome(value: unknown): RevisionEventOutcome | null {
  const normalized = safeString(value).trim();
  return normalized === 'correct' ||
    normalized === 'partial' ||
    normalized === 'struggled' ||
    normalized === 'completed' ||
    normalized === 'skipped'
    ? normalized
    : null;
}

function parseConfidenceTrend(value: unknown): RevisionItem['confidenceTrend'] {
  const normalized = safeString(value).trim();
  return normalized === 'up' || normalized === 'steady' || normalized === 'down'
    ? normalized
    : null;
}

function limitText(value: string, maxChars = 220): string {
  const clean = safeString(value).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length <= maxChars ? clean : `${clean.slice(0, maxChars - 3).trimEnd()}...`;
}

function normalizeKey(value: string): string {
  return safeString(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => safeString(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.startsWith('{') && value.endsWith('}')) {
    return value
      .slice(1, -1)
      .split(',')
      .map((item) => item.replace(/^"+|"+$/g, '').trim())
      .filter(Boolean);
  }
  return [];
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function normalizeRevisionCoverRef(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const theme = safeString(record.theme).trim();
  const emoji = safeString(record.emoji).trim();
  const motto = limitText(safeString(record.motto), 120);
  const imageDataUrl = safeString(record.imageDataUrl).trim();
  const imagePrompt = limitText(safeString(record.imagePrompt), 320);
  const imageSourceCandidate = safeString(record.imageSource).trim().toLowerCase();
  const imageSource =
    imageSourceCandidate === 'ai_generated' || imageSourceCandidate === 'uploaded'
      ? imageSourceCandidate
      : '';
  const imageUpdatedAt = safeString(record.imageUpdatedAt).trim();
  const next: Record<string, unknown> = {};
  if (theme) next.theme = theme;
  if (emoji) next.emoji = emoji;
  if (motto) next.motto = motto;
  if (
    imageDataUrl.startsWith('data:image/') &&
    Buffer.byteLength(imageDataUrl, 'utf8') <= 450_000
  ) {
    next.imageDataUrl = imageDataUrl;
  }
  if (imagePrompt) next.imagePrompt = imagePrompt;
  if (imageSource) next.imageSource = imageSource;
  if (imageUpdatedAt) next.imageUpdatedAt = imageUpdatedAt;
  return Object.keys(next).length ? next : null;
}

function normalizeRevisionCollectionMetadata(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  try {
    const serialized = JSON.stringify(value);
    if (!serialized || serialized === '{}' || Buffer.byteLength(serialized, 'utf8') > 200_000) {
      return null;
    }
    const parsed = JSON.parse(serialized);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function extractReflectionFromMetadata(metadata: unknown): MetacognitiveStateSnapshot | null {
  const parsed = parseJsonValue<Record<string, unknown> | null>(metadata, null);
  const reflection = parsed && typeof parsed === 'object' ? parseJsonValue<MetacognitiveStateSnapshot | null>(parsed.reflection, null) : null;
  return reflection && Object.values(reflection).some(Boolean) ? reflection : null;
}

function inferSubjectFromTopic(topic: string): string | null {
  const lower = safeString(topic).toLowerCase();
  if (!lower) return null;
  if (/\b(quran|surah|ayah|hadith|fiqh|seerah|sirah|tajweed|dua|salah|wudu|wudhu|akhlaq|aqeedah|islam)\b/.test(lower)) return 'Islamic Studies';
  if (/\b(algebra|equation|fraction|ratio|geometry|trigonometry|simultaneous|calculus|math|mathematics|percentage|probability)\b/.test(lower)) return 'Mathematics';
  if (/\b(chemistry|atom|molecule|acid|base|reaction|periodic)\b/.test(lower)) return 'Chemistry';
  if (/\b(physics|force|motion|electric|velocity|acceleration|energy)\b/.test(lower)) return 'Physics';
  if (/\b(biology|cell|photosynthesis|genetics|ecosystem|respiration|osmosis)\b/.test(lower)) return 'Biology';
  if (/\b(english|grammar|comprehension|essay|poem|literature)\b/.test(lower)) return 'English';
  if (/\b(history|government|geography|map|climate|population)\b/.test(lower)) return 'Humanities';
  return null;
}

function sanitizeTitle(value: string): string {
  const clean = safeString(value)
    .replace(/\s+/g, ' ')
    .replace(/^[^A-Za-z0-9\u0600-\u06FF]+/, '')
    .trim();
  return clean.slice(0, 90) || 'Saved revision note';
}

function inferRevisionContentType(args: {
  tutorActionId?: string;
  targetContent: string;
  selectedText?: string;
  tutorArtifacts: TutorArtifact[];
  sourceMessage?: RawMessageLike | null;
  videoData?: { id?: string } | null;
}): RevisionContentType {
  if (args.tutorActionId && ['misconception', 'correction', 'exam_trap'].includes(args.tutorActionId)) {
    return args.tutorActionId as RevisionContentType;
  }
  const text = `${safeString(args.selectedText)} ${safeString(args.targetContent)}`.toLowerCase();
  const artifact = args.tutorArtifacts[0];
  if (args.videoData?.id || args.sourceMessage?.videoData?.id) return 'video';
  if (artifact?.kind === 'image') return 'image';
  if (artifact?.kind === 'pdf') return 'document';
  if (/\b(audio|voice|listening)\b/.test(text)) return 'audio';
  if (/\b(common mistake|watch out|exam trap|avoid this mistake|be careful)\b/.test(text)) return 'exam_trap';
  if (/\b(correct(ion|ed)?|instead\b|the right way|should be)\b/.test(text)) return 'correction';
  if (/\bmisconception|confuse|mix up|wrong idea|not the same as\b/.test(text)) return 'misconception';
  if (args.tutorActionId === 'summarize' || /\bsummary|in short|key points\b/.test(text)) return 'summary';
  if (args.tutorActionId === 'practice' || /\bpractice|try this|similar question\b/.test(text)) return 'practice_tip';
  if (/\bdefinition\b/.test(text) || /^[A-Z][A-Za-z\s-]{1,40}\s+is\b/.test(safeString(args.targetContent))) return 'definition';
  if (/\bformula\b/.test(text) || /[A-Za-z]\s*=\s*[^=]/.test(safeString(args.targetContent))) return 'formula';
  if (/\bstep\b/.test(text) || /\b1[\).:-]\s/.test(safeString(args.targetContent))) return 'worked_step';
  if (args.tutorActionId === 'breakdown') return 'explanation';
  return 'note';
}

function deriveRevisionTitle(args: {
  topic?: string;
  subject?: string | null;
  contentType: RevisionContentType;
  selectedText?: string;
  tutorArtifacts: TutorArtifact[];
  sourceMessage?: RawMessageLike | null;
  videoData?: { title?: string } | null;
}): string {
  const topic = safeString(args.topic).trim();
  const selected = limitText(safeString(args.selectedText), 68);
  const artifactLabel = safeString(args.tutorArtifacts[0]?.label).trim();
  const videoTitle = safeString(args.videoData?.title || args.sourceMessage?.videoData?.title).trim();
  const subject = safeString(args.subject).trim();

  if (topic) return sanitizeTitle(topic);
  if (selected) return sanitizeTitle(selected);
  if (artifactLabel) return sanitizeTitle(artifactLabel);
  if (videoTitle) return sanitizeTitle(videoTitle);
  if (subject) return sanitizeTitle(subject);

  const sourceSnippet = limitText(safeString(args.sourceMessage?.content), 68);
  if (sourceSnippet) return sanitizeTitle(sourceSnippet);

  switch (args.contentType) {
    case 'formula':
      return 'Saved formula';
    case 'definition':
      return 'Saved definition';
    case 'practice_tip':
      return 'Practice note';
    case 'worked_step':
      return 'Worked step';
    case 'misconception':
      return 'Common confusion';
    case 'correction':
      return 'Correction note';
    case 'exam_trap':
      return 'Exam trap';
    case 'video':
      return 'Saved video note';
    case 'document':
      return 'Saved document note';
    case 'image':
      return 'Saved image note';
    default:
      return 'Saved revision note';
  }
}

function deriveRevisionSummary(targetContent: string, selectedText?: string): string {
  const selected = limitText(selectedText || '', 180);
  if (selected) return selected;
  const clean = safeString(targetContent).replace(/\s+/g, ' ').trim();
  if (!clean) return 'Saved from your study session.';
  const sentence = clean.match(/[^.!?]+[.!?]?/);
  return limitText(sentence?.[0] || clean, 180);
}

function buildRevisionTags(args: {
  topic?: string;
  subject?: string | null;
  tutorArtifacts: TutorArtifact[];
  tutorState?: TutorState;
}): string[] {
  const candidates = [
    safeString(args.topic).trim(),
    safeString(args.subject).trim(),
    ...(args.tutorArtifacts[0]?.topics || []),
    ...(args.tutorState?.activeArtifactLabels || []),
    ...(args.tutorState?.recentGoals || []),
  ];

  const seen = new Set<string>();
  return candidates
    .map((item) => safeString(item).trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeKey(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function buildArtifactRefs(artifacts: TutorArtifact[]): RevisionMediaRef[] {
  return artifacts.slice(0, 4).map((artifact) => ({
    kind:
      artifact.kind === 'pdf'
        ? 'document'
        : artifact.kind === 'image'
          ? 'image'
          : 'artifact',
    id: artifact.id,
    artifactId: artifact.id,
    label: artifact.label,
    title: artifact.label,
    summary: artifact.summary,
  }));
}

function buildMediaRefs(args: {
  sourceMessage?: RawMessageLike | null;
  tutorArtifacts: TutorArtifact[];
  videoData?: { id?: string; title?: string; thumbnailUrl?: string } | null;
  sources: SourceCitation[];
}): RevisionMediaRef[] {
  const refs: RevisionMediaRef[] = [];
  refs.push(...buildArtifactRefs(args.tutorArtifacts));

  const videoId = safeString(args.videoData?.id || args.sourceMessage?.videoData?.id).trim();
  const videoTitle = safeString(args.videoData?.title || args.sourceMessage?.videoData?.title).trim();
  if (videoId || videoTitle) {
    refs.push({
      kind: 'video',
      id: videoId || undefined,
      videoId: videoId || undefined,
      title: videoTitle || 'Saved video',
      thumbnailUrl: safeString(args.videoData?.thumbnailUrl || args.sourceMessage?.videoData?.thumbnailUrl).trim() || undefined,
    });
  }

  const audioMeta = parseJsonValue<Record<string, unknown> | null>(args.sourceMessage?.metadata?.audio, null);
  if (audioMeta) {
    refs.push({
      kind: 'audio',
      id: safeString(audioMeta.id).trim() || undefined,
      audioId: safeString(audioMeta.id).trim() || undefined,
      title: safeString(audioMeta.label || audioMeta.title).trim() || 'Saved audio',
      durationSec: Number.isFinite(Number(audioMeta.durationSec)) ? Number(audioMeta.durationSec) : undefined,
    });
  }

  const sourceRef = args.sources[0];
  if (sourceRef?.url || sourceRef?.sourceName) {
    refs.push({
      kind: 'source',
      title: safeString(sourceRef.sourceName).trim() || 'Study source',
      url: safeString(sourceRef.url).trim() || undefined,
    });
  }

  return refs.slice(0, 6);
}

function mapRevisionCollectionRow(row: any): RevisionCollection {
  return {
    id: safeString(row.id),
    userId: safeString(row.userId) || undefined,
    title: safeString(row.title),
    subject: (normalizeRevisionSubject(safeString(row.subject).trim()) || safeString(row.subject).trim() || null) as RevisionSubject | string | null,
    topic: safeString(row.topic).trim() || null,
    description: safeString(row.description).trim() || null,
    kind: parseRevisionCollectionKind(row.kind),
    bundleSummary: safeString(row.bundleSummary).trim() || null,
    featuredItemIds: parseJsonValue<string[] | null>(row.featuredItemIds, null),
    coverRef: parseJsonValue<Record<string, unknown> | null>(row.coverRef, null),
    examFocus: Boolean(row.examFocus),
    pinned: Boolean(row.pinned),
    itemCount: Number(row.itemCount || 0),
    latestItemAt: row.latestItemAt ? new Date(row.latestItemAt).toISOString() : undefined,
    previewItems: Array.isArray(row.previewItems) ? row.previewItems : undefined,
    sourceSessionId: safeString(row.sourceSessionId).trim() || null,
    metadata: parseJsonValue<Record<string, unknown> | null>(row.metadata, null),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapRevisionItemRow(row: any): RevisionItem {
  const metadata = parseJsonValue<Record<string, unknown> | null>(row.metadata, null);
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
    contentType: safeString(row.contentType) as RevisionContentType,
    subject: (normalizeRevisionSubject(safeString(row.subject).trim()) || safeString(row.subject).trim() || null) as RevisionSubject | string | null,
    saveType: (safeString(row.saveType).trim() || null) as RevisionSaveType | null,
    mediaType: (safeString(row.mediaType).trim() || null) as RevisionMediaType | null,
    topic: safeString(row.topic).trim() || null,
    subtopic: safeString(row.subtopic).trim() || null,
    tags: normalizeStringArray(row.tags),
    artifactLabels: normalizeStringArray(row.artifactLabels),
    selectedText: safeString(row.selectedText).trim() || null,
    studentNote: safeString(row.studentNote).trim() || null,
    isPinned: Boolean(row.isPinned),
    mastery: (safeString(row.mastery).trim() || null) as RevisionMastery | null,
    needsPractice: Boolean(row.needsPractice),
    isMistakeBased: Boolean(row.isMistakeBased),
    saveMode: (safeString(row.saveMode).trim() || null) as RevisionSaveMode | null,
    lastPracticedAt: row.lastPracticedAt ? new Date(row.lastPracticedAt).toISOString() : null,
    practiceCount: Number(row.practiceCount || 0),
    reviewStatus: (safeString(row.reviewStatus).trim() || null) as RevisionReviewStatus | null,
    lastReviewedAt: row.lastReviewedAt ? new Date(row.lastReviewedAt).toISOString() : null,
    nextReviewAt: row.nextReviewAt ? new Date(row.nextReviewAt).toISOString() : null,
    reviewCount: Number(row.reviewCount || 0),
    successCount: Number(row.successCount || 0),
    struggleCount: Number(row.struggleCount || 0),
    recentOutcome: parseRevisionEventOutcome(row.recentOutcome),
    confidenceTrend: parseConfidenceTrend(row.confidenceTrend),
    examPriority: Boolean(row.examPriority),
    sourceType: (safeString(row.sourceType).trim() || null) as RevisionSourceType | null,
    sourceUrl: safeString(row.sourceUrl).trim() || null,
    imageUrl: safeString(row.imageUrl).trim() || null,
    audioUrl: safeString(row.audioUrl).trim() || null,
    videoId: safeString(row.videoId).trim() || null,
    videoTitle: safeString(row.videoTitle).trim() || null,
    transcriptSnippet: safeString(row.transcriptSnippet).trim() || null,
    audioRecapRef: parseJsonValue<Record<string, unknown> | null>(row.audioRecapRef, null),
    featuredRank: row.featuredRank == null ? null : Number(row.featuredRank),
    bundleRole: safeString(row.bundleRole).trim() || null,
    sourceRefs: parseJsonValue<SourceCitation[]>(row.sourceRefs, []),
    mediaRefs: parseJsonValue<RevisionMediaRef[]>(row.mediaRefs, []),
    reflection: extractReflectionFromMetadata(metadata),
    metadata,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

async function ensureRevisionTables() {
  if (!ensureRevisionTablesPromise) {
    ensureRevisionTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RevisionCollection" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "description" TEXT NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RevisionCollection_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "StudentProfile"("userId")
            ON DELETE CASCADE ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RevisionItem" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "sessionId" TEXT NULL,
          "sourceMessageId" TEXT NULL,
          "collectionId" TEXT NULL,
          "title" TEXT NOT NULL,
          "summary" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "contentType" TEXT NOT NULL,
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "artifactLabels" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
          "selectedText" TEXT NULL,
          "sourceRefs" JSONB NULL,
          "mediaRefs" JSONB NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RevisionItem_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "StudentProfile"("userId")
            ON DELETE CASCADE ON UPDATE CASCADE,
          CONSTRAINT "RevisionItem_sessionId_fkey"
            FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id")
            ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT "RevisionItem_sourceMessageId_fkey"
            FOREIGN KEY ("sourceMessageId") REFERENCES "ChatMessage"("id")
            ON DELETE SET NULL ON UPDATE CASCADE,
          CONSTRAINT "RevisionItem_collectionId_fkey"
            FOREIGN KEY ("collectionId") REFERENCES "RevisionCollection"("id")
            ON DELETE SET NULL ON UPDATE CASCADE
        );
      `);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "kind" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "bundleSummary" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "featuredItemIds" JSONB NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "coverRef" JSONB NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "examFocus" BOOLEAN NOT NULL DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "pinned" BOOLEAN NOT NULL DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "sourceSessionId" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "studentNote" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "mastery" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "needsPractice" BOOLEAN NOT NULL DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "isMistakeBased" BOOLEAN NOT NULL DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "saveMode" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "saveType" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "mediaType" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "subtopic" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "sourceType" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "sourceUrl" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "audioUrl" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "videoId" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "videoTitle" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "transcriptSnippet" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "lastPracticedAt" TIMESTAMP(3) NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "practiceCount" INTEGER NOT NULL DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "lastReviewedAt" TIMESTAMP(3) NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "nextReviewAt" TIMESTAMP(3) NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "successCount" INTEGER NOT NULL DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "struggleCount" INTEGER NOT NULL DEFAULT 0;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "recentOutcome" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "confidenceTrend" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "examPriority" BOOLEAN NOT NULL DEFAULT false;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "audioRecapRef" JSONB NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "featuredRank" INTEGER NULL;`);
      await prisma.$executeRawUnsafe(`ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "bundleRole" TEXT NULL;`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionCollection_userId_updatedAt_idx" ON "RevisionCollection" ("userId", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionCollection_userId_title_idx" ON "RevisionCollection" ("userId", "title");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionCollection_userId_topic_idx" ON "RevisionCollection" ("userId", "topic");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_userId_updatedAt_idx" ON "RevisionItem" ("userId", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_userId_collectionId_updatedAt_idx" ON "RevisionItem" ("userId", "collectionId", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_userId_subject_updatedAt_idx" ON "RevisionItem" ("userId", "subject", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_userId_saveType_updatedAt_idx" ON "RevisionItem" ("userId", "saveType", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_sessionId_idx" ON "RevisionItem" ("sessionId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_sourceMessageId_idx" ON "RevisionItem" ("sourceMessageId");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_userId_isPinned_updatedAt_idx" ON "RevisionItem" ("userId", "isPinned", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_userId_reviewStatus_idx" ON "RevisionItem" ("userId", "reviewStatus", "nextReviewAt");`);
      await ensureRevisionGraphTables();
    })().catch((error) => {
      ensureRevisionTablesPromise = null;
      throw error;
    });
  }

  return ensureRevisionTablesPromise;
}

async function findSuggestedCollection(args: {
  userId: string;
  title?: string | null;
  topic?: string | null;
  subject?: string | null;
}): Promise<RevisionCollection | null> {
  const searchTitle = safeString(args.title).trim();
  const searchTopic = safeString(args.topic).trim();
  const normalizedTitle = normalizeKey(searchTitle || searchTopic);
  if (!normalizedTitle) return null;

  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT *
      FROM "RevisionCollection"
      WHERE "userId" = $1
      ORDER BY "updatedAt" DESC
      LIMIT 40
    `,
    args.userId
  );

  const match = rows.find((row) => {
    const rowTitle = normalizeKey(safeString(row.title));
    const rowTopic = normalizeKey(safeString(row.topic));
    return rowTitle === normalizedTitle || rowTopic === normalizedTitle;
  });

  return match ? mapRevisionCollectionRow(match) : null;
}

export async function createRevisionCollection(args: CreateRevisionCollectionArgs): Promise<RevisionCollection> {
  await ensureRevisionTables();

  const id = randomUUID();
  const title = sanitizeRevisionTitle(args.title);
  const description = safeString(args.description).trim() || null;
  const subject = normalizeRevisionSubject(args.subject) || safeString(args.subject).trim() || null;
  const topic = safeString(args.topic).trim() || null;
  const pinned = Boolean(args.pinned);
  const sourceSessionId = safeString(args.sourceSessionId).trim() || null;

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "RevisionCollection" (
        "id", "userId", "title", "subject", "topic", "description", "pinned", "sourceSessionId", "metadata", "createdAt", "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CAST($9 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    id,
    args.userId,
    title,
    subject,
    topic,
    description,
    pinned,
    sourceSessionId,
    JSON.stringify({})
  );

  return {
    id,
    userId: args.userId,
    title,
    subject,
    topic,
    description,
    kind: 'standard',
    bundleSummary: null,
    featuredItemIds: null,
    coverRef: null,
    examFocus: false,
    pinned,
    itemCount: 0,
    sourceSessionId,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateRevisionCollection(args: UpdateRevisionCollectionArgs): Promise<RevisionCollection | null> {
  await ensureRevisionTables();

  const [existing] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT *
      FROM "RevisionCollection"
      WHERE "userId" = $1
        AND "id" = $2
      LIMIT 1
    `,
    args.userId,
    args.collectionId
  );

  if (!existing) return null;

  const assignments: string[] = [];
  const values: unknown[] = [];
  let parameterIndex = 3;
  const push = (column: string, value: unknown) => {
    assignments.push(`"${column}" = $${parameterIndex}`);
    values.push(value);
    parameterIndex += 1;
  };

  if (typeof args.patch.title === 'string') {
    push('title', sanitizeRevisionTitle(args.patch.title) || safeString(existing.title));
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'subject')) {
    push(
      'subject',
      normalizeRevisionSubject(args.patch.subject) || safeString(args.patch.subject).trim() || null
    );
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'topic')) {
    push('topic', limitText(safeString(args.patch.topic), 120) || null);
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'description')) {
    push('description', limitText(safeString(args.patch.description), 320) || null);
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'kind')) {
    push(
      'kind',
      args.patch.kind === 'standard' || args.patch.kind === 'bundle'
        ? args.patch.kind
        : null
    );
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'bundleSummary')) {
    push('bundleSummary', limitText(safeString(args.patch.bundleSummary), 220) || null);
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'featuredItemIds')) {
    assignments.push(`"featuredItemIds" = CAST($${parameterIndex} AS JSONB)`);
    values.push(
      JSON.stringify(
        Array.isArray(args.patch.featuredItemIds)
          ? args.patch.featuredItemIds
              .map((itemId) => safeString(itemId).trim())
              .filter(Boolean)
              .slice(0, 6)
          : null
      )
    );
    parameterIndex += 1;
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'coverRef')) {
    assignments.push(`"coverRef" = CAST($${parameterIndex} AS JSONB)`);
    values.push(JSON.stringify(normalizeRevisionCoverRef(args.patch.coverRef)));
    parameterIndex += 1;
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'metadata')) {
    assignments.push(`"metadata" = CAST($${parameterIndex} AS JSONB)`);
    values.push(JSON.stringify(normalizeRevisionCollectionMetadata(args.patch.metadata)));
    parameterIndex += 1;
  }

  if (!assignments.length) {
    return mapRevisionCollectionRow(existing);
  }

  assignments.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  await prisma.$executeRawUnsafe(
    `
      UPDATE "RevisionCollection"
      SET ${assignments.join(', ')}
      WHERE "id" = $1
        AND "userId" = $2
    `,
    args.collectionId,
    args.userId,
    ...values
  );

  return getRevisionCollectionDetails({
    userId: args.userId,
    collectionId: args.collectionId,
  }).then((result) => result?.collection || null);
}

export async function deleteRevisionCollection(args: DeleteRevisionCollectionArgs): Promise<DeleteRevisionCollectionResult> {
  await ensureRevisionTables();
  const mode: DeleteRevisionCollectionMode = args.mode === 'delete_with_items' ? 'delete_with_items' : 'dissolve';

  const [existing] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT "id"
      FROM "RevisionCollection"
      WHERE "userId" = $1
        AND "id" = $2
      LIMIT 1
    `,
    args.userId,
    args.collectionId
  );

  if (!existing) {
    return {
      mode,
      deleted: false,
      dissolvedItemCount: 0,
      deletedItemCount: 0,
    };
  }

  const [countRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT COUNT(*)::int AS "count"
      FROM "RevisionItem"
      WHERE "userId" = $1
        AND "collectionId" = $2
    `,
    args.userId,
    args.collectionId
  );
  const itemCount = Number(countRow?.count || 0);

  if (mode === 'delete_with_items') {
    await prisma.$transaction([
      prisma.$executeRawUnsafe(
        `
          DELETE FROM "RevisionReviewEvent"
          WHERE "userId" = $1
            AND "revisionItemId" IN (
              SELECT "id"
              FROM "RevisionItem"
              WHERE "userId" = $1
                AND "collectionId" = $2
            )
        `,
        args.userId,
        args.collectionId
      ),
      prisma.$executeRawUnsafe(
        `
          UPDATE "MediaAsset"
          SET "revisionItemId" = NULL
          WHERE "userId" = $1
            AND "revisionItemId" IN (
              SELECT "id"
              FROM "RevisionItem"
              WHERE "userId" = $1
                AND "collectionId" = $2
            )
        `,
        args.userId,
        args.collectionId
      ),
      prisma.$executeRawUnsafe(
        `
          UPDATE "MetacognitiveEvent"
          SET "revisionItemId" = NULL
          WHERE "userId" = $1
            AND "revisionItemId" IN (
              SELECT "id"
              FROM "RevisionItem"
              WHERE "userId" = $1
                AND "collectionId" = $2
            )
        `,
        args.userId,
        args.collectionId
      ),
      prisma.$executeRawUnsafe(
        `
          UPDATE "LearningEffectEvent"
          SET "revisionItemId" = NULL
          WHERE "userId" = $1
            AND "revisionItemId" IN (
              SELECT "id"
              FROM "RevisionItem"
              WHERE "userId" = $1
                AND "collectionId" = $2
            )
        `,
        args.userId,
        args.collectionId
      ),
      prisma.$executeRawUnsafe(
        `
          DELETE FROM "RevisionItem"
          WHERE "userId" = $1
            AND "collectionId" = $2
        `,
        args.userId,
        args.collectionId
      ),
      prisma.$executeRawUnsafe(
        `
          DELETE FROM "RevisionCollection"
          WHERE "userId" = $1
            AND "id" = $2
        `,
        args.userId,
        args.collectionId
      ),
    ]);

    return {
      mode,
      deleted: true,
      dissolvedItemCount: 0,
      deletedItemCount: itemCount,
    };
  }

  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      `
        UPDATE "RevisionItem"
        SET
          "collectionId" = NULL,
          "featuredRank" = NULL,
          "bundleRole" = NULL,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "userId" = $1
          AND "collectionId" = $2
      `,
      args.userId,
      args.collectionId
    ),
    prisma.$executeRawUnsafe(
      `
        DELETE FROM "RevisionCollection"
        WHERE "userId" = $1
          AND "id" = $2
      `,
      args.userId,
      args.collectionId
    ),
  ]);

  return {
    mode,
    deleted: true,
    dissolvedItemCount: itemCount,
    deletedItemCount: 0,
  };
}

async function resolveRevisionCollection(args: {
  userId: string;
  collectionId?: string | null;
  createCollectionTitle?: string | null;
  sessionId?: string | null;
  topic?: string | null;
  subject?: string | null;
  tutorArtifacts: TutorArtifact[];
  sourceMessage?: RawMessageLike | null;
  videoData?: { title?: string } | null;
}): Promise<RevisionCollection | null> {
  const explicitCollectionId = safeString(args.collectionId).trim();
  if (explicitCollectionId) {
    const [explicitCollection] = await prisma.$queryRawUnsafe<any[]>(
      `
        SELECT *
        FROM "RevisionCollection"
        WHERE "userId" = $1
          AND "id" = $2
        LIMIT 1
      `,
      args.userId,
      explicitCollectionId
    );
    if (explicitCollection) {
      return mapRevisionCollectionRow(explicitCollection);
    }
  }

  const topic = safeString(args.topic).trim();
  const subject = normalizeRevisionSubject(args.subject) || safeString(args.subject).trim();
  const artifactLabel = safeString(args.tutorArtifacts[0]?.label).trim();
  const videoTitle = safeString(args.videoData?.title || args.sourceMessage?.videoData?.title).trim();
  const explicitTitle = safeString(args.createCollectionTitle).trim();
  const preferredTitle = explicitTitle || topic || artifactLabel || videoTitle || subject;

  if (!preferredTitle) return null;

  const existing = await findSuggestedCollection({
    userId: args.userId,
    title: preferredTitle,
    topic: topic || undefined,
    subject: subject || undefined,
  });
  if (existing) return existing;

  return createRevisionCollection({
    userId: args.userId,
    title: preferredTitle,
    topic: topic || artifactLabel || videoTitle || null,
    subject: subject || null,
    sourceSessionId: safeString(args.sessionId).trim() || null,
    description: topic
      ? `Saved revision for ${topic}.`
      : artifactLabel
        ? `Saved revision linked to ${artifactLabel}.`
        : videoTitle
          ? `Saved revision linked to ${videoTitle}.`
          : 'Saved revision items grouped for study.',
  });
}

function buildTutorRevisionNote(args: {
  item: RevisionItem;
  collection: RevisionCollection | null;
}): TutorRevisionNote {
  return {
    id: args.item.id,
    text: args.item.content,
    topic: args.item.topic || undefined,
    sourceMessageId: args.item.sourceMessageId || undefined,
    createdAt: args.item.createdAt,
    subject: args.item.subject || undefined,
    artifactLabels: args.item.artifactLabels,
    basedOnVideoTitle: args.item.mediaRefs?.find((ref) => ref.kind === 'video')?.title,
    summary: args.item.summary,
    contentType: args.item.contentType,
    collectionId: args.collection?.id,
    collectionTitle: args.collection?.title,
  };
}

export async function saveRevisionItem(args: SaveRevisionItemArgs): Promise<{
  item: RevisionItem;
  collection: RevisionCollection | null;
  tutorRevisionNote: TutorRevisionNote;
}> {
  await ensureRevisionTables();

  const tutorArtifacts = Array.isArray(args.tutorArtifacts) ? args.tutorArtifacts : [];
  const sources = Array.isArray(args.sources) ? args.sources : [];
  const sourceMessage = args.sourceMessage || null;
  const topic =
    safeString(args.topic).trim() ||
    safeString(args.tutorState?.activeTopic).trim() ||
    safeString(sourceMessage?.metadata?.tutorState?.activeTopic).trim() ||
    null;

  const subject =
    inferRevisionSubject({
      requestedSubject: args.subject,
      topic,
      tutorArtifacts,
      tutorState: args.tutorState,
      sourceMessage,
    }) ||
    null;

  const saveType = inferRevisionSaveType({
    requestedSaveType: args.saveType,
    requestedContentType: args.contentType,
    tutorActionId: args.tutorActionId,
    targetContent: args.targetContent,
    selectedText: args.selectedText,
    sources,
    sourceMessage,
    videoData: args.videoData,
  });

  const contentType =
    args.contentType ||
    mapRevisionSaveTypeToContentType(saveType) ||
    inferRevisionContentType({
      tutorActionId: args.tutorActionId,
      targetContent: args.targetContent,
      selectedText: args.selectedText,
      tutorArtifacts,
      sourceMessage,
      videoData: args.videoData,
    });

  const collection = await resolveRevisionCollection({
    userId: args.userId,
    collectionId: args.collectionId,
    createCollectionTitle: args.createCollectionTitle,
    sessionId: args.sessionId,
    topic,
    subject,
    tutorArtifacts,
    sourceMessage,
    videoData: args.videoData,
  });

  const mediaRefs = buildNormalizedMediaRefs({
    sourceMessage,
    tutorArtifacts,
    videoData: args.videoData,
    sources,
  });
  const mediaType = inferRevisionMediaType(mediaRefs);
  const sourceType = inferRevisionSourceType({
    sources,
    mediaRefs,
    sourceMessage,
  });
  const title = safeString(args.overrideTitle).trim()
    ? sanitizeRevisionTitle(args.overrideTitle!)
    : deriveNormalizedRevisionTitle({
        saveType,
        topic: topic || undefined,
        subject,
        selectedText: args.selectedText,
        tutorArtifacts,
        sourceMessage,
        videoData: args.videoData,
        targetContent: args.targetContent,
      });
  const summary =
    limitRevisionText(args.overrideSummary || '', 180) ||
    deriveNormalizedRevisionSummary({
      saveType,
      targetContent: args.targetContent,
      selectedText: args.selectedText,
      topic,
    });
  const content =
    deriveRevisionBody({
      saveType,
      targetContent: args.targetContent,
      selectedText: args.selectedText,
    }) || summary;
  const normalizedStudentNote = limitRevisionText(safeString(args.studentNote), 400) || null;
  const saveMode = deriveRevisionSaveMode(saveType, (safeString(args.saveMode).trim() || null) as RevisionSaveMode | null);
  const needsPractice = Boolean(args.needsPractice || saveMode === 'practice_later' || saveType === 'practice_item' || saveType === 'mistake_to_fix');
  const isMistakeBased =
    Boolean(args.isMistakeBased) ||
    saveType === 'mistake_to_fix' ||
    ['misconception', 'correction', 'exam_trap'].includes(contentType);
  const reviewStatus: RevisionReviewStatus =
    needsPractice || isMistakeBased ? 'review_due' : 'new';
  const tags = buildNormalizedRevisionTags({
    topic: topic || undefined,
    subject,
    tutorArtifacts,
    tutorState: args.tutorState,
    saveType,
  });
  const artifactLabels = tutorArtifacts.map((artifact) => artifact.label).filter(Boolean).slice(0, 8);
  const sourceUrl = safeString(sources[0]?.url).trim() || null;
  const imageUrl =
    safeString(mediaRefs.find((ref) => ref.kind === 'image')?.url).trim() ||
    safeString(sourceMessage?.metadata?.image?.src).trim() ||
    null;
  const audioUrl = safeString(mediaRefs.find((ref) => ref.kind === 'audio')?.url).trim() || null;
  const videoId = safeString(args.videoData?.id || sourceMessage?.videoData?.id).trim() || null;
  const videoTitle = safeString(args.videoData?.title || sourceMessage?.videoData?.title).trim() || null;
  const transcriptSnippet = extractTranscriptSnippet(sourceMessage);
  const subtopic = deriveRevisionSubtopic(topic);
  const id = randomUUID();
  const reflection = args.reflection && Object.values(args.reflection).some(Boolean) ? args.reflection : null;
  const metadata = {
    tutorActionId: args.tutorActionId || null,
    saveType,
    mediaType,
    sourceType,
    learnerStage: args.tutorState?.learnerStage || null,
    recommendedMode: args.tutorState?.recommendedMode || null,
    evidenceReferences: args.tutorState?.evidenceReferences || [],
    activeTopic: args.tutorState?.activeTopic || null,
    activeArtifactLabels: args.tutorState?.activeArtifactLabels || [],
    activeVideoTitle: args.tutorState?.activeVideoTitle || null,
    misconceptionFocus: args.tutorState?.misconceptionFocus || [],
    reflection,
  };

  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "RevisionItem" (
        "id",
        "userId",
        "sessionId",
        "sourceMessageId",
        "collectionId",
        "title",
        "summary",
        "content",
        "contentType",
        "subject",
        "saveType",
        "mediaType",
        "topic",
        "subtopic",
        "tags",
        "artifactLabels",
        "selectedText",
        "studentNote",
        "isPinned",
        "mastery",
        "needsPractice",
        "isMistakeBased",
        "saveMode",
        "lastPracticedAt",
        "practiceCount",
        "reviewStatus",
        "lastReviewedAt",
        "nextReviewAt",
        "reviewCount",
        "successCount",
        "struggleCount",
        "recentOutcome",
        "confidenceTrend",
        "examPriority",
        "sourceType",
        "sourceUrl",
        "imageUrl",
        "audioUrl",
        "videoId",
        "videoTitle",
        "transcriptSnippet",
        "audioRecapRef",
        "featuredRank",
        "bundleRole",
        "sourceRefs",
        "mediaRefs",
        "metadata",
        "createdAt",
        "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16::text[], $17::text[], $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33,
        $34, $35, $36, $37, $38, $39, $40, $41, CAST($42 AS JSONB), $43, $44, CAST($45 AS JSONB), CAST($46 AS JSONB), CAST($47 AS JSONB),
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `,
    id,
    args.userId,
    args.sessionId || null,
    args.sourceMessageId || null,
    collection?.id || null,
    title,
    summary,
    content,
    contentType,
    subject,
    saveType,
    mediaType,
    topic,
    subtopic,
    tags,
    artifactLabels,
    safeString(args.selectedText).trim() || null,
    normalizedStudentNote,
    false,
    null,
    needsPractice,
    isMistakeBased,
    saveMode,
    null,
    0,
    reviewStatus,
    null,
    needsPractice ? new Date().toISOString() : null,
    0,
    0,
    0,
    null,
    null,
    Boolean(args.examPriority),
    sourceType,
    sourceUrl,
    imageUrl,
    audioUrl,
    videoId,
    videoTitle,
    transcriptSnippet,
    JSON.stringify(null),
    null,
    null,
    JSON.stringify(sources),
    JSON.stringify(mediaRefs),
    JSON.stringify(metadata)
  );

  if (collection?.id) {
    await prisma.$executeRawUnsafe(
      `UPDATE "RevisionCollection" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
      collection.id
    );
  }

  const item: RevisionItem = {
    id,
    userId: args.userId,
    sessionId: args.sessionId || null,
    sourceMessageId: args.sourceMessageId || null,
    collectionId: collection?.id || null,
    collectionTitle: collection?.title || null,
    title,
    summary,
    content,
    contentType,
    subject,
    saveType,
    mediaType,
    topic,
    subtopic,
    tags,
    artifactLabels,
    selectedText: safeString(args.selectedText).trim() || null,
    studentNote: normalizedStudentNote,
    isPinned: false,
    mastery: null,
    needsPractice,
    isMistakeBased,
    saveMode,
    lastPracticedAt: null,
    practiceCount: 0,
    reviewStatus,
    lastReviewedAt: null,
    nextReviewAt: needsPractice ? new Date().toISOString() : null,
    reviewCount: 0,
    successCount: 0,
    struggleCount: 0,
    recentOutcome: null,
    confidenceTrend: null,
    examPriority: Boolean(args.examPriority),
    sourceType,
    sourceUrl,
    imageUrl,
    audioUrl,
    videoId,
    videoTitle,
    transcriptSnippet,
    audioRecapRef: null,
    featuredRank: null,
    bundleRole: null,
    sourceRefs: sources,
    mediaRefs,
    reflection,
    metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  let itemWithGraph: RevisionItem = item;
  try {
    await refreshRevisionGraphForUser(args.userId);
    const withGraph = await attachConnectedGraphToRevisionItem({
      userId: args.userId,
      item,
      refreshIfMissing: false,
    });
    if (withGraph) itemWithGraph = withGraph;
  } catch {
    itemWithGraph = item;
  }

  return {
    item: itemWithGraph,
    collection,
    tutorRevisionNote: buildTutorRevisionNote({ item: itemWithGraph, collection }),
  };
}

export async function getRevisionOverview(args: {
  userId: string;
  search?: string;
  limit?: number;
}): Promise<RevisionOverview> {
  await ensureRevisionTables();

  const limit = Math.max(1, Math.min(24, Number(args.limit || REVISION_OVERVIEW_LIMIT)));
  const search = safeString(args.search).trim();
  const searchPattern = `%${search.toLowerCase()}%`;

  const collections = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        c.*,
        COUNT(i."id")::int AS "itemCount",
        MAX(i."updatedAt") AS "latestItemAt"
      FROM "RevisionCollection" c
      LEFT JOIN "RevisionItem" i
        ON i."collectionId" = c."id"
      WHERE c."userId" = $1
        AND (
          $2 = ''
          OR LOWER(c."title") LIKE $3
          OR LOWER(COALESCE(c."topic", '')) LIKE $3
          OR LOWER(COALESCE(c."subject", '')) LIKE $3
        )
      GROUP BY c."id"
      ORDER BY COALESCE(MAX(i."updatedAt"), c."updatedAt") DESC
      LIMIT $4
    `,
    args.userId,
    search,
    searchPattern,
    limit
  );

  const collectionIds = collections.map((row) => safeString(row.id)).filter(Boolean);
  const collectionPreviewRows = collectionIds.length > 0
    ? await prisma.$queryRawUnsafe<any[]>(
        `
          SELECT
            i.*,
            c."title" AS "collectionTitle"
          FROM "RevisionItem" i
          LEFT JOIN "RevisionCollection" c
            ON c."id" = i."collectionId"
          WHERE i."userId" = $1
            AND i."collectionId" = ANY($2::text[])
          ORDER BY
            COALESCE(i."featuredRank", 2147483647) ASC,
            i."updatedAt" DESC
        `,
        args.userId,
        collectionIds
      )
    : [];

  const recentItemsRows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        i.*,
        c."title" AS "collectionTitle"
      FROM "RevisionItem" i
      LEFT JOIN "RevisionCollection" c
        ON c."id" = i."collectionId"
      WHERE i."userId" = $1
        AND (
          $2 = ''
          OR LOWER(i."title") LIKE $3
          OR LOWER(i."summary") LIKE $3
          OR LOWER(COALESCE(i."topic", '')) LIKE $3
          OR LOWER(COALESCE(i."subject", '')) LIKE $3
        )
      ORDER BY i."updatedAt" DESC
      LIMIT $4
    `,
    args.userId,
    search,
    searchPattern,
    limit
  );

  const ungroupedRows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        i.*,
        NULL::text AS "collectionTitle"
      FROM "RevisionItem" i
      WHERE i."userId" = $1
        AND i."collectionId" IS NULL
        AND (
          $2 = ''
          OR LOWER(i."title") LIKE $3
          OR LOWER(i."summary") LIKE $3
          OR LOWER(COALESCE(i."topic", '')) LIKE $3
          OR LOWER(COALESCE(i."subject", '')) LIKE $3
        )
      ORDER BY i."updatedAt" DESC
      LIMIT $4
    `,
    args.userId,
    search,
    searchPattern,
    limit
  );

  const [countsRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        COUNT(*)::int AS "totalItems",
        COUNT(*) FILTER (WHERE "collectionId" IS NULL)::int AS "ungroupedCount"
      FROM "RevisionItem"
      WHERE "userId" = $1
    `,
    args.userId
  );

  const [collectionCountRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT COUNT(*)::int AS "totalCollections"
      FROM "RevisionCollection"
      WHERE "userId" = $1
    `,
    args.userId
  );

  const mappedCollectionPreviewItems = collectionPreviewRows.map(mapRevisionItemRow);
  const mappedRecentItems = recentItemsRows.map(mapRevisionItemRow);
  const mappedUngroupedItems = ungroupedRows.map(mapRevisionItemRow);

  const graphReadyItems = await attachConnectedGraphToRevisionItems({
    userId: args.userId,
    items: [...mappedCollectionPreviewItems, ...mappedRecentItems, ...mappedUngroupedItems],
  });
  const graphItemById = new Map<string, RevisionItem>(graphReadyItems.map((entry) => [entry.id, entry]));
  const collectionPreviewById = new Map<string, RevisionItem[]>();
  for (const row of mappedCollectionPreviewItems) {
    const collectionId = safeString(row.collectionId);
    if (!collectionId) continue;
    const current = collectionPreviewById.get(collectionId) || [];
    if (current.length >= REVISION_PREVIEW_ITEMS_PER_COLLECTION) continue;
    current.push(graphItemById.get(row.id) || row);
    collectionPreviewById.set(collectionId, current);
  }

  return {
    collections: collections.map((row) => ({
      ...mapRevisionCollectionRow(row),
      previewItems: collectionPreviewById.get(safeString(row.id)) || [],
    })),
    recentItems: mappedRecentItems.map((entry) => graphItemById.get(entry.id) || entry),
    ungroupedItems: mappedUngroupedItems.map((entry) => graphItemById.get(entry.id) || entry),
    totalItems: Number(countsRow?.totalItems || 0),
    totalCollections: Number(collectionCountRow?.totalCollections || 0),
    ungroupedCount: Number(countsRow?.ungroupedCount || 0),
  };
}

export async function getRevisionCollectionDetails(args: {
  userId: string;
  collectionId: string;
  search?: string;
}): Promise<{ collection: RevisionCollection; items: RevisionItem[] } | null> {
  await ensureRevisionTables();

  const search = safeString(args.search).trim();
  const searchPattern = `%${search.toLowerCase()}%`;
  const [collectionRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        c.*,
        COUNT(i."id")::int AS "itemCount",
        MAX(i."updatedAt") AS "latestItemAt"
      FROM "RevisionCollection" c
      LEFT JOIN "RevisionItem" i
        ON i."collectionId" = c."id"
      WHERE c."userId" = $1
        AND c."id" = $2
      GROUP BY c."id"
      LIMIT 1
    `,
    args.userId,
    args.collectionId
  );

  if (!collectionRow) return null;

  const items = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        i.*,
        c."title" AS "collectionTitle"
      FROM "RevisionItem" i
      LEFT JOIN "RevisionCollection" c
        ON c."id" = i."collectionId"
      WHERE i."userId" = $1
        AND i."collectionId" = $2
        AND (
          $3 = ''
          OR LOWER(i."title") LIKE $4
          OR LOWER(i."summary") LIKE $4
          OR LOWER(COALESCE(i."topic", '')) LIKE $4
          OR LOWER(COALESCE(i."subject", '')) LIKE $4
        )
      ORDER BY
        COALESCE(i."featuredRank", 2147483647) ASC,
        i."updatedAt" DESC
    `,
    args.userId,
    args.collectionId,
    search,
    searchPattern
  );

  const graphReadyItems = await attachConnectedGraphToRevisionItems({
    userId: args.userId,
    items: items.map(mapRevisionItemRow),
  });

  return {
    collection: mapRevisionCollectionRow(collectionRow),
    items: graphReadyItems,
  };
}

export async function getRevisionItemDetails(args: {
  userId: string;
  itemId: string;
}): Promise<RevisionItem | null> {
  await ensureRevisionTables();

  const [row] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        i.*,
        c."title" AS "collectionTitle"
      FROM "RevisionItem" i
      LEFT JOIN "RevisionCollection" c
        ON c."id" = i."collectionId"
      WHERE i."userId" = $1
        AND i."id" = $2
      LIMIT 1
    `,
    args.userId,
    args.itemId
  );

  if (!row) return null;
  const item = mapRevisionItemRow(row);
  return attachConnectedGraphToRevisionItem({
    userId: args.userId,
    item,
  });
}
