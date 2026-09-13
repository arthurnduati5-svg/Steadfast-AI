import { prisma } from '../lib/prisma';
import {
  RevisionModeSession,
  RevisionModeStartRequest,
} from '../contracts/revisionModeContracts';

export async function startRevisionSession(
  schoolId: string,
  studentId: string,
  modeSessionId: string,
  params: RevisionModeStartRequest,
): Promise<RevisionModeSession> {
  const session = await prisma.revisionModeSessionRecord.create({
    data: {
      schoolId,
      studentId,
      modeSessionId,
      conversationId: params.conversationId || null,
      subjectId: params.subjectId || null,
      topicId: params.topicId || null,
      skillId: params.skillId || null,
      approvedContentRef: params.approvedContentRef || null,
      targetRef: params.targetRef || null,
      revisionGoalCategory: params.revisionGoalCategory || 'recall_practice',
      revisionSessionType: params.revisionSessionType || 'quick_revision',
      status: 'active',
      currentStage: 'awaiting_revision_target',
      currentItemIndex: 0,
      itemCount: 0,
      attemptCount: 0,
      weakRecallCount: 0,
      strongRecallCount: 0,
      mistakeCount: 0,
      hintCount: 0,
      stuckCount: 0,
      recoveryCount: 0,
      reflectionCount: 0,
      completedItemCount: 0,
      skippedItemCount: 0,
      pinnedItemCount: 0,
      safeEvidenceRefsJson: [],
    },
  });
  return session as unknown as RevisionModeSession;
}

export async function getRevisionSessionById(id: string): Promise<RevisionModeSession | null> {
  const session = await prisma.revisionModeSessionRecord.findUnique({ where: { id } });
  return session as unknown as RevisionModeSession | null;
}

export async function findActiveRevisionSession(
  schoolId: string,
  studentId: string,
): Promise<RevisionModeSession | null> {
  const session = await prisma.revisionModeSessionRecord.findFirst({
    where: { schoolId, studentId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });
  return session as unknown as RevisionModeSession | null;
}

export async function cancelExistingActiveRevisionSessions(
  schoolId: string,
  studentId: string,
): Promise<void> {
  await prisma.revisionModeSessionRecord.updateMany({
    where: { schoolId, studentId, status: 'active' },
    data: { status: 'cancelled', endedAt: new Date() },
  });
}

export async function updateRevisionSessionStatus(
  id: string,
  status: string,
): Promise<RevisionModeSession | null> {
  const updateData: Record<string, unknown> = { status };
  if (status === 'completed' || status === 'cancelled' || status === 'submitted' || status === 'failed') {
    updateData.endedAt = new Date();
  }
  if (status === 'submitted') {
    updateData.submittedAt = new Date();
  }
  if (status === 'active') {
    updateData.startedAt = new Date();
  }
  const session = await prisma.revisionModeSessionRecord.update({
    where: { id },
    data: updateData as any,
  });
  return session as unknown as RevisionModeSession | null;
}

export async function updateRevisionSessionStage(
  id: string,
  stage: string,
): Promise<RevisionModeSession | null> {
  const session = await prisma.revisionModeSessionRecord.update({
    where: { id },
    data: { currentStage: stage },
  });
  return session as unknown as RevisionModeSession | null;
}

export async function updateRevisionSessionCounts(
  id: string,
  counts: {
    currentItemIndex?: number;
    itemCount?: number;
    attemptCount?: number;
    weakRecallCount?: number;
    strongRecallCount?: number;
    mistakeCount?: number;
    hintCount?: number;
    stuckCount?: number;
    recoveryCount?: number;
    reflectionCount?: number;
    completedItemCount?: number;
    skippedItemCount?: number;
    pinnedItemCount?: number;
  },
): Promise<RevisionModeSession | null> {
  const session = await prisma.revisionModeSessionRecord.update({
    where: { id },
    data: counts as any,
  });
  return session as unknown as RevisionModeSession | null;
}

export async function updateRevisionSessionCurrentItemIndex(
  id: string,
  index: number,
): Promise<RevisionModeSession | null> {
  const session = await prisma.revisionModeSessionRecord.update({
    where: { id },
    data: { currentItemIndex: index },
  });
  return session as unknown as RevisionModeSession | null;
}

export function serializeRevisionSession(session: RevisionModeSession): Record<string, unknown> {
  return {
    id: session.id,
    schoolId: session.schoolId,
    studentId: session.studentId,
    modeSessionId: session.modeSessionId,
    conversationId: session.conversationId || null,
    subjectId: session.subjectId || null,
    topicId: session.topicId || null,
    skillId: session.skillId || null,
    approvedContentRef: session.approvedContentRef || null,
    targetRef: session.targetRef || null,
    revisionGoalCategory: session.revisionGoalCategory,
    revisionSessionType: session.revisionSessionType,
    status: session.status,
    currentStage: session.currentStage,
    currentItemIndex: session.currentItemIndex,
    itemCount: session.itemCount,
    attemptCount: session.attemptCount,
    weakRecallCount: session.weakRecallCount,
    strongRecallCount: session.strongRecallCount,
    mistakeCount: session.mistakeCount,
    hintCount: session.hintCount,
    stuckCount: session.stuckCount,
    recoveryCount: session.recoveryCount,
    reflectionCount: session.reflectionCount,
    completedItemCount: session.completedItemCount,
    skippedItemCount: session.skippedItemCount,
    pinnedItemCount: session.pinnedItemCount,
    safeEvidenceRefs: session.safeEvidenceRefsJson,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    startedAt: session.startedAt,
    submittedAt: session.submittedAt || null,
    endedAt: session.endedAt || null,
  };
}
