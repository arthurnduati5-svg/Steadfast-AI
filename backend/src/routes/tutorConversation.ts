import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { TutorConversationApiRuntime } from '../services/task017TutorConversationApiRuntime';
import { TutorStreamingResponseRuntime } from '../services/task017TutorStreamingResponseRuntime';
import { getTutorRuntimeHealth, getTutorRuntimeReadiness } from '../services/task017TutorRuntimeHealthReadinessService';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';
import type { ConversationRuntimeErrorCode } from '../services/task017Contracts';
import { mapErrorToEnvelope } from '../services/task017ConversationRuntimeErrorMapper';

const router = Router();
const conversationRuntime = new TutorConversationApiRuntime();

function resolveIdentity(req: Request): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req as any).schoolId || (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || 'learner',
  };
}

function getCorrelationId(req: Request): string {
  return (req as any).correlationId || (req as any).requestId || `corr_${Date.now()}`;
}

function sendErrorResponse(res: Response, requestId: string, correlationId: string, code: ConversationRuntimeErrorCode): void {
  const envelope = mapErrorToEnvelope(requestId, correlationId, code);
  res.status(code === 'AUTH_REQUIRED' || code === 'LEARNER_CONTEXT_REQUIRED' || code === 'FORBIDDEN_SESSION_SCOPE' ? 401 :
           code === 'INVALID_REQUEST' ? 400 :
           code === 'SESSION_NOT_FOUND' ? 404 :
           code === 'RATE_LIMITED' ? 429 :
           code === 'IDEMPOTENCY_CONFLICT' ? 409 : 500)
    .json(envelope);
}

router.post('/conversation/turn', schoolAuthMiddleware, async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || `turn_${uuidv4()}`;
  const correlationId = getCorrelationId(req);

  const identity = resolveIdentity(req);
  if (!identity) {
    return sendErrorResponse(res, requestId, correlationId, 'AUTH_REQUIRED');
  }

  try {
    const result = await conversationRuntime.processTurn(req.body, identity, requestId, correlationId, '/api/tutor/conversation/turn');

    if ('errorCode' in result && result.status === 'error') {
      const statusCode = result.errorCode === 'INVALID_REQUEST' ? 400 :
                         result.errorCode === 'SESSION_NOT_FOUND' ? 404 :
                         result.errorCode === 'IDEMPOTENCY_CONFLICT' ? 409 :
                         result.errorCode === 'LEARNING_LOOP_FAILED' ? 502 : 500;
      return res.status(statusCode).json(result);
    }

    return res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const envelope = mapErrorToEnvelope(requestId, correlationId, 'UNKNOWN_SAFE_ERROR');
    return res.status(500).json(envelope);
  }
});

router.post('/conversation/stream', schoolAuthMiddleware, async (req: Request, res: Response) => {
  const requestId = (req as any).requestId || `stream_${uuidv4()}`;
  const correlationId = getCorrelationId(req);

  const identity = resolveIdentity(req);
  if (!identity) {
    res.status(401).json(mapErrorToEnvelope(requestId, correlationId, 'AUTH_REQUIRED'));
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  const streamRuntime = new TutorStreamingResponseRuntime(res, requestId, correlationId, req.body?.sessionId || '');

  try {
    const result = await conversationRuntime.processTurn(req.body, identity, requestId, correlationId, '/api/tutor/conversation/stream', streamRuntime);
  } catch (error: unknown) {
    streamRuntime.sendError('STREAM_ABORTED', 'The stream encountered an error.');
    streamRuntime.end();
  }
});

router.get('/conversation/health', (_req: Request, res: Response) => {
  const requestId = (_req as any).requestId || 'health_check';
  const health = getTutorRuntimeHealth(requestId);
  res.status(200).json(health);
});

router.get('/conversation/readiness', async (_req: Request, res: Response) => {
  const requestId = (_req as any).requestId || 'readiness_check';
  try {
    const readiness = await getTutorRuntimeReadiness(requestId);
    res.status(readiness.ok ? 200 : 503).json(readiness);
  } catch {
    res.status(503).json({
      ok: false,
      service: 'tutor-conversation-runtime',
      checks: {},
      degraded: ['readiness_check_failed'],
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
