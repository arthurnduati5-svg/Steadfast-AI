import { RecoveryOutcomeActionSummaryRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeActionSummary, CreateActionSummaryRequest, ActionSummaryStatus } from '../contracts/recoveryOutcomeActionSummaryContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeActionSummaryService {
  constructor(
    private repo: RecoveryOutcomeActionSummaryRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createActionSummary(ctx: RecoveryOutcomeActionCommandContext, req: CreateActionSummaryRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_SUMMARY_MUTATION');
      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createActionSummary', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate', idempotencyKey: ctx.idempotencyKey };
      const now = new Date();
      const record: RecoveryOutcomeActionSummary = {
        actionSummaryId: uuid(), schoolId: req.schoolId, studentRef: req.studentRef,
        teacherRef: req.teacherRef, resultRecoveryPlanId: req.resultRecoveryPlanId,
        summaryStatus: 'active', safeSummary: req.safeSummary,
        actionCountsJson: req.actionCountsJson, topActionsJson: req.topActionsJson,
        nextStepsJson: req.nextStepsJson, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'ACTION_SUMMARY_CREATED', 'created', `Summary ${created.actionSummaryId}`, { actionSummaryId: created.actionSummaryId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeActionSummary', created.actionSummaryId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) { return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey }; }
  }

  async getActionSummary(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try { const d = await this.repo.getById(id); if (!d) return { success: false, status: 'NOT_FOUND' }; return { success: true, data: d, status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionSummariesForSchool(schoolId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary[]>> {
    try { return { success: true, data: await this.repo.listBySchool(schoolId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionSummariesForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionSummariesForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async refreshActionSummary(ctx: RecoveryOutcomeActionCommandContext, id: string, data: Partial<RecoveryOutcomeActionSummary>): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_SUMMARY_MUTATION');
      const updated = await this.repo.refresh(id, data);
      await this.audit.record(ctx, 'ACTION_SUMMARY_REFRESHED', 'updated', `Summary ${id} refreshed`, { actionSummaryId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markActionSummaryStale(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_SUMMARY_MUTATION');
      const updated = await this.repo.markStale(id);
      await this.audit.record(ctx, 'ACTION_SUMMARY_STALE', 'updated', `Summary ${id} stale`, { actionSummaryId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async blockActionSummary(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_SUMMARY_MUTATION');
      const updated = await this.repo.block(id);
      await this.audit.record(ctx, 'ACTION_SUMMARY_BLOCKED', 'updated', `Summary ${id} blocked`, { actionSummaryId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidActionSummary(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionSummary>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_SUMMARY_MUTATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'ACTION_SUMMARY_VOIDED', 'updated', `Summary ${id} voided`, { actionSummaryId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}
