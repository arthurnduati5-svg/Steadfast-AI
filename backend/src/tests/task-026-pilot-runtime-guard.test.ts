import { describe, it, expect, beforeEach } from 'vitest';
import { checkPilotRuntimeAccess } from '../services/task026PilotRuntimeGuardService';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { setupPilotTestEnvironment } from './task-026-test-helper';

describe('Task 026 Pilot Runtime Guard', () => {
  let pilotProgramId: string;
  let executionRunId: string;
  let actorIdHash: string;

  beforeEach(async () => {
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK026_REQUIRE_REAL_PRISMA;

    const env = await setupPilotTestEnvironment();
    pilotProgramId = env.pilotProgramId;
    executionRunId = env.executionRunId;
    actorIdHash = 'student-1';
  });

  it('should deny access without verified school identity', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: '',
      actorIdHash,
      role: 'student',
      pilotProgramId,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('should deny access if Task 025 readiness not accepted', async () => {
    await task025PilotRepository._clearMemory();
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash,
      role: 'student',
      pilotProgramId,
    });

    expect(result.allowed).toBe(false);
  });

  it('should deny access if pilot program not found', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash,
      role: 'student',
      pilotProgramId: 'nonexistent',
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('task025_readiness_not_accepted');
  });

  it('should deny access if pilot not approved', async () => {
    const p2 = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-1',
      name: 'Unapproved',
      scopeSummarySafe: 'test',
      allowedRoles: ['student'],
      allowedSubjects: ['Math'],
      createdByRole: 'admin',
      approvalStatus: 'pending',
    });
    const p2Id = (p2 as any).id;
    await task025PilotRepository.addParticipant({
      pilotProgramId: p2Id,
      schoolId: 'school-1',
      actorIdHash,
      role: 'student',
      eligibilityStatus: 'eligible',
    });

    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash,
      role: 'student',
      pilotProgramId: p2Id,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('task025_readiness_not_accepted');
  });

  it('should deny access if execution run not active', async () => {
    const newRun = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId,
      schoolId: 'school-1',
      status: 'paused',
      safeSummary: 'Paused run',
    });
    const newRunId = (newRun as any).id;

    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash,
      role: 'student',
      pilotProgramId,
      executionRunId: newRunId,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('execution_run_not_active_paused');
  });

  it('should deny access if user not in pilot participants', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash: 'unknown-user',
      role: 'student',
      pilotProgramId,
      executionRunId,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('not_in_pilot_participants');
  });

  it('should deny access if role not allowed', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash,
      role: 'anonymous',
      pilotProgramId,
      executionRunId,
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });

  it('should deny access if subject not in scope', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash,
      role: 'student',
      pilotProgramId,
      executionRunId,
      subject: 'Physics',
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('subject_not_in_pilot_scope');
  });

  it('should allow access when all gates pass', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash,
      role: 'student',
      pilotProgramId,
      executionRunId,
      subject: 'Math',
    });

    expect(result.allowed).toBe(true);
    expect(result.gateSnapshot.schoolVerified).toBe(true);
    expect(result.gateSnapshot.executionRunActive).toBe(true);
    expect(result.gateSnapshot.roleAllowed).toBe(true);
  });

  it('should deny if cohort not in allowed list', async () => {
    const result = await checkPilotRuntimeAccess({
      schoolId: 'school-1',
      actorIdHash,
      role: 'student',
      pilotProgramId,
      executionRunId,
      cohortId: 'cohort-unknown',
    });

    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('cohort_not_allowed');
  });
});
