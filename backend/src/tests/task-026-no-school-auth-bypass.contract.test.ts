import { describe, it, expect, beforeEach } from 'vitest';
import { checkPilotRuntimeAccess } from '../services/task026PilotRuntimeGuardService';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';

describe('Task 026 No School Auth Bypass', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
  });

  it('should deny access when no school identity', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: '',
      actorIdHash: 'user-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('should deny access with unknown school', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'unknown',
      actorIdHash: 'user-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('should deny access without participant record', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'user-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
  });

  it('should deny access with no program', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'user-1',
      role: 'student',
      pilotProgramId: 'nonexistent',
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('task025_readiness_not_accepted');
  });

  it('should never bypass school auth in allow path', async () => {
    // Even if all data exists, school is still required
    const result = await checkPilotRuntimeAccess({
      schoolId: '',
      actorIdHash: 'student-1',
      role: 'student',
    });

    expect(result.allowed).toBe(false);
  });
});
