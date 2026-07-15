import { IBlockedActionDiagnosticRepository } from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';
import { RecoveryOutcomeExecutionBlockedActionDiagnostic, CreateBlockedActionDiagnosticRequest } from '../contracts/recoveryOutcomeExecutionBlockedActionDiagnosticContracts';
import { RecoveryOutcomeExecutionSimulationCommandContext, RecoveryOutcomeExecutionSimulationSafeEnvelope } from '../contracts/recoveryOutcomeExecutionSimulationContracts';
import { RecoveryOutcomeExecutionSimulationSafetyService } from './recoveryOutcomeExecutionSimulationSafetyService';
import { RecoveryOutcomeExecutionSimulationAuditBridge } from './recoveryOutcomeExecutionSimulationAuditBridge';
import { RecoveryOutcomeExecutionSimulationIdempotencyService } from './recoveryOutcomeExecutionSimulationIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeExecutionBlockedActionDiagnosticService {
  constructor(
    private repo: IBlockedActionDiagnosticRepository,
    private safety: RecoveryOutcomeExecutionSimulationSafetyService,
    private audit: RecoveryOutcomeExecutionSimulationAuditBridge,
    private idempotency: RecoveryOutcomeExecutionSimulationIdempotencyService,
  ) {}

  async createBlockedActionDiagnostic(
    ctx: RecoveryOutcomeExecutionSimulationCommandContext,
    req: CreateBlockedActionDiagnosticRequest,
  ): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_BLOCKED_ACTION_DIAGNOSTIC_CREATION');

      const existing = await this.idempotency.checkIdempotency(ctx.schoolId, 'createBlockedActionDiagnostic', ctx.idempotencyKey);
      if (existing && existing.status === 'completed') {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateContent(req.safeDiagnosticSummary, req.diagnosticDetailsJson ?? {});
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = await this.idempotency.computeRequestHash('createBlockedActionDiagnostic', req as any);
      await this.idempotency.createIdempotencyEntry(ctx.schoolId, 'createBlockedActionDiagnostic', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryOutcomeExecutionBlockedActionDiagnostic> = {
        blockedActionDiagnosticId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId,
        simulationRunId: req.simulationRunId,
        recoveryOutcomeActionBundleId: req.recoveryOutcomeActionBundleId,
        diagnosticStatus: 'draft',
        safeDiagnosticSummary: req.safeDiagnosticSummary,
        blockedReasonCodesJson: req.blockedReasonCodesJson ?? [],
        diagnosticDetailsJson: req.diagnosticDetailsJson ?? {},
        sourceRefsJson: req.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repo.create(record);
      await this.audit.recordSimulationEvent(ctx, 'BLOCKED_ACTION_DIAGNOSTIC_CREATED', 'created', `Blocked action diagnostic ${created.blockedActionDiagnosticId} created`, { blockedActionDiagnosticId: created.blockedActionDiagnosticId });
      await this.idempotency.markCompleted(ctx.schoolId, 'createBlockedActionDiagnostic', ctx.idempotencyKey, `Blocked action diagnostic ${created.blockedActionDiagnosticId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getBlockedActionDiagnostic(schoolId: string, diagnosticId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic>> {
    try {
      const record = await this.repo.getById(diagnosticId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Blocked action diagnostic not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDiagnosticsForSimulationRun(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>> {
    try {
      const records = await this.repo.listBySimulationRunId(simulationRunId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDiagnosticsForPlan(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, resultRecoveryPlanId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDiagnosticsByReason(schoolId: string, reasonCode: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic[]>> {
    try {
      const records = await this.repo.listByReason(schoolId, reasonCode);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markDiagnosticReviewReady(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, diagnosticId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_BLOCKED_ACTION_DIAGNOSTIC_CREATION');
      const updated = await this.repo.markReviewReady(diagnosticId);
      await this.audit.recordSimulationEvent(ctx, 'BLOCKED_ACTION_DIAGNOSTIC_REVIEW_READY', 'updated', `Blocked action diagnostic ${diagnosticId} marked review ready`, { blockedActionDiagnosticId: diagnosticId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressDiagnostic(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, diagnosticId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_BLOCKED_ACTION_DIAGNOSTIC_CREATION');
      const updated = await this.repo.suppress(diagnosticId);
      await this.audit.recordSimulationEvent(ctx, 'BLOCKED_ACTION_DIAGNOSTIC_SUPPRESSED', 'updated', `Blocked action diagnostic ${diagnosticId} suppressed`, { blockedActionDiagnosticId: diagnosticId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidDiagnostic(ctx: RecoveryOutcomeExecutionSimulationCommandContext, schoolId: string, diagnosticId: string): Promise<RecoveryOutcomeExecutionSimulationSafeEnvelope<RecoveryOutcomeExecutionBlockedActionDiagnostic>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_EXECUTION_BLOCKED_ACTION_DIAGNOSTIC_CREATION');
      const updated = await this.repo.void(diagnosticId);
      await this.audit.recordSimulationEvent(ctx, 'BLOCKED_ACTION_DIAGNOSTIC_VOIDED', 'updated', `Blocked action diagnostic ${diagnosticId} voided`, { blockedActionDiagnosticId: diagnosticId });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}
