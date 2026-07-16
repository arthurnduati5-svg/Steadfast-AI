import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, RecoveryCaseTriageReadinessStatus } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseTriageSummary, CreateTriageSummaryRequest } from '../contracts/recoveryCaseTriageSummaryContracts';
import { RecoveryCaseTriageSummaryRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export class RecoveryCaseTriageSummaryService {
  constructor(private repo: RecoveryCaseTriageSummaryRepository) {}

  async createTriageSummary(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreateTriageSummaryRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record = {
        triageSummaryId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: body.studentRef,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        queueSnapshotId: body.queueSnapshotId ?? null,
        triageSummaryStatus: 'draft',
        totalScore: body.totalScore,
        priorityBand: body.priorityBand,
        riskRank: body.riskRank,
        readinessSummary: body.readinessSummary ?? '',
        fairnessSummary: body.fairnessSummary ?? '',
        capacitySummary: body.capacitySummary ?? '',
        queueSummary: body.queueSummary ?? '',
        summaryDetailsJson: body.summaryDetailsJson ?? {},
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

  async getTriageSummary(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Triage summary not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTriageSummariesForSchool(schoolId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTriageSummariesForStudent(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTriageSummariesForPlan(schoolId: string, planId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async refreshTriageSummary(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.refresh(id);
      return { success: true, data: updated, status: 'refreshed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markTriageSummaryReviewReady(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markTriageSummaryStale(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markStale(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockTriageSummary(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.block(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidTriageSummary(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageSummary>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_SUMMARY_MUTATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
