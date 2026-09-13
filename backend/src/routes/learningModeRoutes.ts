import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext, requireVerifiedStudentContext } from '../middleware/schoolContextGuardMiddleware';
import { checkLearningModeAccess } from '../services/learningModeAccessPolicy';
import { rejectForbiddenKeys } from '../services/learningSignalPrivacyGuard';
import { createModeSession, getModeSessionById, getActiveModeSession, updateModeSessionStatus, updateModeSessionStage, serializeModeSession } from '../services/learningModeSessionService';
import { canTransition } from '../services/learningModeTransitionService';
import { createSignal, getSignalsForSession } from '../services/learningSignalService';
import { createAttempt, getAttemptsForSession } from '../services/learningAttemptService';
import { createHintEvent, getHintEventsForSession } from '../services/learningHintTrackingService';
import { getExitSummaryForSession, generateExitSummaryFromSignals, serializeExitSummary } from '../services/modeExitSummaryService';
import { createApiSuccess } from '../services/apiEnvelopeService';
import { apiErrorFromCategory } from '../services/apiErrorService';
import { StartModeSessionSchema, TransitionModeSchema, RecordSignalSchema, RecordAttemptSchema, RecordHintSchema } from '../lib/learningModeValidation';

const router = Router();

function buildMeta(req: Request) {
  return {
    requestId: (req as any).requestId || 'unknown',
    timestamp: new Date().toISOString(),
    route: req.originalUrl || req.url,
    method: req.method,
    contractVersion: '1.0.0',
  };
}

// ── POST /api/learning-modes/session/start ──
router.post('/learning-modes/session/start', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = req.verifiedSchoolIdentity!;
    const meta = buildMeta(req);

    // Validate forbidden keys
    const keyCheck = rejectForbiddenKeys(req.body || {});
    if (!keyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${keyCheck.detectedKey}`, meta));
    }

    // Validate input
    const parsed = StartModeSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    // Verify school identity is verified
    if (!identity.verified) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Verified school identity required', meta));
    }

    const studentId = identity.externalStudentId || identity.externalUserId;
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const session = await createModeSession({
      schoolId: identity.schoolId,
      studentId,
      mode: parsed.data.mode,
      conversationId: parsed.data.conversationId,
      subjectId: parsed.data.subjectId,
      topicId: parsed.data.topicId,
      skillId: parsed.data.skillId,
    });

    res.json(createApiSuccess({ data: serializeModeSession(session), meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start mode session', meta));
  }
});

// ── GET /api/learning-modes/session/active ──
router.get('/learning-modes/session/active', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = req.verifiedSchoolIdentity!;
    const meta = buildMeta(req);

    const studentId = identity.externalStudentId || identity.externalUserId;
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const session = await getActiveModeSession(identity.schoolId, studentId);
    res.json(createApiSuccess({ data: { activeSession: session ? serializeModeSession(session) : null }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read active session', meta));
  }
});

// ── PATCH /api/learning-modes/session/:id/transition ──
router.patch('/learning-modes/session/:id/transition', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = req.verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { id } = req.params;

    // Validate forbidden keys
    const keyCheck = rejectForbiddenKeys(req.body || {});
    if (!keyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${keyCheck.detectedKey}`, meta));
    }

    const parsed = TransitionModeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getModeSessionById(id);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Mode session not found', meta));
    }

    // Verify student owns this session
    const studentId = identity.externalStudentId || identity.externalUserId;
    if (session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const { status, stage } = parsed.data;

    // Validate transition
    const decision = canTransition(session.status, session.stage, status, stage);
    if (!decision.allowed) {
      return res.status(422).json(apiErrorFromCategory('validation_error', decision.reason || 'Invalid transition', meta));
    }

    // Apply transitions
    let updated = session;
    if (status) {
      updated = await updateModeSessionStatus(id, status);
    }
    if (stage) {
      updated = await updateModeSessionStage(id, stage);
    }

    // Record signal for transition
    if (status || stage) {
      await createSignal({
        modeSessionId: id,
        schoolId: session.schoolId,
        studentId: session.studentId,
        signalType: 'mode_stage_changed',
        stage: (stage || session.stage) as any,
      }).catch(() => {}); // Non-critical
    }

    res.json(createApiSuccess({ data: serializeModeSession(updated), meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to transition', meta));
  }
});

// ── POST /api/learning-modes/session/:id/signal ──
router.post('/learning-modes/session/:id/signal', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = req.verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { id } = req.params;

    // Validate forbidden keys
    const keyCheck = rejectForbiddenKeys(req.body || {});
    if (!keyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${keyCheck.detectedKey}`, meta));
    }

    const parsed = RecordSignalSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getModeSessionById(id);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Mode session not found', meta));
    }

    const studentId = identity.externalStudentId || identity.externalUserId;
    if (session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const signal = await createSignal({
      modeSessionId: id,
      schoolId: session.schoolId,
      studentId: session.studentId,
      ...parsed.data,
    });

    res.json(createApiSuccess({ data: { id: signal.id, signalType: signal.signalType, createdAt: signal.createdAt.toISOString() }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record signal', meta));
  }
});

// ── POST /api/learning-modes/session/:id/attempt ──
router.post('/learning-modes/session/:id/attempt', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = req.verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { id } = req.params;

    const keyCheck = rejectForbiddenKeys(req.body || {});
    if (!keyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${keyCheck.detectedKey}`, meta));
    }

    const parsed = RecordAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getModeSessionById(id);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Mode session not found', meta));
    }

    const studentId = identity.externalStudentId || identity.externalUserId;
    if (session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Session is already ended', meta));
    }

    const attempt = await createAttempt({
      modeSessionId: id,
      schoolId: session.schoolId,
      studentId: session.studentId,
      ...parsed.data,
    });

    res.json(createApiSuccess({ data: { id: attempt.id, attemptNumber: attempt.attemptNumber, createdAt: attempt.createdAt.toISOString() }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record attempt', meta));
  }
});

// ── POST /api/learning-modes/session/:id/hint ──
router.post('/learning-modes/session/:id/hint', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = req.verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { id } = req.params;

    const keyCheck = rejectForbiddenKeys(req.body || {});
    if (!keyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${keyCheck.detectedKey}`, meta));
    }

    const parsed = RecordHintSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getModeSessionById(id);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Mode session not found', meta));
    }

    const studentId = identity.externalStudentId || identity.externalUserId;
    if (session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const hintEvent = await createHintEvent({
      modeSessionId: id,
      schoolId: session.schoolId,
      studentId: session.studentId,
      ...parsed.data,
    });

    res.json(createApiSuccess({ data: { id: hintEvent.id, hintLevel: hintEvent.hintLevel, createdAt: hintEvent.createdAt.toISOString() }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record hint', meta));
  }
});

// ── POST /api/learning-modes/session/:id/exit ──
router.post('/learning-modes/session/:id/exit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = req.verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { id } = req.params;

    const session = await getModeSessionById(id);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Mode session not found', meta));
    }

    const studentId = identity.externalStudentId || identity.externalUserId;
    if (session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Session is already ended', meta));
    }

    // Mark as completed
    const updated = await updateModeSessionStatus(id, 'completed');

    // Generate exit summary from accumulated signals
    const summary = await generateExitSummaryFromSignals(
      id,
      session.schoolId,
      session.studentId,
      session.mode,
      session.topicId || undefined,
      session.subjectId || undefined,
    );

    res.json(createApiSuccess({
      data: {
        session: serializeModeSession(updated),
        summary: serializeExitSummary(summary),
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to exit mode session', meta));
  }
});

// ── GET /api/learning-modes/session/:id/summary ──
router.get('/learning-modes/session/:id/summary', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = req.verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { id } = req.params;

    const summary = await getExitSummaryForSession(id);
    if (!summary) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Exit summary not found for this session', meta));
    }

    const studentId = identity.externalStudentId || identity.externalUserId;
    if (summary.studentId !== studentId || summary.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    res.json(createApiSuccess({ data: serializeExitSummary(summary), meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read summary', meta));
  }
});

export default router;
