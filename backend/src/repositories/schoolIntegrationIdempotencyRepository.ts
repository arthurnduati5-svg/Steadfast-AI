import prisma from '../lib/prisma';

export interface IdempotencyRecord {
  idempotencyKey: string;
  schoolId: string;
  operation: string;
  requestHash: string;
  status: 'completed' | 'in_progress' | 'failed';
  safeResultSummary: string;
  createdAt: string;
  expiresAt: string;
  reasonCodes: string[];
}

function toRecord(row: any): IdempotencyRecord {
  return {
    idempotencyKey: row.idempotencyKey,
    schoolId: row.schoolId,
    operation: row.operation,
    requestHash: row.requestHash,
    status: row.status as any,
    safeResultSummary: row.safeResultSummary ?? '',
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
    expiresAt: row.expiresAt ? (row.expiresAt instanceof Date ? row.expiresAt.toISOString() : row.expiresAt) : new Date(0).toISOString(),
    reasonCodes: typeof row.reasonCodes === 'string' ? JSON.parse(row.reasonCodes) : (row.reasonCodes ?? []),
  };
}

export async function createIdempotencyRecord(data: {
  idempotencyKey: string;
  schoolId: string;
  operation: string;
  requestHash: string;
  status: string;
  safeResultSummary?: string;
  reasonCodes: string[];
  expiresAt?: string;
}): Promise<IdempotencyRecord> {
  const row = await prisma.schoolIntegrationIdempotencyRecord.create({
    data: {
      schoolId: data.schoolId,
      idempotencyKey: data.idempotencyKey,
      operation: data.operation,
      requestHash: data.requestHash,
      status: data.status,
      safeResultSummary: data.safeResultSummary ?? null,
      reasonCodes: data.reasonCodes,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    },
  });
  return toRecord(row);
}

export async function getIdempotencyRecordRepo(
  idempotencyKey: string,
): Promise<IdempotencyRecord | undefined> {
  const row = await prisma.schoolIntegrationIdempotencyRecord.findFirst({
    where: { idempotencyKey },
  });
  return row ? toRecord(row) : undefined;
}

export async function updateIdempotencyStatus(
  idempotencyKey: string,
  status: string,
  safeResultSummary: string,
  reasonCodes: string[],
): Promise<void> {
  await prisma.schoolIntegrationIdempotencyRecord.updateMany({
    where: { idempotencyKey },
    data: {
      status,
      safeResultSummary,
      reasonCodes,
    },
  });
}

export async function getActiveIdempotencyCountRepo(): Promise<number> {
  return prisma.schoolIntegrationIdempotencyRecord.count({
    where: {
      status: 'in_progress',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
  });
}

export async function deleteExpiredIdempotencyRecordsRepo(): Promise<void> {
  await prisma.schoolIntegrationIdempotencyRecord.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
}

export async function clearAllIdempotencyRecordsRepo(): Promise<void> {
  await prisma.schoolIntegrationIdempotencyRecord.deleteMany({});
}
