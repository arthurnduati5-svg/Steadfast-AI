import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { checkTeachBackModeAccess } from '../services/teachBackModeAccessPolicy';
import { rejectForbiddenTeachBackFields } from '../services/teachBackModePrivacyGuard';
import {
  startTeachBackSession,
  getActiveTeachBackSession,
  getTeachBackSessionById,
  cancelExistingActiveTeachBackSessions,
  updateTeachBackSessionStatus,
  updateTeachBackSessionStage,
  updateTeachBackSessionCounts,
  updateTeachBackSessionCurrentPromptIndex,
  serializeTeachBackSession,
} from '../services/teachBackModeSessionService';
import { loadTeachBackState, buildTeachBackState } from '../services/teachBackModeStateService';
import {
  createPromptStatesBatch,
  getCurrentPromptState,
  getPromptStateByKey,
  markPromptActive,
  markPromptExplained,
  markPromptFeedbackReady,
  markPromptRetryRequested,
  markPromptReflectionReady,
  skipPrompt,
  completePrompt,
  updatePromptState,
  serializePromptState,
} from '../services/teachBackModePromptStateService';
import { recordTeachBackAttempt } from '../services/teachBackModeAttemptService';
import { classifyExplanation } from '../services/teachBackModeExplanationClassificationService';
import { getNextTeachBackAction } from '../services/teachBackModeTutorActionBridgeService';
import { evaluateFeedbackPolicy } from '../services/teachBackModeFeedbackPolicyService';
import { evaluateTeachBackAnswerProtection } from '../services/teachBackModeAnswerProtectionPolicyService';
import { computeMasteryMetadata } from '../services/teachBackModeMasteryMetadataService';
import { createTeachBackSummary, getTeachBackSummaryForSession, serializeTeachBackSummary } from '../services/teachBackModeSummaryService';
import {
  writeTeachBackSessionStarted,
  writeTeachBackSessionExited,
  writeTeachBackStageChanged,
  writeTeachBackHintGiven,
  writeTeachBackSupportActionSelected,
  writeTeachBackReflectionDetected,
} from '../services/teachBackModeSignalBridgeService';
import { buildStudentTeachBackStateResponse, buildTeachBackSummaryResponse, buildEmptyActiveTeachBackResponse } from '../services/teachBackModeResponseBuilder';
import { createApiSuccess } from '../services/apiEnvelopeService';
import { apiErrorFromCategory } from '../services/apiErrorService';
import {
  TeachBackModeStartRequestSchema,
  TeachBackModePromptAdvanceRequestSchema,
  TeachBackModeExplanationAttemptRequestSchema,
  TeachBackModeHintRequestSchema,
  TeachBackModeFeedbackRequestSchema,
  TeachBackModeSubmitRequestSchema,
  TeachBackModeExitRequestSchema,
} from '../lib/teachBackModeValidation';

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

router.post('/start', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);

    const privacyCheck = rejectForbiddenTeachBackFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = TeachBackModeStartRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const schoolId = identity.schoolId;

    if (parsed.data.replaceExisting) {
      await cancelExistingActiveTeachBackSessions(schoolId, studentId);
    } else {
      const existing = await getActiveTeachBackSession(schoolId, studentId);
      if (existing) {
        return res.status(409).json(apiErrorFromCategory('conflict', 'An active Teach-Back Mode session already exists. Set replaceExisting=true to replace it.', meta));
      }
    }

    const session = await startTeachBackSession({
      schoolId,
      studentId,
      tutorLearnerId: identity.tutorLearnerId || identity.externalStudentId,
      targetType: parsed.data.targetType,
      teachBackGoalCategory: parsed.data.teachBackGoalCategory,
      teachBackSessionType: parsed.data.teachBackSessionType,
      promptCount: parsed.data.promptCount,
      conversationId: parsed.data.conversationId,
      subjectId: parsed.data.subjectId,
      topicId: parsed.data.topicId,
      skillId: parsed.data.skillId,
      approvedContentRef: parsed.data.approvedContentRef,
      targetRef: parsed.data.targetRef,
      promptSetRef: parsed.data.promptSetRef,
    });

    if (parsed.data.promptCount > 0) {
      await createPromptStatesBatch(
        session.id,
        session.modeSessionId,
        schoolId,
        studentId,
        parsed.data.promptCount,
      );
    }

    await updateTeachBackSessionStage(session.id, 'ready_to_start');
    await writeTeachBackSessionStarted(session.modeSessionId, schoolId, studentId);

    const protection = evaluateTeachBackAnswerProtection({
      hasAttempt: false,
      answerKeyRisk: false,
      correctAnswerRisk: false,
      markingSchemeRisk: false,
      modelAnswerRisk: false,
      approvedContextAvailable: parsed.data.approvedContextAvailable ?? true,
      deenSensitive: parsed.data.deenSensitive ?? false,
      unsafeRequest: false,
    });

    const feedbackResult = evaluateFeedbackPolicy({
      hasAttempt: false,
      approvedContextAvailable: parsed.data.approvedContextAvailable ?? true,
      deenSensitive: parsed.data.deenSensitive ?? false,
      answerKeyRisk: false,
      correctAnswerRisk: false,
      markingSchemeRisk: false,
      modelAnswerRisk: false,
      unsafeRequest: false,
      attemptCount: 0,
      weakExplanationCount: 0,
    });

    const nextAction = await getNextTeachBackAction({
      modeSessionId: session.modeSessionId,
      conversationId: parsed.data.conversationId,
      stage: 'ready_to_start',
      subjectId: parsed.data.subjectId,
      topicId: parsed.data.topicId,
      skillId: parsed.data.skillId,
      approvedContextAvailable: parsed.data.approvedContextAvailable ?? true,
      deenSensitive: parsed.data.deenSensitive ?? false,
      answerKeyRisk: false,
      modelAnswerRisk: false,
      attemptCount: 0,
      hintCount: 0,
      stuckCount: 0,
      recoveryCount: 0,
      reflectionCount: 0,
      strongExplanationCount: 0,
      partialExplanationCount: 0,
      weakExplanationCount: 0,
      misconceptionCount: 0,
    });

    const state = {
      session: serializeTeachBackSession(session),
      currentStage: 'ready_to_start',
      currentPromptIndex: 0,
      promptCount: parsed.data.promptCount,
      attemptCount: 0,
      strongExplanationCount: 0,
      partialExplanationCount: 0,
      weakExplanationCount: 0,
      misconceptionCount: 0,
      hintCount: 0,
      stuckCount: 0,
      recoveryCount: 0,
      reflectionCount: 0,
      nextAction: {
        selectedAction: nextAction.selectedAction,
        hintLevel: nextAction.hintLevel,
        supportLevel: nextAction.supportLevel,
        learnerNeedCategory: nextAction.learnerNeedCategory,
        reasonCodes: nextAction.reasonCodes,
      },
      answerProtection: {
        decision: protection.decision,
        reasonCodes: protection.reasonCodes,
      },
      feedbackPolicy: {
        decision: feedbackResult.decision,
        reasonCodes: feedbackResult.reasonCodes,
      },
      safeEvidenceRefs: [],
      safeReasonCodes: [...nextAction.reasonCodes, ...protection.reasonCodes, ...feedbackResult.reasonCodes],
    };

    return res.status(201).json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start Teach-Back Mode session', meta));
  }
});

router.get('/active', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const existing = await getActiveTeachBackSession(identity.schoolId, studentId);
    if (!existing) {
      return res.json(buildEmptyActiveTeachBackResponse());
    }

    const state = await loadTeachBackState(existing.id);
    if (!state) {
      return res.json(buildEmptyActiveTeachBackResponse());
    }

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get active session', meta));
  }
});

router.get('/:teachBackSessionId/state', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const access = checkTeachBackModeAccess({
      requesterSchoolId: identity.schoolId,
      requesterStudentId: studentId,
      requesterRole: (req as any).userRole || 'student',
      targetSchoolId: session.schoolId,
      targetStudentId: session.studentId,
    });
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reasonCodes.join(', '), meta));
    }

    const state = await loadTeachBackState(teachBackSessionId);
    if (!state) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode state not available', meta));
    }

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get state', meta));
  }
});

router.post('/:teachBackSessionId/prompt/start', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    if (session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const promptIndex = session.currentPromptIndex;
    if (promptIndex >= session.promptCount) {
      return res.status(400).json(apiErrorFromCategory('validation_error', 'All prompts已完成', meta));
    }

    const promptState = await getCurrentPromptState(teachBackSessionId, promptIndex);
    if (!promptState) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Prompt state not found', meta));
    }

    await markPromptActive(promptState.id);
    await updateTeachBackSessionStage(teachBackSessionId, 'reading_prompt');

    const state = await loadTeachBackState(teachBackSessionId);
    if (!state) {
      return res.status(500).json(apiErrorFromCategory('internal_error', 'Failed to load state', meta));
    }

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to start prompt', meta));
  }
});

router.post('/:teachBackSessionId/prompt/attempt', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const privacyCheck = rejectForbiddenTeachBackFields(req.body || {});
    if (!privacyCheck.valid) {
      return res.status(400).json(apiErrorFromCategory('validation_error', `Forbidden field detected: ${privacyCheck.detectedKeys.join(', ')}`, meta));
    }

    const parsed = TeachBackModeExplanationAttemptRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId || session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const promptState = await getPromptStateByKey(teachBackSessionId, parsed.data.promptKey);
    if (!promptState) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Prompt state not found', meta));
    }

    const attemptNumber = promptState.attemptNumber + 1;

    // Record the attempt
    await recordTeachBackAttempt({
      teachBackSessionId,
      modeSessionId: session.modeSessionId,
      schoolId: session.schoolId,
      studentId: session.studentId,
      promptKey: parsed.data.promptKey,
      promptIndex: parsed.data.promptIndex,
      promptRef: parsed.data.promptRef,
      stage: 'explaining',
      attemptNumber,
      explanationQuality: parsed.data.explanationQuality,
      conceptCoverageBucket: parsed.data.conceptCoverageBucket,
      clarityBucket: parsed.data.clarityBucket,
      confidenceBucket: parsed.data.confidenceBucket,
      misconceptionSignal: parsed.data.misconceptionSignal,
      usedHint: parsed.data.usedHint,
      safeEvidenceRefs: parsed.data.safeEvidenceRefs,
    });

    // Classify the explanation
    const classification = classifyExplanation({
      explanationQuality: parsed.data.explanationQuality,
      conceptCoverageBucket: parsed.data.conceptCoverageBucket,
      clarityBucket: parsed.data.clarityBucket,
      confidenceBucket: parsed.data.confidenceBucket,
      misconceptionSignal: parsed.data.misconceptionSignal,
      attemptNumber,
      usedHint: parsed.data.usedHint ?? false,
      approvedContextAvailable: true,
    });

    // Update prompt state
    await updatePromptState(promptState.id, {
      explanationQuality: parsed.data.explanationQuality,
      conceptCoverageBucket: parsed.data.conceptCoverageBucket,
      clarityBucket: parsed.data.clarityBucket,
      confidenceBucket: parsed.data.confidenceBucket,
      misconceptionSignal: parsed.data.misconceptionSignal,
      supportNeed: classification.supportNeed,
      masterySignal: classification.masterySignal,
      readinessSignal: classification.readinessSignal,
      attemptNumber,
      safeReasonCodesJson: classification.safeReasonCodes,
      safeEvidenceRefsJson: parsed.data.safeEvidenceRefs,
    });

    // Mark prompt as explained and feedback ready
    await markPromptExplained(promptState.id);
    await markPromptFeedbackReady(promptState.id);
    await updateTeachBackSessionStage(teachBackSessionId, 'explanation_submitted');

    // Update session counts
    const isStrong = classification.explanationStrengthBucket === 'strong';
    const isPartial = classification.explanationStrengthBucket === 'developing' || classification.explanationStrengthBucket === 'emerging';
    const isWeak = classification.explanationStrengthBucket === 'weak';
    const hasMisconception = parsed.data.misconceptionSignal && parsed.data.misconceptionSignal !== 'none' && parsed.data.misconceptionSignal !== 'unknown';

    await updateTeachBackSessionCounts(teachBackSessionId, {
      attemptCount: session.attemptCount + 1,
      strongExplanationCount: session.strongExplanationCount + (isStrong ? 1 : 0),
      partialExplanationCount: session.partialExplanationCount + (isPartial ? 1 : 0),
      weakExplanationCount: session.weakExplanationCount + (isWeak ? 1 : 0),
      misconceptionCount: session.misconceptionCount + (hasMisconception ? 1 : 0),
    });

    const updatedSession = await getTeachBackSessionById(teachBackSessionId);
    const updatedPromptState = await getPromptStateByKey(teachBackSessionId, parsed.data.promptKey);

    const state = await buildTeachBackState({
      teachBackSession: updatedSession,
      currentPromptState: updatedPromptState || undefined,
      explanationQuality: parsed.data.explanationQuality,
      conceptCoverageBucket: parsed.data.conceptCoverageBucket,
      clarityBucket: parsed.data.clarityBucket,
      misconceptionSignal: parsed.data.misconceptionSignal,
      approvedContextAvailable: true,
      deenSensitive: false,
      weakExplanationCount: updatedSession?.weakExplanationCount || 0,
    });

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to record attempt', meta));
  }
});

router.post('/:teachBackSessionId/prompt/feedback', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const parsed = TeachBackModeFeedbackRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId || session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const promptState = await getPromptStateByKey(teachBackSessionId, parsed.data.promptKey);
    if (!promptState) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Prompt state not found', meta));
    }

    const hasAttempt = (promptState.attemptNumber || 0) > 0;
    if (!hasAttempt) {
      return res.status(400).json(apiErrorFromCategory('validation_error', 'Must attempt explanation before requesting feedback', meta));
    }

    await updateTeachBackSessionStage(teachBackSessionId, 'reviewing_feedback');

    const state = await loadTeachBackState(teachBackSessionId);
    if (!state) {
      return res.status(500).json(apiErrorFromCategory('internal_error', 'Failed to load state', meta));
    }

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get feedback', meta));
  }
});

router.post('/:teachBackSessionId/prompt/retry', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId || session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const promptState = await getCurrentPromptState(teachBackSessionId, session.currentPromptIndex);
    if (!promptState) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Prompt state not found', meta));
    }

    await markPromptRetryRequested(promptState.id);
    await updateTeachBackSessionStage(teachBackSessionId, 'retrying_explanation');

    const state = await loadTeachBackState(teachBackSessionId);
    if (!state) {
      return res.status(500).json(apiErrorFromCategory('internal_error', 'Failed to load state', meta));
    }

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to retry', meta));
  }
});

router.post('/:teachBackSessionId/prompt/skip', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId || session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const promptState = await getCurrentPromptState(teachBackSessionId, session.currentPromptIndex);
    if (!promptState) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Prompt state not found', meta));
    }

    await skipPrompt(promptState.id);
    await updateTeachBackSessionStage(teachBackSessionId, 'moving_next');

    const state = await loadTeachBackState(teachBackSessionId);
    if (!state) {
      return res.status(500).json(apiErrorFromCategory('internal_error', 'Failed to load state', meta));
    }

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to skip', meta));
  }
});

router.post('/:teachBackSessionId/prompt/next', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId || session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    const currentPrompt = await getCurrentPromptState(teachBackSessionId, session.currentPromptIndex);
    if (currentPrompt && currentPrompt.status !== 'completed' && currentPrompt.status !== 'skipped') {
      await completePrompt(currentPrompt.id);
    }

    const nextIndex = session.currentPromptIndex + 1;
    if (nextIndex >= session.promptCount) {
      await updateTeachBackSessionStage(teachBackSessionId, 'summary_ready');
      const state = await loadTeachBackState(teachBackSessionId);
      return res.json(state ? buildStudentTeachBackStateResponse(state) : buildEmptyActiveTeachBackResponse());
    }

    await updateTeachBackSessionCurrentPromptIndex(teachBackSessionId, nextIndex);
    await updateTeachBackSessionStage(teachBackSessionId, 'reading_prompt');

    const nextPrompt = await getCurrentPromptState(teachBackSessionId, nextIndex);
    if (nextPrompt) {
      await markPromptActive(nextPrompt.id);
    }

    const state = await loadTeachBackState(teachBackSessionId);
    if (!state) {
      return res.status(500).json(apiErrorFromCategory('internal_error', 'Failed to load state', meta));
    }

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to advance prompt', meta));
  }
});

router.post('/:teachBackSessionId/hint', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const parsed = TeachBackModeHintRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId || session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    // Check if student has attempted explanation
    if (session.attemptCount === 0) {
      return res.status(400).json(apiErrorFromCategory('validation_error', 'Must attempt explanation before requesting a hint', meta));
    }

    await updateTeachBackSessionCounts(teachBackSessionId, {
      hintCount: session.hintCount + 1,
    });

    // Update current prompt state hint level if applicable
    const promptState = await getCurrentPromptState(teachBackSessionId, session.currentPromptIndex);
    if (promptState) {
      const currentLevel = promptState.hintLevel || 'attention_hint';
      const nextLevels: Record<string, string> = {
        attention_hint: 'direction_hint',
        direction_hint: 'rephrased_question',
        rephrased_question: 'smaller_step',
        smaller_step: 'micro_example',
        micro_example: 'guided_completion',
      };
      const nextHint = nextLevels[currentLevel] || 'guided_completion';
      await updatePromptState(promptState.id, {
        hintLevel: nextHint,
        safeReasonCodesJson: [...(Array.isArray(promptState.safeReasonCodesJson) ? promptState.safeReasonCodesJson as string[] : []), 'hint_given'] as any,
      });
    }

    await writeTeachBackHintGiven(session.modeSessionId, session.schoolId, session.studentId);

    const state = await loadTeachBackState(teachBackSessionId);
    if (!state) {
      return res.status(500).json(apiErrorFromCategory('internal_error', 'Failed to load state', meta));
    }

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to request hint', meta));
  }
});

router.post('/:teachBackSessionId/reflect', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId || session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    await updateTeachBackSessionCounts(teachBackSessionId, {
      reflectionCount: session.reflectionCount + 1,
    });
    await updateTeachBackSessionStage(teachBackSessionId, 'reflection_check');
    await writeTeachBackReflectionDetected(session.modeSessionId, session.schoolId, session.studentId);

    const state = await loadTeachBackState(teachBackSessionId);
    if (!state) {
      return res.status(500).json(apiErrorFromCategory('internal_error', 'Failed to load state', meta));
    }

    return res.json(buildStudentTeachBackStateResponse(state));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to reflect', meta));
  }
});

router.post('/:teachBackSessionId/pause', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    await updateTeachBackSessionStatus(teachBackSessionId, 'paused');
    const state = await loadTeachBackState(teachBackSessionId);
    return res.json(state ? buildStudentTeachBackStateResponse(state) : buildEmptyActiveTeachBackResponse());
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to pause', meta));
  }
});

router.post('/:teachBackSessionId/resume', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    await updateTeachBackSessionStatus(teachBackSessionId, 'active');
    const state = await loadTeachBackState(teachBackSessionId);
    return res.json(state ? buildStudentTeachBackStateResponse(state) : buildEmptyActiveTeachBackResponse());
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to resume', meta));
  }
});

router.post('/:teachBackSessionId/submit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const parsed = TeachBackModeSubmitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId || session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    await updateTeachBackSessionStatus(teachBackSessionId, 'submitted');
    await updateTeachBackSessionStage(teachBackSessionId, 'submitted');

    await writeTeachBackSessionExited(session.modeSessionId, session.schoolId, session.studentId);

    const summary = await createTeachBackSummary({
      schoolId: session.schoolId,
      studentId: session.studentId,
      teachBackSessionId: session.id,
      modeSessionId: session.modeSessionId,
      finalStage: 'submitted',
      exitReason: parsed.data.reason || 'student_submitted',
      promptCount: session.promptCount,
      attemptCount: session.attemptCount,
      strongExplanationCount: session.strongExplanationCount,
      partialExplanationCount: session.partialExplanationCount,
      weakExplanationCount: session.weakExplanationCount,
      misconceptionCount: session.misconceptionCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      reflectionCount: session.reflectionCount,
    });

    return res.json(buildTeachBackSummaryResponse(serializeTeachBackSummary(summary)));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to submit', meta));
  }
});

router.post('/:teachBackSessionId/exit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const parsed = TeachBackModeExitRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(apiErrorFromCategory('validation_error', parsed.error.issues.map(i => i.message).join('; '), meta));
    }

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId || session.studentId !== studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Access denied', meta));
    }

    await updateTeachBackSessionStatus(teachBackSessionId, 'completed');
    await updateTeachBackSessionStage(teachBackSessionId, 'completed');
    await writeTeachBackSessionExited(session.modeSessionId, session.schoolId, session.studentId);

    const summary = await createTeachBackSummary({
      schoolId: session.schoolId,
      studentId: session.studentId,
      teachBackSessionId: session.id,
      modeSessionId: session.modeSessionId,
      finalStage: 'completed',
      exitReason: parsed.data.reason || 'student_exited',
      promptCount: session.promptCount,
      attemptCount: session.attemptCount,
      strongExplanationCount: session.strongExplanationCount,
      partialExplanationCount: session.partialExplanationCount,
      weakExplanationCount: session.weakExplanationCount,
      misconceptionCount: session.misconceptionCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      reflectionCount: session.reflectionCount,
    });

    return res.json(buildTeachBackSummaryResponse(serializeTeachBackSummary(summary)));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to exit', meta));
  }
});

router.get('/:teachBackSessionId/summary', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const summary = await getTeachBackSummaryForSession(teachBackSessionId);
    if (!summary) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'No summary available yet', meta));
    }

    return res.json(buildTeachBackSummaryResponse(serializeTeachBackSummary(summary)));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to get summary', meta));
  }
});

router.post('/:teachBackSessionId/cancel', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  try {
    const identity = (req as any).verifiedSchoolIdentity!;
    const meta = buildMeta(req);
    const { teachBackSessionId } = req.params;

    const session = await getTeachBackSessionById(teachBackSessionId);
    if (!session) {
      return res.status(404).json(apiErrorFromCategory('not_found', 'Teach-Back Mode session not found', meta));
    }

    const studentId = getStudentId(req);
    if (!studentId) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', 'Learner context not found', meta));
    }

    const access = checkTeachBackModeAccess({
      requesterSchoolId: identity.schoolId,
      requesterStudentId: studentId,
      requesterRole: (req as any).userRole || 'student',
      targetSchoolId: session.schoolId,
      targetStudentId: session.studentId,
    });
    if (!access.allowed) {
      return res.status(403).json(apiErrorFromCategory('forbidden_scope', access.reasonCodes.join(', '), meta));
    }

    await updateTeachBackSessionStatus(teachBackSessionId, 'cancelled');
    await updateTeachBackSessionStage(teachBackSessionId, 'cancelled');
    await writeTeachBackSessionExited(session.modeSessionId, session.schoolId, session.studentId);

    const summary = await createTeachBackSummary({
      schoolId: session.schoolId,
      studentId: session.studentId,
      teachBackSessionId: session.id,
      modeSessionId: session.modeSessionId,
      finalStage: 'cancelled',
      exitReason: 'student_cancelled',
      promptCount: session.promptCount,
      attemptCount: session.attemptCount,
      strongExplanationCount: session.strongExplanationCount,
      partialExplanationCount: session.partialExplanationCount,
      weakExplanationCount: session.weakExplanationCount,
      misconceptionCount: session.misconceptionCount,
      hintCount: session.hintCount,
      stuckCount: session.stuckCount,
      recoveryCount: session.recoveryCount,
      reflectionCount: session.reflectionCount,
    });

    return res.json(buildTeachBackSummaryResponse(serializeTeachBackSummary(summary)));
  } catch (err: any) {
    const meta = buildMeta(req);
    return res.status(500).json(apiErrorFromCategory('internal_error', err.message || 'Failed to cancel', meta));
  }
});

export default router;
