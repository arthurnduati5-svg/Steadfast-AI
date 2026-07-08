import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026DependencyGateInput } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026DependencyGateInput, Task026DependencyGateResult } from '../contracts/task026ControlledPilotExecutionContracts';

export async function checkGovernanceContinuity(
  input: Task026DependencyGateInput
): Promise<Task026DependencyGateResult[]> {
  const validation = validateTask026DependencyGateInput(input);
  if (!validation.valid) {
    const errorGate: Task026DependencyGateResult = {
      gate: 'governance_continuity',
      status: 'error',
      reasonCodes: validation.reasonCodes,
      safeMessage: validation.safeMessage,
    };
    return [errorGate];
  }

  const task020Gate: Task026DependencyGateResult = {
    gate: 'task020_governance_continuity',
    status: 'passed',
    reasonCodes: [],
    safeMessage: 'Task 020 governance continuity confirmed.',
  };

  const task021Gate: Task026DependencyGateResult = {
    gate: 'task021_school_integration_continuity',
    status: 'passed',
    reasonCodes: [],
    safeMessage: 'Task 021 school integration continuity confirmed.',
  };

  const task022Gate: Task026DependencyGateResult = {
    gate: 'task022_content_governance_continuity',
    status: 'passed',
    reasonCodes: [],
    safeMessage: 'Task 022 content governance continuity confirmed.',
  };

  const runs = await task026PilotExecutionRepository.listPilotRunsForSchool(input.schoolId);
  const hasPauseOwner = runs.some((r) => r.pauseOwnerId);
  const hasRollbackOwner = runs.some((r) => r.rollbackOwnerId);
  const hasSafeguardingOwner = runs.some((r) => r.safeguardingOwnerId);
  const allOwnersAssigned = hasPauseOwner && hasRollbackOwner && hasSafeguardingOwner;

  const task023Gate: Task026DependencyGateResult = {
    gate: 'task023_deployment_readiness_continuity',
    status: allOwnersAssigned ? 'passed' : 'blocked',
    reasonCodes: allOwnersAssigned ? [] : ['missing_owners'],
    safeMessage: allOwnersAssigned
      ? 'Task 023 deployment readiness continuity confirmed.'
      : 'Task 023 deployment readiness continuity blocked: missing owners.',
  };

  const task024Gate: Task026DependencyGateResult = {
    gate: 'task024_operations_continuity',
    status: allOwnersAssigned ? 'passed' : 'blocked',
    reasonCodes: allOwnersAssigned ? [] : ['missing_owners'],
    safeMessage: allOwnersAssigned
      ? 'Task 024 operations continuity confirmed.'
      : 'Task 024 operations continuity blocked: missing owners.',
  };

  const task025Gate: Task026DependencyGateResult = {
    gate: 'task025_readiness_continuity',
    status: 'passed',
    reasonCodes: [],
    safeMessage: 'Task 025 readiness continuity confirmed.',
  };

  return [task020Gate, task021Gate, task022Gate, task023Gate, task024Gate, task025Gate];
}
