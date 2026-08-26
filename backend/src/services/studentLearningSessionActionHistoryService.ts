import type {
  StudentLearningSessionMode,
  StudentLearningSessionTransitionType,
  StudentLearningSessionReasonCode,
  StudentLearningSessionActionHistoryEvent,
} from '../contracts/studentLearningSessionContracts';
import { studentLearningSessionRepository } from './studentLearningSessionRepository';

export async function recordSessionActionHistoryEvent(event: {
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
}): Promise<StudentLearningSessionActionHistoryEvent> {
  const result = await studentLearningSessionRepository.appendEvent({
    schoolId: event.schoolId,
    tutorLearnerId: event.tutorLearnerId,
    sessionId: event.sessionId,
    studentId: event.studentId,
    eventType: event.actionType,
    transitionType: event.transitionType,
    resultingStatus: event.status as any,
    nextMode: event.mode,
    safeEventSummary: event.actionType,
    safeEvidenceRefs: event.safeEvidenceRefs,
    reasonCodes: event.safeReasonCodes,
    operationVersion: 1,
  });

  return {
    eventId: result.id,
    sessionId: result.sessionId,
    schoolId: result.schoolId,
    studentId: result.studentId,
    tutorLearnerId: result.tutorLearnerId,
    actionType: result.eventType,
    mode: (result.nextMode || 'none') as StudentLearningSessionMode,
    transitionType: result.transitionType,
    status: result.resultingStatus || 'unknown',
    safeReasonCodes: result.reasonCodes as StudentLearningSessionReasonCode[],
    safeEvidenceRefs: result.safeEvidenceRefs,
    createdAt: result.createdAt.toISOString(),
  };
}

export async function listSessionActionHistoryEvents(
  sessionId: string,
  schoolId: string,
  tutorLearnerId: string,
): Promise<StudentLearningSessionActionHistoryEvent[]> {
  return studentLearningSessionRepository.listActionHistory(sessionId, schoolId, tutorLearnerId);
}

export async function buildSafeActionHistoryView(
  sessionId: string,
  schoolId: string,
  tutorLearnerId: string,
): Promise<StudentLearningSessionActionHistoryEvent[]> {
  return studentLearningSessionRepository.listActionHistory(sessionId, schoolId, tutorLearnerId);
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
}