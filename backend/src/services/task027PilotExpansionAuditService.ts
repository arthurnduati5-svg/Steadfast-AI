import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';

export async function recordExpansionAuditEvent(data: {
  expansionProposalId?: string;
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
  const record = await task027PilotExpansionRepository.createAuditRecord(data);
  return { ok: true, auditId: (record as any).id };
}

export async function listExpansionAuditEvents(expansionProposalId?: string, limit = 100) {
  return task027PilotExpansionRepository.listAuditRecords(expansionProposalId, limit);
}
