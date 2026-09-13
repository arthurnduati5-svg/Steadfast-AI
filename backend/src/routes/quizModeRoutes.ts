import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { checkQuizModeAccess } from '../services/quizModeAccessPolicy';
import { rejectForbiddenQuizFields } from '../services/quizModePrivacyGuard';
import {
  startQuizSession,
  getActiveQuizSession,
  getQuizSessionById,
  cancelExistingActiveQuizSessions,
  updateQuizSessionStatus,
  updateQuizSessionStage,
  updateQuizSessionCounts,
  updateQuizSessionCurrentQuestionIndex,
  serializeQuizSession,
} from '../services/quizModeSessionService';
import { loadQuizState, buildQuizState } from '../services/quizModeStateService';
import {
  createQuestionState,
  createQuestionStatesBatch,
  getCurrentQuestionState,
  getQuestionStateByKey,
  markQuestionActive,
  markQuestionAttempted,
  markFeedbackReady,
  flagQuestion,
  skipQuestion,
  completeQuestion,
  serializeQuestionState,
} from '../services/quizModeQuestionStateService';
import { recordQuizAttempt } from '../services/quizModeAttemptService';
import { classifyRecall } from '../services/quizModeRecallClassificationService';
import { getNextQuizAction } from '../services/quizModeTutorActionBridgeService';
import { evaluateFeedbackPolicy } from '../services/quizModeFeedbackPolicyService';
import { evaluateQuizAnswerProtection } from '../services/quizModeAnswerProtectionPolicyService';
import { computeScoringMetadata } from '../services/quizModeScoringMetadataService';
import { createQuizSummary, getQuizSummaryForSession, serializeQuizSummary } from '../services/quizModeSummaryService';
import {
  writeQuizSessionStarted,
  writeQuizSessionExited,
  writeQuizStageChanged,
  writeQuizQuestionStarted,
  writeQuizQuestionSkipped,
  writeQuizQuestionFlagged,
  writeQuizReflectionDetected,
  writeQuizHintGiven,
  writeQuizRecallSuccess,
  writeQuizRecallFailure,
  writeQuizSupportActionSelected,
} from '../services/quizModeSignalBridgeService';
import { buildStudentQuizStateResponse, buildQuizSummaryResponse, buildEmptyActiveQuizResponse } from '../services/quizModeResponseBuilder';
import { createApiSuccess } from '../services/apiEnvelopeService';
import { apiErrorFromCategory } from '../services/apiErrorService';
import {
  QuizModeStartRequestSchema,
  QuizModeQuestionAdvanceRequestSchema,
  QuizModeAttemptRequestSchema,
  QuizModeHintRequestSchema,
  QuizModeFeedbackRequestSchema,
  QuizModeSubmitRequestSchema,
  QuizModeExitRequestSchema,
} from '../lib/quizModeValidation';

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

    const privacyCheck = rejectForbiddenQuizFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = QuizModeStartRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const schoolId = identity.schoolId;

    if (parsed.data.replaceExisting) {
      await cancelExistingActiveQuizSessions(schoolId, studentId);
    } else {
      const existing = await getActiveQuizSession(schoolId, studentId);
      if (existing) {
        return res.status(409).json(apiErrorFromCategory('conflict', 'An active Quiz Mode session already exists. Set replaceExisting=true to replace it.', meta));
      }
    }

    const quizSession = await startQuizSession({
      schoolId,
      studentId,
      tutorLearnerId: identity.tutorLearnerId || identity.externalStudentId,
      targetType: parsed.data.targetType,
      quizGoalCategory: parsed.data.quizGoalCategory,
      quizSessionType: parsed.data.quizSessionType,
      questionCount: parsed.data.questionCount,
      conversationId: parsed.data.conversationId,
      subjectId: parsed.data.subjectId,
      topicId: parsed.data.topicId,
      skillId: parsed.data.skillId,
      approvedContentRef: parsed.data.approvedContentRef,
      quizSetRef: parsed.data.quizSetRef,
      approvedContextAvailable: parsed.data.approvedContextAvailable,
      deenSensitive: parsed.data.deenSensitive,
    });

    if (parsed.data.questionCount > 0) {
      await createQuestionStatesBatch(
        quizSession.id,
        quizSession.modeSessionId,
        schoolId,
        studentId,
        parsed.data.questionCount,
      );
    }

    await updateQuizSessionStage(quizSession.id, 'ready_to_start');

    await writeQuizSessionStarted(quizSession.modeSessionId, schoolId, studentId);

    const protection = evaluateQuizAnswerProtection({
      hasAttempt: false,
      answerKeyRisk: false,
      markingSchemeRisk: false,
      modelAnswerRisk: false,
      approvedContextAvailable: parsed.data.approvedContextAvailable ?? true,
      deenSensitive: parsed.data.deenSensitive ?? false,
      unsafeRequest: false,
    });

    const action = getNextQuizAction({
      schoolId,
      studentId,
      modeSessionId: quizSession.modeSessionId,
      currentStage: 'ready_to_start',
      approvedContextAvailable: parsed.data.approvedContextAvailable,
      deenSensitive: parsed.data.deenSensitive,
    });

    const feedbackPolicy = evaluateFeedbackPolicy({
      hasAttempt: false,
      answerKeyRisk: false,
      correctAnswerRisk: false,
      markingSchemeRisk: false,
      modelAnswerRisk: false,
      approvedContextAvailable: parsed.data.approvedContextAvailable ?? true,
      deenSensitive: parsed.data.deenSensitive ?? false,
      unsafeRequest: false,
    });

    res.json(createApiSuccess({
      data: {
        quizMode: {
          sessionId: quizSession.id,
          modeSessionId: quizSession.modeSessionId,
          status: quizSession.status,
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
          feedbackPolicy: {
            decision: feedbackPolicy.decision,
          },
        },
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start Quiz Mode', meta));
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

    const activeSession = await getActiveQuizSession(identity.schoolId, studentId);
    if (!activeSession) {
      return res.json(createApiSuccess({ data: { activeQuizMode: null }, meta }));
    }

    const state = await loadQuizState(activeSession.id);
    res.json(createApiSuccess({ data: state ? buildStudentQuizStateResponse(state) : { activeQuizMode: null }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read active Quiz Mode', meta));
  }
});

// ── GET /:quizSessionId/state ──
router.get('/:quizSessionId/state', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getQuizSessionById(quizSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    }

    const access = checkQuizModeAccess({
      requesterSchoolId: identity.schoolId,
      requesterStudentId: studentId || undefined,
      requesterRole: identity.role || 'student',
      targetSchoolId: session.schoolId,
      targetStudentId: session.studentId,
    });
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const state = await loadQuizState(quizSessionId);
    if (!state) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz state not available', meta));
    }

    res.json(createApiSuccess({ data: buildStudentQuizStateResponse(state), meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read quiz state', meta));
  }
});

// ── POST /:quizSessionId/question/start ──
router.post('/:quizSessionId/question/start', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenQuizFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = QuizModeQuestionAdvanceRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getQuizSessionById(quizSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status !== 'active') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not active', meta));
    }

    const qIndex = parsed.data.questionIndex;
    if (qIndex < 0 || qIndex >= session.questionCount) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Question index ${qIndex} out of range (0-${session.questionCount - 1})`, meta));
    }

    let qState = await getCurrentQuestionState(quizSessionId, qIndex);
    if (!qState) {
      qState = await createQuestionState({
        quizSessionId,
        modeSessionId: session.modeSessionId,
        schoolId: session.schoolId,
        studentId: session.studentId,
        questionKey: parsed.data.questionKey,
        questionIndex: qIndex,
        questionRef: parsed.data.questionRef,
        questionFingerprint: parsed.data.questionFingerprint,
      });
    }

    await markQuestionActive(quizSessionId, qIndex);
    await updateQuizSessionCurrentQuestionIndex(quizSessionId, qIndex);
    await updateQuizSessionStage(quizSessionId, 'reading_question');

    await writeQuizQuestionStarted(session.modeSessionId, session.schoolId, session.studentId, 'reading_question');

    const state = await loadQuizState(quizSessionId);
    res.json(createApiSuccess({
      data: state ? buildStudentQuizStateResponse(state) : { ok: true, quizMode: { sessionId: quizSessionId, currentStage: 'reading_question' } },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start question', meta));
  }
});

// ── POST /:quizSessionId/question/attempt ──
router.post('/:quizSessionId/question/attempt', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenQuizFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = QuizModeAttemptRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getQuizSessionById(quizSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    }

    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    if (session.status !== 'active') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not active', meta));
    }

    const newAttemptNumber = session.attemptCount + 1;

    // Classify recall
    const recall = classifyRecall({
      answerQuality: parsed.data.answerQuality,
      attemptNumber: newAttemptNumber,
      usedHint: parsed.data.usedHint ?? false,
      timeSpentBucket: parsed.data.timeSpentBucket,
      confidenceBucket: parsed.data.confidenceBucket,
      mistakeCategory: parsed.data.mistakeCategory,
    });

    // Compute scoring metadata
    const scoring = computeScoringMetadata({
      answerQuality: parsed.data.answerQuality,
      mistakeCategory: parsed.data.mistakeCategory,
      usedHint: parsed.data.usedHint,
      retrievalSignal: recall.retrievalSignal,
      recallStrengthBucket: recall.recallStrengthBucket,
    });

    const attempt = await recordQuizAttempt({
      quizSessionId,
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
      scoreBucket: scoring.scoreBucket,
      retrievalSignal: recall.retrievalSignal,
      safeEvidenceRefs: parsed.data.safeEvidenceRefs,
    });

    // Update counts
    const isCorrect = scoring.isCorrect;
    const isStuck = ['incorrect', 'unclear', 'blank', 'unanswered', 'not_evaluated'].includes(parsed.data.answerQuality);
    const isRecovery = ['correct', 'mostly_correct'].includes(parsed.data.answerQuality);

    await updateQuizSessionCounts(quizSessionId, {
      attemptCount: newAttemptNumber,
      correctCount: session.correctCount + (isCorrect ? 1 : 0),
      partialCount: session.partialCount + (parsed.data.answerQuality === 'partially_correct' ? 1 : 0),
      incorrectCount: session.incorrectCount + (isStuck && !isCorrect ? 1 : 0),
      stuckCount: session.stuckCount + (isStuck ? 1 : 0),
      recoveryCount: session.recoveryCount + (isRecovery ? 1 : 0),
    });

    await updateQuizSessionStage(quizSessionId, 'answer_submitted');

    // Update question state
    const qState = await getCurrentQuestionState(quizSessionId, parsed.data.questionIndex);
    if (qState) {
      await markQuestionAttempted(quizSessionId, parsed.data.questionIndex, newAttemptNumber);
    }

    // Write recall signals
    if (recall.recallStrengthBucket === 'strong' || recall.recallStrengthBucket === 'stable') {
      await writeQuizRecallSuccess(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);
    } else if (recall.recallStrengthBucket === 'weak') {
      await writeQuizRecallFailure(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);
    }

    // Evaluate answer protection and feedback policy
    const protection = evaluateQuizAnswerProtection({
      hasAttempt: true,
      answerKeyRisk: false,
      markingSchemeRisk: false,
      modelAnswerRisk: false,
      approvedContextAvailable: true,
      deenSensitive: false,
      unsafeRequest: false,
    });

    const feedbackPolicy = evaluateFeedbackPolicy({
      hasAttempt: true,
      answerKeyRisk: false,
      correctAnswerRisk: false,
      markingSchemeRisk: false,
      modelAnswerRisk: false,
      approvedContextAvailable: true,
      deenSensitive: false,
      unsafeRequest: false,
      recallStrengthBucket: recall.recallStrengthBucket,
      practiceNeed: recall.practiceNeed,
      repeatedWeak: (session.attemptCount || 0) > 2 && parsed.data.answerQuality === 'incorrect',
    });

    // Get next action
    const action = getNextQuizAction({
      schoolId: session.schoolId,
      studentId: session.studentId,
      modeSessionId: session.modeSessionId,
      currentStage: 'answer_submitted',
      answerQuality: parsed.data.answerQuality,
      mistakeCategory: parsed.data.mistakeCategory,
      retrievalSignal: recall.retrievalSignal,
      approvedContextAvailable: true,
      deenSensitive: false,
      safeSignals: {
        attemptCount: newAttemptNumber,
        hintCount: session.hintCount,
        stuckCount: session.stuckCount + (isStuck ? 1 : 0),
        recoveryCount: session.recoveryCount + (isRecovery ? 1 : 0),
        skippedCount: session.skippedCount,
        flaggedCount: session.flaggedCount,
        correctCount: session.correctCount + (isCorrect ? 1 : 0),
        partialCount: session.partialCount + (parsed.data.answerQuality === 'partially_correct' ? 1 : 0),
        incorrectCount: session.incorrectCount + (isStuck && !isCorrect ? 1 : 0),
      },
    });

    res.json(createApiSuccess({
      data: {
        attempt: {
          id: attempt.id,
          attemptNumber: newAttemptNumber,
          answerQuality: parsed.data.answerQuality,
        },
        recall: {
          retrievalSignal: recall.retrievalSignal,
          recallStrengthBucket: recall.recallStrengthBucket,
          practiceNeed: recall.practiceNeed,
        },
        nextAction: {
          selectedAction: action.selectedAction,
          supportLevel: action.supportLevel,
          learnerNeedCategory: action.learnerNeedCategory,
        },
        answerProtection: {
          decision: protection.decision,
        },
        feedbackPolicy: {
          decision: feedbackPolicy.decision,
        },
        attemptCount: newAttemptNumber,
        correctCount: session.correctCount + (isCorrect ? 1 : 0),
        partialCount: session.partialCount + (parsed.data.answerQuality === 'partially_correct' ? 1 : 0),
        incorrectCount: session.incorrectCount + (isStuck && !isCorrect ? 1 : 0),
        stuckCount: session.stuckCount + (isStuck ? 1 : 0),
        recoveryCount: session.recoveryCount + (isRecovery ? 1 : 0),
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record quiz attempt', meta));
  }
});

// ── POST /:quizSessionId/question/feedback ──
router.post('/:quizSessionId/question/feedback', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenQuizFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = QuizModeFeedbackRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not active', meta));

    if (session.attemptCount === 0) {
      return res.status(409).json(apiErrorFromCategory('conflict', 'An honest attempt is required before requesting feedback.', meta));
    }

    const protection = evaluateQuizAnswerProtection({
      hasAttempt: true,
      answerKeyRisk: false,
      markingSchemeRisk: false,
      modelAnswerRisk: false,
      approvedContextAvailable: true,
      deenSensitive: false,
      unsafeRequest: false,
    });

    const feedbackPolicy = evaluateFeedbackPolicy({
      hasAttempt: true,
      answerKeyRisk: false,
      correctAnswerRisk: false,
      markingSchemeRisk: false,
      modelAnswerRisk: false,
      approvedContextAvailable: true,
      deenSensitive: false,
      unsafeRequest: false,
    });

    await updateQuizSessionStage(quizSessionId, 'feedback_ready');

    const qState = await getCurrentQuestionState(quizSessionId, parsed.data.questionIndex);
    if (qState) {
      await markFeedbackReady(quizSessionId, parsed.data.questionIndex);
    }

    res.json(createApiSuccess({
      data: {
        questionKey: parsed.data.questionKey,
        questionIndex: parsed.data.questionIndex,
        feedbackReady: true,
        currentStage: 'feedback_ready',
        answerProtection: {
          decision: protection.decision,
        },
        feedbackPolicy: {
          decision: feedbackPolicy.decision,
        },
        safeReasonCodes: [...protection.reasonCodes, ...feedbackPolicy.reasonCodes],
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to process feedback request', meta));
  }
});

// ── POST /:quizSessionId/question/flag ──
router.post('/:quizSessionId/question/flag', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not active', meta));

    const qState = await getCurrentQuestionState(quizSessionId, session.currentQuestionIndex);
    if (qState) {
      await flagQuestion(qState.id);
      await updateQuizSessionCounts(quizSessionId, { flaggedCount: (session.flaggedCount || 0) + 1 });
      await writeQuizQuestionFlagged(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);
    }

    res.json(createApiSuccess({ data: { flagged: true, questionIndex: session.currentQuestionIndex }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to flag question', meta));
  }
});

// ── POST /:quizSessionId/question/skip ──
router.post('/:quizSessionId/question/skip', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not active', meta));

    const qState = await getCurrentQuestionState(quizSessionId, session.currentQuestionIndex);
    if (qState) {
      await skipQuestion(qState.id);
      await updateQuizSessionCounts(quizSessionId, { skippedCount: (session.skippedCount || 0) + 1 });
      await writeQuizQuestionSkipped(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);
    }

    res.json(createApiSuccess({ data: { skipped: true, questionIndex: session.currentQuestionIndex }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to skip question', meta));
  }
});

// ── POST /:quizSessionId/question/next ──
router.post('/:quizSessionId/question/next', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not active', meta));

    const nextIndex = session.currentQuestionIndex + 1;
    if (nextIndex >= session.questionCount) {
      await updateQuizSessionStage(quizSessionId, 'summary_ready');
      const state = await loadQuizState(quizSessionId);
      return res.json(createApiSuccess({
        data: {
          allQuestionsComplete: true,
          currentStage: 'summary_ready',
          state: state ? buildStudentQuizStateResponse(state) : undefined,
        },
        meta,
      }));
    }

    await updateQuizSessionCurrentQuestionIndex(quizSessionId, nextIndex);
    await updateQuizSessionStage(quizSessionId, 'reading_question');

    const state = await loadQuizState(quizSessionId);
    res.json(createApiSuccess({
      data: {
        nextQuestionIndex: nextIndex,
        currentStage: 'reading_question',
        state: state ? buildStudentQuizStateResponse(state) : undefined,
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to advance to next question', meta));
  }
});

// ── POST /:quizSessionId/hint ──
router.post('/:quizSessionId/hint', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenQuizFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = QuizModeHintRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not active', meta));

    if (session.attemptCount === 0) {
      const protection = evaluateQuizAnswerProtection({
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
    await updateQuizSessionCounts(quizSessionId, { hintCount: newHintCount });

    await writeQuizHintGiven(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    const state = await loadQuizState(quizSessionId);

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

// ── POST /:quizSessionId/reflect ──
router.post('/:quizSessionId/reflect', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not active', meta));

    await writeQuizReflectionDetected(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);
    await updateQuizSessionStage(quizSessionId, 'reflection_check');

    res.json(createApiSuccess({
      data: { reflectionRecorded: true, currentStage: 'reflection_check' },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record reflection', meta));
  }
});

// ── POST /:quizSessionId/pause ──
router.post('/:quizSessionId/pause', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'active') return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not active', meta));

    await updateQuizSessionStatus(quizSessionId, 'paused');
    await writeQuizStageChanged(session.modeSessionId, session.schoolId, session.studentId, 'paused');

    res.json(createApiSuccess({ data: { paused: true, status: 'paused' }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to pause quiz session', meta));
  }
});

// ── POST /:quizSessionId/resume ──
router.post('/:quizSessionId/resume', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status !== 'paused') return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is not paused', meta));

    await updateQuizSessionStatus(quizSessionId, 'active');
    await writeQuizStageChanged(session.modeSessionId, session.schoolId, session.studentId, 'active');

    res.json(createApiSuccess({ data: { resumed: true, status: 'active' }, meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to resume quiz session', meta));
  }
});

// ── POST /:quizSessionId/submit ──
router.post('/:quizSessionId/submit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenQuizFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = QuizModeSubmitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status === 'submitted' || session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is already ended', meta));
    }

    await updateQuizSessionStatus(quizSessionId, 'submitted');
    await updateQuizSessionStage(quizSessionId, 'submitted');

    const summary = await createQuizSummary({
      quizSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      finalStage: session.currentStage,
      exitReason: parsed.data.reason || 'student_submitted',
      questionCount: session.questionCount,
      attemptCount: session.attemptCount,
      correctCount: session.correctCount,
      partialCount: session.partialCount,
      incorrectCount: session.incorrectCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      skippedCount: session.skippedCount,
      flaggedCount: session.flaggedCount,
    });

    await writeQuizSessionExited(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    res.json(createApiSuccess({
      data: {
        session: serializeQuizSession({ ...session, status: 'submitted', submittedAt: new Date() }),
        summary: serializeQuizSummary(summary),
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to submit quiz', meta));
  }
});

// ── POST /:quizSessionId/exit ──
router.post('/:quizSessionId/exit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const privacyCheck = rejectForbiddenQuizFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = QuizModeExitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is already ended', meta));
    }

    await updateQuizSessionStatus(quizSessionId, 'completed');

    const summary = await createQuizSummary({
      quizSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      finalStage: session.currentStage,
      exitReason: parsed.data.reason || 'student_exited',
      questionCount: session.questionCount,
      attemptCount: session.attemptCount,
      correctCount: session.correctCount,
      partialCount: session.partialCount,
      incorrectCount: session.incorrectCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      skippedCount: session.skippedCount,
      flaggedCount: session.flaggedCount,
    });

    await writeQuizSessionExited(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    res.json(createApiSuccess({
      data: {
        session: serializeQuizSession({ ...session, status: 'completed', endedAt: new Date() }),
        summary: serializeQuizSummary(summary),
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to exit quiz', meta));
  }
});

// ── GET /:quizSessionId/summary ──
router.get('/:quizSessionId/summary', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const summary = await getQuizSummaryForSession(quizSessionId);
    if (!summary) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz summary not found', meta));
    if (!studentId || summary.studentId !== studentId || summary.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    res.json(createApiSuccess({ data: serializeQuizSummary(summary), meta }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to read summary', meta));
  }
});

// ── POST /:quizSessionId/cancel ──
router.post('/:quizSessionId/cancel', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { quizSessionId } = req.params;
    const studentId = getStudentId(req);

    const session = await getQuizSessionById(quizSessionId);
    if (!session) return res.status(404).json(apiErrorFromCategory('not_found', 'Quiz session not found', meta));
    if (!studentId || session.studentId !== studentId || session.schoolId !== identity.schoolId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }
    if (session.status === 'completed' || session.status === 'cancelled') {
      return res.status(409).json(apiErrorFromCategory('conflict', 'Quiz session is already ended', meta));
    }

    await updateQuizSessionStatus(quizSessionId, 'cancelled');
    await writeQuizSessionExited(session.modeSessionId, session.schoolId, session.studentId, session.currentStage);

    res.json(createApiSuccess({
      data: {
        session: serializeQuizSession({ ...session, status: 'cancelled', endedAt: new Date() }),
        cancelled: true,
      },
      meta,
    }));
  } catch (err: any) {
    const meta = buildMeta(req);
    res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to cancel quiz', meta));
  }
});

export default router;
