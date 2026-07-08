import { describe, it, expect, beforeEach } from 'vitest';
import {
  pauseExpansion,
  resumeExpansion,
  enableKillSwitch,
  disableKillSwitch,
  requestIntervention,
  completeIntervention,
} from '../services/task028ExpansionInterventionService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Expansion Intervention Service', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1',
      status: 'stage_1_active', safeSummary: 'Active expansion for intervention test',
    });
    executionRunId = (run as any).id;

    await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId, stageNumber: 1, status: 'active', plannedStudentCount: 10,
      plannedTeacherCount: 2, safeSummary: 'Stage 1', allowedClassIds: ['class-1'],
      allowedSubjectIds: ['subject-1'], allowedCurriculumScopes: ['scope-1'],
    });
  });

  it('should pause execution', async () => {
    const result = await pauseExpansion(executionRunId, 'admin', 'admin-hash');
    expect(result.ok).toBe(true);
    expect(result.interventionId).toBeTruthy();
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.newStatus).toBe('paused');
    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('paused');
  });

  it('should resume execution from paused state', async () => {
    await pauseExpansion(executionRunId, 'admin', 'admin-hash');
    const result = await resumeExpansion(executionRunId, 'admin', 'admin-hash');
    expect(result.ok).toBe(true);
    expect(result.newStatus).toBe('stage_1_active');
    expect(result.studentAccessBlocked).toBe(false);
    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('stage_1_active');
  });

  it('should reject pause by non-admin/operator', async () => {
    const result = await pauseExpansion(executionRunId, 'student', 'student-hash');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('admin_or_operator_only');
  });

  it('should enable kill switch', async () => {
    const result = await enableKillSwitch(executionRunId, 'admin', 'admin-hash');
    expect(result.ok).toBe(true);
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.newStatus).toBe('blocked');
    const audits = await task028ExpansionExecutionRepository.listAuditRecords(executionRunId);
    expect(audits.some((a: any) => a.action === 'kill_switch_engaged')).toBe(true);
  });

  it('should disable kill switch', async () => {
    await task028ExpansionExecutionRepository.updateExecutionRun(executionRunId, { killSwitchEnabled: true, status: 'blocked' });
    const result = await disableKillSwitch(executionRunId, 'admin', 'admin-hash');
    expect(result.ok).toBe(true);
    expect(result.newStatus).toBe('paused');
  });

  it('should reject kill switch disable by non-admin', async () => {
    const result = await disableKillSwitch(executionRunId, 'operator', 'op-hash');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('admin_only');
  });

  it('should request an intervention', async () => {
    const result = await requestIntervention(executionRunId, 'pause_execution', 'teacher', 'teacher-hash-1', 'Teacher requested pause');
    expect(result.ok).toBe(true);
    expect(result.interventionId).toBeTruthy();
  });

  it('should complete an intervention', async () => {
    const request = await requestIntervention(executionRunId, 'pause_execution', 'teacher', 'teacher-hash-1', 'Teacher requested pause');
    const result = await completeIntervention(request.interventionId!, 'admin', 'admin-hash', 'Completed', executionRunId, 'pp-1', 'school-1');
    expect(result.ok).toBe(true);
  });

  it('should reject complete intervention by non-admin/operator', async () => {
    const request = await requestIntervention(executionRunId, 'pause_execution', 'teacher', 'teacher-hash', 'Test');
    const result = await completeIntervention(request.interventionId!, 'student');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('admin_or_operator_only');
  });
});
