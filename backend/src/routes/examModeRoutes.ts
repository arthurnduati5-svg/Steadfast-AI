import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { checkExamModeAccess } from '../services/examModeAccessPolicy';
import { rejectForbiddenExamFields } from '../services/examModePrivacyGuard';
import {
  startExamSession,
  getActiveExamSession,
  getExamSessionById,
  cancelExistingActiveExamSessions,
  updateExamSessionStatus,
  updateExamSessionStage,
  updateExamSessionCounts,
  updateExamSessionCurrentQuestionIndex,
  serializeExamSession,
} from '../services/examModeSessionService';
import { loadExamState, buildExamState } from '../services/examModeStateService';
import {
  createQuestionState,
  createQuestionStatesBatch,
  getCurrentQuestionState,
  getQuestionStateByKey,
  markQuestionActive,
  markQuestionAttempted,
  flagQuestion,
  skipQuestion,
  completeQuestion,
  serializeQuestionState,
} from '../services/examModeQuestionStateService';
import { recordExamAttempt } from '../services/examModeAttemptService';
import { getNextExamAction } from '../services/examModeTutorActionBridgeService';
import { evaluateAnswerProtection } from '../services/examModeAnswerProtectionPolicyService';
import { createExamSummary, getExamSummaryForSession, serializeExamSummary } from '../services/examModeSummaryService';
import {
  writeExamSessionStarted,
  writeExamSessionExited,
  writeExamStageChanged,
  writeExamQuestionStarted,
  writeExamQuestionSkipped,
  writeExamQuestionFlagged,
  writeExamReflectionDetected,
} from '../services/examModeSignalBridgeService';
import { buildStudentExamStateResponse, buildExamSummaryResponse, buildEmptyActiveExamResponse } from '../services/examModeResponseBuilder';
import { createApiSuccess } from '../services/apiEnvelopeService';
import { apiErrorFromCategory } from '../services/apiErrorService';
import {
  ExamModeStartRequestSchema,
  ExamModeQuestionAdvanceRequestSchema,
  ExamModeAttemptRequestSchema,
  ExamModeHintRequestSchema,
  ExamModeSubmitRequestSchema,
  ExamModeExitRequestSchema,
  ExamModeReflectRequestSchema,
} from '../lib/examModeValidation';

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

    const privacyCheck = rejectForbiddenExamFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = ExamModeStartRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const schoolId = identity.schoolId;

    if (parsed.data.replaceExisting) {
      await cancelExistingActiveExamSessions(schoolId, studentId);
    } else {
      const existing = await getActiveExamSession(schoolId, studentId);
      if (existing) {
        return res.status(409).json(apiErrorFromCategory('conflict', 'An active Exam Mode session already exists. Set replaceExisting=true to replace it.', meta));
      }
    }

    const examSession = await startExamSession({
      schoolId,
      studentId,
      tutorLearnerId: identity.tutorLearnerId || identity.externalStudentId,
      targetType: parsed.data.targetType,
      examGoalCategory: parsed.data.examGoalCategory,
      examSessionType: parsed.data.examSessionType,
      timerMode: parsed.data.timerMode,
      questionCount: parsed.data.questionCount,
      conversationId: parsed.data.conversationId,
      subjectId: parsed.data.subjectId,
      topicId: parsed.data.topicId,
      skillId: parsed.data.skillId,
      approvedContentRef: parsed.data.approvedContentRef,
      paperRef: parsed.data.paperRef,
      examSetRef: parsed.data.examSetRef,
      approvedContextAvailable: parsed.data.approvedContextAvailable,
      deenSensitive: parsed.data.deenSensitive,
    });

    // Create initial question states if questionCount > 0
    if (parsed.data.questionCount > 0) {
      await createQuestionStatesBatch(
        examSession.id,
        examSession.modeSessionId,
        schoolId,
        studentId,
        parsed.data.questionCount,
      );
    }

    await updateExamSessionStage(examSession.id, 'ready_to_start');

    await writeExamSessionStarted(examSession.modeSessionId, schoolId, studentId);

    const protection = evaluateAnswerProtection({
      hasAttempt: false,
      answerKeyRisk: false,
      markingSchemeRisk: false,
      modelAnswerRisk: false,
      approvedContextAvailable: parsed.data.approvedContextAvailable ?? true,
      deenSensitive: parsed.data.deenSensitive ?? false,
      unsafeRequest: false,
    });

    const action = getNextExamAction({
      schoolId,
      studentId,
      modeSessionId: examSession.modeSessionId,
      currentStage: 'ready_to_start',
      approvedContextAvailable: parsed.data.approvedContextAvailable,
      deenSensitive: parsed.data.deenSensitive,
    });

    res.json(createApiSuccess({
      data: {
        examMode: {
          sessionId: examSession.id,
          modeSessionId: examSession.modeSessionId,
          status: examSession.status,
          currentStage: 'ready_to_start',
          currentQuestionIndex: 0,
          questionCount: parsed.data.questionCount,
          nextAction: {
            selectedAction: action.selectedAction,
            supportLevel: action.supportLevel,
            learnerNeedCategory: action.learnerNeedCategory,
          },
          answerProtection: {
            decision: protection.decision,
          },
          timerState: {
            timerMode: parsed.data.timerMode || 'untimed',
          },
        },
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start Exam Mode', meta));
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

    const activeSession = await getActiveExamSession(identity.schoolId, studentId);
    if (!activeSession) {
      return res.json(createApiSuccess({ data: { activeExamMode: null }, meta }));
    }

    const state = await loadExamState(activeSession.id);
    res.json(createApiSuccess({ data: state ? buildStudentExamStateResponse(state) : { activeExamMode: null }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read active Exam Mode', meta));
  }
});

// ── GET /:examSessionId/state ──
router.get('/:examSessionId/state', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getExamSessionById(examSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    }

    const access = checkExamModeAccess({
      requesterSchoolId: identity.schoolId,
      requesterStudentId: studentId || undefined,
      requesterRole: identity.role || 'student',
      targetSchoolId: session.schoolId,
      targetStudentId: session.studentId,
    });
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const state = await loadExamState(examSessionId);
    if (!state) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Exam state not available', meta));
    }

    res.json(createApiSuccess({ data: buildStudentExamStateResponse(state), meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read exam state', meta));
  }
});

// ── POST /:examSessionId/question/start ──
router.post('/:examSessionId/question/start', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenExamFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = ExamModeQuestionAdvanceRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getExamSessionById(examSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status !== 'active') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is not active', meta));
    }

    const qIndex = parsed.data.questionIndex;
    if (qIndex < 0 || qIndex >= session.questionCount) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Question index ${qIndex} out of range (0-${session.questionCount - 1})`, meta));
    }

    // Check/create question state
    let qState = await getCurrentQuestionState(examSessionId, qIndex);
    if (!qState) {
      qState = await createQuestionState({
        examSessionId,
        modeSessionId: session.modeSessionId,
        schoolId: session.schoolId,
        studentId: session.studentId,
        questionKey: parsed.data.questionKey,
        questionIndex: qIndex,
        questionRef: parsed.data.questionRef,
        questionFingerprint: parsed.data.questionFingerprint,
      });
    }

    await markQuestionActive(examSessionId, qIndex);
    await updateExamSessionCurrentQuestionIndex(examSessionId, qIndex);
    await updateExamSessionStage(examSessionId, 'reading_question');

    await writeExamQuestionStarted(session.modeSessionId, session.schoolId, session.studentId, 'reading_question');

    const state = await loadExamState(examSessionId);
    res.json(createApiSuccess({
      data: state ? buildStudentExamStateResponse(state) : { ok: true, examMode: { sessionId: examSessionId, currentStage: 'reading_question' } },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start question', meta));
  }
});

// ── POST /:examSessionId/question/attempt ──
router.post('/:examSessionId/question/attempt', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenExamFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = ExamModeAttemptRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getExamSessionById(examSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status !== 'active') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is not active', meta));
    }

    const newAttemptNumber = session.attemptCount + 1;

    const attempt = await recordExamAttempt({
      examSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      questionKey: parsed.data.questionKey,
      questionIndex: parsed.data.questionIndex,
      questionRef: parsed.data.questionRef,
      stage: session.currentStage,
      attemptNumber: newAttemptNumber,
      answerQuality: parsed.data.answerQuality,
      mistakeCategory: parsed.data.mistakeCategory,
      usedHint: parsed.data.usedHint,
      timeSpentBucket: parsed.data.timeSpentBucket,
      confidenceBucket: parsed.data.confidenceBucket,
      scoreBucket: parsed.data.scoreBucket,
      safeEvidenceRefs: parsed.data.safeEvidenceRefs,
    });

    const isStuck = ['incorrect', 'unclear', 'blank', 'unanswered', 'not_evaluated'].includes(parsed.data.answerQuality);
    const isRecovery = ['correct', 'mostly_correct'].includes(parsed.data.answerQuality);

    await updateExamSessionCounts(examSessionId, {
      attemptCount: newAttemptNumber,
      stuckCount: session.stuckCount + (isStuck ? 1 : 0),
      recoveryCount: session.recoveryCount + (isRecovery ? 1 : 0),
    });

    await updateExamSessionStage(examSessionId, 'answer_submitted');

    // Update question state
    const qState = await getCurrentQuestionState(examSessionId, parsed.data.questionIndex);
    if (qState) {
      await markQuestionAttempted(examSessionId, parsed.data.questionIndex, newAttemptNumber);
    }

    const state = await loadExamState(examSessionId, {
      answerQuality: parsed.data.answerQuality,
      mistakeCategory: parsed.data.mistakeCategory,
    });

    res.json(createApiSuccess({
      data: {
        attempt: {
          id: attempt.id,
          attemptNumber: newAttemptNumber,
          answerQuality: parsed.data.answerQuality,
        },
        nextAction: state?.nextAction,
        answerProtection: state?.answerProtection,
        attemptCount: newAttemptNumber,
        stuckCount: session.stuckCount + (isStuck ? 1 : 0),
        recoveryCount: session.recoveryCount + (isRecovery ? 1 : 0),
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record exam attempt', meta));
  }
});

// ── POST /:examSessionId/question/flag ──
router.post('/:examSessionId/question/flag', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is not active', meta));

    const qState = await getCurrentQuestionState(examSessionId, session.currentQuestionIndex);
    if (qState) {
      await flagQuestion(qState.id);
      await updateExamSessionCounts(examSessionId, { flaggedCount: (session.flaggedCount || 0) + 1 });
      await writeExamQuestionFlagged(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);
    }

    res.json(createApiSuccess({ data: { flagged: true, questionIndex: session.currentQuestionIndex }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to flag question', meta));
  }
});

// ── POST /:examSessionId/question/skip ──
router.post('/:examSessionId/question/skip', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is not active', meta));

    const qState = await getCurrentQuestionState(examSessionId, session.currentQuestionIndex);
    if (qState) {
      await skipQuestion(qState.id);
      await updateExamSessionCounts(examSessionId, { skippedCount: (session.skippedCount || 0) + 1 });
      await writeExamQuestionSkipped(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);
    }

    res.json(createApiSuccess({ data: { skipped: true, questionIndex: session.currentQuestionIndex }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to skip question', meta));
  }
});

// ── POST /:examSessionId/question/next ──
router.post('/:examSessionId/question/next', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is not active', meta));

    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex >= session.questionCount) {
      await updateExamSessionStage(examSessionId, 'summary_ready');
      const state = await loadExamState(examSessionId);
      return res.json(createApiSuccess({
        data: {
          allQuestionsComplete: true,
          currentStage: 'summary_ready',
          state: state ? buildStudentExamStateResponse(state) : undefined,
        },
        meta,
      }));
    }

    await updateExamSessionCurrentQuestionIndex(examSessionId, nextIndex);
    await updateExamSessionStage(examSessionId, 'reading_question');

    const state = await loadExamState(examSessionId);
    res.json(createApiSuccess({
      data: {
        nextQuestionIndex: nextIndex,
        currentStage: 'reading_question',
        state: state ? buildStudentExamStateResponse(state) : undefined,
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to advance to next question', meta));
  }
});

// ── POST /:examSessionId/hint ──
router.post('/:examSessionId/hint', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenExamFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = ExamModeHintRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is not active', meta));

    // Check attempt-before-help policy
    if (session.attemptCount === 0) {
      const protection = evaluateAnswerProtection({
        hasAttempt: false,
        answerKeyRisk: false,
        markingSchemeRisk: false,
        modelAnswerRisk: false,
        approvedContextAvailable: true,
        deenSensitive: false,
        unsafeRequest: false,
      });
      if (protection.decision === 'require_attempt_first') {
        return res.status(409).json(apiErrorFromCategory('conflict', 'An honest attempt is required before requesting a hint.', meta));
      }
    }

    const newHintCount = (session.hintCount || 0) + 1;
    await updateExamSessionCounts(examSessionId, { hintCount: newHintCount });

    const state = await loadExamState(examSessionId);

    res.json(createApiSuccess({
      data: {
        hintCount: newHintCount,
        nextAction: state?.nextAction,
        safeReasonCodes: state?.safeReasonCodes || [],
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to process hint request', meta));
  }
});

// ── POST /:examSessionId/reflect ──
router.post('/:examSessionId/reflect', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is not active', meta));

    await writeExamReflectionDetected(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);
    await updateExamSessionStage(examSessionId, 'reflection_check');

    res.json(createApiSuccess({
      data: { reflectionRecorded: true, currentStage: 'reflection_check' },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record reflection', meta));
  }
});

// ── POST /:examSessionId/pause ──
router.post('/:examSessionId/pause', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is not active', meta));

    await updateExamSessionStatus(examSessionId, 'paused');
    await writeExamStageChanged(session.modeSessionId, session.schoolId, session.studentId, 'paused');

    res.json(createApiSuccess({ data: { paused: true, status: 'paused' }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to pause exam session', meta));
  }
});

// ── POST /:examSessionId/resume ──
router.post('/:examSessionId/resume', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'paused') return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is not paused', meta));

    await updateExamSessionStatus(examSessionId, 'active');
    await writeExamStageChanged(session.modeSessionId, session.schoolId, session.studentId, 'active');

    res.json(createApiSuccess({ data: { resumed: true, status: 'active' }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to resume exam session', meta));
  }
});

// ── POST /:examSessionId/submit ──
router.post('/:examSessionId/submit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenExamFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = ExamModeSubmitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status === 'submitted' || session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is already ended', meta));
    }

    // Mark session as submitted
    await updateExamSessionStatus(examSessionId, 'submitted');
    await updateExamSessionStage(examSessionId, 'submitted');

    // Create summary
    const summary = await createExamSummary({
      examSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      finalStage: session.currentStage,
      exitReason: parsed.data.reason || 'student_submitted',
      questionCount: session.questionCount,
      attemptCount: session.attemptCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      skippedCount: session.skippedCount,
      flaggedCount: session.flaggedCount,
    });

    await writeExamSessionExited(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    res.json(createApiSuccess({
      data: {
        session: serializeExamSession({ ...session, status: 'submitted', submittedAt: new Date() }),
        summary: serializeExamSummary(summary),
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to submit exam', meta));
  }
});

// ── POST /:examSessionId/exit ──
router.post('/:examSessionId/exit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenExamFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = ExamModeExitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is already ended', meta));
    }

    await updateExamSessionStatus(examSessionId, 'completed');

    const summary = await createExamSummary({
      examSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      finalStage: session.currentStage,
      exitReason: parsed.data.reason || 'student_exited',
      questionCount: session.questionCount,
      attemptCount: session.attemptCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      skippedCount: session.skippedCount,
      flaggedCount: session.flaggedCount,
    });

    await writeExamSessionExited(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    res.json(createApiSuccess({
      data: {
        session: serializeExamSession({ ...session, status: 'completed', endedAt: new Date() }),
        summary: serializeExamSummary(summary),
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to exit exam', meta));
  }
});

// ── GET /:examSessionId/summary ──
router.get('/:examSessionId/summary', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const summary = await getExamSummaryForSession(examSessionId);
    if (!summary) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam summary not found', meta));
    if (!studentId || summary.studentId !== studentId || summary.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    res.json(createApiSuccess({ data: serializeExamSummary(summary), meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read summary', meta));
  }
});

// ── POST /:examSessionId/cancel ──
router.post('/:examSessionId/cancel', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { examSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getExamSessionById(examSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Exam session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Exam session is already ended', meta));
    }

    await updateExamSessionStatus(examSessionId, 'cancelled');
    await writeExamSessionExited(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    res.json(createApiSuccess({
      data: {
        session: serializeExamSession({ ...session, status: 'cancelled', endedAt: new Date() }),
        cancelled: true,
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to cancel exam', meta));
  }
});

export default router;
