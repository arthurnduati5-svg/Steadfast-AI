import {
  RecoveryTeacherClosureReviewPacket,
  RecoveryAdminGovernanceReviewPacket,
  CreateRecoveryTeacherClosureReviewPacketRequest,
  CreateRecoveryAdminGovernanceReviewPacketRequest,
} from '../contracts/recoveryClosureReviewPacketContracts';
import {
  RecoveryLifecycleClosureCommandContext,
  RecoveryLifecycleClosureSafeEnvelope,
} from '../contracts/recoveryLifecycleClosureContracts';
import { InMemoryRecoveryLifecycleClosureRepositories } from '../repositories/inMemoryRecoveryLifecycleClosureRepositories';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureSafetyService } from './recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from './recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from './recoveryLifecycleClosureIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryClosureReviewPacketService {
  constructor(
    private repos: InMemoryRecoveryLifecycleClosureRepositories,
    private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer,
    private safety: RecoveryLifecycleClosureSafetyService,
    private audit: RecoveryLifecycleClosureAuditBridge,
    private idempotency: RecoveryLifecycleClosureIdempotencyService,
  ) {}

  async createTeacherClosureReviewPacket(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryTeacherClosureReviewPacketRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_TEACHER_CLOSURE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createTeacherClosureReviewPacket', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateTeacherClosureReviewPacketContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createTeacherClosureReviewPacket', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createTeacherClosureReviewPacket', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryTeacherClosureReviewPacket> = {
        teacherClosureReviewPacketId: uuid(),
        schoolId: ctx.schoolId,
        teacherRef: request.teacherRef,
        studentRef: request.studentRef,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        recoveryOutcomeExecutionSimulationSummaryId: request.recoveryOutcomeExecutionSimulationSummaryId,
        reviewStatus: 'draft',
        safeTeacherReviewSummary: request.safeTeacherReviewSummary,
        teacherReviewNotesJson: request.teacherReviewNotesJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.teacherClosureReviewPacket.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'TEACHER_CLOSURE_REVIEW_PACKET_CREATED',
        decision: 'created',
        safeSummary: `Teacher closure review packet ${created.teacherClosureReviewPacketId} created`,
        teacherClosureReviewPacketId: created.teacherClosureReviewPacketId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createTeacherClosureReviewPacket', ctx.idempotencyKey, 'teacherClosureReviewPacket', created.teacherClosureReviewPacketId, `Teacher closure review packet ${created.teacherClosureReviewPacketId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getTeacherClosureReviewPacket(schoolId: string, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket>> {
    try {
      const record = await this.repos.teacherClosureReviewPacket.getById(packetId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Teacher closure review packet not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTeacherClosureReviewPacketsForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket[]>> {
    try {
      const records = await this.repos.teacherClosureReviewPacket.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTeacherClosureReviewPacketsByStatus(schoolId: string, status: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket[]>> {
    try {
      const records = await this.repos.teacherClosureReviewPacket.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markTeacherClosureReviewPacketReviewReady(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_TEACHER_CLOSURE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.teacherClosureReviewPacket.markReviewReady(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'TEACHER_CLOSURE_REVIEW_PACKET_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Teacher closure review packet ${packetId} marked review ready`,
        teacherClosureReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveTeacherClosureReviewPacketForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_TEACHER_CLOSURE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.teacherClosureReviewPacket.approveForFutureUse(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'TEACHER_CLOSURE_REVIEW_PACKET_APPROVED',
        decision: 'updated',
        safeSummary: `Teacher closure review packet ${packetId} approved for future use`,
        teacherClosureReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressTeacherClosureReviewPacket(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_TEACHER_CLOSURE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.teacherClosureReviewPacket.suppress(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'TEACHER_CLOSURE_REVIEW_PACKET_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Teacher closure review packet ${packetId} suppressed`,
        teacherClosureReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockTeacherClosureReviewPacket(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_TEACHER_CLOSURE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.teacherClosureReviewPacket.block(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'TEACHER_CLOSURE_REVIEW_PACKET_BLOCKED',
        decision: 'updated',
        safeSummary: `Teacher closure review packet ${packetId} blocked`,
        teacherClosureReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidTeacherClosureReviewPacket(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryTeacherClosureReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_TEACHER_CLOSURE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.teacherClosureReviewPacket.void(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'TEACHER_CLOSURE_REVIEW_PACKET_VOIDED',
        decision: 'updated',
        safeSummary: `Teacher closure review packet ${packetId} voided`,
        teacherClosureReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async createAdminGovernanceReviewPacket(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryAdminGovernanceReviewPacketRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ADMIN_GOVERNANCE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createAdminGovernanceReviewPacket', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateAdminGovernanceReviewPacketContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createAdminGovernanceReviewPacket', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createAdminGovernanceReviewPacket', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryAdminGovernanceReviewPacket> = {
        adminGovernanceReviewPacketId: uuid(),
        schoolId: ctx.schoolId,
        adminRef: request.adminRef,
        studentRef: request.studentRef,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        recoveryOutcomeExecutionSimulationSummaryId: request.recoveryOutcomeExecutionSimulationSummaryId,
        reviewStatus: 'draft',
        safeAdminReviewSummary: request.safeAdminReviewSummary,
        governanceReviewNotesJson: request.governanceReviewNotesJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.adminGovernanceReviewPacket.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ADMIN_GOVERNANCE_REVIEW_PACKET_CREATED',
        decision: 'created',
        safeSummary: `Admin governance review packet ${created.adminGovernanceReviewPacketId} created`,
        adminGovernanceReviewPacketId: created.adminGovernanceReviewPacketId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createAdminGovernanceReviewPacket', ctx.idempotencyKey, 'adminGovernanceReviewPacket', created.adminGovernanceReviewPacketId, `Admin governance review packet ${created.adminGovernanceReviewPacketId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getAdminGovernanceReviewPacket(schoolId: string, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket>> {
    try {
      const record = await this.repos.adminGovernanceReviewPacket.getById(packetId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Admin governance review packet not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAdminGovernanceReviewPacketsForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket[]>> {
    try {
      const records = await this.repos.adminGovernanceReviewPacket.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAdminGovernanceReviewPacketsByStatus(schoolId: string, status: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket[]>> {
    try {
      const records = await this.repos.adminGovernanceReviewPacket.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markAdminGovernanceReviewPacketReviewReady(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ADMIN_GOVERNANCE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.adminGovernanceReviewPacket.markReviewReady(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ADMIN_GOVERNANCE_REVIEW_PACKET_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Admin governance review packet ${packetId} marked review ready`,
        adminGovernanceReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveAdminGovernanceReviewPacketForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ADMIN_GOVERNANCE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.adminGovernanceReviewPacket.approveForFutureUse(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ADMIN_GOVERNANCE_REVIEW_PACKET_APPROVED',
        decision: 'updated',
        safeSummary: `Admin governance review packet ${packetId} approved for future use`,
        adminGovernanceReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressAdminGovernanceReviewPacket(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ADMIN_GOVERNANCE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.adminGovernanceReviewPacket.suppress(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ADMIN_GOVERNANCE_REVIEW_PACKET_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Admin governance review packet ${packetId} suppressed`,
        adminGovernanceReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockAdminGovernanceReviewPacket(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ADMIN_GOVERNANCE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.adminGovernanceReviewPacket.block(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ADMIN_GOVERNANCE_REVIEW_PACKET_BLOCKED',
        decision: 'updated',
        safeSummary: `Admin governance review packet ${packetId} blocked`,
        adminGovernanceReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidAdminGovernanceReviewPacket(ctx: RecoveryLifecycleClosureCommandContext, packetId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryAdminGovernanceReviewPacket>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ADMIN_GOVERNANCE_REVIEW_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.adminGovernanceReviewPacket.void(packetId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ADMIN_GOVERNANCE_REVIEW_PACKET_VOIDED',
        decision: 'updated',
        safeSummary: `Admin governance review packet ${packetId} voided`,
        adminGovernanceReviewPacketId: packetId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}
