import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import { createAttempt } from './learningAttemptService';
import { createSignal } from './learningSignalService';

export interface RecordTeachBackAttemptInput {
  teachBackSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  promptKey: string;
  promptIndex: number;
  promptRef?: string;
  stage: string;
  attemptNumber: number;
  explanationQuality: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  confidenceBucket?: string;
  misconceptionSignal?: string;
  supportNeed?: string;
  masterySignal?: string;
  readinessSignal?: string;
  usedHint?: boolean;
  hintLevel?: string;
  safeEvidenceRefs?: string[];
}

export async function recordTeachBackAttempt(input: RecordTeachBackAttemptInput) {
  const attempt = await prisma.teachBackModeAttemptRecord.create({
    data: {
      id: randomUUID(),
      schoolId: input.schoolId,
      studentId: input.studentId,
      teachBackSessionId: input.teachBackSessionId,
      modeSessionId: input.modeSessionId,
      promptKey: input.promptKey,
      promptIndex: input.promptIndex,
      promptRef: input.promptRef || null,
      stage: input.stage,
      attemptNumber: input.attemptNumber,
      explanationQuality: input.explanationQuality,
      conceptCoverageBucket: input.conceptCoverageBucket || null,
      clarityBucket: input.clarityBucket || null,
      confidenceBucket: input.confidenceBucket || null,
      misconceptionSignal: input.misconceptionSignal || null,
      supportNeed: input.supportNeed || null,
      masterySignal: input.masterySignal || null,
      readinessSignal: input.readinessSignal || null,
      usedHint: input.usedHint ?? false,
      hintLevel: input.hintLevel || null,
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
      answerQuality: input.explanationQuality as any,
      usedHint: input.usedHint ?? false,
      hintLevel: input.hintLevel as any,
    });
  } catch {
    // Non-critical: best effort bridge
  }

  try {
    const signalType = deriveSignalFromExplanationQuality(input.explanationQuality, input.misconceptionSignal);
    const signalCategory = input.explanationQuality as string;
    await createSignal({
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      signalType: signalType as any,
      stage: input.stage as any,
      attemptNumber: input.attemptNumber,
      answerQuality: input.explanationQuality as any,
      mistakeCategory: input.misconceptionSignal as any,
    });
  } catch {
    // Non-critical
  }

  return attempt;
}

function deriveSignalFromExplanationQuality(quality: string, misconceptionSignal?: string): string {
  if (quality === 'strong' || quality === 'clear') {
    return misconceptionSignal === 'overconfident_wrong' ? 'mistake_detected' : 'step_successful';
  }
  if (quality === 'blank' || quality === 'not_attempted') {
    return 'attempt_started';
  }
  if (quality === 'unclear' || quality === 'fragmented' || quality === 'incorrect') {
    if (misconceptionSignal && misconceptionSignal !== 'none' && misconceptionSignal !== 'unknown') {
      return 'mistake_detected';
    }
    return 'attempt_submitted';
  }
  if (quality === 'partially_clear' || quality === 'mostly_clear') {
    return 'attempt_submitted';
  }
  return 'attempt_submitted';
}
