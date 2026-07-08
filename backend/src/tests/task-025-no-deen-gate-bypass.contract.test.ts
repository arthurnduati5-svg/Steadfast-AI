import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { evaluatePilotReadiness } from '../services/task025PilotReadinessService';
import { runPilotDryRun } from '../services/task025PilotDryRunService';

describe('task025NoDeenGateBypassContract', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  async function createProgram(opts: { name: string; subjects?: string[]; tracks?: string[]; roles?: string[] }) {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: opts.name,
      scopeSummarySafe: 'Scope',
      allowedSubjects: opts.subjects ?? ['Math'],
      allowedCurriculumTracks: opts.tracks ?? ['cambridge_igcse'],
      allowedRoles: opts.roles ?? ['student'],
      createdByRole: 'admin',
    });
    return (program as any).id;
  }

  it('Deen governance gate is evaluated in readiness check', async () => {
    const progId = await createProgram({ name: 'Deen Check' });
    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.deenGovernanceReady).toBe(true);
  });

  it('dry run checks Deen governance policy', async () => {
    const progId = await createProgram({ name: 'Deen Dry Run', roles: ['student', 'teacher'] });
    await task025PilotRepository.createCohort({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      name: 'Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'teacher',
      role: 'teacher',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
    const dryRun = await runPilotDryRun(progId, SCHOOL_ID, 'deen-dry-run');
    expect(dryRun.checksPassed).toContain('deen_governance_checked');
  });

  it('Deen-sensitive private text is not exposed in reports', async () => {
    const progId = await createProgram({ name: 'Deen Privacy', subjects: ['Islamic Studies'] });
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

    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    const serialized = JSON.stringify(readiness);

    expect(serialized).not.toContain('deenSensitive');
    expect(serialized).not.toContain('deen_sensitive');
    expect(serialized).not.toContain('fatwa');
    expect(serialized).not.toContain('sectarian');
  });

  it('pilot readiness reports fatwa-engine not introduced', async () => {
    const progId = await createProgram({ name: 'No Fatwa', subjects: ['Islamic Studies'] });
    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.deenGovernanceReady).toBe(true);
  });

  it('no Deen governance weakening introduced by pilot', async () => {
    const progId = await createProgram({ name: 'Deen Safe', subjects: ['Islamic Studies'] });
    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.deenGovernanceReady).toBe(true);
    expect(readiness.socraticSafetyReady).toBe(true);
    expect(readiness.privacyGateReady).toBe(true);
  });
});
