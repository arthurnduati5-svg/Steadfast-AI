// ─────────────────────────────────────────────────────────────
// Steadfast AI — Durable Learner Memory Routes v1
// Endpoints: GET, POST events, POST resolve, PATCH, DELETE
// Mounted at /api/copilot/learner-memory (schoolAuthMiddleware → requireVerifiedSchoolContext applied at index.ts)
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

import {
  createLearningEventRequestSchema,
  resolveLearnerMemoryRequestSchema,
  patchLearnerMemoryRequestSchema,
  deleteLearnerMemoryRequestSchema,
  getLearnerMemoryQuerySchema,
} from '../services/learnerMemoryValidation';
import { learnerMemoryService, LearnerMemoryNotFoundError } from '../services/learnerMemoryService';
import { learnerMemoryResolver } from '../services/learnerMemoryResolver';

const router = Router();

// ── Helper: resolve identity from VERIFIED school context ──
// schoolId and studentId MUST come from the verified server-side context
// (set by requireVerifiedSchoolContext), never from the request body/query.
function resolveIdentity(req: AuthedRequest): ResolvedTutorIdentity | null {
  const schoolId = (req as any).schoolId;
  const userId = req.user?.id;
  if (!schoolId || !userId) return null;
  return {
    studentId: userId,
    schoolId,
    userId,
    role: (req.user as any).role || undefined,
    grade: undefined,
    ageBand: undefined,
  };
}

// ── Error helpers ──
function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

// ── GET /api/copilot/learner-memory ──
// Return active durable memory for the authenticated learner.
// Auth chain: schoolAuthMiddleware → requireVerifiedSchoolContext (index mount). Handler consumes verified req.schoolId/req.user.
router.get('/', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const query = getLearnerMemoryQuerySchema.parse(req.query || {});
    const memory = await learnerMemoryService.listLearnerMemory(identity, {
      kind: query.kind as any,
      subject: query.subject,
      topic: query.topic,
      limit: query.limit,
      includeDeleted: query.includeDeleted,
    });

    const status = memory.length === 0 ? 'no_data_yet' : 'resolved';
    res.json({ ok: true, memory, status });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid query parameters.');
      return;
    }
    console.error('[LearnerMemory GET]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to retrieve learner memory.');
  }
});

// ── POST /api/copilot/learner-memory/events ──
// Record a learning event and optionally reduce it into durable memory.
router.post('/events', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const body = createLearningEventRequestSchema.parse(req.body || {});

    // Durably create the LearningEvent and reduce it into LearnerMemoryItem
    // rows within a single transaction (Prisma path) or the in-memory fallback
    // (no-DB path). Failures propagate — never report false success.
    const result = await learnerMemoryService.recordLearningEventAndMemory(identity, body);

    res.status(201).json({
      ok: true,
      event: result.event,
      memoryCreated: result.memoryCreated,
      memoryUpdated: result.memoryUpdated,
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid request.');
      return;
    }
    console.error('[LearnerMemory POST /events]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to create learning event.');
  }
});

// ── POST /api/copilot/learner-memory/resolve ──
// Resolve learner memory context for TutorTurnContext.
router.post('/resolve', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const body = resolveLearnerMemoryRequestSchema.parse(req.body || {});
    const learnerMemoryContext = await learnerMemoryResolver.resolveLearnerMemoryContext(identity, body);

    res.json({ ok: true, learnerMemoryContext });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid resolve request.');
      return;
    }
    console.error('[LearnerMemory POST /resolve]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to resolve learner memory.');
  }
});

// ── PATCH /api/copilot/learner-memory/:memoryId ──
// Update safe fields of a memory record.
router.patch('/:memoryId', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const { memoryId } = req.params;
    if (!memoryId || typeof memoryId !== 'string' || memoryId.length > 128) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid memory ID.');
      return;
    }

    const body = patchLearnerMemoryRequestSchema.parse(req.body || {});
    const memory = await learnerMemoryService.patchLearnerMemory(identity, memoryId, body);

    res.json({ ok: true, memory });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid patch request.');
      return;
    }
    if (err instanceof LearnerMemoryNotFoundError) {
      sendError(res, 404, 'NOT_FOUND', err.message);
      return;
    }
    console.error('[LearnerMemory PATCH]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to update learner memory.');
  }
});

// ── DELETE /api/copilot/learner-memory/:memoryId ──
// Soft-delete a memory item.
router.delete('/:memoryId', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.'); return; }

    const { memoryId } = req.params;
    if (!memoryId || typeof memoryId !== 'string' || memoryId.length > 128) {
      sendError(res, 400, 'VALIDATION_ERROR', 'Invalid memory ID.');
      return;
    }

    const body = deleteLearnerMemoryRequestSchema.parse(req.body || {});
    const memory = await learnerMemoryService.softDeleteLearnerMemory(identity, memoryId, body);

    res.json({ ok: true, memory });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid delete request.');
      return;
    }
    if (err instanceof LearnerMemoryNotFoundError) {
      sendError(res, 404, 'NOT_FOUND', err.message);
      return;
    }
    console.error('[LearnerMemory DELETE]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to delete learner memory.');
  }
});

export default router;
