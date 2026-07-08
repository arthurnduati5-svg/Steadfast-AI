import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type {
  Task028DailyExpansionSummary,
  Task028DailyExpansionSummaryInput,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import { nowISO } from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028DailyExpansionSummaryInput,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

export async function generateDailySummary(
  input: Task028DailyExpansionSummaryInput,
): Promise<Task028DailyExpansionSummary> {
  const errors = validateTask028DailyExpansionSummaryInput(input);
  if (errors.length > 0) {
    throw createSafeTask028ValidationError('Invalid daily summary input.', errors);
  }

  const { runId, schoolId } = input;

  const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
  if (!run) {
    throw createSafeTask028ValidationError('Execution run not found.', ['execution_run_not_found']);
  }
  const runAny = run as any;

  const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(runId);
  const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(runId);
  const healthSnapshots = await task028ExpansionExecutionRepository.listHealthSnapshots(runId);

  const expandedCohortSafeCount = participants.filter(
    (p: any) => p.activationStatus === 'active',
  ).length;

  const sessionsStartedCount = participants.filter(
    (p: any) => p.activationStatus === 'active' && p.joinedAt !== null,
  ).length;

  const sessionsBlockedCount = oversightItems.filter(
    (o: any) => o.itemType === 'blocked_student_access',
  ).length;

  const supportNeededCount = oversightItems.filter(
    (o: any) => o.requiresTeacherReview === true && o.status === 'open',
  ).length;

  const interventionCount = oversightItems.filter(
    (o: any) => o.requiresPause === true || o.requiresRollback === true,
  ).length;

  const incidentCount = oversightItems.filter(
    (o: any) => o.severity === 'high' || o.severity === 'critical',
  ).length;

  const safeguardingSignalCount = oversightItems.filter(
    (o: any) => o.severity === 'critical' && o.status === 'open',
  ).length;

  const pauseRollbackState = runAny.status;
  const safeNextActions: string[] = [];

  if (safeguardingSignalCount > 0) {
    safeNextActions.push('Address critical safeguarding signals.');
  }
  if (interventionCount > 0) {
    safeNextActions.push('Review outstanding interventions.');
  }
  if (supportNeededCount > 0) {
    safeNextActions.push('Process teacher support requests.');
  }
  if (safeNextActions.length === 0) {
    safeNextActions.push('Continue normal monitoring.');
  }

  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  if (safeguardingSignalCount > 0 || incidentCount > 5) {
    riskLevel = 'critical';
  } else if (interventionCount > 2 || incidentCount > 2) {
    riskLevel = 'high';
  } else if (supportNeededCount > 3 || sessionsBlockedCount > 5) {
    riskLevel = 'medium';
  }

  return {
    runId,
    schoolId,
    expandedCohortSafeCount,
    sessionsStartedCount,
    sessionsBlockedCount,
    supportNeededCount,
    interventionCount,
    incidentCount,
    safeguardingSignalCount,
    pauseRollbackState,
    safeNextActions,
    riskLevel,
    generatedAt: nowISO(),
  };
}
