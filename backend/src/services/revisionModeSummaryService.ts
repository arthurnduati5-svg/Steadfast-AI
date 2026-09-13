import { prisma } from '../lib/prisma';
import { RevisionModeSummary } from '../contracts/revisionModeContracts';

export async function createRevisionSummary(data: {
  schoolId: string;
  studentId: string;
  revisionSessionId: string;
  revisionQueueId?: string;
  modeSessionId: string;
  finalStage: string;
  exitReason: string;
  itemCount: number;
  attemptCount: number;
  weakRecallCount: number;
  strongRecallCount: number;
  mistakeCount: number;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  reflectionCount: number;
  completedItemCount: number;
  skippedItemCount: number;
  pinnedItemCount: number;
  estimatedRecallStrengthBucket?: string;
  estimatedReadinessSignal?: string;
  masterySignal?: string;
  nextReviewAt?: Date;
  summarySignal?: Record<string, unknown>;
  safeEvidenceRefs?: string[];
}): Promise<RevisionModeSummary> {
  const summary = await prisma.revisionModeSummaryRecord.create({
    data: {
      schoolId: data.schoolId,
      studentId: data.studentId,
      revisionSessionId: data.revisionSessionId,
      revisionQueueId: data.revisionQueueId || null,
      modeSessionId: data.modeSessionId,
      finalStage: data.finalStage,
      exitReason: data.exitReason,
      itemCount: data.itemCount,
      attemptCount: data.attemptCount,
      weakRecallCount: data.weakRecallCount,
      strongRecallCount: data.strongRecallCount,
      mistakeCount: data.mistakeCount,
      hintCount: data.hintCount,
      stuckCount: data.stuckCount,
      recoveryCount: data.recoveryCount,
      reflectionCount: data.reflectionCount,
      completedItemCount: data.completedItemCount,
      skippedItemCount: data.skippedItemCount,
      pinnedItemCount: data.pinnedItemCount,
      estimatedRecallStrengthBucket: data.estimatedRecallStrengthBucket || null,
      estimatedReadinessSignal: data.estimatedReadinessSignal || null,
      masterySignal: data.masterySignal || null,
      nextReviewAt: data.nextReviewAt || null,
      summarySignalJson: (data.summarySignal || {}) as any,
      safeEvidenceRefsJson: (data.safeEvidenceRefs || []) as any,
    },
  });
  return summary as unknown as RevisionModeSummary;
}

export async function getRevisionSummaryForSession(
  revisionSessionId: string,
): Promise<RevisionModeSummary | null> {
  const summary = await prisma.revisionModeSummaryRecord.findFirst({
    where: { revisionSessionId },
    orderBy: { createdAt: 'desc' },
  });
  return summary as unknown as RevisionModeSummary | null;
}

export function serializeRevisionSummary(summary: RevisionModeSummary): Record<string, unknown> {
  return {
    id: summary.id,
    schoolId: summary.schoolId,
    studentId: summary.studentId,
    revisionSessionId: summary.revisionSessionId,
    revisionQueueId: summary.revisionQueueId || null,
    modeSessionId: summary.modeSessionId,
    finalStage: summary.finalStage,
    exitReason: summary.exitReason,
    itemCount: summary.itemCount,
    attemptCount: summary.attemptCount,
    weakRecallCount: summary.weakRecallCount,
    strongRecallCount: summary.strongRecallCount,
    mistakeCount: summary.mistakeCount,
    hintCount: summary.hintCount,
    stuckCount: summary.stuckCount,
    recoveryCount: summary.recoveryCount,
    reflectionCount: summary.reflectionCount,
    completedItemCount: summary.completedItemCount,
    skippedItemCount: summary.skippedItemCount,
    pinnedItemCount: summary.pinnedItemCount,
    estimatedRecallStrengthBucket: summary.estimatedRecallStrengthBucket || null,
    estimatedReadinessSignal: summary.estimatedReadinessSignal || null,
    masterySignal: summary.masterySignal || null,
    nextReviewAt: summary.nextReviewAt || null,
    summarySignal: summary.summarySignalJson,
    safeEvidenceRefs: summary.safeEvidenceRefsJson,
    createdAt: summary.createdAt,
  };
}
