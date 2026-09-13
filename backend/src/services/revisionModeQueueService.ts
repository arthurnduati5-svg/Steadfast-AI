import { prisma } from '../lib/prisma';
import { RevisionModeQueue } from '../contracts/revisionModeContracts';

export async function createRevisionQueue(data: {
  schoolId: string;
  studentId: string;
  revisionSessionId?: string;
  modeSessionId?: string;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  queueType: string;
  queueStatus?: string;
  sourceType: string;
  sourceRefs?: string[];
  itemCount?: number;
}): Promise<RevisionModeQueue> {
  const queue = await prisma.revisionModeQueueRecord.create({
    data: {
      schoolId: data.schoolId,
      studentId: data.studentId,
      revisionSessionId: data.revisionSessionId || null,
      modeSessionId: data.modeSessionId || null,
      conversationId: data.conversationId || null,
      subjectId: data.subjectId || null,
      topicId: data.topicId || null,
      skillId: data.skillId || null,
      queueType: data.queueType,
      queueStatus: data.queueStatus || 'active',
      sourceType: data.sourceType,
      sourceRefsJson: data.sourceRefs || [],
      itemCount: data.itemCount || 0,
      currentItemIndex: 0,
      dueItemCount: 0,
      completedItemCount: 0,
      skippedItemCount: 0,
      pinnedItemCount: 0,
      safeReasonCodesJson: [],
      safeEvidenceRefsJson: [],
    },
  });
  return queue as unknown as RevisionModeQueue;
}

export async function getRevisionQueueById(id: string): Promise<RevisionModeQueue | null> {
  const queue = await prisma.revisionModeQueueRecord.findUnique({ where: { id } });
  return queue as unknown as RevisionModeQueue | null;
}

export async function getActiveRevisionQueue(
  schoolId: string,
  studentId: string,
): Promise<RevisionModeQueue | null> {
  const queue = await prisma.revisionModeQueueRecord.findFirst({
    where: { schoolId, studentId, queueStatus: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return queue as unknown as RevisionModeQueue | null;
}

export async function getRevisionQueueForSession(
  revisionSessionId: string,
): Promise<RevisionModeQueue | null> {
  const queue = await prisma.revisionModeQueueRecord.findFirst({
    where: { revisionSessionId, queueStatus: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return queue as unknown as RevisionModeQueue | null;
}

export async function updateRevisionQueue(
  id: string,
  data: Partial<{
    queueStatus: string;
    currentItemIndex: number;
    itemCount: number;
    dueItemCount: number;
    completedItemCount: number;
    skippedItemCount: number;
    pinnedItemCount: number;
    sourceRefsJson: string[];
    safeReasonCodesJson: string[];
    safeEvidenceRefsJson: string[];
  }>,
): Promise<RevisionModeQueue | null> {
  const queue = await prisma.revisionModeQueueRecord.update({
    where: { id },
    data: data as any,
  });
  return queue as unknown as RevisionModeQueue | null;
}

export function serializeRevisionQueue(queue: RevisionModeQueue): Record<string, unknown> {
  return {
    id: queue.id,
    schoolId: queue.schoolId,
    studentId: queue.studentId,
    revisionSessionId: queue.revisionSessionId || null,
    modeSessionId: queue.modeSessionId || null,
    conversationId: queue.conversationId || null,
    subjectId: queue.subjectId || null,
    topicId: queue.topicId || null,
    skillId: queue.skillId || null,
    queueType: queue.queueType,
    queueStatus: queue.queueStatus,
    sourceType: queue.sourceType,
    sourceRefs: queue.sourceRefsJson,
    itemCount: queue.itemCount,
    currentItemIndex: queue.currentItemIndex,
    dueItemCount: queue.dueItemCount,
    completedItemCount: queue.completedItemCount,
    skippedItemCount: queue.skippedItemCount,
    pinnedItemCount: queue.pinnedItemCount,
    safeReasonCodes: queue.safeReasonCodesJson,
    safeEvidenceRefs: queue.safeEvidenceRefsJson,
    createdAt: queue.createdAt,
    updatedAt: queue.updatedAt,
  };
}
