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
import { getInitialSessionState } from './studentLearningSessionStateMachine';
import {
  studentLearningSessionRepository,
  CreateSessionInput,
  UpdateSessionInput,
} from './studentLearningSessionRepository';

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
  const record = await studentLearningSessionRepository.getSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!record) return null;
  if (record.studentId !== context.studentId && record.tutorLearnerId !== context.tutorLearnerId) return null;
  if (record.status === 'completed' || record.status === 'abandoned' || record.status === 'expired' || record.status === 'blocked') return null;
  if (record.status !== 'paused') return { session: record, created: false, resumed: false, safeReasonCodes: ['session_active'] };

  const updateInput: UpdateSessionInput = {
    status: 'active',
    stage: record.stage,
    currentMode: 'chat',
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_resumed'), 'session_resumed'],
    sourceTruthStatus: 'unknown',
    confidenceBucket: 'not_enough_evidence',
  };
  const result = await studentLearningSessionRepository.updateSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
    1,
    updateInput,
  );
  return { session: result.record, created: false, resumed: true, safeReasonCodes: ['session_resumed'] };
}

export async function pauseStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
): Promise<StudentLearningSessionLifecycleResult | null> {
  const record = await studentLearningSessionRepository.getSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!record) return null;
  if (record.studentId !== context.studentId && record.tutorLearnerId !== context.tutorLearnerId) return null;
  if (record.status !== 'active') return null;

  const updateInput: UpdateSessionInput = {
    status: 'paused',
    stage: record.stage,
    currentMode: 'session_paused',
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_paused'), 'session_paused'],
  };
  const result = await studentLearningSessionRepository.updateSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
    1,
    updateInput,
  );
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_paused'] };
}

export async function completeStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
): Promise<StudentLearningSessionLifecycleResult | null> {
  const record = await studentLearningSessionRepository.getSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!record) return null;
  if (record.studentId !== context.studentId && record.tutorLearnerId !== context.tutorLearnerId) return null;
  if (record.status !== 'active') return null;

  const updateInput: UpdateSessionInput = {
    status: 'completed',
    stage: record.stage,
    currentMode: 'session_complete',
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_completed'), 'session_completed'],
  };
  const result = await studentLearningSessionRepository.updateSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
    1,
    updateInput,
  );
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_completed'] };
}

export async function abandonStudentLearningSession(
  sessionId: string,
  context: StudentLearningSessionContext,
): Promise<StudentLearningSessionLifecycleResult | null> {
  const record = await studentLearningSessionRepository.getSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!record) return null;
  if (record.studentId !== context.studentId && record.tutorLearnerId !== context.tutorLearnerId) return null;
  if (record.status !== 'active') return null;

  const updateInput: UpdateSessionInput = {
    status: 'abandoned',
    stage: record.stage,
    currentMode: 'session_complete',
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_abandoned'), 'session_abandoned'],
  };
  const result = await studentLearningSessionRepository.updateSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
    1,
    updateInput,
  );
  return { session: result.record, created: false, resumed: false, safeReasonCodes: ['session_abandoned'] };
}

export async function expireStudentLearningSession(
  sessionId: string,
  schoolId: string,
  tutorLearnerId: string,
): Promise<StudentLearningSessionLifecycleResult | null> {
  const record = await studentLearningSessionRepository.getSession(
    sessionId,
    schoolId,
    tutorLearnerId,
  );
  if (!record) return null;
  if (record.status === 'completed' || record.status === 'abandoned' || record.status === 'blocked') return null;

  const updateInput: UpdateSessionInput = {
    status: 'expired',
    stage: record.stage,
    currentMode: 'session_complete',
    previousMode: record.currentMode,
    reasonCodes: [...record.safeReasonCodes.filter(c => c !== 'session_expired'), 'session_expired'],
  };
  const result = await studentLearningSessionRepository.updateSession(
    sessionId,
    schoolId,
    tutorLearnerId,
    1,
    updateInput,
  );
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
  const record = await studentLearningSessionRepository.getSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
  );
  if (!record) return null;
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

  const result = await studentLearningSessionRepository.updateSession(
    sessionId,
    context.schoolId,
    context.tutorLearnerId,
    1,
    updateInput,
  );
  return result.success ? result.record : null;
}