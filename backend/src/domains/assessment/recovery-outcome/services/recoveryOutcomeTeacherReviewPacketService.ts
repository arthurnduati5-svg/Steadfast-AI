import { randomUUID } from 'crypto';
import type { RecoveryOutcomeCommandContext, RecoveryOutcomeSafeEnvelope } from '../contracts/recoveryOutcomeContracts';
import type { RecoveryOutcomeTeacherReviewPacket, RecoveryOutcomeTeacherReviewPacketCreateRequest } from '../contracts/recoveryOutcomeTeacherReviewPacketContracts';
import { RecoveryOutcomePolicyEnforcer } from '../policies/recoveryOutcomePolicyDefinitions';
import { RecoveryOutcomeSafetyService } from './recoveryOutcomeSafetyService';
import { RecoveryOutcomeIdempotencyService } from './recoveryOutcomeIdempotencyService';
import { RecoveryOutcomeAuditBridge } from './recoveryOutcomeAuditBridge';

export interface TeacherReviewPacketRepository {
  create(data: RecoveryOutcomeTeacherReviewPacket): Promise<RecoveryOutcomeTeacherReviewPacket>;
  getById(id: string): Promise<RecoveryOutcomeTeacherReviewPacket | null>;
  listBySchool(schoolId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeTeacherReviewPacket[]>;
  update(id: string, data: Partial<RecoveryOutcomeTeacherReviewPacket>): Promise<RecoveryOutcomeTeacherReviewPacket>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeTeacherReviewPacket>;
}

export class RecoveryOutcomeTeacherReviewPacketService {
  private policyEnforcer = new RecoveryOutcomePolicyEnforcer();

  constructor(
    private packetRepo: TeacherReviewPacketRepository,
    private safetyService: RecoveryOutcomeSafetyService,
    private auditBridge: RecoveryOutcomeAuditBridge,
    private idempotencyService: RecoveryOutcomeIdempotencyService,
  ) {}

  private envelope(ctx: RecoveryOutcomeCommandContext, overrides: Partial<RecoveryOutcomeSafeEnvelope>): RecoveryOutcomeSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createTeacherReviewPacket(ctx: RecoveryOutcomeCommandContext, input: RecoveryOutcomeTeacherReviewPacketCreateRequest): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_TEACHER_REVIEW_PACKET_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const schoolCheck = this.safetyService.assertSchoolContext(input.schoolId);
    if (!schoolCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: schoolCheck.safeMessage, reasonCode: schoolCheck.reasonCode, status: 'blocked' });

    const leakageCheck = this.safetyService.checkAllLeakageCategories(input.safeReviewPacketSummary, input.sourceRefsJson);
    if (!leakageCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: leakageCheck.safeMessage, reasonCode: leakageCheck.reasonCode, status: 'blocked' });

    const sourceRefCheck = this.safetyService.assertSourceRefPresent(input.sourceRefsJson);
    if (!sourceRefCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: sourceRefCheck.safeMessage, reasonCode: sourceRefCheck.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createTeacherReviewPacket', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const now = new Date().toISOString();
    const record: RecoveryOutcomeTeacherReviewPacket = {
      recoveryOutcomeTeacherReviewPacketId: randomUUID(),
      schoolId: ctx.schoolId,
      studentRef: input.studentRef,
      teacherRef: input.teacherRef,
      resultRecoveryPlanId: input.resultRecoveryPlanId,
      recoveryOutcomeDecisionReadinessId: input.recoveryOutcomeDecisionReadinessId,
      recoveryEvidenceRollupId: input.recoveryEvidenceRollupId,
      recoveryProgressSummaryId: input.recoveryProgressSummaryId,
      packetStatus: 'draft',
      safeReviewPacketSummary: input.safeReviewPacketSummary,
      readinessSnapshotJson: input.readinessSnapshotJson,
      decisionDraftRefsJson: input.decisionDraftRefsJson,
      teacherReviewCompleteAt: undefined,
      reviewNotesJson: {},
      blockedReasonCodesJson: [],
      sourceRefsJson: input.sourceRefsJson,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      reviewReadyAt: undefined,
      approvedForFutureUseAt: undefined,
      suppressedAt: undefined,
      blockedAt: undefined,
      voidedAt: undefined,
    };
    const created = await this.packetRepo.create(record);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createTeacherReviewPacket', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createTeacherReviewPacket', idempotencyKey, 'RecoveryOutcomeTeacherReviewPacket', created.recoveryOutcomeTeacherReviewPacketId, 'Teacher review packet created');
    await this.auditBridge.recordTeacherReviewPacketCreated(ctx.schoolId, created.recoveryOutcomeTeacherReviewPacketId, ctx.actorId, ctx.actorRole, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: created.recoveryOutcomeTeacherReviewPacketId, status: created.packetStatus, safeMessage: 'Teacher review packet created', reasonCode: 'TEACHER_REVIEW_PACKET_CREATED', data: created });
  }

  async getTeacherReviewPacket(ctx: RecoveryOutcomeCommandContext, packetId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Teacher review packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: packetId, status: record.packetStatus, safeMessage: 'Teacher review packet found', data: record });
  }

  async listPacketsForSchool(ctx: RecoveryOutcomeCommandContext): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.packetRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher review packets for school`, data: records });
  }

  async listPacketsForStudent(ctx: RecoveryOutcomeCommandContext, studentRef: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.packetRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher review packets for student`, data: records });
  }

  async listPacketsForPlan(ctx: RecoveryOutcomeCommandContext, planId: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.packetRepo.listByPlanId(ctx.schoolId, planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher review packets for plan`, data: records });
  }

  async listPacketsForTeacher(ctx: RecoveryOutcomeCommandContext, teacherRef: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.packetRepo.listByTeacherRef(ctx.schoolId, teacherRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} teacher review packets for teacher`, data: records });
  }

  async markPacketReviewReady(ctx: RecoveryOutcomeCommandContext, packetId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_TEACHER_REVIEW_PACKET_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided packet', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.packetRepo.updateStatus(packetId, 'review_ready', now);
    await this.packetRepo.update(packetId, { reviewReadyAt: now } as any);
    await this.auditBridge.recordTeacherReviewPacketReviewReady(ctx.schoolId, packetId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: packetId, status: 'review_ready', safeMessage: safeMessage || 'Teacher review packet review ready', reasonCode: reasonCode || 'TEACHER_REVIEW_PACKET_REVIEW_READY' });
  }

  async approvePacketForFutureUse(ctx: RecoveryOutcomeCommandContext, packetId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RECOVERY_OUTCOME_TEACHER_REVIEW_PACKET_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided packet', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.packetRepo.updateStatus(packetId, 'approved_for_future_use', now);
    await this.packetRepo.update(packetId, { approvedForFutureUseAt: now } as any);
    await this.auditBridge.recordTeacherReviewPacketApprovedForFutureUse(ctx.schoolId, packetId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: packetId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Teacher review packet approved', reasonCode: reasonCode || 'TEACHER_REVIEW_PACKET_APPROVED' });
  }

  async suppressPacket(ctx: RecoveryOutcomeCommandContext, packetId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided packet', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.packetRepo.updateStatus(packetId, 'suppressed', now);
    await this.packetRepo.update(packetId, { suppressedAt: now } as any);
    return this.envelope(ctx, { resourceId: packetId, status: 'suppressed', safeMessage: safeMessage || 'Teacher review packet suppressed', reasonCode: reasonCode || 'TEACHER_REVIEW_PACKET_SUPPRESSED' });
  }

  async blockPacket(ctx: RecoveryOutcomeCommandContext, packetId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided packet', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.packetRepo.updateStatus(packetId, 'blocked', now);
    await this.packetRepo.update(packetId, { blockedAt: now, blockedReasonCodesJson: reasonCode ? [reasonCode] : [] } as any);
    return this.envelope(ctx, { resourceId: packetId, status: 'blocked', safeMessage: safeMessage || 'Teacher review packet blocked', reasonCode: reasonCode || 'TEACHER_REVIEW_PACKET_BLOCKED' });
  }

  async voidPacket(ctx: RecoveryOutcomeCommandContext, packetId: string, reasonCode?: string, safeMessage?: string): Promise<RecoveryOutcomeSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.packetRepo.getById(packetId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Packet not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.packetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    const now = new Date().toISOString();
    await this.packetRepo.updateStatus(packetId, 'void', now);
    await this.packetRepo.update(packetId, { voidedAt: now } as any);
    return this.envelope(ctx, { resourceId: packetId, status: 'void', safeMessage: safeMessage || 'Teacher review packet voided', reasonCode: reasonCode || 'TEACHER_REVIEW_PACKET_VOIDED' });
  }
}
