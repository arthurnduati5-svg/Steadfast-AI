import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, SCORING_POLICY_VERSION } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCaseQueueExplanation } from '../contracts/recoveryCaseQueueExplanationContracts';
import { RecoveryCaseQueueExplanationRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { RecoveryCasePriorityFactorRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export class RecoveryCaseQueueExplanationService {
  constructor(
    private repo: RecoveryCaseQueueExplanationRepository,
    private factorRepo: RecoveryCasePriorityFactorRepository,
  ) {}

  async createQueueExplanation(
    ctx: RecoveryCaseTriageCommandContext,
    schoolId: string,
    data: {
      queueItemId: string;
      priorityAssessmentId: string;
      queueSnapshotId: string;
      explanationText?: string;
      factorBreakdownJson?: Record<string, unknown>;
      sourceRefsJson?: Record<string, unknown>;
    },
  ): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseQueueExplanation>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_EXPLANATION_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record = {
        queueExplanationId: uuid(),
        schoolId: ctx.schoolId,
        queueItemId: data.queueItemId,
        priorityAssessmentId: data.priorityAssessmentId,
        queueSnapshotId: data.queueSnapshotId,
        explanationText: data.explanationText ?? `Queue explanation for item ${data.queueItemId}`,
        factorBreakdownJson: data.factorBreakdownJson ?? {},
        sourceRefsJson: data.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
      };
      const created = await this.repo.create(record);
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getQueueExplanation(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseQueueExplanation>> {
    try {
      const record = await this.repo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Queue explanation not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueExplanationsForSnapshot(snapshotId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseQueueExplanation[]>> {
    try {
      const records = await this.repo.listBySnapshot(snapshotId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listQueueExplanationsForItem(queueItemId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseQueueExplanation[]>> {
    try {
      const records = await this.repo.listByQueueItem(queueItemId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async buildSafeQueueExplanation(
    ctx: RecoveryCaseTriageCommandContext,
    schoolId: string,
    queueItemId: string,
    priorityAssessmentId: string,
    queueSnapshotId: string,
    factorBreakdown: { code: string; appliedPoints: number; explanation: string }[],
    tieBreakInfo: string,
  ): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCaseQueueExplanation>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_QUEUE_EXPLANATION_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };

      const factorLines = factorBreakdown.map(f => `${f.code}: ${f.appliedPoints}pts - ${f.explanation}`).join('\n');
      const safeText = [
        `Queue Item: ${queueItemId}`,
        `--- Factor Breakdown ---`,
        factorLines,
        `--- Tie-break Info ---`,
        tieBreakInfo,
        `--- Policy: ${SCORING_POLICY_VERSION} ---`,
      ].join('\n');

      const factorCodes = factorBreakdown.map(f => f.code);
      const now = new Date().toISOString();
      const record = {
        queueExplanationId: uuid(),
        schoolId: ctx.schoolId,
        queueItemId,
        priorityAssessmentId,
        queueSnapshotId,
        explanationText: safeText,
        factorBreakdownJson: { factors: factorBreakdown, tieBreakInfo, policyVersion: SCORING_POLICY_VERSION, factorCodes },
        sourceRefsJson: {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
      };
      const created = await this.repo.create(record);
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
