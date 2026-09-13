import { createSignal } from './learningSignalService';

const EXAM_SIGNALS = [
  'mode_entered',
  'mode_exited',
  'mode_stage_changed',
  'goal_set',
  'question_started',
  'question_skipped',
  'question_flagged',
  'attempt_submitted',
  'answer_quality_marked',
  'hint_requested',
  'hint_given',
  'stuck_detected',
  'recovery_detected',
  'mistake_detected',
  'repeated_mistake_detected',
  'reflection_detected',
  'time_pressure_detected',
  'mode_summary_created',
  'support_action_selected',
  'support_action_effective',
] as const;

type ExamSignalType = typeof EXAM_SIGNALS[number];

export interface ExamSignalInput {
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  signalType: ExamSignalType;
  stage?: string;
  attemptNumber?: number;
  hintLevel?: string;
  answerQuality?: string;
  mistakeCategory?: string;
  supportActionType?: string;
  timeSpentBucket?: string;
}

export async function writeExamSignal(input: ExamSignalInput) {
  try {
    await createSignal({
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      signalType: input.signalType as any,
      stage: (input.stage || 'entry') as any,
      attemptNumber: input.attemptNumber,
      hintLevel: input.hintLevel as any,
      answerQuality: input.answerQuality as any,
      mistakeCategory: input.mistakeCategory as any,
      supportActionType: input.supportActionType as any,
      timeSpentBucket: input.timeSpentBucket as any,
    });
  } catch {
    // Non-critical signal write
  }
}

export async function writeExamSessionStarted(modeSessionId: string, schoolId: string, studentId: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'mode_entered', stage: 'entry' });
}

export async function writeExamSessionExited(modeSessionId: string, schoolId: string, studentId: string, stage?: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'mode_exited', stage: stage || 'completed' });
}

export async function writeExamStageChanged(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'mode_stage_changed', stage });
}

export async function writeExamQuestionStarted(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'question_started', stage });
}

export async function writeExamQuestionSkipped(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'question_skipped', stage });
}

export async function writeExamQuestionFlagged(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'question_flagged', stage });
}

export async function writeExamAttemptSubmitted(modeSessionId: string, schoolId: string, studentId: string, stage: string, attemptNumber?: number) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'attempt_submitted', stage, attemptNumber });
}

export async function writeExamAnswerQualityMarked(modeSessionId: string, schoolId: string, studentId: string, stage: string, answerQuality?: string, mistakeCategory?: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'answer_quality_marked', stage, answerQuality, mistakeCategory });
}

export async function writeExamHintGiven(modeSessionId: string, schoolId: string, studentId: string, stage: string, hintLevel?: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'hint_given', stage, hintLevel });
}

export async function writeExamStuckDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'stuck_detected', stage });
}

export async function writeExamRecoveryDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'recovery_detected', stage });
}

export async function writeExamMistakeDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'mistake_detected', stage });
}

export async function writeExamReflectionDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeExamSignal({ modeSessionId, schoolId, studentId, signalType: 'reflection_detected', stage });
}
