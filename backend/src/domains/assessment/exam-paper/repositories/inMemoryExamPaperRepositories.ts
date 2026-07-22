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

export class InMemoryExamPaperRepository implements ExamPaperRepository {
  private store = new Map<string, ExamPaper>();

  async create(data: Omit<ExamPaper, 'paperId' | 'createdAt' | 'updatedAt'>): Promise<ExamPaper> {
    const now = new Date().toISOString();
    const paperId = randomUUID();
    const record: ExamPaper = { paperId, ...data, createdAt: now, updatedAt: now };
    this.store.set(paperId, record);
    return record;
  }

  async getById(paperId: string): Promise<ExamPaper | null> {
    return this.store.get(paperId) || null;
  }

  async listBySchool(schoolId: string): Promise<ExamPaper[]> {
    return Array.from(this.store.values()).filter((p) => p.schoolId === schoolId);
  }

  async updateStatus(paperId: string, status: ExamPaperStatus, currentVersionId?: string): Promise<ExamPaper> {
    const existing = this.store.get(paperId);
    if (!existing) throw new Error(`ExamPaper ${paperId} not found`);
    const updated: ExamPaper = { ...existing, status, updatedAt: new Date().toISOString() };
    if (currentVersionId !== undefined) updated.currentVersionId = currentVersionId;
    this.store.set(paperId, updated);
    return updated;
  }

  async archive(paperId: string): Promise<ExamPaper> {
    const existing = this.store.get(paperId);
    if (!existing) throw new Error(`ExamPaper ${paperId} not found`);
    const updated: ExamPaper = { ...existing, status: 'archived' as ExamPaperStatus, archivedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.store.set(paperId, updated);
    return updated;
  }
}

export class InMemoryExamPaperVersionRepository implements ExamPaperVersionRepository {
  private store = new Map<string, ExamPaperVersion>();

  async create(data: Omit<ExamPaperVersion, 'createdAt'>): Promise<ExamPaperVersion> {
    const record: ExamPaperVersion = { ...data, createdAt: new Date().toISOString() };
    this.store.set(data.paperVersionId, record);
    return record;
  }

  async getById(paperVersionId: string): Promise<ExamPaperVersion | null> {
    return this.store.get(paperVersionId) || null;
  }

  async listByPaperId(paperId: string): Promise<ExamPaperVersion[]> {
    return Array.from(this.store.values()).filter((v) => v.paperId === paperId);
  }

  async listBySchool(schoolId: string): Promise<ExamPaperVersion[]> {
    return Array.from(this.store.values()).filter((v) => v.schoolId === schoolId);
  }

  async updateStatus(paperVersionId: string, status: ExamPaperVersionStatus): Promise<ExamPaperVersion> {
    const existing = this.store.get(paperVersionId);
    if (!existing) throw new Error(`ExamPaperVersion ${paperVersionId} not found`);
    const updated: ExamPaperVersion = { ...existing, status };
    this.store.set(paperVersionId, updated);
    return updated;
  }

  async supersede(paperVersionId: string): Promise<ExamPaperVersion> {
    const existing = this.store.get(paperVersionId);
    if (!existing) throw new Error(`ExamPaperVersion ${paperVersionId} not found`);
    const updated: ExamPaperVersion = { ...existing, status: 'superseded' as ExamPaperVersionStatus, supersededAt: new Date().toISOString() };
    this.store.set(paperVersionId, updated);
    return updated;
  }
}

export class InMemoryExamPaperSectionRepository implements ExamPaperSectionRepository {
  private store = new Map<string, ExamPaperSection>();

  async create(data: Omit<ExamPaperSection, 'createdAt'>): Promise<ExamPaperSection> {
    const record: ExamPaperSection = { ...data, createdAt: new Date().toISOString() };
    this.store.set(data.sectionId, record);
    return record;
  }

  async createMany(data: Omit<ExamPaperSection, 'createdAt'>[]): Promise<ExamPaperSection[]> {
    return Promise.all(data.map((d) => this.create(d)));
  }

  async listByPaperVersionId(paperVersionId: string): Promise<ExamPaperSection[]> {
    return Array.from(this.store.values()).filter((s) => s.paperVersionId === paperVersionId);
  }
}

export class InMemoryExamPaperQuestionRepository implements ExamPaperQuestionRepository {
  private store = new Map<string, ExamPaperQuestion>();

  async create(data: Omit<ExamPaperQuestion, 'createdAt'>): Promise<ExamPaperQuestion> {
    const record: ExamPaperQuestion = { ...data, createdAt: new Date().toISOString() };
    this.store.set(data.paperQuestionId, record);
    return record;
  }

  async createMany(data: Omit<ExamPaperQuestion, 'createdAt'>[]): Promise<ExamPaperQuestion[]> {
    return Promise.all(data.map((d) => this.create(d)));
  }

  async listByPaperVersionId(paperVersionId: string): Promise<ExamPaperQuestion[]> {
    return Array.from(this.store.values()).filter((q) => q.paperVersionId === paperVersionId);
  }

  async listBySectionId(sectionId: string): Promise<ExamPaperQuestion[]> {
    return Array.from(this.store.values()).filter((q) => q.sectionId === sectionId);
  }
}

export class InMemoryExamVariantRepository implements ExamVariantRepository {
  private store = new Map<string, ExamVariant>();

  async create(data: Omit<ExamVariant, 'variantId' | 'variantCode' | 'createdAt' | 'updatedAt'>): Promise<ExamVariant> {
    const now = new Date().toISOString();
    const variantId = randomUUID();
    const record: ExamVariant = { variantId, variantCode: `V-${variantId.substring(0, 8)}`, ...data, createdAt: now, updatedAt: now };
    this.store.set(variantId, record);
    return record;
  }

  async getById(variantId: string): Promise<ExamVariant | null> {
    return this.store.get(variantId) || null;
  }

  async listByPaperVersionId(paperVersionId: string): Promise<ExamVariant[]> {
    return Array.from(this.store.values()).filter((v) => v.paperVersionId === paperVersionId);
  }

  async updateStatus(variantId: string, status: ExamVariantStatus): Promise<ExamVariant> {
    const existing = this.store.get(variantId);
    if (!existing) throw new Error(`ExamVariant ${variantId} not found`);
    const updated: ExamVariant = { ...existing, status, updatedAt: new Date().toISOString() };
    this.store.set(variantId, updated);
    return updated;
  }

  async archive(variantId: string): Promise<ExamVariant> {
    const existing = this.store.get(variantId);
    if (!existing) throw new Error(`ExamVariant ${variantId} not found`);
    const updated: ExamVariant = { ...existing, status: 'archived' as ExamVariantStatus, updatedAt: new Date().toISOString() };
    this.store.set(variantId, updated);
    return updated;
  }
}

export class InMemoryExamVariantQuestionRepository implements ExamVariantQuestionRepository {
  private store = new Map<string, ExamVariantQuestion>();

  async create(data: Omit<ExamVariantQuestion, 'createdAt'>): Promise<ExamVariantQuestion> {
    const record: ExamVariantQuestion = { ...data, createdAt: new Date().toISOString() };
    this.store.set(data.variantQuestionId, record);
    return record;
  }

  async createMany(data: Omit<ExamVariantQuestion, 'createdAt'>[]): Promise<ExamVariantQuestion[]> {
    return Promise.all(data.map((d) => this.create(d)));
  }

  async listByVariantId(variantId: string): Promise<ExamVariantQuestion[]> {
    return Array.from(this.store.values()).filter((q) => q.variantId === variantId);
  }
}

export class InMemoryExamAccessPolicyRepository implements ExamAccessPolicyRepository {
  private store = new Map<string, ExamAccessPolicy>();

  async create(data: Omit<ExamAccessPolicy, 'accessPolicyId' | 'createdAt' | 'updatedAt'>): Promise<ExamAccessPolicy> {
    const now = new Date().toISOString();
    const accessPolicyId = randomUUID();
    const record: ExamAccessPolicy = { accessPolicyId, ...data, createdAt: now, updatedAt: now };
    this.store.set(accessPolicyId, record);
    return record;
  }

  async getById(accessPolicyId: string): Promise<ExamAccessPolicy | null> {
    return this.store.get(accessPolicyId) || null;
  }

  async getByPaperVersionId(paperVersionId: string): Promise<ExamAccessPolicy | null> {
    return Array.from(this.store.values()).find((p) => p.paperVersionId === paperVersionId) || null;
  }

  async listBySchool(schoolId: string): Promise<ExamAccessPolicy[]> {
    return Array.from(this.store.values()).filter((p) => p.schoolId === schoolId);
  }

  async updateStatus(accessPolicyId: string, status: ExamAccessPolicyStatus): Promise<ExamAccessPolicy> {
    const existing = this.store.get(accessPolicyId);
    if (!existing) throw new Error(`ExamAccessPolicy ${accessPolicyId} not found`);
    const updated: ExamAccessPolicy = { ...existing, status, updatedAt: new Date().toISOString() };
    this.store.set(accessPolicyId, updated);
    return updated;
  }

  async archive(accessPolicyId: string): Promise<ExamAccessPolicy> {
    const existing = this.store.get(accessPolicyId);
    if (!existing) throw new Error(`ExamAccessPolicy ${accessPolicyId} not found`);
    const updated: ExamAccessPolicy = { ...existing, status: 'archived' as ExamAccessPolicyStatus, updatedAt: new Date().toISOString() };
    this.store.set(accessPolicyId, updated);
    return updated;
  }
}

export class InMemoryExamPaperApprovalRepository implements ExamPaperApprovalRepository {
  private store = new Map<string, ExamPaperApproval>();

  async create(data: Omit<ExamPaperApproval, 'paperApprovalId' | 'createdAt'>): Promise<ExamPaperApproval> {
    const paperApprovalId = randomUUID();
    const record: ExamPaperApproval = { paperApprovalId, ...data, createdAt: new Date().toISOString() };
    this.store.set(paperApprovalId, record);
    return record;
  }

  async listByPaperVersionId(paperVersionId: string): Promise<ExamPaperApproval[]> {
    return Array.from(this.store.values()).filter((a) => a.paperVersionId === paperVersionId);
  }

  async listByPaperId(paperId: string): Promise<ExamPaperApproval[]> {
    return Array.from(this.store.values()).filter((a) => a.paperId === paperId);
  }
}

export class InMemoryExamPaperAssemblyRunRepository implements ExamPaperAssemblyRunRepository {
  private store = new Map<string, ExamPaperAssemblyRun>();

  async create(data: Omit<ExamPaperAssemblyRun, 'createdAt'>): Promise<ExamPaperAssemblyRun> {
    const record: ExamPaperAssemblyRun = { ...data, createdAt: new Date().toISOString() };
    this.store.set(data.assemblyRunId, record);
    return record;
  }

  async getById(assemblyRunId: string): Promise<ExamPaperAssemblyRun | null> {
    return this.store.get(assemblyRunId) || null;
  }

  async listBySchool(schoolId: string): Promise<ExamPaperAssemblyRun[]> {
    return Array.from(this.store.values()).filter((r) => r.schoolId === schoolId);
  }

  async updateStatus(assemblyRunId: string, status: string): Promise<ExamPaperAssemblyRun> {
    const existing = this.store.get(assemblyRunId);
    if (!existing) throw new Error(`ExamPaperAssemblyRun ${assemblyRunId} not found`);
    const updated: ExamPaperAssemblyRun = { ...existing, status: status as ExamPaperAssemblyRun['status'] };
    this.store.set(assemblyRunId, updated);
    return updated;
  }
}

export class InMemoryExamPaperDeliveryBridgeRepository implements ExamPaperDeliveryBridgeRepository {
  private store = new Map<string, ExamPaperDeliveryBridge>();

  async create(data: Omit<ExamPaperDeliveryBridge, 'deliveryBridgeId' | 'createdAt'>): Promise<ExamPaperDeliveryBridge> {
    const deliveryBridgeId = randomUUID();
    const record: ExamPaperDeliveryBridge = { deliveryBridgeId, ...data, createdAt: new Date().toISOString() };
    this.store.set(deliveryBridgeId, record);
    return record;
  }

  async getById(deliveryBridgeId: string): Promise<ExamPaperDeliveryBridge | null> {
    return this.store.get(deliveryBridgeId) || null;
  }

  async getByPaperVersionId(paperVersionId: string): Promise<ExamPaperDeliveryBridge | null> {
    return Array.from(this.store.values()).find((b) => b.paperVersionId === paperVersionId) || null;
  }

  async listBySchool(schoolId: string): Promise<ExamPaperDeliveryBridge[]> {
    return Array.from(this.store.values()).filter((b) => b.schoolId === schoolId);
  }

  async updateStatus(deliveryBridgeId: string, status: ExamPaperDeliveryBridgeStatus): Promise<ExamPaperDeliveryBridge> {
    const existing = this.store.get(deliveryBridgeId);
    if (!existing) throw new Error(`ExamPaperDeliveryBridge ${deliveryBridgeId} not found`);
    const updated: ExamPaperDeliveryBridge = { ...existing, status };
    this.store.set(deliveryBridgeId, updated);
    return updated;
  }

  async markValidated(deliveryBridgeId: string): Promise<ExamPaperDeliveryBridge> {
    const existing = this.store.get(deliveryBridgeId);
    if (!existing) throw new Error(`ExamPaperDeliveryBridge ${deliveryBridgeId} not found`);
    const updated: ExamPaperDeliveryBridge = { ...existing, status: 'validated' as ExamPaperDeliveryBridgeStatus, validatedAt: new Date().toISOString() };
    this.store.set(deliveryBridgeId, updated);
    return updated;
  }
}
