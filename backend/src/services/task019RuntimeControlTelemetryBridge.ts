import { logger } from '../utils/logger';
import { recordLimitAuditEvent } from './task019RuntimeLimitAuditService';
import type { RuntimeControlTelemetryEvent, RuntimeControlAuditEvent } from '../contracts/task019RuntimeControlContracts';

const TELEMETRY_PREFIX = '[Task019Telemetry]';
const MAX_TELEMETRY_BUFFER = 500;

const telemetryBuffer: RuntimeControlTelemetryEvent[] = [];

export function emitRuntimeControlTelemetry(event: RuntimeControlTelemetryEvent): void {
  if (process.env.NODE_ENV === 'test') {
    telemetryBuffer.push(event);
    if (telemetryBuffer.length > MAX_TELEMETRY_BUFFER) {
      telemetryBuffer.shift();
    }
  }

  if (event.eventType.includes('blocked') || event.eventType.includes('detected') || event.eventType.includes('warning')) {
    logger.warn({
      telemetryEvent: {
        eventType: event.eventType,
        schoolId: event.schoolId,
        routeKey: event.routeKey,
        decision: event.decision,
        reasonCodes: event.reasonCodes,
      }
    }, `${TELEMETRY_PREFIX} ${event.eventType}`);
  } else {
    logger.info({
      telemetryEvent: {
        eventType: event.eventType,
        schoolId: event.schoolId,
        routeKey: event.routeKey,
        decision: event.decision,
        count: event.safeCounts,
      }
    }, `${TELEMETRY_PREFIX} ${event.eventType}`);
  }

  createAuditEventFromTelemetry(event);
}

function createAuditEventFromTelemetry(event: RuntimeControlTelemetryEvent): void {
  const auditEvent: RuntimeControlAuditEvent = {
    eventType: event.eventType as RuntimeControlAuditEvent['eventType'],
    schoolId: event.schoolId,
    studentId: event.studentId,
    role: event.role,
    routeKey: event.routeKey,
    decision: event.decision,
    reasonCodes: event.reasonCodes,
    retryAfterMs: event.retryAfterMs,
    timestamp: event.timestamp,
  };

  recordLimitAuditEvent({
    actorId: auditEvent.studentId || auditEvent.schoolId || 'system',
    actorRole: auditEvent.role || 'system',
    schoolId: auditEvent.schoolId,
    route: auditEvent.routeKey,
    operation: auditEvent.eventType,
    decision: auditEvent.decision as any,
    reasonCodes: auditEvent.reasonCodes,
    requestId: undefined,
    correlationId: undefined,
    createdAt: auditEvent.timestamp,
  });
}

export function createAllowedTelemetry(
  schoolId: string | undefined,
  studentId: string | undefined,
  role: string | undefined,
  routeKey: string,
  eventType: string,
  reasonCodes: string[]
): RuntimeControlTelemetryEvent {
  return {
    eventType,
    schoolId,
    studentId,
    role,
    routeKey,
    decision: 'allow',
    reasonCodes,
    retryAfterMs: 0,
    timestamp: new Date().toISOString(),
  };
}

export function createBlockedTelemetry(
  schoolId: string | undefined,
  studentId: string | undefined,
  role: string | undefined,
  routeKey: string,
  eventType: string,
  reasonCodes: string[],
  retryAfterMs: number
): RuntimeControlTelemetryEvent {
  return {
    eventType,
    schoolId,
    studentId,
    role,
    routeKey,
    decision: 'block',
    reasonCodes,
    retryAfterMs,
    timestamp: new Date().toISOString(),
  };
}

export function getTelemetryBuffer(): RuntimeControlTelemetryEvent[] {
  return [...telemetryBuffer];
}

export function clearTelemetryBuffer(): void {
  telemetryBuffer.length = 0;
}
