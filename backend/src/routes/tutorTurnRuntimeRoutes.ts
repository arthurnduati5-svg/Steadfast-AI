import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  TutorTurnRequestSchema,
  TutorTurnResolveRequestSchema,
  TutorTurnDispatchRequestSchema,
  TutorTurnStateRequestSchema,
  TutorTurnEventRequestSchema,
  TutorTurnIdParamSchema,
} from '../lib/tutorTurnRuntimeValidation';
import { assertSafeTutorTurnInput } from '../services/tutorTurnRuntimePrivacyGuard';
import { evaluateTutorTurnAccess } from '../services/tutorTurnRuntimeAccessPolicy';
import {
  handleTutorTurn,
  resolveTutorTurn,
  dispatchTutorTurnAction,
  getTutorTurnState,
  recordTurnEvent,
} from '../services/tutorTurnRuntimeService';
import {
  buildStudentView,
  buildBlockedResult,
  buildEmptyStateResult,
  buildErrorResult,
} from '../services/tutorTurnRuntimeResponseBuilder';

const router = Router();

function getStudentId(req: Request): string | undefined {
  // Target addressing stays caller-supplied (teachers address learners);
  // ownership is enforced against the verified requester identity below.
  return (req.query.studentId as string) ||
    (req.body?.studentId as string) ||
    (req.user as any)?.id;
}

function getSchoolId(req: Request): string | undefined {
  return (req.query.schoolId as string) ||
    (req.body?.schoolId as string) ||
    (req.user as any)?.schoolId;
}

function getRequesterUserId(req: Request): string | undefined {
  // R8-G: requester identity derives exclusively from verified server-side
  // context. Caller-controlled fallbacks must never supply it.
  return (req.user as any)?.id;
}

function getRequesterRole(req: Request): string | undefined {
  // R8-G: requester role derives exclusively from verified server-side
  // context. Missing role fails closed in the access policy.
  return (req.user as any)?.role;
}

function getRequesterSchoolId(req: Request): string | undefined {
  // R8-G: previously the access check compared the caller-supplied schoolId
  // against itself, so cross-school could never trigger. The requester school
  // must come from verified context.
  const r = req as unknown as Record<string, unknown>;
  const schoolId = r['schoolId'];
  if (typeof schoolId === 'string' && schoolId !== '') return schoolId;
  return (req.user as any)?.schoolId;
}

function sendError(res: Response, status: number, message: string) {
  return res.status(status).json({
    ok: false,
    status: 'failed',
    safeReasonCodes: ['session_not_found'],
    safeEvidenceRefs: [],
    studentSafeMessage: message,
  });
}

// POST /api/copilot/tutor-turn — complete validate + resolve + optional dispatch
router.post('/', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    const requesterUserId = getRequesterUserId(req);
    const requesterRole = getRequesterRole(req);

    if (!studentId) return sendError(res, 400, 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'schoolId is required');

    const accessResult = evaluateTutorTurnAccess({
      schoolId,
      studentId,
      requesterUserId,
      requesterSchoolId: getRequesterSchoolId(req),
      requesterRole,
    });

    if (accessResult.decision !== 'allowed') {
      return res.status(403).json(buildBlockedResult(
        accessResult.reasonCodes,
        'Access denied to this tutor turn.',
      ));
    }

    const parsed = TutorTurnRequestSchema.safeParse({ ...req.body, schoolId, studentId });
    if (!parsed.success) {
      return sendError(res, 400, parsed.error.errors.map(e => e.message).join('; '));
    }

    try {
      assertSafeTutorTurnInput(parsed.data);
    } catch (e) {
      return res.status(400).json(buildBlockedResult(
        ['forbidden_field_detected'],
        'Request contains forbidden fields.',
      ));
    }

    const result = await handleTutorTurn(parsed.data);

    const response = buildStudentView({
      ok: result.ok,
      status: result.status,
      dispatchTarget: result.dispatchTarget,
      policyDecision: result.policyDecision,
      safeReasonCodes: result.safeReasonCodes,
      safeEvidenceRefs: result.safeEvidenceRefs,
      studentSafeMessage: result.studentSafeMessage,
      suggestedNextIntent: result.suggestedNextIntent,
      statePatch: result.statePatch,
      dispatchResult: result.dispatchResult,
    });

    return res.status(result.ok ? 200 : 422).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal tutor turn error';
    return res.status(500).json(buildErrorResult('mode_dispatch_failed', message));
  }
});

// POST /api/copilot/tutor-turn/resolve — resolve only
router.post('/resolve', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    const requesterUserId = getRequesterUserId(req);
    const requesterRole = getRequesterRole(req);

    if (!studentId) return sendError(res, 400, 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'schoolId is required');

    const accessResult = evaluateTutorTurnAccess({
      schoolId,
      studentId,
      requesterUserId,
      requesterSchoolId: getRequesterSchoolId(req),
      requesterRole,
    });

    if (accessResult.decision !== 'allowed') {
      return res.status(403).json(buildBlockedResult(
        accessResult.reasonCodes,
        'Access denied.',
      ));
    }

    const parsed = TutorTurnResolveRequestSchema.safeParse({ ...req.body, schoolId, studentId });
    if (!parsed.success) {
      return sendError(res, 400, parsed.error.errors.map(e => e.message).join('; '));
    }

    try {
      assertSafeTutorTurnInput(parsed.data);
    } catch (e) {
      return res.status(400).json(buildBlockedResult(
        ['forbidden_field_detected'],
        'Request contains forbidden fields.',
      ));
    }

    const result = await resolveTutorTurn(parsed.data);

    const response = buildStudentView({
      ok: result.ok,
      status: result.status,
      dispatchTarget: result.dispatchTarget,
      policyDecision: result.policyDecision,
      safeReasonCodes: result.safeReasonCodes,
      safeEvidenceRefs: result.safeEvidenceRefs,
      studentSafeMessage: result.studentSafeMessage,
      suggestedNextIntent: result.suggestedNextIntent,
    });

    return res.status(result.ok ? 200 : 422).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal resolve error';
    return res.status(500).json(buildErrorResult('mode_dispatch_failed', message));
  }
});

// POST /api/copilot/tutor-turn/dispatch — resolve + dispatch
router.post('/dispatch', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    const requesterUserId = getRequesterUserId(req);
    const requesterRole = getRequesterRole(req);

    if (!studentId) return sendError(res, 400, 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'schoolId is required');

    const accessResult = evaluateTutorTurnAccess({
      schoolId,
      studentId,
      requesterUserId,
      requesterSchoolId: getRequesterSchoolId(req),
      requesterRole,
    });

    if (accessResult.decision !== 'allowed') {
      return res.status(403).json(buildBlockedResult(
        accessResult.reasonCodes,
        'Access denied.',
      ));
    }

    const parsed = TutorTurnDispatchRequestSchema.safeParse({ ...req.body, schoolId, studentId });
    if (!parsed.success) {
      return sendError(res, 400, parsed.error.errors.map(e => e.message).join('; '));
    }

    try {
      assertSafeTutorTurnInput(parsed.data);
    } catch (e) {
      return res.status(400).json(buildBlockedResult(
        ['forbidden_field_detected'],
        'Request contains forbidden fields.',
      ));
    }

    const result = await dispatchTutorTurnAction(parsed.data);

    const response = buildStudentView({
      ok: result.ok,
      status: result.status,
      dispatchTarget: result.dispatchTarget,
      policyDecision: result.policyDecision,
      safeReasonCodes: result.safeReasonCodes,
      safeEvidenceRefs: result.safeEvidenceRefs,
      studentSafeMessage: result.studentSafeMessage,
      suggestedNextIntent: result.suggestedNextIntent,
      statePatch: result.statePatch,
      dispatchResult: result.dispatchResult,
    });

    return res.status(result.ok ? 200 : 422).json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal dispatch error';
    return res.status(500).json(buildErrorResult('mode_dispatch_failed', message));
  }
});

// GET /api/copilot/tutor-turn/:turnId/state — safe state
router.get('/:turnId/state', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    const requesterUserId = getRequesterUserId(req);
    const requesterRole = getRequesterRole(req);

    if (!studentId) return sendError(res, 400, 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'schoolId is required');

    const accessResult = evaluateTutorTurnAccess({
      schoolId,
      studentId,
      requesterUserId,
      requesterSchoolId: getRequesterSchoolId(req),
      requesterRole,
    });

    if (accessResult.decision !== 'allowed') {
      return res.status(403).json(buildBlockedResult(
        accessResult.reasonCodes,
        'Access denied.',
      ));
    }

    const parsed = TutorTurnIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return sendError(res, 400, 'Invalid turnId');
    }

    const stateRequest = TutorTurnStateRequestSchema.safeParse({
      schoolId,
      studentId,
      turnId: parsed.data.turnId,
    });

    if (!stateRequest.success) {
      return sendError(res, 400, 'Invalid state request');
    }

    const state = getTutorTurnState(stateRequest.data);
    return res.status(200).json(state);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal state error';
    return res.status(500).json(buildErrorResult('session_not_found', message));
  }
});

// POST /api/copilot/tutor-turn/:turnId/event — record event
router.post('/:turnId/event', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    const requesterUserId = getRequesterUserId(req);
    const requesterRole = getRequesterRole(req);

    if (!studentId) return sendError(res, 400, 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'schoolId is required');

    const accessResult = evaluateTutorTurnAccess({
      schoolId,
      studentId,
      requesterUserId,
      requesterSchoolId: getRequesterSchoolId(req),
      requesterRole,
    });

    if (accessResult.decision !== 'allowed') {
      return res.status(403).json(buildBlockedResult(
        accessResult.reasonCodes,
        'Access denied.',
      ));
    }

    const parsed = TutorTurnEventRequestSchema.safeParse({
      ...req.body,
      schoolId,
      studentId,
      turnId: req.params.turnId,
    });

    if (!parsed.success) {
      return sendError(res, 400, parsed.error.errors.map(e => e.message).join('; '));
    }

    try {
      assertSafeTutorTurnInput(parsed.data);
    } catch (e) {
      return res.status(400).json(buildBlockedResult(
        ['forbidden_field_detected'],
        'Request contains forbidden fields.',
      ));
    }

    const event = recordTurnEvent(parsed.data);
    return res.status(200).json({ ok: true, event });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal event error';
    return res.status(500).json(buildErrorResult('telemetry_write_failed', message));
  }
});

// POST /api/copilot/tutor-turn/:turnId/exit — safely close a turn
router.post('/:turnId/exit', async (req: Request, res: Response) => {
  try {
    const studentId = getStudentId(req);
    const schoolId = getSchoolId(req);
    const requesterUserId = getRequesterUserId(req);
    const requesterRole = getRequesterRole(req);

    if (!studentId) return sendError(res, 400, 'studentId is required');
    if (!schoolId) return sendError(res, 400, 'schoolId is required');

    const accessResult = evaluateTutorTurnAccess({
      schoolId,
      studentId,
      requesterUserId,
      requesterSchoolId: getRequesterSchoolId(req),
      requesterRole,
    });

    if (accessResult.decision !== 'allowed') {
      return res.status(403).json(buildBlockedResult(
        accessResult.reasonCodes,
        'Access denied.',
      ));
    }

    const parsed = TutorTurnIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      return sendError(res, 400, 'Invalid turnId');
    }

    const safeResponse = buildStudentView({
      ok: true,
      status: 'completed',
      safeReasonCodes: ['dispatch_completed'],
      safeEvidenceRefs: [],
      studentSafeMessage: 'Turn completed.',
      suggestedNextIntent: 'resolve_growth_action',
    });

    return res.status(200).json(safeResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal exit error';
    return res.status(500).json(buildErrorResult('session_not_found', message));
  }
});

export default router;
