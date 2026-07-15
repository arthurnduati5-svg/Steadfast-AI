import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import {
  InMemoryRecoveryOutcomeDecisionReadinessRepository,
  InMemoryRecoveryExitCriteriaRepository,
  InMemoryRecoveryExitCriteriaEvaluationRepository,
  InMemoryRecoveryContinuationDecisionDraftRepository,
  InMemoryRecoveryIntensificationDecisionDraftRepository,
  InMemoryRecoveryPauseDecisionDraftRepository,
  InMemoryRecoveryClosureDecisionDraftRepository,
  InMemoryRecoveryOutcomeTeacherReviewPacketRepository,
  InMemoryRecoveryOutcomeStudentNextStepDraftRepository,
  InMemoryRecoveryOutcomeParentUpdateDraftRepository,
  InMemoryRecoveryOutcomeDecisionSummaryRepository,
  InMemoryRecoveryOutcomeAuditRepository,
  InMemoryRecoveryOutcomeIdempotencyRepository,
} from '../domains/assessment/recovery-outcome/repositories/inMemoryRecoveryOutcomeRepositories';
import {
  RecoveryOutcomeSafetyService,
  RecoveryOutcomeIdempotencyService,
  RecoveryOutcomeAuditBridge,
  RecoveryOutcomeDecisionReadinessService,
  RecoveryExitCriteriaService,
  RecoveryExitCriteriaEvaluationService,
  RecoveryContinuationDecisionDraftService,
  RecoveryIntensificationDecisionDraftService,
  RecoveryPauseDecisionDraftService,
  RecoveryClosureDecisionDraftService,
  RecoveryOutcomeTeacherReviewPacketService,
  RecoveryOutcomeStudentNextStepDraftService,
  RecoveryOutcomeParentUpdateDraftService,
  RecoveryOutcomeDecisionSummaryService,
} from '../domains/assessment/recovery-outcome/services';
import { RecoveryOutcomeCommandContext, RecoveryOutcomeSafeEnvelope } from '../domains/assessment/recovery-outcome/contracts/recoveryOutcomeContracts';

const router = Router();

const readinessRepo = new InMemoryRecoveryOutcomeDecisionReadinessRepository();
const exitCriteriaRepo = new InMemoryRecoveryExitCriteriaRepository();
const exitCriteriaEvalRepo = new InMemoryRecoveryExitCriteriaEvaluationRepository();
const continuationDraftRepo = new InMemoryRecoveryContinuationDecisionDraftRepository();
const intensificationDraftRepo = new InMemoryRecoveryIntensificationDecisionDraftRepository();
const pauseDraftRepo = new InMemoryRecoveryPauseDecisionDraftRepository();
const closureDraftRepo = new InMemoryRecoveryClosureDecisionDraftRepository();
const teacherReviewPacketRepo = new InMemoryRecoveryOutcomeTeacherReviewPacketRepository();
const studentNextStepDraftRepo = new InMemoryRecoveryOutcomeStudentNextStepDraftRepository();
const parentUpdateDraftRepo = new InMemoryRecoveryOutcomeParentUpdateDraftRepository();
const summaryRepo = new InMemoryRecoveryOutcomeDecisionSummaryRepository();
const auditRepo = new InMemoryRecoveryOutcomeAuditRepository();
const idempotencyRepo = new InMemoryRecoveryOutcomeIdempotencyRepository();

const idempotencyService = new RecoveryOutcomeIdempotencyService(idempotencyRepo as any);
const auditBridge = new RecoveryOutcomeAuditBridge(auditRepo as any);
const safetyService = new RecoveryOutcomeSafetyService();

const readinessService = new RecoveryOutcomeDecisionReadinessService(readinessRepo as any, safetyService, auditBridge, idempotencyService);
const exitCriteriaService = new RecoveryExitCriteriaService(exitCriteriaRepo as any, safetyService, auditBridge, idempotencyService);
const exitCriteriaEvalService = new RecoveryExitCriteriaEvaluationService(exitCriteriaEvalRepo as any, safetyService, auditBridge, idempotencyService);
const continuationDraftService = new RecoveryContinuationDecisionDraftService(continuationDraftRepo as any, safetyService, auditBridge, idempotencyService);
const intensificationDraftService = new RecoveryIntensificationDecisionDraftService(intensificationDraftRepo as any, safetyService, auditBridge, idempotencyService);
const pauseDraftService = new RecoveryPauseDecisionDraftService(pauseDraftRepo as any, safetyService, auditBridge, idempotencyService);
const closureDraftService = new RecoveryClosureDecisionDraftService(closureDraftRepo as any, safetyService, auditBridge, idempotencyService);
const teacherReviewPacketService = new RecoveryOutcomeTeacherReviewPacketService(teacherReviewPacketRepo as any, safetyService, auditBridge, idempotencyService);
const studentNextStepDraftService = new RecoveryOutcomeStudentNextStepDraftService(studentNextStepDraftRepo as any, safetyService, auditBridge, idempotencyService);
const parentUpdateDraftService = new RecoveryOutcomeParentUpdateDraftService(parentUpdateDraftRepo as any, safetyService, auditBridge, idempotencyService);
const summaryService = new RecoveryOutcomeDecisionSummaryService(summaryRepo as any, safetyService, auditBridge, idempotencyService);

function extractContext(req: Request): RecoveryOutcomeCommandContext {
  return {
    schoolId: (req as any).schoolId || 'unknown',
    actorId: (req as any).actorId || 'unknown',
    actorRole: (req as any).actorRole || 'unknown',
    correlationId: (req as any).correlationId || randomUUID(),
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || randomUUID(),
  };
}

function sendEnvelope(res: Response, envelope: RecoveryOutcomeSafeEnvelope): void {
  res.status(envelope.ok ? 200 : 400).json(envelope);
}

// ─── DECISION READINESS ───────────────────────────

router.post('/decision-readiness', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await readinessService.createDecisionReadiness(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/decision-readiness', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { studentRef, planId, status } = req.query;
  if (studentRef) { const r = await readinessService.listDecisionReadinessForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  if (planId) { const r = await readinessService.listDecisionReadinessForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (status) { const r = await readinessService.listDecisionReadinessByStatus(ctx, status as string); sendEnvelope(res, r); return; }
  const result = await readinessService.listDecisionReadinessForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/decision-readiness/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await readinessService.getDecisionReadiness(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/decision-readiness/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await readinessService.markDecisionReadinessReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/decision-readiness/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await readinessService.approveDecisionReadinessForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/decision-readiness/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await readinessService.suppressDecisionReadiness(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/decision-readiness/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await readinessService.blockDecisionReadiness(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/decision-readiness/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await readinessService.voidDecisionReadiness(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── EXIT CRITERIA ────────────────────────────────

router.post('/exit-criteria', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaService.createExitCriteria(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/exit-criteria', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { planId, status } = req.query;
  if (planId) { const r = await exitCriteriaService.listExitCriteriaForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (status) { const r = await exitCriteriaService.listExitCriteriaByStatus(ctx, status as string); sendEnvelope(res, r); return; }
  const result = await exitCriteriaService.listExitCriteriaForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/exit-criteria/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaService.getExitCriteria(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/exit-criteria/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaService.markExitCriteriaReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/exit-criteria/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaService.approveExitCriteriaForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/exit-criteria/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaService.suppressExitCriteria(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/exit-criteria/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaService.blockExitCriteria(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/exit-criteria/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaService.voidExitCriteria(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── EXIT CRITERIA EVALUATIONS ────────────────────

router.post('/exit-criteria-evaluations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaEvalService.createExitCriteriaEvaluation(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/exit-criteria-evaluations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { criteriaId, planId, studentRef, result: evalResult } = req.query;
  if (criteriaId) { const r = await exitCriteriaEvalService.listEvaluationsForCriteria(ctx, criteriaId as string); sendEnvelope(res, r); return; }
  if (planId) { const r = await exitCriteriaEvalService.listEvaluationsForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (studentRef) { const r = await exitCriteriaEvalService.listEvaluationsForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  if (evalResult) { const r = await exitCriteriaEvalService.listEvaluationsByResult(ctx, evalResult as string); sendEnvelope(res, r); return; }
  const result = await exitCriteriaEvalService.listEvaluationsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/exit-criteria-evaluations/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaEvalService.getExitCriteriaEvaluation(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/exit-criteria-evaluations/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaEvalService.markEvaluationReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/exit-criteria-evaluations/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaEvalService.approveEvaluationForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/exit-criteria-evaluations/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaEvalService.suppressEvaluation(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/exit-criteria-evaluations/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaEvalService.blockEvaluation(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/exit-criteria-evaluations/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await exitCriteriaEvalService.voidEvaluation(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── CONTINUATION DRAFTS ──────────────────────────

router.post('/continuation-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await continuationDraftService.createContinuationDecisionDraft(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/continuation-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { planId, studentRef, status } = req.query;
  if (planId) { const r = await continuationDraftService.listDecisionDraftsForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (studentRef) { const r = await continuationDraftService.listDecisionDraftsForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  if (status) { const r = await continuationDraftService.listDecisionDraftsByStatus(ctx, status as string); sendEnvelope(res, r); return; }
  const result = await continuationDraftService.listDecisionDraftsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/continuation-drafts/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await continuationDraftService.getDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/continuation-drafts/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await continuationDraftService.markDecisionDraftReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/continuation-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await continuationDraftService.approveDecisionDraftForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/continuation-drafts/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await continuationDraftService.suppressDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/continuation-drafts/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await continuationDraftService.blockDecisionDraft(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/continuation-drafts/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await continuationDraftService.voidDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── INTENSIFICATION DRAFTS ───────────────────────

router.post('/intensification-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await intensificationDraftService.createIntensificationDecisionDraft(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/intensification-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { planId, studentRef, status } = req.query;
  if (planId) { const r = await intensificationDraftService.listDecisionDraftsForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (studentRef) { const r = await intensificationDraftService.listDecisionDraftsForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  if (status) { const r = await intensificationDraftService.listDecisionDraftsByStatus(ctx, status as string); sendEnvelope(res, r); return; }
  const result = await intensificationDraftService.listDecisionDraftsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/intensification-drafts/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await intensificationDraftService.getDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/intensification-drafts/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await intensificationDraftService.markDecisionDraftReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/intensification-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await intensificationDraftService.approveDecisionDraftForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/intensification-drafts/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await intensificationDraftService.suppressDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/intensification-drafts/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await intensificationDraftService.blockDecisionDraft(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/intensification-drafts/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await intensificationDraftService.voidDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── PAUSE DRAFTS ─────────────────────────────────

router.post('/pause-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await pauseDraftService.createPauseDecisionDraft(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/pause-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { planId, studentRef, status } = req.query;
  if (planId) { const r = await pauseDraftService.listDecisionDraftsForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (studentRef) { const r = await pauseDraftService.listDecisionDraftsForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  if (status) { const r = await pauseDraftService.listDecisionDraftsByStatus(ctx, status as string); sendEnvelope(res, r); return; }
  const result = await pauseDraftService.listDecisionDraftsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/pause-drafts/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await pauseDraftService.getDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/pause-drafts/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await pauseDraftService.markDecisionDraftReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/pause-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await pauseDraftService.approveDecisionDraftForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/pause-drafts/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await pauseDraftService.suppressDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/pause-drafts/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await pauseDraftService.blockDecisionDraft(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/pause-drafts/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await pauseDraftService.voidDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── CLOSURE DRAFTS ───────────────────────────────

router.post('/closure-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await closureDraftService.createClosureDecisionDraft(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/closure-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { planId, studentRef, status } = req.query;
  if (planId) { const r = await closureDraftService.listDecisionDraftsForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (studentRef) { const r = await closureDraftService.listDecisionDraftsForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  if (status) { const r = await closureDraftService.listDecisionDraftsByStatus(ctx, status as string); sendEnvelope(res, r); return; }
  const result = await closureDraftService.listDecisionDraftsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/closure-drafts/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await closureDraftService.getDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/closure-drafts/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await closureDraftService.markDecisionDraftReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/closure-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await closureDraftService.approveDecisionDraftForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/closure-drafts/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await closureDraftService.suppressDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/closure-drafts/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await closureDraftService.blockDecisionDraft(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/closure-drafts/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await closureDraftService.voidDecisionDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── TEACHER REVIEW PACKETS ───────────────────────

router.post('/teacher-review-packets', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await teacherReviewPacketService.createTeacherReviewPacket(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/teacher-review-packets', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { planId, studentRef, teacherRef } = req.query;
  if (planId) { const r = await teacherReviewPacketService.listPacketsForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (studentRef) { const r = await teacherReviewPacketService.listPacketsForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  if (teacherRef) { const r = await teacherReviewPacketService.listPacketsForTeacher(ctx, teacherRef as string); sendEnvelope(res, r); return; }
  const result = await teacherReviewPacketService.listPacketsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/teacher-review-packets/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await teacherReviewPacketService.getTeacherReviewPacket(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await teacherReviewPacketService.markPacketReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await teacherReviewPacketService.approvePacketForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await teacherReviewPacketService.suppressPacket(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await teacherReviewPacketService.blockPacket(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/teacher-review-packets/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await teacherReviewPacketService.voidPacket(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── STUDENT NEXT STEP DRAFTS ─────────────────────

router.post('/student-next-step-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentNextStepDraftService.createStudentNextStepDraft(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/student-next-step-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { planId, studentRef, status } = req.query;
  if (planId) { const r = await studentNextStepDraftService.listDraftsForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (studentRef) { const r = await studentNextStepDraftService.listDraftsForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  if (status) { const r = await studentNextStepDraftService.listDraftsByStatus(ctx, status as string); sendEnvelope(res, r); return; }
  const result = await studentNextStepDraftService.listDraftsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/student-next-step-drafts/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentNextStepDraftService.getStudentNextStepDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/student-next-step-drafts/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentNextStepDraftService.markDraftReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/student-next-step-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentNextStepDraftService.approveDraftForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/student-next-step-drafts/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentNextStepDraftService.suppressDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/student-next-step-drafts/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentNextStepDraftService.blockDraft(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/student-next-step-drafts/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await studentNextStepDraftService.voidDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── PARENT UPDATE DRAFTS ─────────────────────────

router.post('/parent-update-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentUpdateDraftService.createParentUpdateDraft(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/parent-update-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { planId, studentRef, status } = req.query;
  if (planId) { const r = await parentUpdateDraftService.listDraftsForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (studentRef) { const r = await parentUpdateDraftService.listDraftsForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  if (status) { const r = await parentUpdateDraftService.listDraftsByStatus(ctx, status as string); sendEnvelope(res, r); return; }
  const result = await parentUpdateDraftService.listDraftsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/parent-update-drafts/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentUpdateDraftService.getParentUpdateDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/parent-update-drafts/:id/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentUpdateDraftService.markDraftReviewReady(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/parent-update-drafts/:id/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentUpdateDraftService.approveDraftForFutureUse(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/parent-update-drafts/:id/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentUpdateDraftService.suppressDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/parent-update-drafts/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentUpdateDraftService.blockDraft(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/parent-update-drafts/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentUpdateDraftService.voidDraft(ctx, req.params.id);
  sendEnvelope(res, result);
});

// ─── OUTCOME DECISION SUMMARIES ───────────────────

router.post('/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.createOutcomeDecisionSummary(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const { planId, studentRef } = req.query;
  if (planId) { const r = await summaryService.listSummariesForPlan(ctx, planId as string); sendEnvelope(res, r); return; }
  if (studentRef) { const r = await summaryService.listSummariesForStudent(ctx, studentRef as string); sendEnvelope(res, r); return; }
  const result = await summaryService.listSummariesForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/summaries/:id', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.getOutcomeDecisionSummary(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/summaries/:id/refresh', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.refreshOutcomeDecisionSummary(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/summaries/:id/mark-stale', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.markOutcomeDecisionSummaryStale(ctx, req.params.id);
  sendEnvelope(res, result);
});

router.post('/summaries/:id/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.blockOutcomeDecisionSummary(ctx, req.params.id, req.body.reasonCodes);
  sendEnvelope(res, result);
});

router.post('/summaries/:id/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.voidOutcomeDecisionSummary(ctx, req.params.id);
  sendEnvelope(res, result);
});

export default router;
