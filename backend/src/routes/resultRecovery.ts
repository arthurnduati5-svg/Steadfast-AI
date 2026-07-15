import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  InMemoryResultRecoveryPlanRepository,
  InMemoryResultRecoveryObjectiveRepository,
  InMemoryResultRecoveryStepRepository,
  InMemoryResultRecoveryPracticeDraftRepository,
  InMemoryResultRecoveryResourceRecommendationRepository,
  InMemoryResultRecoveryTeacherReviewPacketRepository,
  InMemoryResultRecoveryStudentSupportDraftRepository,
  InMemoryResultRecoveryParentSupportNoteDraftRepository,
  InMemoryResultRecoveryCheckpointRepository,
  InMemoryResultRecoverySummaryRepository,
  InMemoryResultRecoveryAuditRepository,
  InMemoryResultRecoveryIdempotencyRepository,
} from '../domains/assessment/result-recovery/repositories/inMemoryResultRecoveryRepositories';
import {
  ResultRecoveryPlanService,
  ResultRecoveryObjectiveService,
  ResultRecoveryStepService,
  ResultRecoveryPracticeDraftService,
  ResultRecoveryResourceRecommendationService,
  ResultRecoveryTeacherReviewPacketService,
  ResultRecoveryStudentSupportDraftService,
  ResultRecoveryParentSupportNoteDraftService,
  ResultRecoveryCheckpointService,
  ResultRecoverySummaryService,
  ResultRecoverySafetyService,
  ResultRecoveryAuditBridge,
  ResultRecoveryIdempotencyService,
} from '../domains/assessment/result-recovery/services';
import { ResultRecoveryCommandContext, ResultRecoverySafeEnvelope } from '../domains/assessment/result-recovery/contracts/resultRecoveryContracts';

const router = Router();

// Instantiate repositories
const planRepo = new InMemoryResultRecoveryPlanRepository();
const objectiveRepo = new InMemoryResultRecoveryObjectiveRepository();
const stepRepo = new InMemoryResultRecoveryStepRepository();
const practiceDraftRepo = new InMemoryResultRecoveryPracticeDraftRepository();
const resourceRepo = new InMemoryResultRecoveryResourceRecommendationRepository();
const packetRepo = new InMemoryResultRecoveryTeacherReviewPacketRepository();
const studentSupportRepo = new InMemoryResultRecoveryStudentSupportDraftRepository();
const parentSupportRepo = new InMemoryResultRecoveryParentSupportNoteDraftRepository();
const checkpointRepo = new InMemoryResultRecoveryCheckpointRepository();
const summaryRepo = new InMemoryResultRecoverySummaryRepository();
const auditRepo = new InMemoryResultRecoveryAuditRepository();
const idempotencyRepo = new InMemoryResultRecoveryIdempotencyRepository();

// Instantiate dependency services
const idempotencyService = new ResultRecoveryIdempotencyService(idempotencyRepo);
const auditBridge = new ResultRecoveryAuditBridge(auditRepo);
const safetyService = new ResultRecoverySafetyService();

// Instantiate core services
const planService = new ResultRecoveryPlanService(planRepo as any, objectiveRepo as any, stepRepo as any, safetyService, auditBridge, idempotencyService);
const objectiveService = new ResultRecoveryObjectiveService(objectiveRepo as any, safetyService, auditBridge, idempotencyService);
const stepService = new ResultRecoveryStepService(stepRepo as any, safetyService, auditBridge, idempotencyService);
const practiceDraftService = new ResultRecoveryPracticeDraftService(practiceDraftRepo as any, safetyService, auditBridge, idempotencyService);
const resourceService = new ResultRecoveryResourceRecommendationService(resourceRepo as any, safetyService, auditBridge, idempotencyService);
const packetService = new ResultRecoveryTeacherReviewPacketService(packetRepo as any, safetyService, auditBridge, idempotencyService);
const studentSupportService = new ResultRecoveryStudentSupportDraftService(studentSupportRepo as any, safetyService, auditBridge, idempotencyService);
const parentSupportService = new ResultRecoveryParentSupportNoteDraftService(parentSupportRepo as any, safetyService, auditBridge, idempotencyService);
const checkpointService = new ResultRecoveryCheckpointService(checkpointRepo as any, safetyService, auditBridge, idempotencyService);
const summaryService = new ResultRecoverySummaryService(summaryRepo as any, safetyService, auditBridge, idempotencyService);

function extractContext(req: Request): ResultRecoveryCommandContext {
  return {
    schoolId: (req as any).schoolId || 'unknown',
    actorId: (req as any).actorId || 'unknown',
    actorRole: (req as any).actorRole || 'unknown',
    correlationId: (req as any).correlationId || uuidv4(),
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || uuidv4(),
  };
}

function sendEnvelope(res: Response, envelope: ResultRecoverySafeEnvelope): void {
  res.status(envelope.ok ? 200 : 400).json(envelope);
}

// ─── PLANS ────────────────────────────────────────────────

router.post('/plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.createRecoveryPlan(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.listRecoveryPlansForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/plans/:resultRecoveryPlanId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.getRecoveryPlan(ctx, req.params.resultRecoveryPlanId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.listRecoveryPlansForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/plans/status/:planStatus', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.listRecoveryPlansByStatus(ctx, req.params.planStatus);
  sendEnvelope(res, result);
});

router.get('/plans/priority/:planPriority', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.listRecoveryPlansByPriority(ctx, req.params.planPriority);
  sendEnvelope(res, result);
});

router.post('/plans/:resultRecoveryPlanId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.markRecoveryPlanReviewReady(ctx, req.params.resultRecoveryPlanId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Recovery plan marked review ready');
  sendEnvelope(res, result);
});

router.post('/plans/:resultRecoveryPlanId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.approveRecoveryPlanForFutureUse(ctx, req.params.resultRecoveryPlanId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Recovery plan approved for future use');
  sendEnvelope(res, result);
});

router.post('/plans/:resultRecoveryPlanId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.suppressRecoveryPlan(ctx, req.params.resultRecoveryPlanId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Recovery plan suppressed');
  sendEnvelope(res, result);
});

router.post('/plans/:resultRecoveryPlanId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.blockRecoveryPlan(ctx, req.params.resultRecoveryPlanId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Recovery plan blocked');
  sendEnvelope(res, result);
});

router.post('/plans/:resultRecoveryPlanId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.voidRecoveryPlan(ctx, req.params.resultRecoveryPlanId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Recovery plan voided');
  sendEnvelope(res, result);
});

// ─── OBJECTIVES ───────────────────────────────────────────

router.post('/plans/:resultRecoveryPlanId/objectives', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await objectiveService.createRecoveryObjective(ctx, {
    ...req.body,
    resultRecoveryPlanId: req.params.resultRecoveryPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/plans/:resultRecoveryPlanId/objectives', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await objectiveService.listObjectivesForPlan(ctx, req.params.resultRecoveryPlanId);
  sendEnvelope(res, result);
});

router.get('/objectives/:resultRecoveryObjectiveId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await objectiveService.getRecoveryObjective(ctx, req.params.resultRecoveryObjectiveId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/objectives', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await objectiveService.listObjectivesForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/objectives/type/:objectiveType', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await objectiveService.listObjectivesByType(ctx, req.params.objectiveType);
  sendEnvelope(res, result);
});

router.post('/objectives/:resultRecoveryObjectiveId/ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await objectiveService.markObjectiveReady(ctx, req.params.resultRecoveryObjectiveId, req.body.reasonCode || 'ready', req.body.safeMessage || 'Recovery objective marked ready');
  sendEnvelope(res, result);
});

router.post('/objectives/:resultRecoveryObjectiveId/complete-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await objectiveService.completeObjectiveMock(ctx, req.params.resultRecoveryObjectiveId, req.body.reasonCode || 'completed_mock', req.body.safeMessage || 'Recovery objective mock completed');
  sendEnvelope(res, result);
});

router.post('/objectives/:resultRecoveryObjectiveId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await objectiveService.suppressObjective(ctx, req.params.resultRecoveryObjectiveId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Recovery objective suppressed');
  sendEnvelope(res, result);
});

router.post('/objectives/:resultRecoveryObjectiveId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await objectiveService.voidObjective(ctx, req.params.resultRecoveryObjectiveId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Recovery objective voided');
  sendEnvelope(res, result);
});

// ─── STEPS ─────────────────────────────────────────────────

router.post('/plans/:resultRecoveryPlanId/steps', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await stepService.createRecoveryStep(ctx, {
    ...req.body,
    resultRecoveryPlanId: req.params.resultRecoveryPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/plans/:resultRecoveryPlanId/steps', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await stepService.listStepsForPlan(ctx, req.params.resultRecoveryPlanId);
  sendEnvelope(res, result);
});

router.get('/objectives/:resultRecoveryObjectiveId/steps', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await stepService.listStepsForObjective(ctx, req.params.resultRecoveryObjectiveId);
  sendEnvelope(res, result);
});

router.get('/steps/:resultRecoveryStepId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await stepService.getRecoveryStep(ctx, req.params.resultRecoveryStepId);
  sendEnvelope(res, result);
});

router.post('/steps/:resultRecoveryStepId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await stepService.markStepReviewReady(ctx, req.params.resultRecoveryStepId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Step marked review ready');
  sendEnvelope(res, result);
});

router.post('/steps/:resultRecoveryStepId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await stepService.approveStepForFutureUse(ctx, req.params.resultRecoveryStepId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Step approved for future use');
  sendEnvelope(res, result);
});

router.post('/steps/:resultRecoveryStepId/complete-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await stepService.completeStepMock(ctx, req.params.resultRecoveryStepId, req.body.reasonCode || 'completed_mock', req.body.safeMessage || 'Step mock completed');
  sendEnvelope(res, result);
});

router.post('/steps/:resultRecoveryStepId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await stepService.suppressStep(ctx, req.params.resultRecoveryStepId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Step suppressed');
  sendEnvelope(res, result);
});

router.post('/steps/:resultRecoveryStepId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await stepService.voidStep(ctx, req.params.resultRecoveryStepId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Step voided');
  sendEnvelope(res, result);
});

// ─── PRACTICE DRAFTS ──────────────────────────────────────

router.post('/plans/:resultRecoveryPlanId/practice-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.createPracticeDraft(ctx, {
    ...req.body,
    resultRecoveryPlanId: req.params.resultRecoveryPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/plans/:resultRecoveryPlanId/practice-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.listPracticeDraftsForPlan(ctx, req.params.resultRecoveryPlanId);
  sendEnvelope(res, result);
});

router.get('/objectives/:resultRecoveryObjectiveId/practice-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.listPracticeDraftsForObjective(ctx, req.params.resultRecoveryObjectiveId);
  sendEnvelope(res, result);
});

router.get('/steps/:resultRecoveryStepId/practice-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.listPracticeDraftsForStep(ctx, req.params.resultRecoveryStepId);
  sendEnvelope(res, result);
});

router.get('/practice-drafts/:resultRecoveryPracticeDraftId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.getPracticeDraft(ctx, req.params.resultRecoveryPracticeDraftId);
  sendEnvelope(res, result);
});

router.post('/practice-drafts/:resultRecoveryPracticeDraftId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.markPracticeDraftReviewReady(ctx, req.params.resultRecoveryPracticeDraftId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Practice draft marked review ready');
  sendEnvelope(res, result);
});

router.post('/practice-drafts/:resultRecoveryPracticeDraftId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.approvePracticeDraftForFutureUse(ctx, req.params.resultRecoveryPracticeDraftId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Practice draft approved for future use');
  sendEnvelope(res, result);
});

router.post('/practice-drafts/:resultRecoveryPracticeDraftId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.suppressPracticeDraft(ctx, req.params.resultRecoveryPracticeDraftId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Practice draft suppressed');
  sendEnvelope(res, result);
});

router.post('/practice-drafts/:resultRecoveryPracticeDraftId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.blockPracticeDraft(ctx, req.params.resultRecoveryPracticeDraftId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Practice draft blocked');
  sendEnvelope(res, result);
});

router.post('/practice-drafts/:resultRecoveryPracticeDraftId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await practiceDraftService.voidPracticeDraft(ctx, req.params.resultRecoveryPracticeDraftId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Practice draft voided');
  sendEnvelope(res, result);
});

// ─── RESOURCE RECOMMENDATIONS ─────────────────────────────

router.post('/plans/:resultRecoveryPlanId/resource-recommendations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await resourceService.createResourceRecommendation(ctx, {
    ...req.body,
    resultRecoveryPlanId: req.params.resultRecoveryPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/plans/:resultRecoveryPlanId/resource-recommendations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await resourceService.listResourceRecommendationsForPlan(ctx, req.params.resultRecoveryPlanId);
  sendEnvelope(res, result);
});

router.get('/objectives/:resultRecoveryObjectiveId/resource-recommendations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await resourceService.listResourceRecommendationsForObjective(ctx, req.params.resultRecoveryObjectiveId);
  sendEnvelope(res, result);
});

router.get('/resource-recommendations/:resultRecoveryResourceRecommendationId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await resourceService.getResourceRecommendation(ctx, req.params.resultRecoveryResourceRecommendationId);
  sendEnvelope(res, result);
});

router.post('/resource-recommendations/:resultRecoveryResourceRecommendationId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await resourceService.markResourceRecommendationReviewReady(ctx, req.params.resultRecoveryResourceRecommendationId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Resource recommendation marked review ready');
  sendEnvelope(res, result);
});

router.post('/resource-recommendations/:resultRecoveryResourceRecommendationId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await resourceService.approveResourceRecommendationForFutureUse(ctx, req.params.resultRecoveryResourceRecommendationId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Resource recommendation approved for future use');
  sendEnvelope(res, result);
});

router.post('/resource-recommendations/:resultRecoveryResourceRecommendationId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await resourceService.suppressResourceRecommendation(ctx, req.params.resultRecoveryResourceRecommendationId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Resource recommendation suppressed');
  sendEnvelope(res, result);
});

router.post('/resource-recommendations/:resultRecoveryResourceRecommendationId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await resourceService.blockResourceRecommendation(ctx, req.params.resultRecoveryResourceRecommendationId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Resource recommendation blocked');
  sendEnvelope(res, result);
});

router.post('/resource-recommendations/:resultRecoveryResourceRecommendationId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await resourceService.voidResourceRecommendation(ctx, req.params.resultRecoveryResourceRecommendationId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Resource recommendation voided');
  sendEnvelope(res, result);
});

// ─── TEACHER REVIEW PACKETS ───────────────────────────────

router.post('/plans/:resultRecoveryPlanId/teacher-review-packets', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.createTeacherReviewPacket(ctx, {
    ...req.body,
    resultRecoveryPlanId: req.params.resultRecoveryPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/plans/:resultRecoveryPlanId/teacher-review-packets', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.listTeacherReviewPacketsForPlan(ctx, req.params.resultRecoveryPlanId);
  sendEnvelope(res, result);
});

router.get('/teachers/:teacherRef/review-packets', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.listTeacherReviewPacketsForTeacher(ctx, req.params.teacherRef);
  sendEnvelope(res, result);
});

router.get('/teacher-review-packets/:resultRecoveryTeacherReviewPacketId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.getTeacherReviewPacket(ctx, req.params.resultRecoveryTeacherReviewPacketId);
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:resultRecoveryTeacherReviewPacketId/ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.markTeacherReviewPacketReady(ctx, req.params.resultRecoveryTeacherReviewPacketId, req.body.reasonCode || 'ready', req.body.safeMessage || 'Teacher review packet marked ready');
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:resultRecoveryTeacherReviewPacketId/acknowledge-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.acknowledgeTeacherReviewPacketMock(ctx, req.params.resultRecoveryTeacherReviewPacketId, req.body.reasonCode || 'acknowledged_mock', req.body.safeMessage || 'Teacher review packet mock acknowledged');
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:resultRecoveryTeacherReviewPacketId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.approveTeacherReviewPacketForFutureUse(ctx, req.params.resultRecoveryTeacherReviewPacketId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Teacher review packet approved for future use');
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:resultRecoveryTeacherReviewPacketId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.suppressTeacherReviewPacket(ctx, req.params.resultRecoveryTeacherReviewPacketId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Teacher review packet suppressed');
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:resultRecoveryTeacherReviewPacketId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await packetService.voidTeacherReviewPacket(ctx, req.params.resultRecoveryTeacherReviewPacketId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Teacher review packet voided');
  sendEnvelope(res, result);
});

// ─── STUDENT SUPPORT DRAFTS ───────────────────────────────

router.post('/plans/:resultRecoveryPlanId/student-support-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSupportService.createStudentSupportDraft(ctx, {
    ...req.body,
    resultRecoveryPlanId: req.params.resultRecoveryPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/plans/:resultRecoveryPlanId/student-support-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSupportService.listStudentSupportDraftsForPlan(ctx, req.params.resultRecoveryPlanId);
  sendEnvelope(res, result);
});

router.get('/student-support-drafts/:resultRecoveryStudentSupportDraftId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSupportService.getStudentSupportDraft(ctx, req.params.resultRecoveryStudentSupportDraftId);
  sendEnvelope(res, result);
});

router.post('/student-support-drafts/:resultRecoveryStudentSupportDraftId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSupportService.markStudentSupportDraftReviewReady(ctx, req.params.resultRecoveryStudentSupportDraftId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Student support draft marked review ready');
  sendEnvelope(res, result);
});

router.post('/student-support-drafts/:resultRecoveryStudentSupportDraftId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSupportService.approveStudentSupportDraftForFutureUse(ctx, req.params.resultRecoveryStudentSupportDraftId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Student support draft approved for future use');
  sendEnvelope(res, result);
});

router.post('/student-support-drafts/:resultRecoveryStudentSupportDraftId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSupportService.suppressStudentSupportDraft(ctx, req.params.resultRecoveryStudentSupportDraftId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Student support draft suppressed');
  sendEnvelope(res, result);
});

router.post('/student-support-drafts/:resultRecoveryStudentSupportDraftId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSupportService.blockStudentSupportDraft(ctx, req.params.resultRecoveryStudentSupportDraftId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Student support draft blocked');
  sendEnvelope(res, result);
});

router.post('/student-support-drafts/:resultRecoveryStudentSupportDraftId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentSupportService.voidStudentSupportDraft(ctx, req.params.resultRecoveryStudentSupportDraftId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Student support draft voided');
  sendEnvelope(res, result);
});

// ─── PARENT SUPPORT NOTE DRAFTS ───────────────────────────

router.post('/plans/:resultRecoveryPlanId/parent-support-note-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSupportService.createParentSupportNoteDraft(ctx, {
    ...req.body,
    resultRecoveryPlanId: req.params.resultRecoveryPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/plans/:resultRecoveryPlanId/parent-support-note-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSupportService.listParentSupportNoteDraftsForPlan(ctx, req.params.resultRecoveryPlanId);
  sendEnvelope(res, result);
});

router.get('/parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSupportService.getParentSupportNoteDraft(ctx, req.params.resultRecoveryParentSupportNoteDraftId);
  sendEnvelope(res, result);
});

router.post('/parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSupportService.markParentSupportNoteReviewReady(ctx, req.params.resultRecoveryParentSupportNoteDraftId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Parent support note draft marked review ready');
  sendEnvelope(res, result);
});

router.post('/parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSupportService.approveParentSupportNoteForFutureUse(ctx, req.params.resultRecoveryParentSupportNoteDraftId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Parent support note draft approved for future use');
  sendEnvelope(res, result);
});

router.post('/parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSupportService.suppressParentSupportNoteDraft(ctx, req.params.resultRecoveryParentSupportNoteDraftId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Parent support note draft suppressed');
  sendEnvelope(res, result);
});

router.post('/parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSupportService.blockParentSupportNoteDraft(ctx, req.params.resultRecoveryParentSupportNoteDraftId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Parent support note draft blocked');
  sendEnvelope(res, result);
});

router.post('/parent-support-note-drafts/:resultRecoveryParentSupportNoteDraftId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentSupportService.voidParentSupportNoteDraft(ctx, req.params.resultRecoveryParentSupportNoteDraftId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Parent support note draft voided');
  sendEnvelope(res, result);
});

// ─── CHECKPOINTS ──────────────────────────────────────────

router.post('/plans/:resultRecoveryPlanId/checkpoints', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await checkpointService.createRecoveryCheckpoint(ctx, {
    ...req.body,
    resultRecoveryPlanId: req.params.resultRecoveryPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/plans/:resultRecoveryPlanId/checkpoints', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await checkpointService.listCheckpointsForPlan(ctx, req.params.resultRecoveryPlanId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/checkpoints', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await checkpointService.listCheckpointsForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/checkpoints/:resultRecoveryCheckpointId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await checkpointService.getRecoveryCheckpoint(ctx, req.params.resultRecoveryCheckpointId);
  sendEnvelope(res, result);
});

router.post('/checkpoints/:resultRecoveryCheckpointId/schedule-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await checkpointService.scheduleCheckpointMock(ctx, req.params.resultRecoveryCheckpointId, req.body.reasonCode || 'scheduled', req.body.safeMessage || 'Checkpoint mock scheduled');
  sendEnvelope(res, result);
});

router.post('/checkpoints/:resultRecoveryCheckpointId/complete-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await checkpointService.completeCheckpointMock(ctx, req.params.resultRecoveryCheckpointId, req.body.reasonCode || 'completed', req.body.safeMessage || 'Checkpoint mock completed');
  sendEnvelope(res, result);
});

router.post('/checkpoints/:resultRecoveryCheckpointId/cancel', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await checkpointService.cancelCheckpoint(ctx, req.params.resultRecoveryCheckpointId, req.body.reasonCode || 'cancelled', req.body.safeMessage || 'Checkpoint cancelled');
  sendEnvelope(res, result);
});

router.post('/checkpoints/:resultRecoveryCheckpointId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await checkpointService.voidCheckpoint(ctx, req.params.resultRecoveryCheckpointId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Checkpoint voided');
  sendEnvelope(res, result);
});

// ─── SUMMARIES ────────────────────────────────────────────

router.post('/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.createRecoverySummary(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.listRecoverySummariesForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.listRecoverySummariesForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/summaries/:resultRecoverySummaryId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.getRecoverySummary(ctx, req.params.resultRecoverySummaryId);
  sendEnvelope(res, result);
});

router.post('/summaries/:resultRecoverySummaryId/refresh', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.refreshRecoverySummary(ctx, req.params.resultRecoverySummaryId, req.body.reasonCode || 'refreshed', req.body.safeMessage || 'Recovery summary refreshed');
  sendEnvelope(res, result);
});

router.post('/summaries/:resultRecoverySummaryId/stale', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.markRecoverySummaryStale(ctx, req.params.resultRecoverySummaryId, req.body.reasonCode || 'stale', req.body.safeMessage || 'Recovery summary marked stale');
  sendEnvelope(res, result);
});

router.post('/summaries/:resultRecoverySummaryId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.blockRecoverySummary(ctx, req.params.resultRecoverySummaryId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Recovery summary blocked');
  sendEnvelope(res, result);
});

router.post('/summaries/:resultRecoverySummaryId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.voidRecoverySummary(ctx, req.params.resultRecoverySummaryId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Recovery summary voided');
  sendEnvelope(res, result);
});

export default router;
