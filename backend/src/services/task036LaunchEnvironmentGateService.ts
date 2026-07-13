import {
  Task036LaunchEnvironmentGateInput,
  Task036LaunchEnvironmentGateResult,
  TASK036_FORBIDDEN_ENVIRONMENT_TYPES,
  TASK036_FORBIDDEN_LAUNCH_MODES,
  TASK036_FORBIDDEN_SIDE_EFFECT_PATTERNS,
  createTask036SafeTimestamp,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function evaluateEnvironmentGate(
  input: Task036LaunchEnvironmentGateInput
): Promise<Task036LaunchEnvironmentGateResult> {
  const blockingIssues: string[] = [];

  if (TASK036_FORBIDDEN_ENVIRONMENT_TYPES.includes(input.environmentType)) {
    blockingIssues.push(`forbidden_environment_type: ${input.environmentType}`);
  }
  if (TASK036_FORBIDDEN_LAUNCH_MODES.includes(input.launchMode as any)) {
    blockingIssues.push(`forbidden_launch_mode: ${input.launchMode}`);
  }
  if (input.productionDeploymentRequested) blockingIssues.push('production_deployment_requested');
  if (input.productionMutationRequested) blockingIssues.push('production_mutation_requested');
  if (input.publicLaunchRequested) blockingIssues.push('public_launch_requested');
  if (input.marketingLaunchRequested) blockingIssues.push('marketing_launch_requested');
  if (input.paymentLaunchRequested) blockingIssues.push('payment_launch_requested');
  if (input.backendFreezeRequested) blockingIssues.push('backend_freeze_requested');
  if (input.frontendUiRequested) blockingIssues.push('frontend_ui_requested');
  if (input.liveAiExpansionRequested) blockingIssues.push('live_ai_expansion_requested');
  if (input.liveConnectorWriteExpansionRequested) blockingIssues.push('live_connector_write_expansion_requested');
  if (input.externalNotificationRequested) blockingIssues.push('external_notification_requested');
  if (input.multiSchoolScope) blockingIssues.push('multi_school_scope_forbidden');
  if (!input.task035Accepted) blockingIssues.push('task035_not_accepted');

  const passed = blockingIssues.length === 0;

  const result: Task036LaunchEnvironmentGateResult = {
    ok: passed,
    passed,
    environmentType: input.environmentType,
    launchMode: input.launchMode,
    dataMode: input.dataMode,
    sideEffectMode: input.sideEffectMode,
    task035Accepted: input.task035Accepted,
    task036Started: input.task036Started,
    task040Started: input.task040Started,
    singleSchoolScope: input.singleSchoolScope,
    multiSchoolScope: input.multiSchoolScope,
    publicLaunchRequested: input.publicLaunchRequested,
    marketingLaunchRequested: input.marketingLaunchRequested,
    paymentLaunchRequested: input.paymentLaunchRequested,
    backendFreezeRequested: input.backendFreezeRequested,
    frontendUiRequested: input.frontendUiRequested,
    liveAiExpansionRequested: input.liveAiExpansionRequested,
    liveConnectorWriteExpansionRequested: input.liveConnectorWriteExpansionRequested,
    externalNotificationRequested: input.externalNotificationRequested,
    productionDeploymentRequested: input.productionDeploymentRequested,
    productionMutationRequested: input.productionMutationRequested,
    blockingIssues,
  };

  const id = createTask036SafeId();
  task036Repository.saveEnvironmentGate(id, result);
  return result;
}
