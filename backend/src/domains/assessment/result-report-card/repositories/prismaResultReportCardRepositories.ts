import type {
  ResultReportCardTemplate, CreateReportCardTemplateInput,
  ResultReportCardTemplateVersion, CreateReportCardTemplateVersionInput,
  ResultReportCardAssembly, CreateAssemblyFromReleasePacketInput, ResultReportCardAssemblyPreview,
  ResultReportCardSection, CreateReportCardSectionInput,
  ResultReportCardEvidenceLink, CreateEvidenceLinkInput,
  ResultReportCardAudienceProjection, CreateAudienceProjectionInput,
  ResultReportCardReview, CreateReviewInput,
  ResultReportCardExportIntent, CreateExportIntentInput, ResultReportCardExportIntentPreview,
  ResultReportCardRenderManifest, CreateRenderManifestInput,
  ResultReportCardAuditEvent,
  ResultReportCardIdempotencyEntry,
} from '../contracts';
import type {
  ResultReportCardTemplateRepository,
  ResultReportCardTemplateVersionRepository,
  ResultReportCardAssemblyRepository,
  ResultReportCardSectionRepository,
  ResultReportCardEvidenceLinkRepository,
  ResultReportCardAudienceProjectionRepository,
  ResultReportCardReviewRepository,
  ResultReportCardExportIntentRepository,
  ResultReportCardRenderManifestRepository,
  ResultReportCardAuditRepository,
  ResultReportCardIdempotencyRepository,
} from '../contracts/resultReportCardRepositoryContracts';
import { prisma } from '../../../../lib/prisma';

function mapTemplateFromPrisma(row: any): ResultReportCardTemplate {
  return {
    resultReportCardTemplateId: row.resultReportCardTemplateId,
    schoolId: row.schoolId,
    templateKey: row.templateKey,
    templateName: row.templateName,
    templateStatus: row.templateStatus,
    templateAudience: row.templateAudience,
    templatePurpose: row.templatePurpose,
    safeTemplateSummary: row.safeTemplateSummary,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    disabledAt: row.disabledAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapTemplateVersionFromPrisma(row: any): ResultReportCardTemplateVersion {
  return {
    resultReportCardTemplateVersionId: row.resultReportCardTemplateVersionId,
    schoolId: row.schoolId,
    resultReportCardTemplateId: row.resultReportCardTemplateId,
    templateVersion: row.templateVersion,
    versionStatus: row.versionStatus,
    layoutMode: row.layoutMode,
    sectionSchemaJson: (row.sectionSchemaJson as Record<string, unknown>) || null,
    allowedSectionTypesJson: (row.allowedSectionTypesJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || null,
    redactionRulesJson: (row.redactionRulesJson as Record<string, unknown>) || null,
    safeVersionSummary: row.safeVersionSummary,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    activatedAt: row.activatedAt?.toISOString() || null,
    retiredAt: row.retiredAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAssemblyFromPrisma(row: any): ResultReportCardAssembly {
  return {
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    schoolId: row.schoolId,
    resultReportCardTemplateId: row.resultReportCardTemplateId,
    resultReportCardTemplateVersionId: row.resultReportCardTemplateVersionId,
    resultReleasePacketId: row.resultReleasePacketId,
    resultReleaseApprovalId: row.resultReleaseApprovalId,
    resultAudienceProjectionId: row.resultAudienceProjectionId,
    studentResultReportSnapshotId: row.studentResultReportSnapshotId,
    parentSafeResultSummaryId: row.parentSafeResultSummaryId || null,
    studentSafeResultSummaryId: row.studentSafeResultSummaryId || null,
    resultDeliveryJobId: row.resultDeliveryJobId || null,
    resultDeliveryReceiptId: row.resultDeliveryReceiptId || null,
    resultFinalizationDecisionId: row.resultFinalizationDecisionId,
    resultReleaseBoundaryId: row.resultReleaseBoundaryId,
    resultLearningEvidenceBridgeId: row.resultLearningEvidenceBridgeId || null,
    markingResultVersionId: row.markingResultVersionId,
    studentRef: row.studentRef,
    paperId: row.paperId,
    paperVersionId: row.paperVersionId,
    deliverySessionId: row.deliverySessionId,
    assemblyStatus: row.assemblyStatus,
    assemblyMode: row.assemblyMode,
    audienceType: row.audienceType,
    safeReportTitle: row.safeReportTitle,
    safeReportSummary: row.safeReportSummary,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    allowedFieldsJson: (row.allowedFieldsJson as Record<string, unknown>) || null,
    blockedFieldsJson: (row.blockedFieldsJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    assembledAt: row.assembledAt?.toISOString() || null,
    safetyCheckedAt: row.safetyCheckedAt?.toISOString() || null,
    sealedAt: row.sealedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    cancelledAt: row.cancelledAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAssemblyPreviewFromPrisma(row: any): ResultReportCardAssemblyPreview {
  return {
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    schoolId: row.schoolId,
    assemblyStatus: row.assemblyStatus,
    assemblyMode: row.assemblyMode,
    audienceType: row.audienceType,
    safeReportTitle: row.safeReportTitle,
    safeReportSummary: row.safeReportSummary,
    studentRef: row.studentRef,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
  };
}

function mapSectionFromPrisma(row: any): ResultReportCardSection {
  return {
    resultReportCardSectionId: row.resultReportCardSectionId,
    schoolId: row.schoolId,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    sectionKey: row.sectionKey,
    sectionType: row.sectionType,
    sectionStatus: row.sectionStatus,
    sectionOrder: row.sectionOrder,
    safeHeading: row.safeHeading,
    safeSummary: row.safeSummary,
    safeBodyJson: (row.safeBodyJson as Record<string, unknown>) || null,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || null,
    redactionRulesJson: (row.redactionRulesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    sealedAt: row.sealedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapEvidenceLinkFromPrisma(row: any): ResultReportCardEvidenceLink {
  return {
    resultReportCardEvidenceLinkId: row.resultReportCardEvidenceLinkId,
    schoolId: row.schoolId,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    resultReportCardSectionId: row.resultReportCardSectionId || null,
    sourceRecordType: row.sourceRecordType,
    sourceRecordId: row.sourceRecordId,
    sourcePackage: row.sourcePackage,
    evidenceStatus: row.evidenceStatus,
    evidenceUse: row.evidenceUse,
    safeEvidenceSummary: row.safeEvidenceSummary,
    allowedUseJson: (row.allowedUseJson as Record<string, unknown>) || null,
    blockedUseJson: (row.blockedUseJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAudienceProjectionFromPrisma(row: any): ResultReportCardAudienceProjection {
  return {
    resultReportCardAudienceProjectionId: row.resultReportCardAudienceProjectionId,
    schoolId: row.schoolId,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    audienceType: row.audienceType,
    projectionStatus: row.projectionStatus,
    projectionVersion: row.projectionVersion,
    safeProjectionJson: (row.safeProjectionJson as Record<string, unknown>) || null,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || null,
    redactionRulesJson: (row.redactionRulesJson as Record<string, unknown>) || null,
    safeProjectionSummary: row.safeProjectionSummary,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    sealedAt: row.sealedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapReviewFromPrisma(row: any): ResultReportCardReview {
  return {
    resultReportCardReviewId: row.resultReportCardReviewId,
    schoolId: row.schoolId,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    resultReportCardAudienceProjectionId: row.resultReportCardAudienceProjectionId || null,
    reviewStatus: row.reviewStatus,
    reviewType: row.reviewType,
    reviewDecision: row.reviewDecision,
    reviewedByActorId: row.reviewedByActorId,
    reviewedByRole: row.reviewedByRole,
    safeReviewSummary: row.safeReviewSummary,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || null,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    approvedAt: row.approvedAt?.toISOString() || null,
    rejectedAt: row.rejectedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapExportIntentFromPrisma(row: any): ResultReportCardExportIntent {
  return {
    resultReportCardExportIntentId: row.resultReportCardExportIntentId,
    schoolId: row.schoolId,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    resultReportCardReviewId: row.resultReportCardReviewId,
    resultReportCardAudienceProjectionId: row.resultReportCardAudienceProjectionId,
    exportStatus: row.exportStatus,
    exportChannel: row.exportChannel,
    exportMode: row.exportMode,
    safeExportIntentSummary: row.safeExportIntentSummary,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    eligibleAt: row.eligibleAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapExportIntentPreviewFromPrisma(row: any): ResultReportCardExportIntentPreview {
  return {
    resultReportCardExportIntentId: row.resultReportCardExportIntentId,
    schoolId: row.schoolId,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    exportStatus: row.exportStatus,
    exportChannel: row.exportChannel,
    exportMode: row.exportMode,
    safeExportIntentSummary: row.safeExportIntentSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRenderManifestFromPrisma(row: any): ResultReportCardRenderManifest {
  return {
    resultReportCardRenderManifestId: row.resultReportCardRenderManifestId,
    schoolId: row.schoolId,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId,
    resultReportCardTemplateVersionId: row.resultReportCardTemplateVersionId,
    manifestStatus: row.manifestStatus,
    renderMode: row.renderMode,
    safeManifestSummary: row.safeManifestSummary,
    layoutJson: (row.layoutJson as Record<string, unknown>) || null,
    sectionOrderJson: (row.sectionOrderJson as Record<string, unknown>) || null,
    assetRefsJson: (row.assetRefsJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    sealedAt: row.sealedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAuditFromPrisma(row: any): ResultReportCardAuditEvent {
  return {
    resultReportCardAuditId: row.resultReportCardAuditId,
    schoolId: row.schoolId,
    resultReportCardTemplateId: row.resultReportCardTemplateId || null,
    resultReportCardTemplateVersionId: row.resultReportCardTemplateVersionId || null,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId || null,
    resultReportCardSectionId: row.resultReportCardSectionId || null,
    resultReportCardEvidenceLinkId: row.resultReportCardEvidenceLinkId || null,
    resultReportCardAudienceProjectionId: row.resultReportCardAudienceProjectionId || null,
    resultReportCardReviewId: row.resultReportCardReviewId || null,
    resultReportCardExportIntentId: row.resultReportCardExportIntentId || null,
    resultReportCardRenderManifestId: row.resultReportCardRenderManifestId || null,
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

function mapIdempotencyFromPrisma(row: any): ResultReportCardIdempotencyEntry {
  return {
    resultReportCardIdempotencyId: row.resultReportCardIdempotencyId,
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

export class PrismaResultReportCardTemplateRepository implements ResultReportCardTemplateRepository {
  async create(input: CreateReportCardTemplateInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardTemplate> {
    const row = await prisma.resultReportCardTemplateRecord.create({
      data: {
        schoolId: input.schoolId,
        templateKey: input.templateKey,
        templateName: input.templateName,
        templateStatus: 'draft',
        templateAudience: input.templateAudience,
        templatePurpose: input.templatePurpose,
        safeTemplateSummary: input.safeTemplateSummary,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapTemplateFromPrisma(row);
  }

  async getById(templateId: string): Promise<ResultReportCardTemplate | null> {
    const row = await prisma.resultReportCardTemplateRecord.findUnique({ where: { resultReportCardTemplateId: templateId } });
    return row ? mapTemplateFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardTemplate[]> {
    const rows = await prisma.resultReportCardTemplateRecord.findMany({ where: { schoolId } });
    return rows.map(mapTemplateFromPrisma);
  }

  async listByStatus(schoolId: string, status: string): Promise<ResultReportCardTemplate[]> {
    const rows = await prisma.resultReportCardTemplateRecord.findMany({ where: { schoolId, templateStatus: status } });
    return rows.map(mapTemplateFromPrisma);
  }

  async update(templateId: string, data: Partial<ResultReportCardTemplate>): Promise<ResultReportCardTemplate> {
    const row = await prisma.resultReportCardTemplateRecord.update({
      where: { resultReportCardTemplateId: templateId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapTemplateFromPrisma(row);
  }

  async updateStatus(templateId: string, status: string): Promise<ResultReportCardTemplate> {
    const data: any = { templateStatus: status, updatedAt: new Date() };
    if (status === 'disabled') data.disabledAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReportCardTemplateRecord.update({
      where: { resultReportCardTemplateId: templateId },
      data,
    });
    return mapTemplateFromPrisma(row);
  }
}

export class PrismaResultReportCardTemplateVersionRepository implements ResultReportCardTemplateVersionRepository {
  async create(input: CreateReportCardTemplateVersionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardTemplateVersion> {
    const row = await prisma.resultReportCardTemplateVersionRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardTemplateId: input.resultReportCardTemplateId,
        templateVersion: input.templateVersion,
        versionStatus: 'draft',
        layoutMode: input.layoutMode,
        sectionSchemaJson: (input.sectionSchemaJson as any) || undefined,
        allowedSectionTypesJson: (input.allowedSectionTypesJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        redactionRulesJson: (input.redactionRulesJson as any) || undefined,
        safeVersionSummary: input.safeVersionSummary,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapTemplateVersionFromPrisma(row);
  }

  async getById(versionId: string): Promise<ResultReportCardTemplateVersion | null> {
    const row = await prisma.resultReportCardTemplateVersionRecord.findUnique({ where: { resultReportCardTemplateVersionId: versionId } });
    return row ? mapTemplateVersionFromPrisma(row) : null;
  }

  async listByTemplateId(templateId: string): Promise<ResultReportCardTemplateVersion[]> {
    const rows = await prisma.resultReportCardTemplateVersionRecord.findMany({ where: { resultReportCardTemplateId: templateId } });
    return rows.map(mapTemplateVersionFromPrisma);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardTemplateVersion[]> {
    const rows = await prisma.resultReportCardTemplateVersionRecord.findMany({ where: { schoolId } });
    return rows.map(mapTemplateVersionFromPrisma);
  }

  async update(versionId: string, data: Partial<ResultReportCardTemplateVersion>): Promise<ResultReportCardTemplateVersion> {
    const row = await prisma.resultReportCardTemplateVersionRecord.update({
      where: { resultReportCardTemplateVersionId: versionId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapTemplateVersionFromPrisma(row);
  }

  async updateStatus(versionId: string, status: string): Promise<ResultReportCardTemplateVersion> {
    const data: any = { versionStatus: status, updatedAt: new Date() };
    if (status === 'active') data.activatedAt = new Date();
    if (status === 'retired') data.retiredAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReportCardTemplateVersionRecord.update({
      where: { resultReportCardTemplateVersionId: versionId },
      data,
    });
    return mapTemplateVersionFromPrisma(row);
  }
}

export class PrismaResultReportCardAssemblyRepository implements ResultReportCardAssemblyRepository {
  async create(input: CreateAssemblyFromReleasePacketInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAssembly> {
    const row = await prisma.resultReportCardAssemblyRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardTemplateId: input.resultReportCardTemplateId,
        resultReportCardTemplateVersionId: input.resultReportCardTemplateVersionId,
        resultReleasePacketId: input.resultReleasePacketId,
        resultReleaseApprovalId: input.resultReleaseApprovalId,
        resultAudienceProjectionId: input.resultAudienceProjectionId,
        studentResultReportSnapshotId: input.studentResultReportSnapshotId,
        parentSafeResultSummaryId: input.parentSafeResultSummaryId || null,
        studentSafeResultSummaryId: input.studentSafeResultSummaryId || null,
        resultDeliveryJobId: input.resultDeliveryJobId || null,
        resultDeliveryReceiptId: input.resultDeliveryReceiptId || null,
        resultFinalizationDecisionId: input.resultFinalizationDecisionId,
        resultReleaseBoundaryId: input.resultReleaseBoundaryId,
        resultLearningEvidenceBridgeId: input.resultLearningEvidenceBridgeId || null,
        markingResultVersionId: input.markingResultVersionId,
        studentRef: input.studentRef,
        paperId: input.paperId,
        paperVersionId: input.paperVersionId,
        deliverySessionId: input.deliverySessionId,
        assemblyStatus: 'draft',
        assemblyMode: input.assemblyMode,
        audienceType: input.audienceType,
        safeReportTitle: input.safeReportTitle,
        safeReportSummary: input.safeReportSummary,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        allowedFieldsJson: (input.allowedFieldsJson as any) || undefined,
        blockedFieldsJson: (input.blockedFieldsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAssemblyFromPrisma(row);
  }

  async getById(assemblyId: string): Promise<ResultReportCardAssembly | null> {
    const row = await prisma.resultReportCardAssemblyRecord.findUnique({ where: { resultReportCardAssemblyId: assemblyId } });
    return row ? mapAssemblyFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAssemblyPreview[]> {
    const rows = await prisma.resultReportCardAssemblyRecord.findMany({ where: { schoolId } });
    return rows.map(mapAssemblyPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAssemblyPreview[]> {
    const rows = await prisma.resultReportCardAssemblyRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapAssemblyPreviewFromPrisma);
  }

  async listByReleasePacketId(releasePacketId: string): Promise<ResultReportCardAssemblyPreview[]> {
    const rows = await prisma.resultReportCardAssemblyRecord.findMany({ where: { resultReleasePacketId: releasePacketId } });
    return rows.map(mapAssemblyPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: string): Promise<ResultReportCardAssemblyPreview[]> {
    const rows = await prisma.resultReportCardAssemblyRecord.findMany({ where: { schoolId, assemblyStatus: status } });
    return rows.map(mapAssemblyPreviewFromPrisma);
  }

  async update(assemblyId: string, data: Partial<ResultReportCardAssembly>): Promise<ResultReportCardAssembly> {
    const row = await prisma.resultReportCardAssemblyRecord.update({
      where: { resultReportCardAssemblyId: assemblyId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapAssemblyFromPrisma(row);
  }

  async updateStatus(assemblyId: string, status: string): Promise<ResultReportCardAssembly> {
    const data: any = { assemblyStatus: status, updatedAt: new Date() };
    if (status === 'assembled') data.assembledAt = new Date();
    if (status === 'safety_checked') data.safetyCheckedAt = new Date();
    if (status === 'sealed') data.sealedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'cancelled') data.cancelledAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReportCardAssemblyRecord.update({
      where: { resultReportCardAssemblyId: assemblyId },
      data,
    });
    return mapAssemblyFromPrisma(row);
  }
}

export class PrismaResultReportCardSectionRepository implements ResultReportCardSectionRepository {
  async create(input: CreateReportCardSectionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardSection> {
    const row = await prisma.resultReportCardSectionRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId,
        sectionKey: input.sectionKey,
        sectionType: input.sectionType,
        sectionStatus: 'draft',
        sectionOrder: input.sectionOrder,
        safeHeading: input.safeHeading,
        safeSummary: input.safeSummary,
        safeBodyJson: (input.safeBodyJson as any) || undefined,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        allowedFieldNamesJson: (input.allowedFieldNamesJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        redactionRulesJson: (input.redactionRulesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapSectionFromPrisma(row);
  }

  async getById(sectionId: string): Promise<ResultReportCardSection | null> {
    const row = await prisma.resultReportCardSectionRecord.findUnique({ where: { resultReportCardSectionId: sectionId } });
    return row ? mapSectionFromPrisma(row) : null;
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardSection[]> {
    const rows = await prisma.resultReportCardSectionRecord.findMany({ where: { resultReportCardAssemblyId: assemblyId } });
    return rows.map(mapSectionFromPrisma);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardSection[]> {
    const rows = await prisma.resultReportCardSectionRecord.findMany({ where: { schoolId } });
    return rows.map(mapSectionFromPrisma);
  }

  async update(sectionId: string, data: Partial<ResultReportCardSection>): Promise<ResultReportCardSection> {
    const row = await prisma.resultReportCardSectionRecord.update({
      where: { resultReportCardSectionId: sectionId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapSectionFromPrisma(row);
  }

  async updateStatus(sectionId: string, status: string): Promise<ResultReportCardSection> {
    const data: any = { sectionStatus: status, updatedAt: new Date() };
    if (status === 'sealed') data.sealedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReportCardSectionRecord.update({
      where: { resultReportCardSectionId: sectionId },
      data,
    });
    return mapSectionFromPrisma(row);
  }
}

export class PrismaResultReportCardEvidenceLinkRepository implements ResultReportCardEvidenceLinkRepository {
  async create(input: CreateEvidenceLinkInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardEvidenceLink> {
    const row = await prisma.resultReportCardEvidenceLinkRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId,
        resultReportCardSectionId: input.resultReportCardSectionId || null,
        sourceRecordType: input.sourceRecordType,
        sourceRecordId: input.sourceRecordId,
        sourcePackage: input.sourcePackage,
        evidenceStatus: 'active',
        evidenceUse: input.evidenceUse,
        safeEvidenceSummary: input.safeEvidenceSummary,
        allowedUseJson: (input.allowedUseJson as any) || undefined,
        blockedUseJson: (input.blockedUseJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapEvidenceLinkFromPrisma(row);
  }

  async getById(evidenceLinkId: string): Promise<ResultReportCardEvidenceLink | null> {
    const row = await prisma.resultReportCardEvidenceLinkRecord.findUnique({ where: { resultReportCardEvidenceLinkId: evidenceLinkId } });
    return row ? mapEvidenceLinkFromPrisma(row) : null;
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardEvidenceLink[]> {
    const rows = await prisma.resultReportCardEvidenceLinkRecord.findMany({ where: { resultReportCardAssemblyId: assemblyId } });
    return rows.map(mapEvidenceLinkFromPrisma);
  }

  async listBySectionId(sectionId: string): Promise<ResultReportCardEvidenceLink[]> {
    const rows = await prisma.resultReportCardEvidenceLinkRecord.findMany({ where: { resultReportCardSectionId: sectionId } });
    return rows.map(mapEvidenceLinkFromPrisma);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardEvidenceLink[]> {
    const rows = await prisma.resultReportCardEvidenceLinkRecord.findMany({ where: { schoolId } });
    return rows.map(mapEvidenceLinkFromPrisma);
  }

  async updateStatus(evidenceLinkId: string, status: string): Promise<ResultReportCardEvidenceLink> {
    const data: any = { evidenceStatus: status, updatedAt: new Date() };
    if (status === 'blocked') data.voidedAt = null;
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReportCardEvidenceLinkRecord.update({
      where: { resultReportCardEvidenceLinkId: evidenceLinkId },
      data,
    });
    return mapEvidenceLinkFromPrisma(row);
  }
}

export class PrismaResultReportCardAudienceProjectionRepository implements ResultReportCardAudienceProjectionRepository {
  async create(input: CreateAudienceProjectionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAudienceProjection> {
    const row = await prisma.resultReportCardAudienceProjectionRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId,
        audienceType: input.audienceType,
        projectionStatus: 'draft',
        projectionVersion: '1.0',
        safeProjectionJson: (input.safeProjectionJson as any) || undefined,
        allowedFieldNamesJson: (input.allowedFieldNamesJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        redactionRulesJson: (input.redactionRulesJson as any) || undefined,
        safeProjectionSummary: input.safeProjectionSummary,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAudienceProjectionFromPrisma(row);
  }

  async getById(projectionId: string): Promise<ResultReportCardAudienceProjection | null> {
    const row = await prisma.resultReportCardAudienceProjectionRecord.findUnique({ where: { resultReportCardAudienceProjectionId: projectionId } });
    return row ? mapAudienceProjectionFromPrisma(row) : null;
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardAudienceProjection[]> {
    const rows = await prisma.resultReportCardAudienceProjectionRecord.findMany({ where: { resultReportCardAssemblyId: assemblyId } });
    return rows.map(mapAudienceProjectionFromPrisma);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAudienceProjection[]> {
    const rows = await prisma.resultReportCardAudienceProjectionRecord.findMany({ where: { schoolId } });
    return rows.map(mapAudienceProjectionFromPrisma);
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultReportCardAudienceProjection[]> {
    const rows = await prisma.resultReportCardAudienceProjectionRecord.findMany({ where: { schoolId, audienceType } });
    return rows.map(mapAudienceProjectionFromPrisma);
  }

  async update(projectionId: string, data: Partial<ResultReportCardAudienceProjection>): Promise<ResultReportCardAudienceProjection> {
    const row = await prisma.resultReportCardAudienceProjectionRecord.update({
      where: { resultReportCardAudienceProjectionId: projectionId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapAudienceProjectionFromPrisma(row);
  }

  async updateStatus(projectionId: string, status: string): Promise<ResultReportCardAudienceProjection> {
    const data: any = { projectionStatus: status, updatedAt: new Date() };
    if (status === 'generated') data.updatedAt = new Date();
    if (status === 'sealed') data.sealedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReportCardAudienceProjectionRecord.update({
      where: { resultReportCardAudienceProjectionId: projectionId },
      data,
    });
    return mapAudienceProjectionFromPrisma(row);
  }
}

export class PrismaResultReportCardReviewRepository implements ResultReportCardReviewRepository {
  async create(input: CreateReviewInput & { reviewedByActorId: string; reviewedByRole: string; schoolId: string }): Promise<ResultReportCardReview> {
    const row = await prisma.resultReportCardReviewRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId,
        resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId || null,
        reviewStatus: 'draft',
        reviewType: input.reviewType,
        reviewDecision: 'pending',
        reviewedByActorId: input.reviewedByActorId,
        reviewedByRole: input.reviewedByRole,
        safeReviewSummary: input.safeReviewSummary,
        reasonCodesJson: (input.reasonCodesJson as any) || undefined,
      },
    });
    return mapReviewFromPrisma(row);
  }

  async getById(reviewId: string): Promise<ResultReportCardReview | null> {
    const row = await prisma.resultReportCardReviewRecord.findUnique({ where: { resultReportCardReviewId: reviewId } });
    return row ? mapReviewFromPrisma(row) : null;
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardReview[]> {
    const rows = await prisma.resultReportCardReviewRecord.findMany({ where: { resultReportCardAssemblyId: assemblyId } });
    return rows.map(mapReviewFromPrisma);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardReview[]> {
    const rows = await prisma.resultReportCardReviewRecord.findMany({ where: { schoolId } });
    return rows.map(mapReviewFromPrisma);
  }

  async update(reviewId: string, data: Partial<ResultReportCardReview>): Promise<ResultReportCardReview> {
    const row = await prisma.resultReportCardReviewRecord.update({
      where: { resultReportCardReviewId: reviewId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapReviewFromPrisma(row);
  }

  async updateStatus(reviewId: string, status: string): Promise<ResultReportCardReview> {
    const data: any = { reviewStatus: status, updatedAt: new Date() };
    if (status === 'approved') data.approvedAt = new Date();
    if (status === 'rejected') data.rejectedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReportCardReviewRecord.update({
      where: { resultReportCardReviewId: reviewId },
      data,
    });
    return mapReviewFromPrisma(row);
  }
}

export class PrismaResultReportCardExportIntentRepository implements ResultReportCardExportIntentRepository {
  async create(input: CreateExportIntentInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportIntent> {
    const row = await prisma.resultReportCardExportIntentRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId,
        resultReportCardReviewId: input.resultReportCardReviewId,
        resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId,
        exportStatus: 'draft',
        exportChannel: input.exportChannel,
        exportMode: input.exportMode,
        safeExportIntentSummary: input.safeExportIntentSummary,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapExportIntentFromPrisma(row);
  }

  async getById(exportIntentId: string): Promise<ResultReportCardExportIntent | null> {
    const row = await prisma.resultReportCardExportIntentRecord.findUnique({ where: { resultReportCardExportIntentId: exportIntentId } });
    return row ? mapExportIntentFromPrisma(row) : null;
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardExportIntentPreview[]> {
    const rows = await prisma.resultReportCardExportIntentRecord.findMany({ where: { resultReportCardAssemblyId: assemblyId } });
    return rows.map(mapExportIntentPreviewFromPrisma);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportIntentPreview[]> {
    const rows = await prisma.resultReportCardExportIntentRecord.findMany({ where: { schoolId } });
    return rows.map(mapExportIntentPreviewFromPrisma);
  }

  async update(exportIntentId: string, data: Partial<ResultReportCardExportIntent>): Promise<ResultReportCardExportIntent> {
    const row = await prisma.resultReportCardExportIntentRecord.update({
      where: { resultReportCardExportIntentId: exportIntentId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapExportIntentFromPrisma(row);
  }

  async updateStatus(exportIntentId: string, status: string): Promise<ResultReportCardExportIntent> {
    const data: any = { exportStatus: status, updatedAt: new Date() };
    if (status === 'eligible_for_future_export') data.eligibleAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReportCardExportIntentRecord.update({
      where: { resultReportCardExportIntentId: exportIntentId },
      data,
    });
    return mapExportIntentFromPrisma(row);
  }
}

export class PrismaResultReportCardRenderManifestRepository implements ResultReportCardRenderManifestRepository {
  async create(input: CreateRenderManifestInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardRenderManifest> {
    const row = await prisma.resultReportCardRenderManifestRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId,
        resultReportCardTemplateVersionId: input.resultReportCardTemplateVersionId,
        manifestStatus: 'draft',
        renderMode: input.renderMode,
        safeManifestSummary: input.safeManifestSummary,
        layoutJson: (input.layoutJson as any) || undefined,
        sectionOrderJson: (input.sectionOrderJson as any) || undefined,
        assetRefsJson: (input.assetRefsJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRenderManifestFromPrisma(row);
  }

  async getById(manifestId: string): Promise<ResultReportCardRenderManifest | null> {
    const row = await prisma.resultReportCardRenderManifestRecord.findUnique({ where: { resultReportCardRenderManifestId: manifestId } });
    return row ? mapRenderManifestFromPrisma(row) : null;
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardRenderManifest[]> {
    const rows = await prisma.resultReportCardRenderManifestRecord.findMany({ where: { resultReportCardAssemblyId: assemblyId } });
    return rows.map(mapRenderManifestFromPrisma);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardRenderManifest[]> {
    const rows = await prisma.resultReportCardRenderManifestRecord.findMany({ where: { schoolId } });
    return rows.map(mapRenderManifestFromPrisma);
  }

  async update(manifestId: string, data: Partial<ResultReportCardRenderManifest>): Promise<ResultReportCardRenderManifest> {
    const row = await prisma.resultReportCardRenderManifestRecord.update({
      where: { resultReportCardRenderManifestId: manifestId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRenderManifestFromPrisma(row);
  }

  async updateStatus(manifestId: string, status: string): Promise<ResultReportCardRenderManifest> {
    const data: any = { manifestStatus: status, updatedAt: new Date() };
    if (status === 'generated') data.updatedAt = new Date();
    if (status === 'sealed') data.sealedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultReportCardRenderManifestRecord.update({
      where: { resultReportCardRenderManifestId: manifestId },
      data,
    });
    return mapRenderManifestFromPrisma(row);
  }
}

export class PrismaResultReportCardAuditRepository implements ResultReportCardAuditRepository {
  async create(event: Omit<ResultReportCardAuditEvent, 'resultReportCardAuditId' | 'createdAt'>): Promise<ResultReportCardAuditEvent> {
    const row = await prisma.resultReportCardAuditRecord.create({ data: event as any });
    return mapAuditFromPrisma(row);
  }
}

export class PrismaResultReportCardIdempotencyRepository implements ResultReportCardIdempotencyRepository {
  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; expiresAt?: string }): Promise<ResultReportCardIdempotencyEntry> {
    const row = await prisma.resultReportCardIdempotencyRecord.create({
      data: {
        schoolId: input.schoolId,
        operation: input.operation,
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        status: input.status || 'pending',
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    return mapIdempotencyFromPrisma(row);
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardIdempotencyEntry | null> {
    const row = await prisma.resultReportCardIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    }).catch(() => null);
    return row ? mapIdempotencyFromPrisma(row) : null;
  }

  async update(idempotencyId: string, data: Partial<ResultReportCardIdempotencyEntry>): Promise<ResultReportCardIdempotencyEntry> {
    const row = await prisma.resultReportCardIdempotencyRecord.update({
      where: { resultReportCardIdempotencyId: idempotencyId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapIdempotencyFromPrisma(row);
  }
}
