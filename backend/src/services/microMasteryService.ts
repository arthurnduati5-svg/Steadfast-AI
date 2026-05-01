import type {
  MicroMasteryLabel,
  TopicMasteryState,
} from '../lib/types';

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

export function deriveMicroMasteryLabel(args: {
  evidenceScore: number;
  evidenceCount?: number;
  repeatedMistakeRate?: number | null;
  supportDependenceLevel?: number | null;
  recentImprovement?: TopicMasteryState['recentImprovement'];
}): MicroMasteryLabel {
  const evidenceScore = clamp(args.evidenceScore);
  const evidenceCount = Math.max(0, Number(args.evidenceCount || 0));
  const repeatedMistakeRate = Math.max(0, Number(args.repeatedMistakeRate || 0));
  const supportDependenceLevel = Math.max(0, Number(args.supportDependenceLevel || 0));

  if (evidenceCount < 2) {
    if (evidenceScore >= 72) return 'getting_better';
    return 'still_learning';
  }

  if (evidenceScore >= 82 && repeatedMistakeRate <= 0.2 && supportDependenceLevel <= 0.28) {
    return 'confident';
  }

  if (evidenceScore >= 64 && repeatedMistakeRate <= 0.34) {
    return args.recentImprovement === 'improving' ? 'almost_there' : 'getting_better';
  }

  if (evidenceScore >= 46) {
    return args.recentImprovement === 'declining' ? 'still_learning' : 'getting_better';
  }

  return 'still_learning';
}

export function buildTopicMasteryState(args: {
  topic: string;
  subject?: string | null;
  evidenceScore: number;
  evidenceCount?: number;
  lastPracticedAt?: string | null;
  recentImprovement?: TopicMasteryState['recentImprovement'];
  repeatedMistakeRate?: number | null;
  supportDependenceLevel?: number | null;
  summary?: string | null;
  nextBestStep?: string | null;
}): TopicMasteryState {
  return {
    topic: args.topic,
    subject: args.subject || null,
    label: deriveMicroMasteryLabel({
      evidenceScore: args.evidenceScore,
      evidenceCount: args.evidenceCount,
      recentImprovement: args.recentImprovement,
      repeatedMistakeRate: args.repeatedMistakeRate,
      supportDependenceLevel: args.supportDependenceLevel,
    }),
    evidenceScore: clamp(Number(args.evidenceScore || 0)),
    evidenceCount: Math.max(0, Number(args.evidenceCount || 0)),
    lastPracticedAt: args.lastPracticedAt || null,
    recentImprovement: args.recentImprovement || null,
    repeatedMistakeRate:
      args.repeatedMistakeRate == null
        ? null
        : Number(Math.max(0, Math.min(1, args.repeatedMistakeRate)).toFixed(2)),
    supportDependenceLevel:
      args.supportDependenceLevel == null
        ? null
        : Number(Math.max(0, Math.min(1, args.supportDependenceLevel)).toFixed(2)),
    summary: args.summary || null,
    nextBestStep: args.nextBestStep || null,
  };
}
