import { RecoveryOutcomeActionBundleRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeActionBundle, CreateActionBundleRequest, ActionBundleStatus } from '../contracts/recoveryOutcomeActionBundleContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import type {
  PrismaRecoveryOutcomeActionPreparationAtomicStore,
} from '../repositories/prismaRecoveryOutcomeActionPreparationAtomicStore';
import {
  RecoveryOutcomeActionIdempotencyConflictError,
  RecoveryOutcomeActionIdempotencyInProgressError,
} from '../repositories/prismaRecoveryOutcomeActionPreparationAtomicStore';
import { v4 as uuid } from 'uuid';

const BUNDLE_CREATION_POLICY = 'RECOVERY_OUTCOME_ACTION_BUNDLE_CREATION';

/**
 * R8-G.3B-A hardened Action Bundle service.
 *
 * When a PrismaRecoveryOutcomeActionPreparationAtomicStore is supplied the
 * five mutation paths (create / review-ready / approve / suppress / block /
 * void) run atomically: resource + audit + idempotency in ONE transaction.
 * Canonical identity (school/actor/role) always comes from the verified
 * command context; body identity is never trusted.
 */
export class RecoveryOutcomeActionBundleService {
  constructor(
    private repo: RecoveryOutcomeActionBundleRepository,
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
      this.safety.enforceOrThrow(ctx.actorRole, BUNDLE_CREATION_POLICY);
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Access denied';
    }
  }

  private crossSchoolMismatch(reqSchoolId: string | undefined, ctx: RecoveryOutcomeActionCommandContext): boolean {
    return Boolean(reqSchoolId && reqSchoolId !== ctx.schoolId);
  }

  async createActionBundle(ctx: RecoveryOutcomeActionCommandContext, req: CreateActionBundleRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>;
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
      const record: RecoveryOutcomeActionBundle = {
        actionBundleId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId,
        bundleStatus: 'draft',
        safeBundleSummary: req.safeBundleSummary,
        readinessRefsJson: req.readinessRefsJson,
        draftRefsJson: req.draftRefsJson,
        bundleType: req.bundleType,
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      if (this.atomicStore) {
        // Hash business input only: no generated UUID / timestamps /
        // correlationId / idempotencyKey.
        const canonicalInput = {
          studentRef: record.studentRef,
          resultRecoveryPlanId: record.resultRecoveryPlanId,
          recoveryOutcomeDecisionSummaryId: record.recoveryOutcomeDecisionSummaryId ?? null,
          safeBundleSummary: record.safeBundleSummary,
          readinessRefsJson: record.readinessRefsJson,
          draftRefsJson: record.draftRefsJson,
          bundleType: record.bundleType,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createActionBundle',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeActionBundle',
            mutate: async (tx) => {
              const bundleRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionBundleRepository)(tx);
              const created = await bundleRepo.create(record);
              return { resource: created, resourceId: created.actionBundleId };
            },
            load: async (tx, resourceId) => {
              const bundleRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionBundleRepository)(tx);
              return bundleRepo.getById(resourceId);
            },
            audit: {
              eventType: 'ACTION_BUNDLE_CREATED',
              decision: 'created',
              safeSummary: `Bundle ${record.actionBundleId} created`,
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

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createActionBundle', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate request', idempotencyKey: ctx.idempotencyKey };

      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'ACTION_BUNDLE_CREATED', 'created', `Bundle ${created.actionBundleId} created`, { actionBundleId: created.actionBundleId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeActionBundle', created.actionBundleId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getActionBundle(id: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Bundle not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Bundle not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionBundlesForSchool(schoolId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle[]>> {
    try { return { success: true, data: await this.repo.listBySchool(schoolId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionBundlesForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionBundlesForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionBundlesByStatus(schoolId: string, status: ActionBundleStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle[]>> {
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
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>;

      if (this.atomicStore) {
        const canonicalInput = { actionBundleId: id };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation,
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeActionBundle',
            mutate: async (tx) => {
              const bundleRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionBundleRepository)(tx);
              // In-transaction tenant verification: school-scoped load.
              const existing = await bundleRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Bundle not found');
                err.notFound = true;
                throw err;
              }
              const updated = await bundleRepo.update(id, { bundleStatus: targetStatus, [timestampField]: new Date() } as any);
              return { resource: updated, resourceId: updated.actionBundleId };
            },
            load: async (tx, resourceId) => {
              const bundleRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionBundleRepository)(tx);
              return bundleRepo.getById(resourceId);
            },
            audit: {
              eventType,
              decision: 'updated',
              safeSummary: `Bundle ${id} ${pastTense}`,
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
            return { success: false, status: 'NOT_FOUND', message: 'Bundle not found' };
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

      this.safety.enforceOrThrow(ctx.actorRole, BUNDLE_CREATION_POLICY);
      let updated: RecoveryOutcomeActionBundle;
      if (targetStatus === 'review_ready') updated = await this.repo.markReviewReady(id);
      else if (targetStatus === 'approved_for_future_use') updated = await this.repo.approveForFutureUse(id);
      else if (targetStatus === 'suppressed') updated = await this.repo.suppress(id);
      else if (targetStatus === 'blocked') updated = await this.repo.block(id);
      else updated = await this.repo.void(id);
      await this.audit.record(ctx, eventType, 'updated', `Bundle ${id} ${pastTense}`, { actionBundleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markActionBundleReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    return this.runStatusTransition(ctx, id, 'review_ready', 'reviewReadyAt', 'ACTION_BUNDLE_REVIEW_READY', 'markActionBundleReviewReady', 'marked review ready');
  }

  async approveActionBundleForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    return this.runStatusTransition(ctx, id, 'approved_for_future_use', 'approvedForFutureUseAt', 'ACTION_BUNDLE_APPROVED', 'approveActionBundleForFutureUse', 'approved for future use');
  }

  async suppressActionBundle(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    return this.runStatusTransition(ctx, id, 'suppressed', 'suppressedAt', 'ACTION_BUNDLE_SUPPRESSED', 'suppressActionBundle', 'suppressed');
  }

  async blockActionBundle(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    return this.runStatusTransition(ctx, id, 'blocked', 'blockedAt', 'ACTION_BUNDLE_BLOCKED', 'blockActionBundle', 'blocked');
  }

  async voidActionBundle(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    return this.runStatusTransition(ctx, id, 'voided', 'voidedAt', 'ACTION_BUNDLE_VOIDED', 'voidActionBundle', 'voided');
  }
}
