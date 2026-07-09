import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { validateTask031StagingEnvironmentGateInput } from '../lib/task031StagingSmokeCanaryReadinessValidation';

describe('Task 031 - No Task 035 School-Wide Launch Contract', () => {
  it('should report schoolWideLaunchCreated as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.schoolWideLaunchCreated).toBe(false);
  });

  it('should report safeToStartTask035 as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.safeToStartTask035).toBe(false);
  });

  it('should report task035Started as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.task035Started).toBe(false);
  });

  it('should block input requesting school-wide launch', () => {
    const result = validateTask031StagingEnvironmentGateInput({
      environmentType: 'staging',
      schoolWideLaunchRequested: true,
    });
    expect(result.valid).toBe(false);
    expect(result.reasonCodes).toContain('school_wide_launch_requested');
  });
});
