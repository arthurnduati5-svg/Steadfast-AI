import { v4 as uuidv4 } from 'uuid';
import type { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../contracts/resultFollowUpContracts';
import type { CreateFollowUpCaseInput } from '../contracts/resultFollowUpCaseContracts';
import type { ResultFollowUpCaseRepository } from '../contracts/resultFollowUpRepositoryContracts';
import { ResultFollowUpPolicyEnforcer } from '../policies/resultFollowUpPolicyDefinitions';
import { ResultFollowUpIdempotencyService } from './resultFollowUpIdempotencyService';
import { ResultFollowUpAuditBridge } from './resultFollowUpAuditBridge';

export class ResultFollowUpCaseService {
  private policyEnforcer = new ResultFollowUpPolicyEnforcer();

  constructor(
    private caseRepo: ResultFollowUpCaseRepository,
    private auditBridge: ResultFollowUpAuditBridge,
    private idempotencyService: ResultFollowUpIdempotencyService,
  ) {}

  private envelope(ctx: ResultFollowUpCommandContext, overrides: Partial<ResultFollowUpSafeEnvelope>): ResultFollowUpSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createFollowUpCase(ctx: ResultFollowUpCommandContext, input: Omit<CreateFollowUpCaseInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_CASE_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createFollowUpCase', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreateFollowUpCaseInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.caseRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createFollowUpCase', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createFollowUpCase', idempotencyKey, 'ResultFollowUpCase', record.resultFollowUpCaseId, 'Follow-up case created');
    await this.auditBridge.recordFollowUpCaseCreated(ctx.schoolId, record.resultFollowUpCaseId, ctx.actorId, ctx.actorRole, undefined, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: record.resultFollowUpCaseId, status: record.caseStatus, safeMessage: 'Follow-up case created', reasonCode: 'CASE_CREATED', data: record });
  }

  async getFollowUpCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.caseRepo.getById(caseId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up case not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: caseId, status: record.caseStatus, safeMessage: 'Follow-up case found', data: record });
  }

  async listFollowUpCasesForSchool(ctx: ResultFollowUpCommandContext): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.caseRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} follow-up cases for school`, data: records });
  }

  async listFollowUpCasesForStudent(ctx: ResultFollowUpCommandContext, studentRef: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.caseRepo.listByStudentRef(ctx.schoolId, studentRef);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} follow-up cases for student`, data: records });
  }

  async listFollowUpCasesByStatus(ctx: ResultFollowUpCommandContext, status: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.caseRepo.listByStatus(ctx.schoolId, status);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} follow-up cases with status ${status}`, data: records });
  }

  async listFollowUpCasesByPriority(ctx: ResultFollowUpCommandContext, priority: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.caseRepo.listByPriority(ctx.schoolId, priority);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} follow-up cases with priority ${priority}`, data: records });
  }

  async listFollowUpCasesByType(ctx: ResultFollowUpCommandContext, type: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.caseRepo.listByType(ctx.schoolId, type);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} follow-up cases with type ${type}`, data: records });
  }

  async openFollowUpCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_CASE_OPEN', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.caseRepo.getById(caseId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up case not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.caseStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot open voided case', reasonCode: 'INVALID_STATUS', status: 'error' });
    if (record.caseStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Case must be in draft status to open', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'openFollowUpCase', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.caseRepo.open(caseId, 'OPENED', 'Follow-up case opened');
    await this.idempotencyService.startOperation(ctx.schoolId, 'openFollowUpCase', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'openFollowUpCase', idempotencyKey, 'ResultFollowUpCase', caseId, 'Follow-up case opened');
    await this.auditBridge.recordFollowUpCaseOpened(ctx.schoolId, caseId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: caseId, status: 'opened', safeMessage: 'Follow-up case opened', reasonCode: 'CASE_OPENED' });
  }

  async triageFollowUpCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_CASE_TRIAGE', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.caseRepo.getById(caseId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up case not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.caseStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot triage voided case', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'triageFollowUpCase', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.caseRepo.triage(caseId, 'TRIAGED', 'Follow-up case triaged');
    await this.idempotencyService.startOperation(ctx.schoolId, 'triageFollowUpCase', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'triageFollowUpCase', idempotencyKey, 'ResultFollowUpCase', caseId, 'Follow-up case triaged');
    await this.auditBridge.recordFollowUpCaseTriaged(ctx.schoolId, caseId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: caseId, status: 'triaged', safeMessage: 'Follow-up case triaged', reasonCode: 'CASE_TRIAGED' });
  }

  async markCasePlanned(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_CASE_PLAN', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.caseRepo.getById(caseId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up case not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.caseStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot plan voided case', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markCasePlanned', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.caseRepo.markPlanned(caseId, 'PLANNED', 'Follow-up case marked planned');
    await this.idempotencyService.startOperation(ctx.schoolId, 'markCasePlanned', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markCasePlanned', idempotencyKey, 'ResultFollowUpCase', caseId, 'Follow-up case marked planned');
    await this.auditBridge.recordFollowUpCasePlanned(ctx.schoolId, caseId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: caseId, status: 'planned', safeMessage: 'Follow-up case marked planned', reasonCode: 'CASE_PLANNED' });
  }

  async markCaseUnderReview(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_CASE_REVIEW', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.caseRepo.getById(caseId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up case not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.caseStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided case', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markCaseUnderReview', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.caseRepo.markUnderReview(caseId, 'UNDER_REVIEW', 'Follow-up case under review');
    await this.idempotencyService.startOperation(ctx.schoolId, 'markCaseUnderReview', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markCaseUnderReview', idempotencyKey, 'ResultFollowUpCase', caseId, 'Follow-up case under review');
    return this.envelope(ctx, { resourceId: caseId, status: 'under_review', safeMessage: 'Follow-up case under review', reasonCode: 'CASE_UNDER_REVIEW' });
  }

  async closeFollowUpCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_CASE_CLOSE', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.caseRepo.getById(caseId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up case not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.caseStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot close voided case', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'closeFollowUpCase', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.caseRepo.close(caseId, 'CLOSED', 'Follow-up case closed');
    await this.idempotencyService.startOperation(ctx.schoolId, 'closeFollowUpCase', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'closeFollowUpCase', idempotencyKey, 'ResultFollowUpCase', caseId, 'Follow-up case closed');
    await this.auditBridge.recordFollowUpCaseClosed(ctx.schoolId, caseId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: caseId, status: 'closed', safeMessage: 'Follow-up case closed', reasonCode: 'CASE_CLOSED' });
  }

  async blockFollowUpCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_CASE_BLOCK', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.caseRepo.getById(caseId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up case not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.caseStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided case', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.caseRepo.block(caseId, 'BLOCKED', 'Follow-up case blocked');
    await this.auditBridge.recordPolicyBlocked(ctx.schoolId, 'CASE_BLOCKED', ctx.actorId, ctx.actorRole, undefined, ctx.requestId, ctx.correlationId);
    return this.envelope(ctx, { resourceId: caseId, status: 'blocked', safeMessage: 'Follow-up case blocked', reasonCode: 'CASE_BLOCKED' });
  }

  async voidFollowUpCase(ctx: ResultFollowUpCommandContext, caseId: string): Promise<ResultFollowUpSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_FOLLOW_UP_CASE_VOID', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.caseRepo.getById(caseId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Follow-up case not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.caseStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.caseRepo.void(caseId, 'VOIDED', 'Follow-up case voided');
    return this.envelope(ctx, { resourceId: caseId, status: 'void', safeMessage: 'Follow-up case voided', reasonCode: 'CASE_VOIDED' });
  }
}
