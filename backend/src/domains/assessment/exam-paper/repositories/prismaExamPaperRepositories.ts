import { PrismaClient, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { ExamPaper, ExamPaperStatus } from '../contracts/examPaperContracts';
import { ExamPaperVersion, ExamPaperVersionStatus } from '../contracts/examPaperVersionContracts';
import { ExamPaperSection } from '../contracts/examPaperSectionContracts';
import { ExamPaperQuestion } from '../contracts/examPaperSectionContracts';
import { ExamVariant, ExamVariantStatus, ExamVariantQuestion } from '../contracts/examPaperVariantContracts';
import { ExamAccessPolicy, ExamAccessPolicyStatus } from '../contracts/examPaperAccessContracts';
import { ExamPaperApproval, ExamPaperApprovalDecision } from '../contracts/examPaperApprovalContracts';
import { ExamPaperDeliveryBridge, ExamPaperDeliveryBridgeStatus } from '../contracts/examPaperDeliveryBridgeContracts';
import {
  ExamPaperRepository,
  ExamPaperVersionRepository,
  ExamPaperSectionRepository,
  ExamPaperQuestionRepository,
  ExamVariantRepository,
  ExamVariantQuestionRepository,
  ExamAccessPolicyRepository,
  ExamPaperApprovalRepository,
  ExamPaperAssemblyRunRepository,
  ExamPaperDeliveryBridgeRepository,
} from '../contracts/examPaperRepositoryContracts';
import { ExamPaperAssemblyRun } from '../services/examPaperAssemblyService';

function mapDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

function mapDateRequired(d: Date): string {
  return d.toISOString();
}

export class PrismaExamPaperRepository implements ExamPaperRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamPaper, 'paperId' | 'createdAt' | 'updatedAt'>): Promise<ExamPaper> {
    const paperId = randomUUID();
    const record = await this.prisma.examPaperRecord.create({ data: { paperId, ...data, createdAt: new Date(), updatedAt: new Date() } });
    return this.mapRecord(record);
  }

  async getById(paperId: string): Promise<ExamPaper | null> {
    const record = await this.prisma.examPaperRecord.findUnique({ where: { paperId } });
    return record ? this.mapRecord(record) : null;
  }

  async listBySchool(schoolId: string): Promise<ExamPaper[]> {
    const records = await this.prisma.examPaperRecord.findMany({ where: { schoolId } });
    return records.map(this.mapRecord);
  }

  async updateStatus(paperId: string, status: ExamPaperStatus, currentVersionId?: string): Promise<ExamPaper> {
    const data: any = { status, updatedAt: new Date() };
    if (currentVersionId !== undefined) data.currentVersionId = currentVersionId;
    const record = await this.prisma.examPaperRecord.update({ where: { paperId }, data });
    return this.mapRecord(record);
  }

  async archive(paperId: string): Promise<ExamPaper> {
    const record = await this.prisma.examPaperRecord.update({ where: { paperId }, data: { status: 'archived', archivedAt: new Date(), updatedAt: new Date() } });
    return this.mapRecord(record);
  }

  private mapRecord(r: any): ExamPaper {
    return { ...r, createdAt: mapDateRequired(r.createdAt), updatedAt: mapDateRequired(r.updatedAt), archivedAt: mapDate(r.archivedAt) };
  }
}

export class PrismaExamPaperVersionRepository implements ExamPaperVersionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamPaperVersion, 'createdAt'>): Promise<ExamPaperVersion> {
    const dbData: Record<string, unknown> = { ...data, createdAt: new Date() };
    if (dbData.assemblyPolicyJson === null) dbData.assemblyPolicyJson = Prisma.DbNull;
    const record = await this.prisma.examPaperVersionRecord.create({ data: dbData as any });
    return this.mapRecord(record);
  }

  async getById(paperVersionId: string): Promise<ExamPaperVersion | null> {
    const record = await this.prisma.examPaperVersionRecord.findUnique({ where: { paperVersionId } });
    return record ? this.mapRecord(record) : null;
  }

  async listByPaperId(paperId: string): Promise<ExamPaperVersion[]> {
    const records = await this.prisma.examPaperVersionRecord.findMany({ where: { paperId } });
    return records.map(this.mapRecord);
  }

  async listBySchool(schoolId: string): Promise<ExamPaperVersion[]> {
    const records = await this.prisma.examPaperVersionRecord.findMany({ where: { schoolId } });
    return records.map(this.mapRecord);
  }

  async updateStatus(paperVersionId: string, status: ExamPaperVersionStatus): Promise<ExamPaperVersion> {
    const record = await this.prisma.examPaperVersionRecord.update({ where: { paperVersionId }, data: { status } });
    return this.mapRecord(record);
  }

  async supersede(paperVersionId: string): Promise<ExamPaperVersion> {
    const record = await this.prisma.examPaperVersionRecord.update({ where: { paperVersionId }, data: { status: 'superseded', supersededAt: new Date() } });
    return this.mapRecord(record);
  }

  private mapRecord(r: any): ExamPaperVersion {
    return { ...r, createdAt: mapDateRequired(r.createdAt), approvedAt: mapDate(r.approvedAt), supersededAt: mapDate(r.supersededAt) };
  }
}

export class PrismaExamPaperSectionRepository implements ExamPaperSectionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamPaperSection, 'createdAt'>): Promise<ExamPaperSection> {
    const record = await this.prisma.examPaperSectionRecord.create({ data: { ...data, createdAt: new Date() } });
    return this.mapRecord(record);
  }

  async createMany(data: Omit<ExamPaperSection, 'createdAt'>[]): Promise<ExamPaperSection[]> {
    const records = await this.prisma.$transaction(data.map((d) => this.prisma.examPaperSectionRecord.create({ data: { ...d, createdAt: new Date() } })));
    return records.map(this.mapRecord);
  }

  async listByPaperVersionId(paperVersionId: string): Promise<ExamPaperSection[]> {
    const records = await this.prisma.examPaperSectionRecord.findMany({ where: { paperVersionId } });
    return records.map(this.mapRecord);
  }

  private mapRecord(r: any): ExamPaperSection {
    return { ...r, createdAt: mapDateRequired(r.createdAt) };
  }
}

export class PrismaExamPaperQuestionRepository implements ExamPaperQuestionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamPaperQuestion, 'createdAt'>): Promise<ExamPaperQuestion> {
    const record = await this.prisma.examPaperQuestionRecord.create({ data: { ...data, createdAt: new Date() } });
    return this.mapRecord(record);
  }

  async createMany(data: Omit<ExamPaperQuestion, 'createdAt'>[]): Promise<ExamPaperQuestion[]> {
    const records = await this.prisma.$transaction(data.map((d) => this.prisma.examPaperQuestionRecord.create({ data: { ...d, createdAt: new Date() } })));
    return records.map(this.mapRecord);
  }

  async listByPaperVersionId(paperVersionId: string): Promise<ExamPaperQuestion[]> {
    const records = await this.prisma.examPaperQuestionRecord.findMany({ where: { paperVersionId } });
    return records.map(this.mapRecord);
  }

  async listBySectionId(sectionId: string): Promise<ExamPaperQuestion[]> {
    const records = await this.prisma.examPaperQuestionRecord.findMany({ where: { sectionId } });
    return records.map(this.mapRecord);
  }

  private mapRecord(r: any): ExamPaperQuestion {
    return { ...r, createdAt: mapDateRequired(r.createdAt) };
  }
}

export class PrismaExamVariantRepository implements ExamVariantRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamVariant, 'variantId' | 'variantCode' | 'createdAt' | 'updatedAt'>): Promise<ExamVariant> {
    const variantId = randomUUID();
    const variantCode = `V-${variantId.substring(0, 8)}`;
    const record = await this.prisma.examVariantRecord.create({ data: { variantId, variantCode, ...data, createdAt: new Date(), updatedAt: new Date() } });
    return this.mapRecord(record);
  }

  async getById(variantId: string): Promise<ExamVariant | null> {
    const record = await this.prisma.examVariantRecord.findUnique({ where: { variantId } });
    return record ? this.mapRecord(record) : null;
  }

  async listByPaperVersionId(paperVersionId: string): Promise<ExamVariant[]> {
    const records = await this.prisma.examVariantRecord.findMany({ where: { paperVersionId } });
    return records.map(this.mapRecord);
  }

  async updateStatus(variantId: string, status: ExamVariantStatus): Promise<ExamVariant> {
    const record = await this.prisma.examVariantRecord.update({ where: { variantId }, data: { status, updatedAt: new Date() } });
    return this.mapRecord(record);
  }

  async archive(variantId: string): Promise<ExamVariant> {
    const record = await this.prisma.examVariantRecord.update({ where: { variantId }, data: { status: 'archived', updatedAt: new Date() } });
    return this.mapRecord(record);
  }

  private mapRecord(r: any): ExamVariant {
    return { ...r, createdAt: mapDateRequired(r.createdAt), updatedAt: mapDateRequired(r.updatedAt), approvedAt: mapDate(r.approvedAt) };
  }
}

export class PrismaExamVariantQuestionRepository implements ExamVariantQuestionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamVariantQuestion, 'createdAt'>): Promise<ExamVariantQuestion> {
    const record = await this.prisma.examVariantQuestionRecord.create({ data: { ...data, createdAt: new Date() } });
    return this.mapRecord(record);
  }

  async createMany(data: Omit<ExamVariantQuestion, 'createdAt'>[]): Promise<ExamVariantQuestion[]> {
    const records = await this.prisma.$transaction(data.map((d) => this.prisma.examVariantQuestionRecord.create({ data: { ...d, createdAt: new Date() } })));
    return records.map(this.mapRecord);
  }

  async listByVariantId(variantId: string): Promise<ExamVariantQuestion[]> {
    const records = await this.prisma.examVariantQuestionRecord.findMany({ where: { variantId } });
    return records.map(this.mapRecord);
  }

  private mapRecord(r: any): ExamVariantQuestion {
    return { ...r, createdAt: mapDateRequired(r.createdAt) };
  }
}

export class PrismaExamAccessPolicyRepository implements ExamAccessPolicyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamAccessPolicy, 'accessPolicyId' | 'createdAt' | 'updatedAt'>): Promise<ExamAccessPolicy> {
    const accessPolicyId = randomUUID();
    const dbData: Record<string, unknown> = { accessPolicyId, ...data, createdAt: new Date(), updatedAt: new Date() };
    if (dbData.classScopeRefsJson === null) dbData.classScopeRefsJson = Prisma.DbNull;
    const record = await this.prisma.examAccessPolicyRecord.create({ data: dbData as any });
    return this.mapRecord(record);
  }

  async getById(accessPolicyId: string): Promise<ExamAccessPolicy | null> {
    const record = await this.prisma.examAccessPolicyRecord.findUnique({ where: { accessPolicyId } });
    return record ? this.mapRecord(record) : null;
  }

  async getByPaperVersionId(paperVersionId: string): Promise<ExamAccessPolicy | null> {
    const record = await this.prisma.examAccessPolicyRecord.findFirst({ where: { paperVersionId } });
    return record ? this.mapRecord(record) : null;
  }

  async listBySchool(schoolId: string): Promise<ExamAccessPolicy[]> {
    const records = await this.prisma.examAccessPolicyRecord.findMany({ where: { schoolId } });
    return records.map(this.mapRecord);
  }

  async updateStatus(accessPolicyId: string, status: ExamAccessPolicyStatus): Promise<ExamAccessPolicy> {
    const record = await this.prisma.examAccessPolicyRecord.update({ where: { accessPolicyId }, data: { status, updatedAt: new Date() } });
    return this.mapRecord(record);
  }

  async archive(accessPolicyId: string): Promise<ExamAccessPolicy> {
    const record = await this.prisma.examAccessPolicyRecord.update({ where: { accessPolicyId }, data: { status: 'archived', updatedAt: new Date() } });
    return this.mapRecord(record);
  }

  private mapRecord(r: any): ExamAccessPolicy {
    return { ...r, createdAt: mapDateRequired(r.createdAt), updatedAt: mapDateRequired(r.updatedAt) };
  }
}

export class PrismaExamPaperApprovalRepository implements ExamPaperApprovalRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamPaperApproval, 'paperApprovalId' | 'createdAt'>): Promise<ExamPaperApproval> {
    const paperApprovalId = randomUUID();
    const record = await this.prisma.examPaperApprovalRecord.create({ data: { paperApprovalId, ...data, createdAt: new Date() } });
    return this.mapRecord(record);
  }

  async listByPaperVersionId(paperVersionId: string): Promise<ExamPaperApproval[]> {
    const records = await this.prisma.examPaperApprovalRecord.findMany({ where: { paperVersionId } });
    return records.map(this.mapRecord);
  }

  async listByPaperId(paperId: string): Promise<ExamPaperApproval[]> {
    const records = await this.prisma.examPaperApprovalRecord.findMany({ where: { paperId } });
    return records.map(this.mapRecord);
  }

  private mapRecord(r: any): ExamPaperApproval {
    return { ...r, createdAt: mapDateRequired(r.createdAt) };
  }
}

export class PrismaExamPaperAssemblyRunRepository implements ExamPaperAssemblyRunRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamPaperAssemblyRun, 'createdAt'>): Promise<ExamPaperAssemblyRun> {
    const record = await this.prisma.examPaperAssemblyRunRecord.create({ data: { ...data, createdAt: new Date() } });
    return this.mapRecord(record);
  }

  async getById(assemblyRunId: string): Promise<ExamPaperAssemblyRun | null> {
    const record = await this.prisma.examPaperAssemblyRunRecord.findUnique({ where: { assemblyRunId } });
    return record ? this.mapRecord(record) : null;
  }

  async listBySchool(schoolId: string): Promise<ExamPaperAssemblyRun[]> {
    const records = await this.prisma.examPaperAssemblyRunRecord.findMany({ where: { schoolId } });
    return records.map(this.mapRecord);
  }

  async updateStatus(assemblyRunId: string, status: string): Promise<ExamPaperAssemblyRun> {
    const data: any = { status };
    if (status === 'completed' || status === 'failed' || status === 'cancelled') data.completedAt = new Date();
    const record = await this.prisma.examPaperAssemblyRunRecord.update({ where: { assemblyRunId }, data });
    return this.mapRecord(record);
  }

  private mapRecord(r: any): ExamPaperAssemblyRun {
    return { ...r, createdAt: mapDateRequired(r.createdAt), completedAt: mapDate(r.completedAt) };
  }
}

export class PrismaExamPaperDeliveryBridgeRepository implements ExamPaperDeliveryBridgeRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamPaperDeliveryBridge, 'deliveryBridgeId' | 'createdAt'>): Promise<ExamPaperDeliveryBridge> {
    const deliveryBridgeId = randomUUID();
    const record = await this.prisma.examPaperDeliveryBridgeRecord.create({ data: { deliveryBridgeId, ...data, createdAt: new Date() } });
    return this.mapRecord(record);
  }

  async getById(deliveryBridgeId: string): Promise<ExamPaperDeliveryBridge | null> {
    const record = await this.prisma.examPaperDeliveryBridgeRecord.findUnique({ where: { deliveryBridgeId } });
    return record ? this.mapRecord(record) : null;
  }

  async getByPaperVersionId(paperVersionId: string): Promise<ExamPaperDeliveryBridge | null> {
    const record = await this.prisma.examPaperDeliveryBridgeRecord.findFirst({ where: { paperVersionId } });
    return record ? this.mapRecord(record) : null;
  }

  async listBySchool(schoolId: string): Promise<ExamPaperDeliveryBridge[]> {
    const records = await this.prisma.examPaperDeliveryBridgeRecord.findMany({ where: { schoolId } });
    return records.map(this.mapRecord);
  }

  async updateStatus(deliveryBridgeId: string, status: ExamPaperDeliveryBridgeStatus): Promise<ExamPaperDeliveryBridge> {
    const record = await this.prisma.examPaperDeliveryBridgeRecord.update({ where: { deliveryBridgeId }, data: { status } });
    return this.mapRecord(record);
  }

  async markValidated(deliveryBridgeId: string): Promise<ExamPaperDeliveryBridge> {
    const record = await this.prisma.examPaperDeliveryBridgeRecord.update({ where: { deliveryBridgeId }, data: { status: 'validated', validatedAt: new Date() } });
    return this.mapRecord(record);
  }

  private mapRecord(r: any): ExamPaperDeliveryBridge {
    return { ...r, createdAt: mapDateRequired(r.createdAt), validatedAt: mapDate(r.validatedAt) };
  }
}
