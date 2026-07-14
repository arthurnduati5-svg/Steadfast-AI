import { describe, it, expect, beforeEach } from 'vitest';
import { ResultReportCardTemplateService } from '../services/resultReportCardTemplateService';
import { ResultReportCardAuditBridge } from '../services/resultReportCardAuditBridge';
import { ResultReportCardIdempotencyService } from '../services/resultReportCardIdempotencyService';
import {
  InMemoryResultReportCardTemplateRepository,
  InMemoryResultReportCardTemplateVersionRepository,
  InMemoryResultReportCardAuditRepository,
  InMemoryResultReportCardIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardRepositories';
import type { ResultReportCardCommandContext } from '../contracts/resultReportCardContracts';
import { FORBIDDEN_REPORT_CARD_FIELDS } from '../contracts/resultReportCardContracts';

function makeCtx(overrides?: Partial<ResultReportCardCommandContext>): ResultReportCardCommandContext {
  return {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'teacher',
    correlationId: 'corr-1',
    idempotencyKey: `idem-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...overrides,
  };
}

describe('Package 13 — Template Versioning', () => {
  let templateRepo: InMemoryResultReportCardTemplateRepository;
  let templateVersionRepo: InMemoryResultReportCardTemplateVersionRepository;
  let auditRepo: InMemoryResultReportCardAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardIdempotencyRepository;
  let auditBridge: ResultReportCardAuditBridge;
  let idempotencyService: ResultReportCardIdempotencyService;
  let templateService: ResultReportCardTemplateService;

  beforeEach(() => {
    templateRepo = new InMemoryResultReportCardTemplateRepository();
    templateVersionRepo = new InMemoryResultReportCardTemplateVersionRepository();
    auditRepo = new InMemoryResultReportCardAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardIdempotencyRepository();
    auditBridge = new ResultReportCardAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardIdempotencyService(idempotencyRepo);
    templateService = new ResultReportCardTemplateService(
      templateRepo, templateVersionRepo, auditBridge, idempotencyService,
    );
  });

  it('Template can be created', async () => {
    const ctx = makeCtx();
    const result = await templateService.createTemplate(ctx, {
      templateKey: 'term1-report',
      templateName: 'Term 1 Report Card',
      templateAudience: 'student',
      templatePurpose: 'End of term student report',
      safeTemplateSummary: 'Term 1 summary for students',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('Template version can be created', async () => {
    const ctx = makeCtx();
    const template = await templateService.createTemplate(ctx, {
      templateKey: 'term1-report',
      templateName: 'Term 1 Report Card',
      templateAudience: 'student',
      templatePurpose: 'End of term student report',
      safeTemplateSummary: 'Term 1 summary for students',
    });
    const templateId = template.resourceId!;

    const result = await templateService.createTemplateVersion(ctx, templateId, {
      resultReportCardTemplateId: templateId,
      templateVersion: '1.0',
      layoutMode: 'exam_result_summary',
      safeVersionSummary: 'Initial version',
    });
    expect(result.ok).toBe(true);
    expect(result.status).toBe('draft');
    expect(result.resourceId).toBeTruthy();
  });

  it('Template can be activated', async () => {
    const ctx = makeCtx();
    const template = await templateService.createTemplate(ctx, {
      templateKey: 'term1-report',
      templateName: 'Term 1 Report Card',
      templateAudience: 'student',
      templatePurpose: 'End of term student report',
      safeTemplateSummary: 'Term 1 summary for students',
    });
    const templateId = template.resourceId!;

    const result = await templateService.activateTemplate(ctx, templateId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('active');
  });

  it('Template can be disabled', async () => {
    const ctx = makeCtx();
    const template = await templateService.createTemplate(ctx, {
      templateKey: 'term1-report',
      templateName: 'Term 1 Report Card',
      templateAudience: 'student',
      templatePurpose: 'End of term student report',
      safeTemplateSummary: 'Term 1 summary for students',
    });
    const templateId = template.resourceId!;

    const result = await templateService.disableTemplate(ctx, templateId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('disabled');
  });

  it('Template can be voided', async () => {
    const ctx = makeCtx();
    const template = await templateService.createTemplate(ctx, {
      templateKey: 'term1-report',
      templateName: 'Term 1 Report Card',
      templateAudience: 'student',
      templatePurpose: 'End of term student report',
      safeTemplateSummary: 'Term 1 summary for students',
    });
    const templateId = template.resourceId!;

    const result = await templateService.voidTemplate(ctx, templateId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('Template version can be activated', async () => {
    const ctx = makeCtx();
    const template = await templateService.createTemplate(ctx, {
      templateKey: 'term1-report',
      templateName: 'Term 1 Report Card',
      templateAudience: 'student',
      templatePurpose: 'End of term student report',
      safeTemplateSummary: 'Term 1 summary for students',
    });
    const templateId = template.resourceId!;
    const version = await templateService.createTemplateVersion(ctx, templateId, {
      resultReportCardTemplateId: templateId,
      templateVersion: '1.0',
      layoutMode: 'exam_result_summary',
      safeVersionSummary: 'Initial version',
    });
    const versionId = version.resourceId!;

    const result = await templateService.activateTemplateVersion(ctx, versionId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('active');
  });

  it('Template version can be retired', async () => {
    const ctx = makeCtx();
    const template = await templateService.createTemplate(ctx, {
      templateKey: 'term1-report',
      templateName: 'Term 1 Report Card',
      templateAudience: 'student',
      templatePurpose: 'End of term student report',
      safeTemplateSummary: 'Term 1 summary for students',
    });
    const templateId = template.resourceId!;
    const version = await templateService.createTemplateVersion(ctx, templateId, {
      resultReportCardTemplateId: templateId,
      templateVersion: '1.0',
      layoutMode: 'exam_result_summary',
      safeVersionSummary: 'Initial version',
    });
    const versionId = version.resourceId!;

    const result = await templateService.retireTemplateVersion(ctx, versionId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('retired');
  });

  it('Template version can be voided', async () => {
    const ctx = makeCtx();
    const template = await templateService.createTemplate(ctx, {
      templateKey: 'term1-report',
      templateName: 'Term 1 Report Card',
      templateAudience: 'student',
      templatePurpose: 'End of term student report',
      safeTemplateSummary: 'Term 1 summary for students',
    });
    const templateId = template.resourceId!;
    const version = await templateService.createTemplateVersion(ctx, templateId, {
      resultReportCardTemplateId: templateId,
      templateVersion: '1.0',
      layoutMode: 'exam_result_summary',
      safeVersionSummary: 'Initial version',
    });
    const versionId = version.resourceId!;

    const result = await templateService.voidTemplateVersion(ctx, versionId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('Template stores structure only (no student result data fields)', async () => {
    const ctx = makeCtx();
    const result = await templateService.createTemplate(ctx, {
      templateKey: 'structure-only',
      templateName: 'Structure Only',
      templateAudience: 'student',
      templatePurpose: 'Test',
      safeTemplateSummary: 'Structure only test',
    });
    expect(result.ok).toBe(true);
    expect(result.data).toBeTruthy();
    const tpl = result.data as Record<string, unknown>;
    expect(tpl).not.toHaveProperty('studentRef');
    expect(tpl).not.toHaveProperty('paperId');
    expect(tpl).not.toHaveProperty('score');
    expect(tpl).not.toHaveProperty('grade');
  });

  it('Template version stores structure only', async () => {
    const ctx = makeCtx();
    const template = await templateService.createTemplate(ctx, {
      templateKey: 'struct-ver',
      templateName: 'Struct Version',
      templateAudience: 'student',
      templatePurpose: 'Test',
      safeTemplateSummary: 'Structure version test',
    });
    const templateId = template.resourceId!;
    const result = await templateService.createTemplateVersion(ctx, templateId, {
      resultReportCardTemplateId: templateId,
      templateVersion: '1.0',
      layoutMode: 'exam_result_summary',
      safeVersionSummary: 'Structure only version',
    });
    expect(result.ok).toBe(true);
    const ver = result.data as Record<string, unknown>;
    expect(ver).not.toHaveProperty('studentRef');
    expect(ver).not.toHaveProperty('score');
    expect(ver).not.toHaveProperty('grade');
    expect(ver).not.toHaveProperty('pdfBinary');
  });

  it('Template cannot store student result data (try to set a forbidden field, assert safe)', () => {
    const forbidden = FORBIDDEN_REPORT_CARD_FIELDS;
    const templateRecord: Record<string, unknown> = {
      resultReportCardTemplateId: 'tpl-1',
      templateKey: 'test',
      templateName: 'Test',
      templateStatus: 'draft',
    };
    for (const field of forbidden) {
      expect(templateRecord).not.toHaveProperty(field);
    }
    templateRecord['pdfBinary'] = 'base64data';
    const tplKeys = Object.keys(templateRecord);
    const foundForbidden = tplKeys.filter(k => forbidden.includes(k));
    expect(foundForbidden).toContain('pdfBinary');
  });

  it('Template cannot store PDF binary', async () => {
    const ctx = makeCtx();
    const result = await templateService.createTemplate(ctx, {
      templateKey: 'no-pdf',
      templateName: 'No PDF',
      templateAudience: 'student',
      templatePurpose: 'Test',
      safeTemplateSummary: 'No PDF binary allowed',
    });
    expect(result.ok).toBe(true);
    expect(result.data).toBeTruthy();
    const tpl = result.data as Record<string, unknown>;
    expect(tpl).not.toHaveProperty('pdfBinary');
    expect(tpl).not.toHaveProperty('pdfBuffer');
    expect(tpl).not.toHaveProperty('pdfBase64');
  });

  it('Template cannot store provider payload', async () => {
    const ctx = makeCtx();
    const result = await templateService.createTemplate(ctx, {
      templateKey: 'no-provider',
      templateName: 'No Provider',
      templateAudience: 'student',
      templatePurpose: 'Test',
      safeTemplateSummary: 'No provider payload',
    });
    expect(result.ok).toBe(true);
    const tpl = result.data as Record<string, unknown>;
    expect(tpl).not.toHaveProperty('liveProviderPayload');
    expect(tpl).not.toHaveProperty('providerSecret');
  });
});
