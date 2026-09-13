import { RecoveryOutcomeMockActivationQueueRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeMockActivationQueueItem, CreateMockActivationQueueItemRequest, MockActivationQueueStatus } from '../contracts/recoveryOutcomeMockActivationQueueContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import type { PrismaRecoveryOutcomeActionPreparationAtomicStore } from '../repositories/prismaRecoveryOutcomeActionPreparationAtomicStore';
import {
  RecoveryOutcomeActionIdempotencyConflictError,
  RecoveryOutcomeActionIdempotencyInProgressError,
} from '../repositories/prismaRecoveryOutcomeActionPreparationAtomicStore';
import { v4 as uuid } from 'uuid';

const MOCK_QUEUE_POLICY = 'RECOVERY_OUTCOME_MOCK_ACTIVATION_QUEUE_CREATION';

/**
 * R8-G.3B-B hardened Mock Activation Queue service.
 *
 * DURABLE SIMULATION/PREPARATION STATE: `dry_run_ready` means ready for
 * mock/dry-run preparation only. This service never activates a live
 * recovery action.
 *
 * When a PrismaRecoveryOutcomeActionPreparationAtomicStore is supplied all
 * mutation paths run atomically: resource + audit + idempotency in ONE
 * transaction. Canonical identity (school/actor/role) always comes from the
 * verified command context; body identity is never trusted.
 */
export class RecoveryOutcomeMockActivationQueueService {
  constructor(
    private repo: RecoveryOutcomeMockActivationQueueRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
    private atomicStore?: PrismaRecoveryOutcomeActionPreparationAtomicStore | null,
  ) {}

  private denyIdentity(message: string): RecoveryOutcomeActionSafeEnvelope<never> {
    return { success: false, status: 'DENIED', code: 'VERIFIED_IDENTITY_REQUIRED', message };
  }

  private denyRole(message: string): RecoveryOutcomeActionSafeEnvelope<never> {
    return { success: false, status: 'DENIED', code: 'ROLE_NOT_ALLOWED', message };
  }

  private checkVerifiedIdentity(ctx: RecoveryOutcomeActionCommandContext): string | null {
    if (!ctx.schoolId || !ctx.actorId) return 'Missing verified actor identity';
    return null;
  }

  private checkRole(ctx: RecoveryOutcomeActionCommandContext): string | null {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, MOCK_QUEUE_POLICY);
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Access denied';
    }
  }

  private crossSchoolMismatch(reqSchoolId: string | undefined, ctx: RecoveryOutcomeActionCommandContext): boolean {
    return Boolean(reqSchoolId && reqSchoolId !== ctx.schoolId);
  }

  async createMockActivationQueueItem(ctx: RecoveryOutcomeActionCommandContext, req: CreateMockActivationQueueItemRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>;
      this.safety.validateSchoolContext(ctx.schoolId);

      // Canonical verified identity only — body school conflict is rejected.
      if (this.crossSchoolMismatch(req.schoolId, ctx)) {
        return {
          success: false,
          status: 'error',
          code: 'CROSS_SCHOOL_MISMATCH',
          message: 'Request school identity does not match verified school context',
          idempotencyKey: ctx.idempotencyKey,
        };
      }

      const now = new Date();
      const record: RecoveryOutcomeMockActivationQueueItem = {
        mockActivationQueueItemId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        actionBundleId: req.actionBundleId,
        queueStatus: 'draft',
        safeQueueSummary: req.safeQueueSummary,
        actionRefsJson: req.actionRefsJson,
        mockParametersJson: req.mockParametersJson,
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      if (this.atomicStore) {
        const canonicalInput = {
          studentRef: record.studentRef,
          resultRecoveryPlanId: record.resultRecoveryPlanId,
          actionBundleId: record.actionBundleId ?? null,
          safeQueueSummary: record.safeQueueSummary,
          actionRefsJson: record.actionRefsJson,
          mockParametersJson: record.mockParametersJson,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createMockActivationQueueItem',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeMockActivationQueueItem',
            mutate: async (tx) => {
              const queueRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeMockActivationQueueRepository)(tx);
              const created = await queueRepo.create(record);
              return { resource: created, resourceId: created.mockActivationQueueItemId };
            },
            load: async (tx, resourceId) => {
              const queueRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeMockActivationQueueRepository)(tx);
              return queueRepo.getById(resourceId);
            },
            audit: {
              eventType: 'MOCK_ACTIVATION_QUEUE_ITEM_CREATED',
              decision: 'created',
              safeSummary: `Queue item ${record.mockActivationQueueItemId} created`,
              actorId: ctx.actorId,
              actorRole: ctx.actorRole,
              correlationId: ctx.correlationId,
            },
          });
          if (outcome.duplicate) {
            return {
              success: false,
              status: 'DUPLICATE',
              message: 'Idempotency key already processed',
              data: outcome.resource,
              idempotencyKey: ctx.idempotencyKey,
            };
          }
          return { success: true, data: outcome.resource, status: 'created', idempotencyKey: ctx.idempotencyKey };
        } catch (err) {
          if (
            err instanceof RecoveryOutcomeActionIdempotencyConflictError ||
            err instanceof RecoveryOutcomeActionIdempotencyInProgressError
          ) {
            return { success: false, status: 'CONFLICT', message: err.message, idempotencyKey: ctx.idempotencyKey };
          }
          throw err;
        }
      }

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createMockActivationQueueItem', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate request', idempotencyKey: ctx.idempotencyKey };

      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'MOCK_ACTIVATION_QUEUE_ITEM_CREATED', 'created', `Queue item ${created.mockActivationQueueItemId} created`, { mockActivationQueueItemId: created.mockActivationQueueItemId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeMockActivationQueueItem', created.mockActivationQueueItemId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getMockActivationQueueItem(id: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Mock activation queue item not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Mock activation queue item not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
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

  private async runStatusTransition(
    ctx: RecoveryOutcomeActionCommandContext,
    id: string,
    targetStatus: 'dry_run_ready' | 'suppressed' | 'blocked' | 'voided',
    timestampField: 'dryRunReadyAt' | 'suppressedAt' | 'blockedAt' | 'voidedAt',
    eventType: string,
    operation: string,
    pastTense: string,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>;

      if (this.atomicStore) {
        const canonicalInput = { mockActivationQueueItemId: id };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation,
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeMockActivationQueueItem',
            mutate: async (tx) => {
              const queueRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeMockActivationQueueRepository)(tx);
              const existing = await queueRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Mock activation queue item not found');
                err.notFound = true;
                throw err;
              }
              const updated = await queueRepo.update(id, { queueStatus: targetStatus, [timestampField]: new Date() } as any);
              return { resource: updated, resourceId: updated.mockActivationQueueItemId };
            },
            load: async (tx, resourceId) => {
              const queueRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeMockActivationQueueRepository)(tx);
              return queueRepo.getById(resourceId);
            },
            audit: {
              eventType,
              decision: 'updated',
              safeSummary: `Queue item ${id} ${pastTense}`,
              actorId: ctx.actorId,
              actorRole: ctx.actorRole,
              correlationId: ctx.correlationId,
            },
          });
          if (outcome.duplicate) {
            return {
              success: false,
              status: 'DUPLICATE',
              message: 'Idempotency key already processed',
              data: outcome.resource,
              idempotencyKey: ctx.idempotencyKey,
            };
          }
          return { success: true, data: outcome.resource, status: 'updated' };
        } catch (err: any) {
          if (err?.notFound) {
            return { success: false, status: 'NOT_FOUND', message: 'Mock activation queue item not found' };
          }
          if (
            err instanceof RecoveryOutcomeActionIdempotencyConflictError ||
            err instanceof RecoveryOutcomeActionIdempotencyInProgressError
          ) {
            return { success: false, status: 'CONFLICT', message: err.message, idempotencyKey: ctx.idempotencyKey };
          }
          throw err;
        }
      }

      this.safety.enforceOrThrow(ctx.actorRole, MOCK_QUEUE_POLICY);
      let updated: RecoveryOutcomeMockActivationQueueItem;
      if (targetStatus === 'dry_run_ready') updated = await this.repo.markDryRunReady(id);
      else if (targetStatus === 'suppressed') updated = await this.repo.suppress(id);
      else if (targetStatus === 'blocked') updated = await this.repo.block(id);
      else updated = await this.repo.void(id);
      await this.audit.record(ctx, eventType, 'updated', `Queue item ${id} ${pastTense}`, { mockActivationQueueItemId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markQueueItemDryRunReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    return this.runStatusTransition(ctx, id, 'dry_run_ready', 'dryRunReadyAt', 'MOCK_QUEUE_ITEM_DRY_RUN_READY', 'markQueueItemDryRunReady', 'marked dry-run ready');
  }

  async suppressQueueItem(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    return this.runStatusTransition(ctx, id, 'suppressed', 'suppressedAt', 'MOCK_QUEUE_ITEM_SUPPRESSED', 'suppressQueueItem', 'suppressed');
  }

  async blockQueueItem(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    return this.runStatusTransition(ctx, id, 'blocked', 'blockedAt', 'MOCK_QUEUE_ITEM_BLOCKED', 'blockQueueItem', 'blocked');
  }

  async voidQueueItem(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeMockActivationQueueItem>> {
    return this.runStatusTransition(ctx, id, 'voided', 'voidedAt', 'MOCK_QUEUE_ITEM_VOIDED', 'voidQueueItem', 'voided');
  }
}