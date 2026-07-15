import { Router, Request, Response } from 'express';
import {
  RecoveryOutcomeExecutionSimulationReadinessService,
  RecoveryOutcomeExecutionSimulationPlanService,
  RecoveryOutcomeExecutionSimulationRunService,
  RecoveryOutcomeExecutionSimulationStepService,
  RecoveryOutcomeExecutionEligibilityService,
  RecoveryOutcomeExecutionBlockedActionDiagnosticService,
  RecoveryOutcomeExecutionFailureInjectionService,
  RecoveryOutcomeExecutionSimulationResultService,
  RecoveryOutcomeExecutionTeacherReviewService,
  RecoveryOutcomeExecutionPreviewDraftService,
  RecoveryOutcomeExecutionReadinessVerdictService,
  RecoveryOutcomeExecutionSimulationSummaryService,
  RecoveryOutcomeExecutionSimulationSafetyService,
  RecoveryOutcomeExecutionSimulationAuditBridge,
  RecoveryOutcomeExecutionSimulationIdempotencyService,
} from '../domains/assessment/recovery-outcome-execution-simulation/services';
import {
  InMemorySimulationReadinessRepository,
  InMemorySimulationPlanRepository,
  InMemorySimulationRunRepository,
  InMemorySimulationStepRepository,
  InMemoryEligibilityCheckRepository,
  InMemoryBlockedActionDiagnosticRepository,
  InMemoryFailureInjectionRepository,
  InMemorySimulationResultRepository,
  InMemoryTeacherReviewRepository,
  InMemoryStudentPreviewDraftRepository,
  InMemoryParentPreviewDraftRepository,
  InMemoryReadinessVerdictRepository,
  InMemorySimulationSummaryRepository,
  InMemorySimulationAuditRepository,
  InMemorySimulationIdempotencyRepository,
} from '../domains/assessment/recovery-outcome-execution-simulation/repositories/inMemoryRecoveryOutcomeExecutionSimulationRepositories';
import { RecoveryOutcomeExecutionSimulationCommandContext } from '../domains/assessment/recovery-outcome-execution-simulation/contracts/recoveryOutcomeExecutionSimulationContracts';

const router = Router();

const auditRepo = new InMemorySimulationAuditRepository();
const idempotencyRepo = new InMemorySimulationIdempotencyRepository();
const safety = new RecoveryOutcomeExecutionSimulationSafetyService();
const audit = new RecoveryOutcomeExecutionSimulationAuditBridge(auditRepo);
const idempotency = new RecoveryOutcomeExecutionSimulationIdempotencyService(idempotencyRepo);

const readinessRepo = new InMemorySimulationReadinessRepository();
const planRepo = new InMemorySimulationPlanRepository();
const runRepo = new InMemorySimulationRunRepository();
const stepRepo = new InMemorySimulationStepRepository();
const eligibilityRepo = new InMemoryEligibilityCheckRepository();
const diagnosticRepo = new InMemoryBlockedActionDiagnosticRepository();
const failureRepo = new InMemoryFailureInjectionRepository();
const resultRepo = new InMemorySimulationResultRepository();
const teacherReviewRepo = new InMemoryTeacherReviewRepository();
const studentPreviewRepo = new InMemoryStudentPreviewDraftRepository();
const parentPreviewRepo = new InMemoryParentPreviewDraftRepository();
const verdictRepo = new InMemoryReadinessVerdictRepository();
const summaryRepo = new InMemorySimulationSummaryRepository();

const readinessService = new RecoveryOutcomeExecutionSimulationReadinessService(readinessRepo, safety, audit, idempotency);
const planService = new RecoveryOutcomeExecutionSimulationPlanService(planRepo, safety, audit, idempotency);
const runService = new RecoveryOutcomeExecutionSimulationRunService(runRepo, safety, audit, idempotency);
const stepService = new RecoveryOutcomeExecutionSimulationStepService(stepRepo, safety, audit, idempotency);
const eligibilityService = new RecoveryOutcomeExecutionEligibilityService(eligibilityRepo, safety, audit, idempotency);
const diagnosticService = new RecoveryOutcomeExecutionBlockedActionDiagnosticService(diagnosticRepo, safety, audit, idempotency);
const failureService = new RecoveryOutcomeExecutionFailureInjectionService(failureRepo, safety, audit, idempotency);
const resultService = new RecoveryOutcomeExecutionSimulationResultService(resultRepo, safety, audit, idempotency);
const teacherReviewService = new RecoveryOutcomeExecutionTeacherReviewService(teacherReviewRepo, safety, audit, idempotency);
const previewService = new RecoveryOutcomeExecutionPreviewDraftService(studentPreviewRepo, parentPreviewRepo, safety, audit, idempotency);
const verdictService = new RecoveryOutcomeExecutionReadinessVerdictService(verdictRepo, safety, audit, idempotency);
const summaryService = new RecoveryOutcomeExecutionSimulationSummaryService(summaryRepo, safety, audit, idempotency);

function buildContext(req: Request): RecoveryOutcomeExecutionSimulationCommandContext {
  return {
    schoolId: (req as any).schoolId || (req.headers['x-school-id'] as string) || '',
    actorId: (req as any).userId || (req.headers['x-user-id'] as string) || '',
    actorRole: (req as any).userRole || (req.headers['x-user-role'] as string) || '',
    correlationId: (req.headers['x-correlation-id'] as string) || `corr-${Date.now()}`,
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || `ik-${Date.now()}`,
    sourceRefsJson: req.body?.sourceRefsJson,
  };
}

function extractSchoolId(req: Request): string {
  return (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
}

function sendResponse(res: Response, result: any) {
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
}

// ─── Simulation Readiness ───────────────────────────────────────────
router.post('/simulation-readiness', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.createSimulationReadiness(buildContext(req), req.body));
});

router.get('/simulation-readiness', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId, status } = req.query;
  if (studentRef) { sendResponse(res, await readinessService.listSimulationReadinessForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await readinessService.listSimulationReadinessForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await readinessService.listSimulationReadinessByStatus(schoolId, status as string)); return; }
  sendResponse(res, await readinessService.listSimulationReadinessForSchool(schoolId));
});

router.get('/simulation-readiness/:id', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.getSimulationReadiness(extractSchoolId(req), req.params.id));
});

router.post('/simulation-readiness/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.markSimulationReadinessReviewReady(buildContext(req), req.params.id));
});

router.post('/simulation-readiness/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.approveSimulationReadinessForFutureUse(buildContext(req), req.params.id));
});

router.post('/simulation-readiness/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.suppressSimulationReadiness(buildContext(req), req.params.id));
});

router.post('/simulation-readiness/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.blockSimulationReadiness(buildContext(req), req.params.id, req.body?.reasonCodes));
});

router.post('/simulation-readiness/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await readinessService.voidSimulationReadiness(buildContext(req), req.params.id));
});

// ─── Simulation Plans ───────────────────────────────────────────────
router.post('/simulation-plans', async (req: Request, res: Response) => {
  sendResponse(res, await planService.createSimulationPlan(buildContext(req), req.body));
});

router.get('/simulation-plans', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId, status } = req.query;
  if (studentRef) { sendResponse(res, await planService.listSimulationPlansForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await planService.listSimulationPlansForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await planService.listSimulationPlansByStatus(schoolId, status as string)); return; }
  sendResponse(res, await planService.listSimulationPlansForSchool(schoolId));
});

router.get('/simulation-plans/:id', async (req: Request, res: Response) => {
  sendResponse(res, await planService.getSimulationPlan(extractSchoolId(req), req.params.id));
});

router.post('/simulation-plans/:id/simulation-ready', async (req: Request, res: Response) => {
  sendResponse(res, await planService.markSimulationPlanReady(buildContext(req), req.params.id));
});

router.post('/simulation-plans/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await planService.markSimulationPlanReviewReady(buildContext(req), req.params.id));
});

router.post('/simulation-plans/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await planService.approveSimulationPlanForFutureUse(buildContext(req), req.params.id));
});

router.post('/simulation-plans/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await planService.suppressSimulationPlan(buildContext(req), req.params.id));
});

router.post('/simulation-plans/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await planService.blockSimulationPlan(buildContext(req), req.params.id));
});

router.post('/simulation-plans/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await planService.voidSimulationPlan(buildContext(req), req.params.id));
});

// ─── Simulation Runs ────────────────────────────────────────────────
router.post('/simulation-runs', async (req: Request, res: Response) => {
  sendResponse(res, await runService.createSimulationRun(buildContext(req), req.body));
});

router.get('/simulation-runs', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId, simulationPlanId, status } = req.query;
  if (studentRef) { sendResponse(res, await runService.listSimulationRunsForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await runService.listSimulationRunsForPlan(schoolId, planId as string)); return; }
  if (simulationPlanId) { sendResponse(res, await runService.listSimulationRunsForSimulationPlan(schoolId, simulationPlanId as string)); return; }
  if (status) { sendResponse(res, await runService.listSimulationRunsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await runService.listSimulationRunsForSchool(schoolId));
});

router.get('/simulation-runs/:id', async (req: Request, res: Response) => {
  sendResponse(res, await runService.getSimulationRun(extractSchoolId(req), req.params.id));
});

router.post('/simulation-runs/:id/simulating', async (req: Request, res: Response) => {
  sendResponse(res, await runService.markSimulationRunSimulating(buildContext(req), req.params.id));
});

router.post('/simulation-runs/:id/simulated', async (req: Request, res: Response) => {
  sendResponse(res, await runService.markSimulationRunSimulated(buildContext(req), req.params.id));
});

router.post('/simulation-runs/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await runService.markSimulationRunReviewReady(buildContext(req), req.params.id));
});

router.post('/simulation-runs/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await runService.suppressSimulationRun(buildContext(req), req.params.id));
});

router.post('/simulation-runs/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await runService.blockSimulationRun(buildContext(req), req.params.id));
});

router.post('/simulation-runs/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await runService.voidSimulationRun(buildContext(req), req.params.id));
});

// ─── Simulation Steps ───────────────────────────────────────────────
router.post('/simulation-steps', async (req: Request, res: Response) => {
  sendResponse(res, await stepService.createSimulationStep(buildContext(req), req.body));
});

router.get('/simulation-steps', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { simulationRunId, status } = req.query;
  if (simulationRunId) { sendResponse(res, await stepService.listStepsForSimulationRun(schoolId, simulationRunId as string)); return; }
  if (status) { sendResponse(res, await stepService.listStepsByStatus(schoolId, status as string)); return; }
  sendResponse(res, { success: false, status: 'error', message: 'simulationRunId query parameter required' });
});

router.get('/simulation-steps/:id', async (req: Request, res: Response) => {
  sendResponse(res, await stepService.getSimulationStep(extractSchoolId(req), req.params.id));
});

router.post('/simulation-steps/:id/simulated', async (req: Request, res: Response) => {
  sendResponse(res, await stepService.markStepSimulated(buildContext(req), req.params.id));
});

router.post('/simulation-steps/:id/blocked', async (req: Request, res: Response) => {
  sendResponse(res, await stepService.markStepBlocked(buildContext(req), req.params.id));
});

router.post('/simulation-steps/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await stepService.voidStep(buildContext(req), req.params.id));
});

// ─── Eligibility Checks ─────────────────────────────────────────────
router.post('/eligibility-checks', async (req: Request, res: Response) => {
  sendResponse(res, await eligibilityService.createEligibilityCheck(buildContext(req), req.body));
});

router.get('/eligibility-checks', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, actionBundleId, result } = req.query;
  if (planId) { sendResponse(res, await eligibilityService.listEligibilityChecksForPlan(schoolId, planId as string)); return; }
  if (actionBundleId) { sendResponse(res, await eligibilityService.listEligibilityChecksForActionBundle(schoolId, actionBundleId as string)); return; }
  if (result) { sendResponse(res, await eligibilityService.listEligibilityChecksByResult(schoolId, result as string)); return; }
  sendResponse(res, await eligibilityService.listEligibilityChecksForPlan(schoolId, ''));
});

router.get('/eligibility-checks/:id', async (req: Request, res: Response) => {
  sendResponse(res, await eligibilityService.getEligibilityCheck(extractSchoolId(req), req.params.id));
});

router.post('/eligibility-checks/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await eligibilityService.markEligibilityCheckReviewReady(buildContext(req), req.params.id));
});

router.post('/eligibility-checks/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await eligibilityService.voidEligibilityCheck(buildContext(req), req.params.id));
});

// ─── Blocked Action Diagnostics ─────────────────────────────────────
router.post('/blocked-action-diagnostics', async (req: Request, res: Response) => {
  sendResponse(res, await diagnosticService.createBlockedActionDiagnostic(buildContext(req), req.body));
});

router.get('/blocked-action-diagnostics', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { simulationRunId, planId, reason } = req.query;
  if (simulationRunId) { sendResponse(res, await diagnosticService.listDiagnosticsForSimulationRun(schoolId, simulationRunId as string)); return; }
  if (planId) { sendResponse(res, await diagnosticService.listDiagnosticsForPlan(schoolId, planId as string)); return; }
  if (reason) { sendResponse(res, await diagnosticService.listDiagnosticsByReason(schoolId, reason as string)); return; }
  sendResponse(res, { success: false, status: 'error', message: 'simulationRunId or planId query parameter required' });
});

router.get('/blocked-action-diagnostics/:id', async (req: Request, res: Response) => {
  sendResponse(res, await diagnosticService.getBlockedActionDiagnostic(extractSchoolId(req), req.params.id));
});

router.post('/blocked-action-diagnostics/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await diagnosticService.markDiagnosticReviewReady(buildContext(req), req.params.id));
});

router.post('/blocked-action-diagnostics/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await diagnosticService.suppressDiagnostic(buildContext(req), req.params.id));
});

router.post('/blocked-action-diagnostics/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await diagnosticService.voidDiagnostic(buildContext(req), req.params.id));
});

// ─── Failure Injections ─────────────────────────────────────────────
router.post('/failure-injections', async (req: Request, res: Response) => {
  sendResponse(res, await failureService.createFailureInjectionScenario(buildContext(req), req.body));
});

router.get('/failure-injections', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, injectionType } = req.query;
  if (planId) { sendResponse(res, await failureService.listFailureInjectionScenariosForPlan(schoolId, planId as string)); return; }
  if (injectionType) { sendResponse(res, await failureService.listFailureInjectionScenariosByType(schoolId, injectionType as string)); return; }
  sendResponse(res, await failureService.listFailureInjectionScenariosForPlan(schoolId, ''));
});

router.get('/failure-injections/:id', async (req: Request, res: Response) => {
  sendResponse(res, await failureService.getFailureInjectionScenario(extractSchoolId(req), req.params.id));
});

router.post('/failure-injections/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await failureService.markFailureInjectionReviewReady(buildContext(req), req.params.id));
});

router.post('/failure-injections/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await failureService.approveFailureInjectionForFutureUse(buildContext(req), req.params.id));
});

router.post('/failure-injections/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await failureService.suppressFailureInjection(buildContext(req), req.params.id));
});

router.post('/failure-injections/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await failureService.blockFailureInjection(buildContext(req), req.params.id));
});

router.post('/failure-injections/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await failureService.voidFailureInjection(buildContext(req), req.params.id));
});

// ─── Simulation Results ─────────────────────────────────────────────
router.post('/simulation-results', async (req: Request, res: Response) => {
  sendResponse(res, await resultService.createSimulationResult(buildContext(req), req.body));
});

router.get('/simulation-results', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { simulationRunId, planId, outcome } = req.query;
  if (simulationRunId) { sendResponse(res, await resultService.listResultsForSimulationRun(schoolId, simulationRunId as string)); return; }
  if (planId) { sendResponse(res, await resultService.listResultsForPlan(schoolId, planId as string)); return; }
  if (outcome) { sendResponse(res, await resultService.listResultsByOutcome(schoolId, outcome as string)); return; }
  sendResponse(res, { success: false, status: 'error', message: 'simulationRunId query parameter required' });
});

router.get('/simulation-results/:id', async (req: Request, res: Response) => {
  sendResponse(res, await resultService.getSimulationResult(extractSchoolId(req), req.params.id));
});

router.post('/simulation-results/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await resultService.markSimulationResultReviewReady(buildContext(req), req.params.id));
});

router.post('/simulation-results/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await resultService.voidSimulationResult(buildContext(req), req.params.id));
});

// ─── Teacher Simulation Reviews ─────────────────────────────────────
router.post('/teacher-simulation-reviews', async (req: Request, res: Response) => {
  sendResponse(res, await teacherReviewService.createTeacherSimulationReview(buildContext(req), req.body));
});

router.get('/teacher-simulation-reviews', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, simulationRunId, teacherRef } = req.query;
  if (planId) { sendResponse(res, await teacherReviewService.listTeacherSimulationReviewsForPlan(schoolId, planId as string)); return; }
  if (simulationRunId) { sendResponse(res, await teacherReviewService.listTeacherSimulationReviewsForSimulationRun(schoolId, simulationRunId as string)); return; }
  if (teacherRef) { sendResponse(res, await teacherReviewService.listTeacherSimulationReviewsByTeacher(schoolId, teacherRef as string)); return; }
  sendResponse(res, await teacherReviewService.listTeacherSimulationReviewsForPlan(schoolId, ''));
});

router.get('/teacher-simulation-reviews/:id', async (req: Request, res: Response) => {
  sendResponse(res, await teacherReviewService.getTeacherSimulationReview(extractSchoolId(req), req.params.id));
});

router.post('/teacher-simulation-reviews/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await teacherReviewService.markTeacherSimulationReviewReady(buildContext(req), req.params.id));
});

router.post('/teacher-simulation-reviews/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await teacherReviewService.approveTeacherSimulationReviewForFutureUse(buildContext(req), req.params.id));
});

router.post('/teacher-simulation-reviews/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await teacherReviewService.suppressTeacherSimulationReview(buildContext(req), req.params.id));
});

router.post('/teacher-simulation-reviews/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await teacherReviewService.blockTeacherSimulationReview(buildContext(req), req.params.id));
});

router.post('/teacher-simulation-reviews/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await teacherReviewService.voidTeacherSimulationReview(buildContext(req), req.params.id));
});

// ─── Student Preview Drafts ─────────────────────────────────────────
router.post('/student-preview-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.createStudentPreviewDraft(buildContext(req), req.body));
});

router.get('/student-preview-drafts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await previewService.listStudentPreviewDraftsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await previewService.listStudentPreviewDraftsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await previewService.listStudentPreviewDraftsForPlan(schoolId, ''));
});

router.get('/student-preview-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.getStudentPreviewDraft(extractSchoolId(req), req.params.id));
});

router.post('/student-preview-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.markStudentPreviewDraftReviewReady(buildContext(req), req.params.id));
});

router.post('/student-preview-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.approveStudentPreviewDraftForFutureUse(buildContext(req), req.params.id));
});

router.post('/student-preview-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.suppressStudentPreviewDraft(buildContext(req), req.params.id));
});

router.post('/student-preview-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.blockStudentPreviewDraft(buildContext(req), req.params.id));
});

router.post('/student-preview-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.voidStudentPreviewDraft(buildContext(req), req.params.id));
});

// ─── Parent Preview Drafts ──────────────────────────────────────────
router.post('/parent-preview-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.createParentPreviewDraft(buildContext(req), req.body));
});

router.get('/parent-preview-drafts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, status } = req.query;
  if (planId) { sendResponse(res, await previewService.listParentPreviewDraftsForPlan(schoolId, planId as string)); return; }
  if (status) { sendResponse(res, await previewService.listParentPreviewDraftsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await previewService.listParentPreviewDraftsForPlan(schoolId, ''));
});

router.get('/parent-preview-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.getParentPreviewDraft(extractSchoolId(req), req.params.id));
});

router.post('/parent-preview-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.markParentPreviewDraftReviewReady(buildContext(req), req.params.id));
});

router.post('/parent-preview-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.approveParentPreviewDraftForFutureUse(buildContext(req), req.params.id));
});

router.post('/parent-preview-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.suppressParentPreviewDraft(buildContext(req), req.params.id));
});

router.post('/parent-preview-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.blockParentPreviewDraft(buildContext(req), req.params.id));
});

router.post('/parent-preview-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await previewService.voidParentPreviewDraft(buildContext(req), req.params.id));
});

// ─── Readiness Verdicts ─────────────────────────────────────────────
router.post('/readiness-verdicts', async (req: Request, res: Response) => {
  sendResponse(res, await verdictService.createReadinessVerdict(buildContext(req), req.body));
});

router.get('/readiness-verdicts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { planId, simulationRunId, status } = req.query;
  if (planId) { sendResponse(res, await verdictService.listReadinessVerdictsForPlan(schoolId, planId as string)); return; }
  if (simulationRunId) { sendResponse(res, await verdictService.listReadinessVerdictsForSimulationRun(schoolId, simulationRunId as string)); return; }
  if (status) { sendResponse(res, await verdictService.listReadinessVerdictsByStatus(schoolId, status as string)); return; }
  sendResponse(res, await verdictService.listReadinessVerdictsForPlan(schoolId, ''));
});

router.get('/readiness-verdicts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await verdictService.getReadinessVerdict(extractSchoolId(req), req.params.id));
});

router.post('/readiness-verdicts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await verdictService.markReadinessVerdictReviewReady(buildContext(req), req.params.id));
});

router.post('/readiness-verdicts/:id/approve-future-use', async (req: Request, res: Response) => {
  sendResponse(res, await verdictService.approveReadinessVerdictForFutureUse(buildContext(req), req.params.id));
});

router.post('/readiness-verdicts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await verdictService.suppressReadinessVerdict(buildContext(req), req.params.id));
});

router.post('/readiness-verdicts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await verdictService.blockReadinessVerdict(buildContext(req), req.params.id));
});

router.post('/readiness-verdicts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await verdictService.voidReadinessVerdict(buildContext(req), req.params.id));
});

// ─── Summaries ──────────────────────────────────────────────────────
router.post('/summaries', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.createSimulationSummary(buildContext(req), req.body));
});

router.get('/summaries', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  const { studentRef, planId } = req.query;
  if (studentRef) { sendResponse(res, await summaryService.listSimulationSummariesForStudent(schoolId, studentRef as string)); return; }
  if (planId) { sendResponse(res, await summaryService.listSimulationSummariesForPlan(schoolId, planId as string)); return; }
  sendResponse(res, await summaryService.listSimulationSummariesForSchool(schoolId));
});

router.get('/summaries/:id', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.getSimulationSummary(extractSchoolId(req), req.params.id));
});

router.post('/summaries/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.refreshSimulationSummary(buildContext(req), req.params.id, req.body));
});

router.post('/summaries/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.markSimulationSummaryStale(buildContext(req), req.params.id));
});

router.post('/summaries/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.blockSimulationSummary(buildContext(req), req.params.id));
});

router.post('/summaries/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.voidSimulationSummary(buildContext(req), req.params.id));
});

export default router;
