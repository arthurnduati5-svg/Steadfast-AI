import type { IContentGovernanceReadinessRepository } from './repositories/interfaces';
import { PrismaReadinessRepository } from './repositories/prismaReadinessRepository';
import { prisma } from '../../lib/prisma';

let readinessRepository: IContentGovernanceReadinessRepository | null = null;

export function getContentGovernanceReadinessRepository(): IContentGovernanceReadinessRepository {
  if (!readinessRepository) {
    readinessRepository = new PrismaReadinessRepository(prisma);
  }
  return readinessRepository;
}

export function setContentGovernanceReadinessRepository(repo: IContentGovernanceReadinessRepository): void {
  readinessRepository = repo;
}

export class ContentGovernanceReadinessService {
  async isDurablePersistenceAvailable(): Promise<boolean> {
    const repo = getContentGovernanceReadinessRepository();
    return repo.isDurablePersistenceAvailable();
  }
}

export const contentGovernanceReadinessService = new ContentGovernanceReadinessService();
