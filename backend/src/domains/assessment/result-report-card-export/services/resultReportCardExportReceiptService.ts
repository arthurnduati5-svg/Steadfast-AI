import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../../result-report-card/contracts/resultReportCardContracts';
import type { ResultReportCardExportReceiptRepository } from '../contracts/resultReportCardExportRepositoryContracts';
import type { CreateExportReceiptInput, ResultReportCardExportReceipt } from '../contracts/resultReportCardExportReceiptContracts';
import { evaluateReportCardExportReceiptPolicy } from '../policies/resultReportCardExportPolicyDefinitions';
import { ResultReportCardExportSafetyService } from './resultReportCardExportSafetyService';
import { ResultReportCardExportIdempotencyService } from './resultReportCardExportIdempotencyService';
import { ResultReportCardExportAuditBridge } from './resultReportCardExportAuditBridge';

export class ResultReportCardExportReceiptService {
  constructor(
    private receiptRepo: ResultReportCardExportReceiptRepository,
    private safetyService: ResultReportCardExportSafetyService,
    private auditBridge: ResultReportCardExportAuditBridge,
    private idempotencyService: ResultReportCardExportIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async recordExportReceipt(ctx: ResultReportCardCommandContext, input: Omit<CreateExportReceiptInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardExportReceiptPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'recordExportReceipt', ctx.idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const createInput: CreateExportReceiptInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record: ResultReportCardExportReceipt = {
      resultReportCardExportReceiptId: id,
      schoolId: ctx.schoolId,
      ...input,
      receiptStatus: 'recorded',
      providerSimulationJson: input.providerSimulationJson || null,
      blockedReasonCodesJson: input.blockedReasonCodesJson || null,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      voidedAt: null,
    };
    await this.receiptRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'recordExportReceipt', ctx.idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'recordExportReceipt', ctx.idempotencyKey, 'ResultReportCardExportReceipt', id, 'Export receipt recorded');
    await this.auditBridge.recordReceiptRecorded(ctx, id, input.resultReportCardExportJobId, `Export receipt recorded for job ${input.resultReportCardExportJobId}`);
    return this.envelope(ctx, { resourceId: id, status: 'recorded', safeMessage: 'Export receipt recorded successfully', reasonCode: 'RECEIPT_RECORDED', data: record });
  }

  async getExportReceipt(ctx: ResultReportCardCommandContext, receiptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const receipt = await this.receiptRepo.getById(receiptId);
    if (!receipt) return this.envelope(ctx, { ok: false, safeMessage: 'Export receipt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: receiptId, status: receipt.receiptStatus, safeMessage: 'Export receipt found', data: receipt });
  }

  async listExportReceiptsForJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const receipts = await this.receiptRepo.listByExportJobId(jobId);
    return this.envelope(ctx, { safeMessage: `Found ${receipts.length} export receipts for job`, data: receipts });
  }

  async listExportReceiptsForTarget(ctx: ResultReportCardCommandContext, targetId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const receipts = await this.receiptRepo.listByTargetId(targetId);
    return this.envelope(ctx, { safeMessage: `Found ${receipts.length} export receipts for target`, data: receipts });
  }

  async listExportReceiptsForAttempt(ctx: ResultReportCardCommandContext, attemptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const receipts = await this.receiptRepo.listByAttemptId(attemptId);
    return this.envelope(ctx, { safeMessage: `Found ${receipts.length} export receipts for attempt`, data: receipts });
  }

  async blockExportReceipt(ctx: ResultReportCardCommandContext, receiptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const receipt = await this.receiptRepo.getById(receiptId);
    if (!receipt) return this.envelope(ctx, { ok: false, safeMessage: 'Export receipt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (receipt.receiptStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided export receipt', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.receiptRepo.block(receiptId, 'BLOCKED', 'Export receipt blocked');
    return this.envelope(ctx, { resourceId: receiptId, status: 'blocked', safeMessage: 'Export receipt blocked', reasonCode: 'BLOCKED' });
  }

  async voidExportReceipt(ctx: ResultReportCardCommandContext, receiptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const receipt = await this.receiptRepo.getById(receiptId);
    if (!receipt) return this.envelope(ctx, { ok: false, safeMessage: 'Export receipt not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (receipt.receiptStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.receiptRepo.void(receiptId, 'VOIDED', 'Export receipt voided');
    return this.envelope(ctx, { resourceId: receiptId, status: 'void', safeMessage: 'Export receipt voided', reasonCode: 'VOIDED' });
  }
}
