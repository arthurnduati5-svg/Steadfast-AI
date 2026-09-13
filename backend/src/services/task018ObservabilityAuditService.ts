// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 018 Observability Audit Service
// Records safe audit metadata when diagnostics are queried or
// critical runtime events occur. Uses existing DurableAuditEvent
// for persistence where available.
// ─────────────────────────────────────────────────────────────

import { randomUUID } from 'crypto';
import type {
  ObservabilityAuditRecord,
  ObservabilityAuditOperation,
  TelemetryComponent,
} from '../contracts/task018Contracts';

const MAX_AUDIT_RECORDS = 1000;

interface InternalAuditRecord {
  actorId: string;
  actorRole: string;
  schoolId?: string;
  operation: ObservabilityAuditOperation;
  component: TelemetryComponent;
  requestId: string;
  correlationId?: string;
  status: 'granted' | 'denied' | 'error';
  privacyDecision: string;
  redactionApplied: boolean;
  timestamp: number;
}

const auditRecords: InternalAuditRecord[] = [];

export function recordObservabilityAudit(input: {
  actorId: string;
  actorRole: string;
  schoolId?: string;
  operation: ObservabilityAuditOperation;
  component: TelemetryComponent;
  requestId: string;
  correlationId?: string;
  status: 'granted' | 'denied' | 'error';
  privacyDecision?: string;
  redactionApplied?: boolean;
}): ObservabilityAuditRecord {
  const record: InternalAuditRecord = {
    actorId: input.actorId,
    actorRole: input.actorRole,
    schoolId: input.schoolId,
    operation: input.operation,
    component: input.component,
    requestId: input.requestId,
    correlationId: input.correlationId,
    status: input.status,
    privacyDecision: input.privacyDecision || 'allowed',
    redactionApplied: input.redactionApplied ?? false,
    timestamp: Date.now(),
  };

  auditRecords.push(record);

  if (auditRecords.length > MAX_AUDIT_RECORDS) {
    auditRecords.splice(0, auditRecords.length - MAX_AUDIT_RECORDS);
  }

  return {
    auditId: randomUUID(),
    actorId: input.actorId,
    actorRole: input.actorRole,
    schoolId: input.schoolId,
    operation: input.operation,
    component: input.component,
    requestId: input.requestId,
    correlationId: input.correlationId,
    status: input.status,
    privacyDecision: record.privacyDecision,
    redactionApplied: record.redactionApplied,
    createdAt: new Date(record.timestamp).toISOString(),
  };
}

export async function recordObservabilityAuditDurable(
  input: Parameters<typeof recordObservabilityAudit>[0],
): Promise<void> {
  try {
    const { recordDurableAuditEvent } = await import('./durableAuditEventService');
    await recordDurableAuditEvent({
      category: 'backend_health',
      eventType: `observability.${input.operation}`,
      severity: input.status === 'denied' ? 'warning' : 'info',
      actorType: input.actorRole === 'admin' ? 'admin' : 'system',
      actorId: input.actorId,
      schoolId: input.schoolId,
      requestId: input.requestId,
      serviceName: 'observabilityAudit',
      operation: input.operation,
      safeSummary: `Observability ${input.operation}: ${input.status}`,
      safeMetadata: {
        component: input.component,
        operation: input.operation,
        status: input.status,
        privacyDecision: input.privacyDecision,
      },
    });
  } catch {
    // Non-critical — recordObservabilityAudit already stored in-memory
  }
}

export function getRecentAuditRecords(
  limit: number = 50,
): ObservabilityAuditRecord[] {
  return [...auditRecords]
    .reverse()
    .slice(0, limit)
    .map((r) => ({
      auditId: randomUUID(),
      actorId: r.actorId,
      actorRole: r.actorRole,
      schoolId: r.schoolId,
      operation: r.operation,
      component: r.component,
      requestId: r.requestId,
      correlationId: r.correlationId,
      status: r.status,
      privacyDecision: r.privacyDecision,
      redactionApplied: r.redactionApplied,
      createdAt: new Date(r.timestamp).toISOString(),
    }));
}

export function getAuditRecordCount(): number {
  return auditRecords.length;
}

export function resetAuditRecordsForTests(): void {
  auditRecords.length = 0;
}
