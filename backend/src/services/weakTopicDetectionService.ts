import prisma from '../lib/prisma';
import type { WeakTopicStatus, ProfileRecommendedAction, ProfileReasonCode } from '../contracts/studentLearningProfileContracts';

export interface WeakTopicResult {
  topicId: string;
  subjectId: string;
  weaknessScore: number;
  status: WeakTopicStatus;
  safeSummary: string;
  reasonCodes: ProfileReasonCode[];
  recommendedAction: ProfileRecommendedAction;
  safeEvidenceRefs: string[];
}

export interface ImprovingTopicResult {
  topicId: string;
  subjectId: string;
  improvementScore: number;
  reasonCodes: ProfileReasonCode[];
  safeEvidenceRefs: string[];
}

export async function detectWeakTopics(
  schoolId: string,
  studentId: string,
  subjectId?: string,
): Promise<WeakTopicResult[]> {
  const where: any = { schoolId, studentId };
  if (subjectId) where.subjectId = subjectId;

  const signals = await prisma.learningModeSignal.findMany({ where });
  const attempts = await prisma.learningModeAttempt.findMany({ where });
  const existingWeak = await prisma.growthWeakTopicState.findMany({ where: { userId: studentId } });

  // Group by topic
  const topicSignals = new Map<string, typeof signals>();
  const topicAttempts = new Map<string, typeof attempts>();

  for (const s of signals) {
    if (!s.topicId) continue;
    const arr = topicSignals.get(s.topicId) || [];
    arr.push(s);
    topicSignals.set(s.topicId, arr);
  }
  for (const a of attempts) {
    if (!a.topicId) continue;
    const arr = topicAttempts.get(a.topicId) || [];
    arr.push(a);
    topicAttempts.set(a.topicId, arr);
  }

  const results: WeakTopicResult[] = [];
  const allTopicIds = new Set([...topicSignals.keys(), ...topicAttempts.keys()]);

  for (const topicId of allTopicIds) {
    const tSignals = topicSignals.get(topicId) || [];
    const tAttempts = topicAttempts.get(topicId) || [];
    const subject = tSignals.find(s => s.subjectId)?.subjectId || subjectId || 'unknown';

    const incorrectCount = tAttempts.filter(a => a.isCorrect === false).length;
    const stuckCount = tSignals.filter(s =>
      s.signalType === 'stuck_detected' || s.signalType === 'repeated_mistake_detected'
    ).length;
    const hintCount = tAttempts.filter(a => a.usedHint === true).length;
    const recoveryCount = tSignals.filter(s => s.signalType === 'recovery_detected').length;
    const repeatedMistakeCount = tSignals.filter(s => s.signalType === 'repeated_mistake_detected').length;
    const attemptCount = tAttempts.length;

    // Weakness score: higher = weaker
    const correctCount = tAttempts.filter(a => a.isCorrect === true).length;

    let weaknessScore = 0;
    if (attemptCount > 0) {
      weaknessScore += (incorrectCount / attemptCount) * 3.0;
      weaknessScore += (stuckCount / Math.max(attemptCount, 1)) * 2.0;
      weaknessScore += (hintCount / Math.max(attemptCount, 1)) * 1.5;
      weaknessScore -= (recoveryCount / Math.max(attemptCount, 1)) * 1.0;
      weaknessScore += repeatedMistakeCount * 0.5;
    }

    const reasonCodes: ProfileReasonCode[] = [];
    if (repeatedMistakeCount > 1) reasonCodes.push('repeated_mistakes');
    if (hintCount > attemptCount * 0.5) reasonCodes.push('high_hint_dependency');
    if (stuckCount > recoveryCount && stuckCount > 0) reasonCodes.push('stuck_without_recovery');
    if (incorrectCount > correctCount && attemptCount > 2) reasonCodes.push('low_confidence');
    const improving = recoveryCount > 0 && correctCount > incorrectCount;
    const hasImproved = tSignals.some(s =>
      s.signalType === 'step_successful' || s.signalType === 'recovery_detected'
    );

    let status: WeakTopicStatus = 'identified';
    if (weaknessScore <= 1.0 && improving) status = 'resolved';
    else if (weaknessScore <= 2.0 && improving) status = 'improving';
    else if (weaknessScore <= 1.0) status = 'monitoring';

    // Check existing status
    const existing = existingWeak.find(w => w.topic === topicId);
    if (existing && status === 'identified' && existing.status === 'resolved') {
      status = 'resolved';
    }

    let recommendedAction: ProfileRecommendedAction = 'review_topic';
    if (weaknessScore <= 1.0 && improving) recommendedAction = 'move_to_next_topic';
    else if (weaknessScore <= 2.0) recommendedAction = 'practice_more';
    else if (reasonCodes.includes('high_hint_dependency')) recommendedAction = 'try_smaller_step';

    if (!hasImproved && weaknessScore > 0) {
      results.push({
        topicId,
        subjectId: subject,
        weaknessScore: Math.round(weaknessScore * 100) / 100,
        status,
        safeSummary: buildWeakTopicSafeSummary(weaknessScore, incorrectCount, stuckCount, hintCount, recoveryCount),
        reasonCodes,
        recommendedAction,
        safeEvidenceRefs: tSignals.slice(0, 5).map(s => s.id),
      });
    }
  }

  return results.sort((a, b) => b.weaknessScore - a.weaknessScore);
}

export async function detectImprovingTopics(
  schoolId: string,
  studentId: string,
  subjectId?: string,
): Promise<ImprovingTopicResult[]> {
  const where: any = { schoolId, studentId };
  if (subjectId) where.subjectId = subjectId;

  const signals = await prisma.learningModeSignal.findMany({
    where: {
      ...where,
      signalType: { in: ['recovery_detected', 'step_successful', 'reflection_detected'] },
    },
  });
  const attempts = await prisma.learningModeAttempt.findMany({ where });

  const topicMap = new Map<string, { recoveryCount: number; stepSuccessCount: number; correctAfterIncorrect: number; totalAttempts: number; correctCount: number }>();

  for (const s of signals) {
    if (!s.topicId) continue;
    const entry = topicMap.get(s.topicId) || { recoveryCount: 0, stepSuccessCount: 0, correctAfterIncorrect: 0, totalAttempts: 0, correctCount: 0 };
    if (s.signalType === 'recovery_detected') entry.recoveryCount++;
    if (s.signalType === 'step_successful') entry.stepSuccessCount++;
    topicMap.set(s.topicId, entry);
  }

  const sortedAttempts = attempts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (let i = 1; i < sortedAttempts.length; i++) {
    const prev = sortedAttempts[i - 1];
    const curr = sortedAttempts[i];
    if (prev.isCorrect === false && curr.isCorrect === true && prev.topicId === curr.topicId && prev.topicId) {
      const entry = topicMap.get(prev.topicId) || { recoveryCount: 0, stepSuccessCount: 0, correctAfterIncorrect: 0, totalAttempts: 0, correctCount: 0 };
      entry.correctAfterIncorrect++;
      topicMap.set(prev.topicId, entry);
    }
  }
  for (const a of attempts) {
    if (!a.topicId) continue;
    const entry = topicMap.get(a.topicId) || { recoveryCount: 0, stepSuccessCount: 0, correctAfterIncorrect: 0, totalAttempts: 0, correctCount: 0 };
    entry.totalAttempts++;
    if (a.isCorrect === true) entry.correctCount++;
    topicMap.set(a.topicId, entry);
  }

  const results: ImprovingTopicResult[] = [];
  for (const [topicId, stats] of topicMap) {
    if (stats.recoveryCount > 0 || stats.correctAfterIncorrect > 0) {
      const improvementScore = (stats.recoveryCount * 0.4 + stats.stepSuccessCount * 0.3 + stats.correctAfterIncorrect * 0.5) / Math.max(stats.totalAttempts, 1);
      const reasonCodes: ProfileReasonCode[] = [];
      if (stats.recoveryCount > 0) reasonCodes.push('recovery_after_hint');
      if (stats.correctAfterIncorrect > 0) reasonCodes.push('recent_correct');
      if (stats.correctCount > stats.totalAttempts * 0.6 && stats.totalAttempts > 2) reasonCodes.push('improving_trend');

      results.push({
        topicId,
        subjectId: subjectId || 'unknown',
        improvementScore: Math.round(improvementScore * 100) / 100,
        reasonCodes,
        safeEvidenceRefs: [],
      });
    }
  }

  return results.sort((a, b) => b.improvementScore - a.improvementScore);
}

export function rankWeakTopics(weakTopics: WeakTopicResult[]): WeakTopicResult[] {
  return [...weakTopics].sort((a, b) => b.weaknessScore - a.weaknessScore);
}

function buildWeakTopicSafeSummary(
  weaknessScore: number,
  incorrectCount: number,
  stuckCount: number,
  hintCount: number,
  recoveryCount: number,
): string {
  const parts: string[] = [];
  if (incorrectCount > 2) parts.push(`${incorrectCount} incorrect attempts`);
  if (stuckCount > 1) parts.push(`stuck ${stuckCount} times`);
  if (hintCount > 2) parts.push(`needed ${hintCount} hints`);
  if (recoveryCount > 0) parts.push(`${recoveryCount} recoveries`);
  if (parts.length === 0) return 'Limited evidence available';
  return parts.join('; ');
}
