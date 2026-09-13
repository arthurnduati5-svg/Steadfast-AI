import prisma from '../lib/prisma';
import type { RecommendedNextAction } from '../contracts/learningModeContracts';

export interface CreateExitSummaryInput {
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  mode: string;
  topicId?: string;
  subjectId?: string;
  skillsTouched?: string[];
  strengthSignals?: string[];
  weaknessSignals?: string[];
  hintsUsedCount?: number;
  attemptsCount?: number;
  stuckCount?: number;
  recoveryCount?: number;
  finalUnderstandingLevel?: string;
  recommendedNextAction?: RecommendedNextAction;
}

export async function createExitSummary(input: CreateExitSummaryInput) {
  return prisma.learningModeExitSummary.create({
    data: {
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      mode: input.mode,
      topicId: input.topicId || null,
      subjectId: input.subjectId || null,
      skillsTouched: input.skillsTouched || [],
      strengthSignals: input.strengthSignals || [],
      weaknessSignals: input.weaknessSignals || [],
      hintsUsedCount: input.hintsUsedCount ?? 0,
      attemptsCount: input.attemptsCount ?? 0,
      stuckCount: input.stuckCount ?? 0,
      recoveryCount: input.recoveryCount ?? 0,
      finalUnderstandingLevel: input.finalUnderstandingLevel || null,
      recommendedNextAction: input.recommendedNextAction || null,
    },
  });
}

export async function getExitSummaryForSession(modeSessionId: string) {
  return prisma.learningModeExitSummary.findUnique({
    where: { modeSessionId },
  });
}

export async function generateExitSummaryFromSignals(
  modeSessionId: string,
  schoolId: string,
  studentId: string,
  mode: string,
  topicId?: string,
  subjectId?: string,
) {
  const signals = await prisma.learningModeSignal.findMany({
    where: { modeSessionId },
  });
  const attempts = await prisma.learningModeAttempt.findMany({
    where: { modeSessionId },
  });
  const hints = await prisma.learningModeHintEvent.findMany({
    where: { modeSessionId },
  });

  const strengthSignals = signals
    .filter(s => ['recovery_detected', 'step_successful', 'reflection_detected', 'readiness_check_submitted', 'teach_back_submitted'].includes(s.signalType))
    .map(s => s.signalType);

  const weaknessSignals = signals
    .filter(s => ['stuck_detected', 'mistake_detected', 'repeated_mistake_detected'].includes(s.signalType))
    .map(s => s.signalType);

  const stuckCount = signals.filter(s => s.signalType === 'stuck_detected' || s.signalType === 'repeated_mistake_detected').length;
  const recoveryCount = signals.filter(s => s.signalType === 'recovery_detected').length;

  const skillsTouched = [...new Set([
    ...signals.filter(s => s.skillId).map(s => s.skillId!),
    ...attempts.filter(a => a.skillId).map(a => a.skillId!),
  ])];

  const attemptsCount = attempts.length;
  const hintsUsedCount = hints.length;

  const correctAttempts = attempts.filter(a => a.isCorrect === true).length;
  const totalAttempts = attempts.length;
  let finalUnderstandingLevel = 'not_assessed';
  if (totalAttempts > 0) {
    const ratio = correctAttempts / totalAttempts;
    if (ratio >= 0.8) finalUnderstandingLevel = 'strong';
    else if (ratio >= 0.6) finalUnderstandingLevel = 'satisfactory';
    else if (ratio >= 0.3) finalUnderstandingLevel = 'partial';
    else finalUnderstandingLevel = 'needs_improvement';
  }

  let recommendedNextAction: string | undefined;
  if (finalUnderstandingLevel === 'strong') {
    recommendedNextAction = 'move_to_next_topic';
  } else if (finalUnderstandingLevel === 'satisfactory' || finalUnderstandingLevel === 'partial') {
    recommendedNextAction = 'practice_more';
  } else if (finalUnderstandingLevel === 'needs_improvement') {
    recommendedNextAction = 'review_topic';
  }

  return createExitSummary({
    modeSessionId,
    schoolId,
    studentId,
    mode,
    topicId,
    subjectId,
    skillsTouched,
    strengthSignals: [...new Set(strengthSignals)],
    weaknessSignals: [...new Set(weaknessSignals)],
    hintsUsedCount,
    attemptsCount,
    stuckCount,
    recoveryCount,
    finalUnderstandingLevel,
    recommendedNextAction: recommendedNextAction as RecommendedNextAction | undefined,
  });
}

export function serializeExitSummary(summary: any) {
  return {
    id: summary.id,
    modeSessionId: summary.modeSessionId,
    mode: summary.mode,
    topicId: summary.topicId || undefined,
    subjectId: summary.subjectId || undefined,
    skillsTouched: summary.skillsTouched,
    strengthSignals: summary.strengthSignals,
    weaknessSignals: summary.weaknessSignals,
    hintsUsedCount: summary.hintsUsedCount,
    attemptsCount: summary.attemptsCount,
    stuckCount: summary.stuckCount,
    recoveryCount: summary.recoveryCount,
    finalUnderstandingLevel: summary.finalUnderstandingLevel || undefined,
    recommendedNextAction: summary.recommendedNextAction || undefined,
    createdAt: summary.createdAt.toISOString(),
  };
}
