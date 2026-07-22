import {
  RecoveryDeferredIntegrationTicket,
  CreateRecoveryDeferredIntegrationTicketRequest,
} from '../contracts/recoveryDeferredIntegrationTicketContracts';
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

export class RecoveryDeferredIntegrationTicketService {
  constructor(
    private repos: IRecoveryLifecycleClosureRepositories,
    private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer,
    private safety: RecoveryLifecycleClosureSafetyService,
    private audit: RecoveryLifecycleClosureAuditBridge,
    private idempotency: RecoveryLifecycleClosureIdempotencyService,
  ) {}

  async createDeferredIntegrationTicket(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryDeferredIntegrationTicketRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_DEFERRED_INTEGRATION_TICKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createDeferredIntegrationTicket', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateDeferredIntegrationTicketContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createDeferredIntegrationTicket', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createDeferredIntegrationTicket', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryDeferredIntegrationTicket> = {
        deferredIntegrationTicketId: uuid(),
        schoolId: ctx.schoolId,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        ticketType: request.ticketType,
        ticketStatus: 'draft',
        safeTicketSummary: request.safeTicketSummary,
        ticketDetailsJson: request.ticketDetailsJson ?? {},
        priority: request.priority,
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.deferredIntegrationTicket.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'DEFERRED_INTEGRATION_TICKET_CREATED',
        decision: 'created',
        safeSummary: `Deferred integration ticket ${created.deferredIntegrationTicketId} created`,
        deferredIntegrationTicketId: created.deferredIntegrationTicketId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createDeferredIntegrationTicket', ctx.idempotencyKey, 'deferredIntegrationTicket', created.deferredIntegrationTicketId, `Deferred integration ticket ${created.deferredIntegrationTicketId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getDeferredIntegrationTicket(schoolId: string, ticketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket>> {
    try {
      const record = await this.repos.deferredIntegrationTicket.getById(ticketId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Deferred integration ticket not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDeferredIntegrationTicketsForSchool(schoolId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket[]>> {
    try {
      const records = await this.repos.deferredIntegrationTicket.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDeferredIntegrationTicketsForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket[]>> {
    try {
      const records = await this.repos.deferredIntegrationTicket.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDeferredIntegrationTicketsByType(schoolId: string, ticketType: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket[]>> {
    try {
      const records = await this.repos.deferredIntegrationTicket.listByType(schoolId, ticketType);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDeferredIntegrationTicketsByStatus(schoolId: string, ticketStatus: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket[]>> {
    try {
      const records = await this.repos.deferredIntegrationTicket.listByStatus(schoolId, ticketStatus);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markDeferredIntegrationTicketReviewReady(ctx: RecoveryLifecycleClosureCommandContext, ticketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_DEFERRED_INTEGRATION_TICKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.deferredIntegrationTicket.markReviewReady(ticketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'DEFERRED_INTEGRATION_TICKET_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Deferred integration ticket ${ticketId} marked review ready`,
        deferredIntegrationTicketId: ticketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveDeferredIntegrationTicketForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, ticketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_DEFERRED_INTEGRATION_TICKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.deferredIntegrationTicket.approveForFutureUse(ticketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'DEFERRED_INTEGRATION_TICKET_APPROVED',
        decision: 'updated',
        safeSummary: `Deferred integration ticket ${ticketId} approved for future use`,
        deferredIntegrationTicketId: ticketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressDeferredIntegrationTicket(ctx: RecoveryLifecycleClosureCommandContext, ticketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_DEFERRED_INTEGRATION_TICKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.deferredIntegrationTicket.suppress(ticketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'DEFERRED_INTEGRATION_TICKET_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Deferred integration ticket ${ticketId} suppressed`,
        deferredIntegrationTicketId: ticketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockDeferredIntegrationTicket(ctx: RecoveryLifecycleClosureCommandContext, ticketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_DEFERRED_INTEGRATION_TICKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.deferredIntegrationTicket.block(ticketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'DEFERRED_INTEGRATION_TICKET_BLOCKED',
        decision: 'updated',
        safeSummary: `Deferred integration ticket ${ticketId} blocked`,
        deferredIntegrationTicketId: ticketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidDeferredIntegrationTicket(ctx: RecoveryLifecycleClosureCommandContext, ticketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryDeferredIntegrationTicket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_DEFERRED_INTEGRATION_TICKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.deferredIntegrationTicket.void(ticketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'DEFERRED_INTEGRATION_TICKET_VOIDED',
        decision: 'updated',
        safeSummary: `Deferred integration ticket ${ticketId} voided`,
        deferredIntegrationTicketId: ticketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}
