import type { Task033EvidenceEvent, Task033EvidenceLedger } from '../contracts/task033ControlledCanaryObservationContracts';
import { createTask033SafeTimestamp } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function appendTask033Evidence(event: Task033EvidenceEvent): Promise<void> {
  const evidenceEvent: Task033EvidenceEvent = {
    eventId: event.eventId || `evt_${event.sessionId}_${Date.now()}`,
    sessionId: event.sessionId,
    evidenceType: event.evidenceType,
    safeDescription: event.safeDescription,
    safeReasonCodes: event.safeReasonCodes,
    timestamp: event.timestamp || createTask033SafeTimestamp(),
    actorRole: event.actorRole,
  };

  await task033Repository.recordEvidenceEvent(evidenceEvent);
}

export async function getTask033EvidenceLedger(sessionId: string): Promise<Task033EvidenceLedger> {
  const events = await task033Repository.listEvidenceEvents(sessionId);

  return {
    sessionId,
    events,
    totalCount: events.length,
    generatedAt: createTask033SafeTimestamp(),
  };
}
