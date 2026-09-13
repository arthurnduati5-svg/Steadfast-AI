import { RecoveryOutcomeActionSummaryRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeActionSummary, CreateActionSummaryRequest, ActionSummaryStatus } from '../contracts/recoveryOutcomeActionSummaryContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import type { PrismaRecoveryOutcomeActionPreparationAtomicStore } from '../repositories/prismaRecoveryOutcomeActionPreparationAtomicStore';
import {
  RecoveryOutcomeActionIdempotencyConflictError,
  RecoveryOutcomeActionIdempotencyInProgressError,
} from '../repositories/prismaRecoveryOutcomeActionPreparationAtomicStore';
import { ACTION_SUMMARY_REFRESH_WHITELIST } from '../repositories/prismaRecoveryOutcomeActionRepositories';
import { v4 as uuid } from 'uuid';

const SUMMARY_POLICY = 'RECOVERY_OUTCOME_ACTION_SUMMARY_MUTATION';

/**
 * R8-G.3B-B hardened Action Summary service.
 *
 * DURABLE MATERIALIZED READ MODEL: restart-safe and explicitly
 * refreshable/stale-able. Its canonical inputs remain the underlying
 * Package-20 action records. The summary MUST NOT become a new authority
 * that mutates or overrides those source records.
 *
 * Refresh LAW (§22): only whitelisted projection fields may be accepted from
 * the caller (safeSummary / actionCountsJson / topActionsJson / nextStepsJson
 * / sourceRefsJson). Identity, ownership, status, and lifecycle timestamps
 * are managed by the service/repository and can never be overwritten through
 * refresh.
 *
 * When a PrismaRecoveryOutcomeActionPreparationAtomicStore is supplied all
 * mutation paths run atomically: resource + audit + idempotency in ONE
 * transaction. Canonical identity (school/actor/role) always comes from the
 * verified command context; body identity is never trusted.
 */
export class RecoveryOutcomeActionSummaryService {
  constructor(
    private repo: RecoveryOutcomeActionSummaryRepository,
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
      this.safety.enforceOrThrow(ctx.actorRole, SUMMARY_POLICY);
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Access denied';
    }
  }

  private crossSchoolMismatch(reqSchoolId: string | undefined, ctx: RecoveryOutcomeActionCommandContext): boolean {
    return Boolean(reqSchoolId && reqSchoolId !== ctx.schoolId);
  }

  /**
   * Builds the whitelisted refresh patch. Non-whitelisted caller fields are
   * never forwarded: identity/ownership/status/timestamps cannot be
   * overwritten through refresh.
   */
  private buildRefreshPatch(data: Partial<RecoveryOutcomeActionSummary>): Partial<RecoveryOutcomeActionSummary> {
    const patch: Partial<RecoveryOutcomeActionSummary> = {};
    for (const key of ACTION_SUMMARY_REFRESH_WHITELIST) {
      const value = (data as Record<string, unknown>)[key];
      if (value !== undefined) {
        (patch as Record<string, unknown>)[key] = value;
      }
    }
    return patch;
  }

  async createActionSummary(ctx: RecoveryOutcomeActionCommandContext, req: CreateActionSummaryRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>;
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
      const record: RecoveryOutcomeActionSummary = {
        actionSummaryId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        teacherRef: req.teacherRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        summaryStatus: 'active',
        safeSummary: req.safeSummary,
        actionCountsJson: req.actionCountsJson,
        topActionsJson: req.topActionsJson,
        nextStepsJson: req.nextStepsJson,
        blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      if (this.atomicStore) {
        const canonicalInput = {
          studentRef: record.studentRef ?? null,
          teacherRef: record.teacherRef ?? null,
          resultRecoveryPlanId: record.resultRecoveryPlanId ?? null,
          safeSummary: record.safeSummary,
          actionCountsJson: record.actionCountsJson,
          topActionsJson: record.topActionsJson,
          nextStepsJson: record.nextStepsJson,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createActionSummary',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeActionSummary',
            mutate: async (tx) => {
              const summaryRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionSummaryRepository)(tx);
              const created = await summaryRepo.create(record);
              return { resource: created, resourceId: created.actionSummaryId };
            },
            load: async (tx, resourceId) => {
              const summaryRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionSummaryRepository)(tx);
              return summaryRepo.getById(resourceId);
            },
            audit: {
              eventType: 'ACTION_SUMMARY_CREATED',
              decision: 'created',
              safeSummary: `Summary ${record.actionSummaryId} created`,
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

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createActionSummary', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate request', idempotencyKey: ctx.idempotencyKey };

      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'ACTION_SUMMARY_CREATED', 'created', `Summary ${created.actionSummaryId} created`, { actionSummaryId: created.actionSummaryId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeActionSummary', created.actionSummaryId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getActionSummary(id: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Action summary not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Action summary not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionSummariesForSchool(schoolId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary[]>> {
    try { return { success: true, data: await this.repo.listBySchool(schoolId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionSummariesForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionSummariesForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async refreshActionSummary(ctx: RecoveryOutcomeActionCommandContext, id: string, data: Partial<RecoveryOutcomeActionSummary>): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>;

      const patch = this.buildRefreshPatch(data);

      if (this.atomicStore) {
        // Canonical hash: actionSummaryId + whitelisted normalized patch only
        // (§24). Rejected fields are never hashed.
        const canonicalInput = { actionSummaryId: id, ...patch };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'refreshActionSummary',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeActionSummary',
            mutate: async (tx) => {
              const summaryRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionSummaryRepository)(tx);
              const existing = await summaryRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Action summary not found');
                err.notFound = true;
                throw err;
              }
              const updated = await summaryRepo.refresh(id, patch);
              return { resource: updated, resourceId: updated.actionSummaryId };
            },
            load: async (tx, resourceId) => {
              const summaryRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionSummaryRepository)(tx);
              return summaryRepo.getById(resourceId);
            },
            audit: {
              eventType: 'ACTION_SUMMARY_REFRESHED',
              decision: 'updated',
              safeSummary: `Summary ${id} refreshed`,
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
            return { success: false, status: 'NOT_FOUND', message: 'Action summary not found' };
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

      this.safety.enforceOrThrow(ctx.actorRole, SUMMARY_POLICY);
      const updated = await this.repo.refresh(id, patch);
      await this.audit.record(ctx, 'ACTION_SUMMARY_REFRESHED', 'updated', `Summary ${id} refreshed`, { actionSummaryId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  private async runStatusTransition(
    ctx: RecoveryOutcomeActionCommandContext,
    id: string,
    targetStatus: 'stale' | 'blocked' | 'voided',
    timestampField: 'staleAt' | 'blockedAt' | 'voidedAt',
    eventType: string,
    operation: string,
    pastTense: string,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>;

      if (this.atomicStore) {
        const canonicalInput = { actionSummaryId: id };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation,
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeActionSummary',
            mutate: async (tx) => {
              const summaryRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionSummaryRepository)(tx);
              const existing = await summaryRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Action summary not found');
                err.notFound = true;
                throw err;
              }
              const updated = await summaryRepo.update(id, { summaryStatus: targetStatus, [timestampField]: new Date() } as any);
              return { resource: updated, resourceId: updated.actionSummaryId };
            },
            load: async (tx, resourceId) => {
              const summaryRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeActionSummaryRepository)(tx);
              return summaryRepo.getById(resourceId);
            },
            audit: {
              eventType,
              decision: 'updated',
              safeSummary: `Summary ${id} ${pastTense}`,
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
            return { success: false, status: 'NOT_FOUND', message: 'Action summary not found' };
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

      this.safety.enforceOrThrow(ctx.actorRole, SUMMARY_POLICY);
      let updated: RecoveryOutcomeActionSummary;
      if (targetStatus === 'stale') updated = await this.repo.markStale(id);
      else if (targetStatus === 'blocked') updated = await this.repo.block(id);
      else updated = await this.repo.void(id);
      await this.audit.record(ctx, eventType, 'updated', `Summary ${id} ${pastTense}`, { actionSummaryId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markActionSummaryStale(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    return this.runStatusTransition(ctx, id, 'stale', 'staleAt', 'ACTION_SUMMARY_STALE', 'markActionSummaryStale', 'marked stale');
  }

  async blockActionSummary(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    return this.runStatusTransition(ctx, id, 'blocked', 'blockedAt', 'ACTION_SUMMARY_BLOCKED', 'blockActionSummary', 'blocked');
  }

  async voidActionSummary(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    return this.runStatusTransition(ctx, id, 'voided', 'voidedAt', 'ACTION_SUMMARY_VOIDED', 'voidActionSummary', 'voided');
  }
}