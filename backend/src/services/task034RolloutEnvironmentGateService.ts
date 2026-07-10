import type { Task034RolloutEnvironmentGateInput, Task034RolloutEnvironmentGateResult } from '../contracts/task034ControlledLimitedRolloutContracts';
import {
  TASK034_ALLOWED_ENVIRONMENT_TYPES,
  TASK034_ALLOWED_ROLLOUT_MODES,
  TASK034_ALLOWED_DATA_MODES,
  TASK034_ALLOWED_SIDE_EFFECT_MODES,
} from '../contracts/task034ControlledLimitedRolloutContracts';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

export function evaluateTask034EnvironmentGate(
  input: Task034RolloutEnvironmentGateInput,
): Task034RolloutEnvironmentGateResult {
  const blockingIssues: string[] = [];

  const environmentTypeValid = TASK034_ALLOWED_ENVIRONMENT_TYPES.includes(input.environmentType as any);
  if (!environmentTypeValid) blockingIssues.push(`invalid_environment_type: ${input.environmentType}`);

  const rolloutModeValid = TASK034_ALLOWED_ROLLOUT_MODES.includes(input.rolloutMode as any);
  if (!rolloutModeValid) blockingIssues.push(`invalid_rollout_mode: ${input.rolloutMode}`);

  const dataModeValid = TASK034_ALLOWED_DATA_MODES.includes(input.dataMode as any);
  if (!dataModeValid) blockingIssues.push(`invalid_data_mode: ${input.dataMode}`);

  const sideEffectModeValid = TASK034_ALLOWED_SIDE_EFFECT_MODES.includes(input.sideEffectMode as any);
  if (!sideEffectModeValid) blockingIssues.push(`invalid_side_effect_mode: ${input.sideEffectMode}`);

  const task033Accepted = !!input.task033Accepted;
  const task034Started = !!input.task034Started;
  const task035Started = !!input.task035Started;
  const task040Started = !!input.task040Started;

  if (!task033Accepted) blockingIssues.push('task_033_not_accepted');
  if (task034Started) blockingIssues.push('task_034_already_started');
  if (task035Started) blockingIssues.push('task_035_already_started');
  if (task040Started) blockingIssues.push('task_040_already_started');

  const rolloutPercentInRange = input.rolloutPercent > 0 && input.rolloutPercent <= 25;
  if (!rolloutPercentInRange) blockingIssues.push(`rollout_percent_out_of_range: ${input.rolloutPercent}`);

  const schoolWideLaunchBlocked = !!input.schoolWideLaunchRequested;
  if (input.schoolWideLaunchRequested) blockingIssues.push('school_wide_launch_requested');

  const hundredPercentRolloutBlocked = !!input.hundredPercentRolloutRequested;
  if (input.hundredPercentRolloutRequested) blockingIssues.push('hundred_percent_rollout_requested');

  const backendFreezeBlocked = !!input.backendFreezeRequested;
  if (input.backendFreezeRequested) blockingIssues.push('backend_freeze_requested');

  const frontendUiBlocked = !!input.frontendUiRequested;
  if (input.frontendUiRequested) blockingIssues.push('frontend_ui_requested');

  const liveAiBlocked = !!input.liveAiRequested;
  if (input.liveAiRequested) blockingIssues.push('live_ai_requested');

  const liveConnectorBlocked = !!input.liveConnectorRequested;
  if (input.liveConnectorRequested) blockingIssues.push('live_connector_requested');

  const liveNotificationBlocked = !!input.liveNotificationRequested;
  if (input.liveNotificationRequested) blockingIssues.push('live_notification_requested');

  const productionDeploymentBlocked = !!input.productionDeploymentRequested;
  if (input.productionDeploymentRequested) blockingIssues.push('production_deployment_requested');

  const productionMutationBlocked = !!input.productionMutationRequested;
  if (input.productionMutationRequested) blockingIssues.push('production_mutation_requested');

  const result: Task034RolloutEnvironmentGateResult = {
    ok: blockingIssues.length === 0,
    passed: blockingIssues.length === 0,
    environmentTypeValid,
    rolloutModeValid,
    dataModeValid,
    sideEffectModeValid,
    task033Accepted,
    task034Started,
    task035Started,
    task040Started,
    rolloutPercentInRange,
    schoolWideLaunchBlocked,
    hundredPercentRolloutBlocked,
    backendFreezeBlocked,
    frontendUiBlocked,
    liveAiBlocked,
    liveConnectorBlocked,
    liveNotificationBlocked,
    productionDeploymentBlocked,
    productionMutationBlocked,
    blockingIssues,
  };

  task034Repository.saveEnvironmentGate(result);
  return result;
}
