import type {
  ResultDeliverySafeEnvelope,
  ResultDeliveryCommandContext,
} from '../contracts/resultDeliveryContracts';
import type { ResultDeliveryRetryPlan, CreateRetryPlanInput } from '../contracts/resultDeliveryRetryPlanContracts';
import type { ResultDeliveryRetryPlanRepository } from '../contracts/resultDeliveryRepositoryContracts';
import type { ResultDeliveryAuditBridge } from './resultDeliveryAuditBridge';
import type { ResultDeliveryIdempotencyService } from './resultDeliveryIdempotencyService';
import { evaluateRetryPlanningPolicy } from '../policies/resultDeliveryPolicyDefinitions';

export class ResultDeliveryRetryPlanService {
  constructor(
    private retryPlanRepo: ResultDeliveryRetryPlanRepository,
    private auditBridge: ResultDeliveryAuditBridge,
    private idempotencyService: ResultDeliveryIdempotencyService,
  ) {}

  private envelope(
    ctx: ResultDeliveryCommandContext,
    overrides: Partial<ResultDeliverySafeEnvelope>,
  ): ResultDeliverySafeEnvelope {
    return {
      ok: true,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
      nextAllowedActions: [],
      ...overrides,
    };
  }

  async createRetryPlanForMockFailure(
    ctx: ResultDeliveryCommandContext,
    input: CreateRetryPlanInput,
  ): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateRetryPlanningPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'createRetryPlanForMockFailure', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'createRetryPlanForMockFailure', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const plan = await this.retryPlanRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordRetryPlanCreated(ctx, plan);
      await this.idempotencyService.completeOperation(startIdem, plan.resultDeliveryRetryPlanId, 'Retry plan created');
      return this.envelope(ctx, {
        resourceId: plan.resultDeliveryRetryPlanId,
        resourceVersion: plan.createdAt,
        status: plan.retryStatus,
        safeMessage: 'Retry plan created for mock failure',
        data: plan,
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create retry plan', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getRetryPlan(ctx: ResultDeliveryCommandContext, retryPlanId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plan = await this.retryPlanRepo.getById(retryPlanId);
    if (!plan) return this.envelope(ctx, { ok: false, safeMessage: 'Retry plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: plan.resultDeliveryRetryPlanId, status: plan.retryStatus, safeMessage: 'Retry plan found', data: plan });
  }

  async listRetryPlansForJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!jobId) return this.envelope(ctx, { ok: false, safeMessage: 'Job ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const plans = await this.retryPlanRepo.listByDeliveryJobId(ctx.schoolId, jobId);
    return this.envelope(ctx, { safeMessage: `Found ${plans.length} retry plans for job`, data: plans });
  }

  async cancelRetryPlan(ctx: ResultDeliveryCommandContext, retryPlanId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plan = await this.retryPlanRepo.getById(retryPlanId);
    if (!plan) return this.envelope(ctx, { ok: false, safeMessage: 'Retry plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (plan.retryStatus === 'void' || plan.retryStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Retry plan already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.retryPlanRepo.cancel(retryPlanId);
    return this.envelope(ctx, { resourceId: retryPlanId, status: 'cancelled', safeMessage: 'Retry plan cancelled' });
  }

  async voidRetryPlan(ctx: ResultDeliveryCommandContext, retryPlanId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plan = await this.retryPlanRepo.getById(retryPlanId);
    if (!plan) return this.envelope(ctx, { ok: false, safeMessage: 'Retry plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (plan.retryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Retry plan already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.retryPlanRepo.void(retryPlanId);
    return this.envelope(ctx, { resourceId: retryPlanId, status: 'void', safeMessage: 'Retry plan voided' });
  }
}
