import prisma from '../utils/prismaClient';
import type {
  MasteryEvidenceSignal,
  TopicMasteryState,
} from '../lib/types';
import { ensureLearningEffectEventTable } from './learningEffectivenessService';
import { buildTopicMasteryState } from './microMasteryService';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

const POSITIVE_WEIGHTS: Partial<Record<MasteryEvidenceSignal['evidenceType'], number>> = {
  attempted_after_prompt: 3,
  correct_after_support: 8,
  repeated_mistake_reduced: 7,
  similar_problem_success: 10,
  explain_back_success: 9,
  revision_reuse_success: 8,
  support_strategy_helped: 5,
};

const NEGATIVE_WEIGHTS: Partial<Record<MasteryEvidenceSignal['evidenceType'], number>> = {
  repeated_mistake: -10,
  needed_multiple_hints: -8,
  support_strategy_failed: -6,
};

function getEvidenceDelta(signal: MasteryEvidenceSignal): number {
  if (typeof signal.weight === 'number') return signal.weight;
  return POSITIVE_WEIGHTS[signal.evidenceType] || NEGATIVE_WEIGHTS[signal.evidenceType] || 0;
}

function isNegativeEvidence(signal: MasteryEvidenceSignal): boolean {
  return ['repeated_mistake', 'needed_multiple_hints', 'support_strategy_failed'].includes(signal.evidenceType);
}

function buildTopicSummary(args: {
  label: TopicMasteryState['label'];
  repeatedMistakeRate?: number | null;
  recentImprovement?: TopicMasteryState['recentImprovement'];
}): string {
  if (args.label === 'confident') return 'This topic is holding up well across recent practice.';
  if (args.label === 'almost_there') return 'The understanding is close, but one more successful pass should help it settle.';
  if (args.label === 'getting_better') {
    if (args.recentImprovement === 'improving') {
      return 'There is real improvement here, but a little more guided practice is still useful.';
    }
    return 'This topic is moving in the right direction, but it still needs reinforcement.';
  }
  if ((args.repeatedMistakeRate || 0) >= 0.4) {
    return 'This topic still needs a slower rebuild because the same mistake keeps returning.';
  }
  return 'This topic is still learning and benefits from a gentler rebuild.';
}

function buildNextBestStep(args: {
  label: TopicMasteryState['label'];
  repeatedMistakeRate?: number | null;
  supportDependenceLevel?: number | null;
}): string {
  if (args.label === 'confident') return 'Try one fresh question without help to confirm it still feels steady.';
  if (args.label === 'almost_there') return 'Try one similar question now and watch the earlier weak point carefully.';
  if ((args.repeatedMistakeRate || 0) >= 0.34) {
    return 'Go back to the foundation, answer one small recall check, then try a simpler version.';
  }
  if ((args.supportDependenceLevel || 0) >= 0.45) {
    return 'Use one smaller example first, then move into your own attempt.';
  }
  return 'Stay with one guided example, then try the next step yourself.';
}

export async function getTopicMasteryState(args: {
  userId: string;
  topic?: string | null;
  subject?: string | null;
}): Promise<TopicMasteryState | null> {
  const topic = safeString(args.topic).trim();
  if (!topic) return null;

  await ensureLearningEffectEventTable();

  const [progress, mistake, learningEvents] = await Promise.all([
    prisma.progress.findFirst({
      where: { studentId: args.userId, topic: { equals: topic, mode: 'insensitive' } },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.mistake.findFirst({
      where: { studentId: args.userId, topic: { equals: topic, mode: 'insensitive' } },
      orderBy: { lastSeen: 'desc' },
    }),
    prisma.learningEffectEvent.findMany({
      where: {
        userId: args.userId,
        topic: { equals: topic, mode: 'insensitive' },
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    }),
  ]);

  const positiveSignals = new Set([
    'correct_after_support',
    'similar_problem_success',
    'repeated_mistake_reduced',
    'explain_back_success',
    'explained_in_own_words',
    'revision_reuse_success',
    'revision_reuse',
    'transfer_success',
    'concept_explanation_success',
    'practice_completion',
    'topic_return_with_improvement',
    'weak_topic_improvement',
    'support_strategy_helped',
  ]);
  const negativeSignals = new Set([
    'repeated_mistake',
    'needed_multiple_hints',
    'support_strategy_failed',
  ]);

  const positiveCount = learningEvents.filter((event) => positiveSignals.has(safeString(event.eventType).trim())).length;
  const negativeCount = learningEvents.filter((event) => negativeSignals.has(safeString(event.eventType).trim())).length;
  const supportDependenceEvents = learningEvents.filter((event) =>
    ['needed_multiple_hints', 'chose_hint_before_full_explanation'].includes(safeString(event.eventType).trim())
  ).length;

  const progressMastery = Number(progress?.mastery || 0);
  const repeatedMistakes = Number(mistake?.attempts || 0) + negativeCount;
  const evidenceCount = Math.max(0, positiveCount + negativeCount + (progress ? 1 : 0));
  const repeatedMistakeRate = evidenceCount > 0 ? repeatedMistakes / Math.max(1, evidenceCount + positiveCount) : 0;
  const supportDependenceLevel =
    evidenceCount > 0 ? supportDependenceEvents / Math.max(1, evidenceCount + supportDependenceEvents) : 0;

  let recentImprovement: TopicMasteryState['recentImprovement'] = 'flat';
  if (positiveCount >= negativeCount + 2) recentImprovement = 'improving';
  if (negativeCount >= positiveCount + 2) recentImprovement = 'declining';

  const evidenceScore = clamp(progressMastery + positiveCount * 6 - negativeCount * 8 - Number(mistake?.attempts || 0) * 3);
  const labelPreview = buildTopicMasteryState({
    topic,
    subject: args.subject || progress?.subject || null,
    evidenceScore,
    evidenceCount,
    lastPracticedAt: progress?.updatedAt?.toISOString?.() || mistake?.lastSeen?.toISOString?.() || null,
    recentImprovement,
    repeatedMistakeRate,
    supportDependenceLevel,
  });

  return {
    ...labelPreview,
    summary: buildTopicSummary({
      label: labelPreview.label,
      repeatedMistakeRate,
      recentImprovement,
    }),
    nextBestStep: buildNextBestStep({
      label: labelPreview.label,
      repeatedMistakeRate,
      supportDependenceLevel,
    }),
  };
}

export async function recordMasteryEvidenceSignal(args: {
  userId: string;
  signal: MasteryEvidenceSignal;
  metadata?: Record<string, unknown> | null;
}): Promise<TopicMasteryState | null> {
  const topic = safeString(args.signal.topic).trim();
  if (!topic) return null;

  const delta = getEvidenceDelta(args.signal);
  const existingProgress = await prisma.progress.findFirst({
    where: { studentId: args.userId, topic: { equals: topic, mode: 'insensitive' } },
    orderBy: { updatedAt: 'desc' },
  });
  const subject = safeString(args.signal.subject).trim() || existingProgress?.subject || 'General';

  const currentMastery = Number(existingProgress?.mastery || 0);
  const nextMastery = clamp(currentMastery + delta);

  if (existingProgress) {
    await prisma.progress.update({
      where: { id: existingProgress.id },
      data: {
        mastery: nextMastery,
        subject,
      },
    });
  } else {
    await prisma.progress.create({
      data: {
        studentId: args.userId,
        subject,
        topic,
        mastery: clamp(Math.max(10, 40 + delta)),
      },
    });
  }

  if (isNegativeEvidence(args.signal)) {
    const misconception = safeString(args.metadata?.misconception || args.metadata?.reason || '').trim()
      || 'Needs a calmer rebuild on this topic.';
    const existingMistake = await prisma.mistake.findFirst({
      where: { studentId: args.userId, topic: { equals: topic, mode: 'insensitive' } },
      orderBy: { lastSeen: 'desc' },
    });
    if (existingMistake) {
      await prisma.mistake.update({
        where: { id: existingMistake.id },
        data: {
          attempts: { increment: 1 },
          error: misconception,
          lastSeen: new Date(),
        },
      });
    } else {
      await prisma.mistake.create({
        data: {
          studentId: args.userId,
          topic,
          error: misconception,
          attempts: 1,
        },
      });
    }
  } else if (nextMastery >= 80) {
    await prisma.mistake.deleteMany({
      where: { studentId: args.userId, topic: { equals: topic, mode: 'insensitive' } },
    });
  }

  return getTopicMasteryState({
    userId: args.userId,
    topic,
    subject,
  });
}
