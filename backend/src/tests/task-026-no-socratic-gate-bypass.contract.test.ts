import { describe, it, expect, beforeEach } from 'vitest';
import { checkPilotRuntimeAccess } from '../services/task026PilotRuntimeGuardService';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { setupPilotTestEnvironment } from './task-026-test-helper';

describe('Task 026 No Socratic Gate Bypass', () => {
  beforeEach(async () => {
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK026_REQUIRE_REAL_PRISMA;
  });

  it('should require socratic guard readiness in gate snapshot', async () => {
    const env = await setupPilotTestEnvironment();

    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
      pilotProgramId: env.pilotProgramId,
      executionRunId: env.executionRunId,
    });

    expect(result.allowed).toBe(true);
    expect(result.gateSnapshot.socraticGuardReady).toBe(true);
  });

  it('should not expose final answers in gate decisions', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
    });

    // Safe error message does not leak answer key information
    if (!result.allowed) {
      expect(result.safeMessage).not.toContain('answer');
      expect(result.safeMessage).not.toContain('key');
    }
  });
});
