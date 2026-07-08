import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { evaluatePilotReadiness } from '../services/task025PilotReadinessService';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';

describe('task025PilotRoutesAdminScope', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  it('admin can run preflight', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Preflight Test',
      scopeSummarySafe: 'Preflight scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['track_a'],
      allowedRoles: ['student', 'teacher'],
      createdByRole: 'admin',
    });
    await task025PilotRepository.updatePilotProgramStatus((program as any).id, 'ready', 'admin');

    const readiness = await evaluatePilotReadiness((program as any).id, SCHOOL_ID);
    expect(readiness.pilotProgramExists).toBe(true);
  });

  it('preflight fails when curriculum scope missing', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'No Curriculum',
      scopeSummarySafe: 'Scope',
      createdByRole: 'admin',
    });
    const readiness = await evaluatePilotReadiness((program as any).id, SCHOOL_ID);
    expect(readiness.curriculumScopeApproved).toBe(false);
  });

  it('preflight fails when rollback not enabled', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'No Rollback',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['track_a'],
      allowedRoles: ['student'],
      createdByRole: 'admin',
      rollbackEnabled: false,
    });
    const readiness = await evaluatePilotReadiness((program as any).id, SCHOOL_ID);
    expect(readiness.rollbackReady).toBe(false);
  });

  it('preflight fails when kill switch not enabled', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'No Kill Switch',
      scopeSummarySafe: 'Scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['track_a'],
      allowedRoles: ['student'],
      createdByRole: 'admin',
      killSwitchEnabled: false,
    });
    const readiness = await evaluatePilotReadiness((program as any).id, SCHOOL_ID);
    expect(readiness.killSwitchReady).toBe(false);
  });

  it('admin can create program, cohort, participants', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Admin Flow',
      scopeSummarySafe: 'Flow scope',
      allowedSubjects: ['Math', 'Science'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student', 'teacher'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;

    const cohort = await task025PilotRepository.createCohort({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      name: 'Admin Cohort',
    });
    expect((cohort as any).id).toBeDefined();

    const participant = await task025PilotRepository.addParticipant({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorIdHash: 'admin-added-student',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
    expect((participant as any).id).toBeDefined();

    const participants = await task025PilotRepository.listParticipants(progId);
    expect(participants.length).toBe(1);
  });

  it('audit records are written for admin actions', async () => {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Audit Test',
      scopeSummarySafe: 'Audit scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['track_a'],
      allowedRoles: ['student'],
      createdByRole: 'admin',
    });
    const progId = (program as any).id;

    await task025PilotRepository.writeAuditRecord({
      pilotProgramId: progId,
      schoolId: SCHOOL_ID,
      actorRole: 'admin',
      action: 'test_action',
      safeSummary: 'Test audit action',
    });

    const records = await task025PilotRepository.listAuditRecords(progId);
    expect(records.length).toBe(1);
    expect(records[0].action).toBe('test_action');
  });
});
