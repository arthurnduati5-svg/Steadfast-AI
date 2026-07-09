import { describe, it, expect, beforeEach } from 'vitest';
import { runTask030StagingPreflight } from '../services/task030StagingPreflightService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Staging Preflight', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should return a stage result with stageId', async () => {
    const result = await runTask030StagingPreflight({ schoolId: 'school_001' });
    expect(result.stageId).toBeDefined();
  });

  it('should have runId including schoolId', async () => {
    const result = await runTask030StagingPreflight({ schoolId: 'school_001' });
    expect(result.runId).toContain('preflight_school_001');
  });

  it('should have status set to either passed or blocked', async () => {
    const result = await runTask030StagingPreflight({ schoolId: 'school_001' });
    expect(['passed', 'blocked']).toContain(result.status);
  });

  it('should have details in the result', async () => {
    const result = await runTask030StagingPreflight({ schoolId: 'school_001' });
    expect(result.details).toBeDefined();
    expect(typeof result.details).toBe('object');
  });

  it('should persist stage result in repository', async () => {
    const result = await runTask030StagingPreflight({ schoolId: 'school_001' });
    const stages = await task030ControlledStagingRehearsalRepository.listStageResults(result.runId);
    expect(stages.length).toBeGreaterThanOrEqual(1);
  });

  it('should have blockingIssues array', async () => {
    const result = await runTask030StagingPreflight({ schoolId: 'school_001' });
    expect(Array.isArray(result.blockingIssues)).toBe(true);
  });

  it('should have safeSummary string', async () => {
    const result = await runTask030StagingPreflight({ schoolId: 'school_001' });
    expect(typeof result.safeSummary).toBe('string');
    expect(result.safeSummary.length).toBeGreaterThan(0);
  });

  it('should have ok boolean', async () => {
    const result = await runTask030StagingPreflight({ schoolId: 'school_001' });
    expect(typeof result.ok).toBe('boolean');
  });
});
