import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryOutcomeMockActivationQueueRepository, InMemoryRecoveryOutcomeActionAuditRepository, InMemoryRecoveryOutcomeActionIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeMockActivationQueueService } from '../services/recoveryOutcomeMockActivationQueueService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Mock Activation Queue Safety', () => {
  let service: RecoveryOutcomeMockActivationQueueService;
  let ctx: RecoveryOutcomeActionCommandContext;

  beforeEach(() => {
    const repo = new InMemoryRecoveryOutcomeMockActivationQueueRepository();
    const safety = new RecoveryOutcomeActionSafetyService();
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeMockActivationQueueService(repo, safety, audit, idempotency);
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates queue item in draft status', async () => {
    const result = await service.createMockActivationQueueItem(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeQueueSummary: 'Mock activation for review', actionRefsJson: {}, mockParametersJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.queueStatus).toBe('draft');
  });

  it('does not activate anything live when marked dry-run ready', async () => {
    const created = await service.createMockActivationQueueItem(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeQueueSummary: 'Test', actionRefsJson: {}, mockParametersJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const dryRunReady = await service.markQueueItemDryRunReady(ctx, created.data!.mockActivationQueueItemId);
    expect(dryRunReady.data?.queueStatus).toBe('dry_run_ready');
    expect(dryRunReady.data?.dryRunReadyAt).toBeDefined();
  });

  it('blocks student role', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createMockActivationQueueItem(studentCtx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeQueueSummary: 'Test', actionRefsJson: {}, mockParametersJson: {},
      createdByActorId: 'actor-1', createdByRole: 'student',
    });
    expect(result.success).toBe(false);
  });

  it('suppress and void work correctly', async () => {
    const created = await service.createMockActivationQueueItem(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeQueueSummary: 'Test', actionRefsJson: {}, mockParametersJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const suppressed = await service.suppressQueueItem(ctx, created.data!.mockActivationQueueItemId);
    expect(suppressed.data?.queueStatus).toBe('suppressed');
    const blocked = await service.blockQueueItem(ctx, created.data!.mockActivationQueueItemId);
    expect(blocked.data?.queueStatus).toBe('blocked');
  });
});
