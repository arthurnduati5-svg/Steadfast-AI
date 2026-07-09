import type { Task032CanaryEnvironmentGateInput, Task032CanaryEnvironmentGateResult } from '../contracts/task032ControlledCanaryActivationContracts';
import { TASK032_ALLOWED_ENVIRONMENT_TYPES, TASK032_ALLOWED_ACTIVATION_MODES, TASK032_ALLOWED_DATA_MODES, TASK032_ALLOWED_SIDE_EFFECT_MODES } from '../contracts/task032ControlledCanaryActivationContracts';

export async function runTask032CanaryEnvironmentGate(input: Task032CanaryEnvironmentGateInput): Promise<Task032CanaryEnvironmentGateResult> {
  const blockingIssues: string[] = [];

  const environmentTypeValid = TASK032_ALLOWED_ENVIRONMENT_TYPES.includes(input.environmentType as any);
  if (!environmentTypeValid) blockingIssues.push(`invalid_environment_type: ${input.environmentType}`);

  const activationModeValid = TASK032_ALLOWED_ACTIVATION_MODES.includes(input.activationMode as any);
  if (!activationModeValid) blockingIssues.push(`invalid_activation_mode: ${input.activationMode}`);

  const dataModeValid = TASK032_ALLOWED_DATA_MODES.includes(input.dataMode as any);
  if (!dataModeValid) blockingIssues.push(`invalid_data_mode: ${input.dataMode}`);

  const sideEffectModeValid = TASK032_ALLOWED_SIDE_EFFECT_MODES.includes(input.sideEffectMode as any);
  if (!sideEffectModeValid) blockingIssues.push(`invalid_side_effect_mode: ${input.sideEffectMode}`);

  const productionDeploymentBlocked = !input.productionDeploymentRequested;
  if (input.productionDeploymentRequested) blockingIssues.push('production_deployment_requested');

  const liveNotificationBlocked = !input.liveNotificationRequested;
  if (input.liveNotificationRequested) blockingIssues.push('live_notification_requested');

  const liveAiBlocked = !input.liveAiRequested;
  if (input.liveAiRequested) blockingIssues.push('live_ai_requested');

  const liveSchoolConnectorBlocked = !input.liveSchoolConnectorRequested;
  if (input.liveSchoolConnectorRequested) blockingIssues.push('live_school_connector_requested');

  const productionMutationBlocked = !input.productionMutationRequested;
  if (input.productionMutationRequested) blockingIssues.push('production_mutation_requested');

  const canaryObservationBlocked = !input.canaryObservationRequested;
  if (input.canaryObservationRequested) blockingIssues.push('canary_observation_requested');

  const rolloutBlocked = !input.rolloutRequested;
  if (input.rolloutRequested) blockingIssues.push('rollout_requested');

  const schoolWideLaunchBlocked = !input.schoolWideLaunchRequested;
  if (input.schoolWideLaunchRequested) blockingIssues.push('school_wide_launch_requested');

  const backendFreezeBlocked = !input.backendFreezeRequested;
  if (input.backendFreezeRequested) blockingIssues.push('backend_freeze_requested');

  return {
    ok: blockingIssues.length === 0,
    environmentTypeValid,
    activationModeValid,
    dataModeValid,
    sideEffectModeValid,
    productionDeploymentBlocked,
    liveNotificationBlocked,
    liveAiBlocked,
    liveSchoolConnectorBlocked,
    productionMutationBlocked,
    canaryObservationBlocked,
    rolloutBlocked,
    schoolWideLaunchBlocked,
    backendFreezeBlocked,
    blockingIssues,
    passed: blockingIssues.length === 0
  };
}
