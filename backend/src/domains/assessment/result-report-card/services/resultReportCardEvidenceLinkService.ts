import type {
  ResultReportCardSafeEnvelope,
  ResultReportCardCommandContext,
  ResultReportCardSourcePackage,
  ResultReportCardAudienceType,
} from '../contracts';
import type { ResultReportCardEvidenceLink, CreateEvidenceLinkInput } from '../contracts/resultReportCardEvidenceContracts';
import type { ResultReportCardEvidenceLinkRepository } from '../contracts/resultReportCardRepositoryContracts';
import type { ResultReportCardAuditBridge } from './resultReportCardAuditBridge';
import type { ResultReportCardSafetyService } from './resultReportCardSafetyService';
import type { ResultReportCardIdempotencyService } from './resultReportCardIdempotencyService';
import { evaluateReportCardEvidenceLinkingPolicy } from '../policies/resultReportCardPolicyDefinitions';

const ALLOWED_SOURCE_PACKAGES: string[] = [
  'package_5_marking', 'package_9_result_governance',
  'package_10_learning_evidence', 'package_11_result_release', 'package_12_result_delivery',
];

export class ResultReportCardEvidenceLinkService {
  constructor(
    private evidenceRepo: ResultReportCardEvidenceLinkRepository,
    private safetyService: ResultReportCardSafetyService,
    private auditBridge: ResultReportCardAuditBridge,
    private idempotencyService: ResultReportCardIdempotencyService,
  ) {}

  private envelope(ctx: ResultReportCardCommandContext, overrides: Partial<ResultReportCardSafeEnvelope>): ResultReportCardSafeEnvelope {
    return { ok: true, requestId: ctx.correlationId, correlationId: ctx.correlationId, nextAllowedActions: [], ...overrides };
  }

  async createEvidenceLink(
    ctx: ResultReportCardCommandContext,
    input: Omit<CreateEvidenceLinkInput, 'schoolId' | 'createdByActorId' | 'createdByRole'>,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const policyCheck = evaluateReportCardEvidenceLinkingPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });

    const sourceCheck = this.assertEvidenceSourceAllowed(input.sourcePackage, input.evidenceUse);
    if (!sourceCheck.allowed) return this.envelope(ctx, { ok: false, safeMessage: sourceCheck.safeMessage, reasonCode: sourceCheck.reasonCode, status: 'blocked' });

    const existingOp = await this.idempotencyService.detectConflict(ctx, 'createEvidenceLink');
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx, 'createEvidenceLink');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency start failed', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    const createInput: CreateEvidenceLinkInput & { schoolId: string; createdByActorId: string; createdByRole: string } = {
      ...input,
      schoolId: ctx.schoolId,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    };

    try {
      const link = await this.evidenceRepo.create(createInput);
      await this.auditBridge.recordEvidenceLinked(ctx, link);
      await this.idempotencyService.completeOperation(startIdem, link.resultReportCardEvidenceLinkId, 'Evidence link created');
      return this.envelope(ctx, { resourceId: link.resultReportCardEvidenceLinkId, status: link.evidenceStatus, safeMessage: 'Evidence link created', data: link });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create evidence link', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getEvidenceLink(ctx: ResultReportCardCommandContext, linkId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const link = await this.evidenceRepo.getById(linkId);
    if (!link) return this.envelope(ctx, { ok: false, safeMessage: 'Evidence link not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    return this.envelope(ctx, { resourceId: linkId, status: link.evidenceStatus, safeMessage: 'Evidence link found', data: link });
  }

  async listEvidenceLinksForAssembly(ctx: ResultReportCardCommandContext, assemblyId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const links = await this.evidenceRepo.listByAssemblyId(assemblyId);
    return this.envelope(ctx, { safeMessage: `Found ${links.length} evidence links for assembly`, data: links });
  }

  async listEvidenceLinksForSection(ctx: ResultReportCardCommandContext, sectionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const links = await this.evidenceRepo.listBySectionId(sectionId);
    return this.envelope(ctx, { safeMessage: `Found ${links.length} evidence links for section`, data: links });
  }

  async blockEvidenceLink(ctx: ResultReportCardCommandContext, linkId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const link = await this.evidenceRepo.getById(linkId);
    if (!link) return this.envelope(ctx, { ok: false, safeMessage: 'Evidence link not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (link.evidenceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Cannot block voided evidence link', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.evidenceRepo.updateStatus(linkId, 'blocked');
    return this.envelope(ctx, { resourceId: linkId, status: 'blocked', safeMessage: 'Evidence link blocked' });
  }

  async voidEvidenceLink(ctx: ResultReportCardCommandContext, linkId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const link = await this.evidenceRepo.getById(linkId);
    if (!link) return this.envelope(ctx, { ok: false, safeMessage: 'Evidence link not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (link.evidenceStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Already voided', reasonCode: 'INVALID_STATUS', status: 'error' });
    await this.evidenceRepo.updateStatus(linkId, 'void');
    return this.envelope(ctx, { resourceId: linkId, status: 'void', safeMessage: 'Evidence link voided' });
  }

  assertEvidenceSourceAllowed(sourcePackage: string, audienceType: string): { allowed: boolean; safeMessage: string; reasonCode: string } {
    if (!ALLOWED_SOURCE_PACKAGES.includes(sourcePackage)) {
      return { allowed: false, safeMessage: `Unknown evidence source package: ${sourcePackage}`, reasonCode: 'UNKNOWN_SOURCE_PACKAGE' };
    }
    return { allowed: true, safeMessage: 'Evidence source package allowed', reasonCode: 'SOURCE_ALLOWED' };
  }
}
