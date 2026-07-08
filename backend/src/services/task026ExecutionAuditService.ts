import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026ExecutionAuditEvent, Task026AuditEvent } from '../contracts/task026ControlledPilotExecutionContracts';

export async function recordAuditEvent(params: {
  runId?: string;
  schoolId: string;
  actorRole: string;
  action: Task026AuditEvent;
  safeSummary: string;
  metadataSafeJson?: Record<string, unknown>;
}): Promise<{ ok: boolean; event?: Task026ExecutionAuditEvent; reasonCodes: string[]; safeMessage: string }> {
  if (!params.schoolId) {
    return { ok: false, reasonCodes: ['missing_school_id'], safeMessage: 'School ID is required.' };
  }
  if (!params.actorRole) {
    return { ok: false, reasonCodes: ['missing_actor_role'], safeMessage: 'Actor role is required.' };
  }
  if (!params.action) {
    return { ok: false, reasonCodes: ['missing_action'], safeMessage: 'Audit action is required.' };
  }

  const safeMetadata = params.metadataSafeJson || {};
  const forbiddenCheck = rejectTask026ForbiddenFields(safeMetadata as Record<string, unknown>);
  if (forbiddenCheck) {
    return { ok: false, reasonCodes: forbiddenCheck.reasonCodes, safeMessage: forbiddenCheck.safeMessage };
  }

  const event = await task026PilotExecutionRepository.recordAuditEvent({
    runId: params.runId,
    schoolId: params.schoolId,
    actorRole: params.actorRole,
    action: params.action,
    safeSummary: params.safeSummary.substring(0, 2000),
    metadataSafeJson: safeMetadata,
  });

  return { ok: true, event, reasonCodes: [], safeMessage: `Audit event ${event.id} recorded.` };
}

export async function listAuditEvents(
  runId?: string
): Promise<{ ok: boolean; events: Task026ExecutionAuditEvent[]; reasonCodes: string[]; safeMessage: string }> {
  const events = await task026PilotExecutionRepository.listAuditEvents(runId);
  return {
    ok: true,
    events,
    reasonCodes: [],
    safeMessage: `${events.length} audit event(s) found.`,
  };
}
