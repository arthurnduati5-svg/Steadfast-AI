import type {
  StudentLearningSessionStatus,
  StudentLearningSessionStage,
  StudentLearningSessionMode,
  StudentLearningSessionTransitionType,
  StudentLearningSessionTransitionResult,
  StudentLearningSessionPolicyDecision,
  StudentLearningSessionReasonCode,
  StudentLearningSessionState,
} from '../contracts/studentLearningSessionContracts';
import {
  STUDENT_LEARNING_SESSION_TRANSITION_TYPES,
} from '../contracts/studentLearningSessionContracts';
import type {
  LearningSessionMode,
  TutorModeTransitionDecision,
  TutorModeTransitionReasonCode,
} from './studentLearningSessionContracts';

const STATUS_TRANSITION_MAP: Record<StudentLearningSessionStatus, Partial<Record<StudentLearningSessionTransitionType, StudentLearningSessionStatus>>> = {
  created: { start_session: 'active' },
  active: { pause_session: 'paused', complete_session: 'completed', abandon_session: 'abandoned', expire_session: 'expired' },
  paused: { resume_session: 'active' },
  resumed: {},
  completed: {},
  abandoned: {},
  expired: { start_session: 'active' },
  blocked: {},
  handoff_pending: {},
};

const MODE_TRANSITION_MAP: Record<StudentLearningSessionMode, Partial<Record<StudentLearningSessionTransitionType, StudentLearningSessionMode>>> = {
  none: { start_session: 'chat' },
  chat: { enter_focus: 'focus', enter_quiz: 'quiz', enter_revision: 'revision', enter_teach_back: 'teach_back' },
  focus: { exit_focus: 'chat', enter_challenge: 'challenge' },
  exam: {},
  quiz: { enter_revision: 'revision', enter_teach_back: 'teach_back' },
  teach_back: { enter_revision: 'revision' },
  revision: { enter_challenge: 'challenge' },
  challenge: { enter_remediation: 'remediation' },
  remediation: { enter_revision: 'revision' },
  growth_action: {},
  tutor_turn: {},
  blocked: {},
  session_paused: {},
  session_complete: {},
};

const STATUS_AFFECTING_TRANSITIONS: StudentLearningSessionTransitionType[] = [
  'start_session', 'pause_session', 'resume_session',
  'complete_session', 'abandon_session', 'expire_session',
];

export function computeToMode(
  transitionType: StudentLearningSessionTransitionType,
  currentMode: StudentLearningSessionMode,
): StudentLearningSessionMode {
  switch (transitionType) {
    case 'start_session': return 'chat';
    case 'enter_focus': return 'focus';
    case 'exit_focus': return 'chat';
    case 'enter_exam': return 'exam';
    case 'exit_exam': return 'chat';
    case 'enter_quiz': return 'quiz';
    case 'exit_quiz': return 'chat';
    case 'enter_teach_back': return 'teach_back';
    case 'exit_teach_back': return 'chat';
    case 'enter_revision': return 'revision';
    case 'exit_revision': return 'chat';
    case 'enter_challenge': return 'challenge';
    case 'exit_challenge': return 'chat';
    case 'enter_remediation': return 'remediation';
    case 'exit_remediation': return 'revision';
    case 'run_growth_action': return 'growth_action';
    case 'run_tutor_turn': return 'tutor_turn';
    default: return currentMode;
  }
}

export function computeToStatus(
  transitionType: StudentLearningSessionTransitionType,
  currentStatus: StudentLearningSessionStatus,
): StudentLearningSessionStatus {
  switch (transitionType) {
    case 'start_session': return 'active';
    case 'pause_session': return 'paused';
    case 'resume_session': return 'active';
    case 'complete_session': return 'completed';
    case 'abandon_session': return 'abandoned';
    case 'expire_session': return 'expired';
    default: return currentStatus;
  }
}

export function getInitialSessionState(): { status: StudentLearningSessionStatus; stage: StudentLearningSessionStage; currentMode: StudentLearningSessionMode } {
  return { status: 'created', stage: 'orienting', currentMode: 'none' };
}

export function canTransitionSession(
  currentStatus: StudentLearningSessionStatus,
  _currentStage: StudentLearningSessionStage,
  currentMode: StudentLearningSessionMode,
  transitionType: StudentLearningSessionTransitionType,
  requestedMode?: StudentLearningSessionMode,
): boolean {
  if (transitionType === 'blocked') return false;

  const isStatusAffecting = STATUS_AFFECTING_TRANSITIONS.includes(transitionType);
  const statusAllowed = STATUS_TRANSITION_MAP[currentStatus][transitionType] !== undefined;
  const modeAllowed = MODE_TRANSITION_MAP[currentMode][transitionType] !== undefined;

  if (isStatusAffecting) {
    if (!statusAllowed) return false;
    if (transitionType === 'start_session') {
      return modeAllowed;
    }
    return true;
  }

  if (currentStatus !== 'active') return false;
  if (!modeAllowed) return false;

  if (requestedMode !== undefined) {
    const toMode = computeToMode(transitionType, currentMode);
    if (toMode !== requestedMode) return false;
  }

  return true;
}

export function buildBlockedTransitionResult(
  fromMode: StudentLearningSessionMode,
  toMode: StudentLearningSessionMode,
  transitionType: StudentLearningSessionTransitionType,
  policyDecision: StudentLearningSessionPolicyDecision,
  safeReasonCodes: StudentLearningSessionReasonCode[],
): StudentLearningSessionTransitionResult {
  return {
    allowed: false,
    transitionType,
    fromMode,
    toMode,
    policyDecision,
    transitionStatus: 'blocked',
    safeReasonCodes,
    safeAlternatives: [],
    sessionStatus: 'created',
    sessionStage: 'orienting',
  };
}

export function transitionSessionState(
  currentStatus: StudentLearningSessionStatus,
  currentStage: StudentLearningSessionStage,
  currentMode: StudentLearningSessionMode,
  transitionType: StudentLearningSessionTransitionType,
  requestedMode?: StudentLearningSessionMode,
): StudentLearningSessionTransitionResult {
  const allowed = canTransitionSession(currentStatus, currentStage, currentMode, transitionType, requestedMode);

  if (!allowed) {
    return buildBlockedTransitionResult(
      currentMode,
      currentMode,
      transitionType,
      'blocked_invalid_transition',
      ['invalid_transition'],
    );
  }

  const toMode = computeToMode(transitionType, currentMode);
  const toStatus = computeToStatus(transitionType, currentStatus);

  return {
    allowed: true,
    transitionType,
    fromMode: currentMode,
    toMode,
    policyDecision: 'allowed',
    transitionStatus: 'allowed',
    safeReasonCodes: [],
    safeAlternatives: [],
    sessionStatus: toStatus,
    sessionStage: currentStage,
  };
}

export function resolveCurrentSessionState(
  status: StudentLearningSessionStatus,
  stage: StudentLearningSessionStage,
  currentMode: StudentLearningSessionMode,
): StudentLearningSessionState {
  const allowedTransitions: StudentLearningSessionTransitionType[] = [];
  const blockedTransitions: StudentLearningSessionTransitionType[] = [];

  for (const tt of STUDENT_LEARNING_SESSION_TRANSITION_TYPES) {
    if (canTransitionSession(status, stage, currentMode, tt)) {
      allowedTransitions.push(tt);
    } else {
      blockedTransitions.push(tt);
    }
  }

  return {
    id: '',
    schoolId: '',
    tutorLearnerId: '',
    status,
    stage,
    currentMode,
    previousMode: undefined,
    allowedTransitions,
    blockedTransitions,
    safeReasonCodes: [],
    safeEvidenceRefs: [],
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
    lastActiveAt: new Date(),
  };
}

export function assertValidSessionTransition(
  currentStatus: StudentLearningSessionStatus,
  currentStage: StudentLearningSessionStage,
  currentMode: StudentLearningSessionMode,
  transitionType: StudentLearningSessionTransitionType,
  requestedMode?: StudentLearningSessionMode,
): void {
  if (!canTransitionSession(currentStatus, currentStage, currentMode, transitionType, requestedMode)) {
    throw new Error(
      `Invalid session transition: status=${currentStatus}, stage=${currentStage}, mode=${currentMode}, transition=${transitionType}`,
    );
  }
}

const LEGACY_VALID_TRANSITIONS: Record<LearningSessionMode, LearningSessionMode[]> = {
  idle: ['session_start'],
  session_start: ['context_hydration'],
  context_hydration: [
    'diagnostic_check', 'concept_teaching', 'socratic_check',
    'guided_practice', 'independent_practice', 'revision',
    'spaced_review', 'remediation', 'challenge', 'stretch_challenge',
    'progress_summary', 'session_complete', 'session_paused',
  ],
  diagnostic_check: ['concept_teaching', 'socratic_check', 'guided_practice', 'remediation', 'safeguarding_pause', 'session_paused'],
  concept_teaching: ['socratic_check', 'guided_practice', 'hint_support', 'reflection', 'safeguarding_pause', 'session_paused'],
  socratic_check: ['guided_practice', 'attempt_checking', 'concept_teaching', 'hint_support', 'safeguarding_pause', 'session_paused'],
  guided_practice: ['attempt_checking', 'socratic_check', 'hint_support', 'concept_teaching', 'remediation', 'similar_practice', 'safeguarding_pause', 'session_paused'],
  independent_practice: ['attempt_checking', 'hint_support', 'safeguarding_pause', 'session_paused'],
  attempt_checking: [
    'revision', 'remediation', 'similar_practice', 'challenge',
    'stretch_challenge', 'concept_teaching', 'socratic_check',
    'guided_practice', 'progress_summary', 'reflection', 'safeguarding_pause', 'session_paused',
  ],
  revision: ['attempt_checking', 'remediation', 'similar_practice', 'spaced_review', 'safeguarding_pause', 'session_paused'],
  spaced_review: ['attempt_checking', 'revision', 'remediation', 'safeguarding_pause', 'session_paused'],
  remediation: ['similar_practice', 'guided_practice', 'concept_teaching', 'attempt_checking', 'safeguarding_pause', 'session_paused'],
  similar_practice: ['attempt_checking', 'guided_practice', 'challenge', 'remediation', 'safeguarding_pause', 'session_paused'],
  challenge: ['attempt_checking', 'stretch_challenge', 'similar_practice', 'hint_support', 'safeguarding_pause', 'session_paused'],
  stretch_challenge: ['attempt_checking', 'challenge', 'similar_practice', 'hint_support', 'safeguarding_pause', 'session_paused'],
  hint_support: ['guided_practice', 'similar_practice', 'attempt_checking', 'safeguarding_pause', 'session_paused'],
  reflection: ['progress_summary', 'revision', 'spaced_review', 'safeguarding_pause', 'session_paused'],
  progress_summary: ['session_complete', 'session_paused', 'revision', 'challenge', 'remediation', 'safeguarding_pause'],
  teacher_help_suggested: ['session_complete', 'session_paused'],
  deen_safe_support: ['deen_teacher_referral', 'socratic_check', 'session_paused'],
  deen_teacher_referral: ['session_complete', 'session_paused'],
  safeguarding_pause: ['session_complete', 'session_paused', 'context_hydration'],
  session_complete: ['session_start'],
  session_paused: ['context_hydration', 'session_complete'],
};

const LEGACY_SAFEGUARDING_MODES: LearningSessionMode[] = ['safeguarding_pause'];
const LEGACY_DEEN_MODES: LearningSessionMode[] = ['deen_safe_support', 'deen_teacher_referral'];
const LEGACY_TERMINAL_MODES: LearningSessionMode[] = ['session_complete'];

export function getAllowedTransitions(mode: LearningSessionMode): LearningSessionMode[] {
  return LEGACY_VALID_TRANSITIONS[mode] || [];
}

export function isValidTransition(
  currentMode: LearningSessionMode,
  nextMode: LearningSessionMode,
): boolean {
  const allowed = getAllowedTransitions(currentMode);
  return allowed.includes(nextMode);
}

export function determineTransition(
  currentMode: LearningSessionMode,
  nextMode: LearningSessionMode,
  reasonCodes: TutorModeTransitionReasonCode[],
): TutorModeTransitionDecision {
  const allowed = isValidTransition(currentMode, nextMode);
  const requiresSafeguardingPause = LEGACY_SAFEGUARDING_MODES.includes(nextMode);
  const requiresDeenReferral = LEGACY_DEEN_MODES.includes(nextMode);
  const requiresEvidenceWrite =
    nextMode === 'attempt_checking' ||
    nextMode === 'progress_summary' ||
    nextMode === 'revision' ||
    nextMode === 'reflection';
  const requiresCheckpoint = !LEGACY_TERMINAL_MODES.includes(nextMode);

  const priorityMap: Record<LearningSessionMode, number> = {
    safeguarding_pause: 1,
    deen_teacher_referral: 2,
    deen_safe_support: 3,
    remediation: 4,
    revision: 5,
    spaced_review: 6,
    attempt_checking: 7,
    hint_support: 8,
    diagnostic_check: 9,
    concept_teaching: 10,
    socratic_check: 11,
    guided_practice: 12,
    similar_practice: 13,
    challenge: 14,
    stretch_challenge: 15,
    independent_practice: 16,
    reflection: 17,
    progress_summary: 18,
    teacher_help_suggested: 19,
    context_hydration: 20,
    session_start: 21,
    session_complete: 22,
    session_paused: 23,
    idle: 24,
  };

  const learnerFacingExplanations: Partial<Record<LearningSessionMode, string>> = {
    revision: 'Time to review what you have learned before moving forward.',
    remediation: 'Let us strengthen the foundations before moving to new topics.',
    challenge: 'You are ready for a challenge. Let us test your understanding.',
    stretch_challenge: 'You are doing great. Here is a more advanced challenge.',
    similar_practice: 'Let us try another similar question to build confidence.',
    hint_support: 'Here is a hint to help you think through this step.',
    guided_practice: 'Let me guide you through this practice step.',
    diagnostic_check: 'Let me check your starting level first.',
    session_paused: 'Your session has been saved. You can resume later.',
    session_complete: 'Great work today! Your progress has been saved.',
  };

  return {
    allowed,
    previousMode: currentMode,
    nextMode,
    reasonCodes,
    priority: priorityMap[nextMode] ?? 99,
    requiresSafeguardingPause,
    requiresDeenReferral,
    requiresEvidenceWrite,
    requiresCheckpoint,
    learnerFacingExplanation: learnerFacingExplanations[nextMode],
    privacyMetadata: {
      transitionVerified: true,
      transitionValid: allowed,
      safeguardingBoundary: requiresSafeguardingPause,
      deenBoundary: requiresDeenReferral,
    },
  };
}
