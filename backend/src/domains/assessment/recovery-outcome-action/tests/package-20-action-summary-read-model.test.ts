import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryOutcomeActionSummaryRepository, InMemoryRecoveryOutcomeActionAuditRepository, InMemoryRecoveryOutcomeActionIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeActionSummaryService } from '../services/recoveryOutcomeActionSummaryService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Action Summary Read Model', () => {
  let service: RecoveryOutcomeActionSummaryService;
  let ctx: RecoveryOutcomeActionCommandContext;

  beforeEach(() => {
    const repo = new InMemoryRecoveryOutcomeActionSummaryRepository();
    const safety = new RecoveryOutcomeActionSafetyService();
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeActionSummaryService(repo, safety, audit, idempotency);
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates action summary as read model only', async () => {
    const result = await service.createActionSummary(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeSummary: '2 actions prepared', actionCountsJson: { total: 2 },
      topActionsJson: { action1: 'continuation' }, nextStepsJson: { next: 'review' },
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.summaryStatus).toBe('active');
    expect(result.data?.actionCountsJson.total).toBe(2);
  });

  it('can be refreshed and marked stale', async () => {
    const created = await service.createActionSummary(ctx, {
      schoolId: 'school-1', resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test', actionCountsJson: {}, topActionsJson: {}, nextStepsJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const refreshed = await service.refreshActionSummary(ctx, created.data!.actionSummaryId, { safeSummary: 'Updated' as any } as any);
    expect(refreshed.data?.summaryStatus).toBe('active');
    const stale = await service.markActionSummaryStale(ctx, created.data!.actionSummaryId);
    expect(stale.data?.summaryStatus).toBe('stale');
  });

  it('blocks student role', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createActionSummary(studentCtx, {
      schoolId: 'school-1', resultRecoveryPlanId: 'plan-1',
      safeSummary: 'Test', actionCountsJson: {}, topActionsJson: {}, nextStepsJson: {},
      createdByActorId: 'actor-1', createdByRole: 'student',
    });
    expect(result.success).toBe(false);
  });
});
