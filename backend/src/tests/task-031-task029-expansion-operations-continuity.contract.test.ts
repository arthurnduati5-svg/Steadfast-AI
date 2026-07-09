import { describe, it, expect } from 'vitest';
import { runTask031OperationsConsoleSmoke } from '../services/task031OperationsConsoleSmokeService';
import { validateTask031AdminOperatorMonitoringSmokeSync } from '../services/task031AdminOperatorMonitoringSmokeService';

describe('Task 031 - Task 029 Expansion Operations Continuity Contract', () => {
  it('should verify task029 continuity during operations console smoke', async () => {
    const result = await runTask031OperationsConsoleSmoke({});
    expect(result.task029ContinuityVerified).toBe(true);
  });

  it('should verify task030 continuity during operations console smoke', async () => {
    const result = await runTask031OperationsConsoleSmoke({});
    expect(result.task030ContinuityVerified).toBe(true);
  });

  it('should have safe observability only for expansion operations', async () => {
    const result = await runTask031OperationsConsoleSmoke({});
    expect(result.safeObservabilityOnly).toBe(true);
  });

  it('should confirm admin operator monitoring shows aggregate metrics only', () => {
    const result = validateTask031AdminOperatorMonitoringSmokeSync();
    expect(result.aggregateMetricsOnly).toBe(true);
  });
});
