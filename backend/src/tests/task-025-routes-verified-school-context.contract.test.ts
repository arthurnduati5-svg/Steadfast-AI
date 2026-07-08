import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';
import { evaluatePilotReadiness } from '../services/task025PilotReadinessService';

describe('task025RoutesVerifiedSchoolContextContract', () => {
  beforeEach(async () => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  it('blocks access when schoolId is empty', async () => {
    const result = await checkPilotAccess({
      pilotProgramId: 'any',
      schoolId: '',
      actorIdHash: 'user',
      role: 'school_admin',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('blocks access when schoolId is unknown', async () => {
    const result = await checkPilotAccess({
      pilotProgramId: 'any',
      schoolId: 'unknown',
      actorIdHash: 'user',
      role: 'school_admin',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('blocks access when schoolId does not match the program school', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'School A Program',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['school_admin'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');

    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: 'school-002',
      actorIdHash: 'admin-hash',
      role: 'school_admin',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('school_mismatch');
  });

  it('allows access when school context is verified and matches', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Verified School Program',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['school_admin'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.createCohort({ pilotProgramId: progId, schoolId: SCHOOL_ID, name: 'C' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: SCHOOL_ID, actorIdHash: 'admin-hash', role: 'school_admin', eligibilityStatus: 'eligible' });

    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'admin-hash',
      role: 'school_admin',
    });
    expect(result.allowed).toBe(true);
  });
});
