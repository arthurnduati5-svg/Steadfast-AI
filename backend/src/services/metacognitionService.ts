import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prismaClient';
import type {
  MetacognitiveConfidence,
  MetacognitiveErrorType,
  MetacognitiveEvent,
  MetacognitiveProfile,
  MetacognitivePrompt,
  MetacognitiveStateSnapshot,
  MetacognitiveStrategyPreference,
  ReflectionSignal,
  StudentConfidenceSelfCheck,
  StudentSupportPreference,
} from '../lib/types';
import { buildReflectionPrompt } from './reflectionService';

type RecordMetacognitiveEventArgs = Omit<MetacognitiveEvent, 'id' | 'createdAt'>;
let ensureMetacognitionTablesPromise: Promise<void> | null = null;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function cleanNullableString(value: unknown, maxChars = 280): string | null {
  const cleaned = safeString(value).replace(/\s+/g, ' ').trim();
  if (!cleaned) return null;
  return cleaned.length <= maxChars ? cleaned : `${cleaned.slice(0, maxChars - 3).trimEnd()}...`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function mapConfidenceSelfCheckToLegacy(
  value: StudentConfidenceSelfCheck | null | undefined
): MetacognitiveConfidence | null {
  if (value === 'understand_well') return 'sure';
  if (value === 'partly_understand') return 'partly_sure';
  if (value === 'confused') return 'confused';
  return null;
}

function mapSupportPreferenceToLegacy(
  value: StudentSupportPreference | null | undefined
): MetacognitiveStrategyPreference | null {
  if (value === 'simpler_explanation') return 'simpler_language_helped';
  if (value === 'small_hint') return 'hint_helped';
  if (value === 'worked_example') return 'example_helped';
  if (value === 'practice_question') return 'practice_helped';
  return null;
}

function extractReflectionSignal(row: Record<string, unknown>): ReflectionSignal | null {
  const metadata = asRecord(row.metadata);
  const signal: ReflectionSignal = {
    confidence: (safeString(metadata?.confidenceSelfCheck).trim() || null) as ReflectionSignal['confidence'],
    supportPreference: (safeString(metadata?.supportPreference).trim() || null) as ReflectionSignal['supportPreference'],
    sourceTurnId: cleanNullableString(metadata?.sourceTurnId, 120),
    topic: cleanNullableString(metadata?.topic, 120),
    subject: cleanNullableString(metadata?.subject, 120),
  };
  return Object.values(signal).some(Boolean) ? signal : null;
}

function toMetacognitiveStateSnapshot(row: Record<string, unknown>): MetacognitiveStateSnapshot | null {
  const metadata = asRecord(row.metadata);
  const snapshot: MetacognitiveStateSnapshot = {
    confidence: (safeString(row.confidence).trim() || mapConfidenceSelfCheckToLegacy(
      (safeString(metadata?.confidenceSelfCheck).trim() || null) as StudentConfidenceSelfCheck | null
    )) as MetacognitiveConfidence | null,
    problemFraming: (safeString(row.problemFraming).trim() || null) as MetacognitiveStateSnapshot['problemFraming'],
    errorType: (safeString(row.errorType).trim() || null) as MetacognitiveErrorType | null,
    strategyPreference: (safeString(row.strategyPreference).trim() || mapSupportPreferenceToLegacy(
      (safeString(metadata?.supportPreference).trim() || null) as StudentSupportPreference | null
    )) as MetacognitiveStrategyPreference | null,
    transferReadiness: (safeString(row.transferReadiness).trim() || null) as MetacognitiveStateSnapshot['transferReadiness'],
    confidenceSelfCheck: (safeString(metadata?.confidenceSelfCheck).trim() || null) as StudentConfidenceSelfCheck | null,
    supportPreference: (safeString(metadata?.supportPreference).trim() || null) as StudentSupportPreference | null,
    studentReflectionNote: cleanNullableString(row.note, 320),
  };
  return Object.values(snapshot).some(Boolean) ? snapshot : null;
}

function humanizeConfidence(value: MetacognitiveConfidence): string {
  if (value === 'sure') return 'often feels sure before trying';
  if (value === 'partly_sure') return 'often feels partly sure and benefits from a quick check-in';
  return 'often feels confused and needs a calmer first step';
}

function humanizeError(value: string): string {
  switch (value) {
    case 'concept_misunderstanding':
      return 'Concept misunderstandings come up repeatedly.';
    case 'wrong_method':
      return 'Method choice is a repeated sticking point.';
    case 'skipped_step':
      return 'Skipping steps is a recurring pattern.';
    case 'careless_error':
      return 'Small careless errors are showing up often.';
    case 'memory_gap':
      return 'Memory gaps are affecting recall.';
    default:
      return 'Unclear steps still need more attention.';
  }
}

function humanizeStrategy(value: string): string {
  switch (value) {
    case 'hint_helped':
      return 'Small hints help after a first attempt.';
    case 'example_helped':
      return 'Worked examples help unlock the next step.';
    case 'breakdown_helped':
      return 'Breaking work into smaller steps helps most.';
    case 'practice_helped':
      return 'A similar practice question helps learning settle.';
    case 'compare_helped':
      return 'Comparing ideas helps when topics get mixed up.';
    case 'simpler_language_helped':
      return 'Simpler language improves clarity.';
    case 'worked_step_helped':
      return 'Seeing one worked step helps the learner continue.';
    default:
      return 'Support preferences are still emerging.';
  }
}

function pickTopCounts(rows: Array<Record<string, unknown>>, field: string, limit = 3): string[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = safeString(row[field]).trim();
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

function deriveSelfCorrectionTrend(rows: Array<Record<string, unknown>>): MetacognitiveProfile['selfCorrectionTrend'] {
  if (rows.length < 4) return 'steady';
  const recent = rows.slice(0, Math.min(8, rows.length));
  const positive = recent.filter((row) => ['success_explained', 'transfer_check'].includes(safeString(row.eventType))).length;
  const recovery = recent.filter((row) => safeString(row.errorType).trim() || safeString(row.note).trim()).length;
  if (positive >= 2 && recovery >= 2) return 'improving';
  if (positive === 0 && recovery >= 3) return 'needs_support';
  return 'steady';
}

export async function ensureMetacognitionTables(): Promise<void> {
  if (!ensureMetacognitionTablesPromise) {
    ensureMetacognitionTablesPromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "MetacognitiveEvent" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "sessionId" TEXT NULL,
          "revisionItemId" TEXT NULL,
          "sourceMessageId" TEXT NULL,
          "eventType" TEXT NOT NULL,
          "confidence" TEXT NULL,
          "problemFraming" TEXT NULL,
          "errorType" TEXT NULL,
          "strategyPreference" TEXT NULL,
          "transferReadiness" TEXT NULL,
          "note" TEXT NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_userId_createdAt_idx" ON "MetacognitiveEvent" ("userId", "createdAt");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_sessionId_createdAt_idx" ON "MetacognitiveEvent" ("sessionId", "createdAt");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_revisionItemId_createdAt_idx" ON "MetacognitiveEvent" ("revisionItemId", "createdAt");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MetacognitiveEvent_sourceMessageId_createdAt_idx" ON "MetacognitiveEvent" ("sourceMessageId", "createdAt");`);
    })().catch((error) => {
      ensureMetacognitionTablesPromise = null;
      throw error;
    });
  }
  await ensureMetacognitionTablesPromise;
}

function isRecoverableMetacognitionStorageError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P2021', 'P2022'].includes(error.code);
  }
  const message = String(error || '').toLowerCase();
  return (
    message.includes('metacognitiveevent') ||
    message.includes('relation') ||
    message.includes('does not exist') ||
    message.includes('no such table') ||
    message.includes('column') ||
    message.includes('jsonb')
  );
}

function buildEmptyMetacognitiveProfile(): MetacognitiveProfile {
  return {
    evidenceCount: 0,
    recurringErrorPatterns: [],
    preferredSupportPatterns: [],
    transferStrengths: [],
    reflectionSignals: [],
    recentSnapshot: null,
    lastReflectionSignal: null,
    lastUpdatedAt: null,
  };
}

export function mergeMetacognitiveSnapshot(
  base?: MetacognitiveStateSnapshot | null,
  patch?: MetacognitiveStateSnapshot | null,
): MetacognitiveStateSnapshot | null {
  const merged: MetacognitiveStateSnapshot = {
    ...(base || {}),
    ...(patch || {}),
  };
  return Object.values(merged).some(Boolean) ? merged : null;
}

export async function recordMetacognitiveEvent(args: RecordMetacognitiveEventArgs): Promise<MetacognitiveEvent> {
  const metadata = {
    ...(args.metadata && typeof args.metadata === 'object' ? args.metadata : {}),
    ...(args.confidenceSelfCheck ? { confidenceSelfCheck: args.confidenceSelfCheck } : {}),
    ...(args.supportPreference ? { supportPreference: args.supportPreference } : {}),
  };
  const note = cleanNullableString(args.note, 320);
  const confidence = args.confidence || mapConfidenceSelfCheckToLegacy(args.confidenceSelfCheck);
  const strategyPreference = args.strategyPreference || mapSupportPreferenceToLegacy(args.supportPreference);
  try {
    await ensureMetacognitionTables();
    const created = await prisma.metacognitiveEvent.create({
      data: {
        userId: args.userId,
        sessionId: args.sessionId || null,
        revisionItemId: args.revisionItemId || null,
        sourceMessageId: args.sourceMessageId || null,
        eventType: args.eventType,
        confidence: confidence || null,
        problemFraming: args.problemFraming || null,
        errorType: args.errorType || null,
        strategyPreference: strategyPreference || null,
        transferReadiness: args.transferReadiness || null,
        note,
        metadata: Object.keys(metadata).length > 0
          ? (metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });

    return {
      id: created.id,
      userId: args.userId,
      sessionId: args.sessionId || null,
      revisionItemId: args.revisionItemId || null,
      sourceMessageId: args.sourceMessageId || null,
      eventType: args.eventType,
      confidence: confidence || null,
      problemFraming: args.problemFraming || null,
      errorType: args.errorType || null,
      strategyPreference: strategyPreference || null,
      transferReadiness: args.transferReadiness || null,
      confidenceSelfCheck: args.confidenceSelfCheck || null,
      supportPreference: args.supportPreference || null,
      note,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      createdAt: created.createdAt.toISOString(),
    };
  } catch (error) {
    if (!isRecoverableMetacognitionStorageError(error)) {
      throw error;
    }
    return {
      id: randomUUID(),
      userId: args.userId,
      sessionId: args.sessionId || null,
      revisionItemId: args.revisionItemId || null,
      sourceMessageId: args.sourceMessageId || null,
      eventType: args.eventType,
      confidence: confidence || null,
      problemFraming: args.problemFraming || null,
      errorType: args.errorType || null,
      strategyPreference: strategyPreference || null,
      transferReadiness: args.transferReadiness || null,
      confidenceSelfCheck: args.confidenceSelfCheck || null,
      supportPreference: args.supportPreference || null,
      note,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function getMetacognitiveProfile(userId: string): Promise<MetacognitiveProfile> {
  let rows: Array<Record<string, unknown>> = [];
  try {
    await ensureMetacognitionTables();
    rows = (await prisma.metacognitiveEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 120,
    })) as Array<Record<string, unknown>>;
  } catch (error) {
    if (!isRecoverableMetacognitionStorageError(error)) {
      throw error;
    }
    return buildEmptyMetacognitiveProfile();
  }

  if (rows.length === 0) {
    return buildEmptyMetacognitiveProfile();
  }

  const topConfidence = pickTopCounts(rows, 'confidence', 1)[0] as MetacognitiveConfidence | undefined;
  const topErrors = pickTopCounts(rows, 'errorType');
  const topStrategies = pickTopCounts(rows, 'strategyPreference');
  const topTransfer = pickTopCounts(rows, 'transferReadiness')
    .filter((value) => value === 'can_reuse' || value === 'can_explain')
    .slice(0, 2);
  const recentSnapshot = toMetacognitiveStateSnapshot(rows[0]);
  const reflectionSignals = [
    ...topErrors.slice(0, 1).map(humanizeError),
    ...topStrategies.slice(0, 1).map(humanizeStrategy),
  ].slice(0, 3);

  return {
    commonConfidencePattern: topConfidence ? humanizeConfidence(topConfidence) : null,
    recurringErrorPatterns: topErrors.map(humanizeError),
    preferredSupportPatterns: topStrategies.map(humanizeStrategy),
    transferStrengths: topTransfer.map((value) =>
      value === 'can_explain'
        ? 'Can often explain the idea after success.'
        : 'Can often reuse the idea on a similar question.'
    ),
    reflectionSignals,
    explanationReadiness: topTransfer.includes('can_explain')
      ? 'strong'
      : topTransfer.includes('can_reuse')
        ? 'developing'
        : 'emerging',
    selfCorrectionTrend: deriveSelfCorrectionTrend(rows),
    recentSnapshot,
    lastReflectionSignal: extractReflectionSignal(rows[0]),
    evidenceCount: rows.length,
    lastUpdatedAt: rows[0]?.createdAt ? new Date(String(rows[0].createdAt)).toISOString() : null,
  };
}

export function chooseMetacognitivePrompt(args: {
  userText?: string;
  assistantText?: string;
  tutorActionId?: string;
  isRevision?: boolean;
  isPracticePad?: boolean;
  awaitingStudentAttempt?: boolean;
  afterMistake?: boolean;
  afterSuccess?: boolean;
  currentErrorType?: MetacognitiveErrorType | null;
  topic?: string | null;
  subject?: string | null;
  topicMastery?: import('../lib/types').TopicMasteryState | null;
  weakTopicRecovery?: import('../lib/types').WeakTopicRecoveryState | null;
}): MetacognitivePrompt | null {
  return buildReflectionPrompt({
    userText: args.userText,
    assistantText: args.assistantText,
    tutorActionId: args.tutorActionId,
    isRevision: args.isRevision,
    isPracticePad: args.isPracticePad,
    awaitingStudentAttempt: args.awaitingStudentAttempt,
    afterMistake: args.afterMistake,
    afterSuccess: args.afterSuccess,
    currentErrorType: args.currentErrorType,
    topic: args.topic,
    subject: args.subject,
    topicMastery: args.topicMastery || null,
    weakTopicRecovery: args.weakTopicRecovery || null,
  });
}
