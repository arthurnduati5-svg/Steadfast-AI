import { RecoveryExecutionPreLiveDecisionPacket } from '../contracts/recoveryExecutionPreLiveDecisionPacketContracts';
import { RecoveryExecutionPreLiveDecisionPacketRepository } from '../contracts/recoveryExecutionAuthorizationRepositoryContracts';
import { RecoveryExecutionAuthorizationPreviewCommandContext, RecoveryExecutionAuthorizationPreviewSafeEnvelope } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';
import { RecoveryExecutionAuthorizationPreviewPolicyDefinitions } from '../policies/recoveryExecutionAuthorizationPreviewPolicyDefinitions';
import { RecoveryExecutionAuthorizationAuditBridge } from './recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from './recoveryExecutionAuthorizationIdempotencyService';
import { v4 as uuid } from 'uuid';

interface CreatePreLiveDecisionPacketBody {
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryAuthorizationDryRunId?: string;
  safePacketSummary: string;
  decisionPacketJson?: Record<string, any>;
  authorizationChainJson?: Record<string, any>;
  riskSummaryJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

export class RecoveryExecutionPreLiveDecisionPacketService {
  constructor(
    private repo: RecoveryExecutionPreLiveDecisionPacketRepository,
    private audit: RecoveryExecutionAuthorizationAuditBridge,
    private idempotency: RecoveryExecutionAuthorizationIdempotencyService,
  ) {}

  async createPreLiveDecisionPacket(
    ctx: RecoveryExecutionAuthorizationPreviewCommandContext,
    schoolId: string,
    body: CreatePreLiveDecisionPacketBody,
  ): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionPreLiveDecisionPacket>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }

      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_PRE_LIVE_DECISION_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }

      const idleCheck = await this.idempotency.check(ctx.schoolId, 'createPreLiveDecisionPacket', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', correlationId: ctx.correlationId };
      }

      const requestHash = JSON.stringify({ operation: 'createPreLiveDecisionPacket', body });
      await this.idempotency.record(ctx.schoolId, 'createPreLiveDecisionPacket', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionPreLiveDecisionPacket> = {
        preLiveDecisionPacketId: uuid(),
        schoolId: ctx.schoolId,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        recoveryLifecycleClosureReadinessId: body.recoveryLifecycleClosureReadinessId,
        recoveryAuthorizationDryRunId: body.recoveryAuthorizationDryRunId,
        packetStatus: 'draft',
        safePacketSummary: body.safePacketSummary,
        decisionPacketJson: body.decisionPacketJson ?? {},
        authorizationChainJson: body.authorizationChainJson ?? {},
        riskSummaryJson: body.riskSummaryJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: body.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'PRE_LIVE_DECISION_PACKET_CREATED', decision: 'created',
        safeSummary: `Pre-live decision packet ${created.preLiveDecisionPacketId} created`,
        correlationId: ctx.correlationId, metadata: { body },
      });
      await this.idempotency.complete(ctx.schoolId, 'createPreLiveDecisionPacket', ctx.idempotencyKey, 'preLiveDecisionPacket', created.preLiveDecisionPacketId, `Pre-live decision packet ${created.preLiveDecisionPacketId} created`);

      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getPreLiveDecisionPacket(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionPreLiveDecisionPacket>> {
    try {
      const record = await this.repo.getById(schoolId, id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Pre-live decision packet not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listPreLiveDecisionPacketsForPlan(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionPreLiveDecisionPacket[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listPreLiveDecisionPacketsByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionPreLiveDecisionPacket[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markPreLiveDecisionPacketReviewReady(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionPreLiveDecisionPacket>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_PRE_LIVE_DECISION_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { packetStatus: 'review_ready', reviewReadyAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'PRE_LIVE_DECISION_PACKET_REVIEW_READY', decision: 'updated',
        safeSummary: `Pre-live decision packet ${id} marked review ready`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markPreLiveDecisionPacketPreviewReady(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionPreLiveDecisionPacket>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_PRE_LIVE_DECISION_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { packetStatus: 'authorization_preview_ready', authorizationPreviewReadyAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'PRE_LIVE_DECISION_PACKET_PREVIEW_READY', decision: 'updated',
        safeSummary: `Pre-live decision packet ${id} marked preview ready`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async suppressPreLiveDecisionPacket(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionPreLiveDecisionPacket>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_PRE_LIVE_DECISION_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { suppressedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'PRE_LIVE_DECISION_PACKET_SUPPRESSED', decision: 'updated',
        safeSummary: `Pre-live decision packet ${id} suppressed`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockPreLiveDecisionPacket(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string, reasonCodes: string[]): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionPreLiveDecisionPacket>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_PRE_LIVE_DECISION_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { blockedAt: now, blockedReasonCodesJson: reasonCodes, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'PRE_LIVE_DECISION_PACKET_BLOCKED', decision: 'updated',
        safeSummary: `Pre-live decision packet ${id} blocked`, correlationId: ctx.correlationId,
        reasonCodes,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidPreLiveDecisionPacket(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionPreLiveDecisionPacket>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_PRE_LIVE_DECISION_PACKET_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { voidedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'PRE_LIVE_DECISION_PACKET_VOIDED', decision: 'updated',
        safeSummary: `Pre-live decision packet ${id} voided`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
