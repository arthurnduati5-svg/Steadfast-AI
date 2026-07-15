import { randomUUID } from 'crypto';
import type { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope } from '../contracts/resultRecoveryContracts';
import { ResultRecoveryPolicyEnforcer } from '../policies/resultRecoveryPolicyDefinitions';
import { ResultRecoverySafetyService } from './resultRecoverySafetyService';
import { ResultRecoveryIdempotencyService } from './resultRecoveryIdempotencyService';
import { ResultRecoveryAuditBridge } from './resultRecoveryAuditBridge';

export interface ResourceRecommendationInput {
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId?: string;
  studentRef: string;
  resourceType: string;
  resourceRef: string;
  safeResourceSummary: string;
  rationaleJson?: Record<string, unknown>;
}

export interface ResourceRecommendation {
  resultRecoveryResourceRecommendationId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  resultRecoveryObjectiveId: string | null;
  studentRef: string;
  resourceStatus: string;
  resourceType: string;
  resourceRef: string;
  safeResourceSummary: string;
  rationaleJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface ResourceRecommendationPreview {
  resultRecoveryResourceRecommendationId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  resourceStatus: string;
  resourceType: string;
  safeResourceSummary: string;
  createdAt: string;
}

export interface ResourceRecommendationRepository {
  create(input: ResourceRecommendationInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResourceRecommendation>;
  getById(resourceId: string): Promise<ResourceRecommendation | null>;
  listByPlanId(planId: string): Promise<ResourceRecommendationPreview[]>;
  listByObjectiveId(objectiveId: string): Promise<ResourceRecommendationPreview[]>;
  update(resourceId: string, data: Partial<ResourceRecommendation>): Promise<ResourceRecommendation>;
  updateStatus(resourceId: string, resourceStatus: string, reasonCode: string, safeMessage: string): Promise<ResourceRecommendation>;
  markReviewReady(resourceId: string): Promise<ResourceRecommendation>;
  approveForFutureUse(resourceId: string): Promise<ResourceRecommendation>;
  suppress(resourceId: string, reasonCode: string, safeMessage: string): Promise<ResourceRecommendation>;
  block(resourceId: string, reasonCode: string, safeMessage: string): Promise<ResourceRecommendation>;
  void(resourceId: string, reasonCode: string, safeMessage: string): Promise<ResourceRecommendation>;
}

export class ResultRecoveryResourceRecommendationService {
  private policyEnforcer = new ResultRecoveryPolicyEnforcer();

  constructor(
    private resourceRepo: ResourceRecommendationRepository,
    private safetyService: ResultRecoverySafetyService,
    private auditBridge: ResultRecoveryAuditBridge,
    private idempotencyService: ResultRecoveryIdempotencyService,
  ) {}

  private envelope(ctx: ResultRecoveryCommandContext, overrides: Partial<ResultRecoverySafeEnvelope>): ResultRecoverySafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createResourceRecommendation(ctx: ResultRecoveryCommandContext, input: ResourceRecommendationInput): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_RESOURCE_RECOMMENDATION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createResourceRecommendation', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: ResourceRecommendationInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.resourceRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createResourceRecommendation', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createResourceRecommendation', idempotencyKey, 'ResourceRecommendation', record.resultRecoveryResourceRecommendationId, 'Resource recommendation created');
    await this.auditBridge.recordResourceRecommendationCreated(ctx.schoolId, record.resultRecoveryPlanId, record.resultRecoveryResourceRecommendationId, ctx.actorId, ctx.actorRole);
    return this.envelope(ctx, { resourceId: record.resultRecoveryResourceRecommendationId, status: record.resourceStatus, safeMessage: 'Resource recommendation created', reasonCode: 'RESOURCE_CREATED', data: record });
  }

  async getResourceRecommendation(ctx: ResultRecoveryCommandContext, resourceId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.resourceRepo.getById(resourceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Resource recommendation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId, status: record.resourceStatus, safeMessage: 'Resource recommendation found', data: record });
  }

  async listResourceRecommendationsForPlan(ctx: ResultRecoveryCommandContext, planId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.resourceRepo.listByPlanId(planId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} resource recommendations for plan`, data: records });
  }

  async listResourceRecommendationsForObjective(ctx: ResultRecoveryCommandContext, objectiveId: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const records = await this.resourceRepo.listByObjectiveId(objectiveId);
    return this.envelope(ctx, { safeMessage: `Found ${records.length} resource recommendations for objective`, data: records });
  }

  async markResourceRecommendationReviewReady(ctx: ResultRecoveryCommandContext, resourceId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_RESOURCE_RECOMMENDATION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.resourceRepo.getById(resourceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Resource recommendation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.resourceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot review voided resource', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'markResourceRecommendationReviewReady', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.resourceRepo.markReviewReady(resourceId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'markResourceRecommendationReviewReady', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'markResourceRecommendationReviewReady', idempotencyKey, 'ResourceRecommendation', resourceId, 'Resource recommendation review ready');
    return this.envelope(ctx, { resourceId, status: 'review_ready', safeMessage: safeMessage || 'Resource recommendation review ready', reasonCode: reasonCode || 'RESOURCE_REVIEW_READY' });
  }

  async approveResourceRecommendationForFutureUse(ctx: ResultRecoveryCommandContext, resourceId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = this.policyEnforcer.enforce('RESULT_RECOVERY_RESOURCE_RECOMMENDATION_CREATION', ctx.actorRole);
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, status: 'blocked' });
    const record = await this.resourceRepo.getById(resourceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Resource recommendation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.resourceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot approve voided resource', reasonCode: 'INVALID_STATUS', status: 'error' });

    const idempotencyKey = ctx.idempotencyKey || randomUUID();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'approveResourceRecommendationForFutureUse', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    await this.resourceRepo.approveForFutureUse(resourceId);
    await this.idempotencyService.startOperation(ctx.schoolId, 'approveResourceRecommendationForFutureUse', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'approveResourceRecommendationForFutureUse', idempotencyKey, 'ResourceRecommendation', resourceId, 'Resource recommendation approved');
    return this.envelope(ctx, { resourceId, status: 'approved_for_future_use', safeMessage: safeMessage || 'Resource recommendation approved for future use', reasonCode: reasonCode || 'RESOURCE_APPROVED' });
  }

  async suppressResourceRecommendation(ctx: ResultRecoveryCommandContext, resourceId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.resourceRepo.getById(resourceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Resource recommendation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.resourceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided resource', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.resourceRepo.suppress(resourceId, reasonCode || 'SUPPRESSED', safeMessage || 'Resource recommendation suppressed');
    return this.envelope(ctx, { resourceId, status: 'suppressed', safeMessage: safeMessage || 'Resource recommendation suppressed', reasonCode: reasonCode || 'RESOURCE_SUPPRESSED' });
  }

  async blockResourceRecommendation(ctx: ResultRecoveryCommandContext, resourceId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.resourceRepo.getById(resourceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Resource recommendation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.resourceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided resource', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.resourceRepo.block(resourceId, reasonCode || 'BLOCKED', safeMessage || 'Resource recommendation blocked');
    return this.envelope(ctx, { resourceId, status: 'blocked', safeMessage: safeMessage || 'Resource recommendation blocked', reasonCode: reasonCode || 'RESOURCE_BLOCKED' });
  }

  async voidResourceRecommendation(ctx: ResultRecoveryCommandContext, resourceId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const record = await this.resourceRepo.getById(resourceId);
    if (!record) return this.envelope(ctx, { ok: false, safeMessage: 'Resource recommendation not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (record.resourceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.resourceRepo.void(resourceId, reasonCode || 'VOIDED', safeMessage || 'Resource recommendation voided');
    return this.envelope(ctx, { resourceId, status: 'void', safeMessage: safeMessage || 'Resource recommendation voided', reasonCode: reasonCode || 'RESOURCE_VOIDED' });
  }
}
