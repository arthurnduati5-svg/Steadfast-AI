// ─────────────────────────────────────────────────────────────
// Steadfast AI — Intent Resolver Routes v1
// Endpoints: POST resolve, GET history
// Mounted at /api/copilot/intent
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

import {
  resolveTutorIntentRequestSchema,
  intentHistoryQuerySchema,
} from '../services/intentResolverValidation';
import { intentResolverService } from '../services/intentResolverService';
import { intentResolutionEventService } from '../services/intentResolutionEventService';

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

// ── POST /api/copilot/intent/resolve ──
// Resolve learner message into structured intent and tutor task.
router.post('/resolve', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.');
      return;
    }

    const body = resolveTutorIntentRequestSchema.parse(req.body || {});

    // Resolve intent
    const resolution = await intentResolverService.resolveTutorIntent({
      identity,
      request: body,
      tutorContext: null, // Standalone route — no automatic TutorContext resolve
      practiceMasteryContext: null,
    });

    // Optionally record audit event
    try {
      await intentResolutionEventService.recordResolutionEvent(identity, resolution, body.message.slice(0, 200));
    } catch {
      // Audit failure does not fail the resolve
    }

    res.json({ ok: true, intentResolution: resolution });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid request.');
      return;
    }
    console.error('[IntentResolver POST /resolve]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to resolve intent.');
  }
});

// ── GET /api/copilot/intent/history ──
// Return bounded recent intent resolution events.
router.get('/history', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.');
      return;
    }

    const query = intentHistoryQuerySchema.parse(req.query || {});

    const events = await intentResolutionEventService.listResolutionEvents(identity, {
      sessionId: query.sessionId,
      primaryIntent: query.primaryIntent,
      limit: query.limit,
    });

    const status = events.length === 0 ? 'no_data_yet' : 'resolved';
    res.json({ ok: true, events, status });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid query parameters.');
      return;
    }
    console.error('[IntentResolver GET /history]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve intent history.');
  }
});

export default router;
