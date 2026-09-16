import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { ExamModeExitReason, MasterySignal, EstimatedReadinessBucket } from '../contracts/examModeContracts';
import { createSignal } from './learningSignalService';
import { generateExitSummaryFromSignals } from './modeExitSummaryService';

export interface CreateExamSummaryInput {
  examSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  finalStage: string;
  exitReason: string;
  questionCount: number;
  attemptCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  skippedCount: number;
  flaggedCount: number;
  estimatedReadinessBucket?: string;
  masterySignal?: string;
  safeEvidenceRefs?: string[];
}

export async function createExamSummary(input: CreateExamSummaryInput) {
  const summary = await prisma.examModeSummaryRecord.create({
    data: {
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      examSessionId: input.examSessionId,
      modeSessionId: input.modeSessionId,
      finalStage: input.finalStage,
      exitReason: input.exitReason,
      questionCount: input.questionCount,
      attemptCount: input.attemptCount,
      hintCount: input.hintCount,
      stuckCount: input.stuckCount,
      recoveryCount: input.recoveryCount,
      skippedCount: input.skippedCount,
      flaggedCount: input.flaggedCount,
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
      'exam',
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

export async function getExamSummaryForSession(examSessionId: string) {
  return prisma.examModeSummaryRecord.findFirst({
    where: { examSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

export function serializeExamSummary(summary: any) {
  return {
    id: summary.id,
    examSessionId: summary.examSessionId,
    modeSessionId: summary.modeSessionId,
    finalStage: summary.finalStage,
    exitReason: summary.exitReason,
    questionCount: summary.questionCount,
    attemptCount: summary.attemptCount,
    hintCount: summary.hintCount,
    stuckCount: summary.stuckCount,
    recoveryCount: summary.recoveryCount,
    skippedCount: summary.skippedCount,
    flaggedCount: summary.flaggedCount,
    estimatedReadinessBucket: summary.estimatedReadinessBucket || undefined,
    masterySignal: summary.masterySignal || undefined,
    summarySignal: summary.summarySignalJson || {},
    safeEvidenceRefs: summary.safeEvidenceRefsJson || [],
    createdAt: summary.createdAt.toISOString(),
  };
}
