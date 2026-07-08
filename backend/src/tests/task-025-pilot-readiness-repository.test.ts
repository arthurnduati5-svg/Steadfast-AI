import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotReadinessRepository } from '../services/task025PilotReadinessRepository';

describe('task025PilotReadinessRepository', () => {
  beforeEach(() => {
    task025PilotReadinessRepository.clearStores();
  });

  const SCHOOL_ID = 'school-001';
  const SCHOOL_ID_2 = 'school-002';

  it('writeAuditEvent stores a record and returns it', () => {
    const event = task025PilotReadinessRepository.writeAuditEvent(
      SCHOOL_ID,
      'system_admin',
      'readiness_check_run',
      'All checks passed',
      'req-001',
    );

    expect(event).toBeDefined();
    expect(event.id).toMatch(/^t025-/);
    expect(event.schoolId).toBe(SCHOOL_ID);
    expect(event.actorRole).toBe('system_admin');
    expect(event.eventType).toBe('readiness_check_run');
    expect(event.requestId).toBe('req-001');
  });

  it('listAuditEvents returns all events when no schoolId filter', () => {
    task025PilotReadinessRepository.writeAuditEvent(SCHOOL_ID, 'admin', 'scope_evaluated', 'Scope ok', 'r1');
    task025PilotReadinessRepository.writeAuditEvent(SCHOOL_ID_2, 'admin', 'scope_evaluated', 'Scope ok 2', 'r2');

    const events = task025PilotReadinessRepository.listAuditEvents();
    expect(events).toHaveLength(2);
  });

  it('listAuditEvents filters by schoolId', () => {
    task025PilotReadinessRepository.writeAuditEvent(SCHOOL_ID, 'admin', 'scope_evaluated', 'Scope ok', 'r1');
    task025PilotReadinessRepository.writeAuditEvent(SCHOOL_ID_2, 'admin', 'scope_evaluated', 'Scope ok 2', 'r2');

    const events = task025PilotReadinessRepository.listAuditEvents(SCHOOL_ID);
    expect(events).toHaveLength(1);
    expect(events[0].schoolId).toBe(SCHOOL_ID);
  });

  it('listAuditEvents respects limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      task025PilotReadinessRepository.writeAuditEvent(SCHOOL_ID, 'admin', 'readiness_check_run', `Event ${i}`, `r${i}`);
    }

    const events = task025PilotReadinessRepository.listAuditEvents(undefined, 3);
    expect(events).toHaveLength(3);
  });

  it('writeReadinessCheck stores a check record', () => {
    task025PilotReadinessRepository.writeReadinessCheck(
      SCHOOL_ID,
      'scope_gate',
      'passed',
      'Scope gate passed',
      [],
    );

    const checks = task025PilotReadinessRepository.listReadinessChecks(SCHOOL_ID);
    expect(checks).toHaveLength(1);
    expect(checks[0].schoolId).toBe(SCHOOL_ID);
    expect(checks[0].checkType).toBe('scope_gate');
    expect(checks[0].status).toBe('passed');
  });

  it('listReadinessChecks filters by schoolId', () => {
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'scope_gate', 'passed', 'Pass', []);
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID_2, 'scope_gate', 'failed', 'Fail', ['issue']);

    const checks = task025PilotReadinessRepository.listReadinessChecks(SCHOOL_ID);
    expect(checks).toHaveLength(1);
  });

  it('listReadinessChecks respects limit parameter', () => {
    for (let i = 0; i < 10; i++) {
      task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'check', 'passed', `Check ${i}`, []);
    }

    const checks = task025PilotReadinessRepository.listReadinessChecks(SCHOOL_ID, 3);
    expect(checks).toHaveLength(3);
  });

  it('getReadinessDiagnostics returns zeroes when no checks exist', () => {
    const diag = task025PilotReadinessRepository.getReadinessDiagnostics(SCHOOL_ID);

    expect(diag.totalChecks).toBe(0);
    expect(diag.passedChecks).toBe(0);
    expect(diag.failedChecks).toBe(0);
    expect(diag.recentBlockers).toHaveLength(0);
  });

  it('getReadinessDiagnostics computes passed and failed counts', () => {
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'scope', 'passed', 'Pass', []);
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'cohort', 'passed', 'Pass', []);
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'teacher', 'failed', 'Fail', ['no teacher']);
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'privacy', 'blocked', 'Blocked', ['no privacy']);

    const diag = task025PilotReadinessRepository.getReadinessDiagnostics(SCHOOL_ID);

    expect(diag.totalChecks).toBe(4);
    expect(diag.passedChecks).toBe(2);
    expect(diag.failedChecks).toBe(2);
  });

  it('getReadinessDiagnostics returns recent blockers from failed checks', () => {
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'scope', 'failed', 'Scope issue', ['Fix scope']);
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'privacy', 'blocked', 'Privacy issue', ['Fix privacy']);

    const diag = task025PilotReadinessRepository.getReadinessDiagnostics(SCHOOL_ID);

    expect(diag.recentBlockers).toHaveLength(2);
    expect(diag.recentBlockers[0].severity).toBe('high');
    expect(diag.recentBlockers[0].requiredAction).toContain('Fix scope');
  });

  it('getReadinessDiagnostics does not include other schools checks', () => {
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'scope', 'passed', 'Pass', []);
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID_2, 'scope', 'failed', 'Fail', ['x']);

    const diag = task025PilotReadinessRepository.getReadinessDiagnostics(SCHOOL_ID);

    expect(diag.totalChecks).toBe(1);
    expect(diag.passedChecks).toBe(1);
    expect(diag.failedChecks).toBe(0);
  });

  it('clearStores removes all records', () => {
    task025PilotReadinessRepository.writeAuditEvent(SCHOOL_ID, 'admin', 'scope_evaluated', 'x', 'r1');
    task025PilotReadinessRepository.writeReadinessCheck(SCHOOL_ID, 'scope', 'passed', 'x', []);

    task025PilotReadinessRepository.clearStores();

    expect(task025PilotReadinessRepository.listAuditEvents()).toHaveLength(0);
    expect(task025PilotReadinessRepository.listReadinessChecks()).toHaveLength(0);
  });
});
