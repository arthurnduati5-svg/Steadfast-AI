import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';
import { hydrateSessionContext } from '../services/sessionContextHydrationService';
import { resumeLearnerSession } from '../services/sessionResumeRuntime';
import { runEndToEndLearningLoop } from '../services/endToEndLearningLoopRuntime';
import { writeCheckpoint } from '../services/sessionProgressCheckpointService';
import { generateSessionCompletionSummary } from '../services/sessionCompletionSummaryService';
import { validateTransitionSafety, validateResultSafety } from '../services/sessionTransitionSafetyGuardService';
import { listSessionEvents } from '../services/studentLearningSessionEventRepository';
import { getActiveSessionState, getSessionStateForLearner, closeSession, pauseSession } from '../services/studentLearningSessionStateRepository';
import { sanitizeSessionStateForLearner } from '../services/studentLearningSessionContracts';

const router = Router();

function resolveIdentity(req: Request): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || undefined,
  };
}

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

// POST /api/learner/sessions/start
router.post('/sessions/start', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { subject, topic, skillTag, sessionIntent, clientContext } = req.body || {};

    const resumeDecision = await resumeLearnerSession(
      identity.schoolId,
      identity.studentId,
      identity.userId,
    );

    let sessionState = resumeDecision.sessionState;

    if (!sessionState) {
      const { createSessionState } = await import('../services/studentLearningSessionStateRepository');
      sessionState = await createSessionState({
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        studentId: identity.userId,
        subject,
        topic,
        skillTag,
      });
    }

    const safeState = sanitizeSessionStateForLearner(sessionState);

    res.json({
      ok: true,
      session: safeState,
      resumed: resumeDecision.canResume,
      degradeToHydration: resumeDecision.degradeToHydration,
      carryOverSummary: resumeDecision.carryOverSummary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

// GET /api/learner/sessions/:sessionId/state
router.get('/sessions/:sessionId/state', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { sessionId } = req.params;
    const sessionState = await getSessionStateForLearner(identity.schoolId, identity.studentId, sessionId);

    if (!sessionState) {
      return sendError(res, 404, 'session_not_found', 'Session not found');
    }

    const safeState = sanitizeSessionStateForLearner(sessionState);

    res.json({
      ok: true,
      session: safeState,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

// POST /api/learner/sessions/:sessionId/step
router.post('/sessions/:sessionId/step', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { sessionId } = req.params;
    const { learnerActionType, message, attemptText, selectedOptionId, feedbackType, clientContext } = req.body || {};

    if (!learnerActionType) {
      return sendError(res, 400, 'validation_error', 'learnerActionType is required');
    }

    // Verify session ownership
    const sessionState = await getSessionStateForLearner(identity.schoolId, identity.studentId, sessionId);
    if (!sessionState) {
      return sendError(res, 404, 'session_not_found', 'Session not found');
    }

    if (sessionState.status === 'completed') {
      return sendError(res, 409, 'session_closed', 'This session has ended');
    }

    const result = await runEndToEndLearningLoop({
      identity,
      request: {
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        sessionId,
        learnerActionType: learnerActionType || 'continue',
        message,
        attemptText,
        selectedOptionId,
        feedbackType,
        clientContext,
      },
      requestId: (req as any).requestId || `req_${Date.now()}`,
    });

    // Safety guard
    const safetyDecision = validateResultSafety(result);
    if (!safetyDecision.allowed) {
      return sendError(res, 422, 'safety_blocked', safetyDecision.blockedReason || 'Safety check failed');
    }

    res.json({
      ok: true,
      result,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

// POST /api/learner/sessions/:sessionId/transition
router.post('/sessions/:sessionId/transition', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { sessionId } = req.params;
    const { requestedMode, reason } = req.body || {};

    if (!requestedMode) {
      return sendError(res, 400, 'validation_error', 'requestedMode is required');
    }

    const { determineTransition } = await import('../services/studentLearningSessionStateMachine');
    const { updateSessionState, getSessionStateForLearner } = await import('../services/studentLearningSessionStateRepository');
    const { selectNextMode } = await import('../services/tutorModeTransitionPolicyService');

    const sessionState = await getSessionStateForLearner(identity.schoolId, identity.studentId, sessionId);
    if (!sessionState) {
      return sendError(res, 404, 'session_not_found', 'Session not found');
    }

    const decision = determineTransition(
      sessionState.currentMode,
      requestedMode as any,
      ['learner_request', ...(reason ? [reason] : [])] as any,
    );

    if (!decision.allowed) {
      return sendError(res, 422, 'invalid_transition', `Cannot transition from ${sessionState.currentMode} to ${requestedMode}`);
    }

    const updated = await updateSessionState(sessionId, {
      currentMode: requestedMode as any,
      previousMode: sessionState.currentMode,
      reasonCodes: decision.reasonCodes,
    });

    const safeState = sanitizeSessionStateForLearner(updated);

    res.json({
      ok: true,
      session: safeState,
      decision,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

// POST /api/learner/sessions/:sessionId/pause
router.post('/sessions/:sessionId/pause', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { sessionId } = req.params;
    const sessionState = await getSessionStateForLearner(identity.schoolId, identity.studentId, sessionId);

    if (!sessionState) {
      return sendError(res, 404, 'session_not_found', 'Session not found');
    }

    const paused = await pauseSession(sessionId);

    res.json({
      ok: true,
      session: sanitizeSessionStateForLearner(paused),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

// POST /api/learner/sessions/:sessionId/complete
router.post('/sessions/:sessionId/complete', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { sessionId } = req.params;
    const sessionState = await getSessionStateForLearner(identity.schoolId, identity.studentId, sessionId);

    if (!sessionState) {
      return sendError(res, 404, 'session_not_found', 'Session not found');
    }

    const closed = await closeSession(sessionId);
    const summary = await generateSessionCompletionSummary(identity.schoolId, identity.studentId, closed);
    const safeState = sanitizeSessionStateForLearner(closed);

    res.json({
      ok: true,
      session: safeState,
      summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

// GET /api/learner/sessions/:sessionId/summary
router.get('/sessions/:sessionId/summary', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { sessionId } = req.params;
    const sessionState = await getSessionStateForLearner(identity.schoolId, identity.studentId, sessionId);

    if (!sessionState) {
      return sendError(res, 404, 'session_not_found', 'Session not found');
    }

    const summary = await generateSessionCompletionSummary(identity.schoolId, identity.studentId, sessionState);

    res.json({
      ok: true,
      summary,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

// GET /api/learner/sessions/:sessionId/events
router.get('/sessions/:sessionId/events', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return sendError(res, 401, 'unauthenticated', 'Authentication required');
    }

    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const events = await listSessionEvents(identity.schoolId, identity.studentId, sessionId, limit);

    const safeEvents = events.map(e => ({
      id: e.id,
      eventType: e.eventType,
      previousMode: e.previousMode,
      nextMode: e.nextMode,
      subject: e.subject,
      topic: e.topic,
      skillTag: e.skillTag,
      safeEventSummary: e.safeEventSummary,
      reasonCodes: e.reasonCodes,
      createdAt: e.createdAt.toISOString(),
    }));

    res.json({
      ok: true,
      events: safeEvents,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

export default router;
