import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, RecoveryCaseDraftStatus } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseDuplicateSuppression, CreateDuplicateSuppressionRequest } from '../contracts/recoveryCaseDuplicateSuppressionContracts';
import { RecoveryCaseDuplicateSuppressionRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export class RecoveryCaseDuplicateSuppressionService {
  constructor(private repo: RecoveryCaseDuplicateSuppressionRepository) {}

  async createDuplicateSuppression(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreateDuplicateSuppressionRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseDuplicateSuppression>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_DUPLICATE_SUPPRESSION_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };

      const existingDupes = await this.repo.listByPlanId(schoolId, body.resultRecoveryPlanId);
      const activeDuplicate = existingDupes.find(
        d => d.suppressionStatus === 'active' || d.suppressionStatus === 'approved_for_future_use',
      );
      if (activeDuplicate) {
        return { success: false, status: 'DENIED', message: `Duplicate already exists: ${activeDuplicate.duplicateSuppressionId}`, correlationId: ctx.correlationId };
      }

      const now = new Date().toISOString();
      const record = {
        duplicateSuppressionId: uuid(),
        schoolId: ctx.schoolId,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        canonicalBoardCardId: body.canonicalBoardCardId,
        duplicateBoardCardId: body.duplicateBoardCardId,
        suppressionStatus: 'active',
        suppressionReason: body.suppressionReason,
        suppressionDetailsJson: body.suppressionDetailsJson ?? { matchingCriteria: { schoolId: ctx.schoolId, planId: body.resultRecoveryPlanId } },
        sourceRefsJson: body.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };
      const created = await this.repo.create(record);
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getDuplicateSuppression(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseDuplicateSuppression>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Duplicate suppression not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDuplicateSuppressionsForSchool(schoolId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseDuplicateSuppression[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDuplicateSuppressionsForPlan(schoolId: string, planId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseDuplicateSuppression[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listDuplicateSuppressionsByStatus(schoolId: string, status: RecoveryCaseDraftStatus | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseDuplicateSuppression[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidDuplicateSuppression(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseDuplicateSuppression>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_DUPLICATE_SUPPRESSION_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
