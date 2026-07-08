import { describe, it, expect, beforeEach } from 'vitest';
import { executeRollback } from '../services/task028ExpansionRollbackExecutionService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Rollback Execution Service', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1',
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      status: 'stage_1_active',
      safeSummary: 'Active expansion for rollback test',
    });
    executionRunId = (run as any).id;
  });

  it('should execute rollback and block access', async () => {
    const result = await executeRollback(executionRunId, 'operator', 'op-hash', 'Critical safety issue');
    expect(result.ok).toBe(true);
    expect(result.rollbackId).toBeTruthy();
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.newStatus).toBe('rolled_back');

    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    expect((run as any).status).toBe('rolled_back');
  });

  it('should preserve audit trail on rollback', async () => {
    await executeRollback(executionRunId, 'operator', 'op-hash', 'Rolling back stage 1');
    const audits = await task028ExpansionExecutionRepository.listAuditRecords(executionRunId);
    const rollbackAudits = audits.filter((a: any) =>
      a.action === 'rollback_executed' || a.action === 'state_transition_rollback_requested' || a.action === 'state_transition_rolled_back'
    );
    expect(rollbackAudits.length).toBeGreaterThanOrEqual(2);
  });

  it('should preserve learning evidence (dataDeleted = false, auditPreserved = true)', async () => {
    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
      activationStatus: 'active',
    });
    const result = await executeRollback(executionRunId, 'operator', 'op-hash', 'Rollback test');
    expect(result.dataDestructivelyDeleted).toBe(false);
    expect(result.auditPreserved).toBe(true);
    expect(result.affectedParticipantCount).toBeGreaterThanOrEqual(1);
  });

  it('should transition participants to rolled_back status', async () => {
    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      actorIdHash: 'student-1',
      role: 'student',
      activationStatus: 'active',
    });
    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      actorIdHash: 'student-2',
      role: 'student',
      activationStatus: 'pending',
    });
    await executeRollback(executionRunId, 'operator', 'op-hash', 'Rollback');
    const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(executionRunId);
    expect(participants.every((p: any) => p.activationStatus === 'rolled_back')).toBe(true);
  });

  it('should fail for non-existent run', async () => {
    const result = await executeRollback('nonexistent', 'operator', 'op-hash', 'Test');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('execution_run_not_found');
  });
});
