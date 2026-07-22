import {
  RecoveryUnresolvedRiskRegister,
  CreateRecoveryUnresolvedRiskRegisterRequest,
} from '../contracts/recoveryUnresolvedRiskRegisterContracts';
import {
  RecoveryLifecycleClosureCommandContext,
  RecoveryLifecycleClosureSafeEnvelope,
} from '../contracts/recoveryLifecycleClosureContracts';
import { IRecoveryLifecycleClosureRepositories } from '../contracts/recoveryLifecycleClosureRepositoryContracts';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureSafetyService } from './recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from './recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from './recoveryLifecycleClosureIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryUnresolvedRiskRegisterService {
  constructor(
    private repos: IRecoveryLifecycleClosureRepositories,
    private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer,
    private safety: RecoveryLifecycleClosureSafetyService,
    private audit: RecoveryLifecycleClosureAuditBridge,
    private idempotency: RecoveryLifecycleClosureIdempotencyService,
  ) {}

  async createUnresolvedRiskRegister(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryUnresolvedRiskRegisterRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_UNRESOLVED_RISK_REGISTER_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createUnresolvedRiskRegister', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateUnresolvedRiskRegisterContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createUnresolvedRiskRegister', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createUnresolvedRiskRegister', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryUnresolvedRiskRegister> = {
        unresolvedRiskRegisterId: uuid(),
        schoolId: ctx.schoolId,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        riskLevel: request.riskLevel,
        riskStatus: 'draft',
        safeRiskSummary: request.safeRiskSummary,
        riskDetailsJson: request.riskDetailsJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.unresolvedRiskRegister.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'UNRESOLVED_RISK_REGISTER_CREATED',
        decision: 'created',
        safeSummary: `Unresolved risk register ${created.unresolvedRiskRegisterId} created`,
        unresolvedRiskRegisterId: created.unresolvedRiskRegisterId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createUnresolvedRiskRegister', ctx.idempotencyKey, 'unresolvedRiskRegister', created.unresolvedRiskRegisterId, `Unresolved risk register ${created.unresolvedRiskRegisterId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getUnresolvedRiskRegister(schoolId: string, riskRegisterId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister>> {
    try {
      const record = await this.repos.unresolvedRiskRegister.getById(riskRegisterId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Unresolved risk register not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listUnresolvedRiskRegistersForSchool(schoolId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister[]>> {
    try {
      const records = await this.repos.unresolvedRiskRegister.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listUnresolvedRiskRegistersForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister[]>> {
    try {
      const records = await this.repos.unresolvedRiskRegister.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listUnresolvedRiskRegistersByRiskLevel(schoolId: string, riskLevel: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister[]>> {
    try {
      const records = await this.repos.unresolvedRiskRegister.listByRiskLevel(schoolId, riskLevel);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listUnresolvedRiskRegistersByStatus(schoolId: string, riskStatus: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister[]>> {
    try {
      const records = await this.repos.unresolvedRiskRegister.listByStatus(schoolId, riskStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markUnresolvedRiskReviewReady(ctx: RecoveryLifecycleClosureCommandContext, riskRegisterId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_UNRESOLVED_RISK_REGISTER_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.unresolvedRiskRegister.markReviewReady(riskRegisterId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'UNRESOLVED_RISK_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Unresolved risk register ${riskRegisterId} marked review ready`,
        unresolvedRiskRegisterId: riskRegisterId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressUnresolvedRisk(ctx: RecoveryLifecycleClosureCommandContext, riskRegisterId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_UNRESOLVED_RISK_REGISTER_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.unresolvedRiskRegister.suppress(riskRegisterId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'UNRESOLVED_RISK_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Unresolved risk register ${riskRegisterId} suppressed`,
        unresolvedRiskRegisterId: riskRegisterId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockUnresolvedRisk(ctx: RecoveryLifecycleClosureCommandContext, riskRegisterId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_UNRESOLVED_RISK_REGISTER_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.unresolvedRiskRegister.block(riskRegisterId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'UNRESOLVED_RISK_BLOCKED',
        decision: 'updated',
        safeSummary: `Unresolved risk register ${riskRegisterId} blocked`,
        unresolvedRiskRegisterId: riskRegisterId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidUnresolvedRisk(ctx: RecoveryLifecycleClosureCommandContext, riskRegisterId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryUnresolvedRiskRegister>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_UNRESOLVED_RISK_REGISTER_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.unresolvedRiskRegister.void(riskRegisterId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'UNRESOLVED_RISK_VOIDED',
        decision: 'updated',
        safeSummary: `Unresolved risk register ${riskRegisterId} voided`,
        unresolvedRiskRegisterId: riskRegisterId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}
