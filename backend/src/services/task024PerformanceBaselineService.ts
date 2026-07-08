import type { Task024PerformanceBaselineResult, Task024PerformanceBaselineStatus } from '../contracts/task024OperationsReadinessContracts';
import { task024ReadinessRepository } from './task024OperationsReadinessRepository';

const THRESHOLDS = {
  latencyMs: 5000,
  errorRate: 0.05,
  throughputPerSecond: 50,
  backpressure: 'moderate',
};

export async function recordPerformanceBaseline(
  latencyMs: number, errorRate: number, throughputPerSecond: number, backpressureLevel: string
): Promise<Task024PerformanceBaselineResult> {
  const thresholdExceeded = latencyMs > THRESHOLDS.latencyMs || errorRate > THRESHOLDS.errorRate;

  const status: Task024PerformanceBaselineStatus = thresholdExceeded ? 'threshold_exceeded' : 'baseline_recorded';

  const result: Task024PerformanceBaselineResult = {
    status,
    latencyMs,
    errorRate,
    throughputPerSecond,
    backpressureLevel,
    thresholdLatencyMs: THRESHOLDS.latencyMs,
    thresholdErrorRate: THRESHOLDS.errorRate,
    thresholdThroughput: THRESHOLDS.throughputPerSecond,
    thresholdBackpressure: THRESHOLDS.backpressure,
    thresholdExceeded,
    safeSummary: thresholdExceeded
      ? `Performance baseline: threshold exceeded - latency ${latencyMs}ms (threshold ${THRESHOLDS.latencyMs}ms), error rate ${errorRate} (threshold ${THRESHOLDS.errorRate})`
      : `Performance baseline recorded: latency ${latencyMs}ms, error rate ${errorRate}, throughput ${throughputPerSecond} ops/sec`,
  };
  await task024ReadinessRepository.recordPerformanceBaselineResult(result);
  return result;
}

export async function evaluatePerformanceBaseline(
  latencyMs: number, errorRate: number, throughputPerSecond: number, backpressureLevel: string
): Promise<Task024PerformanceBaselineResult> {
  return recordPerformanceBaseline(latencyMs, errorRate, throughputPerSecond, backpressureLevel);
}

export function compareAgainstThresholds(
  latencyMs: number, errorRate: number, throughputPerSecond: number
): { thresholdExceeded: boolean; reason: string } {
  if (latencyMs > THRESHOLDS.latencyMs) {
    return { thresholdExceeded: true, reason: `latency ${latencyMs}ms exceeds ${THRESHOLDS.latencyMs}ms` };
  }
  if (errorRate > THRESHOLDS.errorRate) {
    return { thresholdExceeded: true, reason: `error rate ${errorRate} exceeds ${THRESHOLDS.errorRate}` };
  }
  return { thresholdExceeded: false, reason: 'all within thresholds' };
}
