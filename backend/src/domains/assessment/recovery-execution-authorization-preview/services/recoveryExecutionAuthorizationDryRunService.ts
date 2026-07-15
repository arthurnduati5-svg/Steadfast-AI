import { RecoveryExecutionAuthorizationDryRun } from '../contracts/recoveryExecutionAuthorizationDryRunContracts';
import { RecoveryExecutionAuthorizationDryRunRepository } from '../contracts/recoveryExecutionAuthorizationRepositoryContracts';
import { RecoveryExecutionAuthorizationPreviewCommandContext, RecoveryExecutionAuthorizationPreviewSafeEnvelope } from '../contracts/recoveryExecutionAuthorizationPreviewContracts';
import { RecoveryExecutionAuthorizationPreviewPolicyDefinitions } from '../policies/recoveryExecutionAuthorizationPreviewPolicyDefinitions';
import { RecoveryExecutionAuthorizationAuditBridge } from './recoveryExecutionAuthorizationAuditBridge';
import { RecoveryExecutionAuthorizationIdempotencyService } from './recoveryExecutionAuthorizationIdempotencyService';
import { v4 as uuid } from 'uuid';

interface CreateAuthorizationDryRunBody {
  resultRecoveryPlanId?: string;
  recoveryLifecycleClosureReadinessId?: string;
  safeDryRunSummary: string;
  dryRunDetailsJson?: Record<string, any>;
  mockApprovalsJson?: Record<string, any>;
  mockDenialsJson?: Record<string, any>;
  sourceRefsJson?: Record<string, any>;
}

export class RecoveryExecutionAuthorizationDryRunService {
  constructor(
    private repo: RecoveryExecutionAuthorizationDryRunRepository,
    private audit: RecoveryExecutionAuthorizationAuditBridge,
    private idempotency: RecoveryExecutionAuthorizationIdempotencyService,
  ) {}

  async createAuthorizationDryRun(
    ctx: RecoveryExecutionAuthorizationPreviewCommandContext,
    schoolId: string,
    body: CreateAuthorizationDryRunBody,
  ): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationDryRun>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }

      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_DRY_RUN_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }

      const idleCheck = await this.idempotency.check(ctx.schoolId, 'createAuthorizationDryRun', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', correlationId: ctx.correlationId };
      }

      const requestHash = JSON.stringify({ operation: 'createAuthorizationDryRun', body });
      await this.idempotency.record(ctx.schoolId, 'createAuthorizationDryRun', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryExecutionAuthorizationDryRun> = {
        authorizationDryRunId: uuid(),
        schoolId: ctx.schoolId,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        recoveryLifecycleClosureReadinessId: body.recoveryLifecycleClosureReadinessId,
        dryRunDecision: 'pending',
        safeDryRunSummary: body.safeDryRunSummary,
        dryRunDetailsJson: body.dryRunDetailsJson ?? {},
        mockApprovalsJson: body.mockApprovalsJson ?? {},
        mockDenialsJson: body.mockDenialsJson ?? {},
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
        eventType: 'AUTHORIZATION_DRY_RUN_CREATED', decision: 'created',
        safeSummary: `Authorization dry run ${created.authorizationDryRunId} created`,
        correlationId: ctx.correlationId, metadata: { body },
      });
      await this.idempotency.complete(ctx.schoolId, 'createAuthorizationDryRun', ctx.idempotencyKey, 'authorizationDryRun', created.authorizationDryRunId, `Authorization dry run ${created.authorizationDryRunId} created`);

      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getAuthorizationDryRun(schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationDryRun>> {
    try {
      const record = await this.repo.getById(schoolId, id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Authorization dry run not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAuthorizationDryRunsForPlan(schoolId: string, planId: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationDryRun[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listAuthorizationDryRunsByDecision(schoolId: string, decision: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationDryRun[]>> {
    try {
      const records = await this.repo.listByDecision(schoolId, decision);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markAuthorizationDryRunReviewReady(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationDryRun>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_DRY_RUN_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { reviewReadyAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'AUTHORIZATION_DRY_RUN_REVIEW_READY', decision: 'updated',
        safeSummary: `Authorization dry run ${id} marked review ready`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markAuthorizationDryRunMockAuthorized(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationDryRun>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_DRY_RUN_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { dryRunDecision: 'mock_authorized', mockAuthorizedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'AUTHORIZATION_DRY_RUN_MOCK_AUTHORIZED', decision: 'updated',
        safeSummary: `Authorization dry run ${id} mock authorized`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markAuthorizationDryRunMockDenied(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationDryRun>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_DRY_RUN_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { dryRunDecision: 'mock_denied', mockDeniedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'AUTHORIZATION_DRY_RUN_MOCK_DENIED', decision: 'updated',
        safeSummary: `Authorization dry run ${id} mock denied`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidAuthorizationDryRun(ctx: RecoveryExecutionAuthorizationPreviewCommandContext, schoolId: string, id: string): Promise<RecoveryExecutionAuthorizationPreviewSafeEnvelope<RecoveryExecutionAuthorizationDryRun>> {
    try {
      if (ctx.schoolId !== schoolId) {
        return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      }
      const decision = RecoveryExecutionAuthorizationPreviewPolicyDefinitions.check('RECOVERY_EXECUTION_AUTHORIZATION_DRY_RUN_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      }
      const now = new Date().toISOString();
      const updated = await this.repo.update(id, { voidedAt: now, updatedAt: now } as any);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId, actorId: ctx.actorId, actorRole: ctx.actorRole,
        eventType: 'AUTHORIZATION_DRY_RUN_VOIDED', decision: 'updated',
        safeSummary: `Authorization dry run ${id} voided`, correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
