import { describe, it, expect } from 'vitest';
import { generateTask025Report } from '../services/task025PilotReportService';

describe('task025PilotReportGeneration', () => {
  it('generates report with required fields', () => {
    const result = generateTask025Report();
    expect(result).toBeDefined();
    expect(result.jsonPath).toBeDefined();
    expect(result.mdPath).toBeDefined();
    expect(typeof result.safeToStartTask026).toBe('boolean');
    expect(typeof result.finalDecision).toBe('string');
  });

  it('report has valid final decision', () => {
    const result = generateTask025Report();
    expect(['TASK_025_PASS_SAFE_TO_START_TASK_026', 'TASK_025_FAIL_NOT_SAFE_TO_START_TASK_026']).toContain(result.finalDecision);
  });

  it('report does not manually force safeToStartTask026 true', () => {
    const result = generateTask025Report();
    if (result.safeToStartTask026 === true) {
      expect(result.blockingIssues.length).toBe(0);
    }
  });
});
