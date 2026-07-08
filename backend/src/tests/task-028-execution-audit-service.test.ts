import { describe, it, expect, beforeEach } from 'vitest';
import { recordAuditEvent, listAuditEvents } from '../services/task028ExpansionExecutionAuditService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Execution Audit Service', () => {
  let executionRunId: string;

  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  it('should record an audit event', async () => {
    const result = await recordAuditEvent({
      executionRunId: 'run-1', pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', action: 'expansion_run_created',
      safeSummary: 'Run created successfully',
    });
    expect(result.ok).toBe(true);
    expect(result.auditId).toBeTruthy();
  });

  it('should record audit event with all optional fields', async () => {
    const result = await recordAuditEvent({
      executionRunId: 'run-1', stageId: 'stage-1', pilotProgramId: 'pp-1',
      schoolId: 'school-1', actorRole: 'operator', actorIdHash: 'op-hash',
      action: 'cohort_activated', safeSummary: 'Cohort activated',
      metadataSafeJson: { cohortSize: 50 }, requestId: 'req-1', correlationId: 'corr-1',
    });
    expect(result.ok).toBe(true);
    expect(result.auditId).toBeTruthy();
  });

  it('should list all audit events', async () => {
    await recordAuditEvent({
      executionRunId: 'run-1', pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', action: 'event_1', safeSummary: 'Event 1',
    });
    await recordAuditEvent({
      executionRunId: 'run-1', pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', action: 'event_2', safeSummary: 'Event 2',
    });
    const events = await listAuditEvents('run-1');
    expect(events.length).toBe(2);
  });

  it('should list audit events without runId filter', async () => {
    await recordAuditEvent({
      executionRunId: 'run-1', pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', action: 'test', safeSummary: 'Test',
    });
    const all = await listAuditEvents();
    expect(all.length).toBe(1);
  });

  it('should respect limit parameter', async () => {
    for (let i = 0; i < 5; i++) {
      await recordAuditEvent({
        executionRunId: 'run-1', pilotProgramId: 'pp-1', schoolId: 'school-1',
        actorRole: 'admin', action: `event_${i}`, safeSummary: `Event ${i}`,
      });
    }
    const limited = await listAuditEvents('run-1', 2);
    expect(limited.length).toBe(2);
  });

  it('should store action correctly', async () => {
    await recordAuditEvent({
      executionRunId: 'run-1', pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', action: 'rollback_executed', safeSummary: 'Rolled back',
    });
    const events = await listAuditEvents('run-1');
    expect(events[0].action).toBe('rollback_executed');
  });

  it('should store actorRole correctly', async () => {
    await recordAuditEvent({
      executionRunId: 'run-1', pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'internal_operator', action: 'test_action', safeSummary: 'Test',
    });
    const events = await listAuditEvents('run-1');
    expect(events[0].actorRole).toBe('internal_operator');
  });

  it('should handle empty audit list', async () => {
    const events = await listAuditEvents('nonexistent-run');
    expect(events).toEqual([]);
  });
});
