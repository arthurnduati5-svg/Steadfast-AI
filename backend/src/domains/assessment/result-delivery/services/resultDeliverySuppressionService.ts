import type {
  ResultDeliverySafeEnvelope,
  ResultDeliveryCommandContext,
} from '../contracts/resultDeliveryContracts';
import type { ResultDeliverySuppression, CreateSuppressionInput } from '../contracts/resultDeliverySuppressionContracts';
import type { ResultDeliverySuppressionRepository } from '../contracts/resultDeliveryRepositoryContracts';
import type { ResultDeliveryAuditBridge } from './resultDeliveryAuditBridge';
import type { ResultDeliveryIdempotencyService } from './resultDeliveryIdempotencyService';
import { evaluateSuppressionPolicy } from '../policies/resultDeliveryPolicyDefinitions';

export class ResultDeliverySuppressionService {
  constructor(
    private suppressionRepo: ResultDeliverySuppressionRepository,
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

  private async createSuppression(
    ctx: ResultDeliveryCommandContext,
    input: CreateSuppressionInput,
    operationName: string,
  ): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateSuppressionPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, operationName, ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, operationName, ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const suppression = await this.suppressionRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordSuppressionCreated(ctx, suppression);
      await this.idempotencyService.completeOperation(startIdem, suppression.resultDeliverySuppressionId, 'Suppression created');
      return this.envelope(ctx, {
        resourceId: suppression.resultDeliverySuppressionId,
        resourceVersion: suppression.createdAt,
        status: suppression.suppressionStatus,
        safeMessage: 'Suppression created successfully',
        data: suppression,
        nextAllowedActions: ['clearSuppression'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create suppression', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async suppressDeliveryJob(ctx: ResultDeliveryCommandContext, input: CreateSuppressionInput): Promise<ResultDeliverySafeEnvelope> {
    return this.createSuppression(ctx, input, 'suppressDeliveryJob');
  }

  async suppressRecipient(ctx: ResultDeliveryCommandContext, input: CreateSuppressionInput): Promise<ResultDeliverySafeEnvelope> {
    const enrichedInput: CreateSuppressionInput = { ...input };
    return this.createSuppression(ctx, enrichedInput, 'suppressRecipient');
  }

  async suppressEnvelope(ctx: ResultDeliveryCommandContext, input: CreateSuppressionInput): Promise<ResultDeliverySafeEnvelope> {
    const enrichedInput: CreateSuppressionInput = { ...input };
    return this.createSuppression(ctx, enrichedInput, 'suppressEnvelope');
  }

  async suppressAttempt(ctx: ResultDeliveryCommandContext, input: CreateSuppressionInput): Promise<ResultDeliverySafeEnvelope> {
    const enrichedInput: CreateSuppressionInput = { ...input };
    return this.createSuppression(ctx, enrichedInput, 'suppressAttempt');
  }

  async clearSuppression(ctx: ResultDeliveryCommandContext, suppressionId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const suppression = await this.suppressionRepo.getById(suppressionId);
    if (!suppression) return this.envelope(ctx, { ok: false, safeMessage: 'Suppression not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (suppression.suppressionStatus === 'void' || suppression.suppressionStatus === 'cleared') return this.envelope(ctx, { ok: false, safeMessage: 'Suppression already terminal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.suppressionRepo.clear(suppressionId);
    return this.envelope(ctx, { resourceId: suppressionId, status: 'cleared', safeMessage: 'Suppression cleared' });
  }

  async voidSuppression(ctx: ResultDeliveryCommandContext, suppressionId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const suppression = await this.suppressionRepo.getById(suppressionId);
    if (!suppression) return this.envelope(ctx, { ok: false, safeMessage: 'Suppression not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (suppression.suppressionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Suppression already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.suppressionRepo.void(suppressionId);
    return this.envelope(ctx, { resourceId: suppressionId, status: 'void', safeMessage: 'Suppression voided' });
  }

  async getSuppression(ctx: ResultDeliveryCommandContext, suppressionId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const suppression = await this.suppressionRepo.getById(suppressionId);
    if (!suppression) return this.envelope(ctx, { ok: false, safeMessage: 'Suppression not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: suppression.resultDeliverySuppressionId, status: suppression.suppressionStatus, safeMessage: 'Suppression found', data: suppression });
  }

  async listSuppressionsForJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!jobId) return this.envelope(ctx, { ok: false, safeMessage: 'Job ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const suppressions = await this.suppressionRepo.listByDeliveryJobId(ctx.schoolId, jobId);
    return this.envelope(ctx, { safeMessage: `Found ${suppressions.length} suppressions for job`, data: suppressions });
  }
}
