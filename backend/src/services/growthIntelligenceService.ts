import { randomUUID } from 'crypto';
import prisma from '../utils/prismaClient';
import type {
  LearningEffectEvent,
  RevisionItem,
  RevisionMastery,
  StudyGoal,
  StudyPlan,
  WeakTopicSignal,
} from '../lib/types';
import { fetchUserRevisionItems, getRevisionQueue } from './revisionLearningService';
import { listMediaAssets, type MediaAsset } from './mediaAssetService';
import { getStudyGoals, getStudyPlans, getWeakTopics } from './studySupportService';
import { listLearningEffectEvents } from './learningEffectivenessService';
import { getRedisClient } from '../lib/redis';

type GrowthWeakTopicStatus = 'active' | 'improving' | 'stable' | 'recovered';
type GrowthMistakePatternStatus = 'active' | 'improving' | 'resolved_recently';
type GrowthTrendStatus = 'improving' | 'stable' | 'fragile' | 'needs_support' | 'plateauing' | 'recovering';
type GrowthRecommendationType =
  | 'due_revision'
  | 'weak_topic_rescue'
  | 'mistake_pattern_repair'
  | 'continue_study_plan'
  | 'saved_recap_replay'
  | 'struggle_revisit';
type GrowthActionType =
  | 'open_revision'
  | 'review_recap'
  | 'quiz_me'
  | 'practice_now'
  | 'continue_study_plan'
  | 'rescue_weak_topic'
  | 'open_related_media'
  | 'save_reminder'
  | 'start_guided_study';
type GrowthActionDestination = 'revision' | 'media' | 'study_plan' | 'growth' | 'new_session';

type GrowthAction = {
  actionType: GrowthActionType;
  label: string;
  destination: GrowthActionDestination;
  targetId?: string | null;
  topic?: string | null;
  subject?: string | null;
  context?: Record<string, unknown> | null;
};

export type GrowthRecommendation = {
  id: string;
  userId: string;
  type: GrowthRecommendationType;
  priorityScore: number;
  sourceType: string;
  title: string;
  reason: string;
  primaryAction: GrowthAction;
  secondaryAction?: GrowthAction | null;
  linkedTopic?: string | null;
  linkedRevisionId?: string | null;
  linkedMediaId?: string | null;
  expiresAt?: string | null;
  createdAt: string;
};

export type GrowthWeakTopic = {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  subtopic?: string | null;
  weaknessScore: number;
  microMasteryLabel: RevisionMastery;
  status: GrowthWeakTopicStatus;
  weaknessReasonSummary: string;
  triggers: string[];
  lastStruggledAt?: string | null;
  lastReviewedAt?: string | null;
  nextReviewAt?: string | null;
  linkedRevisionIds: string[];
  linkedMediaIds: string[];
  linkedMistakePatternIds: string[];
  recommendedAction: string;
  createdAt: string;
  updatedAt: string;
};

export type GrowthMistakePattern = {
  id: string;
  userId: string;
  subject: string;
  patternKey: string;
  title: string;
  description: string;
  examples: string[];
  recurrenceScore: number;
  status: GrowthMistakePatternStatus;
  commonContext: string;
  fixReminder: string;
  linkedTopics: string[];
  linkedRevisionIds: string[];
  lastSeenAt?: string | null;
  lastImprovedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type GrowthMasterySignal = {
  id: string;
  userId: string;
  subject: string;
  topic: string;
  subtopic?: string | null;
  signalType: string;
  confidenceScore: number;
  evidenceScore: number;
  sourceType: string;
  outcome?: string | null;
  createdAt: string;
};

export type GrowthOverviewResponse = {
  generatedAt: string;
  recommendedNextMove: GrowthRecommendation | null;
  dueNowQueue: GrowthRecommendation[];
  recentlyImproved: Array<{
    id: string;
    title: string;
    summary: string;
    topic?: string | null;
    subject?: string | null;
    evidence: string[];
    createdAt: string;
  }>;
  weakPatternSpotlight: GrowthMistakePattern[];
  supportPatterns: Array<{
    id: string;
    title: string;
    reason: string;
    confidence: number;
    evidence: string[];
  }>;
  metrics: {
    dueNowCount: number;
    weakTopicCount: number;
    activeMistakePatternCount: number;
    improvingCount: number;
    plansInProgressCount: number;
    masteryCoveragePercent: number;
  };
};

export type GrowthWeakTopicsResponse = {
  generatedAt: string;
  items: GrowthWeakTopic[];
  groups: {
    needsRescueNow: string[];
    stillUnstable: string[];
    improvingSlowly: string[];
    recentlyStabilized: string[];
  };
};

export type GrowthMistakeJournalResponse = {
  generatedAt: string;
  patterns: GrowthMistakePattern[];
  groups: {
    active: string[];
    improving: string[];
    resolvedRecently: string[];
  };
};

export type GrowthStudyPlanView = {
  id: string;
  userId: string;
  title: string;
  goal: string;
  subject?: string | null;
  targetTopics: string[];
  status: 'suggested' | 'active' | 'paused' | 'completed' | 'stale';
  milestoneIndex: number;
  milestones: Array<{
    id: string;
    title: string;
    status: string;
    dueAt?: string | null;
  }>;
  nextAction: string;
  progressSummary: string;
  createdAt: string;
  updatedAt: string;
  linkedPlan: StudyPlan;
};

export type GrowthStudyPlansResponse = {
  generatedAt: string;
  plans: GrowthStudyPlanView[];
  recommendations: GrowthRecommendation[];
};

export type GrowthMasteryTrendsResponse = {
  generatedAt: string;
  overall: {
    status: GrowthTrendStatus;
    summary: string;
    confidence: number;
  };
  subjectTrends: Array<{
    subject: string;
    status: GrowthTrendStatus;
    masteryScore: number;
    evidenceCount: number;
    topicCount: number;
    summary: string;
    delta: number;
  }>;
  topicTrends: Array<{
    topic: string;
    subject: string;
    subtopic?: string | null;
    status: GrowthTrendStatus;
    microMasteryLabel: RevisionMastery;
    confidenceScore: number;
    evidenceScore: number;
    summary: string;
    lastSeenAt?: string | null;
  }>;
  masterySignals: GrowthMasterySignal[];
};

type GrowthSignalSnapshot = {
  generatedAt: string;
  revisionItems: RevisionItem[];
  queue: Awaited<ReturnType<typeof getRevisionQueue>>;
  weakSignals: WeakTopicSignal[];
  studyPlans: StudyPlan[];
  studyGoals: StudyGoal[];
  learningEvents: LearningEffectEvent[];
  mediaAssets: MediaAsset[];
  progressRows: Array<{ subject: string; topic: string; mastery: number; updatedAt: string }>;
  mistakeRows: Array<{ topic: string; error: string; attempts: number; lastSeen: string }>;
};

const CACHE_TTL_MS = 20_000;
const snapshotCache = new Map<string, { expiresAt: number; payload: Promise<GrowthSignalSnapshot> }>();
const GROWTH_REDIS_KEY_PREFIX = 'growth:snapshot:v1';
const PERSIST_ENTITY_INTERVAL_MS = 60_000;
const persistTracker = new Map<string, number>();
let ensureGrowthIntelligenceTablesPromise: Promise<void> | null = null;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeKey(value: string): string {
  return safeString(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function toIso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  const text = safeString(value).trim();
  if (!text) return null;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function nowIso(): string {
  return new Date().toISOString();
}

function daysBetween(from?: string | null, to: Date = new Date()): number {
  if (!from) return 999;
  const date = new Date(from);
  if (Number.isNaN(date.getTime())) return 999;
  return Math.max(0, Math.floor((to.getTime() - date.getTime()) / (24 * 60 * 60 * 1000)));
}

function toDateKey(value: Date = new Date()): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function shouldPersistEntities(cacheKey: string): boolean {
  const last = persistTracker.get(cacheKey) || 0;
  if (Date.now() - last < PERSIST_ENTITY_INTERVAL_MS) return false;
  persistTracker.set(cacheKey, Date.now());
  return true;
}

function topicFromRevisionItem(item: RevisionItem): string {
  return safeString(item.topic || item.subtopic || item.title).trim() || 'General';
}

function subjectFromRevisionItem(item: RevisionItem): string {
  return safeString(item.subject).trim() || 'General';
}

function masteryToScore(label?: RevisionMastery | null): number {
  if (label === 'confident') return 90;
  if (label === 'almost_there') return 73;
  if (label === 'getting_better') return 52;
  return 32;
}

function scoreToMasteryLabel(score: number): RevisionMastery {
  if (score >= 82) return 'confident';
  if (score >= 66) return 'almost_there';
  if (score >= 45) return 'getting_better';
  return 'still_learning';
}

function inferTrendStatus(args: {
  masteryScore: number;
  delta: number;
  evidenceCount: number;
  weakSignals: number;
}): GrowthTrendStatus {
  if (args.masteryScore < 42 && args.delta <= -2) return 'needs_support';
  if (args.delta >= 6) return args.weakSignals > 0 ? 'recovering' : 'improving';
  if (args.delta <= -6) return args.masteryScore < 55 ? 'fragile' : 'needs_support';
  if (Math.abs(args.delta) <= 2 && args.evidenceCount >= 6) return 'plateauing';
  return 'stable';
}

function deriveWeakTopicRecommendedAction(topic: string, subject: string): string {
  const normalizedSubject = normalizeKey(subject);
  const normalizedTopic = normalizeKey(topic);
  if (normalizedSubject.includes('math') || normalizedTopic.includes('equation')) {
    return 'Rebuild one step at a time, then solve one similar question without skipping justification.';
  }
  if (normalizedSubject.includes('biology') || normalizedSubject.includes('physics') || normalizedSubject.includes('chemistry')) {
    return 'Restate the concept in simple words, then connect it to one worked example.';
  }
  if (normalizedSubject.includes('english') || normalizedSubject.includes('language')) {
    return 'Explain the idea in one sentence, then test it with one short prompt.';
  }
  return 'Start with a short recap, then do one low-pressure retrieval check.';
}

function createPrimaryAction(args: {
  actionType: GrowthActionType;
  label: string;
  destination: GrowthActionDestination;
  targetId?: string | null;
  topic?: string | null;
  subject?: string | null;
  context?: Record<string, unknown> | null;
}): GrowthAction {
  return {
    actionType: args.actionType,
    label: args.label,
    destination: args.destination,
    targetId: args.targetId || null,
    topic: args.topic || null,
    subject: args.subject || null,
    context: args.context || null,
  };
}

async function ensureGrowthIntelligenceTables() {
  if (!ensureGrowthIntelligenceTablesPromise) {
    ensureGrowthIntelligenceTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GrowthWeakTopicState" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "topic" TEXT NOT NULL,
          "subtopic" TEXT NULL,
          "weaknessScore" DOUBLE PRECISION NOT NULL,
          "microMasteryLabel" TEXT NOT NULL,
          "status" TEXT NOT NULL,
          "weaknessReasonSummary" TEXT NOT NULL,
          "triggers" JSONB NULL,
          "lastStruggledAt" TIMESTAMP(3) NULL,
          "lastReviewedAt" TIMESTAMP(3) NULL,
          "nextReviewAt" TIMESTAMP(3) NULL,
          "linkedRevisionIds" JSONB NULL,
          "linkedMediaIds" JSONB NULL,
          "linkedMistakePatternIds" JSONB NULL,
          "recommendedAction" TEXT NOT NULL,
          "snapshotDate" DATE NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "GrowthWeakTopicState_userId_subject_topic_snapshotDate_uidx" ON "GrowthWeakTopicState" ("userId", "subject", "topic", "snapshotDate");`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "GrowthWeakTopicState_userId_snapshotDate_idx" ON "GrowthWeakTopicState" ("userId", "snapshotDate" DESC);`
      );
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GrowthMistakePatternState" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "patternKey" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "examples" JSONB NULL,
          "recurrenceScore" DOUBLE PRECISION NOT NULL,
          "status" TEXT NOT NULL,
          "commonContext" TEXT NOT NULL,
          "fixReminder" TEXT NOT NULL,
          "linkedTopics" JSONB NULL,
          "linkedRevisionIds" JSONB NULL,
          "lastSeenAt" TIMESTAMP(3) NULL,
          "lastImprovedAt" TIMESTAMP(3) NULL,
          "snapshotDate" DATE NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "GrowthMistakePatternState_userId_patternKey_snapshotDate_uidx" ON "GrowthMistakePatternState" ("userId", "patternKey", "snapshotDate");`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "GrowthMistakePatternState_userId_snapshotDate_idx" ON "GrowthMistakePatternState" ("userId", "snapshotDate" DESC);`
      );
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GrowthMasteryTrendState" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "subject" TEXT NOT NULL,
          "topic" TEXT NOT NULL,
          "subtopic" TEXT NULL,
          "trendStatus" TEXT NOT NULL,
          "microMasteryLabel" TEXT NOT NULL,
          "confidenceScore" DOUBLE PRECISION NOT NULL,
          "evidenceScore" DOUBLE PRECISION NOT NULL,
          "trendSummary" TEXT NOT NULL,
          "delta" DOUBLE PRECISION NULL,
          "lastSeenAt" TIMESTAMP(3) NULL,
          "snapshotDate" DATE NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "GrowthMasteryTrendState_userId_subject_topic_snapshotDate_uidx" ON "GrowthMasteryTrendState" ("userId", "subject", "topic", "snapshotDate");`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "GrowthMasteryTrendState_userId_snapshotDate_idx" ON "GrowthMasteryTrendState" ("userId", "snapshotDate" DESC);`
      );
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "GrowthRecommendationState" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "recommendationType" TEXT NOT NULL,
          "priorityScore" DOUBLE PRECISION NOT NULL,
          "sourceType" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "reason" TEXT NOT NULL,
          "primaryAction" JSONB NOT NULL,
          "secondaryAction" JSONB NULL,
          "linkedTopic" TEXT NULL,
          "linkedRevisionId" TEXT NULL,
          "linkedMediaId" TEXT NULL,
          "expiresAt" TIMESTAMP(3) NULL,
          "snapshotDate" DATE NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "GrowthRecommendationState_userId_snapshotDate_idx" ON "GrowthRecommendationState" ("userId", "snapshotDate" DESC);`
      );
    })().catch((error) => {
      ensureGrowthIntelligenceTablesPromise = null;
      throw error;
    });
  }
  return ensureGrowthIntelligenceTablesPromise;
}

async function readSnapshotFromRedis(cacheKey: string): Promise<GrowthSignalSnapshot | null> {
  const redis = await getRedisClient().catch(() => null);
  if (!redis) return null;
  try {
    const raw = await redis.get(`${GROWTH_REDIS_KEY_PREFIX}:${cacheKey}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GrowthSignalSnapshot;
    if (!parsed || typeof parsed !== 'object' || !safeString((parsed as any).generatedAt)) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function writeSnapshotToRedis(cacheKey: string, payload: GrowthSignalSnapshot): Promise<void> {
  const redis = await getRedisClient().catch(() => null);
  if (!redis) return;
  try {
    await redis.set(`${GROWTH_REDIS_KEY_PREFIX}:${cacheKey}`, JSON.stringify(payload), {
      EX: Math.max(8, Math.round(CACHE_TTL_MS / 1000)),
    });
  } catch {
    // keep request path resilient when redis is degraded
  }
}

async function buildGrowthSignalSnapshot(userId: string, subject?: string | null): Promise<GrowthSignalSnapshot> {
  const subjectFilter = normalizeKey(subject || '');
  const [revisionItemsRaw, queueRaw, weakSignalsRaw, studyPlans, studyGoals, learningEvents, mediaAssets, progressRowsRaw, mistakeRowsRaw] =
    await Promise.all([
      fetchUserRevisionItems(userId, 260),
      getRevisionQueue(userId, 36),
      getWeakTopics(userId, subject || undefined),
      getStudyPlans(userId),
      getStudyGoals(userId),
      listLearningEffectEvents({ userId, days: 45, limit: 800 }).catch(() => []),
      listMediaAssets({ userId, limit: 48, sortBy: 'recommended' }).catch(() => []),
      prisma.progress.findMany({
        where: { studentId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 220,
      }),
      prisma.mistake.findMany({
        where: { studentId: userId },
        orderBy: { lastSeen: 'desc' },
        take: 220,
      }),
    ]);

  const revisionItems = subjectFilter
    ? revisionItemsRaw.filter((item) => normalizeKey(subjectFromRevisionItem(item)) === subjectFilter)
    : revisionItemsRaw;
  const queue = subjectFilter
    ? {
        dueNow: queueRaw.dueNow.filter((item) => normalizeKey(subjectFromRevisionItem(item)) === subjectFilter),
        needsAttention: queueRaw.needsAttention.filter((item) => normalizeKey(subjectFromRevisionItem(item)) === subjectFilter),
        continuePractising: queueRaw.continuePractising.filter((item) => normalizeKey(subjectFromRevisionItem(item)) === subjectFilter),
        newItems: queueRaw.newItems.filter((item) => normalizeKey(subjectFromRevisionItem(item)) === subjectFilter),
        recentlyImproved: queueRaw.recentlyImproved.filter((item) => normalizeKey(subjectFromRevisionItem(item)) === subjectFilter),
      }
    : queueRaw;
  const weakSignals = subjectFilter
    ? weakSignalsRaw.filter((entry) => normalizeKey(safeString(entry.subject)) === subjectFilter)
    : weakSignalsRaw;
  const mediaAssetsFiltered = subjectFilter
    ? mediaAssets.filter((asset) => normalizeKey(safeString(asset.subject)) === subjectFilter)
    : mediaAssets;
  const progressRows = progressRowsRaw
    .filter((row) => !subjectFilter || normalizeKey(safeString(row.subject)) === subjectFilter)
    .map((row) => ({
      subject: safeString(row.subject).trim() || 'General',
      topic: safeString(row.topic).trim() || 'General',
      mastery: clamp(Number(row.mastery || 0), 0, 100),
      updatedAt: row.updatedAt.toISOString(),
    }));
  const mistakeRows = mistakeRowsRaw.map((row) => ({
    topic: safeString(row.topic).trim() || 'General',
    error: safeString(row.error).trim() || 'Repeated misconception',
    attempts: Math.max(1, Number(row.attempts || 1)),
    lastSeen: row.lastSeen.toISOString(),
  }));

  return {
    generatedAt: nowIso(),
    revisionItems,
    queue,
    weakSignals,
    studyPlans,
    studyGoals,
    learningEvents,
    mediaAssets: mediaAssetsFiltered,
    progressRows,
    mistakeRows,
  };
}

async function getCachedSnapshot(userId: string, subject?: string | null): Promise<GrowthSignalSnapshot> {
  const cacheKey = `${userId}:${normalizeKey(subject || '')}`;
  const cached = snapshotCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.payload;
  }
  const redisSnapshot = await readSnapshotFromRedis(cacheKey);
  if (redisSnapshot) {
    snapshotCache.set(cacheKey, { payload: Promise.resolve(redisSnapshot), expiresAt: Date.now() + CACHE_TTL_MS });
    return redisSnapshot;
  }

  const payload = buildGrowthSignalSnapshot(userId, subject).then(async (result) => {
    await writeSnapshotToRedis(cacheKey, result);
    return result;
  });
  snapshotCache.set(cacheKey, { payload, expiresAt: Date.now() + CACHE_TTL_MS });
  try {
    return await payload;
  } catch (error) {
    snapshotCache.delete(cacheKey);
    throw error;
  }
}

function createCompactId(value: string): string {
  const normalized = normalizeKey(value).replace(/\s+/g, '-');
  return normalized.slice(0, 44) || randomUUID().slice(0, 8);
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const normalized = normalizeKey(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(value.trim());
  }
  return out;
}

function categorizeMistake(errorText: string, topic: string): string {
  const text = normalizeKey(`${errorText} ${topic}`);
  if (/(sign|positive|negative|\+|-)/.test(text)) return 'sign_handling';
  if (/(unit|dimension|cm|kg|m\/s|meter|gram)/.test(text)) return 'unit_usage';
  if (/(graph|plot|axis|slope)/.test(text)) return 'graph_interpretation';
  if (/(definition|meaning|term|concept)/.test(text)) return 'definition_clarity';
  if (/(formula|equation|substitute|rearrange)/.test(text)) return 'formula_application';
  if (/(language|grammar|tense|comprehension)/.test(text)) return 'language_structure';
  return 'concept_application';
}

function patternReminder(category: string): string {
  if (category === 'sign_handling') return 'Pause on sign changes and verify each operation before moving forward.';
  if (category === 'unit_usage') return 'Write units for each step, then check if final units match the question.';
  if (category === 'graph_interpretation') return 'Name axes first, then read values before inferring the conclusion.';
  if (category === 'definition_clarity') return 'Restate the definition in your own words before applying it.';
  if (category === 'formula_application') return 'Identify what is known, then substitute slowly with one check line.';
  if (category === 'language_structure') return 'Break the sentence into smaller parts and identify the role of each part.';
  return 'Explain the concept in one sentence, then test it with one small variant.';
}

function buildMistakePatterns(snapshot: GrowthSignalSnapshot): GrowthMistakePattern[] {
  const now = new Date();
  const grouped = new Map<
    string,
    {
      subject: string;
      topic: string;
      category: string;
      examples: string[];
      linkedRevisionIds: Set<string>;
      recurrence: number;
      lastSeenAt: string | null;
      improvements: number;
      lastImprovedAt: string | null;
    }
  >();

  for (const mistake of snapshot.mistakeRows) {
    const category = categorizeMistake(mistake.error, mistake.topic);
    const topic = safeString(mistake.topic).trim() || 'General';
    const relatedRevision = snapshot.revisionItems.find(
      (item) => normalizeKey(topicFromRevisionItem(item)) === normalizeKey(topic)
    );
    const subject = safeString(relatedRevision?.subject).trim() || 'General';
    const key = `${normalizeKey(subject)}::${normalizeKey(topic)}::${category}`;
    const entry = grouped.get(key) || {
      subject,
      topic,
      category,
      examples: [],
      linkedRevisionIds: new Set<string>(),
      recurrence: 0,
      lastSeenAt: null as string | null,
      improvements: 0,
      lastImprovedAt: null as string | null,
    };
    entry.recurrence += Math.max(1, mistake.attempts);
    entry.examples.push(mistake.error);
    if (relatedRevision?.id) entry.linkedRevisionIds.add(relatedRevision.id);
    if (!entry.lastSeenAt || new Date(mistake.lastSeen).getTime() > new Date(entry.lastSeenAt).getTime()) {
      entry.lastSeenAt = mistake.lastSeen;
    }
    grouped.set(key, entry);
  }

  for (const item of snapshot.revisionItems) {
    if (!item.isMistakeBased && item.recentOutcome !== 'struggled' && item.reviewStatus !== 'needs_attention') continue;
    const topic = topicFromRevisionItem(item);
    const subject = subjectFromRevisionItem(item);
    const category = categorizeMistake(safeString(item.summary), topic);
    const key = `${normalizeKey(subject)}::${normalizeKey(topic)}::${category}`;
    const entry = grouped.get(key) || {
      subject,
      topic,
      category,
      examples: [],
      linkedRevisionIds: new Set<string>(),
      recurrence: 0,
      lastSeenAt: null as string | null,
      improvements: 0,
      lastImprovedAt: null as string | null,
    };
    entry.recurrence += 1 + Math.max(0, Number(item.struggleCount || 0));
    if (item.id) entry.linkedRevisionIds.add(item.id);
    if (item.summary) entry.examples.push(item.summary);
    if (item.updatedAt && (!entry.lastSeenAt || new Date(item.updatedAt).getTime() > new Date(entry.lastSeenAt).getTime())) {
      entry.lastSeenAt = item.updatedAt;
    }
    grouped.set(key, entry);
  }

  for (const event of snapshot.learningEvents) {
    const topic = safeString(event.topic).trim();
    if (!topic) continue;
    const eventType = normalizeKey(event.eventType);
    if (!eventType.includes('mistake') && !eventType.includes('improvement')) continue;
    for (const [key, entry] of grouped.entries()) {
      if (!key.includes(normalizeKey(topic))) continue;
      if (eventType.includes('reduction') || eventType.includes('improvement')) {
        entry.improvements += 1;
        const createdAt = toIso(event.createdAt);
        if (createdAt && (!entry.lastImprovedAt || new Date(createdAt).getTime() > new Date(entry.lastImprovedAt).getTime())) {
          entry.lastImprovedAt = createdAt;
        }
      }
    }
  }

  return [...grouped.entries()]
    .map(([patternKey, entry]) => {
      const recurrenceScore = clamp(entry.recurrence * 8 - entry.improvements * 5, 6, 100);
      const lastSeenDays = daysBetween(entry.lastSeenAt, now);
      const status: GrowthMistakePatternStatus =
        recurrenceScore >= 58 && lastSeenDays <= 21
          ? 'active'
          : entry.improvements >= 2 && recurrenceScore < 70
            ? 'improving'
            : 'resolved_recently';
      const title = `${entry.topic}: ${entry.category.replace(/_/g, ' ')}`;
      const description =
        status === 'active'
          ? 'This pattern keeps returning across sessions and needs a targeted repair loop.'
          : status === 'improving'
            ? 'This pattern is reducing, but still appears enough to need reinforcement.'
            : 'This pattern has settled recently. Keep one light reminder to prevent relapse.';
      return {
        id: `mistake-${createCompactId(patternKey)}`,
        userId: '',
        subject: entry.subject,
        patternKey,
        title,
        description,
        examples: dedupe(entry.examples).slice(0, 4),
        recurrenceScore: Number(recurrenceScore.toFixed(1)),
        status,
        commonContext: `${entry.subject} -> ${entry.topic}`,
        fixReminder: patternReminder(entry.category),
        linkedTopics: [entry.topic],
        linkedRevisionIds: [...entry.linkedRevisionIds].slice(0, 8),
        lastSeenAt: entry.lastSeenAt,
        lastImprovedAt: entry.lastImprovedAt,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      } satisfies GrowthMistakePattern;
    })
    .sort((a, b) => b.recurrenceScore - a.recurrenceScore || daysBetween(a.lastSeenAt) - daysBetween(b.lastSeenAt))
    .slice(0, 30);
}

function groupWeakTopics(snapshot: GrowthSignalSnapshot, mistakePatterns: GrowthMistakePattern[]): GrowthWeakTopic[] {
  const now = new Date();
  const byTopic = new Map<
    string,
    {
      subject: string;
      topic: string;
      subtopic?: string | null;
      items: RevisionItem[];
      weakSignal?: WeakTopicSignal | null;
      mistakePatternIds: string[];
      mediaIds: string[];
    }
  >();

  for (const item of snapshot.revisionItems) {
    const subject = subjectFromRevisionItem(item);
    const topic = topicFromRevisionItem(item);
    const key = `${normalizeKey(subject)}::${normalizeKey(topic)}`;
    const entry = byTopic.get(key) || {
      subject,
      topic,
      subtopic: safeString(item.subtopic).trim() || null,
      items: [],
      weakSignal: null as WeakTopicSignal | null,
      mistakePatternIds: [],
      mediaIds: [],
    };
    entry.items.push(item);
    byTopic.set(key, entry);
  }

  for (const signal of snapshot.weakSignals) {
    const subject = safeString(signal.subject).trim() || 'General';
    const topic = safeString(signal.topic).trim() || 'General';
    const key = `${normalizeKey(subject)}::${normalizeKey(topic)}`;
    const entry = byTopic.get(key) || {
      subject,
      topic,
      subtopic: safeString(signal.subtopic).trim() || null,
      items: [],
      weakSignal: null as WeakTopicSignal | null,
      mistakePatternIds: [],
      mediaIds: [],
    };
    entry.weakSignal = signal;
    byTopic.set(key, entry);
  }

  for (const [key, entry] of byTopic.entries()) {
    const matchingPatterns = mistakePatterns.filter(
      (pattern) =>
        normalizeKey(pattern.subject) === normalizeKey(entry.subject) &&
        pattern.linkedTopics.some((topic) => normalizeKey(topic) === normalizeKey(entry.topic))
    );
    const mediaIds = snapshot.mediaAssets
      .filter(
        (asset) =>
          normalizeKey(safeString(asset.subject) || entry.subject) === normalizeKey(entry.subject) &&
          (normalizeKey(safeString(asset.topic)) === normalizeKey(entry.topic) ||
            normalizeKey(safeString(asset.subtopic)) === normalizeKey(entry.topic))
      )
      .map((asset) => asset.id)
      .slice(0, 8);
    entry.mistakePatternIds = matchingPatterns.map((pattern) => pattern.id);
    entry.mediaIds = mediaIds;
    byTopic.set(key, entry);
  }

  const weakTopics = [...byTopic.values()]
    .map((entry) => {
      const dueCount = entry.items.filter((item) => item.reviewStatus === 'review_due' || item.reviewStatus === 'needs_attention').length;
      const needsAttentionCount = entry.items.filter((item) => item.reviewStatus === 'needs_attention').length;
      const struggleCount = entry.items.reduce((sum, item) => sum + Math.max(0, Number(item.struggleCount || 0)), 0);
      const successCount = entry.items.reduce((sum, item) => sum + Math.max(0, Number(item.successCount || 0)), 0);
      const mistakeBasedCount = entry.items.filter((item) => item.isMistakeBased).length;
      const stillLearningCount = entry.items.filter((item) => (item.mastery || 'still_learning') === 'still_learning').length;
      const masteryScore =
        entry.items.length > 0
          ? entry.items.reduce((sum, item) => sum + masteryToScore(item.mastery), 0) / entry.items.length
          : 46;
      const signalScore = Number(entry.weakSignal?.weaknessScore || 0);
      const reviewGapDays = Math.min(
        ...entry.items
          .map((item) => daysBetween(item.lastReviewedAt || item.updatedAt))
          .concat(entry.weakSignal?.lastSeenAt ? [daysBetween(entry.weakSignal.lastSeenAt)] : [999])
      );
      const recurrencePenalty = entry.mistakePatternIds.length * 8 + mistakeBasedCount * 4;
      const weaknessScore = clamp(
        signalScore * 6 +
          dueCount * 5 +
          needsAttentionCount * 8 +
          struggleCount * 3.8 +
          stillLearningCount * 4 +
          recurrencePenalty +
          Math.min(18, reviewGapDays * 0.6) -
          successCount * 2.1 -
          masteryScore * 0.35,
        0,
        100
      );
      const improvingSignal = successCount > 0 && successCount >= Math.max(1, struggleCount - 1);
      const status: GrowthWeakTopicStatus =
        weaknessScore >= 70
          ? improvingSignal
            ? 'improving'
            : 'active'
          : weaknessScore >= 45
            ? 'improving'
            : weaknessScore >= 24
              ? 'stable'
              : 'recovered';
      const triggers: string[] = [];
      if (needsAttentionCount > 0) triggers.push('Repeated needs-attention reviews');
      if (mistakeBasedCount > 0) triggers.push('Same misconception keeps returning');
      if (reviewGapDays >= 8) triggers.push('Review gap is growing');
      if (entry.weakSignal?.reason) triggers.push(entry.weakSignal.reason);
      if (triggers.length === 0) triggers.push('Fragile recall and confidence signals');
      const reasonSummary =
        status === 'active'
          ? 'This topic is repeatedly fragile and should be rescued now.'
          : status === 'improving'
            ? 'Progress exists, but this topic still needs guided reinforcement.'
            : status === 'stable'
              ? 'This topic is steadier, but a light follow-up keeps it stable.'
              : 'This topic has recently stabilized. Keep a low-frequency recall check.';
      const lastStruggledAt =
        entry.items
          .filter((item) => item.recentOutcome === 'struggled' || Number(item.struggleCount || 0) > 0)
          .map((item) => item.updatedAt)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0] || entry.weakSignal?.lastSeenAt || null;
      const lastReviewedAt =
        entry.items
          .map((item) => item.lastReviewedAt || item.updatedAt)
          .sort((a, b) => new Date(b || 0).getTime() - new Date(a || 0).getTime())[0] || null;
      const nextReviewOffsetDays = status === 'active' ? 1 : status === 'improving' ? 2 : status === 'stable' ? 4 : 7;
      const nextReviewAt = new Date(now.getTime() + nextReviewOffsetDays * 24 * 60 * 60 * 1000).toISOString();
      return {
        id: `weak-${createCompactId(`${entry.subject}-${entry.topic}`)}`,
        userId: '',
        subject: entry.subject,
        topic: entry.topic,
        subtopic: entry.subtopic || null,
        weaknessScore: Number(weaknessScore.toFixed(1)),
        microMasteryLabel: scoreToMasteryLabel(clamp(masteryScore - weaknessScore * 0.18, 0, 100)),
        status,
        weaknessReasonSummary: reasonSummary,
        triggers: dedupe(triggers).slice(0, 4),
        lastStruggledAt,
        lastReviewedAt,
        nextReviewAt,
        linkedRevisionIds: entry.items.map((item) => item.id).slice(0, 10),
        linkedMediaIds: entry.mediaIds,
        linkedMistakePatternIds: entry.mistakePatternIds,
        recommendedAction: deriveWeakTopicRecommendedAction(entry.topic, entry.subject),
        createdAt: nowIso(),
        updatedAt: nowIso(),
      } satisfies GrowthWeakTopic;
    })
    .filter((entry) => entry.weaknessScore >= 18 || entry.status !== 'recovered')
    .sort((a, b) => b.weaknessScore - a.weaknessScore);

  return weakTopics.slice(0, 24);
}

function buildMasterySignals(snapshot: GrowthSignalSnapshot): GrowthMasterySignal[] {
  const signals: GrowthMasterySignal[] = [];
  for (const row of snapshot.progressRows) {
    signals.push({
      id: `progress-${createCompactId(`${row.subject}-${row.topic}-${row.updatedAt}`)}`,
      userId: '',
      subject: row.subject,
      topic: row.topic,
      subtopic: null,
      signalType: 'progress_snapshot',
      confidenceScore: clamp(row.mastery / 100, 0, 1),
      evidenceScore: clamp((row.mastery + 8) / 100, 0, 1),
      sourceType: 'progress',
      outcome: row.mastery >= 70 ? 'improved' : row.mastery <= 45 ? 'struggled' : 'no_change',
      createdAt: row.updatedAt,
    });
  }

  for (const item of snapshot.revisionItems.slice(0, 180)) {
    if (!item.updatedAt) continue;
    const mastery = masteryToScore(item.mastery);
    const outcome = safeString(item.recentOutcome).trim() || null;
    const evidenceWeight =
      outcome === 'completed'
        ? 0.8
        : outcome === 'partial'
          ? 0.58
          : outcome === 'struggled'
            ? 0.33
            : 0.5;
    signals.push({
      id: `revision-${item.id}`,
      userId: '',
      subject: subjectFromRevisionItem(item),
      topic: topicFromRevisionItem(item),
      subtopic: safeString(item.subtopic).trim() || null,
      signalType: 'revision_outcome',
      confidenceScore: clamp(mastery / 100, 0, 1),
      evidenceScore: evidenceWeight,
      sourceType: 'revision',
      outcome,
      createdAt: item.updatedAt,
    });
  }

  for (const event of snapshot.learningEvents.slice(0, 220)) {
    const subject = safeString(event.subject).trim() || 'General';
    const topic = safeString(event.topic).trim() || 'General';
    const eventType = safeString(event.eventType).trim() || 'learning_event';
    const positive = /(improvement|success|reduced|completed|helped|reuse)/i.test(eventType);
    const negative = /(mistake|failure|dropoff|struggle|denied|audio_failure)/i.test(eventType);
    signals.push({
      id: `event-${safeString(event.id).trim() || createCompactId(`${subject}-${topic}-${event.createdAt}`)}`,
      userId: '',
      subject,
      topic,
      subtopic: null,
      signalType: eventType,
      confidenceScore: positive ? 0.72 : negative ? 0.34 : 0.5,
      evidenceScore: positive ? 0.78 : negative ? 0.28 : 0.48,
      sourceType: 'learning_event',
      outcome: safeString(event.outcome).trim() || (positive ? 'improved' : negative ? 'struggled' : 'no_change'),
      createdAt: toIso(event.createdAt) || nowIso(),
    });
  }

  return signals
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 420);
}

function buildRecommendations(args: {
  userId: string;
  snapshot: GrowthSignalSnapshot;
  weakTopics: GrowthWeakTopic[];
  mistakePatterns: GrowthMistakePattern[];
}): GrowthRecommendation[] {
  const { userId, snapshot, weakTopics, mistakePatterns } = args;
  const createdAt = snapshot.generatedAt;
  const recommendations: GrowthRecommendation[] = [];
  const seenTopic = new Set<string>();

  const addRecommendation = (entry: GrowthRecommendation) => {
    recommendations.push(entry);
  };

  for (const due of snapshot.queue.dueNow.slice(0, 4)) {
    const topic = topicFromRevisionItem(due);
    const score = clamp(
      82 + Math.max(0, daysBetween(due.nextReviewAt || due.updatedAt) * 1.6) + Math.max(0, Number(due.struggleCount || 0)) * 3,
      35,
      100
    );
    addRecommendation({
      id: `rec-due-${due.id}`,
      userId,
      type: 'due_revision',
      priorityScore: Number(score.toFixed(1)),
      sourceType: 'revision_queue',
      title: `Review due item: ${due.title}`,
      reason: 'This item is due now and gives the quickest memory protection.',
      primaryAction: createPrimaryAction({
        actionType: 'review_recap',
        label: 'Review recap',
        destination: 'revision',
        targetId: due.id,
        topic,
        subject: subjectFromRevisionItem(due),
      }),
      secondaryAction: createPrimaryAction({
        actionType: 'quiz_me',
        label: 'Quiz me right after',
        destination: 'revision',
        targetId: due.id,
        topic,
        subject: subjectFromRevisionItem(due),
      }),
      linkedTopic: topic,
      linkedRevisionId: due.id,
      linkedMediaId: null,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt,
    });
    seenTopic.add(normalizeKey(topic));
  }

  for (const weak of weakTopics.slice(0, 4)) {
    const score = clamp(weak.weaknessScore * 0.9 + (weak.status === 'active' ? 18 : weak.status === 'improving' ? 8 : 0), 22, 100);
    addRecommendation({
      id: `rec-weak-${weak.id}`,
      userId,
      type: 'weak_topic_rescue',
      priorityScore: Number(score.toFixed(1)),
      sourceType: 'weak_topic_engine',
      title: `Rescue weak topic: ${weak.topic}`,
      reason: weak.weaknessReasonSummary,
      primaryAction: createPrimaryAction({
        actionType: 'rescue_weak_topic',
        label: 'Rescue weak topic',
        destination: 'growth',
        targetId: weak.id,
        topic: weak.topic,
        subject: weak.subject,
      }),
      secondaryAction: weak.linkedRevisionIds[0]
        ? createPrimaryAction({
            actionType: 'open_revision',
            label: 'Open linked revision',
            destination: 'revision',
            targetId: weak.linkedRevisionIds[0],
            topic: weak.topic,
            subject: weak.subject,
          })
        : null,
      linkedTopic: weak.topic,
      linkedRevisionId: weak.linkedRevisionIds[0] || null,
      linkedMediaId: weak.linkedMediaIds[0] || null,
      expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
      createdAt,
    });
    seenTopic.add(normalizeKey(weak.topic));
  }

  for (const pattern of mistakePatterns.slice(0, 4)) {
    const score = clamp(pattern.recurrenceScore * 0.88 + (pattern.status === 'active' ? 12 : 0), 18, 100);
    addRecommendation({
      id: `rec-mistake-${pattern.id}`,
      userId,
      type: 'mistake_pattern_repair',
      priorityScore: Number(score.toFixed(1)),
      sourceType: 'mistake_journal',
      title: `Repair recurring pattern: ${pattern.title}`,
      reason: pattern.description,
      primaryAction: createPrimaryAction({
        actionType: 'practice_now',
        label: 'Repair with one similar question',
        destination: 'growth',
        targetId: pattern.id,
        topic: pattern.linkedTopics[0] || null,
        subject: pattern.subject,
      }),
      secondaryAction: createPrimaryAction({
        actionType: 'save_reminder',
        label: 'Save fix reminder',
        destination: 'growth',
        targetId: pattern.id,
        topic: pattern.linkedTopics[0] || null,
        subject: pattern.subject,
      }),
      linkedTopic: pattern.linkedTopics[0] || null,
      linkedRevisionId: pattern.linkedRevisionIds[0] || null,
      linkedMediaId: null,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      createdAt,
    });
  }

  const activePlan = snapshot.studyPlans.find((plan) => {
    const lifecycle = safeString((plan.metadata as Record<string, unknown> | null)?.lifecycle).trim() || 'active';
    return lifecycle !== 'paused' && lifecycle !== 'completed';
  });
  if (activePlan) {
    const goals = snapshot.studyGoals.filter((goal) => goal.studyPlanId === activePlan.id);
    const nextGoal = goals.find((goal) => goal.status !== 'completed');
    addRecommendation({
      id: `rec-plan-${activePlan.id}`,
      userId,
      type: 'continue_study_plan',
      priorityScore: 69,
      sourceType: 'study_plan',
      title: `Continue plan: ${activePlan.title}`,
      reason: nextGoal ? `Next milestone: ${nextGoal.title}.` : 'Keep your active plan moving with one milestone now.',
      primaryAction: createPrimaryAction({
        actionType: 'continue_study_plan',
        label: 'Continue study plan',
        destination: 'study_plan',
        targetId: activePlan.id,
        topic: safeString(activePlan.topic).trim() || null,
        subject: safeString(activePlan.subject).trim() || null,
      }),
      secondaryAction: nextGoal
        ? createPrimaryAction({
            actionType: 'open_revision',
            label: 'Open linked revision',
            destination: 'revision',
            targetId: nextGoal.id,
            topic: safeString(nextGoal.topic).trim() || null,
            subject: safeString(nextGoal.subject).trim() || null,
          })
        : null,
      linkedTopic: safeString(activePlan.topic).trim() || null,
      linkedRevisionId: null,
      linkedMediaId: null,
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt,
    });
  }

  const unreviewedRecap = snapshot.mediaAssets.find(
    (asset) =>
      ['audio_recap', 'video_recap'].includes(asset.assetKind) &&
      Boolean(asset.isSaved) &&
      !asset.isCompleted &&
      !seenTopic.has(normalizeKey(safeString(asset.topic)))
  );
  if (unreviewedRecap) {
    addRecommendation({
      id: `rec-recap-${unreviewedRecap.id}`,
      userId,
      type: 'saved_recap_replay',
      priorityScore: 62,
      sourceType: 'media_asset',
      title: `Replay saved recap: ${unreviewedRecap.title}`,
      reason: 'Saved recap is waiting and can quickly refresh this topic.',
      primaryAction: createPrimaryAction({
        actionType: 'open_related_media',
        label: 'Replay recap',
        destination: 'media',
        targetId: unreviewedRecap.id,
        topic: safeString(unreviewedRecap.topic).trim() || null,
        subject: safeString(unreviewedRecap.subject).trim() || null,
      }),
      secondaryAction: createPrimaryAction({
        actionType: 'quiz_me',
        label: 'Quiz me after replay',
        destination: 'growth',
        targetId: unreviewedRecap.id,
        topic: safeString(unreviewedRecap.topic).trim() || null,
        subject: safeString(unreviewedRecap.subject).trim() || null,
      }),
      linkedTopic: safeString(unreviewedRecap.topic).trim() || null,
      linkedRevisionId: safeString(unreviewedRecap.revisionItemId).trim() || null,
      linkedMediaId: unreviewedRecap.id,
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt,
    });
  }

  const recentStruggle = snapshot.revisionItems.find((item) => item.recentOutcome === 'struggled');
  if (recentStruggle && !seenTopic.has(normalizeKey(topicFromRevisionItem(recentStruggle)))) {
    addRecommendation({
      id: `rec-struggle-${recentStruggle.id}`,
      userId,
      type: 'struggle_revisit',
      priorityScore: 66,
      sourceType: 'revision_outcome',
      title: `Revisit recent struggle: ${recentStruggle.title}`,
      reason: 'Quick revisit now prevents this struggle from repeating tomorrow.',
      primaryAction: createPrimaryAction({
        actionType: 'start_guided_study',
        label: 'Start guided revisit',
        destination: 'new_session',
        targetId: recentStruggle.id,
        topic: topicFromRevisionItem(recentStruggle),
        subject: subjectFromRevisionItem(recentStruggle),
      }),
      secondaryAction: createPrimaryAction({
        actionType: 'review_recap',
        label: 'Review recap first',
        destination: 'revision',
        targetId: recentStruggle.id,
        topic: topicFromRevisionItem(recentStruggle),
        subject: subjectFromRevisionItem(recentStruggle),
      }),
      linkedTopic: topicFromRevisionItem(recentStruggle),
      linkedRevisionId: recentStruggle.id,
      linkedMediaId: null,
      expiresAt: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
      createdAt,
    });
  }

  return recommendations.sort((a, b) => b.priorityScore - a.priorityScore);
}

function toDueNowQueue(recommendations: GrowthRecommendation[]): GrowthRecommendation[] {
  const queue: GrowthRecommendation[] = [];
  const topicKeys = new Set<string>();
  for (const entry of recommendations) {
    if (queue.length >= 5) break;
    const key = normalizeKey(entry.linkedTopic || entry.title);
    if (topicKeys.has(key)) continue;
    queue.push(entry);
    topicKeys.add(key);
  }
  if (queue.length < 3) {
    for (const entry of recommendations) {
      if (queue.length >= 3) break;
      if (queue.some((existing) => existing.id === entry.id)) continue;
      queue.push(entry);
    }
  }
  return queue.slice(0, 5);
}

function buildRecentlyImproved(snapshot: GrowthSignalSnapshot): GrowthOverviewResponse['recentlyImproved'] {
  const improved: GrowthOverviewResponse['recentlyImproved'] = [];
  const pushImproved = (entry: GrowthOverviewResponse['recentlyImproved'][number]) => {
    if (improved.some((item) => normalizeKey(item.title) === normalizeKey(entry.title))) return;
    improved.push(entry);
  };

  for (const item of snapshot.queue.recentlyImproved.slice(0, 4)) {
    pushImproved({
      id: `improved-${item.id}`,
      title: item.title,
      summary: 'Recent review showed stronger recall and fewer correction steps.',
      topic: topicFromRevisionItem(item),
      subject: subjectFromRevisionItem(item),
      evidence: [
        item.recentOutcome ? `Recent outcome: ${item.recentOutcome}` : 'Recent outcome improved',
        `Success count: ${Number(item.successCount || 0)}`,
      ],
      createdAt: item.updatedAt,
    });
  }

  for (const event of snapshot.learningEvents.slice(0, 120)) {
    const eventType = normalizeKey(event.eventType);
    if (!/(improvement|reduction|success|helped|topic_return_with_improvement)/.test(eventType)) continue;
    const topic = safeString(event.topic).trim() || null;
    const subject = safeString(event.subject).trim() || null;
    pushImproved({
      id: `improved-event-${safeString(event.id).trim() || createCompactId(`${eventType}-${event.createdAt}`)}`,
      title: topic ? `Improvement detected in ${topic}` : 'Recent improvement detected',
      summary: 'Recent evidence suggests better retention and correction quality.',
      topic,
      subject,
      evidence: [`Signal: ${event.eventType}`],
      createdAt: toIso(event.createdAt) || nowIso(),
    });
    if (improved.length >= 6) break;
  }

  return improved.slice(0, 6);
}

function buildSupportPatterns(snapshot: GrowthSignalSnapshot): GrowthOverviewResponse['supportPatterns'] {
  const events = snapshot.learningEvents;
  const hasEvent = (name: string) => events.some((event) => normalizeKey(event.eventType) === normalizeKey(name));
  const countEvent = (pattern: RegExp) => events.filter((event) => pattern.test(normalizeKey(event.eventType))).length;
  const patterns: GrowthOverviewResponse['supportPatterns'] = [];

  const simplifyWins = countEvent(/simplify.*improvement|simplify_led_to_improvement/);
  if (simplifyWins > 0) {
    patterns.push({
      id: 'support-simplify',
      title: 'Simpler language improves clarity',
      reason: 'When explanations are simplified, this student shows stronger follow-through.',
      confidence: Number(clamp(0.48 + simplifyWins * 0.08, 0.35, 0.92).toFixed(2)),
      evidence: [`${simplifyWins} simplify-to-improvement signals in recent sessions.`],
    });
  }

  const mediaHelp = countEvent(/video_recommendation_helped|research_mode_helped|voice_recap_completion/);
  if (mediaHelp > 0 || snapshot.mediaAssets.some((asset) => asset.isHelpful)) {
    patterns.push({
      id: 'support-media',
      title: 'Recap media helps retention',
      reason: 'Recap-style media usage correlates with steadier understanding.',
      confidence: Number(clamp(0.44 + mediaHelp * 0.07, 0.35, 0.9).toFixed(2)),
      evidence: [`${mediaHelp} helpful media or recap signals.`],
    });
  }

  const similarPracticeWins = countEvent(/similar_question_led_to_improvement|transfer_success/);
  if (similarPracticeWins > 0) {
    patterns.push({
      id: 'support-transfer',
      title: 'One similar question consolidates learning',
      reason: 'Transfer checks appear to improve confidence after recap.',
      confidence: Number(clamp(0.4 + similarPracticeWins * 0.08, 0.3, 0.88).toFixed(2)),
      evidence: [`${similarPracticeWins} transfer success signals.`],
    });
  }

  const voiceWins = countEvent(/voice_mode_helped|oral_quiz_success_signal/);
  if (voiceWins > 0 || hasEvent('mixed_language_session_stability')) {
    patterns.push({
      id: 'support-oral',
      title: 'Thinking aloud supports understanding',
      reason: 'Oral response signals suggest spoken explanations help this learner.',
      confidence: Number(clamp(0.36 + voiceWins * 0.09, 0.28, 0.9).toFixed(2)),
      evidence: [`${voiceWins} voice-helped signals in tracked events.`],
    });
  }

  if (patterns.length === 0) {
    patterns.push({
      id: 'support-default',
      title: 'Short one-step prompts are safest',
      reason: 'Not enough direct evidence yet, so low-load stepwise support is recommended.',
      confidence: 0.32,
      evidence: ['Limited support-pattern data so far.'],
    });
  }

  return patterns.slice(0, 4);
}

function buildStudyPlanViews(snapshot: GrowthSignalSnapshot): GrowthStudyPlanView[] {
  const now = new Date();
  return snapshot.studyPlans.map((plan) => {
    const goals = snapshot.studyGoals
      .filter((goal) => goal.studyPlanId === plan.id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const completed = goals.filter((goal) => goal.status === 'completed').length;
    const nextGoalIndex = goals.findIndex((goal) => goal.status !== 'completed');
    const nextGoal = nextGoalIndex >= 0 ? goals[nextGoalIndex] : null;
    const lifecycle = safeString((plan.metadata as Record<string, unknown> | null)?.lifecycle).trim();
    const staleDays = daysBetween(plan.updatedAt, now);
    const status: GrowthStudyPlanView['status'] =
      lifecycle === 'paused'
        ? 'paused'
        : lifecycle === 'completed'
          ? 'completed'
          : staleDays > 12 && completed < Math.max(1, goals.length)
            ? 'stale'
            : goals.length === 0
              ? 'suggested'
              : 'active';
    const progressSummary =
      goals.length === 0
        ? 'No milestones yet. Add one first step to activate this plan.'
        : `${completed}/${goals.length} milestones complete${nextGoal ? `. Next: ${nextGoal.title}.` : '.'}`;
    const nextAction =
      status === 'paused'
        ? 'Resume plan and complete one pending milestone.'
        : status === 'completed'
          ? 'Review outcomes and lock in one maintenance recap.'
          : nextGoal
            ? `Continue with "${nextGoal.title}".`
            : 'Add the next milestone to keep momentum.';
    const targetTopics = dedupe(
      [
        ...(Array.isArray(plan.focusAreas) ? plan.focusAreas : []),
        ...(safeString(plan.topic).trim() ? [safeString(plan.topic).trim()] : []),
        ...goals.map((goal) => safeString(goal.topic).trim()).filter(Boolean),
      ].filter(Boolean)
    ).slice(0, 6);
    return {
      id: plan.id,
      userId: plan.userId,
      title: plan.title,
      goal:
        safeString((plan.metadata as Record<string, unknown> | null)?.goal).trim() ||
        safeString(plan.summary).trim() ||
        plan.title,
      subject: safeString(plan.subject).trim() || null,
      targetTopics,
      status,
      milestoneIndex: nextGoalIndex >= 0 ? nextGoalIndex : goals.length,
      milestones: goals.map((goal) => ({
        id: goal.id,
        title: goal.title,
        status: goal.status,
        dueAt: goal.dueAt || null,
      })),
      nextAction,
      progressSummary,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      linkedPlan: plan,
    };
  });
}

function summarizeTrendStatus(status: GrowthTrendStatus): string {
  if (status === 'improving') return 'Understanding is moving up steadily.';
  if (status === 'recovering') return 'A weak area is recovering with support.';
  if (status === 'fragile') return 'Performance is inconsistent and needs stabilization.';
  if (status === 'needs_support') return 'Current evidence suggests immediate support is needed.';
  if (status === 'plateauing') return 'Progress is flattening; a new strategy may help.';
  return 'Understanding is broadly stable right now.';
}

function buildMasteryTrendResponse(snapshot: GrowthSignalSnapshot, weakTopics: GrowthWeakTopic[]): GrowthMasteryTrendsResponse {
  const masterySignals = buildMasterySignals(snapshot);
  const weakTopicBySubject = new Map<string, number>();
  for (const weak of weakTopics) {
    const key = normalizeKey(weak.subject);
    weakTopicBySubject.set(key, (weakTopicBySubject.get(key) || 0) + 1);
  }

  const subjectBuckets = new Map<
    string,
    {
      subject: string;
      scores: number[];
      recentScores: number[];
      oldScores: number[];
      evidence: number;
      topics: Set<string>;
    }
  >();

  for (const signal of masterySignals) {
    const key = normalizeKey(signal.subject);
    const bucket = subjectBuckets.get(key) || {
      subject: signal.subject,
      scores: [],
      recentScores: [],
      oldScores: [],
      evidence: 0,
      topics: new Set<string>(),
    };
    const score = clamp(signal.confidenceScore * 100 * 0.55 + signal.evidenceScore * 100 * 0.45, 0, 100);
    const ageDays = daysBetween(signal.createdAt);
    bucket.scores.push(score);
    if (ageDays <= 14) bucket.recentScores.push(score);
    if (ageDays > 14 && ageDays <= 45) bucket.oldScores.push(score);
    bucket.evidence += 1;
    bucket.topics.add(signal.topic);
    subjectBuckets.set(key, bucket);
  }

  const subjectTrends = [...subjectBuckets.values()]
    .map((bucket) => {
      const masteryScore = bucket.scores.length > 0
        ? bucket.scores.reduce((sum, value) => sum + value, 0) / bucket.scores.length
        : 50;
      const recent = bucket.recentScores.length > 0
        ? bucket.recentScores.reduce((sum, value) => sum + value, 0) / bucket.recentScores.length
        : masteryScore;
      const old = bucket.oldScores.length > 0
        ? bucket.oldScores.reduce((sum, value) => sum + value, 0) / bucket.oldScores.length
        : masteryScore;
      const delta = Number((recent - old).toFixed(1));
      const weakSignalCount = weakTopicBySubject.get(normalizeKey(bucket.subject)) || 0;
      const status = inferTrendStatus({
        masteryScore,
        delta,
        evidenceCount: bucket.evidence,
        weakSignals: weakSignalCount,
      });
      return {
        subject: bucket.subject,
        status,
        masteryScore: Number(masteryScore.toFixed(1)),
        evidenceCount: bucket.evidence,
        topicCount: bucket.topics.size,
        summary: `${summarizeTrendStatus(status)} ${weakSignalCount > 0 ? `${weakSignalCount} weak topic signal(s) still active.` : ''}`.trim(),
        delta,
      };
    })
    .sort((a, b) => b.masteryScore - a.masteryScore)
    .slice(0, 8);

  const topicBuckets = new Map<
    string,
    {
      subject: string;
      topic: string;
      scores: number[];
      evidence: number;
      lastSeenAt: string | null;
      weakScore: number;
    }
  >();

  for (const signal of masterySignals) {
    const key = `${normalizeKey(signal.subject)}::${normalizeKey(signal.topic)}`;
    const bucket = topicBuckets.get(key) || {
      subject: signal.subject,
      topic: signal.topic,
      scores: [],
      evidence: 0,
      lastSeenAt: null as string | null,
      weakScore: 0,
    };
    const score = clamp(signal.confidenceScore * 100 * 0.55 + signal.evidenceScore * 100 * 0.45, 0, 100);
    bucket.scores.push(score);
    bucket.evidence += 1;
    if (!bucket.lastSeenAt || new Date(signal.createdAt).getTime() > new Date(bucket.lastSeenAt).getTime()) {
      bucket.lastSeenAt = signal.createdAt;
    }
    topicBuckets.set(key, bucket);
  }

  for (const weak of weakTopics) {
    const key = `${normalizeKey(weak.subject)}::${normalizeKey(weak.topic)}`;
    const bucket = topicBuckets.get(key);
    if (!bucket) continue;
    bucket.weakScore = weak.weaknessScore;
    topicBuckets.set(key, bucket);
  }

  const topicTrends = [...topicBuckets.values()]
    .map((bucket) => {
      const confidenceScore = bucket.scores.length > 0
        ? bucket.scores.reduce((sum, value) => sum + value, 0) / bucket.scores.length
        : 50;
      const effectiveDelta = Number((confidenceScore - 56 - bucket.weakScore * 0.2).toFixed(1));
      const status = inferTrendStatus({
        masteryScore: confidenceScore,
        delta: effectiveDelta,
        evidenceCount: bucket.evidence,
        weakSignals: bucket.weakScore >= 50 ? 1 : 0,
      });
      const label = scoreToMasteryLabel(clamp(confidenceScore - bucket.weakScore * 0.2, 0, 100));
      return {
        topic: bucket.topic,
        subject: bucket.subject,
        subtopic: null,
        status,
        microMasteryLabel: label,
        confidenceScore: Number(clamp(confidenceScore / 100, 0, 1).toFixed(2)),
        evidenceScore: Number(clamp(bucket.evidence / 12 + confidenceScore / 150, 0, 1).toFixed(2)),
        summary: summarizeTrendStatus(status),
        lastSeenAt: bucket.lastSeenAt,
      };
    })
    .sort((a, b) => b.confidenceScore - a.confidenceScore)
    .slice(0, 18);

  const overallMastery =
    subjectTrends.length > 0
      ? subjectTrends.reduce((sum, entry) => sum + entry.masteryScore, 0) / subjectTrends.length
      : 50;
  const overallDelta =
    subjectTrends.length > 0
      ? subjectTrends.reduce((sum, entry) => sum + entry.delta, 0) / subjectTrends.length
      : 0;
  const overallWeakSignals = weakTopics.filter((entry) => entry.status === 'active').length;
  const overallStatus = inferTrendStatus({
    masteryScore: overallMastery,
    delta: overallDelta,
    evidenceCount: masterySignals.length,
    weakSignals: overallWeakSignals,
  });

  return {
    generatedAt: snapshot.generatedAt,
    overall: {
      status: overallStatus,
      summary: summarizeTrendStatus(overallStatus),
      confidence: Number(clamp(masterySignals.length / 120 + 0.3, 0.25, 0.95).toFixed(2)),
    },
    subjectTrends,
    topicTrends,
    masterySignals: masterySignals.slice(0, 120),
  };
}

async function persistWeakTopics(userId: string, snapshotDate: string, weakTopics: GrowthWeakTopic[]) {
  await ensureGrowthIntelligenceTables();
  for (const item of weakTopics) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "GrowthWeakTopicState" (
          "id", "userId", "subject", "topic", "subtopic", "weaknessScore", "microMasteryLabel", "status",
          "weaknessReasonSummary", "triggers", "lastStruggledAt", "lastReviewedAt", "nextReviewAt",
          "linkedRevisionIds", "linkedMediaIds", "linkedMistakePatternIds", "recommendedAction",
          "snapshotDate", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, CAST($10 AS JSONB), $11, $12, $13,
          CAST($14 AS JSONB), CAST($15 AS JSONB), CAST($16 AS JSONB), $17,
          $18::date, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT ("userId", "subject", "topic", "snapshotDate")
        DO UPDATE SET
          "subtopic" = EXCLUDED."subtopic",
          "weaknessScore" = EXCLUDED."weaknessScore",
          "microMasteryLabel" = EXCLUDED."microMasteryLabel",
          "status" = EXCLUDED."status",
          "weaknessReasonSummary" = EXCLUDED."weaknessReasonSummary",
          "triggers" = EXCLUDED."triggers",
          "lastStruggledAt" = EXCLUDED."lastStruggledAt",
          "lastReviewedAt" = EXCLUDED."lastReviewedAt",
          "nextReviewAt" = EXCLUDED."nextReviewAt",
          "linkedRevisionIds" = EXCLUDED."linkedRevisionIds",
          "linkedMediaIds" = EXCLUDED."linkedMediaIds",
          "linkedMistakePatternIds" = EXCLUDED."linkedMistakePatternIds",
          "recommendedAction" = EXCLUDED."recommendedAction",
          "updatedAt" = CURRENT_TIMESTAMP
      `,
      item.id,
      userId,
      item.subject,
      item.topic,
      item.subtopic || null,
      item.weaknessScore,
      item.microMasteryLabel,
      item.status,
      item.weaknessReasonSummary,
      JSON.stringify(item.triggers || []),
      item.lastStruggledAt || null,
      item.lastReviewedAt || null,
      item.nextReviewAt || null,
      JSON.stringify(item.linkedRevisionIds || []),
      JSON.stringify(item.linkedMediaIds || []),
      JSON.stringify(item.linkedMistakePatternIds || []),
      item.recommendedAction,
      snapshotDate
    );
  }
}

async function persistMistakePatterns(userId: string, snapshotDate: string, patterns: GrowthMistakePattern[]) {
  await ensureGrowthIntelligenceTables();
  for (const item of patterns) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "GrowthMistakePatternState" (
          "id", "userId", "subject", "patternKey", "title", "description", "examples", "recurrenceScore",
          "status", "commonContext", "fixReminder", "linkedTopics", "linkedRevisionIds", "lastSeenAt",
          "lastImprovedAt", "snapshotDate", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, CAST($7 AS JSONB), $8,
          $9, $10, $11, CAST($12 AS JSONB), CAST($13 AS JSONB), $14,
          $15, $16::date, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT ("userId", "patternKey", "snapshotDate")
        DO UPDATE SET
          "title" = EXCLUDED."title",
          "description" = EXCLUDED."description",
          "examples" = EXCLUDED."examples",
          "recurrenceScore" = EXCLUDED."recurrenceScore",
          "status" = EXCLUDED."status",
          "commonContext" = EXCLUDED."commonContext",
          "fixReminder" = EXCLUDED."fixReminder",
          "linkedTopics" = EXCLUDED."linkedTopics",
          "linkedRevisionIds" = EXCLUDED."linkedRevisionIds",
          "lastSeenAt" = EXCLUDED."lastSeenAt",
          "lastImprovedAt" = EXCLUDED."lastImprovedAt",
          "updatedAt" = CURRENT_TIMESTAMP
      `,
      item.id,
      userId,
      item.subject,
      item.patternKey,
      item.title,
      item.description,
      JSON.stringify(item.examples || []),
      item.recurrenceScore,
      item.status,
      item.commonContext,
      item.fixReminder,
      JSON.stringify(item.linkedTopics || []),
      JSON.stringify(item.linkedRevisionIds || []),
      item.lastSeenAt || null,
      item.lastImprovedAt || null,
      snapshotDate
    );
  }
}

async function persistRecommendations(userId: string, snapshotDate: string, recommendations: GrowthRecommendation[]) {
  await ensureGrowthIntelligenceTables();
  for (const item of recommendations.slice(0, 24)) {
    const recommendationId = `${snapshotDate}:${item.id}`;
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "GrowthRecommendationState" (
          "id", "userId", "recommendationType", "priorityScore", "sourceType", "title", "reason",
          "primaryAction", "secondaryAction", "linkedTopic", "linkedRevisionId", "linkedMediaId", "expiresAt",
          "snapshotDate", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          CAST($8 AS JSONB), CAST($9 AS JSONB), $10, $11, $12, $13,
          $14::date, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT ("id")
        DO UPDATE SET
          "priorityScore" = EXCLUDED."priorityScore",
          "sourceType" = EXCLUDED."sourceType",
          "title" = EXCLUDED."title",
          "reason" = EXCLUDED."reason",
          "primaryAction" = EXCLUDED."primaryAction",
          "secondaryAction" = EXCLUDED."secondaryAction",
          "linkedTopic" = EXCLUDED."linkedTopic",
          "linkedRevisionId" = EXCLUDED."linkedRevisionId",
          "linkedMediaId" = EXCLUDED."linkedMediaId",
          "expiresAt" = EXCLUDED."expiresAt",
          "updatedAt" = CURRENT_TIMESTAMP
      `,
      recommendationId,
      userId,
      item.type,
      item.priorityScore,
      item.sourceType,
      item.title,
      item.reason,
      JSON.stringify(item.primaryAction || {}),
      JSON.stringify(item.secondaryAction || null),
      item.linkedTopic || null,
      item.linkedRevisionId || null,
      item.linkedMediaId || null,
      item.expiresAt || null,
      snapshotDate
    );
  }
}

async function persistMasteryTrends(userId: string, snapshotDate: string, response: GrowthMasteryTrendsResponse) {
  await ensureGrowthIntelligenceTables();
  for (const item of response.topicTrends) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "GrowthMasteryTrendState" (
          "id", "userId", "subject", "topic", "subtopic", "trendStatus", "microMasteryLabel", "confidenceScore",
          "evidenceScore", "trendSummary", "delta", "lastSeenAt", "snapshotDate", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13::date, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        ON CONFLICT ("userId", "subject", "topic", "snapshotDate")
        DO UPDATE SET
          "subtopic" = EXCLUDED."subtopic",
          "trendStatus" = EXCLUDED."trendStatus",
          "microMasteryLabel" = EXCLUDED."microMasteryLabel",
          "confidenceScore" = EXCLUDED."confidenceScore",
          "evidenceScore" = EXCLUDED."evidenceScore",
          "trendSummary" = EXCLUDED."trendSummary",
          "delta" = EXCLUDED."delta",
          "lastSeenAt" = EXCLUDED."lastSeenAt",
          "updatedAt" = CURRENT_TIMESTAMP
      `,
      `${snapshotDate}:${createCompactId(`${item.subject}-${item.topic}`)}`,
      userId,
      item.subject,
      item.topic,
      item.subtopic || null,
      item.status,
      item.microMasteryLabel,
      item.confidenceScore,
      item.evidenceScore,
      item.summary,
      null,
      item.lastSeenAt || null,
      snapshotDate
    );
  }
}

export async function getGrowthOverview(userId: string, subject?: string | null): Promise<GrowthOverviewResponse> {
  const snapshot = await getCachedSnapshot(userId, subject);
  const mistakePatterns = buildMistakePatterns(snapshot).map((entry) => ({ ...entry, userId }));
  const weakTopics = groupWeakTopics(snapshot, mistakePatterns).map((entry) => ({ ...entry, userId }));
  const recommendations = buildRecommendations({ userId, snapshot, weakTopics, mistakePatterns });
  const dueNowQueue = toDueNowQueue(recommendations);
  const recentlyImproved = buildRecentlyImproved(snapshot);
  const supportPatterns = buildSupportPatterns(snapshot);
  const recommendedNextMove = recommendations[0] || null;
  const weakPatternSpotlight = mistakePatterns.filter((entry) => entry.status !== 'resolved_recently').slice(0, 2);
  const masteryCoverageDenominator = snapshot.revisionItems.length;
  const masteryCoverageNumerator = snapshot.revisionItems.filter((item) => {
    const label = item.mastery || 'still_learning';
    return label === 'almost_there' || label === 'confident';
  }).length;
  const plansInProgressCount = snapshot.studyPlans.filter((plan) => {
    const lifecycle = safeString((plan.metadata as Record<string, unknown> | null)?.lifecycle).trim() || 'active';
    return lifecycle !== 'paused' && lifecycle !== 'completed';
  }).length;
  const snapshotDate = toDateKey(new Date(snapshot.generatedAt));
  const persistKey = `${userId}:${normalizeKey(subject || '')}:overview`;
  if (shouldPersistEntities(persistKey)) {
    void Promise.all([
      persistWeakTopics(userId, snapshotDate, weakTopics),
      persistMistakePatterns(userId, snapshotDate, mistakePatterns),
      persistRecommendations(userId, snapshotDate, recommendations),
    ]).catch(() => undefined);
  }

  return {
    generatedAt: snapshot.generatedAt,
    recommendedNextMove,
    dueNowQueue,
    recentlyImproved,
    weakPatternSpotlight,
    supportPatterns,
    metrics: {
      dueNowCount: snapshot.queue.dueNow.length,
      weakTopicCount: weakTopics.filter((entry) => entry.status !== 'recovered').length,
      activeMistakePatternCount: mistakePatterns.filter((entry) => entry.status === 'active').length,
      improvingCount:
        weakTopics.filter((entry) => entry.status === 'improving').length + snapshot.queue.recentlyImproved.length,
      plansInProgressCount,
      masteryCoveragePercent:
        masteryCoverageDenominator > 0
          ? Math.round((masteryCoverageNumerator / masteryCoverageDenominator) * 100)
          : 0,
    },
  };
}

export async function getGrowthWeakTopics(userId: string, subject?: string | null): Promise<GrowthWeakTopicsResponse> {
  const snapshot = await getCachedSnapshot(userId, subject);
  const mistakePatterns = buildMistakePatterns(snapshot).map((entry) => ({ ...entry, userId }));
  const items = groupWeakTopics(snapshot, mistakePatterns).map((entry) => ({ ...entry, userId }));
  const groups = {
    needsRescueNow: items.filter((entry) => entry.status === 'active').map((entry) => entry.id),
    stillUnstable: items.filter((entry) => entry.status === 'improving' && entry.weaknessScore >= 58).map((entry) => entry.id),
    improvingSlowly: items.filter((entry) => entry.status === 'improving' && entry.weaknessScore < 58).map((entry) => entry.id),
    recentlyStabilized: items.filter((entry) => entry.status === 'stable' || entry.status === 'recovered').map((entry) => entry.id),
  };
  const snapshotDate = toDateKey(new Date(snapshot.generatedAt));
  const persistKey = `${userId}:${normalizeKey(subject || '')}:weak`;
  if (shouldPersistEntities(persistKey)) {
    void persistWeakTopics(userId, snapshotDate, items).catch(() => undefined);
  }
  return {
    generatedAt: snapshot.generatedAt,
    items,
    groups,
  };
}

export async function getGrowthMistakeJournal(userId: string, subject?: string | null): Promise<GrowthMistakeJournalResponse> {
  const snapshot = await getCachedSnapshot(userId, subject);
  const subjectKey = normalizeKey(subject || '');
  const patterns = buildMistakePatterns(snapshot)
    .filter((entry) => !subjectKey || normalizeKey(entry.subject) === subjectKey)
    .map((entry) => ({ ...entry, userId }));
  const snapshotDate = toDateKey(new Date(snapshot.generatedAt));
  const persistKey = `${userId}:${normalizeKey(subject || '')}:mistake`;
  if (shouldPersistEntities(persistKey)) {
    void persistMistakePatterns(userId, snapshotDate, patterns).catch(() => undefined);
  }
  return {
    generatedAt: snapshot.generatedAt,
    patterns,
    groups: {
      active: patterns.filter((entry) => entry.status === 'active').map((entry) => entry.id),
      improving: patterns.filter((entry) => entry.status === 'improving').map((entry) => entry.id),
      resolvedRecently: patterns.filter((entry) => entry.status === 'resolved_recently').map((entry) => entry.id),
    },
  };
}

export async function getGrowthStudyPlans(userId: string, subject?: string | null): Promise<GrowthStudyPlansResponse> {
  const snapshot = await getCachedSnapshot(userId, subject);
  const mistakePatterns = buildMistakePatterns(snapshot).map((entry) => ({ ...entry, userId }));
  const weakTopics = groupWeakTopics(snapshot, mistakePatterns).map((entry) => ({ ...entry, userId }));
  const plans = buildStudyPlanViews(snapshot)
    .filter((entry) => !subject || normalizeKey(safeString(entry.subject)) === normalizeKey(subject))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  const recommendations = buildRecommendations({
    userId,
    snapshot,
    weakTopics,
    mistakePatterns,
  }).filter((entry) => entry.type === 'continue_study_plan' || entry.type === 'weak_topic_rescue');
  const snapshotDate = toDateKey(new Date(snapshot.generatedAt));
  const persistKey = `${userId}:${normalizeKey(subject || '')}:plans`;
  if (shouldPersistEntities(persistKey)) {
    void persistRecommendations(userId, snapshotDate, recommendations).catch(() => undefined);
  }
  return {
    generatedAt: snapshot.generatedAt,
    plans,
    recommendations: recommendations.slice(0, 5),
  };
}

export async function getGrowthMasteryTrends(userId: string, subject?: string | null): Promise<GrowthMasteryTrendsResponse> {
  const snapshot = await getCachedSnapshot(userId, subject);
  const weakTopics = groupWeakTopics(snapshot, buildMistakePatterns(snapshot)).map((entry) => ({ ...entry, userId }));
  const response = buildMasteryTrendResponse(snapshot, weakTopics);
  const snapshotDate = toDateKey(new Date(snapshot.generatedAt));
  const persistKey = `${userId}:${normalizeKey(subject || '')}:trends`;
  if (shouldPersistEntities(persistKey)) {
    void persistMasteryTrends(userId, snapshotDate, response).catch(() => undefined);
  }
  return response;
}
