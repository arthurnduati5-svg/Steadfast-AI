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
import { prisma } from '../../../../lib/prisma';

function mapBridgeFromPrisma(row: any): ResultLearningEvidenceBridge {
  return {
    resultLearningEvidenceBridgeId: row.resultLearningEvidenceBridgeId,
    schoolId: row.schoolId,
    resultFinalizationDecisionId: row.resultFinalizationDecisionId,
    resultReleaseReadinessId: row.resultReleaseReadinessId,
    markingRunId: row.markingRunId || undefined,
    markingResultVersionId: row.markingResultVersionId,
    studentRef: row.studentRef,
    paperId: row.paperId || undefined,
    paperVersionId: row.paperVersionId || undefined,
    deliverySessionId: row.deliverySessionId || undefined,
    bridgeStatus: row.bridgeStatus,
    bridgeMode: row.bridgeMode,
    sourceRefsJson: row.sourceRefsJson || undefined,
    safeEvidenceSummary: row.safeEvidenceSummary,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    completedAt: row.completedAt?.toISOString() || undefined,
    blockedAt: row.blockedAt?.toISOString() || undefined,
    cancelledAt: row.cancelledAt?.toISOString() || undefined,
  };
}

function mapPlanFromPrisma(row: any): ResultMasteryMutationPlan {
  return {
    resultMasteryMutationPlanId: row.resultMasteryMutationPlanId,
    schoolId: row.schoolId,
    resultLearningEvidenceBridgeId: row.resultLearningEvidenceBridgeId,
    resultFinalizationDecisionId: row.resultFinalizationDecisionId,
    markingResultVersionId: row.markingResultVersionId,
    studentRef: row.studentRef,
    planStatus: row.planStatus,
    planMode: row.planMode,
    objectiveImpactRefsJson: row.objectiveImpactRefsJson || undefined,
    targetMasterySnapshotRefsJson: row.targetMasterySnapshotRefsJson || undefined,
    safePlanSummary: row.safePlanSummary,
    approvalRequired: row.approvalRequired,
    approvedByActorId: row.approvedByActorId || undefined,
    approvedByRole: row.approvedByRole || undefined,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    approvedAt: row.approvedAt?.toISOString() || undefined,
    blockedAt: row.blockedAt?.toISOString() || undefined,
    cancelledAt: row.cancelledAt?.toISOString() || undefined,
  };
}

function mapEventFromPrisma(row: any): ResultMasteryMutationEvent {
  return {
    resultMasteryMutationEventId: row.resultMasteryMutationEventId,
    schoolId: row.schoolId,
    resultMasteryMutationPlanId: row.resultMasteryMutationPlanId,
    resultLearningEvidenceBridgeId: row.resultLearningEvidenceBridgeId,
    studentRef: row.studentRef,
    targetSnapshotRef: row.targetSnapshotRef || undefined,
    mutationStatus: row.mutationStatus,
    mutationType: row.mutationType,
    beforeStateJson: row.beforeStateJson || undefined,
    afterStateJson: row.afterStateJson || undefined,
    deltaJson: row.deltaJson || undefined,
    safeMutationSummary: row.safeMutationSummary,
    appliedByActorId: row.appliedByActorId || undefined,
    appliedByRole: row.appliedByRole || undefined,
    createdAt: row.createdAt?.toISOString() || '',
    appliedAt: row.appliedAt?.toISOString() || undefined,
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapImpactFromPrisma(row: any): ResultObjectiveMasteryImpact {
  return {
    resultObjectiveMasteryImpactId: row.resultObjectiveMasteryImpactId,
    schoolId: row.schoolId,
    resultLearningEvidenceBridgeId: row.resultLearningEvidenceBridgeId,
    resultMasteryMutationPlanId: row.resultMasteryMutationPlanId,
    studentRef: row.studentRef,
    learningObjectiveId: row.learningObjectiveId,
    questionVersionId: row.questionVersionId || undefined,
    markingResultVersionId: row.markingResultVersionId,
    impactStatus: row.impactStatus,
    impactType: row.impactType,
    evidenceStrength: row.evidenceStrength,
    masteryDelta: row.masteryDelta,
    confidenceLevel: row.confidenceLevel,
    safeImpactSummary: row.safeImpactSummary,
    sourceRefsJson: row.sourceRefsJson || undefined,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapRevisionSignalFromPrisma(row: any): ResultRevisionSignal {
  return {
    resultRevisionSignalId: row.resultRevisionSignalId,
    schoolId: row.schoolId,
    resultLearningEvidenceBridgeId: row.resultLearningEvidenceBridgeId,
    resultMasteryMutationPlanId: row.resultMasteryMutationPlanId,
    studentRef: row.studentRef,
    learningObjectiveId: row.learningObjectiveId,
    signalStatus: row.signalStatus,
    signalType: row.signalType,
    priority: row.priority,
    safeSignalSummary: row.safeSignalSummary,
    recommendedActionRefsJson: row.recommendedActionRefsJson || undefined,
    sourceRefsJson: row.sourceRefsJson || undefined,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    dispatchedAt: row.dispatchedAt?.toISOString() || undefined,
    blockedAt: row.blockedAt?.toISOString() || undefined,
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapGrowthSignalFromPrisma(row: any): ResultGrowthSignal {
  return {
    resultGrowthSignalId: row.resultGrowthSignalId,
    schoolId: row.schoolId,
    resultLearningEvidenceBridgeId: row.resultLearningEvidenceBridgeId,
    resultMasteryMutationPlanId: row.resultMasteryMutationPlanId,
    studentRef: row.studentRef,
    learningObjectiveId: row.learningObjectiveId,
    signalStatus: row.signalStatus,
    signalType: row.signalType,
    safeGrowthSummary: row.safeGrowthSummary,
    growthMetricRefsJson: row.growthMetricRefsJson || undefined,
    sourceRefsJson: row.sourceRefsJson || undefined,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    dispatchedAt: row.dispatchedAt?.toISOString() || undefined,
    blockedAt: row.blockedAt?.toISOString() || undefined,
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

export class PrismaResultLearningEvidenceBridgeRepository implements ResultLearningEvidenceBridgeRepository {
  async create(bridge: ResultLearningEvidenceBridge): Promise<ResultLearningEvidenceBridge> {
    const row = await prisma.resultLearningEvidenceBridgeRecord.create({
      data: {
        resultLearningEvidenceBridgeId: bridge.resultLearningEvidenceBridgeId,
        schoolId: bridge.schoolId,
        resultFinalizationDecisionId: bridge.resultFinalizationDecisionId,
        resultReleaseReadinessId: bridge.resultReleaseReadinessId,
        markingRunId: bridge.markingRunId || null,
        markingResultVersionId: bridge.markingResultVersionId,
        studentRef: bridge.studentRef,
        paperId: bridge.paperId || null,
        paperVersionId: bridge.paperVersionId || null,
        deliverySessionId: bridge.deliverySessionId || null,
        bridgeStatus: bridge.bridgeStatus || 'draft',
        bridgeMode: bridge.bridgeMode || 'teacher_approved_result',
        sourceRefsJson: (bridge.sourceRefsJson as any) || undefined,
        safeEvidenceSummary: bridge.safeEvidenceSummary,
        createdByActorId: bridge.createdByActorId,
        createdByRole: bridge.createdByRole,
      },
    });
    return mapBridgeFromPrisma(row);
  }

  async getById(bridgeId: string): Promise<ResultLearningEvidenceBridge | null> {
    const row = await prisma.resultLearningEvidenceBridgeRecord.findUnique({ where: { resultLearningEvidenceBridgeId: bridgeId } });
    return row ? mapBridgeFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultLearningEvidenceBridge[]> {
    const rows = await prisma.resultLearningEvidenceBridgeRecord.findMany({ where: { schoolId } });
    return rows.map(mapBridgeFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultLearningEvidenceBridge[]> {
    const rows = await prisma.resultLearningEvidenceBridgeRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapBridgeFromPrisma);
  }

  async listByFinalizationDecisionId(resultFinalizationDecisionId: string): Promise<ResultLearningEvidenceBridge[]> {
    const rows = await prisma.resultLearningEvidenceBridgeRecord.findMany({ where: { resultFinalizationDecisionId } });
    return rows.map(mapBridgeFromPrisma);
  }

  async updateStatus(bridgeId: string, status: string, safeSummary?: string): Promise<ResultLearningEvidenceBridge | null> {
    const data: any = { bridgeStatus: status };
    if (safeSummary !== undefined) data.safeEvidenceSummary = safeSummary;
    if (status === 'completed') data.completedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'cancelled') data.cancelledAt = new Date();
    const row = await prisma.resultLearningEvidenceBridgeRecord.update({ where: { resultLearningEvidenceBridgeId: bridgeId }, data }).catch(() => null);
    return row ? mapBridgeFromPrisma(row) : null;
  }

  async update(bridgeId: string, updates: Partial<ResultLearningEvidenceBridge>): Promise<ResultLearningEvidenceBridge | null> {
    const row = await prisma.resultLearningEvidenceBridgeRecord.update({ where: { resultLearningEvidenceBridgeId: bridgeId }, data: updates as any }).catch(() => null);
    return row ? mapBridgeFromPrisma(row) : null;
  }
}

export class PrismaResultMasteryMutationPlanRepository implements ResultMasteryMutationPlanRepository {
  async create(plan: ResultMasteryMutationPlan): Promise<ResultMasteryMutationPlan> {
    const row = await prisma.resultMasteryMutationPlanRecord.create({ data: plan as any });
    return mapPlanFromPrisma(row);
  }

  async getById(planId: string): Promise<ResultMasteryMutationPlan | null> {
    const row = await prisma.resultMasteryMutationPlanRecord.findUnique({ where: { resultMasteryMutationPlanId: planId } });
    return row ? mapPlanFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultMasteryMutationPlan[]> {
    const rows = await prisma.resultMasteryMutationPlanRecord.findMany({ where: { schoolId } });
    return rows.map(mapPlanFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultMasteryMutationPlan[]> {
    const rows = await prisma.resultMasteryMutationPlanRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapPlanFromPrisma);
  }

  async listByBridge(bridgeId: string): Promise<ResultMasteryMutationPlan[]> {
    const rows = await prisma.resultMasteryMutationPlanRecord.findMany({ where: { resultLearningEvidenceBridgeId: bridgeId } });
    return rows.map(mapPlanFromPrisma);
  }

  async updateStatus(planId: string, status: string, safeSummary?: string): Promise<ResultMasteryMutationPlan | null> {
    const data: any = { planStatus: status };
    if (safeSummary !== undefined) data.safePlanSummary = safeSummary;
    if (status === 'approved') data.approvedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'cancelled') data.cancelledAt = new Date();
    const row = await prisma.resultMasteryMutationPlanRecord.update({ where: { resultMasteryMutationPlanId: planId }, data }).catch(() => null);
    return row ? mapPlanFromPrisma(row) : null;
  }

  async update(planId: string, updates: Partial<ResultMasteryMutationPlan>): Promise<ResultMasteryMutationPlan | null> {
    const row = await prisma.resultMasteryMutationPlanRecord.update({ where: { resultMasteryMutationPlanId: planId }, data: updates as any }).catch(() => null);
    return row ? mapPlanFromPrisma(row) : null;
  }
}

export class PrismaResultMasteryMutationEventRepository implements ResultMasteryMutationEventRepository {
  async create(event: ResultMasteryMutationEvent): Promise<ResultMasteryMutationEvent> {
    const row = await prisma.resultMasteryMutationEventRecord.create({ data: event as any });
    return mapEventFromPrisma(row);
  }

  async getById(eventId: string): Promise<ResultMasteryMutationEvent | null> {
    const row = await prisma.resultMasteryMutationEventRecord.findUnique({ where: { resultMasteryMutationEventId: eventId } });
    return row ? mapEventFromPrisma(row) : null;
  }

  async listByPlan(planId: string): Promise<ResultMasteryMutationEvent[]> {
    const rows = await prisma.resultMasteryMutationEventRecord.findMany({ where: { resultMasteryMutationPlanId: planId } });
    return rows.map(mapEventFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultMasteryMutationEvent[]> {
    const rows = await prisma.resultMasteryMutationEventRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapEventFromPrisma);
  }

  async updateStatus(eventId: string, status: string): Promise<ResultMasteryMutationEvent | null> {
    const data: any = { mutationStatus: status };
    if (status === 'applied') data.appliedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultMasteryMutationEventRecord.update({ where: { resultMasteryMutationEventId: eventId }, data }).catch(() => null);
    return row ? mapEventFromPrisma(row) : null;
  }
}

export class PrismaResultObjectiveMasteryImpactRepository implements ResultObjectiveMasteryImpactRepository {
  async create(impact: ResultObjectiveMasteryImpact): Promise<ResultObjectiveMasteryImpact> {
    const row = await prisma.resultObjectiveMasteryImpactRecord.create({ data: impact as any });
    return mapImpactFromPrisma(row);
  }

  async getById(impactId: string): Promise<ResultObjectiveMasteryImpact | null> {
    const row = await prisma.resultObjectiveMasteryImpactRecord.findUnique({ where: { resultObjectiveMasteryImpactId: impactId } });
    return row ? mapImpactFromPrisma(row) : null;
  }

  async listByBridge(bridgeId: string): Promise<ResultObjectiveMasteryImpact[]> {
    const rows = await prisma.resultObjectiveMasteryImpactRecord.findMany({ where: { resultLearningEvidenceBridgeId: bridgeId } });
    return rows.map(mapImpactFromPrisma);
  }

  async listByPlan(planId: string): Promise<ResultObjectiveMasteryImpact[]> {
    const rows = await prisma.resultObjectiveMasteryImpactRecord.findMany({ where: { resultMasteryMutationPlanId: planId } });
    return rows.map(mapImpactFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultObjectiveMasteryImpact[]> {
    const rows = await prisma.resultObjectiveMasteryImpactRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapImpactFromPrisma);
  }

  async listByObjective(learningObjectiveId: string): Promise<ResultObjectiveMasteryImpact[]> {
    const rows = await prisma.resultObjectiveMasteryImpactRecord.findMany({ where: { learningObjectiveId } });
    return rows.map(mapImpactFromPrisma);
  }

  async updateStatus(impactId: string, status: string): Promise<ResultObjectiveMasteryImpact | null> {
    const row = await prisma.resultObjectiveMasteryImpactRecord.update({ where: { resultObjectiveMasteryImpactId: impactId }, data: { impactStatus: status } }).catch(() => null);
    return row ? mapImpactFromPrisma(row) : null;
  }

  async voidImpact(impactId: string, voidedAt: string): Promise<ResultObjectiveMasteryImpact | null> {
    const row = await prisma.resultObjectiveMasteryImpactRecord.update({ where: { resultObjectiveMasteryImpactId: impactId }, data: { impactStatus: 'void', voidedAt: new Date(voidedAt) } }).catch(() => null);
    return row ? mapImpactFromPrisma(row) : null;
  }
}

export class PrismaResultRevisionSignalRepository implements ResultRevisionSignalRepository {
  async create(signal: ResultRevisionSignal): Promise<ResultRevisionSignal> {
    const row = await prisma.resultRevisionSignalRecord.create({ data: signal as any });
    return mapRevisionSignalFromPrisma(row);
  }

  async getById(signalId: string): Promise<ResultRevisionSignal | null> {
    const row = await prisma.resultRevisionSignalRecord.findUnique({ where: { resultRevisionSignalId: signalId } });
    return row ? mapRevisionSignalFromPrisma(row) : null;
  }

  async listByPlan(planId: string): Promise<ResultRevisionSignal[]> {
    const rows = await prisma.resultRevisionSignalRecord.findMany({ where: { resultMasteryMutationPlanId: planId } });
    return rows.map(mapRevisionSignalFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRevisionSignal[]> {
    const rows = await prisma.resultRevisionSignalRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapRevisionSignalFromPrisma);
  }

  async listByBridge(bridgeId: string): Promise<ResultRevisionSignal[]> {
    const rows = await prisma.resultRevisionSignalRecord.findMany({ where: { resultLearningEvidenceBridgeId: bridgeId } });
    return rows.map(mapRevisionSignalFromPrisma);
  }

  async updateStatus(signalId: string, status: string): Promise<ResultRevisionSignal | null> {
    const data: any = { signalStatus: status };
    if (status === 'dispatched') data.dispatchedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultRevisionSignalRecord.update({ where: { resultRevisionSignalId: signalId }, data }).catch(() => null);
    return row ? mapRevisionSignalFromPrisma(row) : null;
  }
}

export class PrismaResultGrowthSignalRepository implements ResultGrowthSignalRepository {
  async create(signal: ResultGrowthSignal): Promise<ResultGrowthSignal> {
    const row = await prisma.resultGrowthSignalRecord.create({ data: signal as any });
    return mapGrowthSignalFromPrisma(row);
  }

  async getById(signalId: string): Promise<ResultGrowthSignal | null> {
    const row = await prisma.resultGrowthSignalRecord.findUnique({ where: { resultGrowthSignalId: signalId } });
    return row ? mapGrowthSignalFromPrisma(row) : null;
  }

  async listByPlan(planId: string): Promise<ResultGrowthSignal[]> {
    const rows = await prisma.resultGrowthSignalRecord.findMany({ where: { resultMasteryMutationPlanId: planId } });
    return rows.map(mapGrowthSignalFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultGrowthSignal[]> {
    const rows = await prisma.resultGrowthSignalRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapGrowthSignalFromPrisma);
  }

  async listByBridge(bridgeId: string): Promise<ResultGrowthSignal[]> {
    const rows = await prisma.resultGrowthSignalRecord.findMany({ where: { resultLearningEvidenceBridgeId: bridgeId } });
    return rows.map(mapGrowthSignalFromPrisma);
  }

  async updateStatus(signalId: string, status: string): Promise<ResultGrowthSignal | null> {
    const data: any = { signalStatus: status };
    if (status === 'dispatched') data.dispatchedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultGrowthSignalRecord.update({ where: { resultGrowthSignalId: signalId }, data }).catch(() => null);
    return row ? mapGrowthSignalFromPrisma(row) : null;
  }
}

function mapAuditRow(r: any): ResultLearningEvidenceAuditEvent {
  return { ...r, resultLearningEvidenceBridgeId: r.resultLearningEvidenceBridgeId ?? undefined, resultMasteryMutationPlanId: r.resultMasteryMutationPlanId ?? undefined, resultMasteryMutationEventId: r.resultMasteryMutationEventId ?? undefined, resultObjectiveMasteryImpactId: r.resultObjectiveMasteryImpactId ?? undefined, resultRevisionSignalId: r.resultRevisionSignalId ?? undefined, resultGrowthSignalId: r.resultGrowthSignalId ?? undefined, createdAt: r.createdAt?.toISOString() || '' };
}

export class PrismaResultLearningEvidenceAuditRepository implements ResultLearningEvidenceAuditRepository {
  async create(event: ResultLearningEvidenceAuditEvent): Promise<ResultLearningEvidenceAuditEvent> {
    const row = await prisma.resultLearningEvidenceAuditRecord.create({ data: event as any });
    return mapAuditRow(row);
  }

  async listBySchool(schoolId: string): Promise<ResultLearningEvidenceAuditEvent[]> {
    const rows = await prisma.resultLearningEvidenceAuditRecord.findMany({ where: { schoolId } });
    return rows.map((r: any) => mapAuditRow(r));
  }

  async listByBridge(bridgeId: string): Promise<ResultLearningEvidenceAuditEvent[]> {
    const rows = await prisma.resultLearningEvidenceAuditRecord.findMany({ where: { resultLearningEvidenceBridgeId: bridgeId } });
    return rows.map((r: any) => mapAuditRow(r));
  }

  async listByPlan(planId: string): Promise<ResultLearningEvidenceAuditEvent[]> {
    const rows = await prisma.resultLearningEvidenceAuditRecord.findMany({ where: { resultMasteryMutationPlanId: planId } });
    return rows.map((r: any) => mapAuditRow(r));
  }
}

function mapIdempotencyRow(r: any): ResultLearningEvidenceIdempotencyEntry {
  return { ...r, resourceType: r.resourceType ?? undefined, resourceId: r.resourceId ?? undefined, safeResultSummary: r.safeResultSummary ?? undefined, expiresAt: r.expiresAt?.toISOString() ?? undefined, createdAt: r.createdAt?.toISOString() || '', updatedAt: r.updatedAt?.toISOString() || '' };
}

export class PrismaResultLearningEvidenceIdempotencyRepository implements ResultLearningEvidenceIdempotencyRepository {
  async create(entry: ResultLearningEvidenceIdempotencyEntry): Promise<ResultLearningEvidenceIdempotencyEntry> {
    const row = await prisma.resultLearningEvidenceIdempotencyRecord.create({ data: entry as any });
    return mapIdempotencyRow(row);
  }

  async getByIdempotencyKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultLearningEvidenceIdempotencyEntry | null> {
    const row = await prisma.resultLearningEvidenceIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    }).catch(() => null);
    return row ? mapIdempotencyRow(row) : null;
  }

  async updateStatus(id: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<ResultLearningEvidenceIdempotencyEntry | null> {
    const data: any = { status };
    if (resourceType) data.resourceType = resourceType;
    if (resourceId) data.resourceId = resourceId;
    if (safeResultSummary) data.safeResultSummary = safeResultSummary;
    const row = await prisma.resultLearningEvidenceIdempotencyRecord.update({ where: { resultLearningEvidenceIdempotencyId: id }, data }).catch(() => null);
    return row ? mapIdempotencyRow(row) : null;
  }

  async expireEntry(id: string, expiresAt: string): Promise<ResultLearningEvidenceIdempotencyEntry | null> {
    const row = await prisma.resultLearningEvidenceIdempotencyRecord.update({ where: { resultLearningEvidenceIdempotencyId: id }, data: { status: 'expired', expiresAt: new Date(expiresAt) } }).catch(() => null);
    return row ? mapIdempotencyRow(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultLearningEvidenceIdempotencyEntry[]> {
    const rows = await prisma.resultLearningEvidenceIdempotencyRecord.findMany({ where: { schoolId } });
    return rows.map((r: any) => mapIdempotencyRow(r));
  }
}
