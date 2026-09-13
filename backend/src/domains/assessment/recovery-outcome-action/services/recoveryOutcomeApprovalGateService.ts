import { RecoveryOutcomeApprovalGateRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeApprovalGate, CreateApprovalGateRequest, ApprovalGateStatus } from '../contracts/recoveryOutcomeApprovalGateContracts';
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

const APPROVAL_GATE_POLICY = 'RECOVERY_OUTCOME_APPROVAL_GATE_CREATION';

/**
 * R8-G.3B-B hardened Approval Gate service.
 *
 * DURABLE PREPARATION STATE: an approval gate represents approval
 * readiness/status only. It never authorizes or executes live recovery.
 *
 * When a PrismaRecoveryOutcomeActionPreparationAtomicStore is supplied all
 * mutation paths (create / satisfied / blocked / void) run atomically:
 * resource + audit + idempotency in ONE transaction. Canonical identity
 * (school/actor/role) always comes from the verified command context; body
 * identity is never trusted.
 */
export class RecoveryOutcomeApprovalGateService {
  constructor(
    private repo: RecoveryOutcomeApprovalGateRepository,
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
      this.safety.enforceOrThrow(ctx.actorRole, APPROVAL_GATE_POLICY);
      return null;
    } catch (err: unknown) {
      return err instanceof Error ? err.message : 'Access denied';
    }
  }

  private crossSchoolMismatch(reqSchoolId: string | undefined, ctx: RecoveryOutcomeActionCommandContext): boolean {
    return Boolean(reqSchoolId && reqSchoolId !== ctx.schoolId);
  }

  async createApprovalGate(ctx: RecoveryOutcomeActionCommandContext, req: CreateApprovalGateRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>;
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
      const record: RecoveryOutcomeApprovalGate = {
        approvalGateId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId,
        gateStatus: 'pending',
        safeGateSummary: req.safeGateSummary,
        requiredApprovalsJson: req.requiredApprovalsJson,
        approvalResultsJson: {},
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
          recoveryOutcomeDecisionSummaryId: record.recoveryOutcomeDecisionSummaryId ?? null,
          safeGateSummary: record.safeGateSummary,
          requiredApprovalsJson: record.requiredApprovalsJson,
          sourceRefsJson: record.sourceRefsJson,
        };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation: 'createApprovalGate',
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeApprovalGate',
            mutate: async (tx) => {
              const gateRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeApprovalGateRepository)(tx);
              const created = await gateRepo.create(record);
              return { resource: created, resourceId: created.approvalGateId };
            },
            load: async (tx, resourceId) => {
              const gateRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeApprovalGateRepository)(tx);
              return gateRepo.getById(resourceId);
            },
            audit: {
              eventType: 'APPROVAL_GATE_CREATED',
              decision: 'created',
              safeSummary: `Gate ${record.approvalGateId} created`,
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

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createApprovalGate', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate request', idempotencyKey: ctx.idempotencyKey };

      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'APPROVAL_GATE_CREATED', 'created', `Gate ${created.approvalGateId} created`, { approvalGateId: created.approvalGateId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeApprovalGate', created.approvalGateId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getApprovalGate(id: string, schoolId?: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Approval gate not found' };
      if (schoolId && record.schoolId !== schoolId) {
        return { success: false, status: 'NOT_FOUND', message: 'Approval gate not found' };
      }
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listApprovalGatesForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listApprovalGatesForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listApprovalGatesByStatus(schoolId: string, status: ApprovalGateStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  private async runStatusTransition(
    ctx: RecoveryOutcomeActionCommandContext,
    id: string,
    targetStatus: 'satisfied' | 'blocked' | 'voided',
    timestampField: 'satisfiedAt' | 'blockedAt' | 'voidedAt',
    eventType: string,
    operation: string,
    pastTense: string,
  ): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    try {
      const identityError = this.checkVerifiedIdentity(ctx);
      if (identityError) return this.denyIdentity(identityError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>;
      const roleError = this.checkRole(ctx);
      if (roleError) return this.denyRole(roleError) as RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>;

      if (this.atomicStore) {
        const canonicalInput = { approvalGateId: id };
        try {
          const outcome = await this.atomicStore.mutateWithGuards({
            schoolId: ctx.schoolId,
            operation,
            idempotencyKey: ctx.idempotencyKey,
            canonicalInput,
            resourceType: 'RecoveryOutcomeApprovalGate',
            mutate: async (tx) => {
              const gateRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeApprovalGateRepository)(tx);
              const existing = await gateRepo.getById(id);
              if (!existing || existing.schoolId !== ctx.schoolId) {
                const err: any = new Error('Approval gate not found');
                err.notFound = true;
                throw err;
              }
              const updated = await gateRepo.update(id, { gateStatus: targetStatus, [timestampField]: new Date() } as any);
              return { resource: updated, resourceId: updated.approvalGateId };
            },
            load: async (tx, resourceId) => {
              const gateRepo = new (this.repo.constructor as new (txClient: unknown) => RecoveryOutcomeApprovalGateRepository)(tx);
              return gateRepo.getById(resourceId);
            },
            audit: {
              eventType,
              decision: 'updated',
              safeSummary: `Gate ${id} ${pastTense}`,
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
            return { success: false, status: 'NOT_FOUND', message: 'Approval gate not found' };
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

      this.safety.enforceOrThrow(ctx.actorRole, APPROVAL_GATE_POLICY);
      let updated: RecoveryOutcomeApprovalGate;
      if (targetStatus === 'satisfied') updated = await this.repo.markSatisfied(id);
      else if (targetStatus === 'blocked') updated = await this.repo.markBlocked(id);
      else updated = await this.repo.void(id);
      await this.audit.record(ctx, eventType, 'updated', `Gate ${id} ${pastTense}`, { approvalGateId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markApprovalGateSatisfied(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    return this.runStatusTransition(ctx, id, 'satisfied', 'satisfiedAt', 'APPROVAL_GATE_SATISFIED', 'markApprovalGateSatisfied', 'satisfied');
  }

  async markApprovalGateBlocked(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    return this.runStatusTransition(ctx, id, 'blocked', 'blockedAt', 'APPROVAL_GATE_BLOCKED', 'markApprovalGateBlocked', 'blocked');
  }

  async voidApprovalGate(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeApprovalGate>> {
    return this.runStatusTransition(ctx, id, 'voided', 'voidedAt', 'APPROVAL_GATE_VOIDED', 'voidApprovalGate', 'voided');
  }
}