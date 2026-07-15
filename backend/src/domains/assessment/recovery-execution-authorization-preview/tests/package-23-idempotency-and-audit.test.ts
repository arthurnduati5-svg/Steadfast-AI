import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryExecutionAuthorizationPreviewRepositories } from '../repositories/inMemoryRecoveryExecutionAuthorizationPreviewRepositories';
import { RecoveryExecutionAuthorizationReadinessService } from '../services/recoveryExecutionAuthorizationReadinessService';
import { RecoveryExecutionAuthorizationAuditBridge } from '../services/recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from '../services/recoveryExecutionAuthorizationIdempotencyService';
import { RecoveryExecutionAuthorizationPreviewCommandContext } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';

describe('Package 23 - Idempotency and Audit', () => {
  let repos: InMemoryRecoveryExecutionAuthorizationPreviewRepositories;
  let service: RecoveryExecutionAuthorizationReadinessService;
  let ctx: RecoveryExecutionAuthorizationPreviewCommandContext;
  const schoolId = 'school-1';

  beforeEach(() => {
    repos = new InMemoryRecoveryExecutionAuthorizationPreviewRepositories();
    const audit = new RecoveryExecutionAuthorizationAuditBridge(repos.authorizationAudit);
    const idempotency = new RecoveryExecutionAuthorizationIdempotencyService(repos.authorizationIdempotency);
    service = new RecoveryExecutionAuthorizationReadinessService(repos.authorizationReadiness, audit, idempotency);
    ctx = { schoolId, actorId: 'actor-1', actorRole: 'admin', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('blocks duplicate mutating operations via idempotency key', async () => {
    const first = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Idempotency test',
    });
    expect(first.success).toBe(true);

    const second = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Idempotency test',
    });
    expect(second.success).toBe(false);
    expect(second.status).toBe('DUPLICATE');
  });

  it('creates audit events for mutations', async () => {
    const result = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Audit test',
    });
    expect(result.success).toBe(true);

    const audits = await repos.authorizationAudit.listBySchool(schoolId);
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits[0].eventType).toBe('AUTHORIZATION_READINESS_CREATED');
  });

  it('audit events capture actor and decision', async () => {
    await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Audit actor test',
    });
    const audits = await repos.authorizationAudit.listBySchool(schoolId);
    expect(audits[0].actorId).toBe('actor-1');
    expect(audits[0].actorRole).toBe('admin');
    expect(audits[0].decision).toBe('created');
  });

  it('audit events capture the readiness id', async () => {
    const result = await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Audit ref test',
    });
    const audits = await repos.authorizationAudit.listBySchool(schoolId);
    expect(audits[0].schoolId).toBe(schoolId);
    expect(result.data?.authorizationReadinessId).toBeDefined();
  });

  it('different idempotency keys allow separate creates', async () => {
    const req = {
      studentRef: 'student-1',
      safeSummary: 'Different key test',
    };
    const first = await service.createAuthorizationReadiness(ctx, schoolId, req);
    expect(first.success).toBe(true);

    const ctx2 = { ...ctx, idempotencyKey: 'ik-2' };
    const second = await service.createAuthorizationReadiness(ctx2, schoolId, req);
    expect(second.success).toBe(true);
    expect(second.data?.authorizationReadinessId).not.toBe(first.data?.authorizationReadinessId);
  });

  it('same idempotency key with same operation returns DUPLICATE status', async () => {
    const req = {
      studentRef: 'student-1',
      safeSummary: 'Same key test',
    };
    await service.createAuthorizationReadiness(ctx, schoolId, req);

    const repeat = await service.createAuthorizationReadiness(ctx, schoolId, req);
    expect(repeat.success).toBe(false);
    expect(repeat.status).toBe('DUPLICATE');
  });

  it('audit repository stores events that can be listed by event type', async () => {
    await service.createAuthorizationReadiness(ctx, schoolId, {
      studentRef: 'student-1',
      safeSummary: 'Event type test',
    });
    const eventList = await repos.authorizationAudit.listByEventType(schoolId, 'AUTHORIZATION_READINESS_CREATED');
    expect(eventList.length).toBeGreaterThanOrEqual(1);
  });
});
