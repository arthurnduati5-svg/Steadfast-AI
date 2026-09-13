import { getNextHintLevel, getInitialHintLevel } from './hintLadderEngineService';
import type { HintLadderLevel } from '../contracts/tutorActionContracts';
import { createSignal } from './learningSignalService';
import { createHintEvent } from './learningHintTrackingService';

export interface HintBridgeInput {
  focusSessionId: string;
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  currentHintLevel?: string;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  stage: string;
  requestedByStudent?: boolean;
}

export interface HintBridgeOutput {
  hintLevel: string;
  hintCount: number;
  advanced: boolean;
  reasonCode: string;
}

export function processHintBridge(input: HintBridgeInput): HintBridgeOutput {
  const currentLevel = (input.currentHintLevel as HintLadderLevel) || getInitialHintLevel();

  if (input.recoveryCount > 0) {
    return {
      hintLevel: getInitialHintLevel(),
      hintCount: input.hintCount,
      advanced: false,
      reasonCode: 'recovery_reset_hint_level',
    };
  }

  const nextLevel = getNextHintLevel(currentLevel);
  if (nextLevel && input.stuckCount > 1) {
    return {
      hintLevel: nextLevel,
      hintCount: input.hintCount + 1,
      advanced: true,
      reasonCode: 'hint_advanced_for_stuck',
    };
  }

  if (nextLevel && input.hintCount >= 2) {
    return {
      hintLevel: nextLevel,
      hintCount: input.hintCount + 1,
      advanced: true,
      reasonCode: 'hint_advanced_after_multiple',
    };
  }

  return {
    hintLevel: currentLevel,
    hintCount: input.hintCount + 1,
    advanced: false,
    reasonCode: 'hint_held_current_level',
  };
}

export async function recordHintBridgeSignal(input: {
  modeSessionId: string;
  schoolId: string;
  studentId: string;
  hintLevel: string;
  stage: string;
  requestedByStudent?: boolean;
}) {
  try {
    await createSignal({
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      signalType: 'hint_given',
      stage: input.stage as any,
      hintLevel: input.hintLevel as any,
    });
  } catch {
    // Non-critical
  }

  try {
    await createHintEvent({
      modeSessionId: input.modeSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      hintLevel: input.hintLevel as any,
      stage: input.stage as any,
      wasRequestedByStudent: input.requestedByStudent ?? true,
    });
  } catch {
    // Non-critical
  }
}
