import type { ResultLearningEvidenceBridge } from './resultEvidenceBridgeContracts';
import type { ResultMasteryMutationPlan, ResultMasteryMutationEvent } from './masteryMutationContracts';
import type { ResultObjectiveMasteryImpact } from './objectiveImpactContracts';
import type { ResultRevisionSignal, ResultGrowthSignal } from './revisionGrowthSignalContracts';

export interface ResultLearningEvidenceAuditEvent {
  resultLearningEvidenceAuditId?: string;
  schoolId: string;
  resultLearningEvidenceBridgeId?: string;
  resultMasteryMutationPlanId?: string;
  resultMasteryMutationEventId?: string;
  resultObjectiveMasteryImpactId?: string;
  resultRevisionSignalId?: string;
  resultGrowthSignalId?: string;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson?: Record<string, unknown>;
  metadataJson?: Record<string, unknown>;
  requestId?: string;
  correlationId?: string;
  createdAt?: string;
}

export interface ResultLearningEvidenceIdempotencyEntry {
  resultLearningEvidenceIdempotencyId?: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType?: string;
  resourceId?: string;
  safeResultSummary?: string;
  createdAt?: string;
  updatedAt?: string;
  expiresAt?: string;
}

export interface ResultLearningEvidenceBridgeRepository {
  create(bridge: ResultLearningEvidenceBridge): Promise<ResultLearningEvidenceBridge>;
  getById(bridgeId: string): Promise<ResultLearningEvidenceBridge | null>;
  listBySchool(schoolId: string): Promise<ResultLearningEvidenceBridge[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultLearningEvidenceBridge[]>;
  listByFinalizationDecisionId(resultFinalizationDecisionId: string): Promise<ResultLearningEvidenceBridge[]>;
  updateStatus(bridgeId: string, status: string, safeSummary?: string): Promise<ResultLearningEvidenceBridge | null>;
  update(bridgeId: string, updates: Partial<ResultLearningEvidenceBridge>): Promise<ResultLearningEvidenceBridge | null>;
}

export interface ResultMasteryMutationPlanRepository {
  create(plan: ResultMasteryMutationPlan): Promise<ResultMasteryMutationPlan>;
  getById(planId: string): Promise<ResultMasteryMutationPlan | null>;
  listBySchool(schoolId: string): Promise<ResultMasteryMutationPlan[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultMasteryMutationPlan[]>;
  listByBridge(bridgeId: string): Promise<ResultMasteryMutationPlan[]>;
  updateStatus(planId: string, status: string, safeSummary?: string): Promise<ResultMasteryMutationPlan | null>;
  update(planId: string, updates: Partial<ResultMasteryMutationPlan>): Promise<ResultMasteryMutationPlan | null>;
}

export interface ResultMasteryMutationEventRepository {
  create(event: ResultMasteryMutationEvent): Promise<ResultMasteryMutationEvent>;
  getById(eventId: string): Promise<ResultMasteryMutationEvent | null>;
  listByPlan(planId: string): Promise<ResultMasteryMutationEvent[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultMasteryMutationEvent[]>;
  updateStatus(eventId: string, status: string): Promise<ResultMasteryMutationEvent | null>;
}

export interface ResultObjectiveMasteryImpactRepository {
  create(impact: ResultObjectiveMasteryImpact): Promise<ResultObjectiveMasteryImpact>;
  getById(impactId: string): Promise<ResultObjectiveMasteryImpact | null>;
  listByBridge(bridgeId: string): Promise<ResultObjectiveMasteryImpact[]>;
  listByPlan(planId: string): Promise<ResultObjectiveMasteryImpact[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultObjectiveMasteryImpact[]>;
  listByObjective(learningObjectiveId: string): Promise<ResultObjectiveMasteryImpact[]>;
  updateStatus(impactId: string, status: string): Promise<ResultObjectiveMasteryImpact | null>;
  voidImpact(impactId: string, voidedAt: string): Promise<ResultObjectiveMasteryImpact | null>;
}

export interface ResultRevisionSignalRepository {
  create(signal: ResultRevisionSignal): Promise<ResultRevisionSignal>;
  getById(signalId: string): Promise<ResultRevisionSignal | null>;
  listByPlan(planId: string): Promise<ResultRevisionSignal[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRevisionSignal[]>;
  listByBridge(bridgeId: string): Promise<ResultRevisionSignal[]>;
  updateStatus(signalId: string, status: string): Promise<ResultRevisionSignal | null>;
}

export interface ResultGrowthSignalRepository {
  create(signal: ResultGrowthSignal): Promise<ResultGrowthSignal>;
  getById(signalId: string): Promise<ResultGrowthSignal | null>;
  listByPlan(planId: string): Promise<ResultGrowthSignal[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultGrowthSignal[]>;
  listByBridge(bridgeId: string): Promise<ResultGrowthSignal[]>;
  updateStatus(signalId: string, status: string): Promise<ResultGrowthSignal | null>;
}

export interface ResultLearningEvidenceAuditRepository {
  create(event: ResultLearningEvidenceAuditEvent): Promise<ResultLearningEvidenceAuditEvent>;
  listBySchool(schoolId: string): Promise<ResultLearningEvidenceAuditEvent[]>;
  listByBridge(bridgeId: string): Promise<ResultLearningEvidenceAuditEvent[]>;
  listByPlan(planId: string): Promise<ResultLearningEvidenceAuditEvent[]>;
}

export interface ResultLearningEvidenceIdempotencyRepository {
  create(entry: ResultLearningEvidenceIdempotencyEntry): Promise<ResultLearningEvidenceIdempotencyEntry>;
  getByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultLearningEvidenceIdempotencyEntry | null>;
  updateStatus(id: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<ResultLearningEvidenceIdempotencyEntry | null>;
  expireEntry(id: string, expiresAt: string): Promise<ResultLearningEvidenceIdempotencyEntry | null>;
  listBySchool(schoolId: string): Promise<ResultLearningEvidenceIdempotencyEntry[]>;
}
