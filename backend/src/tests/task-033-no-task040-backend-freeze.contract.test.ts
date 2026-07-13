import { describe, it, expect } from 'vitest';
import { TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS } from '../contracts/task033ControlledCanaryObservationContracts';
import { validateTask033EnvironmentGateInput, validateTask033SafeReadModel } from '../lib/task033ControlledCanaryObservationValidation';

describe('Task 033 - no Task 040 backend freeze', () => {
  it('should include "task040" in forbidden future task patterns', () => {
    expect(TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('task040');
  });

  it('should include "backend freeze" in forbidden future task patterns', () => {
    expect(TASK033_FORBIDDEN_FUTURE_TASK_PATTERNS).toContain('backend freeze');
  });

  it('should block backendFreezeRequested via environment gate', () => {
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
      backendFreezeRequested: true,
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
    expect(result.reasonCodes).toContain('backendFreezeRequested_not_false');
  });

  it('should have safeToStartTask040 false by default in safe read model', () => {
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

  it('should reject safe read model with safeToStartTask040 true', () => {
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
      safeToStartTask040: true,
      safeReasonCodes: [],
      generatedAt: new Date().toISOString(),
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('safeToStartTask040_not_false');
  });

  it('should block task040Started via environment gate', () => {
    const result = validateTask033EnvironmentGateInput({
      environmentType: 'controlled_canary_observation',
      observationMode: 'internal_observation_only',
      dataMode: 'safe_aggregate_only',
      sideEffectMode: 'internal_observation_store_only',
      task032Accepted: true,
      task033Started: false,
      task034Started: false,
      task035Started: false,
      task040Started: true,
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
    expect(result.reasonCodes).toContain('task040Started_not_false');
  });
});
