import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

export async function getSupportQueueMetadata(
  pilotRunId: string,
  schoolId: string
): Promise<{ ok: boolean; metadata?: Record<string, unknown>; reasonCodes: string[]; safeMessage: string }> {
  if (!pilotRunId) {
    return { ok: false, reasonCodes: ['missing_pilot_run_id'], safeMessage: 'Pilot run ID is required.' };
  }
  if (!schoolId) {
    return { ok: false, reasonCodes: ['missing_school_id'], safeMessage: 'School ID is required.' };
  }

  const run = await task026PilotExecutionRepository.getPilotRun(pilotRunId);
  if (!run) {
    return { ok: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  if (run.schoolId !== schoolId) {
    return { ok: false, reasonCodes: ['school_mismatch'], safeMessage: 'School mismatch.' };
  }

  const evidenceEvents = await task026PilotExecutionRepository.listEvidenceEvents(pilotRunId);
  const safeguardingSignals = await task026PilotExecutionRepository.listSafeguardingSignals(pilotRunId);
  const incidentSignals = await task026PilotExecutionRepository.listIncidentSignals(pilotRunId);

  const supportNeededCount = evidenceEvents.filter((e) => e.eventType === 'support_needed').length;
  const pendingReviewCount = safeguardingSignals.filter((s: any) => s.status === 'pending_review').length;
  const activeIncidentCount = incidentSignals.length;

  const metadata: Record<string, unknown> = {
    pilotRunId,
    schoolId,
    status: run.status,
    supportNeededCount,
    pendingSafeguardingReviewCount: pendingReviewCount,
    activeIncidentCount,
    hasSupportOwner: run.supportOwnerId !== '',
    hasSafeguardingOwner: run.safeguardingOwnerId !== '',
    queuePriority: activeIncidentCount > 0 ? 'high' : pendingReviewCount > 0 ? 'medium' : 'normal',
  };

  return { ok: true, metadata, reasonCodes: [], safeMessage: 'Support queue metadata retrieved.' };
}
