import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../../result-report-card/contracts/resultReportCardContracts';
import type { ResultReportCardExportSuppressionRepository } from '../contracts/resultReportCardExportRepositoryContracts';
import type { CreateExportSuppressionInput, ResultReportCardExportSuppression } from '../contracts/resultReportCardExportSuppressionContracts';
import { evaluateReportCardExportSuppressionPolicy } from '../policies/resultReportCardExportPolicyDefinitions';
import { ResultReportCardExportIdempotencyService } from './resultReportCardExportIdempotencyService';
import { ResultReportCardExportAuditBridge } from './resultReportCardExportAuditBridge';

export class ResultReportCardExportSuppressionService {
  constructor(
    private suppressionRepo: ResultReportCardExportSuppressionRepository,
    private auditBridge: ResultReportCardExportAuditBridge,
    private idempotencyService: ResultReportCardExportIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createSuppression(ctx: ResultReportCardCommandContext, input: Omit<CreateExportSuppressionInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardExportSuppressionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createSuppression', ctx.idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const createInput: CreateExportSuppressionInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record: ResultReportCardExportSuppression = {
      resultReportCardExportSuppressionId: id,
      schoolId: ctx.schoolId,
      ...input,
      resultReportCardExportTargetId: input.resultReportCardExportTargetId || null,
      resultReportCardExportEnvelopeId: input.resultReportCardExportEnvelopeId || null,
      suppressionStatus: 'active',
      reasonCodesJson: input.reasonCodesJson || null,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      liftedAt: null,
      voidedAt: null,
    };
    await this.suppressionRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createSuppression', ctx.idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createSuppression', ctx.idempotencyKey, 'ResultReportCardExportSuppression', id, 'Export suppression created');
    await this.auditBridge.recordSuppressionCreated(ctx, id, input.resultReportCardExportJobId, `Export suppression created for job ${input.resultReportCardExportJobId}`);
    return this.envelope(ctx, { resourceId: id, status: 'active', safeMessage: 'Export suppression created successfully', reasonCode: 'SUPPRESSION_CREATED', data: record });
  }

  async getSuppression(ctx: ResultReportCardCommandContext, suppressionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const suppression = await this.suppressionRepo.getById(suppressionId);
    if (!suppression) return this.envelope(ctx, { ok: false, safeMessage: 'Export suppression not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: suppressionId, status: suppression.suppressionStatus, safeMessage: 'Export suppression found', data: suppression });
  }

  async listSuppressionsForJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const suppressions = await this.suppressionRepo.listByExportJobId(jobId);
    return this.envelope(ctx, { safeMessage: `Found ${suppressions.length} export suppressions for job`, data: suppressions });
  }

  async listSuppressionsForTarget(ctx: ResultReportCardCommandContext, targetId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const suppressions = await this.suppressionRepo.listByTargetId(targetId);
    return this.envelope(ctx, { safeMessage: `Found ${suppressions.length} export suppressions for target`, data: suppressions });
  }

  async listSuppressionsForEnvelope(ctx: ResultReportCardCommandContext, envelopeId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const suppressions = await this.suppressionRepo.listByEnvelopeId(envelopeId);
    return this.envelope(ctx, { safeMessage: `Found ${suppressions.length} export suppressions for envelope`, data: suppressions });
  }

  async liftSuppression(ctx: ResultReportCardCommandContext, suppressionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const suppression = await this.suppressionRepo.getById(suppressionId);
    if (!suppression) return this.envelope(ctx, { ok: false, safeMessage: 'Export suppression not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (suppression.suppressionStatus !== 'active') return this.envelope(ctx, { ok: false, safeMessage: 'Export suppression must be active to lift', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.suppressionRepo.lift(suppressionId);
    return this.envelope(ctx, { resourceId: suppressionId, status: 'lifted', safeMessage: 'Export suppression lifted', reasonCode: 'LIFTED' });
  }

  async voidSuppression(ctx: ResultReportCardCommandContext, suppressionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const suppression = await this.suppressionRepo.getById(suppressionId);
    if (!suppression) return this.envelope(ctx, { ok: false, safeMessage: 'Export suppression not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (suppression.suppressionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.suppressionRepo.void(suppressionId, 'VOIDED', 'Export suppression voided');
    return this.envelope(ctx, { resourceId: suppressionId, status: 'void', safeMessage: 'Export suppression voided', reasonCode: 'VOIDED' });
  }
}
