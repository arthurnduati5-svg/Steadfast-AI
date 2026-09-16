import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { TeachBackModeSummary } from '../contracts/teachBackModeContracts';
import { createSignal } from './learningSignalService';

export interface CreateSummaryInput {
  schoolId: string;
  studentId: string;
  teachBackSessionId: string;
  modeSessionId: string;
  finalStage: string;
  exitReason: string;
  promptCount: number;
  attemptCount: number;
  strongExplanationCount: number;
  partialExplanationCount: number;
  weakExplanationCount: number;
  misconceptionCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  reflectionCount: number;
  estimatedExplanationStrengthBucket?: string;
  estimatedReadinessSignal?: string;
  masterySignal?: string;
  summarySignal?: Record<string, unknown>;
  safeEvidenceRefs?: string[];
}

export async function createTeachBackSummary(input: CreateSummaryInput) {
  const summary = await prisma.teachBackModeSummaryRecord.create({
    data: {
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      teachBackSessionId: input.teachBackSessionId,
      modeSessionId: input.modeSessionId,
      finalStage: input.finalStage,
      exitReason: input.exitReason,
      promptCount: input.promptCount,
      attemptCount: input.attemptCount,
      strongExplanationCount: input.strongExplanationCount,
      partialExplanationCount: input.partialExplanationCount,
      weakExplanationCount: input.weakExplanationCount,
      misconceptionCount: input.misconceptionCount,
      hintCount: input.hintCount,
      stuckCount: input.stuckCount,
      recoveryCount: input.recoveryCount,
      reflectionCount: input.reflectionCount,
      estimatedExplanationStrengthBucket: input.estimatedExplanationStrengthBucket || null,
      estimatedReadinessSignal: input.estimatedReadinessSignal || null,
      masterySignal: input.masterySignal || null,
      summarySignalJson: (input.summarySignal || {}) as any,
      safeEvidenceRefsJson: input.safeEvidenceRefs || [],
    },
  });

  try {
    await createSignal({
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      signalType: 'mode_summary_created' as any,
      stage: 'summarizing' as any,
    });
  } catch {
    // Non-critical
  }

  return summary;
}

export async function getTeachBackSummaryForSession(teachBackSessionId: string) {
  return prisma.teachBackModeSummaryRecord.findFirst({
    where: { teachBackSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

export function serializeTeachBackSummary(summary: any): TeachBackModeSummary {
  return {
    id: summary.id,
    teachBackSessionId: summary.teachBackSessionId,
    modeSessionId: summary.modeSessionId,
    finalStage: summary.finalStage,
    exitReason: summary.exitReason,
    promptCount: summary.promptCount,
    attemptCount: summary.attemptCount,
    strongExplanationCount: summary.strongExplanationCount,
    partialExplanationCount: summary.partialExplanationCount,
    weakExplanationCount: summary.weakExplanationCount,
    misconceptionCount: summary.misconceptionCount,
    hintCount: summary.hintCount,
    stuckCount: summary.stuckCount,
    recoveryCount: summary.recoveryCount,
    reflectionCount: summary.reflectionCount,
    estimatedExplanationStrengthBucket: summary.estimatedExplanationStrengthBucket || undefined,
    estimatedReadinessSignal: summary.estimatedReadinessSignal || undefined,
    masterySignal: summary.masterySignal || undefined,
    summarySignal: summary.summarySignalJson as Record<string, unknown> || {},
    safeEvidenceRefs: Array.isArray(summary.safeEvidenceRefsJson) ? summary.safeEvidenceRefsJson : [],
    createdAt: summary.createdAt instanceof Date ? summary.createdAt.toISOString() : String(summary.createdAt),
  };
}
