import { describe, it, expect } from 'vitest';
import { runTask031OperationsConsoleSmoke } from '../services/task031OperationsConsoleSmokeService';
import { checkTask031StagingEnvironmentGate } from '../services/task031StagingEnvironmentGateService';

describe('Task 031 - Task 024 Operations Readiness Continuity Contract', () => {
  it('should report operations console as accessible', async () => {
    const result = await runTask031OperationsConsoleSmoke({});
    expect(result.operationsConsoleAccessible).toBe(true);
  });

  it('should confirm staging rehearsal summary is visible', async () => {
    const result = await runTask031OperationsConsoleSmoke({});
    expect(result.stagingRehearsalSummaryVisible).toBe(true);
  });

  it('should confirm live deploy actions are blocked', async () => {
    const result = await runTask031OperationsConsoleSmoke({});
    expect(result.liveDeployActionsBlocked).toBe(true);
  });

  it('should pass the operations console smoke with zero blocking issues', async () => {
    const result = await runTask031OperationsConsoleSmoke({});
    expect(result.ok).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
  });
});
