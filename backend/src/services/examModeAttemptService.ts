import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { createAttempt } from './learningAttemptService';
import { createSignal } from './learningSignalService';

export interface RecordExamAttemptInput {
  examSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  questionKey: string;
  questionIndex: number;
  questionRef?: string;
  stage: string;
  attemptNumber: number;
  answerQuality?: string;
  isCorrect?: boolean;
  mistakeCategory?: string;
  usedHint?: boolean;
  hintLevel?: string;
  timeSpentBucket?: string;
  confidenceBucket?: string;
  scoreBucket?: string;
  safeEvidenceRefs?: string[];
}

export async function recordExamAttempt(input: RecordExamAttemptInput) {
  const attempt = await prisma.examModeAttemptRecord.create({
    data: {
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      examSessionId: input.examSessionId,
      modeSessionId: input.modeSessionId,
      questionKey: input.questionKey,
      questionIndex: input.questionIndex,
      questionRef: input.questionRef || null,
      stage: input.stage,
      attemptNumber: input.attemptNumber,
      answerQuality: input.answerQuality || null,
      isCorrect: input.isCorrect ?? null,
      mistakeCategory: input.mistakeCategory || null,
      usedHint: input.usedHint ?? false,
      hintLevel: input.hintLevel || null,
      timeSpentBucket: input.timeSpentBucket || null,
      confidenceBucket: input.confidenceBucket || null,
      scoreBucket: input.scoreBucket || null,
      safeEvidenceRefsJson: input.safeEvidenceRefs || [],
    },
  });

  try {
    await createAttempt({
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      stage: input.stage as any,
      attemptNumber: input.attemptNumber,
      answerQuality: input.answerQuality as any,
      isCorrect: input.isCorrect,
      mistakeCategory: input.mistakeCategory as any,
      usedHint: input.usedHint,
      hintLevel: input.hintLevel as any,
      timeSpentBucket: input.timeSpentBucket as any,
    });
  } catch {
    // Non-critical
  }

  try {
    const signalType = deriveSignalFromQuality(input.answerQuality, input.mistakeCategory);
    await createSignal({
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      signalType: signalType as any,
      stage: input.stage as any,
      attemptNumber: input.attemptNumber,
      answerQuality: input.answerQuality as any,
      mistakeCategory: input.mistakeCategory as any,
    });
  } catch {
    // Non-critical
  }

  return attempt;
}

function deriveSignalFromQuality(quality?: string, mistakeCategory?: string): string {
  if (quality === 'correct' || quality === 'mostly_correct') {
    return 'answer_quality_marked';
  }
  if (quality === 'incorrect' || quality === 'partially_correct') {
    if (mistakeCategory && mistakeCategory !== 'none' && mistakeCategory !== 'unknown') {
      return 'mistake_detected';
    }
    return 'answer_quality_marked';
  }
  if (quality === 'unclear' || quality === 'blank' || quality === 'unanswered') {
    return 'stuck_detected';
  }
  return 'attempt_submitted';
}

export async function getExamAttemptsForExamSession(examSessionId: string) {
  return prisma.examModeAttemptRecord.findMany({
    where: { examSessionId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getExamAttemptsForQuestion(examSessionId: string, questionKey: string) {
  return prisma.examModeAttemptRecord.findMany({
    where: { examSessionId, questionKey },
    orderBy: { attemptNumber: 'asc' },
  });
}

export function serializeExamAttempt(attempt: any) {
  return {
    id: attempt.id,
    examSessionId: attempt.examSessionId,
    modeSessionId: attempt.modeSessionId,
    questionKey: attempt.questionKey,
    questionIndex: attempt.questionIndex,
    questionRef: attempt.questionRef || undefined,
    stage: attempt.stage,
    attemptNumber: attempt.attemptNumber,
    answerQuality: attempt.answerQuality || undefined,
    isCorrect: attempt.isCorrect ?? undefined,
    mistakeCategory: attempt.mistakeCategory || undefined,
    usedHint: attempt.usedHint,
    hintLevel: attempt.hintLevel || undefined,
    timeSpentBucket: attempt.timeSpentBucket || undefined,
    confidenceBucket: attempt.confidenceBucket || undefined,
    scoreBucket: attempt.scoreBucket || undefined,
    safeEvidenceRefs: attempt.safeEvidenceRefsJson || [],
    createdAt: attempt.createdAt.toISOString(),
  };
}
