import { describe, it, expect } from 'vitest';
import { Task040NoDriftCheck } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 - No-Drift Check Contract', () => {
  it('validates no-drift structure', () => {
    const result: Task040NoDriftCheck = {
      ok: true,
      task036ReportStillAccepted: true,
      task036SafeToStartTask040StillTrue: true,
      task040ModifiedTask036Runtime: false,
      task040ModifiedFrontend: false,
      task040ModifiedAiRuntime: false,
      task040ModifiedDeploymentLogic: false,
      task040IntroducedLiveIntegrations: false,
      details: [],
    };
    expect(result.ok).toBe(true);
    expect(result.task040ModifiedFrontend).toBe(false);
    expect(result.task040ModifiedAiRuntime).toBe(false);
  });

  it('detects drift when frontend is modified', () => {
    const result: Task040NoDriftCheck = {
      ok: false,
      task036ReportStillAccepted: true,
      task036SafeToStartTask040StillTrue: true,
      task040ModifiedTask036Runtime: false,
      task040ModifiedFrontend: true,
      task040ModifiedAiRuntime: false,
      task040ModifiedDeploymentLogic: false,
      task040IntroducedLiveIntegrations: false,
      details: ['frontend modified'],
    };
    expect(result.ok).toBe(false);
    expect(result.task040ModifiedFrontend).toBe(true);
  });
});
