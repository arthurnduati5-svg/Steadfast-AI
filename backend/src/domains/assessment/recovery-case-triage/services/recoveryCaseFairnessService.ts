import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, RecoveryCaseFairnessStatus, PROHIBITED_RANKING_FACTORS } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseFairnessCheck, CreateFairnessCheckRequest } from '../contracts/recoveryCaseFairnessContracts';
import { RecoveryCaseFairnessCheckRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export class RecoveryCaseFairnessService {
  constructor(private repo: RecoveryCaseFairnessCheckRepository) {}

  async createFairnessCheck(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreateFairnessCheckRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseFairnessCheck>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_FAIRNESS_CHECK_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record = {
        fairnessCheckId: uuid(),
        schoolId: ctx.schoolId,
        priorityAssessmentId: body.priorityAssessmentId,
        queueSnapshotId: body.queueSnapshotId ?? null,
        queueItemId: body.queueItemId ?? null,
        fairnessStatus: 'allowed',
        safeFairnessSummary: body.safeFairnessSummary ?? '',
        fairnessChecksJson: body.fairnessChecksJson ?? {},
        blockedReasonCodesJson: [],
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

  async evaluateFairnessCheck(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreateFairnessCheckRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseFairnessCheck>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_FAIRNESS_CHECK_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };

      const factorsToCheck = body.fairnessChecksJson ?? {};
      const factorKeys = Object.keys(factorsToCheck);
      const blockedFactors = factorKeys.filter(k => PROHIBITED_RANKING_FACTORS.includes(k as any));
      const foundProhibited = blockedFactors.length > 0;

      const now = new Date().toISOString();
      const record = {
        fairnessCheckId: uuid(),
        schoolId: ctx.schoolId,
        priorityAssessmentId: body.priorityAssessmentId,
        queueSnapshotId: body.queueSnapshotId ?? null,
        queueItemId: body.queueItemId ?? null,
        fairnessStatus: foundProhibited ? 'blocked' : 'allowed',
        safeFairnessSummary: foundProhibited
          ? `Blocked: prohibited factors detected: ${blockedFactors.join(', ')}`
          : 'All factors are allowed by fairness policy',
        fairnessChecksJson: body.fairnessChecksJson ?? {},
        blockedReasonCodesJson: foundProhibited ? blockedFactors.map(f => `PROHIBITED_FACTOR:${f}`) : [],
        sourceRefsJson: body.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };
      const created = await this.repo.create(record);
      if (foundProhibited) {
        return { success: false, data: created, status: 'blocked', message: `Prohibited ranking factors detected: ${blockedFactors.join(', ')}`, correlationId: ctx.correlationId };
      }
      return { success: true, data: created, status: 'allowed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getFairnessCheck(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseFairnessCheck>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Fairness check not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listFairnessChecksForAssessment(priorityAssessmentId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseFairnessCheck[]>> {
    try {
      const records = await this.repo.listByAssessment(priorityAssessmentId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listFairnessChecksForQueue(queueSnapshotId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseFairnessCheck[]>> {
    try {
      const records = await this.repo.listByQueue(queueSnapshotId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listFairnessChecksByStatus(schoolId: string, status: RecoveryCaseFairnessStatus | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseFairnessCheck[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markFairnessNeedsReview(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseFairnessCheck>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_FAIRNESS_CHECK_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.update(id, { fairnessStatus: 'needs_review' } as any);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockFairnessCheck(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseFairnessCheck>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_FAIRNESS_CHECK_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.block(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidFairnessCheck(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseFairnessCheck>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_FAIRNESS_CHECK_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
