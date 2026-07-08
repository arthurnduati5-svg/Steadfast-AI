import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type { Task028ExecutionAuditEvent } from '../contracts/task028ControlledExpansionExecutionContracts';
import { nowISO } from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  rejectTask028ForbiddenFields,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

interface RecordAuditEventData {
  runId?: string;
  schoolId?: string;
  actorRole: string;
  action: string;
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
}

export async function recordAuditEvent(
  data: RecordAuditEventData,
): Promise<Task028ExecutionAuditEvent> {
  if (!data || typeof data !== 'object') {
    throw createSafeTask028ValidationError('Invalid audit event data.', ['input_required']);
  }
  if (!data.actorRole) {
    throw createSafeTask028ValidationError('actorRole is required.', ['actorRole_required']);
  }
  if (!data.action) {
    throw createSafeTask028ValidationError('action is required.', ['action_required']);
  }
  if (!data.safeSummary) {
    throw createSafeTask028ValidationError('safeSummary is required.', ['safeSummary_required']);
  }

  const metaErrors: string[] = [];
  if (data.metadataSafeJson) {
    rejectTask028ForbiddenFields(data.metadataSafeJson, metaErrors);
  }
  if (metaErrors.length > 0) {
    throw createSafeTask028ValidationError('Forbidden fields in metadata.', metaErrors);
  }

  const record = await task028ExpansionExecutionRepository.createAuditRecord({
    executionRunId: data.runId,
    schoolId: data.schoolId,
    actorRole: data.actorRole,
    action: data.action,
    safeSummary: data.safeSummary,
    metadataSafeJson: { ...(data.metadataSafeJson ?? {}), timestamp: nowISO() },
  });

  const event: Task028ExecutionAuditEvent = {
    eventId: (record as any).id,
    runId: data.runId,
    schoolId: data.schoolId,
    actorRole: data.actorRole,
    action: data.action,
    safeSummary: data.safeSummary,
    metadataSafeJson: data.metadataSafeJson ?? {},
    createdAt: nowISO(),
  };

  return event;
}

export async function listAuditEvents(
  runId?: string,
  limit: number = 100,
): Promise<Task028ExecutionAuditEvent[]> {
  const records = await task028ExpansionExecutionRepository.listAuditRecords(runId, limit);

  return records.map((r: any) => ({
    eventId: r.id,
    runId: r.executionRunId ?? undefined,
    schoolId: r.schoolId ?? undefined,
    actorRole: r.actorRole,
    action: r.action,
    safeSummary: r.safeSummary,
    metadataSafeJson: r.metadataSafeJson ?? {},
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
  }));
}
