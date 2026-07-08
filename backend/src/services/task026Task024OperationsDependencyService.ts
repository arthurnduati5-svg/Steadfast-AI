import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026DependencyGateInput } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026DependencyGateInput, Task026DependencyGateResult } from '../contracts/task026ControlledPilotExecutionContracts';

async function checkGate(
  gateName: string,
  check: () => Promise<{ passed: boolean; reasonCodes: string[]; safeMessage: string }>
): Promise<Task026DependencyGateResult> {
  try {
    const result = await check();
    return {
      gate: gateName,
      status: result.passed ? 'passed' : 'blocked',
      reasonCodes: result.reasonCodes,
      safeMessage: result.safeMessage,
    };
  } catch {
    return {
      gate: gateName,
      status: 'error',
      reasonCodes: ['gate_check_error'],
      safeMessage: `Gate check "${gateName}" encountered an error.`,
    };
  }
}

async function checkOperationsReadiness(schoolId: string): Promise<{ passed: boolean; reasonCodes: string[]; safeMessage: string }> {
  const runs = await task026PilotExecutionRepository.listPilotRunsForSchool(schoolId);
  if (runs.length === 0) {
    return { passed: false, reasonCodes: ['task024_not_ready', 'no_runs'], safeMessage: 'Task 024 operations readiness not confirmed.' };
  }
  return { passed: true, reasonCodes: [], safeMessage: 'Task 024 operations readiness confirmed.' };
}

async function checkMonitoringPathsReady(schoolId: string): Promise<{ passed: boolean; reasonCodes: string[]; safeMessage: string }> {
  const runs = await task026PilotExecutionRepository.listPilotRunsForSchool(schoolId);
  if (runs.length === 0) {
    return { passed: false, reasonCodes: ['monitoring_not_ready'], safeMessage: 'Monitoring paths not ready.' };
  }
  return { passed: true, reasonCodes: [], safeMessage: 'Monitoring paths are ready.' };
}

async function checkPausePathsReady(schoolId: string): Promise<{ passed: boolean; reasonCodes: string[]; safeMessage: string }> {
  const runs = await task026PilotExecutionRepository.listPilotRunsForSchool(schoolId);
  const hasPauseOwner = runs.some((r) => r.pauseOwnerId);
  if (!hasPauseOwner) {
    return { passed: false, reasonCodes: ['pause_not_ready', 'no_pause_owner'], safeMessage: 'Pause paths not ready: no pause owner assigned.' };
  }
  return { passed: true, reasonCodes: [], safeMessage: 'Pause paths are ready.' };
}

async function checkRollbackPathsReady(schoolId: string): Promise<{ passed: boolean; reasonCodes: string[]; safeMessage: string }> {
  const runs = await task026PilotExecutionRepository.listPilotRunsForSchool(schoolId);
  const hasRollbackOwner = runs.some((r) => r.rollbackOwnerId);
  if (!hasRollbackOwner) {
    return { passed: false, reasonCodes: ['rollback_not_ready', 'no_rollback_owner'], safeMessage: 'Rollback paths not ready: no rollback owner assigned.' };
  }
  return { passed: true, reasonCodes: [], safeMessage: 'Rollback paths are ready.' };
}

async function checkIncidentPathsReady(schoolId: string): Promise<{ passed: boolean; reasonCodes: string[]; safeMessage: string }> {
  const runs = await task026PilotExecutionRepository.listPilotRunsForSchool(schoolId);
  const hasSafeguardingOwner = runs.some((r) => r.safeguardingOwnerId);
  if (!hasSafeguardingOwner) {
    return { passed: false, reasonCodes: ['incident_not_ready', 'no_safeguarding_owner'], safeMessage: 'Incident paths not ready: no safeguarding owner assigned.' };
  }
  return { passed: true, reasonCodes: [], safeMessage: 'Incident paths are ready.' };
}

export async function checkTask024OperationsDependency(
  input: Task026DependencyGateInput
): Promise<Task026DependencyGateResult> {
  const validation = validateTask026DependencyGateInput(input);
  if (!validation.valid) {
    return {
      gate: 'task024_operations',
      status: 'error',
      reasonCodes: validation.reasonCodes,
      safeMessage: validation.safeMessage,
    };
  }

  const results = await Promise.all([
    checkGate('task024_operations_readiness', () => checkOperationsReadiness(input.schoolId)),
    checkGate('task024_monitoring_paths', () => checkMonitoringPathsReady(input.schoolId)),
    checkGate('task024_pause_paths', () => checkPausePathsReady(input.schoolId)),
    checkGate('task024_rollback_paths', () => checkRollbackPathsReady(input.schoolId)),
    checkGate('task024_incident_paths', () => checkIncidentPathsReady(input.schoolId)),
  ]);

  const failed = results.filter((r) => r.status !== 'passed');
  if (failed.length > 0) {
    return {
      gate: 'task024_operations',
      status: 'blocked',
      reasonCodes: failed.flatMap((f) => f.reasonCodes),
      safeMessage: `Task 024 operations dependency blocked: ${failed.length} gate(s) not passed.`,
    };
  }

  return {
    gate: 'task024_operations',
    status: 'passed',
    reasonCodes: [],
    safeMessage: 'Task 024 operations dependency: all checks passed.',
  };
}
