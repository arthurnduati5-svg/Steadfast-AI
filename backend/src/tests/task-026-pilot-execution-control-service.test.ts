import { describe, it, expect, beforeEach } from 'vitest';
import {
  startPilotExecution,
  pausePilotExecution,
  resumePilotExecution,
  requestPilotRollback,
  completePilotExecution,
  enableKillSwitch,
  disableKillSwitch,
} from '../services/task026PilotExecutionControlService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { setupPilotTestEnvironment } from './task-026-test-helper';

describe('Task 026 Pilot Execution Control Service', () => {
  let pilotProgramId: string;

  beforeEach(async () => {
    task025PilotRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK026_REQUIRE_REAL_PRISMA;

    const env = await setupPilotTestEnvironment();
    pilotProgramId = env.pilotProgramId;
  });

  it('should start pilot execution', async () => {
    task026PilotExecutionRepository._clearMemory();
    const result = await startPilotExecution({
      pilotProgramId,
      schoolId: 'school-1',
      actorRole: 'admin',
      actorIdHash: 'admin-1',
    });

    expect(result.ok).toBe(true);
    expect(result.executionRunId).toBeTruthy();
    expect(result.studentAccessBlocked).toBe(false);
    expect(result.newStatus).toBe('active');

    const run = await task026PilotExecutionRepository.getExecutionRun(result.executionRunId!);
    expect((run as any).status).toBe('active');
  });

  it('should fail start if program not approved', async () => {
    const p2 = await task025PilotRepository.createPilotProgram({
      schoolId: 'school-1',
      name: 'Unapproved',
      scopeSummarySafe: 'test',
      createdByRole: 'admin',
      approvalStatus: 'pending',
    });

    const result = await startPilotExecution({
      pilotProgramId: (p2 as any).id,
      schoolId: 'school-1',
      actorRole: 'admin',
    });

    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('pilot_not_approved');
  });

  it('should pause execution and block sessions', async () => {
    task026PilotExecutionRepository._clearMemory();
    const start = await startPilotExecution({
      pilotProgramId,
      schoolId: 'school-1',
      actorRole: 'admin',
    });

    const result = await pausePilotExecution(start.executionRunId!, 'admin', 'admin-1');
    expect(result.ok).toBe(true);
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.newStatus).toBe('paused');

    const run = await task026PilotExecutionRepository.getExecutionRun(start.executionRunId!);
    expect((run as any).status).toBe('paused');
  });

  it('should resume execution', async () => {
    task026PilotExecutionRepository._clearMemory();
    const start = await startPilotExecution({
      pilotProgramId,
      schoolId: 'school-1',
      actorRole: 'admin',
    });

    await pausePilotExecution(start.executionRunId!, 'admin');
    const result = await resumePilotExecution(start.executionRunId!, 'admin', 'admin-1');
    expect(result.ok).toBe(true);
    expect(result.newStatus).toBe('active');

    const run = await task026PilotExecutionRepository.getExecutionRun(start.executionRunId!);
    expect((run as any).status).toBe('active');
  });

  it('should rollback execution and block sessions', async () => {
    task026PilotExecutionRepository._clearMemory();
    const start = await startPilotExecution({
      pilotProgramId,
      schoolId: 'school-1',
      actorRole: 'admin',
    });

    const result = await requestPilotRollback(start.executionRunId!, 'admin', 'admin-1');
    expect(result.ok).toBe(true);
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.newStatus).toBe('rolled_back');
    expect(result.dataDestructivelyDeleted).toBe(false);

    const run = await task026PilotExecutionRepository.getExecutionRun(start.executionRunId!);
    expect((run as any).status).toBe('rolled_back');

    const audits = await task026PilotExecutionRepository.listAuditRecords(start.executionRunId!);
    const rollbackAudits = audits.filter((a: any) => a.action.includes('rolled_back'));
    expect(rollbackAudits.length).toBeGreaterThanOrEqual(1);
  });

  it('should enable kill switch and block sessions', async () => {
    task026PilotExecutionRepository._clearMemory();
    const start = await startPilotExecution({
      pilotProgramId,
      schoolId: 'school-1',
      actorRole: 'admin',
    });

    const result = await enableKillSwitch(start.executionRunId!, 'admin', 'admin-1');
    expect(result.ok).toBe(true);
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.newStatus).toBe('blocked');
  });

  it('should complete execution', async () => {
    task026PilotExecutionRepository._clearMemory();
    const start = await startPilotExecution({
      pilotProgramId,
      schoolId: 'school-1',
      actorRole: 'admin',
    });

    const result = await completePilotExecution(start.executionRunId!, 'admin', 'admin-1');
    expect(result.ok).toBe(true);
    expect(result.studentAccessBlocked).toBe(true);
    expect(result.newStatus).toBe('completed');

    const run = await task026PilotExecutionRepository.getExecutionRun(start.executionRunId!);
    expect((run as any).status).toBe('completed');
    expect((run as any).completedAt).toBeTruthy();
  });

  it('should preserve audit trail on rollback', async () => {
    task026PilotExecutionRepository._clearMemory();
    const start = await startPilotExecution({
      pilotProgramId,
      schoolId: 'school-1',
      actorRole: 'admin',
    });

    await requestPilotRollback(start.executionRunId!, 'admin');

    const audits = await task026PilotExecutionRepository.listAuditRecords(start.executionRunId!);
    expect(audits.length).toBeGreaterThan(0);
    expect(audits.every((a: any) => !a.dataDestructivelyDeleted)).toBe(true);
  });

  it('should deny kill switch disable for non-admin', async () => {
    task026PilotExecutionRepository._clearMemory();
    const start = await startPilotExecution({
      pilotProgramId,
      schoolId: 'school-1',
      actorRole: 'admin',
    });

    const result = await disableKillSwitch(start.executionRunId!, 'teacher', 'teacher-1');
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('admin_only');
  });
});
