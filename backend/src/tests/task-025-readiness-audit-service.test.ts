import { describe, it, expect, beforeEach } from 'vitest';
import { queryReadinessAudit, writeReadinessAuditEvent } from '../services/task025ReadinessAuditService';
import { task025PilotReadinessRepository } from '../services/task025PilotReadinessRepository';

describe('task025ReadinessAuditService', () => {
  beforeEach(() => {
    task025PilotReadinessRepository.clearStores();
  });

  it('writeReadinessAuditEvent returns a well-formed audit event with all fields', async () => {
    const event = await writeReadinessAuditEvent('school-001', 'admin', 'readiness_check_run', 'Check completed.', 'req-1');
    expect(event.id).toBeDefined();
    expect(event.schoolId).toBe('school-001');
    expect(event.actorRole).toBe('admin');
    expect(event.eventType).toBe('readiness_check_run');
    expect(event.safeSummary).toBe('Check completed.');
    expect(event.requestId).toBe('req-1');
    expect(event.createdAt).toBeDefined();
  });

  it('queryReadinessAudit returns events written for a specific school', async () => {
    await writeReadinessAuditEvent('school-001', 'admin', 'scope_evaluated', 'Scope evaluated.', 'req-1');
    await writeReadinessAuditEvent('school-001', 'admin', 'decision_evaluated', 'Decision made.', 'req-2');

    const result = await queryReadinessAudit({ schoolId: 'school-001' });
    expect(result.totalCount).toBe(2);
    expect(result.records).toHaveLength(2);
    expect(result.records[0].eventType).toBe('scope_evaluated');
    expect(result.records[1].eventType).toBe('decision_evaluated');
  });

  it('queryReadinessAudit filters by schoolId and excludes other schools', async () => {
    await writeReadinessAuditEvent('school-001', 'admin', 'report_generated', 'Report done.', 'req-1');
    await writeReadinessAuditEvent('school-002', 'admin', 'diagnostics_viewed', 'Diagnostics viewed.', 'req-2');

    const result = await queryReadinessAudit({ schoolId: 'school-001' });
    expect(result.totalCount).toBe(1);
    expect(result.records[0].schoolId).toBe('school-001');
  });

  it('queryReadinessAudit returns empty array when no events match', async () => {
    const result = await queryReadinessAudit({ schoolId: 'nonexistent-school' });
    expect(result.totalCount).toBe(0);
    expect(result.records).toHaveLength(0);
  });

  it('queryReadinessAudit respects limit parameter', async () => {
    for (let i = 0; i < 10; i++) {
      await writeReadinessAuditEvent('school-001', 'admin', 'readiness_check_run', `Event ${i}`, `req-${i}`);
    }

    const fullResult = await queryReadinessAudit({ schoolId: 'school-001' });
    expect(fullResult.totalCount).toBe(10);

    const limitedResult = await queryReadinessAudit({ schoolId: 'school-001', limit: 3 });
    expect(limitedResult.totalCount).toBe(3);
    expect(limitedResult.records).toHaveLength(3);
  });

  it('writeReadinessAuditEvent supports all audit event types', async () => {
    const eventTypes = [
      'report_generated',
      'diagnostics_viewed',
      'audit_viewed',
      'scope_evaluated',
      'cohort_readiness_checked',
      'teacher_workflow_validated',
    ] as const;

    for (const et of eventTypes) {
      const event = await writeReadinessAuditEvent('school-001', 'internal_operator', et, `${et} occurred.`, `req-${et}`);
      expect(event.eventType).toBe(et);
    }

    const result = await queryReadinessAudit({ schoolId: 'school-001' });
    expect(result.totalCount).toBe(eventTypes.length);
  });
});
