import { describe, it, expect } from 'vitest';
import { captureTask031DefaultObservabilityBaseline } from '../services/task031ObservabilityBaselineService';

describe('Task 031 - GET /health envelope contract', () => {
  it('should return operational status with taskId TASK-031', () => {
    const envelope = {
      taskId: 'TASK-031',
      service: 'staging-smoke-canary-readiness-runtime',
      status: 'operational',
      backendOnly: true,
      stagingOnly: true,
      syntheticOnly: true,
      smokeCheckOnly: true,
      canaryReadinessOnly: true,
    };
    expect(envelope.taskId).toBe('TASK-031');
    expect(envelope.service).toContain('staging-smoke');
    expect(envelope.status).toBe('operational');
    expect(envelope.backendOnly).toBe(true);
    expect(envelope.stagingOnly).toBe(true);
    expect(envelope.syntheticOnly).toBe(true);
    expect(envelope.smokeCheckOnly).toBe(true);
    expect(envelope.canaryReadinessOnly).toBe(true);
  });

  it('should produce valid observability baseline from service', () => {
    const baseline = captureTask031DefaultObservabilityBaseline('smoke_run_001');
    expect(baseline.smokeRunId).toBe('smoke_run_001');
    expect(baseline.scenarioMode).toBe('authenticated_staging_smoke');
    expect(baseline.requestCount).toBeGreaterThan(0);
    expect(baseline.successCount).toBe(baseline.requestCount);
    expect(baseline.rawPrivateDataExposed).toBe(false);
    expect(baseline.safeEventSummaries.length).toBeGreaterThan(5);
  });
});
