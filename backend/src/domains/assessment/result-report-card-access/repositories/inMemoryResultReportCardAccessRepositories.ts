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

let counter = 0;
function uuid(): string { return `p15-${++counter}`; }
function now(): string { return new Date().toISOString(); }

export class InMemoryResultReportCardAccessGrantRepository implements ResultReportCardAccessGrantRepository {
  private store = new Map<string, ResultReportCardAccessGrant>();

  async create(input: CreateAccessGrantInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessGrant> {
    const record: ResultReportCardAccessGrant = {
      ...input,
      resultReportCardExportReceiptId: input.resultReportCardExportReceiptId ?? null,
      resultReportCardArchiveManifestId: input.resultReportCardArchiveManifestId ?? null,
      sourceRefsJson: input.sourceRefsJson ?? null,
      allowedChannelsJson: input.allowedChannelsJson ?? null,
      blockedChannelsJson: input.blockedChannelsJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardAccessGrantId: uuid(),
      grantStatus: 'draft' as ResultReportCardAccessGrantStatus,
      createdAt: now(),
      updatedAt: now(),
      validatedAt: null,
      readyAt: null,
      suppressedAt: null,
      revokedAt: null,
      expiredAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAccessGrantId, record);
    return record;
  }

  async getById(accessGrantId: string): Promise<ResultReportCardAccessGrant | null> {
    return this.store.get(accessGrantId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessGrantPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAccessGrantPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardAccessGrantPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAssemblyId === assemblyId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessGrantStatus | string): Promise<ResultReportCardAccessGrantPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.grantStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(accessGrantId: string, data: Partial<ResultReportCardAccessGrant>): Promise<ResultReportCardAccessGrant> {
    const r = this.store.get(accessGrantId);
    if (!r) throw new Error(`ResultReportCardAccessGrant not found: ${accessGrantId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(accessGrantId, updated);
    return updated;
  }

  async updateStatus(accessGrantId: string, input: UpdateAccessGrantStatusInput): Promise<ResultReportCardAccessGrant> {
    const r = this.store.get(accessGrantId);
    if (!r) throw new Error(`ResultReportCardAccessGrant not found: ${accessGrantId}`);
    const data: any = { grantStatus: input.status, updatedAt: now() };
    if (input.status === 'validated') data.validatedAt = now();
    if (input.status === 'ready_for_future_access') data.readyAt = now();
    if (input.status === 'suppressed') data.suppressedAt = now();
    if (input.status === 'revoked') data.revokedAt = now();
    if (input.status === 'expired') data.expiredAt = now();
    if (input.status === 'blocked') data.blockedAt = now();
    if (input.status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(accessGrantId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardAccessGrant): ResultReportCardAccessGrantPreview {
    return {
      resultReportCardAccessGrantId: r.resultReportCardAccessGrantId,
      schoolId: r.schoolId,
      grantStatus: r.grantStatus as string,
      grantMode: r.grantMode as string,
      grantPurpose: r.grantPurpose,
      safeGrantSummary: r.safeGrantSummary,
      studentRef: r.studentRef,
      audienceType: r.audienceType,
      resultReportCardExportJobId: r.resultReportCardExportJobId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

export class InMemoryResultReportCardAccessRecipientRepository implements ResultReportCardAccessRecipientRepository {
  private store = new Map<string, ResultReportCardAccessRecipient>();

  async create(input: CreateAccessRecipientInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessRecipient> {
    const record: ResultReportCardAccessRecipient = {
      ...input,
      recipientDescriptorJson: input.recipientDescriptorJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardAccessRecipientId: uuid(),
      recipientStatus: 'draft' as ResultReportCardAccessRecipientStatus,
      createdAt: now(),
      updatedAt: now(),
      validatedAt: null,
      suppressedAt: null,
      revokedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAccessRecipientId, record);
    return record;
  }

  async getById(accessRecipientId: string): Promise<ResultReportCardAccessRecipient | null> {
    return this.store.get(accessRecipientId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessRecipientPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessRecipientPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessGrantId === accessGrantId)
      .map(r => this.toPreview(r));
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultReportCardAccessRecipientPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.audienceType === audienceType)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessRecipientStatus | string): Promise<ResultReportCardAccessRecipientPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.recipientStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(accessRecipientId: string, data: Partial<ResultReportCardAccessRecipient>): Promise<ResultReportCardAccessRecipient> {
    const r = this.store.get(accessRecipientId);
    if (!r) throw new Error(`ResultReportCardAccessRecipient not found: ${accessRecipientId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(accessRecipientId, updated);
    return updated;
  }

  async updateStatus(accessRecipientId: string, input: UpdateAccessRecipientStatusInput): Promise<ResultReportCardAccessRecipient> {
    const r = this.store.get(accessRecipientId);
    if (!r) throw new Error(`ResultReportCardAccessRecipient not found: ${accessRecipientId}`);
    const data: any = { recipientStatus: input.status, updatedAt: now() };
    if (input.status === 'validated') data.validatedAt = now();
    if (input.status === 'suppressed') data.suppressedAt = now();
    if (input.status === 'revoked') data.revokedAt = now();
    if (input.status === 'blocked') data.blockedAt = now();
    if (input.status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(accessRecipientId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardAccessRecipient): ResultReportCardAccessRecipientPreview {
    return {
      resultReportCardAccessRecipientId: r.resultReportCardAccessRecipientId,
      schoolId: r.schoolId,
      resultReportCardAccessGrantId: r.resultReportCardAccessGrantId,
      recipientStatus: r.recipientStatus as string,
      audienceType: r.audienceType as string,
      safeRecipientSummary: r.safeRecipientSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardPortalPreviewRepository implements ResultReportCardPortalPreviewRepository {
  private store = new Map<string, ResultReportCardPortalPreview>();

  async create(input: CreatePortalPreviewInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardPortalPreview> {
    const record: ResultReportCardPortalPreview = {
      ...input,
      safePayloadJson: input.safePayloadJson ?? null,
      redactionRulesJson: input.redactionRulesJson ?? null,
      allowedFieldNamesJson: input.allowedFieldNamesJson ?? null,
      blockedFieldNamesJson: input.blockedFieldNamesJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardPortalPreviewId: uuid(),
      previewStatus: 'draft' as ResultReportCardPortalPreviewStatus,
      createdAt: now(),
      updatedAt: now(),
      sealedAt: null,
      suppressedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardPortalPreviewId, record);
    return record;
  }

  async getById(portalPreviewId: string): Promise<ResultReportCardPortalPreview | null> {
    return this.store.get(portalPreviewId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardPortalPreviewPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardPortalPreviewPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessGrantId === accessGrantId)
      .map(r => this.toPreview(r));
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardPortalPreviewPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessRecipientId === recipientId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardPortalPreviewStatus | string): Promise<ResultReportCardPortalPreviewPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.previewStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(portalPreviewId: string, data: Partial<ResultReportCardPortalPreview>): Promise<ResultReportCardPortalPreview> {
    const r = this.store.get(portalPreviewId);
    if (!r) throw new Error(`ResultReportCardPortalPreview not found: ${portalPreviewId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(portalPreviewId, updated);
    return updated;
  }

  async updateStatus(portalPreviewId: string, input: UpdatePortalPreviewStatusInput): Promise<ResultReportCardPortalPreview> {
    const r = this.store.get(portalPreviewId);
    if (!r) throw new Error(`ResultReportCardPortalPreview not found: ${portalPreviewId}`);
    const data: any = { previewStatus: input.status, updatedAt: now() };
    if (input.status === 'composed') data.updatedAt = now();
    if (input.status === 'sealed') data.sealedAt = now();
    if (input.status === 'suppressed') data.suppressedAt = now();
    if (input.status === 'blocked') data.blockedAt = now();
    if (input.status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(portalPreviewId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardPortalPreview): ResultReportCardPortalPreviewPreview {
    return {
      resultReportCardPortalPreviewId: r.resultReportCardPortalPreviewId,
      schoolId: r.schoolId,
      resultReportCardAccessGrantId: r.resultReportCardAccessGrantId,
      resultReportCardAccessRecipientId: r.resultReportCardAccessRecipientId,
      previewStatus: r.previewStatus as string,
      previewMode: r.previewMode as string,
      safePreviewSummary: r.safePreviewSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardAccessTokenIntentRepository implements ResultReportCardAccessTokenIntentRepository {
  private store = new Map<string, ResultReportCardAccessTokenIntent>();

  async create(input: CreateAccessTokenIntentInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessTokenIntent> {
    const record: ResultReportCardAccessTokenIntent = {
      ...input,
      tokenDescriptorJson: input.tokenDescriptorJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardAccessTokenIntentId: uuid(),
      tokenIntentStatus: 'draft' as ResultReportCardAccessTokenIntentStatus,
      createdAt: now(),
      updatedAt: now(),
      validatedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAccessTokenIntentId, record);
    return record;
  }

  async getById(accessTokenIntentId: string): Promise<ResultReportCardAccessTokenIntent | null> {
    return this.store.get(accessTokenIntentId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessTokenIntentPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessTokenIntentPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessGrantId === accessGrantId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessTokenIntentStatus | string): Promise<ResultReportCardAccessTokenIntentPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.tokenIntentStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(accessTokenIntentId: string, data: Partial<ResultReportCardAccessTokenIntent>): Promise<ResultReportCardAccessTokenIntent> {
    const r = this.store.get(accessTokenIntentId);
    if (!r) throw new Error(`ResultReportCardAccessTokenIntent not found: ${accessTokenIntentId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(accessTokenIntentId, updated);
    return updated;
  }

  async updateStatus(accessTokenIntentId: string, input: UpdateAccessTokenIntentStatusInput): Promise<ResultReportCardAccessTokenIntent> {
    const r = this.store.get(accessTokenIntentId);
    if (!r) throw new Error(`ResultReportCardAccessTokenIntent not found: ${accessTokenIntentId}`);
    const data: any = { tokenIntentStatus: input.status, updatedAt: now() };
    if (input.status === 'validated') data.validatedAt = now();
    if (input.status === 'blocked') data.blockedAt = now();
    if (input.status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(accessTokenIntentId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardAccessTokenIntent): ResultReportCardAccessTokenIntentPreview {
    return {
      resultReportCardAccessTokenIntentId: r.resultReportCardAccessTokenIntentId,
      schoolId: r.schoolId,
      resultReportCardAccessGrantId: r.resultReportCardAccessGrantId,
      tokenIntentStatus: r.tokenIntentStatus as string,
      tokenIntentMode: r.tokenIntentMode as string,
      safeTokenIntentSummary: r.safeTokenIntentSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardAccessAcknowledgementRepository implements ResultReportCardAccessAcknowledgementRepository {
  private store = new Map<string, ResultReportCardAccessAcknowledgement>();

  async create(input: CreateAccessAcknowledgementInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessAcknowledgement> {
    const record: ResultReportCardAccessAcknowledgement = {
      ...input,
      providerSimulationJson: input.providerSimulationJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardAccessAcknowledgementId: uuid(),
      acknowledgementStatus: 'created' as ResultReportCardAccessAcknowledgementStatus,
      createdAt: now(),
      updatedAt: now(),
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAccessAcknowledgementId, record);
    return record;
  }

  async getById(accessAcknowledgementId: string): Promise<ResultReportCardAccessAcknowledgement | null> {
    return this.store.get(accessAcknowledgementId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessGrantId === accessGrantId)
      .map(r => this.toPreview(r));
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessRecipientId === recipientId)
      .map(r => this.toPreview(r));
  }

  async listByPreviewId(previewId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardPortalPreviewId === previewId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessAcknowledgementStatus | string): Promise<ResultReportCardAccessAcknowledgementPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.acknowledgementStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(accessAcknowledgementId: string, data: Partial<ResultReportCardAccessAcknowledgement>): Promise<ResultReportCardAccessAcknowledgement> {
    const r = this.store.get(accessAcknowledgementId);
    if (!r) throw new Error(`ResultReportCardAccessAcknowledgement not found: ${accessAcknowledgementId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(accessAcknowledgementId, updated);
    return updated;
  }

  async updateStatus(accessAcknowledgementId: string, input: UpdateAccessAcknowledgementStatusInput): Promise<ResultReportCardAccessAcknowledgement> {
    const r = this.store.get(accessAcknowledgementId);
    if (!r) throw new Error(`ResultReportCardAccessAcknowledgement not found: ${accessAcknowledgementId}`);
    const data: any = { acknowledgementStatus: input.status, updatedAt: now() };
    if (input.status === 'recorded') data.updatedAt = now();
    if (input.status === 'blocked') data.blockedAt = now();
    if (input.status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(accessAcknowledgementId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardAccessAcknowledgement): ResultReportCardAccessAcknowledgementPreview {
    return {
      resultReportCardAccessAcknowledgementId: r.resultReportCardAccessAcknowledgementId,
      schoolId: r.schoolId,
      resultReportCardAccessGrantId: r.resultReportCardAccessGrantId,
      acknowledgementStatus: r.acknowledgementStatus as string,
      acknowledgementType: r.acknowledgementType as string,
      safeAcknowledgementSummary: r.safeAcknowledgementSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardAccessRevocationRepository implements ResultReportCardAccessRevocationRepository {
  private store = new Map<string, ResultReportCardAccessRevocation>();

  async create(input: CreateAccessRevocationInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessRevocation> {
    const record: ResultReportCardAccessRevocation = {
      ...input,
      resultReportCardAccessRecipientId: input.resultReportCardAccessRecipientId ?? null,
      resultReportCardPortalPreviewId: input.resultReportCardPortalPreviewId ?? null,
      resultReportCardAccessTokenIntentId: input.resultReportCardAccessTokenIntentId ?? null,
      resultReportCardAccessAcknowledgementId: input.resultReportCardAccessAcknowledgementId ?? null,
      reasonCodesJson: input.reasonCodesJson ?? null,
      resultReportCardAccessRevocationId: uuid(),
      revocationStatus: 'draft' as ResultReportCardAccessRevocationStatus,
      createdAt: now(),
      updatedAt: now(),
      appliedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAccessRevocationId, record);
    return record;
  }

  async getById(accessRevocationId: string): Promise<ResultReportCardAccessRevocation | null> {
    return this.store.get(accessRevocationId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessGrantId === accessGrantId)
      .map(r => this.toPreview(r));
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessRecipientId === recipientId)
      .map(r => this.toPreview(r));
  }

  async listByPreviewId(previewId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardPortalPreviewId === previewId)
      .map(r => this.toPreview(r));
  }

  async listByTokenIntentId(tokenIntentId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessTokenIntentId === tokenIntentId)
      .map(r => this.toPreview(r));
  }

  async listByAcknowledgementId(acknowledgementId: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessAcknowledgementId === acknowledgementId)
      .map(r => this.toPreview(r));
  }

  async listByScope(schoolId: string, scope: string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.revocationScope === scope)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessRevocationStatus | string): Promise<ResultReportCardAccessRevocationPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.revocationStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(accessRevocationId: string, data: Partial<ResultReportCardAccessRevocation>): Promise<ResultReportCardAccessRevocation> {
    const r = this.store.get(accessRevocationId);
    if (!r) throw new Error(`ResultReportCardAccessRevocation not found: ${accessRevocationId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(accessRevocationId, updated);
    return updated;
  }

  async updateStatus(accessRevocationId: string, input: UpdateAccessRevocationStatusInput): Promise<ResultReportCardAccessRevocation> {
    const r = this.store.get(accessRevocationId);
    if (!r) throw new Error(`ResultReportCardAccessRevocation not found: ${accessRevocationId}`);
    const data: any = { revocationStatus: input.status, updatedAt: now() };
    if (input.status === 'applied') data.appliedAt = now();
    if (input.status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(accessRevocationId, updated);
    return updated;
  }

  async apply(accessRevocationId: string): Promise<ResultReportCardAccessRevocation> {
    return this.updateStatus(accessRevocationId, { status: 'applied', reasonCode: 'applied', safeMessage: 'Revocation applied' });
  }

  async void(accessRevocationId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRevocation> {
    return this.updateStatus(accessRevocationId, { status: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultReportCardAccessRevocation): ResultReportCardAccessRevocationPreview {
    return {
      resultReportCardAccessRevocationId: r.resultReportCardAccessRevocationId,
      schoolId: r.schoolId,
      resultReportCardAccessGrantId: r.resultReportCardAccessGrantId,
      revocationStatus: r.revocationStatus as string,
      revocationScope: r.revocationScope as string,
      revocationReason: r.revocationReason,
      safeRevocationSummary: r.safeRevocationSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardAccessExpiryRepository implements ResultReportCardAccessExpiryRepository {
  private store = new Map<string, ResultReportCardAccessExpiry>();

  async create(input: CreateAccessExpiryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessExpiry> {
    const record: ResultReportCardAccessExpiry = {
      ...input,
      resultReportCardAccessRecipientId: input.resultReportCardAccessRecipientId ?? null,
      resultReportCardPortalPreviewId: input.resultReportCardPortalPreviewId ?? null,
      resultReportCardAccessTokenIntentId: input.resultReportCardAccessTokenIntentId ?? null,
      reasonCodesJson: input.reasonCodesJson ?? null,
      resultReportCardAccessExpiryId: uuid(),
      expiryStatus: 'draft' as ResultReportCardAccessExpiryStatus,
      createdAt: now(),
      updatedAt: now(),
      scheduledAt: null,
      appliedAt: null,
      cancelledAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAccessExpiryId, record);
    return record;
  }

  async getById(accessExpiryId: string): Promise<ResultReportCardAccessExpiry | null> {
    return this.store.get(accessExpiryId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessGrantId === accessGrantId)
      .map(r => this.toPreview(r));
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessRecipientId === recipientId)
      .map(r => this.toPreview(r));
  }

  async listByPreviewId(previewId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardPortalPreviewId === previewId)
      .map(r => this.toPreview(r));
  }

  async listByTokenIntentId(tokenIntentId: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessTokenIntentId === tokenIntentId)
      .map(r => this.toPreview(r));
  }

  async listByScope(schoolId: string, scope: string): Promise<ResultReportCardAccessExpiryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.expiryScope === scope)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessExpiryStatus | string): Promise<ResultReportCardAccessExpiryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.expiryStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(accessExpiryId: string, data: Partial<ResultReportCardAccessExpiry>): Promise<ResultReportCardAccessExpiry> {
    const r = this.store.get(accessExpiryId);
    if (!r) throw new Error(`ResultReportCardAccessExpiry not found: ${accessExpiryId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(accessExpiryId, updated);
    return updated;
  }

  async updateStatus(accessExpiryId: string, input: UpdateAccessExpiryStatusInput): Promise<ResultReportCardAccessExpiry> {
    const r = this.store.get(accessExpiryId);
    if (!r) throw new Error(`ResultReportCardAccessExpiry not found: ${accessExpiryId}`);
    const data: any = { expiryStatus: input.status, updatedAt: now() };
    if (input.status === 'scheduled') data.scheduledAt = now();
    if (input.status === 'applied') data.appliedAt = now();
    if (input.status === 'cancelled') data.cancelledAt = now();
    if (input.status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(accessExpiryId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardAccessExpiry): ResultReportCardAccessExpiryPreview {
    return {
      resultReportCardAccessExpiryId: r.resultReportCardAccessExpiryId,
      schoolId: r.schoolId,
      resultReportCardAccessGrantId: r.resultReportCardAccessGrantId,
      expiryStatus: r.expiryStatus as string,
      expiryScope: r.expiryScope as string,
      expiresAt: r.expiresAt,
      safeExpirySummary: r.safeExpirySummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardAccessTimelineRepository implements ResultReportCardAccessTimelineRepository {
  private store = new Map<string, ResultReportCardAccessTimeline>();

  async create(input: CreateAccessTimelineInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessTimeline> {
    const record: ResultReportCardAccessTimeline = {
      ...input,
      resultReportCardAccessRecipientId: input.resultReportCardAccessRecipientId ?? null,
      resultReportCardPortalPreviewId: input.resultReportCardPortalPreviewId ?? null,
      resultReportCardAccessTokenIntentId: input.resultReportCardAccessTokenIntentId ?? null,
      resultReportCardAccessAcknowledgementId: input.resultReportCardAccessAcknowledgementId ?? null,
      resultReportCardAccessRevocationId: input.resultReportCardAccessRevocationId ?? null,
      resultReportCardAccessExpiryId: input.resultReportCardAccessExpiryId ?? null,
      eventPayloadJson: input.eventPayloadJson ?? null,
      resultReportCardAccessTimelineId: uuid(),
      timelineStatus: 'recorded' as ResultReportCardAccessTimelineStatus,
      createdAt: now(),
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAccessTimelineId, record);
    return record;
  }

  async getById(accessTimelineId: string): Promise<ResultReportCardAccessTimeline | null> {
    return this.store.get(accessTimelineId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessGrantId === accessGrantId)
      .map(r => this.toPreview(r));
  }

  async listByRecipientId(recipientId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessRecipientId === recipientId)
      .map(r => this.toPreview(r));
  }

  async listByPreviewId(previewId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardPortalPreviewId === previewId)
      .map(r => this.toPreview(r));
  }

  async listByTokenIntentId(tokenIntentId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessTokenIntentId === tokenIntentId)
      .map(r => this.toPreview(r));
  }

  async listByAcknowledgementId(acknowledgementId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessAcknowledgementId === acknowledgementId)
      .map(r => this.toPreview(r));
  }

  async listByRevocationId(revocationId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessRevocationId === revocationId)
      .map(r => this.toPreview(r));
  }

  async listByExpiryId(expiryId: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAccessExpiryId === expiryId)
      .map(r => this.toPreview(r));
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.eventType === eventType)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardAccessTimelineStatus | string): Promise<ResultReportCardAccessTimelinePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.timelineStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(accessTimelineId: string, data: Partial<ResultReportCardAccessTimeline>): Promise<ResultReportCardAccessTimeline> {
    const r = this.store.get(accessTimelineId);
    if (!r) throw new Error(`ResultReportCardAccessTimeline not found: ${accessTimelineId}`);
    const updated = { ...r, ...data };
    this.store.set(accessTimelineId, updated);
    return updated;
  }

  async updateStatus(accessTimelineId: string, input: UpdateAccessTimelineStatusInput): Promise<ResultReportCardAccessTimeline> {
    const r = this.store.get(accessTimelineId);
    if (!r) throw new Error(`ResultReportCardAccessTimeline not found: ${accessTimelineId}`);
    const data: any = { timelineStatus: input.status };
    if (input.status === 'suppressed') data.updatedAt = now();
    if (input.status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(accessTimelineId, updated);
    return updated;
  }

  async suppress(accessTimelineId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTimeline> {
    return this.updateStatus(accessTimelineId, { status: 'suppressed', reasonCode, safeMessage });
  }

  async void(accessTimelineId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTimeline> {
    return this.updateStatus(accessTimelineId, { status: 'void', reasonCode, safeMessage });
  }

  private toPreview(r: ResultReportCardAccessTimeline): ResultReportCardAccessTimelinePreview {
    return {
      resultReportCardAccessTimelineId: r.resultReportCardAccessTimelineId,
      schoolId: r.schoolId,
      resultReportCardAccessGrantId: r.resultReportCardAccessGrantId,
      timelineStatus: r.timelineStatus as string,
      eventType: r.eventType,
      safeEventSummary: r.safeEventSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardAccessSummaryRepository implements ResultReportCardAccessSummaryRepository {
  private store = new Map<string, ResultReportCardAccessSummary>();

  async create(input: CreateAccessSummaryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessSummary> {
    const record: ResultReportCardAccessSummary = {
      ...input,
      studentRef: input.studentRef ?? null,
      resultReportCardAssemblyId: input.resultReportCardAssemblyId ?? null,
      resultReportCardExportJobId: input.resultReportCardExportJobId ?? null,
      audienceCountsJson: input.audienceCountsJson ?? null,
      statusCountsJson: input.statusCountsJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardAccessSummaryId: uuid(),
      summaryStatus: 'active',
      createdAt: now(),
      updatedAt: now(),
      refreshedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardAccessSummaryId, record);
    return record;
  }

  async getById(summaryId: string): Promise<ResultReportCardAccessSummary | null> {
    return this.store.get(summaryId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessSummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAccessSummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: string): Promise<ResultReportCardAccessSummaryPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.summaryStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(summaryId: string, data: Partial<ResultReportCardAccessSummary>): Promise<ResultReportCardAccessSummary> {
    const r = this.store.get(summaryId);
    if (!r) throw new Error(`ResultReportCardAccessSummary not found: ${summaryId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(summaryId, updated);
    return updated;
  }

  async updateStatus(summaryId: string, status: string): Promise<ResultReportCardAccessSummary> {
    const r = this.store.get(summaryId);
    if (!r) throw new Error(`ResultReportCardAccessSummary not found: ${summaryId}`);
    const data: any = { summaryStatus: status, updatedAt: now() };
    if (status === 'stale' || status === 'blocked' || status === 'void') data.updatedAt = now();
    const updated = { ...r, ...data };
    this.store.set(summaryId, updated);
    return updated;
  }

  async refresh(summaryId: string): Promise<ResultReportCardAccessSummary> {
    const r = this.store.get(summaryId);
    if (!r) throw new Error(`ResultReportCardAccessSummary not found: ${summaryId}`);
    const updated = { ...r, refreshedAt: now(), updatedAt: now() };
    this.store.set(summaryId, updated);
    return updated;
  }

  async void(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessSummary> {
    return this.updateStatus(summaryId, 'void');
  }

  private toPreview(r: ResultReportCardAccessSummary): ResultReportCardAccessSummaryPreview {
    return {
      resultReportCardAccessSummaryId: r.resultReportCardAccessSummaryId,
      schoolId: r.schoolId,
      summaryStatus: r.summaryStatus,
      summaryScope: r.summaryScope,
      safeSummary: r.safeSummary,
      refreshedAt: r.refreshedAt,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardAccessAuditRepository implements ResultReportCardAccessAuditRepository {
  private store = new Map<string, ResultReportCardAccessAuditEvent>();

  async create(event: ResultReportCardAccessAuditEvent): Promise<ResultReportCardAccessAuditEvent> {
    this.store.set(event.resultReportCardAccessAuditId, event);
    return event;
  }

  async getById(auditId: string): Promise<ResultReportCardAccessAuditEvent | null> {
    return this.store.get(auditId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardAccessAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.resultReportCardAccessGrantId === accessGrantId);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultReportCardAccessAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.eventType === eventType);
  }

  async listByActorId(actorId: string): Promise<ResultReportCardAccessAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.actorId === actorId);
  }
}

export class InMemoryResultReportCardAccessIdempotencyRepository implements ResultReportCardAccessIdempotencyRepository {
  private store = new Map<string, ResultReportCardAccessIdempotencyEntry>();

  private key(schoolId: string, operation: string, idempotencyKey: string): string {
    return `${schoolId}:${operation}:${idempotencyKey}`;
  }

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<ResultReportCardAccessIdempotencyEntry> {
    const record: ResultReportCardAccessIdempotencyEntry = {
      resultReportCardAccessIdempotencyId: uuid(),
      schoolId: input.schoolId,
      operation: input.operation,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
      status: input.status ?? 'in_progress',
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      safeResultSummary: input.safeResultSummary ?? null,
      createdAt: now(),
      updatedAt: now(),
      expiresAt: input.expiresAt ?? null,
    };
    this.store.set(this.key(record.schoolId, record.operation, record.idempotencyKey), record);
    this.store.set(record.resultReportCardAccessIdempotencyId, record);
    return record;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardAccessIdempotencyEntry | null> {
    return this.store.get(this.key(schoolId, operation, idempotencyKey)) ?? null;
  }

  async updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<ResultReportCardAccessIdempotencyEntry> {
    const r = this.store.get(idempotencyId);
    if (!r) throw new Error(`ResultReportCardAccessIdempotencyEntry not found: ${idempotencyId}`);
    const data: any = { status, updatedAt: now() };
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const updated = { ...r, ...data };
    this.store.set(idempotencyId, updated);
    this.store.set(this.key(r.schoolId, r.operation, r.idempotencyKey), updated);
    return updated;
  }

  async expire(idempotencyId: string): Promise<ResultReportCardAccessIdempotencyEntry> {
    return this.updateStatus(idempotencyId, 'expired');
  }
}
