import { describe, it, expect, beforeEach } from 'vitest';
import { recordOperationsAuditEvent, listOperationsAuditEvents } from '../services/task024OperationsAuditService';
import { task024ReadinessRepository } from '../services/task024OperationsReadinessRepository';

describe('Task024OperationsAuditService', () => {
  beforeEach(async () => {
    await task024ReadinessRepository.resetTask024OperationsReadinessRepositoryForTests();
  });

  it('should record audit event with safe metadata only', async () => {
    const event = await recordOperationsAuditEvent({
      schoolId: 'school_1',
      actorId: 'admin_1',
      actorRole: 'admin',
      operationEnvironment: 'local',
      component: 'test_component',
      eventType: 'operations_readiness_evaluated',
      safeReasonCodes: ['test_code'],
      safeMetadata: { count: 5, status: 'passed' },
    });
    expect(event.eventId).toBeTruthy();
    expect(event.schoolId).toBe('school_1');
    expect(event.actorId).toBe('admin_1');
    expect(event.safeMetadata?.count).toBe(5);
    expect(event.createdAt).toBeTruthy();
  });

  it('should list audit events', async () => {
    await recordOperationsAuditEvent({
      actorId: 'admin_1', actorRole: 'admin', operationEnvironment: 'local', component: 'test', eventType: 'monitoring_readiness_evaluated', safeReasonCodes: ['code'], safeMetadata: {},
    });
    const events = await listOperationsAuditEvents();
    expect(events.length).toBeGreaterThan(0);
  });

  it('should not store raw env or secrets in audit events', async () => {
    const event = await recordOperationsAuditEvent({
      actorId: 'admin_1', actorRole: 'admin', operationEnvironment: 'local', component: 'test', eventType: 'operations_readiness_evaluated', safeReasonCodes: ['test'], safeMetadata: { safeCount: 1 },
    });
    expect(event.safeMetadata).not.toHaveProperty('DATABASE_URL');
    expect(event.safeMetadata).not.toHaveProperty('JWT_SECRET');
    expect(event.safeReasonCodes).not.toContain('raw_secret');
  });
});
