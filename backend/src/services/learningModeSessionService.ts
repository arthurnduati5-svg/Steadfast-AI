import prisma from '../lib/prisma';
import type { LearningMode } from '../contracts/learningModeContracts';

export interface CreateSessionInput {
  schoolId: string;
  studentId: string;
  mode: LearningMode;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
}

export async function createModeSession(input: CreateSessionInput) {
  return prisma.learningModeSession.create({
    data: {
      schoolId: input.schoolId,
      studentId: input.studentId,
      mode: input.mode,
      status: 'requested',
      stage: 'entry',
      conversationId: input.conversationId || null,
      subjectId: input.subjectId || null,
      topicId: input.topicId || null,
      skillId: input.skillId || null,
      requestedAt: new Date(),
    },
  });
}

export async function getModeSessionById(id: string) {
  return prisma.learningModeSession.findUnique({ where: { id } });
}

export async function getActiveModeSession(
  schoolId: string,
  studentId: string,
) {
  return prisma.learningModeSession.findFirst({
    where: {
      schoolId,
      studentId,
      status: { in: ['requested', 'started', 'active', 'paused', 'resumed'] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getModeSessionsForStudent(
  schoolId: string,
  studentId: string,
  limit = 20,
) {
  return prisma.learningModeSession.findMany({
    where: { schoolId, studentId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function getModeSessionsForSchool(
  schoolId: string,
  mode?: string,
  limit = 50,
) {
  const where: any = { schoolId };
  if (mode) where.mode = mode;
  return prisma.learningModeSession.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function updateModeSession(
  id: string,
  data: {
    status?: string;
    stage?: string;
    startedAt?: Date;
    endedAt?: Date;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
  },
) {
  return prisma.learningModeSession.update({
    where: { id },
    data,
  });
}

export async function updateModeSessionStatus(
  id: string,
  status: string,
) {
  const extra: any = {};
  if (status === 'started' || status === 'active') extra.startedAt = new Date();
  if (['completed', 'cancelled', 'expired', 'failed'].includes(status)) {
    extra.endedAt = new Date();
  }

  return prisma.learningModeSession.update({
    where: { id },
    data: { status, ...extra },
  });
}

export async function updateModeSessionStage(
  id: string,
  stage: string,
) {
  return prisma.learningModeSession.update({
    where: { id },
    data: { stage },
  });
}

export function serializeModeSession(session: any) {
  return {
    id: session.id,
    schoolId: session.schoolId,
    studentId: session.studentId,
    conversationId: session.conversationId || undefined,
    mode: session.mode,
    status: session.status,
    stage: session.stage,
    subjectId: session.subjectId || undefined,
    topicId: session.topicId || undefined,
    skillId: session.skillId || undefined,
    requestedAt: session.requestedAt.toISOString(),
    startedAt: session.startedAt?.toISOString(),
    endedAt: session.endedAt?.toISOString(),
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
  };
}
