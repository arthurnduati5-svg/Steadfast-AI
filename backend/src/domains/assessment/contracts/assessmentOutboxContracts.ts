export type OutboxEventStatus =
  | 'pending'
  | 'published'
  | 'failed'
  | 'dead_lettered';

export type InboxReceiptStatus =
  | 'received'
  | 'processed'
  | 'failed'
  | 'duplicate';

export interface AssessmentOutboxEvent {
  eventId: string;
  eventType: string;
  schemaVersion: string;
  schoolId: string;
  aggregateType: string;
  aggregateId: string;
  aggregateVersion: number | undefined;
  correlationId: string;
  causationId: string | undefined;
  policyVersionRefs: Record<string, string> | undefined;
  payload: Record<string, unknown>;
  status: OutboxEventStatus;
  attemptCount: number;
  createdAt: string;
  publishedAt: string | undefined;
  lastErrorCode: string | undefined;
}

export interface AssessmentInboxReceipt {
  eventId: string;
  consumerName: string;
  schoolId: string;
  processedVersion: number;
  status: InboxReceiptStatus;
  processedAt: string;
  lastErrorCode: string | undefined;
}

export interface AssessmentOutboxRepository {
  create(event: AssessmentOutboxEvent): Promise<void>;
  markPublished(eventId: string): Promise<void>;
  markFailed(eventId: string, errorCode: string): Promise<void>;
}

export interface AssessmentInboxRepository {
  findReceipt(eventId: string, consumerName: string): Promise<AssessmentInboxReceipt | undefined>;
  upsert(receipt: AssessmentInboxReceipt): Promise<void>;
}
