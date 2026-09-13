import prisma from '../lib/prisma';
import type { HintLevel, ModeStage } from '../contracts/learningModeContracts';

export interface CreateHintEventInput {
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  hintLevel: HintLevel;
  stage?: ModeStage;
  attemptNumber?: number;
  wasRequestedByStudent?: boolean;
  wasSuggestedBySystem?: boolean;
}

export async function createHintEvent(input: CreateHintEventInput) {
  return prisma.learningModeHintEvent.create({
    data: {
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      hintLevel: input.hintLevel,
      stage: input.stage || null,
      attemptNumber: input.attemptNumber || null,
      wasRequestedByStudent: input.wasRequestedByStudent ?? false,
      wasSuggestedBySystem: input.wasSuggestedBySystem ?? false,
      effectivenessUnknown: true,
    },
  });
}

export async function getHintEventsForSession(modeSessionId: string) {
  return prisma.learningModeHintEvent.findMany({
    where: { modeSessionId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function countHintsForSession(modeSessionId: string): Promise<number> {
  return prisma.learningModeHintEvent.count({
    where: { modeSessionId },
  });
}

export async function getHintLevelsUsedForSession(modeSessionId: string): Promise<string[]> {
  const hints = await prisma.learningModeHintEvent.findMany({
    where: { modeSessionId },
    select: { hintLevel: true },
    distinct: ['hintLevel'],
  });
  return hints.map(h => h.hintLevel);
}

export async function countHintsByLevel(modeSessionId: string): Promise<Record<string, number>> {
  const hints = await prisma.learningModeHintEvent.findMany({
    where: { modeSessionId },
    select: { hintLevel: true },
  });
  const counts: Record<string, number> = {};
  for (const h of hints) {
    counts[h.hintLevel] = (counts[h.hintLevel] || 0) + 1;
  }
  return counts;
}
