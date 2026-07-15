import { v4 as uuidv4 } from 'uuid';
import type { ResultReportCardPortalPreviewRepository } from '../contracts/resultReportCardAccessRepositoryContracts';
import type { ResultReportCardAccessCommandContext, ResultReportCardAccessSafeEnvelope } from '../contracts/resultReportCardAccessContracts';
import type { CreatePortalPreviewInput } from '../contracts/resultReportCardPortalPreviewContracts';
import { evaluateReportCardPortalPreviewCompositionPolicy, evaluateReportCardAccessNoLivePortalPolicy } from '../policies/resultReportCardAccessPolicyDefinitions';
import { ResultReportCardAccessIdempotencyService } from './resultReportCardAccessIdempotencyService';
import { ResultReportCardAccessAuditBridge } from './resultReportCardAccessAuditBridge';

export class ResultReportCardPortalPreviewService {
  constructor(
    private previewRepo: ResultReportCardPortalPreviewRepository,
    private auditBridge: ResultReportCardAccessAuditBridge,
    private idempotencyService: ResultReportCardAccessIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardAccessCommandContext, overrides: Partial<ResultReportCardAccessSafeEnvelope>): ResultReportCardAccessSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async composePortalPreview(ctx: ResultReportCardAccessCommandContext, input: Omit<CreatePortalPreviewInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policy = evaluateReportCardPortalPreviewCompositionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return this.envelope(ctx, { ok: false, safeMessage: policy.safeMessage, reasonCode: policy.reasonCode, policyDecision: policy, status: 'blocked' });
    const livePolicy = evaluateReportCardAccessNoLivePortalPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!livePolicy.allowed && input.previewMode !== 'mock_portal_preview_only' && input.previewMode !== 'teacher_review_preview' && input.previewMode !== 'admin_preview' && input.previewMode !== 'metadata_only') {
      return this.envelope(ctx, { ok: false, safeMessage: livePolicy.safeMessage, reasonCode: livePolicy.reasonCode, policyDecision: livePolicy, status: 'blocked' });
    }

    const idempotencyKey = ctx.idempotencyKey || uuidv4();
    const conflict = await this.idempotencyService.detectConflict(ctx.schoolId, 'composePortalPreview', idempotencyKey);
    if (conflict.conflict) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const createInput: CreatePortalPreviewInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };
    const record = await this.previewRepo.create(createInput);
    await this.idempotencyService.startOperation(ctx.schoolId, 'composePortalPreview', idempotencyKey);
    await this.idempotencyService.completeOperation(ctx.schoolId, 'composePortalPreview', idempotencyKey, 'ResultReportCardPortalPreview', record.resultReportCardPortalPreviewId, 'Portal preview composed');
    await this.auditBridge.recordPortalPreviewComposed(ctx, record.resultReportCardPortalPreviewId, `Portal preview composed for grant ${input.resultReportCardAccessGrantId}`);
    return this.envelope(ctx, { resourceId: record.resultReportCardPortalPreviewId, status: record.previewStatus, safeMessage: 'Portal preview composed successfully', reasonCode: 'PORTAL_PREVIEW_COMPOSED', data: record });
  }

  async getPortalPreview(ctx: ResultReportCardAccessCommandContext, portalPreviewId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const preview = await this.previewRepo.getById(portalPreviewId);
    if (!preview) return this.envelope(ctx, { ok: false, safeMessage: 'Portal preview not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: portalPreviewId, status: preview.previewStatus, safeMessage: 'Portal preview found', data: preview });
  }

  async listPortalPreviewsForGrant(ctx: ResultReportCardAccessCommandContext, accessGrantId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const previews = await this.previewRepo.listByAccessGrantId(accessGrantId);
    return this.envelope(ctx, { safeMessage: `Found ${previews.length} portal previews for grant`, data: previews });
  }

  async listPortalPreviewsForRecipient(ctx: ResultReportCardAccessCommandContext, recipientId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const previews = await this.previewRepo.listByRecipientId(recipientId);
    return this.envelope(ctx, { safeMessage: `Found ${previews.length} portal previews for recipient`, data: previews });
  }

  async sealPortalPreview(ctx: ResultReportCardAccessCommandContext, portalPreviewId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const preview = await this.previewRepo.getById(portalPreviewId);
    if (!preview) return this.envelope(ctx, { ok: false, safeMessage: 'Portal preview not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (preview.previewStatus !== 'composed') return this.envelope(ctx, { ok: false, safeMessage: 'Portal preview must be composed status to seal', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.previewRepo.seal(portalPreviewId);
    await this.auditBridge.recordPortalPreviewSealed(ctx, portalPreviewId, 'Portal preview sealed');
    return this.envelope(ctx, { resourceId: portalPreviewId, status: 'sealed', safeMessage: 'Portal preview sealed', reasonCode: 'SEALED' });
  }

  async suppressPortalPreview(ctx: ResultReportCardAccessCommandContext, portalPreviewId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const preview = await this.previewRepo.getById(portalPreviewId);
    if (!preview) return this.envelope(ctx, { ok: false, safeMessage: 'Portal preview not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (preview.previewStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot suppress voided portal preview', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.previewRepo.suppress(portalPreviewId, 'SUPPRESSED', 'Portal preview suppressed');
    return this.envelope(ctx, { resourceId: portalPreviewId, status: 'suppressed', safeMessage: 'Portal preview suppressed', reasonCode: 'SUPPRESSED' });
  }

  async blockPortalPreview(ctx: ResultReportCardAccessCommandContext, portalPreviewId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const preview = await this.previewRepo.getById(portalPreviewId);
    if (!preview) return this.envelope(ctx, { ok: false, safeMessage: 'Portal preview not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (preview.previewStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided portal preview', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.previewRepo.block(portalPreviewId, 'BLOCKED', 'Portal preview blocked');
    return this.envelope(ctx, { resourceId: portalPreviewId, status: 'blocked', safeMessage: 'Portal preview blocked', reasonCode: 'BLOCKED' });
  }

  async voidPortalPreview(ctx: ResultReportCardAccessCommandContext, portalPreviewId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const preview = await this.previewRepo.getById(portalPreviewId);
    if (!preview) return this.envelope(ctx, { ok: false, safeMessage: 'Portal preview not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (preview.previewStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.previewRepo.void(portalPreviewId, 'VOIDED', 'Portal preview voided');
    return this.envelope(ctx, { resourceId: portalPreviewId, status: 'void', safeMessage: 'Portal preview voided', reasonCode: 'VOIDED' });
  }

  async assertPreviewIsMockOnly(ctx: ResultReportCardAccessCommandContext, portalPreviewId: string): Promise<ResultReportCardAccessSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const preview = await this.previewRepo.getById(portalPreviewId);
    if (!preview) return this.envelope(ctx, { ok: false, safeMessage: 'Portal preview not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (preview.previewMode !== 'mock_portal_preview_only') {
      return this.envelope(ctx, { ok: false, safeMessage: 'Preview is not mock-only mode', reasonCode: 'NOT_MOCK_ONLY', status: 'blocked' });
    }
    return this.envelope(ctx, { resourceId: portalPreviewId, safeMessage: 'Preview is mock-only', reasonCode: 'MOCK_ONLY_OK' });
  }
}
