import { randomUUID } from 'crypto';
import type { BackendAuditEventType, BackendAuditEvent, BackendAuditOutcome } from '../contracts/auditEventContracts';
import type { BackendActorType } from '../contracts/observabilityContracts';
import { hashTelemetryIdentifier } from './privacySafeRedactionService';
import { buildBackendLogEvent, logBackendEvent } from './backendStructuredLoggerService';

export function buildAuditEvent(input: {
  eventType: BackendAuditEventType;
  requestId?: string;
  traceId?: string;
  actorType?: BackendActorType;
  actorId?: string;
  schoolId?: string;
  targetType?: string;
  targetId?: string;
  route?: string;
  method?: string;
  outcome: BackendAuditOutcome;
  reason?: string;
  safeSummary: string;
  minimumNecessary?: boolean;
}): BackendAuditEvent {
  return {
    eventId: randomUUID(),
    eventType: input.eventType,
    timestamp: new Date().toISOString(),
    requestId: input.requestId,
    traceId: input.traceId,
    actorType: input.actorType,
    actorIdHash: hashTelemetryIdentifier(input.actorId),
    schoolIdHash: hashTelemetryIdentifier(input.schoolId),
    targetType: input.targetType,
    targetIdHash: hashTelemetryIdentifier(input.targetId),
    route: input.route,
    method: input.method,
    outcome: input.outcome,
    reason: input.reason,
    safeSummary: input.safeSummary,
    minimumNecessary: input.minimumNecessary ?? true,
    rawPrivateDataIncluded: false,
  };
}

export async function recordAuditEvent(event: BackendAuditEvent): Promise<{
  recorded: boolean;
  event: BackendAuditEvent;
  failureReason?: string;
}> {
  try {
    const logEvent = buildBackendLogEvent({
      level: event.eventType === 'safeguarding_escalation' || event.eventType === 'scope_denied' ? 'warn' : 'info',
      eventType: `audit.${event.eventType}`,
      message: event.safeSummary,
      requestId: event.requestId,
      traceId: event.traceId,
      route: event.route,
      method: event.method,
      actorType: event.actorType,
      actorId: event.actorIdHash,
      schoolId: event.schoolIdHash,
      safeMeta: {
        eventId: event.eventId,
        eventType: event.eventType,
        outcome: event.outcome,
        targetType: event.targetType,
        minimumNecessary: event.minimumNecessary,
      },
    });
    logBackendEvent(logEvent);
    return { recorded: true, event };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (event.eventType === 'safeguarding_escalation') {
      try {
        const fallbackLog = buildBackendLogEvent({
          level: 'error',
          eventType: 'audit.safeguarding_fallback',
          message: `Safeguarding audit record failed: ${message}`,
          requestId: event.requestId,
          safeMeta: { eventType: event.eventType, outcome: event.outcome },
        });
        logBackendEvent(fallbackLog);
      } catch {
      }
    }
    return { recorded: false, event, failureReason: message };
  }
}
