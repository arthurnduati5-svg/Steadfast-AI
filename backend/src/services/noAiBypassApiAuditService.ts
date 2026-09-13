import { v4 as uuidv4 } from 'uuid';
import type { NoAiBypassAuditEvent, NoAiBypassPolicyDecision, NoAiBypassProviderBoundaryStatus, NoAiBypassReasonCode, NoAiBypassRouteCategory } from '../contracts/noAiBypassContracts';

const auditStore: NoAiBypassAuditEvent[] = [];

const MAX_AUDIT_EVENTS = 1000;

function recordAuditEvent(event: NoAiBypassAuditEvent): void {
  auditStore.push(event);
  if (auditStore.length > MAX_AUDIT_EVENTS) {
    auditStore.splice(0, auditStore.length - MAX_AUDIT_EVENTS);
  }
}

function listAuditEvents(limit: number = 100, offset: number = 0): NoAiBypassAuditEvent[] {
  return auditStore.slice(offset, offset + limit);
}

function buildAuditSummary(): {
  totalEvents: number;
  blockedCount: number;
  allowedCount: number;
  byCategory: Record<string, number>;
  byDecision: Record<string, number>;
} {
  const byCategory: Record<string, number> = {};
  const byDecision: Record<string, number> = {};
  let blockedCount = 0;
  let allowedCount = 0;

  for (const event of auditStore) {
    byCategory[event.category] = (byCategory[event.category] || 0) + 1;
    byDecision[event.policyDecision] = (byDecision[event.policyDecision] || 0) + 1;
    if (event.policyDecision === 'allowed_runtime_dispatch') {
      allowedCount++;
    } else {
      blockedCount++;
    }
  }

  return {
    totalEvents: auditStore.length,
    blockedCount,
    allowedCount,
    byCategory,
    byDecision,
  };
}

function clearAuditForTest(): void {
  auditStore.length = 0;
}

function assertAuditEventSafe(event: NoAiBypassAuditEvent): void {
  const forbiddenKeys = ['rawText', 'providerPrompt', 'providerResponse', 'hiddenReasoning'];
  for (const key of forbiddenKeys) {
    if (key in event) {
      throw new Error(`Audit event contains forbidden key: ${key}`);
    }
  }
}

export function recordNoAiBypassAuditEvent(params: {
  routeId: string;
  routePath: string;
  method: string;
  category: NoAiBypassRouteCategory;
  policyDecision: NoAiBypassPolicyDecision;
  providerBoundaryStatus: NoAiBypassProviderBoundaryStatus;
  safeReasonCodes: NoAiBypassReasonCode[];
  requestId: string;
  schoolId: string;
  actorId: string;
  actorRole: string;
}): NoAiBypassAuditEvent {
  const event: NoAiBypassAuditEvent = {
    eventId: uuidv4(),
    routeId: params.routeId,
    routePath: params.routePath,
    method: params.method,
    category: params.category,
    policyDecision: params.policyDecision,
    providerBoundaryStatus: params.providerBoundaryStatus,
    safeReasonCodes: params.safeReasonCodes,
    requestId: params.requestId,
    schoolId: params.schoolId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    createdAt: new Date().toISOString(),
  };
  recordAuditEvent(event);
  return event;
}

export { listAuditEvents as listNoAiBypassAuditEvents };
export { buildAuditSummary as buildNoAiBypassAuditSummary };
export { clearAuditForTest as clearNoAiBypassAuditForTest };
export { assertAuditEventSafe as assertNoAiBypassAuditEventSafe };
