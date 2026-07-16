import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseAdjudicationSummary, CreateAdjudicationSummaryInput } from '../contracts/recoveryCaseAdjudicationSummaryContracts';
import type { RecoveryCaseAdjudicationSummaryRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseAdjudicationSummaryService {
  constructor(
    private summaryRepo: RecoveryCaseAdjudicationSummaryRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createAdjudicationSummary(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateAdjudicationSummaryInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const summary = await this.summaryRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'adjudication_summary',
      entityId: summary.adjudicationSummaryId,
      action: 'create_adjudication_summary',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson, hasStudentRef: !!input.studentRef, hasPlanId: !!input.resultRecoveryPlanId, hasQueueItemId: !!input.queueItemId },
    });

    return { success: true, status: 'ok', data: summary, correlationId: ctx.correlationId };
  }

  async getAdjudicationSummary(summaryId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary>> {
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) {
      return { success: false, status: 'not_found', message: 'Adjudication summary not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: summary };
  }

  async listAdjudicationSummariesForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary[]>> {
    const items = await this.summaryRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listAdjudicationSummariesForStudent(schoolId: string, studentRef: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary[]>> {
    const items = await this.summaryRepo.listByStudentRef(schoolId, studentRef);
    return { success: true, status: 'ok', data: items };
  }

  async listAdjudicationSummariesForPlan(schoolId: string, planId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary[]>> {
    const items = await this.summaryRepo.listByPlanId(schoolId, planId);
    return { success: true, status: 'ok', data: items };
  }

  async listAdjudicationSummariesForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary[]>> {
    const items = await this.summaryRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async refreshAdjudicationSummary(
    summaryId: string,
    data: Partial<CreateAdjudicationSummaryInput>,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary>> {
    const existing = await this.summaryRepo.getById(summaryId);
    if (!existing) {
      return { success: false, status: 'not_found', message: 'Adjudication summary not found', errorCode: 'NOT_FOUND' };
    }

    const summary = await this.summaryRepo.refresh(summaryId, data);
    await this.auditRepo.create({
      schoolId: summary.schoolId,
      entityType: 'adjudication_summary',
      entityId: summaryId,
      action: 'refresh_adjudication_summary',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: existing.summaryStatus, refreshedFields: Object.keys(data) },
    });
    return { success: true, status: 'ok', data: summary };
  }

  async markAdjudicationSummaryReviewReady(summaryId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary>> {
    const summary = await this.summaryRepo.updateStatus(summaryId, 'review_ready');
    await this.auditRepo.create({
      schoolId: summary.schoolId,
      entityType: 'adjudication_summary',
      entityId: summaryId,
      action: 'mark_adjudication_summary_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: summary.summaryStatus },
    });
    return { success: true, status: 'ok', data: summary };
  }

  async markAdjudicationSummaryStale(summaryId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary>> {
    const summary = await this.summaryRepo.updateStatus(summaryId, 'stale');
    await this.auditRepo.create({
      schoolId: summary.schoolId,
      entityType: 'adjudication_summary',
      entityId: summaryId,
      action: 'mark_adjudication_summary_stale',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: summary.summaryStatus },
    });
    return { success: true, status: 'ok', data: summary };
  }

  async blockAdjudicationSummary(summaryId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary>> {
    const summary = await this.summaryRepo.updateStatus(summaryId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: summary.schoolId,
      entityType: 'adjudication_summary',
      entityId: summaryId,
      action: 'block_adjudication_summary',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: summary.summaryStatus },
    });
    return { success: true, status: 'ok', data: summary };
  }

  async voidAdjudicationSummary(summaryId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseAdjudicationSummary>> {
    const summary = await this.summaryRepo.void(summaryId);
    await this.auditRepo.create({
      schoolId: summary.schoolId,
      entityType: 'adjudication_summary',
      entityId: summaryId,
      action: 'void_adjudication_summary',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: summary.summaryStatus },
    });
    return { success: true, status: 'ok', data: summary };
  }
}
