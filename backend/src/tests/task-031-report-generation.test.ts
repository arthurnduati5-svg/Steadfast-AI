import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';

describe('Task 031 - Report Generation', () => {
  it('should produce a report with correct taskId', async () => {
    const report = await generateTask031Report({});
    expect(report.taskId).toBe('031');
  });

  it('should have correct scope', async () => {
    const report = await generateTask031Report({});
    expect(report.scope).toBe('task031_staging_smoke_canary_readiness');
  });

  it('should set safeToStartTask032 true when all pass', async () => {
    const report = await generateTask031Report({});
    expect(report.safeToStartTask032).toBe(true);
    expect(report.verdict).toBe('TASK_031_PASS_SAFE_TO_START_TASK_032');
  });

  it('should set safeToStartTask032 false when backendRouteSmokePassed is false', async () => {
    const report = await generateTask031Report({ backendRouteSmokePassed: false });
    expect(report.safeToStartTask032).toBe(false);
    expect(report.verdict).toBe('TASK_031_FAIL_NOT_SAFE_TO_START_TASK_032');
  });

  it('should set safeToStartTask032 false when operationsConsoleSmokePassed is false', async () => {
    const report = await generateTask031Report({ operationsConsoleSmokePassed: false });
    expect(report.safeToStartTask032).toBe(false);
  });

  it('should propagate remaining blockers', async () => {
    const report = await generateTask031Report({ remainingBlockers: ['env_failure', 'role_mismatch'] });
    expect(report.remainingBlockers).toEqual(['env_failure', 'role_mismatch']);
  });

  it('should set syntheticDataOnly to true', async () => {
    const report = await generateTask031Report({});
    expect(report.syntheticDataOnly).toBe(true);
  });

  it('should set stagingEnvironmentOnly to true', async () => {
    const report = await generateTask031Report({});
    expect(report.stagingEnvironmentOnly).toBe(true);
  });

  it('should set smokeCheckOnly to true', async () => {
    const report = await generateTask031Report({});
    expect(report.smokeCheckOnly).toBe(true);
  });

  it('should set canaryReadinessOnly to true', async () => {
    const report = await generateTask031Report({});
    expect(report.canaryReadinessOnly).toBe(true);
  });

  it('should set task032-040 started to false by default', async () => {
    const report = await generateTask031Report({});
    expect(report.task032Started).toBe(false);
    expect(report.task033Started).toBe(false);
    expect(report.task034Started).toBe(false);
    expect(report.task035Started).toBe(false);
    expect(report.task040Started).toBe(false);
  });

  it('should include commandsRun from input', async () => {
    const report = await generateTask031Report({ commandsRun: ['npx vitest run', 'npx tsc'] });
    expect(report.commandsRun).toContain('npx vitest run');
    expect(report.commandsRun).toContain('npx tsc');
  });
});