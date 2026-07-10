import { describe, it, expect } from 'vitest';
import { generateExpandedMonitoringSnapshot } from '../services/task034ExpandedMonitoringSnapshotService';

describe('Task034ExpandedMonitoringSnapshot', () => {
  it('should generate valid snapshot with safe identifiers', () => {
    const snapshot = generateExpandedMonitoringSnapshot();
    expect(snapshot.rolloutRunId).toBe('rollout_run_task034_safe');
    expect(snapshot.schoolId).toBe('school_task034_limited_rollout_safe');
    expect(snapshot.tenantId).toBe('tenant_task034_limited_rollout_safe');
    expect(snapshot.cohortId).toBe('cohort_task034_limited_rollout_safe');
    expect(snapshot.rolloutPercent).toBeLessThanOrEqual(25);
    expect(snapshot.openRolloutPerformed).toBe(false);
    expect(snapshot.schoolWideRolloutPerformed).toBe(false);
    expect(snapshot.hundredPercentRolloutPerformed).toBe(false);
    expect(snapshot.rawPrivateDataExposed).toBe(false);
  });

  it('should have aggregate-only data', () => {
    const snapshot = generateExpandedMonitoringSnapshot();
    expect(snapshot.sessionCount).toBeGreaterThan(0);
    expect(snapshot.eligibleStudentCount).toBeGreaterThan(0);
    expect(snapshot.approvedRolloutStudentCount).toBeGreaterThan(0);
    expect(snapshot.activeRolloutStudentCount).toBeGreaterThan(0);
    expect(Array.isArray(snapshot.safeEventSummaries)).toBe(true);
  });

  it('should accept overrides', () => {
    const snapshot = generateExpandedMonitoringSnapshot({ activeRolloutStudentCount: 50, rolloutPercent: 12 });
    expect(snapshot.activeRolloutStudentCount).toBe(50);
    expect(snapshot.rolloutPercent).toBe(12);
  });
});
