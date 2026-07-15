import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryRecoveryOutcomeApprovalGateRepository, InMemoryRecoveryOutcomeActionAuditRepository, InMemoryRecoveryOutcomeActionIdempotencyRepository } from '../repositories/inMemoryRecoveryOutcomeActionRepositories';
import { RecoveryOutcomeApprovalGateService } from '../services/recoveryOutcomeApprovalGateService';
import { RecoveryOutcomeActionSafetyService } from '../services/recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from '../services/recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from '../services/recoveryOutcomeActionIdempotencyService';
import { RecoveryOutcomeActionCommandContext } from '../contracts/recoveryOutcomeActionContracts';

describe('Package 20 - Approval Gate Safety', () => {
  let service: RecoveryOutcomeApprovalGateService;
  let ctx: RecoveryOutcomeActionCommandContext;

  beforeEach(() => {
    const repo = new InMemoryRecoveryOutcomeApprovalGateRepository();
    const safety = new RecoveryOutcomeActionSafetyService();
    const auditRepo = new InMemoryRecoveryOutcomeActionAuditRepository();
    const audit = new RecoveryOutcomeActionAuditBridge(auditRepo);
    const idempotencyRepo = new InMemoryRecoveryOutcomeActionIdempotencyRepository();
    const idempotency = new RecoveryOutcomeActionIdempotencyService(idempotencyRepo);
    service = new RecoveryOutcomeApprovalGateService(repo, safety, audit, idempotency);
    ctx = { schoolId: 'school-1', actorId: 'actor-1', actorRole: 'teacher', correlationId: 'corr-1', idempotencyKey: 'ik-1' };
  });

  it('creates approval gate in pending status', async () => {
    const result = await service.createApprovalGate(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeGateSummary: 'Requires department head approval', requiredApprovalsJson: { roles: ['department_head'] },
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    expect(result.success).toBe(true);
    expect(result.data?.gateStatus).toBe('pending');
  });

  it('does not execute any live action on satisfy', async () => {
    const created = await service.createApprovalGate(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeGateSummary: 'Test', requiredApprovalsJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const satisfied = await service.markApprovalGateSatisfied(ctx, created.data!.approvalGateId);
    expect(satisfied.data?.gateStatus).toBe('satisfied');
    expect(satisfied.data?.satisfiedAt).toBeDefined();
  });

  it('can be blocked and voided', async () => {
    const created = await service.createApprovalGate(ctx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeGateSummary: 'Test', requiredApprovalsJson: {},
      createdByActorId: 'actor-1', createdByRole: 'teacher',
    });
    const blocked = await service.markApprovalGateBlocked(ctx, created.data!.approvalGateId);
    expect(blocked.data?.gateStatus).toBe('blocked');
    const voided = await service.voidApprovalGate(ctx, created.data!.approvalGateId);
    expect(voided.data?.gateStatus).toBe('voided');
  });

  it('blocks student role', async () => {
    const studentCtx = { ...ctx, actorRole: 'student' };
    const result = await service.createApprovalGate(studentCtx, {
      schoolId: 'school-1', studentRef: 'student-1', resultRecoveryPlanId: 'plan-1',
      safeGateSummary: 'Test', requiredApprovalsJson: {},
      createdByActorId: 'actor-1', createdByRole: 'student',
    });
    expect(result.success).toBe(false);
  });
});
