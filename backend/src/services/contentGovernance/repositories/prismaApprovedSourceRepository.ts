import { PrismaClient } from '@prisma/client';
import type { ApprovedSource, CurriculumFamily } from '../../task022ContentGovernanceContracts';
import type { IApprovedSourceRepository } from './interfaces';

export class PrismaApprovedSourceRepository implements IApprovedSourceRepository {
  constructor(private prisma: PrismaClient) {}

  private toDomain(record: any): ApprovedSource {
    return {
      id: record.id,
      schoolId: record.schoolId ?? undefined,
      sourceKey: record.sourceKey,
      title: record.title,
      sourceType: record.sourceType as any,
      curriculumFamily: record.curriculumFamily as CurriculumFamily,
      subject: record.subject ?? undefined,
      stage: record.stage ?? undefined,
      topic: record.topic ?? undefined,
      deenCategory: record.deenCategory ?? undefined,
      trustLevel: record.trustLevel as any,
      approvalStatus: record.approvalStatus as any,
      approvedByActorId: record.approvedByActorId ?? undefined,
      approvedByRole: record.approvedByRole ?? undefined,
      approvedAt: record.approvedAt?.toISOString() ?? undefined,
      reviewRequired: record.reviewRequired,
      restrictedUse: record.restrictedUse,
      citationMetadata: record.citationMetadata ?? undefined,
      metadata: record.metadata ?? undefined,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    };
  }

  async create(source: ApprovedSource): Promise<ApprovedSource> {
    const record = await this.prisma.approvedSourceRecord.create({
      data: {
        id: source.id,
        schoolId: source.schoolId,
        sourceKey: source.sourceKey,
        title: source.title,
        sourceType: source.sourceType,
        curriculumFamily: source.curriculumFamily,
        subject: source.subject,
        stage: source.stage,
        topic: source.topic,
        deenCategory: source.deenCategory,
        trustLevel: source.trustLevel,
        approvalStatus: source.approvalStatus,
        approvedByActorId: source.approvedByActorId,
        approvedByRole: source.approvedByRole,
        approvedAt: source.approvedAt ? new Date(source.approvedAt) : null,
        reviewRequired: source.reviewRequired,
        restrictedUse: source.restrictedUse,
        citationMetadata: source.citationMetadata as any,
        metadata: source.metadata as any,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(record);
  }

  async update(source: ApprovedSource): Promise<ApprovedSource> {
    const record = await this.prisma.approvedSourceRecord.update({
      where: { id: source.id },
      data: {
        approvalStatus: source.approvalStatus,
        trustLevel: source.trustLevel,
        approvedByActorId: source.approvedByActorId,
        approvedByRole: source.approvedByRole,
        approvedAt: source.approvedAt ? new Date(source.approvedAt) : null,
        reviewRequired: source.reviewRequired,
        restrictedUse: source.restrictedUse,
        citationMetadata: source.citationMetadata as any,
        metadata: source.metadata as any,
        updatedAt: new Date(),
      },
    });
    return this.toDomain(record);
  }

  async findById(id: string): Promise<ApprovedSource | null> {
    const record = await this.prisma.approvedSourceRecord.findUnique({ where: { id } });
    return record ? this.toDomain(record) : null;
  }

  async findByFamily(family: CurriculumFamily): Promise<ApprovedSource[]> {
    const records = await this.prisma.approvedSourceRecord.findMany({
      where: { curriculumFamily: family },
    });
    return records.map(r => this.toDomain(r));
  }

  async findBySchool(schoolId: string): Promise<ApprovedSource[]> {
    const records = await this.prisma.approvedSourceRecord.findMany({
      where: { schoolId },
    });
    return records.map(r => this.toDomain(r));
  }

  async findByApprovalStatus(status: string): Promise<ApprovedSource[]> {
    const records = await this.prisma.approvedSourceRecord.findMany({
      where: { approvalStatus: status },
    });
    return records.map(r => this.toDomain(r));
  }

  async findApproved(family?: CurriculumFamily): Promise<ApprovedSource[]> {
    const where: any = { approvalStatus: 'approved' };
    if (family) where.curriculumFamily = family;
    const records = await this.prisma.approvedSourceRecord.findMany({ where });
    return records.map(r => this.toDomain(r));
  }

  async list(): Promise<ApprovedSource[]> {
    const records = await this.prisma.approvedSourceRecord.findMany();
    return records.map(r => this.toDomain(r));
  }
}
