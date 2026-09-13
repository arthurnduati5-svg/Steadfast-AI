import { prisma } from '../lib/prisma';
import { RevisionModeItemState } from '../contracts/revisionModeContracts';
import { SafeRevisionTarget } from './revisionModeTargetService';

export async function createRevisionItemState(data: {
  schoolId: string;
  studentId: string;
  revisionSessionId: string;
  revisionQueueId?: string;
  modeSessionId: string;
  itemKey: string;
  itemIndex: number;
  target: SafeRevisionTarget;
}): Promise<RevisionModeItemState> {
  const item = await prisma.revisionModeItemStateRecord.create({
    data: {
      schoolId: data.schoolId,
      studentId: data.studentId,
      revisionSessionId: data.revisionSessionId,
      revisionQueueId: data.revisionQueueId || null,
      modeSessionId: data.modeSessionId,
      itemKey: data.itemKey,
      itemIndex: data.itemIndex,
      targetType: data.target.targetType,
      targetRef: data.target.targetRef || null,
      approvedContentRef: data.target.approvedContentRef || null,
      sourceMode: data.target.sourceMode || null,
      sourceSessionRef: data.target.sourceSessionRef || null,
      sourceSummaryRef: data.target.sourceSummaryRef || null,
      contentFingerprint: data.target.contentFingerprint || null,
      topicId: data.target.topicId || null,
      skillId: data.target.skillId || null,
      difficultyBucket: data.target.difficultyBucket || null,
      priorityBucket: data.target.priorityBucket || null,
      status: 'not_started',
      attemptNumber: 0,
      safeReasonCodesJson: [],
      safeEvidenceRefsJson: [],
    },
  });
  return item as unknown as RevisionModeItemState;
}

export async function getRevisionItemStateById(id: string): Promise<RevisionModeItemState | null> {
  const item = await prisma.revisionModeItemStateRecord.findUnique({ where: { id } });
  return item as unknown as RevisionModeItemState | null;
}

export async function getCurrentRevisionItem(
  revisionSessionId: string,
  currentItemIndex: number,
): Promise<RevisionModeItemState | null> {
  const item = await prisma.revisionModeItemStateRecord.findFirst({
    where: { revisionSessionId, itemIndex: currentItemIndex },
  });
  return item as unknown as RevisionModeItemState | null;
}

export async function getRevisionItemByKey(
  revisionSessionId: string,
  itemKey: string,
): Promise<RevisionModeItemState | null> {
  const item = await prisma.revisionModeItemStateRecord.findFirst({
    where: { revisionSessionId, itemKey },
  });
  return item as unknown as RevisionModeItemState | null;
}

export async function getRevisionItemsForSession(
  revisionSessionId: string,
): Promise<RevisionModeItemState[]> {
  const items = await prisma.revisionModeItemStateRecord.findMany({
    where: { revisionSessionId },
    orderBy: { itemIndex: 'asc' },
  });
  return items as unknown as RevisionModeItemState[];
}

export async function getDueRevisionItems(
  schoolId: string,
  studentId: string,
): Promise<RevisionModeItemState[]> {
  const items = await prisma.revisionModeItemStateRecord.findMany({
    where: {
      schoolId,
      studentId,
      status: { notIn: ['completed', 'skipped', 'cancelled', 'failed'] },
      nextReviewAt: { lte: new Date() },
    },
    orderBy: { nextReviewAt: 'asc' },
  });
  return items as unknown as RevisionModeItemState[];
}

export async function updateRevisionItemStatus(
  id: string,
  status: string,
): Promise<RevisionModeItemState | null> {
  const updateData: Record<string, unknown> = { status };
  if (status === 'completed' || status === 'cancelled' || status === 'failed') {
    updateData.completedAt = new Date();
  }
  const item = await prisma.revisionModeItemStateRecord.update({
    where: { id },
    data: updateData as any,
  });
  return item as unknown as RevisionModeItemState | null;
}

export async function markItemActive(id: string): Promise<RevisionModeItemState | null> {
  return updateRevisionItemStatus(id, 'active');
}

export async function markItemAttempted(id: string): Promise<RevisionModeItemState | null> {
  return updateRevisionItemStatus(id, 'attempted');
}

export async function markItemFeedbackReady(id: string): Promise<RevisionModeItemState | null> {
  return updateRevisionItemStatus(id, 'feedback_ready');
}

export async function markItemRetryRequested(id: string): Promise<RevisionModeItemState | null> {
  return updateRevisionItemStatus(id, 'retry_requested');
}

export async function completeItem(id: string): Promise<RevisionModeItemState | null> {
  return updateRevisionItemStatus(id, 'completed');
}

export async function skipItem(id: string): Promise<RevisionModeItemState | null> {
  return updateRevisionItemStatus(id, 'skipped');
}

export async function pinItem(id: string): Promise<RevisionModeItemState | null> {
  return updateRevisionItemStatus(id, 'pinned');
}

export async function updateRevisionItemState(
  id: string,
  data: Partial<{
    attemptNumber: number;
    recallQuality: string;
    retrievalSignal: string;
    mistakeCategory: string;
    explanationQuality: string;
    supportNeed: string;
    masterySignal: string;
    readinessSignal: string;
    selectedTutorAction: string;
    hintLevel: string;
    dueAt: Date;
    lastReviewedAt: Date;
    nextReviewAt: Date;
    reviewIntervalBucket: string;
    safeReasonCodesJson: string[];
    safeEvidenceRefsJson: string[];
  }>,
): Promise<RevisionModeItemState | null> {
  const item = await prisma.revisionModeItemStateRecord.update({
    where: { id },
    data: data as any,
  });
  return item as unknown as RevisionModeItemState | null;
}

export function serializeRevisionItemState(item: RevisionModeItemState): Record<string, unknown> {
  return {
    id: item.id,
    schoolId: item.schoolId,
    studentId: item.studentId,
    revisionSessionId: item.revisionSessionId,
    revisionQueueId: item.revisionQueueId || null,
    modeSessionId: item.modeSessionId,
    itemKey: item.itemKey,
    itemIndex: item.itemIndex,
    targetType: item.targetType,
    targetRef: item.targetRef || null,
    approvedContentRef: item.approvedContentRef || null,
    sourceMode: item.sourceMode || null,
    sourceSessionRef: item.sourceSessionRef || null,
    sourceSummaryRef: item.sourceSummaryRef || null,
    contentFingerprint: item.contentFingerprint || null,
    topicId: item.topicId || null,
    skillId: item.skillId || null,
    difficultyBucket: item.difficultyBucket || null,
    priorityBucket: item.priorityBucket || null,
    status: item.status,
    attemptNumber: item.attemptNumber,
    recallQuality: item.recallQuality || null,
    retrievalSignal: item.retrievalSignal || null,
    mistakeCategory: item.mistakeCategory || null,
    explanationQuality: item.explanationQuality || null,
    supportNeed: item.supportNeed || null,
    masterySignal: item.masterySignal || null,
    readinessSignal: item.readinessSignal || null,
    selectedTutorAction: item.selectedTutorAction || null,
    hintLevel: item.hintLevel || null,
    dueAt: item.dueAt || null,
    lastReviewedAt: item.lastReviewedAt || null,
    nextReviewAt: item.nextReviewAt || null,
    reviewIntervalBucket: item.reviewIntervalBucket || null,
    safeReasonCodes: item.safeReasonCodesJson,
    safeEvidenceRefs: item.safeEvidenceRefsJson,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    completedAt: item.completedAt || null,
  };
}
