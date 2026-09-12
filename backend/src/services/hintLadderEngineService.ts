import { HINT_LADDER_ORDER } from '../contracts/tutorActionContracts';
import type { HintLadderLevel } from '../contracts/tutorActionContracts';

export interface HintLadderState {
  id?: string;
  schoolId: string;
  studentId: string;
  currentHintLevel: HintLadderLevel;
  hintCount: number;
  stuckCount: number;
  recoveryCount: number;
  status: 'active' | 'completed' | 'reset';
}

export function getInitialHintLevel(): HintLadderLevel {
  return 'attention_hint';
}

export function getNextHintLevel(current: HintLadderLevel): HintLadderLevel | null {
  const idx = HINT_LADDER_ORDER.indexOf(current);
  if (idx < 0) return 'attention_hint';
  if (idx >= HINT_LADDER_ORDER.length - 1) return null;
  return HINT_LADDER_ORDER[idx + 1];
}

export function getPreviousHintLevel(current: HintLadderLevel): HintLadderLevel | null {
  const idx = HINT_LADDER_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return HINT_LADDER_ORDER[idx - 1];
}

export function shouldAdvanceHintLevel(params: {
  currentLevel: HintLadderLevel;
  hintGiven: boolean;
  studentAttempted: boolean;
  studentRecovered: boolean;
  stuckCount: number;
  recoveryCount: number;
}): { advance: boolean; hold: boolean; reset: boolean; reason: string } {
  if (params.studentRecovered) {
    return { advance: false, hold: false, reset: true, reason: 'recovery_detected' };
  }

  if (params.studentAttempted && !params.hintGiven) {
    return { advance: false, hold: true, reset: false, reason: 'student_attempted_without_hint' };
  }

  if (params.hintGiven && !params.studentAttempted && !params.studentRecovered) {
    if (params.stuckCount > 2) {
      return { advance: true, hold: false, reset: false, reason: 'stuck_after_multiple_hints' };
    }
    return { advance: false, hold: true, reset: false, reason: 'waiting_for_student_attempt' };
  }

  if (params.hintGiven && params.studentAttempted && !params.studentRecovered) {
    const maxLevel = HINT_LADDER_ORDER.length - 1;
    const currentIdx = HINT_LADDER_ORDER.indexOf(params.currentLevel);
    if (currentIdx >= maxLevel) {
      return { advance: false, hold: true, reset: false, reason: 'max_hint_level_reached' };
    }
    return { advance: true, hold: false, reset: false, reason: 'hint_given_attempt_made_no_recovery' };
  }

  return { advance: false, hold: true, reset: false, reason: 'no_change' };
}

export function selectHintLevelForAction(
  ctx: { attemptCount: number; hintCount: number; stuckCount: number; recoveryCount: number; masteryLevel?: string },
  learnerNeed: string,
): HintLadderLevel {
  if (learnerNeed === 'recovering_after_hint') {
    const pl = getPreviousHintLevel(getInitialHintLevel());
    return pl ?? 'attention_hint';
  }

  if (learnerNeed === 'stuck_without_recovery' || learnerNeed === 'repeated_same_mistake') {
    return 'rephrased_question';
  }

  if (learnerNeed === 'prerequisite_gap') {
    return 'micro_example';
  }

  if (learnerNeed === 'incorrect_conceptual') {
    return 'micro_example';
  }

  if (learnerNeed === 'incorrect_procedural') {
    return 'smaller_step';
  }

  if (learnerNeed === 'careless_error' || learnerNeed === 'no_attempt_yet') {
    return 'attention_hint';
  }

  if (ctx.hintCount === 0) return 'attention_hint';
  if (ctx.hintCount === 1) return 'direction_hint';
  if (ctx.hintCount === 2) return 'rephrased_question';
  if (ctx.hintCount >= 3 && ctx.hintCount <= 4) return 'smaller_step';
  if (ctx.hintCount >= 5) return 'micro_example';

  return 'attention_hint';
}
