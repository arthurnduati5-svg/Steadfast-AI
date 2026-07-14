import type {
  ResultDeliverySafeEnvelope,
  ResultDeliveryCommandContext,
} from '../contracts/resultDeliveryContracts';
import type { ResultDeliveryReceipt, CreateReceiptInput } from '../contracts/resultDeliveryReceiptContracts';
import type { ResultDeliveryReceiptRepository } from '../contracts/resultDeliveryRepositoryContracts';
import type { ResultDeliveryAuditBridge } from './resultDeliveryAuditBridge';
import type { ResultDeliveryIdempotencyService } from './resultDeliveryIdempotencyService';
import { evaluateReceiptRecordingPolicy } from '../policies/resultDeliveryPolicyDefinitions';

export class ResultDeliveryReceiptService {
  constructor(
    private receiptRepo: ResultDeliveryReceiptRepository,
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

  async recordMockReceipt(
    ctx: ResultDeliveryCommandContext,
    input: CreateReceiptInput,
  ): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReceiptRecordingPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'recordMockReceipt', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'recordMockReceipt', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const receipt = await this.receiptRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordReceiptRecorded(ctx, receipt);
      await this.idempotencyService.completeOperation(startIdem, receipt.resultDeliveryReceiptId, 'Receipt recorded');
      return this.envelope(ctx, {
        resourceId: receipt.resultDeliveryReceiptId,
        resourceVersion: receipt.createdAt,
        status: receipt.receiptStatus,
        safeMessage: 'Receipt recorded successfully',
        data: receipt,
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to record receipt', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async recordBlockedReceipt(
    ctx: ResultDeliveryCommandContext,
    input: CreateReceiptInput,
  ): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'recordBlockedReceipt', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'recordBlockedReceipt', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const receipt = await this.receiptRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordReceiptRecorded(ctx, receipt);
      await this.idempotencyService.completeOperation(startIdem, receipt.resultDeliveryReceiptId, 'Blocked receipt recorded');
      return this.envelope(ctx, {
        resourceId: receipt.resultDeliveryReceiptId,
        resourceVersion: receipt.createdAt,
        status: receipt.receiptStatus,
        safeMessage: 'Blocked receipt recorded',
        data: receipt,
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to record blocked receipt', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getReceipt(ctx: ResultDeliveryCommandContext, receiptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const receipt = await this.receiptRepo.getById(receiptId);
    if (!receipt) return this.envelope(ctx, { ok: false, safeMessage: 'Receipt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: receipt.resultDeliveryReceiptId, status: receipt.receiptStatus, safeMessage: 'Receipt found', data: receipt });
  }

  async listReceiptsForJob(ctx: ResultDeliveryCommandContext, jobId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!jobId) return this.envelope(ctx, { ok: false, safeMessage: 'Job ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const receipts = await this.receiptRepo.listByDeliveryJobId(ctx.schoolId, jobId);
    return this.envelope(ctx, { safeMessage: `Found ${receipts.length} receipts for job`, data: receipts });
  }

  async listReceiptsForAttempt(ctx: ResultDeliveryCommandContext, attemptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!attemptId) return this.envelope(ctx, { ok: false, safeMessage: 'Attempt ID required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const receipts = await this.receiptRepo.listByAttemptId(ctx.schoolId, attemptId);
    return this.envelope(ctx, { safeMessage: `Found ${receipts.length} receipts for attempt`, data: receipts });
  }

  async voidReceipt(ctx: ResultDeliveryCommandContext, receiptId: string): Promise<ResultDeliverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const receipt = await this.receiptRepo.getById(receiptId);
    if (!receipt) return this.envelope(ctx, { ok: false, safeMessage: 'Receipt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (receipt.receiptStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Receipt already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.receiptRepo.void(receiptId);
    return this.envelope(ctx, { resourceId: receiptId, status: 'void', safeMessage: 'Receipt voided' });
  }
}
