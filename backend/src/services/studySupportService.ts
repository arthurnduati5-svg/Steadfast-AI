import { randomUUID } from 'crypto';
import { OpenAI } from 'openai';
import prisma from '../utils/prismaClient';
import {
  fetchUserRevisionItems,
  getRevisionProgressOverview,
  getRevisionQueue,
} from './revisionLearningService';
import { listMediaAssets } from './mediaAssetService';
import {
  STEADFAST_FOUNDER_NORTH_STAR,
  STEADFAST_LEARNING_RHYTHM,
  STEADFAST_METACOGNITIVE_PROMPTS,
} from '../lib/steadfast-product';
import type {
  AcademicMemoryEntry,
  ConceptDependency,
  InterventionEffectivenessSummary,
  InterventionOutcome,
  LearningProfile,
  SafeProgressSummary,
  SchoolSafeReport,
  StudyGoal,
  StudyGoalStatus,
  StudyGoalType,
  StudyPlan,
  StudyPlanScope,
  TutorInterventionSuggestion,
  TutorPolicyDecision,
  WeakTopicSignal,
  WhyThisNextExplanation,
} from '../lib/types';

type StudyPlanCreateArgs = {
  userId: string;
  scope: StudyPlanScope;
  subject?: string | null;
  topic?: string | null;
  subjects?: string[] | null;
  examFocus?: boolean;
};

type UpdateStudyGoalArgs = {
  userId: string;
  goalId: string;
  patch: {
    status?: StudyGoalStatus;
    currentCount?: number;
  };
};

type StudyPlanLifecycleStatus = 'active' | 'paused' | 'completed';

type UpdateStudyPlanArgs = {
  userId: string;
  planId: string;
  patch: {
    title?: string;
    summary?: string;
    subject?: string | null;
    topic?: string | null;
    subjects?: string[] | null;
    focusAreas?: string[] | null;
    recommendedBlocks?: string[] | null;
    dateRangeStart?: string | null;
    dateRangeEnd?: string | null;
    metadataPatch?: Record<string, unknown> | null;
  };
};

type CreateStudyPlanGoalArgs = {
  userId: string;
  planId: string;
  title: string;
  description?: string | null;
  goalType: StudyGoalType;
  targetCount?: number | null;
  subject?: string | null;
  topic?: string | null;
  dueAt?: string | null;
  metadata?: Record<string, unknown> | null;
};

type CompleteStudyGoalArgs = {
  userId: string;
  goalId: string;
  completionNote?: string | null;
};

type GenerateAdaptiveStudyPlanArgs = {
  userId: string;
  scope: StudyPlanScope;
  subject?: string | null;
  gradeLevel?: string | null;
  goal?: string | null;
  availableMinutesPerDay?: number | null;
  examDate?: string | null;
  strengths?: string[] | null;
  weakAreas?: string[] | null;
  preferredSupportStyle?: string | null;
  topic?: string | null;
};

type DailyFeedItemType =
  | 'due_now_recap'
  | 'weak_topic_review'
  | 'similar_practice'
  | 'mistake_revisit'
  | 'momentum_item'
  | 'plan_milestone'
  | 'media_recap_boost';

type DailyFeedEvidenceMode =
  | 'short_reasoning'
  | 'step_ordering'
  | 'why_wrong'
  | 'best_method_reason'
  | 'problem_variant_transfer';

type DailyFeedItemStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

type DailyFeedItem = {
  id: string;
  type: DailyFeedItemType;
  title: string;
  subject?: string | null;
  topic?: string | null;
  reasonToday: string;
  estimatedMinutes: number;
  nextActionLabel: string;
  evidenceMode: DailyFeedEvidenceMode;
  targetRevisionItemId?: string | null;
  targetStudyPlanId?: string | null;
  targetStudyGoalId?: string | null;
  targetMediaAssetId?: string | null;
  status: DailyFeedItemStatus;
};

type DailyFeedProgressRecord = {
  id: string;
  userId: string;
  feedDate: string;
  feedItemId: string;
  itemType: DailyFeedItemType;
  status: DailyFeedItemStatus;
  actionCount: number;
  completionCount: number;
  rapidGuessCount: number;
  lastResponseSec?: number | null;
  evidenceScore?: number | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

type DailyFeedSnapshot = {
  dateKey: string;
  items: DailyFeedItem[];
  completedCount: number;
  totalCount: number;
  progressPercent: number;
  integritySignals: {
    rapidGuessSignals: number;
    lowEvidenceSignals: number;
    averageResponseSec: number | null;
    recommendation: string;
  };
};

type RecordDailyFeedInteractionArgs = {
  userId: string;
  feedItemId: string;
  itemType?: DailyFeedItemType;
  action: 'open' | 'start' | 'submit' | 'complete' | 'skip';
  responseText?: string | null;
  responseTimeSec?: number | null;
};

type SemesterPlanCreateArgs = {
  userId: string;
  scope: 'month' | 'term' | 'semester';
  subject?: string | null;
  subjects?: string[] | null;
  examFocus?: boolean;
};

type RecordInterventionEffectArgs = {
  userId: string;
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  interventionType:
    | 'simplify'
    | 'use_example'
    | 'revisit_prerequisite'
    | 'ask_recall'
    | 'similar_question'
    | 'worked_example'
    | 'compare_concepts'
    | 'slow_down';
  relatedRevisionItemId?: string | null;
  outcome?: InterventionOutcome | null;
  metadata?: Record<string, unknown> | null;
};

type MasteryPathwayNode = {
  topic: string;
  label: string;
  stageOrder: number;
  description?: string;
  prerequisites?: string[];
};

let ensureStudySupportTablesPromise: Promise<void> | null = null;
const DAY_MS = 24 * 60 * 60 * 1000;
const semanticScoringClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const DAILY_FEED_SEMANTIC_MODEL = process.env.DAILY_FEED_SCORING_MODEL || 'gpt-4o-mini';

const SUBJECT_PATHWAYS: Record<string, MasteryPathwayNode[]> = {
  mathematics: [
    { topic: 'Arithmetic basics', label: 'Arithmetic basics', stageOrder: 1 },
    { topic: 'Fractions', label: 'Fractions', stageOrder: 2, prerequisites: ['Arithmetic basics'] },
    { topic: 'Algebra basics', label: 'Algebra basics', stageOrder: 3, prerequisites: ['Fractions'] },
    { topic: 'Equations', label: 'Equations', stageOrder: 4, prerequisites: ['Algebra basics'] },
    { topic: 'Factorization', label: 'Factorization', stageOrder: 5, prerequisites: ['Equations'] },
    { topic: 'Graphs', label: 'Graphs', stageOrder: 6, prerequisites: ['Equations'] },
  ],
  biology: [
    { topic: 'Cell basics', label: 'Cell basics', stageOrder: 1 },
    { topic: 'Transport', label: 'Transport', stageOrder: 2, prerequisites: ['Cell basics'] },
    { topic: 'Photosynthesis', label: 'Photosynthesis', stageOrder: 3, prerequisites: ['Cell basics'] },
    { topic: 'Respiration', label: 'Respiration', stageOrder: 4, prerequisites: ['Photosynthesis'] },
    { topic: 'Genetics', label: 'Genetics', stageOrder: 5, prerequisites: ['Cell basics'] },
  ],
  physics: [
    { topic: 'Measurements', label: 'Measurements', stageOrder: 1 },
    { topic: 'Motion', label: 'Motion', stageOrder: 2, prerequisites: ['Measurements'] },
    { topic: 'Force', label: 'Force', stageOrder: 3, prerequisites: ['Motion'] },
    { topic: 'Energy', label: 'Energy', stageOrder: 4, prerequisites: ['Force'] },
    { topic: 'Electricity', label: 'Electricity', stageOrder: 5, prerequisites: ['Energy'] },
  ],
};

const CONCEPT_DEPENDENCIES: ConceptDependency[] = [
  { subject: 'Mathematics', topic: 'Equations', dependsOnTopic: 'Algebra basics', relationshipType: 'prerequisite', confidence: 0.98, source: 'curated' },
  { subject: 'Mathematics', topic: 'Factorization', dependsOnTopic: 'Equations', relationshipType: 'supports', confidence: 0.92, source: 'curated' },
  { subject: 'Biology', topic: 'Photosynthesis', dependsOnTopic: 'Cell basics', relationshipType: 'prerequisite', confidence: 0.91, source: 'curated' },
  { subject: 'Biology', topic: 'Photosynthesis', dependsOnTopic: 'Respiration', relationshipType: 'often_confused_with', confidence: 0.88, source: 'curated' },
  { subject: 'Physics', topic: 'Force', dependsOnTopic: 'Motion', relationshipType: 'prerequisite', confidence: 0.95, source: 'curated' },
  { subject: 'Chemistry', topic: 'Chemical reactions', dependsOnTopic: 'Atoms and structure', relationshipType: 'prerequisite', confidence: 0.9, source: 'curated' },
];

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
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

function toDateKey(value: Date = new Date()): string {
  const year = value.getUTCFullYear();
  const month = String(value.getUTCMonth() + 1).padStart(2, '0');
  const day = String(value.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDateInput(value?: string | null): Date | null {
  if (!safeString(value).trim()) return null;
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function parseDailyFeedStatus(value: unknown): DailyFeedItemStatus {
  const status = safeString(value).trim();
  if (status === 'in_progress' || status === 'completed' || status === 'skipped') return status;
  return 'pending';
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asNumber(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
}

function scoreEvidenceHeuristically(args: {
  responseText?: string | null;
  responseTimeSec?: number | null;
  action: RecordDailyFeedInteractionArgs['action'];
}) {
  const text = safeString(args.responseText).trim();
  const responseTime = Number(args.responseTimeSec || 0) || 0;
  const hasReasoningCue = /\b(because|therefore|so that|first|then|next|finally|reason)\b/i.test(text);
  const hasStepStructure = /\b1[\).\s]|2[\).\s]|first\b|second\b|step\b/i.test(text) || text.includes('\n');
  const tooShort = text.length > 0 && text.length < 14;
  const rapidGuess = responseTime > 0 && responseTime < 6;
  const base = args.action === 'complete' ? 0.55 : args.action === 'submit' ? 0.48 : 0.35;
  const score =
    base +
    (hasReasoningCue ? 0.22 : 0) +
    (hasStepStructure ? 0.16 : 0) +
    (tooShort ? -0.28 : 0) +
    (rapidGuess ? -0.22 : 0) +
    (responseTime >= 14 ? 0.06 : 0);
  return {
    evidenceScore: Number(clampNumber(score, 0, 1).toFixed(3)),
    rapidGuess,
  };
}

async function scoreEvidenceFromResponse(args: {
  responseText?: string | null;
  responseTimeSec?: number | null;
  action: RecordDailyFeedInteractionArgs['action'];
  itemType?: DailyFeedItemType | null;
}) {
  const heuristic = scoreEvidenceHeuristically(args);
  const text = safeString(args.responseText).trim();
  const shouldUseSemanticModel =
    Boolean(semanticScoringClient) &&
    (args.action === 'submit' || args.action === 'complete') &&
    text.length >= 12;

  if (!shouldUseSemanticModel || !semanticScoringClient) {
    return {
      ...heuristic,
      semanticScore: null as number | null,
      semanticConfidence: null as number | null,
      semanticFlags: [] as string[],
      reasoningSignals: [] as string[],
      modelAssisted: false,
    };
  }

  const semanticPromise = semanticScoringClient.chat.completions
    .create({
      model: DAILY_FEED_SEMANTIC_MODEL,
      temperature: 0,
      max_tokens: 220,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Score short student evidence for learning integrity. Return strict JSON only with keys: semanticScore (0..1), confidence (0..1), integrityFlags (array of short strings), reasoningSignals (array of short strings).',
        },
        {
          role: 'user',
          content: JSON.stringify({
            action: args.action,
            itemType: args.itemType || null,
            responseTimeSec: args.responseTimeSec ?? null,
            responseText: text,
            rubric: {
              high_quality: ['clear reasoning', 'step logic', 'self-correction', 'method justification'],
              weak_quality: ['very short answer', 'pattern copy', 'no reasoning'],
              integrity_risks: ['rapid_guess', 'non-responsive', 'template_without_reasoning'],
            },
          }),
        },
      ],
    })
    .then((response) => safeString(response.choices?.[0]?.message?.content))
    .catch(() => '');

  const semanticRaw = await Promise.race<string | null>([
    semanticPromise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), 2600)),
  ]);

  const semanticParsed = semanticRaw
    ? parseJsonValue<Record<string, unknown> | null>(semanticRaw, null)
    : null;
  const semanticScore = semanticParsed
    ? clampNumber(Number(asNumber(semanticParsed.semanticScore) ?? heuristic.evidenceScore), 0, 1)
    : null;
  const semanticConfidence = semanticParsed
    ? clampNumber(Number(asNumber(semanticParsed.confidence) ?? 0.5), 0, 1)
    : null;
  const semanticFlags = semanticParsed
    ? (Array.isArray(semanticParsed.integrityFlags) ? semanticParsed.integrityFlags : [])
        .map((flag) => safeString(flag).trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];
  const reasoningSignals = semanticParsed
    ? (Array.isArray(semanticParsed.reasoningSignals) ? semanticParsed.reasoningSignals : [])
        .map((signal) => safeString(signal).trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  const flaggedRapidGuess = semanticFlags.some((flag) => /rapid|guess|copy|non-responsive/i.test(flag));
  const blendedScore = semanticScore == null
    ? heuristic.evidenceScore
    : clampNumber(
        heuristic.evidenceScore * 0.5 +
          semanticScore * 0.5 +
          (reasoningSignals.length >= 2 ? 0.03 : 0) -
          (flaggedRapidGuess ? 0.08 : 0),
        0,
        1
      );

  return {
    evidenceScore: Number(blendedScore.toFixed(3)),
    rapidGuess: heuristic.rapidGuess || flaggedRapidGuess,
    semanticScore: semanticScore == null ? null : Number(semanticScore.toFixed(3)),
    semanticConfidence: semanticConfidence == null ? null : Number(semanticConfidence.toFixed(3)),
    semanticFlags,
    reasoningSignals,
    modelAssisted: semanticScore != null,
  };
}

function normalizeSubject(subject?: string | null, topic?: string | null): string | null {
  const raw = safeString(subject || '').trim();
  if (raw) return raw;
  const lower = safeString(topic || '').toLowerCase();
  if (!lower) return null;
  if (/\b(algebra|equation|fraction|ratio|geometry|trigonometry|simultaneous|calculus|math|mathematics|percentage|probability)\b/.test(lower)) return 'Mathematics';
  if (/\b(chemistry|atom|molecule|acid|base|reaction|periodic)\b/.test(lower)) return 'Chemistry';
  if (/\b(physics|force|motion|electric|velocity|acceleration|energy)\b/.test(lower)) return 'Physics';
  if (/\b(biology|cell|photosynthesis|genetics|ecosystem|respiration|osmosis)\b/.test(lower)) return 'Biology';
  if (/\b(english|grammar|comprehension|essay|poem|literature)\b/.test(lower)) return 'English';
  if (/\b(quran|surah|ayah|hadith|fiqh|seerah|sirah|tajweed|dua|salah|wudu|wudhu|akhlaq|aqeedah|islam)\b/.test(lower)) return 'Islamic Studies';
  return null;
}

function getSubjectStrategy(subject?: string | null) {
  const normalized = normalizeKey(subject || '');
  if (['mathematics', 'physics', 'chemistry'].includes(normalized)) {
    return { mode: 'step_by_step', weakAction: 'Revisit the exact step, then try one similar question.', goalType: 'review_formulas' as StudyGoalType };
  }
  if (normalized === 'english') {
    return { mode: 'language', weakAction: 'Restate the idea in simple words, then check the key words.', goalType: 'practise_topic' as StudyGoalType };
  }
  return { mode: 'conceptual', weakAction: 'Recall the main idea, then explain it in your own words.', goalType: 'revisit_weak_topic' as StudyGoalType };
}

function pickReflectionPrompt(subject?: string | null, topic?: string | null): string {
  const strategy = getSubjectStrategy(subject || null);
  if (strategy.mode === 'step_by_step') {
    return `${STEADFAST_METACOGNITIVE_PROMPTS.afterMistake[0]}${topic ? ` Start with ${topic}.` : ''}`;
  }
  if (strategy.mode === 'language') {
    return `${STEADFAST_METACOGNITIVE_PROMPTS.afterSuccess[0]}${topic ? ` Use ${topic} if it helps.` : ''}`;
  }
  return `${STEADFAST_METACOGNITIVE_PROMPTS.beforeSolving[1]}${topic ? ` Think about ${topic}.` : ''}`;
}

function buildPlanSummary(args: {
  weakTopics: WeakTopicSignal[];
  subject?: string | null;
  dueCount: number;
}): string {
  if (args.weakTopics.length > 0) {
    const focus = args.weakTopics.slice(0, 3).map((entry) => entry.topic).join(', ');
    return `Focus on ${focus}. Start with one calm review block, then finish with a short practice check.`;
  }
  if (args.dueCount > 0) {
    return 'Clear the due revision items first, then explain one key idea in your own words.';
  }
  return 'Keep this plan simple: revisit one saved idea, practise once, and note what to remember next time.';
}

function buildRecommendedStudyBlocks(args: {
  weakTopics: WeakTopicSignal[];
  dueCount: number;
  subject?: string | null;
}): string[] {
  const leadTopic = args.weakTopics[0]?.topic || args.subject || 'this topic';
  return [
    `Orient: say what ${leadTopic} is asking you to notice or remember.`,
    args.dueCount > 0
      ? `Try: review ${Math.min(4, Math.max(1, args.dueCount))} due revision item${args.dueCount === 1 ? '' : 's'} without rushing.`
      : `Try: revisit ${leadTopic} in one short, calm study block.`,
    `Reflect: ${pickReflectionPrompt(args.subject, leadTopic)}`,
    'Practice: finish with one short recall check or one similar question.',
  ];
}

function buildStudyPlanMetadata(args: {
  subject?: string | null;
  topic?: string | null;
  weakTopics: WeakTopicSignal[];
  dueCount: number;
  needsAttentionCount: number;
  examFocus?: boolean;
}) {
  return {
    examFocus: Boolean(args.examFocus),
    queueCounts: { due: args.dueCount, needsAttention: args.needsAttentionCount },
    steadfast: {
      northStar: STEADFAST_FOUNDER_NORTH_STAR,
      learningRhythm: [...STEADFAST_LEARNING_RHYTHM],
      reflectionPrompt: pickReflectionPrompt(args.subject, args.topic || args.weakTopics[0]?.topic || null),
      focusTone: 'calm_guided_effort',
    },
  };
}

function mapStudyPlanRow(row: any): StudyPlan {
  return {
    id: safeString(row.id),
    userId: safeString(row.userId),
    title: safeString(row.title),
    scope: safeString(row.scope) as StudyPlanScope,
    subject: safeString(row.subject).trim() || null,
    topic: safeString(row.topic).trim() || null,
    subjects: parseJsonValue<string[] | null>(row.subjects, null),
    dateRangeStart: row.dateRangeStart ? new Date(row.dateRangeStart).toISOString() : null,
    dateRangeEnd: row.dateRangeEnd ? new Date(row.dateRangeEnd).toISOString() : null,
    summary: safeString(row.summary).trim() || null,
    focusAreas: parseJsonValue<string[] | null>(row.focusAreas, null),
    recommendedBlocks: parseJsonValue<string[] | null>(row.recommendedBlocks, null),
    suggestedCollectionIds: parseJsonValue<string[] | null>(row.suggestedCollectionIds, null),
    suggestedItemIds: parseJsonValue<string[] | null>(row.suggestedItemIds, null),
    metadata: parseJsonValue<Record<string, unknown> | null>(row.metadata, null),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function mapStudyGoalRow(row: any): StudyGoal {
  return {
    id: safeString(row.id),
    userId: safeString(row.userId),
    studyPlanId: safeString(row.studyPlanId).trim() || null,
    title: safeString(row.title),
    description: safeString(row.description).trim() || null,
    goalType: safeString(row.goalType) as StudyGoalType,
    targetCount: row.targetCount == null ? null : Number(row.targetCount),
    currentCount: Number(row.currentCount || 0),
    status: safeString(row.status) as StudyGoalStatus,
    subject: safeString(row.subject).trim() || null,
    topic: safeString(row.topic).trim() || null,
    dueAt: row.dueAt ? new Date(row.dueAt).toISOString() : null,
    metadata: parseJsonValue<Record<string, unknown> | null>(row.metadata, null),
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

export async function ensureStudySupportTables() {
  if (!ensureStudySupportTablesPromise) {
    ensureStudySupportTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "StudyPlan" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "scope" TEXT NOT NULL,
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "subjects" JSONB NULL,
          "dateRangeStart" TIMESTAMP(3) NULL,
          "dateRangeEnd" TIMESTAMP(3) NULL,
          "summary" TEXT NULL,
          "focusAreas" JSONB NULL,
          "recommendedBlocks" JSONB NULL,
          "suggestedCollectionIds" JSONB NULL,
          "suggestedItemIds" JSONB NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StudyPlan_userId_updatedAt_idx" ON "StudyPlan" ("userId", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "StudyGoal" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "studyPlanId" TEXT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT NULL,
          "goalType" TEXT NOT NULL,
          "targetCount" INTEGER NULL,
          "currentCount" INTEGER NOT NULL DEFAULT 0,
          "status" TEXT NOT NULL DEFAULT 'not_started',
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "dueAt" TIMESTAMP(3) NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StudyGoal_userId_updatedAt_idx" ON "StudyGoal" ("userId", "updatedAt" DESC);`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "StudyGoal_studyPlanId_idx" ON "StudyGoal" ("studyPlanId");`);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "DailyFeedProgress" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "feedDate" DATE NOT NULL,
          "feedItemId" TEXT NOT NULL,
          "itemType" TEXT NOT NULL,
          "status" TEXT NOT NULL DEFAULT 'pending',
          "actionCount" INTEGER NOT NULL DEFAULT 0,
          "completionCount" INTEGER NOT NULL DEFAULT 0,
          "rapidGuessCount" INTEGER NOT NULL DEFAULT 0,
          "lastResponseSec" DOUBLE PRECISION NULL,
          "evidenceScore" DOUBLE PRECISION NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(
        `CREATE UNIQUE INDEX IF NOT EXISTS "DailyFeedProgress_userId_feedDate_feedItemId_uidx" ON "DailyFeedProgress" ("userId", "feedDate", "feedItemId");`
      );
      await prisma.$executeRawUnsafe(
        `CREATE INDEX IF NOT EXISTS "DailyFeedProgress_userId_feedDate_idx" ON "DailyFeedProgress" ("userId", "feedDate");`
      );
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "InterventionEffectEvent" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "sessionId" TEXT NULL,
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "interventionType" TEXT NOT NULL,
          "relatedRevisionItemId" TEXT NULL,
          "outcome" TEXT NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "InterventionEffectEvent_userId_createdAt_idx" ON "InterventionEffectEvent" ("userId", "createdAt" DESC);`);
    })().catch((error) => {
      ensureStudySupportTablesPromise = null;
      throw error;
    });
  }
  return ensureStudySupportTablesPromise;
}

async function fetchStudyPlanGoals(userId: string, studyPlanId: string): Promise<StudyGoal[]> {
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT *
      FROM "StudyGoal"
      WHERE "userId" = $1
        AND "studyPlanId" = $2
      ORDER BY "updatedAt" DESC, "createdAt" DESC
    `,
    userId,
    studyPlanId
  );
  return rows.map(mapStudyGoalRow);
}

function deriveWeakTopicReason(args: {
  dueCount: number;
  mistakeCount: number;
  struggleCount: number;
  stillLearningCount: number;
  itemCount: number;
}) {
  if (args.mistakeCount > 0) return 'This topic has saved misconceptions or correction notes.';
  if (args.struggleCount > 0) return 'This topic has repeated struggle during revision.';
  if (args.dueCount > 1) return 'Several items here are due for another review.';
  if (args.stillLearningCount > 0) return 'This topic still has items marked as still learning.';
  return 'This topic needs another revision pass.';
}

export async function getWeakTopics(userId: string, subjectFilter?: string): Promise<WeakTopicSignal[]> {
  const items = await fetchUserRevisionItems(userId, 220);
  const filtered = items.filter((item) =>
    !subjectFilter || normalizeKey(item.subject || '') === normalizeKey(subjectFilter)
  );
  const grouped = new Map<string, typeof filtered>();
  for (const item of filtered) {
    const label = safeString(item.topic || item.title).trim();
    if (!label) continue;
    const key = normalizeKey(`${item.subject || ''} ${label}`);
    const bucket = grouped.get(key) || [];
    bucket.push(item);
    grouped.set(key, bucket);
  }

  return [...grouped.values()]
    .map((bucket) => {
      const first = bucket[0];
      const dueCount = bucket.filter((item) => item.reviewStatus === 'review_due' || item.reviewStatus === 'needs_attention').length;
      const mistakeCount = bucket.filter((item) => item.isMistakeBased).length;
      const stillLearningCount = bucket.filter((item) => item.mastery === 'still_learning').length;
      const struggleCount = bucket.reduce((sum, item) => sum + Number(item.struggleCount || 0), 0);
      const successCount = bucket.reduce((sum, item) => sum + Number(item.successCount || 0), 0);
      const weaknessScore =
        struggleCount * 2 +
        dueCount * 1.6 +
        mistakeCount * 2.2 +
        stillLearningCount * 1.2 +
        bucket.length * 0.4 -
        successCount * 0.5;
      return {
        topic: first.topic || first.title,
        subject: first.subject || normalizeSubject(null, first.topic || first.title),
        weaknessScore: Number(weaknessScore.toFixed(2)),
        evidenceCount: bucket.length,
        lastSeenAt: bucket[0]?.updatedAt || null,
        improving: successCount > struggleCount && successCount > 0,
        reason: deriveWeakTopicReason({
          dueCount,
          mistakeCount,
          struggleCount,
          stillLearningCount,
          itemCount: bucket.length,
        }),
        suggestedNextAction: getSubjectStrategy(first.subject).weakAction,
      } satisfies WeakTopicSignal;
    })
    .filter((entry) => entry.weaknessScore > 0.8)
    .sort((a, b) => b.weaknessScore - a.weaknessScore || b.evidenceCount - a.evidenceCount)
    .slice(0, 8);
}

function deriveGoalTemplates(args: {
  scope: StudyPlanScope;
  subject?: string | null;
  weakTopics: WeakTopicSignal[];
  dueCount: number;
}) {
  const templates: Array<{
    title: string;
    description: string;
    goalType: StudyGoalType;
    targetCount: number;
    subject?: string | null;
    topic?: string | null;
  }> = [];
  const leadTopic = args.weakTopics[0];
  if (args.dueCount > 0) {
    templates.push({
      title: `Review ${Math.min(4, Math.max(2, args.dueCount))} due items`,
      description: 'Clear the items that are ready for another revision pass.',
      goalType: 'revise_due_items',
      targetCount: Math.min(4, Math.max(2, args.dueCount)),
      subject: args.subject || leadTopic?.subject || null,
    });
  }
  if (leadTopic) {
    templates.push({
      title: `Revisit ${leadTopic.topic}`,
      description: leadTopic.reason || 'Give this weak topic one focused revision session.',
      goalType: 'revisit_weak_topic',
      targetCount: 1,
      subject: leadTopic.subject || null,
      topic: leadTopic.topic,
    });
    templates.push({
      title: `Explain ${leadTopic.topic} back`,
      description: 'Use one short teach-it-back check so the idea sticks and the confusion becomes clearer.',
      goalType: 'practise_topic',
      targetCount: 1,
      subject: leadTopic.subject || null,
      topic: leadTopic.topic,
    });
  }
  if (args.subject && ['Mathematics', 'Physics', 'Chemistry'].includes(args.subject)) {
    templates.push({
      title: `Review key formulas in ${args.subject}`,
      description: 'Keep one short formula practice block in this plan.',
      goalType: 'review_formulas',
      targetCount: 3,
      subject: args.subject,
    });
  }
  return templates.slice(0, 4);
}

async function insertStudyGoals(userId: string, studyPlanId: string, templates: ReturnType<typeof deriveGoalTemplates>) {
  for (const template of templates) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "StudyGoal" (
          "id", "userId", "studyPlanId", "title", "description", "goalType", "targetCount", "currentCount", "status", "subject", "topic", "dueAt", "metadata", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, 0, 'not_started', $8, $9, NULL, CAST($10 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `,
      randomUUID(),
      userId,
      studyPlanId,
      template.title,
      template.description,
      template.goalType,
      template.targetCount,
      template.subject || null,
      template.topic || null,
      JSON.stringify({})
    );
  }
}

export async function createStudyPlan(args: StudyPlanCreateArgs): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
  await ensureStudySupportTables();
  const weakTopics = await getWeakTopics(args.userId, args.subject || undefined);
  const queue = await getRevisionQueue(args.userId, 6);
  const relevantItems = (await fetchUserRevisionItems(args.userId, 60)).filter((item) =>
    !args.subject || normalizeKey(item.subject || '') === normalizeKey(args.subject)
  );
  const focusAreas = weakTopics.slice(0, 3).map((entry) => entry.topic);
  const suggestedItemIds = relevantItems.slice(0, 6).map((item) => item.id);
  const suggestedCollectionIds = [...new Set(relevantItems.map((item) => item.collectionId).filter(Boolean))].slice(0, 4) as string[];
  const subject = args.subject || weakTopics[0]?.subject || null;
  const title =
    args.scope === 'weekly'
      ? `This Week's ${subject || 'Revision'}`
      : args.scope === 'weak_topics'
        ? 'Weak Topic Revision Plan'
        : args.scope === 'exam_focus'
          ? `${subject || 'Exam'} Focus Plan`
          : subject
            ? `${subject} Study Plan`
            : 'Study Plan';
  const summary = buildPlanSummary({
    weakTopics,
    subject,
    dueCount: queue.dueNow.length,
  });
  const recommendedBlocks = buildRecommendedStudyBlocks({
    weakTopics,
    dueCount: queue.dueNow.length,
    subject,
  });

  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "StudyPlan" (
        "id", "userId", "title", "scope", "subject", "topic", "subjects", "dateRangeStart", "dateRangeEnd", "summary", "focusAreas", "recommendedBlocks", "suggestedCollectionIds", "suggestedItemIds", "metadata", "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, CAST($7 AS JSONB), $8, $9, $10, CAST($11 AS JSONB), CAST($12 AS JSONB), CAST($13 AS JSONB), CAST($14 AS JSONB), CAST($15 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `,
    id,
    args.userId,
    title,
    args.scope,
    subject,
    args.topic || null,
    JSON.stringify(args.subjects || (subject ? [subject] : [])),
    new Date().toISOString(),
    new Date(Date.now() + 7 * DAY_MS).toISOString(),
    summary,
    JSON.stringify(focusAreas),
    JSON.stringify(recommendedBlocks),
    JSON.stringify(suggestedCollectionIds),
    JSON.stringify(suggestedItemIds),
    JSON.stringify(buildStudyPlanMetadata({
      subject,
      topic: args.topic || null,
      weakTopics,
      dueCount: queue.dueNow.length,
      needsAttentionCount: queue.needsAttention.length,
      examFocus: args.examFocus,
    }))
  );

  await insertStudyGoals(args.userId, id, deriveGoalTemplates({
    scope: args.scope,
    subject,
    weakTopics,
    dueCount: queue.dueNow.length,
  }));

  const [row] = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "StudyPlan" WHERE "id" = $1 LIMIT 1`, id);
  return { plan: mapStudyPlanRow(row), goals: await fetchStudyPlanGoals(args.userId, id) };
}

export async function getStudyPlans(userId: string, scopes?: StudyPlanScope[]): Promise<StudyPlan[]> {
  await ensureStudySupportTables();
  const rows = scopes && scopes.length > 0
    ? await prisma.$queryRawUnsafe<any[]>(
        `SELECT * FROM "StudyPlan" WHERE "userId" = $1 AND "scope" = ANY($2::text[]) ORDER BY "updatedAt" DESC`,
        userId,
        scopes
      )
    : await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "StudyPlan" WHERE "userId" = $1 ORDER BY "updatedAt" DESC`, userId);
  return rows.map(mapStudyPlanRow);
}

export async function getStudyPlanDetails(userId: string, planId: string): Promise<{ plan: StudyPlan; goals: StudyGoal[] } | null> {
  await ensureStudySupportTables();
  const [row] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudyPlan" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    planId,
    userId
  );
  if (!row) return null;
  return { plan: mapStudyPlanRow(row), goals: await fetchStudyPlanGoals(userId, planId) };
}

export async function getStudyGoals(userId: string): Promise<StudyGoal[]> {
  await ensureStudySupportTables();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudyGoal" WHERE "userId" = $1 ORDER BY "updatedAt" DESC, "createdAt" DESC`,
    userId
  );
  return rows.map(mapStudyGoalRow);
}

export async function updateStudyGoal(args: UpdateStudyGoalArgs): Promise<StudyGoal | null> {
  await ensureStudySupportTables();
  const assignments: string[] = [];
  const values: unknown[] = [];
  let parameterIndex = 3;
  if (args.patch.status) {
    assignments.push(`"status" = $${parameterIndex}`);
    values.push(args.patch.status);
    parameterIndex += 1;
  }
  if (typeof args.patch.currentCount === 'number') {
    assignments.push(`"currentCount" = $${parameterIndex}`);
    values.push(Math.max(0, args.patch.currentCount));
    parameterIndex += 1;
  }
  if (assignments.length === 0) {
    const [existing] = await prisma.$queryRawUnsafe<any[]>(
      `SELECT * FROM "StudyGoal" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
      args.goalId,
      args.userId
    );
    return existing ? mapStudyGoalRow(existing) : null;
  }
  assignments.push(`"updatedAt" = CURRENT_TIMESTAMP`);
  await prisma.$executeRawUnsafe(
    `
      UPDATE "StudyGoal"
      SET ${assignments.join(', ')}
      WHERE "id" = $1
        AND "userId" = $2
    `,
    args.goalId,
    args.userId,
    ...values
  );
  const [row] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudyGoal" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    args.goalId,
    args.userId
  );
  return row ? mapStudyGoalRow(row) : null;
}

export async function updateStudyPlan(args: UpdateStudyPlanArgs): Promise<{ plan: StudyPlan; goals: StudyGoal[] } | null> {
  await ensureStudySupportTables();
  const [existingRow] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudyPlan" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    args.planId,
    args.userId
  );
  if (!existingRow) return null;
  const existingPlan = mapStudyPlanRow(existingRow);
  const assignments: string[] = [];
  const values: unknown[] = [];
  let parameterIndex = 3;

  if (safeString(args.patch.title).trim()) {
    assignments.push(`"title" = $${parameterIndex}`);
    values.push(safeString(args.patch.title).trim());
    parameterIndex += 1;
  }
  if (args.patch.summary !== undefined) {
    assignments.push(`"summary" = $${parameterIndex}`);
    values.push(safeString(args.patch.summary || '').trim() || null);
    parameterIndex += 1;
  }
  if (args.patch.subject !== undefined) {
    assignments.push(`"subject" = $${parameterIndex}`);
    values.push(safeString(args.patch.subject || '').trim() || null);
    parameterIndex += 1;
  }
  if (args.patch.topic !== undefined) {
    assignments.push(`"topic" = $${parameterIndex}`);
    values.push(safeString(args.patch.topic || '').trim() || null);
    parameterIndex += 1;
  }
  if (args.patch.subjects !== undefined) {
    assignments.push(`"subjects" = CAST($${parameterIndex} AS JSONB)`);
    values.push(JSON.stringify((args.patch.subjects || []).map((entry) => safeString(entry).trim()).filter(Boolean)));
    parameterIndex += 1;
  }
  if (args.patch.focusAreas !== undefined) {
    assignments.push(`"focusAreas" = CAST($${parameterIndex} AS JSONB)`);
    values.push(JSON.stringify((args.patch.focusAreas || []).map((entry) => safeString(entry).trim()).filter(Boolean)));
    parameterIndex += 1;
  }
  if (args.patch.recommendedBlocks !== undefined) {
    assignments.push(`"recommendedBlocks" = CAST($${parameterIndex} AS JSONB)`);
    values.push(JSON.stringify((args.patch.recommendedBlocks || []).map((entry) => safeString(entry).trim()).filter(Boolean)));
    parameterIndex += 1;
  }
  if (args.patch.dateRangeStart !== undefined) {
    const startDate = parseDateInput(args.patch.dateRangeStart || null);
    assignments.push(`"dateRangeStart" = $${parameterIndex}`);
    values.push(startDate ? startDate.toISOString() : null);
    parameterIndex += 1;
  }
  if (args.patch.dateRangeEnd !== undefined) {
    const endDate = parseDateInput(args.patch.dateRangeEnd || null);
    assignments.push(`"dateRangeEnd" = $${parameterIndex}`);
    values.push(endDate ? endDate.toISOString() : null);
    parameterIndex += 1;
  }
  if (args.patch.metadataPatch !== undefined) {
    const mergedMetadata = {
      ...(existingPlan.metadata || {}),
      ...(args.patch.metadataPatch || {}),
    };
    assignments.push(`"metadata" = CAST($${parameterIndex} AS JSONB)`);
    values.push(JSON.stringify(mergedMetadata));
    parameterIndex += 1;
  }

  if (assignments.length === 0) {
    return { plan: existingPlan, goals: await fetchStudyPlanGoals(args.userId, args.planId) };
  }
  assignments.push(`"updatedAt" = CURRENT_TIMESTAMP`);

  await prisma.$executeRawUnsafe(
    `
      UPDATE "StudyPlan"
      SET ${assignments.join(', ')}
      WHERE "id" = $1
        AND "userId" = $2
    `,
    args.planId,
    args.userId,
    ...values
  );

  const [row] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudyPlan" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    args.planId,
    args.userId
  );
  if (!row) return null;
  return { plan: mapStudyPlanRow(row), goals: await fetchStudyPlanGoals(args.userId, args.planId) };
}

export async function setStudyPlanLifecycle(args: {
  userId: string;
  planId: string;
  lifecycle: StudyPlanLifecycleStatus;
}): Promise<{ plan: StudyPlan; goals: StudyGoal[] } | null> {
  const metadataPatch = {
    lifecycle: args.lifecycle,
    lifecycleUpdatedAt: new Date().toISOString(),
    ...(args.lifecycle === 'active' ? { resumedAt: new Date().toISOString() } : {}),
    ...(args.lifecycle === 'paused' ? { pausedAt: new Date().toISOString() } : {}),
    ...(args.lifecycle === 'completed' ? { completedAt: new Date().toISOString() } : {}),
  };
  return updateStudyPlan({
    userId: args.userId,
    planId: args.planId,
    patch: { metadataPatch },
  });
}

export async function createStudyPlanGoal(args: CreateStudyPlanGoalArgs): Promise<StudyGoal | null> {
  await ensureStudySupportTables();
  const [plan] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudyPlan" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    args.planId,
    args.userId
  );
  if (!plan) return null;
  const goalId = randomUUID();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "StudyGoal" (
        "id", "userId", "studyPlanId", "title", "description", "goalType", "targetCount", "currentCount", "status", "subject", "topic", "dueAt", "metadata", "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, 0, 'not_started', $8, $9, $10, CAST($11 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `,
    goalId,
    args.userId,
    args.planId,
    limitText(args.title, 140) || 'Plan milestone',
    limitText(safeString(args.description || ''), 320) || null,
    args.goalType,
    args.targetCount == null ? null : Math.max(1, Math.round(args.targetCount)),
    safeString(args.subject || '').trim() || null,
    safeString(args.topic || '').trim() || null,
    parseDateInput(args.dueAt || null)?.toISOString() || null,
    JSON.stringify(args.metadata || {})
  );
  const [goalRow] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudyGoal" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    goalId,
    args.userId
  );
  return goalRow ? mapStudyGoalRow(goalRow) : null;
}

export async function completeStudyGoal(args: CompleteStudyGoalArgs): Promise<StudyGoal | null> {
  await ensureStudySupportTables();
  const [goalRow] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudyGoal" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    args.goalId,
    args.userId
  );
  if (!goalRow) return null;
  const goal = mapStudyGoalRow(goalRow);
  const targetCount = Math.max(goal.currentCount, Math.max(1, Number(goal.targetCount || 1)));
  const metadata = {
    ...(goal.metadata || {}),
    completedAt: new Date().toISOString(),
    completionNote: safeString(args.completionNote || '').trim() || null,
  };
  await prisma.$executeRawUnsafe(
    `
      UPDATE "StudyGoal"
      SET "status" = 'completed',
          "currentCount" = $3,
          "metadata" = CAST($4 AS JSONB),
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $1
        AND "userId" = $2
    `,
    args.goalId,
    args.userId,
    targetCount,
    JSON.stringify(metadata)
  );
  const [updatedRow] = await prisma.$queryRawUnsafe<any[]>(
    `SELECT * FROM "StudyGoal" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    args.goalId,
    args.userId
  );
  return updatedRow ? mapStudyGoalRow(updatedRow) : null;
}

export async function generateAdaptiveStudyPlan(args: GenerateAdaptiveStudyPlanArgs): Promise<{ plan: StudyPlan; goals: StudyGoal[] }> {
  await ensureStudySupportTables();
  const effectiveScope = args.scope || 'weekly';
  const weakTopics = await getWeakTopics(args.userId, args.subject || undefined);
  const queue = await getRevisionQueue(args.userId, 8);
  const revisionItems = await fetchUserRevisionItems(args.userId, 100);
  const subject = args.subject || weakTopics[0]?.subject || normalizeSubject(null, args.topic || args.goal || null) || null;
  const effectiveWeakAreas = (args.weakAreas || [])
    .map((entry) => safeString(entry).trim())
    .filter(Boolean);
  const focusAreas =
    effectiveWeakAreas.length > 0
      ? effectiveWeakAreas.slice(0, 5)
      : weakTopics.slice(0, 5).map((entry) => entry.topic);
  const preferredSupportStyle = safeString(args.preferredSupportStyle || '').trim() || null;
  const strengths = (args.strengths || []).map((entry) => safeString(entry).trim()).filter(Boolean).slice(0, 5);
  const minutesPerDay = clampNumber(Math.round(Number(args.availableMinutesPerDay || 35) || 35), 15, 240);
  const examDate = parseDateInput(args.examDate || null);
  const now = new Date();
  const endDate = examDate || new Date(now.getTime() + 14 * DAY_MS);
  const dateRangeEndIso = endDate.toISOString();
  const dateRangeStartIso = now.toISOString();
  const planTitle = [
    subject || 'Learning',
    safeString(args.goal || '').trim() ? `- ${safeString(args.goal).trim()}` : '- Adaptive growth plan',
  ]
    .join(' ')
    .trim();
  const dueNowCount = queue.dueNow.length;
  const summaryParts = [
    focusAreas.length > 0
      ? `Prioritize ${focusAreas.slice(0, 2).join(' and ')} first.`
      : dueNowCount > 0
        ? `Clear ${Math.min(4, dueNowCount)} due revision items first.`
        : 'Keep a short and steady revision rhythm.',
    `Daily study target: ${minutesPerDay} minutes.`,
    preferredSupportStyle ? `Support style: ${preferredSupportStyle}.` : null,
  ].filter(Boolean) as string[];
  const recommendedBlocks = [
    `Warm-up (5 min): recall one key idea from ${focusAreas[0] || subject || 'today'} from memory.`,
    `Focused block (${Math.max(10, Math.round(minutesPerDay * 0.45))} min): work on the weakest target with one worked step.`,
    `Checkpoint (${Math.max(6, Math.round(minutesPerDay * 0.25))} min): solve one similar variant and justify the method.`,
    `Reflection (3 min): write one correction note for tomorrow.`,
  ];
  const relevantItems = revisionItems.filter((item) =>
    !subject || normalizeKey(item.subject || '') === normalizeKey(subject)
  );
  const suggestedItemIds = relevantItems.slice(0, 8).map((item) => item.id);
  const suggestedCollectionIds = [...new Set(relevantItems.map((item) => item.collectionId).filter(Boolean))].slice(0, 5) as string[];
  const planId = randomUUID();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "StudyPlan" (
        "id", "userId", "title", "scope", "subject", "topic", "subjects", "dateRangeStart", "dateRangeEnd", "summary", "focusAreas", "recommendedBlocks", "suggestedCollectionIds", "suggestedItemIds", "metadata", "createdAt", "updatedAt"
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, CAST($7 AS JSONB), $8, $9, $10, CAST($11 AS JSONB), CAST($12 AS JSONB), CAST($13 AS JSONB), CAST($14 AS JSONB), CAST($15 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `,
    planId,
    args.userId,
    limitText(planTitle, 150) || 'Adaptive growth plan',
    effectiveScope,
    subject,
    safeString(args.topic || '').trim() || null,
    JSON.stringify(subject ? [subject] : []),
    dateRangeStartIso,
    dateRangeEndIso,
    limitText(summaryParts.join(' '), 320),
    JSON.stringify(focusAreas),
    JSON.stringify(recommendedBlocks),
    JSON.stringify(suggestedCollectionIds),
    JSON.stringify(suggestedItemIds),
    JSON.stringify({
      lifecycle: 'active',
      generatedBy: 'adaptive_growth_engine',
      generatedAt: new Date().toISOString(),
      gradeLevel: safeString(args.gradeLevel || '').trim() || null,
      goal: safeString(args.goal || '').trim() || null,
      availableMinutesPerDay: minutesPerDay,
      examDate: examDate ? examDate.toISOString() : null,
      strengths,
      weakAreas: focusAreas,
      preferredSupportStyle,
      queueCounts: {
        dueNow: queue.dueNow.length,
        needsAttention: queue.needsAttention.length,
      },
    })
  );

  const adaptiveGoalTemplates: Array<{
    title: string;
    description: string;
    goalType: StudyGoalType;
    targetCount: number;
    subject?: string | null;
    topic?: string | null;
    dueAt?: Date | null;
    metadata?: Record<string, unknown>;
  }> = [];
  if (queue.dueNow.length > 0) {
    adaptiveGoalTemplates.push({
      title: `Clear ${Math.min(4, queue.dueNow.length)} due items`,
      description: "Prevent forgetting by clearing today's due queue first.",
      goalType: 'revise_due_items',
      targetCount: Math.min(4, Math.max(1, queue.dueNow.length)),
      subject,
      dueAt: new Date(now.getTime() + DAY_MS),
      metadata: { source: 'due_now_queue' },
    });
  }
  focusAreas.slice(0, 3).forEach((topicLabel, index) => {
    adaptiveGoalTemplates.push({
      title: `Rebuild ${topicLabel}`,
      description: 'Run one recap, one worked step, and one transfer check.',
      goalType: 'revisit_weak_topic',
      targetCount: 1,
      subject,
      topic: topicLabel,
      dueAt: new Date(now.getTime() + (index + 1) * DAY_MS),
      metadata: { source: 'weak_area', order: index + 1 },
    });
  });
  adaptiveGoalTemplates.push({
    title: 'Checkpoint mini-assessment',
    description: 'Answer one variant question and justify the chosen method.',
    goalType: 'complete_revision_session',
    targetCount: 1,
    subject,
    dueAt: new Date(now.getTime() + 4 * DAY_MS),
    metadata: { evidenceMode: 'best_method_reason' },
  });

  for (const template of adaptiveGoalTemplates.slice(0, 7)) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "StudyGoal" (
          "id", "userId", "studyPlanId", "title", "description", "goalType", "targetCount", "currentCount", "status", "subject", "topic", "dueAt", "metadata", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, 0, 'not_started', $8, $9, $10, CAST($11 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `,
      randomUUID(),
      args.userId,
      planId,
      limitText(template.title, 140),
      limitText(template.description, 320),
      template.goalType,
      Math.max(1, template.targetCount),
      template.subject || null,
      template.topic || null,
      template.dueAt ? template.dueAt.toISOString() : null,
      JSON.stringify(template.metadata || {})
    );
  }

  const [planRow] = await prisma.$queryRawUnsafe<any[]>(`SELECT * FROM "StudyPlan" WHERE "id" = $1 LIMIT 1`, planId);
  return { plan: mapStudyPlanRow(planRow), goals: await fetchStudyPlanGoals(args.userId, planId) };
}

function mapDailyFeedProgressRow(row: any): DailyFeedProgressRecord {
  return {
    id: safeString(row.id),
    userId: safeString(row.userId),
    feedDate: row.feedDate ? toDateKey(new Date(row.feedDate)) : toDateKey(),
    feedItemId: safeString(row.feedItemId),
    itemType: safeString(row.itemType) as DailyFeedItemType,
    status: parseDailyFeedStatus(row.status),
    actionCount: Number(row.actionCount || 0),
    completionCount: Number(row.completionCount || 0),
    rapidGuessCount: Number(row.rapidGuessCount || 0),
    lastResponseSec: row.lastResponseSec == null ? null : Number(row.lastResponseSec),
    evidenceScore: row.evidenceScore == null ? null : Number(row.evidenceScore),
    metadata: parseJsonValue<Record<string, unknown> | null>(row.metadata, null),
    createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: row.updatedAt ? new Date(row.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function getDailyFeedRecommendation(args: {
  rapidGuessSignals: number;
  lowEvidenceSignals: number;
  averageResponseSec: number | null;
}) {
  if (args.rapidGuessSignals >= 2) return 'Slow down one step: explain your method in one sentence before submitting.';
  if (args.lowEvidenceSignals >= 2) return 'Use one reason word (because/therefore) in each answer to strengthen evidence.';
  if (args.averageResponseSec != null && args.averageResponseSec > 45)
    return 'Time is high today. Try one easier recap first, then return to the harder item.';
  return 'Keep this pace: short reasoning plus one transfer question gives strong evidence.';
}

function buildDailyFeedFallbackItems(): DailyFeedItem[] {
  return [
    {
      id: 'daily-fallback-1',
      type: 'due_now_recap',
      title: 'Run one due-now recap',
      subject: null,
      topic: null,
      reasonToday: 'A due-now item protects memory better than starting with new content.',
      estimatedMinutes: 6,
      nextActionLabel: 'Do now',
      evidenceMode: 'short_reasoning',
      status: 'pending',
    },
    {
      id: 'daily-fallback-2',
      type: 'momentum_item',
      title: 'Finish with one momentum item',
      subject: null,
      topic: null,
      reasonToday: 'A quick finish makes consistency easier tomorrow.',
      estimatedMinutes: 4,
      nextActionLabel: 'Do now',
      evidenceMode: 'problem_variant_transfer',
      status: 'pending',
    },
  ];
}

export async function getGrowthDailyFeed(userId: string): Promise<DailyFeedSnapshot> {
  await ensureStudySupportTables();
  const [queue, weakTopics, revisionItems, plans, goals, mediaAssets] = await Promise.all([
    getRevisionQueue(userId, 12),
    getWeakTopics(userId),
    fetchUserRevisionItems(userId, 220),
    getStudyPlans(userId),
    getStudyGoals(userId),
    listMediaAssets({ userId, limit: 30, sortBy: 'recommended' }).catch(() => []),
  ]);

  const dateKey = toDateKey();
  const nextItems: DailyFeedItem[] = [];
  const addItem = (item: DailyFeedItem | null) => {
    if (!item) return;
    if (nextItems.some((entry) => entry.id === item.id)) return;
    nextItems.push(item);
  };

  const dueNow = queue.dueNow[0] || null;
  if (dueNow) {
    addItem({
      id: `due-${dueNow.id}`,
      type: 'due_now_recap',
      title: dueNow.title,
      subject: dueNow.subject || null,
      topic: dueNow.topic || dueNow.subtopic || null,
      reasonToday: 'This is due now based on spaced revision timing.',
      estimatedMinutes: 6,
      nextActionLabel: 'Review recap',
      evidenceMode: 'short_reasoning',
      targetRevisionItemId: dueNow.id,
      status: 'pending',
    });
  }

  const weakTopic = weakTopics[0] || null;
  if (weakTopic) {
    addItem({
      id: `weak-${normalizeKey(`${weakTopic.subject || ''}:${weakTopic.topic}`)}`,
      type: 'weak_topic_review',
      title: weakTopic.topic,
      subject: weakTopic.subject || null,
      topic: weakTopic.topic,
      reasonToday: weakTopic.reason || 'This area has recurring confusion signals.',
      estimatedMinutes: 9,
      nextActionLabel: 'Work on this',
      evidenceMode: 'step_ordering',
      status: 'pending',
    });
  }

  const similarPractice = revisionItems.find(
    (item) =>
      item.reviewStatus === 'review_due' ||
      item.reviewStatus === 'practising' ||
      item.needsPractice ||
      item.recentOutcome === 'partial'
  );
  if (similarPractice) {
    addItem({
      id: `similar-${similarPractice.id}`,
      type: 'similar_practice',
      title: `Similar practice: ${similarPractice.title}`,
      subject: similarPractice.subject || null,
      topic: similarPractice.topic || similarPractice.subtopic || null,
      reasonToday: 'Transfer practice helps you prove the concept beyond one memorized example.',
      estimatedMinutes: 8,
      nextActionLabel: 'Do now',
      evidenceMode: 'problem_variant_transfer',
      targetRevisionItemId: similarPractice.id,
      status: 'pending',
    });
  }

  const mistakeItem = revisionItems.find(
    (item) => item.isMistakeBased || item.reviewStatus === 'needs_attention' || item.recentOutcome === 'struggled'
  );
  if (mistakeItem) {
    addItem({
      id: `mistake-${mistakeItem.id}`,
      type: 'mistake_revisit',
      title: `Mistake revisit: ${mistakeItem.title}`,
      subject: mistakeItem.subject || null,
      topic: mistakeItem.topic || mistakeItem.subtopic || null,
      reasonToday: 'Repeated mistake patterns are easier to fix when revisited early.',
      estimatedMinutes: 7,
      nextActionLabel: 'Work on this',
      evidenceMode: 'why_wrong',
      targetRevisionItemId: mistakeItem.id,
      status: 'pending',
    });
  }

  const activeGoal = goals.find((goal) => goal.status !== 'completed' && goal.status !== 'paused');
  if (activeGoal) {
    addItem({
      id: `plan-${activeGoal.id}`,
      type: 'plan_milestone',
      title: activeGoal.title,
      subject: activeGoal.subject || null,
      topic: activeGoal.topic || null,
      reasonToday: 'This milestone is part of your active study plan.',
      estimatedMinutes: 10,
      nextActionLabel: 'Continue plan',
      evidenceMode: 'best_method_reason',
      targetStudyPlanId: activeGoal.studyPlanId || null,
      targetStudyGoalId: activeGoal.id,
      status: 'pending',
    });
  }

  const mediaBoost = mediaAssets.find((asset) =>
    Boolean(
      safeString(asset.recapText).trim() ||
      safeString(asset.summary).trim() ||
      (Array.isArray(asset.keyPoints) && asset.keyPoints.length > 0)
    )
  );
  if (mediaBoost) {
    addItem({
      id: `media-${mediaBoost.id}`,
      type: 'media_recap_boost',
      title: mediaBoost.title,
      subject: mediaBoost.subject || null,
      topic: mediaBoost.topic || null,
      reasonToday: 'A recap boost helps stabilize understanding before harder practice.',
      estimatedMinutes: Math.max(4, Math.min(12, Math.round((mediaBoost.durationSec || 240) / 60))),
      nextActionLabel: 'Review recap',
      evidenceMode: 'short_reasoning',
      targetMediaAssetId: mediaBoost.id,
      targetRevisionItemId: mediaBoost.revisionItemId || null,
      status: 'pending',
    });
  }

  const momentumItem = queue.recentlyImproved[0] || revisionItems.find((item) => item.mastery === 'confident');
  if (momentumItem) {
    addItem({
      id: `momentum-${momentumItem.id}`,
      type: 'momentum_item',
      title: momentumItem.title,
      subject: momentumItem.subject || null,
      topic: momentumItem.topic || momentumItem.subtopic || null,
      reasonToday: 'Ending with a momentum item improves consistency and confidence.',
      estimatedMinutes: 5,
      nextActionLabel: 'Do now',
      evidenceMode: 'best_method_reason',
      targetRevisionItemId: momentumItem.id,
      status: 'pending',
    });
  }

  const feedItems = (nextItems.length > 0 ? nextItems : buildDailyFeedFallbackItems()).slice(0, 8);
  const progressRows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT *
      FROM "DailyFeedProgress"
      WHERE "userId" = $1
        AND "feedDate" = $2::date
    `,
    userId,
    dateKey
  );
  const progressById = new Map(progressRows.map((row) => {
    const mapped = mapDailyFeedProgressRow(row);
    return [mapped.feedItemId, mapped] as const;
  }));
  const mergedItems = feedItems.map((item) => {
    const progress = progressById.get(item.id);
    return {
      ...item,
      status: progress?.status || 'pending',
    };
  });
  const completedCount = mergedItems.filter((item) => item.status === 'completed').length;
  const totalCount = mergedItems.length;
  const rapidGuessSignals = [...progressById.values()].reduce((sum, row) => sum + Number(row.rapidGuessCount || 0), 0);
  const lowEvidenceSignals = [...progressById.values()].filter((row) => Number(row.evidenceScore || 0) > 0 && Number(row.evidenceScore || 0) < 0.38).length;
  const responseTimes = [...progressById.values()].map((row) => Number(row.lastResponseSec || 0)).filter((value) => value > 0);
  const averageResponseSec = responseTimes.length
    ? Number((responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length).toFixed(1))
    : null;
  return {
    dateKey,
    items: mergedItems,
    completedCount,
    totalCount,
    progressPercent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    integritySignals: {
      rapidGuessSignals,
      lowEvidenceSignals,
      averageResponseSec,
      recommendation: getDailyFeedRecommendation({ rapidGuessSignals, lowEvidenceSignals, averageResponseSec }),
    },
  };
}

export async function recordDailyFeedInteraction(args: RecordDailyFeedInteractionArgs): Promise<{
  progress: DailyFeedProgressRecord;
  snapshot: DailyFeedSnapshot;
}> {
  await ensureStudySupportTables();
  const dateKey = toDateKey();
  const [existingRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT *
      FROM "DailyFeedProgress"
      WHERE "userId" = $1
        AND "feedDate" = $2::date
        AND "feedItemId" = $3
      LIMIT 1
    `,
    args.userId,
    dateKey,
    args.feedItemId
  );
  const existing = existingRow ? mapDailyFeedProgressRow(existingRow) : null;
  const normalizedItemType = safeString(args.itemType || existing?.itemType || 'due_now_recap') as DailyFeedItemType;
  const evidence = await scoreEvidenceFromResponse({
    responseText: args.responseText,
    responseTimeSec: args.responseTimeSec,
    action: args.action,
    itemType: normalizedItemType,
  });
  const nextStatus: DailyFeedItemStatus =
    args.action === 'complete'
      ? 'completed'
      : args.action === 'skip'
        ? 'skipped'
        : args.action === 'start' || args.action === 'submit'
          ? 'in_progress'
          : existing?.status || 'in_progress';

  const existingMetadata = asRecord(existing?.metadata);
  const previousFunnel = asRecord(existingMetadata.funnel);
  const stage = args.action === 'open'
    ? 'opened'
    : args.action === 'submit'
      ? 'submitted'
      : args.action === 'complete'
        ? 'completed'
        : null;
  const nextFunnel = {
    opened: Math.max(0, Math.floor(asNumber(previousFunnel.opened) || 0)) + (stage === 'opened' ? 1 : 0),
    submitted: Math.max(0, Math.floor(asNumber(previousFunnel.submitted) || 0)) + (stage === 'submitted' ? 1 : 0),
    completed: Math.max(0, Math.floor(asNumber(previousFunnel.completed) || 0)) + (stage === 'completed' ? 1 : 0),
  };

  const nextMetadata = {
    ...existingMetadata,
    lastAction: args.action,
    lastResponseText: limitText(safeString(args.responseText || ''), 280) || null,
    lastResponseAt: new Date().toISOString(),
    funnel: nextFunnel,
    modelAssistedScoring: evidence.modelAssisted,
    semanticEvidence:
      evidence.semanticScore == null
        ? null
        : {
            score: evidence.semanticScore,
            confidence: evidence.semanticConfidence,
            flags: evidence.semanticFlags,
            reasoningSignals: evidence.reasoningSignals,
            model: DAILY_FEED_SEMANTIC_MODEL,
          },
  };

  if (!existing) {
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO "DailyFeedProgress" (
          "id", "userId", "feedDate", "feedItemId", "itemType", "status", "actionCount", "completionCount", "rapidGuessCount", "lastResponseSec", "evidenceScore", "metadata", "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3::date, $4, $5, $6, 1, $7, $8, $9, $10, CAST($11 AS JSONB), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `,
      randomUUID(),
      args.userId,
      dateKey,
      args.feedItemId,
      normalizedItemType,
      nextStatus,
      args.action === 'complete' ? 1 : 0,
      evidence.rapidGuess ? 1 : 0,
      args.responseTimeSec == null ? null : Math.max(0, Number(args.responseTimeSec)),
      evidence.evidenceScore,
      JSON.stringify(nextMetadata)
    );
  } else {
    await prisma.$executeRawUnsafe(
      `
        UPDATE "DailyFeedProgress"
        SET "status" = $4,
            "actionCount" = "actionCount" + 1,
            "completionCount" = "completionCount" + $5,
            "rapidGuessCount" = "rapidGuessCount" + $6,
            "lastResponseSec" = $7,
            "evidenceScore" = $8,
            "metadata" = CAST($9 AS JSONB),
            "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $1
          AND "userId" = $2
          AND "feedDate" = $3::date
      `,
      existing.id,
      args.userId,
      dateKey,
      nextStatus,
      args.action === 'complete' ? 1 : 0,
      evidence.rapidGuess ? 1 : 0,
      args.responseTimeSec == null ? null : Math.max(0, Number(args.responseTimeSec)),
      evidence.evidenceScore,
      JSON.stringify(nextMetadata)
    );
  }

  const [updatedRow] = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT *
      FROM "DailyFeedProgress"
      WHERE "userId" = $1
        AND "feedDate" = $2::date
        AND "feedItemId" = $3
      LIMIT 1
    `,
    args.userId,
    dateKey,
    args.feedItemId
  );
  const snapshot = await getGrowthDailyFeed(args.userId);
  return {
    progress: mapDailyFeedProgressRow(updatedRow),
    snapshot,
  };
}

export async function recordInterventionEffect(args: RecordInterventionEffectArgs) {
  await ensureStudySupportTables();
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `
      INSERT INTO "InterventionEffectEvent" (
        "id", "userId", "sessionId", "subject", "topic", "interventionType", "relatedRevisionItemId", "outcome", "metadata", "createdAt"
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CAST($9 AS JSONB), CURRENT_TIMESTAMP)
    `,
    id,
    args.userId,
    args.sessionId || null,
    args.subject || null,
    args.topic || null,
    args.interventionType,
    args.relatedRevisionItemId || null,
    args.outcome || null,
    JSON.stringify(args.metadata || {})
  );
  return { id };
}

export async function getInterventionEffectiveness(userId: string): Promise<InterventionEffectivenessSummary[]> {
  await ensureStudySupportTables();
  const rows = await prisma.$queryRawUnsafe<any[]>(
    `
      SELECT
        "interventionType",
        NULLIF(TRIM(COALESCE("subject", '')), '') AS "subject",
        NULLIF(TRIM(COALESCE("topic", '')), '') AS "topic",
        COUNT(*)::int AS "evidenceCount",
        AVG(CASE WHEN "outcome" IN ('improved', 'completed') THEN 1.0 WHEN "outcome" = 'no_change' THEN 0.5 ELSE 0.0 END) AS "improvementRate",
        AVG(
          CASE
            WHEN "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '14 days' AND "outcome" IN ('improved', 'completed') THEN 1.0
            WHEN "createdAt" >= CURRENT_TIMESTAMP - INTERVAL '14 days' AND "outcome" = 'struggled' THEN -1.0
            ELSE 0.0
          END
        ) AS "trendScore"
      FROM "InterventionEffectEvent"
      WHERE "userId" = $1
      GROUP BY 1, 2, 3
      ORDER BY "evidenceCount" DESC, "improvementRate" DESC
      LIMIT 12
    `,
    userId
  );
  return rows.map((row) => ({
    interventionType: safeString(row.interventionType) as InterventionEffectivenessSummary['interventionType'],
    subject: safeString(row.subject).trim() || null,
    topic: safeString(row.topic).trim() || null,
    evidenceCount: Number(row.evidenceCount || 0),
    improvementRate: Number(Number(row.improvementRate || 0).toFixed(2)),
    recentTrend: Number(row.trendScore || 0) > 0.2 ? 'up' : Number(row.trendScore || 0) < -0.2 ? 'down' : 'steady',
  }));
}

export async function getLearningProfile(userId: string): Promise<LearningProfile> {
  const weakTopics = await getWeakTopics(userId);
  const items = await fetchUserRevisionItems(userId, 200);
  const intervention = await getInterventionEffectiveness(userId);
  const subjectStats = new Map<string, { success: number; struggle: number; strong: number }>();
  for (const item of items) {
    const subject = normalizeSubject(item.subject, item.topic) || 'General';
    const current = subjectStats.get(subject) || { success: 0, struggle: 0, strong: 0 };
    current.success += Number(item.successCount || 0);
    current.struggle += Number(item.struggleCount || 0);
    current.strong += item.reviewStatus === 'strong' ? 1 : 0;
    subjectStats.set(subject, current);
  }
  const strongerSubjects = [...subjectStats.entries()].filter(([, stat]) => stat.success + stat.strong > stat.struggle).sort((a, b) => (b[1].success + b[1].strong) - (a[1].success + a[1].strong)).slice(0, 3).map(([subject]) => subject);
  const weakerSubjects = [...subjectStats.entries()].filter(([, stat]) => stat.struggle > 0).sort((a, b) => b[1].struggle - a[1].struggle).slice(0, 3).map(([subject]) => subject);
  return {
    userId,
    strongerSubjects: strongerSubjects.length > 0 ? strongerSubjects : null,
    weakerSubjects: weakerSubjects.length > 0 ? weakerSubjects : null,
    recurringWeakTopics: weakTopics.slice(0, 4).map((topic) => ({ topic: topic.topic, subject: topic.subject || null, count: topic.evidenceCount })),
    recurringMisconceptions: items.filter((item) => item.isMistakeBased).slice(0, 4).map((item) => ({ label: item.title, topic: item.topic || null, subject: item.subject || null, count: Math.max(1, item.struggleCount || 1) })),
    preferredRevisionModes: intervention.filter((entry) => entry.improvementRate >= 0.5).slice(0, 3).map((entry) => entry.interventionType),
    preferredExplanationStyle: intervention.some((entry) => entry.interventionType === 'worked_example' && entry.improvementRate >= 0.5)
      ? 'step_by_step'
      : intervention.some((entry) => entry.interventionType === 'use_example' && entry.improvementRate >= 0.5)
        ? 'example_first'
        : null,
    studyConsistencySignals: { totalSavedItems: items.length },
    recentImprovementAreas: strongerSubjects.length > 0 ? strongerSubjects : null,
    evidenceSummary: { weakTopicCount: weakTopics.length, interventionSignals: intervention.length },
    lastUpdatedAt: new Date().toISOString(),
  };
}

export async function getAcademicMemory(userId: string): Promise<AcademicMemoryEntry[]> {
  const weakTopics = await getWeakTopics(userId);
  const profile = await getLearningProfile(userId);
  const intervention = await getInterventionEffectiveness(userId);
  const entries: AcademicMemoryEntry[] = [
    ...weakTopics.slice(0, 3).map((topic) => ({
      kind: 'weak_topic_pattern' as const,
      summary: `${topic.topic} keeps needing another calm revision pass.`,
      subject: topic.subject || null,
      topic: topic.topic,
      evidenceCount: topic.evidenceCount,
      updatedAt: topic.lastSeenAt || null,
    })),
    ...(profile.recentImprovementAreas || []).slice(0, 2).map((subject) => ({
      kind: 'improved_topic_pattern' as const,
      summary: `${subject} is showing steadier revision progress.`,
      subject,
      evidenceCount: 1,
      updatedAt: new Date().toISOString(),
    })),
  ];
  if (intervention[0]) {
    entries.push({
      kind: 'preferred_support_pattern',
      summary: `${intervention[0].interventionType.replace(/_/g, ' ')} has been helping more often lately.`,
      subject: intervention[0].subject || null,
      topic: intervention[0].topic || null,
      evidenceCount: intervention[0].evidenceCount,
      updatedAt: new Date().toISOString(),
    });
  }
  return entries.slice(0, 6);
}

export async function getConceptDependencies(subject?: string, topic?: string): Promise<ConceptDependency[]> {
  const normalizedSubject = normalizeKey(subject || '');
  const normalizedTopic = normalizeKey(topic || '');
  return CONCEPT_DEPENDENCIES.filter((dependency) => {
    const subjectMatches = !normalizedSubject || normalizeKey(dependency.subject) === normalizedSubject;
    const topicMatches =
      !normalizedTopic ||
      normalizeKey(dependency.topic) === normalizedTopic ||
      normalizeKey(dependency.dependsOnTopic) === normalizedTopic;
    return subjectMatches && topicMatches;
  });
}

export async function getTutorInterventionSuggestions(userId: string, subject?: string, topic?: string): Promise<TutorInterventionSuggestion[]> {
  const weakTopics = await getWeakTopics(userId, subject);
  const topTopic = topic ? weakTopics.find((entry) => normalizeKey(entry.topic) === normalizeKey(topic)) : weakTopics[0];
  if (!topTopic) return [];
  const dependencies = await getConceptDependencies(topTopic.subject || subject || undefined, topTopic.topic);
  const strategy = getSubjectStrategy(topTopic.subject || subject || null);
  const suggestions: TutorInterventionSuggestion[] = [];
  if (dependencies.some((dependency) => dependency.relationshipType === 'prerequisite')) {
    const dependency = dependencies.find((entry) => entry.relationshipType === 'prerequisite')!;
    suggestions.push({
      title: `Revisit ${dependency.dependsOnTopic} first`,
      reason: `${topTopic.topic} will feel clearer after a short return to that earlier idea.`,
      suggestedAction: `Start with a short, calm check on ${dependency.dependsOnTopic} before returning to ${topTopic.topic}.`,
      targetTopic: topTopic.topic,
      strategyType: 'revisit_prerequisite',
      confidence: 0.9,
    });
  }
  suggestions.push({
    title: strategy.mode === 'step_by_step' ? 'Use a worked example' : 'Use a simpler example',
    reason: topTopic.reason || 'This area still needs a gentler restart.',
    suggestedAction:
      strategy.mode === 'step_by_step'
        ? 'Model one step, then let the student take the next step.'
        : 'Give one concrete example, then ask the student to explain it back in simple words.',
    targetTopic: topTopic.topic,
    strategyType: strategy.mode === 'step_by_step' ? 'practice_more' : 'use_example',
    confidence: 0.82,
  });
  if (topTopic.reason?.includes('misconception')) {
    suggestions.push({
      title: 'Focus on the misconception directly',
      reason: 'This topic already has saved correction or misconception notes.',
      suggestedAction: 'Ask what the wrong idea is, then contrast it with the correct one.',
      targetTopic: topTopic.topic,
      strategyType: 'focus_misconception',
      confidence: 0.86,
    });
  }
  return suggestions.slice(0, 3);
}

export async function getTutorPolicyDecision(userId: string, subject?: string, topic?: string): Promise<TutorPolicyDecision> {
  const weakTopics = await getWeakTopics(userId, subject);
  const queue = await getRevisionQueue(userId, 4);
  const topTopic = topic ? weakTopics.find((entry) => normalizeKey(entry.topic) === normalizeKey(topic)) : weakTopics[0];
  const interventions = await getTutorInterventionSuggestions(userId, subject, topic);

  if (topTopic) {
    const dependencies = await getConceptDependencies(topTopic.subject || subject || undefined, topTopic.topic);
    if (dependencies.some((dependency) => dependency.relationshipType === 'prerequisite')) {
      return {
        nextAction: 'revisit_prerequisite',
        reason: `${topTopic.topic} still needs support, and it depends on an earlier idea.`,
        confidence: 0.9,
        contextNotes: dependencies.map((dependency) => `Revisit ${dependency.dependsOnTopic} with a short calm reset.`),
      };
    }
    if (topTopic.reason?.includes('misconception')) {
      return {
        nextAction: 'focus_misconception',
        reason: `${topTopic.topic} has a saved misconception or correction pattern.`,
        confidence: 0.84,
        contextNotes: ['Use contrast between the wrong idea and the correct idea.'],
      };
    }
  }

  if (queue.dueNow.length > 0) {
    return {
      nextAction: 'suggest_revision',
      reason: 'There are revision items due now, so the next best step is a short focused review pass.',
      confidence: 0.72,
      contextNotes: queue.dueNow.slice(0, 3).map((item) => item.title),
    };
  }

  if (interventions[0]) {
    return {
      nextAction: interventions[0].strategyType === 'use_example' ? 'use_example' : 'simplify',
      reason: interventions[0].reason,
      confidence: interventions[0].confidence || 0.7,
      contextNotes: [interventions[0].suggestedAction],
    };
  }

  return {
    nextAction: 'move_forward',
    reason: 'The current evidence looks steady enough to continue with the next guided step.',
    confidence: 0.55,
    contextNotes: null,
  };
}

export async function getWhyThisNext(userId: string, subject?: string, topic?: string): Promise<WhyThisNextExplanation> {
  const policy = await getTutorPolicyDecision(userId, subject, topic);
  const weakTopics = await getWeakTopics(userId, subject);
  const queue = await getRevisionQueue(userId, 3);
  const topDue = queue.dueNow[0];
  const topWeak = topic ? weakTopics.find((entry) => normalizeKey(entry.topic) === normalizeKey(topic)) : weakTopics[0];
  if (topDue) {
    return {
      shortReason: `We are doing this next because ${topDue.title} is ready for another calm review.`,
      supportingSignals: [topDue.reviewStatus || 'review_due'],
      sourceType: 'review_queue',
    };
  }
  if (topWeak) {
    return {
      shortReason: `We are revisiting ${topWeak.topic} because it still needs another guided practice pass.`,
      supportingSignals: [topWeak.reason || 'It has shown repeated difficulty.'],
      sourceType: 'weak_topic',
    };
  }
  return {
    shortReason: 'We are taking this next step because it matches the current learning goal.',
    supportingSignals: [policy.reason],
    sourceType: 'policy_decision',
  };
}

export async function getSafeProgressSummary(userId: string, audience: 'parent' | 'teacher', subject?: string): Promise<SafeProgressSummary> {
  const weakTopics = await getWeakTopics(userId, subject);
  const profile = await getLearningProfile(userId);
  const progress = await getRevisionProgressOverview(userId);
  return {
    audience,
    periodLabel: 'Recent revision',
    highlights: [
      progress.totalPractisedThisWeek
        ? `Practised ${progress.totalPractisedThisWeek} saved revision items this week.`
        : 'Has started building a steady revision history.',
    ],
    focusAreas: weakTopics.slice(0, 3).map((topicItem) => topicItem.topic),
    strengths: (profile.strongerSubjects || []).slice(0, 3).map((entry) =>
      audience === 'teacher' ? `${entry} is showing steadier revision outcomes.` : `${entry} is looking more settled in revision.`
    ),
    needsSupport: weakTopics.slice(0, 3).map((entry) =>
      audience === 'teacher' ? `${entry.topic} still needs guided practice.` : `${entry.topic} still needs one more calm support pass.`
    ),
    suggestedSupportActions: weakTopics.slice(0, 3).map((entry) => entry.suggestedNextAction || 'Keep revision short, calm, and focused.'),
  };
}

export async function getMasteryPathway(userId: string, subject?: string, topic?: string) {
  const items = await fetchUserRevisionItems(userId, 220);
  const normalizedSubject = normalizeKey(subject || '');
  const pathway = SUBJECT_PATHWAYS[normalizedSubject] || [];
  const relevantItems = items.filter((item) =>
    !subject || normalizeKey(item.subject || normalizeSubject(null, item.topic) || '') === normalizedSubject
  );
  const progress = pathway.map((node) => {
    const nodeItems = relevantItems.filter((item) => normalizeKey(item.topic || item.title) === normalizeKey(node.topic));
    const strongest = nodeItems.find((item) => item.reviewStatus === 'strong');
    const weakest = nodeItems.find((item) => item.reviewStatus === 'needs_attention');
    return {
      topic: node.topic,
      status: strongest ? 'secure' : weakest ? 'needs_review' : nodeItems.length > 0 ? 'practising' : 'not_started',
      evidenceCount: nodeItems.length,
      confidence: nodeItems.length > 0 ? Math.max(0.1, Math.min(0.95, (nodeItems.reduce((sum, item) => sum + Number(item.successCount || 0), 0) + 1) / (nodeItems.reduce((sum, item) => sum + Number(item.reviewCount || 0), 0) + 2))) : null,
    };
  });
  const currentNode = topic
    ? pathway.find((node) => normalizeKey(node.topic) === normalizeKey(topic)) || null
    : pathway.find((node) => progress.some((entry) => entry.topic === node.topic && entry.status !== 'not_started')) || null;
  const nextNode = currentNode ? pathway.find((node) => node.stageOrder === currentNode.stageOrder + 1) || null : pathway[0] || null;
  return { subject: subject || null, topic: topic || null, nodes: pathway, currentNode, nextNode, progress };
}

export async function createSemesterPlan(args: SemesterPlanCreateArgs) {
  return createStudyPlan({
    userId: args.userId,
    scope: args.scope,
    subject: args.subject || null,
    subjects: args.subjects || null,
    examFocus: args.examFocus,
  });
}

export async function getSemesterPlans(userId: string): Promise<StudyPlan[]> {
  return getStudyPlans(userId, ['month', 'term', 'semester']);
}

export async function getSemesterPlanDetails(userId: string, planId: string) {
  const details = await getStudyPlanDetails(userId, planId);
  if (!details) return null;
  if (!['month', 'term', 'semester'].includes(details.plan.scope)) return null;
  return details;
}

export async function getSchoolSafeReport(userId: string, subject?: string): Promise<SchoolSafeReport> {
  const summary = await getSafeProgressSummary(userId, 'teacher', subject);
  const interventionSuggestions = await getTutorInterventionSuggestions(userId, subject);
  const intervention = await getInterventionEffectiveness(userId);
  return {
    periodLabel: summary.periodLabel,
    studentSummary: summary.highlights[0] || 'The student has started building a steady revision history and saved study material.',
    subjectFocus: subject || null,
    strengths: summary.strengths,
    needsSupport: summary.needsSupport,
    revisionPatterns: [
      ...summary.focusAreas.map((area) => `Recent focus area: ${area}.`),
      ...intervention.slice(0, 2).map((entry) => `${entry.interventionType.replace(/_/g, ' ')} is showing ${entry.recentTrend === 'up' ? 'encouraging' : 'mixed'} results.`),
    ].slice(0, 4),
    recommendedNextSteps: interventionSuggestions.map((entry) => entry.suggestedAction).slice(0, 4),
    privacyNotes: ['This summary stays high-level and does not include private chat transcripts.'],
  };
}
