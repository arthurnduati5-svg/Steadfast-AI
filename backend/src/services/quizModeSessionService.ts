import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { createModeSession, updateModeSessionStatus } from './learningModeSessionService';

export interface StartQuizSessionInput {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  targetType: string;
  quizGoalCategory: string;
  quizSessionType: string;
  questionCount: number;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  approvedContentRef?: string;
  quizSetRef?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
}

export async function startQuizSession(input: StartQuizSessionInput) {
  const modeSession = await createModeSession({
    schoolId: input.schoolId,
    studentId: input.studentId,
    mode: 'quiz',
    conversationId: input.conversationId,
    subjectId: input.subjectId,
    topicId: input.topicId,
    skillId: input.skillId,
  });

  const quizSession = await prisma.quizModeSessionRecord.create({
    data: {
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      tutorLearnerId: input.tutorLearnerId || null,
      modeSessionId: modeSession.id,
      conversationId: input.conversationId || null,
      subjectId: input.subjectId || null,
      topicId: input.topicId || null,
      skillId: input.skillId || null,
      approvedContentRef: input.approvedContentRef || null,
      quizSetRef: input.quizSetRef || null,
      targetType: input.targetType,
      quizGoalCategory: input.quizGoalCategory,
      quizSessionType: input.quizSessionType,
      status: 'active',
      currentStage: 'awaiting_quiz_target',
      questionCount: input.questionCount,
      currentQuestionIndex: 0,
      attemptCount: 0,
      correctCount: 0,
      partialCount: 0,
      incorrectCount: 0,
      hintCount: 0,
      stuckCount: 0,
      recoveryCount: 0,
      skippedCount: 0,
      flaggedCount: 0,
      safeEvidenceRefsJson: [],
      startedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  if (modeSession.status !== 'active') {
    await updateModeSessionStatus(modeSession.id, 'active');
  }

  return quizSession;
}

export async function getActiveQuizSession(schoolId: string, studentId: string) {
  return prisma.quizModeSessionRecord.findFirst({
    where: {
      schoolId,
      studentId,
      status: { in: ['active', 'paused'] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getQuizSessionById(id: string) {
  return prisma.quizModeSessionRecord.findUnique({ where: { id } });
}

export async function getQuizSessionByModeSessionId(modeSessionId: string) {
  return prisma.quizModeSessionRecord.findFirst({
    where: { modeSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function cancelExistingActiveQuizSessions(schoolId: string, studentId: string, excludingId?: string) {
  const activeSessions = await prisma.quizModeSessionRecord.findMany({
    where: {
      schoolId,
      studentId,
      status: { in: ['active', 'paused'] },
      ...(excludingId ? { id: { not: excludingId } } : {}),
    },
  });

  for (const session of activeSessions) {
    await prisma.quizModeSessionRecord.update({
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

export async function updateQuizSessionStatus(id: string, status: string) {
  const data: any = { status };
  if (status === 'submitted' || status === 'completed') {
    data.submittedAt = new Date();
  }
  if (status === 'completed' || status === 'cancelled' || status === 'expired' || status === 'failed') {
    data.endedAt = new Date();
  }
  return prisma.quizModeSessionRecord.update({ where: { id }, data });
}

export async function updateQuizSessionStage(id: string, stage: string) {
  return prisma.quizModeSessionRecord.update({
    where: { id },
    data: { currentStage: stage },
  });
}

export async function updateQuizSessionCurrentQuestionIndex(id: string, index: number) {
  return prisma.quizModeSessionRecord.update({
    where: { id },
    data: { currentQuestionIndex: index },
  });
}

export async function updateQuizSessionCounts(id: string, counts: {
  attemptCount?: number;
  correctCount?: number;
  partialCount?: number;
  incorrectCount?: number;
  hintCount?: number;
  stuckCount?: number;
  recoveryCount?: number;
  skippedCount?: number;
  flaggedCount?: number;
}) {
  const data: any = {};
  if (counts.attemptCount !== undefined) data.attemptCount = counts.attemptCount;
  if (counts.correctCount !== undefined) data.correctCount = counts.correctCount;
  if (counts.partialCount !== undefined) data.partialCount = counts.partialCount;
  if (counts.incorrectCount !== undefined) data.incorrectCount = counts.incorrectCount;
  if (counts.hintCount !== undefined) data.hintCount = counts.hintCount;
  if (counts.stuckCount !== undefined) data.stuckCount = counts.stuckCount;
  if (counts.recoveryCount !== undefined) data.recoveryCount = counts.recoveryCount;
  if (counts.skippedCount !== undefined) data.skippedCount = counts.skippedCount;
  if (counts.flaggedCount !== undefined) data.flaggedCount = counts.flaggedCount;
  return prisma.quizModeSessionRecord.update({ where: { id }, data });
}

export function serializeQuizSession(session: any): any {
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
    quizSetRef: session.quizSetRef || undefined,
    targetType: session.targetType,
    quizGoalCategory: session.quizGoalCategory,
    quizSessionType: session.quizSessionType,
    status: session.status,
    currentStage: session.currentStage,
    currentQuestionIndex: session.currentQuestionIndex,
    questionCount: session.questionCount,
    attemptCount: session.attemptCount,
    correctCount: session.correctCount,
    partialCount: session.partialCount,
    incorrectCount: session.incorrectCount,
    hintCount: session.hintCount,
    stuckCount: session.stuckCount,
    recoveryCount: session.recoveryCount,
    skippedCount: session.skippedCount,
    flaggedCount: session.flaggedCount,
    safeEvidenceRefs: session.safeEvidenceRefsJson || [],
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    startedAt: session.startedAt.toISOString(),
    submittedAt: session.submittedAt?.toISOString(),
    endedAt: session.endedAt?.toISOString(),
  };
}
