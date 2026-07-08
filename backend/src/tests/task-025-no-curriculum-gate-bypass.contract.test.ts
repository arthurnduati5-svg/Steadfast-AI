import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { evaluatePilotReadiness } from '../services/task025PilotReadinessService';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';

describe('task025NoCurriculumGateBypassContract', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  async function createProgram(opts: { name: string; subjects?: string[]; tracks?: string[]; roles?: string[] }) {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: opts.name,
      scopeSummarySafe: 'Scope',
      allowedSubjects: opts.subjects,
      allowedCurriculumTracks: opts.tracks,
      allowedRoles: opts.roles,
      createdByRole: 'admin',
    });
    return (program as any).id;
  }

  it('pilot cannot start without curriculum scope', async () => {
    const progId = await createProgram({ name: 'No Curriculum' });
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
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
      scenarioName: 'pre',
      checksPassed: ['all'],
      checksFailed: [],
      safeSummary: 'Passed',
    });

    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.curriculumScopeApproved).toBe(false);
    expect(readiness.safeToStartPilot).toBe(false);
  });

  it('pilot access gate denies subject outside scope', async () => {
    const progId = await createProgram({ name: 'Math Only', subjects: ['Mathematics'], tracks: ['cambridge_igcse'], roles: ['student'] });
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student',
      role: 'student',
      eligibilityStatus: 'eligible',
    });

    const scienceResult = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student',
      role: 'student',
      subject: 'Science',
    });
    expect(scienceResult.allowed).toBe(false);
    expect(scienceResult.reasonCodes).toContain('subject_not_in_pilot_scope');

    const mathResult = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student',
      role: 'student',
      subject: 'Mathematics',
    });
    expect(mathResult.allowed).toBe(true);
  });

  it('pilot access gate denies curriculum track outside scope', async () => {
    const progId = await createProgram({ name: 'Track Limited', subjects: ['Math'], tracks: ['cambridge_igcse'], roles: ['student'] });
    await task025PilotRepository.updatePilotProgramStatus(progId, 'active', 'admin');
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student',
      role: 'student',
      eligibilityStatus: 'eligible',
    });

    const saudiTrack = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student',
      role: 'student',
      curriculumTrack: 'saudi_national',
    });
    expect(saudiTrack.allowed).toBe(false);

    const cambridgeTrack = await checkPilotAccess({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student',
      role: 'student',
      curriculumTrack: 'cambridge_igcse',
    });
    expect(cambridgeTrack.allowed).toBe(true);
  });

  it('preflight fails when approved sources are missing', async () => {
    const progId = await createProgram({ name: 'No Sources' });
    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.curriculumScopeApproved).toBe(false);
  });

  it('preflight cannot start with missing curriculum scope even with all other checks passing', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'All But Curriculum',
      scopeSummarySafe: 'Scope',
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
      scenarioName: 'pre',
      checksPassed: ['all'],
      checksFailed: [],
      safeSummary: 'Passed',
    });

    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.safeToStartPilot).toBe(false);
    expect(readiness.curriculumScopeApproved).toBe(false);
  });
});
