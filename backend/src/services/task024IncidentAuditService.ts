import { task024OpsRepository } from '../repositories/task024OpsRepository';
import type { IncidentCategory, IncidentSeverity } from '../contracts/task024OperationsContracts';

export async function recordIncidentAudit(
  incidentId: string,
  action: string,
  actorRole?: string,
  safeNote?: string,
  previousStatus?: string,
  newStatus?: string,
  requestId?: string,
) {
  return task024OpsRepository.createIncidentAudit({
    incidentId,
    actorRole,
    action,
    safeNote,
    previousStatus,
    newStatus,
    requestId,
  });
}

export async function getAuditRecords(incidentId?: string, limit = 100) {
  return task024OpsRepository.listIncidentAudits(incidentId, limit);
}

export async function createIncidentAndAudit(
  incidentData: Parameters<typeof task024OpsRepository.createIncident>[0],
  actorRole?: string,
  requestId?: string,
) {
  const incident = await task024OpsRepository.createIncident(incidentData);
  await task024OpsRepository.createIncidentAudit({
    incidentId: incident.id,
    actorRole,
    action: 'incident_created',
    newStatus: incident.status,
    requestId,
  });
  return incident;
}

export async function transitionIncidentStatus(
  incidentId: string,
  newStatus: string,
  actorRole?: string,
  safeNote?: string,
  requestId?: string,
) {
  const incident = await task024OpsRepository.getIncidentById(incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }

  const previousStatus = incident.status;

  const allowedTransitions: Record<string, string[]> = {
    open: ['acknowledged', 'investigating', 'resolved', 'false_positive'],
    acknowledged: ['investigating', 'resolved', 'false_positive', 'mitigated'],
    investigating: ['mitigated', 'resolved', 'false_positive'],
    mitigated: ['resolved', 'investigating'],
    resolved: [],
    false_positive: [],
  };

  const allowed = allowedTransitions[previousStatus] ?? [];
  if (!allowed.includes(newStatus) && previousStatus !== newStatus) {
    throw new Error(
      `Invalid status transition: ${previousStatus} -> ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
    );
  }

  const updated = await task024OpsRepository.updateIncidentStatus(incidentId, newStatus);
  await task024OpsRepository.createIncidentAudit({
    incidentId,
    actorRole,
    action: `status_${newStatus}`,
    previousStatus,
    newStatus,
    safeNote,
    requestId,
  });

  return updated;
}

export async function appendSafeAuditNote(
  incidentId: string,
  safeNote: string,
  actorRole?: string,
  requestId?: string,
) {
  const incident = await task024OpsRepository.getIncidentById(incidentId);
  if (!incident) {
    throw new Error(`Incident ${incidentId} not found`);
  }
  return task024OpsRepository.createIncidentAudit({
    incidentId,
    actorRole,
    action: 'audit_note',
    newStatus: incident.status,
    safeNote,
    requestId,
  });
}

export async function listIncidents(limit = 100, offset = 0) {
  return task024OpsRepository.listIncidents(limit, offset);
}

export async function listIncidentsByStatus(status: string, limit = 100) {
  return task024OpsRepository.listIncidentsByStatus(status, limit);
}
