import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { TASK031_FORBIDDEN_CANARY_MODES } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { validateTask031StagingEnvironmentGateInput } from '../lib/task031StagingSmokeCanaryReadinessValidation';

describe('Task 031 - No Task 033 Canary Observation Contract', () => {
  it('should report canaryObservationCreated as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.canaryObservationCreated).toBe(false);
  });

  it('should report safeToStartTask033 as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.safeToStartTask033).toBe(false);
  });

  it('should have forbidden canary modes include observe', () => {
    expect(TASK031_FORBIDDEN_CANARY_MODES).toContain('observe');
  });

  it('should block input requesting canary observation', () => {
    const result = validateTask031StagingEnvironmentGateInput({
      environmentType: 'staging',
      canaryObservationRequested: true,
    });
    expect(result.valid).toBe(false);
    expect(result.reasonCodes).toContain('canary_observation_requested');
  });
});
