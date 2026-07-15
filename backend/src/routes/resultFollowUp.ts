import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  InMemoryResultFollowUpCaseRepository,
  InMemoryResultFollowUpSignalRepository,
  InMemoryResultFollowUpActionPlanRepository,
  InMemoryTeacherFollowUpQueueRepository,
  InMemoryParentGuidanceDraftRepository,
  InMemoryStudentReflectionTaskDraftRepository,
  InMemoryFollowUpReviewWindowRepository,
  InMemoryFollowUpEscalationPlanRepository,
  InMemoryFollowUpSummaryRepository,
  InMemoryFollowUpAuditRepository,
  InMemoryFollowUpIdempotencyRepository,
} from '../domains/assessment/result-follow-up/repositories/inMemoryResultFollowUpRepositories';
import {
  ResultFollowUpCaseService,
  ResultFollowUpSignalService,
  ResultFollowUpActionPlanService,
  TeacherFollowUpQueueService,
  ParentGuidanceDraftService,
  StudentReflectionTaskDraftService,
  FollowUpReviewWindowService,
  FollowUpEscalationPlanService,
  FollowUpSummaryService,
  ResultFollowUpSafetyService,
  ResultFollowUpAuditBridge,
  ResultFollowUpIdempotencyService,
} from '../domains/assessment/result-follow-up/services';
import { ResultFollowUpCommandContext, ResultFollowUpSafeEnvelope } from '../domains/assessment/result-follow-up/contracts/resultFollowUpContracts';

const router = Router();

// Instantiate repositories
const caseRepo = new InMemoryResultFollowUpCaseRepository();
const signalRepo = new InMemoryResultFollowUpSignalRepository();
const planRepo = new InMemoryResultFollowUpActionPlanRepository();
const queueRepo = new InMemoryTeacherFollowUpQueueRepository();
const parentGuidanceRepo = new InMemoryParentGuidanceDraftRepository();
const studentReflectionRepo = new InMemoryStudentReflectionTaskDraftRepository();
const windowRepo = new InMemoryFollowUpReviewWindowRepository();
const escalationRepo = new InMemoryFollowUpEscalationPlanRepository();
const summaryRepo = new InMemoryFollowUpSummaryRepository();
const auditRepo = new InMemoryFollowUpAuditRepository();
const idempotencyRepo = new InMemoryFollowUpIdempotencyRepository();

// Instantiate dependency services
const idempotencyService = new ResultFollowUpIdempotencyService(idempotencyRepo);
const auditBridge = new ResultFollowUpAuditBridge(auditRepo);
const safetyService = new ResultFollowUpSafetyService();

// Instantiate core services
const caseService = new ResultFollowUpCaseService(caseRepo, auditBridge, idempotencyService);
const signalService = new ResultFollowUpSignalService(signalRepo, auditBridge, idempotencyService);
const planService = new ResultFollowUpActionPlanService(planRepo, auditBridge, idempotencyService);
const queueService = new TeacherFollowUpQueueService(queueRepo, safetyService, auditBridge, idempotencyService);
const parentGuidanceService = new ParentGuidanceDraftService(parentGuidanceRepo, safetyService, auditBridge, idempotencyService);
const reflectionService = new StudentReflectionTaskDraftService(studentReflectionRepo, safetyService, auditBridge, idempotencyService);
const windowService = new FollowUpReviewWindowService(windowRepo, auditBridge, idempotencyService);
const escalationService = new FollowUpEscalationPlanService(escalationRepo, safetyService, auditBridge, idempotencyService);
const summaryService = new FollowUpSummaryService(summaryRepo, auditBridge, idempotencyService);

function extractContext(req: Request): ResultFollowUpCommandContext {
  return {
    schoolId: (req as any).schoolId || 'unknown',
    actorId: (req as any).actorId || 'unknown',
    actorRole: (req as any).actorRole || 'unknown',
    correlationId: (req as any).correlationId || uuidv4(),
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || uuidv4(),
  };
}

function sendEnvelope(res: Response, envelope: ResultFollowUpSafeEnvelope): void {
  res.status(envelope.ok ? 200 : 400).json(envelope);
}

// ─── CASES ─────────────────────────────────────────────────

router.post('/cases', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.createFollowUpCase(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/cases', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.listFollowUpCasesForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/cases/status/:caseStatus', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.listFollowUpCasesByStatus(ctx, req.params.caseStatus);
  sendEnvelope(res, result);
});

router.get('/cases/priority/:casePriority', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.listFollowUpCasesByPriority(ctx, req.params.casePriority);
  sendEnvelope(res, result);
});

router.get('/cases/type/:caseType', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.listFollowUpCasesByType(ctx, req.params.caseType);
  sendEnvelope(res, result);
});

router.get('/cases/:resultFollowUpCaseId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.getFollowUpCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/cases', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.listFollowUpCasesForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.post('/cases/:resultFollowUpCaseId/open', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.openFollowUpCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.post('/cases/:resultFollowUpCaseId/triage', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.triageFollowUpCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.post('/cases/:resultFollowUpCaseId/planned', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.markCasePlanned(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.post('/cases/:resultFollowUpCaseId/review', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.markCaseUnderReview(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.post('/cases/:resultFollowUpCaseId/close', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.closeFollowUpCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.post('/cases/:resultFollowUpCaseId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.blockFollowUpCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.post('/cases/:resultFollowUpCaseId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await caseService.voidFollowUpCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

// ─── SIGNALS ───────────────────────────────────────────────

router.post('/cases/:resultFollowUpCaseId/signals', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await signalService.createSignal(ctx, {
    ...req.body,
    resultFollowUpCaseId: req.params.resultFollowUpCaseId,
  });
  sendEnvelope(res, result);
});

router.get('/cases/:resultFollowUpCaseId/signals', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await signalService.listSignalsForCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/signals', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await signalService.listSignalsForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/signals/:resultFollowUpSignalId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await signalService.getSignal(ctx, req.params.resultFollowUpSignalId);
  sendEnvelope(res, result);
});

router.post('/signals/:resultFollowUpSignalId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await signalService.suppressSignal(ctx, req.params.resultFollowUpSignalId);
  sendEnvelope(res, result);
});

router.post('/signals/:resultFollowUpSignalId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await signalService.voidSignal(ctx, req.params.resultFollowUpSignalId);
  sendEnvelope(res, result);
});

// ─── ACTION PLANS ───────────────────────────────────────────

router.post('/cases/:resultFollowUpCaseId/action-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.createActionPlan(ctx, {
    ...req.body,
    resultFollowUpCaseId: req.params.resultFollowUpCaseId,
  });
  sendEnvelope(res, result);
});

router.get('/cases/:resultFollowUpCaseId/action-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.listActionPlansForCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.get('/action-plans/:resultFollowUpActionPlanId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.getActionPlan(ctx, req.params.resultFollowUpActionPlanId);
  sendEnvelope(res, result);
});

router.post('/action-plans/:resultFollowUpActionPlanId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.markActionPlanReviewReady(ctx, req.params.resultFollowUpActionPlanId);
  sendEnvelope(res, result);
});

router.post('/action-plans/:resultFollowUpActionPlanId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.approveActionPlanForFutureUse(ctx, req.params.resultFollowUpActionPlanId);
  sendEnvelope(res, result);
});

router.post('/action-plans/:resultFollowUpActionPlanId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.suppressActionPlan(ctx, req.params.resultFollowUpActionPlanId);
  sendEnvelope(res, result);
});

router.post('/action-plans/:resultFollowUpActionPlanId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.blockActionPlan(ctx, req.params.resultFollowUpActionPlanId);
  sendEnvelope(res, result);
});

router.post('/action-plans/:resultFollowUpActionPlanId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await planService.voidActionPlan(ctx, req.params.resultFollowUpActionPlanId);
  sendEnvelope(res, result);
});

// ─── TEACHER QUEUE ─────────────────────────────────────────

router.post('/action-plans/:resultFollowUpActionPlanId/teacher-queue', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.createTeacherQueueItem(ctx, {
    ...req.body,
    resultFollowUpActionPlanId: req.params.resultFollowUpActionPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/cases/:resultFollowUpCaseId/teacher-queue', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.listTeacherQueueItemsForCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.get('/teachers/:teacherRef/teacher-queue', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.listTeacherQueueItemsForTeacher(ctx, req.params.teacherRef);
  sendEnvelope(res, result);
});

router.get('/teacher-queue/:teacherFollowUpQueueItemId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.getTeacherQueueItem(ctx, req.params.teacherFollowUpQueueItemId);
  sendEnvelope(res, result);
});

router.post('/teacher-queue/:teacherFollowUpQueueItemId/queue-review', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.markQueueItemQueued(ctx, req.params.teacherFollowUpQueueItemId);
  sendEnvelope(res, result);
});

router.post('/teacher-queue/:teacherFollowUpQueueItemId/acknowledge-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.acknowledgeQueueItemMock(ctx, req.params.teacherFollowUpQueueItemId);
  sendEnvelope(res, result);
});

router.post('/teacher-queue/:teacherFollowUpQueueItemId/complete-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.completeQueueItemMock(ctx, req.params.teacherFollowUpQueueItemId);
  sendEnvelope(res, result);
});

router.post('/teacher-queue/:teacherFollowUpQueueItemId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.suppressQueueItem(ctx, req.params.teacherFollowUpQueueItemId);
  sendEnvelope(res, result);
});

router.post('/teacher-queue/:teacherFollowUpQueueItemId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.blockQueueItem(ctx, req.params.teacherFollowUpQueueItemId);
  sendEnvelope(res, result);
});

router.post('/teacher-queue/:teacherFollowUpQueueItemId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await queueService.voidQueueItem(ctx, req.params.teacherFollowUpQueueItemId);
  sendEnvelope(res, result);
});

// ─── PARENT GUIDANCE DRAFTS ─────────────────────────────────

router.post('/action-plans/:resultFollowUpActionPlanId/parent-guidance-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentGuidanceService.createParentGuidanceDraft(ctx, {
    ...req.body,
    resultFollowUpActionPlanId: req.params.resultFollowUpActionPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/cases/:resultFollowUpCaseId/parent-guidance-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentGuidanceService.listParentGuidanceDraftsForCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.get('/action-plans/:resultFollowUpActionPlanId/parent-guidance-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentGuidanceService.listParentGuidanceDraftsForActionPlan(ctx, req.params.resultFollowUpActionPlanId);
  sendEnvelope(res, result);
});

router.get('/parent-guidance-drafts/:parentGuidanceDraftId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentGuidanceService.getParentGuidanceDraft(ctx, req.params.parentGuidanceDraftId);
  sendEnvelope(res, result);
});

router.post('/parent-guidance-drafts/:parentGuidanceDraftId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentGuidanceService.markParentGuidanceReviewReady(ctx, req.params.parentGuidanceDraftId);
  sendEnvelope(res, result);
});

router.post('/parent-guidance-drafts/:parentGuidanceDraftId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentGuidanceService.approveParentGuidanceForFutureUse(ctx, req.params.parentGuidanceDraftId);
  sendEnvelope(res, result);
});

router.post('/parent-guidance-drafts/:parentGuidanceDraftId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentGuidanceService.suppressParentGuidanceDraft(ctx, req.params.parentGuidanceDraftId);
  sendEnvelope(res, result);
});

router.post('/parent-guidance-drafts/:parentGuidanceDraftId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentGuidanceService.blockParentGuidanceDraft(ctx, req.params.parentGuidanceDraftId);
  sendEnvelope(res, result);
});

router.post('/parent-guidance-drafts/:parentGuidanceDraftId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentGuidanceService.voidParentGuidanceDraft(ctx, req.params.parentGuidanceDraftId);
  sendEnvelope(res, result);
});

// ─── STUDENT REFLECTION DRAFTS ──────────────────────────────

router.post('/action-plans/:resultFollowUpActionPlanId/student-reflection-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.createStudentReflectionDraft(ctx, {
    ...req.body,
    resultFollowUpActionPlanId: req.params.resultFollowUpActionPlanId,
  });
  sendEnvelope(res, result);
});

router.get('/cases/:resultFollowUpCaseId/student-reflection-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.listStudentReflectionDraftsForCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.get('/action-plans/:resultFollowUpActionPlanId/student-reflection-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.listStudentReflectionDraftsForActionPlan(ctx, req.params.resultFollowUpActionPlanId);
  sendEnvelope(res, result);
});

router.get('/student-reflection-drafts/:studentReflectionTaskDraftId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.getStudentReflectionDraft(ctx, req.params.studentReflectionTaskDraftId);
  sendEnvelope(res, result);
});

router.post('/student-reflection-drafts/:studentReflectionTaskDraftId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.markStudentReflectionReviewReady(ctx, req.params.studentReflectionTaskDraftId);
  sendEnvelope(res, result);
});

router.post('/student-reflection-drafts/:studentReflectionTaskDraftId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.approveStudentReflectionForFutureUse(ctx, req.params.studentReflectionTaskDraftId);
  sendEnvelope(res, result);
});

router.post('/student-reflection-drafts/:studentReflectionTaskDraftId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.suppressStudentReflectionDraft(ctx, req.params.studentReflectionTaskDraftId);
  sendEnvelope(res, result);
});

router.post('/student-reflection-drafts/:studentReflectionTaskDraftId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.blockStudentReflectionDraft(ctx, req.params.studentReflectionTaskDraftId);
  sendEnvelope(res, result);
});

router.post('/student-reflection-drafts/:studentReflectionTaskDraftId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.voidStudentReflectionDraft(ctx, req.params.studentReflectionTaskDraftId);
  sendEnvelope(res, result);
});

// ─── REVIEW WINDOWS ────────────────────────────────────────

router.post('/cases/:resultFollowUpCaseId/review-windows', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await windowService.createReviewWindow(ctx, {
    ...req.body,
    resultFollowUpCaseId: req.params.resultFollowUpCaseId,
  });
  sendEnvelope(res, result);
});

router.get('/cases/:resultFollowUpCaseId/review-windows', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await windowService.listReviewWindowsForCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/review-windows', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await windowService.listReviewWindowsForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/review-windows/:followUpReviewWindowId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await windowService.getReviewWindow(ctx, req.params.followUpReviewWindowId);
  sendEnvelope(res, result);
});

router.post('/review-windows/:followUpReviewWindowId/schedule-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await windowService.scheduleReviewWindowMock(ctx, req.params.followUpReviewWindowId);
  sendEnvelope(res, result);
});

router.post('/review-windows/:followUpReviewWindowId/complete-mock', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await windowService.completeReviewWindowMock(ctx, req.params.followUpReviewWindowId);
  sendEnvelope(res, result);
});

router.post('/review-windows/:followUpReviewWindowId/cancel', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await windowService.cancelReviewWindow(ctx, req.params.followUpReviewWindowId);
  sendEnvelope(res, result);
});

router.post('/review-windows/:followUpReviewWindowId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await windowService.voidReviewWindow(ctx, req.params.followUpReviewWindowId);
  sendEnvelope(res, result);
});

// ─── ESCALATION PLANS ──────────────────────────────────────

router.post('/cases/:resultFollowUpCaseId/escalation-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await escalationService.createEscalationPlan(ctx, {
    ...req.body,
    resultFollowUpCaseId: req.params.resultFollowUpCaseId,
  });
  sendEnvelope(res, result);
});

router.get('/cases/:resultFollowUpCaseId/escalation-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await escalationService.listEscalationPlansForCase(ctx, req.params.resultFollowUpCaseId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/escalation-plans', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await escalationService.listEscalationPlansForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/escalation-plans/:followUpEscalationPlanId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await escalationService.getEscalationPlan(ctx, req.params.followUpEscalationPlanId);
  sendEnvelope(res, result);
});

router.post('/escalation-plans/:followUpEscalationPlanId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await escalationService.markEscalationPlanReviewReady(ctx, req.params.followUpEscalationPlanId);
  sendEnvelope(res, result);
});

router.post('/escalation-plans/:followUpEscalationPlanId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await escalationService.approveEscalationPlanForFutureUse(ctx, req.params.followUpEscalationPlanId);
  sendEnvelope(res, result);
});

router.post('/escalation-plans/:followUpEscalationPlanId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await escalationService.suppressEscalationPlan(ctx, req.params.followUpEscalationPlanId);
  sendEnvelope(res, result);
});

router.post('/escalation-plans/:followUpEscalationPlanId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await escalationService.blockEscalationPlan(ctx, req.params.followUpEscalationPlanId);
  sendEnvelope(res, result);
});

router.post('/escalation-plans/:followUpEscalationPlanId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await escalationService.voidEscalationPlan(ctx, req.params.followUpEscalationPlanId);
  sendEnvelope(res, result);
});

// ─── SUMMARIES ─────────────────────────────────────────────

router.post('/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.createSummary(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.listSummariesForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.listSummariesForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/summaries/:followUpSummaryId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.getSummary(ctx, req.params.followUpSummaryId);
  sendEnvelope(res, result);
});

router.post('/summaries/:followUpSummaryId/refresh', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.refreshSummary(ctx, req.params.followUpSummaryId);
  sendEnvelope(res, result);
});

router.post('/summaries/:followUpSummaryId/stale', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.markSummaryStale(ctx, req.params.followUpSummaryId);
  sendEnvelope(res, result);
});

router.post('/summaries/:followUpSummaryId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.blockSummary(ctx, req.params.followUpSummaryId);
  sendEnvelope(res, result);
});

router.post('/summaries/:followUpSummaryId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.voidSummary(ctx, req.params.followUpSummaryId);
  sendEnvelope(res, result);
});

export default router;
