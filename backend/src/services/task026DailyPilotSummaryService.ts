import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026DailyPilotSummaryInput } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026DailyPilotSummaryInput, Task026DailyPilotSummary, Task026RiskLevel } from '../contracts/task026ControlledPilotExecutionContracts';

function calculateRiskLevel(
  incidentCount: number,
  safeguardingCount: number,
  status: string
): Task026RiskLevel {
  if (status === 'rolled_back' || status === 'blocked') return 'critical';
  if (incidentCount > 5 || safeguardingCount > 10) return 'high';
  if (incidentCount > 2 || safeguardingCount > 5) return 'medium';
  if (incidentCount > 0 || safeguardingCount > 0) return 'low';
  return 'none';
}

export async function generateDailySummary(
  input: Task026DailyPilotSummaryInput
): Promise<{ ok: boolean; summary?: Task026DailyPilotSummary; reasonCodes: string[]; safeMessage: string }> {
  const validation = validateTask026DailyPilotSummaryInput(input);
  if (!validation.valid) {
    return { ok: false, reasonCodes: validation.reasonCodes, safeMessage: validation.safeMessage };
  }

  const { pilotRunId, schoolId } = validation.data;

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

  const sessionsStarted = evidenceEvents.filter((e) => e.eventType === 'session_started' || e.eventType === 'learner_access_allowed');
  const sessionsBlocked = evidenceEvents.filter((e) => e.eventType === 'session_blocked' || e.eventType === 'learner_access_denied');
  const supportNeeded = evidenceEvents.filter((e) => e.eventType === 'support_needed');

  let pauseRollbackState: string;
  if (run.status === 'rolled_back') pauseRollbackState = 'rolled_back';
  else if (run.status === 'rollback_pending') pauseRollbackState = 'rollback_pending';
  else if (run.status === 'paused') pauseRollbackState = 'paused';
  else pauseRollbackState = 'not_paused';

  const riskLevel = calculateRiskLevel(
    incidentSignals.length,
    safeguardingSignals.length,
    run.status
  );

  const safeNextActions: string[] = [];
  if (run.status === 'active_controlled') {
    safeNextActions.push('continue_monitoring');
    if (riskLevel === 'high' || riskLevel === 'critical') {
      safeNextActions.push('consider_pause');
    }
  } else if (run.status === 'paused') {
    safeNextActions.push('review_pause_reason');
    safeNextActions.push('evaluate_resume_gates');
  } else if (run.status === 'rollback_pending' || run.status === 'rolled_back') {
    safeNextActions.push('review_rollback_plan');
    safeNextActions.push('notify_stakeholders');
  } else if (run.status === 'blocked') {
    safeNextActions.push('investigate_blocking_issues');
  }

  const summary: Task026DailyPilotSummary = {
    pilotRunId,
    schoolId,
    cohortSafeCount: run.cohortIds.length,
    sessionsStartedCount: sessionsStarted.length,
    sessionsBlockedCount: sessionsBlocked.length,
    supportNeededCount: supportNeeded.length,
    incidentCount: incidentSignals.length,
    safeguardingSignalCount: safeguardingSignals.length,
    pauseRollbackState,
    safeNextActions,
    riskLevel,
    generatedAt: new Date().toISOString(),
  };

  await task026PilotExecutionRepository.recordDailySummary(summary);

  return { ok: true, summary, reasonCodes: [], safeMessage: 'Daily pilot summary generated.' };
}
