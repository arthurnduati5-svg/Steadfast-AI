import { PrismaClient } from '@prisma/client';
import type { ContentGovernanceAuditRecord, CurriculumFamily } from '../../task022ContentGovernanceContracts';
import type { IContentGovernanceAuditRepository } from './interfaces';

export class PrismaContentGovernanceAuditRepository implements IContentGovernanceAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(record: ContentGovernanceAuditRecord): Promise<ContentGovernanceAuditRecord> {
    const saved = await this.prisma.contentGovernanceAuditRecord.create({
      data: {
        id: record.id,
        schoolId: record.schoolId,
        actorId: record.actorId,
        actorRole: record.actorRole,
        eventType: record.eventType,
        curriculumFamily: record.curriculumFamily,
        curriculumVersionId: record.curriculumVersionId,
        sourceId: record.sourceId,
        contentItemId: record.contentItemId,
        decision: record.decision,
        reasonCodes: record.reasonCodes as any,
        privacyMetadata: record.privacyMetadata as any,
        requestId: record.requestId,
        correlationId: record.correlationId,
      },
    });
    return this.toDomain(saved);
  }

  async find(options?: { eventType?: string; schoolId?: string; curriculumFamily?: CurriculumFamily; limit?: number; }): Promise<ContentGovernanceAuditRecord[]> {
    const where: any = {};
    if (options?.eventType) where.eventType = options.eventType;
    if (options?.schoolId) where.schoolId = options.schoolId;
    if (options?.curriculumFamily) where.curriculumFamily = options.curriculumFamily;

    const records = await this.prisma.contentGovernanceAuditRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 100,
    });
    return records.map(r => this.toDomain(r));
  }

  async countByEventType(): Promise<Record<string, number>> {
    const records = await this.prisma.contentGovernanceAuditRecord.findMany();
    const counts: Record<string, number> = {};
    for (const r of records) {
      counts[r.eventType] = (counts[r.eventType] || 0) + 1;
    }
    return counts;
  }

  async count(): Promise<number> {
    return this.prisma.contentGovernanceAuditRecord.count();
  }

  async list(): Promise<ContentGovernanceAuditRecord[]> {
    const records = await this.prisma.contentGovernanceAuditRecord.findMany();
    return records.map(r => this.toDomain(r));
  }

  private toDomain(record: any): ContentGovernanceAuditRecord {
    return {
      id: record.id,
      schoolId: record.schoolId ?? undefined,
      actorId: record.actorId ?? undefined,
      actorRole: record.actorRole,
      eventType: record.eventType as any,
      curriculumFamily: record.curriculumFamily ?? undefined,
      curriculumVersionId: record.curriculumVersionId ?? undefined,
      sourceId: record.sourceId ?? undefined,
      contentItemId: record.contentItemId ?? undefined,
      decision: record.decision,
      reasonCodes: record.reasonCodes ?? [],
      privacyMetadata: record.privacyMetadata ?? undefined,
      requestId: record.requestId ?? undefined,
      correlationId: record.correlationId ?? undefined,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
