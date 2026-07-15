import { RecoveryExecutionAuthorizationSummary } from '../contracts/recoveryExecutionAuthorizationSummaryContracts';
import { RecoveryExecutionAuthorizationSummaryRepository } from '../contracts/recoveryExecutionAuthorizationRepositoryContracts';
import { RecoveryExecutionAuthorizationPreviewCommandContext, RecoveryExecutionAuthorizationPreviewSafeEnvelope } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';
import { RecoveryExecutionAuthorizationPreviewPolicyDefinitions } from '../policies/recoveryExecutionAuthorizationPreviewPolicyDefinitions';
import { RecoveryExecutionAuthorizationAuditBridge } from './recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from './recoveryExecutionAuthorizationIdempotencyService';
import { v4 as uuid } from 'uuid';

interface CreateAuthorizationSummaryBody {
  studentRef?: string;
  resultRecoveryPlanId?: string;
  safeSummary: string;
  authorizationOverviewJson?: Record<string, any>;
  readinessSummaryJson?: Record<string, any>;
  requestSummaryJson?: Record<string, any>;
  eligibilitySummaryJson?: Record<string, any>;
  authorityMatrixSummaryJson?: Record<string, any>;
  approvalChainSummaryJson?: Record<string, any>;
  riskAttestationSummaryJson?: Record<string, any>;
  consentBoundarySummaryJson?: Record<string, any>;
  vetoSummaryJson?: Record<string, any>;
  preflightSummaryJson?: Record<string, any>;
  dryRunSummaryJson?: Record<string, any>;
  preLiveDecisionPacketSummaryJson?: Record<string, any>;
  mockAuthorizationReceiptSummaryJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

export class RecoveryExecutionAuthorizationSummaryService {
  constructor(
    private repo: RecoveryExecutionAuthorizationSummaryRepository,
    private audit: RecoveryExecutionAuthorizationAuditBridge,
    private idempotency: RecoveryExecutionAuthorizationIdempotencyService,
  ) {}

  async createAuthorizationSummary(
    ctx: RecoveryExecutionAuthorizationPreviewCommandContext,
    schoolId: string,
    body: CreateAuthorizationSummaryBody,
  ): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }

      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }

      const idleCheck = await this.idempotency.check(ctx.schoolId, 'createAuthorizationSummary', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', correlationId: ctx.correlationId };
      }

      const requestHash = JSON.stringify({ operation: 'createAuthorizationSummary', body });
      await this.idempotency.record(ctx.schoolId, 'createAuthorizationSummary', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionAuthorizationSummary> = {
        authorizationSummaryId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: body.studentRef,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        summaryStatus: 'draft',
        safeSummary: body.safeSummary,
        authorizationOverviewJson: body.authorizationOverviewJson ?? {},
        readinessSummaryJson: body.readinessSummaryJson ?? {},
        requestSummaryJson: body.requestSummaryJson ?? {},
        eligibilitySummaryJson: body.eligibilitySummaryJson ?? {},
        authorityMatrixSummaryJson: body.authorityMatrixSummaryJson ?? {},
        approvalChainSummaryJson: body.approvalChainSummaryJson ?? {},
        riskAttestationSummaryJson: body.riskAttestationSummaryJson ?? {},
        consentBoundarySummaryJson: body.consentBoundarySummaryJson ?? {},
        vetoSummaryJson: body.vetoSummaryJson ?? {},
        preflightSummaryJson: body.preflightSummaryJson ?? {},
        dryRunSummaryJson: body.dryRunSummaryJson ?? {},
        preLiveDecisionPacketSummaryJson: body.preLiveDecisionPacketSummaryJson ?? {},
        mockAuthorizationReceiptSummaryJson: body.mockAuthorizationReceiptSummaryJson ?? {},
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
        eventType: 'AUTHORIZATION_SUMMARY_CREATED', decision: 'created',
        safeSummary: `Authorization summary ${created.authorizationSummaryId} created`,
        correlationId: ctx.correlationId, metadata: { body },
      });
      await this.idempotency.complete(ctx.schoolId, 'createAuthorizationSummary', ctx.idempotencyKey, 'authorizationSummary', created.authorizationSummaryId, `Authorization summary ${created.authorizationSummaryId} created`);

      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getAuthorizationSummary(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary>> {
    try {
      const record = await this.repo.getById(schoolId, id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Authorization summary not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAuthorizationSummariesForSchool(schoolId: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAuthorizationSummariesForStudent(schoolId: string, studentRef: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAuthorizationSummariesForPlan(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async refreshAuthorizationSummary(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { refreshedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'AUTHORIZATION_SUMMARY_REFRESHED', decision: 'updated',
        safeSummary: `Authorization summary ${id} refreshed`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markAuthorizationSummaryStale(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { staleAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'AUTHORIZATION_SUMMARY_STALE', decision: 'updated',
        safeSummary: `Authorization summary ${id} marked stale`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markAuthorizationSummaryReviewReady(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { summaryStatus: 'review_ready', reviewReadyAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'AUTHORIZATION_SUMMARY_REVIEW_READY', decision: 'updated',
        safeSummary: `Authorization summary ${id} marked review ready`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockAuthorizationSummary(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string, reasonCodes: string[]): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { blockedAt: now, blockedReasonCodesJson: reasonCodes, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'AUTHORIZATION_SUMMARY_BLOCKED', decision: 'updated',
        safeSummary: `Authorization summary ${id} blocked`, correlationId: ctx.correlationId,
        reasonCodes,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidAuthorizationSummary(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationSummary>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { voidedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'AUTHORIZATION_SUMMARY_VOIDED', decision: 'updated',
        safeSummary: `Authorization summary ${id} voided`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
