import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { validateTask031StagingEnvironmentGateInput } from '../lib/task031StagingSmokeCanaryReadinessValidation';

describe('Task 031 - No Task 040 Backend Freeze Contract', () => {
  it('should report backendFreezeCreated as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.backendFreezeCreated).toBe(false);
  });

  it('should report safeToStartTask040 as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.safeToStartTask040).toBe(false);
  });

  it('should report task040Started as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.task040Started).toBe(false);
  });

  it('should block input requesting backend freeze', () => {
    const result = validateTask031StagingEnvironmentGateInput({
      environmentType: 'staging',
      backendFreezeRequested: true,
    });
    expect(result.valid).toBe(false);
    expect(result.reasonCodes).toContain('backend_freeze_requested');
  });
});
