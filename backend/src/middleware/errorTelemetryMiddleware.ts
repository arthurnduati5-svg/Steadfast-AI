import { Request, Response, NextFunction } from 'express';
import { buildBackendLogEvent, logBackendEvent } from '../services/backendStructuredLoggerService';
import { recordAuditEvent } from '../services/backendAuditEventService';

const ERROR_CATEGORY_MAP: Record<string, string> = {
  'VALIDATION_ERROR': 'validation_error',
  'UNAUTHENTICATED': 'authentication_required',
  'FORBIDDEN': 'forbidden_scope',
  'NOT_FOUND': 'not_found',
  'RATE_LIMITED': 'rate_limited',
  'CONFLICT': 'conflict',
};

export function errorTelemetryMiddleware(err: any, req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = Number(err?.statusCode || err?.status || 500);
  const errorCode = err?.code || 'INTERNAL_ERROR';
  const errorCategory = ERROR_CATEGORY_MAP[errorCode] || 'internal_error';

  const logEvent = buildBackendLogEvent({
    level: statusCode >= 500 ? 'error' : 'warn',
    eventType: 'request_error',
    message: `${req.method} ${req.path} -> ${statusCode} [${errorCategory}]`,
    requestId: req.requestId,
    traceId: req.traceContext?.traceId,
    route: req.route?.path || req.path,
    method: req.method,
    statusCode,
    errorCode,
    errorCategory,
  });
  logBackendEvent(logEvent);

  if (statusCode >= 500) {
    recordAuditEvent({
      eventId: require('crypto').randomUUID(),
      eventType: 'request_failed',
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
      traceId: req.traceContext?.traceId,
      route: req.route?.path || req.path,
      method: req.method,
      outcome: 'failure',
      safeSummary: `Request failed: ${req.method} ${req.path} -> ${statusCode}`,
      minimumNecessary: true,
      rawPrivateDataIncluded: false,
    });
  }

  next(err);
}
