import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';
import type { Task027GovernanceAuditEvent } from '../contracts/task027PilotExpansionGovernanceContracts';

export async function recordAuditEvent(event: Task027GovernanceAuditEvent): Promise<any> {
  return govRepo.recordAuditEvent(event);
}

export async function listAuditEvents(schoolId?: string, limit?: number): Promise<any[]> {
  return govRepo.listAuditEvents(schoolId, limit);
}
