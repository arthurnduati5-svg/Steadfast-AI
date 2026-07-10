import type { Task034EvidenceEvent, Task034EvidenceLedger } from '../contracts/task034ControlledLimitedRolloutContracts';
import { createTask034SafeTimestamp } from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

export async function appendTask034EvidenceEvent(event: Task034EvidenceEvent): Promise<void> {
  const evidenceEvent: Task034EvidenceEvent = {
    eventId: event.eventId || `evt_${event.sessionId}_${Date.now()}`,
    sessionId: event.sessionId,
    evidenceType: event.evidenceType,
    safeDescription: event.safeDescription,
    safeReasonCodes: event.safeReasonCodes,
    timestamp: event.timestamp || createTask034SafeTimestamp(),
    actorRole: event.actorRole,
  };

  await task034Repository.appendEvidenceEvent(evidenceEvent);
}

export async function getTask034EvidenceLedger(sessionId: string): Promise<Task034EvidenceLedger> {
  return task034Repository.getEvidenceLedger(sessionId);
}
