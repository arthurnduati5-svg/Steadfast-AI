// ─────────────────────────────────────────────────────────────
// Steadfast AI — Dedicated Tutor State Endpoint Routes v1
// Extends the existing tutor-state route with dedicated endpoints
// for resolve, read, summary, patch, reset, snapshot, validate,
// and history operations.
//
// Mounted at: /api/copilot/tutor-state/v2  OR
// Can be merged into existing tutorState.ts routes.
// This file adds routes that complement the existing GET/POST/PATCH.
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import type { AuthedRequest } from '../routes/ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

import { tutorStateEndpointService } from '../services/tutorStateEndpointService';
import {
  resolveTutorStateV2Schema,
  patchTutorStateV2Schema,
  resetTutorStateSchema,
  snapshotTutorStateSchema,
  validateTutorStateSchema,
  getTutorStateV2QuerySchema,
  getTutorStateSummaryQuerySchema,
  getTutorStateHistoryQuerySchema,
  validatePatchOperationValue,
  stripForbiddenFields,
} from '../services/tutorStateEndpointValidation';

const router = Router();

// ── Helper: resolve identity from authed request ──

function resolveIdentityOrNull(req: AuthedRequest): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: '',
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

function sendValidationError(res: Response, message: string, details?: unknown): void {
  res.status(400).json({
    error: { code: 'VALIDATION_ERROR', message, details },
  });
}

function sendForbidden(res: Response, message: string): void {
  res.status(403).json({
    error: { code: 'FORBIDDEN', message },
  });
}

// ── GET /api/copilot/tutor-state/v2 ──
// Get current dedicated tutor state (with resolved context).

router.get('/v2', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const query = getTutorStateV2QuerySchema.parse(req.query || {});
    const result = await tutorStateEndpointService.getDedicatedTutorState({
      identity,
      sessionId: query.sessionId || null,
      viewMode: query.viewMode,
    });

    res.json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendValidationError(res, 'Invalid query parameters.', err.errors);
      return;
    }
    console.error('[TutorState:v2 GET]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve tutor state.' },
    });
  }
});

// ── GET /api/copilot/tutor-state/v2/summary ──
// Get lightweight state summary.

router.get('/v2/summary', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const query = getTutorStateSummaryQuerySchema.parse(req.query || {});
    const result = await tutorStateEndpointService.getDedicatedTutorStateSummary({
      identity,
      sessionId: query.sessionId || null,
    });

    res.json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendValidationError(res, 'Invalid query parameters.', err.errors);
      return;
    }
    console.error('[TutorState:v2 SUMMARY]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve tutor state summary.' },
    });
  }
});

// ── GET /api/copilot/tutor-state/v2/history ──
// Get state history snapshots.

router.get('/v2/history', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const query = getTutorStateHistoryQuerySchema.parse(req.query || {});
    const result = await tutorStateEndpointService.getDedicatedTutorStateHistory({
      identity,
      sessionId: query.sessionId || null,
      limit: query.limit,
    });

    res.json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendValidationError(res, 'Invalid query parameters.', err.errors);
      return;
    }
    console.error('[TutorState:v2 HISTORY]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve state history.' },
    });
  }
});

// ── POST /api/copilot/tutor-state/v2/resolve ──
// Force re-resolution of full dedicated tutor state.

router.post('/v2/resolve', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    // Strip forbidden fields as defense-in-depth
    stripForbiddenFields(req.body || {});
    const body = resolveTutorStateV2Schema.parse(req.body || {});
    const result = await tutorStateEndpointService.resolveDedicatedTutorState({
      identity,
      sessionId: body.sessionId || null,
      includeDomains: body.includeDomains,
      viewMode: body.viewMode,
    });

    if (result.status === 'forbidden') {
      sendForbidden(res, 'View mode not allowed for this role.');
      return;
    }

    res.json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendValidationError(res, 'Invalid resolve request.', err.errors);
      return;
    }
    console.error('[TutorState:v2 RESOLVE]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to resolve tutor state.' },
    });
  }
});

// ── PATCH /api/copilot/tutor-state/v2/patch ──
// Apply structured patch operation.

router.patch('/v2/patch', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    stripForbiddenFields(req.body || {});
    const body = patchTutorStateV2Schema.parse(req.body || {});

    // Validate patch value
    const valueResult = validatePatchOperationValue(body.operation, body.value);
    if (!valueResult.ok) {
      sendValidationError(res, `Invalid value for operation "${body.operation}": ${valueResult.message}`);
      return;
    }

    const result = await tutorStateEndpointService.patchDedicatedTutorState({
      identity,
      sessionId: body.sessionId || null,
      operation: body.operation,
      value: body.value,
      reason: body.reason,
      expectedStateVersion: body.expectedStateVersion,
    });

    if (result.status === 'forbidden') {
      sendForbidden(res, 'Patch operation not allowed for this role.');
      return;
    }

    if (result.status === 'validation_failed') {
      res.status(409).json(result);
      return;
    }

    res.json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendValidationError(res, 'Invalid patch request.', err.errors);
      return;
    }
    console.error('[TutorState:v2 PATCH]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update tutor state.' },
    });
  }
});

// ── POST /api/copilot/tutor-state/v2/reset ──
// Reset tutor state by scope.

router.post('/v2/reset', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    stripForbiddenFields(req.body || {});
    const body = resetTutorStateSchema.parse(req.body || {});

    const result = await tutorStateEndpointService.resetDedicatedTutorState({
      identity,
      scope: body.scope,
      reason: body.reason,
    });

    if (result.status === 'forbidden') {
      sendForbidden(res, 'Reset not allowed for this role.');
      return;
    }

    res.json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendValidationError(res, 'Invalid reset request.', err.errors);
      return;
    }
    console.error('[TutorState:v2 RESET]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to reset tutor state.' },
    });
  }
});

// ── POST /api/copilot/tutor-state/v2/snapshot ──
// Create state snapshot.

router.post('/v2/snapshot', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    stripForbiddenFields(req.body || {});
    const body = snapshotTutorStateSchema.parse(req.body || {});

    const result = await tutorStateEndpointService.snapshotDedicatedTutorState({
      identity,
      sessionId: body.sessionId || null,
      reason: body.reason,
      includeSafePromptContext: body.includeSafePromptContext,
    });

    res.json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendValidationError(res, 'Invalid snapshot request.', err.errors);
      return;
    }
    console.error('[TutorState:v2 SNAPSHOT]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to create state snapshot.' },
    });
  }
});

// ── POST /api/copilot/tutor-state/v2/validate ──
// Validate a state object.

router.post('/v2/validate', schoolAuthMiddleware, async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentityOrNull(req);
    if (!identity) { sendUnauthenticated(res); return; }

    stripForbiddenFields(req.body || {});
    const body = validateTutorStateSchema.parse(req.body || {});

    const result = await tutorStateEndpointService.validateDedicatedTutorState({
      identity,
      state: body.state,
    });

    res.json(result);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendValidationError(res, 'Invalid validate request.', err.errors);
      return;
    }
    console.error('[TutorState:v2 VALIDATE]', err);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to validate tutor state.' },
    });
  }
});

export default router;
