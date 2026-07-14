import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  InMemoryResultReportCardExportJobRepository,
  InMemoryResultReportCardExportTargetRepository,
  InMemoryResultReportCardExportEnvelopeRepository,
  InMemoryResultReportCardMockExportAttemptRepository,
  InMemoryResultReportCardExportReceiptRepository,
  InMemoryResultReportCardExportSuppressionRepository,
  InMemoryResultReportCardExportRetryPlanRepository,
  InMemoryResultReportCardArchiveManifestRepository,
  InMemoryResultReportCardExportAuditRepository,
  InMemoryResultReportCardExportIdempotencyRepository,
} from '../domains/assessment/result-report-card-export/repositories/inMemoryResultReportCardExportRepositories';
import {
  ResultReportCardExportJobService,
  ResultReportCardExportTargetResolver,
  ResultReportCardExportEnvelopeService,
  ResultReportCardMockExportService,
  ResultReportCardExportReceiptService,
  ResultReportCardExportSuppressionService,
  ResultReportCardExportRetryPlanService,
  ResultReportCardArchiveManifestService,
  ResultReportCardExportSafetyService,
  ResultReportCardExportAuditBridge,
  ResultReportCardExportIdempotencyService,
} from '../domains/assessment/result-report-card-export/services';
import { ResultReportCardCommandContext, ResultReportCardSafeEnvelope } from '../domains/assessment/result-report-card/contracts/resultReportCardContracts';

const router = Router();

// Instantiate repositories
const jobRepo = new InMemoryResultReportCardExportJobRepository();
const targetRepo = new InMemoryResultReportCardExportTargetRepository();
const envelopeRepo = new InMemoryResultReportCardExportEnvelopeRepository();
const attemptRepo = new InMemoryResultReportCardMockExportAttemptRepository();
const receiptRepo = new InMemoryResultReportCardExportReceiptRepository();
const suppressionRepo = new InMemoryResultReportCardExportSuppressionRepository();
const retryPlanRepo = new InMemoryResultReportCardExportRetryPlanRepository();
const archiveManifestRepo = new InMemoryResultReportCardArchiveManifestRepository();
const auditRepo = new InMemoryResultReportCardExportAuditRepository();
const idempotencyRepo = new InMemoryResultReportCardExportIdempotencyRepository();

// Instantiate services
const idempotencyService = new ResultReportCardExportIdempotencyService(idempotencyRepo);
const auditBridge = new ResultReportCardExportAuditBridge(auditRepo);
const safetyService = new ResultReportCardExportSafetyService();
const jobService = new ResultReportCardExportJobService(jobRepo, auditBridge, idempotencyService);
const targetResolver = new ResultReportCardExportTargetResolver(targetRepo, auditBridge, idempotencyService);
const envelopeService = new ResultReportCardExportEnvelopeService(envelopeRepo, safetyService, auditBridge, idempotencyService);
const mockExportService = new ResultReportCardMockExportService(attemptRepo, safetyService, auditBridge, idempotencyService);
const receiptService = new ResultReportCardExportReceiptService(receiptRepo, safetyService, auditBridge, idempotencyService);
const suppressionService = new ResultReportCardExportSuppressionService(suppressionRepo, auditBridge, idempotencyService);
const retryPlanService = new ResultReportCardExportRetryPlanService(retryPlanRepo, auditBridge, idempotencyService);
const archiveManifestService = new ResultReportCardArchiveManifestService(archiveManifestRepo, safetyService, auditBridge, idempotencyService);

function extractContext(req: Request): ResultReportCardCommandContext {
  return {
    schoolId: (req as any).schoolId || 'unknown',
    actorId: (req as any).actorId || 'unknown',
    actorRole: (req as any).actorRole || 'unknown',
    correlationId: (req as any).correlationId || uuidv4(),
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || uuidv4(),
  };
}

function sendEnvelope(res: Response, envelope: ResultReportCardSafeEnvelope): void {
  res.status(envelope.ok ? 200 : 400).json(envelope);
}

// ─── EXPORT JOBS ────────────────────────────────────────────

router.post('/jobs', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.createExportJobFromIntent(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/jobs', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.listExportJobsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultReportCardExportJobId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.getExportJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/jobs', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.listExportJobsForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/assemblies/:resultReportCardAssemblyId/jobs', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.listExportJobsForAssembly(ctx, req.params.resultReportCardAssemblyId);
  sendEnvelope(res, result);
});

router.get('/export-intents/:resultReportCardExportIntentId/jobs', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.listExportJobsForExportIntent(ctx, req.params.resultReportCardExportIntentId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultReportCardExportJobId/validate', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.validateExportJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultReportCardExportJobId/queue-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.queueMockExportJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultReportCardExportJobId/mock-exported', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.markMockExported(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultReportCardExportJobId/receipt-recorded', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.markReceiptRecorded(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultReportCardExportJobId/archive-manifest-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.markArchiveManifestReady(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultReportCardExportJobId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.blockExportJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultReportCardExportJobId/cancel', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.cancelExportJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultReportCardExportJobId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await jobService.voidExportJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

// ─── EXPORT TARGETS ─────────────────────────────────────────

router.post('/jobs/:resultReportCardExportJobId/targets', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await targetResolver.createExportTarget(ctx, {
    ...req.body,
    resultReportCardExportJobId: req.params.resultReportCardExportJobId,
  });
  sendEnvelope(res, result);
});

router.get('/jobs/:resultReportCardExportJobId/targets', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await targetResolver.listExportTargetsForJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.get('/targets/:resultReportCardExportTargetId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await targetResolver.getExportTarget(ctx, req.params.resultReportCardExportTargetId);
  sendEnvelope(res, result);
});

router.post('/targets/:resultReportCardExportTargetId/validate', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await targetResolver.validateExportTarget(ctx, req.params.resultReportCardExportTargetId);
  sendEnvelope(res, result);
});

router.post('/targets/:resultReportCardExportTargetId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await targetResolver.suppressExportTarget(ctx, req.params.resultReportCardExportTargetId);
  sendEnvelope(res, result);
});

router.post('/targets/:resultReportCardExportTargetId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await targetResolver.blockExportTarget(ctx, req.params.resultReportCardExportTargetId);
  sendEnvelope(res, result);
});

router.post('/targets/:resultReportCardExportTargetId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await targetResolver.voidExportTarget(ctx, req.params.resultReportCardExportTargetId);
  sendEnvelope(res, result);
});

// ─── EXPORT ENVELOPES ───────────────────────────────────────

router.post('/jobs/:resultReportCardExportJobId/envelopes', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.composeExportEnvelope(ctx, {
    ...req.body,
    resultReportCardExportJobId: req.params.resultReportCardExportJobId,
  });
  sendEnvelope(res, result);
});

router.get('/jobs/:resultReportCardExportJobId/envelopes', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.listExportEnvelopesForJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.get('/targets/:resultReportCardExportTargetId/envelopes', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.listExportEnvelopesForTarget(ctx, req.params.resultReportCardExportTargetId);
  sendEnvelope(res, result);
});

router.get('/envelopes/:resultReportCardExportEnvelopeId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.getExportEnvelope(ctx, req.params.resultReportCardExportEnvelopeId);
  sendEnvelope(res, result);
});

router.post('/envelopes/:resultReportCardExportEnvelopeId/seal', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.sealExportEnvelope(ctx, req.params.resultReportCardExportEnvelopeId);
  sendEnvelope(res, result);
});

router.post('/envelopes/:resultReportCardExportEnvelopeId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.suppressExportEnvelope(ctx, req.params.resultReportCardExportEnvelopeId);
  sendEnvelope(res, result);
});

router.post('/envelopes/:resultReportCardExportEnvelopeId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.blockExportEnvelope(ctx, req.params.resultReportCardExportEnvelopeId);
  sendEnvelope(res, result);
});

router.post('/envelopes/:resultReportCardExportEnvelopeId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.voidExportEnvelope(ctx, req.params.resultReportCardExportEnvelopeId);
  sendEnvelope(res, result);
});

// ─── MOCK EXPORT ATTEMPTS ───────────────────────────────────

router.post('/jobs/:resultReportCardExportJobId/mock-attempts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockExportService.createMockExportAttempt(ctx, {
    ...req.body,
    resultReportCardExportJobId: req.params.resultReportCardExportJobId,
  });
  sendEnvelope(res, result);
});

router.get('/jobs/:resultReportCardExportJobId/mock-attempts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockExportService.listMockExportAttemptsForJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.get('/targets/:resultReportCardExportTargetId/mock-attempts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockExportService.listMockExportAttemptsForTarget(ctx, req.params.resultReportCardExportTargetId);
  sendEnvelope(res, result);
});

router.get('/mock-attempts/:resultReportCardMockExportAttemptId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockExportService.getMockExportAttempt(ctx, req.params.resultReportCardMockExportAttemptId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultReportCardMockExportAttemptId/start', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockExportService.startMockExportAttempt(ctx, req.params.resultReportCardMockExportAttemptId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultReportCardMockExportAttemptId/complete', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockExportService.completeMockExportAttempt(ctx, req.params.resultReportCardMockExportAttemptId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultReportCardMockExportAttemptId/fail', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockExportService.failMockExportAttempt(ctx, req.params.resultReportCardMockExportAttemptId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultReportCardMockExportAttemptId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockExportService.blockMockExportAttempt(ctx, req.params.resultReportCardMockExportAttemptId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultReportCardMockExportAttemptId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockExportService.voidMockExportAttempt(ctx, req.params.resultReportCardMockExportAttemptId);
  sendEnvelope(res, result);
});

// ─── EXPORT RECEIPTS ────────────────────────────────────────

router.post('/jobs/:resultReportCardExportJobId/receipts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.recordExportReceipt(ctx, {
    ...req.body,
    resultReportCardExportJobId: req.params.resultReportCardExportJobId,
  });
  sendEnvelope(res, result);
});

router.get('/jobs/:resultReportCardExportJobId/receipts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.listExportReceiptsForJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.get('/targets/:resultReportCardExportTargetId/receipts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.listExportReceiptsForTarget(ctx, req.params.resultReportCardExportTargetId);
  sendEnvelope(res, result);
});

router.get('/mock-attempts/:resultReportCardMockExportAttemptId/receipts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.listExportReceiptsForAttempt(ctx, req.params.resultReportCardMockExportAttemptId);
  sendEnvelope(res, result);
});

router.get('/receipts/:resultReportCardExportReceiptId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.getExportReceipt(ctx, req.params.resultReportCardExportReceiptId);
  sendEnvelope(res, result);
});

router.post('/receipts/:resultReportCardExportReceiptId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.blockExportReceipt(ctx, req.params.resultReportCardExportReceiptId);
  sendEnvelope(res, result);
});

router.post('/receipts/:resultReportCardExportReceiptId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.voidExportReceipt(ctx, req.params.resultReportCardExportReceiptId);
  sendEnvelope(res, result);
});

// ─── EXPORT SUPPRESSIONS ────────────────────────────────────

router.post('/jobs/:resultReportCardExportJobId/suppressions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.createSuppression(ctx, {
    ...req.body,
    resultReportCardExportJobId: req.params.resultReportCardExportJobId,
  });
  sendEnvelope(res, result);
});

router.get('/jobs/:resultReportCardExportJobId/suppressions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.listSuppressionsForJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.get('/targets/:resultReportCardExportTargetId/suppressions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.listSuppressionsForTarget(ctx, req.params.resultReportCardExportTargetId);
  sendEnvelope(res, result);
});

router.get('/envelopes/:resultReportCardExportEnvelopeId/suppressions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.listSuppressionsForEnvelope(ctx, req.params.resultReportCardExportEnvelopeId);
  sendEnvelope(res, result);
});

router.get('/suppressions/:resultReportCardExportSuppressionId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.getSuppression(ctx, req.params.resultReportCardExportSuppressionId);
  sendEnvelope(res, result);
});

router.post('/suppressions/:resultReportCardExportSuppressionId/lift', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.liftSuppression(ctx, req.params.resultReportCardExportSuppressionId);
  sendEnvelope(res, result);
});

router.post('/suppressions/:resultReportCardExportSuppressionId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.voidSuppression(ctx, req.params.resultReportCardExportSuppressionId);
  sendEnvelope(res, result);
});

// ─── EXPORT RETRY PLANS ─────────────────────────────────────

router.post('/jobs/:resultReportCardExportJobId/retry-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.createRetryPlan(ctx, {
    ...req.body,
    resultReportCardExportJobId: req.params.resultReportCardExportJobId,
  });
  sendEnvelope(res, result);
});

router.get('/jobs/:resultReportCardExportJobId/retry-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.listRetryPlansForJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.get('/mock-attempts/:resultReportCardMockExportAttemptId/retry-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.listRetryPlansForAttempt(ctx, req.params.resultReportCardMockExportAttemptId);
  sendEnvelope(res, result);
});

router.get('/retry-plans/:resultReportCardExportRetryPlanId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.getRetryPlan(ctx, req.params.resultReportCardExportRetryPlanId);
  sendEnvelope(res, result);
});

router.post('/retry-plans/:resultReportCardExportRetryPlanId/planned', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.markRetryPlanned(ctx, req.params.resultReportCardExportRetryPlanId);
  sendEnvelope(res, result);
});

router.post('/retry-plans/:resultReportCardExportRetryPlanId/cancel', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.cancelRetryPlan(ctx, req.params.resultReportCardExportRetryPlanId);
  sendEnvelope(res, result);
});

router.post('/retry-plans/:resultReportCardExportRetryPlanId/exhaust', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.exhaustRetryPlan(ctx, req.params.resultReportCardExportRetryPlanId);
  sendEnvelope(res, result);
});

router.post('/retry-plans/:resultReportCardExportRetryPlanId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.voidRetryPlan(ctx, req.params.resultReportCardExportRetryPlanId);
  sendEnvelope(res, result);
});

// ─── ARCHIVE MANIFESTS ──────────────────────────────────────

router.post('/jobs/:resultReportCardExportJobId/archive-manifests', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await archiveManifestService.createArchiveManifest(ctx, {
    ...req.body,
    resultReportCardExportJobId: req.params.resultReportCardExportJobId,
  });
  sendEnvelope(res, result);
});

router.get('/jobs/:resultReportCardExportJobId/archive-manifests', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await archiveManifestService.listArchiveManifestsForJob(ctx, req.params.resultReportCardExportJobId);
  sendEnvelope(res, result);
});

router.get('/archive-manifests/:resultReportCardArchiveManifestId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await archiveManifestService.getArchiveManifest(ctx, req.params.resultReportCardArchiveManifestId);
  sendEnvelope(res, result);
});

router.post('/archive-manifests/:resultReportCardArchiveManifestId/seal', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await archiveManifestService.sealArchiveManifest(ctx, req.params.resultReportCardArchiveManifestId);
  sendEnvelope(res, result);
});

router.post('/archive-manifests/:resultReportCardArchiveManifestId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await archiveManifestService.blockArchiveManifest(ctx, req.params.resultReportCardArchiveManifestId);
  sendEnvelope(res, result);
});

router.post('/archive-manifests/:resultReportCardArchiveManifestId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await archiveManifestService.voidArchiveManifest(ctx, req.params.resultReportCardArchiveManifestId);
  sendEnvelope(res, result);
});

export default router;
