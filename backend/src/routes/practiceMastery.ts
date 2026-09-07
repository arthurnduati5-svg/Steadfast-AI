// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice and Mastery Scaffolding Routes v1
// Endpoints: POST/GET attempts, GET/PATCH mastery, resolve,
// next-practice, review-due.  Mounted at /api/copilot/practice-mastery.
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

import {
  createPracticeAttemptRequestSchema,
  listPracticeAttemptsQuerySchema,
  resolveMasteryRequestSchema,
  nextPracticeRequestSchema,
  patchMasteryRequestSchema,
  masteryQuerySchema,
  reviewDueQuerySchema,
} from '../services/practiceMasteryValidation';
import { practiceAttemptService } from '../services/practiceAttemptService';
import { masteryService, MasteryNotFoundError } from '../services/masteryService';
import { masteryResolver } from '../services/masteryResolver';
import { nextPracticeService } from '../services/nextPracticeService';
import { spacedReviewService, ReviewNotFoundError } from '../services/spacedReviewService';

const router = Router();

// ── Helper: resolve identity ──
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

// ── Error helpers ──
function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

// ── POST /api/copilot/practice-mastery/attempts ──
// Create a practice attempt and propagate to downstream systems.
router.post('/attempts', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const body = createPracticeAttemptRequestSchema.parse(req.body || {});

    const result = await practiceAttemptService.createPracticeAttempt(identity, body);

    res.status(201).json({
      ok: true,
      attempt: result.attempt,
      masteryUpdates: result.masteryUpdates,
      memoryUpdates: result.memoryUpdates,
      reviewItems: result.reviewItems,
      recommendations: result.recommendations,
      warnings: result.warnings.length > 0 ? result.warnings : undefined,
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid request.');
      return;
    }
    console.error('[PracticeMastery POST /attempts]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create practice attempt.');
  }
});

// ── GET /api/copilot/practice-mastery/attempts ──
// List practice attempts for the authenticated learner.
router.get('/attempts', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const query = listPracticeAttemptsQuerySchema.parse(req.query || {});
    const attempts = await practiceAttemptService.listPracticeAttempts(identity, query);

    res.json({ ok: true, attempts });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid query parameters.');
      return;
    }
    console.error('[PracticeMastery GET /attempts]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to list practice attempts.');
  }
});

// ── POST /api/copilot/practice-mastery/next ──
// Return next-practice recommendations.
router.post('/next', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const body = nextPracticeRequestSchema.parse(req.body || {});
    const recommendations = await nextPracticeService.recommendNextPractice(identity, body);

    res.json({ ok: true, recommendations });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request.');
      return;
    }
    console.error('[PracticeMastery POST /next]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to generate next-practice recommendations.');
  }
});

// ── GET /api/copilot/practice-mastery/mastery ──
// List learner mastery snapshots.
router.get('/mastery', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const query = masteryQuerySchema.parse(req.query || {});
    const masterySnapshots = await masteryService.listMasterySnapshots(identity, query);
    const status = masterySnapshots.length === 0 ? 'no_data_yet' : 'resolved';

    res.json({ ok: true, masterySnapshots, status });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid query parameters.');
      return;
    }
    console.error('[PracticeMastery GET /mastery]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to list mastery snapshots.');
  }
});

// ── POST /api/copilot/practice-mastery/mastery/resolve ──
// Resolve MasteryPracticeContext for tutor context.
router.post('/mastery/resolve', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const body = resolveMasteryRequestSchema.parse(req.body || {});
    const context = await masteryResolver.resolveMasteryPracticeContext(identity, body);

    res.json({ ok: true, context });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid request.');
      return;
    }
    console.error('[PracticeMastery POST /mastery/resolve]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to resolve mastery context.');
  }
});

// ── PATCH /api/copilot/practice-mastery/mastery/:masteryId ──
// Patch safe mastery fields.
router.patch('/mastery/:masteryId', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const { masteryId } = req.params;
    if (!masteryId || typeof masteryId !== 'string' || masteryId.length > 128) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid mastery ID.');
      return;
    }

    const body = patchMasteryRequestSchema.parse(req.body || {});
    const masterySnapshot = await masteryService.patchMasterySnapshot(identity, masteryId, body);

    res.json({ ok: true, masterySnapshot });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid patch request.');
      return;
    }
    if (err instanceof MasteryNotFoundError) {
      sendError(res, 404, 'NOT_FOUND', err.message);
      return;
    }
    console.error('[PracticeMastery PATCH /mastery/:id]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update mastery snapshot.');
  }
});

// ── GET /api/copilot/practice-mastery/review-due ──
// Return due spaced reviews.
router.get('/review-due', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const query = reviewDueQuerySchema.parse(req.query || {});
    const reviewItems = await spacedReviewService.listDueReviews(identity, query);

    res.json({ ok: true, reviewItems });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid query parameters.');
      return;
    }
    console.error('[PracticeMastery GET /review-due]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to list due reviews.');
  }
});

export default router;
