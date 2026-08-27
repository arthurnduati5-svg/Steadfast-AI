import type {
  StudentLearningSessionRecord,
  StudentLearningSessionStatus,
  StudentLearningSessionStage,
  StudentLearningSessionMode,
  StudentLearningSessionTransitionType,
  StudentLearningSessionReasonCode,
  StudentLearningSessionLifecycleResult,
  StudentLearningSessionContext,
} from '../contracts/studentLearningSessionContracts';
import {
  getInitialSessionState,
  canTransitionSession,
  transitionSessionState,
  computeToMode,
  computeToStatus,
} from './studentLearningSessionStateMachine';
import {
  studentLearningSessionRepository,
  CreateSessionInput,
  UpdateSessionInput,
  AppendEventInput,
  TransactionalMutationInput,
  VersionedSessionRecord,
} from './studentLearningSessionRepository';
import { resetSessionStores } from '../tests/vitest-setup';

export async function createStudentLearningSession(
  context: StudentLearningSessionContext,
): Promise<StudentLearningSessionLifecycleResult> {
  const input: CreateSessionInput = {
    schoolId: context.schoolId,
    tutorLearnerId: context.tutorLearnerId,
    studentId: context.studentId,
    externalStudentId: undefined,
    subjectId: context.subjectId,
    topicId: context.topicId,
    skillId: context.skillId,
    objectiveId: context.objectiveId,
  };
  const record = await studentLearningSessionRepository.createSession(input);
  return { session: record, created: true, resumed: false, safeReasonCodes: ['session_created'] };
}

export async function resumeStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
): Promise<StudentLearningSessionLifecycleResult | null> {
  const versioned = await studentLearningSessionRepository.getSessionWithVersion(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!versioned) return null;
  const record = versioned.record;
  if (record.studentId !== context.studentId && record.tutorLearnerId !== context.tutorLearnerId) return null;
  if (record.status === 'completed' || record.status === 'abandoned' || record.status === 'expired' || record.status === 'blocked') return null;
  if (record.status !== 'paused') return { session: record, created: false, resumed: false, safeReasonCodes: ['session_active'] };

  const transition = transitionSessionState(record.status, record.stage, record.currentMode, 'resume_session');
  if (!transition.allowed) return null;

  const updateInput: UpdateSessionInput = {
    status: transition.sessionStatus,
    stage: transition.sessionStage,
    currentMode: transition.toMode,
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_resumed'), 'session_resumed'],
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
  };

  const eventInput: Omit<AppendEventInput, 'schoolId' | 'tutorLearnerId' | 'sessionId' | 'operationVersion'> = {
    studentId: context.studentId,
    eventType: 'session_resumed',
    transitionType: 'resume_session',
    previousStatus: record.status,
    resultingStatus: transition.sessionStatus,
    previousMode: record.currentMode,
    nextMode: transition.toMode,
    safeEventSummary: 'session_resumed',
    safeEvidenceRefs: [],
    reasonCodes: ['session_resumed'],
    privacyMetadata: {},
  };

  const result = await studentLearningSessionRepository.mutateSessionWithEvent({
    sessionId,
    schoolId: context.schoolId,
    tutorLearnerId: context.tutorLearnerId,
    expectedVersion: versioned.stateVersion,
    updates: updateInput,
    event: eventInput,
  });

  if (!result.success) return null;
  return { session: result.record, created: false, resumed: true, safeReasonCodes: ['session_resumed'] };
}

export async function pauseStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
): Promise<StudentLearningSessionLifecycleResult | null> {
  const versioned = await studentLearningSessionRepository.getSessionWithVersion(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!versioned) return null;
  const record = versioned.record;
  if (record.studentId !== context.studentId && record.tutorLearnerId !== context.tutorLearnerId) return null;
  if (record.status !== 'active') return null;

  const transition = transitionSessionState(record.status, record.stage, record.currentMode, 'pause_session');
  if (!transition.allowed) return null;

  const updateInput: UpdateSessionInput = {
    status: transition.sessionStatus,
    stage: transition.sessionStage,
    currentMode: transition.toMode,
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_paused'), 'session_paused'],
  };

  const eventInput: Omit<AppendEventInput, 'schoolId' | 'tutorLearnerId' | 'sessionId' | 'operationVersion'> = {
    studentId: context.studentId,
    eventType: 'session_paused',
    transitionType: 'pause_session',
    previousStatus: record.status,
    resultingStatus: transition.sessionStatus,
    previousMode: record.currentMode,
    nextMode: transition.toMode,
    safeEventSummary: 'session_paused',
    safeEvidenceRefs: [],
    reasonCodes: ['session_paused'],
    privacyMetadata: {},
  };

  const result = await studentLearningSessionRepository.mutateSessionWithEvent({
    sessionId,
    schoolId: context.schoolId,
    tutorLearnerId: context.tutorLearnerId,
    expectedVersion: versioned.stateVersion,
    updates: updateInput,
    event: eventInput,
  });

  if (!result.success) return null;
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_paused'] };
}

export async function completeStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
): Promise<StudentLearningSessionLifecycleResult | null> {
  const versioned = await studentLearningSessionRepository.getSessionWithVersion(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!versioned) return null;
  const record = versioned.record;
  if (record.studentId !== context.studentId && record.tutorLearnerId !== context.tutorLearnerId) return null;
  if (record.status !== 'active') return null;

  const transition = transitionSessionState(record.status, record.stage, record.currentMode, 'complete_session');
  if (!transition.allowed) return null;

  const updateInput: UpdateSessionInput = {
    status: transition.sessionStatus,
    stage: transition.sessionStage,
    currentMode: transition.toMode,
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_completed'), 'session_completed'],
  };

  const eventInput: Omit<AppendEventInput, 'schoolId' | 'tutorLearnerId' | 'sessionId' | 'operationVersion'> = {
    studentId: context.studentId,
    eventType: 'session_completed',
    transitionType: 'complete_session',
    previousStatus: record.status,
    resultingStatus: transition.sessionStatus,
    previousMode: record.currentMode,
    nextMode: transition.toMode,
    safeEventSummary: 'session_completed',
    safeEvidenceRefs: [],
    reasonCodes: ['session_completed'],
    privacyMetadata: {},
  };

  const result = await studentLearningSessionRepository.mutateSessionWithEvent({
    sessionId,
    schoolId: context.schoolId,
    tutorLearnerId: context.tutorLearnerId,
    expectedVersion: versioned.stateVersion,
    updates: updateInput,
    event: eventInput,
  });

  if (!result.success) return null;
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_completed'] };
}

export async function abandonStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
): Promise<StudentLearningSessionLifecycleResult | null> {
  const versioned = await studentLearningSessionRepository.getSessionWithVersion(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!versioned) return null;
  const record = versioned.record;
  if (record.studentId !== context.studentId && record.tutorLearnerId !== context.tutorLearnerId) return null;
  if (record.status !== 'active') return null;

  const transition = transitionSessionState(record.status, record.stage, record.currentMode, 'abandon_session');
  if (!transition.allowed) return null;

  const updateInput: UpdateSessionInput = {
    status: transition.sessionStatus,
    stage: transition.sessionStage,
    currentMode: transition.toMode,
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_abandoned'), 'session_abandoned'],
  };

  const eventInput: Omit<AppendEventInput, 'schoolId' | 'tutorLearnerId' | 'sessionId' | 'operationVersion'> = {
    studentId: context.studentId,
    eventType: 'session_abandoned',
    transitionType: 'abandon_session',
    previousStatus: record.status,
    resultingStatus: transition.sessionStatus,
    previousMode: record.currentMode,
    nextMode: transition.toMode,
    safeEventSummary: 'session_abandoned',
    safeEvidenceRefs: [],
    reasonCodes: ['session_abandoned'],
    privacyMetadata: {},
  };

  const result = await studentLearningSessionRepository.mutateSessionWithEvent({
    sessionId,
    schoolId: context.schoolId,
    tutorLearnerId: context.tutorLearnerId,
    expectedVersion: versioned.stateVersion,
    updates: updateInput,
    event: eventInput,
  });

  if (!result.success) return null;
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_abandoned'] };
}

export async function expireStudentLearningSession(
  sessionId: string,
  schoolId: string,
  tutorLearnerId: string,
): Promise<StudentLearningSessionLifecycleResult | null> {
  const versioned = await studentLearningSessionRepository.getSessionWithVersion(
    sessionId,
    schoolId,
    tutorLearnerId,
  );
  if (!versioned) return null;
  const record = versioned.record;
  if (record.status === 'completed' || record.status === 'abandoned' || record.status === 'blocked') return null;

  const transition = transitionSessionState(record.status, record.stage, record.currentMode, 'expire_session');
  if (!transition.allowed) return null;

  const updateInput: UpdateSessionInput = {
    status: transition.sessionStatus,
    stage: transition.sessionStage,
    currentMode: transition.toMode,
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_expired'), 'session_expired'],
  };

  const eventInput: Omit<AppendEventInput, 'schoolId' | 'tutorLearnerId' | 'sessionId' | 'operationVersion'> = {
    studentId: record.studentId,
    eventType: 'session_expired',
    transitionType: 'expire_session',
    previousStatus: record.status,
    resultingStatus: transition.sessionStatus,
    previousMode: record.currentMode,
    nextMode: transition.toMode,
    safeEventSummary: 'session_expired',
    safeEvidenceRefs: [],
    reasonCodes: ['session_expired'],
    privacyMetadata: {},
  };

  const result = await studentLearningSessionRepository.mutateSessionWithEvent({
    sessionId,
    schoolId,
    tutorLearnerId,
    expectedVersion: versioned.stateVersion,
    updates: updateInput,
    event: eventInput,
  });

  if (!result.success) return null;
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_expired'] };
}

export async function getStudentLearningSession(
  sessionId: string,
  schoolId: string,
  tutorLearnerId: string,
): Promise<StudentLearningSessionRecord | null> {
  return studentLearningSessionRepository.getSession(sessionId, schoolId, tutorLearnerId);
}

export async function listStudentLearningSessionsForLearner(
  schoolId: string,
  tutorLearnerId: string,
): Promise<StudentLearningSessionRecord[]> {
  return studentLearningSessionRepository.listSessionsForLearner(schoolId, tutorLearnerId);
}

export function clearStudentLearningSessionStoreForTest(): void {
  resetSessionStores();
}

export async function updateSessionTransition(
  sessionId: string,
  context: StudentLearningSessionContext,
  updates: Partial<{
    status: StudentLearningSessionStatus;
    stage: StudentLearningSessionStage;
    currentMode: StudentLearningSessionMode;
    previousMode: StudentLearningSessionMode;
    allowedTransitions: StudentLearningSessionTransitionType[];
    blockedTransitions: StudentLearningSessionTransitionType[];
    reasonCodes: StudentLearningSessionReasonCode[];
    safeEvidenceRefs: string[];
    safeActionRefs: string[];
    lastGrowthActionId: string;
    lastTutorTurnId: string;
    lastChallengeId: string;
    lastRemediationPathId: string;
    lastRecommendationId: string;
    lastEvidenceEventId: string;
  }>,
): Promise<StudentLearningSessionRecord | null> {
  const versioned = await studentLearningSessionRepository.getSessionWithVersion(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!versioned) return null;
  const record = versioned.record;
  if (record.status === 'completed' || record.status === 'abandoned' || record.status === 'blocked') return null;

  const updateInput: UpdateSessionInput = {};
  if (updates.status !== undefined) updateInput.status = updates.status;
  if (updates.stage !== undefined) updateInput.stage = updates.stage;
  if (updates.currentMode !== undefined) {
    updateInput.currentMode = updates.currentMode;
    updateInput.previousMode = updates.previousMode ?? record.currentMode;
  }
  if (updates.previousMode !== undefined) updateInput.previousMode = updates.previousMode;
  if (updates.reasonCodes !== undefined) updateInput.reasonCodes = updates.reasonCodes;
  if (updates.safeEvidenceRefs !== undefined) updateInput.safeEvidenceRefs = updates.safeEvidenceRefs;

  const eventInput: Omit<AppendEventInput, 'schoolId' | 'tutorLearnerId' | 'sessionId' | 'operationVersion'> = {
    studentId: context.studentId,
    eventType: 'session_transition_allowed',
    safeEventSummary: 'session_transition',
    safeEvidenceRefs: updates.safeEvidenceRefs || [],
    reasonCodes: updates.reasonCodes || [],
    privacyMetadata: {},
  };

  const result = await studentLearningSessionRepository.mutateSessionWithEvent({
    sessionId,
    schoolId: context.schoolId,
    tutorLearnerId: context.tutorLearnerId,
    expectedVersion: versioned.stateVersion,
    updates: updateInput,
    event: eventInput,
  });

  return result.success ? result.record : null;
}