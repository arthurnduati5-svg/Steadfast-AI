// ─────────────────────────────────────────────────────────────
// Steadfast AI — Durable Audit Event Service v1
// Canonical service for recording durable audit events.
// Orchestrates scope building, visibility selection, metadata
// sanitization, redaction, safety validation, repository write,
// and structured logger mirroring.
// ─────────────────────────────────────────────────────────────

import type { DurableAuditEventCategory, DurableAuditSeverity, DurableAuditVisibility, DurableAuditActor, DurableAuditWriteResult } from '../contracts/durableAuditEventContracts';
import { buildAuditActorScope } from './durableAuditScopePolicyService';
import { chooseAuditVisibility } from './durableAuditVisibilityPolicyService';
import { sanitizeDurableAuditMetadata, buildDurableAuditRedactionState } from './durableAuditRedactionService';
import { createDurableAuditEvent as writeToRepository } from './durableAuditRepository';
import { buildBackendLogEvent, logBackendEvent } from './backendStructuredLoggerService';

/**
 * Record a durable audit event.
 * All parameters are safe — never pass raw private data.
 */
export async function recordDurableAuditEvent(input: {
  category: DurableAuditEventCategory;
  eventType: string;
  severity: DurableAuditSeverity;
  actorType: DurableAuditActor['actorType'];
  actorId?: string | null;
  studentId?: string | null;
  schoolId?: string | null;
  classId?: string | null;
  requestId?: string;
  traceId?: string;
  route?: string;
  method?: string;
  serviceName?: string;
  operation?: string;
  safeSummary: string;
  safeMetadata?: Record<string, unknown>;
  visibility?: DurableAuditVisibility;
  occurredAt?: string;
}): Promise<DurableAuditWriteResult> {
  try {
    // 1. Build actor scope
    const actor = buildAuditActorScope({
      actorType: input.actorType,
      actorId: input.actorId,
      studentId: input.studentId,
      schoolId: input.schoolId,
      classId: input.classId,
    });

    // 2. Choose/default visibility
    const visibility = input.visibility || chooseAuditVisibility({
      category: input.category,
      eventType: input.eventType,
      safeguardingRelated: input.category === 'safeguarding',
      securityRelated: input.category === 'authentication' || input.category === 'authorization_scope' || input.category === 'no_false_pass',
    });

    // 3. Sanitize metadata
    const sanitizedMetadata = sanitizeDurableAuditMetadata(input.safeMetadata || {});

    // 4. Build redaction state
    const redaction = buildDurableAuditRedactionState();

    // 5. Build payload and validate
    const payload = {
      category: input.category,
      eventType: input.eventType,
      severity: input.severity,
      visibility,
      actor,
      requestId: input.requestId,
      traceId: input.traceId,
      route: input.route,
      method: input.method,
      serviceName: input.serviceName,
      operation: input.operation,
      safeSummary: input.safeSummary,
      safeMetadata: sanitizedMetadata,
      redaction,
      occurredAt: input.occurredAt || new Date().toISOString(),
    };

    // 6. Write through repository
    const result = await writeToRepository(payload);

    // 7. Mirror to structured logger
    try {
      const logEvent = buildBackendLogEvent({
        level: input.severity === 'critical' || input.severity === 'error' ? 'error'
          : input.severity === 'warning' ? 'warn'
          : 'info',
        eventType: `audit.${input.category}.${input.eventType}`,
        message: input.safeSummary,
        requestId: input.requestId,
        traceId: input.traceId,
        route: input.route,
        method: input.method,
        safeMeta: {
          eventId: result.eventId,
          category: input.category,
          visibility,
          degraded: result.degraded,
        },
      });
      logBackendEvent(logEvent);
    } catch {
      // Logger mirror failure is non-critical
    }

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      ok: false,
      degraded: true,
      failureReason: 'unknown',
      safeMessage: `Critical audit service error: ${message}`,
    };
  }
}
