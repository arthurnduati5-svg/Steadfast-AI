import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { QuizModeExitReason } from '../contracts/quizModeContracts';
import { createSignal } from './learningSignalService';
import { generateExitSummaryFromSignals } from './modeExitSummaryService';

export interface CreateQuizSummaryInput {
  quizSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  finalStage: string;
  exitReason: string;
  questionCount: number;
  attemptCount: number;
  correctCount: number;
  partialCount: number;
  incorrectCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  skippedCount: number;
  flaggedCount: number;
  estimatedRecallStrengthBucket?: string;
  estimatedReadinessBucket?: string;
  masterySignal?: string;
  safeEvidenceRefs?: string[];
}

export async function createQuizSummary(input: CreateQuizSummaryInput) {
  const summary = await prisma.quizModeSummaryRecord.create({
    data: {
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      quizSessionId: input.quizSessionId,
      modeSessionId: input.modeSessionId,
      finalStage: input.finalStage,
      exitReason: input.exitReason,
      questionCount: input.questionCount,
      attemptCount: input.attemptCount,
      correctCount: input.correctCount,
      partialCount: input.partialCount,
      incorrectCount: input.incorrectCount,
      hintCount: input.hintCount,
      stuckCount: input.stuckCount,
      recoveryCount: input.recoveryCount,
      skippedCount: input.skippedCount,
      flaggedCount: input.flaggedCount,
      estimatedRecallStrengthBucket: input.estimatedRecallStrengthBucket || null,
      estimatedReadinessBucket: input.estimatedReadinessBucket || null,
      masterySignal: input.masterySignal || null,
      summarySignalJson: {},
      safeEvidenceRefsJson: input.safeEvidenceRefs || [],
    },
  });

  try {
    await generateExitSummaryFromSignals(
      input.modeSessionId,
      input.schoolId,
      input.studentId,
      'quiz',
    );
  } catch {
    // Non-critical
  }

  try {
    await createSignal({
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      signalType: 'mode_summary_created',
      stage: 'summarizing' as any,
    });
  } catch {
    // Non-critical
  }

  return summary;
}

export async function getQuizSummaryForSession(quizSessionId: string) {
  return prisma.quizModeSummaryRecord.findFirst({
    where: { quizSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

export function serializeQuizSummary(summary: any) {
  return {
    id: summary.id,
    quizSessionId: summary.quizSessionId,
    modeSessionId: summary.modeSessionId,
    finalStage: summary.finalStage,
    exitReason: summary.exitReason,
    questionCount: summary.questionCount,
    attemptCount: summary.attemptCount,
    correctCount: summary.correctCount,
    partialCount: summary.partialCount,
    incorrectCount: summary.incorrectCount,
    hintCount: summary.hintCount,
    stuckCount: summary.stuckCount,
    recoveryCount: summary.recoveryCount,
    skippedCount: summary.skippedCount,
    flaggedCount: summary.flaggedCount,
    estimatedRecallStrengthBucket: summary.estimatedRecallStrengthBucket || undefined,
    estimatedReadinessBucket: summary.estimatedReadinessBucket || undefined,
    masterySignal: summary.masterySignal || undefined,
    summarySignal: summary.summarySignalJson || {},
    safeEvidenceRefs: summary.safeEvidenceRefsJson || [],
    createdAt: summary.createdAt.toISOString(),
  };
}
