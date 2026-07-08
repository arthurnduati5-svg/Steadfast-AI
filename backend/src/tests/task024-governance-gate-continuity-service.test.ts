import { describe, it, expect, beforeEach } from 'vitest';
import { verifyGovernanceGateContinuity } from '../services/task024GovernanceGateContinuityService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024GovernanceGateContinuityService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should verify all governance gates are continuous', async () => {
    const result = await verifyGovernanceGateContinuity();
    expect(result.status).toBe('passed');
    expect(result.task020GovernanceAvailable).toBe(true);
    expect(result.task021SchoolScopeAvailable).toBe(true);
    expect(result.task022ContentGovernanceAvailable).toBe(true);
    expect(result.task017NoAiBypassAvailable).toBe(true);
    expect(result.task018ObservabilityAvailable).toBe(true);
    expect(result.task019RuntimeControlsAvailable).toBe(true);
  });
});
