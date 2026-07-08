import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import {
  evaluatePilotReadiness,
  getPilotReadinessStatus,
  assertPilotCanStart,
  listPilotBlockingIssues,
} from '../services/task025PilotReadinessService';

describe('task025PilotReadinessService', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  async function createMinimalPilotProgram() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Test Pilot',
      scopeSummarySafe: 'Test scope',
      allowedSubjects: ['Mathematics'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student', 'teacher'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(progId, 'ready', 'admin');
    return progId;
  }

  it('returns not found readiness for nonexistent program', async () => {
    const readiness = await getPilotReadinessStatus('nonexistent');
    expect(readiness).toBeNull();
  });

  it('reports blocking issues when no cohort configured', async () => {
    const progId = await createMinimalPilotProgram();
    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.safeToStartPilot).toBe(false);
    expect(readiness.blockingIssues.some((i) => i.includes('cohort'))).toBe(true);
  });

  it('reports blocking issues when no eligible participants', async () => {
    const progId = await createMinimalPilotProgram();
    await task025PilotRepository.createCohort({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      name: 'Test Cohort',
    });
    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.safeToStartPilot).toBe(false);
    expect(readiness.participantScopeValid).toBe(false);
  });

  it('passes readiness when all gates pass', async () => {
    const progId = await createMinimalPilotProgram();
    await task025PilotRepository.createCohort({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      name: 'Test Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'teacher-hash-001',
      role: 'teacher',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-001',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.writeDryRun({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      status: 'passed',
      scenarioName: 'pre-activation-dry-run',
      checksPassed: ['all'],
      checksFailed: [],
      safeSummary: 'Dry run passed',
    });

    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.safeToStartPilot).toBe(true);
    expect(readiness.pilotProgramExists).toBe(true);
    expect(readiness.pilotProgramApproved).toBe(true);
    expect(readiness.pilotProgramStatusValid).toBe(true);
    expect(readiness.schoolIdentityVerified).toBe(true);
    expect(readiness.cohortConfigured).toBe(true);
    expect(readiness.participantScopeValid).toBe(true);
    expect(readiness.teacherAdminAccessConfigured).toBe(true);
    expect(readiness.curriculumScopeApproved).toBe(true);
    expect(readiness.rollbackReady).toBe(true);
    expect(readiness.killSwitchReady).toBe(true);
    expect(readiness.dryRunPassed).toBe(true);
  });

  it('assertPilotCanStart returns ok when ready', async () => {
    const progId = await createMinimalPilotProgram();
    await task025PilotRepository.createCohort({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      name: 'Test Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'teacher-hash-002',
      role: 'teacher',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-002',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.writeDryRun({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      status: 'passed',
      scenarioName: 'assert-test-dry-run',
      checksPassed: ['all'],
      checksFailed: [],
      safeSummary: 'Dry run passed',
    });

    const result = await assertPilotCanStart(progId);
    expect(result.ok).toBe(true);
  });

  it('assertPilotCanStart returns not ok for nonexistent program', async () => {
    const result = await assertPilotCanStart('nonexistent');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('pilot_program_not_found');
  });

  it('listPilotBlockingIssues returns issues for incomplete program', async () => {
    const progId = await createMinimalPilotProgram();
    const issues = await listPilotBlockingIssues(progId);
    expect(Array.isArray(issues)).toBe(true);
    expect(issues.length).toBeGreaterThan(0);
  });

  it('pilot cannot start without verified school identity', async () => {
    const progId = await createMinimalPilotProgram();
    const readiness = await evaluatePilotReadiness(progId, '');
    expect(readiness.safeToStartPilot).toBe(false);
    expect(readiness.schoolIdentityVerified).toBe(false);
  });

  it('pilot cannot start without cohort', async () => {
    const progId = await createMinimalPilotProgram();
    await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash-003',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.cohortConfigured).toBe(false);
    expect(readiness.safeToStartPilot).toBe(false);
  });

  it('pilot cannot start without eligible participants', async () => {
    const progId = await createMinimalPilotProgram();
    await task025PilotRepository.createCohort({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      name: 'Empty Cohort',
    });
    const readiness = await evaluatePilotReadiness(progId, SCHOOL_ID);
    expect(readiness.participantScopeValid).toBe(false);
    expect(readiness.safeToStartPilot).toBe(false);
  });
});
