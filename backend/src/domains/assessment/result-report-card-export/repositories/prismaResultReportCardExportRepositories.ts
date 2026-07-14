import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import type {
  ResultReportCardExportJob,
  CreateExportJobInput,
  ResultReportCardExportJobPreview,
  UpdateExportJobStatusInput,
  ResultReportCardExportTarget,
  CreateExportTargetInput,
  ResultReportCardExportTargetPreview,
  ResultReportCardExportEnvelope,
  CreateExportEnvelopeInput,
  ResultReportCardExportEnvelopePreview,
  ResultReportCardMockExportAttempt,
  CreateMockExportAttemptInput,
  ResultReportCardMockExportAttemptPreview,
  ResultReportCardExportReceipt,
  CreateExportReceiptInput,
  ResultReportCardExportReceiptPreview,
  ResultReportCardExportSuppression,
  CreateExportSuppressionInput,
  ResultReportCardExportSuppressionPreview,
  ResultReportCardExportRetryPlan,
  CreateExportRetryPlanInput,
  ResultReportCardExportRetryPlanPreview,
  ResultReportCardArchiveManifest,
  CreateArchiveManifestInput,
  ResultReportCardArchiveManifestPreview,
  ResultReportCardExportAuditEvent,
  ResultReportCardExportIdempotencyEntry,
  ResultReportCardExportJobStatus,
  ResultReportCardExportTargetStatus,
  ResultReportCardExportEnvelopeStatus,
  ResultReportCardMockExportAttemptStatus,
  ResultReportCardExportReceiptStatus,
  ResultReportCardExportSuppressionStatus,
  ResultReportCardExportRetryPlanStatus,
  ResultReportCardArchiveManifestStatus,
} from '../contracts';
import type {
  ResultReportCardExportJobRepository,
  ResultReportCardExportTargetRepository,
  ResultReportCardExportEnvelopeRepository,
  ResultReportCardMockExportAttemptRepository,
  ResultReportCardExportReceiptRepository,
  ResultReportCardExportSuppressionRepository,
  ResultReportCardExportRetryPlanRepository,
  ResultReportCardArchiveManifestRepository,
  ResultReportCardExportAuditRepository,
  ResultReportCardExportIdempotencyRepository,
} from '../contracts';

function mapExportJobFromPrisma(row: any): ResultReportCardExportJob {
  return {
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    schoolId: row.schoolId,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    resultReportCardAudienceProjectionId: row.resultReportCardAudienceProjectionId,
    resultReportCardReviewId: row.resultReportCardReviewId,
    resultReportCardExportIntentId: row.resultReportCardExportIntentId,
    resultReportCardRenderManifestId: row.resultReportCardRenderManifestId,
    resultReleasePacketId: row.resultReleasePacketId,
    resultDeliveryReceiptId: row.resultDeliveryReceiptId || null,
    studentRef: row.studentRef,
    paperId: row.paperId,
    paperVersionId: row.paperVersionId,
    deliverySessionId: row.deliverySessionId,
    exportJobStatus: row.exportJobStatus,
    exportJobMode: row.exportJobMode,
    exportJobPurpose: row.exportJobPurpose,
    safeExportJobSummary: row.safeExportJobSummary,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    allowedChannelsJson: (row.allowedChannelsJson as Record<string, unknown>) || null,
    blockedChannelsJson: (row.blockedChannelsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    validatedAt: row.validatedAt?.toISOString() || null,
    queuedAt: row.queuedAt?.toISOString() || null,
    completedAt: row.completedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    cancelledAt: row.cancelledAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapExportJobPreviewFromPrisma(row: any): ResultReportCardExportJobPreview {
  return {
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    schoolId: row.schoolId,
    exportJobStatus: row.exportJobStatus,
    exportJobMode: row.exportJobMode,
    exportJobPurpose: row.exportJobPurpose,
    safeExportJobSummary: row.safeExportJobSummary,
    studentRef: row.studentRef,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
  };
}

function mapExportTargetFromPrisma(row: any): ResultReportCardExportTarget {
  return {
    resultReportCardExportTargetId: row.resultReportCardExportTargetId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    targetType: row.targetType,
    targetStatus: row.targetStatus,
    targetMode: row.targetMode,
    audienceType: row.audienceType,
    safeTargetSummary: row.safeTargetSummary,
    targetDescriptorJson: (row.targetDescriptorJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    validatedAt: row.validatedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapExportTargetPreviewFromPrisma(row: any): ResultReportCardExportTargetPreview {
  return {
    resultReportCardExportTargetId: row.resultReportCardExportTargetId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    targetType: row.targetType,
    targetStatus: row.targetStatus,
    safeTargetSummary: row.safeTargetSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapExportEnvelopeFromPrisma(row: any): ResultReportCardExportEnvelope {
  return {
    resultReportCardExportEnvelopeId: row.resultReportCardExportEnvelopeId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    resultReportCardExportTargetId: row.resultReportCardExportTargetId,
    resultReportCardAudienceProjectionId: row.resultReportCardAudienceProjectionId,
    resultReportCardRenderManifestId: row.resultReportCardRenderManifestId,
    envelopeStatus: row.envelopeStatus,
    envelopeMode: row.envelopeMode,
    safeEnvelopeSummary: row.safeEnvelopeSummary,
    safePayloadJson: (row.safePayloadJson as Record<string, unknown>) || null,
    redactionRulesJson: (row.redactionRulesJson as Record<string, unknown>) || null,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    sealedAt: row.sealedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapExportEnvelopePreviewFromPrisma(row: any): ResultReportCardExportEnvelopePreview {
  return {
    resultReportCardExportEnvelopeId: row.resultReportCardExportEnvelopeId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    resultReportCardExportTargetId: row.resultReportCardExportTargetId,
    envelopeStatus: row.envelopeStatus,
    envelopeMode: row.envelopeMode,
    safeEnvelopeSummary: row.safeEnvelopeSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapMockExportAttemptFromPrisma(row: any): ResultReportCardMockExportAttempt {
  return {
    resultReportCardMockExportAttemptId: row.resultReportCardMockExportAttemptId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    resultReportCardExportTargetId: row.resultReportCardExportTargetId,
    resultReportCardExportEnvelopeId: row.resultReportCardExportEnvelopeId,
    attemptStatus: row.attemptStatus,
    attemptMode: row.attemptMode,
    mockProviderName: row.mockProviderName,
    targetType: row.targetType,
    attemptNumber: row.attemptNumber,
    safeAttemptSummary: row.safeAttemptSummary,
    providerSimulationJson: (row.providerSimulationJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    startedAt: row.startedAt?.toISOString() || null,
    completedAt: row.completedAt?.toISOString() || null,
    failedAt: row.failedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapMockExportAttemptPreviewFromPrisma(row: any): ResultReportCardMockExportAttemptPreview {
  return {
    resultReportCardMockExportAttemptId: row.resultReportCardMockExportAttemptId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    attemptStatus: row.attemptStatus,
    attemptMode: row.attemptMode,
    mockProviderName: row.mockProviderName,
    attemptNumber: row.attemptNumber,
    safeAttemptSummary: row.safeAttemptSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapExportReceiptFromPrisma(row: any): ResultReportCardExportReceipt {
  return {
    resultReportCardExportReceiptId: row.resultReportCardExportReceiptId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    resultReportCardExportTargetId: row.resultReportCardExportTargetId,
    resultReportCardExportEnvelopeId: row.resultReportCardExportEnvelopeId,
    resultReportCardMockExportAttemptId: row.resultReportCardMockExportAttemptId,
    receiptStatus: row.receiptStatus,
    receiptType: row.receiptType,
    safeReceiptSummary: row.safeReceiptSummary,
    providerSimulationJson: (row.providerSimulationJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapExportReceiptPreviewFromPrisma(row: any): ResultReportCardExportReceiptPreview {
  return {
    resultReportCardExportReceiptId: row.resultReportCardExportReceiptId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    receiptStatus: row.receiptStatus,
    receiptType: row.receiptType,
    safeReceiptSummary: row.safeReceiptSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapExportSuppressionFromPrisma(row: any): ResultReportCardExportSuppression {
  return {
    resultReportCardExportSuppressionId: row.resultReportCardExportSuppressionId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    resultReportCardExportTargetId: row.resultReportCardExportTargetId || null,
    resultReportCardExportEnvelopeId: row.resultReportCardExportEnvelopeId || null,
    suppressionStatus: row.suppressionStatus,
    suppressionReason: row.suppressionReason,
    suppressionScope: row.suppressionScope,
    safeSuppressionSummary: row.safeSuppressionSummary,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    liftedAt: row.liftedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapExportSuppressionPreviewFromPrisma(row: any): ResultReportCardExportSuppressionPreview {
  return {
    resultReportCardExportSuppressionId: row.resultReportCardExportSuppressionId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    suppressionStatus: row.suppressionStatus,
    suppressionReason: row.suppressionReason,
    suppressionScope: row.suppressionScope,
    safeSuppressionSummary: row.safeSuppressionSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapExportRetryPlanFromPrisma(row: any): ResultReportCardExportRetryPlan {
  return {
    resultReportCardExportRetryPlanId: row.resultReportCardExportRetryPlanId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    resultReportCardMockExportAttemptId: row.resultReportCardMockExportAttemptId,
    retryStatus: row.retryStatus,
    retryPolicy: row.retryPolicy,
    nextMockRetryAt: row.nextMockRetryAt?.toISOString() || null,
    maxMockAttempts: row.maxMockAttempts,
    attemptsUsed: row.attemptsUsed,
    safeRetrySummary: row.safeRetrySummary,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    cancelledAt: row.cancelledAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapExportRetryPlanPreviewFromPrisma(row: any): ResultReportCardExportRetryPlanPreview {
  return {
    resultReportCardExportRetryPlanId: row.resultReportCardExportRetryPlanId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    retryStatus: row.retryStatus,
    retryPolicy: row.retryPolicy,
    maxMockAttempts: row.maxMockAttempts,
    attemptsUsed: row.attemptsUsed,
    safeRetrySummary: row.safeRetrySummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapArchiveManifestFromPrisma(row: any): ResultReportCardArchiveManifest {
  return {
    resultReportCardArchiveManifestId: row.resultReportCardArchiveManifestId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    resultReportCardExportEnvelopeId: row.resultReportCardExportEnvelopeId || null,
    resultReportCardExportReceiptId: row.resultReportCardExportReceiptId || null,
    manifestStatus: row.manifestStatus,
    manifestMode: row.manifestMode,
    safeArchiveSummary: row.safeArchiveSummary,
    archiveMetadataJson: (row.archiveMetadataJson as Record<string, unknown>) || null,
    retentionPolicyJson: (row.retentionPolicyJson as Record<string, unknown>) || null,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    sealedAt: row.sealedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapArchiveManifestPreviewFromPrisma(row: any): ResultReportCardArchiveManifestPreview {
  return {
    resultReportCardArchiveManifestId: row.resultReportCardArchiveManifestId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    manifestStatus: row.manifestStatus,
    manifestMode: row.manifestMode,
    safeArchiveSummary: row.safeArchiveSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapExportAuditFromPrisma(row: any): ResultReportCardExportAuditEvent {
  return {
    resultReportCardExportAuditId: row.resultReportCardExportAuditId,
    schoolId: row.schoolId,
    resultReportCardExportJobId: row.resultReportCardExportJobId || null,
    resultReportCardExportTargetId: row.resultReportCardExportTargetId || null,
    resultReportCardExportEnvelopeId: row.resultReportCardExportEnvelopeId || null,
    resultReportCardMockExportAttemptId: row.resultReportCardMockExportAttemptId || null,
    resultReportCardExportReceiptId: row.resultReportCardExportReceiptId || null,
    resultReportCardExportSuppressionId: row.resultReportCardExportSuppressionId || null,
    resultReportCardExportRetryPlanId: row.resultReportCardExportRetryPlanId || null,
    resultReportCardArchiveManifestId: row.resultReportCardArchiveManifestId || null,
    actorId: row.actorId,
    actorRole: row.actorRole,
    eventType: row.eventType,
    decision: row.decision,
    safeSummary: row.safeSummary,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || null,
    metadataJson: (row.metadataJson as Record<string, unknown>) || null,
    requestId: row.requestId || null,
    correlationId: row.correlationId || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapExportIdempotencyFromPrisma(row: any): ResultReportCardExportIdempotencyEntry {
  return {
    resultReportCardExportIdempotencyId: row.resultReportCardExportIdempotencyId,
    schoolId: row.schoolId,
    operation: row.operation,
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    status: row.status,
    resourceType: row.resourceType || null,
    resourceId: row.resourceId || null,
    safeResultSummary: row.safeResultSummary || null,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    expiresAt: row.expiresAt?.toISOString() || null,
  };
}

export class PrismaResultReportCardExportJobRepository implements ResultReportCardExportJobRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateExportJobInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportJob> {
    const row = await this.prisma.resultReportCardExportJobRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId,
        resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId,
        resultReportCardReviewId: input.resultReportCardReviewId,
        resultReportCardExportIntentId: input.resultReportCardExportIntentId,
        resultReportCardRenderManifestId: input.resultReportCardRenderManifestId,
        resultReleasePacketId: input.resultReleasePacketId,
        resultDeliveryReceiptId: input.resultDeliveryReceiptId || null,
        studentRef: input.studentRef,
        paperId: input.paperId,
        paperVersionId: input.paperVersionId,
        deliverySessionId: input.deliverySessionId,
        exportJobStatus: 'draft',
        exportJobMode: input.exportJobMode,
        exportJobPurpose: input.exportJobPurpose,
        safeExportJobSummary: input.safeExportJobSummary,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        allowedChannelsJson: (input.allowedChannelsJson as any) || undefined,
        blockedChannelsJson: (input.blockedChannelsJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapExportJobFromPrisma(row);
  }

  async getById(exportJobId: string): Promise<ResultReportCardExportJob | null> {
    const row = await this.prisma.resultReportCardExportJobRecord.findUnique({ where: { resultReportCardExportJobId: exportJobId } });
    return row ? mapExportJobFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportJobPreview[]> {
    const rows = await this.prisma.resultReportCardExportJobRecord.findMany({ where: { schoolId } });
    return rows.map(mapExportJobPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardExportJobPreview[]> {
    const rows = await this.prisma.resultReportCardExportJobRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapExportJobPreviewFromPrisma);
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardExportJobPreview[]> {
    const rows = await this.prisma.resultReportCardExportJobRecord.findMany({ where: { resultReportCardAssemblyId: assemblyId } });
    return rows.map(mapExportJobPreviewFromPrisma);
  }

  async listByExportIntentId(exportIntentId: string): Promise<ResultReportCardExportJobPreview[]> {
    const rows = await this.prisma.resultReportCardExportJobRecord.findMany({ where: { resultReportCardExportIntentId: exportIntentId } });
    return rows.map(mapExportJobPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportJobStatus | string): Promise<ResultReportCardExportJobPreview[]> {
    const rows = await this.prisma.resultReportCardExportJobRecord.findMany({ where: { schoolId, exportJobStatus: status as string } });
    return rows.map(mapExportJobPreviewFromPrisma);
  }

  async update(exportJobId: string, data: Partial<ResultReportCardExportJob>): Promise<ResultReportCardExportJob> {
    const row = await this.prisma.resultReportCardExportJobRecord.update({
      where: { resultReportCardExportJobId: exportJobId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapExportJobFromPrisma(row);
  }

  async updateStatus(exportJobId: string, input: UpdateExportJobStatusInput): Promise<ResultReportCardExportJob> {
    const data: any = { exportJobStatus: input.status, updatedAt: new Date() };
    if (input.status === 'validated') data.validatedAt = new Date();
    if (input.status === 'queued_mock') data.queuedAt = new Date();
    if (input.status === 'mock_exported' || input.status === 'receipt_recorded' || input.status === 'archive_manifest_ready') data.completedAt = new Date();
    if (input.status === 'blocked') data.blockedAt = new Date();
    if (input.status === 'cancelled') data.cancelledAt = new Date();
    if (input.status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardExportJobRecord.update({
      where: { resultReportCardExportJobId: exportJobId },
      data,
    });
    return mapExportJobFromPrisma(row);
  }

  async block(exportJobId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportJob> {
    return this.updateStatus(exportJobId, { status: 'blocked', reasonCode, safeMessage });
  }

  async cancel(exportJobId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportJob> {
    return this.updateStatus(exportJobId, { status: 'cancelled', reasonCode, safeMessage });
  }

  async void(exportJobId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportJob> {
    return this.updateStatus(exportJobId, { status: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultReportCardExportTargetRepository implements ResultReportCardExportTargetRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateExportTargetInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportTarget> {
    const row = await this.prisma.resultReportCardExportTargetRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardExportJobId: input.resultReportCardExportJobId,
        targetType: input.targetType,
        targetStatus: 'draft',
        targetMode: input.targetMode,
        audienceType: input.audienceType,
        safeTargetSummary: input.safeTargetSummary,
        targetDescriptorJson: (input.targetDescriptorJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapExportTargetFromPrisma(row);
  }

  async getById(exportTargetId: string): Promise<ResultReportCardExportTarget | null> {
    const row = await this.prisma.resultReportCardExportTargetRecord.findUnique({ where: { resultReportCardExportTargetId: exportTargetId } });
    return row ? mapExportTargetFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportTargetPreview[]> {
    const rows = await this.prisma.resultReportCardExportTargetRecord.findMany({ where: { schoolId } });
    return rows.map(mapExportTargetPreviewFromPrisma);
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportTargetPreview[]> {
    const rows = await this.prisma.resultReportCardExportTargetRecord.findMany({ where: { resultReportCardExportJobId: exportJobId } });
    return rows.map(mapExportTargetPreviewFromPrisma);
  }

  async listByTargetType(schoolId: string, targetType: string): Promise<ResultReportCardExportTargetPreview[]> {
    const rows = await this.prisma.resultReportCardExportTargetRecord.findMany({ where: { schoolId, targetType } });
    return rows.map(mapExportTargetPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportTargetStatus | string): Promise<ResultReportCardExportTargetPreview[]> {
    const rows = await this.prisma.resultReportCardExportTargetRecord.findMany({ where: { schoolId, targetStatus: status as string } });
    return rows.map(mapExportTargetPreviewFromPrisma);
  }

  async update(exportTargetId: string, data: Partial<ResultReportCardExportTarget>): Promise<ResultReportCardExportTarget> {
    const row = await this.prisma.resultReportCardExportTargetRecord.update({
      where: { resultReportCardExportTargetId: exportTargetId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapExportTargetFromPrisma(row);
  }

  async updateStatus(exportTargetId: string, status: ResultReportCardExportTargetStatus | string): Promise<ResultReportCardExportTarget> {
    const data: any = { targetStatus: status, updatedAt: new Date() };
    if (status === 'validated') data.validatedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardExportTargetRecord.update({
      where: { resultReportCardExportTargetId: exportTargetId },
      data,
    });
    return mapExportTargetFromPrisma(row);
  }

  async suppress(exportTargetId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportTarget> {
    return this.updateStatus(exportTargetId, 'suppressed');
  }

  async block(exportTargetId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportTarget> {
    return this.updateStatus(exportTargetId, 'blocked');
  }

  async void(exportTargetId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportTarget> {
    return this.updateStatus(exportTargetId, 'void');
  }
}

export class PrismaResultReportCardExportEnvelopeRepository implements ResultReportCardExportEnvelopeRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateExportEnvelopeInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportEnvelope> {
    const row = await this.prisma.resultReportCardExportEnvelopeRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardExportJobId: input.resultReportCardExportJobId,
        resultReportCardExportTargetId: input.resultReportCardExportTargetId,
        resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId,
        resultReportCardRenderManifestId: input.resultReportCardRenderManifestId,
        envelopeStatus: 'draft',
        envelopeMode: input.envelopeMode,
        safeEnvelopeSummary: input.safeEnvelopeSummary,
        safePayloadJson: (input.safePayloadJson as any) || undefined,
        redactionRulesJson: (input.redactionRulesJson as any) || undefined,
        allowedFieldNamesJson: (input.allowedFieldNamesJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapExportEnvelopeFromPrisma(row);
  }

  async getById(exportEnvelopeId: string): Promise<ResultReportCardExportEnvelope | null> {
    const row = await this.prisma.resultReportCardExportEnvelopeRecord.findUnique({ where: { resultReportCardExportEnvelopeId: exportEnvelopeId } });
    return row ? mapExportEnvelopeFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportEnvelopePreview[]> {
    const rows = await this.prisma.resultReportCardExportEnvelopeRecord.findMany({ where: { schoolId } });
    return rows.map(mapExportEnvelopePreviewFromPrisma);
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportEnvelopePreview[]> {
    const rows = await this.prisma.resultReportCardExportEnvelopeRecord.findMany({ where: { resultReportCardExportJobId: exportJobId } });
    return rows.map(mapExportEnvelopePreviewFromPrisma);
  }

  async listByTargetId(targetId: string): Promise<ResultReportCardExportEnvelopePreview[]> {
    const rows = await this.prisma.resultReportCardExportEnvelopeRecord.findMany({ where: { resultReportCardExportTargetId: targetId } });
    return rows.map(mapExportEnvelopePreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportEnvelopeStatus | string): Promise<ResultReportCardExportEnvelopePreview[]> {
    const rows = await this.prisma.resultReportCardExportEnvelopeRecord.findMany({ where: { schoolId, envelopeStatus: status as string } });
    return rows.map(mapExportEnvelopePreviewFromPrisma);
  }

  async update(exportEnvelopeId: string, data: Partial<ResultReportCardExportEnvelope>): Promise<ResultReportCardExportEnvelope> {
    const row = await this.prisma.resultReportCardExportEnvelopeRecord.update({
      where: { resultReportCardExportEnvelopeId: exportEnvelopeId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapExportEnvelopeFromPrisma(row);
  }

  async updateStatus(exportEnvelopeId: string, status: ResultReportCardExportEnvelopeStatus | string): Promise<ResultReportCardExportEnvelope> {
    const data: any = { envelopeStatus: status, updatedAt: new Date() };
    if (status === 'sealed') data.sealedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardExportEnvelopeRecord.update({
      where: { resultReportCardExportEnvelopeId: exportEnvelopeId },
      data,
    });
    return mapExportEnvelopeFromPrisma(row);
  }

  async seal(exportEnvelopeId: string): Promise<ResultReportCardExportEnvelope> {
    return this.updateStatus(exportEnvelopeId, 'sealed');
  }

  async suppress(exportEnvelopeId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportEnvelope> {
    return this.updateStatus(exportEnvelopeId, 'suppressed');
  }

  async block(exportEnvelopeId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportEnvelope> {
    return this.updateStatus(exportEnvelopeId, 'blocked');
  }

  async void(exportEnvelopeId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportEnvelope> {
    return this.updateStatus(exportEnvelopeId, 'void');
  }
}

export class PrismaResultReportCardMockExportAttemptRepository implements ResultReportCardMockExportAttemptRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateMockExportAttemptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardMockExportAttempt> {
    const row = await this.prisma.resultReportCardMockExportAttemptRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardExportJobId: input.resultReportCardExportJobId,
        resultReportCardExportTargetId: input.resultReportCardExportTargetId,
        resultReportCardExportEnvelopeId: input.resultReportCardExportEnvelopeId,
        attemptStatus: 'created',
        attemptMode: input.attemptMode,
        mockProviderName: input.mockProviderName,
        targetType: input.targetType,
        attemptNumber: input.attemptNumber ?? 1,
        safeAttemptSummary: input.safeAttemptSummary,
        providerSimulationJson: (input.providerSimulationJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapMockExportAttemptFromPrisma(row);
  }

  async getById(mockExportAttemptId: string): Promise<ResultReportCardMockExportAttempt | null> {
    const row = await this.prisma.resultReportCardMockExportAttemptRecord.findUnique({ where: { resultReportCardMockExportAttemptId: mockExportAttemptId } });
    return row ? mapMockExportAttemptFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardMockExportAttemptPreview[]> {
    const rows = await this.prisma.resultReportCardMockExportAttemptRecord.findMany({ where: { schoolId } });
    return rows.map(mapMockExportAttemptPreviewFromPrisma);
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardMockExportAttemptPreview[]> {
    const rows = await this.prisma.resultReportCardMockExportAttemptRecord.findMany({ where: { resultReportCardExportJobId: exportJobId } });
    return rows.map(mapMockExportAttemptPreviewFromPrisma);
  }

  async listByTargetId(targetId: string): Promise<ResultReportCardMockExportAttemptPreview[]> {
    const rows = await this.prisma.resultReportCardMockExportAttemptRecord.findMany({ where: { resultReportCardExportTargetId: targetId } });
    return rows.map(mapMockExportAttemptPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardMockExportAttemptStatus | string): Promise<ResultReportCardMockExportAttemptPreview[]> {
    const rows = await this.prisma.resultReportCardMockExportAttemptRecord.findMany({ where: { schoolId, attemptStatus: status as string } });
    return rows.map(mapMockExportAttemptPreviewFromPrisma);
  }

  async update(mockExportAttemptId: string, data: Partial<ResultReportCardMockExportAttempt>): Promise<ResultReportCardMockExportAttempt> {
    const row = await this.prisma.resultReportCardMockExportAttemptRecord.update({
      where: { resultReportCardMockExportAttemptId: mockExportAttemptId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapMockExportAttemptFromPrisma(row);
  }

  async updateStatus(mockExportAttemptId: string, status: ResultReportCardMockExportAttemptStatus | string): Promise<ResultReportCardMockExportAttempt> {
    const data: any = { attemptStatus: status, updatedAt: new Date() };
    if (status === 'started') data.startedAt = new Date();
    if (status === 'completed') data.completedAt = new Date();
    if (status === 'failed') data.failedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardMockExportAttemptRecord.update({
      where: { resultReportCardMockExportAttemptId: mockExportAttemptId },
      data,
    });
    return mapMockExportAttemptFromPrisma(row);
  }

  async start(mockExportAttemptId: string): Promise<ResultReportCardMockExportAttempt> {
    return this.updateStatus(mockExportAttemptId, 'started');
  }

  async complete(mockExportAttemptId: string): Promise<ResultReportCardMockExportAttempt> {
    return this.updateStatus(mockExportAttemptId, 'completed');
  }

  async fail(mockExportAttemptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardMockExportAttempt> {
    return this.updateStatus(mockExportAttemptId, 'failed');
  }

  async block(mockExportAttemptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardMockExportAttempt> {
    return this.updateStatus(mockExportAttemptId, 'blocked');
  }

  async void(mockExportAttemptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardMockExportAttempt> {
    return this.updateStatus(mockExportAttemptId, 'void');
  }
}

export class PrismaResultReportCardExportReceiptRepository implements ResultReportCardExportReceiptRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateExportReceiptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportReceipt> {
    const row = await this.prisma.resultReportCardExportReceiptRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardExportJobId: input.resultReportCardExportJobId,
        resultReportCardExportTargetId: input.resultReportCardExportTargetId,
        resultReportCardExportEnvelopeId: input.resultReportCardExportEnvelopeId,
        resultReportCardMockExportAttemptId: input.resultReportCardMockExportAttemptId,
        receiptStatus: 'created',
        receiptType: input.receiptType,
        safeReceiptSummary: input.safeReceiptSummary,
        providerSimulationJson: (input.providerSimulationJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapExportReceiptFromPrisma(row);
  }

  async getById(exportReceiptId: string): Promise<ResultReportCardExportReceipt | null> {
    const row = await this.prisma.resultReportCardExportReceiptRecord.findUnique({ where: { resultReportCardExportReceiptId: exportReceiptId } });
    return row ? mapExportReceiptFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportReceiptPreview[]> {
    const rows = await this.prisma.resultReportCardExportReceiptRecord.findMany({ where: { schoolId } });
    return rows.map(mapExportReceiptPreviewFromPrisma);
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportReceiptPreview[]> {
    const rows = await this.prisma.resultReportCardExportReceiptRecord.findMany({ where: { resultReportCardExportJobId: exportJobId } });
    return rows.map(mapExportReceiptPreviewFromPrisma);
  }

  async listByTargetId(targetId: string): Promise<ResultReportCardExportReceiptPreview[]> {
    const rows = await this.prisma.resultReportCardExportReceiptRecord.findMany({ where: { resultReportCardExportTargetId: targetId } });
    return rows.map(mapExportReceiptPreviewFromPrisma);
  }

  async listByAttemptId(attemptId: string): Promise<ResultReportCardExportReceiptPreview[]> {
    const rows = await this.prisma.resultReportCardExportReceiptRecord.findMany({ where: { resultReportCardMockExportAttemptId: attemptId } });
    return rows.map(mapExportReceiptPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportReceiptStatus | string): Promise<ResultReportCardExportReceiptPreview[]> {
    const rows = await this.prisma.resultReportCardExportReceiptRecord.findMany({ where: { schoolId, receiptStatus: status as string } });
    return rows.map(mapExportReceiptPreviewFromPrisma);
  }

  async update(exportReceiptId: string, data: Partial<ResultReportCardExportReceipt>): Promise<ResultReportCardExportReceipt> {
    const row = await this.prisma.resultReportCardExportReceiptRecord.update({
      where: { resultReportCardExportReceiptId: exportReceiptId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapExportReceiptFromPrisma(row);
  }

  async updateStatus(exportReceiptId: string, status: ResultReportCardExportReceiptStatus | string): Promise<ResultReportCardExportReceipt> {
    const data: any = { receiptStatus: status, updatedAt: new Date() };
    if (status === 'recorded') data.updatedAt = new Date();
    if (status === 'blocked') data.updatedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardExportReceiptRecord.update({
      where: { resultReportCardExportReceiptId: exportReceiptId },
      data,
    });
    return mapExportReceiptFromPrisma(row);
  }

  async block(exportReceiptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportReceipt> {
    return this.updateStatus(exportReceiptId, 'blocked');
  }

  async void(exportReceiptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportReceipt> {
    return this.updateStatus(exportReceiptId, 'void');
  }
}

export class PrismaResultReportCardExportSuppressionRepository implements ResultReportCardExportSuppressionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateExportSuppressionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportSuppression> {
    const row = await this.prisma.resultReportCardExportSuppressionRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardExportJobId: input.resultReportCardExportJobId,
        resultReportCardExportTargetId: input.resultReportCardExportTargetId || null,
        resultReportCardExportEnvelopeId: input.resultReportCardExportEnvelopeId || null,
        suppressionStatus: 'active',
        suppressionReason: input.suppressionReason,
        suppressionScope: input.suppressionScope,
        safeSuppressionSummary: input.safeSuppressionSummary,
        reasonCodesJson: (input.reasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapExportSuppressionFromPrisma(row);
  }

  async getById(exportSuppressionId: string): Promise<ResultReportCardExportSuppression | null> {
    const row = await this.prisma.resultReportCardExportSuppressionRecord.findUnique({ where: { resultReportCardExportSuppressionId: exportSuppressionId } });
    return row ? mapExportSuppressionFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportSuppressionPreview[]> {
    const rows = await this.prisma.resultReportCardExportSuppressionRecord.findMany({ where: { schoolId } });
    return rows.map(mapExportSuppressionPreviewFromPrisma);
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportSuppressionPreview[]> {
    const rows = await this.prisma.resultReportCardExportSuppressionRecord.findMany({ where: { resultReportCardExportJobId: exportJobId } });
    return rows.map(mapExportSuppressionPreviewFromPrisma);
  }

  async listByTargetId(targetId: string): Promise<ResultReportCardExportSuppressionPreview[]> {
    const rows = await this.prisma.resultReportCardExportSuppressionRecord.findMany({ where: { resultReportCardExportTargetId: targetId } });
    return rows.map(mapExportSuppressionPreviewFromPrisma);
  }

  async listByEnvelopeId(envelopeId: string): Promise<ResultReportCardExportSuppressionPreview[]> {
    const rows = await this.prisma.resultReportCardExportSuppressionRecord.findMany({ where: { resultReportCardExportEnvelopeId: envelopeId } });
    return rows.map(mapExportSuppressionPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportSuppressionStatus | string): Promise<ResultReportCardExportSuppressionPreview[]> {
    const rows = await this.prisma.resultReportCardExportSuppressionRecord.findMany({ where: { schoolId, suppressionStatus: status as string } });
    return rows.map(mapExportSuppressionPreviewFromPrisma);
  }

  async update(exportSuppressionId: string, data: Partial<ResultReportCardExportSuppression>): Promise<ResultReportCardExportSuppression> {
    const row = await this.prisma.resultReportCardExportSuppressionRecord.update({
      where: { resultReportCardExportSuppressionId: exportSuppressionId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapExportSuppressionFromPrisma(row);
  }

  async updateStatus(exportSuppressionId: string, status: ResultReportCardExportSuppressionStatus | string): Promise<ResultReportCardExportSuppression> {
    const data: any = { suppressionStatus: status, updatedAt: new Date() };
    if (status === 'lifted') data.liftedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardExportSuppressionRecord.update({
      where: { resultReportCardExportSuppressionId: exportSuppressionId },
      data,
    });
    return mapExportSuppressionFromPrisma(row);
  }

  async lift(exportSuppressionId: string): Promise<ResultReportCardExportSuppression> {
    return this.updateStatus(exportSuppressionId, 'lifted');
  }

  async void(exportSuppressionId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportSuppression> {
    return this.updateStatus(exportSuppressionId, 'void');
  }
}

export class PrismaResultReportCardExportRetryPlanRepository implements ResultReportCardExportRetryPlanRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateExportRetryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportRetryPlan> {
    const row = await this.prisma.resultReportCardExportRetryPlanRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardExportJobId: input.resultReportCardExportJobId,
        resultReportCardMockExportAttemptId: input.resultReportCardMockExportAttemptId,
        retryStatus: 'draft',
        retryPolicy: input.retryPolicy || 'default',
        nextMockRetryAt: input.nextMockRetryAt ? new Date(input.nextMockRetryAt) : null,
        maxMockAttempts: input.maxMockAttempts ?? 3,
        attemptsUsed: input.attemptsUsed ?? 0,
        safeRetrySummary: input.safeRetrySummary,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapExportRetryPlanFromPrisma(row);
  }

  async getById(exportRetryPlanId: string): Promise<ResultReportCardExportRetryPlan | null> {
    const row = await this.prisma.resultReportCardExportRetryPlanRecord.findUnique({ where: { resultReportCardExportRetryPlanId: exportRetryPlanId } });
    return row ? mapExportRetryPlanFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportRetryPlanPreview[]> {
    const rows = await this.prisma.resultReportCardExportRetryPlanRecord.findMany({ where: { schoolId } });
    return rows.map(mapExportRetryPlanPreviewFromPrisma);
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportRetryPlanPreview[]> {
    const rows = await this.prisma.resultReportCardExportRetryPlanRecord.findMany({ where: { resultReportCardExportJobId: exportJobId } });
    return rows.map(mapExportRetryPlanPreviewFromPrisma);
  }

  async listByAttemptId(attemptId: string): Promise<ResultReportCardExportRetryPlanPreview[]> {
    const rows = await this.prisma.resultReportCardExportRetryPlanRecord.findMany({ where: { resultReportCardMockExportAttemptId: attemptId } });
    return rows.map(mapExportRetryPlanPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportRetryPlanStatus | string): Promise<ResultReportCardExportRetryPlanPreview[]> {
    const rows = await this.prisma.resultReportCardExportRetryPlanRecord.findMany({ where: { schoolId, retryStatus: status as string } });
    return rows.map(mapExportRetryPlanPreviewFromPrisma);
  }

  async update(exportRetryPlanId: string, data: Partial<ResultReportCardExportRetryPlan>): Promise<ResultReportCardExportRetryPlan> {
    const row = await this.prisma.resultReportCardExportRetryPlanRecord.update({
      where: { resultReportCardExportRetryPlanId: exportRetryPlanId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapExportRetryPlanFromPrisma(row);
  }

  async updateStatus(exportRetryPlanId: string, status: ResultReportCardExportRetryPlanStatus | string): Promise<ResultReportCardExportRetryPlan> {
    const data: any = { retryStatus: status, updatedAt: new Date() };
    if (status === 'cancelled') data.cancelledAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardExportRetryPlanRecord.update({
      where: { resultReportCardExportRetryPlanId: exportRetryPlanId },
      data,
    });
    return mapExportRetryPlanFromPrisma(row);
  }

  async markPlanned(exportRetryPlanId: string): Promise<ResultReportCardExportRetryPlan> {
    return this.updateStatus(exportRetryPlanId, 'planned');
  }

  async cancel(exportRetryPlanId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportRetryPlan> {
    return this.updateStatus(exportRetryPlanId, 'cancelled');
  }

  async exhaust(exportRetryPlanId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportRetryPlan> {
    return this.updateStatus(exportRetryPlanId, 'exhausted');
  }

  async void(exportRetryPlanId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportRetryPlan> {
    return this.updateStatus(exportRetryPlanId, 'void');
  }
}

export class PrismaResultReportCardArchiveManifestRepository implements ResultReportCardArchiveManifestRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateArchiveManifestInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardArchiveManifest> {
    const row = await this.prisma.resultReportCardArchiveManifestRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardExportJobId: input.resultReportCardExportJobId,
        resultReportCardExportEnvelopeId: input.resultReportCardExportEnvelopeId || null,
        resultReportCardExportReceiptId: input.resultReportCardExportReceiptId || null,
        manifestStatus: 'draft',
        manifestMode: input.manifestMode,
        safeArchiveSummary: input.safeArchiveSummary,
        archiveMetadataJson: (input.archiveMetadataJson as any) || undefined,
        retentionPolicyJson: (input.retentionPolicyJson as any) || undefined,
        allowedFieldNamesJson: (input.allowedFieldNamesJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapArchiveManifestFromPrisma(row);
  }

  async getById(archiveManifestId: string): Promise<ResultReportCardArchiveManifest | null> {
    const row = await this.prisma.resultReportCardArchiveManifestRecord.findUnique({ where: { resultReportCardArchiveManifestId: archiveManifestId } });
    return row ? mapArchiveManifestFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardArchiveManifestPreview[]> {
    const rows = await this.prisma.resultReportCardArchiveManifestRecord.findMany({ where: { schoolId } });
    return rows.map(mapArchiveManifestPreviewFromPrisma);
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardArchiveManifestPreview[]> {
    const rows = await this.prisma.resultReportCardArchiveManifestRecord.findMany({ where: { resultReportCardExportJobId: exportJobId } });
    return rows.map(mapArchiveManifestPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardArchiveManifestStatus | string): Promise<ResultReportCardArchiveManifestPreview[]> {
    const rows = await this.prisma.resultReportCardArchiveManifestRecord.findMany({ where: { schoolId, manifestStatus: status as string } });
    return rows.map(mapArchiveManifestPreviewFromPrisma);
  }

  async update(archiveManifestId: string, data: Partial<ResultReportCardArchiveManifest>): Promise<ResultReportCardArchiveManifest> {
    const row = await this.prisma.resultReportCardArchiveManifestRecord.update({
      where: { resultReportCardArchiveManifestId: archiveManifestId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapArchiveManifestFromPrisma(row);
  }

  async updateStatus(archiveManifestId: string, status: ResultReportCardArchiveManifestStatus | string): Promise<ResultReportCardArchiveManifest> {
    const data: any = { manifestStatus: status, updatedAt: new Date() };
    if (status === 'generated') data.updatedAt = new Date();
    if (status === 'sealed') data.sealedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardArchiveManifestRecord.update({
      where: { resultReportCardArchiveManifestId: archiveManifestId },
      data,
    });
    return mapArchiveManifestFromPrisma(row);
  }

  async seal(archiveManifestId: string): Promise<ResultReportCardArchiveManifest> {
    return this.updateStatus(archiveManifestId, 'sealed');
  }

  async block(archiveManifestId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardArchiveManifest> {
    return this.updateStatus(archiveManifestId, 'blocked');
  }

  async void(archiveManifestId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardArchiveManifest> {
    return this.updateStatus(archiveManifestId, 'void');
  }
}

export class PrismaResultReportCardExportAuditRepository implements ResultReportCardExportAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(event: ResultReportCardExportAuditEvent): Promise<ResultReportCardExportAuditEvent> {
    const row = await this.prisma.resultReportCardExportAuditRecord.create({ data: event as any });
    return mapExportAuditFromPrisma(row);
  }

  async getById(auditId: string): Promise<ResultReportCardExportAuditEvent | null> {
    const row = await this.prisma.resultReportCardExportAuditRecord.findUnique({ where: { resultReportCardExportAuditId: auditId } });
    return row ? mapExportAuditFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportAuditEvent[]> {
    const rows = await this.prisma.resultReportCardExportAuditRecord.findMany({ where: { schoolId } });
    return rows.map(mapExportAuditFromPrisma);
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportAuditEvent[]> {
    const rows = await this.prisma.resultReportCardExportAuditRecord.findMany({ where: { resultReportCardExportJobId: exportJobId } });
    return rows.map(mapExportAuditFromPrisma);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultReportCardExportAuditEvent[]> {
    const rows = await this.prisma.resultReportCardExportAuditRecord.findMany({ where: { schoolId, eventType } });
    return rows.map(mapExportAuditFromPrisma);
  }

  async listByActorId(actorId: string): Promise<ResultReportCardExportAuditEvent[]> {
    const rows = await this.prisma.resultReportCardExportAuditRecord.findMany({ where: { actorId } });
    return rows.map(mapExportAuditFromPrisma);
  }
}

export class PrismaResultReportCardExportIdempotencyRepository implements ResultReportCardExportIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<ResultReportCardExportIdempotencyEntry> {
    const row = await this.prisma.resultReportCardExportIdempotencyRecord.create({
      data: {
        schoolId: input.schoolId,
        operation: input.operation,
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        status: input.status || 'pending',
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        safeResultSummary: input.safeResultSummary ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    return mapExportIdempotencyFromPrisma(row);
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardExportIdempotencyEntry | null> {
    const row = await this.prisma.resultReportCardExportIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    }).catch(() => null);
    return row ? mapExportIdempotencyFromPrisma(row) : null;
  }

  async updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<ResultReportCardExportIdempotencyEntry> {
    const data: any = { status, updatedAt: new Date() };
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const row = await this.prisma.resultReportCardExportIdempotencyRecord.update({
      where: { resultReportCardExportIdempotencyId: idempotencyId },
      data,
    });
    return mapExportIdempotencyFromPrisma(row);
  }

  async expire(idempotencyId: string): Promise<ResultReportCardExportIdempotencyEntry> {
    return this.updateStatus(idempotencyId, 'expired');
  }
}
