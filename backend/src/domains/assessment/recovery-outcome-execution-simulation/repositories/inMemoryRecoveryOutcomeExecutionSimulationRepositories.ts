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
import { v4 as uuid } from 'uuid';

export class InMemorySimulationReadinessRepository implements ISimulationReadinessRepository {
  private store = new Map<string, RecoveryOutcomeExecutionSimulationReadiness>();

  async create(data: Partial<RecoveryOutcomeExecutionSimulationReadiness>): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    const record: RecoveryOutcomeExecutionSimulationReadiness = {
      ...data as RecoveryOutcomeExecutionSimulationReadiness,
      simulationReadinessId: data.simulationReadinessId || uuid(),
    };
    this.store.set(record.simulationReadinessId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationReadiness | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByStatus(schoolId: string, readinessStatus: string): Promise<RecoveryOutcomeExecutionSimulationReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.readinessStatus === readinessStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationReadiness>): Promise<RecoveryOutcomeExecutionSimulationReadiness> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`SimulationReadiness ${id} not found`);
    const updated: RecoveryOutcomeExecutionSimulationReadiness = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemorySimulationPlanRepository implements ISimulationPlanRepository {
  private store = new Map<string, RecoveryOutcomeExecutionSimulationPlan>();

  async create(data: Partial<RecoveryOutcomeExecutionSimulationPlan>): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    const record: RecoveryOutcomeExecutionSimulationPlan = {
      ...data as RecoveryOutcomeExecutionSimulationPlan,
      simulationPlanId: data.simulationPlanId || uuid(),
    };
    this.store.set(record.simulationPlanId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationPlan | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByStatus(schoolId: string, planStatus: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.planStatus === planStatus);
  }

  async listByActionBundleId(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.recoveryOutcomeActionBundleId === bundleId);
  }

  async listBySimulationPlanId(schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.simulationPlanId === simulationPlanId);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationPlan>): Promise<RecoveryOutcomeExecutionSimulationPlan> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`SimulationPlan ${id} not found`);
    const updated: RecoveryOutcomeExecutionSimulationPlan = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemorySimulationRunRepository implements ISimulationRunRepository {
  private store = new Map<string, RecoveryOutcomeExecutionSimulationRun>();

  async create(data: Partial<RecoveryOutcomeExecutionSimulationRun>): Promise<RecoveryOutcomeExecutionSimulationRun> {
    const record: RecoveryOutcomeExecutionSimulationRun = {
      ...data as RecoveryOutcomeExecutionSimulationRun,
      simulationRunId: data.simulationRunId || uuid(),
    };
    this.store.set(record.simulationRunId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationRun | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByStatus(schoolId: string, runStatus: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.runStatus === runStatus);
  }

  async listByActionBundleId(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.recoveryOutcomeActionBundleId === bundleId);
  }

  async listBySimulationPlanId(schoolId: string, simulationPlanId: string): Promise<RecoveryOutcomeExecutionSimulationRun[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.simulationPlanId === simulationPlanId);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationRun>): Promise<RecoveryOutcomeExecutionSimulationRun> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`SimulationRun ${id} not found`);
    const updated: RecoveryOutcomeExecutionSimulationRun = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemorySimulationStepRepository implements ISimulationStepRepository {
  private store = new Map<string, RecoveryOutcomeExecutionSimulationStep>();

  async create(data: Partial<RecoveryOutcomeExecutionSimulationStep>): Promise<RecoveryOutcomeExecutionSimulationStep> {
    const record: RecoveryOutcomeExecutionSimulationStep = {
      ...data as RecoveryOutcomeExecutionSimulationStep,
      simulationStepId: data.simulationStepId || uuid(),
    };
    this.store.set(record.simulationStepId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationStep | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationStep[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listStepsForSimulationRun(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationStep[]> {
    return Array.from(this.store.values()).filter(r => r.simulationRunId === simulationRunId);
  }

  async listByStatus(schoolId: string, stepStatus: string): Promise<RecoveryOutcomeExecutionSimulationStep[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.stepStatus === stepStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationStep>): Promise<RecoveryOutcomeExecutionSimulationStep> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`SimulationStep ${id} not found`);
    const updated: RecoveryOutcomeExecutionSimulationStep = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryEligibilityCheckRepository implements IEligibilityCheckRepository {
  private store = new Map<string, RecoveryOutcomeExecutionEligibilityCheck>();

  async create(data: Partial<RecoveryOutcomeExecutionEligibilityCheck>): Promise<RecoveryOutcomeExecutionEligibilityCheck> {
    const record: RecoveryOutcomeExecutionEligibilityCheck = {
      ...data as RecoveryOutcomeExecutionEligibilityCheck,
      eligibilityCheckId: data.eligibilityCheckId || uuid(),
    };
    this.store.set(record.eligibilityCheckId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionEligibilityCheck | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByActionBundleId(schoolId: string, bundleId: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.recoveryOutcomeActionBundleId === bundleId);
  }

  async listByResult(schoolId: string, eligibilityStatus: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.eligibilityStatus === eligibilityStatus);
  }

  async listByStatus(schoolId: string, eligibilityStatus: string): Promise<RecoveryOutcomeExecutionEligibilityCheck[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.eligibilityStatus === eligibilityStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionEligibilityCheck>): Promise<RecoveryOutcomeExecutionEligibilityCheck> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`EligibilityCheck ${id} not found`);
    const updated: RecoveryOutcomeExecutionEligibilityCheck = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryBlockedActionDiagnosticRepository implements IBlockedActionDiagnosticRepository {
  private store = new Map<string, RecoveryOutcomeExecutionBlockedActionDiagnostic>();

  async create(data: Partial<RecoveryOutcomeExecutionBlockedActionDiagnostic>): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic> {
    const record: RecoveryOutcomeExecutionBlockedActionDiagnostic = {
      ...data as RecoveryOutcomeExecutionBlockedActionDiagnostic,
      blockedActionDiagnosticId: data.blockedActionDiagnosticId || uuid(),
    };
    this.store.set(record.blockedActionDiagnosticId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    return Array.from(this.store.values()).filter(r => r.simulationRunId === simulationRunId);
  }

  async listByReason(schoolId: string, reasonCode: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.blockedReasonCodesJson.includes(reasonCode));
  }

  async listByStatus(schoolId: string, diagnosticStatus: string): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.diagnosticStatus === diagnosticStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionBlockedActionDiagnostic>): Promise<RecoveryOutcomeExecutionBlockedActionDiagnostic> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`BlockedActionDiagnostic ${id} not found`);
    const updated: RecoveryOutcomeExecutionBlockedActionDiagnostic = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryFailureInjectionRepository implements IFailureInjectionRepository {
  private store = new Map<string, RecoveryOutcomeExecutionFailureInjection>();

  async create(data: Partial<RecoveryOutcomeExecutionFailureInjection>): Promise<RecoveryOutcomeExecutionFailureInjection> {
    const record: RecoveryOutcomeExecutionFailureInjection = {
      ...data as RecoveryOutcomeExecutionFailureInjection,
      failureInjectionId: data.failureInjectionId || uuid(),
    };
    this.store.set(record.failureInjectionId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionFailureInjection | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByType(schoolId: string, injectionType: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.injectionType === injectionType);
  }

  async listByStatus(schoolId: string, injectionStatus: string): Promise<RecoveryOutcomeExecutionFailureInjection[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.injectionStatus === injectionStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionFailureInjection>): Promise<RecoveryOutcomeExecutionFailureInjection> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`FailureInjection ${id} not found`);
    const updated: RecoveryOutcomeExecutionFailureInjection = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemorySimulationResultRepository implements ISimulationResultRepository {
  private store = new Map<string, RecoveryOutcomeExecutionSimulationResult>();

  async create(data: Partial<RecoveryOutcomeExecutionSimulationResult>): Promise<RecoveryOutcomeExecutionSimulationResult> {
    const record: RecoveryOutcomeExecutionSimulationResult = {
      ...data as RecoveryOutcomeExecutionSimulationResult,
      simulationResultId: data.simulationResultId || uuid(),
    };
    this.store.set(record.simulationResultId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationResult | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    return Array.from(this.store.values()).filter(r => r.simulationRunId === simulationRunId);
  }

  async listByOutcome(schoolId: string, outcomeStatus: string): Promise<RecoveryOutcomeExecutionSimulationResult[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.outcomeStatus === outcomeStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationResult>): Promise<RecoveryOutcomeExecutionSimulationResult> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`SimulationResult ${id} not found`);
    const updated: RecoveryOutcomeExecutionSimulationResult = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryTeacherReviewRepository implements ITeacherReviewRepository {
  private store = new Map<string, RecoveryOutcomeExecutionTeacherReview>();

  async create(data: Partial<RecoveryOutcomeExecutionTeacherReview>): Promise<RecoveryOutcomeExecutionTeacherReview> {
    const record: RecoveryOutcomeExecutionTeacherReview = {
      ...data as RecoveryOutcomeExecutionTeacherReview,
      teacherSimulationReviewId: data.teacherSimulationReviewId || uuid(),
    };
    this.store.set(record.teacherSimulationReviewId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionTeacherReview | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    return Array.from(this.store.values()).filter(r => r.simulationRunId === simulationRunId);
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.teacherRef === teacherRef);
  }

  async listByStatus(schoolId: string, reviewStatus: string): Promise<RecoveryOutcomeExecutionTeacherReview[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.reviewStatus === reviewStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionTeacherReview>): Promise<RecoveryOutcomeExecutionTeacherReview> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`TeacherReview ${id} not found`);
    const updated: RecoveryOutcomeExecutionTeacherReview = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryStudentPreviewDraftRepository implements IStudentPreviewDraftRepository {
  private store = new Map<string, RecoveryOutcomeExecutionStudentPreviewDraft>();

  async create(data: Partial<RecoveryOutcomeExecutionStudentPreviewDraft>): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    const record: RecoveryOutcomeExecutionStudentPreviewDraft = {
      ...data as RecoveryOutcomeExecutionStudentPreviewDraft,
      studentPreviewDraftId: data.studentPreviewDraftId || uuid(),
    };
    this.store.set(record.studentPreviewDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryOutcomeExecutionStudentPreviewDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === draftStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionStudentPreviewDraft>): Promise<RecoveryOutcomeExecutionStudentPreviewDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`StudentPreviewDraft ${id} not found`);
    const updated: RecoveryOutcomeExecutionStudentPreviewDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryParentPreviewDraftRepository implements IParentPreviewDraftRepository {
  private store = new Map<string, RecoveryOutcomeExecutionParentPreviewDraft>();

  async create(data: Partial<RecoveryOutcomeExecutionParentPreviewDraft>): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    const record: RecoveryOutcomeExecutionParentPreviewDraft = {
      ...data as RecoveryOutcomeExecutionParentPreviewDraft,
      parentPreviewDraftId: data.parentPreviewDraftId || uuid(),
    };
    this.store.set(record.parentPreviewDraftId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByStatus(schoolId: string, draftStatus: string): Promise<RecoveryOutcomeExecutionParentPreviewDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === draftStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionParentPreviewDraft>): Promise<RecoveryOutcomeExecutionParentPreviewDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ParentPreviewDraft ${id} not found`);
    const updated: RecoveryOutcomeExecutionParentPreviewDraft = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemoryReadinessVerdictRepository implements IReadinessVerdictRepository {
  private store = new Map<string, RecoveryOutcomeExecutionReadinessVerdict>();

  async create(data: Partial<RecoveryOutcomeExecutionReadinessVerdict>): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    const record: RecoveryOutcomeExecutionReadinessVerdict = {
      ...data as RecoveryOutcomeExecutionReadinessVerdict,
      readinessVerdictId: data.readinessVerdictId || uuid(),
    };
    this.store.set(record.readinessVerdictId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionReadinessVerdict | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listBySimulationRunId(simulationRunId: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    return Array.from(this.store.values()).filter(r => r.simulationRunId === simulationRunId);
  }

  async listByStatus(schoolId: string, verdictStatus: string): Promise<RecoveryOutcomeExecutionReadinessVerdict[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.verdictStatus === verdictStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionReadinessVerdict>): Promise<RecoveryOutcomeExecutionReadinessVerdict> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`ReadinessVerdict ${id} not found`);
    const updated: RecoveryOutcomeExecutionReadinessVerdict = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemorySimulationSummaryRepository implements ISimulationSummaryRepository {
  private store = new Map<string, RecoveryOutcomeExecutionSimulationSummary>();

  async create(data: Partial<RecoveryOutcomeExecutionSimulationSummary>): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    const record: RecoveryOutcomeExecutionSimulationSummary = {
      ...data as RecoveryOutcomeExecutionSimulationSummary,
      simulationSummaryId: data.simulationSummaryId || uuid(),
    };
    this.store.set(record.simulationSummaryId, record);
    return record;
  }

  async getById(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary | null> {
    return this.store.get(id) ?? null;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.teacherRef === teacherRef);
  }

  async listByPlanId(schoolId: string, resultRecoveryPlanId: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === resultRecoveryPlanId);
  }

  async listByStatus(schoolId: string, summaryStatus: string): Promise<RecoveryOutcomeExecutionSimulationSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.summaryStatus === summaryStatus);
  }

  async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationSummary>): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`SimulationSummary ${id} not found`);
    const updated: RecoveryOutcomeExecutionSimulationSummary = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async updateStatus(id: string, status: string): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    return this.update(id, { summaryStatus: status } as any);
  }

  async refresh(id: string): Promise<RecoveryOutcomeExecutionSimulationSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`SimulationSummary ${id} not found`);
    const updated: RecoveryOutcomeExecutionSimulationSummary = {
      ...existing,
      summaryStatus: 'active' as any,
      refreshedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(id, updated);
    return updated;
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
}

export class InMemorySimulationAuditRepository implements ISimulationAuditRepository {
  private store = new Map<string, RecoveryOutcomeExecutionSimulationAuditRecord>();

  async create(data: Partial<RecoveryOutcomeExecutionSimulationAuditRecord>): Promise<RecoveryOutcomeExecutionSimulationAuditRecord> {
    const record: RecoveryOutcomeExecutionSimulationAuditRecord = {
      ...data as RecoveryOutcomeExecutionSimulationAuditRecord,
      simulationAuditEventId: data.simulationAuditEventId || uuid(),
    };
    this.store.set(record.simulationAuditEventId, record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<RecoveryOutcomeExecutionSimulationAuditRecord[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
}

export class InMemorySimulationIdempotencyRepository implements ISimulationIdempotencyRepository {
  private store = new Map<string, RecoveryOutcomeExecutionSimulationIdempotencyRecord>();

  async findByIdempotencyKey(
    schoolId: string,
    operation: string,
    idempotencyKey: string
  ): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord | null> {
    return Array.from(this.store.values())
      .find(r => r.schoolId === schoolId && r.operation === operation && r.idempotencyKey === idempotencyKey) ?? null;
  }

  async create(data: Partial<RecoveryOutcomeExecutionSimulationIdempotencyRecord>): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord> {
    const record: RecoveryOutcomeExecutionSimulationIdempotencyRecord = {
      ...data as RecoveryOutcomeExecutionSimulationIdempotencyRecord,
      simulationIdempotencyId: data.simulationIdempotencyId || uuid(),
    };
    this.store.set(record.simulationIdempotencyId, record);
    return record;
  }

  async markCompleted(id: string, resourceType: string, resourceId: string, safeResultSummary: string): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord> {
    return this.update(id, { status: 'completed', resourceType, resourceId, safeResultSummary } as any);
  }

  async markFailed(id: string, safeResultSummary: string): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord> {
    return this.update(id, { status: 'failed', safeResultSummary } as any);
  }

  private async update(id: string, data: Partial<RecoveryOutcomeExecutionSimulationIdempotencyRecord>): Promise<RecoveryOutcomeExecutionSimulationIdempotencyRecord> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`SimulationIdempotencyRecord ${id} not found`);
    const updated: RecoveryOutcomeExecutionSimulationIdempotencyRecord = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}
