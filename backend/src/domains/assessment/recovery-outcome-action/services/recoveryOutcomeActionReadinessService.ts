import { RecoveryOutcomeActionReadinessRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeActionReadiness, CreateActionReadinessRequest, RecoveryOutcomeActionReadinessStatus } from '../contracts/recoveryOutcomeActionReadinessContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import type {
  PrismaRecoveryOutcomeActionReadinessAtomicStore,
} from '../repositories/prismaRecoveryOutcomeActionReadinessAtomicStore';
import {
  RecoveryOutcomeActionIdempotencyConflictError,
  RecoveryOutcomeActionIdempotencyInProgressError,
  RecoveryOutcomeActionReadinessNotFoundError,
  R8G2_TRANSITION_OPERATIONS,
} from '../repositories/prismaRecoveryOutcomeActionReadinessAtomicStore';
import { v4 as uuid } from 'uuid';

const READINESS_CREATION_POLICY = 'RECOVERY_OUTCOME_ACTION_READINESS_CREATION';

export class RecoveryOutcomeActionReadinessService {
  constructor(
    private repo: RecoveryOutcomeActionReadinessRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
    private atomicStore?: PrismaRecoveryOutcomeActionReadinessAtomicStore | null,
  ) {}

  private denyIdentity(message: string): RecoveryOutcomeActionSafeEnvelope<never> {
    return { success: false, status: 'DENIED', code: 'VERIFIED_IDENTITY_REQUIRED', message };
  }

  private denyRole(message: string): RecoveryOutcomeActionSafeEnvelope<never> {
    return { success: false, status: 'DENIED', code: 'ROLE_NOT_ALLOWED', message };
  }

  private checkVerifiedIdentity(ctx: RecoveryOutcomeActionCommandContext): string | null {
    if (!ctx.schoolId || !ctx.actorId) {
      return 'Missing verified actor identity';
    }
    return null;
  }

  private checkRole(ctx: RecoveryOutcomeActionCommandContext): string | null {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, READINESS_CREATION_POLICY);
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Access denied';
    }
  }

  async createActionReadiness(
    ctx: RecoveryOutcomeActionCommandContext,
    req: CreateActionReadinessRequest,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>;
      this.safety.validatePackage19Ref(req.recoveryOutcomeDecisionReadinessId, 'recoveryOutcomeDecisionReadinessId');

      // Canonical identity always comes from the verified command context.
      // Caller-controlled body identity must never become canonical truth.
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
      const record: RecoveryOutcomeActionReadiness = {
        actionReadinessId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryOutcomeDecisionReadinessId: req.recoveryOutcomeDecisionReadinessId,
        recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId,
        readinessStatus: 'draft',
        safeReadinessSummary: req.safeReadinessSummary,
        readinessChecksJson: req.readinessChecksJson,
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
          recoveryOutcomeDecisionReadinessId: record.recoveryOutcomeDecisionReadinessId,
          recoveryOutcomeDecisionSummaryId: record.recoveryOutcomeDecisionSummaryId ?? null,
          safeReadinessSummary: record.safeReadinessSummary,
          readinessChecksJson: record.readinessChecksJson,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.createWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createActionReadiness',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            readiness: record,
            audit: {
              eventType: 'ACTION_READINESS_CREATED',
              decision: 'created',
              safeSummary: `Action readiness ${record.actionReadinessId} created`,
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
              data: outcome.readiness,
              idempotencyKey: ctx.idempotencyKey,
            };
          }
          return { success: true, data: outcome.readiness, status: 'created', idempotencyKey: ctx.idempotencyKey };
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

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createActionReadiness', req as any);
      if (isDuplicate) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'ACTION_READINESS_CREATED', 'created', `Action readiness ${created.actionReadinessId} created`, { actionReadinessId: created.actionReadinessId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeActionReadiness', created.actionReadinessId);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getActionReadiness(
    id: string,
    schoolId?: string,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Action readiness not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Action readiness not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listActionReadinessForSchool(schoolId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listActionReadinessForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listActionReadinessForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listActionReadinessByStatus(schoolId: string, status: RecoveryOutcomeActionReadinessStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, status as any);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  private async guardScopedTarget(
    ctx: RecoveryOutcomeActionCommandContext,
    id: string,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness> | RecoveryOutcomeActionReadiness> {
    const identityError = this.checkVerifiedIdentity(ctx);
    if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>;
    const roleError = this.checkRole(ctx);
    if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>;
    const existing = await this.repo.getById(id);
    if (!existing || existing.schoolId !== ctx.schoolId) {
      return { success: false, status: 'NOT_FOUND', message: 'Action readiness not found' };
    }
    return existing;
  }

  private async runStatusTransition(
    ctx: RecoveryOutcomeActionCommandContext,
    id: string,
    targetStatus: RecoveryOutcomeActionReadinessStatus,
    timestampField:
      | 'reviewReadyAt'
      | 'approvedForFutureUseAt'
      | 'suppressedAt'
      | 'blockedAt'
      | 'voidedAt',
    eventType: string,
    pastTense: string,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    try {
      if (this.atomicStore) {
        const identityError = this.checkVerifiedIdentity(ctx);
        if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>;
        const roleError = this.checkRole(ctx);
        if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>;
        try {
          const outcome = await this.atomicStore.transitionWithGuards({
            schoolId: ctx.schoolId,
            operation: R8G2_TRANSITION_OPERATIONS[targetStatus],
            idempotencyKey: ctx.idempotencyKey,
            readinessId: id,
            targetStatus,
            statusTimestampField: timestampField,
            canonicalInput: {},
            audit: {
              eventType,
              decision: 'updated',
              safeSummary: `Action readiness ${id} ${pastTense}`,
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
              data: outcome.readiness,
              idempotencyKey: ctx.idempotencyKey,
            };
          }
          return { success: true, data: outcome.readiness, status: 'updated' };
        } catch (err) {
          if (err instanceof RecoveryOutcomeActionReadinessNotFoundError) {
            return { success: false, status: 'NOT_FOUND', message: 'Action readiness not found' };
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

      const guarded = await this.guardScopedTarget(ctx, id);
      if (!('actionReadinessId' in guarded)) return guarded;
      let updated: RecoveryOutcomeActionReadiness;
      if (targetStatus === 'review_ready') updated = await this.repo.markReviewReady(id);
      else if (targetStatus === 'approved_for_future_use') updated = await this.repo.approveForFutureUse(id);
      else if (targetStatus === 'suppressed') updated = await this.repo.suppress(id);
      else if (targetStatus === 'blocked') updated = await this.repo.block(id);
      else updated = await this.repo.void(id);
      await this.audit.record(ctx, eventType, 'updated', `Action readiness ${id} ${pastTense}`, { actionReadinessId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markActionReadinessReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    return this.runStatusTransition(ctx, id, 'review_ready', 'reviewReadyAt', 'ACTION_READINESS_REVIEW_READY', 'marked review ready');
  }

  async approveActionReadinessForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    return this.runStatusTransition(ctx, id, 'approved_for_future_use', 'approvedForFutureUseAt', 'ACTION_READINESS_APPROVED', 'approved for future use');
  }

  async suppressActionReadiness(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    return this.runStatusTransition(ctx, id, 'suppressed', 'suppressedAt', 'ACTION_READINESS_SUPPRESSED', 'suppressed');
  }

  async blockActionReadiness(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    return this.runStatusTransition(ctx, id, 'blocked', 'blockedAt', 'ACTION_READINESS_BLOCKED', 'blocked');
  }

  async voidActionReadiness(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionReadiness>> {
    return this.runStatusTransition(ctx, id, 'voided', 'voidedAt', 'ACTION_READINESS_VOIDED', 'voided');
  }
}
