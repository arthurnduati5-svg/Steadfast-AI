import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardAccessTimelineRepository } from '../contracts/resultReportCardAccessRepositoryContracts';
import type { ResultReportCardAccessCommandContext, ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts';
import type { CreateAccessTimelineInput } from '../contracts/resultReportCardAccessTimelineContracts';
import { evaluateReportCardAccessTimelinePolicy } from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessIdempotencyService } from './resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessAuditBridge } from './resultReportCardAccessAuditBridge';

export class ResultReportCardAccessTimelineService {
  constructor(
    private timelineRepo: ResultReportCardAccessTimelineRepository,
    private auditBridge: ResultReportCardAccessAuditBridge,
    private idempotencyService: ResultReportCardAccessIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardAccessCommandContext, overrides: Partial<ResultReportCardAccessSafeEnvelope>): ResultReportCardAccessSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async recordTimelineEvent(ctx: ResultReportCardAccessCommandContext, input: Omit<CreateAccessTimelineInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardAccessTimelinePolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'recordTimelineEvent', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateAccessTimelineInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.timelineRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'recordTimelineEvent', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'recordTimelineEvent', idempotencyKey, 'ResultReportCardAccessTimeline', record.resultReportCardAccessTimelineId, 'Timeline event recorded');
    await this.auditBridge.recordTimelineEventRecorded(ctx, record.resultReportCardAccessTimelineId, `Timeline event recorded for grant ${input.resultReportCardAccessGrantId}`);
    return this.envelope(ctx, { resourceId: record.resultReportCardAccessTimelineId, status: record.timelineStatus, safeMessage: 'Timeline event recorded successfully', reasonCode: 'TIMELINE_EVENT_RECORDED', data: record });
  }

  async getTimelineEvent(ctx: ResultReportCardAccessCommandContext, timelineEventId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const event = await this.timelineRepo.getById(timelineEventId);
    if (!event) return this.envelope(ctx, { ok: false, safeMessage: 'Timeline event not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: timelineEventId, status: event.timelineStatus, safeMessage: 'Timeline event found', data: event });
  }

  async listTimelineForGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const events = await this.timelineRepo.listByAccessGrantId(accessGrantId);
    return this.envelope(ctx, { safeMessage: `Found ${events.length} timeline events for grant`, data: events });
  }

  async listTimelineForRecipient(ctx: ResultReportCardAccessCommandContext, recipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const events = await this.timelineRepo.listByRecipientId(recipientId);
    return this.envelope(ctx, { safeMessage: `Found ${events.length} timeline events for recipient`, data: events });
  }

  async listTimelineForStudent(ctx: ResultReportCardAccessCommandContext, studentRef: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const events = await this.timelineRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${events.length} timeline events`, data: events });
  }

  async suppressTimelineEvent(ctx: ResultReportCardAccessCommandContext, timelineEventId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const event = await this.timelineRepo.getById(timelineEventId);
    if (!event) return this.envelope(ctx, { ok: false, safeMessage: 'Timeline event not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (event.timelineStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided timeline event', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.timelineRepo.suppress(timelineEventId, 'SUPPRESSED', 'Timeline event suppressed');
    return this.envelope(ctx, { resourceId: timelineEventId, status: 'suppressed', safeMessage: 'Timeline event suppressed', reasonCode: 'SUPPRESSED' });
  }

  async voidTimelineEvent(ctx: ResultReportCardAccessCommandContext, timelineEventId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const event = await this.timelineRepo.getById(timelineEventId);
    if (!event) return this.envelope(ctx, { ok: false, safeMessage: 'Timeline event not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (event.timelineStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.timelineRepo.void(timelineEventId, 'VOIDED', 'Timeline event voided');
    return this.envelope(ctx, { resourceId: timelineEventId, status: 'void', safeMessage: 'Timeline event voided', reasonCode: 'VOIDED' });
  }
}
