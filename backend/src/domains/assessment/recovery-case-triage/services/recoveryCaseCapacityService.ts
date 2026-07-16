import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, RecoveryCaseCapacityStatus } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseCapacitySnapshot, CreateCapacitySnapshotRequest } from '../contracts/recoveryCaseCapacityContracts';
import { RecoveryCaseCapacitySnapshotRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export class RecoveryCaseCapacityService {
  constructor(private repo: RecoveryCaseCapacitySnapshotRepository) {}

  async createCapacitySnapshot(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreateCapacitySnapshotRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseCapacitySnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_CAPACITY_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };

      if (body.totalCapacity < 0) return { success: false, status: 'DENIED', message: 'capacityLimit must be >= 0', correlationId: ctx.correlationId };
      if (body.usedCapacity < 0) return { success: false, status: 'DENIED', message: 'currentLoad must be >= 0', correlationId: ctx.correlationId };

      const availableSlots = Math.max(0, body.totalCapacity - body.usedCapacity);

      const now = new Date().toISOString();
      const record = {
        capacitySnapshotId: uuid(),
        schoolId: ctx.schoolId,
        audienceRole: body.audienceRole,
        reviewerRef: body.reviewerRef ?? null,
        reviewWindowId: body.reviewWindowId ?? null,
        capacityStatus: 'draft',
        totalCapacity: body.totalCapacity,
        usedCapacity: body.usedCapacity,
        availableCapacity: availableSlots,
        capacityThreshold: body.capacityThreshold,
        safeCapacitySummary: body.safeCapacitySummary ?? `Capacity: ${availableSlots} available of ${body.totalCapacity} total`,
        capacityDetailsJson: body.capacityDetailsJson ?? {},
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

  async getCapacitySnapshot(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseCapacitySnapshot>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Capacity snapshot not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listCapacitySnapshotsForSchool(schoolId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseCapacitySnapshot[]>> {
    try {
      const records = await this.repo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listCapacitySnapshotsByRole(schoolId: string, audienceRole: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseCapacitySnapshot[]>> {
    try {
      const records = await this.repo.listByRole(schoolId, audienceRole);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listCapacitySnapshotsByReviewer(schoolId: string, reviewerRef: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseCapacitySnapshot[]>> {
    try {
      const records = await this.repo.listByReviewer(schoolId, reviewerRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listCapacitySnapshotsByWindow(schoolId: string, reviewWindowId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseCapacitySnapshot[]>> {
    try {
      const records = await this.repo.listByWindow(schoolId, reviewWindowId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markCapacitySnapshotReviewReady(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseCapacitySnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_CAPACITY_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markCapacityExceeded(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseCapacitySnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_CAPACITY_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.markCapacityExceeded(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidCapacitySnapshot(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseCapacitySnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_CAPACITY_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.repo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
