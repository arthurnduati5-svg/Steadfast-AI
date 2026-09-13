import prisma from '../lib/prisma';
import { createModeSession, updateModeSessionStatus } from './learningModeSessionService';
import type { TeachBackModeSession } from '../contracts/teachBackModeContracts';
import { TEACH_BACK_MODE_STATUSES } from '../contracts/teachBackModeContracts';

export interface StartTeachBackSessionInput {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  targetType: string;
  teachBackGoalCategory: string;
  teachBackSessionType: string;
  promptCount: number;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  approvedContentRef?: string;
  targetRef?: string;
  promptSetRef?: string;
}

export async function startTeachBackSession(input: StartTeachBackSessionInput) {
  const modeSession = await createModeSession({
    schoolId: input.schoolId,
    studentId: input.studentId,
    mode: 'teach_back',
    conversationId: input.conversationId,
    subjectId: input.subjectId,
    topicId: input.topicId,
    skillId: input.skillId,
  });

  const session = await prisma.teachBackModeSessionRecord.create({
    data: {
      schoolId: input.schoolId,
      studentId: input.studentId,
      tutorLearnerId: input.tutorLearnerId || null,
      modeSessionId: modeSession.id,
      conversationId: input.conversationId || null,
      subjectId: input.subjectId || null,
      topicId: input.topicId || null,
      skillId: input.skillId || null,
      approvedContentRef: input.approvedContentRef || null,
      targetRef: input.targetRef || null,
      promptSetRef: input.promptSetRef || null,
      targetType: input.targetType,
      teachBackGoalCategory: input.teachBackGoalCategory,
      teachBackSessionType: input.teachBackSessionType,
      status: 'active',
      currentStage: 'awaiting_teach_back_target',
      promptCount: input.promptCount,
      currentPromptIndex: 0,
      attemptCount: 0,
      strongExplanationCount: 0,
      partialExplanationCount: 0,
      weakExplanationCount: 0,
      misconceptionCount: 0,
      hintCount: 0,
      stuckCount: 0,
      recoveryCount: 0,
      reflectionCount: 0,
      safeEvidenceRefsJson: [],
      startedAt: new Date(),
    },
  });

  if (modeSession.status !== 'active') {
    await updateModeSessionStatus(modeSession.id, 'active');
  }

  return session;
}

export async function getActiveTeachBackSession(schoolId: string, studentId: string) {
  return prisma.teachBackModeSessionRecord.findFirst({
    where: {
      schoolId,
      studentId,
      status: { in: ['active', 'paused'] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTeachBackSessionById(id: string) {
  return prisma.teachBackModeSessionRecord.findUnique({ where: { id } });
}

export async function getTeachBackSessionByModeSessionId(modeSessionId: string) {
  return prisma.teachBackModeSessionRecord.findFirst({
    where: { modeSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function cancelExistingActiveTeachBackSessions(schoolId: string, studentId: string, excludingId?: string) {
  const activeSessions = await prisma.teachBackModeSessionRecord.findMany({
    where: {
      schoolId,
      studentId,
      status: { in: ['active', 'paused'] },
      ...(excludingId ? { id: { not: excludingId } } : {}),
    },
  });

  for (const session of activeSessions) {
    await prisma.teachBackModeSessionRecord.update({
      where: { id: session.id },
      data: {
        status: 'cancelled',
        currentStage: 'cancelled',
        endedAt: new Date(),
        safeEvidenceRefsJson: [...(session.safeEvidenceRefsJson as any[] || []), 'replaced_by_new_session'],
      },
    });
    try {
      await prisma.learningModeSession.update({
        where: { id: session.modeSessionId },
        data: { status: 'cancelled' },
      });
    } catch {
      // Non-critical
    }
  }

  return activeSessions;
}

export async function updateTeachBackSessionStatus(id: string, status: string) {
  const data: any = { status };
  if (status === 'submitted' || status === 'completed') {
    data.submittedAt = new Date();
  }
  if (status === 'completed' || status === 'cancelled' || status === 'expired' || status === 'failed') {
    data.endedAt = new Date();
  }
  return prisma.teachBackModeSessionRecord.update({ where: { id }, data });
}

export async function updateTeachBackSessionStage(id: string, stage: string) {
  return prisma.teachBackModeSessionRecord.update({
    where: { id },
    data: { currentStage: stage },
  });
}

export async function updateTeachBackSessionCurrentPromptIndex(id: string, index: number) {
  return prisma.teachBackModeSessionRecord.update({
    where: { id },
    data: { currentPromptIndex: index },
  });
}

export async function updateTeachBackSessionCounts(
  id: string,
  counts: {
    attemptCount?: number;
    strongExplanationCount?: number;
    partialExplanationCount?: number;
    weakExplanationCount?: number;
    misconceptionCount?: number;
    hintCount?: number;
    stuckCount?: number;
    recoveryCount?: number;
    reflectionCount?: number;
  },
) {
  return prisma.teachBackModeSessionRecord.update({
    where: { id },
    data: counts,
  });
}

export function serializeTeachBackSession(session: any): TeachBackModeSession {
  return {
    id: session.id,
    schoolId: session.schoolId,
    studentId: session.studentId,
    tutorLearnerId: session.tutorLearnerId || undefined,
    modeSessionId: session.modeSessionId,
    conversationId: session.conversationId || undefined,
    subjectId: session.subjectId || undefined,
    topicId: session.topicId || undefined,
    skillId: session.skillId || undefined,
    approvedContentRef: session.approvedContentRef || undefined,
    targetRef: session.targetRef || undefined,
    promptSetRef: session.promptSetRef || undefined,
    targetType: session.targetType,
    teachBackGoalCategory: session.teachBackGoalCategory,
    teachBackSessionType: session.teachBackSessionType,
    status: session.status,
    currentStage: session.currentStage,
    currentPromptIndex: session.currentPromptIndex,
    promptCount: session.promptCount,
    attemptCount: session.attemptCount,
    strongExplanationCount: session.strongExplanationCount,
    partialExplanationCount: session.partialExplanationCount,
    weakExplanationCount: session.weakExplanationCount,
    misconceptionCount: session.misconceptionCount,
    hintCount: session.hintCount,
    stuckCount: session.stuckCount,
    recoveryCount: session.recoveryCount,
    reflectionCount: session.reflectionCount,
    safeEvidenceRefs: Array.isArray(session.safeEvidenceRefsJson) ? session.safeEvidenceRefsJson : [],
    createdAt: session.createdAt instanceof Date ? session.createdAt.toISOString() : String(session.createdAt),
    updatedAt: session.updatedAt instanceof Date ? session.updatedAt.toISOString() : String(session.updatedAt),
    startedAt: session.startedAt instanceof Date ? session.startedAt.toISOString() : String(session.startedAt),
    submittedAt: session.submittedAt instanceof Date ? session.submittedAt.toISOString() : undefined,
    endedAt: session.endedAt instanceof Date ? session.endedAt.toISOString() : undefined,
  };
}
