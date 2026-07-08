import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';
import { evaluatePilotReadiness } from '../services/task025PilotReadinessService';

describe('task025NoSchoolAuthBypassContract', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  async function createProgram() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Test',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student'],
      createdByRole: 'admin',
    });
    return (program as any).id;
  }

  it('pilot cannot start without verified school identity', async () => {
    const progId = await createProgram();
    const readiness = await evaluatePilotReadiness(progId, '');
    expect(readiness.safeToStartPilot).toBe(false);
    expect(readiness.schoolIdentityVerified).toBe(false);
  });

  it('pilot access gate denies access without school identity', async () => {
    const result = await checkPilotAccess({
      pilotProgramId: 'test',
      schoolId: '',
      actorIdHash: 'user',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('pilot access gate denies access with unknown school identity', async () => {
    const result = await checkPilotAccess({
      pilotProgramId: 'test',
      schoolId: 'unknown',
      actorIdHash: 'user',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.reasonCodes).toContain('no_verified_school_identity');
  });

  it('pilot access gate blocks access when school does not match pilot', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-a',
      name: 'School A Pilot',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active');

    const result = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: 'school-b',
      actorIdHash: 'user',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
  });

  it('pilot readiness requires school identity for all checks', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Readiness School Check',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student', 'teacher'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'ready', 'admin');
    await task025PilotRepository.createCohort({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      name: 'Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'teacher',
      role: 'teacher',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.writeDryRun({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      status: 'passed',
      scenarioName: 'pre-test',
      checksPassed: ['all'],
      checksFailed: [],
      safeSummary: 'Passed',
    });

    const readinessWithSchool = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readinessWithSchool.schoolIdentityVerified).toBe(true);

    const readinessWithoutSchool = await evaluatePilotReadiness(progId, '');
    expect(readinessWithoutSchool.schoolIdentityVerified).toBe(false);
  });
});
