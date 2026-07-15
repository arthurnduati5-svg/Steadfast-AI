import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  InMemoryRecoveryProgressObservationRepository,
  InMemoryRecoveryCheckpointEvaluationRepository,
  InMemoryRecoveryOutcomeEvidenceRepository,
  InMemoryRecoveryPlanAdjustmentDraftRepository,
  InMemoryRecoveryTeacherReviewDecisionRepository,
  InMemoryRecoveryStudentProgressReflectionDraftRepository,
  InMemoryRecoveryParentProgressNoteDraftRepository,
  InMemoryRecoveryEvidenceRollupRepository,
  InMemoryRecoveryProgressSummaryRepository,
  InMemoryRecoveryProgressAuditRepository,
  InMemoryRecoveryProgressIdempotencyRepository,
} from '../domains/assessment/recovery-progress/repositories/inMemoryRecoveryProgressRepositories';
import {
  RecoveryProgressSafetyService,
  RecoveryProgressIdempotencyService,
  RecoveryProgressAuditBridge,
  RecoveryProgressObservationService,
  RecoveryCheckpointEvaluationService,
  RecoveryOutcomeEvidenceService,
  RecoveryPlanAdjustmentDraftService,
  RecoveryTeacherReviewDecisionService,
  RecoveryStudentProgressReflectionDraftService,
  RecoveryParentProgressNoteDraftService,
  RecoveryEvidenceRollupService,
  RecoveryProgressSummaryService,
} from '../domains/assessment/recovery-progress/services';
import { RecoveryProgressCommandContext, RecoveryProgressSafeEnvelope } from '../domains/assessment/recovery-progress/contracts/recoveryProgressContracts';

const router = Router();

// Instantiate repositories
const observationRepo = new InMemoryRecoveryProgressObservationRepository();
const evaluationRepo = new InMemoryRecoveryCheckpointEvaluationRepository();
const evidenceRepo = new InMemoryRecoveryOutcomeEvidenceRepository();
const adjustmentRepo = new InMemoryRecoveryPlanAdjustmentDraftRepository();
const decisionRepo = new InMemoryRecoveryTeacherReviewDecisionRepository();
const reflectionRepo = new InMemoryRecoveryStudentProgressReflectionDraftRepository();
const parentNoteRepo = new InMemoryRecoveryParentProgressNoteDraftRepository();
const rollupRepo = new InMemoryRecoveryEvidenceRollupRepository();
const summaryRepo = new InMemoryRecoveryProgressSummaryRepository();
const auditRepo = new InMemoryRecoveryProgressAuditRepository();
const idempotencyRepo = new InMemoryRecoveryProgressIdempotencyRepository();

// Instantiate dependency services
const idempotencyService = new RecoveryProgressIdempotencyService(idempotencyRepo as any);
const auditBridge = new RecoveryProgressAuditBridge(auditRepo as any);
const safetyService = new RecoveryProgressSafetyService();

// Instantiate core services
const observationService = new RecoveryProgressObservationService(observationRepo as any, safetyService, auditBridge, idempotencyService);
const evaluationService = new RecoveryCheckpointEvaluationService(evaluationRepo as any, safetyService, auditBridge, idempotencyService);
const evidenceService = new RecoveryOutcomeEvidenceService(evidenceRepo as any, safetyService, auditBridge, idempotencyService);
const adjustmentService = new RecoveryPlanAdjustmentDraftService(adjustmentRepo as any, safetyService, auditBridge, idempotencyService);
const decisionService = new RecoveryTeacherReviewDecisionService(decisionRepo as any, safetyService, auditBridge, idempotencyService);
const reflectionService = new RecoveryStudentProgressReflectionDraftService(reflectionRepo as any, safetyService, auditBridge, idempotencyService);
const parentNoteService = new RecoveryParentProgressNoteDraftService(parentNoteRepo as any, safetyService, auditBridge, idempotencyService);
const rollupService = new RecoveryEvidenceRollupService(rollupRepo as any, safetyService, auditBridge, idempotencyService);
const summaryService = new RecoveryProgressSummaryService(summaryRepo as any, safetyService, auditBridge, idempotencyService);

function extractContext(req: Request): RecoveryProgressCommandContext {
  return {
    schoolId: (req as any).schoolId || 'unknown',
    actorId: (req as any).actorId || 'unknown',
    actorRole: (req as any).actorRole || 'unknown',
    correlationId: (req as any).correlationId || uuidv4(),
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || uuidv4(),
  };
}

function sendEnvelope(res: Response, envelope: RecoveryProgressSafeEnvelope): void {
  res.status(envelope.ok ? 200 : 400).json(envelope);
}

// ─── OBSERVATIONS ─────────────────────────────────────────

router.post('/observations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.createObservation(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/observations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.listObservationsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/observations/:progressObservationId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.getObservation(ctx, req.params.progressObservationId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/observations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.listObservationsForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/plans/:planId/observations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.listObservationsForPlan(ctx, req.params.planId);
  sendEnvelope(res, result);
});

router.get('/checkpoints/:checkpointId/observations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.listObservationsForCheckpoint(ctx, req.params.checkpointId);
  sendEnvelope(res, result);
});

router.get('/observations/status/:observationStatus', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.listObservationsByStatus(ctx, req.params.observationStatus);
  sendEnvelope(res, result);
});

router.get('/observations/type/:observationType', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.listObservationsByType(ctx, req.params.observationType);
  sendEnvelope(res, result);
});

router.post('/observations/:progressObservationId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.markObservationReviewReady(ctx, req.params.progressObservationId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Observation marked review ready');
  sendEnvelope(res, result);
});

router.post('/observations/:progressObservationId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.markObservationApprovedForFutureUse(ctx, req.params.progressObservationId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Observation approved for future use');
  sendEnvelope(res, result);
});

router.post('/observations/:progressObservationId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.suppressObservation(ctx, req.params.progressObservationId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Observation suppressed');
  sendEnvelope(res, result);
});

router.post('/observations/:progressObservationId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.blockObservation(ctx, req.params.progressObservationId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Observation blocked');
  sendEnvelope(res, result);
});

router.post('/observations/:progressObservationId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await observationService.voidObservation(ctx, req.params.progressObservationId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Observation voided');
  sendEnvelope(res, result);
});

// ─── CHECKPOINT EVALUATIONS ───────────────────────────────

router.post('/evaluations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.createEvaluation(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/plans/:planId/evaluations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.listEvaluationsForPlan(ctx, req.params.planId);
  sendEnvelope(res, result);
});

router.get('/checkpoints/:checkpointId/evaluations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.listEvaluationsForCheckpoint(ctx, req.params.checkpointId);
  sendEnvelope(res, result);
});

router.get('/observations/:observationId/evaluations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.listEvaluationsForObservation(ctx, req.params.observationId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/evaluations', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.listEvaluationsForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/evaluations/:evaluationId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.getEvaluation(ctx, req.params.evaluationId);
  sendEnvelope(res, result);
});

router.get('/evaluations/status/:evalStatus', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.listEvaluationsByStatus(ctx, req.params.evalStatus);
  sendEnvelope(res, result);
});

router.get('/evaluations/result/:evalResult', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.listEvaluationsByResult(ctx, req.params.evalResult);
  sendEnvelope(res, result);
});

router.post('/evaluations/:evaluationId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.markEvaluationReviewReady(ctx, req.params.evaluationId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Evaluation marked review ready');
  sendEnvelope(res, result);
});

router.post('/evaluations/:evaluationId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.markEvaluationApprovedForFutureUse(ctx, req.params.evaluationId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Evaluation approved for future use');
  sendEnvelope(res, result);
});

router.post('/evaluations/:evaluationId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.suppressEvaluation(ctx, req.params.evaluationId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Evaluation suppressed');
  sendEnvelope(res, result);
});

router.post('/evaluations/:evaluationId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.blockEvaluation(ctx, req.params.evaluationId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Evaluation blocked');
  sendEnvelope(res, result);
});

router.post('/evaluations/:evaluationId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evaluationService.voidEvaluation(ctx, req.params.evaluationId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Evaluation voided');
  sendEnvelope(res, result);
});

// ─── OUTCOME EVIDENCE ─────────────────────────────────────

router.post('/evidence', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.createEvidence(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/plans/:planId/evidence', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.listEvidenceForPlan(ctx, req.params.planId);
  sendEnvelope(res, result);
});

router.get('/objectives/:objectiveId/evidence', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.listEvidenceForObjective(ctx, req.params.objectiveId);
  sendEnvelope(res, result);
});

router.get('/observations/:observationId/evidence', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.listEvidenceForObservation(ctx, req.params.observationId);
  sendEnvelope(res, result);
});

router.get('/evaluations/:evaluationId/evidence', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.listEvidenceForEvaluation(ctx, req.params.evaluationId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/evidence', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.listEvidenceForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/evidence/:evidenceId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.getEvidence(ctx, req.params.evidenceId);
  sendEnvelope(res, result);
});

router.post('/evidence/:evidenceId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.markEvidenceReviewReady(ctx, req.params.evidenceId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Evidence marked review ready');
  sendEnvelope(res, result);
});

router.post('/evidence/:evidenceId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.markEvidenceApprovedForFutureUse(ctx, req.params.evidenceId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Evidence approved for future use');
  sendEnvelope(res, result);
});

router.post('/evidence/:evidenceId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.suppressEvidence(ctx, req.params.evidenceId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Evidence suppressed');
  sendEnvelope(res, result);
});

router.post('/evidence/:evidenceId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await evidenceService.voidEvidence(ctx, req.params.evidenceId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Evidence voided');
  sendEnvelope(res, result);
});

// ─── PLAN ADJUSTMENT DRAFTS ──────────────────────────────

router.post('/adjustment-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.createAdjustmentDraft(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/plans/:planId/adjustment-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.listAdjustmentDraftsForPlan(ctx, req.params.planId);
  sendEnvelope(res, result);
});

router.get('/observations/:observationId/adjustment-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.listAdjustmentDraftsForObservation(ctx, req.params.observationId);
  sendEnvelope(res, result);
});

router.get('/evaluations/:evaluationId/adjustment-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.listAdjustmentDraftsForEvaluation(ctx, req.params.evaluationId);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/adjustment-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.listAdjustmentDraftsForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/adjustment-drafts/:adjustmentDraftId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.getAdjustmentDraft(ctx, req.params.adjustmentDraftId);
  sendEnvelope(res, result);
});

router.post('/adjustment-drafts/:adjustmentDraftId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.markAdjustmentDraftReviewReady(ctx, req.params.adjustmentDraftId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Adjustment draft marked review ready');
  sendEnvelope(res, result);
});

router.post('/adjustment-drafts/:adjustmentDraftId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.suppressAdjustmentDraft(ctx, req.params.adjustmentDraftId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Adjustment draft suppressed');
  sendEnvelope(res, result);
});

router.post('/adjustment-drafts/:adjustmentDraftId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.blockAdjustmentDraft(ctx, req.params.adjustmentDraftId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Adjustment draft blocked');
  sendEnvelope(res, result);
});

router.post('/adjustment-drafts/:adjustmentDraftId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await adjustmentService.voidAdjustmentDraft(ctx, req.params.adjustmentDraftId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Adjustment draft voided');
  sendEnvelope(res, result);
});

// ─── TEACHER REVIEW DECISIONS ────────────────────────────

router.post('/teacher-review-decisions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.createDecision(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/plans/:planId/teacher-review-decisions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.listDecisionsForPlan(ctx, req.params.planId);
  sendEnvelope(res, result);
});

router.get('/teachers/:teacherRef/teacher-review-decisions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.listDecisionsForTeacher(ctx, req.params.teacherRef);
  sendEnvelope(res, result);
});

router.get('/adjustment-drafts/:adjustmentDraftId/teacher-review-decisions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.listDecisionsForAdjustmentDraft(ctx, req.params.adjustmentDraftId);
  sendEnvelope(res, result);
});

router.get('/evaluations/:evaluationId/teacher-review-decisions', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.listDecisionsForEvaluation(ctx, req.params.evaluationId);
  sendEnvelope(res, result);
});

router.get('/teacher-review-decisions/:decisionId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.getDecision(ctx, req.params.decisionId);
  sendEnvelope(res, result);
});

router.post('/teacher-review-decisions/:decisionId/reviewed', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.markDecisionReviewed(ctx, req.params.decisionId, req.body.reasonCode || 'reviewed', req.body.safeMessage || 'Decision reviewed');
  sendEnvelope(res, result);
});

router.post('/teacher-review-decisions/:decisionId/approve-future-use', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.markDecisionApprovedForFutureUse(ctx, req.params.decisionId, req.body.reasonCode || 'approved', req.body.safeMessage || 'Decision approved for future use');
  sendEnvelope(res, result);
});

router.post('/teacher-review-decisions/:decisionId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.suppressDecision(ctx, req.params.decisionId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Decision suppressed');
  sendEnvelope(res, result);
});

router.post('/teacher-review-decisions/:decisionId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.blockDecision(ctx, req.params.decisionId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Decision blocked');
  sendEnvelope(res, result);
});

router.post('/teacher-review-decisions/:decisionId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await decisionService.voidDecision(ctx, req.params.decisionId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Decision voided');
  sendEnvelope(res, result);
});

// ─── STUDENT PROGRESS REFLECTION DRAFTS ──────────────────

router.post('/reflection-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.createReflectionDraft(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/plans/:planId/reflection-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.listReflectionDraftsForPlan(ctx, req.params.planId);
  sendEnvelope(res, result);
});

router.get('/observations/:observationId/reflection-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.listReflectionDraftsForObservation(ctx, req.params.observationId);
  sendEnvelope(res, result);
});

router.get('/evaluations/:evaluationId/reflection-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.listReflectionDraftsForEvaluation(ctx, req.params.evaluationId);
  sendEnvelope(res, result);
});

router.get('/reflection-drafts/:reflectionDraftId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.getReflectionDraft(ctx, req.params.reflectionDraftId);
  sendEnvelope(res, result);
});

router.post('/reflection-drafts/:reflectionDraftId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.markReflectionDraftReviewReady(ctx, req.params.reflectionDraftId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Reflection draft marked review ready');
  sendEnvelope(res, result);
});

router.post('/reflection-drafts/:reflectionDraftId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.suppressReflectionDraft(ctx, req.params.reflectionDraftId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Reflection draft suppressed');
  sendEnvelope(res, result);
});

router.post('/reflection-drafts/:reflectionDraftId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.blockReflectionDraft(ctx, req.params.reflectionDraftId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Reflection draft blocked');
  sendEnvelope(res, result);
});

router.post('/reflection-drafts/:reflectionDraftId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await reflectionService.voidReflectionDraft(ctx, req.params.reflectionDraftId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Reflection draft voided');
  sendEnvelope(res, result);
});

// ─── PARENT PROGRESS NOTE DRAFTS ──────────────────────────

router.post('/parent-note-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentNoteService.createParentNoteDraft(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/plans/:planId/parent-note-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentNoteService.listParentNoteDraftsForPlan(ctx, req.params.planId);
  sendEnvelope(res, result);
});

router.get('/observations/:observationId/parent-note-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentNoteService.listParentNoteDraftsForObservation(ctx, req.params.observationId);
  sendEnvelope(res, result);
});

router.get('/evaluations/:evaluationId/parent-note-drafts', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentNoteService.listParentNoteDraftsForEvaluation(ctx, req.params.evaluationId);
  sendEnvelope(res, result);
});

router.get('/parent-note-drafts/:parentNoteDraftId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentNoteService.getParentNoteDraft(ctx, req.params.parentNoteDraftId);
  sendEnvelope(res, result);
});

router.post('/parent-note-drafts/:parentNoteDraftId/review-ready', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentNoteService.markParentNoteDraftReviewReady(ctx, req.params.parentNoteDraftId, req.body.reasonCode || 'review_ready', req.body.safeMessage || 'Parent note draft marked review ready');
  sendEnvelope(res, result);
});

router.post('/parent-note-drafts/:parentNoteDraftId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentNoteService.suppressParentNoteDraft(ctx, req.params.parentNoteDraftId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Parent note draft suppressed');
  sendEnvelope(res, result);
});

router.post('/parent-note-drafts/:parentNoteDraftId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentNoteService.blockParentNoteDraft(ctx, req.params.parentNoteDraftId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Parent note draft blocked');
  sendEnvelope(res, result);
});

router.post('/parent-note-drafts/:parentNoteDraftId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await parentNoteService.voidParentNoteDraft(ctx, req.params.parentNoteDraftId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Parent note draft voided');
  sendEnvelope(res, result);
});

// ─── EVIDENCE ROLLUPS ─────────────────────────────────────

router.post('/evidence-rollups', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.createRollup(ctx, req.body);
  sendEnvelope(res, result);
});

router.get('/evidence-rollups', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.listRollupsForSchool(ctx);
  sendEnvelope(res, result);
});

router.get('/students/:studentRef/evidence-rollups', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.listRollupsForStudent(ctx, req.params.studentRef);
  sendEnvelope(res, result);
});

router.get('/plans/:planId/evidence-rollups', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.listRollupsForPlan(ctx, req.params.planId);
  sendEnvelope(res, result);
});

router.get('/evidence-rollups/scope/:rollupScope', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.listRollupsByScope(ctx, req.params.rollupScope);
  sendEnvelope(res, result);
});

router.get('/evidence-rollups/:rollupId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.getRollup(ctx, req.params.rollupId);
  sendEnvelope(res, result);
});

router.post('/evidence-rollups/:rollupId/refresh', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.refreshRollup(ctx, req.params.rollupId, req.body.reasonCode || 'refreshed', req.body.safeMessage || 'Evidence rollup refreshed');
  sendEnvelope(res, result);
});

router.post('/evidence-rollups/:rollupId/suppress', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.suppressRollup(ctx, req.params.rollupId, req.body.reasonCode || 'suppressed', req.body.safeMessage || 'Evidence rollup suppressed');
  sendEnvelope(res, result);
});

router.post('/evidence-rollups/:rollupId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.blockRollup(ctx, req.params.rollupId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Evidence rollup blocked');
  sendEnvelope(res, result);
});

router.post('/evidence-rollups/:rollupId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await rollupService.voidRollup(ctx, req.params.rollupId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Evidence rollup voided');
  sendEnvelope(res, result);
});

// ─── PROGRESS SUMMARIES ───────────────────────────────────

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

router.get('/teachers/:teacherRef/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.listSummariesForTeacher(ctx, req.params.teacherRef);
  sendEnvelope(res, result);
});

router.get('/plans/:planId/summaries', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.listSummariesForPlan(ctx, req.params.planId);
  sendEnvelope(res, result);
});

router.get('/summaries/scope/:summaryScope', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.listSummariesByScope(ctx, req.params.summaryScope);
  sendEnvelope(res, result);
});

router.get('/summaries/:summaryId', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.getSummary(ctx, req.params.summaryId);
  sendEnvelope(res, result);
});

router.post('/summaries/:summaryId/refresh', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.refreshSummary(ctx, req.params.summaryId, req.body.reasonCode || 'refreshed', req.body.safeMessage || 'Progress summary refreshed');
  sendEnvelope(res, result);
});

router.post('/summaries/:summaryId/stale', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.markSummaryStale(ctx, req.params.summaryId, req.body.reasonCode || 'stale', req.body.safeMessage || 'Progress summary marked stale');
  sendEnvelope(res, result);
});

router.post('/summaries/:summaryId/block', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.blockSummary(ctx, req.params.summaryId, req.body.reasonCode || 'blocked', req.body.safeMessage || 'Progress summary blocked');
  sendEnvelope(res, result);
});

router.post('/summaries/:summaryId/void', async (req: Request, res: Response) => {
  const ctx = extractContext(req);
  const result = await summaryService.voidSummary(ctx, req.params.summaryId, req.body.reasonCode || 'voided', req.body.safeMessage || 'Progress summary voided');
  sendEnvelope(res, result);
});

export default router;
