import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026PilotEvidenceEventInput, rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026PilotEvidenceEventInput, Task026PilotEvidenceEvent } from '../contracts/task026ControlledPilotExecutionContracts';

export async function recordEvidenceEvent(
  input: Task026PilotEvidenceEventInput
): Promise<{ ok: boolean; event?: Task026PilotEvidenceEvent; reasonCodes: string[]; safeMessage: string }> {
  const validation = validateTask026PilotEvidenceEventInput(input);
  if (!validation.valid) {
    return { ok: false, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const forbiddenCheck = rejectTask026ForbiddenFields(validation.data.metadataSafeJson as Record<string, unknown>);
  if (forbiddenCheck) {
    return { ok: false, reasonCodes: forbiddenCheck.reasonCodes, safeMessage: forbiddenCheck.safeMessage };
  }

  const event = await task026PilotExecutionRepository.recordEvidenceEvent({
    schoolId: validation.data.schoolId,
    pilotRunId: validation.data.pilotRunId,
    eventType: validation.data.eventType,
    actorRole: validation.data.actorRole,
    safeSummary: validation.data.safeSummary,
    metadataSafeJson: validation.data.metadataSafeJson || {},
  });

  return { ok: true, event, reasonCodes: [], safeMessage: `Evidence event ${event.id} recorded.` };
}

export async function listEvidenceEvents(
  runId: string
): Promise<{ ok: boolean; events: Task026PilotEvidenceEvent[]; reasonCodes: string[]; safeMessage: string }> {
  if (!runId) {
    return { ok: false, events: [], reasonCodes: ['missing_run_id'], safeMessage: 'Run ID is required.' };
  }

  const events = await task026PilotExecutionRepository.listEvidenceEvents(runId);
  return { ok: true, events, reasonCodes: [], safeMessage: `${events.length} evidence event(s) found.` };
}
