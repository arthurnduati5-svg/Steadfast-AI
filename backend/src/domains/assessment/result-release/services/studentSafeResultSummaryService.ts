import type {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
} from '../contracts';
import type { StudentSafeResultSummary, CreateStudentSafeSummaryInput } from '../contracts/resultReportSnapshotContracts';
import type { StudentSafeResultSummaryRepository } from '../contracts/resultReleaseRepositoryContracts';
import type { ResultReleaseAuditBridge } from './resultReleaseAuditBridge';
import type { ResultReleaseIdempotencyService } from './resultReleaseIdempotencyService';
import { evaluateStudentSafeSummaryPolicy } from '../policies/resultReleasePolicyDefinitions';

export class StudentSafeResultSummaryService {
  constructor(
    private summaryRepo: StudentSafeResultSummaryRepository,
    private auditBridge: ResultReleaseAuditBridge,
    private idempotencyService: ResultReleaseIdempotencyService,
  ) {}

  private envelope(ctx: ResultReleaseCommandContext, overrides: Partial<ResultReleaseSafeEnvelope>): ResultReleaseSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async generateStudentSafeSummary(
    ctx: ResultReleaseCommandContext,
    input: Omit<CreateStudentSafeSummaryInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateStudentSafeSummaryPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'generateStudentSafeSummary', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'generateStudentSafeSummary', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateStudentSafeSummaryInput = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const summary = await this.summaryRepo.create(createInput);
      await this.auditBridge.recordStudentSafeSummaryGenerated(ctx, summary);
      await this.idempotencyService.completeOperation(startIdem, summary.studentSafeResultSummaryId, 'Student safe summary generated');
      await this.summaryRepo.updateStatus(summary.studentSafeResultSummaryId, 'generated');
      return this.envelope(ctx, { resourceId: summary.studentSafeResultSummaryId, status: 'generated', safeMessage: 'Student safe summary generated', data: summary });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to generate student summary', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getStudentSafeSummary(ctx: ResultReleaseCommandContext, summaryId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Student safe summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: summaryId, status: summary.summaryStatus, safeMessage: 'Student summary found', data: summary });
  }

  async listStudentSafeSummariesForPacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summaries = await this.summaryRepo.listByReleasePacketId(packetId);
    return this.envelope(ctx, { safeMessage: `Found ${summaries.length} student summaries for packet`, data: summaries });
  }

  async listStudentSafeSummariesForStudent(ctx: ResultReleaseCommandContext, studentRef: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const summaries = await this.summaryRepo.listByStudentRef(studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${summaries.length} student summaries for student`, data: summaries });
  }

  async approveStudentSafeSummaryForFutureDelivery(ctx: ResultReleaseCommandContext, summaryId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Student safe summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus !== 'generated') return this.envelope(ctx, { ok: false, safeMessage: 'Summary must be generated status to approve', reasonCode: 'INVALID_STATUS', status: 'error' });
    const approvedAt = new Date().toISOString();
    const updated = await this.summaryRepo.approveForFutureDelivery(summaryId, approvedAt);
    if (!updated) return this.envelope(ctx, { ok: false, safeMessage: 'Failed to approve summary', reasonCode: 'APPROVE_FAILED', status: 'error' });
    return this.envelope(ctx, { resourceId: summaryId, status: 'approved_for_future_delivery', safeMessage: 'Student safe summary approved for future delivery' });
  }

  async blockStudentSafeSummary(ctx: ResultReleaseCommandContext, summaryId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Student safe summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided summary', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.summaryRepo.blockSummary(summaryId);
    return this.envelope(ctx, { resourceId: summaryId, status: 'blocked', safeMessage: 'Student safe summary blocked' });
  }

  async voidStudentSafeSummary(ctx: ResultReleaseCommandContext, summaryId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const summary = await this.summaryRepo.getById(summaryId);
    if (!summary) return this.envelope(ctx, { ok: false, safeMessage: 'Student safe summary not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (summary.summaryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.summaryRepo.voidSummary(summaryId, new Date().toISOString());
    return this.envelope(ctx, { resourceId: summaryId, status: 'void', safeMessage: 'Student safe summary voided' });
  }
}
