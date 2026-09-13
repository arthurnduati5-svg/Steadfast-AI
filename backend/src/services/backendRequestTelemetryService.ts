import type { BackendLogEvent, BackendActorType } from '../contracts/observabilityContracts';
import { buildBackendLogEvent, logBackendEvent } from './backendStructuredLoggerService';
import { hashTelemetryIdentifier } from './privacySafeRedactionService';

export type RequestTelemetryHandle = {
  requestId: string;
  traceId: string;
  startTime: number;
  route: string;
  method: string;
  actorType?: BackendActorType;
  actorId?: string;
  schoolId?: string;
};

export function startRequestTelemetry(input: {
  requestId: string;
  traceId: string;
  route: string;
  method: string;
  actorType?: string;
  actorId?: string;
  schoolId?: string;
}): RequestTelemetryHandle {
  return {
    requestId: input.requestId,
    traceId: input.traceId,
    startTime: Date.now(),
    route: input.route,
    method: input.method,
    actorType: input.actorType as BackendActorType | undefined,
    actorId: input.actorId,
    schoolId: input.schoolId,
  };
}

export function finishRequestTelemetry(input: {
  handle: RequestTelemetryHandle;
  statusCode: number;
  outcome: 'success' | 'failure' | 'blocked';
  errorCode?: string;
  errorCategory?: string;
}): BackendLogEvent {
  const durationMs = Date.now() - input.handle.startTime;
  const eventType = input.outcome === 'success' ? 'request_completed'
    : input.outcome === 'blocked' ? 'request_blocked'
    : 'request_failed';

  const logEvent = buildBackendLogEvent({
    level: input.statusCode >= 500 ? 'error' : input.statusCode >= 400 ? 'warn' : 'info',
    eventType,
    message: `${input.handle.method} ${input.handle.route} -> ${input.statusCode} (${durationMs}ms)`,
    requestId: input.handle.requestId,
    traceId: input.handle.traceId,
    route: input.handle.route,
    method: input.handle.method,
    statusCode: input.statusCode,
    durationMs,
    actorType: input.handle.actorType,
    actorId: input.handle.actorId,
    schoolId: input.handle.schoolId,
    errorCode: input.errorCode,
    errorCategory: input.errorCategory,
    safeMeta: {
      outcome: input.outcome,
    },
  });

  logBackendEvent(logEvent);
  return logEvent;
}
