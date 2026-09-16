import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { FocusModeExitReason } from '../contracts/focusModeContracts';
import { createSignal } from './learningSignalService';
import { generateExitSummaryFromSignals } from './modeExitSummaryService';

export interface CreateFocusSummaryInput {
  focusSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  finalStage: string;
  exitReason: string;
  attemptCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  masterySignal?: string;
  safeEvidenceRefs?: string[];
}

export async function createFocusSummary(input: CreateFocusSummaryInput) {
  const summary = await prisma.focusModeSummaryRecord.create({
    data: {
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      focusSessionId: input.focusSessionId,
      modeSessionId: input.modeSessionId,
      finalStage: input.finalStage,
      exitReason: input.exitReason,
      attemptCount: input.attemptCount,
      hintCount: input.hintCount,
      stuckCount: input.stuckCount,
      recoveryCount: input.recoveryCount,
      masterySignal: input.masterySignal || null,
      summarySignalJson: {},
      safeEvidenceRefsJson: input.safeEvidenceRefs || [],
    },
  });

  // Bridge to Task 001 exit summary
  try {
    await generateExitSummaryFromSignals(
      input.modeSessionId,
      input.schoolId,
      input.studentId,
      'focus',
    );
  } catch {
    // Non-critical
  }

  // Write mode_summary_created signal
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

export async function getFocusSummaryForSession(focusSessionId: string) {
  return prisma.focusModeSummaryRecord.findFirst({
    where: { focusSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

export function serializeFocusSummary(summary: any) {
  return {
    id: summary.id,
    focusSessionId: summary.focusSessionId,
    modeSessionId: summary.modeSessionId,
    finalStage: summary.finalStage,
    exitReason: summary.exitReason,
    attemptCount: summary.attemptCount,
    hintCount: summary.hintCount,
    stuckCount: summary.stuckCount,
    recoveryCount: summary.recoveryCount,
    masterySignal: summary.masterySignal || undefined,
    summarySignal: summary.summarySignalJson || {},
    safeEvidenceRefs: summary.safeEvidenceRefsJson || [],
    createdAt: summary.createdAt.toISOString(),
  };
}
