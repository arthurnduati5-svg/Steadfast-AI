import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryOutcomeRollbackPlanRepository, InMemoryRecoveryOutcomeActionAuditRepository, InMemoryRecoveryOutcomeActionIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeRollbackPlanService } from '../services/recoveryOutcomeRollbackPlanService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Rollback Plan Safety', () => {
  let service: RecoveryOutcomeRollbackPlanService;
  let ctx: RecoveryOutcomeActionCommandContext;

  beforeEach(() => {
    const repo = new InMemoryRecoveryOutcomeRollbackPlanRepository();
    const safety = new RecoveryOutcomeActionSafetyService();
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeRollbackPlanService(repo, safety, audit, idempotency);
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates rollback plan as metadata-only draft', async () => {
    const result = await service.createRollbackPlan(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeRollbackSummary: 'Revert action bundle if needed', rollbackStepsJson: { step1: 'revert' },
      rollbackTriggersJson: { trigger: 'failure' },
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.rollbackStatus).toBe('draft');
  });

  it('does not execute any rollback - metadata only', async () => {
    const created = await service.createRollbackPlan(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeRollbackSummary: 'Test', rollbackStepsJson: {}, rollbackTriggersJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(created.data?.rollbackStepsJson).toBeDefined();
    expect(created.data?.rollbackStatus).toBe('draft');
  });

  it('blocks student role', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createRollbackPlan(studentCtx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeRollbackSummary: 'Test', rollbackStepsJson: {}, rollbackTriggersJson: {},
      createdByActorId: 'actor-1', createdByRole: 'student',
    });
    expect(result.success).toBe(false);
  });

  it('can transition statuses', async () => {
    const created = await service.createRollbackPlan(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeRollbackSummary: 'Test', rollbackStepsJson: {}, rollbackTriggersJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const reviewReady = await service.markRollbackPlanReviewReady(ctx, created.data!.rollbackPlanId);
    expect(reviewReady.data?.rollbackStatus).toBe('review_ready');
    const approved = await service.approveRollbackPlanForFutureUse(ctx, created.data!.rollbackPlanId);
    expect(approved.data?.rollbackStatus).toBe('approved_for_future_use');
  });
});
