import type {
  TutorTurnEventType,
  TutorTurnTelemetryEvent,
  TutorTurnContext,
  TutorTurnStatus,
  TutorTurnSafeReasonCode,
} from '../contracts/tutorTurnRuntimeContracts';

const telemetryStore: TutorTurnTelemetryEvent[] = [];

export function recordTutorTurnEvent(
  context: TutorTurnContext,
  eventType: TutorTurnEventType,
  eventStatus: TutorTurnStatus,
  turnId?: string,
  extraReasonCodes?: TutorTurnSafeReasonCode[],
): TutorTurnTelemetryEvent {
  const event: TutorTurnTelemetryEvent = {
    eventType,
    eventStatus,
    schoolId: context.schoolId,
    studentId: context.studentId,
    turnId,
    safeMetadata: {
      turnKind: context.turnKind,
      turnIntent: context.turnIntent,
      dispatchTarget: context. execute ? 'will_execute' : 'resolve_only',
    },
    safeReasonCodes: [
      ...context.safeReasonCodes,
      ...(extraReasonCodes || []),
    ],
    safeEvidenceRefs: context.safeEvidenceRefs,
    createdAt: new Date().toISOString(),
  };

  telemetryStore.push(event);
  return event;
}

export function getTelemetryEvents(
  schoolId?: string,
  studentId?: string,
  limit: number = 100,
): TutorTurnTelemetryEvent[] {
  let events = telemetryStore;
  if (schoolId) {
    events = events.filter(e => e.schoolId === schoolId);
  }
  if (studentId) {
    events = events.filter(e => e.studentId === studentId);
  }
  return events.slice(-limit);
}
