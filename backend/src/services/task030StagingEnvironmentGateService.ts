import type {
  Task030StagingEnvironmentGateInput,
  Task030StagingEnvironmentGateResult,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030StagingEnvironmentGateInput } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

export async function runTask030StagingEnvironmentGate(
  input: Task030StagingEnvironmentGateInput,
): Promise<Task030StagingEnvironmentGateResult> {
  const blockingIssues: string[] = [];

  const validation = validateTask030StagingEnvironmentGateInput(input);
  if (!validation.ok) {
    blockingIssues.push(...validation.errors);
  }

  if (input.environmentType !== 'staging') {
    blockingIssues.push('environment_type_not_staging');
  }
  if (input.dataMode !== 'synthetic') {
    blockingIssues.push('data_mode_not_synthetic');
  }
  if (input.executionMode !== 'dry_run') {
    blockingIssues.push('execution_mode_not_dry_run');
  }

  const requestedFields: (keyof Task030StagingEnvironmentGateInput)[] = [
    'productionDeploymentRequested',
    'liveStudentAccessRequested',
    'liveNotificationRequested',
    'liveAiRequested',
    'liveSchoolConnectorRequested',
    'productionMutationRequested',
    'canaryRequested',
    'rolloutRequested',
    'schoolWideLaunchRequested',
  ];
  for (const field of requestedFields) {
    if ((input as any)[field] === true) {
      blockingIssues.push(`${field}_must_be_false`);
    }
  }

  const ok = blockingIssues.length === 0;

  const result: Task030StagingEnvironmentGateResult = {
    ok,
    environmentType: input.environmentType,
    dataMode: input.dataMode,
    executionMode: input.executionMode,
    blockingIssues,
    safeSummary: ok
      ? 'Staging environment gate passed. All conditions met for safe synthetic dry-run rehearsal.'
      : `Staging environment gate blocked. ${blockingIssues.length} issue(s) found.`,
  };

  await task030ControlledStagingRehearsalRepository.recordEnvironmentGate(result);

  return result;
}
