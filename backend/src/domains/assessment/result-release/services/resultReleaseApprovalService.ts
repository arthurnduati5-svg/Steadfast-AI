import { randomUUID } from 'crypto';
import type {
  ResultReleaseSafeEnvelope,
  ResultReleaseCommandContext,
} from '../contracts';
import type { ResultReleaseApproval, CreateReleaseApprovalInput } from '../contracts/resultReleaseApprovalContracts';
import type {
  ResultReleaseApprovalRepository,
  ResultReleasePacketRepository,
} from '../contracts/resultReleaseRepositoryContracts';
import type { ResultReleaseAuditBridge } from './resultReleaseAuditBridge';
import type { ResultReleaseIdempotencyService } from './resultReleaseIdempotencyService';
import {
  evaluateReleaseApprovalPolicy,
  evaluateAuditPolicy,
} from '../policies/resultReleasePolicyDefinitions';

export class ResultReleaseApprovalService {
  constructor(
    private approvalRepo: ResultReleaseApprovalRepository,
    private packetRepo: ResultReleasePacketRepository,
    private auditBridge: ResultReleaseAuditBridge,
    private idempotencyService: ResultReleaseIdempotencyService,
  ) {}

  private envelope(ctx: ResultReleaseCommandContext, overrides: Partial<ResultReleaseSafeEnvelope>): ResultReleaseSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createReleaseApproval(
    ctx: ResultReleaseCommandContext,
    input: Omit<CreateReleaseApprovalInput, 'schoolId' | 'approvedByActorId' | 'approvedByRole'>,
  ): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateReleaseApprovalPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx.schoolId, 'createReleaseApproval', ctx.idempotencyKey);
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx.schoolId, 'createReleaseApproval', ctx.idempotencyKey, 'create');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateReleaseApprovalInput = {
      ...input,
      schoolId: ctx.schoolId,
      approvedByActorId: ctx.actorId,
      approvedByRole: ctx.actorRole,
    };

    try {
      const approval = await this.approvalRepo.create(createInput);
      await this.auditBridge.recordReleaseApprovalCreated(ctx, approval);
      await this.idempotencyService.completeOperation(startIdem, approval.resultReleaseApprovalId, 'Approval created');
      return this.envelope(ctx, { resourceId: approval.resultReleaseApprovalId, status: approval.approvalStatus, safeMessage: 'Release approval created', data: approval, nextAllowedActions: ['approveReleasePacket'] });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create approval', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async approveReleasePacket(ctx: ResultReleaseCommandContext, approvalId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const approval = await this.approvalRepo.getById(approvalId);
    if (!approval) return this.envelope(ctx, { ok: false, safeMessage: 'Approval not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const policyCheck = evaluateReleaseApprovalPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    if (approval.approvalStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Approval must be in draft status to approve', reasonCode: 'INVALID_STATUS', status: 'error' });

    const approvedAt = new Date().toISOString();
    const updated = await this.approvalRepo.updateStatus(approvalId, 'approved', 'Approved by ' + ctx.actorRole);
    if (updated) await this.packetRepo.updateStatus(approval.resultReleasePacketId, 'approved_for_internal_release');
    await this.auditBridge.recordReleasePacketApproved(ctx, approval, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: approvalId, status: 'approved', safeMessage: 'Release packet approved', nextAllowedActions: ['createDeliveryIntent'] });
  }

  async rejectReleasePacket(ctx: ResultReleaseCommandContext, approvalId: string, reasonCode?: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const approval = await this.approvalRepo.getById(approvalId);
    if (!approval) return this.envelope(ctx, { ok: false, safeMessage: 'Approval not found', reasonCode: 'NOT_FOUND', status: 'not_found' });

    const policyCheck = evaluateReleaseApprovalPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    await this.approvalRepo.updateStatus(approvalId, 'rejected', reasonCode ?? 'Rejected');
    await this.auditBridge.recordReleasePacketRejected(ctx, approval, ctx.actorId, ctx.actorRole, reasonCode);
    return this.envelope(ctx, { resourceId: approvalId, status: 'rejected', safeMessage: 'Release packet rejected' });
  }

  async blockReleaseApproval(ctx: ResultReleaseCommandContext, approvalId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const approval = await this.approvalRepo.getById(approvalId);
    if (!approval) return this.envelope(ctx, { ok: false, safeMessage: 'Approval not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (approval.approvalStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided approval', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.approvalRepo.blockApproval(approvalId);
    return this.envelope(ctx, { resourceId: approvalId, status: 'blocked', safeMessage: 'Release approval blocked' });
  }

  async voidReleaseApproval(ctx: ResultReleaseCommandContext, approvalId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const approval = await this.approvalRepo.getById(approvalId);
    if (!approval) return this.envelope(ctx, { ok: false, safeMessage: 'Approval not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (approval.approvalStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.approvalRepo.voidApproval(approvalId, new Date().toISOString());
    return this.envelope(ctx, { resourceId: approvalId, status: 'void', safeMessage: 'Release approval voided' });
  }

  async getReleaseApproval(ctx: ResultReleaseCommandContext, approvalId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const approval = await this.approvalRepo.getById(approvalId);
    if (!approval) return this.envelope(ctx, { ok: false, safeMessage: 'Approval not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: approvalId, status: approval.approvalStatus, safeMessage: 'Approval found', data: approval });
  }

  async listApprovalsForPacket(ctx: ResultReleaseCommandContext, packetId: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const approvals = await this.approvalRepo.listByReleasePacketId(packetId);
    return this.envelope(ctx, { safeMessage: `Found ${approvals.length} approvals for packet`, data: approvals });
  }

  async listApprovalsForStudent(ctx: ResultReleaseCommandContext, studentRef: string): Promise<ResultReleaseSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    if (!studentRef) return this.envelope(ctx, { ok: false, safeMessage: 'Student reference required', reasonCode: 'VALIDATION_FAILED', status: 'error' });
    const approvals = await this.approvalRepo.listByStudentRef(studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${approvals.length} approvals for student`, data: approvals });
  }
}
