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

let counter = 0;
function uuid(): string { return `p13-${++counter}`; }
function now(): string { return new Date().toISOString(); }

export class InMemoryResultReportCardTemplateRepository implements ResultReportCardTemplateRepository {
  private store = new Map<string, ResultReportCardTemplate>();

  async create(input: CreateReportCardTemplateInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardTemplate> {
    const record: ResultReportCardTemplate = {
      ...input,
      resultReportCardTemplateId: uuid(),
      templateStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      disabledAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardTemplateId, record);
    return record;
  }

  async getById(templateId: string): Promise<ResultReportCardTemplate | null> { return this.store.get(templateId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultReportCardTemplate[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStatus(schoolId: string, status: string): Promise<ResultReportCardTemplate[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.templateStatus === status);
  }

  async update(templateId: string, data: Partial<ResultReportCardTemplate>): Promise<ResultReportCardTemplate> {
    const r = this.store.get(templateId);
    if (!r) throw new Error(`ResultReportCardTemplate not found: ${templateId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(templateId, updated);
    return updated;
  }

  async updateStatus(templateId: string, status: string): Promise<ResultReportCardTemplate> {
    const r = this.store.get(templateId);
    if (!r) throw new Error(`ResultReportCardTemplate not found: ${templateId}`);
    const updated = { ...r, templateStatus: status as ResultReportCardTemplate['templateStatus'], updatedAt: now() };
    this.store.set(templateId, updated);
    return updated;
  }
}

export class InMemoryResultReportCardTemplateVersionRepository implements ResultReportCardTemplateVersionRepository {
  private store = new Map<string, ResultReportCardTemplateVersion>();

  async create(input: CreateReportCardTemplateVersionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardTemplateVersion> {
    const record: ResultReportCardTemplateVersion = {
      ...input,
      sectionSchemaJson: input.sectionSchemaJson ?? null,
      allowedSectionTypesJson: input.allowedSectionTypesJson ?? null,
      blockedFieldNamesJson: input.blockedFieldNamesJson ?? null,
      redactionRulesJson: input.redactionRulesJson ?? null,
      resultReportCardTemplateVersionId: uuid(),
      versionStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      activatedAt: null,
      retiredAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardTemplateVersionId, record);
    return record;
  }

  async getById(versionId: string): Promise<ResultReportCardTemplateVersion | null> { return this.store.get(versionId) ?? null; }

  async listByTemplateId(templateId: string): Promise<ResultReportCardTemplateVersion[]> {
    return Array.from(this.store.values()).filter(r => r.resultReportCardTemplateId === templateId);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardTemplateVersion[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async update(versionId: string, data: Partial<ResultReportCardTemplateVersion>): Promise<ResultReportCardTemplateVersion> {
    const r = this.store.get(versionId);
    if (!r) throw new Error(`ResultReportCardTemplateVersion not found: ${versionId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(versionId, updated);
    return updated;
  }

  async updateStatus(versionId: string, status: string): Promise<ResultReportCardTemplateVersion> {
    const r = this.store.get(versionId);
    if (!r) throw new Error(`ResultReportCardTemplateVersion not found: ${versionId}`);
    const updated = { ...r, versionStatus: status as ResultReportCardTemplateVersion['versionStatus'], updatedAt: now() };
    this.store.set(versionId, updated);
    return updated;
  }
}

export class InMemoryResultReportCardAssemblyRepository implements ResultReportCardAssemblyRepository {
  private store = new Map<string, ResultReportCardAssembly>();

  async create(input: CreateAssemblyFromReleasePacketInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAssembly> {
    const record: ResultReportCardAssembly = {
      ...input,
      parentSafeResultSummaryId: input.parentSafeResultSummaryId ?? null,
      studentSafeResultSummaryId: input.studentSafeResultSummaryId ?? null,
      resultDeliveryJobId: input.resultDeliveryJobId ?? null,
      resultDeliveryReceiptId: input.resultDeliveryReceiptId ?? null,
      resultLearningEvidenceBridgeId: input.resultLearningEvidenceBridgeId ?? null,
      sourceRefsJson: input.sourceRefsJson ?? null,
      allowedFieldsJson: input.allowedFieldsJson ?? null,
      blockedFieldsJson: input.blockedFieldsJson ?? null,
      resultReportCardAssemblyId: uuid(),
      assemblyStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      assembledAt: null,
      safetyCheckedAt: null,
      sealedAt: null,
      blockedAt: null,
      cancelledAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAssemblyId, record);
    return record;
  }

  async getById(assemblyId: string): Promise<ResultReportCardAssembly | null> { return this.store.get(assemblyId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultReportCardAssemblyPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAssemblyPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByReleasePacketId(releasePacketId: string): Promise<ResultReportCardAssemblyPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReleasePacketId === releasePacketId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<ResultReportCardAssemblyPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.assemblyStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(assemblyId: string, data: Partial<ResultReportCardAssembly>): Promise<ResultReportCardAssembly> {
    const r = this.store.get(assemblyId);
    if (!r) throw new Error(`ResultReportCardAssembly not found: ${assemblyId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(assemblyId, updated);
    return updated;
  }

  async updateStatus(assemblyId: string, status: string): Promise<ResultReportCardAssembly> {
    const r = this.store.get(assemblyId);
    if (!r) throw new Error(`ResultReportCardAssembly not found: ${assemblyId}`);
    const updated = { ...r, assemblyStatus: status as ResultReportCardAssembly['assemblyStatus'], updatedAt: now() };
    this.store.set(assemblyId, updated);
    return updated;
  }

  private toPreview(r: ResultReportCardAssembly): ResultReportCardAssemblyPreview {
    return {
      resultReportCardAssemblyId: r.resultReportCardAssemblyId,
      schoolId: r.schoolId,
      assemblyStatus: r.assemblyStatus,
      assemblyMode: r.assemblyMode,
      audienceType: r.audienceType,
      safeReportTitle: r.safeReportTitle,
      safeReportSummary: r.safeReportSummary,
      studentRef: r.studentRef,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

export class InMemoryResultReportCardSectionRepository implements ResultReportCardSectionRepository {
  private store = new Map<string, ResultReportCardSection>();

  async create(input: CreateReportCardSectionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardSection> {
    const record: ResultReportCardSection = {
      ...input,
      safeBodyJson: input.safeBodyJson ?? null,
      sourceRefsJson: input.sourceRefsJson ?? null,
      allowedFieldNamesJson: input.allowedFieldNamesJson ?? null,
      blockedFieldNamesJson: input.blockedFieldNamesJson ?? null,
      redactionRulesJson: input.redactionRulesJson ?? null,
      resultReportCardSectionId: uuid(),
      sectionStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      sealedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardSectionId, record);
    return record;
  }

  async getById(sectionId: string): Promise<ResultReportCardSection | null> { return this.store.get(sectionId) ?? null; }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardSection[]> {
    return Array.from(this.store.values()).filter(r => r.resultReportCardAssemblyId === assemblyId);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardSection[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async update(sectionId: string, data: Partial<ResultReportCardSection>): Promise<ResultReportCardSection> {
    const r = this.store.get(sectionId);
    if (!r) throw new Error(`ResultReportCardSection not found: ${sectionId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(sectionId, updated);
    return updated;
  }

  async updateStatus(sectionId: string, status: string): Promise<ResultReportCardSection> {
    const r = this.store.get(sectionId);
    if (!r) throw new Error(`ResultReportCardSection not found: ${sectionId}`);
    const updated = { ...r, sectionStatus: status as ResultReportCardSection['sectionStatus'], updatedAt: now() };
    this.store.set(sectionId, updated);
    return updated;
  }
}

export class InMemoryResultReportCardEvidenceLinkRepository implements ResultReportCardEvidenceLinkRepository {
  private store = new Map<string, ResultReportCardEvidenceLink>();

  async create(input: CreateEvidenceLinkInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardEvidenceLink> {
    const record: ResultReportCardEvidenceLink = {
      ...input,
      resultReportCardSectionId: input.resultReportCardSectionId ?? null,
      allowedUseJson: input.allowedUseJson ?? null,
      blockedUseJson: input.blockedUseJson ?? null,
      resultReportCardEvidenceLinkId: uuid(),
      evidenceStatus: 'active',
      createdAt: now(),
      updatedAt: now(),
      voidedAt: null,
    };
    this.store.set(record.resultReportCardEvidenceLinkId, record);
    return record;
  }

  async getById(evidenceLinkId: string): Promise<ResultReportCardEvidenceLink | null> { return this.store.get(evidenceLinkId) ?? null; }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardEvidenceLink[]> {
    return Array.from(this.store.values()).filter(r => r.resultReportCardAssemblyId === assemblyId);
  }

  async listBySectionId(sectionId: string): Promise<ResultReportCardEvidenceLink[]> {
    return Array.from(this.store.values()).filter(r => r.resultReportCardSectionId === sectionId);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardEvidenceLink[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async updateStatus(evidenceLinkId: string, status: string): Promise<ResultReportCardEvidenceLink> {
    const r = this.store.get(evidenceLinkId);
    if (!r) throw new Error(`ResultReportCardEvidenceLink not found: ${evidenceLinkId}`);
    const updated = { ...r, evidenceStatus: status as ResultReportCardEvidenceLink['evidenceStatus'], updatedAt: now() };
    this.store.set(evidenceLinkId, updated);
    return updated;
  }
}

export class InMemoryResultReportCardAudienceProjectionRepository implements ResultReportCardAudienceProjectionRepository {
  private store = new Map<string, ResultReportCardAudienceProjection>();

  async create(input: CreateAudienceProjectionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAudienceProjection> {
    const record: ResultReportCardAudienceProjection = {
      ...input,
      safeProjectionJson: input.safeProjectionJson ?? null,
      allowedFieldNamesJson: input.allowedFieldNamesJson ?? null,
      blockedFieldNamesJson: input.blockedFieldNamesJson ?? null,
      redactionRulesJson: input.redactionRulesJson ?? null,
      resultReportCardAudienceProjectionId: uuid(),
      projectionVersion: '1.0',
      projectionStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      sealedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAudienceProjectionId, record);
    return record;
  }

  async getById(projectionId: string): Promise<ResultReportCardAudienceProjection | null> { return this.store.get(projectionId) ?? null; }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardAudienceProjection[]> {
    return Array.from(this.store.values()).filter(r => r.resultReportCardAssemblyId === assemblyId);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAudienceProjection[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultReportCardAudienceProjection[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.audienceType === audienceType);
  }

  async update(projectionId: string, data: Partial<ResultReportCardAudienceProjection>): Promise<ResultReportCardAudienceProjection> {
    const r = this.store.get(projectionId);
    if (!r) throw new Error(`ResultReportCardAudienceProjection not found: ${projectionId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(projectionId, updated);
    return updated;
  }

  async updateStatus(projectionId: string, status: string): Promise<ResultReportCardAudienceProjection> {
    const r = this.store.get(projectionId);
    if (!r) throw new Error(`ResultReportCardAudienceProjection not found: ${projectionId}`);
    const updated = { ...r, projectionStatus: status as ResultReportCardAudienceProjection['projectionStatus'], updatedAt: now() };
    this.store.set(projectionId, updated);
    return updated;
  }
}

export class InMemoryResultReportCardReviewRepository implements ResultReportCardReviewRepository {
  private store = new Map<string, ResultReportCardReview>();

  async create(input: CreateReviewInput & { reviewedByActorId: string; reviewedByRole: string; schoolId: string }): Promise<ResultReportCardReview> {
    const record: ResultReportCardReview = {
      ...input,
      resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId ?? null,
      reasonCodesJson: input.reasonCodesJson ?? null,
      resultReportCardReviewId: uuid(),
      reviewStatus: 'draft',
      reviewDecision: 'pending',
      createdAt: now(),
      updatedAt: now(),
      approvedAt: null,
      rejectedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardReviewId, record);
    return record;
  }

  async getById(reviewId: string): Promise<ResultReportCardReview | null> { return this.store.get(reviewId) ?? null; }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardReview[]> {
    return Array.from(this.store.values()).filter(r => r.resultReportCardAssemblyId === assemblyId);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardReview[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async update(reviewId: string, data: Partial<ResultReportCardReview>): Promise<ResultReportCardReview> {
    const r = this.store.get(reviewId);
    if (!r) throw new Error(`ResultReportCardReview not found: ${reviewId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(reviewId, updated);
    return updated;
  }

  async updateStatus(reviewId: string, status: string): Promise<ResultReportCardReview> {
    const r = this.store.get(reviewId);
    if (!r) throw new Error(`ResultReportCardReview not found: ${reviewId}`);
    const updated = { ...r, reviewStatus: status as ResultReportCardReview['reviewStatus'], updatedAt: now() };
    this.store.set(reviewId, updated);
    return updated;
  }
}

export class InMemoryResultReportCardExportIntentRepository implements ResultReportCardExportIntentRepository {
  private store = new Map<string, ResultReportCardExportIntent>();

  async create(input: CreateExportIntentInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportIntent> {
    const record: ResultReportCardExportIntent = {
      ...input,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      sourceRefsJson: input.sourceRefsJson ?? null,
      resultReportCardExportIntentId: uuid(),
      exportStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      eligibleAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardExportIntentId, record);
    return record;
  }

  async getById(exportIntentId: string): Promise<ResultReportCardExportIntent | null> { return this.store.get(exportIntentId) ?? null; }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardExportIntentPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAssemblyId === assemblyId)
      .map(r => this.toPreview(r));
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportIntentPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async update(exportIntentId: string, data: Partial<ResultReportCardExportIntent>): Promise<ResultReportCardExportIntent> {
    const r = this.store.get(exportIntentId);
    if (!r) throw new Error(`ResultReportCardExportIntent not found: ${exportIntentId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(exportIntentId, updated);
    return updated;
  }

  async updateStatus(exportIntentId: string, status: string): Promise<ResultReportCardExportIntent> {
    const r = this.store.get(exportIntentId);
    if (!r) throw new Error(`ResultReportCardExportIntent not found: ${exportIntentId}`);
    const updated = { ...r, exportStatus: status as ResultReportCardExportIntent['exportStatus'], updatedAt: now() };
    this.store.set(exportIntentId, updated);
    return updated;
  }

  private toPreview(r: ResultReportCardExportIntent): ResultReportCardExportIntentPreview {
    return {
      resultReportCardExportIntentId: r.resultReportCardExportIntentId,
      schoolId: r.schoolId,
      resultReportCardAssemblyId: r.resultReportCardAssemblyId,
      exportStatus: r.exportStatus,
      exportChannel: r.exportChannel,
      exportMode: r.exportMode,
      safeExportIntentSummary: r.safeExportIntentSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardRenderManifestRepository implements ResultReportCardRenderManifestRepository {
  private store = new Map<string, ResultReportCardRenderManifest>();

  async create(input: CreateRenderManifestInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardRenderManifest> {
    const record: ResultReportCardRenderManifest = {
      ...input,
      layoutJson: input.layoutJson ?? null,
      sectionOrderJson: input.sectionOrderJson ?? null,
      assetRefsJson: input.assetRefsJson ?? null,
      blockedFieldNamesJson: input.blockedFieldNamesJson ?? null,
      resultReportCardRenderManifestId: uuid(),
      manifestStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      sealedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardRenderManifestId, record);
    return record;
  }

  async getById(manifestId: string): Promise<ResultReportCardRenderManifest | null> { return this.store.get(manifestId) ?? null; }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardRenderManifest[]> {
    return Array.from(this.store.values()).filter(r => r.resultReportCardAssemblyId === assemblyId);
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardRenderManifest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async update(manifestId: string, data: Partial<ResultReportCardRenderManifest>): Promise<ResultReportCardRenderManifest> {
    const r = this.store.get(manifestId);
    if (!r) throw new Error(`ResultReportCardRenderManifest not found: ${manifestId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(manifestId, updated);
    return updated;
  }

  async updateStatus(manifestId: string, status: string): Promise<ResultReportCardRenderManifest> {
    const r = this.store.get(manifestId);
    if (!r) throw new Error(`ResultReportCardRenderManifest not found: ${manifestId}`);
    const updated = { ...r, manifestStatus: status as ResultReportCardRenderManifest['manifestStatus'], updatedAt: now() };
    this.store.set(manifestId, updated);
    return updated;
  }
}

export class InMemoryResultReportCardAuditRepository implements ResultReportCardAuditRepository {
  private store = new Map<string, ResultReportCardAuditEvent>();

  async create(event: Omit<ResultReportCardAuditEvent, 'resultReportCardAuditId' | 'createdAt'>): Promise<ResultReportCardAuditEvent> {
    const record: ResultReportCardAuditEvent = { ...event, resultReportCardAuditId: uuid(), createdAt: now() };
    this.store.set(record.resultReportCardAuditId, record);
    return record;
  }
}

export class InMemoryResultReportCardIdempotencyRepository implements ResultReportCardIdempotencyRepository {
  private store = new Map<string, ResultReportCardIdempotencyEntry>();

  private key(schoolId: string, operation: string, idempotencyKey: string): string {
    return `${schoolId}:${operation}:${idempotencyKey}`;
  }

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; expiresAt?: string }): Promise<ResultReportCardIdempotencyEntry> {
    const record: ResultReportCardIdempotencyEntry = {
      resultReportCardIdempotencyId: uuid(),
      schoolId: input.schoolId,
      operation: input.operation,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
      status: input.status ?? 'pending',
      resourceType: null,
      resourceId: null,
      safeResultSummary: null,
      createdAt: now(),
      updatedAt: now(),
      expiresAt: input.expiresAt ?? null,
    };
    this.store.set(this.key(record.schoolId, record.operation, record.idempotencyKey), record);
    this.store.set(record.resultReportCardIdempotencyId, record);
    return record;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardIdempotencyEntry | null> {
    return this.store.get(this.key(schoolId, operation, idempotencyKey)) ?? null;
  }

  async update(idempotencyId: string, data: Partial<ResultReportCardIdempotencyEntry>): Promise<ResultReportCardIdempotencyEntry> {
    const r = this.store.get(idempotencyId);
    if (!r) throw new Error(`ResultReportCardIdempotencyEntry not found: ${idempotencyId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(idempotencyId, updated);
    this.store.set(this.key(r.schoolId, r.operation, r.idempotencyKey), updated);
    return updated;
  }
}
