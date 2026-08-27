import type {
  StudentLearningSessionRecord,
  StudentLearningSessionStatus,
  StudentLearningSessionStage,
  StudentLearningSessionMode,
  StudentLearningSessionTransitionType,
  StudentLearningSessionReasonCode,
  StudentLearningSessionLifecycleResult,
  StudentLearningSessionContext,
  StudentLearningSessionIdempotencyMeta,
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

export async function createStudentLearningSession(
  context: StudentLearningSessionContext,
  meta?: StudentLearningSessionIdempotencyMeta,
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

  if (meta?.idempotencyKey && meta?.requestFingerprint) {
    const result = await studentLearningSessionRepository.createSessionWithEvent(
      input,
      meta.idempotencyKey,
      meta.requestFingerprint,
    );
    if (result.conflict === 'idempotency') {
      return {
        session: null as unknown as StudentLearningSessionRecord,
        created: false,
        resumed: false,
        safeReasonCodes: ['idempotency_key_conflict'],
      };
    }
    return {
      session: result.record,
      created: result.created,
      resumed: false,
      safeReasonCodes: ['session_created'],
    };
  }

  const record = await studentLearningSessionRepository.createSession(input);
  return { session: record, created: true, resumed: false, safeReasonCodes: ['session_created'] };
}

export async function resumeStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
  meta?: StudentLearningSessionIdempotencyMeta,
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
    idempotencyKey: meta?.idempotencyKey,
    requestFingerprint: meta?.requestFingerprint,
  });

  if (!result.success) return null;
  return { session: result.record, created: false, resumed: true, safeReasonCodes: ['session_resumed'] };
}

export async function pauseStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
  meta?: StudentLearningSessionIdempotencyMeta,
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
    idempotencyKey: meta?.idempotencyKey,
    requestFingerprint: meta?.requestFingerprint,
  });

  if (!result.success) return null;
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_paused'] };
}

export async function completeStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
  meta?: StudentLearningSessionIdempotencyMeta,
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
    idempotencyKey: meta?.idempotencyKey,
    requestFingerprint: meta?.requestFingerprint,
  });

  if (!result.success) return null;
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_completed'] };
}

export async function abandonStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
  meta?: StudentLearningSessionIdempotencyMeta,
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
    idempotencyKey: meta?.idempotencyKey,
    requestFingerprint: meta?.requestFingerprint,
  });

  if (!result.success) return null;
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_abandoned'] };
}

export async function expireStudentLearningSession(
  sessionId: string,
  schoolId: string,
  tutorLearnerId: string,
  meta?: StudentLearningSessionIdempotencyMeta,
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
    idempotencyKey: meta?.idempotencyKey,
    requestFingerprint: meta?.requestFingerprint,
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
  // Production code must not depend on the Vitest harness or test-only in-memory
  // session stores. Test reset behavior now lives in the test setup layer
  // (resetSessionStores). This export is retained only for backward compatibility
  // and is intentionally a harmless no-op in production.
}

export async function updateSessionTransition(
  sessionId: string,
  contextOrUpdates: StudentLearningSessionContext | Partial<{
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
  updatesOrMeta?: Partial<{
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
  }> | StudentLearningSessionIdempotencyMeta,
  maybeMeta?: StudentLearningSessionIdempotencyMeta,
): Promise<StudentLearningSessionRecord | null> {
  let context: StudentLearningSessionContext;
  let updates: Partial<{
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
  }>;
  let meta: StudentLearningSessionIdempotencyMeta | undefined;

  const isContext = (obj: unknown): boolean =>
    !!obj && typeof obj === 'object' && 'schoolId' in (obj as Record<string, unknown>) && 'tutorLearnerId' in (obj as Record<string, unknown>);

  if (isContext(contextOrUpdates) && updatesOrMeta && ('status' in (updatesOrMeta as Record<string, unknown>) || 'currentMode' in (updatesOrMeta as Record<string, unknown>) || 'stage' in (updatesOrMeta as Record<string, unknown>) || 'reasonCodes' in (updatesOrMeta as Record<string, unknown>) || 'safeEvidenceRefs' in (updatesOrMeta as Record<string, unknown>))) {
    context = contextOrUpdates as StudentLearningSessionContext;
    updates = updatesOrMeta as typeof updates;
    meta = maybeMeta;
  } else if (isContext(contextOrUpdates)) {
    context = contextOrUpdates as StudentLearningSessionContext;
    updates = {} as typeof updates;
    meta = updatesOrMeta as StudentLearningSessionIdempotencyMeta | undefined;
  } else {
    // Legacy 2-arg form: updateSessionTransition(sessionId, updates)
    updates = contextOrUpdates as typeof updates;
    // Derive context from the stored session by scanning via repository helper
    const fallback = await studentLearningSessionRepository.getSessionByIdLegacy(sessionId);
    if (!fallback) return null;
    context = { schoolId: fallback.schoolId, studentId: fallback.studentId ?? '', tutorLearnerId: fallback.tutorLearnerId };
    meta = updatesOrMeta as StudentLearningSessionIdempotencyMeta | undefined;
  }

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
    idempotencyKey: meta?.idempotencyKey,
    requestFingerprint: meta?.requestFingerprint,
  });

  return result.success ? result.record : null;
}