import { RecoveryOutcomeDryRunReceiptRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeDryRunReceipt, CreateDryRunReceiptRequest, DryRunReceiptResult } from '../contracts/recoveryOutcomeDryRunReceiptContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeDryRunReceiptService {
  constructor(
    private repo: RecoveryOutcomeDryRunReceiptRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createDryRunReceipt(ctx: RecoveryOutcomeActionCommandContext, req: CreateDryRunReceiptRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_DRY_RUN_RECEIPT_CREATION');
      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createDryRunReceipt', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const now = new Date();
      const record: RecoveryOutcomeDryRunReceipt = {
        dryRunReceiptId: uuid(), schoolId: req.schoolId, mockActivationQueueItemId: req.mockActivationQueueItemId,
        studentRef: req.studentRef, resultRecoveryPlanId: req.resultRecoveryPlanId,
        receiptResult: req.receiptResult, safeReceiptSummary: req.safeReceiptSummary,
        simulationDetailsJson: req.simulationDetailsJson, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'DRY_RUN_RECEIPT_CREATED', 'created', `Receipt ${created.dryRunReceiptId}`, { dryRunReceiptId: created.dryRunReceiptId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeDryRunReceipt', created.dryRunReceiptId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getDryRunReceipt(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>> {
    try { const d = await this.repo.getById(id); if (!d) return { success: false, status: 'NOT_FOUND' }; return { success: true, data: d, status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listReceiptsForQueueItem(queueItemId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt[]>> {
    try { return { success: true, data: await this.repo.listByQueueItemId(queueItemId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listReceiptsForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listReceiptsByResult(schoolId: string, result: DryRunReceiptResult): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt[]>> {
    try { return { success: true, data: await this.repo.listByResult(schoolId, result), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidDryRunReceipt(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_DRY_RUN_RECEIPT_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'DRY_RUN_RECEIPT_VOIDED', 'updated', `Receipt ${id} voided`, { dryRunReceiptId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}
