import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope } from '../contracts/resultRecoveryContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface TeacherReviewPacketInput {
  resultRecoveryPlanId: string;
  teacherRef: string;
  studentRef: string;
  safePacketSummary: string;
  teacherNotesJson?: Record<string, unknown>;
  actionItemsJson?: Record<string, unknown>;
}

export interface TeacherReviewPacket {
  resultRecoveryTeacherReviewPacketId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  teacherRef: string;
  studentRef: string;
  packetStatus: string;
  safePacketSummary: string;
  teacherNotesJson: Record<string, unknown> | null;
  actionItemsJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  readyAt: string | null;
  acknowledgedMockAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface TeacherReviewPacketPreview {
  resultRecoveryTeacherReviewPacketId: string;
  resultRecoveryPlanId: string;
  teacherRef: string;
  studentRef: string;
  packetStatus: string;
  safePacketSummary: string;
  createdAt: string;
}

export interface TeacherReviewPacketRepository {
  create(input: TeacherReviewPacketInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<TeacherReviewPacket>;
  getById(packetId: string): Promise<TeacherReviewPacket | null>;
  listByPlanId(planId: string): Promise<TeacherReviewPacketPreview[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<TeacherReviewPacketPreview[]>;
  update(packetId: string, data: Partial<TeacherReviewPacket>): Promise<TeacherReviewPacket>;
  updateStatus(packetId: string, packetStatus: string, reasonCode: string, safeMessage: string): Promise<TeacherReviewPacket>;
  markReady(packetId: string): Promise<TeacherReviewPacket>;
  acknowledgeMock(packetId: string): Promise<TeacherReviewPacket>;
  approveForFutureUse(packetId: string): Promise<TeacherReviewPacket>;
  suppress(packetId: string, reasonCode: string, safeMessage: string): Promise<TeacherReviewPacket>;
  void(packetId: string, reasonCode: string, safeMessage: string): Promise<TeacherReviewPacket>;
}

export class ResultRecoveryTeacherReviewPacketService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private packetRepo: TeacherReviewPacketRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createTeacherReviewPacket(ctx: ResultRecoveryCommandContext, input: TeacherReviewPacketInput): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_TEACHER_REVIEW_PACKET_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const safetyCheck = this.safetyService.assertTeacherReviewPacketSafe(input as unknown as Record<string, unknown>);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createTeacherReviewPacket', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: TeacherReviewPacketInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.packetRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createTeacherReviewPacket', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createTeacherReviewPacket', idempotencyKey, 'TeacherReviewPacket', record.resultRecoveryTeacherReviewPacketId, 'Teacher review packet created');
    await this.auditBridge.recordTeacherReviewPacketCreated(ctx.schoolId, record.resultRecoveryPlanId, record.resultRecoveryTeacherReviewPacketId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultRecoveryTeacherReviewPacketId, status: record.packetStatus, safeMessage: 'Teacher review packet created', reasonCode: 'PACKET_CREATED', data: record });
  }

  async getTeacherReviewPacket(ctx: ResultRecoveryCommandContext, packetId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher review packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: packetId, status: record.packetStatus, safeMessage: 'Teacher review packet found', data: record });
  }

  async listTeacherReviewPacketsForPlan(ctx: ResultRecoveryCommandContext, planId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.packetRepo.listByPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher review packets for plan`, data: records });
  }

  async listTeacherReviewPacketsForTeacher(ctx: ResultRecoveryCommandContext, teacherRef: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.packetRepo.listByTeacherRef(ctx.schoolId, teacherRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher review packets for teacher`, data: records });
  }

  async markTeacherReviewPacketReady(ctx: ResultRecoveryCommandContext, packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_TEACHER_REVIEW_PACKET_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher review packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot mark voided packet as ready', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markTeacherReviewPacketReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.packetRepo.markReady(packetId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markTeacherReviewPacketReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markTeacherReviewPacketReady', idempotencyKey, 'TeacherReviewPacket', packetId, 'Teacher review packet ready');
    return this.envelope(ctx, { resourceId: packetId, status: 'ready', safeMessage: safeMessage || 'Teacher review packet ready', reasonCode: reasonCode || 'PACKET_READY' });
  }

  async acknowledgeTeacherReviewPacketMock(ctx: ResultRecoveryCommandContext, packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher review packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot acknowledge voided packet', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.packetRepo.acknowledgeMock(packetId);
    await this.auditBridge.recordTeacherReviewPacketAcknowledgedMock(ctx.schoolId, record.resultRecoveryPlanId, packetId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: packetId, status: 'acknowledged_mock', safeMessage: safeMessage || 'Teacher review packet acknowledged mock', reasonCode: reasonCode || 'PACKET_ACKNOWLEDGED_MOCK' });
  }

  async approveTeacherReviewPacketForFutureUse(ctx: ResultRecoveryCommandContext, packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_TEACHER_REVIEW_PACKET_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher review packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided packet', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveTeacherReviewPacketForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.packetRepo.approveForFutureUse(packetId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveTeacherReviewPacketForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveTeacherReviewPacketForFutureUse', idempotencyKey, 'TeacherReviewPacket', packetId, 'Teacher review packet approved');
    return this.envelope(ctx, { resourceId: packetId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Teacher review packet approved for future use', reasonCode: reasonCode || 'PACKET_APPROVED' });
  }

  async suppressTeacherReviewPacket(ctx: ResultRecoveryCommandContext, packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher review packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided packet', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.packetRepo.suppress(packetId, reasonCode || 'SUPPRESSED', safeMessage || 'Teacher review packet suppressed');
    return this.envelope(ctx, { resourceId: packetId, status: 'suppressed', safeMessage: safeMessage || 'Teacher review packet suppressed', reasonCode: reasonCode || 'PACKET_SUPPRESSED' });
  }

  async voidTeacherReviewPacket(ctx: ResultRecoveryCommandContext, packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher review packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.packetRepo.void(packetId, reasonCode || 'VOIDED', safeMessage || 'Teacher review packet voided');
    return this.envelope(ctx, { resourceId: packetId, status: 'void', safeMessage: safeMessage || 'Teacher review packet voided', reasonCode: reasonCode || 'PACKET_VOIDED' });
  }
}
