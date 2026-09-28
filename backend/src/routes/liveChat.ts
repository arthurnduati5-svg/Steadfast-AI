// ─────────────────────────────────────────────────────────────
// Steadfast AI — Live Chat Route v4 (canonical delegation)
// This route owns transport only:
//   validate request → verified identity → streaming headers
//   → delegate ONE full execution to LiveChatPipelineAdapter.runFullPipeline()
//   → encode returned result as JSON/SSE.
// Learner-facing tutor generation is owned by the canonical
// tutorTurnOrchestrationEngine (invoked inside runFullPipeline).
// Mounted at /api/copilot/live-chat (requires verified school context
// via index.ts mount chain). Supports SSE when ?stream=true.
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';
import { integratedChatRequestSchema } from '../services/chatPipelineValidation';
import { liveChatPipelineAdapter } from '../services/liveChatPipelineAdapter';
import type { IntegratedChatResponse } from '../services/chatPipelineContracts';

const router = Router();

function resolveIdentity(req: AuthedRequest): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || undefined,
    grade: (req.user as any).grade || undefined,
    ageBand: (req.user as any).ageBand || undefined,
  };
}

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

function sendSseEvent(res: Response, eventType: string, data: unknown) {
  res.write(`data: ${JSON.stringify({ type: eventType, ...(typeof data === 'object' ? data : { content: data }) })}\n\n`);
}

function encodeResponse(res: Response, isStreaming: boolean, response: IntegratedChatResponse) {
  if (isStreaming) {
    sendSseEvent(res, 'token', { content: response.answer });
    sendSseEvent(res, 'done', {
      meta: response.meta,
      sources: response.sources,
      followUps: response.followUps,
      videoRecommendations: response.videoRecommendations,
      eventWritten: response.meta ? undefined : undefined,
    });
    res.end();
  } else {
    res.json(response);
  }
}

// ── POST /api/copilot/live-chat ──
// Transport-only route. No generation, policy, or context logic here.
router.post('/', async (req: AuthedRequest, res: Response) => {
  const isStreaming = req.query.stream === 'true';

  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.');
      return;
    }

    const body = integratedChatRequestSchema.parse(req.body || {});

    // ── Set streaming headers if applicable ──
    if (isStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();
      sendSseEvent(res, 'status', { phase: 'resolving_context', label: 'Understanding your request…' });
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
    }

    // ── Delegate ONE full execution to the pipeline adapter ──
    const pipelineResult = await liveChatPipelineAdapter.runFullPipeline({
      identity,
      request: body,
      mode: (body.mode || (req.path?.includes('voice') ? 'voice' : 'standard')) as 'standard' | 'streaming' | 'voice',
    });

    encodeResponse(res, isStreaming, pipelineResult.response);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      if (isStreaming) {
        sendSseEvent(res, 'error', { message: err.errors?.[0]?.message || 'Invalid request.' });
        res.end();
      } else {
        sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid request.');
      }
      return;
    }
    if (isStreaming) {
      sendSseEvent(res, 'error', { message: 'Failed to process chat request.' });
      res.end();
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to process chat request.');
    }
  }
});

export default router;
