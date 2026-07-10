import { describe, it, expect } from 'vitest';
import { TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS } from '../contracts/task033ControlledCanaryObservationContracts';
import { validateTask033EnvironmentGateInput, validateTask033ForbiddenSideEffects, validateTask033SafeReadModel } from '../lib/task033ControlledCanaryObservationValidation';

describe('Task 033 - no Task 034 rollout', () => {
  it('should include "task034" in forbidden future task patterns', () => {
    expect(TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task034');
  });

  it('should include "limited rollout" in forbidden future task patterns', () => {
    expect(TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('limited rollout');
  });

  it('should include "controlled rollout" in forbidden future task patterns', () => {
    expect(TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('controlled rollout');
  });

  it('should not have forbidden side effects for rollout plan text', () => {
    const result = validateTask033ForbiddenSideEffects({ plan: 'task034 limited rollout' });
    expect(result.ok).toBe(true);
  });

  it('should block task034Started: true via environment gate', () => {
    const result = validateTask033EnvironmentGateInput({
      environmentType: 'controlled_canary_observation',
      observationMode: 'internal_observation_only',
      dataMode: 'safe_aggregate_only',
      sideEffectMode: 'internal_observation_store_only',
      task032Accepted: true,
      task033Started: false,
      task034Started: true,
      task035Started: false,
      task040Started: false,
      rolloutRequested: false,
      schoolWideLaunchRequested: false,
      backendFreezeRequested: false,
      trafficRoutingRequested: false,
      cohortExpansionRequested: false,
      liveAiRequested: false,
      liveConnectorRequested: false,
      liveNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
      frontendUiRequested: false,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('task034Started_not_false');
  });

  it('should block rolloutRequested: true via environment gate', () => {
    const result = validateTask033EnvironmentGateInput({
      environmentType: 'controlled_canary_observation',
      observationMode: 'internal_observation_only',
      dataMode: 'safe_aggregate_only',
      sideEffectMode: 'internal_observation_store_only',
      task032Accepted: true,
      task033Started: false,
      task034Started: false,
      task035Started: false,
      task040Started: false,
      rolloutRequested: true,
      schoolWideLaunchRequested: false,
      backendFreezeRequested: false,
      trafficRoutingRequested: false,
      cohortExpansionRequested: false,
      liveAiRequested: false,
      liveConnectorRequested: false,
      liveNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
      frontendUiRequested: false,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('rolloutRequested_not_false');
  });

  it('should have safeToStartTask034 false by default in safe read model validation', () => {
    const result = validateTask033SafeReadModel({
      sessionId: 'sess-1',
      activationId: 'act-1',
      schoolId: 'school-1',
      status: 'observation_complete',
      observationStage: 'safe_read',
      observedEventCount: 0,
      safeAggregate: null,
      healthStatus: 'pass',
      privacyStatus: 'pass',
      governanceStatus: 'pass',
      socraticStatus: 'pass',
      deenStatus: 'pass',
      schoolIdentityStatus: 'pass',
      incidentStatus: 'pass',
      rollbackReadinessStatus: 'pass',
      driftStatus: 'pass',
      safeToStartTask034: false,
      safeToStartTask035: false,
      safeToStartTask040: false,
      safeReasonCodes: [],
      generatedAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(true);
  });

  it('should pass environment gate with all gates clear', () => {
    const result = validateTask033EnvironmentGateInput({
      environmentType: 'controlled_canary_observation',
      observationMode: 'internal_observation_only',
      dataMode: 'safe_aggregate_only',
      sideEffectMode: 'internal_observation_store_only',
      task032Accepted: true,
      task033Started: false,
      task034Started: false,
      task035Started: false,
      task040Started: false,
      rolloutRequested: false,
      schoolWideLaunchRequested: false,
      backendFreezeRequested: false,
      trafficRoutingRequested: false,
      cohortExpansionRequested: false,
      liveAiRequested: false,
      liveConnectorRequested: false,
      liveNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
      frontendUiRequested: false,
    });
    expect(result.ok).toBe(true);
  });
});
