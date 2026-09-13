import prisma from '../lib/prisma';

export interface SyncConflictRecord {
  id: string;
  schoolId: string;
  syncBatchId: string;
  conflictType: string;
  externalUserId?: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  tutorLearnerId?: string;
  status: string;
  safeSummary: string;
  reasonCodes: string[];
  createdAt: string;
}

function toRecord(row: any): SyncConflictRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    syncBatchId: row.syncBatchId,
    conflictType: row.conflictType,
    externalUserId: row.externalUserId ?? undefined,
    externalStudentId: row.externalStudentId ?? undefined,
    externalTeacherId: row.externalTeacherId ?? undefined,
    tutorLearnerId: row.tutorLearnerId ?? undefined,
    status: row.status,
    safeSummary: row.safeSummary,
    reasonCodes: typeof row.reasonCodes === 'string' ? JSON.parse(row.reasonCodes) : (row.reasonCodes ?? []),
    createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
  };
}

export async function createConflict(data: {
  schoolId: string;
  syncBatchId: string;
  conflictType: string;
  externalUserId?: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  tutorLearnerId?: string;
  safeSummary: string;
  reasonCodes: string[];
}): Promise<SyncConflictRecord> {
  const row = await prisma.schoolRosterSyncConflictRecord.create({
    data: {
      schoolId: data.schoolId,
      syncBatchId: data.syncBatchId,
      conflictType: data.conflictType,
      externalUserId: data.externalUserId ?? null,
      externalStudentId: data.externalStudentId ?? null,
      externalTeacherId: data.externalTeacherId ?? null,
      tutorLearnerId: data.tutorLearnerId ?? null,
      status: 'quarantined',
      safeSummary: data.safeSummary,
      reasonCodes: data.reasonCodes,
      privacyMetadata: {},
    },
  });
  return toRecord(row);
}

export async function getConflictsForSchoolRepo(schoolId: string): Promise<SyncConflictRecord[]> {
  const rows = await prisma.schoolRosterSyncConflictRecord.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toRecord);
}

export async function getConflictCountForSchoolRepo(schoolId: string): Promise<number> {
  return prisma.schoolRosterSyncConflictRecord.count({
    where: { schoolId },
  });
}

export async function clearAllConflictsRepo(): Promise<void> {
  await prisma.schoolRosterSyncConflictRecord.deleteMany({});
}
