import { RecoveryIntensificationActionDraftRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryIntensificationActionDraft, CreateIntensificationActionDraftRequest, ActionDraftStatus } from '../contracts/recoveryActionDraftContracts';
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

const DRAFT_CREATION_POLICY = 'RECOVERY_INTENSIFICATION_ACTION_DRAFT_CREATION';
const RESOURCE_TYPE = 'RecoveryIntensificationActionDraft' as const;

/**
 * R8-G.3B-A hardened Intensification action draft service: atomic
 * resource + audit + idempotency mutations when a preparation atomic store
 * is supplied; canonical identity from verified context only.
 */
export class RecoveryIntensificationActionDraftService {
  constructor(
    private repo: RecoveryIntensificationActionDraftRepository,
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

  async createIntensificationActionDraft(ctx: RecoveryOutcomeActionCommandContext, req: CreateIntensificationActionDraftRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>;
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.validatePackage19Ref(req.recoveryIntensificationDecisionDraftId, 'recoveryIntensificationDecisionDraftId');

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
      const record: RecoveryIntensificationActionDraft = {
        intensificationActionDraftId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryIntensificationDecisionDraftId: req.recoveryIntensificationDecisionDraftId,
        recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId,
        draftStatus: 'draft',
        safeActionSummary: req.safeActionSummary,
        intensificationDetailsJson: req.intensificationDetailsJson,
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
          recoveryIntensificationDecisionDraftId: record.recoveryIntensificationDecisionDraftId,
          recoveryOutcomeDecisionSummaryId: record.recoveryOutcomeDecisionSummaryId ?? null,
          safeActionSummary: record.safeActionSummary,
          intensificationDetailsJson: record.intensificationDetailsJson,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createIntensificationActionDraft',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: RESOURCE_TYPE,
            mutate: async (tx) => {
              const draftRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryIntensificationActionDraftRepository)(tx);
              const created = await draftRepo.create(record);
              return { resource: created, resourceId: created.intensificationActionDraftId };
            },
            load: async (tx, resourceId) => {
              const draftRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryIntensificationActionDraftRepository)(tx);
              return draftRepo.getById(resourceId);
            },
            audit: {
              eventType: 'INTENSIFICATION_ACTION_DRAFT_CREATED',
              decision: 'created',
              safeSummary: `Intensification draft ${record.intensificationActionDraftId}`,
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

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createIntensificationActionDraft', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'INTENSIFICATION_ACTION_DRAFT_CREATED', 'created', `Intensification draft ${created.intensificationActionDraftId}`, { intensificationActionDraftId: created.intensificationActionDraftId });
      await this.idempotency.markCompleted(ctx, RESOURCE_TYPE, created.intensificationActionDraftId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getActionDraft(id: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionDraftsForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft[]>> {
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
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>;

      if (this.atomicStore) {
        const canonicalInput = { intensificationActionDraftId: id };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation,
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: RESOURCE_TYPE,
            mutate: async (tx) => {
              const draftRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryIntensificationActionDraftRepository)(tx);
              const existing = await draftRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Draft not found');
                err.notFound = true;
                throw err;
              }
              const updated = await draftRepo.update(id, { draftStatus: targetStatus, [timestampField]: new Date() } as any);
              return { resource: updated, resourceId: updated.intensificationActionDraftId };
            },
            load: async (tx, resourceId) => {
              const draftRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryIntensificationActionDraftRepository)(tx);
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
      let updated: RecoveryIntensificationActionDraft;
      if (targetStatus === 'review_ready') updated = await this.repo.markReviewReady(id);
      else if (targetStatus === 'approved_for_future_use') updated = await this.repo.approveForFutureUse(id);
      else if (targetStatus === 'suppressed') updated = await this.repo.suppress(id);
      else if (targetStatus === 'blocked') updated = await this.repo.block(id);
      else updated = await this.repo.void(id);
      await this.audit.record(ctx, eventType, 'updated', `Draft ${id} ${pastTense}`, { intensificationActionDraftId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markActionDraftReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>> {
    return this.runStatusTransition(ctx, id, 'review_ready', 'reviewReadyAt', 'INTENSIFICATION_DRAFT_REVIEW_READY', 'markIntensificationActionDraftReviewReady', 'review ready');
  }

  async approveActionDraftForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>> {
    return this.runStatusTransition(ctx, id, 'approved_for_future_use', 'approvedForFutureUseAt', 'INTENSIFICATION_DRAFT_APPROVED', 'approveIntensificationActionDraftForFutureUse', 'approved');
  }

  async suppressActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>> {
    return this.runStatusTransition(ctx, id, 'suppressed', 'suppressedAt', 'INTENSIFICATION_DRAFT_SUPPRESSED', 'suppressIntensificationActionDraft', 'suppressed');
  }

  async blockActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>> {
    return this.runStatusTransition(ctx, id, 'blocked', 'blockedAt', 'INTENSIFICATION_DRAFT_BLOCKED', 'blockIntensificationActionDraft', 'blocked');
  }

  async voidActionDraft(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryIntensificationActionDraft>> {
    return this.runStatusTransition(ctx, id, 'voided', 'voidedAt', 'INTENSIFICATION_DRAFT_VOIDED', 'voidIntensificationActionDraft', 'voided');
  }
}
