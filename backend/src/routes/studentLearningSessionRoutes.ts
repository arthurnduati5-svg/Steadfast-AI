import { Router, Request, Response } from 'express';

import {
  createStudentLearningSession,
  resumeStudentLearningSession,
  pauseStudentLearningSession,
  completeStudentLearningSession,
  abandonStudentLearningSession,
  expireStudentLearningSession,
  getStudentLearningSession,
  listStudentLearningSessionsForLearner,
  updateSessionTransition,
} from '../services/studentLearningSessionLifecycleService';
import { StudentLearningSessionAccessPolicy } from '../services/studentLearningSessionAccessPolicy';
import { StudentLearningSessionSourceTruthPolicy } from '../services/studentLearningSessionSourceTruthPolicy';
import {
  transitionSessionState,
  getInitialSessionState,
} from '../services/studentLearningSessionStateMachine';
import { buildStudentLearningSessionSnapshot, buildEmptySessionSnapshot, buildLearnerSafeSessionSnapshot, assertSessionSnapshotIsSafe } from '../services/studentLearningSessionSnapshotService';
import { buildResumeContextFromSession, buildEmptyResumeContext, assertResumeContextIsSafe } from '../services/studentLearningSessionResumeContextService';
import { buildCompletedSessionSummary, buildAbandonedSessionSummary, assertExitSummaryIsSafe } from '../services/studentLearningSessionExitSummaryService';
import { rejectForbiddenFields as rejectForbiddenStudentLearningSessionFields, findForbiddenFields as findForbiddenStudentLearningSessionFields } from '../lib/studentLearningSessionValidation';
import { recordSessionActionHistoryEvent, listSessionActionHistoryEvents, buildSafeActionHistoryView } from '../services/studentLearningSessionActionHistoryService';
import { recordSessionAuditEvent } from '../services/studentLearningSessionAuditService';
import {
  buildSessionCreatedResponse,
  buildSessionResumedResponse,
  buildSessionPausedResponse,
  buildSessionCompletedResponse,
  buildSessionAbandonedResponse,
  buildSessionExpiredResponse,
  buildSessionSnapshotResponse,
  buildSessionTransitionResponse,
  buildResumeContextResponse,
  buildExitSummaryResponse,
  buildForbiddenRawFieldErrorResponse,
  buildHiddenReasoningErrorResponse,
  buildProtectedAnswerErrorResponse,
  buildGenericErrorResponse,
  buildSourceRequiredResponse,
} from '../services/studentLearningSessionResponseBuilder';

import type { StudentLearningSessionContext, StudentLearningSessionMode } from '../contracts/studentLearningSessionContracts';

const router = Router();
const accessPolicy = new StudentLearningSessionAccessPolicy();
const sourceTruthPolicy = new StudentLearningSessionSourceTruthPolicy();

function resolveContext(req: Request): StudentLearningSessionContext | null {
  if (!req.user) return null;
  return {
    schoolId: (req.user as any).schoolId || '',
    studentId: (req.user as any).id || '',
    tutorLearnerId: (req.user as any).id || '',
  };
}

function sendError(res: Response, status: number, body: Record<string, unknown>): void {
  res.status(status).json(body);
}

const HIDDEN_REASONING_FIELDS = ['chainOfThought', 'hiddenReasoning', 'internalReasoning', 'modelReasoning', 'reasoningTrace', 'scratchpad'];
const PROTECTED_ANSWER_FIELDS = ['answerKey', 'markingScheme', 'modelAnswer', 'correctAnswer', 'expectedAnswer', 'fullSolution', 'finalAnswer'];

function checkForbiddenInput(req: Request, res: Response): boolean {
  const body = req.body || {};
  const forbidden = findForbiddenStudentLearningSessionFields(body);
  if (forbidden.length > 0) {
    sendError(res, 400, buildForbiddenRawFieldErrorResponse() as unknown as Record<string, unknown>);
    return true;
  }
  for (const key of HIDDEN_REASONING_FIELDS) {
    if (key in body && body[key] !== undefined) {
      sendError(res, 400, buildHiddenReasoningErrorResponse() as unknown as Record<string, unknown>);
      return true;
    }
  }
  for (const key of PROTECTED_ANSWER_FIELDS) {
    if (key in body && body[key] !== undefined) {
      sendError(res, 400, buildProtectedAnswerErrorResponse() as unknown as Record<string, unknown>);
      return true;
    }
  }
  return false;
}

// POST /api/copilot/learning-sessions
router.post('/', async (req: Request, res: Response) => {
  try {
    if (checkForbiddenInput(req, res)) return;
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const access = accessPolicy.checkAccess(ctx, ctx.schoolId, ctx.studentId, ctx.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied: ' + access.safeReasonCodes.join(', ')) as unknown as Record<string, unknown>);
    }
    const result = createStudentLearningSession(ctx);
    const response = buildSessionCreatedResponse(result);
    recordSessionAuditEvent({
      schoolId: ctx.schoolId,
      tutorLearnerId: ctx.tutorLearnerId,
      sessionId: result.session.id,
      eventType: 'session_created',
      safeReasonCodes: result.safeReasonCodes,
    });
    res.status(201).json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// GET /api/copilot/learning-sessions
router.get('/', async (req: Request, res: Response) => {
  try {
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const access = accessPolicy.checkAccess(ctx, ctx.schoolId, ctx.studentId, ctx.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const sessions = listStudentLearningSessionsForLearner(ctx.schoolId, ctx.tutorLearnerId);
    res.json({
      ok: true,
      status: sessions.length > 0 ? 'active' : 'empty',
      sessions: sessions.map(s => ({
        id: s.id,
        status: s.status,
        stage: s.stage,
        currentMode: s.currentMode,
        startedAt: s.startedAt.toISOString(),
        lastActiveAt: s.lastActiveAt.toISOString(),
      })),
      safeReasonCodes: sessions.length > 0 ? ['session_active'] : ['no_existing_session_found'],
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// GET /api/copilot/learning-sessions/:sessionId
router.get('/:sessionId', async (req: Request, res: Response) => {
  try {
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const record = getStudentLearningSession(sessionId);
    if (!record) {
      return sendError(res, 404, buildGenericErrorResponse('Session not found') as unknown as Record<string, unknown>);
    }
    const access = accessPolicy.checkAccess(ctx, record.schoolId, record.studentId || '', record.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const snapshot = buildLearnerSafeSessionSnapshot(record);
    const response = buildSessionSnapshotResponse(snapshot);
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// POST /api/copilot/learning-sessions/:sessionId/resume
router.post('/:sessionId/resume', async (req: Request, res: Response) => {
  try {
    if (checkForbiddenInput(req, res)) return;
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const access = accessPolicy.checkAccess(ctx, ctx.schoolId, ctx.studentId, ctx.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const result = resumeStudentLearningSession(sessionId, ctx);
    if (!result) {
      return sendError(res, 404, buildGenericErrorResponse('Session not found or cannot be resumed') as unknown as Record<string, unknown>);
    }
    const response = buildSessionResumedResponse(result);
    recordSessionAuditEvent({
      schoolId: ctx.schoolId,
      tutorLearnerId: ctx.tutorLearnerId,
      sessionId,
      eventType: 'session_resumed',
      safeReasonCodes: result.safeReasonCodes,
    });
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// POST /api/copilot/learning-sessions/:sessionId/pause
router.post('/:sessionId/pause', async (req: Request, res: Response) => {
  try {
    if (checkForbiddenInput(req, res)) return;
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const access = accessPolicy.checkAccess(ctx, ctx.schoolId, ctx.studentId, ctx.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const result = pauseStudentLearningSession(sessionId, ctx);
    if (!result) {
      return sendError(res, 404, buildGenericErrorResponse('Session not found or cannot be paused') as unknown as Record<string, unknown>);
    }
    const response = buildSessionPausedResponse(result);
    recordSessionAuditEvent({
      schoolId: ctx.schoolId,
      tutorLearnerId: ctx.tutorLearnerId,
      sessionId,
      eventType: 'session_paused',
      safeReasonCodes: result.safeReasonCodes,
    });
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// POST /api/copilot/learning-sessions/:sessionId/complete
router.post('/:sessionId/complete', async (req: Request, res: Response) => {
  try {
    if (checkForbiddenInput(req, res)) return;
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const access = accessPolicy.checkAccess(ctx, ctx.schoolId, ctx.studentId, ctx.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const result = completeStudentLearningSession(sessionId, ctx);
    if (!result) {
      return sendError(res, 404, buildGenericErrorResponse('Session not found or cannot be completed') as unknown as Record<string, unknown>);
    }
    const response = buildSessionCompletedResponse(result);
    recordSessionAuditEvent({
      schoolId: ctx.schoolId,
      tutorLearnerId: ctx.tutorLearnerId,
      sessionId,
      eventType: 'session_completed',
      safeReasonCodes: result.safeReasonCodes,
    });
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// POST /api/copilot/learning-sessions/:sessionId/abandon
router.post('/:sessionId/abandon', async (req: Request, res: Response) => {
  try {
    if (checkForbiddenInput(req, res)) return;
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const access = accessPolicy.checkAccess(ctx, ctx.schoolId, ctx.studentId, ctx.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const result = abandonStudentLearningSession(sessionId, ctx);
    if (!result) {
      return sendError(res, 404, buildGenericErrorResponse('Session not found or cannot be abandoned') as unknown as Record<string, unknown>);
    }
    const response = buildSessionAbandonedResponse(result);
    recordSessionAuditEvent({
      schoolId: ctx.schoolId,
      tutorLearnerId: ctx.tutorLearnerId,
      sessionId,
      eventType: 'session_abandoned',
      safeReasonCodes: result.safeReasonCodes,
    });
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// POST /api/copilot/learning-sessions/:sessionId/transition
router.post('/:sessionId/transition', async (req: Request, res: Response) => {
  try {
    if (checkForbiddenInput(req, res)) return;
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const { transitionType, requestedMode, sourceTruthStatus, safeguardingBoundary, deenBoundary, challengeReady, remediationNeeded } = req.body || {};

    if (!transitionType) {
      return sendError(res, 400, buildGenericErrorResponse('transitionType is required') as unknown as Record<string, unknown>);
    }

    const record = getStudentLearningSession(sessionId);
    if (!record) {
      return sendError(res, 404, buildGenericErrorResponse('Session not found') as unknown as Record<string, unknown>);
    }
    const access = accessPolicy.checkAccess(ctx, record.schoolId, record.studentId || '', record.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }

    const result = transitionSessionState(
      record.status,
      record.stage,
      record.currentMode,
      transitionType as any,
      requestedMode as any,
    );

    if (result.allowed) {
      const updated = updateSessionTransition(sessionId, {
        status: result.sessionStatus,
        stage: result.sessionStage,
        currentMode: result.toMode,
        previousMode: result.fromMode,
        allowedTransitions: [],
        blockedTransitions: [],
        safeReasonCodes: result.safeReasonCodes,
      });
      recordSessionAuditEvent({
        schoolId: ctx.schoolId,
        tutorLearnerId: ctx.tutorLearnerId,
        sessionId,
        eventType: 'session_transition_allowed',
        currentMode: result.toMode,
        transitionType: result.transitionType,
        policyDecision: result.policyDecision,
        safeReasonCodes: result.safeReasonCodes,
      });
    } else {
      recordSessionAuditEvent({
        schoolId: ctx.schoolId,
        tutorLearnerId: ctx.tutorLearnerId,
        sessionId,
        eventType: 'session_transition_blocked',
        transitionType: result.transitionType,
        policyDecision: result.policyDecision,
        safeReasonCodes: result.safeReasonCodes,
      });
    }

    const response = buildSessionTransitionResponse(result);
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// GET /api/copilot/learning-sessions/:sessionId/snapshot
router.get('/:sessionId/snapshot', async (req: Request, res: Response) => {
  try {
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const record = getStudentLearningSession(sessionId);
    if (!record) {
      const emptySnapshot = buildEmptySessionSnapshot();
      const response = buildSessionSnapshotResponse(emptySnapshot);
      return res.json(response);
    }
    const access = accessPolicy.checkAccess(ctx, record.schoolId, record.studentId || '', record.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const snapshot = buildLearnerSafeSessionSnapshot(record);
    assertSessionSnapshotIsSafe(snapshot);
    const response = buildSessionSnapshotResponse(snapshot);
    recordSessionAuditEvent({
      schoolId: ctx.schoolId,
      tutorLearnerId: ctx.tutorLearnerId,
      sessionId,
      eventType: 'session_snapshot_created',
      safeReasonCodes: ['safe_snapshot_created'],
    });
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// GET /api/copilot/learning-sessions/:sessionId/resume-context
router.get('/:sessionId/resume-context', async (req: Request, res: Response) => {
  try {
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const record = getStudentLearningSession(sessionId);
    if (!record) {
      const empty = buildEmptyResumeContext();
      const response = buildResumeContextResponse(empty);
      return res.json(response);
    }
    const access = accessPolicy.checkAccess(ctx, record.schoolId, record.studentId || '', record.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const resumeContext = buildResumeContextFromSession(record);
    assertResumeContextIsSafe(resumeContext);
    const response = buildResumeContextResponse(resumeContext);
    recordSessionAuditEvent({
      schoolId: ctx.schoolId,
      tutorLearnerId: ctx.tutorLearnerId,
      sessionId,
      eventType: 'session_resume_context_created',
      safeReasonCodes: ['safe_resume_context_created'],
    });
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// GET /api/copilot/learning-sessions/:sessionId/exit-summary
router.get('/:sessionId/exit-summary', async (req: Request, res: Response) => {
  try {
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const record = getStudentLearningSession(sessionId);
    if (!record) {
      return sendError(res, 404, buildGenericErrorResponse('Session not found') as unknown as Record<string, unknown>);
    }
    const access = accessPolicy.checkAccess(ctx, record.schoolId, record.studentId || '', record.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const modesUsed: StudentLearningSessionMode[] = record.currentMode !== 'none' ? [record.currentMode] : [];
    const summary = record.status === 'abandoned'
      ? buildAbandonedSessionSummary(record, modesUsed)
      : buildCompletedSessionSummary(record, modesUsed, []);
    assertExitSummaryIsSafe(summary);
    const response = buildExitSummaryResponse(summary);
    recordSessionAuditEvent({
      schoolId: ctx.schoolId,
      tutorLearnerId: ctx.tutorLearnerId,
      sessionId,
      eventType: 'session_exit_summary_created',
      safeReasonCodes: ['safe_exit_summary_created'],
    });
    res.json(response);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// GET /api/copilot/learning-sessions/:sessionId/actions
router.get('/:sessionId/actions', async (req: Request, res: Response) => {
  try {
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const record = getStudentLearningSession(sessionId);
    if (!record) {
      return sendError(res, 404, buildGenericErrorResponse('Session not found') as unknown as Record<string, unknown>);
    }
    const access = accessPolicy.checkAccess(ctx, record.schoolId, record.studentId || '', record.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }
    const events = buildSafeActionHistoryView(sessionId);
    res.json({
      ok: true,
      status: 'actions',
      actions: events,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

// POST /api/copilot/learning-sessions/:sessionId/audit
router.post('/:sessionId/audit', async (req: Request, res: Response) => {
  try {
    if (checkForbiddenInput(req, res)) return;
    const ctx = resolveContext(req);
    if (!ctx) {
      return sendError(res, 401, buildGenericErrorResponse('Authentication required') as unknown as Record<string, unknown>);
    }
    const { sessionId } = req.params;
    const { eventType, currentMode, transitionType, policyDecision } = req.body || {};

    const record = getStudentLearningSession(sessionId);
    if (!record) {
      return sendError(res, 404, buildGenericErrorResponse('Session not found') as unknown as Record<string, unknown>);
    }
    const access = accessPolicy.checkAccess(ctx, record.schoolId, record.studentId || '', record.tutorLearnerId);
    if (!access.allowed) {
      return sendError(res, 403, buildGenericErrorResponse('Access denied') as unknown as Record<string, unknown>);
    }

    const auditEvent = recordSessionAuditEvent({
      schoolId: ctx.schoolId,
      studentId: ctx.studentId,
      tutorLearnerId: ctx.tutorLearnerId,
      sessionId,
      eventType: eventType || 'session_runtime_failed',
      currentMode: currentMode as any,
      transitionType: transitionType as any,
      policyDecision: policyDecision as any,
      safeReasonCodes: [],
    });

    res.json({
      ok: true,
      status: 'audit_recorded',
      auditEvent,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, buildGenericErrorResponse(msg) as unknown as Record<string, unknown>);
  }
});

export default router;
