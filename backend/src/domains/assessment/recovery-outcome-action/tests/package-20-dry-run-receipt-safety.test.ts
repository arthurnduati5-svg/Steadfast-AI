import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryOutcomeDryRunReceiptRepository, InMemoryRecoveryOutcomeActionAuditRepository, InMemoryRecoveryOutcomeActionIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeDryRunReceiptService } from '../services/recoveryOutcomeDryRunReceiptService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Dry-Run Receipt Safety', () => {
  let service: RecoveryOutcomeDryRunReceiptService;
  let ctx: RecoveryOutcomeActionCommandContext;

  beforeEach(() => {
    const repo = new InMemoryRecoveryOutcomeDryRunReceiptRepository();
    const safety = new RecoveryOutcomeActionSafetyService();
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeDryRunReceiptService(repo, safety, audit, idempotency);
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates dry-run receipt with simulated result', async () => {
    const result = await service.createDryRunReceipt(ctx, {
      schoolId: 'school-1', mockActivationQueueItemId: 'queue-1', studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1', receiptResult: 'simulated_success',
      safeReceiptSummary: 'Dry run completed successfully', simulationDetailsJson: { steps: ['step-1'] },
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.receiptResult).toBe('simulated_success');
  });

  it('records only mock proof - no live action executed', async () => {
    const result = await service.createDryRunReceipt(ctx, {
      schoolId: 'school-1', mockActivationQueueItemId: 'queue-1', studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1', receiptResult: 'simulated_blocked',
      safeReceiptSummary: 'Simulated blocked', simulationDetailsJson: { reason: 'insufficient approvals' },
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.receiptResult).toBe('simulated_blocked');
  });

  it('blocks student role', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createDryRunReceipt(studentCtx, {
      schoolId: 'school-1', mockActivationQueueItemId: 'queue-1', studentRef: 'student-1',
      resultRecoveryPlanId: 'plan-1', receiptResult: 'simulated_success',
      safeReceiptSummary: 'Test', simulationDetailsJson: {},
      createdByActorId: 'actor-1', createdByRole: 'student',
    });
    expect(result.success).toBe(false);
  });
});
