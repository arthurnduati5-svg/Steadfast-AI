import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import type {
  ResultReportCardAccessGrant,
  CreateAccessGrantInput,
  ResultReportCardAccessGrantPreview,
  UpdateAccessGrantStatusInput,
  ResultReportCardAccessRecipient,
  CreateAccessRecipientInput,
  ResultReportCardAccessRecipientPreview,
  UpdateAccessRecipientStatusInput,
  ResultReportCardPortalPreview,
  CreatePortalPreviewInput,
  ResultReportCardPortalPreviewPreview,
  UpdatePortalPreviewStatusInput,
  ResultReportCardAccessTokenIntent,
  CreateAccessTokenIntentInput,
  ResultReportCardAccessTokenIntentPreview,
  UpdateAccessTokenIntentStatusInput,
  ResultReportCardAccessAcknowledgement,
  CreateAccessAcknowledgementInput,
  ResultReportCardAccessAcknowledgementPreview,
  UpdateAccessAcknowledgementStatusInput,
  ResultReportCardAccessRevocation,
  CreateAccessRevocationInput,
  ResultReportCardAccessRevocationPreview,
  UpdateAccessRevocationStatusInput,
  ResultReportCardAccessExpiry,
  CreateAccessExpiryInput,
  ResultReportCardAccessExpiryPreview,
  UpdateAccessExpiryStatusInput,
  ResultReportCardAccessTimeline,
  CreateAccessTimelineInput,
  ResultReportCardAccessTimelinePreview,
  UpdateAccessTimelineStatusInput,
  ResultReportCardAccessAuditEvent,
  ResultReportCardAccessIdempotencyEntry,
  ResultReportCardAccessGrantStatus,
  ResultReportCardAccessRecipientStatus,
  ResultReportCardPortalPreviewStatus,
  ResultReportCardAccessTokenIntentStatus,
  ResultReportCardAccessAcknowledgementStatus,
  ResultReportCardAccessRevocationStatus,
  ResultReportCardAccessExpiryStatus,
  ResultReportCardAccessTimelineStatus,
} from '../contracts';
import type {
  ResultReportCardAccessGrantRepository,
  ResultReportCardAccessRecipientRepository,
  ResultReportCardPortalPreviewRepository,
  ResultReportCardAccessTokenIntentRepository,
  ResultReportCardAccessAcknowledgementRepository,
  ResultReportCardAccessRevocationRepository,
  ResultReportCardAccessExpiryRepository,
  ResultReportCardAccessTimelineRepository,
  ResultReportCardAccessAuditRepository,
  ResultReportCardAccessIdempotencyRepository,
} from '../contracts';

interface ResultReportCardAccessSummary {
  resultReportCardAccessSummaryId: string;
  schoolId: string;
  studentRef: string | null;
  resultReportCardAssemblyId: string | null;
  resultReportCardExportJobId: string | null;
  summaryStatus: string;
  summaryScope: string;
  safeSummary: string;
  audienceCountsJson: Record<string, unknown> | null;
  statusCountsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  refreshedAt: string | null;
  voidedAt: string | null;
}

interface CreateAccessSummaryInput {
  studentRef?: string;
  resultReportCardAssemblyId?: string;
  resultReportCardExportJobId?: string;
  summaryScope: string;
  safeSummary: string;
  audienceCountsJson?: Record<string, unknown>;
  statusCountsJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

interface ResultReportCardAccessSummaryPreview {
  resultReportCardAccessSummaryId: string;
  schoolId: string;
  summaryStatus: string;
  summaryScope: string;
  safeSummary: string;
  refreshedAt: string | null;
  createdAt: string;
}

interface ResultReportCardAccessSummaryRepository {
  create(input: CreateAccessSummaryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessSummary>;
  getById(summaryId: string): Promise<ResultReportCardAccessSummary | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessSummaryPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAccessSummaryPreview[]>;
  listByStatus(schoolId: string, status: string): Promise<ResultReportCardAccessSummaryPreview[]>;
  update(summaryId: string, data: Partial<ResultReportCardAccessSummary>): Promise<ResultReportCardAccessSummary>;
  updateStatus(summaryId: string, status: string): Promise<ResultReportCardAccessSummary>;
  refresh(summaryId: string): Promise<ResultReportCardAccessSummary>;
  void(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessSummary>;
}

function mapAccessGrantFromPrisma(row: any): ResultReportCardAccessGrant {
  return {
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    schoolId: row.schoolId,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    resultReportCardAudienceProjectionId: row.resultReportCardAudienceProjectionId,
    resultReportCardReviewId: row.resultReportCardReviewId,
    studentRef: row.studentRef,
    audienceType: row.audienceType,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    resultReportCardExportTargetId: row.resultReportCardExportTargetId,
    resultReportCardExportEnvelopeId: row.resultReportCardExportEnvelopeId,
    resultReportCardExportReceiptId: row.resultReportCardExportReceiptId || null,
    resultReportCardArchiveManifestId: row.resultReportCardArchiveManifestId || null,
    resultReleasePacketId: row.resultReleasePacketId,
    paperId: '',
    paperVersionId: '',
    deliverySessionId: '',
    grantStatus: row.accessGrantStatus,
    grantMode: row.accessGrantMode,
    grantPurpose: '',
    safeGrantSummary: row.safeAccessSummary,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    allowedChannelsJson: (row.allowedActionsJson as Record<string, unknown>) || null,
    blockedChannelsJson: (row.blockedActionsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    validatedAt: row.validatedAt?.toISOString() || null,
    readyAt: row.readyAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    revokedAt: row.revokedAt?.toISOString() || null,
    expiredAt: row.expiredAt?.toISOString() || null,
    blockedAt: null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAccessGrantPreviewFromPrisma(row: any): ResultReportCardAccessGrantPreview {
  return {
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    schoolId: row.schoolId,
    grantStatus: row.accessGrantStatus,
    grantMode: row.accessGrantMode,
    grantPurpose: '',
    safeGrantSummary: row.safeAccessSummary,
    studentRef: row.studentRef,
    audienceType: row.audienceType,
    resultReportCardExportJobId: row.resultReportCardExportJobId,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
  };
}

function mapAccessRecipientFromPrisma(row: any): ResultReportCardAccessRecipient {
  return {
    resultReportCardAccessRecipientId: row.resultReportCardAccessRecipientId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    recipientStatus: row.recipientStatus,
    audienceType: row.audienceType,
    safeRecipientSummary: row.safeRecipientSummary,
    recipientDescriptorJson: (row.recipientDescriptorJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    validatedAt: row.validatedAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    revokedAt: row.revokedAt?.toISOString() || null,
    blockedAt: null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAccessRecipientPreviewFromPrisma(row: any): ResultReportCardAccessRecipientPreview {
  return {
    resultReportCardAccessRecipientId: row.resultReportCardAccessRecipientId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    recipientStatus: row.recipientStatus,
    audienceType: row.audienceType,
    safeRecipientSummary: row.safeRecipientSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapPortalPreviewFromPrisma(row: any): ResultReportCardPortalPreview {
  return {
    resultReportCardPortalPreviewId: row.resultReportCardPortalPreviewId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    resultReportCardAccessRecipientId: row.resultReportCardAccessRecipientId,
    previewStatus: row.previewStatus,
    previewMode: row.previewMode,
    safePreviewSummary: row.safePreviewSummary,
    safePayloadJson: (row.safePreviewPayloadJson as Record<string, unknown>) || null,
    redactionRulesJson: (row.redactionRulesJson as Record<string, unknown>) || null,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    sealedAt: row.sealedAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapPortalPreviewPreviewFromPrisma(row: any): ResultReportCardPortalPreviewPreview {
  return {
    resultReportCardPortalPreviewId: row.resultReportCardPortalPreviewId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    resultReportCardAccessRecipientId: row.resultReportCardAccessRecipientId,
    previewStatus: row.previewStatus,
    previewMode: row.previewMode,
    safePreviewSummary: row.safePreviewSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapAccessTokenIntentFromPrisma(row: any): ResultReportCardAccessTokenIntent {
  return {
    resultReportCardAccessTokenIntentId: row.resultReportCardAccessTokenIntentId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    tokenIntentStatus: row.intentStatus,
    tokenIntentMode: row.intentMode,
    safeTokenIntentSummary: row.safeTokenIntentSummary,
    tokenDescriptorJson: (row.tokenIntentMetadataJson as Record<string, unknown>) || null,
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

function mapAccessTokenIntentPreviewFromPrisma(row: any): ResultReportCardAccessTokenIntentPreview {
  return {
    resultReportCardAccessTokenIntentId: row.resultReportCardAccessTokenIntentId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    tokenIntentStatus: row.intentStatus,
    tokenIntentMode: row.intentMode,
    safeTokenIntentSummary: row.safeTokenIntentSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapAccessAcknowledgementFromPrisma(row: any): ResultReportCardAccessAcknowledgement {
  return {
    resultReportCardAccessAcknowledgementId: row.resultReportCardAccessAcknowledgementId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    resultReportCardAccessRecipientId: row.resultReportCardAccessRecipientId,
    resultReportCardPortalPreviewId: row.resultReportCardPortalPreviewId || '',
    acknowledgementStatus: row.acknowledgementStatus,
    acknowledgementType: row.acknowledgementType,
    safeAcknowledgementSummary: row.safeAcknowledgementSummary,
    providerSimulationJson: (row.acknowledgementMetadataJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAccessAcknowledgementPreviewFromPrisma(row: any): ResultReportCardAccessAcknowledgementPreview {
  return {
    resultReportCardAccessAcknowledgementId: row.resultReportCardAccessAcknowledgementId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    acknowledgementStatus: row.acknowledgementStatus,
    acknowledgementType: row.acknowledgementType,
    safeAcknowledgementSummary: row.safeAcknowledgementSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapAccessRevocationFromPrisma(row: any): ResultReportCardAccessRevocation {
  return {
    resultReportCardAccessRevocationId: row.resultReportCardAccessRevocationId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    resultReportCardAccessRecipientId: row.resultReportCardAccessRecipientId || null,
    resultReportCardPortalPreviewId: null,
    resultReportCardAccessTokenIntentId: null,
    resultReportCardAccessAcknowledgementId: null,
    revocationStatus: row.revocationStatus,
    revocationScope: row.revocationScope,
    revocationReason: row.revocationReason,
    safeRevocationSummary: row.safeRevocationSummary,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    appliedAt: row.appliedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAccessRevocationPreviewFromPrisma(row: any): ResultReportCardAccessRevocationPreview {
  return {
    resultReportCardAccessRevocationId: row.resultReportCardAccessRevocationId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    revocationStatus: row.revocationStatus,
    revocationScope: row.revocationScope,
    revocationReason: row.revocationReason,
    safeRevocationSummary: row.safeRevocationSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapAccessExpiryFromPrisma(row: any): ResultReportCardAccessExpiry {
  return {
    resultReportCardAccessExpiryId: row.resultReportCardAccessExpiryId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    resultReportCardAccessRecipientId: row.resultReportCardAccessRecipientId || null,
    resultReportCardPortalPreviewId: null,
    resultReportCardAccessTokenIntentId: null,
    expiryStatus: row.expiryStatus,
    expiryScope: row.expiryScope,
    expiresAt: row.expiresAt?.toISOString() || '',
    safeExpirySummary: row.safeExpirySummary,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    scheduledAt: row.updatedAt?.toISOString() || null,
    appliedAt: row.appliedAt?.toISOString() || null,
    cancelledAt: row.cancelledAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAccessExpiryPreviewFromPrisma(row: any): ResultReportCardAccessExpiryPreview {
  return {
    resultReportCardAccessExpiryId: row.resultReportCardAccessExpiryId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId,
    expiryStatus: row.expiryStatus,
    expiryScope: row.expiryScope,
    expiresAt: row.expiresAt?.toISOString() || '',
    safeExpirySummary: row.safeExpirySummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapAccessTimelineFromPrisma(row: any): ResultReportCardAccessTimeline {
  return {
    resultReportCardAccessTimelineId: row.resultReportCardAccessTimelineId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId || '',
    resultReportCardAccessRecipientId: row.resultReportCardAccessRecipientId || null,
    resultReportCardPortalPreviewId: null,
    resultReportCardAccessTokenIntentId: null,
    resultReportCardAccessAcknowledgementId: null,
    resultReportCardAccessRevocationId: null,
    resultReportCardAccessExpiryId: null,
    timelineStatus: row.timelineStatus,
    eventType: row.eventType,
    safeEventSummary: row.safeTimelineSummary,
    eventPayloadJson: (row.eventRefsJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    voidedAt: null,
  };
}

function mapAccessTimelinePreviewFromPrisma(row: any): ResultReportCardAccessTimelinePreview {
  return {
    resultReportCardAccessTimelineId: row.resultReportCardAccessTimelineId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId || '',
    timelineStatus: row.timelineStatus,
    eventType: row.eventType,
    safeEventSummary: row.safeTimelineSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapAccessSummaryFromPrisma(row: any): ResultReportCardAccessSummary {
  return {
    resultReportCardAccessSummaryId: row.resultReportCardAccessSummaryId,
    schoolId: row.schoolId,
    studentRef: row.studentRef || null,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId || null,
    resultReportCardExportJobId: row.resultReportCardExportJobId || null,
    summaryStatus: row.summaryStatus,
    summaryScope: row.summaryScope,
    safeSummary: row.safeSummary,
    audienceCountsJson: (row.audienceCountsJson as Record<string, unknown>) || null,
    statusCountsJson: (row.statusCountsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: '',
    createdByRole: '',
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    refreshedAt: row.refreshedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAccessSummaryPreviewFromPrisma(row: any): ResultReportCardAccessSummaryPreview {
  return {
    resultReportCardAccessSummaryId: row.resultReportCardAccessSummaryId,
    schoolId: row.schoolId,
    summaryStatus: row.summaryStatus,
    summaryScope: row.summaryScope,
    safeSummary: row.safeSummary,
    refreshedAt: row.refreshedAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapAccessAuditFromPrisma(row: any): ResultReportCardAccessAuditEvent {
  return {
    resultReportCardAccessAuditId: row.resultReportCardAccessAuditId,
    schoolId: row.schoolId,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId || null,
    resultReportCardAccessRecipientId: row.resultReportCardAccessRecipientId || null,
    resultReportCardPortalPreviewId: row.resultReportCardPortalPreviewId || null,
    resultReportCardAccessTokenIntentId: row.resultReportCardAccessTokenIntentId || null,
    resultReportCardAccessAcknowledgementId: row.resultReportCardAccessAcknowledgementId || null,
    resultReportCardAccessRevocationId: row.resultReportCardAccessRevocationId || null,
    resultReportCardAccessExpiryId: row.resultReportCardAccessExpiryId || null,
    resultReportCardAccessTimelineId: row.resultReportCardAccessTimelineId || null,
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

function mapAccessIdempotencyFromPrisma(row: any): ResultReportCardAccessIdempotencyEntry {
  return {
    resultReportCardAccessIdempotencyId: row.resultReportCardAccessIdempotencyId,
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

export class PrismaResultReportCardAccessGrantRepository implements ResultReportCardAccessGrantRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAccessGrantInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessGrant> {
    const row = await this.prisma.resultReportCardAccessGrantRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId,
        resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId,
        resultReportCardReviewId: input.resultReportCardReviewId,
        resultReportCardExportJobId: input.resultReportCardExportJobId,
        resultReportCardExportTargetId: input.resultReportCardExportTargetId,
        resultReportCardExportEnvelopeId: input.resultReportCardExportEnvelopeId,
        resultReportCardExportReceiptId: input.resultReportCardExportReceiptId || undefined,
        resultReportCardArchiveManifestId: input.resultReportCardArchiveManifestId || undefined,
        resultReleasePacketId: input.resultReleasePacketId,
        studentRef: input.studentRef,
        audienceType: input.audienceType,
        accessGrantStatus: 'draft',
        accessGrantMode: input.grantMode,
        safeAccessSummary: input.safeGrantSummary,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        allowedActionsJson: (input.allowedChannelsJson as any) || undefined,
        blockedActionsJson: (input.blockedChannelsJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAccessGrantFromPrisma(row);
  }

  async getById(accessGrantId: string): Promise<ResultReportCardAccessGrant | null> {
    const row = await this.prisma.resultReportCardAccessGrantRecord.findUnique({ where: { resultReportCardAccessGrantId: accessGrantId } });
    return row ? mapAccessGrantFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessGrantPreview[]> {
    const rows = await this.prisma.resultReportCardAccessGrantRecord.findMany({ where: { schoolId } });
    return rows.map(mapAccessGrantPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAccessGrantPreview[]> {
    const rows = await this.prisma.resultReportCardAccessGrantRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapAccessGrantPreviewFromPrisma);
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardAccessGrantPreview[]> {
    const rows = await this.prisma.resultReportCardAccessGrantRecord.findMany({ where: { resultReportCardAssemblyId: assemblyId } });
    return rows.map(mapAccessGrantPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessGrantStatus | string): Promise<ResultReportCardAccessGrantPreview[]> {
    const rows = await this.prisma.resultReportCardAccessGrantRecord.findMany({ where: { schoolId, accessGrantStatus: status as string } });
    return rows.map(mapAccessGrantPreviewFromPrisma);
  }

  async update(accessGrantId: string, data: Partial<ResultReportCardAccessGrant>): Promise<ResultReportCardAccessGrant> {
    const row = await this.prisma.resultReportCardAccessGrantRecord.update({
      where: { resultReportCardAccessGrantId: accessGrantId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapAccessGrantFromPrisma(row);
  }

  async updateStatus(accessGrantId: string, input: UpdateAccessGrantStatusInput): Promise<ResultReportCardAccessGrant> {
    const data: any = { accessGrantStatus: input.status, updatedAt: new Date() };
    if (input.status === 'validated') data.validatedAt = new Date();
    if (input.status === 'ready_for_future_access') data.readyAt = new Date();
    if (input.status === 'suppressed') data.suppressedAt = new Date();
    if (input.status === 'revoked') data.revokedAt = new Date();
    if (input.status === 'expired') data.expiredAt = new Date();
    if (input.status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardAccessGrantRecord.update({
      where: { resultReportCardAccessGrantId: accessGrantId },
      data,
    });
    return mapAccessGrantFromPrisma(row);
  }

  async validate(accessGrantId: string): Promise<ResultReportCardAccessGrant> {
    return this.updateStatus(accessGrantId, { status: 'validated', reasonCode: 'validated', safeMessage: 'Grant validated' });
  }

  async suppress(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant> {
    return this.updateStatus(accessGrantId, { status: 'suppressed', reasonCode, safeMessage });
  }

  async revoke(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant> {
    return this.updateStatus(accessGrantId, { status: 'revoked', reasonCode, safeMessage });
  }

  async expire(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant> {
    return this.updateStatus(accessGrantId, { status: 'expired', reasonCode, safeMessage });
  }

  async block(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant> {
    return this.updateStatus(accessGrantId, { status: 'blocked', reasonCode, safeMessage });
  }

  async void(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant> {
    return this.updateStatus(accessGrantId, { status: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultReportCardAccessRecipientRepository implements ResultReportCardAccessRecipientRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAccessRecipientInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessRecipient> {
    const row = await this.prisma.resultReportCardAccessRecipientRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAccessGrantId: input.resultReportCardAccessGrantId,
        studentRef: '',
        audienceType: input.audienceType,
        recipientRole: 'student',
        recipientStatus: 'draft',
        recipientMode: 'future_access_only',
        safeRecipientSummary: input.safeRecipientSummary,
        recipientDescriptorJson: (input.recipientDescriptorJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAccessRecipientFromPrisma(row);
  }

  async getById(accessRecipientId: string): Promise<ResultReportCardAccessRecipient | null> {
    const row = await this.prisma.resultReportCardAccessRecipientRecord.findUnique({ where: { resultReportCardAccessRecipientId: accessRecipientId } });
    return row ? mapAccessRecipientFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessRecipientPreview[]> {
    const rows = await this.prisma.resultReportCardAccessRecipientRecord.findMany({ where: { schoolId } });
    return rows.map(mapAccessRecipientPreviewFromPrisma);
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessRecipientPreview[]> {
    const rows = await this.prisma.resultReportCardAccessRecipientRecord.findMany({ where: { resultReportCardAccessGrantId: accessGrantId } });
    return rows.map(mapAccessRecipientPreviewFromPrisma);
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultReportCardAccessRecipientPreview[]> {
    const rows = await this.prisma.resultReportCardAccessRecipientRecord.findMany({ where: { schoolId, audienceType } });
    return rows.map(mapAccessRecipientPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessRecipientStatus | string): Promise<ResultReportCardAccessRecipientPreview[]> {
    const rows = await this.prisma.resultReportCardAccessRecipientRecord.findMany({ where: { schoolId, recipientStatus: status as string } });
    return rows.map(mapAccessRecipientPreviewFromPrisma);
  }

  async update(accessRecipientId: string, data: Partial<ResultReportCardAccessRecipient>): Promise<ResultReportCardAccessRecipient> {
    const row = await this.prisma.resultReportCardAccessRecipientRecord.update({
      where: { resultReportCardAccessRecipientId: accessRecipientId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapAccessRecipientFromPrisma(row);
  }

  async updateStatus(accessRecipientId: string, input: UpdateAccessRecipientStatusInput): Promise<ResultReportCardAccessRecipient> {
    const data: any = { recipientStatus: input.status, updatedAt: new Date() };
    if (input.status === 'validated') data.validatedAt = new Date();
    if (input.status === 'suppressed') data.suppressedAt = new Date();
    if (input.status === 'revoked') data.revokedAt = new Date();
    if (input.status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardAccessRecipientRecord.update({
      where: { resultReportCardAccessRecipientId: accessRecipientId },
      data,
    });
    return mapAccessRecipientFromPrisma(row);
  }

  async validate(accessRecipientId: string): Promise<ResultReportCardAccessRecipient> {
    return this.updateStatus(accessRecipientId, { status: 'validated', reasonCode: 'validated', safeMessage: 'Recipient validated' });
  }

  async suppress(accessRecipientId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRecipient> {
    return this.updateStatus(accessRecipientId, { status: 'suppressed', reasonCode, safeMessage });
  }

  async revoke(accessRecipientId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRecipient> {
    return this.updateStatus(accessRecipientId, { status: 'revoked', reasonCode, safeMessage });
  }

  async block(accessRecipientId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRecipient> {
    return this.updateStatus(accessRecipientId, { status: 'blocked', reasonCode, safeMessage });
  }

  async void(accessRecipientId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRecipient> {
    return this.updateStatus(accessRecipientId, { status: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultReportCardPortalPreviewRepository implements ResultReportCardPortalPreviewRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreatePortalPreviewInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardPortalPreview> {
    const row = await this.prisma.resultReportCardPortalPreviewRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAccessGrantId: input.resultReportCardAccessGrantId,
        resultReportCardAccessRecipientId: input.resultReportCardAccessRecipientId,
        resultReportCardExportEnvelopeId: '',
        previewStatus: 'draft',
        previewMode: input.previewMode,
        audienceType: 'student',
        safePreviewSummary: input.safePreviewSummary,
        safePreviewPayloadJson: (input.safePayloadJson as any) || undefined,
        redactionRulesJson: (input.redactionRulesJson as any) || undefined,
        allowedFieldNamesJson: (input.allowedFieldNamesJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapPortalPreviewFromPrisma(row);
  }

  async getById(portalPreviewId: string): Promise<ResultReportCardPortalPreview | null> {
    const row = await this.prisma.resultReportCardPortalPreviewRecord.findUnique({ where: { resultReportCardPortalPreviewId: portalPreviewId } });
    return row ? mapPortalPreviewFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardPortalPreviewPreview[]> {
    const rows = await this.prisma.resultReportCardPortalPreviewRecord.findMany({ where: { schoolId } });
    return rows.map(mapPortalPreviewPreviewFromPrisma);
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardPortalPreviewPreview[]> {
    const rows = await this.prisma.resultReportCardPortalPreviewRecord.findMany({ where: { resultReportCardAccessGrantId: accessGrantId } });
    return rows.map(mapPortalPreviewPreviewFromPrisma);
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardPortalPreviewPreview[]> {
    const rows = await this.prisma.resultReportCardPortalPreviewRecord.findMany({ where: { resultReportCardAccessRecipientId: recipientId } });
    return rows.map(mapPortalPreviewPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardPortalPreviewStatus | string): Promise<ResultReportCardPortalPreviewPreview[]> {
    const rows = await this.prisma.resultReportCardPortalPreviewRecord.findMany({ where: { schoolId, previewStatus: status as string } });
    return rows.map(mapPortalPreviewPreviewFromPrisma);
  }

  async update(portalPreviewId: string, data: Partial<ResultReportCardPortalPreview>): Promise<ResultReportCardPortalPreview> {
    const row = await this.prisma.resultReportCardPortalPreviewRecord.update({
      where: { resultReportCardPortalPreviewId: portalPreviewId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapPortalPreviewFromPrisma(row);
  }

  async updateStatus(portalPreviewId: string, input: UpdatePortalPreviewStatusInput): Promise<ResultReportCardPortalPreview> {
    const data: any = { previewStatus: input.status, updatedAt: new Date() };
    if (input.status === 'sealed') data.sealedAt = new Date();
    if (input.status === 'suppressed') data.suppressedAt = new Date();
    if (input.status === 'blocked') data.blockedAt = new Date();
    if (input.status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardPortalPreviewRecord.update({
      where: { resultReportCardPortalPreviewId: portalPreviewId },
      data,
    });
    return mapPortalPreviewFromPrisma(row);
  }

  async seal(portalPreviewId: string): Promise<ResultReportCardPortalPreview> {
    return this.updateStatus(portalPreviewId, { status: 'sealed', reasonCode: 'sealed', safeMessage: 'Preview sealed' });
  }

  async suppress(portalPreviewId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardPortalPreview> {
    return this.updateStatus(portalPreviewId, { status: 'suppressed', reasonCode, safeMessage });
  }

  async block(portalPreviewId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardPortalPreview> {
    return this.updateStatus(portalPreviewId, { status: 'blocked', reasonCode, safeMessage });
  }

  async void(portalPreviewId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardPortalPreview> {
    return this.updateStatus(portalPreviewId, { status: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultReportCardAccessTokenIntentRepository implements ResultReportCardAccessTokenIntentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAccessTokenIntentInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessTokenIntent> {
    const row = await this.prisma.resultReportCardAccessTokenIntentRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAccessGrantId: input.resultReportCardAccessGrantId,
        resultReportCardAccessRecipientId: '',
        intentStatus: 'draft',
        intentMode: input.tokenIntentMode,
        tokenPurpose: 'unknown',
        safeTokenIntentSummary: input.safeTokenIntentSummary,
        tokenIntentMetadataJson: (input.tokenDescriptorJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAccessTokenIntentFromPrisma(row);
  }

  async getById(accessTokenIntentId: string): Promise<ResultReportCardAccessTokenIntent | null> {
    const row = await this.prisma.resultReportCardAccessTokenIntentRecord.findUnique({ where: { resultReportCardAccessTokenIntentId: accessTokenIntentId } });
    return row ? mapAccessTokenIntentFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessTokenIntentPreview[]> {
    const rows = await this.prisma.resultReportCardAccessTokenIntentRecord.findMany({ where: { schoolId } });
    return rows.map(mapAccessTokenIntentPreviewFromPrisma);
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessTokenIntentPreview[]> {
    const rows = await this.prisma.resultReportCardAccessTokenIntentRecord.findMany({ where: { resultReportCardAccessGrantId: accessGrantId } });
    return rows.map(mapAccessTokenIntentPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessTokenIntentStatus | string): Promise<ResultReportCardAccessTokenIntentPreview[]> {
    const rows = await this.prisma.resultReportCardAccessTokenIntentRecord.findMany({ where: { schoolId, intentStatus: status as string } });
    return rows.map(mapAccessTokenIntentPreviewFromPrisma);
  }

  async update(accessTokenIntentId: string, data: Partial<ResultReportCardAccessTokenIntent>): Promise<ResultReportCardAccessTokenIntent> {
    const row = await this.prisma.resultReportCardAccessTokenIntentRecord.update({
      where: { resultReportCardAccessTokenIntentId: accessTokenIntentId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapAccessTokenIntentFromPrisma(row);
  }

  async updateStatus(accessTokenIntentId: string, input: UpdateAccessTokenIntentStatusInput): Promise<ResultReportCardAccessTokenIntent> {
    const data: any = { intentStatus: input.status, updatedAt: new Date() };
    if (input.status === 'validated') data.validatedAt = new Date();
    if (input.status === 'blocked') data.blockedAt = new Date();
    if (input.status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardAccessTokenIntentRecord.update({
      where: { resultReportCardAccessTokenIntentId: accessTokenIntentId },
      data,
    });
    return mapAccessTokenIntentFromPrisma(row);
  }

  async validate(accessTokenIntentId: string): Promise<ResultReportCardAccessTokenIntent> {
    return this.updateStatus(accessTokenIntentId, { status: 'validated', reasonCode: 'validated', safeMessage: 'Token intent validated' });
  }

  async block(accessTokenIntentId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTokenIntent> {
    return this.updateStatus(accessTokenIntentId, { status: 'blocked', reasonCode, safeMessage });
  }

  async void(accessTokenIntentId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTokenIntent> {
    return this.updateStatus(accessTokenIntentId, { status: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultReportCardAccessAcknowledgementRepository implements ResultReportCardAccessAcknowledgementRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAccessAcknowledgementInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessAcknowledgement> {
    const row = await this.prisma.resultReportCardAccessAcknowledgementRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAccessGrantId: input.resultReportCardAccessGrantId,
        resultReportCardAccessRecipientId: input.resultReportCardAccessRecipientId,
        resultReportCardPortalPreviewId: input.resultReportCardPortalPreviewId || null,
        acknowledgementStatus: 'created',
        acknowledgementType: input.acknowledgementType,
        safeAcknowledgementSummary: input.safeAcknowledgementSummary,
        acknowledgementMetadataJson: (input.providerSimulationJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAccessAcknowledgementFromPrisma(row);
  }

  async getById(accessAcknowledgementId: string): Promise<ResultReportCardAccessAcknowledgement | null> {
    const row = await this.prisma.resultReportCardAccessAcknowledgementRecord.findUnique({ where: { resultReportCardAccessAcknowledgementId: accessAcknowledgementId } });
    return row ? mapAccessAcknowledgementFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    const rows = await this.prisma.resultReportCardAccessAcknowledgementRecord.findMany({ where: { schoolId } });
    return rows.map(mapAccessAcknowledgementPreviewFromPrisma);
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    const rows = await this.prisma.resultReportCardAccessAcknowledgementRecord.findMany({ where: { resultReportCardAccessGrantId: accessGrantId } });
    return rows.map(mapAccessAcknowledgementPreviewFromPrisma);
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    const rows = await this.prisma.resultReportCardAccessAcknowledgementRecord.findMany({ where: { resultReportCardAccessRecipientId: recipientId } });
    return rows.map(mapAccessAcknowledgementPreviewFromPrisma);
  }

  async listByPreviewId(previewId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    const rows = await this.prisma.resultReportCardAccessAcknowledgementRecord.findMany({ where: { resultReportCardPortalPreviewId: previewId } });
    return rows.map(mapAccessAcknowledgementPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessAcknowledgementStatus | string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    const rows = await this.prisma.resultReportCardAccessAcknowledgementRecord.findMany({ where: { schoolId, acknowledgementStatus: status as string } });
    return rows.map(mapAccessAcknowledgementPreviewFromPrisma);
  }

  async update(accessAcknowledgementId: string, data: Partial<ResultReportCardAccessAcknowledgement>): Promise<ResultReportCardAccessAcknowledgement> {
    const row = await this.prisma.resultReportCardAccessAcknowledgementRecord.update({
      where: { resultReportCardAccessAcknowledgementId: accessAcknowledgementId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapAccessAcknowledgementFromPrisma(row);
  }

  async updateStatus(accessAcknowledgementId: string, input: UpdateAccessAcknowledgementStatusInput): Promise<ResultReportCardAccessAcknowledgement> {
    const data: any = { acknowledgementStatus: input.status, updatedAt: new Date() };
    if (input.status === 'recorded') data.recordedAt = new Date();
    if (input.status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardAccessAcknowledgementRecord.update({
      where: { resultReportCardAccessAcknowledgementId: accessAcknowledgementId },
      data,
    });
    return mapAccessAcknowledgementFromPrisma(row);
  }

  async record(accessAcknowledgementId: string): Promise<ResultReportCardAccessAcknowledgement> {
    return this.updateStatus(accessAcknowledgementId, { status: 'recorded', reasonCode: 'recorded', safeMessage: 'Acknowledgement recorded' });
  }

  async block(accessAcknowledgementId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessAcknowledgement> {
    return this.updateStatus(accessAcknowledgementId, { status: 'blocked', reasonCode, safeMessage });
  }

  async void(accessAcknowledgementId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessAcknowledgement> {
    return this.updateStatus(accessAcknowledgementId, { status: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultReportCardAccessRevocationRepository implements ResultReportCardAccessRevocationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAccessRevocationInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessRevocation> {
    const row = await this.prisma.resultReportCardAccessRevocationRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAccessGrantId: input.resultReportCardAccessGrantId,
        resultReportCardAccessRecipientId: input.resultReportCardAccessRecipientId || null,
        revocationStatus: 'draft',
        revocationScope: input.revocationScope,
        revocationReason: input.revocationReason,
        safeRevocationSummary: input.safeRevocationSummary,
        reasonCodesJson: (input.reasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAccessRevocationFromPrisma(row);
  }

  async getById(accessRevocationId: string): Promise<ResultReportCardAccessRevocation | null> {
    const row = await this.prisma.resultReportCardAccessRevocationRecord.findUnique({ where: { resultReportCardAccessRevocationId: accessRevocationId } });
    return row ? mapAccessRevocationFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    const rows = await this.prisma.resultReportCardAccessRevocationRecord.findMany({ where: { schoolId } });
    return rows.map(mapAccessRevocationPreviewFromPrisma);
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    const rows = await this.prisma.resultReportCardAccessRevocationRecord.findMany({ where: { resultReportCardAccessGrantId: accessGrantId } });
    return rows.map(mapAccessRevocationPreviewFromPrisma);
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    const rows = await this.prisma.resultReportCardAccessRevocationRecord.findMany({ where: { resultReportCardAccessRecipientId: recipientId } });
    return rows.map(mapAccessRevocationPreviewFromPrisma);
  }

  async listByPreviewId(previewId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return [];
  }

  async listByTokenIntentId(tokenIntentId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return [];
  }

  async listByAcknowledgementId(acknowledgementId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return [];
  }

  async listByScope(schoolId: string, scope: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    const rows = await this.prisma.resultReportCardAccessRevocationRecord.findMany({ where: { schoolId, revocationScope: scope } });
    return rows.map(mapAccessRevocationPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessRevocationStatus | string): Promise<ResultReportCardAccessRevocationPreview[]> {
    const rows = await this.prisma.resultReportCardAccessRevocationRecord.findMany({ where: { schoolId, revocationStatus: status as string } });
    return rows.map(mapAccessRevocationPreviewFromPrisma);
  }

  async update(accessRevocationId: string, data: Partial<ResultReportCardAccessRevocation>): Promise<ResultReportCardAccessRevocation> {
    const row = await this.prisma.resultReportCardAccessRevocationRecord.update({
      where: { resultReportCardAccessRevocationId: accessRevocationId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapAccessRevocationFromPrisma(row);
  }

  async updateStatus(accessRevocationId: string, input: UpdateAccessRevocationStatusInput): Promise<ResultReportCardAccessRevocation> {
    const data: any = { revocationStatus: input.status, updatedAt: new Date() };
    if (input.status === 'applied') data.appliedAt = new Date();
    if (input.status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardAccessRevocationRecord.update({
      where: { resultReportCardAccessRevocationId: accessRevocationId },
      data,
    });
    return mapAccessRevocationFromPrisma(row);
  }

  async apply(accessRevocationId: string): Promise<ResultReportCardAccessRevocation> {
    return this.updateStatus(accessRevocationId, { status: 'applied', reasonCode: 'applied', safeMessage: 'Revocation applied' });
  }

  async void(accessRevocationId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRevocation> {
    return this.updateStatus(accessRevocationId, { status: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultReportCardAccessExpiryRepository implements ResultReportCardAccessExpiryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAccessExpiryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessExpiry> {
    const row = await this.prisma.resultReportCardAccessExpiryRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAccessGrantId: input.resultReportCardAccessGrantId,
        resultReportCardAccessRecipientId: input.resultReportCardAccessRecipientId || null,
        expiryStatus: 'draft',
        expiryScope: input.expiryScope,
        expiresAt: new Date(input.expiresAt),
        safeExpirySummary: input.safeExpirySummary,
        reasonCodesJson: (input.reasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAccessExpiryFromPrisma(row);
  }

  async getById(accessExpiryId: string): Promise<ResultReportCardAccessExpiry | null> {
    const row = await this.prisma.resultReportCardAccessExpiryRecord.findUnique({ where: { resultReportCardAccessExpiryId: accessExpiryId } });
    return row ? mapAccessExpiryFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    const rows = await this.prisma.resultReportCardAccessExpiryRecord.findMany({ where: { schoolId } });
    return rows.map(mapAccessExpiryPreviewFromPrisma);
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    const rows = await this.prisma.resultReportCardAccessExpiryRecord.findMany({ where: { resultReportCardAccessGrantId: accessGrantId } });
    return rows.map(mapAccessExpiryPreviewFromPrisma);
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    const rows = await this.prisma.resultReportCardAccessExpiryRecord.findMany({ where: { resultReportCardAccessRecipientId: recipientId } });
    return rows.map(mapAccessExpiryPreviewFromPrisma);
  }

  async listByPreviewId(previewId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    return [];
  }

  async listByTokenIntentId(tokenIntentId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    return [];
  }

  async listByScope(schoolId: string, scope: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    const rows = await this.prisma.resultReportCardAccessExpiryRecord.findMany({ where: { schoolId, expiryScope: scope } });
    return rows.map(mapAccessExpiryPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessExpiryStatus | string): Promise<ResultReportCardAccessExpiryPreview[]> {
    const rows = await this.prisma.resultReportCardAccessExpiryRecord.findMany({ where: { schoolId, expiryStatus: status as string } });
    return rows.map(mapAccessExpiryPreviewFromPrisma);
  }

  async update(accessExpiryId: string, data: Partial<ResultReportCardAccessExpiry>): Promise<ResultReportCardAccessExpiry> {
    const row = await this.prisma.resultReportCardAccessExpiryRecord.update({
      where: { resultReportCardAccessExpiryId: accessExpiryId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapAccessExpiryFromPrisma(row);
  }

  async updateStatus(accessExpiryId: string, input: UpdateAccessExpiryStatusInput): Promise<ResultReportCardAccessExpiry> {
    const data: any = { expiryStatus: input.status, updatedAt: new Date() };
    if (input.status === 'scheduled') data.updatedAt = new Date();
    if (input.status === 'applied') data.appliedAt = new Date();
    if (input.status === 'cancelled') data.cancelledAt = new Date();
    if (input.status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardAccessExpiryRecord.update({
      where: { resultReportCardAccessExpiryId: accessExpiryId },
      data,
    });
    return mapAccessExpiryFromPrisma(row);
  }

  async schedule(accessExpiryId: string): Promise<ResultReportCardAccessExpiry> {
    return this.updateStatus(accessExpiryId, { status: 'scheduled', reasonCode: 'scheduled', safeMessage: 'Expiry scheduled' });
  }

  async apply(accessExpiryId: string): Promise<ResultReportCardAccessExpiry> {
    return this.updateStatus(accessExpiryId, { status: 'applied', reasonCode: 'applied', safeMessage: 'Expiry applied' });
  }

  async cancel(accessExpiryId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessExpiry> {
    return this.updateStatus(accessExpiryId, { status: 'cancelled', reasonCode, safeMessage });
  }

  async void(accessExpiryId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessExpiry> {
    return this.updateStatus(accessExpiryId, { status: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultReportCardAccessTimelineRepository implements ResultReportCardAccessTimelineRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAccessTimelineInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessTimeline> {
    const row = await this.prisma.resultReportCardAccessTimelineRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAccessGrantId: input.resultReportCardAccessGrantId || null,
        resultReportCardAccessRecipientId: input.resultReportCardAccessRecipientId || null,
        timelineStatus: 'recorded',
        eventType: input.eventType,
        safeTimelineSummary: input.safeEventSummary,
        eventRefsJson: (input.eventPayloadJson as any) || undefined,
        metadataJson: undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAccessTimelineFromPrisma(row);
  }

  async getById(accessTimelineId: string): Promise<ResultReportCardAccessTimeline | null> {
    const row = await this.prisma.resultReportCardAccessTimelineRecord.findUnique({ where: { resultReportCardAccessTimelineId: accessTimelineId } });
    return row ? mapAccessTimelineFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    const rows = await this.prisma.resultReportCardAccessTimelineRecord.findMany({ where: { schoolId } });
    return rows.map(mapAccessTimelinePreviewFromPrisma);
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    const rows = await this.prisma.resultReportCardAccessTimelineRecord.findMany({ where: { resultReportCardAccessGrantId: accessGrantId } });
    return rows.map(mapAccessTimelinePreviewFromPrisma);
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    const rows = await this.prisma.resultReportCardAccessTimelineRecord.findMany({ where: { resultReportCardAccessRecipientId: recipientId } });
    return rows.map(mapAccessTimelinePreviewFromPrisma);
  }

  async listByPreviewId(previewId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return [];
  }

  async listByTokenIntentId(tokenIntentId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return [];
  }

  async listByAcknowledgementId(acknowledgementId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return [];
  }

  async listByRevocationId(revocationId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return [];
  }

  async listByExpiryId(expiryId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return [];
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    const rows = await this.prisma.resultReportCardAccessTimelineRecord.findMany({ where: { schoolId, eventType } });
    return rows.map(mapAccessTimelinePreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessTimelineStatus | string): Promise<ResultReportCardAccessTimelinePreview[]> {
    const rows = await this.prisma.resultReportCardAccessTimelineRecord.findMany({ where: { schoolId, timelineStatus: status as string } });
    return rows.map(mapAccessTimelinePreviewFromPrisma);
  }

  async update(accessTimelineId: string, data: Partial<ResultReportCardAccessTimeline>): Promise<ResultReportCardAccessTimeline> {
    const row = await this.prisma.resultReportCardAccessTimelineRecord.update({
      where: { resultReportCardAccessTimelineId: accessTimelineId },
      data: data as any,
    });
    return mapAccessTimelineFromPrisma(row);
  }

  async updateStatus(accessTimelineId: string, input: UpdateAccessTimelineStatusInput): Promise<ResultReportCardAccessTimeline> {
    const data: any = { timelineStatus: input.status };
    if (input.status === 'suppressed') data.updatedAt = new Date();
    if (input.status === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultReportCardAccessTimelineRecord.update({
      where: { resultReportCardAccessTimelineId: accessTimelineId },
      data,
    });
    return mapAccessTimelineFromPrisma(row);
  }

  async suppress(accessTimelineId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTimeline> {
    return this.updateStatus(accessTimelineId, { status: 'suppressed', reasonCode, safeMessage });
  }

  async void(accessTimelineId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTimeline> {
    return this.updateStatus(accessTimelineId, { status: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultReportCardAccessSummaryRepository implements ResultReportCardAccessSummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateAccessSummaryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessSummary> {
    const row = await this.prisma.resultReportCardAccessSummaryRecord.create({
      data: {
        schoolId: input.schoolId,
        studentRef: input.studentRef || null,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId || null,
        resultReportCardExportJobId: input.resultReportCardExportJobId || null,
        summaryStatus: 'active',
        summaryScope: input.summaryScope,
        safeSummary: input.safeSummary,
        audienceCountsJson: (input.audienceCountsJson as any) || undefined,
        statusCountsJson: (input.statusCountsJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
      },
    });
    return mapAccessSummaryFromPrisma(row);
  }

  async getById(summaryId: string): Promise<ResultReportCardAccessSummary | null> {
    const row = await this.prisma.resultReportCardAccessSummaryRecord.findUnique({ where: { resultReportCardAccessSummaryId: summaryId } });
    return row ? mapAccessSummaryFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessSummaryPreview[]> {
    const rows = await this.prisma.resultReportCardAccessSummaryRecord.findMany({ where: { schoolId } });
    return rows.map(mapAccessSummaryPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAccessSummaryPreview[]> {
    const rows = await this.prisma.resultReportCardAccessSummaryRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapAccessSummaryPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: string): Promise<ResultReportCardAccessSummaryPreview[]> {
    const rows = await this.prisma.resultReportCardAccessSummaryRecord.findMany({ where: { schoolId, summaryStatus: status } });
    return rows.map(mapAccessSummaryPreviewFromPrisma);
  }

  async update(summaryId: string, data: Partial<ResultReportCardAccessSummary>): Promise<ResultReportCardAccessSummary> {
    const row = await this.prisma.resultReportCardAccessSummaryRecord.update({
      where: { resultReportCardAccessSummaryId: summaryId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapAccessSummaryFromPrisma(row);
  }

  async updateStatus(summaryId: string, status: string): Promise<ResultReportCardAccessSummary> {
    const data: any = { summaryStatus: status, updatedAt: new Date() };
    const row = await this.prisma.resultReportCardAccessSummaryRecord.update({
      where: { resultReportCardAccessSummaryId: summaryId },
      data,
    });
    return mapAccessSummaryFromPrisma(row);
  }

  async refresh(summaryId: string): Promise<ResultReportCardAccessSummary> {
    const row = await this.prisma.resultReportCardAccessSummaryRecord.update({
      where: { resultReportCardAccessSummaryId: summaryId },
      data: { refreshedAt: new Date(), updatedAt: new Date() },
    });
    return mapAccessSummaryFromPrisma(row);
  }

  async void(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessSummary> {
    return this.updateStatus(summaryId, 'void');
  }
}

export class PrismaResultReportCardAccessAuditRepository implements ResultReportCardAccessAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(event: ResultReportCardAccessAuditEvent): Promise<ResultReportCardAccessAuditEvent> {
    const row = await this.prisma.resultReportCardAccessAuditRecord.create({ data: event as any });
    return mapAccessAuditFromPrisma(row);
  }

  async getById(auditId: string): Promise<ResultReportCardAccessAuditEvent | null> {
    const row = await this.prisma.resultReportCardAccessAuditRecord.findUnique({ where: { resultReportCardAccessAuditId: auditId } });
    return row ? mapAccessAuditFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessAuditEvent[]> {
    const rows = await this.prisma.resultReportCardAccessAuditRecord.findMany({ where: { schoolId } });
    return rows.map(mapAccessAuditFromPrisma);
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessAuditEvent[]> {
    const rows = await this.prisma.resultReportCardAccessAuditRecord.findMany({ where: { resultReportCardAccessGrantId: accessGrantId } });
    return rows.map(mapAccessAuditFromPrisma);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultReportCardAccessAuditEvent[]> {
    const rows = await this.prisma.resultReportCardAccessAuditRecord.findMany({ where: { schoolId, eventType } });
    return rows.map(mapAccessAuditFromPrisma);
  }

  async listByActorId(actorId: string): Promise<ResultReportCardAccessAuditEvent[]> {
    const rows = await this.prisma.resultReportCardAccessAuditRecord.findMany({ where: { actorId } });
    return rows.map(mapAccessAuditFromPrisma);
  }
}

export class PrismaResultReportCardAccessIdempotencyRepository implements ResultReportCardAccessIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<ResultReportCardAccessIdempotencyEntry> {
    const row = await this.prisma.resultReportCardAccessIdempotencyRecord.create({
      data: {
        schoolId: input.schoolId,
        operation: input.operation,
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        status: input.status || 'in_progress',
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        safeResultSummary: input.safeResultSummary ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    return mapAccessIdempotencyFromPrisma(row);
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardAccessIdempotencyEntry | null> {
    const row = await this.prisma.resultReportCardAccessIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    }).catch(() => null);
    return row ? mapAccessIdempotencyFromPrisma(row) : null;
  }

  async updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<ResultReportCardAccessIdempotencyEntry> {
    const data: any = { status, updatedAt: new Date() };
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const row = await this.prisma.resultReportCardAccessIdempotencyRecord.update({
      where: { resultReportCardAccessIdempotencyId: idempotencyId },
      data,
    });
    return mapAccessIdempotencyFromPrisma(row);
  }

  async expire(idempotencyId: string): Promise<ResultReportCardAccessIdempotencyEntry> {
    return this.updateStatus(idempotencyId, 'expired');
  }
}
