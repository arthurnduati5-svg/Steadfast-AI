import { RecoveryExecutionConsentBoundaryCheck } from '../contracts/recoveryExecutionConsentBoundaryContracts';
import { RecoveryExecutionConsentBoundaryCheckRepository } from '../contracts/recoveryExecutionAuthorizationRepositoryContracts';
import { RecoveryExecutionAuthorizationPreviewCommandContext, RecoveryExecutionAuthorizationPreviewSafeEnvelope } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';
import { RecoveryExecutionAuthorizationPreviewPolicyDefinitions } from '../policies/recoveryExecutionAuthorizationPreviewPolicyDefinitions';
import { RecoveryExecutionAuthorizationAuditBridge } from './recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from './recoveryExecutionAuthorizationIdempotencyService';
import { v4 as uuid } from 'uuid';

interface CreateConsentBoundaryCheckBody {
  studentRef?: string;
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  decision: string;
  safeConsentSummary: string;
  consentBoundaryDetailsJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

export class RecoveryExecutionConsentBoundaryService {
  constructor(
    private repo: RecoveryExecutionConsentBoundaryCheckRepository,
    private audit: RecoveryExecutionAuthorizationAuditBridge,
    private idempotency: RecoveryExecutionAuthorizationIdempotencyService,
  ) {}

  async createConsentBoundaryCheck(
    ctx: RecoveryExecutionAuthorizationPreviewCommandContext,
    schoolId: string,
    body: CreateConsentBoundaryCheckBody,
  ): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionConsentBoundaryCheck>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }

      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_CONSENT_BOUNDARY_CHECK_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }

      const idleCheck = await this.idempotency.check(ctx.schoolId, 'createConsentBoundaryCheck', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', correlationId: ctx.correlationId };
      }

      const requestHash = JSON.stringify({ operation: 'createConsentBoundaryCheck', body });
      await this.idempotency.record(ctx.schoolId, 'createConsentBoundaryCheck', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionConsentBoundaryCheck> = {
        consentBoundaryCheckId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: body.studentRef,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        recoveryLifecycleClosureReadinessId: body.recoveryLifecycleClosureReadinessId,
        decision: body.decision,
        safeConsentSummary: body.safeConsentSummary,
        consentBoundaryDetailsJson: body.consentBoundaryDetailsJson ?? {},
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
        eventType: 'CONSENT_BOUNDARY_CHECK_CREATED', decision: 'created',
        safeSummary: `Consent boundary check ${created.consentBoundaryCheckId} created`,
        correlationId: ctx.correlationId, metadata: { body },
      });
      await this.idempotency.complete(ctx.schoolId, 'createConsentBoundaryCheck', ctx.idempotencyKey, 'consentBoundaryCheck', created.consentBoundaryCheckId, `Consent boundary check ${created.consentBoundaryCheckId} created`);

      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getConsentBoundaryCheck(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionConsentBoundaryCheck>> {
    try {
      const record = await this.repo.getById(schoolId, id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Consent boundary check not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listConsentBoundaryChecksForPlan(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionConsentBoundaryCheck[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listConsentBoundaryChecksByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionConsentBoundaryCheck[]>> {
    try {
      const records = await this.repo.listByDecision(schoolId, decision);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markConsentBoundaryReviewReady(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionConsentBoundaryCheck>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_CONSENT_BOUNDARY_CHECK_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { reviewReadyAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'CONSENT_BOUNDARY_REVIEW_READY', decision: 'updated',
        safeSummary: `Consent boundary check ${id} marked review ready`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockConsentBoundaryCheck(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string, reasonCodes: string[]): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionConsentBoundaryCheck>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_CONSENT_BOUNDARY_CHECK_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { blockedAt: now, blockedReasonCodesJson: reasonCodes, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'CONSENT_BOUNDARY_BLOCKED', decision: 'updated',
        safeSummary: `Consent boundary check ${id} blocked`, correlationId: ctx.correlationId,
        reasonCodes,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidConsentBoundaryCheck(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionConsentBoundaryCheck>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_CONSENT_BOUNDARY_CHECK_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { voidedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'CONSENT_BOUNDARY_VOIDED', decision: 'updated',
        safeSummary: `Consent boundary check ${id} voided`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
