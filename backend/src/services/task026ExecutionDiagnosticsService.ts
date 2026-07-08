import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import type { Task026ExecutionDiagnostics, Task026DependencyGateResult, Task026DependencyGateStatus } from '../contracts/task026ControlledPilotExecutionContracts';

export async function getDiagnostics(
  runId: string,
  schoolId: string
): Promise<{ ok: boolean; diagnostics?: Task026ExecutionDiagnostics; reasonCodes: string[]; safeMessage: string }> {
  if (!runId) {
    return { ok: false, reasonCodes: ['missing_run_id'], safeMessage: 'Run ID is required.' };
  }

  const run = await task026PilotExecutionRepository.getPilotRun(runId);
  if (!run) {
    return { ok: false, reasonCodes: ['run_not_found'], safeMessage: 'Pilot run not found.' };
  }

  if (run.schoolId !== schoolId) {
    return { ok: false, reasonCodes: ['school_mismatch'], safeMessage: 'School mismatch.' };
  }

  const evidenceEvents = await task026PilotExecutionRepository.listEvidenceEvents(runId);
  const safeguardingSignals = await task026PilotExecutionRepository.listSafeguardingSignals(runId);
  const incidentSignals = await task026PilotExecutionRepository.listIncidentSignals(runId);
  const auditEvents = await task026PilotExecutionRepository.listAuditEvents(runId);

  const dependencyGates: Task026DependencyGateResult[] = [
    {
      gate: 'school_verified',
      status: 'passed' as Task026DependencyGateStatus,
      reasonCodes: [],
      safeMessage: 'School verified.',
    },
    {
      gate: 'run_exists',
      status: 'passed' as Task026DependencyGateStatus,
      reasonCodes: [],
      safeMessage: 'Run exists.',
    },
    {
      gate: 'owners_assigned',
      status: (run.teacherOwnerId && run.supportOwnerId && run.safeguardingOwnerId) ? 'passed' as Task026DependencyGateStatus : 'blocked' as Task026DependencyGateStatus,
      reasonCodes: [],
      safeMessage: 'Owners assignment check.',
    },
  ];

  const allGatesPassed = dependencyGates.every((g) => g.status === 'passed');
  const auditEventCount = auditEvents.length;
  const lastEvent = auditEvents.length > 0 ? auditEvents[0] : null;
  const lastStateTransition = lastEvent ? lastEvent.safeSummary : 'no_transitions';

  const uptimeStatus = run.status === 'active_controlled' ? 'operational' :
    run.status === 'paused' ? 'paused' :
    run.status === 'rolled_back' ? 'rolled_back' :
    run.status === 'blocked' ? 'blocked' : 'inactive';

  const diagnostics: Task026ExecutionDiagnostics = {
    runId,
    status: run.status,
    dependencyGates,
    gateStatus: allGatesPassed ? 'all_passed' : 'some_blocked',
    incidentCount: incidentSignals.length,
    safeguardingSignalCount: safeguardingSignals.length,
    evidenceEventCount: evidenceEvents.length,
    lastStateTransition,
    uptimeStatus,
  };

  await task026PilotExecutionRepository.recordAuditEvent({
    runId,
    schoolId,
    actorRole: 'system',
    action: 'diagnostics_viewed',
    safeSummary: `Diagnostics viewed for run ${runId}.`,
    metadataSafeJson: { status: run.status, evidenceCount: evidenceEvents.length },
  });

  return { ok: true, diagnostics, reasonCodes: [], safeMessage: 'Diagnostics retrieved.' };
}
