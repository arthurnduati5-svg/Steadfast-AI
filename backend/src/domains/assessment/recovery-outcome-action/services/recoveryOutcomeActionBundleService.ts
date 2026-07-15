import { RecoveryOutcomeActionBundleRepository } from '../contracts/recoveryOutcomeActionRepositoryContracts';
import { RecoveryOutcomeActionBundle, CreateActionBundleRequest, ActionBundleStatus } from '../contracts/recoveryOutcomeActionBundleContracts';
import { RecoveryOutcomeActionCommandContext, RecoveryOutcomeActionSafeEnvelope } from '../contracts/recoveryOutcomeActionContracts';
import { RecoveryOutcomeActionSafetyService } from './recoveryOutcomeActionSafetyService';
import { RecoveryOutcomeActionAuditBridge } from './recoveryOutcomeActionAuditBridge';
import { RecoveryOutcomeActionIdempotencyService } from './recoveryOutcomeActionIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryOutcomeActionBundleService {
  constructor(
    private repo: RecoveryOutcomeActionBundleRepository,
    private safety: RecoveryOutcomeActionSafetyService,
    private audit: RecoveryOutcomeActionAuditBridge,
    private idempotency: RecoveryOutcomeActionIdempotencyService,
  ) {}

  async createActionBundle(ctx: RecoveryOutcomeActionCommandContext, req: CreateActionBundleRequest): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      this.safety.validateSchoolContext(ctx.schoolId);
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_BUNDLE_CREATION');

      const { isDuplicate } = await this.idempotency.processIdempotency(ctx, 'createActionBundle', req as any);
      if (isDuplicate) return { success: false, status: 'DUPLICATE', message: 'Duplicate request', idempotencyKey: ctx.idempotencyKey };

      const now = new Date();
      const record: RecoveryOutcomeActionBundle = {
        actionBundleId: uuid(), schoolId: req.schoolId, studentRef: req.studentRef,
        resultRecoveryPlanId: req.resultRecoveryPlanId, recoveryOutcomeDecisionSummaryId: req.recoveryOutcomeDecisionSummaryId,
        bundleStatus: 'draft', safeBundleSummary: req.safeBundleSummary, readinessRefsJson: req.readinessRefsJson,
        draftRefsJson: req.draftRefsJson, bundleType: req.bundleType, blockedReasonCodesJson: [],
        sourceRefsJson: req.sourceRefsJson ?? {}, createdByActorId: req.createdByActorId, createdByRole: req.createdByRole,
        createdAt: now, updatedAt: now,
      };
      const created = await this.repo.create(record);
      await this.audit.record(ctx, 'ACTION_BUNDLE_CREATED', 'created', `Bundle ${created.actionBundleId} created`, { actionBundleId: created.actionBundleId });
      await this.idempotency.markCompleted(ctx, 'RecoveryOutcomeActionBundle', created.actionBundleId);
      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getActionBundle(id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Bundle not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionBundlesForSchool(schoolId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle[]>> {
    try { return { success: true, data: await this.repo.listBySchool(schoolId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionBundlesForStudent(schoolId: string, studentRef: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle[]>> {
    try { return { success: true, data: await this.repo.listByStudentRef(schoolId, studentRef), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionBundlesForPlan(schoolId: string, planId: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle[]>> {
    try { return { success: true, data: await this.repo.listByPlanId(schoolId, planId), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async listActionBundlesByStatus(schoolId: string, status: ActionBundleStatus): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle[]>> {
    try { return { success: true, data: await this.repo.listByStatus(schoolId, status as any), status: 'found' }; }
    catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async markActionBundleReviewReady(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_BUNDLE_CREATION');
      const updated = await this.repo.markReviewReady(id);
      await this.audit.record(ctx, 'ACTION_BUNDLE_REVIEW_READY', 'updated', `Bundle ${id} review ready`, { actionBundleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async approveActionBundleForFutureUse(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_BUNDLE_CREATION');
      const updated = await this.repo.approveForFutureUse(id);
      await this.audit.record(ctx, 'ACTION_BUNDLE_APPROVED', 'updated', `Bundle ${id} approved`, { actionBundleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async suppressActionBundle(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_BUNDLE_CREATION');
      const updated = await this.repo.suppress(id);
      await this.audit.record(ctx, 'ACTION_BUNDLE_SUPPRESSED', 'updated', `Bundle ${id} suppressed`, { actionBundleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async blockActionBundle(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_BUNDLE_CREATION');
      const updated = await this.repo.block(id);
      await this.audit.record(ctx, 'ACTION_BUNDLE_BLOCKED', 'updated', `Bundle ${id} blocked`, { actionBundleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }

  async voidActionBundle(ctx: RecoveryOutcomeActionCommandContext, id: string): Promise<RecoveryOutcomeActionSafeEnvelope<RecoveryOutcomeActionBundle>> {
    try {
      this.safety.enforceOrThrow(ctx.actorRole, 'RECOVERY_OUTCOME_ACTION_BUNDLE_CREATION');
      const updated = await this.repo.void(id);
      await this.audit.record(ctx, 'ACTION_BUNDLE_VOIDED', 'updated', `Bundle ${id} voided`, { actionBundleId: id });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) { return { success: false, status: 'error', message: err.message }; }
  }
}
