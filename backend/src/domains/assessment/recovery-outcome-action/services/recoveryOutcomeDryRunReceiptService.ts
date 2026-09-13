import { RecoveryOutcomeDryRunReceiptRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeDryRunReceipt, CreateDryRunReceiptRequest, DryRunReceiptResult } from '../contracts/recoveryOutcomeDryRunReceiptContracts';
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

const RECEIPT_POLICY = 'RECOVERY_OUTCOME_DRY_RUN_RECEIPT_CREATION';

/**
 * R8-G.3B-B hardened Dry-Run Receipt service.
 *
 * DURABLE PREPARATION EVIDENCE / RECEIPT: records simulation outcome only.
 * It is never evidence that live execution occurred.
 *
 * When a PrismaRecoveryOutcomeActionPreparationAtomicStore is supplied all
 * mutation paths run atomically: resource + audit + idempotency in ONE
 * transaction. Canonical identity (school/actor/role) always comes from the
 * verified command context; body identity is never trusted.
 *
 * The shared repository contract exposes listByQueueItemId(queueItemId)
 * WITHOUT a schoolId (unchanged). This production service therefore accepts
 * the verified schoolId and filters returned receipts so no cross-school
 * receipt can escape via a guessed queue-item ID.
 */
export class RecoveryOutcomeDryRunReceiptService {
  constructor(
    private repo: RecoveryOutcomeDryRunReceiptRepository,
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
      this.safety.enforceOrThrow(ctx.actorRole, RECEIPT_POLICY);
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Access denied';
    }
  }

  private crossSchoolMismatch(reqSchoolId: string | undefined, ctx: RecoveryOutcomeActionCommandContext): boolean {
    return Boolean(reqSchoolId && reqSchoolId !== ctx.schoolId);
  }

  async createDryRunReceipt(ctx: RecoveryOutcomeActionCommandContext, req: CreateDryRunReceiptRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>;
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
      const record: RecoveryOutcomeDryRunReceipt = {
        dryRunReceiptId: uuid(),
        schoolId: ctx.schoolId,
        mockActivationQueueItemId: req.mockActivationQueueItemId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        receiptResult: req.receiptResult,
        safeReceiptSummary: req.safeReceiptSummary,
        simulationDetailsJson: req.simulationDetailsJson,
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      if (this.atomicStore) {
        const canonicalInput = {
          mockActivationQueueItemId: record.mockActivationQueueItemId,
          studentRef: record.studentRef,
          resultRecoveryPlanId: record.resultRecoveryPlanId,
          receiptResult: record.receiptResult,
          safeReceiptSummary: record.safeReceiptSummary,
          simulationDetailsJson: record.simulationDetailsJson,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createDryRunReceipt',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeDryRunReceipt',
            mutate: async (tx) => {
              const receiptRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeDryRunReceiptRepository)(tx);
              const created = await receiptRepo.create(record);
              return { resource: created, resourceId: created.dryRunReceiptId };
            },
            load: async (tx, resourceId) => {
              const receiptRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeDryRunReceiptRepository)(tx);
              return receiptRepo.getById(resourceId);
            },
            audit: {
              eventType: 'DRY_RUN_RECEIPT_CREATED',
              decision: 'created',
              safeSummary: `Receipt ${record.dryRunReceiptId} created`,
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

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createDryRunReceipt', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate request', idempotencyKey: ctx.idempotencyKey };

      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'DRY_RUN_RECEIPT_CREATED', 'created', `Receipt ${created.dryRunReceiptId} created`, { dryRunReceiptId: created.dryRunReceiptId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeDryRunReceipt', created.dryRunReceiptId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getDryRunReceipt(id: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Dry-run receipt not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Dry-run receipt not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listReceiptsForQueueItem(queueItemId: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt[]>> {
    try {
      const records = await this.repo.listByQueueItemId(queueItemId);
      // Tenant filter: the shared repository contract has no schoolId on this
      // list; verified school scope is enforced here so no cross-school
      // receipt can escape via a guessed queue-item ID.
      const scoped = schoolId ? records.filter(r => r.schoolId === schoolId) : records;
      return { success: true, data: scoped, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
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
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeDryRunReceipt>;

      if (this.atomicStore) {
        const canonicalInput = { dryRunReceiptId: id };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'voidDryRunReceipt',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeDryRunReceipt',
            mutate: async (tx) => {
              const receiptRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeDryRunReceiptRepository)(tx);
              const existing = await receiptRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Dry-run receipt not found');
                err.notFound = true;
                throw err;
              }
              // Oracle semantics: void records voidedAt only.
              const updated = await receiptRepo.void(id);
              return { resource: updated, resourceId: updated.dryRunReceiptId };
            },
            load: async (tx, resourceId) => {
              const receiptRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeDryRunReceiptRepository)(tx);
              return receiptRepo.getById(resourceId);
            },
            audit: {
              eventType: 'DRY_RUN_RECEIPT_VOIDED',
              decision: 'updated',
              safeSummary: `Receipt ${id} voided`,
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
            return { success: false, status: 'NOT_FOUND', message: 'Dry-run receipt not found' };
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

      this.safety.enforceOrThrow(ctx.actorRole, RECEIPT_POLICY);
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'DRY_RUN_RECEIPT_VOIDED', 'updated', `Receipt ${id} voided`, { dryRunReceiptId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}