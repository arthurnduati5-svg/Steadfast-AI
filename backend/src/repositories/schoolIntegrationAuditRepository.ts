import prisma from '../lib/prisma';
import type { SchoolIntegrationAuditEventType, SchoolActorRole } from '../services/task021SchoolIntegrationContracts';

export interface AuditRecord {
  eventType: string;
  actorId?: string;
  actorRole: string;
  schoolId?: string;
  externalUserId?: string;
  tutorLearnerId?: string;
  route?: string;
  operation?: string;
  decision: string;
  reasonCodes: string[];
  requestId?: string;
  correlationId?: string;
  privacyMetadata: Record<string, unknown>;
  createdAt: string;
}

function toRecord(row: any): AuditRecord {
  const meta = typeof row.privacyMetadata === 'string' ? JSON.parse(row.privacyMetadata) : (row.privacyMetadata ?? {});
  return {
    eventType: row.eventType,
    actorId: row.actorId ?? undefined,
    actorRole: row.actorRole,
    schoolId: row.schoolId ?? undefined,
    externalUserId: row.externalUserId ?? undefined,
    tutorLearnerId: row.tutorLearnerId ?? undefined,
    route: row.route ?? undefined,
    operation: row.operation ?? undefined,
    decision: row.decision,
    reasonCodes: typeof row.reasonCodes === 'string' ? JSON.parse(row.reasonCodes) : (row.reasonCodes ?? []),
    requestId: row.requestId ?? undefined,
    correlationId: row.correlationId ?? undefined,
    privacyMetadata: meta,
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

export async function createAuditRecord(data: {
  eventType: string;
  actorId?: string;
  actorRole: string;
  schoolId?: string;
  externalUserId?: string;
  tutorLearnerId?: string;
  route?: string;
  operation?: string;
  decision: string;
  reasonCodes: string[];
  requestId?: string;
  correlationId?: string;
  privacyMetadata?: Record<string, unknown>;
}): Promise<AuditRecord> {
  const row = await prisma.schoolIntegrationAuditRecord.create({
    data: {
      schoolId: data.schoolId ?? null,
      actorId: data.actorId ?? null,
      actorRole: data.actorRole,
      externalUserId: data.externalUserId ?? null,
      tutorLearnerId: data.tutorLearnerId ?? null,
      eventType: data.eventType,
      operation: data.operation ?? null,
      decision: data.decision,
      reasonCodes: data.reasonCodes,
      privacyMetadata: (data.privacyMetadata ?? {}) as any,
      requestId: data.requestId ?? null,
      correlationId: data.correlationId ?? null,
    },
  });
  return toRecord(row);
}

export async function getAuditRecordsForSchoolRepo(schoolId: string): Promise<AuditRecord[]> {
  const rows = await prisma.schoolIntegrationAuditRecord.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toRecord);
}

export async function getAuditRecordsByTypeRepo(eventType: string): Promise<AuditRecord[]> {
  const rows = await prisma.schoolIntegrationAuditRecord.findMany({
    where: { eventType },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toRecord);
}

export async function getAuditSummaryRepo(): Promise<{
  totalEvents: number;
  eventTypeCounts: Record<string, number>;
  schoolCounts: Record<string, number>;
}> {
  const totalEvents = await prisma.schoolIntegrationAuditRecord.count();
  const rows = await prisma.schoolIntegrationAuditRecord.findMany({
    select: { eventType: true, schoolId: true },
  });
  const eventTypeCounts: Record<string, number> = {};
  const schoolCounts: Record<string, number> = {};
  for (const row of rows) {
    eventTypeCounts[row.eventType] = (eventTypeCounts[row.eventType] || 0) + 1;
    const school = row.schoolId || 'unknown';
    schoolCounts[school] = (schoolCounts[school] || 0) + 1;
  }
  return { totalEvents, eventTypeCounts, schoolCounts };
}

export async function queryAuditRecordsRepo(options: {
  schoolId?: string;
  eventType?: string;
  actorRole?: string;
  limit?: number;
}): Promise<AuditRecord[]> {
  const where: any = {};
  if (options.schoolId) where.schoolId = options.schoolId;
  if (options.eventType) where.eventType = options.eventType;
  if (options.actorRole) where.actorRole = options.actorRole;

  const rows = await prisma.schoolIntegrationAuditRecord.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: options.limit || 100,
  });
  return rows.map(toRecord);
}

export async function clearAuditRecordsRepo(): Promise<void> {
  await prisma.schoolIntegrationAuditRecord.deleteMany({});
}
