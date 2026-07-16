import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, RecoveryCaseTriageQueueSnapshotStatus, RecoveryCaseQueueItemStatus, RecoveryCasePriorityBand, RecoveryCaseTriageDecision } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseTriageQueueSnapshot, RecoveryCaseTriageQueueItem, CreateQueueSnapshotRequest, RecoveryCaseQueueCandidate, RecoveryCaseQueueRankingResult } from '../contracts/recoveryCaseQueueContracts';
import { RecoveryCaseTriageQueueSnapshotRepository, RecoveryCaseTriageQueueItemRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';
import { RecoveryCasePriorityEngineService } from './recoveryCasePriorityEngineService';
import { RecoveryCaseDuplicateSuppressionService } from './recoveryCaseDuplicateSuppressionService';
import { RecoveryCaseFairnessService } from './recoveryCaseFairnessService';
import { RecoveryCaseTriageAuditBridge } from './recoveryCaseTriageAuditBridge';

export class RecoveryCaseQueueService {
  constructor(
    private snapshotRepo: RecoveryCaseTriageQueueSnapshotRepository,
    private itemRepo: RecoveryCaseTriageQueueItemRepository,
    private engine: RecoveryCasePriorityEngineService,
    private duplicateSuppression: RecoveryCaseDuplicateSuppressionService,
    private fairness: RecoveryCaseFairnessService,
    private audit: RecoveryCaseTriageAuditBridge,
  ) {}

  async createQueueSnapshot(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreateQueueSnapshotRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record = {
        queueSnapshotId: uuid(),
        schoolId: ctx.schoolId,
        audienceRole: body.audienceRole,
        queueStatus: 'draft',
        totalItems: 0,
        queueSummary: body.queueSummary ?? '',
        queueMetadataJson: body.queueMetadataJson ?? {},
        blockedReasonCodesJson: [],
        sourceRefsJson: body.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };
      const created = await this.snapshotRepo.create(record);
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async generateQueueSnapshot(
    ctx: RecoveryCaseTriageCommandContext,
    schoolId: string,
    snapshotId: string,
    candidates: RecoveryCaseQueueCandidate[],
    capacityLimit: number,
  ): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseQueueRankingResult>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };

      const snapshot = await this.snapshotRepo.getById(snapshotId);
      if (!snapshot) return { success: false, status: 'NOT_FOUND', message: 'Queue snapshot not found', correlationId: ctx.correlationId };

      const deduped: RecoveryCaseQueueCandidate[] = [];
      for (const c of candidates) {
        const suppressionResult = await this.duplicateSuppression.listDuplicateSuppressionsForPlan(schoolId, c.resultRecoveryPlanId);
        const isDuplicate = suppressionResult.data?.some(s => s.suppressionStatus === 'active' || s.suppressionStatus === 'approved_for_future_use') ?? false;
        if (!isDuplicate) {
          deduped.push(c);
        }
      }

      const ranked = this.engine.applyStableTieBreaks(deduped);
      const now = new Date().toISOString();
      const items: RecoveryCaseTriageQueueItem[] = [];

      for (let i = 0; i < ranked.length; i++) {
        const c = ranked[i];
        const isExceeded = capacityLimit > 0 && i >= capacityLimit;
        const isCriticalReview = c.priorityBand === 'critical_review';
        const finalDecision: RecoveryCaseTriageDecision = isExceeded && !isCriticalReview ? 'capacity_exceeded' : 'queued';
        const item = {
          queueItemId: uuid(),
          queueSnapshotId: snapshotId,
          schoolId: schoolId,
          studentRef: c.studentRef,
          resultRecoveryPlanId: c.resultRecoveryPlanId,
          boardSnapshotId: c.boardSnapshotId,
          boardCardId: c.boardCardId,
          priorityAssessmentId: c.priorityAssessmentId,
          fairnessCheckId: c.fairnessCheckId,
          queueStatus: isExceeded && !isCriticalReview ? 'capacity_exceeded' : 'queued',
          triageDecision: finalDecision,
          priorityBand: c.priorityBand,
          riskRank: c.riskRank,
          totalScore: c.totalScore,
          queueRank: i + 1,
          safeItemSummary: `Rank ${i + 1} | Score ${c.totalScore} | Band ${c.priorityBand} | ${finalDecision}`,
          decisionReasonJson: { rank: i + 1, band: c.priorityBand, score: c.totalScore, capacityExceeded: isExceeded && !isCriticalReview, criticalPreserved: isCriticalReview && isExceeded },
          blockedReasonCodesJson: isExceeded && !isCriticalReview ? ['CAPACITY_EXCEEDED'] : [],
          sourceRefsJson: {},
          createdByActorId: ctx.actorId,
          createdByRole: ctx.actorRole,
          createdAt: now,
          updatedAt: now,
        };
        const persisted = await this.itemRepo.create(item);
        items.push(persisted);
      }

      const totalItems = items.length;
      const exceededCount = items.filter(i => i.queueStatus === 'capacity_exceeded').length;
      await this.snapshotRepo.update(snapshotId, { totalItems, queueStatus: 'generated', queueSummary: `Generated ${totalItems} items, ${exceededCount} capacity exceeded`, generatedAt: now } as any);
      await this.snapshotRepo.markGenerated(snapshotId);

      await this.audit.createAuditEvent(ctx, schoolId, {
        entityType: 'queue_snapshot',
        entityId: snapshotId,
        action: 'generated',
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        safeSummary: `Queue snapshot generated with ${totalItems} items, ${exceededCount} capacity exceeded`,
        reasonCodesJson: null,
        metadataJson: { totalItems, exceededCount, capacityLimit },
        correlationId: ctx.correlationId,
      } as any);

      const result: RecoveryCaseQueueRankingResult = {
        queueSnapshotId: snapshotId,
        items: items.map(i => ({
          studentRef: i.studentRef,
          resultRecoveryPlanId: i.resultRecoveryPlanId,
          boardSnapshotId: i.boardSnapshotId,
          boardCardId: i.boardCardId,
          priorityAssessmentId: i.priorityAssessmentId,
          fairnessCheckId: i.fairnessCheckId,
          priorityBand: i.priorityBand,
          riskRank: i.riskRank,
          totalScore: i.totalScore,
          triageDecision: i.triageDecision,
        })),
        rankedCount: totalItems,
        totalCapacity: capacityLimit,
        exceededCount,
      };

      return { success: true, data: result, status: 'generated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getQueueSnapshot(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueSnapshot>> {
    try {
      const record = await this.snapshotRepo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Queue snapshot not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueSnapshotsForSchool(schoolId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueSnapshot[]>> {
    try {
      const records = await this.snapshotRepo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueSnapshotsByAudienceRole(schoolId: string, audienceRole: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueSnapshot[]>> {
    try {
      const records = await this.snapshotRepo.listByAudienceRole(schoolId, audienceRole);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueSnapshotsByStatus(schoolId: string, status: RecoveryCaseTriageQueueSnapshotStatus | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueSnapshot[]>> {
    try {
      const records = await this.snapshotRepo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueItemsForSnapshot(snapshotId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueItem[]>> {
    try {
      const records = await this.itemRepo.listByQueueSnapshot(snapshotId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueItemsForStudent(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueItem[]>> {
    try {
      const records = await this.itemRepo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueItemsForPlan(schoolId: string, planId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueItem[]>> {
    try {
      const records = await this.itemRepo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueItemsByPriorityBand(schoolId: string, band: RecoveryCasePriorityBand | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueItem[]>> {
    try {
      const records = await this.itemRepo.listByBand(schoolId, band);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueItemsByStatus(schoolId: string, status: RecoveryCaseQueueItemStatus | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueItem[]>> {
    try {
      const records = await this.itemRepo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markQueueSnapshotReviewReady(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.snapshotRepo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markQueueSnapshotStale(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.snapshotRepo.markStale(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markQueueItemReviewReady(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueItem>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_ITEM_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.itemRepo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async deferQueueItem(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueItem>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_ITEM_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.itemRepo.defer(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'deferred', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockQueueItem(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueItem>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_ITEM_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.itemRepo.block(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidQueueSnapshot(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueSnapshot>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_SNAPSHOT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.snapshotRepo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidQueueItem(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseTriageQueueItem>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_ITEM_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.itemRepo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
