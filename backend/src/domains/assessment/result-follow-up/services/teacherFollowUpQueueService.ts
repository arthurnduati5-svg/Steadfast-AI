import { v4 as uuidv4 } from 'uuid';
import type { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../contracts/resultFollowUpContracts';
import type { CreateTeacherQueueItemInput } from '../contracts/teacherFollowUpQueueContracts';
import type { TeacherFollowUpQueueRepository } from '../contracts/resultFollowUpRepositoryContracts';
import { ResultFollowUpPolicyEnforcer } from '../policies/resultFollowUpPolicyDefinitions';
import { ResultFollowUpSafetyService } from './resultFollowUpSafetyService';
import { ResultFollowUpIdempotencyService } from './resultFollowUpIdempotencyService';
import { ResultFollowUpAuditBridge } from './resultFollowUpAuditBridge';

export class TeacherFollowUpQueueService {
  private policyEnforcer = new ResultFollowUpPolicyEnforcer();

  constructor(
    private queueRepo: TeacherFollowUpQueueRepository,
    private safetyService: ResultFollowUpSafetyService,
    private auditBridge: ResultFollowUpAuditBridge,
    private idempotencyService: ResultFollowUpIdempotencyService,
  ) {}

  private envelope(ctx: ResultFollowUpCommandContext, overrides: Partial<ResultFollowUpSafeEnvelope>): ResultFollowUpSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createTeacherQueueItem(ctx: ResultFollowUpCommandContext, input: Omit<CreateTeacherQueueItemInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('TEACHER_FOLLOW_UP_QUEUE_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createTeacherQueueItem', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateTeacherQueueItemInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.queueRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createTeacherQueueItem', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createTeacherQueueItem', idempotencyKey, 'TeacherFollowUpQueueItem', record.teacherFollowUpQueueItemId, 'Teacher queue item created');
    await this.auditBridge.recordTeacherQueueItemCreated(ctx.schoolId, record.resultFollowUpCaseId, record.teacherFollowUpQueueItemId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.teacherFollowUpQueueItemId, status: record.queueStatus, safeMessage: 'Teacher queue item created', reasonCode: 'QUEUE_ITEM_CREATED', data: record });
  }

  async getTeacherQueueItem(ctx: ResultFollowUpCommandContext, queueItemId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.queueRepo.getById(queueItemId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher queue item not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: queueItemId, status: record.queueStatus, safeMessage: 'Teacher queue item found', data: record });
  }

  async listTeacherQueueItemsForSchool(ctx: ResultFollowUpCommandContext): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.queueRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher queue items for school`, data: records });
  }

  async listTeacherQueueItemsForCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.queueRepo.listByCaseId(caseId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher queue items for case`, data: records });
  }

  async listTeacherQueueItemsForTeacher(ctx: ResultFollowUpCommandContext, teacherRef: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.queueRepo.listByTeacherRef(ctx.schoolId, teacherRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher queue items for teacher`, data: records });
  }

  async listTeacherQueueItemsByPriority(ctx: ResultFollowUpCommandContext, priority: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.queueRepo.listByPriority(ctx.schoolId, priority);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher queue items with priority ${priority}`, data: records });
  }

  async listTeacherQueueItemsByStatus(ctx: ResultFollowUpCommandContext, status: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.queueRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher queue items with status ${status}`, data: records });
  }

  async markQueueItemQueued(ctx: ResultFollowUpCommandContext, queueItemId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.queueRepo.getById(queueItemId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher queue item not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.queueStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot queue voided item', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.queueRepo.markQueued(queueItemId);
    return this.envelope(ctx, { resourceId: queueItemId, status: 'queued_for_review', safeMessage: 'Teacher queue item queued', reasonCode: 'QUEUE_ITEM_QUEUED' });
  }

  async acknowledgeQueueItemMock(ctx: ResultFollowUpCommandContext, queueItemId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('TEACHER_FOLLOW_UP_QUEUE_ACKNOWLEDGE', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.queueRepo.getById(queueItemId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher queue item not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.queueStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot acknowledge voided item', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'acknowledgeQueueItemMock', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.queueRepo.acknowledge(queueItemId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'acknowledgeQueueItemMock', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'acknowledgeQueueItemMock', idempotencyKey, 'TeacherFollowUpQueueItem', queueItemId, 'Queue item acknowledged mock');
    await this.auditBridge.recordTeacherQueueItemAcknowledgedMock(ctx.schoolId, record.resultFollowUpCaseId, queueItemId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: queueItemId, status: 'acknowledged_mock', safeMessage: 'Teacher queue item acknowledged mock', reasonCode: 'QUEUE_ITEM_ACKNOWLEDGED' });
  }

  async completeQueueItemMock(ctx: ResultFollowUpCommandContext, queueItemId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('TEACHER_FOLLOW_UP_QUEUE_COMPLETE', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.queueRepo.getById(queueItemId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher queue item not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.queueStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot complete voided item', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'completeQueueItemMock', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.queueRepo.complete(queueItemId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'completeQueueItemMock', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'completeQueueItemMock', idempotencyKey, 'TeacherFollowUpQueueItem', queueItemId, 'Queue item completed mock');
    return this.envelope(ctx, { resourceId: queueItemId, status: 'completed_mock', safeMessage: 'Teacher queue item completed mock', reasonCode: 'QUEUE_ITEM_COMPLETED' });
  }

  async suppressQueueItem(ctx: ResultFollowUpCommandContext, queueItemId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.queueRepo.getById(queueItemId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher queue item not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.queueStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided item', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.queueRepo.suppress(queueItemId, 'SUPPRESSED', 'Teacher queue item suppressed');
    return this.envelope(ctx, { resourceId: queueItemId, status: 'suppressed', safeMessage: 'Teacher queue item suppressed', reasonCode: 'QUEUE_ITEM_SUPPRESSED' });
  }

  async blockQueueItem(ctx: ResultFollowUpCommandContext, queueItemId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.queueRepo.getById(queueItemId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher queue item not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.queueStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided item', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.queueRepo.block(queueItemId, 'BLOCKED', 'Teacher queue item blocked');
    return this.envelope(ctx, { resourceId: queueItemId, status: 'blocked', safeMessage: 'Teacher queue item blocked', reasonCode: 'QUEUE_ITEM_BLOCKED' });
  }

  async voidQueueItem(ctx: ResultFollowUpCommandContext, queueItemId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.queueRepo.getById(queueItemId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher queue item not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.queueStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.queueRepo.void(queueItemId, 'VOIDED', 'Teacher queue item voided');
    return this.envelope(ctx, { resourceId: queueItemId, status: 'void', safeMessage: 'Teacher queue item voided', reasonCode: 'QUEUE_ITEM_VOIDED' });
  }
}
