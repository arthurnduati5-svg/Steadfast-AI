import { ExamPaper, ExamPaperStatus, ExamPaperCommandContext } from './examPaperContracts';
import { ExamPaperVersion, ExamPaperVersionStatus } from './examPaperVersionContracts';
import { ExamPaperSection } from './examPaperSectionContracts';
import { ExamPaperQuestion } from './examPaperSectionContracts';
import { ExamVariant, ExamVariantStatus, ExamVariantQuestion } from './examPaperVariantContracts';
import { ExamAccessPolicy, ExamAccessPolicyStatus } from './examPaperAccessContracts';
import { ExamPaperApproval, ExamPaperApprovalDecision } from './examPaperApprovalContracts';
import { ExamPaperAssemblyRun } from '../services/examPaperAssemblyService';
import { ExamPaperDeliveryBridge, ExamPaperDeliveryBridgeStatus } from './examPaperDeliveryBridgeContracts';

export interface ExamPaperRepository {
  create(data: Omit<ExamPaper, 'createdAt' | 'updatedAt'>): Promise<ExamPaper>;
  getById(paperId: string): Promise<ExamPaper | null>;
  listBySchool(schoolId: string): Promise<ExamPaper[]>;
  updateStatus(paperId: string, status: ExamPaperStatus, currentVersionId?: string): Promise<ExamPaper>;
  archive(paperId: string): Promise<ExamPaper>;
}

export interface ExamPaperVersionRepository {
  create(data: Omit<ExamPaperVersion, 'createdAt'>): Promise<ExamPaperVersion>;
  getById(paperVersionId: string): Promise<ExamPaperVersion | null>;
  listByPaperId(paperId: string): Promise<ExamPaperVersion[]>;
  listBySchool(schoolId: string): Promise<ExamPaperVersion[]>;
  updateStatus(paperVersionId: string, status: ExamPaperVersionStatus): Promise<ExamPaperVersion>;
  supersede(paperVersionId: string): Promise<ExamPaperVersion>;
}

export interface ExamPaperSectionRepository {
  create(data: Omit<ExamPaperSection, 'createdAt'>): Promise<ExamPaperSection>;
  createMany(data: Omit<ExamPaperSection, 'createdAt'>[]): Promise<ExamPaperSection[]>;
  listByPaperVersionId(paperVersionId: string): Promise<ExamPaperSection[]>;
}

export interface ExamPaperQuestionRepository {
  create(data: Omit<ExamPaperQuestion, 'createdAt'>): Promise<ExamPaperQuestion>;
  createMany(data: Omit<ExamPaperQuestion, 'createdAt'>[]): Promise<ExamPaperQuestion[]>;
  listByPaperVersionId(paperVersionId: string): Promise<ExamPaperQuestion[]>;
  listBySectionId(sectionId: string): Promise<ExamPaperQuestion[]>;
}

export interface ExamVariantRepository {
  create(data: Omit<ExamVariant, 'createdAt' | 'updatedAt'>): Promise<ExamVariant>;
  getById(variantId: string): Promise<ExamVariant | null>;
  listByPaperVersionId(paperVersionId: string): Promise<ExamVariant[]>;
  updateStatus(variantId: string, status: ExamVariantStatus): Promise<ExamVariant>;
  archive(variantId: string): Promise<ExamVariant>;
}

export interface ExamVariantQuestionRepository {
  create(data: Omit<ExamVariantQuestion, 'createdAt'>): Promise<ExamVariantQuestion>;
  createMany(data: Omit<ExamVariantQuestion, 'createdAt'>[]): Promise<ExamVariantQuestion[]>;
  listByVariantId(variantId: string): Promise<ExamVariantQuestion[]>;
}

export interface ExamAccessPolicyRepository {
  create(data: Omit<ExamAccessPolicy, 'createdAt' | 'updatedAt'>): Promise<ExamAccessPolicy>;
  getById(accessPolicyId: string): Promise<ExamAccessPolicy | null>;
  getByPaperVersionId(paperVersionId: string): Promise<ExamAccessPolicy | null>;
  listBySchool(schoolId: string): Promise<ExamAccessPolicy[]>;
  updateStatus(accessPolicyId: string, status: ExamAccessPolicyStatus): Promise<ExamAccessPolicy>;
  archive(accessPolicyId: string): Promise<ExamAccessPolicy>;
}

export interface ExamPaperApprovalRepository {
  create(data: Omit<ExamPaperApproval, 'createdAt'>): Promise<ExamPaperApproval>;
  listByPaperVersionId(paperVersionId: string): Promise<ExamPaperApproval[]>;
  listByPaperId(paperId: string): Promise<ExamPaperApproval[]>;
}

export interface ExamPaperAssemblyRunRepository {
  create(data: Omit<ExamPaperAssemblyRun, 'createdAt'>): Promise<ExamPaperAssemblyRun>;
  getById(assemblyRunId: string): Promise<ExamPaperAssemblyRun | null>;
  listBySchool(schoolId: string): Promise<ExamPaperAssemblyRun[]>;
  updateStatus(assemblyRunId: string, status: string): Promise<ExamPaperAssemblyRun>;
}

export interface ExamPaperDeliveryBridgeRepository {
  create(data: Omit<ExamPaperDeliveryBridge, 'createdAt'>): Promise<ExamPaperDeliveryBridge>;
  getById(deliveryBridgeId: string): Promise<ExamPaperDeliveryBridge | null>;
  getByPaperVersionId(paperVersionId: string): Promise<ExamPaperDeliveryBridge | null>;
  listBySchool(schoolId: string): Promise<ExamPaperDeliveryBridge[]>;
  updateStatus(deliveryBridgeId: string, status: ExamPaperDeliveryBridgeStatus): Promise<ExamPaperDeliveryBridge>;
  markValidated(deliveryBridgeId: string): Promise<ExamPaperDeliveryBridge>;
}
