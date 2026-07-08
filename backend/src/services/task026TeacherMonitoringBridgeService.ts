import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026TeacherMonitoringInput } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026TeacherMonitoringInput, Task026TeacherMonitoringSnapshot } from '../contracts/task026ControlledPilotExecutionContracts';

export async function getTeacherMonitoringSnapshot(
  input: Task026TeacherMonitoringInput
): Promise<Task026TeacherMonitoringSnapshot> {
  const validation = validateTask026TeacherMonitoringInput(input);
  if (!validation.valid) {
    return {
      status: 'monitoring_denied_not_assigned',
      pilotRunStatus: 'unknown',
      cohortSafeCount: 0,
      engagementSafeCount: 0,
      blockedEventCount: 0,
      supportNeededCount: 0,
      safeguardingSignalCount: 0,
      safeNextActions: [],
      pauseRecommendationMetadata: {},
      reasonCodes: validation.reasonCodes,
    };
  }

  const { schoolId, teacherId, pilotRunId } = validation.data;

  const run = await task026PilotExecutionRepository.getPilotRun(pilotRunId);
  if (!run) {
    return {
      status: 'monitoring_denied_pilot_not_found',
      pilotRunStatus: 'unknown',
      cohortSafeCount: 0,
      engagementSafeCount: 0,
      blockedEventCount: 0,
      supportNeededCount: 0,
      safeguardingSignalCount: 0,
      safeNextActions: [],
      pauseRecommendationMetadata: {},
      reasonCodes: ['pilot_run_not_found'],
    };
  }

  if (run.schoolId !== schoolId || run.teacherOwnerId !== teacherId) {
    return {
      status: 'monitoring_denied_not_assigned',
      pilotRunStatus: run.status,
      cohortSafeCount: 0,
      engagementSafeCount: 0,
      blockedEventCount: 0,
      supportNeededCount: 0,
      safeguardingSignalCount: 0,
      safeNextActions: [],
      pauseRecommendationMetadata: {},
      reasonCodes: ['teacher_not_assigned_to_pilot'],
    };
  }

  const evidenceEvents = await task026PilotExecutionRepository.listEvidenceEvents(pilotRunId);
  const safeguardingSignals = await task026PilotExecutionRepository.listSafeguardingSignals(pilotRunId);
  const incidentSignals = await task026PilotExecutionRepository.listIncidentSignals(pilotRunId);

  const blockedEvents = evidenceEvents.filter((e) => e.eventType === 'session_blocked' || e.eventType === 'learner_access_denied');
  const supportEvents = evidenceEvents.filter((e) => e.eventType === 'support_needed');

  const safeNextActions: string[] = [];
  if (run.status === 'active_controlled') {
    safeNextActions.push('monitor_learner_engagement');
    safeNextActions.push('review_safeguarding_signals');
  } else if (run.status === 'paused') {
    safeNextActions.push('review_pause_reason');
    safeNextActions.push('evaluate_resume_readiness');
  } else if (run.status === 'rollback_pending' || run.status === 'rolled_back') {
    safeNextActions.push('review_rollback_details');
  }

  const pauseRecommended = safeguardingSignals.length > 0 || incidentSignals.length > 0;

  await task026PilotExecutionRepository.recordTeacherSnapshot({
    pilotRunId,
    schoolId,
    teacherId,
    cohortSafeCount: run.cohortIds.length,
    engagementSafeCount: evidenceEvents.length,
    blockedEventCount: blockedEvents.length,
    supportNeededCount: supportEvents.length,
    safeguardingSignalCount: safeguardingSignals.length,
    timestamp: new Date().toISOString(),
  });

  return {
    status: 'monitoring_allowed',
    pilotRunStatus: run.status,
    cohortSafeCount: run.cohortIds.length,
    engagementSafeCount: evidenceEvents.length,
    blockedEventCount: blockedEvents.length,
    supportNeededCount: supportEvents.length,
    safeguardingSignalCount: safeguardingSignals.length,
    safeNextActions,
    pauseRecommendationMetadata: { pauseRecommended, signalCount: safeguardingSignals.length + incidentSignals.length },
    reasonCodes: [],
  };
}
