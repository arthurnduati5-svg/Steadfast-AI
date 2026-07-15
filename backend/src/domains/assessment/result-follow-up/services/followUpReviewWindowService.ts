import { v4 as uuidv4 } from 'uuid';
import type { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../contracts/resultFollowUpContracts';
import type { CreateReviewWindowInput } from '../contracts/followUpReviewWindowContracts';
import type { FollowUpReviewWindowRepository } from '../contracts/resultFollowUpRepositoryContracts';
import { ResultFollowUpPolicyEnforcer } from '../policies/resultFollowUpPolicyDefinitions';
import { ResultFollowUpIdempotencyService } from './resultFollowUpIdempotencyService';
import { ResultFollowUpAuditBridge } from './resultFollowUpAuditBridge';

export class FollowUpReviewWindowService {
  private policyEnforcer = new ResultFollowUpPolicyEnforcer();

  constructor(
    private windowRepo: FollowUpReviewWindowRepository,
    private auditBridge: ResultFollowUpAuditBridge,
    private idempotencyService: ResultFollowUpIdempotencyService,
  ) {}

  private envelope(ctx: ResultFollowUpCommandContext, overrides: Partial<ResultFollowUpSafeEnvelope>): ResultFollowUpSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createReviewWindow(ctx: ResultFollowUpCommandContext, input: Omit<CreateReviewWindowInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('FOLLOW_UP_REVIEW_WINDOW_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createReviewWindow', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateReviewWindowInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.windowRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createReviewWindow', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createReviewWindow', idempotencyKey, 'FollowUpReviewWindow', record.followUpReviewWindowId, 'Review window created');
    await this.auditBridge.recordReviewWindowCreated(ctx.schoolId, record.resultFollowUpCaseId, record.followUpReviewWindowId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.followUpReviewWindowId, status: record.windowStatus, safeMessage: 'Review window created', reasonCode: 'WINDOW_CREATED', data: record });
  }

  async getReviewWindow(ctx: ResultFollowUpCommandContext, windowId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.windowRepo.getById(windowId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Review window not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: windowId, status: record.windowStatus, safeMessage: 'Review window found', data: record });
  }

  async listReviewWindowsForSchool(ctx: ResultFollowUpCommandContext): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.windowRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} review windows for school`, data: records });
  }

  async listReviewWindowsForCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.windowRepo.listByCaseId(caseId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} review windows for case`, data: records });
  }

  async listReviewWindowsForStudent(ctx: ResultFollowUpCommandContext, studentRef: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.windowRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} review windows for student`, data: records });
  }

  async listReviewWindowsByStatus(ctx: ResultFollowUpCommandContext, status: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.windowRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} review windows with status ${status}`, data: records });
  }

  async scheduleReviewWindowMock(ctx: ResultFollowUpCommandContext, windowId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('FOLLOW_UP_REVIEW_WINDOW_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.windowRepo.getById(windowId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Review window not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.windowStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot schedule voided window', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'scheduleReviewWindowMock', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.windowRepo.scheduleMock(windowId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'scheduleReviewWindowMock', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'scheduleReviewWindowMock', idempotencyKey, 'FollowUpReviewWindow', windowId, 'Review window scheduled mock');
    await this.auditBridge.recordReviewWindowScheduledMock(ctx.schoolId, record.resultFollowUpCaseId, windowId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: windowId, status: 'scheduled_mock', safeMessage: 'Review window scheduled mock', reasonCode: 'WINDOW_SCHEDULED' });
  }

  async completeReviewWindowMock(ctx: ResultFollowUpCommandContext, windowId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('FOLLOW_UP_REVIEW_WINDOW_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.windowRepo.getById(windowId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Review window not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.windowStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot complete voided window', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.windowRepo.completeMock(windowId);
    return this.envelope(ctx, { resourceId: windowId, status: 'completed_mock', safeMessage: 'Review window completed mock', reasonCode: 'WINDOW_COMPLETED' });
  }

  async cancelReviewWindow(ctx: ResultFollowUpCommandContext, windowId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.windowRepo.getById(windowId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Review window not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.windowStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot cancel voided window', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.windowRepo.cancel(windowId, 'CANCELLED', 'Review window cancelled');
    return this.envelope(ctx, { resourceId: windowId, status: 'cancelled', safeMessage: 'Review window cancelled', reasonCode: 'WINDOW_CANCELLED' });
  }

  async voidReviewWindow(ctx: ResultFollowUpCommandContext, windowId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.windowRepo.getById(windowId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Review window not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.windowStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.windowRepo.void(windowId, 'VOIDED', 'Review window voided');
    return this.envelope(ctx, { resourceId: windowId, status: 'void', safeMessage: 'Review window voided', reasonCode: 'WINDOW_VOIDED' });
  }
}
