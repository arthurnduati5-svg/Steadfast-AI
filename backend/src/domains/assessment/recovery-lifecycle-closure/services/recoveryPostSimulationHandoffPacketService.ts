import {
  RecoveryPostSimulationHandoffPacket,
  CreateRecoveryPostSimulationHandoffPacketRequest,
} from '../contracts/recoveryPostSimulationHandoffPacketContracts';
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

export class RecoveryPostSimulationHandoffPacketService {
  constructor(
    private repos: IRecoveryLifecycleClosureRepositories,
    private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer,
    private safety: RecoveryLifecycleClosureSafetyService,
    private audit: RecoveryLifecycleClosureAuditBridge,
    private idempotency: RecoveryLifecycleClosureIdempotencyService,
  ) {}

  async createHandoffPacket(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryPostSimulationHandoffPacketRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_POST_SIMULATION_HANDOFF_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createHandoffPacket', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateHandoffPacketContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createHandoffPacket', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createHandoffPacket', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryPostSimulationHandoffPacket> = {
        handoffPacketId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: request.studentRef,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        recoveryOutcomeExecutionSimulationRunId: request.recoveryOutcomeExecutionSimulationRunId,
        recoveryOutcomeExecutionSimulationResultId: request.recoveryOutcomeExecutionSimulationResultId,
        recoveryOutcomeActionBundleId: request.recoveryOutcomeActionBundleId,
        handoffStatus: 'draft',
        safeHandoffSummary: request.safeHandoffSummary,
        handoffContentsJson: request.handoffContentsJson ?? {},
        nextStepsJson: request.nextStepsJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.handoffPacket.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'HANDOFF_PACKET_CREATED',
        decision: 'created',
        safeSummary: `Handoff packet ${created.handoffPacketId} created`,
        handoffPacketId: created.handoffPacketId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createHandoffPacket', ctx.idempotencyKey, 'handoffPacket', created.handoffPacketId, `Handoff packet ${created.handoffPacketId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getHandoffPacket(schoolId: string, handoffPacketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket>> {
    try {
      const record = await this.repos.handoffPacket.getById(handoffPacketId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Handoff packet not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listHandoffPacketsForSchool(schoolId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket[]>> {
    try {
      const records = await this.repos.handoffPacket.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listHandoffPacketsForStudent(schoolId: string, studentRef: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket[]>> {
    try {
      const records = await this.repos.handoffPacket.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listHandoffPacketsForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket[]>> {
    try {
      const records = await this.repos.handoffPacket.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listHandoffPacketsForSimulationRun(schoolId: string, simulationRunId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket[]>> {
    try {
      const records = await this.repos.handoffPacket.listBySimulationRunId(simulationRunId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listHandoffPacketsByStatus(schoolId: string, status: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket[]>> {
    try {
      const records = await this.repos.handoffPacket.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markHandoffPacketReviewReady(ctx: RecoveryLifecycleClosureCommandContext, handoffPacketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_POST_SIMULATION_HANDOFF_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.handoffPacket.markReviewReady(handoffPacketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'HANDOFF_PACKET_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Handoff packet ${handoffPacketId} marked review ready`,
        handoffPacketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markHandoffPacketHandoffReady(ctx: RecoveryLifecycleClosureCommandContext, handoffPacketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_POST_SIMULATION_HANDOFF_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.handoffPacket.markHandoffReady(handoffPacketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'HANDOFF_PACKET_HANDOFF_READY',
        decision: 'updated',
        safeSummary: `Handoff packet ${handoffPacketId} marked handoff ready`,
        handoffPacketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveHandoffPacketForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, handoffPacketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_POST_SIMULATION_HANDOFF_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.handoffPacket.approveForFutureUse(handoffPacketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'HANDOFF_PACKET_APPROVED',
        decision: 'updated',
        safeSummary: `Handoff packet ${handoffPacketId} approved for future use`,
        handoffPacketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressHandoffPacket(ctx: RecoveryLifecycleClosureCommandContext, handoffPacketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_POST_SIMULATION_HANDOFF_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.handoffPacket.suppress(handoffPacketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'HANDOFF_PACKET_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Handoff packet ${handoffPacketId} suppressed`,
        handoffPacketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockHandoffPacket(ctx: RecoveryLifecycleClosureCommandContext, handoffPacketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_POST_SIMULATION_HANDOFF_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.handoffPacket.block(handoffPacketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'HANDOFF_PACKET_BLOCKED',
        decision: 'updated',
        safeSummary: `Handoff packet ${handoffPacketId} blocked`,
        handoffPacketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidHandoffPacket(ctx: RecoveryLifecycleClosureCommandContext, handoffPacketId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryPostSimulationHandoffPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_POST_SIMULATION_HANDOFF_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.handoffPacket.void(handoffPacketId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'HANDOFF_PACKET_VOIDED',
        decision: 'updated',
        safeSummary: `Handoff packet ${handoffPacketId} voided`,
        handoffPacketId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}
