import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';

export interface SyncJobRecord {
  syncBatchId: string;
  schoolId: string;
  status: 'completed' | 'partial' | 'failed';
  createdMappings: number;
  updatedMappings: number;
  inactivatedMappings: number;
  reactivatedMappings: number;
  conflictCount: number;
  quarantinedCount: number;
  startedAt: string;
  completedAt?: string;
  reasonCodes: string[];
  details: any[];
}

function toRecord(row: any): SyncJobRecord {
  return {
    syncBatchId: row.syncBatchId,
    schoolId: row.schoolId,
    status: row.status as any,
    createdMappings: row.createdMappings,
    updatedMappings: row.updatedMappings,
    inactivatedMappings: row.inactivatedMappings,
    reactivatedMappings: row.reactivatedMappings,
    conflictCount: row.conflictCount,
    quarantinedCount: row.quarantinedCount,
    startedAt: row.startedAt instanceof Date ? row.startedAt.toISOString() : row.startedAt,
    completedAt: row.completedAt ? (row.completedAt instanceof Date ? row.completedAt.toISOString() : row.completedAt) : undefined,
    reasonCodes: typeof row.reasonCodes === 'string' ? JSON.parse(row.reasonCodes) : (row.reasonCodes ?? []),
    details: [],
  };
}

export async function createSyncJob(data: SyncJobRecord): Promise<SyncJobRecord> {
  const row = await prisma.schoolRosterSyncJobRecord.create({
    data: {
      id: randomUUID(),
      schoolId: data.schoolId,
      syncBatchId: data.syncBatchId,
      idempotencyKey: null,
      status: data.status,
      startedAt: new Date(data.startedAt),
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
      createdMappings: data.createdMappings,
      updatedMappings: data.updatedMappings,
      inactivatedMappings: data.inactivatedMappings,
      reactivatedMappings: data.reactivatedMappings,
      conflictCount: data.conflictCount,
      quarantinedCount: data.quarantinedCount,
      reasonCodes: data.reasonCodes,
      privacyMetadata: {},
      updatedAt: new Date(),
    },
  });
  return toRecord(row);
}

export async function getSyncJobRepo(batchId: string): Promise<SyncJobRecord | undefined> {
  const row = await prisma.schoolRosterSyncJobRecord.findFirst({
    where: { syncBatchId: batchId },
  });
  return row ? toRecord(row) : undefined;
}

export async function getSyncJobsForSchoolRepo(schoolId: string): Promise<SyncJobRecord[]> {
  const rows = await prisma.schoolRosterSyncJobRecord.findMany({
    where: { schoolId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toRecord);
}

export async function getSyncJobCountRepo(): Promise<number> {
  return prisma.schoolRosterSyncJobRecord.count();
}

export async function deleteSyncJobRepo(batchId: string): Promise<void> {
  await prisma.schoolRosterSyncJobRecord.deleteMany({
    where: { syncBatchId: batchId },
  });
}

export async function clearAllSyncJobsRepo(): Promise<void> {
  await prisma.schoolRosterSyncJobRecord.deleteMany({});
}
