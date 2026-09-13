import { Request, Response, NextFunction } from 'express';
import { startRequestTelemetry, finishRequestTelemetry } from '../services/backendRequestTelemetryService';
import { recordLatencySample } from '../services/backendOperationalMetricsService';

export function requestTelemetryMiddleware(req: Request, res: Response, next: NextFunction): void {
  const route = req.route?.path || req.path || req.originalUrl || '/unknown';
  const method = req.method || 'UNKNOWN';

  const handle = startRequestTelemetry({
    requestId: req.requestId || 'unknown',
    traceId: req.traceContext?.traceId || 'unknown',
    route,
    method,
  });

  const originalEnd = res.end.bind(res);
  res.end = function (this: Response, ...args: any[]) {
    const statusCode = res.statusCode;
    let outcome: 'success' | 'failure' | 'blocked' = 'success';
    if (statusCode >= 500) outcome = 'failure';
    else if (statusCode === 401 || statusCode === 403 || statusCode === 429) outcome = 'blocked';

    const durationMs = Date.now() - handle.startTime;

    finishRequestTelemetry({
      handle,
      statusCode,
      outcome,
    });

    recordLatencySample({
      name: `route.${method}`,
      durationMs,
      route,
      method,
      statusCode,
      requestId: handle.requestId,
      traceId: handle.traceId,
    });

    return originalEnd(...args);
  } as Response['end'];

  next();
}
