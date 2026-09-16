import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { SignalType, ModeStage, HintLevel, AnswerQuality, MistakeCategory, SupportActionType, ConfidenceSignal, TimeSpentBucket, DifficultyBucket, SourceType } from '../contracts/learningModeContracts';

export interface CreateSignalInput {
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  signalType: SignalType;
  stage?: ModeStage;
  topicId?: string;
  subjectId?: string;
  skillId?: string;
  attemptNumber?: number;
  hintLevel?: HintLevel;
  answerQuality?: AnswerQuality;
  mistakeCategory?: MistakeCategory;
  supportActionType?: SupportActionType;
  confidenceSignal?: ConfidenceSignal;
  timeSpentBucket?: TimeSpentBucket;
  difficultyBucket?: DifficultyBucket;
  sourceType?: SourceType;
}

export async function createSignal(input: CreateSignalInput) {
  return prisma.learningModeSignal.create({
    data: {
      id: randomUUID(),
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      signalType: input.signalType,
      stage: input.stage || null,
      topicId: input.topicId || null,
      subjectId: input.subjectId || null,
      skillId: input.skillId || null,
      attemptNumber: input.attemptNumber || null,
      hintLevel: input.hintLevel || null,
      answerQuality: input.answerQuality || null,
      mistakeCategory: input.mistakeCategory || null,
      supportActionType: input.supportActionType || null,
      confidenceSignal: input.confidenceSignal || null,
      timeSpentBucket: input.timeSpentBucket || null,
      difficultyBucket: input.difficultyBucket || null,
      sourceType: input.sourceType || null,
    },
  });
}

export async function getSignalsForSession(modeSessionId: string) {
  return prisma.learningModeSignal.findMany({
    where: { modeSessionId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getStuckSignalsForSession(modeSessionId: string) {
  return prisma.learningModeSignal.findMany({
    where: {
      modeSessionId,
      signalType: { in: ['stuck_detected', 'mistake_detected', 'repeated_mistake_detected'] },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getRecoverySignalsForSession(modeSessionId: string) {
  return prisma.learningModeSignal.findMany({
    where: {
      modeSessionId,
      signalType: { in: ['recovery_detected', 'step_successful', 'reflection_detected'] },
    },
    orderBy: { createdAt: 'asc' },
  });
}

export async function countSignalsByType(modeSessionId: string): Promise<Record<string, number>> {
  const signals = await getSignalsForSession(modeSessionId);
  const counts: Record<string, number> = {};
  for (const s of signals) {
    counts[s.signalType] = (counts[s.signalType] || 0) + 1;
  }
  return counts;
}
