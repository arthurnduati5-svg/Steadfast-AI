import prisma from '../lib/prisma';
import { createModeSession, updateModeSessionStatus } from './learningModeSessionService';
import type { ExamModeStatus, ExamModeStage } from '../contracts/examModeContracts';

export interface StartExamSessionInput {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  targetType: string;
  examGoalCategory: string;
  examSessionType: string;
  timerMode?: string;
  questionCount: number;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  approvedContentRef?: string;
  paperRef?: string;
  examSetRef?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
}

export async function startExamSession(input: StartExamSessionInput) {
  const modeSession = await createModeSession({
    schoolId: input.schoolId,
    studentId: input.studentId,
    mode: 'exam',
    conversationId: input.conversationId,
    subjectId: input.subjectId,
    topicId: input.topicId,
    skillId: input.skillId,
  });

  const examSession = await prisma.examModeSessionRecord.create({
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
      paperRef: input.paperRef || null,
      examSetRef: input.examSetRef || null,
      targetType: input.targetType,
      examGoalCategory: input.examGoalCategory,
      examSessionType: input.examSessionType,
      timerMode: input.timerMode || 'untimed',
      status: 'active',
      currentStage: 'awaiting_exam_target',
      questionCount: input.questionCount,
      currentQuestionIndex: 0,
      attemptCount: 0,
      hintCount: 0,
      stuckCount: 0,
      recoveryCount: 0,
      skippedCount: 0,
      flaggedCount: 0,
      safeEvidenceRefsJson: [],
      startedAt: new Date(),
    },
  });

  if (modeSession.status !== 'active') {
    await updateModeSessionStatus(modeSession.id, 'active');
  }

  return examSession;
}

export async function getActiveExamSession(schoolId: string, studentId: string) {
  return prisma.examModeSessionRecord.findFirst({
    where: {
      schoolId,
      studentId,
      status: { in: ['active', 'paused'] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getExamSessionById(id: string) {
  return prisma.examModeSessionRecord.findUnique({ where: { id } });
}

export async function getExamSessionByModeSessionId(modeSessionId: string) {
  return prisma.examModeSessionRecord.findFirst({
    where: { modeSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function cancelExistingActiveExamSessions(schoolId: string, studentId: string, excludingId?: string) {
  const activeSessions = await prisma.examModeSessionRecord.findMany({
    where: {
      schoolId,
      studentId,
      status: { in: ['active', 'paused'] },
      ...(excludingId ? { id: { not: excludingId } } : {}),
    },
  });

  for (const session of activeSessions) {
    await prisma.examModeSessionRecord.update({
      where: { id: session.id },
      data: { status: 'cancelled', endedAt: new Date() },
    });
  }

  return activeSessions;
}

export async function updateExamSessionStatus(id: string, status: ExamModeStatus) {
  const extra: Record<string, unknown> = {};
  if (status === 'submitted') {
    extra.submittedAt = new Date();
  }
  if (['completed', 'cancelled', 'expired', 'failed'].includes(status)) {
    extra.endedAt = new Date();
  }
  return prisma.examModeSessionRecord.update({
    where: { id },
    data: { status, ...extra },
  });
}

export async function updateExamSessionStage(id: string, stage: ExamModeStage) {
  return prisma.examModeSessionRecord.update({
    where: { id },
    data: { currentStage: stage },
  });
}

export async function updateExamSessionCurrentQuestionIndex(id: string, currentQuestionIndex: number) {
  return prisma.examModeSessionRecord.update({
    where: { id },
    data: { currentQuestionIndex },
  });
}

export async function updateExamSessionCounts(
  id: string,
  counts: {
    attemptCount?: number;
    hintCount?: number;
    stuckCount?: number;
    recoveryCount?: number;
    skippedCount?: number;
    flaggedCount?: number;
  },
) {
  return prisma.examModeSessionRecord.update({
    where: { id },
    data: counts,
  });
}

export function serializeExamSession(session: any) {
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
    paperRef: session.paperRef || undefined,
    examSetRef: session.examSetRef || undefined,
    targetType: session.targetType,
    examGoalCategory: session.examGoalCategory,
    examSessionType: session.examSessionType,
    timerMode: session.timerMode,
    status: session.status,
    currentStage: session.currentStage,
    currentQuestionIndex: session.currentQuestionIndex,
    questionCount: session.questionCount,
    attemptCount: session.attemptCount,
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
