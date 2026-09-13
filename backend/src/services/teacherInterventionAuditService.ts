// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Audit Service v1
// Records scoped, redacted audit events for all teacher
// intervention lifecycle mutations and forbidden attempts.
// Uses Prisma for durable audit storage.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import type {
  TeacherInterventionAuditEvent,
  TeacherInterventionAuditEventType,
  TeacherInterventionAuditCreateInput,
  TeacherInterventionAuditListRequest,
  TeacherInterventionAuditListResponse,
} from './teacherInterventionAuditContracts';
import { AUDIT_SAFE_SUMMARIES } from './teacherInterventionAuditContracts';
import { redactAuditPayload, buildSafeAuditSummary } from './teacherInterventionAuditRedactionService';

// ── Private helper to generate ISO timestamps ──

function nowISO(): string {
  return new Date().toISOString();
}

// ── Public API ──

/**
 * Record a teacher intervention audit event.
 * Redacts sensitive payload before persistence.
 * Throws on critical audit failure — fail-close for mutations.
 */
export async function recordTeacherInterventionAuditEvent(
  input: TeacherInterventionAuditCreateInput,
): Promise<TeacherInterventionAuditEvent> {
  const safeSummary = AUDIT_SAFE_SUMMARIES[input.eventType]?.({ ...input.payload, outcome: (input.payload as any)?.outcomeStatus }) || input.safeSummary;
  const finalSummary = buildSafeAuditSummary(input.eventType, safeSummary);

  const redactionResult = redactAuditPayload(input.payload || {}, input.eventType);

  try {
    const record = await prisma.teacherInterventionAuditEvent.create({
      data: {
        interventionId: input.interventionId,
        actorId: input.actorId,
        actorRole: input.actorRole || 'teacher',
        schoolId: input.schoolId,
        classId: input.classId || null,
        studentId: input.studentId,
        eventType: input.eventType,
        safeSummary: finalSummary,
        redactedPayloadJson: redactionResult.redactedPayloadString,
        metadata: (input.metadata || {}) as any,
        requestId: input.requestId || null,
      },
    });

    return {
      id: record.id,
      interventionId: record.interventionId,
      actorId: record.actorId,
      actorRole: record.actorRole,
      schoolId: record.schoolId,
      classId: record.classId,
      studentId: record.studentId,
      eventType: record.eventType as TeacherInterventionAuditEventType,
      eventTime: record.eventTime.toISOString(),
      safeSummary: record.safeSummary,
      redactedPayload: JSON.parse(record.redactedPayloadJson),
      metadata: record.metadata as any,
      requestId: record.requestId,
      createdAt: record.createdAt.toISOString(),
    };
  } catch (err) {
    // Fail-close for mutations — audit write failure should fail the mutation
    throw new Error(`Audit write failed: ${err instanceof Error ? err.message : 'unknown error'}`);
  }
}

/**
 * Record a scope-denied or forbidden attempt as an audit event.
 * Safe — never reveals whether the intervention exists.
 */
export async function recordTeacherInterventionScopeDenied(
  input: {
    interventionId?: string;
    actorId: string;
    actorRole?: string;
    schoolId: string;
    studentId: string;
    eventType: TeacherInterventionAuditEventType;
    action?: string;
    requestId?: string | null;
  },
): Promise<TeacherInterventionAuditEvent> {
  return recordTeacherInterventionAuditEvent({
    interventionId: input.interventionId || 'unknown',
    actorId: input.actorId,
    actorRole: input.actorRole || 'unknown',
    schoolId: input.schoolId,
    studentId: input.studentId,
    eventType: input.eventType,
    safeSummary: AUDIT_SAFE_SUMMARIES[input.eventType]({
      actorId: input.actorId,
      action: input.action || 'unknown',
    }),
    payload: {
      action: input.action || 'unknown',
      timestamp: nowISO(),
    },
    requestId: input.requestId,
  });
}

/**
 * Record a mutation with before/after state (redacted).
 */
export async function recordTeacherInterventionMutation(
  input: TeacherInterventionAuditCreateInput & {
    beforeState?: Record<string, unknown>;
    afterState?: Record<string, unknown>;
  },
): Promise<TeacherInterventionAuditEvent> {
  const combinedPayload = {
    ...(input.payload || {}),
    beforeStateSnapshot: input.beforeState ? '[CAPTURED]' : undefined,
    afterStateSnapshot: input.afterState ? '[CAPTURED]' : undefined,
    hasBeforeState: !!input.beforeState,
    hasAfterState: !!input.afterState,
  };

  return recordTeacherInterventionAuditEvent({
    ...input,
    payload: combinedPayload,
  });
}

/**
 * List audit events for a scope.
 * Scoped by schoolId — never returns unscoped results.
 */
export async function listTeacherInterventionAuditTrail(
  request: TeacherInterventionAuditListRequest,
): Promise<TeacherInterventionAuditListResponse> {
  const where: Record<string, unknown> = {
    schoolId: request.schoolId,
  };

  if (request.studentId) where.studentId = request.studentId;
  if (request.interventionId) where.interventionId = request.interventionId;
  if (request.eventType) where.eventType = request.eventType;

  const limit = Math.min(request.limit || 50, 200);

  const [records, totalCount] = await Promise.all([
    prisma.teacherInterventionAuditEvent.findMany({
      where: where as any,
      orderBy: { eventTime: 'desc' },
      take: limit,
    }),
    prisma.teacherInterventionAuditEvent.count({
      where: where as any,
    }),
  ]);

  const events: TeacherInterventionAuditEvent[] = records.map((r) => ({
    id: r.id,
    interventionId: r.interventionId,
    actorId: r.actorId,
    actorRole: r.actorRole,
    schoolId: r.schoolId,
    classId: r.classId,
    studentId: r.studentId,
    eventType: r.eventType as TeacherInterventionAuditEventType,
    eventTime: r.eventTime.toISOString(),
    safeSummary: r.safeSummary,
    redactedPayload: JSON.parse(r.redactedPayloadJson),
    metadata: r.metadata as any,
    requestId: r.requestId,
    createdAt: r.createdAt.toISOString(),
  }));

  return {
    events,
    totalCount,
    hasMore: totalCount > limit,
  };
}
