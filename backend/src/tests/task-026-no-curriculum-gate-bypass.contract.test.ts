import { describe, it, expect, beforeEach } from 'vitest';
import { checkPilotRuntimeAccess } from '../services/task026PilotRuntimeGuardService';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { setupPilotTestEnvironment } from './task-026-test-helper';

describe('Task 026 No Curriculum Gate Bypass', () => {
  beforeEach(async () => {
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK026_REQUIRE_REAL_PRISMA;
  });

  it('should deny subject not in pilot scope', async () => {
    const env = await setupPilotTestEnvironment({ allowedSubjects: ['Math'] });

    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
      pilotProgramId: env.pilotProgramId,
      executionRunId: env.executionRunId,
      subject: 'Physics',
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('subject_not_in_pilot_scope');
  });

  it('should deny curriculum track not in scope', async () => {
    const env = await setupPilotTestEnvironment({ allowedCurriculumTracks: ['National'] });

    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
      pilotProgramId: env.pilotProgramId,
      executionRunId: env.executionRunId,
      curriculumTrack: 'International',
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('curriculum_track_not_in_pilot_scope');
  });

  it('should allow subject in scope', async () => {
    const env = await setupPilotTestEnvironment({ allowedSubjects: ['Math', 'Science'] });

    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
      pilotProgramId: env.pilotProgramId,
      executionRunId: env.executionRunId,
      subject: 'Science',
    });

    expect(result.allowed).toBe(true);
  });
});
