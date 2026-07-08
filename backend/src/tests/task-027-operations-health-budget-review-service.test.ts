import { describe, it, expect, beforeEach } from 'vitest';
import { reviewOperationsHealthBudget } from '../services/task027OperationsHealthBudgetReviewService';
import { task027PilotExpansionGovernanceRepository as govRepo } from '../repositories/task027PilotExpansionGovernanceRepository';

describe('task027OperationsHealthBudgetReviewService', () => {
  beforeEach(() => {
    govRepo.clearTask027StoresForTests();
  });

  it('passes when all conditions are met', async () => {
    const result = await reviewOperationsHealthBudget({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      monitoringCapacityOk: true,
      supportQueueCapacityOk: true,
      incidentResponseReadinessOk: true,
      latencyErrorBudgetAcceptable: true,
      pausePathReady: true,
      rollbackPathReady: true,
      killSwitchReady: true,
      teacherWorkloadAcceptable: true,
    });

    expect(result.ok).toBe(true);
    expect(result.reviewStatus).toBe('passed');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('blocks when monitoring capacity is insufficient', async () => {
    const result = await reviewOperationsHealthBudget({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      monitoringCapacityOk: false,
      supportQueueCapacityOk: true,
      incidentResponseReadinessOk: true,
      latencyErrorBudgetAcceptable: true,
      pausePathReady: true,
      rollbackPathReady: true,
      killSwitchReady: true,
      teacherWorkloadAcceptable: true,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('failed');
    expect(result.blockingIssues).toContain('Monitoring capacity insufficient to support expansion.');
  });

  it('blocks when support queue capacity is insufficient', async () => {
    const result = await reviewOperationsHealthBudget({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      monitoringCapacityOk: true,
      supportQueueCapacityOk: false,
      incidentResponseReadinessOk: true,
      latencyErrorBudgetAcceptable: true,
      pausePathReady: true,
      rollbackPathReady: true,
      killSwitchReady: true,
      teacherWorkloadAcceptable: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Support queue capacity insufficient for projected load.');
  });

  it('blocks when rollback path is not ready', async () => {
    const result = await reviewOperationsHealthBudget({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      monitoringCapacityOk: true,
      supportQueueCapacityOk: true,
      incidentResponseReadinessOk: true,
      latencyErrorBudgetAcceptable: true,
      pausePathReady: true,
      rollbackPathReady: false,
      killSwitchReady: true,
      teacherWorkloadAcceptable: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Rollback path not verified ready for expansion.');
  });

  it('blocks when kill switch is not ready', async () => {
    const result = await reviewOperationsHealthBudget({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      monitoringCapacityOk: true,
      supportQueueCapacityOk: true,
      incidentResponseReadinessOk: true,
      latencyErrorBudgetAcceptable: true,
      pausePathReady: true,
      rollbackPathReady: true,
      killSwitchReady: false,
      teacherWorkloadAcceptable: true,
    });

    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('Kill switch mechanism not ready for expansion.');
  });

  it('blocks when multiple capacity checks fail', async () => {
    const result = await reviewOperationsHealthBudget({
      schoolId: 'school-1',
      proposalId: 'prop-1',
      pilotRunId: 'run-1',
      monitoringCapacityOk: false,
      supportQueueCapacityOk: false,
      incidentResponseReadinessOk: false,
      latencyErrorBudgetAcceptable: false,
      pausePathReady: false,
      rollbackPathReady: false,
      killSwitchReady: false,
      teacherWorkloadAcceptable: false,
    });

    expect(result.ok).toBe(false);
    expect(result.reviewStatus).toBe('failed');
    expect(result.blockingIssues.length).toBe(8);
  });
});
