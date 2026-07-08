import { describe, it, expect, beforeEach } from 'vitest';
import { checkPilotRuntimeAccess } from '../services/task026PilotRuntimeGuardService';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { setupPilotTestEnvironment } from './task-026-test-helper';

describe('Task 026 Pilot Session Preflight', () => {
  let pilotProgramId: string;
  let executionRunId: string;

  beforeEach(async () => {
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';

    const env = await setupPilotTestEnvironment();
    pilotProgramId = env.pilotProgramId;
    executionRunId = env.executionRunId;
  });

  it('should pass preflight for allowed participant', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
      pilotProgramId,
      executionRunId,
    });

    expect(result.allowed).toBe(true);
  });

  it('should deny preflight out-of-cohort user', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'student-2',
      role: 'student',
      pilotProgramId,
      executionRunId,
    });

    expect(result.allowed).toBe(false);
  });

  it('should deny preflight wrong-role user', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'anonymous',
      pilotProgramId,
      executionRunId,
    });

    expect(result.allowed).toBe(false);
  });

  it('should deny preflight no school context', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: '',
      actorIdHash: 'student-1',
      role: 'student',
      pilotProgramId,
      executionRunId,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });
});
