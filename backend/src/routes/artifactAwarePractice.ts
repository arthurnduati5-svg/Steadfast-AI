// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Routes v1
// Endpoints: generate, answer, review, next, schedule,
// complete, abandon, session, history
// Mounted at /api/copilot/artifacts/practice
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

import {
  generateArtifactAwarePracticeRequestSchema,
  answerArtifactAwarePracticeRequestSchema,
  reviewArtifactAwarePracticeRequestSchema,
  nextArtifactAwarePracticeRequestSchema,
  scheduleArtifactAwarePracticeRequestSchema,
  completeArtifactAwarePracticeRequestSchema,
  abandonArtifactAwarePracticeRequestSchema,
  getArtifactAwarePracticeSessionQuerySchema,
  getArtifactAwarePracticeHistoryQuerySchema,
} from '../services/artifactAwarePracticeValidation';

import { resolveArtifactPracticeSources } from '../services/artifactPracticeSourceResolver';
import { generateArtifactAwarePractice } from '../services/artifactAwarePracticeGenerator';
import { evaluateArtifactAwareAnswer } from '../services/artifactAwareAnswerEvaluator';
import { decideNextArtifactAwarePracticeAction } from '../services/artifactAwarePracticeDecisionService';
import { determineArtifactReviewSchedule } from '../services/artifactAwarePracticeScheduler';
import { updateArtifactAwareMisconceptions, rubricMissesToArtifactMisconceptions } from '../services/artifactAwareMisconceptionService';

import {
  getArtifactAwarePracticeState,
  createArtifactAwarePracticeSession,
  answerArtifactAwarePracticeItem,
  reviewArtifactAwarePracticeSession,
  completeArtifactAwarePracticeSession,
  abandonArtifactAwarePracticeSession,
  updateArtifactAwarePracticeSession,
} from '../services/artifactAwarePracticeStateService';

import {
  writeArtifactAwarePracticeEvent,
  writeArtifactAwarePracticeStatusChangeEvent,
} from '../services/artifactAwarePracticeEventService';

import { sanitizeArtifactPracticeForLearner } from '../services/artifactAwarePracticeSafetyService';
import { getTutorStateForLearner } from '../services/tutorStateService';

const router = Router();

// ── Helper ──

function resolveIdentity(req: AuthedRequest): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || undefined,
    grade: undefined,
    ageBand: undefined,
  };
}

function sendUnauthenticated(res: Response): void {
  res.status(401).json({
    error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
  });
}

function sendValidationError(res: Response, details: unknown): void {
  res.status(400).json({
    ok: false,
    error: { code: 'VALIDATION_ERROR', message: 'Invalid request.', details },
  });
}

function sendServerError(res: Response, err: unknown): void {
  console.error('[ArtifactAwarePractice] Error:', err);
  res.status(500).json({
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: 'Artifact-aware practice service error.' },
  });
}

/**
 * POST /api/copilot/artifacts/practice/generate
 * Generate artifact-aware practice items from active artifacts.
 */
router.post('/practice/generate', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = generateArtifactAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    // Resolve artifact IDs from request or tutor state
    const tutorState = await getTutorStateForLearner(identity);
    const artifactIds = parsed.data.artifactIds && parsed.data.artifactIds.length > 0
      ? parsed.data.artifactIds
      : tutorState.activeArtifactIds;

    // Resolve practice sources
    const resolvedSources = await resolveArtifactPracticeSources(
      identity,
      artifactIds,
      parsed.data.primaryArtifactId || null,
    );

    // Generate practice
    const response = await generateArtifactAwarePractice(identity, parsed.data, resolvedSources);

    // Persist the generated session
    if (response.activePracticeSession) {
      const persisted = await createArtifactAwarePracticeSession(identity, response.activePracticeSession);

      // Write event (non-blocking)
      writeArtifactAwarePracticeEvent(identity, 'artifact_practice_generated', response.activePracticeSession).catch(() => {});

      res.json(sanitizeArtifactPracticeForLearner(persisted));
      return;
    }

    res.json(sanitizeArtifactPracticeForLearner(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/artifacts/practice/answer
 * Submit learner answer to an artifact-aware practice item.
 */
router.post('/practice/answer', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = answerArtifactAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    // Load active session
    const currentState = await getArtifactAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;
    if (!activeSession) {
      res.status(400).json({
        ok: false,
        error: { code: 'NO_ACTIVE_SESSION', message: 'No active practice session.' },
      });
      return;
    }

    const targetItem = activeSession.items.find((i) => i.practiceItemId === parsed.data.practiceItemId);
    if (!targetItem) {
      res.status(400).json({
        ok: false,
        error: { code: 'ITEM_NOT_FOUND', message: 'Practice item not found in active session.' },
      });
      return;
    }

    // Evaluate answer
    const evaluateResult = evaluateArtifactAwareAnswer(targetItem, parsed.data.learnerAnswerSummary);

    // Update misconceptions
    const newMisconceptions = rubricMissesToArtifactMisconceptions(
      evaluateResult.rubricMisses,
      activeSession.skillIds,
      activeSession.artifactIds,
    );
    const updatedMisconceptions = updateArtifactAwareMisconceptions(
      activeSession.misconceptionSummary,
      [...(evaluateResult.suspectedMisconceptions || []), ...newMisconceptions],
      evaluateResult.status === 'correct',
    );

    // Update session with evaluation results
    const answerResponse = await answerArtifactAwarePracticeItem(identity, parsed.data, {
      ...evaluateResult,
      suspectedMisconceptions: updatedMisconceptions,
    });

    // Make decision
    const repeatedWrongCount = activeSession.items.filter(
      (i) => i.status === 'incorrect' || i.status === 'needs_review',
    ).length;

    const decision = decideNextArtifactAwarePracticeAction(
      activeSession,
      { ...targetItem, status: evaluateResult.status, feedbackSummary: evaluateResult.feedbackSummary },
      repeatedWrongCount,
    );

    // Update decision in session
    if (answerResponse.activePracticeSession) {
      const updatedWithDecision = {
        ...answerResponse.activePracticeSession,
        misconceptionSummary: updatedMisconceptions,
        decision: {
          ...answerResponse.activePracticeSession.decision,
          currentDecision: decision.decision,
          reason: decision.reason,
          nextActionPrompt: decision.nextActionPrompt,
          recommendedReviewAt: decision.recommendedReviewAt,
          dueAt: decision.dueAt,
        },
      };

      // Apply schedule
      const schedule = determineArtifactReviewSchedule(updatedWithDecision, {
        ...targetItem,
        status: evaluateResult.status,
        feedbackSummary: evaluateResult.feedbackSummary,
      });
      if (schedule.dueAt) {
        updatedWithDecision.decision.recommendedReviewAt = schedule.recommendedReviewAt;
        updatedWithDecision.decision.dueAt = schedule.dueAt;
      }

      // Persist decision updates
      const persistedResponse = await updateArtifactAwarePracticeSession(identity, updatedWithDecision);

      // Write event (non-blocking)
      writeArtifactAwarePracticeStatusChangeEvent(identity, updatedWithDecision).catch(() => {});

      res.json(sanitizeArtifactPracticeForLearner({
        ...persistedResponse,
        decision: {
          currentDecision: decision.decision,
          reason: decision.reason,
          nextActionPrompt: decision.nextActionPrompt,
        },
      } as any));
      return;
    }

    res.json(sanitizeArtifactPracticeForLearner(answerResponse));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/artifacts/practice/review
 */
router.post('/practice/review', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = reviewArtifactAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await reviewArtifactAwarePracticeSession(identity, parsed.data);

    if (response.activePracticeSession) {
      writeArtifactAwarePracticeEvent(identity, 'artifact_practice_reviewed', response.activePracticeSession).catch(() => {});
    }

    res.json(sanitizeArtifactPracticeForLearner(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/artifacts/practice/next
 */
router.post('/practice/next', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = nextArtifactAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const currentState = await getArtifactAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;

    if (!activeSession) {
      res.json({
        ok: true,
        decision: {
          currentDecision: 'ask_clarification',
          reason: 'No active practice session.',
          nextActionPrompt: 'Would you like to generate practice from a learning material?',
        },
        warnings: ['No active practice session.'],
      });
      return;
    }

    const lastAnswered = [...activeSession.items]
      .reverse()
      .find((i) => i.status !== 'not_answered');

    const repeatedWrongCount = activeSession.items.filter(
      (i) => i.status === 'incorrect' || i.status === 'needs_review',
    ).length;

    const decision = decideNextArtifactAwarePracticeAction(
      activeSession,
      lastAnswered,
      repeatedWrongCount,
    );

    res.json({
      ok: true,
      decision: {
        currentDecision: decision.decision,
        reason: decision.reason,
        nextActionPrompt: decision.nextActionPrompt,
        recommendedReviewAt: decision.recommendedReviewAt,
        dueAt: decision.dueAt,
      },
      warnings: decision.warnings,
    });
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/artifacts/practice/schedule
 */
router.post('/practice/schedule', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = scheduleArtifactAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const currentState = await getArtifactAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;

    if (!activeSession) {
      res.status(400).json({
        ok: false,
        error: { code: 'NO_ACTIVE_SESSION', message: 'No active practice session.' },
      });
      return;
    }

    const schedule = determineArtifactReviewSchedule(activeSession, activeSession.items[activeSession.items.length - 1]);

    const updatedSession = {
      ...activeSession,
      status: 'scheduled_review' as const,
      decision: {
        ...activeSession.decision,
        recommendedReviewAt: schedule.recommendedReviewAt,
        dueAt: schedule.dueAt,
        currentDecision: 'schedule_spaced_review' as const,
        reason: schedule.reason,
      },
    };

    const persisted = await updateArtifactAwarePracticeSession(identity, updatedSession);
    writeArtifactAwarePracticeEvent(identity, 'artifact_practice_spaced_review_scheduled', updatedSession).catch(() => {});

    res.json(sanitizeArtifactPracticeForLearner(persisted));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/artifacts/practice/complete
 */
router.post('/practice/complete', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = completeArtifactAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await completeArtifactAwarePracticeSession(identity, parsed.data.artifactPracticeSessionId);

    if (response.recentPracticeSessions[0]) {
      writeArtifactAwarePracticeEvent(identity, 'artifact_practice_completed', response.recentPracticeSessions[0]).catch(() => {});
    }

    res.json(sanitizeArtifactPracticeForLearner(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/artifacts/practice/abandon
 */
router.post('/practice/abandon', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = abandonArtifactAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await abandonArtifactAwarePracticeSession(identity, parsed.data.artifactPracticeSessionId);

    if (response.recentPracticeSessions[0]) {
      writeArtifactAwarePracticeEvent(identity, 'artifact_practice_abandoned', response.recentPracticeSessions[0]).catch(() => {});
    }

    res.json(sanitizeArtifactPracticeForLearner(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * GET /api/copilot/artifacts/practice/session
 */
router.get('/practice/session', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = getArtifactAwarePracticeSessionQuerySchema.safeParse(req.query);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await getArtifactAwarePracticeState(identity);
    res.json(sanitizeArtifactPracticeForLearner(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * GET /api/copilot/artifacts/practice/history
 */
router.get('/practice/history', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = getArtifactAwarePracticeHistoryQuerySchema.safeParse(req.query);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const tutorState = await getTutorStateForLearner(identity);
    const practiceState = (tutorState as any).artifactAwarePractice;
    const sessions = practiceState?.recentPracticeSessions || [];
    const maxResults = parsed.data?.maxResults || 5;

    res.json(sanitizeArtifactPracticeForLearner({
      ok: true,
      recentPracticeSessions: sessions.slice(0, maxResults),
      warnings: [],
    } as any));
  } catch (err) { sendServerError(res, err); }
});

export default router;
