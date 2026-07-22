import { Router, Request, Response } from 'express';
import { MarkingRunService } from '../domains/assessment/marking/services/markingRunService';
import { DeterministicMarkerService } from '../domains/assessment/marking/services/deterministicMarkerService';
import { TeacherReviewQueueService } from '../domains/assessment/marking/services/teacherReviewQueueService';
import { TeacherOverrideService } from '../domains/assessment/marking/services/teacherOverrideService';
import { ModerationService } from '../domains/assessment/marking/services/moderationService';
import { StudentChallengeService } from '../domains/assessment/marking/services/studentChallengeService';
import { MarkingProjectionSafetyService } from '../domains/assessment/marking/services/markingProjectionSafetyService';
import { SubmittedAnswerSnapshot, MarkingRun } from '../domains/assessment/marking/contracts/markingContracts';
import { MarkingInputSnapshot } from '../domains/assessment/marking/contracts/markingResultContracts';
import type { MarkingRunRepository, MarkingResultVersionRepository, MarkingBreakdownItemRepository } from '../domains/assessment/marking/contracts/markingRepositoryContracts';

export function createMarkingRouter(
  markingRunRepo: MarkingRunRepository,
  markingResultRepo: MarkingResultVersionRepository,
  markingBreakdownItemRepo: MarkingBreakdownItemRepository,
): Router {
  const router = Router();

  const deterministicMarkerService = new DeterministicMarkerService();
  const teacherReviewQueueService = new TeacherReviewQueueService();
  const markingRunService = new MarkingRunService(markingRunRepo, markingResultRepo, deterministicMarkerService, teacherReviewQueueService);
  const teacherOverrideService = new TeacherOverrideService();
  const moderationService = new ModerationService();
  const studentChallengeService = new StudentChallengeService();
  const projectionSafetyService = new MarkingProjectionSafetyService();

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
  allowedSubsequentActions?: string[];
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
      else if (message.startsWith('DEPENDENCY_DEFERRED')) { reasonCode = 'DEPENDENCY_DEFERRED'; status = 501; }
      else if (message.startsWith('UNSUPPORTED_QUESTION_TYPE')) { reasonCode = 'UNSUPPORTED_QUESTION_TYPE'; status = 400; }
      res.status(status).json(createSafeResponseEnvelope(req, { ok: false, reasonCode, safeMessage: message, status: 'error' }));
    }
  };
}

// POST /api/question-bank/marking/runs
router.post('/runs', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { sourceType, sourceRef, blueprintId, blueprintVersionId, draftId, safeSummary } = req.body;
  if (!sourceType || !sourceRef) throw new Error('VALIDATION_FAILED: sourceType and sourceRef are required');
  const run = await markingRunService.createMarkingRun({ schoolId, sourceType, sourceRef, blueprintId, blueprintVersionId, draftId, createdByActorId: actorId, createdByRole: role, safeSummary: safeSummary || '' });
  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: run.markingRunId, status: run.status, data: run }));
}));

// POST /api/question-bank/marking/runs/:markingRunId/snapshots
router.post('/runs/:markingRunId/snapshots', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { markingRunId } = req.params;
  const snapshot: SubmittedAnswerSnapshot = req.body.snapshot;
  if (!snapshot || !snapshot.questionId || !snapshot.questionVersionId) throw new Error('VALIDATION_FAILED: snapshot with questionId and questionVersionId required');
  const input: MarkingInputSnapshot = req.body.input || { snapshot };
  const result = await markingRunService.markSnapshot({ runId: markingRunId, snapshot, input, actorId, role });
  const projection = role === 'student' ? projectionSafetyService.toStudentMarkingProjection(result) : projectionSafetyService.toTeacherMarkingProjection(result);
  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: result.markingResultVersionId, status: result.status, data: projection }));
}));

// POST /api/question-bank/marking/runs/:markingRunId/batches
router.post('/runs/:markingRunId/batches', safeHandler(async (req: Request, res: Response) => {
  const { actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { markingRunId } = req.params;
  const { snapshots, inputs } = req.body;
  if (!Array.isArray(snapshots)) throw new Error('VALIDATION_FAILED: snapshots array required');
  const result = await markingRunService.markBatch({ runId: markingRunId, snapshots, inputs: inputs || [], actorId, role });
  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: result.runId, data: result }));
}));

// GET /api/question-bank/marking/runs/:markingRunId
router.get('/runs/:markingRunId', safeHandler(async (req: Request, res: Response) => {
  const { markingRunId } = req.params;
  const run = await markingRunService.getMarkingRun(markingRunId);
  if (!run) throw new Error('NOT_FOUND: Marking run not found');
  res.json(createSafeResponseEnvelope(req, { resourceId: run.markingRunId, status: run.status, data: run }));
}));

// GET /api/question-bank/marking/runs/:markingRunId/results
router.get('/runs/:markingRunId/results', safeHandler(async (req: Request, res: Response) => {
  const { markingRunId } = req.params;
  const results = await markingRunService.listRunResults(markingRunId);
  const { role } = extractActorContext(req);
  const safeResults = role === 'student' ? results.map(r => projectionSafetyService.toStudentMarkingProjection(r)) : results.map(r => projectionSafetyService.toTeacherMarkingProjection(r));
  res.json(createSafeResponseEnvelope(req, { data: safeResults }));
}));

// GET /api/question-bank/marking/results/:markingResultVersionId
router.get('/results/:markingResultVersionId', safeHandler(async (req: Request, res: Response) => {
  const { role } = extractActorContext(req);
  const result = await markingResultRepo.findById(req.params.markingResultVersionId);
  if (!result) throw new Error('NOT_FOUND: Marking result not found');
  const projection = role === 'student' ? projectionSafetyService.toStudentMarkingProjection(result) : role === 'parent' ? projectionSafetyService.toParentMarkingProjection(result) : projectionSafetyService.toTeacherMarkingProjection(result);
  res.json(createSafeResponseEnvelope(req, { resourceId: result.markingResultVersionId, status: result.status, data: projection }));
}));

// GET /api/question-bank/marking/results/:markingResultVersionId/breakdown
router.get('/results/:markingResultVersionId/breakdown', safeHandler(async (req: Request, res: Response) => {
  const breakdowns = await markingBreakdownItemRepo.findByMarkingResultVersionId(req.params.markingResultVersionId);
  res.json(createSafeResponseEnvelope(req, { data: breakdowns }));
}));

// GET /api/question-bank/marking/review-groups/open
router.get('/review-groups/open', safeHandler(async (req: Request, res: Response) => {
  const { schoolId } = extractActorContext(req);
  const groups = await teacherReviewQueueService.listOpenReviewGroups(schoolId);
  res.json(createSafeResponseEnvelope(req, { data: groups }));
}));

// GET /api/question-bank/marking/review-groups/:teacherReviewGroupId/items
router.get('/review-groups/:teacherReviewGroupId/items', safeHandler(async (req: Request, res: Response) => {
  const items = await teacherReviewQueueService.listReviewItemsForGroup(req.params.teacherReviewGroupId);
  res.json(createSafeResponseEnvelope(req, { data: items }));
}));

// POST /api/question-bank/marking/review-items/:teacherReviewItemId/assign
router.post('/review-items/:teacherReviewItemId/assign', safeHandler(async (req: Request, res: Response) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { actorId } = extractActorContext(req);
  if (!actorId) throw new Error('VALIDATION_FAILED: actorId is required');
  const item = await teacherReviewQueueService.assignReviewItem(req.params.teacherReviewItemId, actorId);
  res.json(createSafeResponseEnvelope(req, { resourceId: item.teacherReviewItemId, status: item.status, data: item }));
}));

// POST /api/question-bank/marking/review-items/:teacherReviewItemId/resolve
router.post('/review-items/:teacherReviewItemId/resolve', safeHandler(async (req: Request, res: Response) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { resolution } = req.body;
  if (!resolution) throw new Error('VALIDATION_FAILED: resolution is required');
  const item = await teacherReviewQueueService.resolveReviewItem(req.params.teacherReviewItemId, resolution);
  res.json(createSafeResponseEnvelope(req, { resourceId: item.teacherReviewItemId, status: item.status, data: item }));
}));

// POST /api/question-bank/marking/results/:markingResultVersionId/overrides
router.post('/results/:markingResultVersionId/overrides', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { decision, previousMarks, newMarks, overrideReasonCode, safeReason } = req.body;
  if (decision === 'confirm') {
    const override = await teacherOverrideService.confirmResult(req.params.markingResultVersionId, actorId, role);
    res.json(createSafeResponseEnvelope(req, { resourceId: override.teacherOverrideId, status: 'teacher_confirmed', data: override }));
  } else if (decision === 'adjust_marks') {
    const override = await teacherOverrideService.adjustMarks({
      markingResultVersionId: req.params.markingResultVersionId,
      previousMarks: previousMarks ?? 0,
      newMarks: newMarks ?? 0,
      overrideReasonCode: overrideReasonCode || 'teacher_adjustment',
      safeReason: safeReason || 'Teacher adjusted marks.',
      actorId,
      role,
    });
    res.json(createSafeResponseEnvelope(req, { resourceId: override.teacherOverrideId, status: 'teacher_overridden', data: override }));
  } else {
    throw new Error('VALIDATION_FAILED: decision must be confirm or adjust_marks');
  }
}));

// POST /api/question-bank/marking/results/:markingResultVersionId/moderation
router.post('/results/:markingResultVersionId/moderation', safeHandler(async (req: Request, res: Response) => {
  const { schoolId, actorId, role } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { decision, safeReason } = req.body;
  const moderation = await moderationService.createModerationDecision({
    schoolId,
    markingResultVersionId: req.params.markingResultVersionId,
    decision: decision || 'uphold',
    safeReason: safeReason || '',
    decidedByActorId: actorId,
    decidedByRole: role,
  });
  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: moderation.moderationDecisionId, status: moderation.status, data: moderation }));
}));

// POST /api/question-bank/marking/results/:markingResultVersionId/challenges
router.post('/results/:markingResultVersionId/challenges', safeHandler(async (req: Request, res: Response) => {
  const { schoolId } = extractActorContext(req);
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { studentId, challengeReasonCode, safeStudentStatement } = req.body;
  if (!studentId || !challengeReasonCode) throw new Error('VALIDATION_FAILED: studentId and challengeReasonCode required');
  const challenge = await studentChallengeService.submitChallenge({
    schoolId,
    studentId,
    markingResultVersionId: req.params.markingResultVersionId,
    challengeReasonCode,
    safeStudentStatement: safeStudentStatement || '',
  });
  res.status(201).json(createSafeResponseEnvelope(req, { resourceId: challenge.studentMarkChallengeId, status: challenge.status, data: challenge }));
}));

// POST /api/question-bank/marking/challenges/:studentMarkChallengeId/resolve
router.post('/challenges/:studentMarkChallengeId/resolve', safeHandler(async (req: Request, res: Response) => {
  const idempotencyKey = getIdempotencyKey(req);
  if (!idempotencyKey) throw new Error('VALIDATION_FAILED: idempotencyKey is required');
  const { resolution, summary } = req.body;
  if (!resolution) throw new Error('VALIDATION_FAILED: resolution is required');
  const challenge = await studentChallengeService.resolveChallenge(req.params.studentMarkChallengeId, resolution, summary || '');
  res.json(createSafeResponseEnvelope(req, { resourceId: challenge.studentMarkChallengeId, status: challenge.status, data: challenge }));
}));

  return router;
}
