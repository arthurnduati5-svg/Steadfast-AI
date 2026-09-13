import { RecoveryPauseActionDraftRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryPauseActionDraft, CreatePauseActionDraftRequest, ActionDraftStatus } from '../contracts/recoveryActionDraftContracts';
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

const DRAFT_CREATION_POLICY = 'RECOVERY_PAUSE_ACTION_DRAFT_CREATION';
const RESOURCE_TYPE = 'RecoveryPauseActionDraft' as const;

/**
 * R8-G.3B-A hardened Pause action draft service: atomic
 * resource + audit + idempotency mutations when a preparation atomic store
 * is supplied; canonical identity from verified context only.
 */
export class RecoveryPauseActionDraftService {
  constructor(
    private repo: RecoveryPauseActionDraftRepository,
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
      this.safety.enforceOrThrow(ctx.actorRole, DRAFT_CREATION_POLICY);
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Access denied';
    }
  }

  async createPauseActionDraft(ctx: RecoveryOutcomeActionCommandContext, req: CreatePauseActionDraftRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>;
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.validatePackage19Ref(req.recoveryPauseDecisionDraftId, 'recoveryPauseDecisionDraftId');

      if (req.schoolId && req.schoolId !== ctx.schoolId) {
        return {
          success: false,
          status: 'error',
          code: 'CROSS_SCHOOL_MISMATCH',
          message: 'Request school identity does not match verified school context',
          idempotencyKey: ctx.idempotencyKey,
        };
      }

      const now = new Date();
      const record: RecoveryPauseActionDraft = {
        pauseActionDraftId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryPauseDecisionDraftId: req.recoveryPauseDecisionDraftId,
        recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId,
        draftStatus: 'draft',
        safeActionSummary: req.safeActionSummary,
        pauseDetailsJson: req.pauseDetailsJson,
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
          recoveryPauseDecisionDraftId: record.recoveryPauseDecisionDraftId,
          recoveryOutcomeDecisionSummaryId: record.recoveryOutcomeDecisionSummaryId ?? null,
          safeActionSummary: record.safeActionSummary,
          pauseDetailsJson: record.pauseDetailsJson,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createPauseActionDraft',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: RESOURCE_TYPE,
            mutate: async (tx) => {
              const draftRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryPauseActionDraftRepository)(tx);
              const created = await draftRepo.create(record);
              return { resource: created, resourceId: created.pauseActionDraftId };
            },
            load: async (tx, resourceId) => {
              const draftRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryPauseActionDraftRepository)(tx);
              return draftRepo.getById(resourceId);
            },
            audit: {
              eventType: 'PAUSE_ACTION_DRAFT_CREATED',
              decision: 'created',
              safeSummary: `Pause draft ${record.pauseActionDraftId}`,
              actorId: ctx.actorId,
              actorRole: ctx.actorRole,
              correlationId: ctx.correlationId,
            },
          });
          if (outcome.duplicate) {
            return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', data: outcome.resource, idempotencyKey: ctx.idempotencyKey };
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

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createPauseActionDraft', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'PAUSE_ACTION_DRAFT_CREATED', 'created', `Pause draft ${created.pauseActionDraftId}`, { pauseActionDraftId: created.pauseActionDraftId });
      await this.idempotency.markCompleted(ctx, RESOURCE_TYPE, created.pauseActionDraftId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getActionDraft(id: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  private async runStatusTransition(
    ctx: RecoveryOutcomeActionCommandContext,
    id: string,
    targetStatus: ActionDraftStatus,
    timestampField: 'reviewReadyAt' | 'approvedForFutureUseAt' | 'suppressedAt' | 'blockedAt' | 'voidedAt',
    eventType: string,
    operation: string,
    pastTense: string,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>;

      if (this.atomicStore) {
        const canonicalInput = { pauseActionDraftId: id };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation,
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: RESOURCE_TYPE,
            mutate: async (tx) => {
              const draftRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryPauseActionDraftRepository)(tx);
              const existing = await draftRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Draft not found');
                err.notFound = true;
                throw err;
              }
              const updated = await draftRepo.update(id, { draftStatus: targetStatus, [timestampField]: new Date() } as any);
              return { resource: updated, resourceId: updated.pauseActionDraftId };
            },
            load: async (tx, resourceId) => {
              const draftRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryPauseActionDraftRepository)(tx);
              return draftRepo.getById(resourceId);
            },
            audit: {
              eventType,
              decision: 'updated',
              safeSummary: `Draft ${id} ${pastTense}`,
              actorId: ctx.actorId,
              actorRole: ctx.actorRole,
              correlationId: ctx.correlationId,
            },
          });
          if (outcome.duplicate) {
            return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', data: outcome.resource, idempotencyKey: ctx.idempotencyKey };
          }
          return { success: true, data: outcome.resource, status: 'updated' };
        } catch (err: any) {
          if (err?.notFound) {
            return { success: false, status: 'NOT_FOUND', message: 'Draft not found' };
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

      this.safety.enforceOrThrow(ctx.actorRole, DRAFT_CREATION_POLICY);
      let updated: RecoveryPauseActionDraft;
      if (targetStatus === 'review_ready') updated = await this.repo.markReviewReady(id);
      else if (targetStatus === 'approved_for_future_use') updated = await this.repo.approveForFutureUse(id);
      else if (targetStatus === 'suppressed') updated = await this.repo.suppress(id);
      else if (targetStatus === 'blocked') updated = await this.repo.block(id);
      else updated = await this.repo.void(id);
      await this.audit.record(ctx, eventType, 'updated', `Draft ${id} ${pastTense}`, { pauseActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markActionDraftReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    return this.runStatusTransition(ctx, id, 'review_ready', 'reviewReadyAt', 'PAUSE_DRAFT_REVIEW_READY', 'markPauseActionDraftReviewReady', 'review ready');
  }

  async approveActionDraftForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    return this.runStatusTransition(ctx, id, 'approved_for_future_use', 'approvedForFutureUseAt', 'PAUSE_DRAFT_APPROVED', 'approvePauseActionDraftForFutureUse', 'approved');
  }

  async suppressActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    return this.runStatusTransition(ctx, id, 'suppressed', 'suppressedAt', 'PAUSE_DRAFT_SUPPRESSED', 'suppressPauseActionDraft', 'suppressed');
  }

  async blockActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    return this.runStatusTransition(ctx, id, 'blocked', 'blockedAt', 'PAUSE_DRAFT_BLOCKED', 'blockPauseActionDraft', 'blocked');
  }

  async voidActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryPauseActionDraft>> {
    return this.runStatusTransition(ctx, id, 'voided', 'voidedAt', 'PAUSE_DRAFT_VOIDED', 'voidPauseActionDraft', 'voided');
  }
}
