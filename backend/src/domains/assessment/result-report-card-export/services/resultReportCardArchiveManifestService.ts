import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../../result-report-card/contracts/resultReportCardContracts';
import type { ResultReportCardArchiveManifestRepository } from '../contracts/resultReportCardExportRepositoryContracts';
import type { CreateArchiveManifestInput, ResultReportCardArchiveManifest } from '../contracts/resultReportCardArchiveManifestContracts';
import { evaluateReportCardArchiveManifestPolicy } from '../policies/resultReportCardExportPolicyDefinitions';
import { ResultReportCardExportSafetyService } from './resultReportCardExportSafetyService';
import { ResultReportCardExportIdempotencyService } from './resultReportCardExportIdempotencyService';
import { ResultReportCardExportAuditBridge } from './resultReportCardExportAuditBridge';

export class ResultReportCardArchiveManifestService {
  constructor(
    private manifestRepo: ResultReportCardArchiveManifestRepository,
    private safetyService: ResultReportCardExportSafetyService,
    private auditBridge: ResultReportCardExportAuditBridge,
    private idempotencyService: ResultReportCardExportIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createArchiveManifest(ctx: ResultReportCardCommandContext, input: Omit<CreateArchiveManifestInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardArchiveManifestPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });

    if (input.archiveMetadataJson) {
      const safetyCheck = this.safetyService.assertArchiveManifestSafe(input.archiveMetadataJson);
      if (!safetyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: safetyCheck.safeMessage, reasonCode: safetyCheck.reasonCode, status: 'blocked' });
    }

    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'createArchiveManifest', ctx.idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const id = uuidv4();
    const now = new Date().toISOString();
    const createInput: CreateArchiveManifestInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record: ResultReportCardArchiveManifest = {
      resultReportCardArchiveManifestId: id,
      schoolId: ctx.schoolId,
      ...input,
      resultReportCardExportEnvelopeId: input.resultReportCardExportEnvelopeId || null,
      resultReportCardExportReceiptId: input.resultReportCardExportReceiptId || null,
      manifestStatus: 'generated',
      archiveMetadataJson: input.archiveMetadataJson || null,
      retentionPolicyJson: input.retentionPolicyJson || null,
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
    await this.manifestRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'createArchiveManifest', ctx.idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'createArchiveManifest', ctx.idempotencyKey, 'ResultReportCardArchiveManifest', id, 'Archive manifest created');
    await this.auditBridge.recordArchiveManifestCreated(ctx, id, input.resultReportCardExportJobId, `Archive manifest created for job ${input.resultReportCardExportJobId}`);
    return this.envelope(ctx, { resourceId: id, status: 'generated', safeMessage: 'Archive manifest created successfully', reasonCode: 'ARCHIVE_MANIFEST_CREATED', data: record });
  }

  async getArchiveManifest(ctx: ResultReportCardCommandContext, manifestId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifest = await this.manifestRepo.getById(manifestId);
    if (!manifest) return this.envelope(ctx, { ok: false, safeMessage: 'Archive manifest not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: manifestId, status: manifest.manifestStatus, safeMessage: 'Archive manifest found', data: manifest });
  }

  async listArchiveManifestsForJob(ctx: ResultReportCardCommandContext, jobId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifests = await this.manifestRepo.listByExportJobId(jobId);
    return this.envelope(ctx, { safeMessage: `Found ${manifests.length} archive manifests for job`, data: manifests });
  }

  async sealArchiveManifest(ctx: ResultReportCardCommandContext, manifestId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifest = await this.manifestRepo.getById(manifestId);
    if (!manifest) return this.envelope(ctx, { ok: false, safeMessage: 'Archive manifest not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (manifest.manifestStatus !== 'generated') return this.envelope(ctx, { ok: false, safeMessage: 'Archive manifest must be in generated status to seal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.manifestRepo.seal(manifestId);
    await this.auditBridge.recordArchiveManifestSealed(ctx, manifestId, manifest.resultReportCardExportJobId, 'Archive manifest sealed');
    return this.envelope(ctx, { resourceId: manifestId, status: 'sealed', safeMessage: 'Archive manifest sealed', reasonCode: 'SEALED' });
  }

  async blockArchiveManifest(ctx: ResultReportCardCommandContext, manifestId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifest = await this.manifestRepo.getById(manifestId);
    if (!manifest) return this.envelope(ctx, { ok: false, safeMessage: 'Archive manifest not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (manifest.manifestStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided archive manifest', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.manifestRepo.block(manifestId, 'BLOCKED', 'Archive manifest blocked');
    return this.envelope(ctx, { resourceId: manifestId, status: 'blocked', safeMessage: 'Archive manifest blocked', reasonCode: 'BLOCKED' });
  }

  async voidArchiveManifest(ctx: ResultReportCardCommandContext, manifestId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifest = await this.manifestRepo.getById(manifestId);
    if (!manifest) return this.envelope(ctx, { ok: false, safeMessage: 'Archive manifest not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (manifest.manifestStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.manifestRepo.void(manifestId, 'VOIDED', 'Archive manifest voided');
    return this.envelope(ctx, { resourceId: manifestId, status: 'void', safeMessage: 'Archive manifest voided', reasonCode: 'VOIDED' });
  }
}
