import { v4 as uuidv4 } from 'uuid';
import type { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../contracts/resultFollowUpContracts';
import type { CreateEscalationPlanInput } from '../contracts/followUpEscalationPlanContracts';
import type { FollowUpEscalationPlanRepository } from '../contracts/resultFollowUpRepositoryContracts';
import { ResultFollowUpPolicyEnforcer } from '../policies/resultFollowUpPolicyDefinitions';
import { ResultFollowUpSafetyService } from './resultFollowUpSafetyService';
import { ResultFollowUpIdempotencyService } from './resultFollowUpIdempotencyService';
import { ResultFollowUpAuditBridge } from './resultFollowUpAuditBridge';

export class FollowUpEscalationPlanService {
  private policyEnforcer = new ResultFollowUpPolicyEnforcer();

  constructor(
    private escalationRepo: FollowUpEscalationPlanRepository,
    private safetyService: ResultFollowUpSafetyService,
    private auditBridge: ResultFollowUpAuditBridge,
    private idempotencyService: ResultFollowUpIdempotencyService,
  ) {}

  private envelope(ctx: ResultFollowUpCommandContext, overrides: Partial<ResultFollowUpSafeEnvelope>): ResultFollowUpSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createEscalationPlan(ctx: ResultFollowUpCommandContext, input: Omit<CreateEscalationPlanInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('FOLLOW_UP_ESCALATION_PLAN_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createEscalationPlan', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const safePayload = (input.allowedDisclosure || {}) as Record<string, unknown>;
    const safetyCheck = this.safetyService.assertEscalationPlanSafe(safePayload);
    if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });

    const createInput: CreateEscalationPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.escalationRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createEscalationPlan', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createEscalationPlan', idempotencyKey, 'FollowUpEscalationPlan', record.followUpEscalationPlanId, 'Escalation plan created');
    await this.auditBridge.recordEscalationPlanCreated(ctx.schoolId, record.resultFollowUpCaseId, record.followUpEscalationPlanId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.followUpEscalationPlanId, status: record.escalationStatus, safeMessage: 'Escalation plan created', reasonCode: 'ESCALATION_CREATED', data: record });
  }

  async getEscalationPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.escalationRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Escalation plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: planId, status: record.escalationStatus, safeMessage: 'Escalation plan found', data: record });
  }

  async listEscalationPlansForSchool(ctx: ResultFollowUpCommandContext): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.escalationRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} escalation plans for school`, data: records });
  }

  async listEscalationPlansForCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.escalationRepo.listByCaseId(caseId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} escalation plans for case`, data: records });
  }

  async listEscalationPlansForStudent(ctx: ResultFollowUpCommandContext, studentRef: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.escalationRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} escalation plans for student`, data: records });
  }

  async listEscalationPlansByStatus(ctx: ResultFollowUpCommandContext, status: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.escalationRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} escalation plans with status ${status}`, data: records });
  }

  async listEscalationPlansByLevel(ctx: ResultFollowUpCommandContext, level: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.escalationRepo.listByLevel(ctx.schoolId, level);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} escalation plans with level ${level}`, data: records });
  }

  async markEscalationPlanReviewReady(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('FOLLOW_UP_ESCALATION_PLAN_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.escalationRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Escalation plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.escalationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided escalation plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.escalationRepo.markReviewReady(planId);
    return this.envelope(ctx, { resourceId: planId, status: 'review_ready', safeMessage: 'Escalation plan review ready', reasonCode: 'ESCALATION_REVIEW_READY' });
  }

  async approveEscalationPlanForFutureUse(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('FOLLOW_UP_SUMMARY_MUTATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.escalationRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Escalation plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.escalationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided escalation plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveEscalationPlanForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.escalationRepo.approveForFutureUse(planId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveEscalationPlanForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveEscalationPlanForFutureUse', idempotencyKey, 'FollowUpEscalationPlan', planId, 'Escalation plan approved');
    await this.auditBridge.recordEscalationApprovedForFutureUse(ctx.schoolId, record.resultFollowUpCaseId, planId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: planId, status: 'approved_for_future_use', safeMessage: 'Escalation plan approved for future use', reasonCode: 'ESCALATION_APPROVED' });
  }

  async suppressEscalationPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.escalationRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Escalation plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.escalationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided escalation plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.escalationRepo.suppress(planId, 'SUPPRESSED', 'Escalation plan suppressed');
    return this.envelope(ctx, { resourceId: planId, status: 'suppressed', safeMessage: 'Escalation plan suppressed', reasonCode: 'ESCALATION_SUPPRESSED' });
  }

  async blockEscalationPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.escalationRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Escalation plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.escalationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided escalation plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.escalationRepo.block(planId, 'BLOCKED', 'Escalation plan blocked');
    return this.envelope(ctx, { resourceId: planId, status: 'blocked', safeMessage: 'Escalation plan blocked', reasonCode: 'ESCALATION_BLOCKED' });
  }

  async voidEscalationPlan(ctx: ResultFollowUpCommandContext, planId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.escalationRepo.getById(planId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Escalation plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.escalationStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.escalationRepo.void(planId, 'VOIDED', 'Escalation plan voided');
    return this.envelope(ctx, { resourceId: planId, status: 'void', safeMessage: 'Escalation plan voided', reasonCode: 'ESCALATION_VOIDED' });
  }
}
