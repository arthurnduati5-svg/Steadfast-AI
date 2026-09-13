// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Routes
// Endpoints: GET, POST (resolve), PATCH /api/copilot/tutor-state
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import type { AuthedRequest } from '../routes/ai/ai-middleware';

import {
  resolveTutorStateRequestSchema,
  patchTutorStateRequestSchema,
  getTutorStateQuerySchema,
} from '../services/tutorStateValidation';
import {
  getTutorStateForLearner,
  patchTutorStateForLearner,
} from '../services/tutorStateService';
import { resolveTutorContext } from '../services/tutorContextResolver';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

const router = Router();

// All routes in this file mount under /api/copilot/tutor-state
// Auth is applied at the mount point via schoolAuthMiddleware in index.ts
// We re-apply it here for safety when this router is mounted directly.

/**
 * Helper: resolve identity from authed request.
 * Prevents body-spoofing of studentId/schoolId.
 * Returns null (with 401 handled upstream) if user is not attached.
 */
function resolveIdentityOrNull(req: AuthedRequest): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: '',  // Inferred from token or default; current auth does not provide schoolId in JWT
    userId: req.user.id,
    role: (req.user as any).role || undefined,
    grade: undefined,
    ageBand: undefined,
  };
}

/** Send a standardized 401 when identity is missing. */
function sendUnauthenticated(res: Response): void {
  res.status(401).json({
    error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' },
  });
}

// ── GET /api/copilot/tutor-state ──
// Returns current TutorState or default no_data_yet state.
router.get('/', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const query = getTutorStateQuerySchema.parse(req.query || {});
    const tutorState = await getTutorStateForLearner(identity);

    res.json({ ok: true, tutorState });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid query parameters.', details: err.errors },
      });
      return;
    }
    console.error('[TutorState GET]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve tutor state.' },
    });
  }
});

// ── POST /api/copilot/tutor-state/resolve ──
// Resolves the full TutorTurnContext.
router.post('/resolve', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const body = resolveTutorStateRequestSchema.parse(req.body || {});
    const context = await resolveTutorContext(identity, body);

    res.json({ ok: true, context });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid resolve request.', details: err.errors },
      });
      return;
    }
    console.error('[TutorState RESOLVE]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve tutor context.' },
    });
  }
});

// ── PATCH /api/copilot/tutor-state ──
// Updates allowed fields on the TutorState.
router.patch('/', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const body = patchTutorStateRequestSchema.parse(req.body || {});
    const tutorState = await patchTutorStateForLearner(identity, body);

    res.json({ ok: true, tutorState });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid patch request.', details: err.errors },
      });
      return;
    }
    console.error('[TutorState PATCH]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update tutor state.' },
    });
  }
});

export default router;
