import type {
  StudentLearningSessionMode,
  StudentLearningSessionModeState,
} from '../contracts/studentLearningSessionContracts';
import { SAFE_RESPONSE_FLAGS } from '../contracts/studentLearningSessionContracts';

function buildSafeModeState(mode: StudentLearningSessionMode, status: string = 'available', stage: string = 'unknown'): StudentLearningSessionModeState {
  return {
    mode,
    status,
    stage,
    safeReasonCodes: [],
    safeEvidenceRefs: [],
    lastUpdatedAt: new Date().toISOString(),
    privacyFlags: SAFE_RESPONSE_FLAGS,
  };
}

export function resolveCurrentModeState(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode);
}

export function buildModeStateFromLearningMode(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available');
}

export function buildModeStateFromFocusMode(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available', 'focus');
}

export function buildModeStateFromExamMode(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available', 'exam');
}

export function buildModeStateFromQuizMode(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available', 'quiz');
}

export function buildModeStateFromTeachBackMode(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available', 'teach_back');
}

export function buildModeStateFromRevisionMode(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available', 'revision');
}

export function buildModeStateFromChallengeMode(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available', 'challenge');
}

export function buildModeStateFromRemediationPath(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available', 'remediation');
}

export function buildModeStateFromGrowthAction(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available', 'growth');
}

export function buildModeStateFromTutorTurn(mode: StudentLearningSessionMode): StudentLearningSessionModeState {
  return buildSafeModeState(mode, 'available', 'tutor_turn');
}

export function assertModeStateIsSafe(state: StudentLearningSessionModeState): void {
  const forbiddenKeys = [
    'rawText', 'rawMessage', 'rawNote', 'rawQuestion', 'rawAnswer',
    'rawExplanation', 'answerKey', 'modelAnswer', 'markingScheme',
    'correctAnswer', 'hiddenReasoning', 'chainOfThought', 'transcript',
    'teacherOnlyNote', 'safeguardingRawDetail', 'deenSensitivePrivateText',
  ];
  const stateObj = state as unknown as Record<string, unknown>;
  for (const key of forbiddenKeys) {
    if (key in stateObj && stateObj[key] !== undefined) {
      throw new Error(`Mode state contains forbidden field: ${key}`);
    }
  }
}
