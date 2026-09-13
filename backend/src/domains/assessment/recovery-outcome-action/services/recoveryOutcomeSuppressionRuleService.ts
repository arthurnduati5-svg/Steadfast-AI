import { RecoveryOutcomeSuppressionRuleRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeSuppressionRule, CreateSuppressionRuleRequest, SuppressionRuleStatus } from '../contracts/recoveryOutcomeSuppressionRuleContracts';
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

const SUPPRESSION_RULE_POLICY = 'RECOVERY_OUTCOME_SUPPRESSION_RULE_CREATION';

/**
 * R8-G.3B-B hardened Suppression Rule service.
 *
 * DURABLE PREPARATION RULE: an `active` or future-use state inside
 * Package-20 does NOT enforce suppression on live learning behavior. No live
 * suppression engine may be added.
 *
 * When a PrismaRecoveryOutcomeActionPreparationAtomicStore is supplied all
 * mutation paths run atomically: resource + audit + idempotency in ONE
 * transaction. Canonical identity (school/actor/role) always comes from the
 * verified command context; body identity is never trusted.
 */
export class RecoveryOutcomeSuppressionRuleService {
  constructor(
    private repo: RecoveryOutcomeSuppressionRuleRepository,
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
      this.safety.enforceOrThrow(ctx.actorRole, SUPPRESSION_RULE_POLICY);
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Access denied';
    }
  }

  private crossSchoolMismatch(reqSchoolId: string | undefined, ctx: RecoveryOutcomeActionCommandContext): boolean {
    return Boolean(reqSchoolId && reqSchoolId !== ctx.schoolId);
  }

  async createSuppressionRule(ctx: RecoveryOutcomeActionCommandContext, req: CreateSuppressionRuleRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>;
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
      const record: RecoveryOutcomeSuppressionRule = {
        suppressionRuleId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        ruleStatus: 'active',
        safeRuleSummary: req.safeRuleSummary,
        ruleConditionsJson: req.ruleConditionsJson,
        ruleScopeJson: req.ruleScopeJson,
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
          safeRuleSummary: record.safeRuleSummary,
          ruleConditionsJson: record.ruleConditionsJson,
          ruleScopeJson: record.ruleScopeJson,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createSuppressionRule',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeSuppressionRule',
            mutate: async (tx) => {
              const ruleRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeSuppressionRuleRepository)(tx);
              const created = await ruleRepo.create(record);
              return { resource: created, resourceId: created.suppressionRuleId };
            },
            load: async (tx, resourceId) => {
              const ruleRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeSuppressionRuleRepository)(tx);
              return ruleRepo.getById(resourceId);
            },
            audit: {
              eventType: 'SUPPRESSION_RULE_CREATED',
              decision: 'created',
              safeSummary: `Rule ${record.suppressionRuleId} created`,
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

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createSuppressionRule', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate request', idempotencyKey: ctx.idempotencyKey };

      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'SUPPRESSION_RULE_CREATED', 'created', `Rule ${created.suppressionRuleId} created`, { suppressionRuleId: created.suppressionRuleId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeSuppressionRule', created.suppressionRuleId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getSuppressionRule(id: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Suppression rule not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Suppression rule not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listSuppressionRulesForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listSuppressionRulesByStatus(schoolId: string, status: SuppressionRuleStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  private async runStatusTransition(
    ctx: RecoveryOutcomeActionCommandContext,
    id: string,
    targetStatus: 'active' | 'suppressed' | 'blocked' | 'voided',
    timestampField: 'activatedForFutureUseAt' | 'suppressedAt' | 'blockedAt' | 'voidedAt',
    eventType: string,
    operation: string,
    pastTense: string,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>;

      if (this.atomicStore) {
        const canonicalInput = { suppressionRuleId: id };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation,
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeSuppressionRule',
            mutate: async (tx) => {
              const ruleRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeSuppressionRuleRepository)(tx);
              const existing = await ruleRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Suppression rule not found');
                err.notFound = true;
                throw err;
              }
              const updated = await ruleRepo.update(id, { ruleStatus: targetStatus, [timestampField]: new Date() } as any);
              return { resource: updated, resourceId: updated.suppressionRuleId };
            },
            load: async (tx, resourceId) => {
              const ruleRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeSuppressionRuleRepository)(tx);
              return ruleRepo.getById(resourceId);
            },
            audit: {
              eventType,
              decision: 'updated',
              safeSummary: `Rule ${id} ${pastTense}`,
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
            return { success: false, status: 'NOT_FOUND', message: 'Suppression rule not found' };
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

      this.safety.enforceOrThrow(ctx.actorRole, SUPPRESSION_RULE_POLICY);
      let updated: RecoveryOutcomeSuppressionRule;
      if (targetStatus === 'active') updated = await this.repo.activateForFutureUse(id);
      else if (targetStatus === 'suppressed') updated = await this.repo.suppress(id);
      else if (targetStatus === 'blocked') updated = await this.repo.block(id);
      else updated = await this.repo.void(id);
      await this.audit.record(ctx, eventType, 'updated', `Rule ${id} ${pastTense}`, { suppressionRuleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async activateSuppressionRuleForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    return this.runStatusTransition(ctx, id, 'active', 'activatedForFutureUseAt', 'SUPPRESSION_RULE_ACTIVATED', 'activateSuppressionRuleForFutureUse', 'activated for future use');
  }

  async suppressSuppressionRule(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    return this.runStatusTransition(ctx, id, 'suppressed', 'suppressedAt', 'SUPPRESSION_RULE_SUPPRESSED', 'suppressSuppressionRule', 'suppressed');
  }

  async blockSuppressionRule(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    return this.runStatusTransition(ctx, id, 'blocked', 'blockedAt', 'SUPPRESSION_RULE_BLOCKED', 'blockSuppressionRule', 'blocked');
  }

  async voidSuppressionRule(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeSuppressionRule>> {
    return this.runStatusTransition(ctx, id, 'voided', 'voidedAt', 'SUPPRESSION_RULE_VOIDED', 'voidSuppressionRule', 'voided');
  }
}