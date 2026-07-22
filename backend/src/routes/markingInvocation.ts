import { Router, Request, Response } from 'express';
import { MarkingInvocationRequestService } from '../domains/assessment/marking-invocation/services/markingInvocationRequestService';
import { SubmittedSnapshotIntakeService } from '../domains/assessment/marking-invocation/services/submittedSnapshotIntakeService';
import { MarkingReadinessCheckService } from '../domains/assessment/marking-invocation/services/markingReadinessCheckService';
import { MarkingBatchPlannerService } from '../domains/assessment/marking-invocation/services/markingBatchPlannerService';
import { DeterministicMarkingInvocationService } from '../domains/assessment/marking-invocation/services/deterministicMarkingInvocationService';
import { MarkingResultVersionBridgeService } from '../domains/assessment/marking-invocation/services/markingResultVersionBridgeService';
import { TeacherReviewDispatchService } from '../domains/assessment/marking-invocation/services/teacherReviewDispatchService';
import { MarkingInvocationProjectionSafetyService } from '../domains/assessment/marking-invocation/services/markingInvocationProjectionSafetyService';
import { MarkingInvocationAuditBridge } from '../domains/assessment/marking-invocation/services/markingInvocationAuditBridge';
import { MarkingInvocationIdempotencyService } from '../domains/assessment/marking-invocation/services/markingInvocationIdempotencyService';
import type { MarkingInvocationRequestRepository } from '../domains/assessment/marking-invocation/contracts/markingInvocationRepositoryContracts';
import type { SubmittedSnapshotIntakeRepository, MarkingBatchRepository, MarkingBatchItemRepository, MarkingResultLinkRepository } from '../domains/assessment/marking-invocation/contracts/markingInvocationRepositoryContracts';

export function createMarkingInvocationRouter(
  invocationRequestRepo: MarkingInvocationRequestRepository,
  snapshotIntakeRepo: SubmittedSnapshotIntakeRepository,
  batchRepo: MarkingBatchRepository,
  batchItemRepo: MarkingBatchItemRepository,
  resultLinkRepo: MarkingResultLinkRepository,
): Router {
  const router = Router();

  const requestService = new MarkingInvocationRequestService(invocationRequestRepo);
  const intakeService = new SubmittedSnapshotIntakeService(snapshotIntakeRepo);
  const readinessCheckService = new MarkingReadinessCheckService();
  const batchPlannerService = new MarkingBatchPlannerService(batchRepo, batchItemRepo);
  const deterministicMarkingService = new DeterministicMarkingInvocationService(batchRepo, batchItemRepo, resultLinkRepo);
  const resultVersionBridgeService = new MarkingResultVersionBridgeService(resultLinkRepo);
  const teacherReviewDispatchService = new TeacherReviewDispatchService(batchItemRepo);
  const projectionSafetyService = new MarkingInvocationProjectionSafetyService();
  const auditBridge = new MarkingInvocationAuditBridge();
  const idempotencyService = new MarkingInvocationIdempotencyService();

interface SafeResponseEnvelope {
  ok: boolean;
  requestId: string;
  correlationId?: string;
  resourceId?: string;
  resourceVersion?: string;
  status?: string;
  safeMessage?: string;
  reasonCode?: string;
  policyDecision?: string;
  nextAllowedActions?: string[];
  data?: unknown;
}

function createSafeResponseEnvelope(req: Request, overrides: Partial<SafeResponseEnvelope>): SafeResponseEnvelope {
  return {
    ok: overrides.ok ?? true,
    requestId: (req as any).requestId || 'unknown',
    correlationId: (req as any).correlationId,
    ...overrides,
  };
}

function extractActorContext(req: Request): { schoolId: string; actorId: string; role: string } {
  const schoolId = (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
  const actorId = (req as any).actorId || (req.headers['x-actor-id'] as string) || '';
  const role = (req as any).role || (req.headers['x-actor-role'] as string) || '';
  return { schoolId, actorId, role };
}

function getIdempotencyKey(req: Request): string | null {
  return (req.headers['idempotency-key'] as string) || (req.body?.idempotencyKey as string) || null;
}

function safeHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (err: any) {
      const message = err.message || 'UNKNOWN_SAFE_ERROR';
      let reasonCode = 'UNKNOWN_SAFE_ERROR';
      let status = 500;
      if (message.startsWith('SCHOOL_CONTEXT_REQUIRED')) { reasonCode = 'SCHOOL_CONTEXT_REQUIRED'; status = 400; }
      else if (message.startsWith('FORBIDDEN')) { reasonCode = 'AUTH_REQUIRED'; status = 403; }
      else if (message.startsWith('POLICY_BLOCKED')) { reasonCode = 'POLICY_BLOCKED'; status = 403; }
      else if (message.startsWith('NOT_FOUND')) { reasonCode = 'NOT_FOUND'; status = 404; }
      else if (message.startsWith('VALIDATION_FAILED')) { reasonCode = 'VALIDATION_FAILED'; status = 400; }
      else if (message.startsWith('IDEMPOTENCY_CONFLICT')) { reasonCode = 'IDEMPOTENCY_CONFLICT'; status = 409; }
      else if (message.startsWith('SNAPSHOT_ALREADY_INTAKEN')) { reasonCode = 'SNAPSHOT_ALREADY_INTAKEN'; status = 409; }
      else if (message.startsWith('UNSUPPORTED_QUESTION_TYPE')) { reasonCode = 'DETERMINISTIC_MARKING_UNSUPPORTED'; status = 400; }
      else if (message.startsWith('DEPENDENCY_DEFERRED')) { reasonCode = 'AI_MARKING_DEFERRED'; status = 501; }
      res.status(status).json(createSafeResponseEnvelope(req, { ok: false, reasonCode, safeMessage: message, status: 'error' }));
    }
  };
}

// POST /api/question-bank/marking-invocation/requests
router.post('/requests', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { deliverySessionId, paperId, paperVersionId, invocationMode, sourceType, submittedSnapshotRefs, safeRequestSummary } = req.body;
  if (!deliverySessionId || !paperId || !paperVersionId) throw new Error('VALIDATION_FAILED: deliverySessionId, paperId, and paperVersionId are required');
  const request = await requestService.createInvocationRequest({
    schoolId, deliverySessionId, paperId, paperVersionId,
    requestedByActorId: actorId, requestedByRole: role,
    invocationMode: invocationMode || 'deterministic_plus_teacher_review',
    sourceType: sourceType || 'delivery_session_snapshot_batch',
    submittedSnapshotRefs: submittedSnapshotRefs || [],
    safeRequestSummary: safeRequestSummary || '',
  });
  await auditBridge.recordInvocationCreated(schoolId, actorId, role, request.markingInvocationRequestId, req.headers['x-correlation-id'] as string || '');
  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: request.markingInvocationRequestId, status: request.invocationStatus, data: request }));
}));

// GET /api/question-bank/marking-invocation/requests/:markingInvocationRequestId
router.get('/requests/:markingInvocationRequestId', safeHandler(async (req: Request, res: Response) => {
  const request = await requestService.getInvocationRequest(req.params.markingInvocationRequestId);
  if (!request) throw new Error('NOT_FOUND: Marking invocation request not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: request.markingInvocationRequestId, status: request.invocationStatus, data: request }));
}));

// GET /api/question-bank/marking-invocation/requests
router.get('/requests', safeHandler(async (req: Request, res: Response) => {
  const { schoolId } = extractActorContext(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  const requests = await requestService.listInvocationRequestsForSchool(schoolId);
  res.json(createSafeResponseEnvelope(req, { data: requests }));
}));

// POST /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/validate
router.post('/requests/:markingInvocationRequestId/validate', safeHandler(async (req: Request, res: Response) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const request = await requestService.validateInvocationRequest(req.params.markingInvocationRequestId);
  res.json(createSafeResponseEnvelope(req, { resourceId: request.markingInvocationRequestId, status: request.invocationStatus, data: request }));
}));

// POST /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/queue
router.post('/requests/:markingInvocationRequestId/queue', safeHandler(async (req: Request, res: Response) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const request = await requestService.queueInvocationRequest(req.params.markingInvocationRequestId);
  res.json(createSafeResponseEnvelope(req, { resourceId: request.markingInvocationRequestId, status: request.invocationStatus, data: request }));
}));

// POST /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/cancel
router.post('/requests/:markingInvocationRequestId/cancel', safeHandler(async (req: Request, res: Response) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const request = await requestService.cancelInvocationRequest(req.params.markingInvocationRequestId);
  res.json(createSafeResponseEnvelope(req, { resourceId: request.markingInvocationRequestId, status: request.invocationStatus, data: request }));
}));

// POST /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/intake-snapshots
router.post('/requests/:markingInvocationRequestId/intake-snapshots', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { snapshots } = req.body;
  if (!Array.isArray(snapshots) || snapshots.length === 0) throw new Error('VALIDATION_FAILED: snapshots array required');
  const intakes = [];
  for (const s of snapshots) {
    const intake = await intakeService.intakeSubmissionSnapshot({
      schoolId,
      markingInvocationRequestId: req.params.markingInvocationRequestId,
      submissionSnapshotId: s.submissionSnapshotId,
      attemptId: s.attemptId || '',
      deliverySessionId: s.deliverySessionId || '',
      paperId: s.paperId || '',
      paperVersionId: s.paperVersionId || '',
      variantId: s.variantId || '',
      studentRef: s.studentRef || '',
      submittedAnswerCount: s.submittedAnswerCount || 0,
      questionSnapshotCount: s.questionSnapshotCount || 0,
      totalMarksAvailable: s.totalMarksAvailable || 0,
      snapshotStatus: s.snapshotStatus || 'draft',
    });
    intakes.push(intake);
  }
  await auditBridge.recordSnapshotIntaken(schoolId, actorId, role, req.params.markingInvocationRequestId, 'batch');
  res.status(201).json(createSafeResponseEnvelope(req, { data: intakes }));
}));

// GET /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/intake-snapshots
router.get('/requests/:markingInvocationRequestId/intake-snapshots', safeHandler(async (req: Request, res: Response) => {
  const intakes = await intakeService.listSnapshotIntakesForInvocation(req.params.markingInvocationRequestId);
  res.json(createSafeResponseEnvelope(req, { data: intakes }));
}));

// GET /api/question-bank/marking-invocation/intake-snapshots/:snapshotIntakeId
router.get('/intake-snapshots/:snapshotIntakeId', safeHandler(async (req: Request, res: Response) => {
  const intake = await intakeService.getSnapshotIntake(req.params.snapshotIntakeId);
  if (!intake) throw new Error('NOT_FOUND: Snapshot intake not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: intake.snapshotIntakeId, status: intake.intakeStatus, data: intake }));
}));

// POST /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/readiness-checks
router.post('/requests/:markingInvocationRequestId/readiness-checks', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const check = await readinessCheckService.runMarkingPolicyReadinessCheck(schoolId, req.params.markingInvocationRequestId);
  await auditBridge.recordReadinessChecked(schoolId, actorId, role, req.params.markingInvocationRequestId, check.checkType);
  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: check.markingReadinessCheckId, status: check.checkStatus, data: check }));
}));

// GET /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/readiness-checks
router.get('/requests/:markingInvocationRequestId/readiness-checks', safeHandler(async (req: Request, res: Response) => {
  const checks = await readinessCheckService.listReadinessChecksForInvocation(req.params.markingInvocationRequestId);
  res.json(createSafeResponseEnvelope(req, { data: checks }));
}));

// POST /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/batches
router.post('/requests/:markingInvocationRequestId/batches', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { markingRunId, batchMode, batchSequence, safeBatchSummary } = req.body;
  if (!markingRunId) throw new Error('VALIDATION_FAILED: markingRunId is required');
  const batch = await batchPlannerService.createMarkingBatch({
    schoolId,
    markingInvocationRequestId: req.params.markingInvocationRequestId,
    markingRunId,
    batchMode: batchMode || 'deterministic_plus_teacher_review',
    batchSequence: batchSequence || 1,
    safeBatchSummary: safeBatchSummary || '',
  });
  await auditBridge.recordBatchPlanned(schoolId, actorId, role, req.params.markingInvocationRequestId, batch.markingBatchId);
  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: batch.markingBatchId, status: batch.batchStatus, data: batch }));
}));

// GET /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/batches
router.get('/requests/:markingInvocationRequestId/batches', safeHandler(async (req: Request, res: Response) => {
  const batches = await batchPlannerService.listBatchesForInvocation(req.params.markingInvocationRequestId);
  res.json(createSafeResponseEnvelope(req, { data: batches }));
}));

// GET /api/question-bank/marking-invocation/batches/:markingBatchId
router.get('/batches/:markingBatchId', safeHandler(async (req: Request, res: Response) => {
  const batch = await batchPlannerService.getBatch(req.params.markingBatchId);
  if (!batch) throw new Error('NOT_FOUND: Batch not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: batch.markingBatchId, status: batch.batchStatus, data: batch }));
}));

// GET /api/question-bank/marking-invocation/batches/:markingBatchId/items
router.get('/batches/:markingBatchId/items', safeHandler(async (req: Request, res: Response) => {
  const items = await batchItemRepo.findByBatchId(req.params.markingBatchId);
  res.json(createSafeResponseEnvelope(req, { data: items }));
}));

// POST /api/question-bank/marking-invocation/batches/:markingBatchId/queue
router.post('/batches/:markingBatchId/queue', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const batch = await batchPlannerService.queueBatch(req.params.markingBatchId);
  await auditBridge.recordBatchQueued(schoolId, actorId, role, '', batch.markingBatchId);
  res.json(createSafeResponseEnvelope(req, { resourceId: batch.markingBatchId, status: batch.batchStatus, data: batch }));
}));

// POST /api/question-bank/marking-invocation/batches/:markingBatchId/execute-deterministic
router.post('/batches/:markingBatchId/execute-deterministic', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { markingRunId } = req.body;
  if (!markingRunId) throw new Error('VALIDATION_FAILED: markingRunId is required');
  const result = await deterministicMarkingService.executeDeterministicBatch(req.params.markingBatchId, markingRunId);
  for (const item of result.markedItems) {
    await auditBridge.recordBatchItemMarked(schoolId, actorId, role, '', item.markingBatchItemId);
  }
  res.json(createSafeResponseEnvelope(req, { resourceId: result.batch.markingBatchId, status: result.batch.batchStatus, data: result }));
}));

// POST /api/question-bank/marking-invocation/batch-items/:markingBatchItemId/execute-deterministic
router.post('/batch-items/:markingBatchItemId/execute-deterministic', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const item = await deterministicMarkingService.executeDeterministicBatchItem(req.params.markingBatchItemId);
  await auditBridge.recordBatchItemMarked(schoolId, actorId, role, '', item.markingBatchItemId);
  res.json(createSafeResponseEnvelope(req, { resourceId: item.markingBatchItemId, status: item.itemStatus, data: item }));
}));

// POST /api/question-bank/marking-invocation/batch-items/:markingBatchItemId/dispatch-teacher-review
router.post('/batch-items/:markingBatchItemId/dispatch-teacher-review', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const result = await teacherReviewDispatchService.dispatchBatchItemToTeacherReview(req.params.markingBatchItemId);
  await auditBridge.recordBatchItemDispatchedToTeacherReview(schoolId, actorId, role, '', result.item.markingBatchItemId);
  res.json(createSafeResponseEnvelope(req, { resourceId: result.item.markingBatchItemId, status: result.item.itemStatus, data: result.preview }));
}));

// GET /api/question-bank/marking-invocation/batch-items/:markingBatchItemId/result-links
router.get('/batch-items/:markingBatchItemId/result-links', safeHandler(async (req: Request, res: Response) => {
  const links = await resultVersionBridgeService.getResultLinksForBatch(req.params.markingBatchItemId);
  res.json(createSafeResponseEnvelope(req, { data: links }));
}));

// GET /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/result-links
router.get('/requests/:markingInvocationRequestId/result-links', safeHandler(async (req: Request, res: Response) => {
  const links = await resultVersionBridgeService.getResultLinksForInvocation(req.params.markingInvocationRequestId);
  res.json(createSafeResponseEnvelope(req, { data: links }));
}));

// GET /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/projection/teacher
router.get('/requests/:markingInvocationRequestId/projection/teacher', safeHandler(async (req: Request, res: Response) => {
  const request = await requestService.getInvocationRequest(req.params.markingInvocationRequestId);
  if (!request) throw new Error('NOT_FOUND: Marking invocation request not found');
  const intakes = await intakeService.listSnapshotIntakesForInvocation(req.params.markingInvocationRequestId);
  const batches = await batchPlannerService.listBatchesForInvocation(req.params.markingInvocationRequestId);
  const projection = projectionSafetyService.toTeacherProjection(request, intakes, batches);
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

// GET /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/projection/admin
router.get('/requests/:markingInvocationRequestId/projection/admin', safeHandler(async (req: Request, res: Response) => {
  const request = await requestService.getInvocationRequest(req.params.markingInvocationRequestId);
  if (!request) throw new Error('NOT_FOUND: Marking invocation request not found');
  const intakes = await intakeService.listSnapshotIntakesForInvocation(req.params.markingInvocationRequestId);
  const batches = await batchPlannerService.listBatchesForInvocation(req.params.markingInvocationRequestId);
  let allItems: any[] = [];
  for (const b of batches) {
    const items = await batchItemRepo.findByBatchId(b.markingBatchId);
    allItems = allItems.concat(items);
  }
  const resultLinks = await resultVersionBridgeService.getResultLinksForInvocation(req.params.markingInvocationRequestId);
  const projection = projectionSafetyService.toAdminProjection(request, intakes, batches, allItems, resultLinks, 0);
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

// GET /api/question-bank/marking-invocation/requests/:markingInvocationRequestId/projection/student-safe
router.get('/requests/:markingInvocationRequestId/projection/student-safe', safeHandler(async (req: Request, res: Response) => {
  const request = await requestService.getInvocationRequest(req.params.markingInvocationRequestId);
  if (!request) throw new Error('NOT_FOUND: Marking invocation request not found');
  const intakes = await intakeService.listSnapshotIntakesForInvocation(req.params.markingInvocationRequestId);
  const projections = intakes.map(i => projectionSafetyService.toStudentSafeProjection(i));
  for (const p of projections) {
    const safe = projectionSafetyService.assertNoAnswerKeyLeakage(p) && projectionSafetyService.assertNoRubricLeakage(p) && projectionSafetyService.assertNoTeacherOnlyLeakage(p) && projectionSafetyService.assertNoHiddenReasoningLeakage(p) && projectionSafetyService.assertNoFinalGradeLeakage(p) && projectionSafetyService.assertNoParentReleaseLeakage(p) && projectionSafetyService.assertNoMasteryMutationLeakage(p);
    if (!safe) throw new Error('FORBIDDEN_FIELD: Student-safe projection contains forbidden fields');
  }
  res.json(createSafeResponseEnvelope(req, { data: projections }));
}));

  return router;
}
