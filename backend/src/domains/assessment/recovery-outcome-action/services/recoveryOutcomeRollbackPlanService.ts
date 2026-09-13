import { RecoveryOutcomeRollbackPlanRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeRollbackPlan, CreateRollbackPlanRequest, RollbackPlanStatus } from '../contracts/recoveryOutcomeRollbackPlanContracts';
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

const ROLLBACK_PLAN_POLICY = 'RECOVERY_OUTCOME_ROLLBACK_PLAN_CREATION';

/**
 * R8-G.3B-B hardened Rollback Plan service.
 *
 * DURABLE PREPARATION PLAN: approval is approval for future use only. No
 * rollback execution occurs here.
 *
 * When a PrismaRecoveryOutcomeActionPreparationAtomicStore is supplied all
 * mutation paths run atomically: resource + audit + idempotency in ONE
 * transaction. Canonical identity (school/actor/role) always comes from the
 * verified command context; body identity is never trusted.
 */
export class RecoveryOutcomeRollbackPlanService {
  constructor(
    private repo: RecoveryOutcomeRollbackPlanRepository,
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
      this.safety.enforceOrThrow(ctx.actorRole, ROLLBACK_PLAN_POLICY);
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Access denied';
    }
  }

  private crossSchoolMismatch(reqSchoolId: string | undefined, ctx: RecoveryOutcomeActionCommandContext): boolean {
    return Boolean(reqSchoolId && reqSchoolId !== ctx.schoolId);
  }

  async createRollbackPlan(ctx: RecoveryOutcomeActionCommandContext, req: CreateRollbackPlanRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>;
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
      const record: RecoveryOutcomeRollbackPlan = {
        rollbackPlanId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        actionBundleId: req.actionBundleId,
        rollbackStatus: 'draft',
        safeRollbackSummary: req.safeRollbackSummary,
        rollbackStepsJson: req.rollbackStepsJson,
        rollbackTriggersJson: req.rollbackTriggersJson,
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
          safeRollbackSummary: record.safeRollbackSummary,
          rollbackStepsJson: record.rollbackStepsJson,
          rollbackTriggersJson: record.rollbackTriggersJson,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createRollbackPlan',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeRollbackPlan',
            mutate: async (tx) => {
              const rollbackRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeRollbackPlanRepository)(tx);
              const created = await rollbackRepo.create(record);
              return { resource: created, resourceId: created.rollbackPlanId };
            },
            load: async (tx, resourceId) => {
              const rollbackRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeRollbackPlanRepository)(tx);
              return rollbackRepo.getById(resourceId);
            },
            audit: {
              eventType: 'ROLLBACK_PLAN_CREATED',
              decision: 'created',
              safeSummary: `Rollback plan ${record.rollbackPlanId} created`,
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

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createRollbackPlan', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate request', idempotencyKey: ctx.idempotencyKey };

      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'ROLLBACK_PLAN_CREATED', 'created', `Rollback plan ${created.rollbackPlanId} created`, { rollbackPlanId: created.rollbackPlanId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeRollbackPlan', created.rollbackPlanId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getRollbackPlan(id: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Rollback plan not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Rollback plan not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listRollbackPlansForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listRollbackPlansByStatus(schoolId: string, status: RollbackPlanStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  private async runStatusTransition(
    ctx: RecoveryOutcomeActionCommandContext,
    id: string,
    targetStatus: 'review_ready' | 'approved_for_future_use' | 'suppressed' | 'blocked' | 'voided',
    timestampField: 'reviewReadyAt' | 'approvedForFutureUseAt' | 'suppressedAt' | 'blockedAt' | 'voidedAt',
    eventType: string,
    operation: string,
    pastTense: string,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>;

      if (this.atomicStore) {
        const canonicalInput = { rollbackPlanId: id };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation,
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeRollbackPlan',
            mutate: async (tx) => {
              const rollbackRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeRollbackPlanRepository)(tx);
              const existing = await rollbackRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Rollback plan not found');
                err.notFound = true;
                throw err;
              }
              const updated = await rollbackRepo.update(id, { rollbackStatus: targetStatus, [timestampField]: new Date() } as any);
              return { resource: updated, resourceId: updated.rollbackPlanId };
            },
            load: async (tx, resourceId) => {
              const rollbackRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeRollbackPlanRepository)(tx);
              return rollbackRepo.getById(resourceId);
            },
            audit: {
              eventType,
              decision: 'updated',
              safeSummary: `Rollback plan ${id} ${pastTense}`,
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
            return { success: false, status: 'NOT_FOUND', message: 'Rollback plan not found' };
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

      this.safety.enforceOrThrow(ctx.actorRole, ROLLBACK_PLAN_POLICY);
      let updated: RecoveryOutcomeRollbackPlan;
      if (targetStatus === 'review_ready') updated = await this.repo.markReviewReady(id);
      else if (targetStatus === 'approved_for_future_use') updated = await this.repo.approveForFutureUse(id);
      else if (targetStatus === 'suppressed') updated = await this.repo.suppress(id);
      else if (targetStatus === 'blocked') updated = await this.repo.block(id);
      else updated = await this.repo.void(id);
      await this.audit.record(ctx, eventType, 'updated', `Rollback plan ${id} ${pastTense}`, { rollbackPlanId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markRollbackPlanReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    return this.runStatusTransition(ctx, id, 'review_ready', 'reviewReadyAt', 'ROLLBACK_PLAN_REVIEW_READY', 'markRollbackPlanReviewReady', 'marked review ready');
  }

  async approveRollbackPlanForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    return this.runStatusTransition(ctx, id, 'approved_for_future_use', 'approvedForFutureUseAt', 'ROLLBACK_PLAN_APPROVED', 'approveRollbackPlanForFutureUse', 'approved for future use');
  }

  async suppressRollbackPlan(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    return this.runStatusTransition(ctx, id, 'suppressed', 'suppressedAt', 'ROLLBACK_PLAN_SUPPRESSED', 'suppressRollbackPlan', 'suppressed');
  }

  async blockRollbackPlan(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    return this.runStatusTransition(ctx, id, 'blocked', 'blockedAt', 'ROLLBACK_PLAN_BLOCKED', 'blockRollbackPlan', 'blocked');
  }

  async voidRollbackPlan(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeRollbackPlan>> {
    return this.runStatusTransition(ctx, id, 'voided', 'voidedAt', 'ROLLBACK_PLAN_VOIDED', 'voidRollbackPlan', 'voided');
  }
}