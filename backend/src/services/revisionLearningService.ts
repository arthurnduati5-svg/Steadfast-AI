import { randomUUID } from 'crypto';
import prisma from '../utils/prismaClient';
import { createRevisionCollection } from './revisionService';
import type {
  Message,
  MetacognitiveStateSnapshot,
  RevisionActionResponse,
  RevisionAudioRecapResult,
  RevisionCollection,
  RevisionCollectionKind,
  RevisionContentType,
  RevisionGroupingSuggestion,
  RevisionItem,
  RevisionMediaRef,
  RevisionOverview,
  RevisionProgressOverview,
  RevisionQueue,
  RevisionReviewEvent,
  RevisionReviewStatus,
  RevisionEventOutcome,
  RevisionEventType,
  RevisionMastery,
  WeakTopicRecoveryState,
} from '../lib/types';
import { recordMasteryEvidenceSignal } from './masteryInferenceService';
import { buildLearnerLoopState } from './learnerLoopService';
import { ensureMetacognitionTables } from './metacognitionService';
import { ensureLearningEffectEventTable } from './learningEffectivenessService';
import {
  attachConnectedGraphToRevisionItem,
  attachConnectedGraphToRevisionItems,
  ensureRevisionGraphTables,
  refreshRevisionGraphForUser,
} from './revisionGraphService';

export type UpdateRevisionItemArgs = {
  userId: string;
  itemId: string;
  refreshGraph?: boolean;
  patch: {
    title?: string;
    summary?: string;
    content?: string;
    collectionId?: string | null;
    featuredRank?: number | null;
    bundleRole?: string | null;
    studentNote?: string | null;
    isPinned?: boolean;
    mastery?: 'still_learning' | 'getting_better' | 'almost_there' | 'confident' | null;
    needsPractice?: boolean;
    isMistakeBased?: boolean;
    saveMode?: 'quick_note' | 'key_idea' | 'practice_later' | null;
    contentType?: RevisionContentType;
    examPriority?: boolean;
    reflection?: MetacognitiveStateSnapshot | null;
    metadataPatch?: Record<string, unknown> | null;
  };
};

export type RecordRevisionEventArgs = {
  userId: string;
  itemId: string;
  sessionId?: string | null;
  eventType: RevisionEventType;
  outcome?: RevisionEventOutcome | null;
  metadata?: Record<string, unknown> | null;
};

export type RevisionActionArgs = {
  userId: string;
  itemId: string;
  actionType: 'quiz' | 'breakdown' | 'similar_question';
};

export type RevisionModeStartArgs = {
  userId: string;
  sourceType: 'collection' | 'items' | 'queue' | 'due' | 'weak';
  collectionId?: string;
  itemIds?: string[];
  examFocus?: boolean;
};

export type GuidedRevisionSessionStage =
  | 'recall'
  | 'quick_check'
  | 'similar'
  | 'wrap'
  | 'completed';

export type GuidedRevisionSupportAction =
  | 'hint'
  | 'explain_again'
  | 'break_down'
  | 'compare'
  | 'mark_for_later';

export type GuidedRevisionSessionStep = {
  stage: GuidedRevisionSessionStage;
  prompt: string;
  helperText?: string | null;
  inputPlaceholder?: string | null;
  requiresInput: boolean;
  ctaLabel?: string | null;
};

export type GuidedRevisionSessionStartArgs = {
  userId: string;
  itemId?: string;
  collectionId?: string;
  sourceType?: 'item' | 'collection' | 'queue';
  examFocus?: boolean;
};

export type GuidedRevisionSessionStartResult = {
  sessionId: string;
  item: RevisionItem;
  orientationLine: string;
  itemTypeLabel: string;
  masteryLabel?: RevisionMastery | null;
  supportActions: GuidedRevisionSupportAction[];
  currentStep: GuidedRevisionSessionStep;
  weakTopicRecovery?: WeakTopicRecoveryState | null;
};

export type GuidedRevisionSessionProgressArgs = {
  userId: string;
  sessionId: string;
  itemId: string;
  stage: GuidedRevisionSessionStage;
  responseText?: string;
  supportAction?: GuidedRevisionSupportAction;
};

export type GuidedRevisionSessionProgressResult = {
  sessionId: string;
  itemId: string;
  stage: GuidedRevisionSessionStage;
  feedbackText: string;
  currentStep?: GuidedRevisionSessionStep | null;
  masteryLabel?: RevisionMastery | null;
  weakTopicRecovery?: WeakTopicRecoveryState | null;
  progressSummary?: string | null;
  nextMoveText?: string | null;
  saveSuggestion?: string | null;
};

let ensureLearningTablesPromise: Promise<void> | null = null;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_QUEUE_LIMIT = 8;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseRevisionCollectionKind(value: unknown): RevisionCollectionKind | null {
  const normalized = safeString(value).trim();
  return normalized === 'standard' || normalized === 'bundle'
    ? normalized
    : null;
}

function limitText(value: string, maxChars = 240): string {
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
  if (Array.isArray(value)) return value.map((item) => safeString(item).trim()).filter(Boolean);
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

function extractReflectionFromMetadata(metadata: unknown): MetacognitiveStateSnapshot | null {
  const parsed = parseJsonValue<Record<string, unknown> | null>(metadata, null);
  const reflection = parsed && typeof parsed === 'object' ? parseJsonValue<MetacognitiveStateSnapshot | null>(parsed.reflection, null) : null;
  return reflection && Object.values(reflection).some(Boolean) ? reflection : null;
}

function sanitizeTitle(value: string, fallback = 'Saved note'): string {
  const clean = safeString(value).replace(/\s+/g, ' ').trim();
  return clean.slice(0, 90) || fallback;
}

type GuidedRevisionBlueprint = {
  itemTypeLabel: string;
  orientationLine: string;
  recallPrompt: string;
  quickCheckPrompt: string;
  similarPrompt: string;
  wrapPrompt: string;
  inputPlaceholder: string;
  supportResponses: Record<GuidedRevisionSupportAction, string>;
};

type GuidedResponseQuality = 'strong' | 'partial' | 'struggling';

const COMMON_STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'that',
  'with',
  'this',
  'from',
  'into',
  'what',
  'when',
  'where',
  'have',
  'will',
  'your',
  'about',
  'should',
  'would',
  'could',
  'then',
  'than',
  'them',
  'they',
  'their',
  'been',
  'were',
  'because',
  'while',
  'which',
]);

function resolveRevisionKind(item: RevisionItem): string {
  if (item.saveType) return item.saveType;
  if (item.contentType === 'worked_step') return 'worked_step';
  if (item.contentType === 'formula') return 'formula';
  if (item.contentType === 'definition') return 'definition';
  if (item.contentType === 'misconception' || item.contentType === 'correction') return 'mistake_to_fix';
  if (item.contentType === 'practice_tip') return 'practice_item';
  return 'explanation';
}

function revisionKindLabel(kind: string): string {
  if (kind === 'worked_step') return 'Worked step';
  if (kind === 'short_note') return 'Short note';
  if (kind === 'mistake_to_fix') return 'Mistake to fix';
  if (kind === 'formula') return 'Formula';
  if (kind === 'definition') return 'Definition';
  if (kind === 'research_note') return 'Research note';
  if (kind === 'practice_item') return 'Practice item';
  return 'Explanation';
}

function compactSubjectLabel(item: RevisionItem): string {
  const subject = safeString(item.subject).trim();
  if (!subject) return 'General';
  return subject
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function buildGuidedRevisionBlueprint(item: RevisionItem): GuidedRevisionBlueprint {
  const topic = safeString(item.topic || item.title).trim() || 'this idea';
  const kind = resolveRevisionKind(item);
  const supportResponses: Record<GuidedRevisionSupportAction, string> = {
    hint: 'Small clue: focus on the one rule that must stay true before doing any extra steps.',
    explain_again: `Here is the short version: ${limitText(item.summary || item.content || item.title, 180)}`,
    break_down:
      'Break it down: 1) name the rule, 2) apply one step, 3) check the result against the original goal.',
    compare:
      'Compare this with a similar case and ask what stays the same and what changes. That usually reveals the key move.',
    mark_for_later: 'Marked for later practice. We can keep it in your attention queue and come back with a calmer rebuild.',
  };

  const base: GuidedRevisionBlueprint = {
    itemTypeLabel: revisionKindLabel(kind),
    orientationLine: "Let's review this step by step. We will start with recall before any reteaching.",
    recallPrompt: `Before we continue, what do you remember about ${topic}?`,
    quickCheckPrompt: `Quick check: what is the key rule you must keep in mind for ${topic}?`,
    similarPrompt: `Try one similar ${topic} step now. What would you do first?`,
    wrapPrompt: 'Nice effort. In one short line, what will you remember next time?',
    inputPlaceholder: 'Write your answer in a short, clear way.',
    supportResponses,
  };

  if (kind === 'worked_step') {
    return {
      ...base,
      orientationLine: "Let's revisit this worked step. You will recall first, then try a similar step.",
      recallPrompt: `What is this step doing in ${topic}, and why is it valid?`,
      quickCheckPrompt: 'Quick check: which part of this step is easiest to misuse?',
      similarPrompt: `Now try a similar step for ${topic}. Start with the first move only.`,
    };
  }
  if (kind === 'formula') {
    return {
      ...base,
      orientationLine: 'We will recall the formula, check meaning, then apply it once.',
      recallPrompt: `From memory, what formula is used for ${topic}, and what does each part represent?`,
      quickCheckPrompt: 'Quick check: when should this formula not be used directly?',
      similarPrompt: `Apply the same formula to a similar ${topic} example. What value do you solve for first?`,
    };
  }
  if (kind === 'definition') {
    return {
      ...base,
      orientationLine: 'We will recall the term in your own words, then apply it once.',
      recallPrompt: `How would you define ${topic} in simple words?`,
      quickCheckPrompt: 'Quick check: what detail is essential in this definition?',
      similarPrompt: `Give one simple example where ${topic} appears.`,
    };
  }
  if (kind === 'mistake_to_fix') {
    return {
      ...base,
      orientationLine: "Let's fix the earlier mistake by rebuilding the key rule first.",
      recallPrompt: 'What went wrong last time, and what should you do instead?',
      quickCheckPrompt: 'Quick check: what is the correction rule you will use now?',
      similarPrompt: `Try a corrected similar ${topic} step. What changes this time?`,
    };
  }
  if (kind === 'research_note') {
    return {
      ...base,
      orientationLine: 'We will recall the core finding first, then test if you can apply it.',
      recallPrompt: `What is the main answer in this note about ${topic}?`,
      quickCheckPrompt: 'Quick check: why is that answer trustworthy in this context?',
      similarPrompt: `Apply the same idea to a closely related ${topic} scenario.`,
    };
  }
  if (kind === 'practice_item') {
    return {
      ...base,
      orientationLine: 'We will recall the approach first, then solve one similar prompt.',
      recallPrompt: `What strategy would you use first for a ${topic} practice item?`,
      quickCheckPrompt: 'Quick check: what is the first check you should do before solving?',
      similarPrompt: `Try one similar ${topic} item. Which first step shows you are on the right path?`,
    };
  }
  if (kind === 'short_note') {
    return {
      ...base,
      orientationLine: 'We will turn this note into active recall and one transfer step.',
      recallPrompt: `What key idea from this note still feels clear about ${topic}?`,
    };
  }
  return base;
}

function extractItemAnchors(item: RevisionItem): string[] {
  const source = `${item.title} ${item.summary} ${item.content} ${item.topic || ''}`
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ');
  const tokens = source.split(/\s+/).filter((token) => token.length >= 4 && !COMMON_STOP_WORDS.has(token));
  return Array.from(new Set(tokens)).slice(0, 12);
}

function evaluateGuidedResponse(text: string, anchors: string[]): GuidedResponseQuality {
  const normalized = safeString(text).toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normalized) return 'struggling';
  if (/\b(idk|i do not know|i don't know|not sure|no idea|confused)\b/.test(normalized)) {
    return 'struggling';
  }
  const matchCount = anchors.filter((anchor) => normalized.includes(anchor)).length;
  const wordCount = normalized.split(' ').filter(Boolean).length;
  if (wordCount >= 10 && matchCount >= 2) return 'strong';
  if (wordCount >= 5 || matchCount >= 1) return 'partial';
  return 'struggling';
}

function nextGuidedStage(stage: GuidedRevisionSessionStage): GuidedRevisionSessionStage {
  if (stage === 'recall') return 'quick_check';
  if (stage === 'quick_check') return 'similar';
  if (stage === 'similar') return 'wrap';
  if (stage === 'wrap') return 'completed';
  return 'completed';
}

function buildGuidedStepFromBlueprint(
  stage: GuidedRevisionSessionStage,
  blueprint: GuidedRevisionBlueprint
): GuidedRevisionSessionStep | null {
  if (stage === 'recall') {
    return {
      stage,
      prompt: blueprint.recallPrompt,
      helperText: 'Keep it simple. Answer from memory first.',
      inputPlaceholder: blueprint.inputPlaceholder,
      requiresInput: true,
      ctaLabel: 'Answer and continue',
    };
  }
  if (stage === 'quick_check') {
    return {
      stage,
      prompt: blueprint.quickCheckPrompt,
      helperText: 'One short check only.',
      inputPlaceholder: 'Give one short answer.',
      requiresInput: true,
      ctaLabel: 'Submit quick check',
    };
  }
  if (stage === 'similar') {
    return {
      stage,
      prompt: blueprint.similarPrompt,
      helperText: 'Apply the idea to a similar case.',
      inputPlaceholder: 'Show your first move.',
      requiresInput: true,
      ctaLabel: 'Submit similar step',
    };
  }
  if (stage === 'wrap') {
    return {
      stage,
      prompt: blueprint.wrapPrompt,
      helperText: 'Finish with one clear reminder.',
      inputPlaceholder: 'Write one thing to remember next time.',
      requiresInput: false,
      ctaLabel: 'Finish revision',
    };
  }
  return null;
}

function feedbackForStage(args: {
  stage: GuidedRevisionSessionStage;
  quality: GuidedResponseQuality;
}): string {
  if (args.stage === 'recall') {
    if (args.quality === 'strong') return 'Strong recall. You remembered the core idea clearly.';
    if (args.quality === 'partial') return 'Good start. You have part of it, so we will tighten it with one quick check.';
    return 'Thanks for trying. We will rebuild this with one smaller check and steady support.';
  }
  if (args.stage === 'quick_check') {
    if (args.quality === 'strong') return 'Great check. That key rule is now clearer.';
    if (args.quality === 'partial') return 'Almost there. One similar step will help this settle.';
    return 'This still feels shaky. We will use a simpler similar step and rebuild calmly.';
  }
  if (args.stage === 'similar') {
    if (args.quality === 'strong') return 'Nice transfer. You applied the idea in a similar case.';
    if (args.quality === 'partial') return 'You are getting there. One final wrap will lock in what to remember.';
    return 'This still needs support. We will mark the weak point and plan a slower recovery.';
  }
  if (args.quality === 'strong') return 'Good finish. You are moving this topic in the right direction.';
  if (args.quality === 'partial') return 'Solid finish. Keep this active with one more short revisit later.';
  return 'You stayed with it. We marked this for another calm rebuild.';
}

function progressionSummaryForQuality(quality: GuidedResponseQuality): string {
  if (quality === 'strong') return 'Understanding improved in this revision pass.';
  if (quality === 'partial') return 'There is progress, but one more pass will help it settle.';
  return 'This topic still needs a slower rebuild.';
}

export async function ensureLearningTables() {
  if (!ensureLearningTablesPromise) {
    ensureLearningTablesPromise = (async () => {
      const alterStatements = [
        `ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "kind" TEXT NULL;`,
        `ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "bundleSummary" TEXT NULL;`,
        `ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "featuredItemIds" JSONB NULL;`,
        `ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "coverRef" JSONB NULL;`,
        `ALTER TABLE "RevisionCollection" ADD COLUMN IF NOT EXISTS "examFocus" BOOLEAN NOT NULL DEFAULT false;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "studentNote" TEXT NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "isPinned" BOOLEAN NOT NULL DEFAULT false;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "mastery" TEXT NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "needsPractice" BOOLEAN NOT NULL DEFAULT false;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "isMistakeBased" BOOLEAN NOT NULL DEFAULT false;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "saveMode" TEXT NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "lastPracticedAt" TIMESTAMP(3) NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "practiceCount" INTEGER NOT NULL DEFAULT 0;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "reviewStatus" TEXT NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "lastReviewedAt" TIMESTAMP(3) NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "nextReviewAt" TIMESTAMP(3) NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "reviewCount" INTEGER NOT NULL DEFAULT 0;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "successCount" INTEGER NOT NULL DEFAULT 0;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "struggleCount" INTEGER NOT NULL DEFAULT 0;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "recentOutcome" TEXT NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "confidenceTrend" TEXT NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "examPriority" BOOLEAN NOT NULL DEFAULT false;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "audioRecapRef" JSONB NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "featuredRank" INTEGER NULL;`,
        `ALTER TABLE "RevisionItem" ADD COLUMN IF NOT EXISTS "bundleRole" TEXT NULL;`,
      ];
      for (const sql of alterStatements) {
        await prisma.$executeRawUnsafe(sql);
      }
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "RevisionReviewEvent" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "revisionItemId" TEXT NOT NULL,
          "sessionId" TEXT NULL,
          "eventType" TEXT NOT NULL,
          "outcome" TEXT NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionReviewEvent_userId_createdAt_idx" ON "RevisionReviewEvent" ("userId", "createdAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionReviewEvent_item_createdAt_idx" ON "RevisionReviewEvent" ("revisionItemId", "createdAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_userId_isPinned_updatedAt_idx" ON "RevisionItem" ("userId", "isPinned", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RevisionItem_userId_reviewStatus_idx" ON "RevisionItem" ("userId", "reviewStatus", "nextReviewAt");`);
      await ensureRevisionGraphTables();
    })().catch((error) => {
      ensureLearningTablesPromise = null;
      throw error;
    });
  }
  return ensureLearningTablesPromise;
}

function mapRevisionCollectionRow(row: any): RevisionCollection {
  return {
    id: safeString(row.id),
    userId: safeString(row.userId) || undefined,
    title: safeString(row.title),
    subject: safeString(row.subject).trim() || null,
    topic: safeString(row.topic).trim() || null,
    description: safeString(row.description).trim() || null,
    kind: parseRevisionCollectionKind(row.kind),
    bundleSummary: safeString(row.bundleSummary).trim() || null,
    featuredItemIds: parseJsonValue<string[] | null>(row.featuredItemIds, null),
    coverRef: parseJsonValue<Record<string, unknown> | null>(row.coverRef, null),
    examFocus: Boolean(row.examFocus),
    itemCount: Number(row.itemCount || 0),
    latestItemAt: row.latestItemAt ? new Date(row.latestItemAt).toISOString() : undefined,
    previewItems: Array.isArray(row.previewItems) ? row.previewItems : undefined,
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
    subject: safeString(row.subject).trim() || null,
    topic: safeString(row.topic).trim() || null,
    tags: normalizeStringArray(row.tags),
    artifactLabels: normalizeStringArray(row.artifactLabels),
    selectedText: safeString(row.selectedText).trim() || null,
    studentNote: safeString(row.studentNote).trim() || null,
    isPinned: Boolean(row.isPinned),
    mastery: (safeString(row.mastery).trim() || null) as RevisionItem['mastery'],
    needsPractice: Boolean(row.needsPractice),
    isMistakeBased: Boolean(row.isMistakeBased),
    saveMode: (safeString(row.saveMode).trim() || null) as RevisionItem['saveMode'],
    lastPracticedAt: row.lastPracticedAt ? new Date(row.lastPracticedAt).toISOString() : null,
    practiceCount: Number(row.practiceCount || 0),
    reviewStatus: (safeString(row.reviewStatus).trim() || null) as RevisionReviewStatus | null,
    lastReviewedAt: row.lastReviewedAt ? new Date(row.lastReviewedAt).toISOString() : null,
    nextReviewAt: row.nextReviewAt ? new Date(row.nextReviewAt).toISOString() : null,
    reviewCount: Number(row.reviewCount || 0),
    successCount: Number(row.successCount || 0),
    struggleCount: Number(row.struggleCount || 0),
    recentOutcome: (safeString(row.recentOutcome).trim() || null) as RevisionItem['recentOutcome'],
    confidenceTrend: (safeString(row.confidenceTrend).trim() || null) as RevisionItem['confidenceTrend'],
    examPriority: Boolean(row.examPriority),
    audioRecapRef: parseJsonValue<Record<string, unknown> | null>(row.audioRecapRef, null),
    featuredRank: row.featuredRank == null ? null : Number(row.featuredRank),
    bundleRole: safeString(row.bundleRole).trim() || null,
    sourceRefs: parseJsonValue(row.sourceRefs, []),
    mediaRefs: parseJsonValue<RevisionMediaRef[]>(row.mediaRefs, []),
    reflection: extractReflectionFromMetadata(metadata),
    metadata,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function computeConfidenceTrend(successCount: number, struggleCount: number): 'up' | 'steady' | 'down' {
  if (successCount >= struggleCount + 2) return 'up';
  if (struggleCount >= successCount + 2) return 'down';
  return 'steady';
}

function computeNextReviewState(args: {
  previousSuccessCount: number;
  previousStruggleCount: number;
  previousReviewCount: number;
  outcome?: RevisionEventOutcome | null;
  needsPractice?: boolean;
}) {
  const outcome = args.outcome || null;
  const successCount = args.previousSuccessCount + (outcome === 'correct' || outcome === 'completed' ? 1 : 0);
  const struggleCount = args.previousStruggleCount + (outcome === 'struggled' ? 1 : 0);
  const reviewCount = args.previousReviewCount + (outcome ? 1 : 0);
  let reviewStatus: RevisionReviewStatus = args.needsPractice ? 'review_due' : 'new';
  let nextReviewAt: Date | null = args.needsPractice ? new Date() : null;

  if (outcome === 'struggled') {
    reviewStatus = struggleCount >= 2 ? 'needs_attention' : 'review_due';
    nextReviewAt = new Date(Date.now() + DAY_MS);
  } else if (outcome === 'partial') {
    reviewStatus = 'practising';
    nextReviewAt = new Date(Date.now() + DAY_MS);
  } else if (successCount >= 3) {
    reviewStatus = 'strong';
    nextReviewAt = new Date(Date.now() + 7 * DAY_MS);
  } else if (successCount === 2) {
    reviewStatus = 'improving';
    nextReviewAt = new Date(Date.now() + 3 * DAY_MS);
  } else if (successCount === 1) {
    reviewStatus = 'practising';
    nextReviewAt = new Date(Date.now() + DAY_MS);
  }

  return {
    reviewStatus,
    nextReviewAt,
    successCount,
    struggleCount,
    reviewCount,
    recentOutcome: outcome,
    confidenceTrend: computeConfidenceTrend(successCount, struggleCount),
  };
}

async function getOwnedRevisionItem(userId: string, itemId: string): Promise<RevisionItem | null> {
  await ensureLearningTables();
  const [row] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT i.*, c."title" AS "collectionTitle"
      FROM "RevisionItem" i
      LEFT JOIN "RevisionCollection" c ON c."id" = i."collectionId"
      WHERE i."userId" = $1
        AND i."id" = $2
      LIMIT 1
    `,
    userId,
    itemId
  );
  return row ? mapRevisionItemRow(row) : null;
}

async function getOwnedRevisionCollection(userId: string, collectionId: string): Promise<RevisionCollection | null> {
  await ensureLearningTables();
  const [row] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT c.*, COUNT(i."id")::int AS "itemCount", MAX(i."updatedAt") AS "latestItemAt"
      FROM "RevisionCollection" c
      LEFT JOIN "RevisionItem" i ON i."collectionId" = c."id"
      WHERE c."userId" = $1
        AND c."id" = $2
      GROUP BY c."id"
      LIMIT 1
    `,
    userId,
    collectionId
  );
  return row ? mapRevisionCollectionRow(row) : null;
}

export async function fetchUserRevisionItems(userId: string, limit = 160): Promise<RevisionItem[]> {
  await ensureLearningTables();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT i.*, c."title" AS "collectionTitle"
      FROM "RevisionItem" i
      LEFT JOIN "RevisionCollection" c ON c."id" = i."collectionId"
      WHERE i."userId" = $1
      ORDER BY i."updatedAt" DESC
      LIMIT $2
    `,
    userId,
    limit
  );
  return rows.map(mapRevisionItemRow);
}

async function fetchCollectionItems(userId: string, collectionId: string): Promise<RevisionItem[]> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT i.*, c."title" AS "collectionTitle"
      FROM "RevisionItem" i
      LEFT JOIN "RevisionCollection" c ON c."id" = i."collectionId"
      WHERE i."userId" = $1
        AND i."collectionId" = $2
      ORDER BY
        COALESCE(i."featuredRank", 2147483647) ASC,
        i."updatedAt" DESC
    `,
    userId,
    collectionId
  );
  return rows.map(mapRevisionItemRow);
}

async function ensureRevisionSession(userId: string, item: RevisionItem, topicHint?: string): Promise<string> {
  const preferredSessionId = safeString(item.sessionId).trim();
  if (preferredSessionId) {
    const [existing] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT "id" FROM "ChatSession" WHERE "id" = $1 AND "studentId" = $2 LIMIT 1`,
      preferredSessionId,
      userId
    );
    if (existing?.id) return safeString(existing.id);
  }

  const sessionId = randomUUID();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "ChatSession" (
        "id", "studentId", "topic", "isActive", "metadata", "createdAt", "updatedAt", "startTime"
      )
      VALUES ($1, $2, $3, true, CAST($4 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
    sessionId,
    userId,
    sanitizeTitle(topicHint || item.topic || item.title, 'Revision session'),
    JSON.stringify({
      createdFrom: 'revision',
      revisionItemId: item.id,
      revisionCollectionId: item.collectionId || null,
    })
  );
  return sessionId;
}

async function appendAssistantMessage(sessionId: string, content: string, metadata: Record<string, unknown>): Promise<Message> {
  const [current] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT COALESCE(MAX("messageNumber"), 0)::int AS "messageNumber" FROM "ChatMessage" WHERE "sessionId" = $1`,
    sessionId
  );
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "ChatMessage" (
        "id", "sessionId", "role", "content", "timestamp", "messageNumber", "metadata"
      )
      VALUES ($1, $2, 'model', $3, CURRENT_TIMESTAMP, $4, CAST($5 AS JSONB))
    `,
    id,
    sessionId,
    content,
    Number(current?.messageNumber || 0) + 1,
    JSON.stringify(metadata)
  );
  return {
    id,
    role: 'model',
    content,
    timestamp: new Date(),
    metadata,
  };
}

function buildQuizPrompt(item: RevisionItem) {
  if (item.contentType === 'definition') {
    return { content: `In your own words, what does ${item.title} mean?`, promptType: 'quiz' };
  }
  if (item.contentType === 'formula') {
    return { content: `When would you use ${item.title}, and what does each part of the formula tell you?`, promptType: 'quiz' };
  }
  if (item.contentType === 'worked_step') {
    return { content: `Try a similar step for ${item.title}. Tell me your first move, and I will guide the next step.`, promptType: 'quiz' };
  }
  if (item.contentType === 'misconception') {
    return { content: `What is the wrong idea here, and what is the correct idea instead?`, promptType: 'quiz' };
  }
  if (item.contentType === 'correction') {
    return { content: `What should you do differently next time, and why?`, promptType: 'quiz' };
  }
  if (item.contentType === 'exam_trap') {
    return { content: `What mistake should you avoid here, and how will you catch it in time?`, promptType: 'quiz' };
  }
  return {
    content: `Tell me the main idea behind ${item.title}, then give one example or use case from your own understanding.`,
    promptType: 'quiz',
  };
}

function buildBreakdownPrompt(item: RevisionItem) {
  return {
    content: `Let's revisit ${item.title} in simple steps. Start with the first step you notice, and I will help you break down the rest only as needed.`,
    promptType: 'breakdown',
  };
}

function buildSimilarQuestionPrompt(item: RevisionItem) {
  return {
    content: `Let's practise ${item.title} with a similar question. Try the first part yourself, and I will guide the next step once you answer.`,
    promptType: 'practice',
  };
}

export async function updateRevisionItem(args: UpdateRevisionItemArgs): Promise<RevisionItem | null> {
  await ensureLearningTables();
  const item = await getOwnedRevisionItem(args.userId, args.itemId);
  if (!item) return null;

  const assignments: string[] = [];
  const values: unknown[] = [];
  let parameterIndex = 3;
  const push = (column: string, value: unknown) => {
    assignments.push(`"${column}" = $${parameterIndex}`);
    values.push(value);
    parameterIndex += 1;
  };

  if (typeof args.patch.title === 'string') push('title', sanitizeTitle(args.patch.title, item.title));
  if (typeof args.patch.summary === 'string') push('summary', limitText(args.patch.summary, 220) || item.summary);
  if (typeof args.patch.content === 'string') push('content', limitText(args.patch.content, 2500) || item.content);
  if (Object.prototype.hasOwnProperty.call(args.patch, 'collectionId')) push('collectionId', args.patch.collectionId || null);
  if (Object.prototype.hasOwnProperty.call(args.patch, 'featuredRank')) {
    push(
      'featuredRank',
      typeof args.patch.featuredRank === 'number' && Number.isFinite(args.patch.featuredRank)
        ? Math.max(1, Math.round(args.patch.featuredRank))
        : null
    );
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'bundleRole')) {
    push('bundleRole', limitText(safeString(args.patch.bundleRole), 120) || null);
  }
  if (Object.prototype.hasOwnProperty.call(args.patch, 'studentNote')) push('studentNote', limitText(safeString(args.patch.studentNote), 400) || null);
  if (typeof args.patch.isPinned === 'boolean') push('isPinned', args.patch.isPinned);
  if (Object.prototype.hasOwnProperty.call(args.patch, 'mastery')) push('mastery', args.patch.mastery || null);
  if (typeof args.patch.needsPractice === 'boolean') push('needsPractice', args.patch.needsPractice);
  if (typeof args.patch.isMistakeBased === 'boolean') push('isMistakeBased', args.patch.isMistakeBased);
  if (Object.prototype.hasOwnProperty.call(args.patch, 'saveMode')) push('saveMode', args.patch.saveMode || null);
  if (typeof args.patch.contentType === 'string') push('contentType', args.patch.contentType);
  if (typeof args.patch.examPriority === 'boolean') push('examPriority', args.patch.examPriority);
  if (
    Object.prototype.hasOwnProperty.call(args.patch, 'reflection') ||
    Object.prototype.hasOwnProperty.call(args.patch, 'metadataPatch')
  ) {
    const baseMetadata =
      item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
        ? (item.metadata as Record<string, unknown>)
        : {};
    const metadataPatch =
      args.patch.metadataPatch && typeof args.patch.metadataPatch === 'object' && !Array.isArray(args.patch.metadataPatch)
        ? args.patch.metadataPatch
        : {};
    const nextMetadata: Record<string, unknown> = {
      ...baseMetadata,
      ...metadataPatch,
    };
    if (Object.prototype.hasOwnProperty.call(args.patch, 'reflection')) {
      nextMetadata.reflection = args.patch.reflection && Object.values(args.patch.reflection).some(Boolean) ? args.patch.reflection : null;
    }
    assignments.push(`"metadata" = CAST($${parameterIndex} AS JSONB)`);
    values.push(JSON.stringify(nextMetadata));
    parameterIndex += 1;
  }

  if (assignments.length === 0) {
    if (args.refreshGraph === false) return item;
    return attachConnectedGraphToRevisionItem({
      userId: args.userId,
      item,
      refreshIfMissing: false,
    });
  }

  assignments.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  await prisma.$executeRawUnsafe(
    `
      UPDATE "RevisionItem"
      SET ${assignments.join(', ')}
      WHERE "id" = $1
        AND "userId" = $2
    `,
    args.itemId,
    args.userId,
    ...values
  );

  const updated = await getOwnedRevisionItem(args.userId, args.itemId);
  if (!updated) return null;

  if (args.refreshGraph !== false) {
    try {
      await refreshRevisionGraphForUser(args.userId);
    } catch {
      // Keep note update resilient even if graph recompute fails.
    }
  }

  if (args.refreshGraph === false) return updated;
  return attachConnectedGraphToRevisionItem({
    userId: args.userId,
    item: updated,
    refreshIfMissing: false,
  });
}

export async function updateRevisionItemsBatch(args: {
  userId: string;
  updates: Array<{
    itemId: string;
    patch: UpdateRevisionItemArgs['patch'];
  }>;
}): Promise<RevisionItem[]> {
  const uniqueUpdates = args.updates.filter(
    (entry, index, collection) =>
      safeString(entry.itemId).trim() &&
      collection.findIndex((candidate) => safeString(candidate.itemId).trim() === safeString(entry.itemId).trim()) === index
  );

  if (!uniqueUpdates.length) return [];

  const results: RevisionItem[] = [];
  for (const entry of uniqueUpdates) {
    const item = await updateRevisionItem({
      userId: args.userId,
      itemId: safeString(entry.itemId).trim(),
      refreshGraph: false,
      patch: entry.patch || {},
    });
    if (item) results.push(item);
  }

  if (!results.length) return results;

  try {
    await refreshRevisionGraphForUser(args.userId);
  } catch {
    return results;
  }

  return attachConnectedGraphToRevisionItems({
    userId: args.userId,
    items: results,
    refreshIfMissing: false,
  });
}

export async function deleteRevisionItem(args: { userId: string; itemId: string }): Promise<boolean> {
  await ensureLearningTables();
  await ensureMetacognitionTables();
  await ensureLearningEffectEventTable();
  const item = await getOwnedRevisionItem(args.userId, args.itemId);
  if (!item) return false;

  await prisma.$transaction([
    prisma.$executeRawUnsafe(
      `DELETE FROM "RevisionReviewEvent" WHERE "revisionItemId" = $1 AND "userId" = $2`,
      args.itemId,
      args.userId
    ),
    prisma.$executeRawUnsafe(
      `UPDATE "MediaAsset" SET "revisionItemId" = NULL WHERE "revisionItemId" = $1 AND "userId" = $2`,
      args.itemId,
      args.userId
    ),
    prisma.$executeRawUnsafe(
      `UPDATE "MetacognitiveEvent" SET "revisionItemId" = NULL WHERE "revisionItemId" = $1 AND "userId" = $2`,
      args.itemId,
      args.userId
    ),
    prisma.$executeRawUnsafe(
      `UPDATE "LearningEffectEvent" SET "revisionItemId" = NULL WHERE "revisionItemId" = $1 AND "userId" = $2`,
      args.itemId,
      args.userId
    ),
    prisma.$executeRawUnsafe(
      `DELETE FROM "RevisionItem" WHERE "id" = $1 AND "userId" = $2`,
      args.itemId,
      args.userId
    ),
  ]);

  try {
    await refreshRevisionGraphForUser(args.userId);
  } catch {
    // Deletion should remain successful even if graph refresh fails.
  }

  return true;
}

export async function recordRevisionReviewEvent(args: RecordRevisionEventArgs): Promise<{
  event: RevisionReviewEvent;
  item: RevisionItem;
} | null> {
  await ensureLearningTables();
  const item = await getOwnedRevisionItem(args.userId, args.itemId);
  if (!item) return null;

  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "RevisionReviewEvent" (
        "id", "userId", "revisionItemId", "sessionId", "eventType", "outcome", "metadata", "createdAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, CAST($7 AS JSONB), CURRENT_TIMESTAMP)
    `,
    id,
    args.userId,
    args.itemId,
    args.sessionId || null,
    args.eventType,
    args.outcome || null,
    JSON.stringify(args.metadata || {})
  );

  const nowIso = new Date().toISOString();
  const shouldCountAsPractice = ['quiz_started', 'quiz_answered', 'similar_question_practised'].includes(args.eventType);
  const nextState = computeNextReviewState({
    previousSuccessCount: item.successCount || 0,
    previousStruggleCount: item.struggleCount || 0,
    previousReviewCount: item.reviewCount || 0,
    outcome: args.outcome,
    needsPractice: item.needsPractice,
  });

  await prisma.$executeRawUnsafe(
    `
      UPDATE "RevisionItem"
      SET
        "reviewStatus" = $3,
        "lastReviewedAt" = CASE WHEN $4::text IS NULL THEN "lastReviewedAt" ELSE $4::timestamp END,
        "nextReviewAt" = CASE WHEN $5::text IS NULL THEN NULL ELSE $5::timestamp END,
        "reviewCount" = $6,
        "successCount" = $7,
        "struggleCount" = $8,
        "recentOutcome" = $9,
        "confidenceTrend" = $10,
        "practiceCount" = CASE WHEN $11 THEN COALESCE("practiceCount", 0) + 1 ELSE COALESCE("practiceCount", 0) END,
        "lastPracticedAt" = CASE WHEN $11 THEN $12::timestamp ELSE "lastPracticedAt" END,
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "userId" = $2
    `,
    args.itemId,
    args.userId,
    nextState.reviewStatus,
    args.outcome ? nowIso : null,
    nextState.nextReviewAt ? nextState.nextReviewAt.toISOString() : null,
    nextState.reviewCount,
    nextState.successCount,
    nextState.struggleCount,
    nextState.recentOutcome || null,
    nextState.confidenceTrend,
    shouldCountAsPractice,
    nowIso
  );

  const updated = await getOwnedRevisionItem(args.userId, args.itemId);
  if (!updated) return null;
  const updatedWithGraph =
    (await attachConnectedGraphToRevisionItem({
      userId: args.userId,
      item: updated,
      refreshIfMissing: false,
    })) || updated;

  return {
    event: {
      id,
      userId: args.userId,
      revisionItemId: args.itemId,
      sessionId: args.sessionId || null,
      eventType: args.eventType,
      outcome: args.outcome || null,
      metadata: args.metadata || {},
      createdAt: new Date().toISOString(),
    },
    item: updatedWithGraph,
  };
}

export async function getRevisionQueue(userId: string, limit = DEFAULT_QUEUE_LIMIT): Promise<RevisionQueue> {
  const items = await fetchUserRevisionItems(userId, 180);
  const now = Date.now();
  return {
    dueNow: items
      .filter((item) =>
        item.reviewStatus === 'review_due' ||
        item.reviewStatus === 'needs_attention' ||
        (item.nextReviewAt ? new Date(item.nextReviewAt).getTime() <= now : false)
      )
      .slice(0, limit),
    needsAttention: items.filter((item) => item.reviewStatus === 'needs_attention' || (item.struggleCount || 0) >= 2).slice(0, limit),
    continuePractising: items
      .filter(
        (item) =>
          item.needsPractice ||
          item.mastery === 'still_learning' ||
          item.mastery === 'almost_there' ||
          item.reviewStatus === 'practising'
      )
      .slice(0, limit),
    newItems: items.filter((item) => item.reviewStatus === 'new' || (item.reviewCount || 0) === 0).slice(0, limit),
    recentlyImproved: items.filter((item) => item.reviewStatus === 'improving' || item.confidenceTrend === 'up').slice(0, limit),
  };
}

export async function getRevisionProgressOverview(userId: string): Promise<RevisionProgressOverview> {
  await ensureLearningTables();
  const [countRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        COUNT(*) FILTER (WHERE COALESCE("reviewStatus", '') IN ('review_due', 'needs_attention') OR ("nextReviewAt" IS NOT NULL AND "nextReviewAt" <= CURRENT_TIMESTAMP))::int AS "totalDueCount",
        COUNT(*) FILTER (WHERE COALESCE("reviewStatus", '') = 'needs_attention')::int AS "totalNeedsAttentionCount",
        COUNT(*) FILTER (WHERE COALESCE("reviewStatus", '') = 'new' OR COALESCE("reviewCount", 0) = 0)::int AS "totalNewCount",
        COUNT(*) FILTER (WHERE COALESCE("reviewStatus", '') = 'strong')::int AS "totalStrongCount",
        COUNT(*) FILTER (WHERE "lastPracticedAt" IS NOT NULL AND "lastPracticedAt" >= CURRENT_TIMESTAMP - INTERVAL '7 days')::int AS "totalPractisedThisWeek"
      FROM "RevisionItem"
      WHERE "userId" = $1
    `,
    userId
  );
  const collectionRows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        c."id" AS "collectionId",
        c."title" AS "title",
        COUNT(i."id")::int AS "totalItems",
        COUNT(*) FILTER (
          WHERE COALESCE(i."reviewStatus", '') IN ('review_due', 'needs_attention')
             OR (i."nextReviewAt" IS NOT NULL AND i."nextReviewAt" <= CURRENT_TIMESTAMP)
        )::int AS "dueCount",
        COUNT(*) FILTER (WHERE COALESCE(i."reviewStatus", '') = 'strong')::int AS "strongCount",
        COUNT(*) FILTER (WHERE COALESCE(i."reviewStatus", '') = 'needs_attention')::int AS "needsAttentionCount"
      FROM "RevisionCollection" c
      LEFT JOIN "RevisionItem" i ON i."collectionId" = c."id"
      WHERE c."userId" = $1
      GROUP BY c."id"
      ORDER BY "dueCount" DESC, "totalItems" DESC
      LIMIT 12
    `,
    userId
  );
  return {
    totalDueCount: Number(countRow?.totalDueCount || 0),
    totalNeedsAttentionCount: Number(countRow?.totalNeedsAttentionCount || 0),
    totalNewCount: Number(countRow?.totalNewCount || 0),
    totalStrongCount: Number(countRow?.totalStrongCount || 0),
    totalPractisedThisWeek: Number(countRow?.totalPractisedThisWeek || 0),
    collectionProgress: collectionRows.map((row) => ({
      collectionId: safeString(row.collectionId),
      title: safeString(row.title),
      totalItems: Number(row.totalItems || 0),
      dueCount: Number(row.dueCount || 0),
      strongCount: Number(row.strongCount || 0),
      needsAttentionCount: Number(row.needsAttentionCount || 0),
    })),
  };
}

export async function runRevisionItemAction(args: RevisionActionArgs): Promise<RevisionActionResponse | null> {
  await ensureLearningTables();
  const item = await getOwnedRevisionItem(args.userId, args.itemId);
  if (!item) return null;

  const template =
    args.actionType === 'quiz'
      ? buildQuizPrompt(item)
      : args.actionType === 'similar_question'
        ? buildSimilarQuestionPrompt(item)
        : buildBreakdownPrompt(item);
  const sessionId = await ensureRevisionSession(args.userId, item, item.topic || item.title);
  const message = await appendAssistantMessage(sessionId, template.content, {
    tutorUi: {
      actionId: args.actionType === 'similar_question' ? 'practice' : 'breakdown',
      statusLine:
        args.actionType === 'quiz'
          ? 'Ready for a quick revision check.'
          : args.actionType === 'similar_question'
            ? 'Prepared a similar practice prompt.'
            : 'Prepared a simpler step-by-step breakdown.',
      nextStep: 'Reply with your attempt and I will guide the next step.',
    },
    presentation: {
      cardKind:
        args.actionType === 'quiz'
          ? 'practice'
          : args.actionType === 'similar_question'
            ? 'practice'
            : 'breakdown',
      nextStepPrompt:
        args.actionType === 'breakdown'
          ? 'Start with the first step you notice, then ask for a hint only if you need it.'
          : 'Start with your own answer before asking for more help.',
      suggestedActions:
        args.actionType === 'breakdown'
          ? ['hint', 'practice', 'save']
          : ['hint', 'breakdown', 'practice'],
      awaitingStudentAttempt: true,
      uiTone: 'calm',
    },
    revisionAction: {
      actionType: args.actionType,
      promptType: template.promptType,
      itemId: item.id,
    },
  });

  await recordRevisionReviewEvent({
    userId: args.userId,
    itemId: item.id,
    sessionId,
    eventType:
      args.actionType === 'quiz'
        ? 'quiz_started'
        : args.actionType === 'similar_question'
          ? 'similar_question_practised'
          : 'review_started',
    outcome: null,
    metadata: { actionType: args.actionType },
  });

  const refreshedItem = await getOwnedRevisionItem(args.userId, item.id);
  if (!refreshedItem) return null;
  return {
    sessionId,
    item: refreshedItem,
    actionType: args.actionType,
    message,
    promptType: template.promptType,
  };
}

export async function getRevisionGroupingSuggestions(userId: string): Promise<RevisionGroupingSuggestion[]> {
  const items = (await fetchUserRevisionItems(userId, 160)).filter((item) => !item.collectionId);
  const grouped = new Map<string, RevisionItem[]>();
  for (const item of items) {
    const key = normalizeKey(item.topic || item.subject || item.title);
    if (!key) continue;
    const bucket = grouped.get(key) || [];
    bucket.push(item);
    grouped.set(key, bucket);
  }

  const suggestions: RevisionGroupingSuggestion[] = [];
  for (const bucket of grouped.values()) {
    if (bucket.length < 2) continue;
    const first = bucket[0];
    const title = sanitizeTitle(first.topic || first.subject || first.title, 'Revision list');
    const mediaKinds = new Set(bucket.flatMap((item) => (item.mediaRefs || []).map((ref) => ref.kind)));
    const suggestedKind =
      bucket.some((item) => item.examPriority || item.isMistakeBased)
        ? 'exam_bundle'
        : mediaKinds.size >= 2
          ? 'media_bundle'
          : first.topic
            ? 'topic'
            : 'subject';
    const reason =
      suggestedKind === 'exam_bundle'
        ? 'These saved items look important for exam-focused revision.'
        : suggestedKind === 'media_bundle'
          ? 'These items mix notes and media on the same idea.'
          : first.topic
            ? 'These items share the same topic.'
            : 'These items fit under the same subject.';
    const payload = {
      title,
      subject: first.subject || null,
      topic: first.topic || null,
      itemIds: bucket.map((item) => item.id),
      suggestedKind,
    };
    suggestions.push({
      suggestionId: Buffer.from(JSON.stringify(payload)).toString('base64url'),
      title,
      subject: first.subject || null,
      topic: first.topic || null,
      itemIds: bucket.map((item) => item.id),
      reason,
      suggestedKind,
    });
  }

  return suggestions.slice(0, 8);
}

export async function applyRevisionGroupingSuggestion(userId: string, suggestionId: string): Promise<{
  collection: RevisionCollection;
  items: RevisionItem[];
} | null> {
  await ensureLearningTables();
  let decoded: { title: string; subject?: string | null; topic?: string | null; itemIds: string[]; suggestedKind?: string } | null = null;
  try {
    decoded = JSON.parse(Buffer.from(suggestionId, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!decoded || !Array.isArray(decoded.itemIds) || decoded.itemIds.length === 0) return null;

  const ownedItems = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT "id"
      FROM "RevisionItem"
      WHERE "userId" = $1
        AND "id" = ANY($2::text[])
    `,
    userId,
    decoded.itemIds
  );
  if (ownedItems.length === 0) return null;

  const [existingCollectionRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT *
      FROM "RevisionCollection"
      WHERE "userId" = $1
        AND (
          LOWER("title") = LOWER($2)
          OR ($3 <> '' AND LOWER(COALESCE("topic", '')) = LOWER($3))
        )
      LIMIT 1
    `,
    userId,
    decoded.title,
    safeString(decoded.topic)
  );

  const collection = existingCollectionRow
    ? mapRevisionCollectionRow(existingCollectionRow)
    : await createRevisionCollection({
        userId,
        title: decoded.title,
        subject: decoded.subject || null,
        topic: decoded.topic || null,
        description:
          decoded.suggestedKind === 'exam_bundle'
            ? 'Exam-priority revision grouped for focused review.'
            : 'Saved notes and study material grouped for easier revision.',
      });

  await prisma.$executeRawUnsafe(
    `
      UPDATE "RevisionCollection"
      SET
        "kind" = $2,
        "examFocus" = $3,
        "bundleSummary" = COALESCE("bundleSummary", $4),
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "userId" = $5
    `,
    collection.id,
    decoded.suggestedKind === 'media_bundle' || decoded.suggestedKind === 'exam_bundle' ? 'bundle' : 'standard',
    decoded.suggestedKind === 'exam_bundle',
    `Grouped revision around ${decoded.topic || decoded.title}.`,
    userId
  );

  await prisma.$executeRawUnsafe(
    `
      UPDATE "RevisionItem"
      SET "collectionId" = $2, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "userId" = $1
        AND "id" = ANY($3::text[])
    `,
    userId,
    collection.id,
    decoded.itemIds
  );

  const updatedCollection = await getOwnedRevisionCollection(userId, collection.id);
  const updatedItems = await fetchCollectionItems(userId, collection.id);
  if (!updatedCollection) return null;
  return { collection: updatedCollection, items: updatedItems };
}

export async function generateRevisionAudioRecap(args: {
  userId: string;
  sourceType: 'collection' | 'item' | 'queue';
  collectionId?: string;
  itemId?: string;
}): Promise<RevisionAudioRecapResult> {
  let items: RevisionItem[] = [];
  if (args.sourceType === 'item' && args.itemId) {
    const item = await getOwnedRevisionItem(args.userId, args.itemId);
    items = item ? [item] : [];
  } else if (args.sourceType === 'collection' && args.collectionId) {
    items = await fetchCollectionItems(args.userId, args.collectionId);
  } else {
    const queue = await getRevisionQueue(args.userId, 4);
    items = [...queue.dueNow, ...queue.needsAttention].slice(0, 4);
  }

  const lines = items.slice(0, 5).map((item) => {
    const lead = item.contentType === 'formula' ? 'Formula' : item.contentType === 'definition' ? 'Definition' : 'Key idea';
    return `${lead}: ${limitText(item.summary || item.title, 120)}`;
  });
  return {
    recapText:
      lines.length > 0
        ? `Here is your short revision recap. ${lines.join(' ')}`
        : 'Here is your short revision recap. Start with the saved idea that still feels least clear, then explain it in your own words.',
    fallbackToText: true,
  };
}

export async function startRevisionMode(args: RevisionModeStartArgs): Promise<{
  sessionId: string;
  message: Message;
  items: RevisionItem[];
  sourceType: 'collection' | 'items' | 'queue' | 'due' | 'weak';
} | null> {
  await ensureLearningTables();
  let items: RevisionItem[] = [];
  if (args.sourceType === 'collection' && args.collectionId) {
    items = await fetchCollectionItems(args.userId, args.collectionId);
  } else if (args.sourceType === 'items' && Array.isArray(args.itemIds) && args.itemIds.length > 0) {
    const rows = await prisma.$queryRawUnsafe<any[]>(
      `
        SELECT i.*, c."title" AS "collectionTitle"
        FROM "RevisionItem" i
        LEFT JOIN "RevisionCollection" c ON c."id" = i."collectionId"
        WHERE i."userId" = $1
          AND i."id" = ANY($2::text[])
        ORDER BY i."updatedAt" DESC
      `,
      args.userId,
      args.itemIds
    );
    items = rows.map(mapRevisionItemRow);
  } else {
    const queue = await getRevisionQueue(args.userId, 5);
    items =
      args.sourceType === 'due'
        ? queue.dueNow
        : [...queue.needsAttention, ...queue.dueNow, ...queue.continuePractising].slice(0, 5);
  }
  if (args.examFocus) {
    items = items
      .sort((a, b) => Number(b.examPriority || b.isMistakeBased || b.isPinned) - Number(a.examPriority || a.isMistakeBased || a.isPinned))
      .slice(0, 5);
  }
  if (items.length === 0) return null;

  const baseItem = items[0];
  const sessionId = await ensureRevisionSession(args.userId, baseItem, baseItem.topic || baseItem.title);
  const emphasis = args.examFocus
    ? 'We will focus on the exam-priority points first, especially the mistakes and high-value facts.'
    : 'We will start with the parts that still need practice, then build up from there.';
  const message = await appendAssistantMessage(
    sessionId,
    `Let's revise ${baseItem.topic || baseItem.title} together. ${emphasis} Start by telling me what you remember before I add anything new.`,
    {
      tutorUi: {
        actionId: 'practice',
        statusLine: args.examFocus ? 'Prepared an exam-focused revision session.' : 'Prepared a guided revision session.',
        nextStep: 'Start with what you remember most clearly.',
      },
      presentation: {
        cardKind: 'guided_step',
        nextStepPrompt: 'Answer from memory first, then we will build from there.',
        suggestedActions: ['hint', 'breakdown', 'practice'],
        awaitingStudentAttempt: true,
        uiTone: 'calm',
      },
      revisionMode: {
        sourceType: args.sourceType,
        itemIds: items.map((item) => item.id),
        examFocus: Boolean(args.examFocus),
      },
    }
  );
  return { sessionId, message, items, sourceType: args.sourceType };
}

export async function startGuidedRevisionSession(
  args: GuidedRevisionSessionStartArgs
): Promise<GuidedRevisionSessionStartResult | null> {
  await ensureLearningTables();

  let item: RevisionItem | null = null;
  if ((args.sourceType || 'item') === 'item' && safeString(args.itemId).trim()) {
    item = await getOwnedRevisionItem(args.userId, safeString(args.itemId).trim());
  } else if ((args.sourceType || 'item') === 'collection' && safeString(args.collectionId).trim()) {
    const items = await fetchCollectionItems(args.userId, safeString(args.collectionId).trim());
    item = items[0] || null;
  } else {
    const queue = await getRevisionQueue(args.userId, 1);
    item = queue.needsAttention[0] || queue.dueNow[0] || queue.continuePractising[0] || null;
  }
  if (!item) return null;

  const sessionId = randomUUID();
  const blueprint = buildGuidedRevisionBlueprint(item);
  const topic = safeString(item.topic || item.title).trim() || item.title;
  const subject = safeString(item.subject).trim() || null;

  const learnerLoopState = await buildLearnerLoopState({
    userId: args.userId,
    topic,
    subject,
    isRevision: true,
    awaitingStudentAttempt: true,
    afterMistake: false,
    afterSuccess: false,
  });
  const masteryLabel = learnerLoopState.topicMastery?.label || item.mastery || null;

  await recordRevisionReviewEvent({
    userId: args.userId,
    itemId: item.id,
    sessionId,
    eventType: 'review_started',
    metadata: {
      mode: 'guided_revision',
      stage: 'recall',
      sourceType: args.sourceType || 'item',
      examFocus: Boolean(args.examFocus),
    },
  });

  if (masteryLabel && masteryLabel !== item.mastery) {
    await updateRevisionItem({
      userId: args.userId,
      itemId: item.id,
      patch: { mastery: masteryLabel },
    });
  }

  return {
    sessionId,
    item,
    orientationLine: blueprint.orientationLine,
    itemTypeLabel: blueprint.itemTypeLabel,
    masteryLabel,
    supportActions: ['hint', 'explain_again', 'break_down', 'compare', 'mark_for_later'],
    currentStep: buildGuidedStepFromBlueprint('recall', blueprint) as GuidedRevisionSessionStep,
    weakTopicRecovery: learnerLoopState.weakTopicRecovery,
  };
}

export async function continueGuidedRevisionSession(
  args: GuidedRevisionSessionProgressArgs
): Promise<GuidedRevisionSessionProgressResult | null> {
  await ensureLearningTables();
  const item = await getOwnedRevisionItem(args.userId, args.itemId);
  if (!item) return null;

  const blueprint = buildGuidedRevisionBlueprint(item);
  const validStages: GuidedRevisionSessionStage[] = ['recall', 'quick_check', 'similar', 'wrap', 'completed'];
  const stage = validStages.includes(args.stage) ? args.stage : 'recall';
  if (stage === 'completed') {
    return {
      sessionId: args.sessionId,
      itemId: item.id,
      stage: 'completed',
      feedbackText: 'This revision session is already complete. Choose another item when you are ready.',
      currentStep: null,
      masteryLabel: item.mastery || null,
      progressSummary: 'Session completed.',
      nextMoveText: 'Open another saved item or run one short practice.',
      saveSuggestion: 'Save one short reminder if you want to revisit this later.',
    };
  }

  const topic = safeString(item.topic || item.title).trim() || item.title;
  const subject = safeString(item.subject).trim() || null;
  const responseText = safeString(args.responseText).trim();

  if (args.supportAction) {
    const supportFeedback = blueprint.supportResponses[args.supportAction] || blueprint.supportResponses.hint;
    if (args.supportAction === 'mark_for_later') {
      await updateRevisionItem({
        userId: args.userId,
        itemId: item.id,
        patch: { needsPractice: true },
      }).catch(() => undefined);
      await recordRevisionReviewEvent({
        userId: args.userId,
        itemId: item.id,
        sessionId: args.sessionId,
        eventType: 'note_updated',
        outcome: 'completed',
        metadata: {
          mode: 'guided_revision',
          supportAction: args.supportAction,
          stage,
        },
      });
    }
    const learnerLoopState = await buildLearnerLoopState({
      userId: args.userId,
      topic,
      subject,
      isRevision: true,
      awaitingStudentAttempt: true,
      afterMistake: args.supportAction === 'mark_for_later',
      afterSuccess: false,
      userText: responseText || undefined,
    });
    return {
      sessionId: args.sessionId,
      itemId: item.id,
      stage,
      feedbackText: supportFeedback,
      currentStep: buildGuidedStepFromBlueprint(stage, blueprint),
      masteryLabel: learnerLoopState.topicMastery?.label || item.mastery || null,
      weakTopicRecovery: learnerLoopState.weakTopicRecovery,
      progressSummary: args.supportAction === 'mark_for_later'
        ? 'Marked for another revision pass.'
        : 'Support adjusted. Continue when ready.',
      nextMoveText: 'Answer the current step in one short response.',
      saveSuggestion: null,
    };
  }

  const anchors = extractItemAnchors(item);
  const quality: GuidedResponseQuality =
    stage === 'wrap' && !responseText
      ? 'partial'
      : evaluateGuidedResponse(responseText, anchors);
  const nextStage = nextGuidedStage(stage);
  const outcomeByQuality: Record<GuidedResponseQuality, RevisionEventOutcome> = {
    strong: 'correct',
    partial: 'partial',
    struggling: 'struggled',
  };

  let evidenceType:
    | 'attempted_after_prompt'
    | 'correct_after_support'
    | 'repeated_mistake'
    | 'repeated_mistake_reduced'
    | 'similar_problem_success'
    | 'explain_back_success'
    | 'revision_reuse_success'
    | 'needed_multiple_hints'
    | 'support_strategy_helped'
    | 'support_strategy_failed' = 'attempted_after_prompt';
  if (stage === 'recall') {
    evidenceType =
      quality === 'strong'
        ? 'explain_back_success'
        : quality === 'partial'
          ? 'attempted_after_prompt'
          : 'needed_multiple_hints';
  } else if (stage === 'quick_check') {
    evidenceType =
      quality === 'strong'
        ? 'correct_after_support'
        : quality === 'partial'
          ? 'support_strategy_helped'
          : 'repeated_mistake';
  } else if (stage === 'similar') {
    evidenceType =
      quality === 'strong'
        ? 'similar_problem_success'
        : quality === 'partial'
          ? 'attempted_after_prompt'
          : 'support_strategy_failed';
  } else if (stage === 'wrap') {
    evidenceType =
      quality === 'strong'
        ? 'revision_reuse_success'
        : quality === 'partial'
          ? 'support_strategy_helped'
          : 'support_strategy_failed';
  }

  const masteryState = await recordMasteryEvidenceSignal({
    userId: args.userId,
    signal: {
      topic,
      subject,
      evidenceType,
    },
    metadata: {
      mode: 'guided_revision',
      stage,
      quality,
      responseText: responseText || null,
      itemId: item.id,
    },
  }).catch(() => null);

  const masteryLabel = masteryState?.label || item.mastery || null;
  if (masteryLabel && masteryLabel !== item.mastery) {
    await updateRevisionItem({
      userId: args.userId,
      itemId: item.id,
      patch: { mastery: masteryLabel },
    }).catch(() => undefined);
  }
  if (quality === 'struggling') {
    await updateRevisionItem({
      userId: args.userId,
      itemId: item.id,
      patch: { needsPractice: true },
    }).catch(() => undefined);
  }

  await recordRevisionReviewEvent({
    userId: args.userId,
    itemId: item.id,
    sessionId: args.sessionId,
    eventType:
      stage === 'similar'
        ? 'similar_question_practised'
        : nextStage === 'completed'
          ? 'review_completed'
          : 'quiz_answered',
    outcome: outcomeByQuality[quality],
    metadata: {
      mode: 'guided_revision',
      stage,
      nextStage,
      quality,
    },
  });

  const learnerLoopState = await buildLearnerLoopState({
    userId: args.userId,
    userText: responseText || undefined,
    topic,
    subject,
    isRevision: true,
    awaitingStudentAttempt: nextStage !== 'completed',
    afterMistake: quality === 'struggling',
    afterSuccess: quality === 'strong',
  });

  const nextStep = buildGuidedStepFromBlueprint(nextStage, blueprint);
  return {
    sessionId: args.sessionId,
    itemId: item.id,
    stage: nextStage,
    feedbackText: feedbackForStage({ stage, quality }),
    currentStep: nextStep,
    masteryLabel: learnerLoopState.topicMastery?.label || masteryLabel,
    weakTopicRecovery: learnerLoopState.weakTopicRecovery,
    progressSummary: progressionSummaryForQuality(quality),
    nextMoveText:
      nextStage === 'completed'
        ? 'Choose one next item to keep revision momentum.'
        : nextStep?.helperText || 'Continue to the next guided step.',
    saveSuggestion:
      nextStage === 'wrap' || nextStage === 'completed'
        ? 'Save one short reminder if this correction helped.'
        : null,
  };
}

export async function buildExtendedRevisionOverview(userId: string, baseOverview: RevisionOverview): Promise<RevisionOverview> {
  const [queue, progress, items] = await Promise.all([
    getRevisionQueue(userId, 4),
    getRevisionProgressOverview(userId),
    fetchUserRevisionItems(userId, 80),
  ]);
  return {
    ...baseOverview,
    pinnedItems: items.filter((item) => item.isPinned).slice(0, 6),
    mistakeItems: items.filter((item) => item.isMistakeBased).slice(0, 6),
    needsPracticeItems: items.filter((item) => item.needsPractice).slice(0, 6),
    queuePreview: queue,
    totalDueCount: progress.totalDueCount,
    totalNeedsAttentionCount: progress.totalNeedsAttentionCount,
    totalNewCount: progress.totalNewCount,
  };
}
