import { PrismaClient } from '@prisma/client';
import type { IContentGovernanceReadinessRepository } from './interfaces';

export class PrismaReadinessRepository implements IContentGovernanceReadinessRepository {
  constructor(private prisma: PrismaClient) {}

  async isDurablePersistenceAvailable(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
