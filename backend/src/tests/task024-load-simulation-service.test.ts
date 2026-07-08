import { describe, it, expect, beforeEach } from 'vitest';
import { createLoadSimulationPlan, evaluateLoadSimulationDryRun, validateNoLiveAiDuringLoadSimulation, validateNoLiveSchoolConnectorDuringLoadSimulation } from '../services/task024LoadSimulationService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024LoadSimulationService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should create load simulation plan with safe mock data', async () => {
    const plan = await createLoadSimulationPlan(['auth', 'governance'], 100, 5000);
    expect(plan.useLiveAi).toBe(false);
    expect(plan.useLiveConnectors).toBe(false);
    expect(plan.safeMockData).toBe(true);
    expect(plan.targetComponents).toContain('auth');
  });

  it('should cap concurrent count at 1000', async () => {
    const plan = await createLoadSimulationPlan(['auth'], 9999, 5000);
    expect(plan.concurrentCount).toBe(1000);
  });

  it('should run deterministic load simulation dry-run', async () => {
    const result = await evaluateLoadSimulationDryRun(['school_auth', 'governance'], 100, 5000);
    expect(result.liveAiCalled).toBe(false);
    expect(result.liveConnectorCalled).toBe(false);
    expect(result.status).toBe('failed');
  });

  it('should not call live AI during simulation', async () => {
    const result = await evaluateLoadSimulationDryRun(['school_auth'], 10, 1000);
    expect(result.liveAiCalled).toBe(false);
  });

  it('should not call live school connectors during simulation', async () => {
    const result = await evaluateLoadSimulationDryRun(['school_auth'], 10, 1000);
    expect(result.liveConnectorCalled).toBe(false);
  });

  it('should measure safe duration and throughput', async () => {
    const result = await evaluateLoadSimulationDryRun(['school_auth'], 50, 2000);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(result.throughputPerSecond).toBeGreaterThanOrEqual(0);
    expect(result.errorCount).toBeGreaterThanOrEqual(0);
  });

  it('validateNoLiveAiDuringLoadSimulation should return true', async () => {
    expect(await validateNoLiveAiDuringLoadSimulation()).toBe(true);
  });

  it('validateNoLiveSchoolConnectorDuringLoadSimulation should return true', async () => {
    expect(await validateNoLiveSchoolConnectorDuringLoadSimulation()).toBe(true);
  });
});
