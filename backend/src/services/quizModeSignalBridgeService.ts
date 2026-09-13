import { createSignal } from './learningSignalService';

const QUIZ_SIGNALS = [
  'mode_entered',
  'mode_exited',
  'mode_stage_changed',
  'goal_set',
  'question_started',
  'question_skipped',
  'question_flagged',
  'attempt_submitted',
  'answer_quality_marked',
  'recall_success_detected',
  'partial_recall_detected',
  'recall_failure_detected',
  'hint_requested',
  'hint_given',
  'stuck_detected',
  'recovery_detected',
  'mistake_detected',
  'repeated_mistake_detected',
  'reflection_detected',
  'mode_summary_created',
  'support_action_selected',
  'support_action_effective',
] as const;

type QuizSignalType = typeof QUIZ_SIGNALS[number];

export interface QuizSignalInput {
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  signalType: QuizSignalType;
  stage?: string;
  attemptNumber?: number;
  hintLevel?: string;
  answerQuality?: string;
  mistakeCategory?: string;
  supportActionType?: string;
  timeSpentBucket?: string;
}

export async function writeQuizSignal(input: QuizSignalInput) {
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

export async function writeQuizSessionStarted(modeSessionId: string, schoolId: string, studentId: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'mode_entered', stage: 'entry' });
}

export async function writeQuizSessionExited(modeSessionId: string, schoolId: string, studentId: string, stage?: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'mode_exited', stage: stage || 'completed' });
}

export async function writeQuizStageChanged(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'mode_stage_changed', stage });
}

export async function writeQuizQuestionStarted(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'question_started', stage });
}

export async function writeQuizQuestionSkipped(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'question_skipped', stage });
}

export async function writeQuizQuestionFlagged(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'question_flagged', stage });
}

export async function writeQuizAttemptSubmitted(modeSessionId: string, schoolId: string, studentId: string, stage: string, attemptNumber?: number) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'attempt_submitted', stage, attemptNumber });
}

export async function writeQuizAnswerQualityMarked(modeSessionId: string, schoolId: string, studentId: string, stage: string, answerQuality?: string, mistakeCategory?: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'answer_quality_marked', stage, answerQuality, mistakeCategory });
}

export async function writeQuizHintGiven(modeSessionId: string, schoolId: string, studentId: string, stage: string, hintLevel?: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'hint_given', stage, hintLevel });
}

export async function writeQuizStuckDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'stuck_detected', stage });
}

export async function writeQuizRecoveryDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'recovery_detected', stage });
}

export async function writeQuizMistakeDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'mistake_detected', stage });
}

export async function writeQuizReflectionDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'reflection_detected', stage });
}

export async function writeQuizRecallSuccess(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'recall_success_detected', stage });
}

export async function writeQuizRecallFailure(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'recall_failure_detected', stage });
}

export async function writeQuizSupportActionSelected(modeSessionId: string, schoolId: string, studentId: string, stage: string, supportActionType?: string) {
  return writeQuizSignal({ modeSessionId, schoolId, studentId, signalType: 'support_action_selected', stage, supportActionType });
}
