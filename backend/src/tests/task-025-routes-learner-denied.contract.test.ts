import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';

describe('task025RoutesLearnerDeniedContract', () => {
  beforeEach(async () => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';
  const DENIED_ROLES = ['student', 'learner', 'peer'];

  async function createProgramWithParticipants() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Learner Denied Test',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['school_admin', 'system_admin', 'internal_operator'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.createCohort({ pilotProgramId: progId, schoolId: SCHOOL_ID, name: 'Cohort' });
    for (const role of DENIED_ROLES) {
      await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: `${role}-hash`, role, eligibilityStatus: 'eligible' });
    }
    return progId;
  }

  it.each(DENIED_ROLES)('%s role is denied admin-level access when not in allowedRoles', async (role) => {
    const progId = await createProgramWithParticipants();
    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: `${role}-hash`,
      role,
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });

  it('student cannot access admin gate for a program with admin-only roles', async () => {
    const progId = await createProgramWithParticipants();
    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash',
      role: 'admin',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });

  it('out-of-cohort student is denied access even when role is allowed', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Cohort-limited',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.createCohort({ pilotProgramId: progId, schoolId: SCHOOL_ID, name: 'Cohort' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'enrolled-student', role: 'student', eligibilityStatus: 'eligible' });

    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'unauthorized-student',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('not_in_pilot_participants');
  });

  it('parent role is denied access to pilot resources', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Parent Denied',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['school_admin'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'parent-hash', role: 'parent', eligibilityStatus: 'eligible' });

    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'parent-hash',
      role: 'parent',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });
});
