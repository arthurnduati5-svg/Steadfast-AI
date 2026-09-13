import type { Task033ObservationEnvironmentGateInput, Task033ObservationEnvironmentGateResult } from '../contracts/task033ControlledCanaryObservationContracts';
import {
  TASK033_ALLOWED_ENVIRONMENT_TYPES,
  TASK033_ALLOWED_OBSERVATION_MODES,
  TASK033_ALLOWED_DATA_MODES,
  TASK033_ALLOWED_SIDE_EFFECT_MODES,
} from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function checkTask033ObservationEnvironmentGate(
  input: Task033ObservationEnvironmentGateInput,
): Promise<Task033ObservationEnvironmentGateResult> {
  const blockingIssues: string[] = [];

  const environmentTypeValid = TASK033_ALLOWED_ENVIRONMENT_TYPES.includes(input.environmentType as any);
  if (!environmentTypeValid) blockingIssues.push(`invalid_environment_type: ${input.environmentType}`);

  const observationModeValid = TASK033_ALLOWED_OBSERVATION_MODES.includes(input.observationMode as any);
  if (!observationModeValid) blockingIssues.push(`invalid_observation_mode: ${input.observationMode}`);

  const dataModeValid = TASK033_ALLOWED_DATA_MODES.includes(input.dataMode as any);
  if (!dataModeValid) blockingIssues.push(`invalid_data_mode: ${input.dataMode}`);

  const sideEffectModeValid = TASK033_ALLOWED_SIDE_EFFECT_MODES.includes(input.sideEffectMode as any);
  if (!sideEffectModeValid) blockingIssues.push(`invalid_side_effect_mode: ${input.sideEffectMode}`);

  const task032Accepted = !!input.task032Accepted;
  const task033Started = !!input.task033Started;
  const task034Started = !!input.task034Started;
  const task035Started = !!input.task035Started;
  const task040Started = !!input.task040Started;

  if (!task032Accepted) blockingIssues.push('task_032_not_accepted');
  if (task034Started) blockingIssues.push('task_034_already_started');
  if (task035Started) blockingIssues.push('task_035_already_started');
  if (task040Started) blockingIssues.push('task_040_already_started');

  const rolloutBlocked = !!input.rolloutRequested;
  if (input.rolloutRequested) blockingIssues.push('rollout_requested');

  const schoolWideLaunchBlocked = !!input.schoolWideLaunchRequested;
  if (input.schoolWideLaunchRequested) blockingIssues.push('school_wide_launch_requested');

  const backendFreezeBlocked = !!input.backendFreezeRequested;
  if (input.backendFreezeRequested) blockingIssues.push('backend_freeze_requested');

  const trafficRoutingBlocked = !!input.trafficRoutingRequested;
  if (input.trafficRoutingRequested) blockingIssues.push('traffic_routing_requested');

  const cohortExpansionBlocked = !!input.cohortExpansionRequested;
  if (input.cohortExpansionRequested) blockingIssues.push('cohort_expansion_requested');

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

  const frontendUiBlocked = !!input.frontendUiRequested;
  if (input.frontendUiRequested) blockingIssues.push('frontend_ui_requested');

  const result: Task033ObservationEnvironmentGateResult = {
    ok: blockingIssues.length === 0,
    passed: blockingIssues.length === 0,
    environmentTypeValid,
    observationModeValid,
    dataModeValid,
    sideEffectModeValid,
    task032Accepted,
    task033Started,
    task034Started,
    task035Started,
    task040Started,
    rolloutBlocked,
    schoolWideLaunchBlocked,
    backendFreezeBlocked,
    trafficRoutingBlocked,
    cohortExpansionBlocked,
    liveAiBlocked,
    liveConnectorBlocked,
    liveNotificationBlocked,
    productionDeploymentBlocked,
    productionMutationBlocked,
    frontendUiBlocked,
    blockingIssues,
  };

  await task033Repository.recordEnvironmentGate(result);
  return result;
}
