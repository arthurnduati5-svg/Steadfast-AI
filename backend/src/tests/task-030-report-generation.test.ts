import { describe, it, expect, beforeEach } from 'vitest';
import { generateTask030ControlledStagingReport } from '../services/task030ControlledStagingReportService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Report Generation', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should generate a report with taskId 030', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_001', schoolId: 'school_001' });
    expect(report.taskId).toBe('030');
  });

  it('should have scope defined', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_002', schoolId: 'school_001' });
    expect(report.scope).toBeDefined();
    expect(report.scope.length).toBeGreaterThan(0);
  });

  it('should have syntheticDataOnly true', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_003', schoolId: 'school_001' });
    expect(report.syntheticDataOnly).toBe(true);
  });

  it('should have stagingEnvironmentOnly true', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_004', schoolId: 'school_001' });
    expect(report.stagingEnvironmentOnly).toBe(true);
  });

  it('should have dryRunOnly true', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_005', schoolId: 'school_001' });
    expect(report.dryRunOnly).toBe(true);
  });

  it('should have frontendUiCreated false', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_006', schoolId: 'school_001' });
    expect(report.frontendUiCreated).toBe(false);
  });

  it('should have productionDeploymentIntroduced false', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_007', schoolId: 'school_001' });
    expect(report.productionDeploymentIntroduced).toBe(false);
  });

  it('should have realStudentDataUsed false', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_008', schoolId: 'school_001' });
    expect(report.realStudentDataUsed).toBe(false);
  });

  it('should have verdict ACCEPTED_READY_YES or ACCEPTED_READY_NO', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_009', schoolId: 'school_001' });
    expect(['ACCEPTED_READY_YES', 'ACCEPTED_READY_NO']).toContain(report.verdict);
  });

  it('should have remainingBlockers array', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_010', schoolId: 'school_001' });
    expect(Array.isArray(report.remainingBlockers)).toBe(true);
  });

  it('should persist in repository', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_persist', schoolId: 'school_001' });
    const stored = await task030ControlledStagingRehearsalRepository.getLatestReport();
    expect(stored).not.toBeNull();
    expect(stored!.taskId).toBe(report.taskId);
  });

  it('should have safeToStartTask031 boolean', async () => {
    const report = await generateTask030ControlledStagingReport({ runId: 'run_report_012', schoolId: 'school_001' });
    expect(typeof report.safeToStartTask031).toBe('boolean');
  });
});
