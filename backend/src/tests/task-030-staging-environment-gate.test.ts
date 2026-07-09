import { describe, it, expect } from 'vitest';
import { runTask030StagingEnvironmentGate } from '../services/task030StagingEnvironmentGateService';
import type { Task030StagingEnvironmentGateInput } from '../contracts/task030ControlledStagingRehearsalContracts';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Staging Environment Gate', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  const validInput: Task030StagingEnvironmentGateInput = {
    environmentType: 'staging',
    dataMode: 'synthetic',
    executionMode: 'dry_run',
    productionDeploymentRequested: false,
    liveStudentAccessRequested: false,
    liveNotificationRequested: false,
    liveAiRequested: false,
    liveSchoolConnectorRequested: false,
    productionMutationRequested: false,
    canaryRequested: false,
    rolloutRequested: false,
    schoolWideLaunchRequested: false,
  };

  it('should pass with valid staging input', async () => {
    const result = await runTask030StagingEnvironmentGate(validInput);
    expect(result.ok).toBe(true);
    expect(result.environmentType).toBe('staging');
    expect(result.dataMode).toBe('synthetic');
    expect(result.executionMode).toBe('dry_run');
  });

  it('should fail with production environment type', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, environmentType: 'production' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('environment_type_not_staging');
  });

  it('should fail with live data mode', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, dataMode: 'live' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('data_mode_not_synthetic');
  });

  it('should fail with real execution mode', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, executionMode: 'real' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('execution_mode_not_dry_run');
  });

  it('should fail when productionDeploymentRequested is true', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, productionDeploymentRequested: true });
    expect(result.ok).toBe(false);
  });

  it('should fail when liveStudentAccessRequested is true', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, liveStudentAccessRequested: true });
    expect(result.ok).toBe(false);
  });

  it('should fail when liveAiRequested is true', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, liveAiRequested: true });
    expect(result.ok).toBe(false);
  });

  it('should fail when liveNotificationRequested is true', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, liveNotificationRequested: true });
    expect(result.ok).toBe(false);
  });

  it('should fail when productionMutationRequested is true', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, productionMutationRequested: true });
    expect(result.ok).toBe(false);
  });

  it('should fail when canaryRequested is true', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, canaryRequested: true });
    expect(result.ok).toBe(false);
  });

  it('should fail when rolloutRequested is true', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, rolloutRequested: true });
    expect(result.ok).toBe(false);
  });

  it('should fail when schoolWideLaunchRequested is true', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, schoolWideLaunchRequested: true });
    expect(result.ok).toBe(false);
  });

  it('should have blocking issues summary on failure', async () => {
    const result = await runTask030StagingEnvironmentGate({ ...validInput, environmentType: 'live', dataMode: 'real_student' });
    expect(result.blockingIssues.length).toBeGreaterThanOrEqual(2);
  });

  it('should have safe summary on success', async () => {
    const result = await runTask030StagingEnvironmentGate(validInput);
    expect(result.safeSummary).toContain('passed');
  });
});
