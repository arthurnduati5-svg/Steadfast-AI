import { describe, it, expect, beforeEach } from 'vitest';
import { generateReport } from '../services/task026ExecutionReportService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('task026NoTask027Expansion', () => {
  beforeEach(() => {
    task026PilotExecutionRepository.clearTask026StoresForTests();
  });

  it('report safeToStartTask027 is false when gates fail', async () => {
    const result = await generateReport('run-1', { schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.ok).toBe(true);
    expect(result.report!.safeToStartTask027).toBe(false);
  });

  it('report remainingBlockers are populated when gates fail', async () => {
    const result = await generateReport('run-1', { schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.report!.remainingBlockers.length).toBeGreaterThan(0);
  });

  it('report routeProtectionResult is routes_blocked when not all gates pass', async () => {
    const result = await generateReport('run-1', { schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.report!.routeProtectionResult).toBe('routes_blocked');
  });

  it('execution mode is controlled_pilot, not expansion', () => {
    const { TASK026_EXECUTION_MODES } = require('../contracts/task026ControlledPilotExecutionContracts');
    expect(TASK026_EXECUTION_MODES).toContain('controlled_pilot');
    expect(TASK026_EXECUTION_MODES).not.toContain('expansion');
    expect(TASK026_EXECUTION_MODES.length).toBe(1);
  });

  it('no expansion statuses in execution statuses', () => {
    const { TASK026_EXECUTION_STATUSES } = require('../contracts/task026ControlledPilotExecutionContracts');
    expect(TASK026_EXECUTION_STATUSES).not.toContain('expanding');
    expect(TASK026_EXECUTION_STATUSES).not.toContain('expand_pending');
  });

  it('report includes testProofSummary', async () => {
    const result = await generateReport('run-1', { schoolId: 'school-1', actorId: 'a1', actorRole: 'school_admin' });
    expect(result.report!.testProofSummary).toBeTruthy();
    expect(typeof result.report!.testProofSummary.gatesChecked).toBe('number');
  });
});
