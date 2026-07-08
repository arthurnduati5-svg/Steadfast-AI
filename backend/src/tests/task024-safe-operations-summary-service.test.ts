import { describe, it, expect, beforeEach } from 'vitest';
import { buildSafeOperationsSummary, buildMonitoringSummary, buildIncidentSummary } from '../services/task024SafeOperationsSummaryService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024SafeOperationsSummaryService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should build safe operations summary with metadata only', async () => {
    const summary = await buildSafeOperationsSummary();
    expect(summary.monitoringSummary).toBeTruthy();
    expect(summary.incidentSummary).toBeTruthy();
    expect(summary.backupRestoreSummary).toBeTruthy();
    expect(summary.dataIntegritySummary).toBeTruthy();
    expect(summary.loadPerformanceSummary).toBeTruthy();
    expect(summary.governanceContinuitySummary).toBeTruthy();
    expect(summary.overallSafeSummary).toBeTruthy();
    expect(summary.createdAt).toBeTruthy();
  });

  it('should not contain secrets in summaries', async () => {
    const summary = await buildSafeOperationsSummary();
    expect(summary.overallSafeSummary).not.toContain('sk-');
    expect(summary.overallSafeSummary).not.toContain('DATABASE_URL');
  });

  it('should not contain raw learner content in summaries', async () => {
    const summary = await buildSafeOperationsSummary();
    expect(summary.overallSafeSummary).not.toContain('rawStudentData');
  });

  it('should build monitoring summary', async () => {
    const ms = await buildMonitoringSummary();
    expect(ms).toContain('monitoring');
  });

  it('should build incident summary', async () => {
    const is = await buildIncidentSummary();
    expect(is.toLowerCase()).toContain('incident');
  });
});
