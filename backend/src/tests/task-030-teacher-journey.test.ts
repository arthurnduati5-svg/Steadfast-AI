import { describe, it, expect, beforeEach } from 'vitest';
import { runTask030TeacherJourney } from '../services/task030TeacherJourneyService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Teacher Journey', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should complete with ok result', async () => {
    const result = await runTask030TeacherJourney({ runId: 'run_teacher_001' });
    expect(result.ok).toBe(true);
  });

  it('should have allPassed true', async () => {
    const result = await runTask030TeacherJourney({ runId: 'run_teacher_002' });
    expect(result.allPassed).toBe(true);
  });

  it('should have journey steps', async () => {
    const result = await runTask030TeacherJourney({ runId: 'run_teacher_003' });
    expect(result.journeySteps.length).toBeGreaterThan(0);
  });

  it('should deny teacher access to console', async () => {
    const result = await runTask030TeacherJourney({ runId: 'run_teacher_004' });
    const accessStep = result.journeySteps.find(s => s.stepName === 'access_console');
    expect(accessStep).toBeDefined();
    expect(accessStep!.expectedAllowed).toBe(false);
    expect(accessStep!.actualAllowed).toBe(false);
  });

  it('should allow teacher safe oversight summary', async () => {
    const result = await runTask030TeacherJourney({ runId: 'run_teacher_005' });
    const step = result.journeySteps.find(s => s.stepName === 'get_safe_oversight_summary');
    expect(step).toBeDefined();
    expect(step!.passed).toBe(true);
  });

  it('should deny teacher raw learner data', async () => {
    const result = await runTask030TeacherJourney({ runId: 'run_teacher_006' });
    const step = result.journeySteps.find(s => s.stepName === 'view_raw_learner_data');
    expect(step).toBeDefined();
    expect(step!.passed).toBe(true);
  });

  it('should deny teacher safeguarding notes', async () => {
    const result = await runTask030TeacherJourney({ runId: 'run_teacher_007' });
    const step = result.journeySteps.find(s => s.stepName === 'view_safeguarding_notes');
    expect(step).toBeDefined();
    expect(step!.passed).toBe(true);
  });

  it('should deny teacher answer keys', async () => {
    const result = await runTask030TeacherJourney({ runId: 'run_teacher_008' });
    const step = result.journeySteps.find(s => s.stepName === 'view_answer_keys');
    expect(step).toBeDefined();
    expect(step!.passed).toBe(true);
  });

  it('should have safeSummary', async () => {
    const result = await runTask030TeacherJourney({ runId: 'run_teacher_009' });
    expect(typeof result.safeSummary).toBe('string');
  });
});
