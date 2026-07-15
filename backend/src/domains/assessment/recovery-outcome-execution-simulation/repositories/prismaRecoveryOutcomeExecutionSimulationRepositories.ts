import { PrismaClient } from '@prisma/client';
import { RecoveryOutcomeExecutionSimulationReadiness } from '../contracts/recoveryOutcomeExecutionSimulationReadinessContracts';
import { RecoveryOutcomeExecutionSimulationPlan } from '../contracts/recoveryOutcomeExecutionSimulationPlanContracts';
import { RecoveryOutcomeExecutionSimulationRun } from '../contracts/recoveryOutcomeExecutionSimulationRunContracts';
import { RecoveryOutcomeExecutionSimulationStep } from '../contracts/recoveryOutcomeExecutionSimulationStepContracts';
import { RecoveryOutcomeExecutionEligibilityCheck } from '../contracts/recoveryOutcomeExecutionEligibilityContracts';
import { RecoveryOutcomeExecutionBlockedActionDiagnostic } from '../contracts/recoveryOutcomeExecutionBlockedActionDiagnosticContracts';
import { RecoveryOutcomeExecutionFailureInjection } from '../contracts/recoveryOutcomeExecutionFailureInjectionContracts';
import { RecoveryOutcomeExecutionSimulationResult } from '../contracts/recoveryOutcomeExecutionSimulationResultContracts';
import { RecoveryOutcomeExecutionTeacherReview } from '../contracts/recoveryOutcomeExecutionTeacherReviewContracts';
import { RecoveryOutcomeExecutionStudentPreviewDraft, RecoveryOutcomeExecutionParentPreviewDraft } from '../contracts/recoveryOutcomeExecutionPreviewDraftContracts';
import { RecoveryOutcomeExecutionReadinessVerdict } from '../contracts/recoveryOutcomeExecutionReadinessVerdictContracts';
import { RecoveryOutcomeExecutionSimulationSummary } from '../contracts/recoveryOutcomeExecutionSimulationSummaryContracts';
import {
  ISimulationReadinessRepository,
  ISimulationPlanRepository,
  ISimulationRunRepository,
  ISimulationStepRepository,
  IEligibilityCheckRepository,
  IBlockedActionDiagnosticRepository,
  IFailureInjectionRepository,
  ISimulationResultRepository,
  ITeacherReviewRepository,
  IStudentPreviewDraftRepository,
  IParentPreviewDraftRepository,
  IReadinessVerdictRepository,
  ISimulationSummaryRepository,
  ISimulationAuditRepository,
  RecoveryOutcomeExecutionSimulationAuditRecord,
  ISimulationIdempotencyRepository,
  RecoveryOutcomeExecutionSimulationIdempotencyRecord,
} from '../contracts/recoveryOutcomeExecutionSimulationRepositoryContracts';

function toDateString(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'string') return val;
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

function parseJsonField(val: unknown): Record<string, unknown> {
  if (!val) return {};
  if (typeof val === 'object') return val as Record<string, unknown>;
  if (typeof val === 'string') return JSON.parse(val);
  return {};
}

function parseStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === 'string') return JSON.parse(val);
  return [];
}

export class PrismaSimulationReadinessRepository implements ISimulationReadinessRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionSimulationReadiness>): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    const created = await this.prisma.recoveryOutcomeExecutionSimulationReadinessRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness | null> {
    const found = await this.prisma.recoveryOutcomeExecutionSimulationReadinessRecord.findUnique({ where: { simulationReadinessId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationReadinessRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationReadinessRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationReadinessRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, readinessStatus: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationReadinessRecord.findMany({ where: { schoolId, readinessStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationReadiness>): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    const updated = await this.prisma.recoveryOutcomeExecutionSimulationReadinessRecord.update({
      where: { simulationReadinessId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    return this.update(id, { readinessStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    return this.update(id, { readinessStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    return this.update(id, { readinessStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    return this.update(id, { readinessStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    return this.update(id, { readinessStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    return this.update(id, { readinessStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionSimulationReadiness {
    return {
      ...data,
      readinessChecksJson: parseJsonField(data.readinessChecksJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionSimulationReadiness;
  }
}

export class PrismaSimulationPlanRepository implements ISimulationPlanRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionSimulationPlan>): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    const created = await this.prisma.recoveryOutcomeExecutionSimulationPlanRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan | null> {
    const found = await this.prisma.recoveryOutcomeExecutionSimulationPlanRecord.findUnique({ where: { simulationPlanId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationPlanRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationPlanRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationPlanRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, planStatus: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationPlanRecord.findMany({ where: { schoolId, planStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByActionBundleId(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationPlanRecord.findMany({ where: { schoolId, recoveryOutcomeActionBundleId: bundleId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationPlanId(schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationPlanRecord.findMany({ where: { schoolId, simulationPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationPlan>): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    const updated = await this.prisma.recoveryOutcomeExecutionSimulationPlanRecord.update({
      where: { simulationPlanId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    return this.update(id, { planStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    return this.update(id, { planStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    return this.update(id, { planStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    return this.update(id, { planStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    return this.update(id, { planStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    return this.update(id, { planStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionSimulationPlan {
    return {
      ...data,
      simulationParametersJson: parseJsonField(data.simulationParametersJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      simulationReadyAt: toDateString(data.simulationReadyAt),
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionSimulationPlan;
  }
}

export class PrismaSimulationRunRepository implements ISimulationRunRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionSimulationRun>): Promise<RecoveryOutcomeExecutionSimulationRun> {
    const created = await this.prisma.recoveryOutcomeExecutionSimulationRunRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationRun | null> {
    const found = await this.prisma.recoveryOutcomeExecutionSimulationRunRecord.findUnique({ where: { simulationRunId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationRunRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationRunRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationRunRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, runStatus: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationRunRecord.findMany({ where: { schoolId, runStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByActionBundleId(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationRunRecord.findMany({ where: { schoolId, recoveryOutcomeActionBundleId: bundleId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationPlanId(schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationRunRecord.findMany({ where: { schoolId, simulationPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationRun>): Promise<RecoveryOutcomeExecutionSimulationRun> {
    const updated = await this.prisma.recoveryOutcomeExecutionSimulationRunRecord.update({
      where: { simulationRunId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationRun> {
    return this.update(id, { runStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionSimulationRun> {
    return this.update(id, { runStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeExecutionSimulationRun> {
    return this.update(id, { runStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionSimulationRun> {
    return this.update(id, { runStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionSimulationRun> {
    return this.update(id, { runStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionSimulationRun {
    return {
      ...data,
      runParametersJson: parseJsonField(data.runParametersJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      simulatingAt: toDateString(data.simulatingAt),
      simulatedAt: toDateString(data.simulatedAt),
      reviewReadyAt: toDateString(data.reviewReadyAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionSimulationRun;
  }
}

export class PrismaSimulationStepRepository implements ISimulationStepRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionSimulationStep>): Promise<RecoveryOutcomeExecutionSimulationStep> {
    const created = await this.prisma.recoveryOutcomeExecutionSimulationStepRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationStep | null> {
    const found = await this.prisma.recoveryOutcomeExecutionSimulationStepRecord.findUnique({ where: { simulationStepId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationStep[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationStepRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listStepsForSimulationRun(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationStep[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationStepRecord.findMany({ where: { simulationRunId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, stepStatus: string): Promise<RecoveryOutcomeExecutionSimulationStep[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationStepRecord.findMany({ where: { schoolId, stepStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationStep>): Promise<RecoveryOutcomeExecutionSimulationStep> {
    const updated = await this.prisma.recoveryOutcomeExecutionSimulationStepRecord.update({
      where: { simulationStepId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationStep> {
    return this.update(id, { stepStatus: status } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionSimulationStep> {
    return this.update(id, { stepStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionSimulationStep> {
    return this.update(id, { stepStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionSimulationStep {
    return {
      ...data,
      stepDetailsJson: parseJsonField(data.stepDetailsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      simulatedAt: toDateString(data.simulatedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionSimulationStep;
  }
}

export class PrismaEligibilityCheckRepository implements IEligibilityCheckRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionEligibilityCheck>): Promise<RecoveryOutcomeExecutionEligibilityCheck> {
    const created = await this.prisma.recoveryOutcomeExecutionEligibilityCheckRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionEligibilityCheck | null> {
    const found = await this.prisma.recoveryOutcomeExecutionEligibilityCheckRecord.findUnique({ where: { eligibilityCheckId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    const records = await this.prisma.recoveryOutcomeExecutionEligibilityCheckRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    const records = await this.prisma.recoveryOutcomeExecutionEligibilityCheckRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    const records = await this.prisma.recoveryOutcomeExecutionEligibilityCheckRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByActionBundleId(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    const records = await this.prisma.recoveryOutcomeExecutionEligibilityCheckRecord.findMany({ where: { schoolId, recoveryOutcomeActionBundleId: bundleId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByResult(schoolId: string, eligibilityStatus: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    const records = await this.prisma.recoveryOutcomeExecutionEligibilityCheckRecord.findMany({ where: { schoolId, eligibilityStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, eligibilityStatus: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    const records = await this.prisma.recoveryOutcomeExecutionEligibilityCheckRecord.findMany({ where: { schoolId, eligibilityStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionEligibilityCheck>): Promise<RecoveryOutcomeExecutionEligibilityCheck> {
    const updated = await this.prisma.recoveryOutcomeExecutionEligibilityCheckRecord.update({
      where: { eligibilityCheckId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionEligibilityCheck> {
    return this.update(id, { eligibilityStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionEligibilityCheck> {
    return this.update(id, { eligibilityStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionEligibilityCheck> {
    return this.update(id, { eligibilityStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionEligibilityCheck {
    return {
      ...data,
      eligibilityChecksJson: parseJsonField(data.eligibilityChecksJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionEligibilityCheck;
  }
}

export class PrismaBlockedActionDiagnosticRepository implements IBlockedActionDiagnosticRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionBlockedActionDiagnostic>): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic> {
    const created = await this.prisma.recoveryOutcomeExecutionBlockedActionDiagnosticRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic | null> {
    const found = await this.prisma.recoveryOutcomeExecutionBlockedActionDiagnosticRecord.findUnique({ where: { blockedActionDiagnosticId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    const records = await this.prisma.recoveryOutcomeExecutionBlockedActionDiagnosticRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    const records = await this.prisma.recoveryOutcomeExecutionBlockedActionDiagnosticRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    const records = await this.prisma.recoveryOutcomeExecutionBlockedActionDiagnosticRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    const records = await this.prisma.recoveryOutcomeExecutionBlockedActionDiagnosticRecord.findMany({ where: { simulationRunId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByReason(schoolId: string, reasonCode: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    const records = await this.prisma.recoveryOutcomeExecutionBlockedActionDiagnosticRecord.findMany({ where: { schoolId, blockedReasonCodesJson: { has: reasonCode } } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, diagnosticStatus: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    const records = await this.prisma.recoveryOutcomeExecutionBlockedActionDiagnosticRecord.findMany({ where: { schoolId, diagnosticStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionBlockedActionDiagnostic>): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic> {
    const updated = await this.prisma.recoveryOutcomeExecutionBlockedActionDiagnosticRecord.update({
      where: { blockedActionDiagnosticId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic> {
    return this.update(id, { diagnosticStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic> {
    return this.update(id, { diagnosticStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic> {
    return this.update(id, { diagnosticStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic> {
    return this.update(id, { diagnosticStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionBlockedActionDiagnostic {
    return {
      ...data,
      blockedReasonCodesJson: parseStringArray(data.blockedReasonCodesJson),
      diagnosticDetailsJson: parseJsonField(data.diagnosticDetailsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      suppressedAt: toDateString(data.suppressedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionBlockedActionDiagnostic;
  }
}

export class PrismaFailureInjectionRepository implements IFailureInjectionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionFailureInjection>): Promise<RecoveryOutcomeExecutionFailureInjection> {
    const created = await this.prisma.recoveryOutcomeExecutionFailureInjectionRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionFailureInjection | null> {
    const found = await this.prisma.recoveryOutcomeExecutionFailureInjectionRecord.findUnique({ where: { failureInjectionId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    const records = await this.prisma.recoveryOutcomeExecutionFailureInjectionRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    const records = await this.prisma.recoveryOutcomeExecutionFailureInjectionRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    const records = await this.prisma.recoveryOutcomeExecutionFailureInjectionRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByType(schoolId: string, injectionType: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    const records = await this.prisma.recoveryOutcomeExecutionFailureInjectionRecord.findMany({ where: { schoolId, injectionType } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, injectionStatus: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    const records = await this.prisma.recoveryOutcomeExecutionFailureInjectionRecord.findMany({ where: { schoolId, injectionStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionFailureInjection>): Promise<RecoveryOutcomeExecutionFailureInjection> {
    const updated = await this.prisma.recoveryOutcomeExecutionFailureInjectionRecord.update({
      where: { failureInjectionId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionFailureInjection> {
    return this.update(id, { injectionStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionFailureInjection> {
    return this.update(id, { injectionStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionFailureInjection> {
    return this.update(id, { injectionStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeExecutionFailureInjection> {
    return this.update(id, { injectionStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionFailureInjection> {
    return this.update(id, { injectionStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionFailureInjection> {
    return this.update(id, { injectionStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionFailureInjection {
    return {
      ...data,
      injectionParametersJson: parseJsonField(data.injectionParametersJson),
      expectedFailureBehaviorJson: parseJsonField(data.expectedFailureBehaviorJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionFailureInjection;
  }
}

export class PrismaSimulationResultRepository implements ISimulationResultRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionSimulationResult>): Promise<RecoveryOutcomeExecutionSimulationResult> {
    const created = await this.prisma.recoveryOutcomeExecutionSimulationResultRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationResult | null> {
    const found = await this.prisma.recoveryOutcomeExecutionSimulationResultRecord.findUnique({ where: { simulationResultId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationResultRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationResultRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationResultRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationResultRecord.findMany({ where: { simulationRunId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByOutcome(schoolId: string, outcomeStatus: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationResultRecord.findMany({ where: { schoolId, outcomeStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationResult>): Promise<RecoveryOutcomeExecutionSimulationResult> {
    const updated = await this.prisma.recoveryOutcomeExecutionSimulationResultRecord.update({
      where: { simulationResultId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationResult> {
    return this.update(id, { outcomeStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionSimulationResult> {
    return this.update(id, { outcomeStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionSimulationResult> {
    return this.update(id, { outcomeStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionSimulationResult {
    return {
      ...data,
      simulationOutcomeDetailsJson: parseJsonField(data.simulationOutcomeDetailsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionSimulationResult;
  }
}

export class PrismaTeacherReviewRepository implements ITeacherReviewRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionTeacherReview>): Promise<RecoveryOutcomeExecutionTeacherReview> {
    const created = await this.prisma.recoveryOutcomeExecutionTeacherReviewRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionTeacherReview | null> {
    const found = await this.prisma.recoveryOutcomeExecutionTeacherReviewRecord.findUnique({ where: { teacherSimulationReviewId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    const records = await this.prisma.recoveryOutcomeExecutionTeacherReviewRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    const records = await this.prisma.recoveryOutcomeExecutionTeacherReviewRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    const records = await this.prisma.recoveryOutcomeExecutionTeacherReviewRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    const records = await this.prisma.recoveryOutcomeExecutionTeacherReviewRecord.findMany({ where: { simulationRunId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    const records = await this.prisma.recoveryOutcomeExecutionTeacherReviewRecord.findMany({ where: { schoolId, teacherRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, reviewStatus: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    const records = await this.prisma.recoveryOutcomeExecutionTeacherReviewRecord.findMany({ where: { schoolId, reviewStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionTeacherReview>): Promise<RecoveryOutcomeExecutionTeacherReview> {
    const updated = await this.prisma.recoveryOutcomeExecutionTeacherReviewRecord.update({
      where: { teacherSimulationReviewId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionTeacherReview> {
    return this.update(id, { reviewStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionTeacherReview> {
    return this.update(id, { reviewStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionTeacherReview> {
    return this.update(id, { reviewStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeExecutionTeacherReview> {
    return this.update(id, { reviewStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionTeacherReview> {
    return this.update(id, { reviewStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionTeacherReview> {
    return this.update(id, { reviewStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionTeacherReview {
    return {
      ...data,
      teacherReviewNotesJson: parseJsonField(data.teacherReviewNotesJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionTeacherReview;
  }
}

export class PrismaStudentPreviewDraftRepository implements IStudentPreviewDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionStudentPreviewDraft>): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    const created = await this.prisma.recoveryOutcomeExecutionStudentPreviewDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft | null> {
    const found = await this.prisma.recoveryOutcomeExecutionStudentPreviewDraftRecord.findUnique({ where: { studentPreviewDraftId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]> {
    const records = await this.prisma.recoveryOutcomeExecutionStudentPreviewDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]> {
    const records = await this.prisma.recoveryOutcomeExecutionStudentPreviewDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]> {
    const records = await this.prisma.recoveryOutcomeExecutionStudentPreviewDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]> {
    const records = await this.prisma.recoveryOutcomeExecutionStudentPreviewDraftRecord.findMany({ where: { schoolId, draftStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionStudentPreviewDraft>): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    const updated = await this.prisma.recoveryOutcomeExecutionStudentPreviewDraftRecord.update({
      where: { studentPreviewDraftId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    return this.update(id, { draftStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    return this.update(id, { draftStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    return this.update(id, { draftStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    return this.update(id, { draftStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    return this.update(id, { draftStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionStudentPreviewDraft {
    return {
      ...data,
      previewContentJson: parseJsonField(data.previewContentJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionStudentPreviewDraft;
  }
}

export class PrismaParentPreviewDraftRepository implements IParentPreviewDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionParentPreviewDraft>): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    const created = await this.prisma.recoveryOutcomeExecutionParentPreviewDraftRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft | null> {
    const found = await this.prisma.recoveryOutcomeExecutionParentPreviewDraftRecord.findUnique({ where: { parentPreviewDraftId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]> {
    const records = await this.prisma.recoveryOutcomeExecutionParentPreviewDraftRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]> {
    const records = await this.prisma.recoveryOutcomeExecutionParentPreviewDraftRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]> {
    const records = await this.prisma.recoveryOutcomeExecutionParentPreviewDraftRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]> {
    const records = await this.prisma.recoveryOutcomeExecutionParentPreviewDraftRecord.findMany({ where: { schoolId, draftStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionParentPreviewDraft>): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    const updated = await this.prisma.recoveryOutcomeExecutionParentPreviewDraftRecord.update({
      where: { parentPreviewDraftId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    return this.update(id, { draftStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    return this.update(id, { draftStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    return this.update(id, { draftStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    return this.update(id, { draftStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    return this.update(id, { draftStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    return this.update(id, { draftStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionParentPreviewDraft {
    return {
      ...data,
      previewContentJson: parseJsonField(data.previewContentJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionParentPreviewDraft;
  }
}

export class PrismaReadinessVerdictRepository implements IReadinessVerdictRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionReadinessVerdict>): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    const created = await this.prisma.recoveryOutcomeExecutionReadinessVerdictRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict | null> {
    const found = await this.prisma.recoveryOutcomeExecutionReadinessVerdictRecord.findUnique({ where: { readinessVerdictId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    const records = await this.prisma.recoveryOutcomeExecutionReadinessVerdictRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    const records = await this.prisma.recoveryOutcomeExecutionReadinessVerdictRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    const records = await this.prisma.recoveryOutcomeExecutionReadinessVerdictRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    const records = await this.prisma.recoveryOutcomeExecutionReadinessVerdictRecord.findMany({ where: { simulationRunId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, verdictStatus: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    const records = await this.prisma.recoveryOutcomeExecutionReadinessVerdictRecord.findMany({ where: { schoolId, verdictStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionReadinessVerdict>): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    const updated = await this.prisma.recoveryOutcomeExecutionReadinessVerdictRecord.update({
      where: { readinessVerdictId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    return this.update(id, { verdictStatus: status } as any);
  }

  async markReviewReady(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    return this.update(id, { verdictStatus: 'review_ready', reviewReadyAt: new Date().toISOString() } as any);
  }

  async approveForFutureUse(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    return this.update(id, { verdictStatus: 'approved_for_future_use', approvedForFutureUseAt: new Date().toISOString() } as any);
  }

  async suppress(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    return this.update(id, { verdictStatus: 'suppressed', suppressedAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    return this.update(id, { verdictStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    return this.update(id, { verdictStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionReadinessVerdict {
    return {
      ...data,
      verdictDetailsJson: parseJsonField(data.verdictDetailsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      reviewReadyAt: toDateString(data.reviewReadyAt),
      approvedForFutureUseAt: toDateString(data.approvedForFutureUseAt),
      suppressedAt: toDateString(data.suppressedAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionReadinessVerdict;
  }
}

export class PrismaSimulationSummaryRepository implements ISimulationSummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionSimulationSummary>): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    const created = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary | null> {
    const found = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.findUnique({ where: { simulationSummaryId: id } });
    return found ? this.fromPrisma(found) : null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.findMany({ where: { schoolId, teacherRef } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.findMany({ where: { schoolId, resultRecoveryPlanId } });
    return records.map(r => this.fromPrisma(r));
  }

  async listByStatus(schoolId: string, summaryStatus: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.findMany({ where: { schoolId, summaryStatus } });
    return records.map(r => this.fromPrisma(r));
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationSummary>): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    const updated = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.update({
      where: { simulationSummaryId: id },
      data: this.toPrisma(data),
    });
    return this.fromPrisma(updated);
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    return this.update(id, { summaryStatus: status } as any);
  }

  async refresh(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    const existing = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.findUnique({ where: { simulationSummaryId: id } });
    if (!existing) throw new Error(`SimulationSummary ${id} not found`);
    const updated = await this.prisma.recoveryOutcomeExecutionSimulationSummaryRecord.update({
      where: { simulationSummaryId: id },
      data: { summaryStatus: 'active', refreshedAt: new Date(), updatedAt: new Date() } as any,
    });
    return this.fromPrisma(updated);
  }

  async markStale(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    return this.update(id, { summaryStatus: 'stale', staleAt: new Date().toISOString() } as any);
  }

  async block(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    return this.update(id, { summaryStatus: 'blocked', blockedAt: new Date().toISOString() } as any);
  }

  async void(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    return this.update(id, { summaryStatus: 'voided', voidedAt: new Date().toISOString() } as any);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionSimulationSummary {
    return {
      ...data,
      simulationCountsJson: parseJsonField(data.simulationCountsJson),
      topFindingsJson: parseJsonField(data.topFindingsJson),
      nextStepsJson: parseJsonField(data.nextStepsJson),
      sourceRefsJson: parseJsonField(data.sourceRefsJson),
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      refreshedAt: toDateString(data.refreshedAt),
      staleAt: toDateString(data.staleAt),
      blockedAt: toDateString(data.blockedAt),
      voidedAt: toDateString(data.voidedAt),
    } as RecoveryOutcomeExecutionSimulationSummary;
  }
}

export class PrismaSimulationAuditRepository implements ISimulationAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Partial<RecoveryOutcomeExecutionSimulationAuditRecord>): Promise<RecoveryOutcomeExecutionSimulationAuditRecord> {
    const created = await this.prisma.recoveryOutcomeExecutionSimulationAuditRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationAuditRecord[]> {
    const records = await this.prisma.recoveryOutcomeExecutionSimulationAuditRecord.findMany({ where: { schoolId } });
    return records.map(r => this.fromPrisma(r));
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionSimulationAuditRecord {
    return {
      ...data,
      reasonCodesJson: parseJsonField(data.reasonCodesJson),
      metadataJson: parseJsonField(data.metadataJson),
      createdAt: toDateString(data.createdAt) || '',
    } as RecoveryOutcomeExecutionSimulationAuditRecord;
  }
}

export class PrismaSimulationIdempotencyRepository implements ISimulationIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async findByIdempotencyKey(
    schoolId: string,
    operation: string,
    idempotencyKey: string
  ): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord | null> {
    const found = await this.prisma.recoveryOutcomeExecutionSimulationIdempotencyRecord.findFirst({
      where: { schoolId, operation, idempotencyKey },
    });
    return found ? this.fromPrisma(found) : null;
  }

  async create(data: Partial<RecoveryOutcomeExecutionSimulationIdempotencyRecord>): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord> {
    const created = await this.prisma.recoveryOutcomeExecutionSimulationIdempotencyRecord.create({ data: this.toPrisma(data) });
    return this.fromPrisma(created);
  }

  async markCompleted(id: string, resourceType: string, resourceId: string, safeResultSummary: string): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord> {
    const updated = await this.prisma.recoveryOutcomeExecutionSimulationIdempotencyRecord.update({
      where: { simulationIdempotencyId: id },
      data: { status: 'completed', resourceType, resourceId, safeResultSummary } as any,
    });
    return this.fromPrisma(updated);
  }

  async markFailed(id: string, safeResultSummary: string): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord> {
    const updated = await this.prisma.recoveryOutcomeExecutionSimulationIdempotencyRecord.update({
      where: { simulationIdempotencyId: id },
      data: { status: 'failed', safeResultSummary } as any,
    });
    return this.fromPrisma(updated);
  }

  private toPrisma(data: any): any {
    const { ...rest } = data;
    return rest;
  }

  private fromPrisma(data: any): RecoveryOutcomeExecutionSimulationIdempotencyRecord {
    return {
      ...data,
      createdAt: toDateString(data.createdAt) || '',
      updatedAt: toDateString(data.updatedAt) || '',
      expiresAt: toDateString(data.expiresAt),
    } as RecoveryOutcomeExecutionSimulationIdempotencyRecord;
  }
}
