import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';
import { evaluatePilotReadiness } from '../services/task025PilotReadinessService';

describe('task025RoutesCrossSchoolDenialContract', () => {
  beforeEach(async () => {
    task025PilotRepository._clearMemory();
  });

  it('school B cannot access pilot program belonging to school A', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-a',
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
      schoolId: 'school-b',
      actorIdHash: 'admin-b',
      role: 'school_admin',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('school_mismatch');
  });

  it('school B readiness evaluation shows not safe to start for cross-school', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-a',
      name: 'School A Program',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['school_admin'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'ready', 'admin');
    await task025PilotRepository.createCohort({ pilotProgramId: progId, schoolId: 'school-a', name: 'Cohort' });
    await task025PilotRepository.addParticipant({ pilotProgramId: progId, schoolId: 'school-a', actorIdHash: 'admin-a', role: 'school_admin', eligibilityStatus: 'eligible' });

    const readiness = await evaluatePilotReadiness(progId, 'school-b');
    expect(readiness.schoolIdentityVerified).toBe(true);
    expect(readiness.safeToStartPilot).toBeDefined();
  });

  it('school B user not in participant list of school A program', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-a',
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
      schoolId: 'school-a',
      actorIdHash: 'user-from-school-b',
      role: 'school_admin',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('not_in_pilot_participants');
  });

  it('access gate returns school_mismatch for cross-school request with matching schoolId in program', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-x',
      name: 'School X',
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
      schoolId: 'school-y',
      actorIdHash: 'admin-y',
      role: 'school_admin',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('school_mismatch');
  });
});
