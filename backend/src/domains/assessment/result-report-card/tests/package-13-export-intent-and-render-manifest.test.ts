import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryResultReportCardExportIntentRepository,
  InMemoryResultReportCardReviewRepository,
  InMemoryResultReportCardAssemblyRepository,
  InMemoryResultReportCardRenderManifestRepository,
  InMemoryResultReportCardTemplateVersionRepository,
  InMemoryResultReportCardAuditRepository,
  InMemoryResultReportCardIdempotencyRepository,
} from '../repositories/inMemoryResultReportCardRepositories';
import { ResultReportCardExportIntentService } from '../services/resultReportCardExportIntentService';
import { ResultReportCardRenderManifestService } from '../services/resultReportCardRenderManifestService';
import { ResultReportCardAuditBridge } from '../services/resultReportCardAuditBridge';
import { ResultReportCardIdempotencyService } from '../services/resultReportCardIdempotencyService';
import type { ResultReportCardCommandContext } from '../contracts/resultReportCardContracts';

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

async function seedApprovedReview(
  reviewRepo: InMemoryResultReportCardReviewRepository,
): Promise<string> {
  const review = await reviewRepo.create({
    resultReportCardAssemblyId: 'assembly-1',
    reviewType: 'teacher_report_review',
    safeReviewSummary: 'Approved review',
    reviewedByActorId: 'actor-1',
    reviewedByRole: 'teacher',
    schoolId: 'school-1',
  });
  await reviewRepo.updateStatus(review.resultReportCardReviewId, 'approved');
  return review.resultReportCardReviewId;
}

describe('Package 13 — Export Intent and Render Manifest', () => {
  let exportIntentRepo: InMemoryResultReportCardExportIntentRepository;
  let reviewRepo: InMemoryResultReportCardReviewRepository;
  let assemblyRepo: InMemoryResultReportCardAssemblyRepository;
  let manifestRepo: InMemoryResultReportCardRenderManifestRepository;
  let templateVersionRepo: InMemoryResultReportCardTemplateVersionRepository;
  let auditRepo: InMemoryResultReportCardAuditRepository;
  let idempotencyRepo: InMemoryResultReportCardIdempotencyRepository;
  let auditBridge: ResultReportCardAuditBridge;
  let idempotencyService: ResultReportCardIdempotencyService;
  let exportIntentService: ResultReportCardExportIntentService;
  let renderManifestService: ResultReportCardRenderManifestService;

  beforeEach(() => {
    exportIntentRepo = new InMemoryResultReportCardExportIntentRepository();
    reviewRepo = new InMemoryResultReportCardReviewRepository();
    assemblyRepo = new InMemoryResultReportCardAssemblyRepository();
    manifestRepo = new InMemoryResultReportCardRenderManifestRepository();
    templateVersionRepo = new InMemoryResultReportCardTemplateVersionRepository();
    auditRepo = new InMemoryResultReportCardAuditRepository();
    idempotencyRepo = new InMemoryResultReportCardIdempotencyRepository();
    auditBridge = new ResultReportCardAuditBridge(auditRepo);
    idempotencyService = new ResultReportCardIdempotencyService(idempotencyRepo);
    exportIntentService = new ResultReportCardExportIntentService(
      exportIntentRepo, reviewRepo, assemblyRepo, auditBridge, idempotencyService,
    );
    renderManifestService = new ResultReportCardRenderManifestService(
      manifestRepo, templateVersionRepo, auditBridge, idempotencyService,
    );
  });

  describe('Export Intent', () => {
    let approvedReviewId: string;

    beforeEach(async () => {
      approvedReviewId = await seedApprovedReview(reviewRepo);
    });

    it('export intent can be created only after approved review', async () => {
      const ctx = makeCtx();
      const result = await exportIntentService.createExportIntent(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardReviewId: approvedReviewId,
        resultReportCardAudienceProjectionId: 'projection-1',
        exportChannel: 'pdf_export_future',
        exportMode: 'intent_only',
        safeExportIntentSummary: 'Future PDF export intent',
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe('draft');
      expect(result.resourceId).toBeTruthy();
    });

    it('export intent with non-approved review is blocked', async () => {
      const draftReview = await reviewRepo.create({
        resultReportCardAssemblyId: 'assembly-1',
        reviewType: 'teacher_report_review',
        safeReviewSummary: 'Draft review',
        reviewedByActorId: 'actor-1',
        reviewedByRole: 'teacher',
        schoolId: 'school-1',
      });
      const ctx = makeCtx();
      const result = await exportIntentService.createExportIntent(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardReviewId: draftReview.resultReportCardReviewId,
        resultReportCardAudienceProjectionId: 'projection-1',
        exportChannel: 'pdf_export_future',
        exportMode: 'intent_only',
        safeExportIntentSummary: 'Should fail',
      });
      expect(result.ok).toBe(false);
      expect(result.reasonCode).toBe('REVIEW_NOT_APPROVED');
    });

    it('export intent remains future-intent only', async () => {
      const ctx = makeCtx();
      const result = await exportIntentService.createExportIntent(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardReviewId: approvedReviewId,
        resultReportCardAudienceProjectionId: 'projection-1',
        exportChannel: 'pdf_export_future',
        exportMode: 'intent_only',
        safeExportIntentSummary: 'Future only',
      });
      expect(result.ok).toBe(true);
      const intent = result.data as import('../contracts/resultReportCardExportContracts').ResultReportCardExportIntent;
      expect(intent.exportMode).toBe('intent_only');
    });

    it('export intent can be marked eligible_for_future_export', async () => {
      const ctx = makeCtx();
      const created = await exportIntentService.createExportIntent(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardReviewId: approvedReviewId,
        resultReportCardAudienceProjectionId: 'projection-1',
        exportChannel: 'pdf_export_future',
        exportMode: 'intent_only',
        safeExportIntentSummary: 'Eligible',
      });
      const intentId = created.resourceId!;
      const eligible = await exportIntentService.markEligibleForFutureExport(ctx, intentId);
      expect(eligible.ok).toBe(true);
      expect(eligible.status).toBe('eligible_for_future_export');
    });

    it('export intent can be blocked', async () => {
      const ctx = makeCtx();
      const created = await exportIntentService.createExportIntent(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardReviewId: approvedReviewId,
        resultReportCardAudienceProjectionId: 'projection-1',
        exportChannel: 'pdf_export_future',
        exportMode: 'intent_only',
        safeExportIntentSummary: 'Block',
      });
      const intentId = created.resourceId!;
      const blocked = await exportIntentService.blockExportIntent(ctx, intentId);
      expect(blocked.ok).toBe(true);
      expect(blocked.status).toBe('blocked');
    });

    it('export intent can be voided', async () => {
      const ctx = makeCtx();
      const created = await exportIntentService.createExportIntent(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardReviewId: approvedReviewId,
        resultReportCardAudienceProjectionId: 'projection-1',
        exportChannel: 'pdf_export_future',
        exportMode: 'intent_only',
        safeExportIntentSummary: 'Void',
      });
      const intentId = created.resourceId!;
      const voided = await exportIntentService.voidExportIntent(ctx, intentId);
      expect(voided.ok).toBe(true);
      expect(voided.status).toBe('void');
    });

    it('PDF export is blocked (test assertNoLiveExport)', async () => {
      const result = exportIntentService.assertNoLiveExport('pdf_export_live');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('LIVE_CHANNEL_BLOCKED');
    });

    it('PDF binary creation is blocked', async () => {
      const ctx = makeCtx();
      const result = exportIntentService.assertNoPdfGeneration(ctx);
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('PDF_GENERATION_BLOCKED');
    });

    it('portal live publication is blocked', async () => {
      const result = exportIntentService.assertNoLiveExport('student_portal_live');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('LIVE_CHANNEL_BLOCKED');
    });

    it('external school sync is blocked', async () => {
      const result = exportIntentService.assertNoLiveExport('external_school_system_live');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('LIVE_CHANNEL_BLOCKED');
    });

    it('notification sending is blocked', async () => {
      const result = exportIntentService.assertNoLiveExport('email_live');
      expect(result.allowed).toBe(false);
      expect(result.reasonCode).toBe('LIVE_CHANNEL_BLOCKED');
    });
  });

  describe('Render Manifest', () => {
    it('render manifest can be created', async () => {
      const ctx = makeCtx();
      const templateVersion = await templateVersionRepo.create({
        resultReportCardTemplateId: 'template-1',
        templateVersion: 'v1',
        layoutMode: 'exam_result_summary',
        safeVersionSummary: 'Test version',
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const result = await renderManifestService.createRenderManifest(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardTemplateVersionId: templateVersion.resultReportCardTemplateVersionId,
        renderMode: 'preview_only',
        safeManifestSummary: 'Preview manifest',
      });
      expect(result.ok).toBe(true);
      expect(result.status).toBe('draft');
    });

    it('render manifest can be sealed', async () => {
      const ctx = makeCtx();
      const templateVersion = await templateVersionRepo.create({
        resultReportCardTemplateId: 'template-1',
        templateVersion: 'v1',
        layoutMode: 'exam_result_summary',
        safeVersionSummary: 'Test version',
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const created = await renderManifestService.createRenderManifest(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardTemplateVersionId: templateVersion.resultReportCardTemplateVersionId,
        renderMode: 'preview_only',
        safeManifestSummary: 'To seal',
      });
      const manifestId = created.resourceId!;
      const sealed = await renderManifestService.sealRenderManifest(ctx, manifestId);
      expect(sealed.ok).toBe(true);
      expect(sealed.status).toBe('sealed');
    });

    it('render manifest can be blocked', async () => {
      const ctx = makeCtx();
      const templateVersion = await templateVersionRepo.create({
        resultReportCardTemplateId: 'template-1',
        templateVersion: 'v1',
        layoutMode: 'exam_result_summary',
        safeVersionSummary: 'Test version',
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const created = await renderManifestService.createRenderManifest(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardTemplateVersionId: templateVersion.resultReportCardTemplateVersionId,
        renderMode: 'preview_only',
        safeManifestSummary: 'To block',
      });
      const manifestId = created.resourceId!;
      const blocked = await renderManifestService.blockRenderManifest(ctx, manifestId);
      expect(blocked.ok).toBe(true);
      expect(blocked.status).toBe('blocked');
    });

    it('render manifest can be voided', async () => {
      const ctx = makeCtx();
      const templateVersion = await templateVersionRepo.create({
        resultReportCardTemplateId: 'template-1',
        templateVersion: 'v1',
        layoutMode: 'exam_result_summary',
        safeVersionSummary: 'Test version',
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const created = await renderManifestService.createRenderManifest(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardTemplateVersionId: templateVersion.resultReportCardTemplateVersionId,
        renderMode: 'preview_only',
        safeManifestSummary: 'To void',
      });
      const manifestId = created.resourceId!;
      const voided = await renderManifestService.voidRenderManifest(ctx, manifestId);
      expect(voided.ok).toBe(true);
      expect(voided.status).toBe('void');
    });

    it('render manifest contains layout/section order only', async () => {
      const ctx = makeCtx();
      const templateVersion = await templateVersionRepo.create({
        resultReportCardTemplateId: 'template-1',
        templateVersion: 'v1',
        layoutMode: 'exam_result_summary',
        safeVersionSummary: 'Test version',
        schoolId: 'school-1',
        createdByActorId: 'actor-1',
        createdByRole: 'teacher',
      });
      const result = await renderManifestService.createRenderManifest(ctx, {
        resultReportCardAssemblyId: 'assembly-1',
        resultReportCardTemplateVersionId: templateVersion.resultReportCardTemplateVersionId,
        renderMode: 'preview_only',
        safeManifestSummary: 'Layout only',
        layoutJson: { columns: 2, orientation: 'portrait' },
        sectionOrderJson: { order: ['overview', 'mastery'] },
      });
      expect(result.ok).toBe(true);
      const manifest = result.data as import('../contracts/resultReportCardRenderContracts').ResultReportCardRenderManifest;
      expect(manifest.layoutJson).toBeTruthy();
      expect(manifest.sectionOrderJson).toBeTruthy();
    });

    it('render manifest contains no PDF binary', async () => {
      const manifest = {
        manifestStatus: 'draft',
        layoutJson: { columns: 2 },
        sectionOrderJson: null,
        assetRefsJson: null,
        blockedFieldNamesJson: null,
      } as any;
      const assertion = renderManifestService.assertManifestHasNoBinaryPayload(manifest);
      expect(assertion.allowed).toBe(true);
      expect(assertion.reasonCode).toBe('NO_BINARY_PAYLOAD');
    });

    it('render manifest contains no portal payload', async () => {
      const manifest = {
        manifestStatus: 'draft',
        layoutJson: { portalPayload: 'data' } as any,
      } as any;
      const assertion = renderManifestService.assertManifestHasNoBinaryPayload(manifest);
      expect(assertion.allowed).toBe(true);
    });

    it('render manifest contains no external sync payload', async () => {
      const manifest = {
        manifestStatus: 'draft',
        layoutJson: { externalSyncPayload: 'data' } as any,
      } as any;
      const assertion = renderManifestService.assertManifestHasNoBinaryPayload(manifest);
      expect(assertion.allowed).toBe(true);
    });
  });
});
