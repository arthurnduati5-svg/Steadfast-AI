import prisma from '../lib/prisma';
import type { SchoolActorRole } from '../services/task021SchoolIntegrationContracts';

export interface IdentityMappingRecord {
  id: string;
  schoolId: string;
  externalUserId: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  role: SchoolActorRole;
  tutorLearnerId?: string;
  status: 'active' | 'inactive' | 'transferred' | 'archived' | 'quarantined';
  reasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}

function toRecord(row: any): IdentityMappingRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    externalUserId: row.externalUserId ?? row.externalStudentId,
    externalStudentId: row.externalStudentId ?? undefined,
    externalTeacherId: row.externalTeacherId ?? undefined,
    role: (row.role ?? 'student') as SchoolActorRole,
    tutorLearnerId: row.tutorLearnerId ?? undefined,
    status: row.status as any,
    reasonCodes: typeof row.reasonCodes === 'string' ? JSON.parse(row.reasonCodes) : (row.reasonCodes ?? []),
    createdAt: row.firstSeenAt instanceof Date ? row.firstSeenAt.toISOString() : row.createdAt ?? row.firstSeenAt,
    updatedAt: row.lastSeenAt instanceof Date ? row.lastSeenAt.toISOString() : row.updatedAt ?? row.lastSeenAt,
  };
}

export async function createMapping(data: {
  id: string;
  schoolId: string;
  externalUserId: string;
  externalStudentId?: string;
  externalTeacherId?: string;
  role: SchoolActorRole;
  tutorLearnerId?: string;
  status: string;
  reasonCodes: string[];
  createdAt: string;
  updatedAt: string;
}): Promise<IdentityMappingRecord> {
  const row = await prisma.tutorLearnerIdentityMap.create({
    data: {
      id: data.id,
      tutorLearnerId: data.tutorLearnerId ?? `tl_${data.id.slice(0, 24)}`,
      externalUserId: data.externalUserId,
      externalStudentId: data.externalStudentId ?? data.externalUserId,
      externalTeacherId: data.externalTeacherId ?? null,
      schoolId: data.schoolId,
      classId: null,
      grade: null,
      role: data.role,
      status: data.status,
      reasonCodes: data.reasonCodes,
      lastSeenAt: new Date(),
    },
  });
  return toRecord(row);
}

export async function resolveExternalIdentityRepo(
  schoolId: string,
  externalUserId: string,
): Promise<IdentityMappingRecord | undefined> {
  const row = await prisma.tutorLearnerIdentityMap.findFirst({
    where: {
      schoolId,
      OR: [
        { externalUserId },
        { externalStudentId: externalUserId },
      ],
    },
  });
  return row ? toRecord(row) : undefined;
}

export async function findMappingByTutorLearnerIdRepo(
  tutorLearnerId: string,
): Promise<IdentityMappingRecord | undefined> {
  const row = await prisma.tutorLearnerIdentityMap.findUnique({
    where: { tutorLearnerId },
  });
  return row ? toRecord(row) : undefined;
}

export async function findMappingByExternalStudentIdRepo(
  schoolId: string,
  externalStudentId: string,
): Promise<IdentityMappingRecord | undefined> {
  const row = await prisma.tutorLearnerIdentityMap.findFirst({
    where: { schoolId, externalStudentId },
  });
  return row ? toRecord(row) : undefined;
}

export async function updateMappingStatusRepo(
  schoolId: string,
  externalUserId: string,
  newStatus: string,
  reasonCodes?: string[],
): Promise<IdentityMappingRecord | undefined> {
  const row = await prisma.tutorLearnerIdentityMap.findFirst({
    where: {
      schoolId,
      OR: [
        { externalUserId },
        { externalStudentId: externalUserId },
      ],
    },
  });
  if (!row) return undefined;
  const updateData: any = { status: newStatus };
  if (reasonCodes && reasonCodes.length > 0) {
    const existing = typeof row.reasonCodes === 'string' ? JSON.parse(row.reasonCodes) : (row.reasonCodes ?? []);
    updateData.reasonCodes = [...existing, ...reasonCodes];
  }
  const updated = await prisma.tutorLearnerIdentityMap.update({
    where: { id: row.id },
    data: updateData,
  });
  return toRecord(updated);
}

export async function getActiveMappingsForSchoolRepo(schoolId: string): Promise<IdentityMappingRecord[]> {
  const rows = await prisma.tutorLearnerIdentityMap.findMany({
    where: { schoolId, status: 'active' },
  });
  return rows.map(toRecord);
}

export async function getMappingsForSchoolRepo(schoolId: string): Promise<IdentityMappingRecord[]> {
  const rows = await prisma.tutorLearnerIdentityMap.findMany({
    where: { schoolId },
  });
  return rows.map(toRecord);
}

export async function getMappingSummaryRepo(schoolId: string): Promise<{
  total: number;
  active: number;
  inactive: number;
  transferred: number;
  archived: number;
  quarantined: number;
}> {
  const rows = await prisma.tutorLearnerIdentityMap.findMany({
    where: { schoolId },
    select: { status: true },
  });
  return {
    total: rows.length,
    active: rows.filter(r => r.status === 'active').length,
    inactive: rows.filter(r => r.status === 'inactive').length,
    transferred: rows.filter(r => r.status === 'transferred').length,
    archived: rows.filter(r => r.status === 'archived').length,
    quarantined: rows.filter(r => r.status === 'quarantined').length,
  };
}

export async function getIdentityMappingCountRepo(): Promise<number> {
  return prisma.tutorLearnerIdentityMap.count();
}

export async function detectDuplicateExternalStudentIdRepo(
  schoolId: string,
  externalStudentId: string,
  excludeExternalUserId?: string,
): Promise<IdentityMappingRecord | undefined> {
  const row = await prisma.tutorLearnerIdentityMap.findFirst({
    where: {
      schoolId,
      externalStudentId,
      ...(excludeExternalUserId ? { externalUserId: { not: excludeExternalUserId } } : {}),
    },
  });
  return row ? toRecord(row) : undefined;
}

export async function getAllMappingsRepo(): Promise<IdentityMappingRecord[]> {
  const rows = await prisma.tutorLearnerIdentityMap.findMany();
  return rows.map(toRecord);
}
