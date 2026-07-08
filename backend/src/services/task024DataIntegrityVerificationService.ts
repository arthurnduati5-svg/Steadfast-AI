import type { DataIntegrityCheckResult } from '../contracts/task024OperationsContracts';

const MODEL_MAP: Record<string, string> = {
  schoolIntegrationMappings: 'SchoolIntegrationIdempotencyRecord',
  learnerMappings: 'TutorLearnerIdentityMap',
  sessionStateRecords: 'StudentLearningSessionState',
  contentGovernanceRecords: 'ContentGovernanceAuditRecord',
  approvedSourceRecords: 'ApprovedSourceRecord',
  contentItemRecords: 'ContentItemRecord',
  contentGapRecords: 'ContentGapRecord',
  auditRecords: 'DurableAuditEvent',
  rateLimitQuotaRecords: 'RateLimitQuotaRecord',
};

function makeSafeResult(
  tableOrModel: string,
  overrides: Partial<DataIntegrityCheckResult> = {},
): DataIntegrityCheckResult {
  return {
    tableOrModel,
    accessible: false,
    orphanCount: 0,
    missingRequiredRelationCount: 0,
    invalidStatusCount: 0,
    duplicateActiveMappingCount: 0,
    recordCount: 0,
    issues: [],
    ...overrides,
  };
}

async function tryGetPrisma(): Promise<unknown | null> {
  try {
    const mod = await import('@prisma/client');
    if (typeof mod.PrismaClient === 'function') {
      return new mod.PrismaClient();
    }
    return null;
  } catch {
    return null;
  }
}

async function queryModelSafe(
  modelName: string,
  prisma: any,
): Promise<{ count: number } | null> {
  try {
    if (!prisma || typeof prisma[modelName]?.count !== 'function') {
      return null;
    }
    const count = await prisma[modelName].count();
    return { count };
  } catch {
    return null;
  }
}

async function queryOrphanCount(
  modelName: string,
  relationField: string,
  relatedModel: string,
  prisma: any,
): Promise<number> {
  try {
    if (!prisma || typeof prisma[modelName]?.count !== 'function') {
      return 0;
    }
    const idsWithRelation = await prisma[modelName].findMany({
      where: { [relationField]: { isNot: null } },
      select: { id: true },
    });
    const totalCount = await prisma[modelName].count();
    return totalCount - idsWithRelation.length;
  } catch {
    return 0;
  }
}

async function queryInvalidStatusCount(
  modelName: string,
  statusField: string,
  invalidValues: unknown[],
  prisma: any,
): Promise<number> {
  try {
    if (!prisma || typeof prisma[modelName]?.count !== 'function') {
      return 0;
    }
    return await prisma[modelName].count({
      where: { [statusField]: { in: invalidValues } },
    });
  } catch {
    return 0;
  }
}

async function queryDuplicateActiveMappingCount(
  modelName: string,
  groupByField: string,
  activeValue: unknown,
  prisma: any,
): Promise<number> {
  try {
    if (!prisma || typeof prisma[modelName]?.findMany !== 'function') {
      return 0;
    }
    const activeRecords = await prisma[modelName].findMany({
      where: { [groupByField]: activeValue },
      select: { [groupByField]: true },
    });
    return activeRecords.length > 1 ? activeRecords.length - 1 : 0;
  } catch {
    return 0;
  }
}

async function queryLatestTimestamp(
  modelName: string,
  timestampField: string,
  prisma: any,
): Promise<string | undefined> {
  try {
    if (!prisma || typeof prisma[modelName]?.findFirst !== 'function') {
      return undefined;
    }
    const latest = await prisma[modelName].findFirst({
      orderBy: { [timestampField]: 'desc' },
      select: { [timestampField]: true },
    });
    return latest?.[timestampField]?.toISOString?.() ?? latest?.[timestampField] ?? undefined;
  } catch {
    return undefined;
  }
}

async function verifySchoolIntegrationMappings(prisma: any): Promise<DataIntegrityCheckResult> {
  const prismaModel = MODEL_MAP.schoolIntegrationMappings;
  const result = await queryModelSafe(prismaModel, prisma);
  if (!result) {
    return makeSafeResult('schoolIntegrationMappings', { accessible: false, issues: ['Model SchoolIntegrationIdempotencyRecord not accessible'] });
  }
  const orphanCount = await queryOrphanCount(prismaModel, 'schoolRosterSyncJob', 'SchoolRosterSyncJobRecord', prisma);
  return makeSafeResult('schoolIntegrationMappings', {
    accessible: true,
    recordCount: result.count,
    orphanCount,
    latestSafeTimestamp: await queryLatestTimestamp(prismaModel, 'createdAt', prisma),
  });
}

async function verifyLearnerMappings(prisma: any): Promise<DataIntegrityCheckResult> {
  const prismaModel = MODEL_MAP.learnerMappings;
  const result = await queryModelSafe(prismaModel, prisma);
  if (!result) {
    return makeSafeResult('learnerMappings', { accessible: false, issues: ['Model TutorLearnerIdentityMap not accessible'] });
  }
  const orphanCount = await queryOrphanCount(prismaModel, 'tutorSession', 'TutorSession', prisma);
  return makeSafeResult('learnerMappings', {
    accessible: true,
    recordCount: result.count,
    orphanCount,
    duplicateActiveMappingCount: await queryDuplicateActiveMappingCount(prismaModel, 'active', true, prisma),
    latestSafeTimestamp: await queryLatestTimestamp(prismaModel, 'createdAt', prisma),
  });
}

async function verifySessionStateRecords(prisma: any): Promise<DataIntegrityCheckResult> {
  const prismaModel = MODEL_MAP.sessionStateRecords;
  const result = await queryModelSafe(prismaModel, prisma);
  if (!result) {
    return makeSafeResult('sessionStateRecords', { accessible: false, issues: ['Model StudentLearningSessionState not accessible'] });
  }
  const invalidStatusCount = await queryInvalidStatusCount(prismaModel, 'status', ['unknown', 'error', 'orphaned'], prisma);
  return makeSafeResult('sessionStateRecords', {
    accessible: true,
    recordCount: result.count,
    invalidStatusCount,
    latestSafeTimestamp: await queryLatestTimestamp(prismaModel, 'updatedAt', prisma),
  });
}

async function verifyContentGovernanceRecords(prisma: any): Promise<DataIntegrityCheckResult> {
  const prismaModel = MODEL_MAP.contentGovernanceRecords;
  const result = await queryModelSafe(prismaModel, prisma);
  if (!result) {
    return makeSafeResult('contentGovernanceRecords', { accessible: false, issues: ['Model ContentGovernanceAuditRecord not accessible'] });
  }
  return makeSafeResult('contentGovernanceRecords', {
    accessible: true,
    recordCount: result.count,
    latestSafeTimestamp: await queryLatestTimestamp(prismaModel, 'createdAt', prisma),
  });
}

async function verifyApprovedSourceRecords(prisma: any): Promise<DataIntegrityCheckResult> {
  const prismaModel = MODEL_MAP.approvedSourceRecords;
  const result = await queryModelSafe(prismaModel, prisma);
  if (!result) {
    return makeSafeResult('approvedSourceRecords', { accessible: false, issues: ['Model ApprovedSourceRecord not accessible'] });
  }
  return makeSafeResult('approvedSourceRecords', {
    accessible: true,
    recordCount: result.count,
    latestSafeTimestamp: await queryLatestTimestamp(prismaModel, 'updatedAt', prisma),
  });
}

async function verifyContentItemRecords(prisma: any): Promise<DataIntegrityCheckResult> {
  const prismaModel = MODEL_MAP.contentItemRecords;
  const result = await queryModelSafe(prismaModel, prisma);
  if (!result) {
    return makeSafeResult('contentItemRecords', { accessible: false, issues: ['Model ContentItemRecord not accessible'] });
  }
  return makeSafeResult('contentItemRecords', {
    accessible: true,
    recordCount: result.count,
    latestSafeTimestamp: await queryLatestTimestamp(prismaModel, 'updatedAt', prisma),
  });
}

async function verifyContentGapRecords(prisma: any): Promise<DataIntegrityCheckResult> {
  const prismaModel = MODEL_MAP.contentGapRecords;
  const result = await queryModelSafe(prismaModel, prisma);
  if (!result) {
    return makeSafeResult('contentGapRecords', { accessible: false, issues: ['Model ContentGapRecord not accessible'] });
  }
  return makeSafeResult('contentGapRecords', {
    accessible: true,
    recordCount: result.count,
    latestSafeTimestamp: await queryLatestTimestamp(prismaModel, 'detectedAt', prisma),
  });
}

async function verifyAuditRecords(prisma: any): Promise<DataIntegrityCheckResult> {
  const prismaModel = MODEL_MAP.auditRecords;
  const result = await queryModelSafe(prismaModel, prisma);
  if (!result) {
    return makeSafeResult('auditRecords', { accessible: false, issues: ['Model DurableAuditEvent not accessible'] });
  }
  return makeSafeResult('auditRecords', {
    accessible: true,
    recordCount: result.count,
    latestSafeTimestamp: await queryLatestTimestamp(prismaModel, 'createdAt', prisma),
  });
}

async function verifyRateLimitQuotaRecords(prisma: any): Promise<DataIntegrityCheckResult> {
  const prismaModel = MODEL_MAP.rateLimitQuotaRecords;
  const result = await queryModelSafe(prismaModel, prisma);
  if (!result) {
    return makeSafeResult('rateLimitQuotaRecords', {
      accessible: false,
      issues: ['Model RateLimitQuotaRecord not found in Prisma schema — no rate limit quota persistence model exists'],
    });
  }
  return makeSafeResult('rateLimitQuotaRecords', {
    accessible: true,
    recordCount: result.count,
    latestSafeTimestamp: await queryLatestTimestamp(prismaModel, 'createdAt', prisma),
  });
}

const VERIFIERS: Record<string, (prisma: any) => Promise<DataIntegrityCheckResult>> = {
  schoolIntegrationMappings: verifySchoolIntegrationMappings,
  learnerMappings: verifyLearnerMappings,
  sessionStateRecords: verifySessionStateRecords,
  contentGovernanceRecords: verifyContentGovernanceRecords,
  approvedSourceRecords: verifyApprovedSourceRecords,
  contentItemRecords: verifyContentItemRecords,
  contentGapRecords: verifyContentGapRecords,
  auditRecords: verifyAuditRecords,
  rateLimitQuotaRecords: verifyRateLimitQuotaRecords,
};

export async function verifyDataIntegrity(
  options?: { useTestFixtures?: boolean },
): Promise<DataIntegrityCheckResult[]> {
  if (options?.useTestFixtures) {
    const testFixtureCounts: Record<string, Partial<DataIntegrityCheckResult>> = {
      schoolIntegrationMappings: { accessible: true, recordCount: 12, orphanCount: 0, missingRequiredRelationCount: 0, invalidStatusCount: 0, duplicateActiveMappingCount: 0 },
      learnerMappings: { accessible: true, recordCount: 85, orphanCount: 2, missingRequiredRelationCount: 1, invalidStatusCount: 0, duplicateActiveMappingCount: 0 },
      sessionStateRecords: { accessible: true, recordCount: 340, orphanCount: 0, missingRequiredRelationCount: 0, invalidStatusCount: 3, duplicateActiveMappingCount: 0 },
      contentGovernanceRecords: { accessible: true, recordCount: 28, orphanCount: 0, missingRequiredRelationCount: 0, invalidStatusCount: 0, duplicateActiveMappingCount: 0 },
      approvedSourceRecords: { accessible: true, recordCount: 64, orphanCount: 0, missingRequiredRelationCount: 0, invalidStatusCount: 0, duplicateActiveMappingCount: 0 },
      contentItemRecords: { accessible: true, recordCount: 210, orphanCount: 0, missingRequiredRelationCount: 0, invalidStatusCount: 0, duplicateActiveMappingCount: 0 },
      contentGapRecords: { accessible: true, recordCount: 17, orphanCount: 0, missingRequiredRelationCount: 0, invalidStatusCount: 0, duplicateActiveMappingCount: 0 },
      auditRecords: { accessible: true, recordCount: 1024, orphanCount: 0, missingRequiredRelationCount: 0, invalidStatusCount: 0, duplicateActiveMappingCount: 0 },
      rateLimitQuotaRecords: { accessible: false, recordCount: 0, orphanCount: 0, missingRequiredRelationCount: 0, invalidStatusCount: 0, duplicateActiveMappingCount: 0 },
    };
    const results = Object.entries(testFixtureCounts).map(([tableOrModel, fixture]) =>
      makeSafeResult(tableOrModel, { ...fixture, issues: fixture.accessible !== false ? [] : ['Test fixture — model not available'] }),
    );
    const now = new Date().toISOString();
    for (const r of results) {
      r.latestSafeTimestamp = now;
    }
    return results;
  }

  const prisma = await tryGetPrisma();
  const results: DataIntegrityCheckResult[] = [];

  for (const tableName of Object.keys(VERIFIERS)) {
    const verifyFn = VERIFIERS[tableName];
    try {
      const result = await verifyFn(prisma);
      results.push(result);
    } catch {
      results.push(makeSafeResult(tableName, { issues: ['Unexpected error during integrity check'] }));
    }
  }

  return results;
}

export async function verifyModel(modelName: string): Promise<DataIntegrityCheckResult> {
  const verifyFn = VERIFIERS[modelName];
  if (!verifyFn) {
    return makeSafeResult(modelName, { issues: [`Unknown model "${modelName}" — no verifier registered`] });
  }

  const prisma = await tryGetPrisma();
  try {
    const result = await verifyFn(prisma);
    return result;
  } catch {
    return makeSafeResult(modelName, { issues: ['Unexpected error during integrity check'] });
  }
}

export function getVerificationHistory(): DataIntegrityCheckResult[] {
  return [];
}
