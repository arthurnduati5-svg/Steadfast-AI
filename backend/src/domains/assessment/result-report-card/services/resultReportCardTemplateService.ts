import type {
  ResultReportCardSafeEnvelope,
  ResultReportCardCommandContext,
} from '../contracts/resultReportCardContracts';
import type { ResultReportCardTemplate, CreateReportCardTemplateInput, ResultReportCardTemplateVersion, CreateReportCardTemplateVersionInput } from '../contracts/resultReportCardTemplateContracts';
import type { ResultReportCardTemplateRepository, ResultReportCardTemplateVersionRepository } from '../contracts/resultReportCardRepositoryContracts';
import type { ResultReportCardAuditBridge } from './resultReportCardAuditBridge';
import type { ResultReportCardIdempotencyService } from './resultReportCardIdempotencyService';
import { evaluateReportCardTemplateManagementPolicy } from '../policies/resultReportCardPolicyDefinitions';

export class ResultReportCardTemplateService {
  constructor(
    private templateRepo: ResultReportCardTemplateRepository,
    private templateVersionRepo: ResultReportCardTemplateVersionRepository,
    private auditBridge: ResultReportCardAuditBridge,
    private idempotencyService: ResultReportCardIdempotencyService,
  ) {}

  private envelope(
    ctx: ResultReportCardCommandContext,
    overrides: Partial<ResultReportCardSafeEnvelope>,
  ): ResultReportCardSafeEnvelope {
    return {
      ok: true,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
      nextAllowedActions: [],
      ...overrides,
    };
  }

  async createTemplate(
    ctx: ResultReportCardCommandContext,
    input: CreateReportCardTemplateInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardTemplateManagementPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const existingOp = await this.idempotencyService.detectConflict(ctx, 'createTemplate');
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx, 'createTemplate');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const template = await this.templateRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordTemplateCreated(ctx, template);
      await this.idempotencyService.completeOperation(startIdem, template.resultReportCardTemplateId, 'Template created');
      return this.envelope(ctx, {
        resourceId: template.resultReportCardTemplateId,
        resourceVersion: template.createdAt,
        status: template.templateStatus,
        safeMessage: 'Report card template created successfully',
        data: template,
        nextAllowedActions: ['createTemplateVersion', 'activateTemplate'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create template', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getTemplate(ctx: ResultReportCardCommandContext, templateId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const template = await this.templateRepo.getById(templateId);
    if (!template) return this.envelope(ctx, { ok: false, safeMessage: 'Template not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (template.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    return this.envelope(ctx, { resourceId: template.resultReportCardTemplateId, status: template.templateStatus, safeMessage: 'Template found', data: template });
  }

  async listTemplatesForSchool(ctx: ResultReportCardCommandContext): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const templates = await this.templateRepo.listBySchool(ctx.schoolId);
    return this.envelope(ctx, { safeMessage: `Found ${templates.length} templates`, data: templates });
  }

  async activateTemplate(ctx: ResultReportCardCommandContext, templateId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardTemplateManagementPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const template = await this.templateRepo.getById(templateId);
    if (!template) return this.envelope(ctx, { ok: false, safeMessage: 'Template not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (template.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (template.templateStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Template already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.templateRepo.updateStatus(templateId, 'active');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT', reasonCode: 'ACTIVATED', safeSummary: 'Template activated' });
    return this.envelope(ctx, { resourceId: templateId, status: 'active', safeMessage: 'Template activated' });
  }

  async disableTemplate(ctx: ResultReportCardCommandContext, templateId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardTemplateManagementPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const template = await this.templateRepo.getById(templateId);
    if (!template) return this.envelope(ctx, { ok: false, safeMessage: 'Template not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (template.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (template.templateStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Template already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.templateRepo.updateStatus(templateId, 'disabled');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT', reasonCode: 'DISABLED', safeSummary: 'Template disabled' });
    return this.envelope(ctx, { resourceId: templateId, status: 'disabled', safeMessage: 'Template disabled' });
  }

  async voidTemplate(ctx: ResultReportCardCommandContext, templateId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardTemplateManagementPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const template = await this.templateRepo.getById(templateId);
    if (!template) return this.envelope(ctx, { ok: false, safeMessage: 'Template not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (template.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (template.templateStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Template already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.templateRepo.updateStatus(templateId, 'void');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT', reasonCode: 'VOIDED', safeSummary: 'Template voided' });
    return this.envelope(ctx, { resourceId: templateId, status: 'void', safeMessage: 'Template voided' });
  }

  async createTemplateVersion(
    ctx: ResultReportCardCommandContext,
    templateId: string,
    input: CreateReportCardTemplateVersionInput,
  ): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardTemplateManagementPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const template = await this.templateRepo.getById(templateId);
    if (!template) return this.envelope(ctx, { ok: false, safeMessage: 'Template not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (template.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });

    const existingOp = await this.idempotencyService.detectConflict(ctx, 'createTemplateVersion');
    if (existingOp) return this.envelope(ctx, { ok: false, safeMessage: 'Idempotency conflict detected', reasonCode: 'IDEMPOTENCY_CONFLICT', status: 'conflict' });

    const startIdem = await this.idempotencyService.startOperation(ctx, 'createTemplateVersion');
    if (!startIdem) return this.envelope(ctx, { ok: false, safeMessage: 'Could not start idempotency operation', reasonCode: 'IDEMPOTENCY_FAILED', status: 'error' });

    try {
      const version = await this.templateVersionRepo.create({
        ...input,
        schoolId: ctx.schoolId,
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
      });
      await this.auditBridge.recordTemplateVersionCreated(ctx, version);
      await this.idempotencyService.completeOperation(startIdem, version.resultReportCardTemplateVersionId, 'Template version created');
      return this.envelope(ctx, {
        resourceId: version.resultReportCardTemplateVersionId,
        resourceVersion: version.createdAt,
        status: version.versionStatus,
        safeMessage: 'Template version created successfully',
        data: version,
        nextAllowedActions: ['activateTemplateVersion'],
      });
    } catch (err) {
      await this.idempotencyService.failOperation(startIdem, String(err));
      return this.envelope(ctx, { ok: false, safeMessage: 'Failed to create template version', reasonCode: 'CREATE_FAILED', status: 'error' });
    }
  }

  async getTemplateVersion(ctx: ResultReportCardCommandContext, versionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const version = await this.templateVersionRepo.getById(versionId);
    if (!version) return this.envelope(ctx, { ok: false, safeMessage: 'Template version not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (version.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    return this.envelope(ctx, { resourceId: version.resultReportCardTemplateVersionId, status: version.versionStatus, safeMessage: 'Template version found', data: version });
  }

  async listTemplateVersions(ctx: ResultReportCardCommandContext, templateId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });
    const versions = await this.templateVersionRepo.listByTemplateId(templateId);
    return this.envelope(ctx, { safeMessage: `Found ${versions.length} template versions`, data: versions });
  }

  async activateTemplateVersion(ctx: ResultReportCardCommandContext, versionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardTemplateManagementPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const version = await this.templateVersionRepo.getById(versionId);
    if (!version) return this.envelope(ctx, { ok: false, safeMessage: 'Template version not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (version.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (version.versionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Version already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.templateVersionRepo.updateStatus(versionId, 'active');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT', reasonCode: 'VERSION_ACTIVATED', safeSummary: 'Template version activated' });
    return this.envelope(ctx, { resourceId: versionId, status: 'active', safeMessage: 'Template version activated' });
  }

  async retireTemplateVersion(ctx: ResultReportCardCommandContext, versionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardTemplateManagementPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const version = await this.templateVersionRepo.getById(versionId);
    if (!version) return this.envelope(ctx, { ok: false, safeMessage: 'Template version not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (version.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (version.versionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Version already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.templateVersionRepo.updateStatus(versionId, 'retired');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT', reasonCode: 'VERSION_RETIRED', safeSummary: 'Template version retired' });
    return this.envelope(ctx, { resourceId: versionId, status: 'retired', safeMessage: 'Template version retired' });
  }

  async voidTemplateVersion(ctx: ResultReportCardCommandContext, versionId: string): Promise<ResultReportCardSafeEnvelope> {
    if (!ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'SCHOOL_CONTEXT_REQUIRED', reasonCode: 'SCHOOL_CONTEXT_REQUIRED', status: 'error' });

    const policyCheck = evaluateReportCardTemplateManagementPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policyCheck.allowed) {
      await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: policyCheck.policyFamily, reasonCode: policyCheck.reasonCode, safeSummary: policyCheck.safeMessage });
      return this.envelope(ctx, { ok: false, safeMessage: policyCheck.safeMessage, reasonCode: policyCheck.reasonCode, policyDecision: policyCheck, status: 'blocked' });
    }

    const version = await this.templateVersionRepo.getById(versionId);
    if (!version) return this.envelope(ctx, { ok: false, safeMessage: 'Template version not found', reasonCode: 'NOT_FOUND', status: 'not_found' });
    if (version.schoolId !== ctx.schoolId) return this.envelope(ctx, { ok: false, safeMessage: 'School mismatch', reasonCode: 'SCHOOL_MISMATCH', status: 'error' });
    if (version.versionStatus === 'void') return this.envelope(ctx, { ok: false, safeMessage: 'Version already voided', reasonCode: 'INVALID_STATUS', status: 'error' });

    await this.templateVersionRepo.updateStatus(versionId, 'void');
    await this.auditBridge.recordPolicyBlocked(ctx, { policyFamily: 'RESULT_REPORT_CARD_TEMPLATE_MANAGEMENT', reasonCode: 'VERSION_VOIDED', safeSummary: 'Template version voided' });
    return this.envelope(ctx, { resourceId: versionId, status: 'void', safeMessage: 'Template version voided' });
  }
}
