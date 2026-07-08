import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';

describe('task025PilotLearnerDeniedAdminRoutes', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';
  let PROGRAM_ID: string = '';

  async function setupPilotWithStudent() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Learner Denied Test',
      scopeSummarySafe: 'Test scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student', 'teacher'],
      createdByRole: 'admin',
    });
    PROGRAM_ID = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(PROGRAM_ID, 'active', 'admin');
    await task025PilotRepository.createCohort({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      name: 'Test Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
  }

  it('student can access tutor session when eligible', async () => {
    await setupPilotWithStudent();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
    });
    expect(result.allowed).toBe(true);
  });

  it('student cannot access pilot admin controls (simulated role check)', async () => {
    await setupPilotWithStudent();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
    });
    expect(result.allowed).toBe(true);

    const adminResult = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'admin',
    });
    expect(adminResult.allowed).toBe(false);
    expect(adminResult.reasonCodes).toContain('role_not_allowed');
  });

  it('student cannot create pilot programs (simulated via access gate role check)', async () => {
    await setupPilotWithStudent();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'admin',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });

  it('out-of-cohort student cannot start pilot session', async () => {
    await setupPilotWithStudent();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'unauthorized-student',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('not_in_pilot_participants');
  });

  it('teacher outside pilot scope cannot access admin controls', async () => {
    await setupPilotWithStudent();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'unauthorized-teacher',
      role: 'teacher',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('not_in_pilot_participants');
  });
});
