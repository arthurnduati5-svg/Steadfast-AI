import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, RecoveryCaseTriageReadinessStatus } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseTriageReadiness, CreateTriageReadinessRequest } from '../contracts/recoveryCaseTriageReadinessContracts';
import { RecoveryCaseTriageReadinessRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export class RecoveryCaseTriageReadinessService {
  constructor(private repo: RecoveryCaseTriageReadinessRepository) {}

  async createTriageReadiness(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreateTriageReadinessRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record = {
        triageReadinessId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: body.studentRef,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        boardSnapshotId: body.boardSnapshotId,
        boardCardId: body.boardCardId,
        triageStatus: 'draft',
        safeReadinessSummary: body.safeReadinessSummary ?? '',
        readinessChecksJson: body.readinessChecksJson ?? {},
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

  async getTriageReadiness(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Triage readiness not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTriageReadinessForSchool(schoolId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTriageReadinessForStudent(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness[]>> {
    try {
      const records = await this.repo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTriageReadinessForPlan(schoolId: string, planId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness[]>> {
    try {
      const records = await this.repo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listTriageReadinessByStatus(schoolId: string, status: RecoveryCaseTriageReadinessStatus | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness[]>> {
    try {
      const records = await this.repo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markTriageReadinessReady(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markTriageReadinessReviewReady(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markTriageReadinessStale(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markStale(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockTriageReadiness(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.block(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async suppressTriageReadiness(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.suppress(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'suppressed', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidTriageReadiness(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageReadiness>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_TRIAGE_READINESS_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
