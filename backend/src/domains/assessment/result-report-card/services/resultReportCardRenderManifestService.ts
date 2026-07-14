import type {
  ResultReportCardSafeEnvelope,
  ResultReportCardCommandContext,
} from '../contracts';
import type { ResultReportCardRenderManifest, CreateRenderManifestInput } from '../contracts/resultReportCardRenderContracts';
import type { ResultReportCardRenderManifestRepository, ResultReportCardTemplateVersionRepository } from '../contracts/resultReportCardRepositoryContracts';
import type { ResultReportCardAuditBridge } from './resultReportCardAuditBridge';
import type { ResultReportCardIdempotencyService } from './resultReportCardIdempotencyService';
import { evaluateReportCardRenderManifestPolicy } from '../policies/resultReportCardPolicyDefinitions';

export class ResultReportCardRenderManifestService {
  constructor(
    private manifestRepo: ResultReportCardRenderManifestRepository,
    private templateVersionRepo: ResultReportCardTemplateVersionRepository,
    private auditBridge: ResultReportCardAuditBridge,
    private idempotencyService: ResultReportCardIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createRenderManifest(
    ctx: ResultReportCardCommandContext,
    input: Omit<CreateRenderManifestInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateReportCardRenderManifestPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx, 'createRenderManifest');
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx, 'createRenderManifest');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateRenderManifestInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const manifest = await this.manifestRepo.create(createInput);
      await this.auditBridge.recordRenderManifestCreated(ctx, manifest);
      await this.idempotencyService.completeOperation(startIdem, manifest.resultReportCardRenderManifestId, 'Render manifest created');
      return this.envelope(ctx, { resourceId: manifest.resultReportCardRenderManifestId, status: manifest.manifestStatus, safeMessage: 'Render manifest created', data: manifest });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create render manifest', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getRenderManifest(ctx: ResultReportCardCommandContext, manifestId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifest = await this.manifestRepo.getById(manifestId);
    if (!manifest) return this.envelope(ctx, { ok: false, safeMessage: 'Render manifest not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: manifestId, status: manifest.manifestStatus, safeMessage: 'Render manifest found', data: manifest });
  }

  async listRenderManifestsForAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifests = await this.manifestRepo.listByAssemblyId(assemblyId);
    return this.envelope(ctx, { safeMessage: `Found ${manifests.length} render manifests for assembly`, data: manifests });
  }

  async sealRenderManifest(ctx: ResultReportCardCommandContext, manifestId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifest = await this.manifestRepo.getById(manifestId);
    if (!manifest) return this.envelope(ctx, { ok: false, safeMessage: 'Render manifest not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (manifest.manifestStatus === 'void' || manifest.manifestStatus === 'sealed') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot seal manifest in current status', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.manifestRepo.updateStatus(manifestId, 'sealed');
    await this.auditBridge.recordRenderManifestSealed(ctx, manifest);
    return this.envelope(ctx, { resourceId: manifestId, status: 'sealed', safeMessage: 'Render manifest sealed' });
  }

  async blockRenderManifest(ctx: ResultReportCardCommandContext, manifestId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifest = await this.manifestRepo.getById(manifestId);
    if (!manifest) return this.envelope(ctx, { ok: false, safeMessage: 'Render manifest not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (manifest.manifestStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided manifest', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.manifestRepo.updateStatus(manifestId, 'blocked');
    return this.envelope(ctx, { resourceId: manifestId, status: 'blocked', safeMessage: 'Render manifest blocked' });
  }

  async voidRenderManifest(ctx: ResultReportCardCommandContext, manifestId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const manifest = await this.manifestRepo.getById(manifestId);
    if (!manifest) return this.envelope(ctx, { ok: false, safeMessage: 'Render manifest not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (manifest.manifestStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.manifestRepo.updateStatus(manifestId, 'void');
    return this.envelope(ctx, { resourceId: manifestId, status: 'void', safeMessage: 'Render manifest voided' });
  }

  assertManifestHasNoBinaryPayload(manifest: ResultReportCardRenderManifest): { allowed: boolean; safeMessage: string; reasonCode: string } {
    const payload = manifest.layoutJson as Record<string, unknown> | null;
    if (payload && (payload['pdfBinary'] || payload['pdfBuffer'] || payload['pdfBase64'])) {
      return { allowed: false, safeMessage: 'Render manifest contains binary payload', reasonCode: 'BINARY_PAYLOAD_DETECTED' };
    }
    return { allowed: true, safeMessage: 'Render manifest has no binary payload', reasonCode: 'NO_BINARY_PAYLOAD' };
  }
}
