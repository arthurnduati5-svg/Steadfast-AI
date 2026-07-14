import { Router, Request, Response } from 'express';
import {
  InMemoryResultReportCardTemplateRepository,
  InMemoryResultReportCardTemplateVersionRepository,
  InMemoryResultReportCardAssemblyRepository,
  InMemoryResultReportCardSectionRepository,
  InMemoryResultReportCardEvidenceLinkRepository,
  InMemoryResultReportCardAudienceProjectionRepository,
  InMemoryResultReportCardReviewRepository,
  InMemoryResultReportCardExportIntentRepository,
  InMemoryResultReportCardRenderManifestRepository,
  InMemoryResultReportCardAuditRepository,
  InMemoryResultReportCardIdempotencyRepository,
} from '../domains/assessment/result-report-card/repositories/inMemoryResultReportCardRepositories';
import { ResultReportCardTemplateService } from '../domains/assessment/result-report-card/services/resultReportCardTemplateService';
import { ResultReportCardAssemblyService } from '../domains/assessment/result-report-card/services/resultReportCardAssemblyService';
import { ResultReportCardSectionComposer } from '../domains/assessment/result-report-card/services/resultReportCardSectionComposer';
import { ResultReportCardEvidenceLinkService } from '../domains/assessment/result-report-card/services/resultReportCardEvidenceLinkService';
import { ResultReportCardAudienceProjectionService } from '../domains/assessment/result-report-card/services/resultReportCardAudienceProjectionService';
import { ResultReportCardReviewService } from '../domains/assessment/result-report-card/services/resultReportCardReviewService';
import { ResultReportCardExportIntentService } from '../domains/assessment/result-report-card/services/resultReportCardExportIntentService';
import { ResultReportCardRenderManifestService } from '../domains/assessment/result-report-card/services/resultReportCardRenderManifestService';
import { ResultReportCardSafetyService } from '../domains/assessment/result-report-card/services/resultReportCardSafetyService';
import { ResultReportCardAuditBridge } from '../domains/assessment/result-report-card/services/resultReportCardAuditBridge';
import { ResultReportCardIdempotencyService } from '../domains/assessment/result-report-card/services/resultReportCardIdempotencyService';
import type { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../domains/assessment/result-report-card/contracts/resultReportCardContracts';

const router = Router();

const templateRepo = new InMemoryResultReportCardTemplateRepository();
const templateVersionRepo = new InMemoryResultReportCardTemplateVersionRepository();
const assemblyRepo = new InMemoryResultReportCardAssemblyRepository();
const sectionRepo = new InMemoryResultReportCardSectionRepository();
const evidenceRepo = new InMemoryResultReportCardEvidenceLinkRepository();
const projectionRepo = new InMemoryResultReportCardAudienceProjectionRepository();
const reviewRepo = new InMemoryResultReportCardReviewRepository();
const exportIntentRepo = new InMemoryResultReportCardExportIntentRepository();
const manifestRepo = new InMemoryResultReportCardRenderManifestRepository();
const auditRepo = new InMemoryResultReportCardAuditRepository();
const idempotencyRepo = new InMemoryResultReportCardIdempotencyRepository();

const auditBridge = new ResultReportCardAuditBridge(auditRepo);
const idempotencyService = new ResultReportCardIdempotencyService(idempotencyRepo);
const safetyService = new ResultReportCardSafetyService();
const templateService = new ResultReportCardTemplateService(templateRepo, templateVersionRepo, auditBridge, idempotencyService);
const assemblyService = new ResultReportCardAssemblyService(assemblyRepo, sectionRepo, evidenceRepo, templateRepo, auditBridge, idempotencyService);
const sectionComposer = new ResultReportCardSectionComposer(sectionRepo, evidenceRepo, safetyService, auditBridge, idempotencyService);
const evidenceLinkService = new ResultReportCardEvidenceLinkService(evidenceRepo, safetyService, auditBridge, idempotencyService);
const audienceProjectionService = new ResultReportCardAudienceProjectionService(projectionRepo, safetyService, auditBridge, idempotencyService);
const reviewService = new ResultReportCardReviewService(reviewRepo, assemblyRepo, auditBridge, idempotencyService);
const exportIntentService = new ResultReportCardExportIntentService(exportIntentRepo, reviewRepo, assemblyRepo, auditBridge, idempotencyService);
const renderManifestService = new ResultReportCardRenderManifestService(manifestRepo, templateVersionRepo, auditBridge, idempotencyService);

function extractContext(req: Request): ResultReportCardCommandContext {
  return {
    schoolId: (req as any).schoolId || (req as any).user?.schoolId || 'test-school',
    actorId: (req as any).user?.id || 'test-actor',
    actorRole: (req as any).user?.role || 'admin',
    correlationId: (req as any).correlationId || 'test-correlation',
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || `auto-${Date.now()}`,
  };
}

function sendEnvelope(res: Response, envelope: ResultReportCardSafeEnvelope): void {
  res.status(envelope.ok ? 200 : 400).json(envelope);
}

// ─── TEMPLATES ──────────────────────────────────────────────

router.post('/templates', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.createTemplate(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/templates', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.listTemplatesForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/templates/:resultReportCardTemplateId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.getTemplate(ctx, req.params.resultReportCardTemplateId);
  sendEnvelope(res, result);
});

router.post('/templates/:resultReportCardTemplateId/activate', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.activateTemplate(ctx, req.params.resultReportCardTemplateId);
  sendEnvelope(res, result);
});

router.post('/templates/:resultReportCardTemplateId/disable', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.disableTemplate(ctx, req.params.resultReportCardTemplateId);
  sendEnvelope(res, result);
});

router.post('/templates/:resultReportCardTemplateId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.voidTemplate(ctx, req.params.resultReportCardTemplateId);
  sendEnvelope(res, result);
});

router.post('/templates/:resultReportCardTemplateId/versions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.createTemplateVersion(ctx, req.params.resultReportCardTemplateId, req.body);
  sendEnvelope(res, result);
});

router.get('/templates/:resultReportCardTemplateId/versions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.listTemplateVersions(ctx, req.params.resultReportCardTemplateId);
  sendEnvelope(res, result);
});

router.get('/template-versions/:resultReportCardTemplateVersionId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.getTemplateVersion(ctx, req.params.resultReportCardTemplateVersionId);
  sendEnvelope(res, result);
});

router.post('/template-versions/:resultReportCardTemplateVersionId/activate', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.activateTemplateVersion(ctx, req.params.resultReportCardTemplateVersionId);
  sendEnvelope(res, result);
});

router.post('/template-versions/:resultReportCardTemplateVersionId/retire', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.retireTemplateVersion(ctx, req.params.resultReportCardTemplateVersionId);
  sendEnvelope(res, result);
});

router.post('/template-versions/:resultReportCardTemplateVersionId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await templateService.voidTemplateVersion(ctx, req.params.resultReportCardTemplateVersionId);
  sendEnvelope(res, result);
});

// ─── ASSEMBLIES ──────────────────────────────────────────────

router.post('/assemblies', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.createAssemblyFromReleasePacket(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/assemblies', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.listAssembliesForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.getAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/assemblies', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.listAssembliesForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/release-packets/:resultReleasePacketId/assemblies', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.listAssembliesForReleasePacket(ctx, req.params.resultReleasePacketId);
  sendEnvelope(res, result);
});

router.post('/assemblies/:resultReportCardAssemblyId/run-source-checks', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.runAssemblySourceChecks(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.post('/assemblies/:resultReportCardAssemblyId/safety-checked', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.markAssemblySafetyChecked(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.post('/assemblies/:resultReportCardAssemblyId/seal', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.sealAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.post('/assemblies/:resultReportCardAssemblyId/ready-for-review', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.markAssemblyReadyForReview(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.post('/assemblies/:resultReportCardAssemblyId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.blockAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.post('/assemblies/:resultReportCardAssemblyId/cancel', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.cancelAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.post('/assemblies/:resultReportCardAssemblyId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await assemblyService.voidAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

// ─── SECTIONS ───────────────────────────────────────────────

router.post('/assemblies/:resultReportCardAssemblyId/sections', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const input = { ...req.body, resultReportCardAssemblyId: req.params.resultReportCardAssemblyId };
  let result: ResultReportCardSafeEnvelope;
  switch (req.body.sectionType) {
    case 'result_overview':
      result = await sectionComposer.composeResultOverviewSection(ctx, input);
      break;
    case 'strengths':
      result = await sectionComposer.composeStrengthsSection(ctx, input);
      break;
    case 'growth_areas':
      result = await sectionComposer.composeGrowthAreasSection(ctx, input);
      break;
    case 'objective_mastery':
      result = await sectionComposer.composeObjectiveMasterySection(ctx, input);
      break;
    case 'practice_next_steps':
      result = await sectionComposer.composePracticeNextStepsSection(ctx, input);
      break;
    case 'parent_support_guidance':
      result = await sectionComposer.composeParentSupportGuidanceSection(ctx, input);
      break;
    case 'student_reflection_prompt':
      result = await sectionComposer.composeStudentReflectionPromptSection(ctx, input);
      break;
    case 'teacher_review_note':
      result = await sectionComposer.composeTeacherReviewNoteSection(ctx, input);
      break;
    case 'admin_audit_summary':
      result = await sectionComposer.composeAdminAuditSummarySection(ctx, input);
      break;
    case 'delivery_readiness_summary':
      result = await sectionComposer.composeDeliveryReadinessSummarySection(ctx, input);
      break;
    default:
      result = { ok: false, requestId: ctx.correlationId, safeMessage: `Unknown section type: ${req.body.sectionType}`, reasonCode: 'UNKNOWN_SECTION_TYPE', status: 'error' };
      break;
  }
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/sections', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await sectionComposer.listSectionsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/sections/:resultReportCardSectionId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await sectionComposer.getSection(ctx, req.params.resultReportCardSectionId);
  sendEnvelope(res, result);
});

router.post('/sections/:resultReportCardSectionId/seal', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await sectionComposer.sealSection(ctx, req.params.resultReportCardSectionId);
  sendEnvelope(res, result);
});

router.post('/sections/:resultReportCardSectionId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await sectionComposer.blockSection(ctx, req.params.resultReportCardSectionId);
  sendEnvelope(res, result);
});

router.post('/sections/:resultReportCardSectionId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await sectionComposer.voidSection(ctx, req.params.resultReportCardSectionId);
  sendEnvelope(res, result);
});

// ─── EVIDENCE LINKS ─────────────────────────────────────────

router.post('/assemblies/:resultReportCardAssemblyId/evidence-links', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceLinkService.createEvidenceLink(ctx, {
    ...req.body,
    resultReportCardAssemblyId: req.params.resultReportCardAssemblyId,
  });
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/evidence-links', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceLinkService.listEvidenceLinksForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/sections/:resultReportCardSectionId/evidence-links', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceLinkService.listEvidenceLinksForSection(ctx, req.params.resultReportCardSectionId);
  sendEnvelope(res, result);
});

router.get('/evidence-links/:resultReportCardEvidenceLinkId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceLinkService.getEvidenceLink(ctx, req.params.resultReportCardEvidenceLinkId);
  sendEnvelope(res, result);
});

router.post('/evidence-links/:resultReportCardEvidenceLinkId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceLinkService.blockEvidenceLink(ctx, req.params.resultReportCardEvidenceLinkId);
  sendEnvelope(res, result);
});

router.post('/evidence-links/:resultReportCardEvidenceLinkId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceLinkService.voidEvidenceLink(ctx, req.params.resultReportCardEvidenceLinkId);
  sendEnvelope(res, result);
});

// ─── AUDIENCE PROJECTIONS ───────────────────────────────────

router.post('/assemblies/:resultReportCardAssemblyId/audience-projections', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const input = { ...req.body, resultReportCardAssemblyId: req.params.resultReportCardAssemblyId };
  let result: ResultReportCardSafeEnvelope;
  switch (req.body.audienceType) {
    case 'teacher':
      result = await audienceProjectionService.generateTeacherProjection(ctx, input);
      break;
    case 'admin':
      result = await audienceProjectionService.generateAdminProjection(ctx, input);
      break;
    case 'student':
      result = await audienceProjectionService.generateStudentSafeProjection(ctx, input);
      break;
    case 'parent':
      result = await audienceProjectionService.generateParentBoundaryProjection(ctx, input);
      break;
    default:
      result = { ok: false, requestId: ctx.correlationId, safeMessage: `Unknown audience type: ${req.body.audienceType}`, reasonCode: 'UNKNOWN_AUDIENCE_TYPE', status: 'error' };
      break;
  }
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/audience-projections', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await audienceProjectionService.listAudienceProjectionsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/audience-projections/:resultReportCardAudienceProjectionId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await audienceProjectionService.getAudienceProjection(ctx, req.params.resultReportCardAudienceProjectionId);
  sendEnvelope(res, result);
});

router.post('/audience-projections/:resultReportCardAudienceProjectionId/seal', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await audienceProjectionService.sealAudienceProjection(ctx, req.params.resultReportCardAudienceProjectionId);
  sendEnvelope(res, result);
});

router.post('/audience-projections/:resultReportCardAudienceProjectionId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await audienceProjectionService.blockAudienceProjection(ctx, req.params.resultReportCardAudienceProjectionId);
  sendEnvelope(res, result);
});

router.post('/audience-projections/:resultReportCardAudienceProjectionId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await audienceProjectionService.voidAudienceProjection(ctx, req.params.resultReportCardAudienceProjectionId);
  sendEnvelope(res, result);
});

// ─── PROJECTION ACCESS ──────────────────────────────────────

router.get('/assemblies/:resultReportCardAssemblyId/projection/teacher', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await audienceProjectionService.listAudienceProjectionsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/projection/admin', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await audienceProjectionService.listAudienceProjectionsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/projection/student-safe', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await audienceProjectionService.listAudienceProjectionsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/projection/parent-boundary', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await audienceProjectionService.listAudienceProjectionsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

// ─── REVIEWS ────────────────────────────────────────────────

router.post('/assemblies/:resultReportCardAssemblyId/reviews', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reviewService.createReview(ctx, {
    ...req.body,
    resultReportCardAssemblyId: req.params.resultReportCardAssemblyId,
  });
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/reviews', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reviewService.listReviewsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/reviews/:resultReportCardReviewId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reviewService.getReview(ctx, req.params.resultReportCardReviewId);
  sendEnvelope(res, result);
});

router.post('/reviews/:resultReportCardReviewId/start', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reviewService.startReview(ctx, req.params.resultReportCardReviewId);
  sendEnvelope(res, result);
});

router.post('/reviews/:resultReportCardReviewId/approve-for-export-intent', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reviewService.approveForExportIntent(ctx, req.params.resultReportCardReviewId);
  sendEnvelope(res, result);
});

router.post('/reviews/:resultReportCardReviewId/request-revision', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reviewService.requestRevision(ctx, req.params.resultReportCardReviewId);
  sendEnvelope(res, result);
});

router.post('/reviews/:resultReportCardReviewId/reject', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reviewService.rejectReview(ctx, req.params.resultReportCardReviewId);
  sendEnvelope(res, result);
});

router.post('/reviews/:resultReportCardReviewId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reviewService.blockReview(ctx, req.params.resultReportCardReviewId);
  sendEnvelope(res, result);
});

router.post('/reviews/:resultReportCardReviewId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reviewService.voidReview(ctx, req.params.resultReportCardReviewId);
  sendEnvelope(res, result);
});

// ─── EXPORT INTENTS ─────────────────────────────────────────

router.post('/assemblies/:resultReportCardAssemblyId/export-intents', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exportIntentService.createExportIntent(ctx, {
    ...req.body,
    resultReportCardAssemblyId: req.params.resultReportCardAssemblyId,
  });
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/export-intents', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exportIntentService.listExportIntentsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/export-intents/:resultReportCardExportIntentId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exportIntentService.getExportIntent(ctx, req.params.resultReportCardExportIntentId);
  sendEnvelope(res, result);
});

router.post('/export-intents/:resultReportCardExportIntentId/eligible', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exportIntentService.markEligibleForFutureExport(ctx, req.params.resultReportCardExportIntentId);
  sendEnvelope(res, result);
});

router.post('/export-intents/:resultReportCardExportIntentId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exportIntentService.blockExportIntent(ctx, req.params.resultReportCardExportIntentId);
  sendEnvelope(res, result);
});

router.post('/export-intents/:resultReportCardExportIntentId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exportIntentService.voidExportIntent(ctx, req.params.resultReportCardExportIntentId);
  sendEnvelope(res, result);
});

// ─── RENDER MANIFESTS ───────────────────────────────────────

router.post('/assemblies/:resultReportCardAssemblyId/render-manifests', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await renderManifestService.createRenderManifest(ctx, {
    ...req.body,
    resultReportCardAssemblyId: req.params.resultReportCardAssemblyId,
  });
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/render-manifests', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await renderManifestService.listRenderManifestsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/render-manifests/:resultReportCardRenderManifestId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await renderManifestService.getRenderManifest(ctx, req.params.resultReportCardRenderManifestId);
  sendEnvelope(res, result);
});

router.post('/render-manifests/:resultReportCardRenderManifestId/seal', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await renderManifestService.sealRenderManifest(ctx, req.params.resultReportCardRenderManifestId);
  sendEnvelope(res, result);
});

router.post('/render-manifests/:resultReportCardRenderManifestId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await renderManifestService.blockRenderManifest(ctx, req.params.resultReportCardRenderManifestId);
  sendEnvelope(res, result);
});

router.post('/render-manifests/:resultReportCardRenderManifestId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await renderManifestService.voidRenderManifest(ctx, req.params.resultReportCardRenderManifestId);
  sendEnvelope(res, result);
});

export default router;
