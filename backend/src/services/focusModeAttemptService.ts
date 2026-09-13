import prisma from '../lib/prisma';
import { createAttempt } from './learningAttemptService';
import { createSignal } from './learningSignalService';

export interface RecordFocusAttemptInput {
  focusSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  stage: string;
  stepKey?: string;
  attemptNumber: number;
  answerQuality?: string;
  isCorrect?: boolean;
  mistakeCategory?: string;
  usedHint?: boolean;
  hintLevel?: string;
  timeSpentBucket?: string;
  safeEvidenceRefs?: string[];
}

export async function recordFocusAttempt(input: RecordFocusAttemptInput) {
  const attempt = await prisma.focusModeAttemptRecord.create({
    data: {
      schoolId: input.schoolId,
      studentId: input.studentId,
      focusSessionId: input.focusSessionId,
      modeSessionId: input.modeSessionId,
      stepKey: input.stepKey || null,
      stage: input.stage,
      attemptNumber: input.attemptNumber,
      answerQuality: input.answerQuality || null,
      isCorrect: input.isCorrect ?? null,
      mistakeCategory: input.mistakeCategory || null,
      usedHint: input.usedHint ?? false,
      hintLevel: input.hintLevel || null,
      timeSpentBucket: input.timeSpentBucket || null,
      safeEvidenceRefsJson: input.safeEvidenceRefs || [],
    },
  });

  // Bridge to Task 001 LearningModeAttempt
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
    // Non-critical - focus mode attempt already saved
  }

  // Write safe signal
  const signalType = deriveSignalFromQuality(input.answerQuality, input.mistakeCategory);
  try {
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
  if (quality === 'unclear' || quality === 'unanswered') {
    return 'stuck_detected';
  }
  return 'attempt_submitted';
}

export async function getFocusAttemptsForSession(focusSessionId: string) {
  return prisma.focusModeAttemptRecord.findMany({
    where: { focusSessionId },
    orderBy: { attemptNumber: 'asc' },
  });
}

export function serializeFocusAttempt(attempt: any) {
  return {
    id: attempt.id,
    focusSessionId: attempt.focusSessionId,
    modeSessionId: attempt.modeSessionId,
    stepKey: attempt.stepKey || undefined,
    stage: attempt.stage,
    attemptNumber: attempt.attemptNumber,
    answerQuality: attempt.answerQuality || undefined,
    isCorrect: attempt.isCorrect ?? undefined,
    mistakeCategory: attempt.mistakeCategory || undefined,
    usedHint: attempt.usedHint,
    hintLevel: attempt.hintLevel || undefined,
    timeSpentBucket: attempt.timeSpentBucket || undefined,
    safeEvidenceRefs: attempt.safeEvidenceRefsJson || [],
    createdAt: attempt.createdAt.toISOString(),
  };
}
