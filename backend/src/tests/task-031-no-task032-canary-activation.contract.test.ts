import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { TASK031_FORBIDDEN_CANARY_MODES, TASK031_ALLOWED_CANARY_MODES } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { validateTask031StagingEnvironmentGateInput } from '../lib/task031StagingSmokeCanaryReadinessValidation';

describe('Task 031 - No Task 032 Canary Activation Contract', () => {
  it('should report canaryActivationCreated as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.canaryActivationCreated).toBe(false);
  });

  it('should have forbidden canary modes include activate', () => {
    expect(TASK031_FORBIDDEN_CANARY_MODES).toContain('activate');
  });

  it('should have allowed canary modes as readiness_only', () => {
    expect(TASK031_ALLOWED_CANARY_MODES).toEqual(['readiness_only']);
  });

  it('should block input requesting canary activation', () => {
    const result = validateTask031StagingEnvironmentGateInput({
      environmentType: 'staging',
      canaryActivationRequested: true,
    });
    expect(result.valid).toBe(false);
    expect(result.reasonCodes).toContain('canary_activation_requested');
  });
});
