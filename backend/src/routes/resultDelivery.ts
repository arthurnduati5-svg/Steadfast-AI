import { Router, Request, Response } from 'express';
import { buildVerifiedActorContext } from '../lib/verifiedActorContext';
import {
  InMemoryResultDeliveryJobRepository,
  InMemoryResultDeliveryRecipientRepository,
  InMemoryResultDeliveryChannelEnvelopeRepository,
  InMemoryResultDeliverySuppressionRepository,
  InMemoryResultDeliveryAttemptRepository,
  InMemoryResultDeliveryReceiptRepository,
  InMemoryResultDeliveryRetryPlanRepository,
  InMemoryResultDeliveryMockProviderRepository,
  InMemoryResultDeliveryAuditRepository,
  InMemoryResultDeliveryIdempotencyRepository,
} from '../domains/assessment/result-delivery/repositories/inMemoryResultDeliveryRepositories';
import {
  PrismaResultDeliveryJobRepository,
  PrismaResultDeliveryRecipientRepository,
  PrismaResultDeliveryChannelEnvelopeRepository,
  PrismaResultDeliverySuppressionRepository,
  PrismaResultDeliveryAttemptRepository,
  PrismaResultDeliveryReceiptRepository,
  PrismaResultDeliveryRetryPlanRepository,
  PrismaResultDeliveryMockProviderRepository,
  PrismaResultDeliveryAuditRepository,
  PrismaResultDeliveryIdempotencyRepository,
} from '../domains/assessment/result-delivery/repositories/prismaResultDeliveryRepositories';
import { ResultDeliveryJobService } from '../domains/assessment/result-delivery/services/resultDeliveryJobService';
import { ResultDeliveryRecipientResolver } from '../domains/assessment/result-delivery/services/resultDeliveryRecipientResolver';
import { ResultDeliveryEnvelopeService } from '../domains/assessment/result-delivery/services/resultDeliveryEnvelopeService';
import { ResultDeliverySuppressionService } from '../domains/assessment/result-delivery/services/resultDeliverySuppressionService';
import { ResultDeliveryMockDispatchService } from '../domains/assessment/result-delivery/services/resultDeliveryMockDispatchService';
import { ResultDeliveryReceiptService } from '../domains/assessment/result-delivery/services/resultDeliveryReceiptService';
import { ResultDeliveryRetryPlanService } from '../domains/assessment/result-delivery/services/resultDeliveryRetryPlanService';
import { ResultDeliveryProjectionSafetyService } from '../domains/assessment/result-delivery/services/resultDeliveryProjectionSafetyService';
import { ResultDeliveryAuditBridge } from '../domains/assessment/result-delivery/services/resultDeliveryAuditBridge';
import { ResultDeliveryIdempotencyService } from '../domains/assessment/result-delivery/services/resultDeliveryIdempotencyService';
import type { ResultDeliveryCommandContext, ResultDeliverySafeEnvelope } from '../domains/assessment/result-delivery/contracts/resultDeliveryContracts';

const router = Router();

/**
 * R8-G production composition: the mounted HTTP router defaults to the
 * existing durable Prisma repositories. In-memory repositories exist only
 * for explicit test injection via `useResultDeliveryReposForTests`.
 * Production NEVER silently falls back from Prisma to in-memory persistence.
 */
export interface ResultDeliveryRouteRepos {
  jobRepo: InMemoryResultDeliveryJobRepository | PrismaResultDeliveryJobRepository;
  recipientRepo: InMemoryResultDeliveryRecipientRepository | PrismaResultDeliveryRecipientRepository;
  envelopeRepo: InMemoryResultDeliveryChannelEnvelopeRepository | PrismaResultDeliveryChannelEnvelopeRepository;
  suppressionRepo: InMemoryResultDeliverySuppressionRepository | PrismaResultDeliverySuppressionRepository;
  attemptRepo: InMemoryResultDeliveryAttemptRepository | PrismaResultDeliveryAttemptRepository;
  receiptRepo: InMemoryResultDeliveryReceiptRepository | PrismaResultDeliveryReceiptRepository;
  retryPlanRepo: InMemoryResultDeliveryRetryPlanRepository | PrismaResultDeliveryRetryPlanRepository;
  mockProviderRepo: InMemoryResultDeliveryMockProviderRepository | PrismaResultDeliveryMockProviderRepository;
  auditRepo: InMemoryResultDeliveryAuditRepository | PrismaResultDeliveryAuditRepository;
  idempotencyRepo: InMemoryResultDeliveryIdempotencyRepository | PrismaResultDeliveryIdempotencyRepository;
}

export function buildProductionResultDeliveryRepos(): ResultDeliveryRouteRepos {
  return {
    jobRepo: new PrismaResultDeliveryJobRepository(),
    recipientRepo: new PrismaResultDeliveryRecipientRepository(),
    envelopeRepo: new PrismaResultDeliveryChannelEnvelopeRepository(),
    suppressionRepo: new PrismaResultDeliverySuppressionRepository(),
    attemptRepo: new PrismaResultDeliveryAttemptRepository(),
    receiptRepo: new PrismaResultDeliveryReceiptRepository(),
    retryPlanRepo: new PrismaResultDeliveryRetryPlanRepository(),
    mockProviderRepo: new PrismaResultDeliveryMockProviderRepository(),
    auditRepo: new PrismaResultDeliveryAuditRepository(),
    idempotencyRepo: new PrismaResultDeliveryIdempotencyRepository(),
  };
}

const routeRepos: ResultDeliveryRouteRepos = buildProductionResultDeliveryRepos();

function buildResultDeliveryServiceBundle() {
  const auditBridge = new ResultDeliveryAuditBridge(routeRepos.auditRepo);
  const idempotencyService = new ResultDeliveryIdempotencyService(routeRepos.idempotencyRepo);
  return {
    auditBridge,
    idempotencyService,
    deliveryJobService: new ResultDeliveryJobService(routeRepos.jobRepo, routeRepos.recipientRepo, routeRepos.envelopeRepo, routeRepos.suppressionRepo, routeRepos.attemptRepo, auditBridge, idempotencyService),
    recipientResolver: new ResultDeliveryRecipientResolver(routeRepos.recipientRepo, auditBridge, idempotencyService),
    envelopeService: new ResultDeliveryEnvelopeService(routeRepos.envelopeRepo, auditBridge, idempotencyService),
    suppressionService: new ResultDeliverySuppressionService(routeRepos.suppressionRepo, auditBridge, idempotencyService),
    mockDispatchService: new ResultDeliveryMockDispatchService(routeRepos.attemptRepo, routeRepos.envelopeRepo, routeRepos.suppressionRepo, auditBridge, idempotencyService),
    receiptService: new ResultDeliveryReceiptService(routeRepos.receiptRepo, auditBridge, idempotencyService),
    retryPlanService: new ResultDeliveryRetryPlanService(routeRepos.retryPlanRepo, auditBridge, idempotencyService),
    projectionSafetyService: new ResultDeliveryProjectionSafetyService(routeRepos.jobRepo, routeRepos.envelopeRepo, routeRepos.attemptRepo, routeRepos.receiptRepo),
  };
}

let serviceBundle = buildResultDeliveryServiceBundle();

/**
 * Explicit test-only injection seam. Never called in production.
 */
export function useResultDeliveryReposForTests(repos: ResultDeliveryRouteRepos): void {
  Object.assign(routeRepos, repos);
  serviceBundle = buildResultDeliveryServiceBundle();
  auditBridge = serviceBundle.auditBridge;
  idempotencyService = serviceBundle.idempotencyService;
  deliveryJobService = serviceBundle.deliveryJobService;
  recipientResolver = serviceBundle.recipientResolver;
  envelopeService = serviceBundle.envelopeService;
  suppressionService = serviceBundle.suppressionService;
  mockDispatchService = serviceBundle.mockDispatchService;
  receiptService = serviceBundle.receiptService;
  retryPlanService = serviceBundle.retryPlanService;
  projectionSafetyService = serviceBundle.projectionSafetyService;
}

let auditBridge = serviceBundle.auditBridge;
let idempotencyService = serviceBundle.idempotencyService;
let deliveryJobService = serviceBundle.deliveryJobService;
let recipientResolver = serviceBundle.recipientResolver;
let envelopeService = serviceBundle.envelopeService;
let suppressionService = serviceBundle.suppressionService;
let mockDispatchService = serviceBundle.mockDispatchService;
let receiptService = serviceBundle.receiptService;
let retryPlanService = serviceBundle.retryPlanService;
let projectionSafetyService = serviceBundle.projectionSafetyService;

function extractContext(req: Request): ResultDeliveryCommandContext {
  // R8-G: authoritative identity derives exclusively from verified server-side
  // context. Previous hard-coded 'test-school'/'test-actor'/'admin' defaults
  // are removed: missing verified identity fails closed downstream.
  const verified = buildVerifiedActorContext(req);
  return {
    schoolId: verified.schoolId,
    actorId: verified.actorId,
    actorRole: verified.role,
    correlationId: (req as any).correlationId || (req.headers['x-correlation-id'] as string) || '',
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || `auto-${Date.now()}`,
  };
}

function sendEnvelope(res: Response, envelope: ResultDeliverySafeEnvelope): void {
  res.status(envelope.ok ? 200 : 400).json(envelope);
}

// ─── JOBS ─────────────────────────────────────────────────

router.post('/jobs', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryJobService.createDeliveryJobFromIntent(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryJobService.getDeliveryJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.get('/jobs', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const studentRef = (req.query as any).studentRef as string | undefined;
  const result = studentRef
    ? await deliveryJobService.listDeliveryJobsForStudent(ctx, studentRef)
    : await deliveryJobService.listDeliveryJobsForSchool(ctx);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultDeliveryJobId/validate', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryJobService.validateDeliveryJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultDeliveryJobId/queue-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryJobService.queueMockDeliveryJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultDeliveryJobId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryJobService.blockDeliveryJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultDeliveryJobId/cancel', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryJobService.cancelDeliveryJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/jobs/:resultDeliveryJobId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await deliveryJobService.voidDeliveryJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

// ─── RECIPIENTS ────────────────────────────────────────────

router.post('/jobs/:resultDeliveryJobId/recipients', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await recipientResolver.resolveRecipientForDeliveryJob(ctx, {
    ...req.body,
    resultDeliveryJobId: req.params.resultDeliveryJobId,
  });
  sendEnvelope(res, result);
});

router.get('/recipients/:resultDeliveryRecipientId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await recipientResolver.getRecipient(ctx, req.params.resultDeliveryRecipientId);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId/recipients', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await recipientResolver.listRecipientsForJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/recipients/:resultDeliveryRecipientId/verify', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await recipientResolver.verifyRecipientBoundary(ctx, req.params.resultDeliveryRecipientId);
  sendEnvelope(res, result);
});

router.post('/recipients/:resultDeliveryRecipientId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await recipientResolver.blockRecipient(ctx, req.params.resultDeliveryRecipientId);
  sendEnvelope(res, result);
});

router.post('/recipients/:resultDeliveryRecipientId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await recipientResolver.voidRecipient(ctx, req.params.resultDeliveryRecipientId);
  sendEnvelope(res, result);
});

// ─── ENVELOPES ─────────────────────────────────────────────

router.post('/jobs/:resultDeliveryJobId/envelopes', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.createChannelEnvelope(ctx, {
    ...req.body,
    resultDeliveryJobId: req.params.resultDeliveryJobId,
  });
  sendEnvelope(res, result);
});

router.get('/envelopes/:resultDeliveryChannelEnvelopeId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.getChannelEnvelope(ctx, req.params.resultDeliveryChannelEnvelopeId);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId/envelopes', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.listEnvelopesForJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/envelopes/:resultDeliveryChannelEnvelopeId/seal', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.sealChannelEnvelope(ctx, req.params.resultDeliveryChannelEnvelopeId);
  sendEnvelope(res, result);
});

router.post('/envelopes/:resultDeliveryChannelEnvelopeId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.blockChannelEnvelope(ctx, req.params.resultDeliveryChannelEnvelopeId);
  sendEnvelope(res, result);
});

router.post('/envelopes/:resultDeliveryChannelEnvelopeId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await envelopeService.voidChannelEnvelope(ctx, req.params.resultDeliveryChannelEnvelopeId);
  sendEnvelope(res, result);
});

// ─── SUPPRESSIONS ──────────────────────────────────────────

router.post('/jobs/:resultDeliveryJobId/suppressions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.suppressDeliveryJob(ctx, {
    ...req.body,
    resultDeliveryJobId: req.params.resultDeliveryJobId,
  });
  sendEnvelope(res, result);
});

router.get('/suppressions/:resultDeliverySuppressionId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.getSuppression(ctx, req.params.resultDeliverySuppressionId);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId/suppressions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.listSuppressionsForJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/suppressions/:resultDeliverySuppressionId/clear', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.clearSuppression(ctx, req.params.resultDeliverySuppressionId);
  sendEnvelope(res, result);
});

router.post('/suppressions/:resultDeliverySuppressionId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await suppressionService.voidSuppression(ctx, req.params.resultDeliverySuppressionId);
  sendEnvelope(res, result);
});

// ─── MOCK ATTEMPTS ─────────────────────────────────────────

router.post('/jobs/:resultDeliveryJobId/mock-attempts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockDispatchService.createMockAttempt(ctx, {
    ...req.body,
    resultDeliveryJobId: req.params.resultDeliveryJobId,
  });
  sendEnvelope(res, result);
});

router.get('/mock-attempts/:resultDeliveryAttemptId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockDispatchService.getMockAttempt(ctx, req.params.resultDeliveryAttemptId);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId/mock-attempts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockDispatchService.listAttemptsForJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultDeliveryAttemptId/dispatch', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockDispatchService.dispatchMockAttempt(ctx, req.params.resultDeliveryAttemptId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultDeliveryAttemptId/complete', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockDispatchService.completeMockAttempt(ctx, req.params.resultDeliveryAttemptId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultDeliveryAttemptId/fail', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockDispatchService.failMockAttempt(ctx, req.params.resultDeliveryAttemptId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultDeliveryAttemptId/cancel', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockDispatchService.cancelMockAttempt(ctx, req.params.resultDeliveryAttemptId);
  sendEnvelope(res, result);
});

router.post('/mock-attempts/:resultDeliveryAttemptId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await mockDispatchService.voidMockAttempt(ctx, req.params.resultDeliveryAttemptId);
  sendEnvelope(res, result);
});

// ─── RECEIPTS ──────────────────────────────────────────────

router.post('/mock-attempts/:resultDeliveryAttemptId/receipts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.recordMockReceipt(ctx, {
    ...req.body,
    resultDeliveryAttemptId: req.params.resultDeliveryAttemptId,
  });
  sendEnvelope(res, result);
});

router.get('/receipts/:resultDeliveryReceiptId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.getReceipt(ctx, req.params.resultDeliveryReceiptId);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId/receipts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.listReceiptsForJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/receipts/:resultDeliveryReceiptId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await receiptService.voidReceipt(ctx, req.params.resultDeliveryReceiptId);
  sendEnvelope(res, result);
});

// ─── RETRY PLANS ───────────────────────────────────────────

router.post('/mock-attempts/:resultDeliveryAttemptId/retry-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.createRetryPlanForMockFailure(ctx, {
    ...req.body,
    resultDeliveryAttemptId: req.params.resultDeliveryAttemptId,
  });
  sendEnvelope(res, result);
});

router.get('/retry-plans/:resultDeliveryRetryPlanId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.getRetryPlan(ctx, req.params.resultDeliveryRetryPlanId);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId/retry-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.listRetryPlansForJob(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.post('/retry-plans/:resultDeliveryRetryPlanId/cancel', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.cancelRetryPlan(ctx, req.params.resultDeliveryRetryPlanId);
  sendEnvelope(res, result);
});

router.post('/retry-plans/:resultDeliveryRetryPlanId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await retryPlanService.voidRetryPlan(ctx, req.params.resultDeliveryRetryPlanId);
  sendEnvelope(res, result);
});

// ─── PROJECTION SAFETY ─────────────────────────────────────

router.get('/jobs/:resultDeliveryJobId/projection/teacher', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await projectionSafetyService.toTeacherProjection(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId/projection/admin', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await projectionSafetyService.toAdminProjection(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId/projection/student-safe', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await projectionSafetyService.toStudentSafeProjection(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

router.get('/jobs/:resultDeliveryJobId/projection/parent-boundary', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await projectionSafetyService.toParentBoundaryProjection(ctx, req.params.resultDeliveryJobId);
  sendEnvelope(res, result);
});

export default router;
