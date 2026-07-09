import { describe, it, expect, beforeEach } from 'vitest';
import { runTask030AdminOperatorJourney } from '../services/task030AdminOperatorJourneyService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Admin Operator Journey', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should complete with ok result', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_001' });
    expect(result.ok).toBe(true);
  });

  it('should have allPassed true', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_002' });
    expect(result.allPassed).toBe(true);
  });

  it('should have journey steps', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_003' });
    expect(result.journeySteps.length).toBeGreaterThan(0);
  });

  it('should include open_rehearsal step', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_004' });
    const stepNames = result.journeySteps.map(s => s.stepName);
    expect(stepNames).toContain('open_rehearsal');
  });

  it('should include validate_proof step', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_005' });
    const stepNames = result.journeySteps.map(s => s.stepName);
    expect(stepNames).toContain('validate_proof');
  });

  it('should include start_run step', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_006' });
    const stepNames = result.journeySteps.map(s => s.stepName);
    expect(stepNames).toContain('start_run');
  });

  it('should include view_console step', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_007' });
    const stepNames = result.journeySteps.map(s => s.stepName);
    expect(stepNames).toContain('view_console');
  });

  it('should have safeSummary', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_008' });
    expect(typeof result.safeSummary).toBe('string');
    expect(result.safeSummary.length).toBeGreaterThan(0);
  });

  it('should have blockingIssues array', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_009' });
    expect(Array.isArray(result.blockingIssues)).toBe(true);
  });

  it('should persist in repository', async () => {
    await runTask030AdminOperatorJourney({ runId: 'run_admin_persist' });
    const stored = (task030ControlledStagingRehearsalRepository as any).adminOperatorJourneys;
    expect(stored.length).toBeGreaterThanOrEqual(1);
  });

  it('should set syntheticRole on steps', async () => {
    const result = await runTask030AdminOperatorJourney({ runId: 'run_admin_role' });
    result.journeySteps.forEach(s => {
      expect(s.syntheticRole).toBeDefined();
    });
  });
});
