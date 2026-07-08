import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';
import { evaluatePilotReadiness } from '../services/task025PilotReadinessService';

describe('task025RoutesParentDeniedContract', () => {
  beforeEach(async () => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  async function createProgram(additionalRoles: string[] = []) {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Parent Denied Program',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['school_admin', ...additionalRoles],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.createCohort({ pilotProgramId: progId, schoolId: SCHOOL_ID, name: 'C' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'parent-hash', role: 'parent', eligibilityStatus: 'eligible' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'admin-hash', role: 'school_admin', eligibilityStatus: 'eligible' });
    return progId;
  }

  it('parent role is not allowed in a program that only lists admin roles', async () => {
    const progId = await createProgram();
    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'parent-hash',
      role: 'parent',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('role_not_allowed');
  });

  it('parent role is allowed when program includes parent in allowedRoles', async () => {
    const progId = await createProgram(['parent']);
    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'parent-hash',
      role: 'parent',
    });
    expect(result.allowed).toBe(true);
  });

  it('admin can still access program where parent is denied', async () => {
    const progId = await createProgram(['parent']);
    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'admin-hash',
      role: 'school_admin',
    });
    expect(result.allowed).toBe(true);
  });
});
