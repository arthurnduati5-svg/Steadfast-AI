// ─────────────────────────────────────────────────────────────
// Steadfast AI — Durable Audit Repository v1
// Repository is the only direct writer to the DurableAuditEvent
// Prisma table. Validates payloads, enforces redaction, enforces
// scope, and returns safe views only. Degrades gracefully on
// DB failure.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import { randomUUID } from 'crypto';
import type {
  DurableAuditEventPayload,
  DurableAuditWriteResult,
  DurableAuditQueryFilter,
  DurableAuditSafeView,
  DurableAuditActor,
} from '../contracts/durableAuditEventContracts';
import { assertDurableAuditPayloadSafe, sanitizeDurableAuditMetadata, buildDurableAuditRedactionState } from './durableAuditRedactionService';
import { MAX_SAFE_SUMMARY_LENGTH, MAX_SAFE_METADATA_JSON_LENGTH, DEFAULT_AUDIT_PAGE_LIMIT, MAX_AUDIT_PAGE_LIMIT } from '../contracts/auditPersistenceContracts';
import { authorizeAuditQuery, buildAuditActorScope } from './durableAuditScopePolicyService';
import { chooseAuditVisibility } from './durableAuditVisibilityPolicyService';

/**
 * Create a durable audit event in the database.
 */
export async function createDurableAuditEvent(
  input: DurableAuditEventPayload,
): Promise<DurableAuditWriteResult> {
  try {
    // Validate payload safety
    const safetyCheck = assertDurableAuditPayloadSafe(input);
    if (!safetyCheck.safe) {
      return {
        ok: false,
        degraded: false,
        failureReason: 'validation_failed',
        safeMessage: `Audit payload validation failed: ${safetyCheck.violations.join('; ')}`,
      };
    }

    // Sanitize metadata
    const sanitizedMetadata = input.safeMetadata
      ? sanitizeDurableAuditMetadata(input.safeMetadata)
      : undefined;

    // Ensure redaction state is set
    const redaction = input.redaction || buildDurableAuditRedactionState();

    // Generate event ID if not provided
    const eventId = input.eventId || randomUUID();

    // Bound safeSummary
    const safeSummary = input.safeSummary
      ? input.safeSummary.slice(0, MAX_SAFE_SUMMARY_LENGTH)
      : '';

    // Create record
    const record = await prisma.durableAuditEvent.create({
      data: {
        id: eventId,
        category: input.category,
        eventType: input.eventType,
        severity: input.severity,
        visibility: input.visibility,
        actorType: input.actor.actorType,
        actorIdHash: input.actor.actorIdHash || null,
        studentIdHash: input.actor.studentIdHash || null,
        schoolIdHash: input.actor.schoolIdHash || null,
        classIdHash: input.actor.classIdHash || null,
        requestId: input.requestId || null,
        traceId: input.traceId || null,
        route: input.route || null,
        method: input.method || null,
        serviceName: input.serviceName || null,
        operation: input.operation || null,
        safeSummary,
        safeMetadataJson: (sanitizedMetadata || undefined) as any,
        redactionJson: redaction as any,
        occurredAt: new Date(input.occurredAt),
      },
    });

    return {
      ok: true,
      eventId: record.id,
      degraded: false,
      safeMessage: 'Audit event persisted successfully',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      ok: false,
      degraded: true,
      failureReason: 'db_unavailable',
      safeMessage: `Audit write degraded: ${message}`,
    };
  }
}

/**
 * Map a Prisma DurableAuditEvent record to a safe view.
 */
function toSafeView(record: any): DurableAuditSafeView {
  return {
    eventId: record.id,
    category: record.category,
    eventType: record.eventType,
    severity: record.severity,
    visibility: record.visibility,
    actorType: record.actorType,
    requestId: record.requestId || undefined,
    traceId: record.traceId || undefined,
    route: record.route || undefined,
    method: record.method || undefined,
    serviceName: record.serviceName || undefined,
    operation: record.operation || undefined,
    safeSummary: record.safeSummary,
    safeMetadata: record.safeMetadataJson as Record<string, unknown> | undefined,
    occurredAt: record.occurredAt instanceof Date ? record.occurredAt.toISOString() : String(record.occurredAt),
    persistedAt: record.persistedAt instanceof Date ? record.persistedAt.toISOString() : String(record.persistedAt),
    redacted: true,
  };
}

/**
 * List durable audit events with scope enforcement and cursor pagination.
 */
export async function listDurableAuditEvents(
  input: DurableAuditQueryFilter & {
    requesterActorType: DurableAuditActor['actorType'];
    requesterId?: string;
    requesterSchoolId?: string;
  },
): Promise<{
  items: DurableAuditSafeView[];
  nextCursor?: string;
}> {
  try {
    // Authorize query
    const auth = authorizeAuditQuery({
      requesterActorType: input.requesterActorType,
      requesterId: input.requesterId,
      requesterSchoolId: input.requesterSchoolId,
      filter: input,
    });

    if (!auth.allowed) {
      return { items: [] };
    }

    const filter = auth.sanitizedFilter!;
    const limit = Math.min(filter.limit || DEFAULT_AUDIT_PAGE_LIMIT, MAX_AUDIT_PAGE_LIMIT);

    // Build Prisma where clause
    const where: Record<string, unknown> = {};

    if (filter.category) where.category = filter.category;
    if (filter.visibility) where.visibility = filter.visibility;
    if (filter.actorType) where.actorType = filter.actorType;
    if (filter.studentId) where.studentIdHash = filter.studentId;
    if (filter.schoolId) where.schoolIdHash = filter.schoolId;
    if (filter.requestId) where.requestId = filter.requestId;
    if (filter.traceId) where.traceId = filter.traceId;
    if (filter.route) where.route = filter.route;
    if (filter.eventType) where.eventType = filter.eventType;

    // Date range filter
    if (filter.from || filter.to) {
      const occurredAt: Record<string, Date> = {};
      if (filter.from) occurredAt.gte = new Date(filter.from);
      if (filter.to) occurredAt.lte = new Date(filter.to);
      where.occurredAt = occurredAt;
    }

    // Cursor pagination
    const cursor = filter.cursor ? { id: filter.cursor, ...where } : undefined;

    const records = await prisma.durableAuditEvent.findMany({
      where: where as any,
      orderBy: { occurredAt: 'desc' },
      take: limit + 1, // +1 to check if there are more
      ...(cursor ? { cursor: { id: filter.cursor }, skip: 1 } : {}),
    });

    const hasMore = records.length > limit;
    const items = records.slice(0, limit).map(toSafeView);
    const nextCursor = hasMore ? items[items.length - 1]?.eventId : undefined;

    return { items, nextCursor };
  } catch (error) {
    return { items: [] };
  }
}

/**
 * Get a single durable audit event by ID with scope enforcement.
 */
export async function getDurableAuditEventById(
  input: {
    eventId: string;
    requesterActorType: DurableAuditActor['actorType'];
    requesterId?: string;
    requesterSchoolId?: string;
  },
): Promise<DurableAuditSafeView | null> {
  try {
    const record = await prisma.durableAuditEvent.findUnique({
      where: { id: input.eventId },
    });

    if (!record) return null;

    // Enforce scope on the result
    const safeView = toSafeView(record);

    const auth = authorizeAuditQuery({
      requesterActorType: input.requesterActorType,
      requesterId: input.requesterId,
      requesterSchoolId: input.requesterSchoolId,
      filter: {
        schoolId: record.schoolIdHash || undefined,
        studentId: record.studentIdHash || undefined,
        visibility: record.visibility as any,
      },
    });

    if (!auth.allowed) return null;

    return safeView;
  } catch (error) {
    return null;
  }
}

/**
 * Count durable audit events.
 */
export async function countDurableAuditEvents(
  input: DurableAuditQueryFilter,
): Promise<number> {
  try {
    const where: Record<string, unknown> = {};

    if (input.category) where.category = input.category;
    if (input.visibility) where.visibility = input.visibility;
    if (input.actorType) where.actorType = input.actorType;
    if (input.studentId) where.studentIdHash = input.studentId;
    if (input.schoolId) where.schoolIdHash = input.schoolId;
    if (input.requestId) where.requestId = input.requestId;
    if (input.traceId) where.traceId = input.traceId;
    if (input.route) where.route = input.route;
    if (input.eventType) where.eventType = input.eventType;

    if (input.from || input.to) {
      const occurredAt: Record<string, Date> = {};
      if (input.from) occurredAt.gte = new Date(input.from);
      if (input.to) occurredAt.lte = new Date(input.to);
      where.occurredAt = occurredAt;
    }

    return await prisma.durableAuditEvent.count({
      where: where as any,
    });
  } catch (error) {
    return 0;
  }
}
