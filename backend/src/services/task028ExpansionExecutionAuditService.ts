import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

export async function recordAuditEvent(data: {
  executionRunId?: string;
  stageId?: string;
  pilotProgramId?: string;
  schoolId?: string;
  actorRole: string;
  actorIdHash?: string;
  action: string;
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
}): Promise<{ ok: boolean; auditId?: string }> {
  const record = await task028ExpansionExecutionRepository.createAuditRecord(data);
  return { ok: true, auditId: (record as any).id };
}

export async function listAuditEvents(executionRunId?: string, limit = 100) {
  return task028ExpansionExecutionRepository.listAuditRecords(executionRunId, limit);
}
