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

let counter = 0;
function uuid(): string { return `p14-${++counter}`; }
function now(): string { return new Date().toISOString(); }

export class InMemoryResultReportCardExportJobRepository implements ResultReportCardExportJobRepository {
  private store = new Map<string, ResultReportCardExportJob>();

  async create(input: CreateExportJobInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportJob> {
    const record: ResultReportCardExportJob = {
      ...input,
      resultDeliveryReceiptId: input.resultDeliveryReceiptId ?? null,
      sourceRefsJson: input.sourceRefsJson ?? null,
      allowedChannelsJson: input.allowedChannelsJson ?? null,
      blockedChannelsJson: input.blockedChannelsJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardExportJobId: uuid(),
      exportJobStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      validatedAt: null,
      queuedAt: null,
      completedAt: null,
      blockedAt: null,
      cancelledAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardExportJobId, record);
    return record;
  }

  async getById(exportJobId: string): Promise<ResultReportCardExportJob | null> {
    return this.store.get(exportJobId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportJobPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardExportJobPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.studentRef === studentRef)
      .map(r => this.toPreview(r));
  }

  async listByAssemblyId(assemblyId: string): Promise<ResultReportCardExportJobPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardAssemblyId === assemblyId)
      .map(r => this.toPreview(r));
  }

  async listByExportIntentId(exportIntentId: string): Promise<ResultReportCardExportJobPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportIntentId === exportIntentId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportJobStatus | string): Promise<ResultReportCardExportJobPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.exportJobStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(exportJobId: string, data: Partial<ResultReportCardExportJob>): Promise<ResultReportCardExportJob> {
    const r = this.store.get(exportJobId);
    if (!r) throw new Error(`ResultReportCardExportJob not found: ${exportJobId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(exportJobId, updated);
    return updated;
  }

  async updateStatus(exportJobId: string, input: UpdateExportJobStatusInput): Promise<ResultReportCardExportJob> {
    const r = this.store.get(exportJobId);
    if (!r) throw new Error(`ResultReportCardExportJob not found: ${exportJobId}`);
    const data: any = { exportJobStatus: input.status, updatedAt: now() };
    if (input.status === 'validated') data.validatedAt = now();
    if (input.status === 'queued_mock') data.queuedAt = now();
    if (input.status === 'mock_exported') data.completedAt = now();
    if (input.status === 'receipt_recorded') data.completedAt = now();
    if (input.status === 'archive_manifest_ready') data.completedAt = now();
    if (input.status === 'blocked') data.blockedAt = now();
    if (input.status === 'cancelled') data.cancelledAt = now();
    if (input.status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(exportJobId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardExportJob): ResultReportCardExportJobPreview {
    return {
      resultReportCardExportJobId: r.resultReportCardExportJobId,
      schoolId: r.schoolId,
      exportJobStatus: r.exportJobStatus,
      exportJobMode: r.exportJobMode,
      exportJobPurpose: r.exportJobPurpose,
      safeExportJobSummary: r.safeExportJobSummary,
      studentRef: r.studentRef,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    };
  }
}

export class InMemoryResultReportCardExportTargetRepository implements ResultReportCardExportTargetRepository {
  private store = new Map<string, ResultReportCardExportTarget>();

  async create(input: CreateExportTargetInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportTarget> {
    const record: ResultReportCardExportTarget = {
      ...input,
      targetDescriptorJson: input.targetDescriptorJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardExportTargetId: uuid(),
      targetStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      validatedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardExportTargetId, record);
    return record;
  }

  async getById(exportTargetId: string): Promise<ResultReportCardExportTarget | null> {
    return this.store.get(exportTargetId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportTargetPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportTargetPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportJobId === exportJobId)
      .map(r => this.toPreview(r));
  }

  async listByTargetType(schoolId: string, targetType: string): Promise<ResultReportCardExportTargetPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.targetType === targetType)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportTargetStatus | string): Promise<ResultReportCardExportTargetPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.targetStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(exportTargetId: string, data: Partial<ResultReportCardExportTarget>): Promise<ResultReportCardExportTarget> {
    const r = this.store.get(exportTargetId);
    if (!r) throw new Error(`ResultReportCardExportTarget not found: ${exportTargetId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(exportTargetId, updated);
    return updated;
  }

  async updateStatus(exportTargetId: string, status: ResultReportCardExportTargetStatus | string): Promise<ResultReportCardExportTarget> {
    const r = this.store.get(exportTargetId);
    if (!r) throw new Error(`ResultReportCardExportTarget not found: ${exportTargetId}`);
    const data: any = { targetStatus: status, updatedAt: now() };
    if (status === 'validated') data.validatedAt = now();
    if (status === 'blocked') data.blockedAt = now();
    if (status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(exportTargetId, updated);
    return updated;
  }

  async suppress(exportTargetId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportTarget> {
    const data: any = { targetStatus: 'suppressed', updatedAt: now() };
    const r = this.store.get(exportTargetId);
    if (!r) throw new Error(`ResultReportCardExportTarget not found: ${exportTargetId}`);
    const updated = { ...r, ...data };
    this.store.set(exportTargetId, updated);
    return updated;
  }

  async block(exportTargetId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportTarget> {
    return this.updateStatus(exportTargetId, 'blocked');
  }

  async void(exportTargetId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportTarget> {
    return this.updateStatus(exportTargetId, 'void');
  }

  private toPreview(r: ResultReportCardExportTarget): ResultReportCardExportTargetPreview {
    return {
      resultReportCardExportTargetId: r.resultReportCardExportTargetId,
      schoolId: r.schoolId,
      resultReportCardExportJobId: r.resultReportCardExportJobId,
      targetType: r.targetType,
      targetStatus: r.targetStatus,
      safeTargetSummary: r.safeTargetSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardExportEnvelopeRepository implements ResultReportCardExportEnvelopeRepository {
  private store = new Map<string, ResultReportCardExportEnvelope>();

  async create(input: CreateExportEnvelopeInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportEnvelope> {
    const record: ResultReportCardExportEnvelope = {
      ...input,
      safePayloadJson: input.safePayloadJson ?? null,
      redactionRulesJson: input.redactionRulesJson ?? null,
      allowedFieldNamesJson: input.allowedFieldNamesJson ?? null,
      blockedFieldNamesJson: input.blockedFieldNamesJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardExportEnvelopeId: uuid(),
      envelopeStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      sealedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardExportEnvelopeId, record);
    return record;
  }

  async getById(exportEnvelopeId: string): Promise<ResultReportCardExportEnvelope | null> {
    return this.store.get(exportEnvelopeId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportEnvelopePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportEnvelopePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportJobId === exportJobId)
      .map(r => this.toPreview(r));
  }

  async listByTargetId(targetId: string): Promise<ResultReportCardExportEnvelopePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportTargetId === targetId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportEnvelopeStatus | string): Promise<ResultReportCardExportEnvelopePreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.envelopeStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(exportEnvelopeId: string, data: Partial<ResultReportCardExportEnvelope>): Promise<ResultReportCardExportEnvelope> {
    const r = this.store.get(exportEnvelopeId);
    if (!r) throw new Error(`ResultReportCardExportEnvelope not found: ${exportEnvelopeId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(exportEnvelopeId, updated);
    return updated;
  }

  async updateStatus(exportEnvelopeId: string, status: ResultReportCardExportEnvelopeStatus | string): Promise<ResultReportCardExportEnvelope> {
    const r = this.store.get(exportEnvelopeId);
    if (!r) throw new Error(`ResultReportCardExportEnvelope not found: ${exportEnvelopeId}`);
    const data: any = { envelopeStatus: status, updatedAt: now() };
    if (status === 'sealed') data.sealedAt = now();
    if (status === 'blocked') data.blockedAt = now();
    if (status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(exportEnvelopeId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardExportEnvelope): ResultReportCardExportEnvelopePreview {
    return {
      resultReportCardExportEnvelopeId: r.resultReportCardExportEnvelopeId,
      schoolId: r.schoolId,
      resultReportCardExportJobId: r.resultReportCardExportJobId,
      resultReportCardExportTargetId: r.resultReportCardExportTargetId,
      envelopeStatus: r.envelopeStatus,
      envelopeMode: r.envelopeMode,
      safeEnvelopeSummary: r.safeEnvelopeSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardMockExportAttemptRepository implements ResultReportCardMockExportAttemptRepository {
  private store = new Map<string, ResultReportCardMockExportAttempt>();

  async create(input: CreateMockExportAttemptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardMockExportAttempt> {
    const record: ResultReportCardMockExportAttempt = {
      ...input,
      attemptNumber: input.attemptNumber ?? 1,
      providerSimulationJson: input.providerSimulationJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardMockExportAttemptId: uuid(),
      attemptStatus: 'created',
      createdAt: now(),
      updatedAt: now(),
      startedAt: null,
      completedAt: null,
      failedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardMockExportAttemptId, record);
    return record;
  }

  async getById(mockExportAttemptId: string): Promise<ResultReportCardMockExportAttempt | null> {
    return this.store.get(mockExportAttemptId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardMockExportAttemptPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardMockExportAttemptPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportJobId === exportJobId)
      .map(r => this.toPreview(r));
  }

  async listByTargetId(targetId: string): Promise<ResultReportCardMockExportAttemptPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportTargetId === targetId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardMockExportAttemptStatus | string): Promise<ResultReportCardMockExportAttemptPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.attemptStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(mockExportAttemptId: string, data: Partial<ResultReportCardMockExportAttempt>): Promise<ResultReportCardMockExportAttempt> {
    const r = this.store.get(mockExportAttemptId);
    if (!r) throw new Error(`ResultReportCardMockExportAttempt not found: ${mockExportAttemptId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(mockExportAttemptId, updated);
    return updated;
  }

  async updateStatus(mockExportAttemptId: string, status: ResultReportCardMockExportAttemptStatus | string): Promise<ResultReportCardMockExportAttempt> {
    const r = this.store.get(mockExportAttemptId);
    if (!r) throw new Error(`ResultReportCardMockExportAttempt not found: ${mockExportAttemptId}`);
    const data: any = { attemptStatus: status, updatedAt: now() };
    if (status === 'started') data.startedAt = now();
    if (status === 'completed') data.completedAt = now();
    if (status === 'failed') data.failedAt = now();
    if (status === 'blocked') data.blockedAt = now();
    if (status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(mockExportAttemptId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardMockExportAttempt): ResultReportCardMockExportAttemptPreview {
    return {
      resultReportCardMockExportAttemptId: r.resultReportCardMockExportAttemptId,
      schoolId: r.schoolId,
      resultReportCardExportJobId: r.resultReportCardExportJobId,
      attemptStatus: r.attemptStatus,
      attemptMode: r.attemptMode,
      mockProviderName: r.mockProviderName,
      attemptNumber: r.attemptNumber,
      safeAttemptSummary: r.safeAttemptSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardExportReceiptRepository implements ResultReportCardExportReceiptRepository {
  private store = new Map<string, ResultReportCardExportReceipt>();

  async create(input: CreateExportReceiptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportReceipt> {
    const record: ResultReportCardExportReceipt = {
      ...input,
      providerSimulationJson: input.providerSimulationJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardExportReceiptId: uuid(),
      receiptStatus: 'created',
      createdAt: now(),
      updatedAt: now(),
      voidedAt: null,
    };
    this.store.set(record.resultReportCardExportReceiptId, record);
    return record;
  }

  async getById(exportReceiptId: string): Promise<ResultReportCardExportReceipt | null> {
    return this.store.get(exportReceiptId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportReceiptPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportReceiptPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportJobId === exportJobId)
      .map(r => this.toPreview(r));
  }

  async listByTargetId(targetId: string): Promise<ResultReportCardExportReceiptPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportTargetId === targetId)
      .map(r => this.toPreview(r));
  }

  async listByAttemptId(attemptId: string): Promise<ResultReportCardExportReceiptPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardMockExportAttemptId === attemptId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportReceiptStatus | string): Promise<ResultReportCardExportReceiptPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.receiptStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(exportReceiptId: string, data: Partial<ResultReportCardExportReceipt>): Promise<ResultReportCardExportReceipt> {
    const r = this.store.get(exportReceiptId);
    if (!r) throw new Error(`ResultReportCardExportReceipt not found: ${exportReceiptId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(exportReceiptId, updated);
    return updated;
  }

  async updateStatus(exportReceiptId: string, status: ResultReportCardExportReceiptStatus | string): Promise<ResultReportCardExportReceipt> {
    const r = this.store.get(exportReceiptId);
    if (!r) throw new Error(`ResultReportCardExportReceipt not found: ${exportReceiptId}`);
    const data: any = { receiptStatus: status, updatedAt: now() };
    if (status === 'recorded') data.updatedAt = now();
    if (status === 'blocked') data.updatedAt = now();
    if (status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(exportReceiptId, updated);
    return updated;
  }

  async block(exportReceiptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportReceipt> {
    return this.updateStatus(exportReceiptId, 'blocked');
  }

  async void(exportReceiptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportReceipt> {
    return this.updateStatus(exportReceiptId, 'void');
  }

  private toPreview(r: ResultReportCardExportReceipt): ResultReportCardExportReceiptPreview {
    return {
      resultReportCardExportReceiptId: r.resultReportCardExportReceiptId,
      schoolId: r.schoolId,
      resultReportCardExportJobId: r.resultReportCardExportJobId,
      receiptStatus: r.receiptStatus,
      receiptType: r.receiptType,
      safeReceiptSummary: r.safeReceiptSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardExportSuppressionRepository implements ResultReportCardExportSuppressionRepository {
  private store = new Map<string, ResultReportCardExportSuppression>();

  async create(input: CreateExportSuppressionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportSuppression> {
    const record: ResultReportCardExportSuppression = {
      ...input,
      resultReportCardExportTargetId: input.resultReportCardExportTargetId ?? null,
      resultReportCardExportEnvelopeId: input.resultReportCardExportEnvelopeId ?? null,
      reasonCodesJson: input.reasonCodesJson ?? null,
      resultReportCardExportSuppressionId: uuid(),
      suppressionStatus: 'active',
      createdAt: now(),
      updatedAt: now(),
      liftedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardExportSuppressionId, record);
    return record;
  }

  async getById(exportSuppressionId: string): Promise<ResultReportCardExportSuppression | null> {
    return this.store.get(exportSuppressionId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportSuppressionPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportSuppressionPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportJobId === exportJobId)
      .map(r => this.toPreview(r));
  }

  async listByTargetId(targetId: string): Promise<ResultReportCardExportSuppressionPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportTargetId === targetId)
      .map(r => this.toPreview(r));
  }

  async listByEnvelopeId(envelopeId: string): Promise<ResultReportCardExportSuppressionPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportEnvelopeId === envelopeId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportSuppressionStatus | string): Promise<ResultReportCardExportSuppressionPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.suppressionStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(exportSuppressionId: string, data: Partial<ResultReportCardExportSuppression>): Promise<ResultReportCardExportSuppression> {
    const r = this.store.get(exportSuppressionId);
    if (!r) throw new Error(`ResultReportCardExportSuppression not found: ${exportSuppressionId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(exportSuppressionId, updated);
    return updated;
  }

  async updateStatus(exportSuppressionId: string, status: ResultReportCardExportSuppressionStatus | string): Promise<ResultReportCardExportSuppression> {
    const r = this.store.get(exportSuppressionId);
    if (!r) throw new Error(`ResultReportCardExportSuppression not found: ${exportSuppressionId}`);
    const data: any = { suppressionStatus: status, updatedAt: now() };
    if (status === 'lifted') data.liftedAt = now();
    if (status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(exportSuppressionId, updated);
    return updated;
  }

  async lift(exportSuppressionId: string): Promise<ResultReportCardExportSuppression> {
    return this.updateStatus(exportSuppressionId, 'lifted');
  }

  async void(exportSuppressionId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportSuppression> {
    return this.updateStatus(exportSuppressionId, 'void');
  }

  private toPreview(r: ResultReportCardExportSuppression): ResultReportCardExportSuppressionPreview {
    return {
      resultReportCardExportSuppressionId: r.resultReportCardExportSuppressionId,
      schoolId: r.schoolId,
      resultReportCardExportJobId: r.resultReportCardExportJobId,
      suppressionStatus: r.suppressionStatus,
      suppressionReason: r.suppressionReason,
      suppressionScope: r.suppressionScope,
      safeSuppressionSummary: r.safeSuppressionSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardExportRetryPlanRepository implements ResultReportCardExportRetryPlanRepository {
  private store = new Map<string, ResultReportCardExportRetryPlan>();

  async create(input: CreateExportRetryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportRetryPlan> {
    const record: ResultReportCardExportRetryPlan = {
      ...input,
      retryPolicy: input.retryPolicy ?? 'default',
      nextMockRetryAt: input.nextMockRetryAt ?? null,
      maxMockAttempts: input.maxMockAttempts ?? 3,
      attemptsUsed: input.attemptsUsed ?? 0,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardExportRetryPlanId: uuid(),
      retryStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      cancelledAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardExportRetryPlanId, record);
    return record;
  }

  async getById(exportRetryPlanId: string): Promise<ResultReportCardExportRetryPlan | null> {
    return this.store.get(exportRetryPlanId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportRetryPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportRetryPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportJobId === exportJobId)
      .map(r => this.toPreview(r));
  }

  async listByAttemptId(attemptId: string): Promise<ResultReportCardExportRetryPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardMockExportAttemptId === attemptId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardExportRetryPlanStatus | string): Promise<ResultReportCardExportRetryPlanPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.retryStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(exportRetryPlanId: string, data: Partial<ResultReportCardExportRetryPlan>): Promise<ResultReportCardExportRetryPlan> {
    const r = this.store.get(exportRetryPlanId);
    if (!r) throw new Error(`ResultReportCardExportRetryPlan not found: ${exportRetryPlanId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(exportRetryPlanId, updated);
    return updated;
  }

  async updateStatus(exportRetryPlanId: string, status: ResultReportCardExportRetryPlanStatus | string): Promise<ResultReportCardExportRetryPlan> {
    const r = this.store.get(exportRetryPlanId);
    if (!r) throw new Error(`ResultReportCardExportRetryPlan not found: ${exportRetryPlanId}`);
    const data: any = { retryStatus: status, updatedAt: now() };
    if (status === 'cancelled') data.cancelledAt = now();
    if (status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(exportRetryPlanId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardExportRetryPlan): ResultReportCardExportRetryPlanPreview {
    return {
      resultReportCardExportRetryPlanId: r.resultReportCardExportRetryPlanId,
      schoolId: r.schoolId,
      resultReportCardExportJobId: r.resultReportCardExportJobId,
      retryStatus: r.retryStatus,
      retryPolicy: r.retryPolicy,
      maxMockAttempts: r.maxMockAttempts,
      attemptsUsed: r.attemptsUsed,
      safeRetrySummary: r.safeRetrySummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardArchiveManifestRepository implements ResultReportCardArchiveManifestRepository {
  private store = new Map<string, ResultReportCardArchiveManifest>();

  async create(input: CreateArchiveManifestInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardArchiveManifest> {
    const record: ResultReportCardArchiveManifest = {
      ...input,
      resultReportCardExportEnvelopeId: input.resultReportCardExportEnvelopeId ?? null,
      resultReportCardExportReceiptId: input.resultReportCardExportReceiptId ?? null,
      archiveMetadataJson: input.archiveMetadataJson ?? null,
      retentionPolicyJson: input.retentionPolicyJson ?? null,
      allowedFieldNamesJson: input.allowedFieldNamesJson ?? null,
      blockedFieldNamesJson: input.blockedFieldNamesJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultReportCardArchiveManifestId: uuid(),
      manifestStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      sealedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultReportCardArchiveManifestId, record);
    return record;
  }

  async getById(archiveManifestId: string): Promise<ResultReportCardArchiveManifest | null> {
    return this.store.get(archiveManifestId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardArchiveManifestPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId)
      .map(r => this.toPreview(r));
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardArchiveManifestPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.resultReportCardExportJobId === exportJobId)
      .map(r => this.toPreview(r));
  }

  async listByStatus(schoolId: string, status: ResultReportCardArchiveManifestStatus | string): Promise<ResultReportCardArchiveManifestPreview[]> {
    return Array.from(this.store.values())
      .filter(r => r.schoolId === schoolId && r.manifestStatus === status)
      .map(r => this.toPreview(r));
  }

  async update(archiveManifestId: string, data: Partial<ResultReportCardArchiveManifest>): Promise<ResultReportCardArchiveManifest> {
    const r = this.store.get(archiveManifestId);
    if (!r) throw new Error(`ResultReportCardArchiveManifest not found: ${archiveManifestId}`);
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(archiveManifestId, updated);
    return updated;
  }

  async updateStatus(archiveManifestId: string, status: ResultReportCardArchiveManifestStatus | string): Promise<ResultReportCardArchiveManifest> {
    const r = this.store.get(archiveManifestId);
    if (!r) throw new Error(`ResultReportCardArchiveManifest not found: ${archiveManifestId}`);
    const data: any = { manifestStatus: status, updatedAt: now() };
    if (status === 'sealed') data.sealedAt = now();
    if (status === 'blocked') data.blockedAt = now();
    if (status === 'void') data.voidedAt = now();
    const updated = { ...r, ...data };
    this.store.set(archiveManifestId, updated);
    return updated;
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

  private toPreview(r: ResultReportCardArchiveManifest): ResultReportCardArchiveManifestPreview {
    return {
      resultReportCardArchiveManifestId: r.resultReportCardArchiveManifestId,
      schoolId: r.schoolId,
      resultReportCardExportJobId: r.resultReportCardExportJobId,
      manifestStatus: r.manifestStatus,
      manifestMode: r.manifestMode,
      safeArchiveSummary: r.safeArchiveSummary,
      createdAt: r.createdAt,
    };
  }
}

export class InMemoryResultReportCardExportAuditRepository implements ResultReportCardExportAuditRepository {
  private store = new Map<string, ResultReportCardExportAuditEvent>();

  async create(event: ResultReportCardExportAuditEvent): Promise<ResultReportCardExportAuditEvent> {
    this.store.set(event.resultReportCardExportAuditId, event);
    return event;
  }

  async getById(auditId: string): Promise<ResultReportCardExportAuditEvent | null> {
    return this.store.get(auditId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ResultReportCardExportAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByExportJobId(exportJobId: string): Promise<ResultReportCardExportAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.resultReportCardExportJobId === exportJobId);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultReportCardExportAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.eventType === eventType);
  }

  async listByActorId(actorId: string): Promise<ResultReportCardExportAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.actorId === actorId);
  }
}

export class InMemoryResultReportCardExportIdempotencyRepository implements ResultReportCardExportIdempotencyRepository {
  private store = new Map<string, ResultReportCardExportIdempotencyEntry>();

  private key(schoolId: string, operation: string, idempotencyKey: string): string {
    return `${schoolId}:${operation}:${idempotencyKey}`;
  }

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<ResultReportCardExportIdempotencyEntry> {
    const record: ResultReportCardExportIdempotencyEntry = {
      resultReportCardExportIdempotencyId: uuid(),
      schoolId: input.schoolId,
      operation: input.operation,
      idempotencyKey: input.idempotencyKey,
      requestHash: input.requestHash,
      status: input.status ?? 'pending',
      resourceType: input.resourceType ?? null,
      resourceId: input.resourceId ?? null,
      safeResultSummary: input.safeResultSummary ?? null,
      createdAt: now(),
      updatedAt: now(),
      expiresAt: input.expiresAt ?? null,
    };
    this.store.set(this.key(record.schoolId, record.operation, record.idempotencyKey), record);
    this.store.set(record.resultReportCardExportIdempotencyId, record);
    return record;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardExportIdempotencyEntry | null> {
    return this.store.get(this.key(schoolId, operation, idempotencyKey)) ?? null;
  }

  async updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<ResultReportCardExportIdempotencyEntry> {
    const r = this.store.get(idempotencyId);
    if (!r) throw new Error(`ResultReportCardExportIdempotencyEntry not found: ${idempotencyId}`);
    const data: any = { status, updatedAt: now() };
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const updated = { ...r, ...data };
    this.store.set(idempotencyId, updated);
    this.store.set(this.key(r.schoolId, r.operation, r.idempotencyKey), updated);
    return updated;
  }

  async expire(idempotencyId: string): Promise<ResultReportCardExportIdempotencyEntry> {
    return this.updateStatus(idempotencyId, 'expired');
  }
}
