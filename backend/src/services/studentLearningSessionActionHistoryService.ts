import type {
  StudentLearningSessionMode,
  StudentLearningSessionTransitionType,
  StudentLearningSessionReasonCode,
  StudentLearningSessionActionHistoryEvent,
} from '../contracts/studentLearningSessionContracts';

const actionHistoryStore: Map<string, StudentLearningSessionActionHistoryEvent[]> = new Map();

function generateEventId(): string {
  return `ah_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function recordSessionActionHistoryEvent(event: {
  sessionId: string;
  schoolId: string;
  studentId?: string;
  tutorLearnerId: string;
  actionType: string;
  mode: StudentLearningSessionMode;
  transitionType?: StudentLearningSessionTransitionType;
  status: string;
  safeReasonCodes?: StudentLearningSessionReasonCode[];
  safeEvidenceRefs?: string[];
}): StudentLearningSessionActionHistoryEvent {
  const ev: StudentLearningSessionActionHistoryEvent = {
    eventId: generateEventId(),
    sessionId: event.sessionId,
    schoolId: event.schoolId,
    studentId: event.studentId,
    tutorLearnerId: event.tutorLearnerId,
    actionType: event.actionType,
    mode: event.mode,
    transitionType: event.transitionType,
    status: event.status,
    safeReasonCodes: event.safeReasonCodes ?? [],
    safeEvidenceRefs: event.safeEvidenceRefs ?? [],
    createdAt: new Date().toISOString(),
  };
  const existing = actionHistoryStore.get(event.sessionId) || [];
  existing.push(ev);
  actionHistoryStore.set(event.sessionId, existing);
  return ev;
}

export function listSessionActionHistoryEvents(sessionId: string): StudentLearningSessionActionHistoryEvent[] {
  return [...(actionHistoryStore.get(sessionId) || [])];
}

export function buildSafeActionHistoryView(sessionId: string): StudentLearningSessionActionHistoryEvent[] {
  const events = actionHistoryStore.get(sessionId) || [];
  return events.map(e => ({
    eventId: e.eventId,
    sessionId: e.sessionId,
    schoolId: e.schoolId,
    studentId: e.studentId,
    tutorLearnerId: e.tutorLearnerId,
    actionType: e.actionType,
    mode: e.mode,
    transitionType: e.transitionType,
    status: e.status,
    safeReasonCodes: e.safeReasonCodes,
    safeEvidenceRefs: e.safeEvidenceRefs,
    createdAt: e.createdAt,
  }));
}

export function assertActionHistoryEventIsSafe(event: StudentLearningSessionActionHistoryEvent): void {
  const forbiddenKeys = [
    'rawText', 'rawMessage', 'rawNote', 'rawQuestion', 'rawAnswer',
    'rawExplanation', 'answerKey', 'modelAnswer', 'markingScheme',
    'correctAnswer', 'hiddenReasoning', 'chainOfThought', 'transcript',
    'teacherOnlyNote', 'safeguardingRawDetail', 'deenSensitivePrivateText',
  ];
  const e = event as unknown as Record<string, unknown>;
  for (const key of forbiddenKeys) {
    if (key in e && e[key] !== undefined) {
      throw new Error(`Action history event contains forbidden field: ${key}`);
    }
  }
}

export function clearSessionActionHistoryForTest(): void {
  actionHistoryStore.clear();
}
