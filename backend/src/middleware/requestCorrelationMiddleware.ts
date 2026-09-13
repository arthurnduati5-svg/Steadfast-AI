import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { createTraceContext, toTraceparent } from '../services/backendTraceContextService';
import type { BackendTraceContext } from '../contracts/traceContextContracts';

const SAFE_REQUEST_ID_REGEX = /^[a-zA-Z0-9\-_]+$/;

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      traceContext?: BackendTraceContext;
    }
  }
}

export function requestCorrelationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingRequestId = req.headers['x-request-id'];
  const safeRequestId = typeof incomingRequestId === 'string' &&
    incomingRequestId.trim().length > 0 &&
    SAFE_REQUEST_ID_REGEX.test(incomingRequestId.trim())
    ? incomingRequestId.trim()
    : randomUUID();

  const traceparent = req.headers['traceparent'] as string | undefined;
  const tracestate = req.headers['tracestate'] as string | undefined;

  const traceContext = createTraceContext({
    incomingTraceparent: traceparent,
    incomingTracestate: tracestate,
    existingRequestId: safeRequestId,
  });

  req.requestId = traceContext.requestId;
  req.traceContext = traceContext;

  res.setHeader('x-request-id', traceContext.requestId);
  if (traceContext.traceId && traceContext.spanId) {
    res.setHeader('traceparent', toTraceparent(traceContext.traceId, traceContext.spanId));
  }

  next();
}
