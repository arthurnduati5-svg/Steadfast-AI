import type {
  ResultDeliveryJob, CreateDeliveryJobInput,
  ResultDeliveryRecipient, CreateRecipientInput,
  ResultDeliveryChannelEnvelope, CreateChannelEnvelopeInput,
  ResultDeliverySuppression, CreateSuppressionInput,
  ResultDeliveryAttempt, CreateMockAttemptInput,
  ResultDeliveryReceipt, CreateReceiptInput,
  ResultDeliveryRetryPlan, CreateRetryPlanInput,
  ResultDeliveryMockProvider, CreateMockProviderInput,
  ResultDeliveryAuditEvent,
  ResultDeliveryIdempotencyEntry,
} from '../contracts';
import type {
  ResultDeliveryJobRepository,
  ResultDeliveryRecipientRepository,
  ResultDeliveryChannelEnvelopeRepository,
  ResultDeliverySuppressionRepository,
  ResultDeliveryAttemptRepository,
  ResultDeliveryReceiptRepository,
  ResultDeliveryRetryPlanRepository,
  ResultDeliveryMockProviderRepository,
  ResultDeliveryAuditRepository,
  ResultDeliveryIdempotencyRepository,
} from '../contracts/resultDeliveryRepositoryContracts';

let counter = 0;
function uuid(): string { return `p12-${++counter}`; }
function now(): string { return new Date().toISOString(); }

export class InMemoryResultDeliveryJobRepository implements ResultDeliveryJobRepository {
  private store = new Map<string, ResultDeliveryJob>();

  async create(input: CreateDeliveryJobInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryJob> {
    const record: ResultDeliveryJob = {
      ...input,
      sourceRefsJson: input.sourceRefsJson ?? null,
      allowedFieldsJson: input.allowedFieldsJson ?? null,
      blockedFieldsJson: input.blockedFieldsJson ?? null,
      resultDeliveryJobId: uuid(),
      jobStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      validatedAt: null,
      queuedAt: null,
      completedAt: null,
      blockedAt: null,
      cancelledAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultDeliveryJobId, record);
    return record;
  }

  async getById(jobId: string): Promise<ResultDeliveryJob | null> { return this.store.get(jobId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultDeliveryJob[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultDeliveryJob[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByReleaseIntentId(schoolId: string, intentId: string): Promise<ResultDeliveryJob[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultReleaseDeliveryIntentId === intentId);
  }

  async listByReleasePacketId(schoolId: string, packetId: string): Promise<ResultDeliveryJob[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultReleasePacketId === packetId);
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultDeliveryJob[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.audienceType === audienceType);
  }

  async listByChannel(schoolId: string, channel: string): Promise<ResultDeliveryJob[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.deliveryChannel === channel);
  }

  async updateStatus(jobId: string, status: string): Promise<ResultDeliveryJob | null> {
    const r = this.store.get(jobId);
    if (!r) return null;
    const updated = { ...r, jobStatus: status as ResultDeliveryJob['jobStatus'], updatedAt: now() };
    this.store.set(jobId, updated);
    return updated;
  }

  async update(jobId: string, data: Partial<ResultDeliveryJob>): Promise<ResultDeliveryJob | null> {
    const r = this.store.get(jobId);
    if (!r) return null;
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(jobId, updated);
    return updated;
  }

  async block(jobId: string): Promise<ResultDeliveryJob | null> {
    const r = this.store.get(jobId);
    if (!r) return null;
    const updated = { ...r, jobStatus: 'blocked' as const, blockedAt: now(), updatedAt: now() };
    this.store.set(jobId, updated);
    return updated;
  }

  async cancel(jobId: string): Promise<ResultDeliveryJob | null> {
    const r = this.store.get(jobId);
    if (!r) return null;
    const updated = { ...r, jobStatus: 'cancelled' as const, cancelledAt: now(), updatedAt: now() };
    this.store.set(jobId, updated);
    return updated;
  }

  async void(jobId: string): Promise<ResultDeliveryJob | null> {
    const r = this.store.get(jobId);
    if (!r) return null;
    const updated = { ...r, jobStatus: 'void' as const, voidedAt: now(), updatedAt: now() };
    this.store.set(jobId, updated);
    return updated;
  }
}

export class InMemoryResultDeliveryRecipientRepository implements ResultDeliveryRecipientRepository {
  private store = new Map<string, ResultDeliveryRecipient>();

  async create(input: CreateRecipientInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryRecipient> {
    const record: ResultDeliveryRecipient = {
      ...input,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultDeliveryRecipientId: uuid(),
      recipientStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      verifiedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultDeliveryRecipientId, record);
    return record;
  }

  async getById(recipientId: string): Promise<ResultDeliveryRecipient | null> { return this.store.get(recipientId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultDeliveryRecipient[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultDeliveryRecipient[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryRecipient[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultDeliveryJobId === jobId);
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultDeliveryRecipient[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.audienceType === audienceType);
  }

  async updateStatus(recipientId: string, status: string): Promise<ResultDeliveryRecipient | null> {
    const r = this.store.get(recipientId);
    if (!r) return null;
    const updated = { ...r, recipientStatus: status as ResultDeliveryRecipient['recipientStatus'], updatedAt: now() };
    this.store.set(recipientId, updated);
    return updated;
  }

  async update(recipientId: string, data: Partial<ResultDeliveryRecipient>): Promise<ResultDeliveryRecipient | null> {
    const r = this.store.get(recipientId);
    if (!r) return null;
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(recipientId, updated);
    return updated;
  }

  async verify(recipientId: string): Promise<ResultDeliveryRecipient | null> {
    const r = this.store.get(recipientId);
    if (!r) return null;
    const updated = { ...r, recipientStatus: 'verified' as const, verifiedAt: now(), updatedAt: now() };
    this.store.set(recipientId, updated);
    return updated;
  }

  async block(recipientId: string): Promise<ResultDeliveryRecipient | null> {
    const r = this.store.get(recipientId);
    if (!r) return null;
    const updated = { ...r, recipientStatus: 'blocked' as const, blockedAt: now(), updatedAt: now() };
    this.store.set(recipientId, updated);
    return updated;
  }

  async void(recipientId: string): Promise<ResultDeliveryRecipient | null> {
    const r = this.store.get(recipientId);
    if (!r) return null;
    const updated = { ...r, recipientStatus: 'void' as const, voidedAt: now(), updatedAt: now() };
    this.store.set(recipientId, updated);
    return updated;
  }
}

export class InMemoryResultDeliveryChannelEnvelopeRepository implements ResultDeliveryChannelEnvelopeRepository {
  private store = new Map<string, ResultDeliveryChannelEnvelope>();

  async create(input: CreateChannelEnvelopeInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryChannelEnvelope> {
    const record: ResultDeliveryChannelEnvelope = {
      ...input,
      safeBodyJson: input.safeBodyJson ?? null,
      allowedFieldNamesJson: input.allowedFieldNamesJson ?? null,
      blockedFieldNamesJson: input.blockedFieldNamesJson ?? null,
      redactionRulesJson: input.redactionRulesJson ?? null,
      sourceRefsJson: input.sourceRefsJson ?? null,
      resultDeliveryChannelEnvelopeId: uuid(),
      envelopeStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      sealedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultDeliveryChannelEnvelopeId, record);
    return record;
  }

  async getById(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null> { return this.store.get(envelopeId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultDeliveryChannelEnvelope[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryChannelEnvelope[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultDeliveryJobId === jobId);
  }

  async updateStatus(envelopeId: string, status: string): Promise<ResultDeliveryChannelEnvelope | null> {
    const r = this.store.get(envelopeId);
    if (!r) return null;
    const updated = { ...r, envelopeStatus: status as ResultDeliveryChannelEnvelope['envelopeStatus'], updatedAt: now() };
    this.store.set(envelopeId, updated);
    return updated;
  }

  async update(envelopeId: string, data: Partial<ResultDeliveryChannelEnvelope>): Promise<ResultDeliveryChannelEnvelope | null> {
    const r = this.store.get(envelopeId);
    if (!r) return null;
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(envelopeId, updated);
    return updated;
  }

  async seal(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null> {
    const r = this.store.get(envelopeId);
    if (!r) return null;
    const updated = { ...r, envelopeStatus: 'sealed' as const, sealedAt: now(), updatedAt: now() };
    this.store.set(envelopeId, updated);
    return updated;
  }

  async block(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null> {
    const r = this.store.get(envelopeId);
    if (!r) return null;
    const updated = { ...r, envelopeStatus: 'blocked' as const, blockedAt: now(), updatedAt: now() };
    this.store.set(envelopeId, updated);
    return updated;
  }

  async void(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null> {
    const r = this.store.get(envelopeId);
    if (!r) return null;
    const updated = { ...r, envelopeStatus: 'void' as const, voidedAt: now(), updatedAt: now() };
    this.store.set(envelopeId, updated);
    return updated;
  }
}

export class InMemoryResultDeliverySuppressionRepository implements ResultDeliverySuppressionRepository {
  private store = new Map<string, ResultDeliverySuppression>();

  async create(input: CreateSuppressionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliverySuppression> {
    const record: ResultDeliverySuppression = {
      ...input,
      resultDeliveryRecipientId: input.resultDeliveryRecipientId ?? null,
      resultDeliveryChannelEnvelopeId: input.resultDeliveryChannelEnvelopeId ?? null,
      sourceRefsJson: input.sourceRefsJson ?? null,
      resultDeliverySuppressionId: uuid(),
      suppressionStatus: 'active',
      createdAt: now(),
      updatedAt: now(),
      clearedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultDeliverySuppressionId, record);
    return record;
  }

  async getById(suppressionId: string): Promise<ResultDeliverySuppression | null> { return this.store.get(suppressionId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultDeliverySuppression[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliverySuppression[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultDeliveryJobId === jobId);
  }

  async updateStatus(suppressionId: string, status: string): Promise<ResultDeliverySuppression | null> {
    const r = this.store.get(suppressionId);
    if (!r) return null;
    const updated = { ...r, suppressionStatus: status as ResultDeliverySuppression['suppressionStatus'], updatedAt: now() };
    this.store.set(suppressionId, updated);
    return updated;
  }

  async clear(suppressionId: string): Promise<ResultDeliverySuppression | null> {
    const r = this.store.get(suppressionId);
    if (!r) return null;
    const updated = { ...r, suppressionStatus: 'cleared' as const, clearedAt: now(), updatedAt: now() };
    this.store.set(suppressionId, updated);
    return updated;
  }

  async void(suppressionId: string): Promise<ResultDeliverySuppression | null> {
    const r = this.store.get(suppressionId);
    if (!r) return null;
    const updated = { ...r, suppressionStatus: 'void' as const, voidedAt: now(), updatedAt: now() };
    this.store.set(suppressionId, updated);
    return updated;
  }
}

export class InMemoryResultDeliveryAttemptRepository implements ResultDeliveryAttemptRepository {
  private store = new Map<string, ResultDeliveryAttempt>();

  async create(input: CreateMockAttemptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryAttempt> {
    const record: ResultDeliveryAttempt = {
      ...input,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultDeliveryAttemptId: uuid(),
      attemptStatus: 'created',
      createdAt: now(),
      updatedAt: now(),
      startedAt: null,
      completedAt: null,
      failedAt: null,
      blockedAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultDeliveryAttemptId, record);
    return record;
  }

  async getById(attemptId: string): Promise<ResultDeliveryAttempt | null> { return this.store.get(attemptId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultDeliveryAttempt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryAttempt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultDeliveryJobId === jobId);
  }

  async updateStatus(attemptId: string, status: string): Promise<ResultDeliveryAttempt | null> {
    const r = this.store.get(attemptId);
    if (!r) return null;
    const updated = { ...r, attemptStatus: status as ResultDeliveryAttempt['attemptStatus'], updatedAt: now() };
    this.store.set(attemptId, updated);
    return updated;
  }

  async update(attemptId: string, data: Partial<ResultDeliveryAttempt>): Promise<ResultDeliveryAttempt | null> {
    const r = this.store.get(attemptId);
    if (!r) return null;
    const updated = { ...r, ...data, updatedAt: now() };
    this.store.set(attemptId, updated);
    return updated;
  }

  async dispatch(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const r = this.store.get(attemptId);
    if (!r) return null;
    const updated = { ...r, attemptStatus: 'mock_dispatched' as const, startedAt: now(), updatedAt: now() };
    this.store.set(attemptId, updated);
    return updated;
  }

  async complete(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const r = this.store.get(attemptId);
    if (!r) return null;
    const updated = { ...r, attemptStatus: 'completed_mock' as const, completedAt: now(), updatedAt: now() };
    this.store.set(attemptId, updated);
    return updated;
  }

  async fail(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const r = this.store.get(attemptId);
    if (!r) return null;
    const updated = { ...r, attemptStatus: 'mock_failed' as const, failedAt: now(), updatedAt: now() };
    this.store.set(attemptId, updated);
    return updated;
  }

  async blockLive(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const r = this.store.get(attemptId);
    if (!r) return null;
    const updated = { ...r, attemptStatus: 'blocked_live_channel' as const, blockedAt: now(), updatedAt: now() };
    this.store.set(attemptId, updated);
    return updated;
  }

  async cancel(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const r = this.store.get(attemptId);
    if (!r) return null;
    const updated = { ...r, attemptStatus: 'cancelled' as const, updatedAt: now() };
    this.store.set(attemptId, updated);
    return updated;
  }

  async void(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const r = this.store.get(attemptId);
    if (!r) return null;
    const updated = { ...r, attemptStatus: 'void' as const, voidedAt: now(), updatedAt: now() };
    this.store.set(attemptId, updated);
    return updated;
  }
}

export class InMemoryResultDeliveryReceiptRepository implements ResultDeliveryReceiptRepository {
  private store = new Map<string, ResultDeliveryReceipt>();

  async create(input: CreateReceiptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryReceipt> {
    const record: ResultDeliveryReceipt = {
      ...input,
      providerSimulationJson: input.providerSimulationJson ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultDeliveryReceiptId: uuid(),
      receiptStatus: 'created',
      createdAt: now(),
      updatedAt: now(),
      voidedAt: null,
    };
    this.store.set(record.resultDeliveryReceiptId, record);
    return record;
  }

  async getById(receiptId: string): Promise<ResultDeliveryReceipt | null> { return this.store.get(receiptId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultDeliveryReceipt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryReceipt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultDeliveryJobId === jobId);
  }

  async listByAttemptId(schoolId: string, attemptId: string): Promise<ResultDeliveryReceipt[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultDeliveryAttemptId === attemptId);
  }

  async updateStatus(receiptId: string, status: string): Promise<ResultDeliveryReceipt | null> {
    const r = this.store.get(receiptId);
    if (!r) return null;
    const updated = { ...r, receiptStatus: status as ResultDeliveryReceipt['receiptStatus'], updatedAt: now() };
    this.store.set(receiptId, updated);
    return updated;
  }

  async void(receiptId: string): Promise<ResultDeliveryReceipt | null> {
    const r = this.store.get(receiptId);
    if (!r) return null;
    const updated = { ...r, receiptStatus: 'void' as const, voidedAt: now(), updatedAt: now() };
    this.store.set(receiptId, updated);
    return updated;
  }
}

export class InMemoryResultDeliveryRetryPlanRepository implements ResultDeliveryRetryPlanRepository {
  private store = new Map<string, ResultDeliveryRetryPlan>();

  async create(input: CreateRetryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryRetryPlan> {
    const record: ResultDeliveryRetryPlan = {
      ...input,
      nextMockRetryAt: input.nextMockRetryAt ?? null,
      blockedReasonCodesJson: input.blockedReasonCodesJson ?? null,
      resultDeliveryRetryPlanId: uuid(),
      retryStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
      cancelledAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultDeliveryRetryPlanId, record);
    return record;
  }

  async getById(retryPlanId: string): Promise<ResultDeliveryRetryPlan | null> { return this.store.get(retryPlanId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultDeliveryRetryPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryRetryPlan[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultDeliveryJobId === jobId);
  }

  async updateStatus(retryPlanId: string, status: string): Promise<ResultDeliveryRetryPlan | null> {
    const r = this.store.get(retryPlanId);
    if (!r) return null;
    const updated = { ...r, retryStatus: status as ResultDeliveryRetryPlan['retryStatus'], updatedAt: now() };
    this.store.set(retryPlanId, updated);
    return updated;
  }

  async cancel(retryPlanId: string): Promise<ResultDeliveryRetryPlan | null> {
    const r = this.store.get(retryPlanId);
    if (!r) return null;
    const updated = { ...r, retryStatus: 'cancelled' as const, cancelledAt: now(), updatedAt: now() };
    this.store.set(retryPlanId, updated);
    return updated;
  }

  async void(retryPlanId: string): Promise<ResultDeliveryRetryPlan | null> {
    const r = this.store.get(retryPlanId);
    if (!r) return null;
    const updated = { ...r, retryStatus: 'void' as const, voidedAt: now(), updatedAt: now() };
    this.store.set(retryPlanId, updated);
    return updated;
  }
}

export class InMemoryResultDeliveryMockProviderRepository implements ResultDeliveryMockProviderRepository {
  private store = new Map<string, ResultDeliveryMockProvider>();

  async create(input: CreateMockProviderInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryMockProvider> {
    const record: ResultDeliveryMockProvider = {
      ...input,
      supportedChannelsJson: input.supportedChannelsJson ?? null,
      resultDeliveryMockProviderId: uuid(),
      providerStatus: 'active',
      createdAt: now(),
      updatedAt: now(),
      disabledAt: null,
      voidedAt: null,
    };
    this.store.set(record.resultDeliveryMockProviderId, record);
    return record;
  }

  async getById(providerId: string): Promise<ResultDeliveryMockProvider | null> { return this.store.get(providerId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultDeliveryMockProvider[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByChannel(schoolId: string, channel: string): Promise<ResultDeliveryMockProvider[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.supportedChannelsJson?.[channel]);
  }

  async updateStatus(providerId: string, status: string): Promise<ResultDeliveryMockProvider | null> {
    const r = this.store.get(providerId);
    if (!r) return null;
    const updated = { ...r, providerStatus: status as ResultDeliveryMockProvider['providerStatus'], updatedAt: now() };
    this.store.set(providerId, updated);
    return updated;
  }

  async disable(providerId: string): Promise<ResultDeliveryMockProvider | null> {
    const r = this.store.get(providerId);
    if (!r) return null;
    const updated = { ...r, providerStatus: 'disabled' as const, disabledAt: now(), updatedAt: now() };
    this.store.set(providerId, updated);
    return updated;
  }

  async void(providerId: string): Promise<ResultDeliveryMockProvider | null> {
    const r = this.store.get(providerId);
    if (!r) return null;
    const updated = { ...r, providerStatus: 'void' as const, voidedAt: now(), updatedAt: now() };
    this.store.set(providerId, updated);
    return updated;
  }
}

export class InMemoryResultDeliveryAuditRepository implements ResultDeliveryAuditRepository {
  private store = new Map<string, ResultDeliveryAuditEvent>();

  async create(event: Omit<ResultDeliveryAuditEvent, 'resultDeliveryAuditId'>): Promise<ResultDeliveryAuditEvent> {
    const record: ResultDeliveryAuditEvent = { ...event, resultDeliveryAuditId: uuid() };
    this.store.set(record.resultDeliveryAuditId, record);
    return record;
  }

  async getById(auditId: string): Promise<ResultDeliveryAuditEvent | null> { return this.store.get(auditId) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultDeliveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultDeliveryJobId === jobId);
  }

  async listByActorId(schoolId: string, actorId: string): Promise<ResultDeliveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.actorId === actorId);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultDeliveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.eventType === eventType);
  }
}

export class InMemoryResultDeliveryIdempotencyRepository implements ResultDeliveryIdempotencyRepository {
  private store = new Map<string, ResultDeliveryIdempotencyEntry>();

  private key(schoolId: string, operation: string, idempotencyKey: string): string {
    return `${schoolId}:${operation}:${idempotencyKey}`;
  }

  async create(entry: Omit<ResultDeliveryIdempotencyEntry, 'resultDeliveryIdempotencyId'>): Promise<ResultDeliveryIdempotencyEntry> {
    const record: ResultDeliveryIdempotencyEntry = {
      ...entry,
      resultDeliveryIdempotencyId: uuid(),
      createdAt: now(),
      updatedAt: now(),
    };
    this.store.set(this.key(entry.schoolId, entry.operation, entry.idempotencyKey), record);
    this.store.set(record.resultDeliveryIdempotencyId, record);
    return record;
  }

  async getById(idempotencyId: string): Promise<ResultDeliveryIdempotencyEntry | null> {
    return this.store.get(idempotencyId) ?? null;
  }

  async findByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultDeliveryIdempotencyEntry | null> {
    return this.store.get(this.key(schoolId, operation, idempotencyKey)) ?? null;
  }

  async updateStatus(idempotencyId: string, status: string, resourceId?: string, safeResultSummary?: string): Promise<ResultDeliveryIdempotencyEntry | null> {
    const r = this.store.get(idempotencyId);
    if (!r) return null;
    const updated = { ...r, status, resourceId: resourceId ?? r.resourceId, safeResultSummary: safeResultSummary ?? r.safeResultSummary, updatedAt: now() };
    this.store.set(idempotencyId, updated);
    return updated;
  }

  async expire(idempotencyId: string, expiresAt: string): Promise<ResultDeliveryIdempotencyEntry | null> {
    const r = this.store.get(idempotencyId);
    if (!r) return null;
    const updated = { ...r, status: 'expired', expiresAt, updatedAt: now() };
    this.store.set(idempotencyId, updated);
    return updated;
  }
}
