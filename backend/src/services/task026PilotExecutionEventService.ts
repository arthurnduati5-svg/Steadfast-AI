import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import type { PilotExecutionEventInput } from '../contracts/task026PilotExecutionContracts';
import { PILOT_EXECUTION_EVENT_TYPES } from '../contracts/task026PilotExecutionContracts';

export async function recordPilotEvent(input: PilotExecutionEventInput): Promise<{ ok: boolean; eventId?: string; reasonCodes: string[]; safeMessage: string }> {
  if (!input.executionRunId || !input.pilotProgramId || !input.schoolId) {
    return { ok: false, reasonCodes: ['missing_required_fields'], safeMessage: 'executionRunId, pilotProgramId, and schoolId are required.' };
  }

  if (!input.actorRole) {
    return { ok: false, reasonCodes: ['missing_actor_role'], safeMessage: 'actorRole is required.' };
  }

  if (!PILOT_EXECUTION_EVENT_TYPES.includes(input.eventType as any)) {
    return { ok: false, reasonCodes: ['invalid_event_type', `type_${input.eventType}`], safeMessage: `Invalid event type: ${input.eventType}` };
  }

  const safeSummary = input.safeSummary?.substring(0, 2000) || 'No summary provided';

  const event = await task026PilotExecutionRepository.createExecutionEvent({
    executionRunId: input.executionRunId,
    pilotProgramId: input.pilotProgramId,
    schoolId: input.schoolId,
    actorRole: input.actorRole,
    actorIdHash: input.actorIdHash,
    eventType: input.eventType,
    eventStatus: input.eventStatus || 'completed',
    safeSummary,
    reasonCodes: input.reasonCodes ?? [],
    metadataSafeJson: input.metadataSafeJson ?? {},
    requestId: input.requestId,
    correlationId: input.correlationId,
  });

  return {
    ok: true,
    eventId: (event as any).id,
    reasonCodes: [],
    safeMessage: `Event ${input.eventType} recorded.`,
  };
}

export async function listPilotEvents(executionRunId: string) {
  const events = await task026PilotExecutionRepository.listExecutionEvents(executionRunId);
  return events.map((e: any) => ({
    id: e.id,
    eventType: e.eventType,
    eventStatus: e.eventStatus,
    safeSummary: e.safeSummary,
    reasonCodes: e.reasonCodes,
    actorRole: e.actorRole,
    createdAt: e.createdAt,
  }));
}
