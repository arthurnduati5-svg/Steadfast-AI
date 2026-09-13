import { prisma } from '../lib/prisma';
import { RevisionModeAttempt } from '../contracts/revisionModeContracts';
import { updateRevisionItemState } from './revisionModeItemStateService';

export async function recordRevisionAttempt(data: {
  schoolId: string;
  studentId: string;
  revisionSessionId: string;
  revisionQueueId?: string;
  revisionItemStateId?: string;
  modeSessionId: string;
  itemKey: string;
  itemIndex: number;
  targetRef?: string;
  stage: string;
  attemptNumber: number;
  recallQuality: string;
  retrievalSignal?: string;
  mistakeCategory?: string;
  explanationQuality?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
  usedHint: boolean;
  hintLevel?: string;
  safeEvidenceRefs?: string[];
}): Promise<RevisionModeAttempt> {
  const attempt = await prisma.revisionModeAttemptRecord.create({
    data: {
      schoolId: data.schoolId,
      studentId: data.studentId,
      revisionSessionId: data.revisionSessionId,
      revisionQueueId: data.revisionQueueId || null,
      revisionItemStateId: data.revisionItemStateId || null,
      modeSessionId: data.modeSessionId,
      itemKey: data.itemKey,
      itemIndex: data.itemIndex,
      targetRef: data.targetRef || null,
      stage: data.stage,
      attemptNumber: data.attemptNumber,
      recallQuality: data.recallQuality,
      retrievalSignal: data.retrievalSignal || null,
      mistakeCategory: data.mistakeCategory || null,
      explanationQuality: data.explanationQuality || null,
      supportNeed: data.supportNeed || null,
      masterySignal: data.masterySignal || null,
      readinessSignal: data.readinessSignal || null,
      usedHint: data.usedHint,
      hintLevel: data.hintLevel || null,
      safeEvidenceRefsJson: data.safeEvidenceRefs || [],
    },
  });
  return attempt as unknown as RevisionModeAttempt;
}

export async function getAttemptsForItem(
  revisionSessionId: string,
  itemKey: string,
): Promise<RevisionModeAttempt[]> {
  const attempts = await prisma.revisionModeAttemptRecord.findMany({
    where: { revisionSessionId, itemKey },
    orderBy: { attemptNumber: 'asc' },
  });
  return attempts as unknown as RevisionModeAttempt[];
}

export function deriveWeakRecallSignal(recallQuality: string): boolean {
  return ['blank', 'forgotten', 'unclear', 'incorrect'].includes(recallQuality);
}

export function deriveStrongRecallSignal(recallQuality: string): boolean {
  return ['recalled', 'strong_recall'].includes(recallQuality);
}

export function deriveMistakeSignal(mistakeCategory?: string): boolean {
  if (!mistakeCategory) return false;
  return !['none', 'unknown'].includes(mistakeCategory);
}

export function deriveStuckChange(usedHint: boolean, recallQuality: string): boolean {
  return usedHint && ['blank', 'forgotten', 'unclear', 'incorrect'].includes(recallQuality);
}

export function deriveRecoveryChange(usedHint: boolean, recallQuality: string): boolean {
  return usedHint && ['mostly_recalled', 'recalled', 'partial'].includes(recallQuality);
}
