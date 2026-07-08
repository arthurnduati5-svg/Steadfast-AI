import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { EXPANSION_MONITORING_EVENT_TYPES, FORBIDDEN_CONTENT_PATTERNS } from '../contracts/task028ExpansionExecutionContracts';
import type { ExpansionMonitoringEventInput } from '../contracts/task028ExpansionExecutionContracts';

function isPrivacySafe(value: unknown): boolean {
  if (typeof value === 'string') {
    for (const pattern of FORBIDDEN_CONTENT_PATTERNS) {
      if (value.toLowerCase().includes(pattern.toLowerCase())) {
        return false;
      }
    }
  }
  if (typeof value === 'object' && value !== null) {
    return Object.values(value as Record<string, unknown>).every(isPrivacySafe);
  }
  return true;
}

export async function recordExpansionMonitoringEvent(
  input: ExpansionMonitoringEventInput,
): Promise<{ ok: boolean; eventId?: string; reasonCodes: string[]; safeMessage: string }> {
  if (!input.executionRunId || !input.pilotProgramId || !input.schoolId) {
    return { ok: false, reasonCodes: ['missing_required_fields'], safeMessage: 'executionRunId, pilotProgramId, and schoolId are required.' };
  }

  if (!input.actorRole) {
    return { ok: false, reasonCodes: ['missing_actor_role'], safeMessage: 'actorRole is required.' };
  }

  if (!EXPANSION_MONITORING_EVENT_TYPES.includes(input.eventType)) {
    return { ok: false, reasonCodes: ['invalid_event_type', `type_${input.eventType}`], safeMessage: `Invalid event type: ${input.eventType}.` };
  }

  const safeSummary = (input.safeSummary || 'No summary provided').substring(0, 2000);
  if (!isPrivacySafe(safeSummary)) {
    return { ok: false, reasonCodes: ['unsafe_content_detected'], safeMessage: 'Event contains privacy-sensitive content.' };
  }

  const safeMetadata = input.metadataSafeJson ?? {};
  if (!isPrivacySafe(safeMetadata)) {
    return { ok: false, reasonCodes: ['unsafe_metadata_detected'], safeMessage: 'Event metadata contains privacy-sensitive content.' };
  }

  const safeRequestId = input.requestId ? input.requestId.substring(0, 64) : undefined;
  const safeCorrelationId = input.correlationId ? input.correlationId.substring(0, 64) : undefined;

  const event = await task028ExpansionExecutionRepository.createRuntimeEvent({
    executionRunId: input.executionRunId,
    stageId: input.stageId,
    pilotProgramId: input.pilotProgramId,
    schoolId: input.schoolId,
    actorRole: input.actorRole,
    actorIdHash: input.actorIdHash ? input.actorIdHash.substring(0, 64) : undefined,
    eventType: input.eventType,
    eventStatus: input.eventStatus || 'completed',
    safeSummary,
    reasonCodes: input.reasonCodes ?? [],
    metadataSafeJson: safeMetadata,
    requestId: safeRequestId,
    correlationId: safeCorrelationId,
  });

  return {
    ok: true,
    eventId: (event as any).id,
    reasonCodes: [],
    safeMessage: `Monitoring event ${input.eventType} recorded.`,
  };
}


