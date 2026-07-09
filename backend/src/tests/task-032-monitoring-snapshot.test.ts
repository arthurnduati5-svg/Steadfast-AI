import { describe, it, expect } from 'vitest';
import { captureTask032MonitoringSnapshot } from '../services/task032CanaryMonitoringSnapshotService';

describe('Task 032 - Monitoring Snapshot', () => {
  it('should capture aggregate-only metrics', async () => {
    const snapshot = await captureTask032MonitoringSnapshot({
      canaryRunId: 'canary_run_task032_safe',
      schoolId: 'school_task032_canary_safe',
      cohortId: 'canary_cohort_task032_safe',
      windowStart: '2026-06-01T00:00:00Z',
      windowEnd: '2026-06-30T23:59:59Z',
      eligibleStudentCount: 20,
      activatedStudentCount: 10,
      activeSessionCount: 5,
      requestCount: 100,
      successfulRequestCount: 95,
      safeDenialCount: 5,
      errorCount: 0,
      roleDenialCount: 1,
      schoolAuthDenialCount: 0,
      canaryMembershipDenialCount: 0,
      curriculumGateDenialCount: 0,
      socraticGateDenialCount: 0,
      deenGateDenialCount: 0,
      privacyGateDenialCount: 0,
      memoryGateDenialCount: 0,
      aiGateDenialCount: 0,
      p50LatencyMs: 150,
      p95LatencyMs: 450,
      killSwitchActive: false,
      paused: false,
      rollbackActive: false,
      safeEventSummaries: ['All gates passed', 'Healthy canary operation'],
    });

    expect(snapshot.canaryRunId).toBe('canary_run_task032_safe');
    expect(snapshot.eligibleStudentCount).toBe(20);
    expect(snapshot.activatedStudentCount).toBe(10);
    expect(snapshot.activeSessionCount).toBe(5);
    expect(snapshot.requestCount).toBe(100);
    expect(snapshot.successfulRequestCount).toBe(95);
    expect(snapshot.p50LatencyMs).toBe(150);
    expect(snapshot.p95LatencyMs).toBe(450);
    expect(snapshot.safeEventSummaries).toHaveLength(2);
  });

  it('should not expose raw private data', async () => {
    const snapshot = await captureTask032MonitoringSnapshot({
      canaryRunId: 'canary_run_task032_safe',
      schoolId: 'school_task032_canary_safe',
      cohortId: 'canary_cohort_task032_safe',
      windowStart: '2026-06-01T00:00:00Z',
      windowEnd: '2026-06-30T23:59:59Z',
      eligibleStudentCount: 20,
      activatedStudentCount: 10,
      activeSessionCount: 5,
      requestCount: 100,
      successfulRequestCount: 95,
      safeDenialCount: 5,
      errorCount: 0,
      roleDenialCount: 1,
      schoolAuthDenialCount: 0,
      canaryMembershipDenialCount: 0,
      curriculumGateDenialCount: 0,
      socraticGateDenialCount: 0,
      deenGateDenialCount: 0,
      privacyGateDenialCount: 0,
      memoryGateDenialCount: 0,
      aiGateDenialCount: 0,
      p50LatencyMs: 150,
      p95LatencyMs: 450,
      killSwitchActive: false,
      paused: false,
      rollbackActive: false,
      safeEventSummaries: ['Normal operation'],
    });

    expect(snapshot.rawPrivateDataExposed).toBe(false);
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain('raw student chat');
    expect(json).not.toContain('private learner memory');
  });

  it('should include kill switch and pause state', async () => {
    const snapshot = await captureTask032MonitoringSnapshot({
      canaryRunId: 'canary_run_task032_safe',
      schoolId: 'school_task032_canary_safe',
      cohortId: 'canary_cohort_task032_safe',
      windowStart: '2026-06-01T00:00:00Z',
      windowEnd: '2026-06-30T23:59:59Z',
      eligibleStudentCount: 20,
      activatedStudentCount: 10,
      activeSessionCount: 0,
      requestCount: 0,
      successfulRequestCount: 0,
      safeDenialCount: 0,
      errorCount: 0,
      roleDenialCount: 0,
      schoolAuthDenialCount: 0,
      canaryMembershipDenialCount: 0,
      curriculumGateDenialCount: 0,
      socraticGateDenialCount: 0,
      deenGateDenialCount: 0,
      privacyGateDenialCount: 0,
      memoryGateDenialCount: 0,
      aiGateDenialCount: 0,
      p50LatencyMs: 0,
      p95LatencyMs: 0,
      killSwitchActive: true,
      paused: true,
      rollbackActive: false,
      safeEventSummaries: ['Kill switch active - runtime blocked'],
    });

    expect(snapshot.killSwitchActive).toBe(true);
    expect(snapshot.paused).toBe(true);
    expect(snapshot.rollbackActive).toBe(false);
  });
});
