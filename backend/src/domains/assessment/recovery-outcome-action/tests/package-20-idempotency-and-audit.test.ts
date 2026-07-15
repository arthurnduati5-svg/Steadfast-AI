import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryRecoveryOutcomeActionReadinessRepository,
  InMemoryRecoveryOutcomeActionAuditRepository,
  InMemoryRecoveryOutcomeActionIdempotencyRepository,
} from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeActionReadinessService } from '../services/recoveryOutcomeActionReadinessService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Idempotency and Audit', () => {
  let service: RecoveryOutcomeActionReadinessService;
  let ctx: RecoveryOutcomeActionCommandContext;
  let auditRepo: InMemoryRecoveryOutcomeActionAuditRepository;
  let idempotencyRepo: InMemoryRecoveryOutcomeActionIdempotencyRepository;

  beforeEach(() => {
    const repo = new InMemoryRecoveryOutcomeActionReadinessRepository();
    const safety = new RecoveryOutcomeActionSafetyService();
    auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeActionReadinessService(repo, safety, audit, idempotency);
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('blocks duplicate mutating operations via idempotency key', async () => {
    const req = {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'dr-1',
      safeReadinessSummary: 'Test', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    };
    const first = await service.createActionReadiness(ctx, req);
    expect(first.success).toBe(true);

    const second = await service.createActionReadiness(ctx, req);
    expect(second.success).toBe(false);
    expect(second.status).toBe('DUPLICATE');
  });

  it('creates audit events for mutations', async () => {
    const result = await service.createActionReadiness(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'dr-1',
      safeReadinessSummary: 'Test', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);

    const audits = await auditRepo.listBySchool('school-1');
    expect(audits.length).toBeGreaterThanOrEqual(1);
    expect(audits[0].eventType).toBe('ACTION_READINESS_CREATED');
  });

  it('audit events capture actor and decision', async () => {
    const result = await service.createActionReadiness(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      recoveryOutcomeDecisionReadinessId: 'dr-1',
      safeReadinessSummary: 'Audit test', readinessChecksJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const audits = await auditRepo.listBySchool('school-1');
    expect(audits[0].actorId).toBe('actor-1');
    expect(audits[0].actorRole).toBe('teacher');
    expect(audits[0].decision).toBe('created');
  });
});
