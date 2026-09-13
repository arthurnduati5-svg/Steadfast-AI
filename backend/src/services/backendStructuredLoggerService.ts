import { logger } from '../utils/logger';
import type { BackendLogEvent, BackendLogLevel, BackendActorType } from '../contracts/observabilityContracts';
import { redactLogPayload, hashTelemetryIdentifier } from './privacySafeRedactionService';

export function buildBackendLogEvent(input: {
  level: BackendLogLevel;
  eventType: string;
  message: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  route?: string;
  method?: string;
  statusCode?: number;
  durationMs?: number;
  actorType?: BackendActorType;
  actorId?: string;
  schoolId?: string;
  errorCode?: string;
  errorCategory?: string;
  safeMeta?: Record<string, unknown>;
}): BackendLogEvent {
  const event: BackendLogEvent = {
    level: input.level,
    eventType: input.eventType,
    message: input.message,
    timestamp: new Date().toISOString(),
    requestId: input.requestId,
    traceId: input.traceId,
    spanId: input.spanId,
    route: input.route,
    method: input.method,
    statusCode: input.statusCode,
    durationMs: input.durationMs,
    actorType: input.actorType,
    actorIdHash: hashTelemetryIdentifier(input.actorId),
    schoolIdHash: hashTelemetryIdentifier(input.schoolId),
    errorCode: input.errorCode,
    errorCategory: input.errorCategory,
    safeMeta: input.safeMeta,
  };
  const safeEvent = redactLogPayload(event as unknown as Record<string, unknown>);
  return safeEvent as unknown as BackendLogEvent;
}

export function logBackendEvent(event: BackendLogEvent): BackendLogEvent {
  try {
    const safeEvent = redactLogPayload(event as unknown as Record<string, unknown>);
    const safeLogEvent = safeEvent as unknown as BackendLogEvent;
    const pinoMethod = safeLogEvent.level === 'error' ? 'error' :
      safeLogEvent.level === 'warn' ? 'warn' :
      safeLogEvent.level === 'debug' ? 'debug' : 'info';
    logger[pinoMethod]({
      eventType: safeLogEvent.eventType,
      requestId: safeLogEvent.requestId,
      traceId: safeLogEvent.traceId,
      spanId: safeLogEvent.spanId,
      route: safeLogEvent.route,
      method: safeLogEvent.method,
      statusCode: safeLogEvent.statusCode,
      durationMs: safeLogEvent.durationMs,
      actorType: safeLogEvent.actorType,
      actorIdHash: safeLogEvent.actorIdHash,
      schoolIdHash: safeLogEvent.schoolIdHash,
      errorCode: safeLogEvent.errorCode,
      errorCategory: safeLogEvent.errorCategory,
      safeMeta: safeLogEvent.safeMeta,
    }, safeLogEvent.message);
    return safeLogEvent;
  } catch {
    try {
      logger.error({ eventType: 'logger_error' }, 'Failed to log backend event');
    } catch {
    }
    return event;
  }
}
