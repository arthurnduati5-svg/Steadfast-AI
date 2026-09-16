import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { createModeSession, updateModeSessionStatus } from './learningModeSessionService';
import type { FocusModeGoalCategory, FocusModeTargetType, FocusModeStage, FocusModeStatus, FocusModeExitReason } from '../contracts/focusModeContracts';

export interface StartFocusSessionInput {
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  targetType: string;
  focusGoalCategory: string;
  conversationId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  approvedContentRef?: string;
  problemRef?: string;
  problemFingerprint?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
}

export async function startFocusSession(input: StartFocusSessionInput) {
  const modeSession = await createModeSession({
    schoolId: input.schoolId,
    studentId: input.studentId,
    mode: 'focus',
    conversationId: input.conversationId,
    subjectId: input.subjectId,
    topicId: input.topicId,
    skillId: input.skillId,
  });

  const focusSession = await prisma.focusModeSessionRecord.create({
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
      problemRef: input.problemRef || null,
      problemFingerprint: input.problemFingerprint || null,
      targetType: input.targetType,
      focusGoalCategory: input.focusGoalCategory,
      status: 'active',
      currentStage: 'awaiting_problem',
      attemptCount: 0,
      hintCount: 0,
      stuckCount: 0,
      recoveryCount: 0,
      safeEvidenceRefsJson: [],
      startedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  if (modeSession.status !== 'active') {
    await updateModeSessionStatus(modeSession.id, 'active');
  }

  return focusSession;
}

export async function getActiveFocusSession(schoolId: string, studentId: string) {
  return prisma.focusModeSessionRecord.findFirst({
    where: {
      schoolId,
      studentId,
      status: { in: ['active', 'paused'] },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getFocusSessionById(id: string) {
  return prisma.focusModeSessionRecord.findUnique({ where: { id } });
}

export async function getFocusSessionByModeSessionId(modeSessionId: string) {
  return prisma.focusModeSessionRecord.findFirst({
    where: { modeSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function cancelExistingActiveSessions(schoolId: string, studentId: string, excludingId?: string) {
  const activeSessions = await prisma.focusModeSessionRecord.findMany({
    where: {
      schoolId,
      studentId,
      status: { in: ['active', 'paused'] },
      ...(excludingId ? { id: { not: excludingId } } : {}),
    },
  });

  for (const session of activeSessions) {
    await prisma.focusModeSessionRecord.update({
      where: { id: session.id },
      data: { status: 'cancelled', endedAt: new Date() },
    });
  }

  return activeSessions;
}

export async function updateFocusSessionStatus(id: string, status: FocusModeStatus) {
  const extra: any = {};
  if (['completed', 'cancelled', 'expired', 'failed'].includes(status)) {
    extra.endedAt = new Date();
  }
  return prisma.focusModeSessionRecord.update({
    where: { id },
    data: { status, ...extra },
  });
}

export async function updateFocusSessionStage(id: string, stage: FocusModeStage) {
  return prisma.focusModeSessionRecord.update({
    where: { id },
    data: { currentStage: stage },
  });
}

export async function updateFocusSessionCounts(
  id: string,
  counts: { attemptCount?: number; hintCount?: number; stuckCount?: number; recoveryCount?: number },
) {
  return prisma.focusModeSessionRecord.update({
    where: { id },
    data: counts,
  });
}

export function serializeFocusSession(session: any) {
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
    problemRef: session.problemRef || undefined,
    problemFingerprint: session.problemFingerprint || undefined,
    targetType: session.targetType,
    focusGoalCategory: session.focusGoalCategory,
    status: session.status,
    currentStage: session.currentStage,
    currentStepKey: session.currentStepKey || undefined,
    attemptCount: session.attemptCount,
    hintCount: session.hintCount,
    stuckCount: session.stuckCount,
    recoveryCount: session.recoveryCount,
    safeEvidenceRefs: session.safeEvidenceRefsJson || [],
    createdAt: session.createdAt.toISOString(),
    updatedAt: session.updatedAt.toISOString(),
    startedAt: session.startedAt.toISOString(),
    endedAt: session.endedAt?.toISOString(),
  };
}
