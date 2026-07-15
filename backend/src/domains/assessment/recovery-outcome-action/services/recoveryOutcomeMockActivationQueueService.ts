import { RecoveryOutcomeMockActivationQueueRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeMockActivationQueueItem, CreateMockActivationQueueItemRequest, MockActivationQueueStatus } from '../contracts/recoveryOutcomeMockActivationQueueContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeMockActivationQueueService {
  constructor(
    private repo: RecoveryOutcomeMockActivationQueueRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createMockActivationQueueItem(ctx: RecoveryOutcomeActionCommandContext, req: CreateMockActivationQueueItemRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_MOCK_ACTIVATION_QUEUE_CREATION');
      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createMockActivationQueueItem', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const now = new Date();
      const record: RecoveryOutcomeMockActivationQueueItem = {
        mockActivationQueueItemId: uuid(), schoolId: req.schoolId, studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId, actionBundleId: req.actionBundleId,
        queueStatus: 'draft', safeQueueSummary: req.safeQueueSummary,
        actionRefsJson: req.actionRefsJson, mockParametersJson: req.mockParametersJson, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'MOCK_ACTIVATION_QUEUE_ITEM_CREATED', 'created', `Queue item ${created.mockActivationQueueItemId}`, { mockActivationQueueItemId: created.mockActivationQueueItemId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeMockActivationQueueItem', created.mockActivationQueueItemId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getMockActivationQueueItem(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    try { const d = await this.repo.getById(id); if (!d) return { success: false, status: 'NOT_FOUND' }; return { success: true, data: d, status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listQueueItemsForSchool(schoolId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem[]>> {
    try { return { success: true, data: await this.repo.listBySchool(schoolId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listQueueItemsForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listQueueItemsByStatus(schoolId: string, status: MockActivationQueueStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markQueueItemDryRunReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_MOCK_ACTIVATION_QUEUE_CREATION');
      const updated = await this.repo.markDryRunReady(id);
      await this.audit.record(ctx, 'MOCK_QUEUE_ITEM_DRY_RUN_READY', 'updated', `Queue item ${id} dry-run ready`, { mockActivationQueueItemId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async suppressQueueItem(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_MOCK_ACTIVATION_QUEUE_CREATION');
      const updated = await this.repo.suppress(id);
      await this.audit.record(ctx, 'MOCK_QUEUE_ITEM_SUPPRESSED', 'updated', `Queue item ${id} suppressed`, { mockActivationQueueItemId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async blockQueueItem(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_MOCK_ACTIVATION_QUEUE_CREATION');
      const updated = await this.repo.block(id);
      await this.audit.record(ctx, 'MOCK_QUEUE_ITEM_BLOCKED', 'updated', `Queue item ${id} blocked`, { mockActivationQueueItemId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidQueueItem(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_MOCK_ACTIVATION_QUEUE_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'MOCK_QUEUE_ITEM_VOIDED', 'updated', `Queue item ${id} voided`, { mockActivationQueueItemId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}
