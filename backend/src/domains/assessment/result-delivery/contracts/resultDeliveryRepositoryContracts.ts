import type {
  ResultDeliveryJob, CreateDeliveryJobInput, ResultDeliveryJobPreview,
} from './resultDeliveryJobContracts';
import type {
  ResultDeliveryRecipient, CreateRecipientInput,
} from './resultDeliveryRecipientContracts';
import type {
  ResultDeliveryChannelEnvelope, CreateChannelEnvelopeInput,
} from './resultDeliveryEnvelopeContracts';
import type {
  ResultDeliveryAttempt, CreateMockAttemptInput, ResultDeliveryAttemptPreview,
} from './resultDeliveryAttemptContracts';
import type {
  ResultDeliveryReceipt, CreateReceiptInput, ResultDeliveryReceiptPreview,
} from './resultDeliveryReceiptContracts';
import type {
  ResultDeliverySuppression, CreateSuppressionInput,
} from './resultDeliverySuppressionContracts';
import type {
  ResultDeliveryRetryPlan, CreateRetryPlanInput,
} from './resultDeliveryRetryPlanContracts';
import type {
  ResultDeliveryMockProvider, CreateMockProviderInput,
} from './resultDeliveryMockProviderContracts';
import type { ResultDeliveryAuditEvent } from './resultDeliveryAuditContracts';
import type { ResultDeliveryIdempotencyEntry } from './resultDeliveryIdempotencyContracts';

export interface ResultDeliveryJobRepository {
  create(input: CreateDeliveryJobInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryJob>;
  getById(jobId: string): Promise<ResultDeliveryJob | null>;
  listBySchool(schoolId: string): Promise<ResultDeliveryJob[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultDeliveryJob[]>;
  listByReleaseIntentId(schoolId: string, intentId: string): Promise<ResultDeliveryJob[]>;
  listByReleasePacketId(schoolId: string, packetId: string): Promise<ResultDeliveryJob[]>;
  listByAudienceType(schoolId: string, audienceType: string): Promise<ResultDeliveryJob[]>;
  listByChannel(schoolId: string, channel: string): Promise<ResultDeliveryJob[]>;
  updateStatus(jobId: string, status: string): Promise<ResultDeliveryJob | null>;
  update(jobId: string, data: Partial<ResultDeliveryJob>): Promise<ResultDeliveryJob | null>;
  block(jobId: string): Promise<ResultDeliveryJob | null>;
  cancel(jobId: string): Promise<ResultDeliveryJob | null>;
  void(jobId: string): Promise<ResultDeliveryJob | null>;
}

export interface ResultDeliveryRecipientRepository {
  create(input: CreateRecipientInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryRecipient>;
  getById(recipientId: string): Promise<ResultDeliveryRecipient | null>;
  listBySchool(schoolId: string): Promise<ResultDeliveryRecipient[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultDeliveryRecipient[]>;
  listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryRecipient[]>;
  listByAudienceType(schoolId: string, audienceType: string): Promise<ResultDeliveryRecipient[]>;
  updateStatus(recipientId: string, status: string): Promise<ResultDeliveryRecipient | null>;
  update(recipientId: string, data: Partial<ResultDeliveryRecipient>): Promise<ResultDeliveryRecipient | null>;
  verify(recipientId: string): Promise<ResultDeliveryRecipient | null>;
  block(recipientId: string): Promise<ResultDeliveryRecipient | null>;
  void(recipientId: string): Promise<ResultDeliveryRecipient | null>;
}

export interface ResultDeliveryChannelEnvelopeRepository {
  create(input: CreateChannelEnvelopeInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryChannelEnvelope>;
  getById(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null>;
  listBySchool(schoolId: string): Promise<ResultDeliveryChannelEnvelope[]>;
  listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryChannelEnvelope[]>;
  updateStatus(envelopeId: string, status: string): Promise<ResultDeliveryChannelEnvelope | null>;
  update(envelopeId: string, data: Partial<ResultDeliveryChannelEnvelope>): Promise<ResultDeliveryChannelEnvelope | null>;
  seal(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null>;
  block(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null>;
  void(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null>;
}

export interface ResultDeliverySuppressionRepository {
  create(input: CreateSuppressionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliverySuppression>;
  getById(suppressionId: string): Promise<ResultDeliverySuppression | null>;
  listBySchool(schoolId: string): Promise<ResultDeliverySuppression[]>;
  listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliverySuppression[]>;
  updateStatus(suppressionId: string, status: string): Promise<ResultDeliverySuppression | null>;
  clear(suppressionId: string): Promise<ResultDeliverySuppression | null>;
  void(suppressionId: string): Promise<ResultDeliverySuppression | null>;
}

export interface ResultDeliveryAttemptRepository {
  create(input: CreateMockAttemptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryAttempt>;
  getById(attemptId: string): Promise<ResultDeliveryAttempt | null>;
  listBySchool(schoolId: string): Promise<ResultDeliveryAttempt[]>;
  listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryAttempt[]>;
  updateStatus(attemptId: string, status: string): Promise<ResultDeliveryAttempt | null>;
  update(attemptId: string, data: Partial<ResultDeliveryAttempt>): Promise<ResultDeliveryAttempt | null>;
  dispatch(attemptId: string): Promise<ResultDeliveryAttempt | null>;
  complete(attemptId: string): Promise<ResultDeliveryAttempt | null>;
  fail(attemptId: string): Promise<ResultDeliveryAttempt | null>;
  blockLive(attemptId: string): Promise<ResultDeliveryAttempt | null>;
  cancel(attemptId: string): Promise<ResultDeliveryAttempt | null>;
  void(attemptId: string): Promise<ResultDeliveryAttempt | null>;
}

export interface ResultDeliveryReceiptRepository {
  create(input: CreateReceiptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryReceipt>;
  getById(receiptId: string): Promise<ResultDeliveryReceipt | null>;
  listBySchool(schoolId: string): Promise<ResultDeliveryReceipt[]>;
  listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryReceipt[]>;
  listByAttemptId(schoolId: string, attemptId: string): Promise<ResultDeliveryReceipt[]>;
  updateStatus(receiptId: string, status: string): Promise<ResultDeliveryReceipt | null>;
  void(receiptId: string): Promise<ResultDeliveryReceipt | null>;
}

export interface ResultDeliveryRetryPlanRepository {
  create(input: CreateRetryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryRetryPlan>;
  getById(retryPlanId: string): Promise<ResultDeliveryRetryPlan | null>;
  listBySchool(schoolId: string): Promise<ResultDeliveryRetryPlan[]>;
  listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryRetryPlan[]>;
  updateStatus(retryPlanId: string, status: string): Promise<ResultDeliveryRetryPlan | null>;
  cancel(retryPlanId: string): Promise<ResultDeliveryRetryPlan | null>;
  void(retryPlanId: string): Promise<ResultDeliveryRetryPlan | null>;
}

export interface ResultDeliveryMockProviderRepository {
  create(input: CreateMockProviderInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryMockProvider>;
  getById(providerId: string): Promise<ResultDeliveryMockProvider | null>;
  listBySchool(schoolId: string): Promise<ResultDeliveryMockProvider[]>;
  listByChannel(schoolId: string, channel: string): Promise<ResultDeliveryMockProvider[]>;
  updateStatus(providerId: string, status: string): Promise<ResultDeliveryMockProvider | null>;
  disable(providerId: string): Promise<ResultDeliveryMockProvider | null>;
  void(providerId: string): Promise<ResultDeliveryMockProvider | null>;
}

export interface ResultDeliveryAuditRepository {
  create(event: Omit<ResultDeliveryAuditEvent, 'resultDeliveryAuditId'>): Promise<ResultDeliveryAuditEvent>;
  getById(auditId: string): Promise<ResultDeliveryAuditEvent | null>;
  listBySchool(schoolId: string): Promise<ResultDeliveryAuditEvent[]>;
  listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryAuditEvent[]>;
  listByActorId(schoolId: string, actorId: string): Promise<ResultDeliveryAuditEvent[]>;
  listByEventType(schoolId: string, eventType: string): Promise<ResultDeliveryAuditEvent[]>;
}

export interface ResultDeliveryIdempotencyRepository {
  create(entry: Omit<ResultDeliveryIdempotencyEntry, 'resultDeliveryIdempotencyId'>): Promise<ResultDeliveryIdempotencyEntry>;
  getById(idempotencyId: string): Promise<ResultDeliveryIdempotencyEntry | null>;
  findByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultDeliveryIdempotencyEntry | null>;
  updateStatus(idempotencyId: string, status: string, resourceId?: string, safeResultSummary?: string): Promise<ResultDeliveryIdempotencyEntry | null>;
  expire(idempotencyId: string, expiresAt: string): Promise<ResultDeliveryIdempotencyEntry | null>;
}


