import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - No Production Data Mutation Contract', () => {
  it('should report productionDataMutationExecuted as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.productionDataMutationExecuted).toBe(false);
  });

  it('should report realStudentDataUsed as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.realStudentDataUsed).toBe(false);
  });

  it('should report syntheticDataOnly as true in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.syntheticDataOnly).toBe(true);
  });

  it('should have noProductionMutationScanPassed as true in report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.noProductionMutationScanPassed).toBe(true);
  });
});
