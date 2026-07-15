import { RecoveryExecutionRiskAttestation } from '../contracts/recoveryExecutionRiskAttestationContracts';
import { RecoveryExecutionRiskAttestationRepository } from '../contracts/recoveryExecutionAuthorizationRepositoryContracts';
import { RecoveryExecutionAuthorizationPreviewCommandContext, RecoveryExecutionAuthorizationPreviewSafeEnvelope } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';
import { RecoveryExecutionAuthorizationPreviewPolicyDefinitions } from '../policies/recoveryExecutionAuthorizationPreviewPolicyDefinitions';
import { RecoveryExecutionAuthorizationAuditBridge } from './recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from './recoveryExecutionAuthorizationIdempotencyService';
import { v4 as uuid } from 'uuid';

interface CreateRiskAttestationBody {
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  recoveryApprovalChainDraftId?: string;
  riskLevel: string;
  safeAttestationSummary: string;
  riskDetailsJson?: Record<string, any>;
  mitigationsJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

export class RecoveryExecutionRiskAttestationService {
  constructor(
    private repo: RecoveryExecutionRiskAttestationRepository,
    private audit: RecoveryExecutionAuthorizationAuditBridge,
    private idempotency: RecoveryExecutionAuthorizationIdempotencyService,
  ) {}

  async createRiskAttestation(
    ctx: RecoveryExecutionAuthorizationPreviewCommandContext,
    schoolId: string,
    body: CreateRiskAttestationBody,
  ): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }

      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_RISK_ATTESTATION_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }

      const idleCheck = await this.idempotency.check(ctx.schoolId, 'createRiskAttestation', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', correlationId: ctx.correlationId };
      }

      const requestHash = JSON.stringify({ operation: 'createRiskAttestation', body });
      await this.idempotency.record(ctx.schoolId, 'createRiskAttestation', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionRiskAttestation> = {
        riskAttestationId: uuid(),
        schoolId: ctx.schoolId,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        recoveryLifecycleClosureReadinessId: body.recoveryLifecycleClosureReadinessId,
        recoveryApprovalChainDraftId: body.recoveryApprovalChainDraftId,
        riskLevel: body.riskLevel,
        attestationStatus: 'draft',
        safeAttestationSummary: body.safeAttestationSummary,
        riskDetailsJson: body.riskDetailsJson ?? {},
        mitigationsJson: body.mitigationsJson ?? {},
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
        eventType: 'RISK_ATTESTATION_CREATED', decision: 'created',
        safeSummary: `Risk attestation ${created.riskAttestationId} created`,
        correlationId: ctx.correlationId, metadata: { body },
      });
      await this.idempotency.complete(ctx.schoolId, 'createRiskAttestation', ctx.idempotencyKey, 'riskAttestation', created.riskAttestationId, `Risk attestation ${created.riskAttestationId} created`);

      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getRiskAttestation(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation>> {
    try {
      const record = await this.repo.getById(schoolId, id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Risk attestation not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRiskAttestationsForPlan(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRiskAttestationsByRiskLevel(schoolId: string, riskLevel: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation[]>> {
    try {
      const records = await this.repo.listByRiskLevel(schoolId, riskLevel);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listRiskAttestationsByStatus(schoolId: string, status: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markRiskAttestationReviewReady(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_RISK_ATTESTATION_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { attestationStatus: 'review_ready', reviewReadyAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'RISK_ATTESTATION_REVIEW_READY', decision: 'updated',
        safeSummary: `Risk attestation ${id} marked review ready`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markRiskAttested(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_RISK_ATTESTATION_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, {
        attestationStatus: 'risk_attested',
        attestorActorId: ctx.actorId,
        attestorRole: ctx.actorRole,
        attestedAt: now,
        riskAttestedAt: now,
        updatedAt: now,
      } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'RISK_ATTESTED', decision: 'updated',
        safeSummary: `Risk attestation ${id} attested`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async vetoRiskAttestation(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_RISK_ATTESTATION_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { attestationStatus: 'vetoed', vetoedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'RISK_ATTESTATION_VETOED', decision: 'updated',
        safeSummary: `Risk attestation ${id} vetoed`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async suppressRiskAttestation(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_RISK_ATTESTATION_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { suppressedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'RISK_ATTESTATION_SUPPRESSED', decision: 'updated',
        safeSummary: `Risk attestation ${id} suppressed`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockRiskAttestation(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string, reasonCodes: string[]): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_RISK_ATTESTATION_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { blockedAt: now, blockedReasonCodesJson: reasonCodes, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'RISK_ATTESTATION_BLOCKED', decision: 'updated',
        safeSummary: `Risk attestation ${id} blocked`, correlationId: ctx.correlationId,
        reasonCodes,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidRiskAttestation(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionRiskAttestation>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_RISK_ATTESTATION_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { voidedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'RISK_ATTESTATION_VOIDED', decision: 'updated',
        safeSummary: `Risk attestation ${id} voided`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
