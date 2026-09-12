import { PrismaClient } from '@prisma/client';
import type { ContentGapRecord, CurriculumFamily } from '../../task022ContentGovernanceContracts';
import type { IContentGapRepository } from './interfaces';

export class PrismaContentGapRepository implements IContentGapRepository {
  constructor(private prisma: PrismaClient) {}

  async create(gap: ContentGapRecord): Promise<ContentGapRecord> {
    const record = await this.prisma.contentGapRecord.create({
      data: {
        id: gap.id,
        schoolId: gap.schoolId,
        curriculumFamily: gap.curriculumFamily,
        subject: gap.subject,
        topic: gap.topic,
        skill: gap.skill,
        gapType: gap.gapType,
        status: gap.status,
        safeSummary: gap.safeSummary,
        reasonCodes: gap.reasonCodes,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(record);
  }

  async update(gap: ContentGapRecord): Promise<ContentGapRecord> {
    const record = await this.prisma.contentGapRecord.update({
      where: { id: gap.id },
      data: { status: gap.status, safeSummary: gap.safeSummary, reasonCodes: gap.reasonCodes },
    });
    return this.toDomain(record);
  }

  async findById(id: string): Promise<ContentGapRecord | null> {
    const record = await this.prisma.contentGapRecord.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByType(gapType: string): Promise<ContentGapRecord[]> {
    const records = await this.prisma.contentGapRecord.findMany({
      where: { gapType },
    });
    return records.map(r => this.toDomain(r));
  }

  async findByFamily(family: CurriculumFamily): Promise<ContentGapRecord[]> {
    const records = await this.prisma.contentGapRecord.findMany({
      where: { curriculumFamily: family },
    });
    return records.map(r => this.toDomain(r));
  }

  async list(): Promise<ContentGapRecord[]> {
    const records = await this.prisma.contentGapRecord.findMany();
    return records.map(r => this.toDomain(r));
  }

  private toDomain(record: any): ContentGapRecord {
    return {
      id: record.id,
      schoolId: record.schoolId ?? undefined,
      curriculumFamily: record.curriculumFamily as CurriculumFamily,
      subject: record.subject ?? undefined,
      topic: record.topic ?? undefined,
      skill: record.skill ?? undefined,
      gapType: record.gapType as any,
      status: record.status,
      safeSummary: record.safeSummary,
      reasonCodes: record.reasonCodes ?? [],
      createdAt: record.createdAt.toISOString(),
    };
  }
}
