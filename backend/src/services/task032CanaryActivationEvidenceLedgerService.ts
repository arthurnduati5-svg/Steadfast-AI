import type { Task032CanaryEvidenceEvent, Task032CanaryEvidenceLedger } from '../contracts/task032ControlledCanaryActivationContracts';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';

export async function recordTask032CanaryEvidenceEvent(input: Task032CanaryEvidenceEvent): Promise<Task032CanaryEvidenceEvent> {
  const event: Task032CanaryEvidenceEvent = {
    eventId: input.eventId || `evt_${input.activationId}_${Date.now()}`,
    activationId: input.activationId,
    stageId: input.stageId,
    actorRole: input.actorRole,
    status: input.status,
    safeSummary: input.safeSummary,
    reasonCodes: input.reasonCodes,
    createdAt: input.createdAt || new Date().toISOString()
  };

  await task032ControlledCanaryActivationRepository.recordEvidenceEvent(event);
  return event;
}

export async function listTask032CanaryEvidenceEvents(activationId: string): Promise<Task032CanaryEvidenceLedger> {
  const events = await task032ControlledCanaryActivationRepository.listEvidenceEvents(activationId);
  return {
    activationId,
    events,
    eventCount: events.length
  };
}
