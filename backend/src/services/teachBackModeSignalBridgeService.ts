import { createSignal } from './learningSignalService';

export async function writeTeachBackSessionStarted(modeSessionId: string, schoolId: string, studentId: string) {
  try {
    await createSignal({
      modeSessionId,
      schoolId,
      studentId,
      signalType: 'mode_entered' as any,
      stage: 'entry' as any,
    });
  } catch {
    // Non-critical
  }
}

export async function writeTeachBackSessionExited(modeSessionId: string, schoolId: string, studentId: string) {
  try {
    await createSignal({
      modeSessionId,
      schoolId,
      studentId,
      signalType: 'mode_exited' as any,
      stage: 'completed' as any,
    });
  } catch {
    // Non-critical
  }
}

export async function writeTeachBackStageChanged(modeSessionId: string, schoolId: string, studentId: string, fromStage?: string, toStage?: string) {
  try {
    await createSignal({
      modeSessionId,
      schoolId,
      studentId,
      signalType: 'mode_stage_changed' as any,
      stage: toStage as any,
    });
  } catch {
    // Non-critical
  }
}

export async function writeTeachBackHintGiven(modeSessionId: string, schoolId: string, studentId: string) {
  try {
    await createSignal({
      modeSessionId,
      schoolId,
      studentId,
      signalType: 'hint_given' as any,
    });
  } catch {
    // Non-critical
  }
}

export async function writeTeachBackSupportActionSelected(modeSessionId: string, schoolId: string, studentId: string) {
  try {
    await createSignal({
      modeSessionId,
      schoolId,
      studentId,
      signalType: 'support_action_selected' as any,
    });
  } catch {
    // Non-critical
  }
}

export async function writeTeachBackReflectionDetected(modeSessionId: string, schoolId: string, studentId: string) {
  try {
    await createSignal({
      modeSessionId,
      schoolId,
      studentId,
      signalType: 'reflection_detected' as any,
    });
  } catch {
    // Non-critical
  }
}
