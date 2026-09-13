// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Practice Routes v1
// Endpoints: generate, answer, review, next, schedule,
// complete, abandon, session, history
// Mounted at /api/copilot/videos/practice
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

import {
  generateVideoAwarePracticeRequestSchema,
  answerVideoAwarePracticeRequestSchema,
  reviewVideoAwarePracticeRequestSchema,
  nextVideoAwarePracticeRequestSchema,
  scheduleVideoAwarePracticeRequestSchema,
  completeVideoAwarePracticeRequestSchema,
  abandonVideoAwarePracticeRequestSchema,
  getVideoAwarePracticeSessionQuerySchema,
  getVideoAwarePracticeHistoryQuerySchema,
} from '../services/videoAwarePracticeValidation';

import { generateVideoAwarePractice } from '../services/videoAwarePracticeGenerator';
import { evaluateVideoAwareAnswer } from '../services/videoAwareAnswerEvaluator';
import { decideNextVideoAwarePracticeAction } from '../services/videoAwarePracticeDecisionService';
import { determineReviewSchedule } from '../services/videoAwarePracticeScheduler';
import { updateVideoAwareMisconceptions, rubricMissesToMisconceptions } from '../services/videoAwareMisconceptionService';

import {
  getVideoAwarePracticeState,
  createVideoAwarePracticeSession,
  answerVideoAwarePracticeItem,
  reviewVideoAwarePracticeSession,
  completeVideoAwarePracticeSession,
  abandonVideoAwarePracticeSession,
  updateVideoAwarePracticeSession,
} from '../services/videoAwarePracticeStateService';

import {
  writeVideoAwarePracticeEvent,
  writeVideoAwarePracticeStatusChangeEvent,
} from '../services/videoAwarePracticeEventService';

import { MAX_RECENT_PRACTICE_SESSIONS } from '../services/videoAwarePracticeContracts';
import { getVideoLearningSessionState } from '../services/videoLearningSessionStateService';

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
  console.error('[VideoAwarePractice] Error:', err);
  res.status(500).json({
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: 'Video-aware practice service error.' },
  });
}

/**
 * Strip answer-key fields from practice session before returning to learner.
 * Never expose expectedAnswerSummary to learners.
 */
function stripAnswerKeyFromSession(session: any): any {
  if (!session) return session;
  const safeItems = (session.items || []).map((item: any) => {
    const safe = { ...item };
    delete safe.expectedAnswerSummary;
    return safe;
  });
  return { ...session, items: safeItems };
}

function stripAnswerKeyFromResponse(response: any): any {
  if (!response) return response;
  return {
    ...response,
    activePracticeSession: response.activePracticeSession
      ? stripAnswerKeyFromSession(response.activePracticeSession)
      : response.activePracticeSession,
    recentPracticeSessions: (response.recentPracticeSessions || []).map(stripAnswerKeyFromSession),
  };
}

/**
 * POST /api/copilot/videos/practice/generate
 * Generate video-aware practice items from active video session.
 */
router.post('/videos/practice/generate', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = generateVideoAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await generateVideoAwarePractice(identity, parsed.data);

    // Persist the generated session
    if (response.activePracticeSession) {
      const persisted = await createVideoAwarePracticeSession(identity, response.activePracticeSession);

      // Write event (non-blocking)
      writeVideoAwarePracticeEvent(identity, 'video_practice_generated', response.activePracticeSession).catch(() => {});

      res.json(stripAnswerKeyFromResponse(persisted));
      return;
    }

    res.json(stripAnswerKeyFromResponse(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/practice/answer
 * Submit learner answer to a video-aware practice item.
 * Answer key (expectedAnswerSummary) is stripped from response.
 */
router.post('/videos/practice/answer', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = answerVideoAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    // Load active session to get the specific practice item
    const currentState = await getVideoAwarePracticeState(identity);
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
    const evaluateResult = evaluateVideoAwareAnswer(targetItem, parsed.data.learnerAnswerSummary);

    // Update misconceptions with new evidence
    const newMisconceptions = rubricMissesToMisconceptions(
      evaluateResult.rubricMisses,
      activeSession.skillIds,
    );
    const updatedMisconceptions = updateVideoAwareMisconceptions(
      activeSession.misconceptionSummary,
      [...(evaluateResult.suspectedMisconceptions || []), ...newMisconceptions],
      evaluateResult.status === 'correct',
    );

    // Update the session with evaluation results
    const answerResponse = await answerVideoAwarePracticeItem(identity, parsed.data, {
      ...evaluateResult,
      suspectedMisconceptions: updatedMisconceptions,
    });

    // Make decision
    const repeatedWrongCount = activeSession.items.filter(
      (i) => i.status === 'incorrect' || i.status === 'needs_review',
    ).length;

    const decision = decideNextVideoAwarePracticeAction(
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

      // Apply schedule for correct/incorrect answers
      const schedule = determineReviewSchedule(updatedWithDecision, {
        ...targetItem,
        status: evaluateResult.status,
        feedbackSummary: evaluateResult.feedbackSummary,
      });
      if (schedule.dueAt) {
        updatedWithDecision.decision.recommendedReviewAt = schedule.recommendedReviewAt;
        updatedWithDecision.decision.dueAt = schedule.dueAt;
      }

      // Persist decision updates
      const persistedResponse = await updateVideoAwarePracticeSession(identity, updatedWithDecision);

      // Write event (non-blocking)
      writeVideoAwarePracticeStatusChangeEvent(identity, updatedWithDecision).catch(() => {});

      // Include decision in response
      res.json(stripAnswerKeyFromResponse({
        ...persistedResponse,
        decision: {
          currentDecision: decision.decision,
          reason: decision.reason,
          nextActionPrompt: decision.nextActionPrompt,
        },
      }));
      return;
    }

    res.json(stripAnswerKeyFromResponse(answerResponse));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/practice/review
 * Mark a practice session as reviewed.
 */
router.post('/videos/practice/review', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = reviewVideoAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await reviewVideoAwarePracticeSession(identity, parsed.data);

    if (response.activePracticeSession) {
      writeVideoAwarePracticeEvent(identity, 'video_practice_reviewed', response.activePracticeSession).catch(() => {});
    }

    res.json(stripAnswerKeyFromResponse(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/practice/next
 * Get the next action recommended for the current practice session.
 */
router.post('/videos/practice/next', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = nextVideoAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const currentState = await getVideoAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;

    if (!activeSession) {
      res.json({
        ok: true,
        decision: {
          currentDecision: 'ask_clarification',
          reason: 'No active practice session.',
          nextActionPrompt: 'Would you like to generate practice from a video?',
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

    const decision = decideNextVideoAwarePracticeAction(
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
 * POST /api/copilot/videos/practice/schedule
 * Schedule a review for a practice session.
 */
router.post('/videos/practice/schedule', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = scheduleVideoAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const currentState = await getVideoAwarePracticeState(identity);
    const activeSession = currentState.activePracticeSession;

    if (!activeSession) {
      res.status(400).json({
        ok: false,
        error: { code: 'NO_ACTIVE_SESSION', message: 'No active practice session.' },
      });
      return;
    }

    const schedule = determineReviewSchedule(activeSession, activeSession.items[activeSession.items.length - 1]);

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

    const persisted = await updateVideoAwarePracticeSession(identity, updatedSession);
    writeVideoAwarePracticeEvent(identity, 'video_practice_spaced_review_scheduled', updatedSession).catch(() => {});

    res.json(stripAnswerKeyFromResponse(persisted));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/practice/complete
 * Complete the active practice session.
 */
router.post('/videos/practice/complete', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = completeVideoAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await completeVideoAwarePracticeSession(identity, parsed.data.videoPracticeSessionId);

    if (response.recentPracticeSessions[0]) {
      writeVideoAwarePracticeEvent(identity, 'video_practice_completed', response.recentPracticeSessions[0]).catch(() => {});
    }

    res.json(stripAnswerKeyFromResponse(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/practice/abandon
 * Abandon the active practice session.
 */
router.post('/videos/practice/abandon', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = abandonVideoAwarePracticeRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await abandonVideoAwarePracticeSession(identity, parsed.data.videoPracticeSessionId);

    if (response.recentPracticeSessions[0]) {
      writeVideoAwarePracticeEvent(identity, 'video_practice_abandoned', response.recentPracticeSessions[0]).catch(() => {});
    }

    res.json(stripAnswerKeyFromResponse(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * GET /api/copilot/videos/practice/session
 * Get current video-aware practice session state.
 */
router.get('/videos/practice/session', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = getVideoAwarePracticeSessionQuerySchema.safeParse(req.query);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await getVideoAwarePracticeState(identity);
    res.json(stripAnswerKeyFromResponse(response));
  } catch (err) { sendServerError(res, err); }
});

/**
 * GET /api/copilot/videos/practice/history
 * Get recent video-aware practice sessions.
 */
router.get('/videos/practice/history', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = getVideoAwarePracticeHistoryQuerySchema.safeParse(req.query);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const videoState = await getVideoLearningSessionState(identity);
    const practiceState = (videoState as any).videoAwarePractice;
    const sessions = practiceState?.recentPracticeSessions || [];
    const maxResults = parsed.data?.maxResults || 5;

    res.json(stripAnswerKeyFromResponse({
      ok: true,
      recentPracticeSessions: sessions.slice(0, maxResults),
      warnings: [],
    }));
  } catch (err) { sendServerError(res, err); }
});

export default router;
