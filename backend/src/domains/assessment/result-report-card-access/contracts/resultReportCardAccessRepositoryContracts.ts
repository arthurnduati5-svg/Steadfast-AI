import type { ResultReportCardAccessGrant, CreateAccessGrantInput, ResultReportCardAccessGrantPreview, UpdateAccessGrantStatusInput } from './resultReportCardAccessGrantContracts';
import type { ResultReportCardAccessRecipient, CreateAccessRecipientInput, ResultReportCardAccessRecipientPreview, UpdateAccessRecipientStatusInput } from './resultReportCardAccessRecipientContracts';
import type { ResultReportCardPortalPreview, CreatePortalPreviewInput, ResultReportCardPortalPreviewPreview, UpdatePortalPreviewStatusInput } from './resultReportCardPortalPreviewContracts';
import type { ResultReportCardAccessTokenIntent, CreateAccessTokenIntentInput, ResultReportCardAccessTokenIntentPreview, UpdateAccessTokenIntentStatusInput } from './resultReportCardAccessTokenIntentContracts';
import type { ResultReportCardAccessAcknowledgement, CreateAccessAcknowledgementInput, ResultReportCardAccessAcknowledgementPreview, UpdateAccessAcknowledgementStatusInput } from './resultReportCardAccessAcknowledgementContracts';
import type { ResultReportCardAccessRevocation, CreateAccessRevocationInput, ResultReportCardAccessRevocationPreview, UpdateAccessRevocationStatusInput } from './resultReportCardAccessRevocationContracts';
import type { ResultReportCardAccessExpiry, CreateAccessExpiryInput, ResultReportCardAccessExpiryPreview, UpdateAccessExpiryStatusInput } from './resultReportCardAccessExpiryContracts';
import type { ResultReportCardAccessTimeline, CreateAccessTimelineInput, ResultReportCardAccessTimelinePreview, UpdateAccessTimelineStatusInput } from './resultReportCardAccessTimelineContracts';
import type { ResultReportCardAccessGrantStatus, ResultReportCardAccessRecipientStatus, ResultReportCardPortalPreviewStatus, ResultReportCardAccessTokenIntentStatus, ResultReportCardAccessAcknowledgementStatus, ResultReportCardAccessRevocationStatus, ResultReportCardAccessExpiryStatus, ResultReportCardAccessTimelineStatus } from './resultReportCardAccessContracts';

export interface ResultReportCardAccessGrantRepository {
  create(input: CreateAccessGrantInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessGrant>;
  getById(accessGrantId: string): Promise<ResultReportCardAccessGrant | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessGrantPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAccessGrantPreview[]>;
  listByAssemblyId(assemblyId: string): Promise<ResultReportCardAccessGrantPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardAccessGrantStatus | string): Promise<ResultReportCardAccessGrantPreview[]>;
  update(accessGrantId: string, data: Partial<ResultReportCardAccessGrant>): Promise<ResultReportCardAccessGrant>;
  updateStatus(accessGrantId: string, input: UpdateAccessGrantStatusInput): Promise<ResultReportCardAccessGrant>;
  validate(accessGrantId: string): Promise<ResultReportCardAccessGrant>;
  suppress(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant>;
  revoke(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant>;
  expire(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant>;
  block(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant>;
  void(accessGrantId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessGrant>;
}

export interface ResultReportCardAccessRecipientRepository {
  create(input: CreateAccessRecipientInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessRecipient>;
  getById(accessRecipientId: string): Promise<ResultReportCardAccessRecipient | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessRecipientPreview[]>;
  listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessRecipientPreview[]>;
  listByAudienceType(schoolId: string, audienceType: string): Promise<ResultReportCardAccessRecipientPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardAccessRecipientStatus | string): Promise<ResultReportCardAccessRecipientPreview[]>;
  update(accessRecipientId: string, data: Partial<ResultReportCardAccessRecipient>): Promise<ResultReportCardAccessRecipient>;
  updateStatus(accessRecipientId: string, input: UpdateAccessRecipientStatusInput): Promise<ResultReportCardAccessRecipient>;
  validate(accessRecipientId: string): Promise<ResultReportCardAccessRecipient>;
  suppress(accessRecipientId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRecipient>;
  revoke(accessRecipientId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRecipient>;
  block(accessRecipientId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRecipient>;
  void(accessRecipientId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRecipient>;
}

export interface ResultReportCardPortalPreviewRepository {
  create(input: CreatePortalPreviewInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardPortalPreview>;
  getById(portalPreviewId: string): Promise<ResultReportCardPortalPreview | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardPortalPreviewPreview[]>;
  listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardPortalPreviewPreview[]>;
  listByRecipientId(recipientId: string): Promise<ResultReportCardPortalPreviewPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardPortalPreviewStatus | string): Promise<ResultReportCardPortalPreviewPreview[]>;
  update(portalPreviewId: string, data: Partial<ResultReportCardPortalPreview>): Promise<ResultReportCardPortalPreview>;
  updateStatus(portalPreviewId: string, input: UpdatePortalPreviewStatusInput): Promise<ResultReportCardPortalPreview>;
  seal(portalPreviewId: string): Promise<ResultReportCardPortalPreview>;
  suppress(portalPreviewId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardPortalPreview>;
  block(portalPreviewId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardPortalPreview>;
  void(portalPreviewId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardPortalPreview>;
}

export interface ResultReportCardAccessTokenIntentRepository {
  create(input: CreateAccessTokenIntentInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessTokenIntent>;
  getById(accessTokenIntentId: string): Promise<ResultReportCardAccessTokenIntent | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessTokenIntentPreview[]>;
  listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessTokenIntentPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardAccessTokenIntentStatus | string): Promise<ResultReportCardAccessTokenIntentPreview[]>;
  update(accessTokenIntentId: string, data: Partial<ResultReportCardAccessTokenIntent>): Promise<ResultReportCardAccessTokenIntent>;
  updateStatus(accessTokenIntentId: string, input: UpdateAccessTokenIntentStatusInput): Promise<ResultReportCardAccessTokenIntent>;
  validate(accessTokenIntentId: string): Promise<ResultReportCardAccessTokenIntent>;
  block(accessTokenIntentId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTokenIntent>;
  void(accessTokenIntentId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTokenIntent>;
}

export interface ResultReportCardAccessAcknowledgementRepository {
  create(input: CreateAccessAcknowledgementInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessAcknowledgement>;
  getById(accessAcknowledgementId: string): Promise<ResultReportCardAccessAcknowledgement | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]>;
  listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]>;
  listByRecipientId(recipientId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]>;
  listByPreviewId(previewId: string): Promise<ResultReportCardAccessAcknowledgementPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardAccessAcknowledgementStatus | string): Promise<ResultReportCardAccessAcknowledgementPreview[]>;
  update(accessAcknowledgementId: string, data: Partial<ResultReportCardAccessAcknowledgement>): Promise<ResultReportCardAccessAcknowledgement>;
  updateStatus(accessAcknowledgementId: string, input: UpdateAccessAcknowledgementStatusInput): Promise<ResultReportCardAccessAcknowledgement>;
  record(accessAcknowledgementId: string): Promise<ResultReportCardAccessAcknowledgement>;
  block(accessAcknowledgementId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessAcknowledgement>;
  void(accessAcknowledgementId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessAcknowledgement>;
}

export interface ResultReportCardAccessRevocationRepository {
  create(input: CreateAccessRevocationInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessRevocation>;
  getById(accessRevocationId: string): Promise<ResultReportCardAccessRevocation | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessRevocationPreview[]>;
  listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessRevocationPreview[]>;
  listByRecipientId(recipientId: string): Promise<ResultReportCardAccessRevocationPreview[]>;
  listByPreviewId(previewId: string): Promise<ResultReportCardAccessRevocationPreview[]>;
  listByTokenIntentId(tokenIntentId: string): Promise<ResultReportCardAccessRevocationPreview[]>;
  listByAcknowledgementId(acknowledgementId: string): Promise<ResultReportCardAccessRevocationPreview[]>;
  listByScope(schoolId: string, scope: string): Promise<ResultReportCardAccessRevocationPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardAccessRevocationStatus | string): Promise<ResultReportCardAccessRevocationPreview[]>;
  update(accessRevocationId: string, data: Partial<ResultReportCardAccessRevocation>): Promise<ResultReportCardAccessRevocation>;
  updateStatus(accessRevocationId: string, input: UpdateAccessRevocationStatusInput): Promise<ResultReportCardAccessRevocation>;
  apply(accessRevocationId: string): Promise<ResultReportCardAccessRevocation>;
  void(accessRevocationId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessRevocation>;
}

export interface ResultReportCardAccessExpiryRepository {
  create(input: CreateAccessExpiryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessExpiry>;
  getById(accessExpiryId: string): Promise<ResultReportCardAccessExpiry | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessExpiryPreview[]>;
  listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessExpiryPreview[]>;
  listByRecipientId(recipientId: string): Promise<ResultReportCardAccessExpiryPreview[]>;
  listByPreviewId(previewId: string): Promise<ResultReportCardAccessExpiryPreview[]>;
  listByTokenIntentId(tokenIntentId: string): Promise<ResultReportCardAccessExpiryPreview[]>;
  listByScope(schoolId: string, scope: string): Promise<ResultReportCardAccessExpiryPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardAccessExpiryStatus | string): Promise<ResultReportCardAccessExpiryPreview[]>;
  update(accessExpiryId: string, data: Partial<ResultReportCardAccessExpiry>): Promise<ResultReportCardAccessExpiry>;
  updateStatus(accessExpiryId: string, input: UpdateAccessExpiryStatusInput): Promise<ResultReportCardAccessExpiry>;
  schedule(accessExpiryId: string): Promise<ResultReportCardAccessExpiry>;
  apply(accessExpiryId: string): Promise<ResultReportCardAccessExpiry>;
  cancel(accessExpiryId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessExpiry>;
  void(accessExpiryId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessExpiry>;
}

export interface ResultReportCardAccessTimelineRepository {
  create(input: CreateAccessTimelineInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAccessTimeline>;
  getById(accessTimelineId: string): Promise<ResultReportCardAccessTimeline | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessTimelinePreview[]>;
  listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessTimelinePreview[]>;
  listByRecipientId(recipientId: string): Promise<ResultReportCardAccessTimelinePreview[]>;
  listByPreviewId(previewId: string): Promise<ResultReportCardAccessTimelinePreview[]>;
  listByTokenIntentId(tokenIntentId: string): Promise<ResultReportCardAccessTimelinePreview[]>;
  listByAcknowledgementId(acknowledgementId: string): Promise<ResultReportCardAccessTimelinePreview[]>;
  listByRevocationId(revocationId: string): Promise<ResultReportCardAccessTimelinePreview[]>;
  listByExpiryId(expiryId: string): Promise<ResultReportCardAccessTimelinePreview[]>;
  listByEventType(schoolId: string, eventType: string): Promise<ResultReportCardAccessTimelinePreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardAccessTimelineStatus | string): Promise<ResultReportCardAccessTimelinePreview[]>;
  update(accessTimelineId: string, data: Partial<ResultReportCardAccessTimeline>): Promise<ResultReportCardAccessTimeline>;
  updateStatus(accessTimelineId: string, input: UpdateAccessTimelineStatusInput): Promise<ResultReportCardAccessTimeline>;
  suppress(accessTimelineId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTimeline>;
  void(accessTimelineId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardAccessTimeline>;
}

export interface ResultReportCardAccessAuditEvent {
  resultReportCardAccessAuditId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string | null;
  resultReportCardAccessRecipientId: string | null;
  resultReportCardPortalPreviewId: string | null;
  resultReportCardAccessTokenIntentId: string | null;
  resultReportCardAccessAcknowledgementId: string | null;
  resultReportCardAccessRevocationId: string | null;
  resultReportCardAccessExpiryId: string | null;
  resultReportCardAccessTimelineId: string | null;
  actorId: string;
  actorRole: string;
  eventType: string;
  decision: string;
  safeSummary: string;
  reasonCodesJson: Record<string, unknown> | null;
  metadataJson: Record<string, unknown> | null;
  requestId: string | null;
  correlationId: string | null;
  createdAt: string;
}

export interface ResultReportCardAccessAuditRepository {
  create(event: ResultReportCardAccessAuditEvent): Promise<ResultReportCardAccessAuditEvent>;
  getById(auditId: string): Promise<ResultReportCardAccessAuditEvent | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAccessAuditEvent[]>;
  listByAccessGrantId(accessGrantId: string): Promise<ResultReportCardAccessAuditEvent[]>;
  listByEventType(schoolId: string, eventType: string): Promise<ResultReportCardAccessAuditEvent[]>;
  listByActorId(actorId: string): Promise<ResultReportCardAccessAuditEvent[]>;
}

export interface ResultReportCardAccessIdempotencyEntry {
  resultReportCardAccessIdempotencyId: string;
  schoolId: string;
  operation: string;
  idempotencyKey: string;
  requestHash: string;
  status: string;
  resourceType: string | null;
  resourceId: string | null;
  safeResultSummary: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
}

export interface ResultReportCardAccessIdempotencyRepository {
  create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<ResultReportCardAccessIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardAccessIdempotencyEntry | null>;
  updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<ResultReportCardAccessIdempotencyEntry>;
  expire(idempotencyId: string): Promise<ResultReportCardAccessIdempotencyEntry>;
}
