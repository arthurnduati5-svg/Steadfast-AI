import prisma from '../lib/prisma';
import type { ModeStage, AnswerQuality, MistakeCategory, HintLevel, TimeSpentBucket } from '../contracts/learningModeContracts';

export interface CreateAttemptInput {
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  stage: ModeStage;
  attemptNumber: number;
  answerQuality?: AnswerQuality;
  isCorrect?: boolean;
  mistakeCategory?: MistakeCategory;
  usedHint?: boolean;
  hintLevel?: HintLevel;
  timeSpentBucket?: TimeSpentBucket;
  topicId?: string;
  skillId?: string;
}

export async function createAttempt(input: CreateAttemptInput) {
  return prisma.learningModeAttempt.create({
    data: {
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      stage: input.stage,
      attemptNumber: input.attemptNumber,
      answerQuality: input.answerQuality || null,
      isCorrect: input.isCorrect ?? null,
      mistakeCategory: input.mistakeCategory || null,
      usedHint: input.usedHint ?? false,
      hintLevel: input.hintLevel || null,
      timeSpentBucket: input.timeSpentBucket || null,
      topicId: input.topicId || null,
      skillId: input.skillId || null,
    },
  });
}

export async function getAttemptsForSession(modeSessionId: string) {
  return prisma.learningModeAttempt.findMany({
    where: { modeSessionId },
    orderBy: [{ attemptNumber: 'asc' }],
  });
}

export async function countAttemptsForSession(modeSessionId: string): Promise<number> {
  return prisma.learningModeAttempt.count({
    where: { modeSessionId },
  });
}

export async function getLatestAttemptForSession(modeSessionId: string) {
  return prisma.learningModeAttempt.findFirst({
    where: { modeSessionId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getHintsUsedCountForSession(modeSessionId: string): Promise<number> {
  const attempts = await prisma.learningModeAttempt.findMany({
    where: { modeSessionId, usedHint: true },
    select: { id: true },
  });
  return attempts.length;
}
