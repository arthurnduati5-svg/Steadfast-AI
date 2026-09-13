import prisma from '../lib/prisma';
import type { MasteryLevel, MasteryStatus } from '../contracts/studentLearningProfileContracts';

// ── Score Formula ──
// baseScore = correctCount * 1.0 + partialCount * 0.45 + recoveryCount * 0.35 + teachBackSuccessCount * 0.75
//             - incorrectCount * 0.35 - repeatedMistakeCount * 0.45 - highHintDependencyPenalty - stuckPenalty
// confidenceScore = clamp(0.15 + evidenceCountFactor + recencyFactor + consistencyFactor, 0, 1)

export interface MasteryInput {
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  teachBackSuccessCount: number;
  repeatedMistakeCount: number;
  misconceptionCount: number;
  lastAttemptAt: Date | null;
  lastCorrectAt: Date | null;
}

export function calculateMasteryScore(input: MasteryInput): {
  baseScore: number;
  confidenceScore: number;
  masteryLevel: MasteryLevel;
  masteryStatus: MasteryStatus;
} {
  const highHintDependencyPenalty = input.hintCount > input.attemptCount * 0.5
    ? (input.hintCount / Math.max(input.attemptCount, 1)) * 0.5
    : 0;

  const stuckPenalty = input.stuckCount > 2
    ? (input.stuckCount / Math.max(input.attemptCount, 1)) * 0.3
    : 0;

  const baseScore =
    input.correctCount * 1.0
    + input.partialCount * 0.45
    + input.recoveryCount * 0.35
    + input.teachBackSuccessCount * 0.75
    - input.incorrectCount * 0.35
    - input.repeatedMistakeCount * 0.45
    - highHintDependencyPenalty
    - stuckPenalty;

  // Confidence score
  const evidenceCountFactor = Math.min(input.attemptCount / 20, 0.5);
  const recencyFactor = input.lastCorrectAt
    ? Math.min((Date.now() - input.lastCorrectAt.getTime()) / (7 * 24 * 60 * 60 * 1000), 0.2)
    : 0;
  const consistencyFactor = input.attemptCount > 0 && input.correctCount > 0
    ? Math.min((input.correctCount / Math.max(input.attemptCount, 1)) * 0.15, 0.15)
    : 0;
  const confidenceScore = Math.max(0, Math.min(1, 0.15 + evidenceCountFactor + (1 - recencyFactor) * 0.1 + consistencyFactor));

  const masteryLevel = mapScoreToMasteryLevel(baseScore, input.attemptCount);
  const masteryStatus = mapMasteryStatus(baseScore, input.attemptCount, input.recoveryCount, input.stuckCount);

  return { baseScore, confidenceScore, masteryLevel, masteryStatus };
}

export function mapScoreToMasteryLevel(score: number, evidenceCount: number): MasteryLevel {
  if (evidenceCount === 0) return 'unknown';
  if (score <= 0) return 'not_started';
  if (score < 1.0) return 'emerging';
  if (score < 2.5) return 'developing';
  if (score < 4.0) return 'nearly_secure';
  if (score < 6.0) return 'secure';
  return 'strong';
}

export function mapMasteryStatus(
  score: number,
  evidenceCount: number,
  recoveryCount: number,
  stuckCount: number,
): MasteryStatus {
  if (evidenceCount === 0) return 'inactive';
  if (score > 4.0 && recoveryCount > stuckCount) return 'improving';
  if (score > 5.0 && recoveryCount >= 0) return 'ready_for_challenge';
  if (stuckCount > recoveryCount && stuckCount > 2) return 'stuck';
  if (score < 1.0 && evidenceCount > 0) return 'needs_review';
  return 'active';
}

export function calculateConfidenceScore(
  evidenceCount: number,
  attemptCount: number,
  correctCount: number,
  lastObservedAt: Date | null,
): number {
  if (attemptCount === 0) return 0;
  const evidenceFactor = Math.min(evidenceCount / 15, 0.4);
  const accuracyFactor = (correctCount / attemptCount) * 0.3;
  const recencyFactor = lastObservedAt
    ? Math.max(0, 0.3 - (Date.now() - lastObservedAt.getTime()) / (30 * 24 * 60 * 60 * 1000) * 0.3)
    : 0;
  return Math.max(0, Math.min(1, 0.15 + evidenceFactor + accuracyFactor + recencyFactor));
}

export async function aggregateSkillMastery(
  schoolId: string,
  studentId: string,
  subject: string,
  topic: string,
  skillId: string,
): Promise<{
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  misconceptionCount: number;
}> {
  const attempts = await prisma.learningModeAttempt.findMany({
    where: { schoolId, studentId, skillId },
  });
  const signals = await prisma.learningModeSignal.findMany({
    where: { schoolId, studentId, skillId },
  });

  const attemptCount = attempts.length;
  const correctCount = attempts.filter(a => a.isCorrect === true).length;
  const incorrectCount = attempts.filter(a => a.isCorrect === false).length;
  const partialCount = attempts.filter(a =>
    a.answerQuality === 'partially_correct' || (a.isCorrect === null && a.answerQuality !== 'incorrect')
  ).length;
  const hintCount = attempts.filter(a => a.usedHint === true).length;
  const stuckCount = signals.filter(s =>
    s.signalType === 'stuck_detected' || s.signalType === 'repeated_mistake_detected'
  ).length;
  const recoveryCount = signals.filter(s => s.signalType === 'recovery_detected').length;
  const misconceptionCount = signals.filter(s => s.signalType === 'mistake_detected').length;

  return {
    attemptCount, correctCount, partialCount, incorrectCount,
    hintCount, stuckCount, recoveryCount, misconceptionCount,
  };
}

export async function aggregateTopicMastery(
  schoolId: string,
  studentId: string,
  subject: string,
  topic: string,
): Promise<{
  skillCount: number;
  totalAttemptCount: number;
  totalCorrectCount: number;
  totalIncorrectCount: number;
  totalHintCount: number;
  totalStuckCount: number;
  totalRecoveryCount: number;
}> {
  const attempts = await prisma.learningModeAttempt.findMany({
    where: { schoolId, studentId, topicId: topic },
  });
  const signals = await prisma.learningModeSignal.findMany({
    where: { schoolId, studentId, topicId: topic },
  });
  const skills = await prisma.skillMasterySnapshot.findMany({
    where: { schoolId, studentId, subject, topic },
  });

  return {
    skillCount: skills.length,
    totalAttemptCount: attempts.length,
    totalCorrectCount: attempts.filter(a => a.isCorrect === true).length,
    totalIncorrectCount: attempts.filter(a => a.isCorrect === false).length,
    totalHintCount: attempts.filter(a => a.usedHint === true).length,
    totalStuckCount: signals.filter(s =>
      s.signalType === 'stuck_detected' || s.signalType === 'repeated_mistake_detected'
    ).length,
    totalRecoveryCount: signals.filter(s => s.signalType === 'recovery_detected').length,
  };
}
