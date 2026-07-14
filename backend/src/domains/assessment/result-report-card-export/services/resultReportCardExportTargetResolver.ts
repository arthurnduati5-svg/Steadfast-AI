import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../../result-report-card/contracts/resultReportCardContracts';
import type { ResultReportCardExportTargetRepository } from '../contracts/resultReportCardExportRepositoryContracts';
import type { CreateExportTargetInput, ResultReportCardExportTarget } from '../contracts/resultReportCardExportTargetContracts';
import { evaluateReportCardExportTargetResolutionPolicy } from '../policies/resultReportCardExportPolicyDefinitions';
import { ResultReportCardExportIdempotencyService } from './resultReportCardExportIdempotencyService';
import { ResultReportCardExportAuditBridge } from './resultReportCardExportAuditBridge';

export class ResultReportCardExportTargetResolver {
  constructor(
    private targetRepo: ResultReportCardExportTargetRepository,
    private auditBridge: ResultReportCardExportAuditBridge,
    private idempotencyService: ResultReportCardExportIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createExportTarget(ctx: ResultReportCardCommandContext, input: Omit<CreateExportTargetInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardExportTargetResolutionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createExportTarget', ctx.idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const createInput: CreateExportTargetInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record: ResultReportCardExportTarget = {
      resultReportCardExportTargetId: id,
      schoolId: ctx.schoolId,
      ...input,
      targetStatus: 'draft',
      targetDescriptorJson: input.targetDescriptorJson || null,
      blockedReasonCodesJson: input.blockedReasonCodesJson || null,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      validatedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    await this.targetRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createExportTarget', ctx.idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createExportTarget', ctx.idempotencyKey, 'ResultReportCardExportTarget', id, 'Export target created');
    await this.auditBridge.recordTargetCreated(ctx, id, input.resultReportCardExportJobId, `Export target created for job ${input.resultReportCardExportJobId}`);
    return this.envelope(ctx, { resourceId: id, status: 'draft', safeMessage: 'Export target created successfully', reasonCode: 'EXPORT_TARGET_CREATED', data: record });
  }

  async getExportTarget(ctx: ResultReportCardCommandContext, targetId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const target = await this.targetRepo.getById(targetId);
    if (!target) return this.envelope(ctx, { ok: false, safeMessage: 'Export target not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: targetId, status: target.targetStatus, safeMessage: 'Export target found', data: target });
  }

  async listExportTargetsForJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const targets = await this.targetRepo.listByExportJobId(jobId);
    return this.envelope(ctx, { safeMessage: `Found ${targets.length} export targets for job`, data: targets });
  }

  async validateExportTarget(ctx: ResultReportCardCommandContext, targetId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const target = await this.targetRepo.getById(targetId);
    if (!target) return this.envelope(ctx, { ok: false, safeMessage: 'Export target not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (target.targetStatus !== 'draft') return this.envelope(ctx, { ok: false, safeMessage: 'Export target must be in draft status to validate', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.targetRepo.updateStatus(targetId, 'validated');
    await this.auditBridge.recordTargetValidated(ctx, targetId, target.resultReportCardExportJobId, 'Export target validated');
    return this.envelope(ctx, { resourceId: targetId, status: 'validated', safeMessage: 'Export target validated', reasonCode: 'VALIDATED' });
  }

  async suppressExportTarget(ctx: ResultReportCardCommandContext, targetId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const target = await this.targetRepo.getById(targetId);
    if (!target) return this.envelope(ctx, { ok: false, safeMessage: 'Export target not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (target.targetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided export target', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.targetRepo.suppress(targetId, 'SUPPRESSED', 'Export target suppressed');
    return this.envelope(ctx, { resourceId: targetId, status: 'suppressed', safeMessage: 'Export target suppressed', reasonCode: 'SUPPRESSED' });
  }

  async blockExportTarget(ctx: ResultReportCardCommandContext, targetId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const target = await this.targetRepo.getById(targetId);
    if (!target) return this.envelope(ctx, { ok: false, safeMessage: 'Export target not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (target.targetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided export target', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.targetRepo.block(targetId, 'BLOCKED', 'Export target blocked');
    return this.envelope(ctx, { resourceId: targetId, status: 'blocked', safeMessage: 'Export target blocked', reasonCode: 'BLOCKED' });
  }

  async voidExportTarget(ctx: ResultReportCardCommandContext, targetId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const target = await this.targetRepo.getById(targetId);
    if (!target) return this.envelope(ctx, { ok: false, safeMessage: 'Export target not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (target.targetStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.targetRepo.void(targetId, 'VOIDED', 'Export target voided');
    return this.envelope(ctx, { resourceId: targetId, status: 'void', safeMessage: 'Export target voided', reasonCode: 'VOIDED' });
  }
}
