import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';
import { generateReadinessDiagnostics } from '../services/task025ReadinessDiagnosticsService';

describe('task025RoutesAdminScopeContract', () => {
  beforeEach(async () => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';
  const NON_ADMIN_ROLES = ['student', 'teacher', 'parent', 'peer', 'learner'];

  async function createActiveProgram() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Admin Scope Test',
      scopeSummarySafe: 'Test scope',
      allowedSubjects: ['Mathematics'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student', 'teacher', 'admin', 'school_admin', 'system_admin', 'internal_operator', 'authorized_pilot_coordinator'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.createCohort({ pilotProgramId: progId, schoolId: SCHOOL_ID, name: 'Cohort' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'admin-hash', role: 'school_admin', eligibilityStatus: 'eligible' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'sysadmin-hash', role: 'system_admin', eligibilityStatus: 'eligible' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'operator-hash', role: 'internal_operator', eligibilityStatus: 'eligible' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'coordinator-hash', role: 'authorized_pilot_coordinator', eligibilityStatus: 'eligible' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'student-hash', role: 'student', eligibilityStatus: 'eligible' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'teacher-hash', role: 'teacher', eligibilityStatus: 'eligible' });
    return progId;
  }

  it('school_admin role is allowed through access gate', async () => {
    const progId = await createActiveProgram();
    const result = await checkPilotAccess({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'admin-hash', role: 'school_admin' });
    expect(result.allowed).toBe(true);
  });

  it('system_admin role is allowed through access gate', async () => {
    const progId = await createActiveProgram();
    const result = await checkPilotAccess({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'sysadmin-hash', role: 'system_admin' });
    expect(result.allowed).toBe(true);
  });

  it('internal_operator role is allowed through access gate', async () => {
    const progId = await createActiveProgram();
    const result = await checkPilotAccess({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'operator-hash', role: 'internal_operator' });
    expect(result.allowed).toBe(true);
  });

  it('authorized_pilot_coordinator role is allowed through access gate', async () => {
    const progId = await createActiveProgram();
    const result = await checkPilotAccess({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'coordinator-hash', role: 'authorized_pilot_coordinator' });
    expect(result.allowed).toBe(true);
  });

  it.each(NON_ADMIN_ROLES)('%s role is denied through access gate when role not in allowedRoles', async (role) => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Admin Only',
      scopeSummarySafe: 'Admin scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['school_admin', 'system_admin', 'internal_operator', 'authorized_pilot_coordinator'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.createCohort({ pilotProgramId: progId, schoolId: SCHOOL_ID, name: 'C' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: `${role}-hash`, role, eligibilityStatus: 'eligible' });

    const result = await checkPilotAccess({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: `${role}-hash`, role });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });

  it('student role is denied when role not in allowedRoles', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Admin Only',
      scopeSummarySafe: 'Admin scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['school_admin', 'system_admin'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.createCohort({ pilotProgramId: progId, schoolId: SCHOOL_ID, name: 'C' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'student-hash', role: 'student', eligibilityStatus: 'eligible' });

    const result = await checkPilotAccess({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'student-hash', role: 'student' });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });
});
