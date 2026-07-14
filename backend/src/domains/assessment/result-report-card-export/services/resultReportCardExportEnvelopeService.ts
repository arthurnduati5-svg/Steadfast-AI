import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../../result-report-card/contracts/resultReportCardContracts';
import type { ResultReportCardExportEnvelopeRepository } from '../contracts/resultReportCardExportRepositoryContracts';
import type { CreateExportEnvelopeInput, ResultReportCardExportEnvelope } from '../contracts/resultReportCardExportEnvelopeContracts';
import { evaluateReportCardExportEnvelopeCompositionPolicy, evaluateReportCardExportNoPdfBinaryPolicy } from '../policies/resultReportCardExportPolicyDefinitions';
import { ResultReportCardExportSafetyService } from './resultReportCardExportSafetyService';
import { ResultReportCardExportIdempotencyService } from './resultReportCardExportIdempotencyService';
import { ResultReportCardExportAuditBridge } from './resultReportCardExportAuditBridge';

export class ResultReportCardExportEnvelopeService {
  constructor(
    private envelopeRepo: ResultReportCardExportEnvelopeRepository,
    private safetyService: ResultReportCardExportSafetyService,
    private auditBridge: ResultReportCardExportAuditBridge,
    private idempotencyService: ResultReportCardExportIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async composeExportEnvelope(ctx: ResultReportCardCommandContext, input: Omit<CreateExportEnvelopeInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardExportEnvelopeCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });
    const pdfPolicy = evaluateReportCardExportNoPdfBinaryPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!pdfPolicy.allowed) return this.envelope(ctx, { ok: false, safeMessage: pdfPolicy.safeMessage, reasonCode: pdfPolicy.reasonCode, policyDecision: pdfPolicy, status: 'blocked' });

    if (input.safePayloadJson) {
      const safetyCheck = this.safetyService.assertEnvelopeSafeForAudience(input.safePayloadJson, 'teacher');
      if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });
    }

    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'composeExportEnvelope', ctx.idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const createInput: CreateExportEnvelopeInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record: ResultReportCardExportEnvelope = {
      resultReportCardExportEnvelopeId: id,
      schoolId: ctx.schoolId,
      ...input,
      envelopeStatus: 'composed',
      safePayloadJson: input.safePayloadJson || null,
      redactionRulesJson: input.redactionRulesJson || null,
      allowedFieldNamesJson: input.allowedFieldNamesJson || null,
      blockedFieldNamesJson: input.blockedFieldNamesJson || null,
      blockedReasonCodesJson: input.blockedReasonCodesJson || null,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      createdAt: now,
      updatedAt: now,
      sealedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    await this.envelopeRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'composeExportEnvelope', ctx.idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'composeExportEnvelope', ctx.idempotencyKey, 'ResultReportCardExportEnvelope', id, 'Export envelope composed');
    await this.auditBridge.recordEnvelopeComposed(ctx, id, input.resultReportCardExportJobId, `Export envelope composed for job ${input.resultReportCardExportJobId}`);
    return this.envelope(ctx, { resourceId: id, status: 'composed', safeMessage: 'Export envelope composed successfully', reasonCode: 'ENVELOPE_COMPOSED', data: record });
  }

  async getExportEnvelope(ctx: ResultReportCardCommandContext, envelopeId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const env = await this.envelopeRepo.getById(envelopeId);
    if (!env) return this.envelope(ctx, { ok: false, safeMessage: 'Export envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: envelopeId, status: env.envelopeStatus, safeMessage: 'Export envelope found', data: env });
  }

  async listExportEnvelopesForJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const envelopes = await this.envelopeRepo.listByExportJobId(jobId);
    return this.envelope(ctx, { safeMessage: `Found ${envelopes.length} export envelopes for job`, data: envelopes });
  }

  async listExportEnvelopesForTarget(ctx: ResultReportCardCommandContext, targetId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const envelopes = await this.envelopeRepo.listByTargetId(targetId);
    return this.envelope(ctx, { safeMessage: `Found ${envelopes.length} export envelopes for target`, data: envelopes });
  }

  async sealExportEnvelope(ctx: ResultReportCardCommandContext, envelopeId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const env = await this.envelopeRepo.getById(envelopeId);
    if (!env) return this.envelope(ctx, { ok: false, safeMessage: 'Export envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (env.envelopeStatus !== 'composed') return this.envelope(ctx, { ok: false, safeMessage: 'Export envelope must be composed before sealing', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.envelopeRepo.seal(envelopeId);
    await this.auditBridge.recordEnvelopeSealed(ctx, envelopeId, env.resultReportCardExportJobId, 'Export envelope sealed');
    return this.envelope(ctx, { resourceId: envelopeId, status: 'sealed', safeMessage: 'Export envelope sealed', reasonCode: 'SEALED' });
  }

  async suppressExportEnvelope(ctx: ResultReportCardCommandContext, envelopeId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const env = await this.envelopeRepo.getById(envelopeId);
    if (!env) return this.envelope(ctx, { ok: false, safeMessage: 'Export envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (env.envelopeStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided export envelope', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.envelopeRepo.suppress(envelopeId, 'SUPPRESSED', 'Export envelope suppressed');
    return this.envelope(ctx, { resourceId: envelopeId, status: 'suppressed', safeMessage: 'Export envelope suppressed', reasonCode: 'SUPPRESSED' });
  }

  async blockExportEnvelope(ctx: ResultReportCardCommandContext, envelopeId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const env = await this.envelopeRepo.getById(envelopeId);
    if (!env) return this.envelope(ctx, { ok: false, safeMessage: 'Export envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (env.envelopeStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided export envelope', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.envelopeRepo.block(envelopeId, 'BLOCKED', 'Export envelope blocked');
    return this.envelope(ctx, { resourceId: envelopeId, status: 'blocked', safeMessage: 'Export envelope blocked', reasonCode: 'BLOCKED' });
  }

  async voidExportEnvelope(ctx: ResultReportCardCommandContext, envelopeId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const env = await this.envelopeRepo.getById(envelopeId);
    if (!env) return this.envelope(ctx, { ok: false, safeMessage: 'Export envelope not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (env.envelopeStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.envelopeRepo.void(envelopeId, 'VOIDED', 'Export envelope voided');
    return this.envelope(ctx, { resourceId: envelopeId, status: 'void', safeMessage: 'Export envelope voided', reasonCode: 'VOIDED' });
  }
}
