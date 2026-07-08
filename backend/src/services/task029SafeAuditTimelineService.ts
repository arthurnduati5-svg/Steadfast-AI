import {
  Task029SafeAuditTimelineInput,
  Task029SafeAuditTimeline,
  Task029SafeAuditEvent,
  TASK029_OPERATION_AUDIT_EVENTS,
} from '../contracts/task029ExpansionOperationsContracts';
import { task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

export async function getSafeAuditTimeline(
  input: Task029SafeAuditTimelineInput
): Promise<{ ok: boolean; data: Task029SafeAuditTimeline | null; blockingIssues: string[] }> {
  const blockingIssues: string[] = [];

  if (!input.schoolId || !input.actorId || !input.actorRole || !input.expansionRunId) {
    blockingIssues.push('missing_required_input_fields');
    return { ok: false, data: null, blockingIssues };
  }

  const rawEvents = await task029ExpansionOperationsRepository.listOperationsAuditEvents(input.schoolId);

  const allowedTypes = TASK029_OPERATION_AUDIT_EVENTS as readonly string[];

  const safeEvents: Task029SafeAuditEvent[] = rawEvents
    .filter(e => allowedTypes.includes(e.eventType))
    .map((e, idx) => ({
      eventId: `audit_${input.expansionRunId}_${idx}_${Date.now()}`,
      eventType: e.eventType,
      createdAt: new Date().toISOString(),
      actorRole: e.actorRole || input.actorRole,
      safeSummary: e.safeSummary || '',
    }));

  const timeline: Task029SafeAuditTimeline = {
    schoolId: input.schoolId,
    expansionRunId: input.expansionRunId,
    events: safeEvents,
  };

  await task029ExpansionOperationsRepository.recordAuditTimelineView(timeline);

  await task029ExpansionOperationsRepository.recordOperationsAuditEvent({
    schoolId: input.schoolId,
    actorId: input.actorId,
    actorRole: input.actorRole,
    eventType: 'operation_viewed',
    safeSummary: 'Safe audit timeline viewed',
  });

  return { ok: true, data: timeline, blockingIssues };
}
