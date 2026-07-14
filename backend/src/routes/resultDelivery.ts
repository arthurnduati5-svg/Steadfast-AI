import { Router, Request, Response } from 'express';
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

const jobRepo = new InMemoryResultDeliveryJobRepository();
const recipientRepo = new InMemoryResultDeliveryRecipientRepository();
const envelopeRepo = new InMemoryResultDeliveryChannelEnvelopeRepository();
const suppressionRepo = new InMemoryResultDeliverySuppressionRepository();
const attemptRepo = new InMemoryResultDeliveryAttemptRepository();
const receiptRepo = new InMemoryResultDeliveryReceiptRepository();
const retryPlanRepo = new InMemoryResultDeliveryRetryPlanRepository();
const mockProviderRepo = new InMemoryResultDeliveryMockProviderRepository();
const auditRepo = new InMemoryResultDeliveryAuditRepository();
const idempotencyRepo = new InMemoryResultDeliveryIdempotencyRepository();

const auditBridge = new ResultDeliveryAuditBridge(auditRepo);
const idempotencyService = new ResultDeliveryIdempotencyService(idempotencyRepo);
const deliveryJobService = new ResultDeliveryJobService(jobRepo, recipientRepo, envelopeRepo, suppressionRepo, attemptRepo, auditBridge, idempotencyService);
const recipientResolver = new ResultDeliveryRecipientResolver(recipientRepo, auditBridge, idempotencyService);
const envelopeService = new ResultDeliveryEnvelopeService(envelopeRepo, auditBridge, idempotencyService);
const suppressionService = new ResultDeliverySuppressionService(suppressionRepo, auditBridge, idempotencyService);
const mockDispatchService = new ResultDeliveryMockDispatchService(attemptRepo, envelopeRepo, suppressionRepo, auditBridge, idempotencyService);
const receiptService = new ResultDeliveryReceiptService(receiptRepo, auditBridge, idempotencyService);
const retryPlanService = new ResultDeliveryRetryPlanService(retryPlanRepo, auditBridge, idempotencyService);
const projectionSafetyService = new ResultDeliveryProjectionSafetyService(jobRepo, envelopeRepo, attemptRepo, receiptRepo);

function extractContext(req: Request): ResultDeliveryCommandContext {
  return {
    schoolId: (req as any).schoolId || (req as any).user?.schoolId || 'test-school',
    actorId: (req as any).user?.id || 'test-actor',
    actorRole: (req as any).user?.role || 'admin',
    correlationId: (req as any).correlationId || 'test-correlation',
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
