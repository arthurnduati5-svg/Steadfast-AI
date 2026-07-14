import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../../result-report-card/contracts/resultReportCardContracts';
import type { ResultReportCardExportRetryPlanRepository } from '../contracts/resultReportCardExportRepositoryContracts';
import type { CreateExportRetryPlanInput, ResultReportCardExportRetryPlan } from '../contracts/resultReportCardExportRetryPlanContracts';
import { evaluateReportCardExportRetryPlanPolicy } from '../policies/resultReportCardExportPolicyDefinitions';
import { ResultReportCardExportIdempotencyService } from './resultReportCardExportIdempotencyService';
import { ResultReportCardExportAuditBridge } from './resultReportCardExportAuditBridge';

export class ResultReportCardExportRetryPlanService {
  constructor(
    private retryPlanRepo: ResultReportCardExportRetryPlanRepository,
    private auditBridge: ResultReportCardExportAuditBridge,
    private idempotencyService: ResultReportCardExportIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createRetryPlan(ctx: ResultReportCardCommandContext, input: Omit<CreateExportRetryPlanInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardExportRetryPlanPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createRetryPlan', ctx.idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const createInput: CreateExportRetryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      retryPolicy: input.retryPolicy || 'exponential_backoff',
      maxMockAttempts: input.maxMockAttempts ?? 3,
      attemptsUsed: input.attemptsUsed ?? 0,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record: ResultReportCardExportRetryPlan = {
      resultReportCardExportRetryPlanId: id,
      schoolId: ctx.schoolId,
      ...input,
      retryPolicy: input.retryPolicy || 'exponential_backoff',
      nextMockRetryAt: input.nextMockRetryAt || null,
      maxMockAttempts: input.maxMockAttempts ?? 3,
      attemptsUsed: input.attemptsUsed ?? 0,
      retryStatus: 'draft',
      blockedReasonCodesJson: input.blockedReasonCodesJson || null,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      cancelledAt: null,
      voidedAt: null,
    };
    await this.retryPlanRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createRetryPlan', ctx.idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createRetryPlan', ctx.idempotencyKey, 'ResultReportCardExportRetryPlan', id, 'Export retry plan created');
    await this.auditBridge.recordRetryPlanCreated(ctx, id, input.resultReportCardExportJobId, `Export retry plan created for job ${input.resultReportCardExportJobId}`);
    return this.envelope(ctx, { resourceId: id, status: 'draft', safeMessage: 'Export retry plan created successfully', reasonCode: 'RETRY_PLAN_CREATED', data: record });
  }

  async getRetryPlan(ctx: ResultReportCardCommandContext, planId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plan = await this.retryPlanRepo.getById(planId);
    if (!plan) return this.envelope(ctx, { ok: false, safeMessage: 'Export retry plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: planId, status: plan.retryStatus, safeMessage: 'Export retry plan found', data: plan });
  }

  async listRetryPlansForJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plans = await this.retryPlanRepo.listByExportJobId(jobId);
    return this.envelope(ctx, { safeMessage: `Found ${plans.length} export retry plans for job`, data: plans });
  }

  async listRetryPlansForAttempt(ctx: ResultReportCardCommandContext, attemptId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plans = await this.retryPlanRepo.listByAttemptId(attemptId);
    return this.envelope(ctx, { safeMessage: `Found ${plans.length} export retry plans for attempt`, data: plans });
  }

  async markRetryPlanned(ctx: ResultReportCardCommandContext, planId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plan = await this.retryPlanRepo.getById(planId);
    if (!plan) return this.envelope(ctx, { ok: false, safeMessage: 'Export retry plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (plan.retryStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Export retry plan must be in draft status to mark planned', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.retryPlanRepo.markPlanned(planId);
    return this.envelope(ctx, { resourceId: planId, status: 'planned', safeMessage: 'Export retry plan marked as planned', reasonCode: 'PLANNED' });
  }

  async cancelRetryPlan(ctx: ResultReportCardCommandContext, planId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plan = await this.retryPlanRepo.getById(planId);
    if (!plan) return this.envelope(ctx, { ok: false, safeMessage: 'Export retry plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (plan.retryStatus === 'void' || plan.retryStatus === 'cancelled') return this.envelope(ctx, { ok: false, safeMessage: 'Export retry plan already cancelled or voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.retryPlanRepo.cancel(planId, 'CANCELLED', 'Export retry plan cancelled');
    return this.envelope(ctx, { resourceId: planId, status: 'cancelled', safeMessage: 'Export retry plan cancelled', reasonCode: 'CANCELLED' });
  }

  async exhaustRetryPlan(ctx: ResultReportCardCommandContext, planId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plan = await this.retryPlanRepo.getById(planId);
    if (!plan) return this.envelope(ctx, { ok: false, safeMessage: 'Export retry plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (plan.retryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot exhaust voided export retry plan', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.retryPlanRepo.exhaust(planId, 'EXHAUSTED', 'Export retry plan exhausted');
    return this.envelope(ctx, { resourceId: planId, status: 'exhausted', safeMessage: 'Export retry plan exhausted', reasonCode: 'EXHAUSTED' });
  }

  async voidRetryPlan(ctx: ResultReportCardCommandContext, planId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const plan = await this.retryPlanRepo.getById(planId);
    if (!plan) return this.envelope(ctx, { ok: false, safeMessage: 'Export retry plan not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (plan.retryStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.retryPlanRepo.void(planId, 'VOIDED', 'Export retry plan voided');
    return this.envelope(ctx, { resourceId: planId, status: 'void', safeMessage: 'Export retry plan voided', reasonCode: 'VOIDED' });
  }
}
