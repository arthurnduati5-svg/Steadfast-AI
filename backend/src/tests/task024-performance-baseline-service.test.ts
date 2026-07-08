import { describe, it, expect, beforeEach } from 'vitest';
import { recordPerformanceBaseline, evaluatePerformanceBaseline, compareAgainstThresholds } from '../services/task024PerformanceBaselineService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024PerformanceBaselineService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should record performance baseline with thresholds', async () => {
    const result = await recordPerformanceBaseline(100, 0.01, 50, 'low');
    expect(result.status).toBe('baseline_recorded');
    expect(result.latencyMs).toBe(100);
    expect(result.thresholdLatencyMs).toBe(5000);
  });

  it('should detect threshold exceeded', async () => {
    const result = await recordPerformanceBaseline(10000, 0.5, 10, 'high');
    expect(result.status).toBe('threshold_exceeded');
    expect(result.thresholdExceeded).toBe(true);
  });

  it('should compare against thresholds', () => {
    const ok = compareAgainstThresholds(100, 0.01, 100);
    expect(ok.thresholdExceeded).toBe(false);
    const exceeded = compareAgainstThresholds(10000, 0.01, 100);
    expect(exceeded.thresholdExceeded).toBe(true);
    expect(exceeded.reason).toContain('latency');
  });

  it('evaluatePerformanceBaseline should work', async () => {
    const result = await evaluatePerformanceBaseline(200, 0.02, 80, 'low');
    expect(result.status).toBe('baseline_recorded');
  });
});
