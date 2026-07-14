import type {
  ResultReleasePacket, CreateReleasePacketInput,
  ResultReleaseApproval, CreateReleaseApprovalInput,
  ResultAudienceProjection, CreateAudienceProjectionInput,
  StudentResultReportSnapshot, CreateReportSnapshotInput,
  ParentSafeResultSummary, CreateParentSafeSummaryInput,
  StudentSafeResultSummary, CreateStudentSafeSummaryInput,
  ResultReleaseDeliveryIntent, CreateDeliveryIntentInput,
  ResultReleaseAuditEvent, ResultReleaseIdempotencyEntry,
} from '../contracts';
import type {
  ResultReleasePacketRepository, ResultReleaseApprovalRepository,
  ResultAudienceProjectionRepository, StudentResultReportSnapshotRepository,
  ParentSafeResultSummaryRepository, StudentSafeResultSummaryRepository,
  ResultReleaseDeliveryIntentRepository, ResultReleaseAuditRepository,
  ResultReleaseIdempotencyRepository,
} from '../contracts/resultReleaseRepositoryContracts';
import { prisma } from '../../../../lib/prisma';

function mapPacketFromPrisma(row: any): ResultReleasePacket {
  return {
    resultReleasePacketId: row.resultReleasePacketId,
    schoolId: row.schoolId,
    resultFinalizationDecisionId: row.resultFinalizationDecisionId,
    resultReleaseReadinessId: row.resultReleaseReadinessId,
    resultReleaseBoundaryId: row.resultReleaseBoundaryId,
    resultLearningEvidenceBridgeId: row.resultLearningEvidenceBridgeId || undefined,
    markingResultVersionId: row.markingResultVersionId,
    studentRef: row.studentRef,
    paperId: row.paperId || undefined,
    paperVersionId: row.paperVersionId || undefined,
    deliverySessionId: row.deliverySessionId || undefined,
    packetStatus: row.packetStatus,
    packetAudience: row.packetAudience,
    packetMode: row.packetMode,
    safePacketSummary: row.safePacketSummary,
    allowedFieldsJson: (row.allowedFieldsJson as Record<string, unknown>) || undefined,
    blockedFieldsJson: (row.blockedFieldsJson as Record<string, unknown>) || undefined,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || undefined,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    approvedAt: row.approvedAt?.toISOString() || undefined,
    blockedAt: row.blockedAt?.toISOString() || undefined,
    cancelledAt: row.cancelledAt?.toISOString() || undefined,
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapApprovalFromPrisma(row: any): ResultReleaseApproval {
  return {
    resultReleaseApprovalId: row.resultReleaseApprovalId,
    schoolId: row.schoolId,
    resultReleasePacketId: row.resultReleasePacketId,
    resultFinalizationDecisionId: row.resultFinalizationDecisionId,
    studentRef: row.studentRef,
    approvalStatus: row.approvalStatus,
    approvalType: row.approvalType,
    approvedAudience: row.approvedAudience,
    approvedByActorId: row.approvedByActorId,
    approvedByRole: row.approvedByRole,
    safeApprovalSummary: row.safeApprovalSummary,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || undefined,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    approvedAt: row.approvedAt?.toISOString() || undefined,
    rejectedAt: row.rejectedAt?.toISOString() || undefined,
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapProjectionFromPrisma(row: any): ResultAudienceProjection {
  return {
    resultAudienceProjectionId: row.resultAudienceProjectionId,
    schoolId: row.schoolId,
    resultReleasePacketId: row.resultReleasePacketId,
    studentRef: row.studentRef,
    audienceType: row.audienceType,
    projectionStatus: row.projectionStatus,
    projectionVersion: row.projectionVersion,
    safeProjectionJson: (row.safeProjectionJson as Record<string, unknown>) || undefined,
    allowedFieldsJson: (row.allowedFieldsJson as Record<string, unknown>) || undefined,
    blockedFieldsJson: (row.blockedFieldsJson as Record<string, unknown>) || undefined,
    redactionRulesJson: (row.redactionRulesJson as Record<string, unknown>) || undefined,
    safeProjectionSummary: row.safeProjectionSummary,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapSnapshotFromPrisma(row: any): StudentResultReportSnapshot {
  return {
    studentResultReportSnapshotId: row.studentResultReportSnapshotId,
    schoolId: row.schoolId,
    resultReleasePacketId: row.resultReleasePacketId,
    resultAudienceProjectionId: row.resultAudienceProjectionId,
    studentRef: row.studentRef,
    snapshotStatus: row.snapshotStatus,
    snapshotType: row.snapshotType,
    safeReportTitle: row.safeReportTitle,
    safeReportSummary: row.safeReportSummary,
    safeStrengthsJson: (row.safeStrengthsJson as Record<string, unknown>) || undefined,
    safeGrowthAreasJson: (row.safeGrowthAreasJson as Record<string, unknown>) || undefined,
    safeNextStepsJson: (row.safeNextStepsJson as Record<string, unknown>) || undefined,
    safeSupportGuidanceJson: (row.safeSupportGuidanceJson as Record<string, unknown>) || undefined,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || undefined,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    approvedAt: row.approvedAt?.toISOString() || undefined,
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapParentSummaryFromPrisma(row: any): ParentSafeResultSummary {
  return {
    parentSafeResultSummaryId: row.parentSafeResultSummaryId,
    schoolId: row.schoolId,
    resultReleasePacketId: row.resultReleasePacketId,
    resultAudienceProjectionId: row.resultAudienceProjectionId,
    studentRef: row.studentRef,
    summaryStatus: row.summaryStatus,
    safeProgressSummary: row.safeProgressSummary,
    safeSupportSummary: row.safeSupportSummary,
    safeStrengthsJson: (row.safeStrengthsJson as Record<string, unknown>) || undefined,
    safeGrowthAreasJson: (row.safeGrowthAreasJson as Record<string, unknown>) || undefined,
    safeRecommendedSupportJson: (row.safeRecommendedSupportJson as Record<string, unknown>) || undefined,
    notYetReleasedReason: row.notYetReleasedReason || undefined,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as Record<string, unknown>) || undefined,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || undefined,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    approvedAt: row.approvedAt?.toISOString() || undefined,
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapStudentSummaryFromPrisma(row: any): StudentSafeResultSummary {
  return {
    studentSafeResultSummaryId: row.studentSafeResultSummaryId,
    schoolId: row.schoolId,
    resultReleasePacketId: row.resultReleasePacketId,
    resultAudienceProjectionId: row.resultAudienceProjectionId,
    studentRef: row.studentRef,
    summaryStatus: row.summaryStatus,
    safeAchievementSummary: row.safeAchievementSummary,
    safeLearningProgressSummary: row.safeLearningProgressSummary,
    safeNextPracticeSummary: row.safeNextPracticeSummary,
    safeConfidenceGuidanceJson: (row.safeConfidenceGuidanceJson as Record<string, unknown>) || undefined,
    safeRevisionGuidanceJson: (row.safeRevisionGuidanceJson as Record<string, unknown>) || undefined,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as Record<string, unknown>) || undefined,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || undefined,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    approvedAt: row.approvedAt?.toISOString() || undefined,
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapIntentFromPrisma(row: any): ResultReleaseDeliveryIntent {
  return {
    resultReleaseDeliveryIntentId: row.resultReleaseDeliveryIntentId,
    schoolId: row.schoolId,
    resultReleasePacketId: row.resultReleasePacketId,
    resultReleaseApprovalId: row.resultReleaseApprovalId,
    studentRef: row.studentRef,
    audienceType: row.audienceType,
    deliveryChannel: row.deliveryChannel,
    intentStatus: row.intentStatus,
    safeIntentSummary: row.safeIntentSummary,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || undefined,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    approvedAt: row.approvedAt?.toISOString() || undefined,
    blockedAt: row.blockedAt?.toISOString() || undefined,
    voidedAt: row.voidedAt?.toISOString() || undefined,
  };
}

function mapAuditFromPrisma(row: any): ResultReleaseAuditEvent {
  return {
    resultReleaseAuditId: row.resultReleaseAuditId,
    schoolId: row.schoolId,
    resultReleasePacketId: row.resultReleasePacketId || undefined,
    resultReleaseApprovalId: row.resultReleaseApprovalId || undefined,
    resultAudienceProjectionId: row.resultAudienceProjectionId || undefined,
    studentResultReportSnapshotId: row.studentResultReportSnapshotId || undefined,
    parentSafeResultSummaryId: row.parentSafeResultSummaryId || undefined,
    studentSafeResultSummaryId: row.studentSafeResultSummaryId || undefined,
    resultReleaseDeliveryIntentId: row.resultReleaseDeliveryIntentId || undefined,
    actorId: row.actorId,
    actorRole: row.actorRole,
    eventType: row.eventType,
    decision: row.decision,
    safeSummary: row.safeSummary,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || undefined,
    metadataJson: (row.metadataJson as Record<string, unknown>) || undefined,
    requestId: row.requestId || undefined,
    correlationId: row.correlationId || undefined,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapIdempotencyFromPrisma(row: any): ResultReleaseIdempotencyEntry {
  return {
    resultReleaseIdempotencyId: row.resultReleaseIdempotencyId,
    schoolId: row.schoolId,
    operation: row.operation,
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    status: row.status,
    resourceType: row.resourceType || undefined,
    resourceId: row.resourceId || undefined,
    safeResultSummary: row.safeResultSummary || undefined,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    expiresAt: row.expiresAt?.toISOString() || undefined,
  };
}

export class PrismaResultReleasePacketRepository implements ResultReleasePacketRepository {
  async create(input: CreateReleasePacketInput): Promise<ResultReleasePacket> {
    const row = await prisma.resultReleasePacketRecord.create({
      data: {
        schoolId: input.schoolId,
        resultFinalizationDecisionId: input.resultFinalizationDecisionId,
        resultReleaseReadinessId: input.resultReleaseReadinessId,
        resultReleaseBoundaryId: input.resultReleaseBoundaryId,
        resultLearningEvidenceBridgeId: input.resultLearningEvidenceBridgeId || null,
        markingResultVersionId: input.markingResultVersionId,
        studentRef: input.studentRef,
        paperId: input.paperId || null,
        paperVersionId: input.paperVersionId || null,
        deliverySessionId: input.deliverySessionId || null,
        packetStatus: 'draft',
        packetAudience: input.packetAudience,
        packetMode: input.packetMode,
        safePacketSummary: input.safePacketSummary,
        allowedFieldsJson: (input.allowedFieldsJson as any) || undefined,
        blockedFieldsJson: (input.blockedFieldsJson as any) || undefined,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapPacketFromPrisma(row);
  }

  async getById(packetId: string): Promise<ResultReleasePacket | null> {
    const row = await prisma.resultReleasePacketRecord.findUnique({ where: { resultReleasePacketId: packetId } });
    return row ? mapPacketFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReleasePacket[]> {
    const rows = await prisma.resultReleasePacketRecord.findMany({ where: { schoolId } });
    return rows.map(mapPacketFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReleasePacket[]> {
    const rows = await prisma.resultReleasePacketRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapPacketFromPrisma);
  }

  async listByFinalizationDecisionId(decisionId: string): Promise<ResultReleasePacket[]> {
    const rows = await prisma.resultReleasePacketRecord.findMany({ where: { resultFinalizationDecisionId: decisionId } });
    return rows.map(mapPacketFromPrisma);
  }

  async updateStatus(packetId: string, status: string, safeSummary?: string): Promise<ResultReleasePacket | null> {
    const data: any = { packetStatus: status };
    if (safeSummary !== undefined) data.safePacketSummary = safeSummary;
    if (status === 'approved_for_internal_release') data.approvedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'cancelled') data.cancelledAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReleasePacketRecord.update({ where: { resultReleasePacketId: packetId }, data }).catch(() => null);
    return row ? mapPacketFromPrisma(row) : null;
  }

  async update(packetId: string, updates: Partial<ResultReleasePacket>): Promise<ResultReleasePacket | null> {
    const row = await prisma.resultReleasePacketRecord.update({ where: { resultReleasePacketId: packetId }, data: updates as any }).catch(() => null);
    return row ? mapPacketFromPrisma(row) : null;
  }

  async blockPacket(packetId: string, blockedAt: string): Promise<ResultReleasePacket | null> {
    const row = await prisma.resultReleasePacketRecord.update({
      where: { resultReleasePacketId: packetId },
      data: { packetStatus: 'blocked', blockedAt: new Date(blockedAt) },
    }).catch(() => null);
    return row ? mapPacketFromPrisma(row) : null;
  }

  async cancelPacket(packetId: string, cancelledAt: string): Promise<ResultReleasePacket | null> {
    const row = await prisma.resultReleasePacketRecord.update({
      where: { resultReleasePacketId: packetId },
      data: { packetStatus: 'cancelled', cancelledAt: new Date(cancelledAt) },
    }).catch(() => null);
    return row ? mapPacketFromPrisma(row) : null;
  }

  async voidPacket(packetId: string, voidedAt: string): Promise<ResultReleasePacket | null> {
    const row = await prisma.resultReleasePacketRecord.update({
      where: { resultReleasePacketId: packetId },
      data: { packetStatus: 'void', voidedAt: new Date(voidedAt) },
    }).catch(() => null);
    return row ? mapPacketFromPrisma(row) : null;
  }
}

export class PrismaResultReleaseApprovalRepository implements ResultReleaseApprovalRepository {
  async create(input: CreateReleaseApprovalInput): Promise<ResultReleaseApproval> {
    const row = await prisma.resultReleaseApprovalRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReleasePacketId: input.resultReleasePacketId,
        resultFinalizationDecisionId: input.resultFinalizationDecisionId,
        studentRef: input.studentRef,
        approvalStatus: 'draft',
        approvalType: input.approvalType,
        approvedAudience: input.approvedAudience,
        approvedByActorId: input.approvedByActorId,
        approvedByRole: input.approvedByRole,
        safeApprovalSummary: input.safeApprovalSummary,
        reasonCodesJson: (input.reasonCodesJson as any) || undefined,
      },
    });
    return mapApprovalFromPrisma(row);
  }

  async getById(approvalId: string): Promise<ResultReleaseApproval | null> {
    const row = await prisma.resultReleaseApprovalRecord.findUnique({ where: { resultReleaseApprovalId: approvalId } });
    return row ? mapApprovalFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReleaseApproval[]> {
    const rows = await prisma.resultReleaseApprovalRecord.findMany({ where: { schoolId } });
    return rows.map(mapApprovalFromPrisma);
  }

  async listByReleasePacketId(packetId: string): Promise<ResultReleaseApproval[]> {
    const rows = await prisma.resultReleaseApprovalRecord.findMany({ where: { resultReleasePacketId: packetId } });
    return rows.map(mapApprovalFromPrisma);
  }

  async listByStudentRef(studentRef: string): Promise<ResultReleaseApproval[]> {
    const rows = await prisma.resultReleaseApprovalRecord.findMany({ where: { studentRef } });
    return rows.map(mapApprovalFromPrisma);
  }

  async updateStatus(approvalId: string, status: string, safeSummary?: string): Promise<ResultReleaseApproval | null> {
    const data: any = { approvalStatus: status };
    if (safeSummary !== undefined) data.safeApprovalSummary = safeSummary;
    if (status === 'approved') data.approvedAt = new Date();
    if (status === 'rejected') data.rejectedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReleaseApprovalRecord.update({ where: { resultReleaseApprovalId: approvalId }, data }).catch(() => null);
    return row ? mapApprovalFromPrisma(row) : null;
  }

  async blockApproval(approvalId: string): Promise<ResultReleaseApproval | null> {
    const row = await prisma.resultReleaseApprovalRecord.update({
      where: { resultReleaseApprovalId: approvalId },
      data: { approvalStatus: 'blocked' },
    }).catch(() => null);
    return row ? mapApprovalFromPrisma(row) : null;
  }

  async voidApproval(approvalId: string, voidedAt: string): Promise<ResultReleaseApproval | null> {
    const row = await prisma.resultReleaseApprovalRecord.update({
      where: { resultReleaseApprovalId: approvalId },
      data: { approvalStatus: 'void', voidedAt: new Date(voidedAt) },
    }).catch(() => null);
    return row ? mapApprovalFromPrisma(row) : null;
  }
}

export class PrismaResultAudienceProjectionRepository implements ResultAudienceProjectionRepository {
  async create(input: CreateAudienceProjectionInput, projectionVersion?: number): Promise<ResultAudienceProjection> {
    const row = await prisma.resultAudienceProjectionRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReleasePacketId: input.resultReleasePacketId,
        studentRef: input.studentRef,
        audienceType: input.audienceType,
        projectionStatus: 'draft',
        projectionVersion: projectionVersion ?? 1,
        safeProjectionJson: (input.safeProjectionJson as any) || undefined,
        allowedFieldsJson: (input.allowedFieldsJson as any) || undefined,
        blockedFieldsJson: (input.blockedFieldsJson as any) || undefined,
        redactionRulesJson: (input.redactionRulesJson as any) || undefined,
        safeProjectionSummary: input.safeProjectionSummary,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapProjectionFromPrisma(row);
  }

  async getById(projectionId: string): Promise<ResultAudienceProjection | null> {
    const row = await prisma.resultAudienceProjectionRecord.findUnique({ where: { resultAudienceProjectionId: projectionId } });
    return row ? mapProjectionFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultAudienceProjection[]> {
    const rows = await prisma.resultAudienceProjectionRecord.findMany({ where: { schoolId } });
    return rows.map(mapProjectionFromPrisma);
  }

  async listByReleasePacketId(packetId: string): Promise<ResultAudienceProjection[]> {
    const rows = await prisma.resultAudienceProjectionRecord.findMany({ where: { resultReleasePacketId: packetId } });
    return rows.map(mapProjectionFromPrisma);
  }

  async listByStudentRef(studentRef: string): Promise<ResultAudienceProjection[]> {
    const rows = await prisma.resultAudienceProjectionRecord.findMany({ where: { studentRef } });
    return rows.map(mapProjectionFromPrisma);
  }

  async listByAudienceType(audienceType: string): Promise<ResultAudienceProjection[]> {
    const rows = await prisma.resultAudienceProjectionRecord.findMany({ where: { audienceType } });
    return rows.map(mapProjectionFromPrisma);
  }

  async updateStatus(projectionId: string, status: string): Promise<ResultAudienceProjection | null> {
    const data: any = { projectionStatus: status };
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultAudienceProjectionRecord.update({ where: { resultAudienceProjectionId: projectionId }, data }).catch(() => null);
    return row ? mapProjectionFromPrisma(row) : null;
  }

  async blockProjection(projectionId: string): Promise<ResultAudienceProjection | null> {
    const row = await prisma.resultAudienceProjectionRecord.update({
      where: { resultAudienceProjectionId: projectionId },
      data: { projectionStatus: 'blocked' },
    }).catch(() => null);
    return row ? mapProjectionFromPrisma(row) : null;
  }

  async voidProjection(projectionId: string, voidedAt: string): Promise<ResultAudienceProjection | null> {
    const row = await prisma.resultAudienceProjectionRecord.update({
      where: { resultAudienceProjectionId: projectionId },
      data: { projectionStatus: 'void', voidedAt: new Date(voidedAt) },
    }).catch(() => null);
    return row ? mapProjectionFromPrisma(row) : null;
  }
}

export class PrismaStudentResultReportSnapshotRepository implements StudentResultReportSnapshotRepository {
  async create(input: CreateReportSnapshotInput): Promise<StudentResultReportSnapshot> {
    const row = await prisma.studentResultReportSnapshotRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReleasePacketId: input.resultReleasePacketId,
        resultAudienceProjectionId: input.resultAudienceProjectionId,
        studentRef: input.studentRef,
        snapshotStatus: 'draft',
        snapshotType: input.snapshotType,
        safeReportTitle: input.safeReportTitle,
        safeReportSummary: input.safeReportSummary,
        safeStrengthsJson: (input.safeStrengthsJson as any) || undefined,
        safeGrowthAreasJson: (input.safeGrowthAreasJson as any) || undefined,
        safeNextStepsJson: (input.safeNextStepsJson as any) || undefined,
        safeSupportGuidanceJson: (input.safeSupportGuidanceJson as any) || undefined,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapSnapshotFromPrisma(row);
  }

  async getById(snapshotId: string): Promise<StudentResultReportSnapshot | null> {
    const row = await prisma.studentResultReportSnapshotRecord.findUnique({ where: { studentResultReportSnapshotId: snapshotId } });
    return row ? mapSnapshotFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<StudentResultReportSnapshot[]> {
    const rows = await prisma.studentResultReportSnapshotRecord.findMany({ where: { schoolId } });
    return rows.map(mapSnapshotFromPrisma);
  }

  async listByReleasePacketId(packetId: string): Promise<StudentResultReportSnapshot[]> {
    const rows = await prisma.studentResultReportSnapshotRecord.findMany({ where: { resultReleasePacketId: packetId } });
    return rows.map(mapSnapshotFromPrisma);
  }

  async listByStudentRef(studentRef: string): Promise<StudentResultReportSnapshot[]> {
    const rows = await prisma.studentResultReportSnapshotRecord.findMany({ where: { studentRef } });
    return rows.map(mapSnapshotFromPrisma);
  }

  async updateStatus(snapshotId: string, status: string): Promise<StudentResultReportSnapshot | null> {
    const data: any = { snapshotStatus: status };
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.studentResultReportSnapshotRecord.update({ where: { studentResultReportSnapshotId: snapshotId }, data }).catch(() => null);
    return row ? mapSnapshotFromPrisma(row) : null;
  }

  async approveSnapshot(snapshotId: string, approvedAt: string): Promise<StudentResultReportSnapshot | null> {
    const row = await prisma.studentResultReportSnapshotRecord.update({
      where: { studentResultReportSnapshotId: snapshotId },
      data: { snapshotStatus: 'approved_for_internal_use', approvedAt: new Date(approvedAt) },
    }).catch(() => null);
    return row ? mapSnapshotFromPrisma(row) : null;
  }

  async blockSnapshot(snapshotId: string): Promise<StudentResultReportSnapshot | null> {
    const row = await prisma.studentResultReportSnapshotRecord.update({
      where: { studentResultReportSnapshotId: snapshotId },
      data: { snapshotStatus: 'blocked' },
    }).catch(() => null);
    return row ? mapSnapshotFromPrisma(row) : null;
  }

  async voidSnapshot(snapshotId: string, voidedAt: string): Promise<StudentResultReportSnapshot | null> {
    const row = await prisma.studentResultReportSnapshotRecord.update({
      where: { studentResultReportSnapshotId: snapshotId },
      data: { snapshotStatus: 'void', voidedAt: new Date(voidedAt) },
    }).catch(() => null);
    return row ? mapSnapshotFromPrisma(row) : null;
  }
}

export class PrismaParentSafeResultSummaryRepository implements ParentSafeResultSummaryRepository {
  async create(input: CreateParentSafeSummaryInput): Promise<ParentSafeResultSummary> {
    const row = await prisma.parentSafeResultSummaryRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReleasePacketId: input.resultReleasePacketId,
        resultAudienceProjectionId: input.resultAudienceProjectionId,
        studentRef: input.studentRef,
        summaryStatus: 'draft',
        safeProgressSummary: input.safeProgressSummary,
        safeSupportSummary: input.safeSupportSummary,
        safeStrengthsJson: (input.safeStrengthsJson as any) || undefined,
        safeGrowthAreasJson: (input.safeGrowthAreasJson as any) || undefined,
        safeRecommendedSupportJson: (input.safeRecommendedSupportJson as any) || undefined,
        notYetReleasedReason: input.notYetReleasedReason || null,
        allowedFieldNamesJson: (input.allowedFieldNamesJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapParentSummaryFromPrisma(row);
  }

  async getById(summaryId: string): Promise<ParentSafeResultSummary | null> {
    const row = await prisma.parentSafeResultSummaryRecord.findUnique({ where: { parentSafeResultSummaryId: summaryId } });
    return row ? mapParentSummaryFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ParentSafeResultSummary[]> {
    const rows = await prisma.parentSafeResultSummaryRecord.findMany({ where: { schoolId } });
    return rows.map(mapParentSummaryFromPrisma);
  }

  async listByReleasePacketId(packetId: string): Promise<ParentSafeResultSummary[]> {
    const rows = await prisma.parentSafeResultSummaryRecord.findMany({ where: { resultReleasePacketId: packetId } });
    return rows.map(mapParentSummaryFromPrisma);
  }

  async listByStudentRef(studentRef: string): Promise<ParentSafeResultSummary[]> {
    const rows = await prisma.parentSafeResultSummaryRecord.findMany({ where: { studentRef } });
    return rows.map(mapParentSummaryFromPrisma);
  }

  async updateStatus(summaryId: string, status: string): Promise<ParentSafeResultSummary | null> {
    const data: any = { summaryStatus: status };
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.parentSafeResultSummaryRecord.update({ where: { parentSafeResultSummaryId: summaryId }, data }).catch(() => null);
    return row ? mapParentSummaryFromPrisma(row) : null;
  }

  async approveForFutureDelivery(summaryId: string, approvedAt: string): Promise<ParentSafeResultSummary | null> {
    const row = await prisma.parentSafeResultSummaryRecord.update({
      where: { parentSafeResultSummaryId: summaryId },
      data: { summaryStatus: 'approved_for_future_delivery', approvedAt: new Date(approvedAt) },
    }).catch(() => null);
    return row ? mapParentSummaryFromPrisma(row) : null;
  }

  async blockSummary(summaryId: string): Promise<ParentSafeResultSummary | null> {
    const row = await prisma.parentSafeResultSummaryRecord.update({
      where: { parentSafeResultSummaryId: summaryId },
      data: { summaryStatus: 'blocked' },
    }).catch(() => null);
    return row ? mapParentSummaryFromPrisma(row) : null;
  }

  async voidSummary(summaryId: string, voidedAt: string): Promise<ParentSafeResultSummary | null> {
    const row = await prisma.parentSafeResultSummaryRecord.update({
      where: { parentSafeResultSummaryId: summaryId },
      data: { summaryStatus: 'void', voidedAt: new Date(voidedAt) },
    }).catch(() => null);
    return row ? mapParentSummaryFromPrisma(row) : null;
  }
}

export class PrismaStudentSafeResultSummaryRepository implements StudentSafeResultSummaryRepository {
  async create(input: CreateStudentSafeSummaryInput): Promise<StudentSafeResultSummary> {
    const row = await prisma.studentSafeResultSummaryRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReleasePacketId: input.resultReleasePacketId,
        resultAudienceProjectionId: input.resultAudienceProjectionId,
        studentRef: input.studentRef,
        summaryStatus: 'draft',
        safeAchievementSummary: input.safeAchievementSummary,
        safeLearningProgressSummary: input.safeLearningProgressSummary,
        safeNextPracticeSummary: input.safeNextPracticeSummary,
        safeConfidenceGuidanceJson: (input.safeConfidenceGuidanceJson as any) || undefined,
        safeRevisionGuidanceJson: (input.safeRevisionGuidanceJson as any) || undefined,
        allowedFieldNamesJson: (input.allowedFieldNamesJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapStudentSummaryFromPrisma(row);
  }

  async getById(summaryId: string): Promise<StudentSafeResultSummary | null> {
    const row = await prisma.studentSafeResultSummaryRecord.findUnique({ where: { studentSafeResultSummaryId: summaryId } });
    return row ? mapStudentSummaryFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<StudentSafeResultSummary[]> {
    const rows = await prisma.studentSafeResultSummaryRecord.findMany({ where: { schoolId } });
    return rows.map(mapStudentSummaryFromPrisma);
  }

  async listByReleasePacketId(packetId: string): Promise<StudentSafeResultSummary[]> {
    const rows = await prisma.studentSafeResultSummaryRecord.findMany({ where: { resultReleasePacketId: packetId } });
    return rows.map(mapStudentSummaryFromPrisma);
  }

  async listByStudentRef(studentRef: string): Promise<StudentSafeResultSummary[]> {
    const rows = await prisma.studentSafeResultSummaryRecord.findMany({ where: { studentRef } });
    return rows.map(mapStudentSummaryFromPrisma);
  }

  async updateStatus(summaryId: string, status: string): Promise<StudentSafeResultSummary | null> {
    const data: any = { summaryStatus: status };
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.studentSafeResultSummaryRecord.update({ where: { studentSafeResultSummaryId: summaryId }, data }).catch(() => null);
    return row ? mapStudentSummaryFromPrisma(row) : null;
  }

  async approveForFutureDelivery(summaryId: string, approvedAt: string): Promise<StudentSafeResultSummary | null> {
    const row = await prisma.studentSafeResultSummaryRecord.update({
      where: { studentSafeResultSummaryId: summaryId },
      data: { summaryStatus: 'approved_for_future_delivery', approvedAt: new Date(approvedAt) },
    }).catch(() => null);
    return row ? mapStudentSummaryFromPrisma(row) : null;
  }

  async blockSummary(summaryId: string): Promise<StudentSafeResultSummary | null> {
    const row = await prisma.studentSafeResultSummaryRecord.update({
      where: { studentSafeResultSummaryId: summaryId },
      data: { summaryStatus: 'blocked' },
    }).catch(() => null);
    return row ? mapStudentSummaryFromPrisma(row) : null;
  }

  async voidSummary(summaryId: string, voidedAt: string): Promise<StudentSafeResultSummary | null> {
    const row = await prisma.studentSafeResultSummaryRecord.update({
      where: { studentSafeResultSummaryId: summaryId },
      data: { summaryStatus: 'void', voidedAt: new Date(voidedAt) },
    }).catch(() => null);
    return row ? mapStudentSummaryFromPrisma(row) : null;
  }
}

export class PrismaResultReleaseDeliveryIntentRepository implements ResultReleaseDeliveryIntentRepository {
  async create(input: CreateDeliveryIntentInput): Promise<ResultReleaseDeliveryIntent> {
    const row = await prisma.resultReleaseDeliveryIntentRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReleasePacketId: input.resultReleasePacketId,
        resultReleaseApprovalId: input.resultReleaseApprovalId,
        studentRef: input.studentRef,
        audienceType: input.audienceType,
        deliveryChannel: input.deliveryChannel,
        intentStatus: 'draft',
        safeIntentSummary: input.safeIntentSummary,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapIntentFromPrisma(row);
  }

  async getById(intentId: string): Promise<ResultReleaseDeliveryIntent | null> {
    const row = await prisma.resultReleaseDeliveryIntentRecord.findUnique({ where: { resultReleaseDeliveryIntentId: intentId } });
    return row ? mapIntentFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReleaseDeliveryIntent[]> {
    const rows = await prisma.resultReleaseDeliveryIntentRecord.findMany({ where: { schoolId } });
    return rows.map(mapIntentFromPrisma);
  }

  async listByReleasePacketId(packetId: string): Promise<ResultReleaseDeliveryIntent[]> {
    const rows = await prisma.resultReleaseDeliveryIntentRecord.findMany({ where: { resultReleasePacketId: packetId } });
    return rows.map(mapIntentFromPrisma);
  }

  async listByStudentRef(studentRef: string): Promise<ResultReleaseDeliveryIntent[]> {
    const rows = await prisma.resultReleaseDeliveryIntentRecord.findMany({ where: { studentRef } });
    return rows.map(mapIntentFromPrisma);
  }

  async updateStatus(intentId: string, status: string): Promise<ResultReleaseDeliveryIntent | null> {
    const data: any = { intentStatus: status };
    if (status === 'eligible_for_future_delivery') data.approvedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReleaseDeliveryIntentRecord.update({ where: { resultReleaseDeliveryIntentId: intentId }, data }).catch(() => null);
    return row ? mapIntentFromPrisma(row) : null;
  }

  async blockIntent(intentId: string): Promise<ResultReleaseDeliveryIntent | null> {
    const row = await prisma.resultReleaseDeliveryIntentRecord.update({
      where: { resultReleaseDeliveryIntentId: intentId },
      data: { intentStatus: 'blocked' },
    }).catch(() => null);
    return row ? mapIntentFromPrisma(row) : null;
  }

  async voidIntent(intentId: string, voidedAt: string): Promise<ResultReleaseDeliveryIntent | null> {
    const row = await prisma.resultReleaseDeliveryIntentRecord.update({
      where: { resultReleaseDeliveryIntentId: intentId },
      data: { intentStatus: 'void', voidedAt: new Date(voidedAt) },
    }).catch(() => null);
    return row ? mapIntentFromPrisma(row) : null;
  }
}

export class PrismaResultReleaseAuditRepository implements ResultReleaseAuditRepository {
  async create(event: ResultReleaseAuditEvent): Promise<ResultReleaseAuditEvent> {
    const row = await prisma.resultReleaseAuditRecord.create({ data: event as any });
    return mapAuditFromPrisma(row);
  }

  async listBySchool(schoolId: string): Promise<ResultReleaseAuditEvent[]> {
    const rows = await prisma.resultReleaseAuditRecord.findMany({ where: { schoolId } });
    return rows.map((r: any) => mapAuditFromPrisma(r));
  }

  async listByPacketId(packetId: string): Promise<ResultReleaseAuditEvent[]> {
    const rows = await prisma.resultReleaseAuditRecord.findMany({ where: { resultReleasePacketId: packetId } });
    return rows.map((r: any) => mapAuditFromPrisma(r));
  }
}

export class PrismaResultReleaseIdempotencyRepository implements ResultReleaseIdempotencyRepository {
  async create(entry: ResultReleaseIdempotencyEntry): Promise<ResultReleaseIdempotencyEntry> {
    const row = await prisma.resultReleaseIdempotencyRecord.create({ data: entry as any });
    return mapIdempotencyFromPrisma(row);
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReleaseIdempotencyEntry | null> {
    const row = await prisma.resultReleaseIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    }).catch(() => null);
    return row ? mapIdempotencyFromPrisma(row) : null;
  }

  async updateStatus(idempotencyId: string, status: string, resourceId?: string, safeResultSummary?: string): Promise<ResultReleaseIdempotencyEntry | null> {
    const data: any = { status };
    if (resourceId !== undefined) data.resourceId = resourceId;
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const row = await prisma.resultReleaseIdempotencyRecord.update({ where: { resultReleaseIdempotencyId: idempotencyId }, data }).catch(() => null);
    return row ? mapIdempotencyFromPrisma(row) : null;
  }

  async expireEntry(idempotencyId: string, expiresAt: string): Promise<ResultReleaseIdempotencyEntry | null> {
    const row = await prisma.resultReleaseIdempotencyRecord.update({
      where: { resultReleaseIdempotencyId: idempotencyId },
      data: { status: 'expired', expiresAt: new Date(expiresAt) },
    }).catch(() => null);
    return row ? mapIdempotencyFromPrisma(row) : null;
  }
}
