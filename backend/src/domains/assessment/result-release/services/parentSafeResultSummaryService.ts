import type {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
} from '../contracts';
import type { ParentSafeResultSummary, CreateParentSafeSummaryInput } from '../contracts/resultReportSnapshotContracts';
import type { ParentSafeResultSummaryRepository } from '../contracts/resultReleaseRepositoryContracts';
import type { ResultReleaseAuditBridge } from './resultReleaseAuditBridge';
import type { ResultReleaseIdempotencyService } from './resultReleaseIdempotencyService';
import { evaluateParentSafeSummaryPolicy } from '../policies/resultReleasePolicyDefinitions';

export class ParentSafeResultSummaryService {
  constructor(
    private summaryRepo: ParentSafeResultSummaryRepository,
    private auditBridge: ResultReleaseAuditBridge,
    private idempotencyService: ResultReleaseIdempotencyService,
  ) {}

  private envelope(ctx: ResultReleaseCommandContext, overrides: Partial<ResultReleaseSafeEnvelope>): ResultReleaseSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async generateParentSafeSummary(
    ctx: ResultReleaseCommandContext,
    input: Omit<CreateParentSafeSummaryInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateParentSafeSummaryPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'generateParentSafeSummary', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'generateParentSafeSummary', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateParentSafeSummaryInput = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const summary = await this.summaryRepo.create(createInput);
      await this.auditBridge.recordParentSafeSummaryGenerated(ctx, summary);
      await this.idempotencyService.completeOperation(startIdem, summary.parentSafeResultSummaryId, 'Parent safe summary generated');
      await this.summaryRepo.updateStatus(summary.parentSafeResultSummaryId, 'generated');
      return this.envelope(ctx, { resourceId: summary.parentSafeResultSummaryId, status: 'generated', safeMessage: 'Parent safe summary generated', data: summary });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to generate parent summary', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getParentSafeSummary(ctx: ResultReleaseCommandContext, summaryId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Parent safe summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: summaryId, status: summary.summaryStatus, safeMessage: 'Parent summary found', data: summary });
  }

  async listParentSafeSummariesForPacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summaries = await this.summaryRepo.listByReleasePacketId(packetId);
    return this.envelope(ctx, { safeMessage: `Found ${summaries.length} parent summaries for packet`, data: summaries });
  }

  async listParentSafeSummariesForStudent(ctx: ResultReleaseCommandContext, studentRef: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const summaries = await this.summaryRepo.listByStudentRef(studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${summaries.length} parent summaries for student`, data: summaries });
  }

  async approveParentSafeSummaryForFutureDelivery(ctx: ResultReleaseCommandContext, summaryId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Parent safe summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus !== 'generated') return this.envelope(ctx, { ok: false, safeMessage: 'Summary must be generated status to approve', reasonCode: 'INVALID_STATUS', status: 'error' });
    const approvedAt = new Date().toISOString();
    const updated = await this.summaryRepo.approveForFutureDelivery(summaryId, approvedAt);
    if (!updated) return this.envelope(ctx, { ok: false, safeMessage: 'Failed to approve summary', reasonCode: 'APPROVE_FAILED', status: 'error' });
    return this.envelope(ctx, { resourceId: summaryId, status: 'approved_for_future_delivery', safeMessage: 'Parent safe summary approved for future delivery' });
  }

  async blockParentSafeSummary(ctx: ResultReleaseCommandContext, summaryId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Parent safe summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.summaryRepo.blockSummary(summaryId);
    return this.envelope(ctx, { resourceId: summaryId, status: 'blocked', safeMessage: 'Parent safe summary blocked' });
  }

  async voidParentSafeSummary(ctx: ResultReleaseCommandContext, summaryId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Parent safe summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.summaryRepo.voidSummary(summaryId, new Date().toISOString());
    return this.envelope(ctx, { resourceId: summaryId, status: 'void', safeMessage: 'Parent safe summary voided' });
  }
}
