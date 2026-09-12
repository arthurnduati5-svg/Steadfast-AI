// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Learning Session Routes v1
// Endpoints: select, progress, checkpoint, checkpoint/answer,
// pause, complete, abandon, clear, active, history
// Mounted at /api/copilot/videos/session
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

import {
  selectVideoLearningSessionRequestSchema,
  updateVideoLearningProgressRequestSchema,
  createVideoLearningCheckpointRequestSchema,
  answerVideoLearningCheckpointRequestSchema,
  completeVideoLearningSessionRequestSchema,
  pauseVideoLearningSessionRequestSchema,
  abandonVideoLearningSessionRequestSchema,
  clearVideoLearningSessionRequestSchema,
  getActiveVideoLearningSessionQuerySchema,
  getVideoLearningSessionHistoryQuerySchema,
} from '../services/videoLearningSessionValidation';

import {
  selectVideoLearningSession,
  updateVideoLearningProgress,
  completeVideoLearningSession,
  abandonVideoLearningSession,
  clearActiveVideoLearningSession,
  pauseVideoLearningSession,
  getVideoLearningSessionState,
} from '../services/videoLearningSessionStateService';

import {
  createVideoLearningCheckpoint,
  answerVideoLearningCheckpoint,
} from '../services/videoLearningCheckpointService';

import { recommendVideoFollowUpPractice } from '../services/videoLearningFollowUpService';

import {
  writeVideoLearningSessionEvent,
  writeVideoCheckpointEvent,
  writeVideoFollowUpEvent,
} from '../services/videoLearningSessionEventService';

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
  console.error('[VideoLearningSession] Error:', err);
  res.status(500).json({
    ok: false,
    error: { code: 'INTERNAL_ERROR', message: 'Video learning session service error.' },
  });
}

/**
 * POST /api/copilot/videos/session/select
 * Select a recommended video as the active learning session.
 */
router.post('/videos/session/select', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = selectVideoLearningSessionRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await selectVideoLearningSession(identity, parsed.data);

    // Write event (non-blocking)
    if (response.activeVideoSession) {
      writeVideoLearningSessionEvent(identity, 'video_selected', response.activeVideoSession).catch(() => {});
    }

    res.json(response);
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/session/progress
 * Update watch progress for the active video session.
 */
router.post('/videos/session/progress', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = updateVideoLearningProgressRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await updateVideoLearningProgress(identity, parsed.data);

    res.json(response);
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/session/checkpoint
 * Create a comprehension checkpoint linked to the video session.
 */
router.post('/videos/session/checkpoint', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = createVideoLearningCheckpointRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await createVideoLearningCheckpoint(identity, parsed.data);

    // Write event (non-blocking)
    if (response.activeVideoSession) {
      writeVideoCheckpointEvent(identity, response.activeVideoSession, 'created').catch(() => {});
    }

    res.json(response);
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/session/checkpoint/answer
 * Submit learner answer to a checkpoint.
 */
router.post('/videos/session/checkpoint/answer', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = answerVideoLearningCheckpointRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await answerVideoLearningCheckpoint(identity, parsed.data);

    // Write event (non-blocking)
    if (response.activeVideoSession) {
      writeVideoCheckpointEvent(identity, response.activeVideoSession, 'answered').catch(() => {});
    }

    res.json(response);
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/session/pause
 * Pause the active video session.
 */
router.post('/videos/session/pause', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = pauseVideoLearningSessionRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await pauseVideoLearningSession(identity, parsed.data.sessionVideoId);
    res.json(response);
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/session/complete
 * Mark the video session as completed.
 */
router.post('/videos/session/complete', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = completeVideoLearningSessionRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await completeVideoLearningSession(identity, parsed.data);

    // Write event (non-blocking)
    if (response.activeVideoSession) {
      writeVideoLearningSessionEvent(identity, 'video_completed', response.activeVideoSession).catch(() => {});

      // Recommend follow-up practice (non-blocking)
      recommendVideoFollowUpPractice(identity, response.activeVideoSession.sessionVideoId).catch(() => {});
    }

    res.json(response);
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/session/abandon
 * Abandon the active video session.
 */
router.post('/videos/session/abandon', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = abandonVideoLearningSessionRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await abandonVideoLearningSession(identity, parsed.data.sessionVideoId);

    // Write event (non-blocking)
    if (response.activeVideoSession) {
      writeVideoLearningSessionEvent(identity, 'video_abandoned', response.activeVideoSession).catch(() => {});
    }

    res.json(response);
  } catch (err) { sendServerError(res, err); }
});

/**
 * POST /api/copilot/videos/session/clear
 * Clear the active video session (removes from active, keeps in history).
 */
router.post('/videos/session/clear', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = clearVideoLearningSessionRequestSchema.safeParse(req.body);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const response = await clearActiveVideoLearningSession(identity, parsed.data.sessionVideoId);

    // Write event (non-blocking)
    if (response.state?.recentVideoSessions?.[0]) {
      writeVideoLearningSessionEvent(identity, 'video_cleared', response.state.recentVideoSessions[0]).catch(() => {});
    }

    res.json(response);
  } catch (err) { sendServerError(res, err); }
});

/**
 * GET /api/copilot/videos/session/active
 * Get the active video session for the current learner.
 */
router.get('/videos/session/active', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = getActiveVideoLearningSessionQuerySchema.safeParse(req.query);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const videoState = await getVideoLearningSessionState(identity);

    res.json({
      ok: true,
      activeVideoSession: videoState.activeVideoSession || null,
      warnings: [],
    });
  } catch (err) { sendServerError(res, err); }
});

/**
 * GET /api/copilot/videos/session/history
 * Get recent video sessions for the current learner.
 */
router.get('/videos/session/history', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const parsed = getVideoLearningSessionHistoryQuerySchema.safeParse(req.query);
    if (!parsed.success) { sendValidationError(res, parsed.error.flatten().fieldErrors); return; }

    const videoState = await getVideoLearningSessionState(identity);
    const maxResults = parsed.data?.maxResults || 5;
    const recentSessions = (videoState.recentVideoSessions || []).slice(0, maxResults);
    const recommendedSessions = (videoState.recommendedVideoSessions || []).slice(0, maxResults);

    res.json({
      ok: true,
      recentSessions,
      recommendedSessions,
      warnings: [],
    });
  } catch (err) { sendServerError(res, err); }
});

export default router;
