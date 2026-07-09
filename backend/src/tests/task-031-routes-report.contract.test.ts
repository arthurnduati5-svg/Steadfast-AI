import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';

describe('Task 031 - POST /smoke-runs/:runId/report & GET /reports/latest contract', () => {
  it('should generate a report with taskId 031', async () => {
    const report = await generateTask031Report({});
    expect(report.taskId).toBe('031');
    expect(report.scope).toBe('task031_staging_smoke_canary_readiness');
    expect(report.stagingEnvironmentOnly).toBe(true);
    expect(report.smokeCheckOnly).toBe(true);
    expect(report.syntheticDataOnly).toBe(true);
  });

  it('should default to safe verdict when all pass', async () => {
    const report = await generateTask031Report({});
    expect(report.safeToStartTask032).toBe(true);
    expect(report.verdict).toBe('TASK_031_PASS_SAFE_TO_START_TASK_032');
    expect(report.backendRouteSmokePassed).toBe(true);
  });

  it('should propagate failing inputs to verdict', async () => {
    const report = await generateTask031Report({ backendRouteSmokePassed: false });
    expect(report.safeToStartTask032).toBe(false);
    expect(report.verdict).toBe('TASK_031_FAIL_NOT_SAFE_TO_START_TASK_032');
  });

  it('should include no-real-student flags', async () => {
    const report = await generateTask031Report({});
    expect(report.realStudentDataUsed).toBe(false);
    expect(report.frontendUiCreated).toBe(false);
    expect(report.liveAiCallIntroduced).toBe(false);
  });
});
