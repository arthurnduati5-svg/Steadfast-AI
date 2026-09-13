import { createSignal, type CreateSignalInput } from './learningSignalService';

const FOCUS_SIGNALS = [
  'mode_entered',
  'mode_exited',
  'mode_stage_changed',
  'attempt_submitted',
  'answer_quality_marked',
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

type FocusSignalType = typeof FOCUS_SIGNALS[number];

export interface FocusSignalInput {
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  signalType: FocusSignalType;
  stage?: string;
  attemptNumber?: number;
  hintLevel?: string;
  answerQuality?: string;
  mistakeCategory?: string;
}

export async function writeFocusSignal(input: FocusSignalInput) {
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
    });
  } catch {
    // Non-critical signal write
  }
}

export async function writeFocusSessionStarted(modeSessionId: string, schoolId: string, studentId: string) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'mode_entered', stage: 'entry' });
}

export async function writeFocusSessionExited(modeSessionId: string, schoolId: string, studentId: string, stage?: string) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'mode_exited', stage: stage || 'completed' });
}

export async function writeFocusStageChanged(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'mode_stage_changed', stage });
}

export async function writeFocusAttemptSubmitted(modeSessionId: string, schoolId: string, studentId: string, stage: string, attemptNumber?: number) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'attempt_submitted', stage, attemptNumber });
}

export async function writeFocusAnswerQualityMarked(modeSessionId: string, schoolId: string, studentId: string, stage: string, answerQuality?: string, mistakeCategory?: string) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'answer_quality_marked', stage, answerQuality, mistakeCategory });
}

export async function writeFocusHintGiven(modeSessionId: string, schoolId: string, studentId: string, stage: string, hintLevel?: string) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'hint_given', stage, hintLevel });
}

export async function writeFocusStuckDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'stuck_detected', stage });
}

export async function writeFocusRecoveryDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'recovery_detected', stage });
}

export async function writeFocusMistakeDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'mistake_detected', stage });
}

export async function writeFocusReflectionDetected(modeSessionId: string, schoolId: string, studentId: string, stage: string) {
  return writeFocusSignal({ modeSessionId, schoolId, studentId, signalType: 'reflection_detected', stage });
}
