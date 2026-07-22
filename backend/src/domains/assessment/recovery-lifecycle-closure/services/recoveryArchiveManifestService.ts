import {
  RecoveryArchiveManifest,
  CreateRecoveryArchiveManifestRequest,
} from '../contracts/recoveryArchiveManifestContracts';
import {
  RecoveryLifecycleClosureCommandContext,
  RecoveryLifecycleClosureSafeEnvelope,
} from '../contracts/recoveryLifecycleClosureContracts';
import { IRecoveryLifecycleClosureRepositories } from '../contracts/recoveryLifecycleClosureRepositoryContracts';
import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { RecoveryLifecycleClosureSafetyService } from './recoveryLifecycleClosureSafetyService';
import { RecoveryLifecycleClosureAuditBridge } from './recoveryLifecycleClosureAuditBridge';
import { RecoveryLifecycleClosureIdempotencyService } from './recoveryLifecycleClosureIdempotencyService';
import { v4 as uuid } from 'uuid';

export class RecoveryArchiveManifestService {
  constructor(
    private repos: IRecoveryLifecycleClosureRepositories,
    private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer,
    private safety: RecoveryLifecycleClosureSafetyService,
    private audit: RecoveryLifecycleClosureAuditBridge,
    private idempotency: RecoveryLifecycleClosureIdempotencyService,
  ) {}

  async createArchiveManifest(
    ctx: RecoveryLifecycleClosureCommandContext,
    request: CreateRecoveryArchiveManifestRequest,
  ): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ARCHIVE_MANIFEST_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, idempotencyKey: ctx.idempotencyKey };
      }

      const idleCheck = await this.idempotency.checkIdempotency(ctx.schoolId, 'createArchiveManifest', ctx.idempotencyKey);
      if (idleCheck.exists) {
        return { success: false, status: 'DUPLICATE', message: 'Idempotency key already processed', idempotencyKey: ctx.idempotencyKey };
      }

      const blockedCodes = this.safety.validateArchiveManifestContent(request);
      if (blockedCodes.length > 0) {
        return { success: false, status: 'BLOCKED', message: 'Content validation failed', blockedReasonCodes: blockedCodes, idempotencyKey: ctx.idempotencyKey };
      }

      const requestHash = JSON.stringify({ operation: 'createArchiveManifest', request });
      await this.idempotency.recordIdempotency(ctx.schoolId, 'createArchiveManifest', ctx.idempotencyKey, requestHash);

      const now = new Date().toISOString();
      const record: Partial<RecoveryArchiveManifest> = {
        archiveManifestId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: request.studentRef,
        resultRecoveryPlanId: request.resultRecoveryPlanId,
        manifestStatus: 'draft',
        safeManifestSummary: request.safeManifestSummary,
        manifestContentsJson: request.manifestContentsJson ?? {},
        recordCountsJson: request.recordCountsJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: request.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };

      const created = await this.repos.archiveManifest.create(record);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ARCHIVE_MANIFEST_CREATED',
        decision: 'created',
        safeSummary: `Archive manifest ${created.archiveManifestId} created`,
        archiveManifestId: created.archiveManifestId,
        correlationId: ctx.correlationId,
        metadata: { request },
      });
      await this.idempotency.completeIdempotency(ctx.schoolId, 'createArchiveManifest', ctx.idempotencyKey, 'archiveManifest', created.archiveManifestId, `Archive manifest ${created.archiveManifestId} created`);

      return { success: true, data: created, status: 'created', idempotencyKey: ctx.idempotencyKey };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, idempotencyKey: ctx.idempotencyKey };
    }
  }

  async getArchiveManifest(schoolId: string, manifestId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest>> {
    try {
      const record = await this.repos.archiveManifest.getById(manifestId);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Archive manifest not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listArchiveManifestsForSchool(schoolId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest[]>> {
    try {
      const records = await this.repos.archiveManifest.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listArchiveManifestsForStudent(schoolId: string, studentRef: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest[]>> {
    try {
      const records = await this.repos.archiveManifest.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listArchiveManifestsForPlan(schoolId: string, planId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest[]>> {
    try {
      const records = await this.repos.archiveManifest.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listArchiveManifestsByStatus(schoolId: string, status: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest[]>> {
    try {
      const records = await this.repos.archiveManifest.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markArchiveManifestReviewReady(ctx: RecoveryLifecycleClosureCommandContext, manifestId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ARCHIVE_MANIFEST_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.archiveManifest.markReviewReady(manifestId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ARCHIVE_MANIFEST_REVIEW_READY',
        decision: 'updated',
        safeSummary: `Archive manifest ${manifestId} marked review ready`,
        archiveManifestId: manifestId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markArchiveManifestArchiveReady(ctx: RecoveryLifecycleClosureCommandContext, manifestId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ARCHIVE_MANIFEST_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.archiveManifest.markArchiveReady(manifestId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ARCHIVE_MANIFEST_ARCHIVE_READY',
        decision: 'updated',
        safeSummary: `Archive manifest ${manifestId} marked archive ready`,
        archiveManifestId: manifestId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async approveArchiveManifestForFutureUse(ctx: RecoveryLifecycleClosureCommandContext, manifestId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ARCHIVE_MANIFEST_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.archiveManifest.approveForFutureUse(manifestId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ARCHIVE_MANIFEST_APPROVED',
        decision: 'updated',
        safeSummary: `Archive manifest ${manifestId} approved for future use`,
        archiveManifestId: manifestId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async suppressArchiveManifest(ctx: RecoveryLifecycleClosureCommandContext, manifestId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ARCHIVE_MANIFEST_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.archiveManifest.suppress(manifestId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ARCHIVE_MANIFEST_SUPPRESSED',
        decision: 'updated',
        safeSummary: `Archive manifest ${manifestId} suppressed`,
        archiveManifestId: manifestId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async blockArchiveManifest(ctx: RecoveryLifecycleClosureCommandContext, manifestId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ARCHIVE_MANIFEST_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.archiveManifest.block(manifestId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ARCHIVE_MANIFEST_BLOCKED',
        decision: 'updated',
        safeSummary: `Archive manifest ${manifestId} blocked`,
        archiveManifestId: manifestId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async voidArchiveManifest(ctx: RecoveryLifecycleClosureCommandContext, manifestId: string): Promise<RecoveryLifecycleClosureSafeEnvelope<RecoveryArchiveManifest>> {
    try {
      const decision = this.policyEnforcer.enforce('RECOVERY_ARCHIVE_MANIFEST_CREATION', ctx.actorRole);
      if (decision.denied) {
        return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}` };
      }
      const updated = await this.repos.archiveManifest.void(manifestId);
      await this.audit.recordAuditEvent({
        schoolId: ctx.schoolId,
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        eventType: 'ARCHIVE_MANIFEST_VOIDED',
        decision: 'updated',
        safeSummary: `Archive manifest ${manifestId} voided`,
        archiveManifestId: manifestId,
        correlationId: ctx.correlationId,
      });
      return { success: true, data: updated, status: 'updated' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }
}
