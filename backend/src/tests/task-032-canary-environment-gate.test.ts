import { describe, it, expect } from 'vitest';
import { runTask032CanaryEnvironmentGate } from '../services/task032CanaryEnvironmentGateService';

function validInput() {
  return {
    environmentType: 'controlled_canary',
    activationMode: 'internal_controlled_activation',
    dataMode: 'approved_canary_fixture',
    sideEffectMode: 'internal_state_only',
    productionDeploymentRequested: false,
    liveNotificationRequested: false,
    liveAiRequested: false,
    liveSchoolConnectorRequested: false,
    productionMutationRequested: false,
    canaryObservationRequested: false,
    rolloutRequested: false,
    schoolWideLaunchRequested: false,
    backendFreezeRequested: false,
  };
}

describe('Task 032 - Canary Environment Gate', () => {
  it('should pass with valid controlled_canary environment', async () => {
    const result = await runTask032CanaryEnvironmentGate(validInput());
    expect(result.ok).toBe(true);
    expect(result.passed).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.environmentTypeValid).toBe(true);
    expect(result.activationModeValid).toBe(true);
    expect(result.dataModeValid).toBe(true);
    expect(result.sideEffectModeValid).toBe(true);
  });

  it('should reject production_uncontrolled environment type', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), environmentType: 'production_uncontrolled' });
    expect(result.ok).toBe(false);
    expect(result.passed).toBe(false);
    expect(result.environmentTypeValid).toBe(false);
    expect(result.blockingIssues).toContain('invalid_environment_type: production_uncontrolled');
  });

  it('should reject live_unverified environment type', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), environmentType: 'live_unverified' });
    expect(result.ok).toBe(false);
    expect(result.environmentTypeValid).toBe(false);
  });

  it('should reject live_external_activation activation mode', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), activationMode: 'live_external_activation' });
    expect(result.ok).toBe(false);
    expect(result.activationModeValid).toBe(false);
    expect(result.blockingIssues).toContain('invalid_activation_mode: live_external_activation');
  });

  it('should reject broad_rollout activation mode', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), activationMode: 'broad_rollout' });
    expect(result.ok).toBe(false);
    expect(result.activationModeValid).toBe(false);
  });

  it('should reject school_wide activation mode', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), activationMode: 'school_wide' });
    expect(result.ok).toBe(false);
    expect(result.activationModeValid).toBe(false);
  });

  it('should reject raw_live_student_payload data mode', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), dataMode: 'raw_live_student_payload' });
    expect(result.ok).toBe(false);
    expect(result.dataModeValid).toBe(false);
    expect(result.blockingIssues).toContain('invalid_data_mode: raw_live_student_payload');
  });

  it('should reject production_roster_payload data mode', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), dataMode: 'production_roster_payload' });
    expect(result.ok).toBe(false);
    expect(result.dataModeValid).toBe(false);
  });

  it('should reject external_write side effect', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), sideEffectMode: 'external_write' });
    expect(result.ok).toBe(false);
    expect(result.sideEffectModeValid).toBe(false);
    expect(result.blockingIssues).toContain('invalid_side_effect_mode: external_write');
  });

  it('should reject send_notifications side effect', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), sideEffectMode: 'send_notifications' });
    expect(result.ok).toBe(false);
    expect(result.sideEffectModeValid).toBe(false);
  });

  it('should reject call_live_ai side effect', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), sideEffectMode: 'call_live_ai' });
    expect(result.ok).toBe(false);
    expect(result.sideEffectModeValid).toBe(false);
  });

  it('should reject connector_write side effect', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), sideEffectMode: 'connector_write' });
    expect(result.ok).toBe(false);
    expect(result.sideEffectModeValid).toBe(false);
  });

  it('should block when productionDeploymentRequested is true', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), productionDeploymentRequested: true });
    expect(result.ok).toBe(false);
    expect(result.productionDeploymentBlocked).toBe(true);
    expect(result.blockingIssues).toContain('production_deployment_requested');
  });

  it('should block when liveNotificationRequested is true', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), liveNotificationRequested: true });
    expect(result.ok).toBe(false);
    expect(result.liveNotificationBlocked).toBe(true);
    expect(result.blockingIssues).toContain('live_notification_requested');
  });

  it('should block when liveAiRequested is true', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), liveAiRequested: true });
    expect(result.ok).toBe(false);
    expect(result.liveAiBlocked).toBe(true);
    expect(result.blockingIssues).toContain('live_ai_requested');
  });

  it('should block when liveSchoolConnectorRequested is true', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), liveSchoolConnectorRequested: true });
    expect(result.ok).toBe(false);
    expect(result.liveSchoolConnectorBlocked).toBe(true);
  });

  it('should block when productionMutationRequested is true', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), productionMutationRequested: true });
    expect(result.ok).toBe(false);
    expect(result.productionMutationBlocked).toBe(true);
  });

  it('should block when canaryObservationRequested is true', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), canaryObservationRequested: true });
    expect(result.ok).toBe(false);
    expect(result.canaryObservationBlocked).toBe(true);
  });

  it('should block when rolloutRequested is true', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), rolloutRequested: true });
    expect(result.ok).toBe(false);
    expect(result.rolloutBlocked).toBe(true);
  });

  it('should block when schoolWideLaunchRequested is true', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), schoolWideLaunchRequested: true });
    expect(result.ok).toBe(false);
    expect(result.schoolWideLaunchBlocked).toBe(true);
  });

  it('should block when backendFreezeRequested is true', async () => {
    const result = await runTask032CanaryEnvironmentGate({ ...validInput(), backendFreezeRequested: true });
    expect(result.ok).toBe(false);
    expect(result.backendFreezeBlocked).toBe(true);
    expect(result.blockingIssues).toContain('backend_freeze_requested');
  });
});
