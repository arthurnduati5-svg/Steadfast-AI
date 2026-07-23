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

const sessionStore: Map<string, StudentLearningSessionRecord> = new Map();

function generateId(): string {
  return `sls_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function now(): Date {
  return new Date();
}

function cloneRecord(r: StudentLearningSessionRecord): StudentLearningSessionRecord {
  return JSON.parse(JSON.stringify(r));
}

export function createStudentLearningSession(context: StudentLearningSessionContext): StudentLearningSessionLifecycleResult {
  const id = generateId();
  const initial = getInitialSessionState();
  const t = now();
  const record: StudentLearningSessionRecord = {
    id,
    schoolId: context.schoolId,
    studentId: context.studentId,
    tutorLearnerId: context.tutorLearnerId,
    subjectId: context.subjectId,
    topicId: context.topicId,
    skillId: context.skillId,
    objectiveId: context.objectiveId,
    status: initial.status,
    stage: initial.stage,
    currentMode: initial.currentMode,
    allowedTransitions: [],
    blockedTransitions: [],
    safeReasonCodes: ['session_created'],
    safeEvidenceRefs: [],
    safeActionRefs: [],
    startedAt: t,
    lastActiveAt: t,
    createdAt: t,
    updatedAt: t,
  };
  sessionStore.set(id, record);
  return { session: cloneRecord(record), created: true, resumed: false, safeReasonCodes: ['session_created'] };
}

export function resumeStudentLearningSession(sessionId: string, context: StudentLearningSessionContext): StudentLearningSessionLifecycleResult | null {
  const record = sessionStore.get(sessionId);
  if (!record) return null;
  if (record.schoolId !== context.schoolId || (record.tutorLearnerId !== context.tutorLearnerId && record.studentId !== context.studentId)) return null;
  if (record.status === 'completed' || record.status === 'abandoned' || record.status === 'expired' || record.status === 'blocked') return null;
  if (record.status !== 'paused') return { session: cloneRecord(record), created: false, resumed: false, safeReasonCodes: ['session_active'] };
  const t = now();
  record.status = 'active';
  record.lastActiveAt = t;
  record.updatedAt = t;
  record.safeReasonCodes = [...record.safeReasonCodes.filter(c => c !== 'session_resumed'), 'session_resumed'];
  sessionStore.set(sessionId, record);
  return { session: cloneRecord(record), created: false, resumed: true, safeReasonCodes: ['session_resumed'] };
}

export function pauseStudentLearningSession(sessionId: string, context: StudentLearningSessionContext): StudentLearningSessionLifecycleResult | null {
  const record = sessionStore.get(sessionId);
  if (!record) return null;
  if (record.schoolId !== context.schoolId || (record.tutorLearnerId !== context.tutorLearnerId && record.studentId !== context.studentId)) return null;
  if (record.status !== 'active') return null;
  const t = now();
  record.status = 'paused';
  record.lastActiveAt = t;
  record.updatedAt = t;
  record.safeReasonCodes = [...record.safeReasonCodes.filter(c => c !== 'session_paused'), 'session_paused'];
  sessionStore.set(sessionId, record);
  return { session: cloneRecord(record), created: false, resumed: false, safeReasonCodes: ['session_paused'] };
}

export function completeStudentLearningSession(sessionId: string, context: StudentLearningSessionContext): StudentLearningSessionLifecycleResult | null {
  const record = sessionStore.get(sessionId);
  if (!record) return null;
  if (record.schoolId !== context.schoolId || (record.tutorLearnerId !== context.tutorLearnerId && record.studentId !== context.studentId)) return null;
  if (record.status !== 'active') return null;
  const t = now();
  record.status = 'completed';
  record.endedAt = t;
  record.lastActiveAt = t;
  record.updatedAt = t;
  record.safeReasonCodes = [...record.safeReasonCodes.filter(c => c !== 'session_completed'), 'session_completed'];
  sessionStore.set(sessionId, record);
  return { session: cloneRecord(record), created: false, resumed: false, safeReasonCodes: ['session_completed'] };
}

export function abandonStudentLearningSession(sessionId: string, context: StudentLearningSessionContext): StudentLearningSessionLifecycleResult | null {
  const record = sessionStore.get(sessionId);
  if (!record) return null;
  if (record.schoolId !== context.schoolId || (record.tutorLearnerId !== context.tutorLearnerId && record.studentId !== context.studentId)) return null;
  if (record.status !== 'active') return null;
  const t = now();
  record.status = 'abandoned';
  record.endedAt = t;
  record.lastActiveAt = t;
  record.updatedAt = t;
  record.safeReasonCodes = [...record.safeReasonCodes.filter(c => c !== 'session_abandoned'), 'session_abandoned'];
  sessionStore.set(sessionId, record);
  return { session: cloneRecord(record), created: false, resumed: false, safeReasonCodes: ['session_abandoned'] };
}

export function expireStudentLearningSession(sessionId: string): StudentLearningSessionLifecycleResult | null {
  const record = sessionStore.get(sessionId);
  if (!record) return null;
  if (record.status === 'completed' || record.status === 'abandoned' || record.status === 'blocked') return null;
  const t = now();
  record.status = 'expired';
  record.endedAt = t;
  record.lastActiveAt = t;
  record.updatedAt = t;
  record.safeReasonCodes = [...record.safeReasonCodes.filter(c => c !== 'session_expired'), 'session_expired'];
  sessionStore.set(sessionId, record);
  return { session: cloneRecord(record), created: false, resumed: false, safeReasonCodes: ['session_expired'] };
}

export function getStudentLearningSession(sessionId: string): StudentLearningSessionRecord | null {
  const record = sessionStore.get(sessionId);
  return record ? cloneRecord(record) : null;
}

export function listStudentLearningSessionsForLearner(schoolId: string, tutorLearnerId: string): StudentLearningSessionRecord[] {
  return Array.from(sessionStore.values())
    .filter(r => r.schoolId === schoolId && r.tutorLearnerId === tutorLearnerId)
    .map(cloneRecord);
}

export function clearStudentLearningSessionStoreForTest(): void {
  sessionStore.clear();
}

export function updateSessionTransition(
  sessionId: string,
  updates: Partial<{
    status: StudentLearningSessionStatus;
    stage: StudentLearningSessionStage;
    currentMode: StudentLearningSessionMode;
    previousMode: StudentLearningSessionMode;
    allowedTransitions: StudentLearningSessionTransitionType[];
    blockedTransitions: StudentLearningSessionTransitionType[];
    safeReasonCodes: StudentLearningSessionReasonCode[];
    safeEvidenceRefs: string[];
    safeActionRefs: string[];
    lastGrowthActionId: string;
    lastTutorTurnId: string;
    lastChallengeId: string;
    lastRemediationPathId: string;
    lastRecommendationId: string;
    lastEvidenceEventId: string;
  }>,
): StudentLearningSessionRecord | null {
  const record = sessionStore.get(sessionId);
  if (!record) return null;
  if (record.status === 'completed' || record.status === 'abandoned' || record.status === 'blocked') return null;
  const t = now();
  if (updates.status !== undefined) record.status = updates.status;
  if (updates.stage !== undefined) record.stage = updates.stage;
  if (updates.currentMode !== undefined) {
    record.previousMode = record.currentMode;
    record.currentMode = updates.currentMode;
  }
  if (updates.previousMode !== undefined) record.previousMode = updates.previousMode;
  if (updates.allowedTransitions !== undefined) record.allowedTransitions = updates.allowedTransitions;
  if (updates.blockedTransitions !== undefined) record.blockedTransitions = updates.blockedTransitions;
  if (updates.safeReasonCodes !== undefined) record.safeReasonCodes = updates.safeReasonCodes;
  if (updates.safeEvidenceRefs !== undefined) record.safeEvidenceRefs = updates.safeEvidenceRefs;
  if (updates.safeActionRefs !== undefined) record.safeActionRefs = updates.safeActionRefs;
  if (updates.lastGrowthActionId !== undefined) record.lastGrowthActionId = updates.lastGrowthActionId;
  if (updates.lastTutorTurnId !== undefined) record.lastTutorTurnId = updates.lastTutorTurnId;
  if (updates.lastChallengeId !== undefined) record.lastChallengeId = updates.lastChallengeId;
  if (updates.lastRemediationPathId !== undefined) record.lastRemediationPathId = updates.lastRemediationPathId;
  if (updates.lastRecommendationId !== undefined) record.lastRecommendationId = updates.lastRecommendationId;
  if (updates.lastEvidenceEventId !== undefined) record.lastEvidenceEventId = updates.lastEvidenceEventId;
  record.lastActiveAt = t;
  record.updatedAt = t;
  sessionStore.set(sessionId, record);
  return cloneRecord(record);
}
