import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { TASK031_FORBIDDEN_CANARY_MODES } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { validateTask031StagingEnvironmentGateInput } from '../lib/task031StagingSmokeCanaryReadinessValidation';

describe('Task 031 - No Task 034 Rollout Contract', () => {
  it('should report rolloutCreated as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.rolloutCreated).toBe(false);
  });

  it('should report safeToStartTask034 as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.safeToStartTask034).toBe(false);
  });

  it('should have forbidden canary modes include rollout', () => {
    expect(TASK031_FORBIDDEN_CANARY_MODES).toContain('rollout');
  });

  it('should block input requesting rollout', () => {
    const result = validateTask031StagingEnvironmentGateInput({
      environmentType: 'staging',
      rolloutRequested: true,
    });
    expect(result.valid).toBe(false);
    expect(result.reasonCodes).toContain('rollout_requested');
  });
});
