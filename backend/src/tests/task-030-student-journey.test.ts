import { describe, it, expect, beforeEach } from 'vitest';
import { runTask030StudentJourney } from '../services/task030StudentJourneyService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Student Journey', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should complete with ok result', async () => {
    const result = await runTask030StudentJourney({ runId: 'run_student_001' });
    expect(result.ok).toBe(true);
  });

  it('should have allPassed true', async () => {
    const result = await runTask030StudentJourney({ runId: 'run_student_002' });
    expect(result.allPassed).toBe(true);
  });

  it('should have journey steps', async () => {
    const result = await runTask030StudentJourney({ runId: 'run_student_003' });
    expect(result.journeySteps.length).toBeGreaterThan(0);
  });

  it('should deny learner access to console', async () => {
    const result = await runTask030StudentJourney({ runId: 'run_student_004' });
    const step = result.journeySteps.find(s => s.stepName === 'access_console');
    expect(step).toBeDefined();
    expect(step!.expectedAllowed).toBe(false);
    expect(step!.actualAllowed).toBe(false);
  });

  it('should allow learner own synthetic status', async () => {
    const result = await runTask030StudentJourney({ runId: 'run_student_005' });
    const step = result.journeySteps.find(s => s.stepName === 'view_own_synthetic_status');
    expect(step).toBeDefined();
    expect(step!.passed).toBe(true);
  });

  it('should deny learner answer keys', async () => {
    const result = await runTask030StudentJourney({ runId: 'run_student_006' });
    const step = result.journeySteps.find(s => s.stepName === 'receive_answer_keys');
    expect(step).toBeDefined();
    expect(step!.passed).toBe(true);
  });

  it('should deny learner hidden reasoning', async () => {
    const result = await runTask030StudentJourney({ runId: 'run_student_007' });
    const step = result.journeySteps.find(s => s.stepName === 'view_hidden_reasoning');
    expect(step).toBeDefined();
    expect(step!.passed).toBe(true);
  });

  it('should deny learner teacher-only notes', async () => {
    const result = await runTask030StudentJourney({ runId: 'run_student_008' });
    const step = result.journeySteps.find(s => s.stepName === 'view_teacher_only_notes');
    expect(step).toBeDefined();
    expect(step!.passed).toBe(true);
  });

  it('should have safeSummary', async () => {
    const result = await runTask030StudentJourney({ runId: 'run_student_009' });
    expect(typeof result.safeSummary).toBe('string');
  });
});
