import type { Task024OperationsAuditEvent, Task024OperationEnvironment, Task024AuditEventType } from '../contracts/task024OperationsReadinessContracts';
import { task024ReadinessRepository } from './task024OperationsReadinessRepository';

export async function recordOperationsAuditEvent(params: {
  schoolId?: string;
  actorId: string;
  actorRole: string;
  operationEnvironment: Task024OperationEnvironment;
  component: string;
  eventType: Task024AuditEventType;
  safeReasonCodes: string[];
  safeMetadata?: Record<string, unknown>;
}): Promise<Task024OperationsAuditEvent> {
  const event: Task024OperationsAuditEvent = {
    eventId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    schoolId: params.schoolId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    operationEnvironment: params.operationEnvironment,
    component: params.component,
    eventType: params.eventType,
    safeReasonCodes: params.safeReasonCodes,
    safeMetadata: params.safeMetadata,
    createdAt: new Date().toISOString(),
  };
  await task024ReadinessRepository.recordOperationsAuditEvent(event);
  return event;
}

export async function listOperationsAuditEvents(): Promise<Task024OperationsAuditEvent[]> {
  const events = await task024ReadinessRepository.listOperationsAuditEvents();
  return events.map(e => ({
    ...e,
    safeMetadata: e.safeMetadata ? sanitizeMetadata(e.safeMetadata) : undefined,
  }));
}

function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    if (key.startsWith('raw') || key.startsWith('private') || key.startsWith('secret') ||
        key.toLowerCase().includes('password') || key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('key') || key.toLowerCase().includes('credential')) {
      safe[key] = '[REDACTED]';
    } else {
      safe[key] = value;
    }
  }
  return safe;
}
