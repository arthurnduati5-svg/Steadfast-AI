import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { checkFocusModeAccess } from '../services/focusModeAccessPolicy';
import { rejectForbiddenFocusFields } from '../services/focusModePrivacyGuard';
import { startFocusSession, getActiveFocusSession, getFocusSessionById, cancelExistingActiveSessions, updateFocusSessionStatus, updateFocusSessionStage, updateFocusSessionCounts, serializeFocusSession } from '../services/focusModeSessionService';
import { loadFocusState, buildFocusState } from '../services/focusModeStateService';
import { createInitialStep, createStep, getActiveStepForSession, completeActiveStepForSession, mapTutorActionToStepType, serializeFocusStep, updateFocusSessionCurrentStepKey } from '../services/focusModeStepService';
import { recordFocusAttempt } from '../services/focusModeAttemptService';
import { getNextFocusAction } from '../services/focusModeTutorActionBridgeService';
import { processHintBridge, recordHintBridgeSignal } from '../services/focusModeHintBridgeService';
import { createFocusSummary, getFocusSummaryForSession, serializeFocusSummary } from '../services/focusModeSummaryService';
import { writeFocusSessionStarted, writeFocusSessionExited, writeFocusStageChanged, writeFocusReflectionDetected } from '../services/focusModeSignalBridgeService';
import { buildStudentStateResponse, buildSummaryResponse, buildEmptyActiveResponse } from '../services/focusModeResponseBuilder';
import { createApiSuccess } from '../services/apiEnvelopeService';
import { apiErrorFromCategory } from '../services/apiErrorService';
import {
  FocusModeStartRequestSchema,
  FocusModeAttemptRequestSchema,
  FocusModeHintRequestSchema,
  FocusModeExitRequestSchema,
  FocusModeAdvanceRequestSchema,
} from '../lib/focusModeValidation';

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

function getStudentId(req: Request): string | null {
  const identity = (req as any).verifiedSchoolIdentity;
  if (!identity) return null;
  return identity.externalStudentId || identity.externalUserId || null;
}

// ── POST /start ──
router.post('/start', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);

    // Check forbidden fields
    const privacyCheck = rejectForbiddenFocusFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = FocusModeStartRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const schoolId = identity.schoolId;

    // Handle replaceExisting
    if (parsed.data.replaceExisting) {
      await cancelExistingActiveSessions(schoolId, studentId);
    } else {
      const existing = await getActiveFocusSession(schoolId, studentId);
      if (existing) {
        return res.status(409).json(apiErrorFromCategory('conflict', 'An active Focus Mode session already exists. Set replaceExisting=true to replace it.', meta));
      }
    }

    // Start focus session
    const focusSession = await startFocusSession({
      schoolId,
      studentId,
      tutorLearnerId: identity.tutorLearnerId || identity.externalStudentId,
      targetType: parsed.data.targetType,
      focusGoalCategory: parsed.data.focusGoalCategory,
      conversationId: parsed.data.conversationId,
      subjectId: parsed.data.subjectId,
      topicId: parsed.data.topicId,
      skillId: parsed.data.skillId,
      approvedContentRef: parsed.data.approvedContentRef,
      problemRef: parsed.data.problemRef,
      problemFingerprint: parsed.data.problemFingerprint,
      approvedContextAvailable: parsed.data.approvedContextAvailable,
      deenSensitive: parsed.data.deenSensitive,
    });

    // Create initial step
    const initialStep = await createInitialStep({
      focusSessionId: focusSession.id,
      modeSessionId: focusSession.modeSessionId,
      schoolId,
      studentId,
      stage: 'awaiting_problem',
    });

    await updateFocusSessionCurrentStepKey(focusSession.id, initialStep.stepKey);

    // Write mode_entered signal
    await writeFocusSessionStarted(focusSession.modeSessionId, schoolId, studentId);

    // Build state
    const action = getNextFocusAction({
      schoolId,
      studentId,
      modeSessionId: focusSession.modeSessionId,
      currentStage: 'awaiting_problem',
      approvedContextAvailable: parsed.data.approvedContextAvailable,
      deenSensitive: parsed.data.deenSensitive,
    });

    res.json(createApiSuccess({
      data: {
        focusMode: {
          sessionId: focusSession.id,
          modeSessionId: focusSession.modeSessionId,
          status: focusSession.status,
          currentStage: focusSession.currentStage,
          currentStep: {
            stepKey: initialStep.stepKey,
            stepType: initialStep.stepType,
            status: initialStep.status,
          },
          nextAction: {
            selectedAction: action.selectedAction,
            supportLevel: action.supportLevel,
            learnerNeedCategory: action.learnerNeedCategory,
          },
        },
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start Focus Mode', meta));
  }
});

// ── GET /active ──
router.get('/active', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const studentId = getStudentId(req);

    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const activeSession = await getActiveFocusSession(identity.schoolId, studentId);
    if (!activeSession) {
      return res.json(createApiSuccess({ data: { activeFocusMode: null }, meta }));
    }

    const state = await loadFocusState(activeSession.id);

    res.json(createApiSuccess({ data: state ? buildStudentStateResponse(state) : { activeFocusMode: null }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read active Focus Mode', meta));
  }
});

// ── GET /:focusSessionId/state ──
router.get('/:focusSessionId/state', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { focusSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getFocusSessionById(focusSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Focus session not found', meta));
    }

    // Access policy
    const access = checkFocusModeAccess({
      requesterSchoolId: identity.schoolId,
      requesterStudentId: studentId || undefined,
      requesterRole: identity.role || 'student',
      targetSchoolId: session.schoolId,
      targetStudentId: session.studentId,
    });
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const state = await loadFocusState(focusSessionId);
    if (!state) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Focus state not available', meta));
    }

    res.json(createApiSuccess({ data: buildStudentStateResponse(state), meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read focus state', meta));
  }
});

// ── POST /:focusSessionId/advance ──
router.post('/:focusSessionId/advance', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { focusSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenFocusFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = FocusModeAdvanceRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getFocusSessionById(focusSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Focus session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status !== 'active') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Focus session is not active', meta));
    }

    // Complete current active step
    await completeActiveStepForSession(focusSessionId);

    // Get next action
    const action = getNextFocusAction({
      schoolId: session.schoolId,
      studentId: session.studentId,
      modeSessionId: session.modeSessionId,
      currentStage: session.currentStage,
      subjectId: session.subjectId || undefined,
      topicId: session.topicId || undefined,
      skillId: session.skillId || undefined,
      approvedContextAvailable: true,
      deenSensitive: false,
      safeSignals: {
        attemptCount: session.attemptCount,
        hintCount: session.hintCount,
        stuckCount: session.stuckCount,
        recoveryCount: session.recoveryCount,
      },
    });

    // Create next step
    const stepType = mapTutorActionToStepType(action.selectedAction as any);
    const nextStep = await createStep({
      focusSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      stepKey: `step_${session.attemptCount + 1}`,
      stepType,
      stage: session.currentStage,
      selectedTutorAction: action.selectedAction,
      hintLevel: action.hintLevel,
      supportLevel: action.supportLevel,
      learnerNeedCategory: action.learnerNeedCategory,
      attemptNumber: session.attemptCount + 1,
      reasonCodes: action.reasonCodes,
    });

    await updateFocusSessionCurrentStepKey(focusSessionId, nextStep.stepKey);

    res.json(createApiSuccess({
      data: {
        step: serializeFocusStep(nextStep),
        nextAction: {
          selectedAction: action.selectedAction,
          supportLevel: action.supportLevel,
          learnerNeedCategory: action.learnerNeedCategory,
          reasonCodes: action.reasonCodes,
        },
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to advance focus', meta));
  }
});

// ── POST /:focusSessionId/attempt ──
router.post('/:focusSessionId/attempt', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { focusSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenFocusFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = FocusModeAttemptRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getFocusSessionById(focusSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Focus session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status !== 'active') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Focus session is not active', meta));
    }

    const newAttemptNumber = session.attemptCount + 1;

    const attempt = await recordFocusAttempt({
      focusSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      stage: session.currentStage,
      stepKey: parsed.data.stepKey,
      attemptNumber: newAttemptNumber,
      answerQuality: parsed.data.answerQuality,
      mistakeCategory: parsed.data.mistakeCategory,
      usedHint: parsed.data.usedHint,
      timeSpentBucket: parsed.data.timeSpentBucket,
      safeEvidenceRefs: parsed.data.safeEvidenceRefs,
    });

    // Determine stuck/recovery
    const isStuck = parsed.data.answerQuality === 'incorrect' || parsed.data.answerQuality === 'unclear' || parsed.data.answerQuality === 'unanswered';
    const isRecovery = parsed.data.answerQuality === 'correct' || parsed.data.answerQuality === 'mostly_correct';

    await updateFocusSessionCounts(focusSessionId, {
      attemptCount: newAttemptNumber,
      stuckCount: session.stuckCount + (isStuck ? 1 : 0),
      recoveryCount: session.recoveryCount + (isRecovery ? 1 : 0),
    });

    // Get next action
    const action = getNextFocusAction({
      schoolId: session.schoolId,
      studentId: session.studentId,
      modeSessionId: session.modeSessionId,
      currentStage: session.currentStage,
      subjectId: session.subjectId || undefined,
      topicId: session.topicId || undefined,
      skillId: session.skillId || undefined,
      answerQuality: parsed.data.answerQuality,
      mistakeCategory: parsed.data.mistakeCategory,
      approvedContextAvailable: true,
      deenSensitive: false,
      safeSignals: {
        attemptCount: newAttemptNumber,
        hintCount: session.hintCount,
        stuckCount: session.stuckCount + (isStuck ? 1 : 0),
        recoveryCount: session.recoveryCount + (isRecovery ? 1 : 0),
      },
    });

    res.json(createApiSuccess({
      data: {
        attempt: {
          id: attempt.id,
          attemptNumber: newAttemptNumber,
          answerQuality: parsed.data.answerQuality,
        },
        nextAction: {
          selectedAction: action.selectedAction,
          supportLevel: action.supportLevel,
          learnerNeedCategory: action.learnerNeedCategory,
        },
        attemptCount: newAttemptNumber,
        stuckCount: session.stuckCount + (isStuck ? 1 : 0),
        recoveryCount: session.recoveryCount + (isRecovery ? 1 : 0),
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record attempt', meta));
  }
});

// ── POST /:focusSessionId/hint ──
router.post('/:focusSessionId/hint', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { focusSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenFocusFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = FocusModeHintRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getFocusSessionById(focusSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Focus session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status !== 'active') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Focus session is not active', meta));
    }

    const hintResult = processHintBridge({
      focusSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      currentHintLevel: 'attention_hint',
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      stage: session.currentStage,
      requestedByStudent: parsed.data.requestedByStudent,
    });

    await updateFocusSessionCounts(focusSessionId, {
      hintCount: hintResult.hintCount,
    });

    await recordHintBridgeSignal({
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      hintLevel: hintResult.hintLevel,
      stage: session.currentStage,
      requestedByStudent: parsed.data.requestedByStudent,
    });

    res.json(createApiSuccess({
      data: {
        hintLevel: hintResult.hintLevel,
        hintCount: hintResult.hintCount,
        advanced: hintResult.advanced,
        reasonCode: hintResult.reasonCode,
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to process hint', meta));
  }
});

// ── POST /:focusSessionId/reflect ──
router.post('/:focusSessionId/reflect', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { focusSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenFocusFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const session = await getFocusSessionById(focusSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Focus session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status !== 'active') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Focus session is not active', meta));
    }

    // Record reflection signal
    await writeFocusReflectionDetected(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    // Advance stage to reflection_check
    await updateFocusSessionStage(focusSessionId, 'reflection_check');

    res.json(createApiSuccess({
      data: {
        reflectionRecorded: true,
        currentStage: 'reflection_check',
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record reflection', meta));
  }
});

// ── POST /:focusSessionId/exit ──
router.post('/:focusSessionId/exit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { focusSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenFocusFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = FocusModeExitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getFocusSessionById(focusSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Focus session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Focus session is already ended', meta));
    }

    // Mark session completed
    await updateFocusSessionStatus(focusSessionId, 'completed');

    // Create summary
    const summary = await createFocusSummary({
      focusSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      finalStage: session.currentStage,
      exitReason: parsed.data.reason || 'student_completed',
      attemptCount: session.attemptCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
    });

    // Write mode_exited signal
    await writeFocusSessionExited(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    res.json(createApiSuccess({
      data: {
        session: serializeFocusSession({ ...session, status: 'completed', endedAt: new Date() }),
        summary: serializeFocusSummary(summary),
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to exit Focus Mode', meta));
  }
});

// ── GET /:focusSessionId/summary ──
router.get('/:focusSessionId/summary', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { focusSessionId } = req.params;
    const studentId = getStudentId(req);

    const summary = await getFocusSummaryForSession(focusSessionId);
    if (!summary) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Focus summary not found', meta));
    }

    if (!studentId || summary.studentId !== studentId || summary.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    res.json(createApiSuccess({ data: serializeFocusSummary(summary), meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read summary', meta));
  }
});

// ── POST /:focusSessionId/cancel ──
router.post('/:focusSessionId/cancel', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { focusSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getFocusSessionById(focusSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Focus session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Focus session is already ended', meta));
    }

    await updateFocusSessionStatus(focusSessionId, 'cancelled');

    await writeFocusSessionExited(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    res.json(createApiSuccess({
      data: {
        session: serializeFocusSession({ ...session, status: 'cancelled', endedAt: new Date() }),
        cancelled: true,
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to cancel Focus Mode', meta));
  }
});

export default router;
