import type { Task025ReadinessAuditEvent, Task025AuditEvent } from '../contracts/task025ControlledPilotReadinessContracts';
import { task025PilotReadinessRepository } from './task025PilotReadinessRepository';

export interface AuditQuery {
  schoolId?: string;
  limit?: number;
}

export async function queryReadinessAudit(params: AuditQuery): Promise<{
  records: Task025ReadinessAuditEvent[];
  totalCount: number;
}> {
  const records = task025PilotReadinessRepository.listAuditEvents(params.schoolId, params.limit || 100);
  return {
    records,
    totalCount: records.length,
  };
}

export async function writeReadinessAuditEvent(
  schoolId: string,
  actorRole: string,
  eventType: Task025AuditEvent,
  safeSummary: string,
  requestId: string,
): Promise<Task025ReadinessAuditEvent> {
  return task025PilotReadinessRepository.writeAuditEvent(
    schoolId,
    actorRole,
    eventType,
    safeSummary,
    requestId,
  );
}
