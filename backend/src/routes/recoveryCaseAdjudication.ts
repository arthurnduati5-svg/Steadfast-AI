import { Router, Request, Response } from 'express';
import {
  RecoveryCaseAdjudicationReadinessService,
  RecoveryCaseReviewSessionService,
  RecoveryCaseEvidenceBundleService,
  RecoveryCaseReviewChecklistService,
  RecoveryCaseConflictService,
  RecoveryCaseReviewerDecisionService,
  RecoveryCasePriorityOverrideService,
  RecoveryCaseSecondReviewService,
  RecoveryCaseConsensusService,
  RecoveryCaseDisagreementService,
  RecoveryCaseQueueDispositionService,
  RecoveryCaseQualitySampleService,
  RecoveryCaseAdjudicationSummaryService,
  RecoveryCaseAdjudicationAuditBridge,
  RecoveryCaseAdjudicationIdempotencyService,
} from '../domains/assessment/recovery-case-adjudication/services';
import type {
  RecoveryCaseAdjudicationReadinessRepository,
  RecoveryCaseReviewSessionRepository,
  RecoveryCaseReviewEvidenceBundleRepository,
  RecoveryCaseReviewChecklistRepository,
  RecoveryCaseConflictOfInterestDeclarationRepository,
  RecoveryCaseReviewerDecisionDraftRepository,
  RecoveryCasePriorityOverrideRequestRepository,
  RecoveryCaseSecondReviewRequestRepository,
  RecoveryCaseReviewerConsensusRepository,
  RecoveryCaseDisagreementResolutionDraftRepository,
  RecoveryCaseQueueDispositionRepository,
  RecoveryCaseQualitySampleRepository,
  RecoveryCaseAdjudicationSummaryRepository,
  RecoveryCaseAdjudicationAuditRepository,
  RecoveryCaseAdjudicationIdempotencyRepository,
} from '../domains/assessment/recovery-case-adjudication/contracts/recoveryCaseAdjudicationRepositoryContracts';

export function createRecoveryCaseAdjudicationRouter(
  readinessRepo: RecoveryCaseAdjudicationReadinessRepository,
  sessionRepo: RecoveryCaseReviewSessionRepository,
  evidenceRepo: RecoveryCaseReviewEvidenceBundleRepository,
  checklistRepo: RecoveryCaseReviewChecklistRepository,
  conflictRepo: RecoveryCaseConflictOfInterestDeclarationRepository,
  decisionRepo: RecoveryCaseReviewerDecisionDraftRepository,
  priorityRepo: RecoveryCasePriorityOverrideRequestRepository,
  secondReviewRepo: RecoveryCaseSecondReviewRequestRepository,
  consensusRepo: RecoveryCaseReviewerConsensusRepository,
  disagreementRepo: RecoveryCaseDisagreementResolutionDraftRepository,
  dispositionRepo: RecoveryCaseQueueDispositionRepository,
  sampleRepo: RecoveryCaseQualitySampleRepository,
  summaryRepo: RecoveryCaseAdjudicationSummaryRepository,
  auditRepo: RecoveryCaseAdjudicationAuditRepository,
  idempotencyRepo: RecoveryCaseAdjudicationIdempotencyRepository,
): Router {
  const router = Router();

  const readinessService = new RecoveryCaseAdjudicationReadinessService(readinessRepo, auditRepo);
  const sessionService = new RecoveryCaseReviewSessionService(sessionRepo, auditRepo);
  const evidenceService = new RecoveryCaseEvidenceBundleService(evidenceRepo, auditRepo);
  const checklistService = new RecoveryCaseReviewChecklistService(checklistRepo, auditRepo);
  const conflictService = new RecoveryCaseConflictService(conflictRepo, auditRepo);
  const reviewerDecisionService = new RecoveryCaseReviewerDecisionService(decisionRepo, auditRepo);
  const priorityService = new RecoveryCasePriorityOverrideService(priorityRepo, auditRepo);
  const secondReviewService = new RecoveryCaseSecondReviewService(secondReviewRepo, auditRepo);
  const consensusService = new RecoveryCaseConsensusService(consensusRepo, decisionRepo, auditRepo);
  const disagreementService = new RecoveryCaseDisagreementService(disagreementRepo, auditRepo);
  const dispositionService = new RecoveryCaseQueueDispositionService(dispositionRepo, auditRepo);
  const qualitySampleService = new RecoveryCaseQualitySampleService(sampleRepo, auditRepo);
  const summaryService = new RecoveryCaseAdjudicationSummaryService(summaryRepo, auditRepo);
  const auditBridge = new RecoveryCaseAdjudicationAuditBridge(auditRepo);
  const idempotencyService = new RecoveryCaseAdjudicationIdempotencyService(idempotencyRepo);

function buildContext(req: Request): any {
  return {
    schoolId: (req as any).schoolId || (req.headers['x-school-id'] as string) || '',
    actorId: (req as any).userId || (req.headers['x-user-id'] as string) || '',
    actorRole: (req as any).userRole || (req.headers['x-user-role'] as string) || '',
    correlationId: (req.headers['x-correlation-id'] as string) || `corr-${Date.now()}`,
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || `ik-${Date.now()}`,
    sourceRefsJson: req.body?.sourceRefsJson ?? {},
  };
}

function extractSchoolId(req: Request): string {
  return (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
}

function sendResponse(res: Response, result: any) {
  if (result?.success) {
    res.status(200).json(result);
  } else {
    const status = result?.status === 'not_found' ? 404 : 400;
    res.status(status).json(result ?? { success: false, status: 'error', message: 'Unknown error' });
  }
}

// ─── Adjudication Readiness ─────────────────────────────────────────

router.post('/adjudication-readiness', async (req: Request, res: Response) => {
  const ctx = buildContext(req);
  sendResponse(res, await readinessService.createAdjudicationReadiness(
    ctx.schoolId, ctx.actorId, ctx.actorRole, ctx.correlationId, ctx.idempotencyKey, ctx.sourceRefsJson, req.body,
  ));
});

router.get('/adjudication-readiness', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.listAdjudicationReadinessForSchool(extractSchoolId(req)));
});

router.get('/adjudication-readiness/:id', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.getAdjudicationReadiness(req.params.id));
});

router.get('/adjudication-readiness/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.listAdjudicationReadinessForStudent(extractSchoolId(req), req.params.studentRef));
});

router.get('/adjudication-readiness/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.listAdjudicationReadinessForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/adjudication-readiness/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.listAdjudicationReadinessForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/adjudication-readiness/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.listAdjudicationReadinessByStatus(extractSchoolId(req), req.params.status));
});

router.post('/adjudication-readiness/:id/ready', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.markAdjudicationReady(req.params.id));
});

router.post('/adjudication-readiness/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.markAdjudicationReviewReady(req.params.id));
});

router.post('/adjudication-readiness/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.markAdjudicationStale(req.params.id));
});

router.post('/adjudication-readiness/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.blockAdjudicationReadiness(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/adjudication-readiness/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.suppressAdjudicationReadiness(req.params.id));
});

router.post('/adjudication-readiness/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.voidAdjudicationReadiness(req.params.id));
});

// ─── Review Sessions ────────────────────────────────────────────────

router.post('/review-sessions', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.createReviewSession(buildContext(req), req.body));
});

router.get('/review-sessions', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.listReviewSessionsForSchool(extractSchoolId(req)));
});

router.get('/review-sessions/:id', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.getReviewSession(req.params.id));
});

router.get('/review-sessions/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.listReviewSessionsForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/review-sessions/by-reviewer/:reviewerId', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.listReviewSessionsByReviewer(extractSchoolId(req), req.params.reviewerId));
});

router.get('/review-sessions/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.listReviewSessionsByStatus(extractSchoolId(req), req.params.status));
});

router.post('/review-sessions/:id/start', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.startReviewSession(req.params.id));
});

router.post('/review-sessions/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.markReviewSessionReviewReady(req.params.id));
});

router.post('/review-sessions/:id/needs-second-review', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.markReviewSessionNeedsSecondReview(req.params.id));
});

router.post('/review-sessions/:id/needs-more-evidence', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.markReviewSessionNeedsMoreEvidence(req.params.id));
});

router.post('/review-sessions/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.blockReviewSession(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/review-sessions/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await sessionService.voidReviewSession(req.params.id));
});

// ─── Evidence Bundles ───────────────────────────────────────────────

router.post('/evidence-bundles', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.createEvidenceBundle(buildContext(req), req.body));
});

router.get('/evidence-bundles', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.listEvidenceBundlesForSchool(extractSchoolId(req)));
});

router.get('/evidence-bundles/:id', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.getEvidenceBundle(req.params.id));
});

router.get('/evidence-bundles/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.listEvidenceBundlesForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/evidence-bundles/by-review-session/:sessionId', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.listEvidenceBundlesForReviewSession(extractSchoolId(req), req.params.sessionId));
});

router.post('/evidence-bundles/:id/verify-digest', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.verifyEvidenceBundleDigest(req.params.id));
});

router.post('/evidence-bundles/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.markEvidenceBundleReviewReady(req.params.id));
});

router.post('/evidence-bundles/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.markEvidenceBundleStale(req.params.id));
});

router.post('/evidence-bundles/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.blockEvidenceBundle(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/evidence-bundles/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await evidenceService.voidEvidenceBundle(req.params.id));
});

// ─── Review Checklists ──────────────────────────────────────────────

router.post('/review-checklists', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.createReviewChecklist(buildContext(req), req.body));
});

router.post('/review-checklists/:id/evaluate', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.evaluateReviewChecklist(req.params.id));
});

router.get('/review-checklists/:id', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.getReviewChecklist(req.params.id));
});

router.get('/review-checklists/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.listReviewChecklistsForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/review-checklists/by-session/:sessionId', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.listReviewChecklistsForSession(extractSchoolId(req), req.params.sessionId));
});

router.get('/review-checklists/by-outcome/:outcome', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.listReviewChecklistsByOutcome(extractSchoolId(req), req.params.outcome));
});

router.post('/review-checklists/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.markChecklistReviewReady(req.params.id));
});

router.post('/review-checklists/:id/needs-more-evidence', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.markChecklistNeedsMoreEvidence(req.params.id));
});

router.post('/review-checklists/:id/needs-conflict-declaration', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.markChecklistNeedsConflictDeclaration(req.params.id));
});

router.post('/review-checklists/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.blockChecklist(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/review-checklists/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await checklistService.voidChecklist(req.params.id));
});

// ─── Conflict Declarations ──────────────────────────────────────────

router.post('/conflict-declarations', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.createConflictDeclaration(buildContext(req), req.body));
});

router.post('/conflict-declarations/:id/evaluate', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.evaluateConflictDeclaration(req.params.id));
});

router.get('/conflict-declarations/:id', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.getConflictDeclaration(req.params.id));
});

router.get('/conflict-declarations/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.listConflictDeclarationsForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/conflict-declarations/by-reviewer/:reviewerId', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.listConflictDeclarationsByReviewer(extractSchoolId(req), req.params.reviewerId));
});

router.get('/conflict-declarations/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.listConflictDeclarationsByStatus(extractSchoolId(req), req.params.status));
});

router.post('/conflict-declarations/:id/no-conflict', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.markNoConflict(req.params.id));
});

router.post('/conflict-declarations/:id/hard-conflict', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.markHardConflict(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/conflict-declarations/:id/needs-alternate-reviewer', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.markNeedsAlternateReviewer(req.params.id));
});

router.post('/conflict-declarations/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await conflictService.voidConflictDeclaration(req.params.id));
});

// ─── Reviewer Decisions ─────────────────────────────────────────────

router.post('/reviewer-decisions', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.createReviewerDecisionDraft(buildContext(req), req.body));
});

router.get('/reviewer-decisions/:id', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.getReviewerDecisionDraft(req.params.id));
});

router.get('/reviewer-decisions', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.listReviewerDecisionsForSchool(extractSchoolId(req)));
});

router.get('/reviewer-decisions/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.listReviewerDecisionsForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/reviewer-decisions/by-session/:sessionId', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.listReviewerDecisionsForSession(extractSchoolId(req), req.params.sessionId));
});

router.get('/reviewer-decisions/by-reviewer/:reviewerId', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.listReviewerDecisionsByReviewer(extractSchoolId(req), req.params.reviewerId));
});

router.get('/reviewer-decisions/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.listReviewerDecisionsByStatus(extractSchoolId(req), req.params.status));
});

router.post('/reviewer-decisions/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.markReviewerDecisionReviewReady(req.params.id));
});

router.post('/reviewer-decisions/:id/needs-second-review', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.markReviewerDecisionNeedsSecondReview(req.params.id));
});

router.post('/reviewer-decisions/:id/needs-more-evidence', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.markReviewerDecisionNeedsMoreEvidence(req.params.id));
});

router.post('/reviewer-decisions/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.blockReviewerDecision(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/reviewer-decisions/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.suppressReviewerDecision(req.params.id));
});

router.post('/reviewer-decisions/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await reviewerDecisionService.voidReviewerDecision(req.params.id));
});

// ─── Priority Overrides ─────────────────────────────────────────────

router.post('/priority-overrides', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.createPriorityOverrideRequest(buildContext(req), req.body));
});

router.get('/priority-overrides/:id', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.getPriorityOverrideRequest(req.params.id));
});

router.get('/priority-overrides', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.listPriorityOverridesForSchool(extractSchoolId(req)));
});

router.get('/priority-overrides/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.listPriorityOverridesForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/priority-overrides/by-requestor/:actorId', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.listPriorityOverridesByRequestor(extractSchoolId(req), req.params.actorId));
});

router.get('/priority-overrides/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.listPriorityOverridesByStatus(extractSchoolId(req), req.params.status));
});

router.post('/priority-overrides/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.markPriorityOverrideReviewReady(req.params.id));
});

router.post('/priority-overrides/:id/needs-second-review', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.markPriorityOverrideNeedsSecondReview(req.params.id));
});

router.post('/priority-overrides/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.approvePriorityOverrideForFutureUse(req.params.id));
});

router.post('/priority-overrides/:id/reject', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.rejectPriorityOverride(req.params.id));
});

router.post('/priority-overrides/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.blockPriorityOverride(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/priority-overrides/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.suppressPriorityOverride(req.params.id));
});

router.post('/priority-overrides/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await priorityService.voidPriorityOverride(req.params.id));
});

// ─── Second Review Requests ─────────────────────────────────────────

router.post('/second-review-requests', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.createSecondReviewRequest(buildContext(req), req.body));
});

router.get('/second-review-requests/:id', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.getSecondReviewRequest(req.params.id));
});

router.get('/second-review-requests', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.listSecondReviewRequestsForSchool(extractSchoolId(req)));
});

router.get('/second-review-requests/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.listSecondReviewRequestsForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/second-review-requests/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.listSecondReviewRequestsByStatus(extractSchoolId(req), req.params.status));
});

router.post('/second-review-requests/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.markSecondReviewReviewReady(req.params.id));
});

router.post('/second-review-requests/:id/awaiting-reviewer', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.markAwaitingDistinctReviewer(req.params.id));
});

router.post('/second-review-requests/:id/review-received', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.markSecondReviewReceived(req.params.id));
});

router.post('/second-review-requests/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.blockSecondReviewRequest(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/second-review-requests/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.suppressSecondReviewRequest(req.params.id));
});

router.post('/second-review-requests/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await secondReviewService.voidSecondReviewRequest(req.params.id));
});

// ─── Consensus Records ──────────────────────────────────────────────

router.post('/consensus-records', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.createConsensusRecord(buildContext(req), req.body));
});

router.post('/consensus-records/evaluate', async (req: Request, res: Response) => {
  const { schoolId, queueItemId, primaryDecisionId, secondaryDecisionId } = req.body;
  if (!schoolId || !queueItemId || !primaryDecisionId || !secondaryDecisionId) {
    sendResponse(res, { success: false, status: 'error', message: 'schoolId, queueItemId, primaryDecisionId, secondaryDecisionId are required', errorCode: 'VALIDATION_FAILED' });
    return;
  }
  sendResponse(res, await consensusService.evaluateReviewerConsensus(schoolId, queueItemId, primaryDecisionId, secondaryDecisionId));
});

router.get('/consensus-records/:id', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.getConsensusRecord(req.params.id));
});

router.get('/consensus-records', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.listConsensusRecordsForSchool(extractSchoolId(req)));
});

router.get('/consensus-records/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.listConsensusRecordsForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/consensus-records/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.listConsensusRecordsByStatus(extractSchoolId(req), req.params.status));
});

router.post('/consensus-records/:id/consensus', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.markConsensusReached(req.params.id));
});

router.post('/consensus-records/:id/partial-consensus', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.markPartialConsensus(req.params.id));
});

router.post('/consensus-records/:id/disagreement', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.markDisagreement(req.params.id));
});

router.post('/consensus-records/:id/needs-more-evidence', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.markConsensusNeedsMoreEvidence(req.params.id));
});

router.post('/consensus-records/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.blockConsensus(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/consensus-records/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await consensusService.voidConsensus(req.params.id));
});

// ─── Disagreement Resolutions ───────────────────────────────────────

router.post('/disagreement-resolutions', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.createDisagreementResolutionDraft(buildContext(req), req.body));
});

router.get('/disagreement-resolutions/:id', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.getDisagreementResolutionDraft(req.params.id));
});

router.get('/disagreement-resolutions', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.listDisagreementDraftsForSchool(extractSchoolId(req)));
});

router.get('/disagreement-resolutions/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.listDisagreementDraftsForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/disagreement-resolutions/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.listDisagreementDraftsByStatus(extractSchoolId(req), req.params.status));
});

router.post('/disagreement-resolutions/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.markDisagreementDraftReviewReady(req.params.id));
});

router.post('/disagreement-resolutions/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.approveDisagreementDraftForFutureUse(req.params.id));
});

router.post('/disagreement-resolutions/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.blockDisagreementDraft(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/disagreement-resolutions/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.suppressDisagreementDraft(req.params.id));
});

router.post('/disagreement-resolutions/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await disagreementService.voidDisagreementDraft(req.params.id));
});

// ─── Queue Dispositions ─────────────────────────────────────────────

router.post('/queue-dispositions', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.createQueueDisposition(buildContext(req), req.body));
});

router.get('/queue-dispositions/:id', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.getQueueDisposition(req.params.id));
});

router.get('/queue-dispositions', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.listQueueDispositionsForSchool(extractSchoolId(req)));
});

router.get('/queue-dispositions/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.listQueueDispositionsForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/queue-dispositions/by-code/:code', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.listQueueDispositionsByCode(extractSchoolId(req), req.params.code));
});

router.get('/queue-dispositions/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.listQueueDispositionsByStatus(extractSchoolId(req), req.params.status));
});

router.post('/queue-dispositions/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.markQueueDispositionReviewReady(req.params.id));
});

router.post('/queue-dispositions/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.approveQueueDispositionForFutureUse(req.params.id));
});

router.post('/queue-dispositions/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.blockQueueDisposition(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/queue-dispositions/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.suppressQueueDisposition(req.params.id));
});

router.post('/queue-dispositions/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await dispositionService.voidQueueDisposition(req.params.id));
});

// ─── Quality Samples ────────────────────────────────────────────────

router.post('/quality-samples', async (req: Request, res: Response) => {
  const ctx = buildContext(req);
  const input = req.body;
  const samplingResult = qualitySampleService.calculateQualitySample(input);
  sendResponse(res, await qualitySampleService.createQualitySample(ctx, input, samplingResult));
});

router.post('/quality-samples/calculate', async (req: Request, res: Response) => {
  const result = qualitySampleService.calculateQualitySample(req.body);
  res.json({ success: true, status: 'ok', data: result });
});

router.get('/quality-samples/:id', async (req: Request, res: Response) => {
  sendResponse(res, await qualitySampleService.getQualitySample(req.params.id));
});

router.get('/quality-samples', async (req: Request, res: Response) => {
  sendResponse(res, await qualitySampleService.listQualitySamplesForSchool(extractSchoolId(req)));
});

router.get('/quality-samples/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await qualitySampleService.listQualitySamplesForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.get('/quality-samples/selected', async (req: Request, res: Response) => {
  sendResponse(res, await qualitySampleService.listSelectedQualitySamples(extractSchoolId(req)));
});

router.get('/quality-samples/by-policy/:policyVersion', async (req: Request, res: Response) => {
  sendResponse(res, await qualitySampleService.listQualitySamplesByPolicyVersion(extractSchoolId(req), req.params.policyVersion));
});

router.post('/quality-samples/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await qualitySampleService.voidQualitySample(req.params.id));
});

// ─── Adjudication Summaries ─────────────────────────────────────────

router.post('/adjudication-summaries', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.createAdjudicationSummary(buildContext(req), req.body));
});

router.get('/adjudication-summaries/:id', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.getAdjudicationSummary(req.params.id));
});

router.get('/adjudication-summaries', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.listAdjudicationSummariesForSchool(extractSchoolId(req)));
});

router.get('/adjudication-summaries/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.listAdjudicationSummariesForStudent(extractSchoolId(req), req.params.studentRef));
});

router.get('/adjudication-summaries/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.listAdjudicationSummariesForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/adjudication-summaries/by-queue-item/:queueItemId', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.listAdjudicationSummariesForQueueItem(extractSchoolId(req), req.params.queueItemId));
});

router.post('/adjudication-summaries/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.refreshAdjudicationSummary(req.params.id, req.body));
});

router.post('/adjudication-summaries/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.markAdjudicationSummaryReviewReady(req.params.id));
});

router.post('/adjudication-summaries/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.markAdjudicationSummaryStale(req.params.id));
});

router.post('/adjudication-summaries/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.blockAdjudicationSummary(req.params.id, req.body?.reasonCodes ?? []));
});

router.post('/adjudication-summaries/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.voidAdjudicationSummary(req.params.id));
});

  return router;
}
