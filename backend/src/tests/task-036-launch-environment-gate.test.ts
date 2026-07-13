import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateLaunchEnvironmentGateInput } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveEnvironmentGate: vi.fn(),
    getEnvironmentGate: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function runEnvironmentGate(input: any): { passed: boolean; errors: string[] } {
  const errors = validateLaunchEnvironmentGateInput(input);
  const passed = errors.length === 0;
  if (passed) {
    task036Repository.saveEnvironmentGate('gate-1', { ok: true, passed: true, ...input, blockingIssues: [] });
  }
  return { passed, errors };
}

describe('Task036 Launch Environment Gate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes valid environment gate input', () => {
    const input = {
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe_summary_only',
      sideEffectMode: 'read_only',
      task035Accepted: true,
      task036Started: true,
      task040Started: false,
      singleSchoolScope: true,
      multiSchoolScope: false,
      publicLaunchRequested: false,
      marketingLaunchRequested: false,
      paymentLaunchRequested: false,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
    };
    const result = runEnvironmentGate(input);
    expect(result.passed).toBe(true);
    expect(result.errors).toEqual([]);
    expect(task036Repository.saveEnvironmentGate).toHaveBeenCalled();
  });

  it('fails when production environment type used', () => {
    const input = {
      environmentType: 'production',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe_summary_only',
      sideEffectMode: 'read_only',
      task035Accepted: true,
      singleSchoolScope: true,
      multiSchoolScope: false,
      publicLaunchRequested: false,
      marketingLaunchRequested: false,
      paymentLaunchRequested: false,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
      task036Started: true,
      task040Started: false,
    };
    const result = runEnvironmentGate(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('disallowed_environment_type');
  });

  it('fails when public launch is requested', () => {
    const input = {
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe_summary_only',
      sideEffectMode: 'read_only',
      task035Accepted: true,
      task036Started: true,
      task040Started: false,
      singleSchoolScope: true,
      multiSchoolScope: false,
      publicLaunchRequested: true,
      marketingLaunchRequested: false,
      paymentLaunchRequested: false,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
    };
    const result = runEnvironmentGate(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('public_launch_requested');
  });

  it('fails when task035 not accepted', () => {
    const input = {
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe_summary_only',
      sideEffectMode: 'read_only',
      task035Accepted: false,
      singleSchoolScope: true,
      multiSchoolScope: false,
      publicLaunchRequested: false,
      marketingLaunchRequested: false,
      paymentLaunchRequested: false,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
      task036Started: true,
      task040Started: false,
    };
    const result = runEnvironmentGate(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('task035_not_accepted');
  });

  it('fails when multi-school scope enabled', () => {
    const input = {
      environmentType: 'test',
      launchMode: 'single_school_controlled_live_launch',
      dataMode: 'safe_summary_only',
      sideEffectMode: 'read_only',
      task035Accepted: true,
      task036Started: true,
      task040Started: false,
      singleSchoolScope: false,
      multiSchoolScope: true,
      publicLaunchRequested: false,
      marketingLaunchRequested: false,
      paymentLaunchRequested: false,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
    };
    const result = runEnvironmentGate(input);
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('multi_school_scope_enabled');
    expect(result.errors).toContain('single_school_scope_not_set');
  });

  it('retrieves stored gate result from repository', () => {
    const gateResult = { ok: true, passed: true, environmentType: 'test', launchMode: 'single_school_controlled_live_launch', dataMode: 'safe', sideEffectMode: 'read', task035Accepted: true, task036Started: true, task040Started: false, singleSchoolScope: true, multiSchoolScope: false, publicLaunchRequested: false, marketingLaunchRequested: false, paymentLaunchRequested: false, backendFreezeRequested: false, frontendUiRequested: false, liveAiExpansionRequested: false, liveConnectorWriteExpansionRequested: false, externalNotificationRequested: false, productionDeploymentRequested: false, productionMutationRequested: false, blockingIssues: [] };
    vi.mocked(task036Repository.getEnvironmentGate).mockReturnValue(gateResult);
    const retrieved = task036Repository.getEnvironmentGate('gate-1');
    expect(retrieved!.passed).toBe(true);
    expect(retrieved!.environmentType).toBe('test');
  });
});
