import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../utils/prismaClient';
import type {
  LearningEffectEvent,
  LearningEffectivenessSummary,
  RevisionVitalitySummary,
} from '../lib/types';
import {
  fetchUserRevisionItems,
  getRevisionProgressOverview,
  getRevisionQueue,
} from './revisionLearningService';

export type RecordLearningEffectEventArgs = {
  userId: string;
  sessionId?: string | null;
  subject?: string | null;
  topic?: string | null;
  revisionItemId?: string | null;
  messageId?: string | null;
  eventType: string;
  outcome?: string | null;
  metadata?: Record<string, unknown> | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
let ensureLearningEffectEventTablePromise: Promise<void> | null = null;

const EFFORT_SIGNALS = [
  'attempted_before_help',
  'retried_after_correction',
  'chose_hint_before_full_explanation',
  'used_practice_path',
  'used_revision_again',
  'explained_in_own_words',
  'answered_orally_before_hint',
  'selected_try_again',
];

const LEARNING_SIGNALS = [
  'correction_after_feedback',
  'repeated_mistake_reduction',
  'weak_topic_improvement',
  'revision_reuse',
  'formula_recall_improvement',
  'concept_explanation_success',
  'transfer_success',
  'practice_completion',
  'topic_return_with_improvement',
];

const TUTOR_EFFECTIVENESS_SIGNALS = [
  'simplify_led_to_improvement',
  'example_led_to_improvement',
  'worked_step_led_to_improvement',
  'similar_question_led_to_improvement',
  'revision_quiz_led_to_recall',
  'voice_mode_helped',
  'research_mode_helped',
  'video_recommendation_helped',
];

const PRODUCT_INTEGRITY_SIGNALS = [
  'excessive_answer_dumping_rate',
  'no_attempt_before_solution_rate',
  'unused_revision_rate',
  'noisy_or_overlong_response_rate',
  'language_drift_rate',
  'fallback_honesty_rate',
  'revision_dead_storage_rate',
  'metacognitive_prompt_usefulness_signal',
  'tutorial_pacing_health_signal',
  'answer_dump_risk_detected',
  'language_drift_detected',
  'fallback_notice_shown',
  'fallback_notice_honest',
];

const VOICE_SIGNALS = [
  'voice_mode_started',
  'voice_mode_ended',
  'voice_mode_used',
  'voice_mode_helped',
  'interruptions',
  'recap_generated',
  'recap_saved',
  'permission_denied',
  'audio_failure',
  'revision_handoff',
  'growth_signal_update',
  'voice_recap_completion',
  'oral_quiz_success_signal',
  'simplify_repeat_request_rate',
  'voice_dropoff_rate',
  'voice_helpfulness_signal',
];

const RESEARCH_VIDEO_SIGNALS = [
  'research_mode_used',
  'research_mode_helped',
  'research_mode_trigger_rate',
  'research_overtrigger_signal',
  'source_backed_answer_followup_signal',
  'video_recommendation_opened',
  'video_recommendation_helped',
  'video_recommendation_acceptance_rate',
  'video_followup_question_rate',
  'video_context_reuse_rate',
  'transcript_unavailable_rate',
];

const MULTILINGUAL_SIGNALS = [
  'response_language_match_rate',
  'detected_input_vs_output_consistency',
  'bilingual_mode_stability',
  'language_drift_rate',
  'multilingual_followup_quality',
  'voice_language_mismatch_handled',
  'mixed_language_session_stability',
];

type GrowthActionFunnelModuleSummary = {
  actionType: string;
  opened: number;
  submitted: number;
  completed: number;
  openToSubmitRate: number;
  submitToCompleteRate: number;
  averageEvidenceScore: number | null;
  estimatedMasteryLiftRate: number;
};

export type GrowthActionFunnelSummary = {
  periodLabel: string;
  totalOpened: number;
  totalSubmitted: number;
  totalCompleted: number;
  openToSubmitRate: number;
  submitToCompleteRate: number;
  modules: GrowthActionFunnelModuleSummary[];
  topImprovingModules: GrowthActionFunnelModuleSummary[];
};

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function roundRate(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(2));
}

function readNumber(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return value;
}

function toCounter(events: LearningEffectEvent[], keys: string[]): Record<string, number> {
  const counter: Record<string, number> = {};
  for (const key of keys) {
    counter[key] = 0;
  }
  for (const event of events) {
    const eventType = safeString(event.eventType).trim();
    if (!eventType) continue;
    if (Object.prototype.hasOwnProperty.call(counter, eventType)) {
      counter[eventType] += 1;
    }
  }
  return counter;
}

function deriveVitalityFromRates(args: {
  reusedRate: number;
  staleSaveRate: number;
  quizActivationRate: number;
}): RevisionVitalitySummary['vitality'] {
  if (args.reusedRate >= 0.45 && args.staleSaveRate <= 0.35 && args.quizActivationRate >= 0.2) {
    return 'strong';
  }
  if (args.reusedRate >= 0.2 && args.staleSaveRate <= 0.6) {
    return 'mixed';
  }
  return 'weak';
}

function addInsightNote(notes: string[], condition: boolean, message: string) {
  if (condition && !notes.includes(message)) {
    notes.push(message);
  }
}

export async function ensureLearningEffectEventTable() {
  if (!ensureLearningEffectEventTablePromise) {
    ensureLearningEffectEventTablePromise = (async () => {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "LearningEffectEvent" (
          "id" TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          "sessionId" TEXT NULL,
          "subject" TEXT NULL,
          "topic" TEXT NULL,
          "revisionItemId" TEXT NULL,
          "messageId" TEXT NULL,
          "eventType" TEXT NOT NULL,
          "outcome" TEXT NULL,
          "metadata" JSONB NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LearningEffectEvent_userId_createdAt_idx" ON "LearningEffectEvent" ("userId", "createdAt");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LearningEffectEvent_userId_eventType_idx" ON "LearningEffectEvent" ("userId", "eventType");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LearningEffectEvent_sessionId_createdAt_idx" ON "LearningEffectEvent" ("sessionId", "createdAt");`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "LearningEffectEvent_revisionItemId_createdAt_idx" ON "LearningEffectEvent" ("revisionItemId", "createdAt");`);
    })().catch((error) => {
      ensureLearningEffectEventTablePromise = null;
      throw error;
    });
  }
  await ensureLearningEffectEventTablePromise;
}

function isRecoverableLearningEffectStorageError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return ['P2021', 'P2022'].includes(error.code);
  }
  const message = String(error || '').toLowerCase();
  return (
    message.includes('learningeffectevent') ||
    message.includes('relation') ||
    message.includes('does not exist') ||
    message.includes('no such table') ||
    message.includes('column') ||
    message.includes('jsonb')
  );
}

export async function recordLearningEffectEvent(args: RecordLearningEffectEventArgs): Promise<LearningEffectEvent> {
  const normalizedEventType = safeString(args.eventType).trim();
  if (!normalizedEventType) {
    throw new Error('eventType is required.');
  }
  const sessionId = safeString(args.sessionId).trim() || null;
  const subject = safeString(args.subject).trim() || null;
  const topic = safeString(args.topic).trim() || null;
  const revisionItemId = safeString(args.revisionItemId).trim() || null;
  const messageId = safeString(args.messageId).trim() || null;
  const outcome = safeString(args.outcome).trim() || null;
  try {
    await ensureLearningEffectEventTable();
    const created = await prisma.learningEffectEvent.create({
      data: {
        userId: args.userId,
        sessionId,
        subject,
        topic,
        revisionItemId,
        messageId,
        eventType: normalizedEventType,
        outcome,
        metadata: args.metadata
          ? (args.metadata as Prisma.InputJsonValue)
          : Prisma.DbNull,
      },
    });

    return {
      id: created.id,
      userId: args.userId,
      sessionId,
      subject,
      topic,
      revisionItemId,
      messageId,
      eventType: normalizedEventType,
      outcome,
      metadata: args.metadata || null,
      createdAt: created.createdAt.toISOString(),
    };
  } catch (error) {
    if (!isRecoverableLearningEffectStorageError(error)) {
      throw error;
    }
    return {
      id: randomUUID(),
      userId: args.userId,
      sessionId,
      subject,
      topic,
      revisionItemId,
      messageId,
      eventType: normalizedEventType,
      outcome,
      metadata: args.metadata || null,
      createdAt: new Date().toISOString(),
    };
  }
}

export async function listLearningEffectEvents(args: {
  userId: string;
  days?: number;
  limit?: number;
}): Promise<LearningEffectEvent[]> {
  const days = Math.max(1, Math.min(Number(args.days || 30), 180));
  const limit = Math.max(20, Math.min(Number(args.limit || 1500), 5000));
  const cutoff = new Date(Date.now() - days * DAY_MS);

  let rows: Awaited<ReturnType<typeof prisma.learningEffectEvent.findMany>> = [];
  try {
    await ensureLearningEffectEventTable();
    rows = await prisma.learningEffectEvent.findMany({
      where: {
        userId: args.userId,
        createdAt: { gte: cutoff },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  } catch (error) {
    if (!isRecoverableLearningEffectStorageError(error)) {
      throw error;
    }
    rows = [];
  }

  return rows.map((row) => ({
    id: safeString(row.id),
    userId: safeString(row.userId),
    sessionId: safeString(row.sessionId).trim() || null,
    subject: safeString(row.subject).trim() || null,
    topic: safeString(row.topic).trim() || null,
    revisionItemId: safeString(row.revisionItemId).trim() || null,
    messageId: safeString(row.messageId).trim() || null,
    eventType: safeString(row.eventType).trim(),
    outcome: safeString(row.outcome).trim() || null,
    metadata: row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : null,
    createdAt: row.createdAt ? row.createdAt.toISOString() : undefined,
  }));
}

export async function getRevisionVitalitySummary(userId: string): Promise<RevisionVitalitySummary> {
  const [items, queue, progress] = await Promise.all([
    fetchUserRevisionItems(userId, 260),
    getRevisionQueue(userId, 30),
    getRevisionProgressOverview(userId),
  ]);

  const totalItems = Math.max(1, items.length);
  const revisitedItems = items.filter((item) => Number(item.reviewCount || 0) > 0 || Number(item.practiceCount || 0) > 0).length;
  const staleItems = items.filter((item) => Number(item.reviewCount || 0) === 0 && Number(item.practiceCount || 0) === 0).length;
  const quizActivatedItems = items.filter((item) => Number(item.practiceCount || 0) > 0).length;

  const reusedRate = roundRate(revisitedItems / totalItems);
  const staleSaveRate = roundRate(staleItems / totalItems);
  const quizActivationRate = roundRate(quizActivatedItems / totalItems);
  const vitality = deriveVitalityFromRates({ reusedRate, staleSaveRate, quizActivationRate });

  const notes: string[] = [];
  addInsightNote(notes, queue.dueNow.length > 0, `${queue.dueNow.length} item(s) are due now for revision.`);
  addInsightNote(notes, queue.needsAttention.length > 0, `${queue.needsAttention.length} item(s) need extra support.`);
  addInsightNote(
    notes,
    progress.totalNeedsAttentionCount > progress.totalStrongCount,
    'Needs-attention items are still higher than strong items.'
  );
  addInsightNote(notes, vitality === 'strong', 'Revision is actively reused and not just saved.');
  addInsightNote(notes, vitality === 'weak', 'Many saved items have not yet been revisited.');

  return {
    vitality,
    reusedRate,
    staleSaveRate,
    quizActivationRate,
    notes,
  };
}

export async function getLearningEffectivenessSummary(args: {
  userId: string;
  days?: number;
}): Promise<LearningEffectivenessSummary> {
  const events = await listLearningEffectEvents({ userId: args.userId, days: args.days });
  const revisionVitality = await getRevisionVitalitySummary(args.userId);

  const effortSignals = toCounter(events, EFFORT_SIGNALS);
  const learningSignals = toCounter(events, LEARNING_SIGNALS);
  const tutorEffectivenessSignals = toCounter(events, TUTOR_EFFECTIVENESS_SIGNALS);
  const productIntegritySignals = toCounter(events, PRODUCT_INTEGRITY_SIGNALS);
  const voiceSignals = toCounter(events, VOICE_SIGNALS);
  const researchVideoSignals = toCounter(events, RESEARCH_VIDEO_SIGNALS);
  const multilingualSignals = toCounter(events, MULTILINGUAL_SIGNALS);

  const notes: string[] = [];
  const totalEffort = Object.values(effortSignals).reduce((sum, value) => sum + value, 0);
  const totalLearning = Object.values(learningSignals).reduce((sum, value) => sum + value, 0);
  const totalIntegrityRisks = ['answer_dump_risk_detected', 'no_attempt_before_solution_rate', 'language_drift_rate']
    .map((key) => productIntegritySignals[key] || 0)
    .reduce((sum, value) => sum + value, 0);

  addInsightNote(notes, events.length === 0, 'No learning-effect events were captured in this window yet.');
  addInsightNote(notes, totalEffort > 0, 'Learner effort signals are being captured.');
  addInsightNote(notes, totalLearning > 0, 'Learning outcome signals are present in this period.');
  addInsightNote(notes, totalIntegrityRisks > 3, 'Product integrity risks are elevated in this period.');
  addInsightNote(notes, (researchVideoSignals.research_mode_helped || 0) > 0, 'Research mode has positive evidence of helping.');
  addInsightNote(notes, (voiceSignals.voice_mode_helped || 0) > 0, 'Voice mode shows supportive learning impact.');
  addInsightNote(notes, (multilingualSignals.language_drift_rate || 0) > 0, 'Language drift incidents were detected and should be reviewed.');

  const periodDays = Math.max(1, Math.min(Number(args.days || 30), 180));
  return {
    periodLabel: `Last ${periodDays} day${periodDays === 1 ? '' : 's'}`,
    totalEvents: events.length,
    effortSignals,
    learningSignals,
    tutorEffectivenessSignals,
    productIntegritySignals,
    voiceSignals,
    researchVideoSignals,
    multilingualSignals,
    revisionVitality,
    notes,
  };
}

export async function getGrowthActionFunnelSummary(args: {
  userId: string;
  days?: number;
}): Promise<GrowthActionFunnelSummary> {
  const periodDays = Math.max(1, Math.min(Number(args.days || 21), 90));
  const events = await listLearningEffectEvents({ userId: args.userId, days: periodDays, limit: 5000 });

  const funnelEvents = events.filter((event) =>
    event.eventType === 'growth_action_opened' ||
    event.eventType === 'growth_action_submitted' ||
    event.eventType === 'growth_action_completed'
  );

  const moduleMap = new Map<
    string,
    {
      actionType: string;
      opened: number;
      submitted: number;
      completed: number;
      evidenceSum: number;
      evidenceCount: number;
      masteryLiftSignals: number;
    }
  >();

  for (const event of funnelEvents) {
    const metadata = event.metadata && typeof event.metadata === 'object'
      ? (event.metadata as Record<string, unknown>)
      : null;
    const actionType = safeString(metadata?.actionType).trim() || 'unknown_action';
    if (!moduleMap.has(actionType)) {
      moduleMap.set(actionType, {
        actionType,
        opened: 0,
        submitted: 0,
        completed: 0,
        evidenceSum: 0,
        evidenceCount: 0,
        masteryLiftSignals: 0,
      });
    }
    const bucket = moduleMap.get(actionType)!;
    if (event.eventType === 'growth_action_opened') {
      bucket.opened += 1;
      continue;
    }
    if (event.eventType === 'growth_action_submitted') {
      bucket.submitted += 1;
      continue;
    }

    bucket.completed += 1;
    const evidenceScore = readNumber(metadata?.evidenceScore);
    if (evidenceScore != null) {
      bucket.evidenceSum += evidenceScore;
      bucket.evidenceCount += 1;
      if (evidenceScore >= 0.64) {
        bucket.masteryLiftSignals += 1;
      }
    }
    const outcome = safeString(event.outcome).trim().toLowerCase();
    if (outcome === 'improved' || outcome === 'completed') {
      bucket.masteryLiftSignals += 1;
    }
  }

  const modules: GrowthActionFunnelModuleSummary[] = [...moduleMap.values()]
    .map((bucket) => ({
      actionType: bucket.actionType,
      opened: bucket.opened,
      submitted: bucket.submitted,
      completed: bucket.completed,
      openToSubmitRate: bucket.opened > 0 ? roundRate(bucket.submitted / bucket.opened) : 0,
      submitToCompleteRate: bucket.submitted > 0 ? roundRate(bucket.completed / bucket.submitted) : 0,
      averageEvidenceScore: bucket.evidenceCount > 0 ? roundRate(bucket.evidenceSum / bucket.evidenceCount) : null,
      estimatedMasteryLiftRate: bucket.completed > 0 ? roundRate(bucket.masteryLiftSignals / bucket.completed) : 0,
    }))
    .sort((a, b) =>
      b.completed - a.completed ||
      b.opened - a.opened ||
      b.estimatedMasteryLiftRate - a.estimatedMasteryLiftRate
    );

  const totalOpened = modules.reduce((sum, module) => sum + module.opened, 0);
  const totalSubmitted = modules.reduce((sum, module) => sum + module.submitted, 0);
  const totalCompleted = modules.reduce((sum, module) => sum + module.completed, 0);

  return {
    periodLabel: `Last ${periodDays} day${periodDays === 1 ? '' : 's'}`,
    totalOpened,
    totalSubmitted,
    totalCompleted,
    openToSubmitRate: totalOpened > 0 ? roundRate(totalSubmitted / totalOpened) : 0,
    submitToCompleteRate: totalSubmitted > 0 ? roundRate(totalCompleted / totalSubmitted) : 0,
    modules,
    topImprovingModules: [...modules]
      .filter((module) => module.completed > 0)
      .sort((a, b) =>
        b.estimatedMasteryLiftRate - a.estimatedMasteryLiftRate ||
        b.completed - a.completed
      )
      .slice(0, 4),
  };
}
