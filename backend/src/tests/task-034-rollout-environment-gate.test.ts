import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateTask034EnvironmentGate } from '../services/task034RolloutEnvironmentGateService';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

function validGateInput() {
  return {
    environmentType: 'controlled_limited_rollout',
    rolloutMode: 'limited_cohort_expansion_only',
    dataMode: 'safe_metadata_and_aggregate_only',
    sideEffectMode: 'internal_rollout_store_only',
    task033Accepted: true,
    task034Started: false,
    task035Started: false,
    task040Started: false,
    rolloutPercent: 20,
    schoolWideLaunchRequested: false,
    hundredPercentRolloutRequested: false,
    backendFreezeRequested: false,
    frontendUiRequested: false,
    liveAiRequested: false,
    liveConnectorRequested: false,
    liveNotificationRequested: false,
    productionDeploymentRequested: false,
    productionMutationRequested: false,
  };
}

describe('Task034 Rollout Environment Gate', () => {
  beforeEach(async () => {
    await task034Repository.clearTask034StoresForTests();
  });

  it('Valid input passes: controlled_limited_rollout, limited_cohort_expansion_only, safe_metadata_and_aggregate_only, internal_rollout_store_only', () => {
    const result = evaluateTask034EnvironmentGate(validGateInput());
    expect(result.ok).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.environmentTypeValid).toBe(true);
    expect(result.rolloutModeValid).toBe(true);
    expect(result.dataModeValid).toBe(true);
    expect(result.sideEffectModeValid).toBe(true);
  });

  it('Wrong environment type fails', () => {
    const input = validGateInput();
    input.environmentType = 'production';
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.environmentTypeValid).toBe(false);
    expect(result.blockingIssues).toContain('invalid_environment_type: production');
  });

  it('Wrong rollout mode fails', () => {
    const input = validGateInput();
    input.rolloutMode = 'school_wide';
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.rolloutModeValid).toBe(false);
    expect(result.blockingIssues).toContain('invalid_rollout_mode: school_wide');
  });

  it('Wrong data mode fails', () => {
    const input = validGateInput();
    input.dataMode = 'raw_learner_data';
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.dataModeValid).toBe(false);
  });

  it('Wrong side effect mode fails', () => {
    const input = validGateInput();
    input.sideEffectMode = 'live_notification';
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.sideEffectModeValid).toBe(false);
  });

  it('schoolWideLaunchRequested true blocks', () => {
    const input = validGateInput();
    input.schoolWideLaunchRequested = true;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.schoolWideLaunchBlocked).toBe(true);
    expect(result.blockingIssues).toContain('school_wide_launch_requested');
  });

  it('backendFreezeRequested true blocks', () => {
    const input = validGateInput();
    input.backendFreezeRequested = true;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.backendFreezeBlocked).toBe(true);
    expect(result.blockingIssues).toContain('backend_freeze_requested');
  });

  it('rolloutPercent > 25 blocks', () => {
    const input = validGateInput();
    input.rolloutPercent = 50;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.rolloutPercentInRange).toBe(false);
    expect(result.blockingIssues).toContain('rollout_percent_out_of_range: 50');
  });

  it('liveAiRequested true blocks', () => {
    const input = validGateInput();
    input.liveAiRequested = true;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.liveAiBlocked).toBe(true);
    expect(result.blockingIssues).toContain('live_ai_requested');
  });

  it('liveConnectorRequested true blocks', () => {
    const input = validGateInput();
    input.liveConnectorRequested = true;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.liveConnectorBlocked).toBe(true);
  });

  it('liveNotificationRequested true blocks', () => {
    const input = validGateInput();
    input.liveNotificationRequested = true;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.liveNotificationBlocked).toBe(true);
  });

  it('productionDeploymentRequested true blocks', () => {
    const input = validGateInput();
    input.productionDeploymentRequested = true;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.productionDeploymentBlocked).toBe(true);
  });

  it('frontendUiRequested true blocks', () => {
    const input = validGateInput();
    input.frontendUiRequested = true;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.frontendUiBlocked).toBe(true);
  });

  it('stores result in repository', () => {
    evaluateTask034EnvironmentGate(validGateInput());
    const stored = task034Repository.getEnvironmentGate();
    expect(stored).not.toBeNull();
  });

  it('task033Accepted false blocks', () => {
    const input = validGateInput();
    input.task033Accepted = false;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('task_033_not_accepted');
  });

  it('task034Started true blocks', () => {
    const input = validGateInput();
    input.task034Started = true;
    const result = evaluateTask034EnvironmentGate(input);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('task_034_already_started');
  });
});
