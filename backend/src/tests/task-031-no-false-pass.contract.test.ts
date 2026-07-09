import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import { validateTask031StagingEnvironmentGateInput } from '../lib/task031StagingSmokeCanaryReadinessValidation';

describe('Task 031 - No False Pass Contract', () => {
  it('should not pass when environment gate detects production', () => {
    const result = validateTask031StagingEnvironmentGateInput({
      environmentType: 'production',
    });
    expect(result.valid).toBe(false);
  });

  it('should not pass when live student access is requested', () => {
    const result = validateTask031StagingEnvironmentGateInput({
      environmentType: 'staging',
      liveStudentAccessRequested: true,
    });
    expect(result.valid).toBe(false);
  });

  it('should not pass when live AI is requested', () => {
    const result = validateTask031StagingEnvironmentGateInput({
      environmentType: 'staging',
      liveAiRequested: true,
    });
    expect(result.valid).toBe(false);
  });

  it('should report noFalsePassScanPassed as true in report', async () => {
    const report = await generateTask031Report({});
    expect(report.noFalsePassScanPassed).toBe(true);
  });
});
