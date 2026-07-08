import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { pausePilot, rollbackPilot, engageKillSwitch } from '../services/task025PilotRollbackService';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';

describe('task025PilotRollbackService', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';
  let PROGRAM_ID: string = '';

  async function setupActivePilot() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Rollback Test',
      scopeSummarySafe: 'Rollback scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student'],
      createdByRole: 'admin',
    });
    PROGRAM_ID = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(PROGRAM_ID, 'active', 'admin');
    await task025PilotRepository.createCohort({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      name: 'Rollback Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
  }

  it('pause changes status to paused', async () => {
    await setupActivePilot();
    const result = await pausePilot(PROGRAM_ID, 'admin', 'admin-hash');
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('paused');
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.dataDestructivelyDeleted).toBe(false);
    expect(result.auditPreserved).toBe(true);
  });

  it('rollback changes status to rolled_back', async () => {
    await setupActivePilot();
    const result = await rollbackPilot(PROGRAM_ID, 'admin', 'admin-hash');
    expect(result.success).toBe(true);
    expect(result.newStatus).toBe('rolled_back');
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.dataDestructivelyDeleted).toBe(false);
    expect(result.auditPreserved).toBe(true);
  });

  it('kill switch blocks student access', async () => {
    await setupActivePilot();
    await engageKillSwitch(PROGRAM_ID, 'admin', 'admin-hash');

    const accessResult = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash',
      role: 'student',
    });
    expect(accessResult.allowed).toBe(false);
    expect(accessResult.reasonCodes).toContain('pilot_rolled_back');
  });

  it('rollback preserves audit trail', async () => {
    await setupActivePilot();
    await rollbackPilot(PROGRAM_ID, 'admin', 'admin-hash');
    const records = await task025PilotRepository.listAuditRecords(PROGRAM_ID);
    expect(records.length).toBeGreaterThan(0);
    expect(records.some((r: any) => r.action === 'pilot_rolled_back')).toBe(true);
  });

  it('rollback does not delete learning evidence', async () => {
    await setupActivePilot();
    const result = await rollbackPilot(PROGRAM_ID, 'admin', 'admin-hash');
    expect(result.dataDestructivelyDeleted).toBe(false);
  });

  it('pause returns error for nonexistent program', async () => {
    const result = await pausePilot('nonexistent', 'admin');
    expect(result.success).toBe(false);
  });

  it('rollback returns error for nonexistent program', async () => {
    const result = await rollbackPilot('nonexistent', 'admin');
    expect(result.success).toBe(false);
  });

  it('kill switch audit records are created', async () => {
    await setupActivePilot();
    await engageKillSwitch(PROGRAM_ID, 'admin', 'admin-hash');
    const records = await task025PilotRepository.listAuditRecords(PROGRAM_ID);
    expect(records.some((r: any) => r.action === 'kill_switch_engaged')).toBe(true);
  });

  it('student receives safe unavailable response after rollback', async () => {
    await setupActivePilot();
    await rollbackPilot(PROGRAM_ID, 'admin', 'admin-hash');
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash',
      role: 'student',
    });
    expect(result.allowed).toBe(false);
    expect(result.safeMessage).toBe('This pilot is not available for this account or school context.');
  });
});
