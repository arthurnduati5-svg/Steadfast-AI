import { randomUUID } from 'crypto';
import type { ResultLearningEvidenceBridge } from '../contracts/resultEvidenceBridgeContracts';
import type { ResultMasteryMutationPlan, ResultMasteryMutationEvent } from '../contracts/masteryMutationContracts';
import type { ResultObjectiveMasteryImpact } from '../contracts/objectiveImpactContracts';
import type { ResultRevisionSignal, ResultGrowthSignal } from '../contracts/revisionGrowthSignalContracts';
import type {
  ResultLearningEvidenceAuditEvent,
  ResultLearningEvidenceIdempotencyEntry,
  ResultLearningEvidenceBridgeRepository,
  ResultMasteryMutationPlanRepository,
  ResultMasteryMutationEventRepository,
  ResultObjectiveMasteryImpactRepository,
  ResultRevisionSignalRepository,
  ResultGrowthSignalRepository,
  ResultLearningEvidenceAuditRepository,
  ResultLearningEvidenceIdempotencyRepository,
} from '../contracts/resultLearningEvidenceRepositoryContracts';

export class InMemoryResultLearningEvidenceBridgeRepository implements ResultLearningEvidenceBridgeRepository {
  private store = new Map<string, ResultLearningEvidenceBridge>();

  async create(bridge: ResultLearningEvidenceBridge): Promise<ResultLearningEvidenceBridge> {
    const id = bridge.resultLearningEvidenceBridgeId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultLearningEvidenceBridge = { ...bridge, resultLearningEvidenceBridgeId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(bridgeId: string): Promise<ResultLearningEvidenceBridge | null> {
    return this.store.get(bridgeId) || null;
  }

  async listBySchool(schoolId: string): Promise<ResultLearningEvidenceBridge[]> {
    return Array.from(this.store.values()).filter(b => b.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultLearningEvidenceBridge[]> {
    return Array.from(this.store.values()).filter(b => b.schoolId === schoolId && b.studentRef === studentRef);
  }

  async listByFinalizationDecisionId(resultFinalizationDecisionId: string): Promise<ResultLearningEvidenceBridge[]> {
    return Array.from(this.store.values()).filter(b => b.resultFinalizationDecisionId === resultFinalizationDecisionId);
  }

  async updateStatus(bridgeId: string, status: string, safeSummary?: string): Promise<ResultLearningEvidenceBridge | null> {
    const existing = this.store.get(bridgeId);
    if (!existing) return null;
    const updated = { ...existing, bridgeStatus: status, updatedAt: new Date().toISOString() };
    if (safeSummary !== undefined) updated.safeEvidenceSummary = safeSummary;
    if (status === 'completed') updated.completedAt = new Date().toISOString();
    if (status === 'blocked') updated.blockedAt = new Date().toISOString();
    if (status === 'cancelled') updated.cancelledAt = new Date().toISOString();
    this.store.set(bridgeId, updated);
    return updated;
  }

  async update(bridgeId: string, updates: Partial<ResultLearningEvidenceBridge>): Promise<ResultLearningEvidenceBridge | null> {
    const existing = this.store.get(bridgeId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.store.set(bridgeId, updated);
    return updated;
  }
}

export class InMemoryResultMasteryMutationPlanRepository implements ResultMasteryMutationPlanRepository {
  private store = new Map<string, ResultMasteryMutationPlan>();

  async create(plan: ResultMasteryMutationPlan): Promise<ResultMasteryMutationPlan> {
    const id = plan.resultMasteryMutationPlanId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultMasteryMutationPlan = { ...plan, resultMasteryMutationPlanId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(planId: string): Promise<ResultMasteryMutationPlan | null> {
    return this.store.get(planId) || null;
  }

  async listBySchool(schoolId: string): Promise<ResultMasteryMutationPlan[]> {
    return Array.from(this.store.values()).filter(p => p.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultMasteryMutationPlan[]> {
    return Array.from(this.store.values()).filter(p => p.schoolId === schoolId && p.studentRef === studentRef);
  }

  async listByBridge(bridgeId: string): Promise<ResultMasteryMutationPlan[]> {
    return Array.from(this.store.values()).filter(p => p.resultLearningEvidenceBridgeId === bridgeId);
  }

  async updateStatus(planId: string, status: string, safeSummary?: string): Promise<ResultMasteryMutationPlan | null> {
    const existing = this.store.get(planId);
    if (!existing) return null;
    const updated = { ...existing, planStatus: status, updatedAt: new Date().toISOString() };
    if (safeSummary !== undefined) updated.safePlanSummary = safeSummary;
    if (status === 'approved') updated.approvedAt = new Date().toISOString();
    if (status === 'blocked') updated.blockedAt = new Date().toISOString();
    if (status === 'cancelled') updated.cancelledAt = new Date().toISOString();
    this.store.set(planId, updated);
    return updated;
  }

  async update(planId: string, updates: Partial<ResultMasteryMutationPlan>): Promise<ResultMasteryMutationPlan | null> {
    const existing = this.store.get(planId);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.store.set(planId, updated);
    return updated;
  }
}

export class InMemoryResultMasteryMutationEventRepository implements ResultMasteryMutationEventRepository {
  private store = new Map<string, ResultMasteryMutationEvent>();

  async create(event: ResultMasteryMutationEvent): Promise<ResultMasteryMutationEvent> {
    const id = event.resultMasteryMutationEventId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultMasteryMutationEvent = { ...event, resultMasteryMutationEventId: id, createdAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(eventId: string): Promise<ResultMasteryMutationEvent | null> {
    return this.store.get(eventId) || null;
  }

  async listByPlan(planId: string): Promise<ResultMasteryMutationEvent[]> {
    return Array.from(this.store.values()).filter(e => e.resultMasteryMutationPlanId === planId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultMasteryMutationEvent[]> {
    return Array.from(this.store.values()).filter(e => e.schoolId === schoolId && e.studentRef === studentRef);
  }

  async updateStatus(eventId: string, status: string): Promise<ResultMasteryMutationEvent | null> {
    const existing = this.store.get(eventId);
    if (!existing) return null;
    const updated = { ...existing, mutationStatus: status, updatedAt: new Date().toISOString() };
    if (status === 'applied') updated.appliedAt = new Date().toISOString();
    if (status === 'void') updated.voidedAt = new Date().toISOString();
    this.store.set(eventId, updated);
    return updated;
  }
}

export class InMemoryResultObjectiveMasteryImpactRepository implements ResultObjectiveMasteryImpactRepository {
  private store = new Map<string, ResultObjectiveMasteryImpact>();

  async create(impact: ResultObjectiveMasteryImpact): Promise<ResultObjectiveMasteryImpact> {
    const id = impact.resultObjectiveMasteryImpactId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultObjectiveMasteryImpact = { ...impact, resultObjectiveMasteryImpactId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(impactId: string): Promise<ResultObjectiveMasteryImpact | null> {
    return this.store.get(impactId) || null;
  }

  async listByBridge(bridgeId: string): Promise<ResultObjectiveMasteryImpact[]> {
    return Array.from(this.store.values()).filter(i => i.resultLearningEvidenceBridgeId === bridgeId);
  }

  async listByPlan(planId: string): Promise<ResultObjectiveMasteryImpact[]> {
    return Array.from(this.store.values()).filter(i => i.resultMasteryMutationPlanId === planId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultObjectiveMasteryImpact[]> {
    return Array.from(this.store.values()).filter(i => i.schoolId === schoolId && i.studentRef === studentRef);
  }

  async listByObjective(learningObjectiveId: string): Promise<ResultObjectiveMasteryImpact[]> {
    return Array.from(this.store.values()).filter(i => i.learningObjectiveId === learningObjectiveId);
  }

  async updateStatus(impactId: string, status: string): Promise<ResultObjectiveMasteryImpact | null> {
    const existing = this.store.get(impactId);
    if (!existing) return null;
    const updated = { ...existing, impactStatus: status, updatedAt: new Date().toISOString() };
    this.store.set(impactId, updated);
    return updated;
  }

  async voidImpact(impactId: string, voidedAt: string): Promise<ResultObjectiveMasteryImpact | null> {
    const existing = this.store.get(impactId);
    if (!existing) return null;
    const updated = { ...existing, impactStatus: 'void', voidedAt, updatedAt: new Date().toISOString() };
    this.store.set(impactId, updated);
    return updated;
  }
}

export class InMemoryResultRevisionSignalRepository implements ResultRevisionSignalRepository {
  private store = new Map<string, ResultRevisionSignal>();

  async create(signal: ResultRevisionSignal): Promise<ResultRevisionSignal> {
    const id = signal.resultRevisionSignalId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultRevisionSignal = { ...signal, resultRevisionSignalId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(signalId: string): Promise<ResultRevisionSignal | null> {
    return this.store.get(signalId) || null;
  }

  async listByPlan(planId: string): Promise<ResultRevisionSignal[]> {
    return Array.from(this.store.values()).filter(s => s.resultMasteryMutationPlanId === planId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRevisionSignal[]> {
    return Array.from(this.store.values()).filter(s => s.schoolId === schoolId && s.studentRef === studentRef);
  }

  async listByBridge(bridgeId: string): Promise<ResultRevisionSignal[]> {
    return Array.from(this.store.values()).filter(s => s.resultLearningEvidenceBridgeId === bridgeId);
  }

  async updateStatus(signalId: string, status: string): Promise<ResultRevisionSignal | null> {
    const existing = this.store.get(signalId);
    if (!existing) return null;
    const updated = { ...existing, signalStatus: status, updatedAt: new Date().toISOString() };
    if (status === 'dispatched') updated.dispatchedAt = new Date().toISOString();
    if (status === 'blocked') updated.blockedAt = new Date().toISOString();
    if (status === 'void') updated.voidedAt = new Date().toISOString();
    this.store.set(signalId, updated);
    return updated;
  }
}

export class InMemoryResultGrowthSignalRepository implements ResultGrowthSignalRepository {
  private store = new Map<string, ResultGrowthSignal>();

  async create(signal: ResultGrowthSignal): Promise<ResultGrowthSignal> {
    const id = signal.resultGrowthSignalId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultGrowthSignal = { ...signal, resultGrowthSignalId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getById(signalId: string): Promise<ResultGrowthSignal | null> {
    return this.store.get(signalId) || null;
  }

  async listByPlan(planId: string): Promise<ResultGrowthSignal[]> {
    return Array.from(this.store.values()).filter(s => s.resultMasteryMutationPlanId === planId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultGrowthSignal[]> {
    return Array.from(this.store.values()).filter(s => s.schoolId === schoolId && s.studentRef === studentRef);
  }

  async listByBridge(bridgeId: string): Promise<ResultGrowthSignal[]> {
    return Array.from(this.store.values()).filter(s => s.resultLearningEvidenceBridgeId === bridgeId);
  }

  async updateStatus(signalId: string, status: string): Promise<ResultGrowthSignal | null> {
    const existing = this.store.get(signalId);
    if (!existing) return null;
    const updated = { ...existing, signalStatus: status, updatedAt: new Date().toISOString() };
    if (status === 'dispatched') updated.dispatchedAt = new Date().toISOString();
    if (status === 'blocked') updated.blockedAt = new Date().toISOString();
    if (status === 'void') updated.voidedAt = new Date().toISOString();
    this.store.set(signalId, updated);
    return updated;
  }
}

export class InMemoryResultLearningEvidenceAuditRepository implements ResultLearningEvidenceAuditRepository {
  private store = new Map<string, ResultLearningEvidenceAuditEvent>();

  async create(event: ResultLearningEvidenceAuditEvent): Promise<ResultLearningEvidenceAuditEvent> {
    const id = event.resultLearningEvidenceAuditId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultLearningEvidenceAuditEvent = { ...event, resultLearningEvidenceAuditId: id, createdAt: now };
    this.store.set(id, record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<ResultLearningEvidenceAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.schoolId === schoolId);
  }

  async listByBridge(bridgeId: string): Promise<ResultLearningEvidenceAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.resultLearningEvidenceBridgeId === bridgeId);
  }

  async listByPlan(planId: string): Promise<ResultLearningEvidenceAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.resultMasteryMutationPlanId === planId);
  }
}

export class InMemoryResultLearningEvidenceIdempotencyRepository implements ResultLearningEvidenceIdempotencyRepository {
  private store = new Map<string, ResultLearningEvidenceIdempotencyEntry>();

  async create(entry: ResultLearningEvidenceIdempotencyEntry): Promise<ResultLearningEvidenceIdempotencyEntry> {
    const id = entry.resultLearningEvidenceIdempotencyId || randomUUID();
    const now = new Date().toISOString();
    const record: ResultLearningEvidenceIdempotencyEntry = { ...entry, resultLearningEvidenceIdempotencyId: id, createdAt: now, updatedAt: now };
    this.store.set(id, record);
    return record;
  }

  async getByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultLearningEvidenceIdempotencyEntry | null> {
    return Array.from(this.store.values()).find(e => e.schoolId === schoolId && e.operation === operation && e.idempotencyKey === idempotencyKey) || null;
  }

  async updateStatus(id: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<ResultLearningEvidenceIdempotencyEntry | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    if (resourceType) updated.resourceType = resourceType;
    if (resourceId) updated.resourceId = resourceId;
    if (safeResultSummary) updated.safeResultSummary = safeResultSummary;
    this.store.set(id, updated);
    return updated;
  }

  async expireEntry(id: string, expiresAt: string): Promise<ResultLearningEvidenceIdempotencyEntry | null> {
    const existing = this.store.get(id);
    if (!existing) return null;
    const updated = { ...existing, status: 'expired', expiresAt, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }

  async listBySchool(schoolId: string): Promise<ResultLearningEvidenceIdempotencyEntry[]> {
    return Array.from(this.store.values()).filter(e => e.schoolId === schoolId);
  }
}
