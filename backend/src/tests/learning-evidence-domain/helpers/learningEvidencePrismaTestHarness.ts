import { PrismaClient } from '@prisma/client';
import { PrismaLearningEvidenceEventStoreRepository } from '../../../domains/learning-evidence/repositories/prismaLearningEvidenceEventStoreRepository';
import type { LearningEvidenceEventStoreRepository } from '../../../domains/learning-evidence/repositories/learningEvidenceEventStoreRepository';

const TEST_DB_URL_VAR = 'LEARNING_EVIDENCE_TEST_DATABASE_URL';

function getTestDatabaseUrl(): string {
  const url = process.env[TEST_DB_URL_VAR];
  if (!url) {
    throw new Error(
      `LEARNING_EVIDENCE_TEST_DATABASE_REQUIRED: Set ${TEST_DB_URL_VAR} to an isolated test database URL. ` +
      'Example: postgresql://postgres@localhost:8000/steadfast_learning_evidence_test',
    );
  }
  return url;
}

export async function createPrismaLearningEvidenceHarness(): Promise<{
  name: string;
  createRepository(): Promise<LearningEvidenceEventStoreRepository>;
  reset(): Promise<void>;
  disconnect(): Promise<void>;
  createFreshRepository(): Promise<LearningEvidenceEventStoreRepository>;
}> {
  const url = getTestDatabaseUrl();

  let prisma = new PrismaClient({ datasources: { db: { url } } });
  await prisma.$connect();

  const harnessName = `prisma-${Date.now()}`;

  const deleteAll = async (client: PrismaClient) => {
    await client.learningEvidenceIdempotency.deleteMany({ where: {} });
    await client.learningEvidenceProjectionCheckpoint.deleteMany({ where: {} });
    await client.committedLearningEvidenceProjection.deleteMany({ where: {} });
    await client.learningEvidenceCandidateProjection.deleteMany({ where: {} });
    await client.learningEvidenceEvent.deleteMany({ where: {} });
    await client.learningEvidenceStream.deleteMany({ where: {} });
  };

  await deleteAll(prisma);

  return {
    name: harnessName,
    async createRepository() {
      return new PrismaLearningEvidenceEventStoreRepository(prisma);
    },
    async reset() {
      await deleteAll(prisma);
    },
    async disconnect() {
      await prisma.$disconnect();
    },
    async createFreshRepository() {
      await prisma.$disconnect();
      prisma = new PrismaClient({ datasources: { db: { url } } });
      await prisma.$connect();
      return new PrismaLearningEvidenceEventStoreRepository(prisma);
    },
  };
}
