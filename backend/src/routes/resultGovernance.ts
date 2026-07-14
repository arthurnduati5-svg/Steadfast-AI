import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { ResultFinalizationReviewService } from '../domains/assessment/result-governance/services/resultFinalizationReviewService';
import { ResultFinalizationDecisionService } from '../domains/assessment/result-governance/services/resultFinalizationDecisionService';
import { ResultReleaseReadinessService } from '../domains/assessment/result-governance/services/resultReleaseReadinessService';
import { ResultReleaseBoundaryService } from '../domains/assessment/result-governance/services/resultReleaseBoundaryService';
import { ResultRegradeRequestService, ResultRegradeIntakeService } from '../domains/assessment/result-governance/services/resultRegradeRequestService';
import { ResultGovernanceProjectionSafetyService } from '../domains/assessment/result-governance/services/resultGovernanceProjectionSafetyService';
import { ResultGovernanceAuditBridge } from '../domains/assessment/result-governance/services/resultGovernanceAuditBridge';
import { ResultGovernanceIdempotencyService } from '../domains/assessment/result-governance/services/resultGovernanceIdempotencyService';
import { ResultGovernancePolicyRegistry } from '../domains/assessment/result-governance/policies/resultGovernancePolicyDefinitions';

import {
  InMemoryResultFinalizationReviewRepository,
  InMemoryResultFinalizationDecisionRepository,
  InMemoryResultReleaseReadinessRepository,
  InMemoryResultReleaseBoundaryRepository,
  InMemoryResultRegradeRequestRepository,
  InMemoryResultRegradeIntakeRepository,
  InMemoryResultGovernanceAuditRepository,
  InMemoryResultGovernanceIdempotencyRepository,
} from '../domains/assessment/result-governance/repositories/inMemoryResultGovernanceRepositories';

const router = Router();

const reviewRepo = new InMemoryResultFinalizationReviewRepository();
const decisionRepo = new InMemoryResultFinalizationDecisionRepository();
const readinessRepo = new InMemoryResultReleaseReadinessRepository();
const boundaryRepo = new InMemoryResultReleaseBoundaryRepository();
const regradeRequestRepo = new InMemoryResultRegradeRequestRepository();
const regradeIntakeRepo = new InMemoryResultRegradeIntakeRepository();
const auditRepo = new InMemoryResultGovernanceAuditRepository();
const idempotencyRepo = new InMemoryResultGovernanceIdempotencyRepository();

const policyRegistry = new ResultGovernancePolicyRegistry();

const reviewService = new ResultFinalizationReviewService(reviewRepo, policyRegistry);
const decisionService = new ResultFinalizationDecisionService(decisionRepo, reviewRepo, policyRegistry);
const readinessService = new ResultReleaseReadinessService(readinessRepo, decisionRepo, policyRegistry);
const boundaryService = new ResultReleaseBoundaryService(boundaryRepo, readinessRepo, policyRegistry);
const regradeRequestService = new ResultRegradeRequestService(regradeRequestRepo, policyRegistry);
const regradeIntakeService = new ResultRegradeIntakeService(regradeIntakeRepo, regradeRequestRepo, policyRegistry);
const projectionSafetyService = new ResultGovernanceProjectionSafetyService();
const auditBridge = new ResultGovernanceAuditBridge(auditRepo);
const idempotencyService = new ResultGovernanceIdempotencyService(idempotencyRepo);

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
    correlationId: (req as any).correlationId || (req.headers['x-correlation-id'] as string) || undefined,
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
      else if (message.startsWith('FINALIZATION_BLOCKED')) { reasonCode = 'FINALIZATION_BLOCKED'; status = 403; }
      else if (message.startsWith('TEACHER_REVIEW_UNRESOLVED')) { reasonCode = 'TEACHER_REVIEW_UNRESOLVED'; status = 400; }
      else if (message.startsWith('MODERATION_UNRESOLVED')) { reasonCode = 'MODERATION_UNRESOLVED'; status = 400; }
      else if (message.startsWith('FORBIDDEN_FIELD')) { reasonCode = 'FORBIDDEN_FIELD'; status = 403; }
      else if (message.startsWith('PACKAGE_5_RESULT_NOT_FOUND')) { reasonCode = 'PACKAGE_5_RESULT_NOT_FOUND'; status = 404; }
      else if (message.startsWith('PACKAGE_8_INVOCATION_NOT_FOUND')) { reasonCode = 'PACKAGE_8_INVOCATION_NOT_FOUND'; status = 404; }
      else if (message.startsWith('RESULT_VERSION_NOT_READY')) { reasonCode = 'RESULT_VERSION_NOT_READY'; status = 400; }
      else if (message.startsWith('RELEASE_READINESS_BLOCKED')) { reasonCode = 'RELEASE_READINESS_BLOCKED'; status = 403; }
      else if (message.startsWith('PARENT_RELEASE_DEFERRED')) { reasonCode = 'PARENT_RELEASE_DEFERRED'; status = 501; }
      else if (message.startsWith('PARENT_NOTIFICATION_DEFERRED')) { reasonCode = 'PARENT_NOTIFICATION_DEFERRED'; status = 501; }
      else if (message.startsWith('REGRADE_EXECUTION_DEFERRED')) { reasonCode = 'REGRADE_EXECUTION_DEFERRED'; status = 501; }
      else if (message.startsWith('AI_MARKING_DEFERRED')) { reasonCode = 'AI_MARKING_DEFERRED'; status = 501; }
      else if (message.startsWith('OCR_DEFERRED')) { reasonCode = 'OCR_DEFERRED'; status = 501; }
      else if (message.startsWith('MASTERY_MUTATION_DEFERRED')) { reasonCode = 'MASTERY_MUTATION_DEFERRED'; status = 501; }
      res.status(status).json(createSafeResponseEnvelope(req, { ok: false, reasonCode, safeMessage: message, status: 'error' }));
    }
  };
}

// ─── Finalization Reviews ──────────────────────────────────────────

router.post('/finalization-reviews', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');

  const idempotencyCheck = await idempotencyService.startOperation({ schoolId, operation: 'create_finalization_review', idempotencyKey, requestBody: req.body });
  if (!idempotencyCheck.ok && idempotencyCheck.existing) {
    res.status(200).json(createSafeResponseEnvelope(req, {
      resourceId: idempotencyCheck.existing.resourceId,
      resourceVersion: '1',
      status: 'completed',
      safeMessage: 'Operation already completed',
      data: { existingResult: true },
    }));
    return;
  }

  const { markingInvocationRequestId, markingRunId, deliverySessionId, paperId, paperVersionId, reviewMode, reviewedResultVersionRefs, requiredCheckRefs, safeReviewSummary } = req.body;
  const review = await reviewService.createFinalizationReview({
    schoolId, markingInvocationRequestId, markingRunId, deliverySessionId, paperId, paperVersionId,
    reviewMode: reviewMode || 'teacher_reviewed',
    reviewedResultVersionRefs,
    requiredCheckRefs,
    safeReviewSummary,
    actorId, actorRole: role,
  }, (req as any).correlationId || '');

  await auditBridge.recordFinalizationReviewCreated({ schoolId, resultFinalizationReviewId: review.resultFinalizationReviewId, actorId, actorRole: role, correlationId: (req as any).correlationId, requestId: (req as any).requestId });
  await idempotencyService.completeOperation({ schoolId, operation: 'create_finalization_review', idempotencyKey, resourceType: 'ResultFinalizationReview', resourceId: review.resultFinalizationReviewId, safeResultSummary: review.safeReviewSummary });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: review.resultFinalizationReviewId, status: review.reviewStatus, safeMessage: 'Finalization review created', data: review }));
}));

router.get('/finalization-reviews/:resultFinalizationReviewId', safeHandler(async (req: Request, res: Response) => {
  const review = await reviewService.getFinalizationReview(req.params.resultFinalizationReviewId);
  if (!review) throw new Error('NOT_FOUND: finalization review not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: review.resultFinalizationReviewId, status: review.reviewStatus, data: review }));
}));

router.get('/finalization-reviews', safeHandler(async (req: Request, res: Response) => {
  const { schoolId } = extractActorContext(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  const reviews = await reviewService.listFinalizationReviewsForSchool(schoolId);
  res.json(createSafeResponseEnvelope(req, { data: reviews }));
}));

router.post('/finalization-reviews/:resultFinalizationReviewId/run-checks', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const result = await reviewService.runFinalizationReadinessChecks(req.params.resultFinalizationReviewId, role);
  await auditBridge.recordFinalizationReadinessChecked({
    schoolId: req.body.schoolId || (req as any).schoolId || '',
    resultFinalizationReviewId: req.params.resultFinalizationReviewId,
    actorId: (req as any).actorId || '',
    actorRole: role,
    allPassed: result.allChecksPassed,
    blockingReasonCodes: result.blockingReasonCodes,
  });
  res.json(createSafeResponseEnvelope(req, { status: result.allChecksPassed ? 'passed' : 'blocked', safeMessage: result.safeSummary, data: result }));
}));

router.post('/finalization-reviews/:resultFinalizationReviewId/ready-for-decision', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const review = await reviewService.markReviewReadyForDecision(req.params.resultFinalizationReviewId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: review?.resultFinalizationReviewId, status: review?.reviewStatus, safeMessage: 'Review marked ready for decision' }));
}));

router.post('/finalization-reviews/:resultFinalizationReviewId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const review = await reviewService.blockFinalizationReview(req.params.resultFinalizationReviewId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: review?.resultFinalizationReviewId, status: review?.reviewStatus, safeMessage: 'Review blocked' }));
}));

router.post('/finalization-reviews/:resultFinalizationReviewId/cancel', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const review = await reviewService.cancelFinalizationReview(req.params.resultFinalizationReviewId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: review?.resultFinalizationReviewId, status: review?.reviewStatus, safeMessage: 'Review cancelled' }));
}));

router.post('/finalization-reviews/:resultFinalizationReviewId/complete', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const review = await reviewService.completeFinalizationReview(req.params.resultFinalizationReviewId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: review?.resultFinalizationReviewId, status: review?.reviewStatus, safeMessage: 'Review completed' }));
}));

// ─── Finalization Decisions ────────────────────────────────────────

router.post('/finalization-reviews/:resultFinalizationReviewId/decisions', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');

  const idempotencyCheck = await idempotencyService.startOperation({ schoolId, operation: 'create_finalization_decision', idempotencyKey, requestBody: req.body });
  if (!idempotencyCheck.ok && idempotencyCheck.existing) {
    res.status(200).json(createSafeResponseEnvelope(req, { resourceId: idempotencyCheck.existing.resourceId, status: 'completed', safeMessage: 'Operation already completed' }));
    return;
  }

  const { decisionStatus, decisionType, safeDecisionSummary, reasonCodes, affectedResultVersionRefs } = req.body;
  const decision = await decisionService.createFinalizationDecision({
    schoolId, resultFinalizationReviewId: req.params.resultFinalizationReviewId,
    decisionStatus, decisionType,
    decidedByActorId: actorId, decidedByRole: role,
    safeDecisionSummary, reasonCodes, affectedResultVersionRefs,
  });

  await auditBridge.recordFinalizationDecisionCreated({ schoolId, resultFinalizationDecisionId: decision.resultFinalizationDecisionId, resultFinalizationReviewId: req.params.resultFinalizationReviewId, actorId, actorRole: role, decisionStatus: decision.decisionStatus });
  await idempotencyService.completeOperation({ schoolId, operation: 'create_finalization_decision', idempotencyKey, resourceType: 'ResultFinalizationDecision', resourceId: decision.resultFinalizationDecisionId, safeResultSummary: decision.safeDecisionSummary });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: decision.resultFinalizationDecisionId, status: decision.decisionStatus, safeMessage: 'Finalization decision created', data: decision }));
}));

router.get('/finalization-reviews/:resultFinalizationReviewId/decisions', safeHandler(async (req: Request, res: Response) => {
  const decisions = await decisionService.listDecisionsForReview(req.params.resultFinalizationReviewId);
  res.json(createSafeResponseEnvelope(req, { data: decisions }));
}));

router.get('/decisions/:resultFinalizationDecisionId', safeHandler(async (req: Request, res: Response) => {
  const decision = await decisionService.getFinalizationDecision(req.params.resultFinalizationDecisionId);
  if (!decision) throw new Error('NOT_FOUND: finalization decision not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: decision.resultFinalizationDecisionId, status: decision.decisionStatus, data: decision }));
}));

router.post('/decisions/:resultFinalizationDecisionId/approve', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const decision = await decisionService.approveForFinalization(req.params.resultFinalizationDecisionId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: decision?.resultFinalizationDecisionId, status: decision?.decisionStatus, safeMessage: 'Decision approved for finalization' }));
}));

router.post('/decisions/:resultFinalizationDecisionId/return-for-review', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const decision = await decisionService.returnForReview(req.params.resultFinalizationDecisionId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: decision?.resultFinalizationDecisionId, status: decision?.decisionStatus, safeMessage: 'Decision returned for review' }));
}));

router.post('/decisions/:resultFinalizationDecisionId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const decision = await decisionService.blockFinalizationDecision(req.params.resultFinalizationDecisionId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: decision?.resultFinalizationDecisionId, status: decision?.decisionStatus, safeMessage: 'Decision blocked' }));
}));

router.post('/decisions/:resultFinalizationDecisionId/void', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const decision = await decisionService.voidFinalizationDecision(req.params.resultFinalizationDecisionId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: decision?.resultFinalizationDecisionId, status: decision?.decisionStatus, safeMessage: 'Decision voided' }));
}));

// ─── Release Readiness ─────────────────────────────────────────────

router.post('/decisions/:resultFinalizationDecisionId/release-readiness', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');

  const { releaseAudienceType, safeReadinessSummary, resultFinalizationReviewId } = req.body;
  const readiness = await readinessService.createReleaseReadiness({
    schoolId, resultFinalizationDecisionId: req.params.resultFinalizationDecisionId,
    resultFinalizationReviewId,
    releaseAudienceType: releaseAudienceType || 'internal_school',
    safeReadinessSummary, actorId, actorRole: role,
  });

  await auditBridge.recordReleaseReadinessCreated({ schoolId, resultReleaseReadinessId: readiness.resultReleaseReadinessId, resultFinalizationDecisionId: req.params.resultFinalizationDecisionId, actorId, actorRole: role });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: readiness.resultReleaseReadinessId, status: readiness.releaseReadinessStatus, safeMessage: 'Release readiness created', data: readiness }));
}));

router.get('/release-readiness/:resultReleaseReadinessId', safeHandler(async (req: Request, res: Response) => {
  const readiness = await readinessService.getReleaseReadiness(req.params.resultReleaseReadinessId);
  if (!readiness) throw new Error('NOT_FOUND: release readiness not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: readiness.resultReleaseReadinessId, status: readiness.releaseReadinessStatus, data: readiness }));
}));

router.get('/decisions/:resultFinalizationDecisionId/release-readiness', safeHandler(async (req: Request, res: Response) => {
  const list = await readinessService.listReadinessForDecision(req.params.resultFinalizationDecisionId);
  res.json(createSafeResponseEnvelope(req, { data: list }));
}));

router.post('/release-readiness/:resultReleaseReadinessId/evaluate-internal', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const readiness = await readinessService.evaluateInternalReleaseReadiness(req.params.resultReleaseReadinessId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: readiness?.resultReleaseReadinessId, status: readiness?.releaseReadinessStatus, safeMessage: 'Internal release readiness evaluated' }));
}));

router.post('/release-readiness/:resultReleaseReadinessId/evaluate-student', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const readiness = await readinessService.evaluateStudentReleaseReadiness(req.params.resultReleaseReadinessId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: readiness?.resultReleaseReadinessId, status: readiness?.releaseReadinessStatus, safeMessage: 'Student release readiness evaluated' }));
}));

router.post('/release-readiness/:resultReleaseReadinessId/evaluate-parent-boundary', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const readiness = await readinessService.evaluateParentBoundaryReadiness(req.params.resultReleaseReadinessId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: readiness?.resultReleaseReadinessId, status: readiness?.releaseReadinessStatus, safeMessage: 'Parent boundary readiness evaluated' }));
}));

router.post('/release-readiness/:resultReleaseReadinessId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const readiness = await readinessService.blockReleaseReadiness(req.params.resultReleaseReadinessId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: readiness?.resultReleaseReadinessId, status: readiness?.releaseReadinessStatus, safeMessage: 'Release readiness blocked' }));
}));

router.post('/release-readiness/:resultReleaseReadinessId/expire', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const readiness = await readinessService.expireReleaseReadiness(req.params.resultReleaseReadinessId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: readiness?.resultReleaseReadinessId, status: readiness?.releaseReadinessStatus, safeMessage: 'Release readiness expired' }));
}));

// ─── Release Boundaries ────────────────────────────────────────────

router.post('/release-readiness/:resultReleaseReadinessId/boundaries', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');

  const { audienceType, safeBoundarySummary, allowedFields, blockedFields, redactionRules, resultFinalizationDecisionId } = req.body;
  const boundary = await boundaryService.createReleaseBoundary({
    schoolId, resultReleaseReadinessId: req.params.resultReleaseReadinessId,
    resultFinalizationDecisionId,
    audienceType: audienceType || 'student',
    safeBoundarySummary,
    allowedFields, blockedFields, redactionRules,
    actorId, actorRole: role,
  });

  await auditBridge.recordReleaseBoundaryCreated({ schoolId, resultReleaseBoundaryId: boundary.resultReleaseBoundaryId, resultReleaseReadinessId: req.params.resultReleaseReadinessId, actorId, actorRole: role });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: boundary.resultReleaseBoundaryId, status: boundary.boundaryStatus, safeMessage: 'Release boundary created', data: boundary }));
}));

router.get('/boundaries/:resultReleaseBoundaryId', safeHandler(async (req: Request, res: Response) => {
  const boundary = await boundaryService.getReleaseBoundary(req.params.resultReleaseBoundaryId);
  if (!boundary) throw new Error('NOT_FOUND: release boundary not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: boundary.resultReleaseBoundaryId, status: boundary.boundaryStatus, data: boundary }));
}));

router.get('/release-readiness/:resultReleaseReadinessId/boundaries', safeHandler(async (req: Request, res: Response) => {
  const boundaries = await boundaryService.listBoundariesForReadiness(req.params.resultReleaseReadinessId);
  res.json(createSafeResponseEnvelope(req, { data: boundaries }));
}));

router.post('/boundaries/:resultReleaseBoundaryId/activate', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const boundary = await boundaryService.activateReleaseBoundary(req.params.resultReleaseBoundaryId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: boundary?.resultReleaseBoundaryId, status: boundary?.boundaryStatus, safeMessage: 'Boundary activated' }));
}));

router.post('/boundaries/:resultReleaseBoundaryId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const boundary = await boundaryService.blockReleaseBoundary(req.params.resultReleaseBoundaryId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: boundary?.resultReleaseBoundaryId, status: boundary?.boundaryStatus, safeMessage: 'Boundary blocked' }));
}));

router.post('/boundaries/:resultReleaseBoundaryId/void', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const boundary = await boundaryService.voidReleaseBoundary(req.params.resultReleaseBoundaryId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: boundary?.resultReleaseBoundaryId, status: boundary?.boundaryStatus, safeMessage: 'Boundary voided' }));
}));

// ─── Regrade Requests ──────────────────────────────────────────────

router.post('/regrade-requests', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');

  const { resultFinalizationDecisionId, markingResultVersionId, markingRunId, studentRef, requestType, safeRequestSummary, reasonCodes } = req.body;
  const request = await regradeRequestService.createRegradeRequest({
    schoolId, resultFinalizationDecisionId, markingResultVersionId, markingRunId,
    studentRef, requesterActorId: actorId, requesterRole: role,
    requestType, safeRequestSummary, reasonCodes,
  });

  await auditBridge.recordRegradeRequestCreated({ schoolId, resultRegradeRequestId: request.resultRegradeRequestId, resultFinalizationDecisionId, actorId, actorRole: role });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: request.resultRegradeRequestId, status: request.requestStatus, safeMessage: 'Regrade request created', data: request }));
}));

router.get('/regrade-requests/:resultRegradeRequestId', safeHandler(async (req: Request, res: Response) => {
  const request = await regradeRequestService.getRegradeRequest(req.params.resultRegradeRequestId);
  if (!request) throw new Error('NOT_FOUND: regrade request not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: request.resultRegradeRequestId, status: request.requestStatus, data: request }));
}));

router.get('/regrade-requests', safeHandler(async (req: Request, res: Response) => {
  const { schoolId } = extractActorContext(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  const { studentRef, markingResultVersionId } = req.query;
  let requests;
  if (studentRef) {
    requests = await regradeRequestService.listRegradeRequestsForStudent(schoolId, studentRef as string);
  } else if (markingResultVersionId) {
    requests = await regradeRequestService.listRegradeRequestsForResultVersion(markingResultVersionId as string);
  } else {
    requests = await regradeRequestService.listRegradeRequestsForSchool(schoolId);
  }
  res.json(createSafeResponseEnvelope(req, { data: requests }));
}));

router.post('/regrade-requests/:resultRegradeRequestId/cancel', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const request = await regradeRequestService.cancelRegradeRequest(req.params.resultRegradeRequestId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: request?.resultRegradeRequestId, status: request?.requestStatus, safeMessage: 'Regrade request cancelled' }));
}));

router.post('/regrade-requests/:resultRegradeRequestId/reject', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const request = await regradeRequestService.rejectRegradeRequest(req.params.resultRegradeRequestId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: request?.resultRegradeRequestId, status: request?.requestStatus, safeMessage: 'Regrade request rejected' }));
}));

router.post('/regrade-requests/:resultRegradeRequestId/accept-for-review', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const request = await regradeRequestService.acceptRegradeRequestForReview(req.params.resultRegradeRequestId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: request?.resultRegradeRequestId, status: request?.requestStatus, safeMessage: 'Regrade request accepted for review' }));
}));

router.post('/regrade-requests/:resultRegradeRequestId/resolve-without-change', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const request = await regradeRequestService.resolveWithoutChange(req.params.resultRegradeRequestId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: request?.resultRegradeRequestId, status: request?.requestStatus, safeMessage: 'Regrade request resolved without change' }));
}));

router.post('/regrade-requests/:resultRegradeRequestId/defer', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const request = await regradeRequestService.deferRegradeRequest(req.params.resultRegradeRequestId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: request?.resultRegradeRequestId, status: request?.requestStatus, safeMessage: 'Regrade request deferred' }));
}));

// ─── Regrade Intakes ───────────────────────────────────────────────

router.post('/regrade-requests/:resultRegradeRequestId/intakes', safeHandler(async (req: Request, res: Response) => {
  const { schoolId } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');

  const { safeIntakeSummary, triageReasonCodes } = req.body;
  const intake = await regradeIntakeService.createRegradeIntake({
    schoolId, resultRegradeRequestId: req.params.resultRegradeRequestId,
    safeIntakeSummary, triageReasonCodes,
  });

  await auditBridge.recordRegradeIntakeCreated({ schoolId, resultRegradeIntakeId: intake.resultRegradeIntakeId, resultRegradeRequestId: req.params.resultRegradeRequestId, actorId: (req as any).actorId || '', actorRole: (req as any).role || '' });

  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: intake.resultRegradeIntakeId, status: intake.intakeStatus, safeMessage: 'Regrade intake created', data: intake }));
}));

router.get('/regrade-requests/:resultRegradeRequestId/intakes', safeHandler(async (req: Request, res: Response) => {
  const intakes = await regradeIntakeService.listIntakesForRequest(req.params.resultRegradeRequestId);
  res.json(createSafeResponseEnvelope(req, { data: intakes }));
}));

router.post('/regrade-intakes/:resultRegradeIntakeId/assign', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const { assignedReviewerActorId, assignedReviewerRole } = req.body;
  if (!assignedReviewerActorId || !assignedReviewerRole) throw new Error('VALIDATION_FAILED: assignedReviewerActorId and assignedReviewerRole are required');
  const intake = await regradeIntakeService.assignRegradeReviewer(req.params.resultRegradeIntakeId, assignedReviewerActorId, assignedReviewerRole, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: intake?.resultRegradeIntakeId, status: intake?.intakeStatus, safeMessage: 'Reviewer assigned' }));
}));

router.post('/regrade-intakes/:resultRegradeIntakeId/accept', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const intake = await regradeIntakeService.acceptRegradeIntake(req.params.resultRegradeIntakeId, role);
  res.json(createSafeResponseEnvelope(req, { resourceId: intake?.resultRegradeIntakeId, status: intake?.intakeStatus, safeMessage: 'Intake accepted' }));
}));

router.post('/regrade-intakes/:resultRegradeIntakeId/reject', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const intake = await regradeIntakeService.rejectRegradeIntake(req.params.resultRegradeIntakeId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: intake?.resultRegradeIntakeId, status: intake?.intakeStatus, safeMessage: 'Intake rejected' }));
}));

router.post('/regrade-intakes/:resultRegradeIntakeId/block', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const intake = await regradeIntakeService.blockRegradeIntake(req.params.resultRegradeIntakeId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: intake?.resultRegradeIntakeId, status: intake?.intakeStatus, safeMessage: 'Intake blocked' }));
}));

router.post('/regrade-intakes/:resultRegradeIntakeId/complete', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const intake = await regradeIntakeService.completeRegradeIntake(req.params.resultRegradeIntakeId, role, req.body.safeSummary);
  res.json(createSafeResponseEnvelope(req, { resourceId: intake?.resultRegradeIntakeId, status: intake?.intakeStatus, safeMessage: 'Intake completed' }));
}));

// ─── Projection Routes ─────────────────────────────────────────────

router.get('/finalization-reviews/:resultFinalizationReviewId/projection/teacher', safeHandler(async (req: Request, res: Response) => {
  const review = await reviewService.getFinalizationReview(req.params.resultFinalizationReviewId);
  if (!review) throw new Error('NOT_FOUND: finalization review not found');
  const decisions = await decisionService.listDecisionsForReview(req.params.resultFinalizationReviewId);
  const projection = projectionSafetyService.toTeacherProjection(review, decisions[0]);
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

router.get('/finalization-reviews/:resultFinalizationReviewId/projection/admin', safeHandler(async (req: Request, res: Response) => {
  const reviews = await reviewService.listFinalizationReviewsForSchool((req as any).schoolId || '');
  if (reviews.length === 0) throw new Error('NOT_FOUND: no reviews found');
  const review = reviews.find(r => r.resultFinalizationReviewId === req.params.resultFinalizationReviewId) || reviews[0];
  const decisions = await decisionService.listDecisionsForReview(req.params.resultFinalizationReviewId);
  const projection = projectionSafetyService.toAdminProjection([review], decisions);
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

router.get('/finalization-reviews/:resultFinalizationReviewId/projection/student-safe', safeHandler(async (req: Request, res: Response) => {
  const { schoolId } = extractActorContext(req);
  const review = await reviewService.getFinalizationReview(req.params.resultFinalizationReviewId);
  if (!review) throw new Error('NOT_FOUND: finalization review not found');
  const decisions = await decisionService.listDecisionsForReview(req.params.resultFinalizationReviewId);
  const projection = projectionSafetyService.toStudentSafeProjection(
    (req as any).actorId || '',
    review,
    decisions[0],
  );
  projectionSafetyService.assertNoAnswerKeyLeakage(projection as any);
  projectionSafetyService.assertNoRubricLeakage(projection as any);
  projectionSafetyService.assertNoTeacherOnlyLeakage(projection as any);
  projectionSafetyService.assertNoHiddenReasoningLeakage(projection as any);
  projectionSafetyService.assertNoUnreleasedGradeLeakage(projection as any);
  projectionSafetyService.assertNoParentDeliveryPayloadLeakage(projection as any);
  projectionSafetyService.assertNoMasteryMutationLeakage(projection as any);
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

router.get('/release-readiness/:resultReleaseReadinessId/projection/parent-boundary', safeHandler(async (req: Request, res: Response) => {
  const readiness = await readinessService.getReleaseReadiness(req.params.resultReleaseReadinessId);
  if (!readiness) throw new Error('NOT_FOUND: release readiness not found');
  const boundaries = await boundaryService.listBoundariesForReadiness(req.params.resultReleaseReadinessId);
  const boundary = boundaries[0];
  const projection = projectionSafetyService.toParentBoundaryProjection(
    (req as any).actorId || '',
    boundary,
    readiness,
  );
  if (!projection.notYetReleasedReason) {
    projection.notYetReleasedReason = 'Parent release is boundary-only. No scores, answer keys, or raw rubrics are released to parents.';
  }
  res.json(createSafeResponseEnvelope(req, { data: projection }));
}));

export default router;
