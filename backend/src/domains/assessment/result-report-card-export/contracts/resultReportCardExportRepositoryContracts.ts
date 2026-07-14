import type { ResultReportCardExportJob, CreateExportJobInput, ResultReportCardExportJobPreview, UpdateExportJobStatusInput } from './resultReportCardExportJobContracts';
import type { ResultReportCardExportTarget, CreateExportTargetInput, ResultReportCardExportTargetPreview } from './resultReportCardExportTargetContracts';
import type { ResultReportCardExportEnvelope, CreateExportEnvelopeInput, ResultReportCardExportEnvelopePreview } from './resultReportCardExportEnvelopeContracts';
import type { ResultReportCardMockExportAttempt, CreateMockExportAttemptInput, ResultReportCardMockExportAttemptPreview } from './resultReportCardMockExportAttemptContracts';
import type { ResultReportCardExportReceipt, CreateExportReceiptInput, ResultReportCardExportReceiptPreview } from './resultReportCardExportReceiptContracts';
import type { ResultReportCardExportSuppression, CreateExportSuppressionInput, ResultReportCardExportSuppressionPreview } from './resultReportCardExportSuppressionContracts';
import type { ResultReportCardExportRetryPlan, CreateExportRetryPlanInput, ResultReportCardExportRetryPlanPreview } from './resultReportCardExportRetryPlanContracts';
import type { ResultReportCardArchiveManifest, CreateArchiveManifestInput, ResultReportCardArchiveManifestPreview } from './resultReportCardArchiveManifestContracts';
import type { ResultReportCardExportJobStatus, ResultReportCardExportTargetStatus, ResultReportCardExportEnvelopeStatus, ResultReportCardMockExportAttemptStatus, ResultReportCardExportReceiptStatus, ResultReportCardExportSuppressionStatus, ResultReportCardExportRetryPlanStatus, ResultReportCardArchiveManifestStatus } from './resultReportCardExportContracts';

export interface ResultReportCardExportJobRepository {
  create(input: CreateExportJobInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportJob>;
  getById(exportJobId: string): Promise<ResultReportCardExportJob | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardExportJobPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardExportJobPreview[]>;
  listByAssemblyId(assemblyId: string): Promise<ResultReportCardExportJobPreview[]>;
  listByExportIntentId(exportIntentId: string): Promise<ResultReportCardExportJobPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardExportJobStatus | string): Promise<ResultReportCardExportJobPreview[]>;
  update(exportJobId: string, data: Partial<ResultReportCardExportJob>): Promise<ResultReportCardExportJob>;
  updateStatus(exportJobId: string, input: UpdateExportJobStatusInput): Promise<ResultReportCardExportJob>;
  block(exportJobId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportJob>;
  cancel(exportJobId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportJob>;
  void(exportJobId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportJob>;
}

export interface ResultReportCardExportTargetRepository {
  create(input: CreateExportTargetInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportTarget>;
  getById(exportTargetId: string): Promise<ResultReportCardExportTarget | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardExportTargetPreview[]>;
  listByExportJobId(exportJobId: string): Promise<ResultReportCardExportTargetPreview[]>;
  listByTargetType(schoolId: string, targetType: string): Promise<ResultReportCardExportTargetPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardExportTargetStatus | string): Promise<ResultReportCardExportTargetPreview[]>;
  update(exportTargetId: string, data: Partial<ResultReportCardExportTarget>): Promise<ResultReportCardExportTarget>;
  updateStatus(exportTargetId: string, status: ResultReportCardExportTargetStatus | string): Promise<ResultReportCardExportTarget>;
  suppress(exportTargetId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportTarget>;
  block(exportTargetId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportTarget>;
  void(exportTargetId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportTarget>;
}

export interface ResultReportCardExportEnvelopeRepository {
  create(input: CreateExportEnvelopeInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportEnvelope>;
  getById(exportEnvelopeId: string): Promise<ResultReportCardExportEnvelope | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardExportEnvelopePreview[]>;
  listByExportJobId(exportJobId: string): Promise<ResultReportCardExportEnvelopePreview[]>;
  listByTargetId(targetId: string): Promise<ResultReportCardExportEnvelopePreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardExportEnvelopeStatus | string): Promise<ResultReportCardExportEnvelopePreview[]>;
  update(exportEnvelopeId: string, data: Partial<ResultReportCardExportEnvelope>): Promise<ResultReportCardExportEnvelope>;
  updateStatus(exportEnvelopeId: string, status: ResultReportCardExportEnvelopeStatus | string): Promise<ResultReportCardExportEnvelope>;
  seal(exportEnvelopeId: string): Promise<ResultReportCardExportEnvelope>;
  suppress(exportEnvelopeId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportEnvelope>;
  block(exportEnvelopeId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportEnvelope>;
  void(exportEnvelopeId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportEnvelope>;
}

export interface ResultReportCardMockExportAttemptRepository {
  create(input: CreateMockExportAttemptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardMockExportAttempt>;
  getById(mockExportAttemptId: string): Promise<ResultReportCardMockExportAttempt | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardMockExportAttemptPreview[]>;
  listByExportJobId(exportJobId: string): Promise<ResultReportCardMockExportAttemptPreview[]>;
  listByTargetId(targetId: string): Promise<ResultReportCardMockExportAttemptPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardMockExportAttemptStatus | string): Promise<ResultReportCardMockExportAttemptPreview[]>;
  update(mockExportAttemptId: string, data: Partial<ResultReportCardMockExportAttempt>): Promise<ResultReportCardMockExportAttempt>;
  updateStatus(mockExportAttemptId: string, status: ResultReportCardMockExportAttemptStatus | string): Promise<ResultReportCardMockExportAttempt>;
  start(mockExportAttemptId: string): Promise<ResultReportCardMockExportAttempt>;
  complete(mockExportAttemptId: string): Promise<ResultReportCardMockExportAttempt>;
  fail(mockExportAttemptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardMockExportAttempt>;
  block(mockExportAttemptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardMockExportAttempt>;
  void(mockExportAttemptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardMockExportAttempt>;
}

export interface ResultReportCardExportReceiptRepository {
  create(input: CreateExportReceiptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportReceipt>;
  getById(exportReceiptId: string): Promise<ResultReportCardExportReceipt | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardExportReceiptPreview[]>;
  listByExportJobId(exportJobId: string): Promise<ResultReportCardExportReceiptPreview[]>;
  listByTargetId(targetId: string): Promise<ResultReportCardExportReceiptPreview[]>;
  listByAttemptId(attemptId: string): Promise<ResultReportCardExportReceiptPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardExportReceiptStatus | string): Promise<ResultReportCardExportReceiptPreview[]>;
  update(exportReceiptId: string, data: Partial<ResultReportCardExportReceipt>): Promise<ResultReportCardExportReceipt>;
  updateStatus(exportReceiptId: string, status: ResultReportCardExportReceiptStatus | string): Promise<ResultReportCardExportReceipt>;
  block(exportReceiptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportReceipt>;
  void(exportReceiptId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportReceipt>;
}

export interface ResultReportCardExportSuppressionRepository {
  create(input: CreateExportSuppressionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportSuppression>;
  getById(exportSuppressionId: string): Promise<ResultReportCardExportSuppression | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardExportSuppressionPreview[]>;
  listByExportJobId(exportJobId: string): Promise<ResultReportCardExportSuppressionPreview[]>;
  listByTargetId(targetId: string): Promise<ResultReportCardExportSuppressionPreview[]>;
  listByEnvelopeId(envelopeId: string): Promise<ResultReportCardExportSuppressionPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardExportSuppressionStatus | string): Promise<ResultReportCardExportSuppressionPreview[]>;
  update(exportSuppressionId: string, data: Partial<ResultReportCardExportSuppression>): Promise<ResultReportCardExportSuppression>;
  updateStatus(exportSuppressionId: string, status: ResultReportCardExportSuppressionStatus | string): Promise<ResultReportCardExportSuppression>;
  lift(exportSuppressionId: string): Promise<ResultReportCardExportSuppression>;
  void(exportSuppressionId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportSuppression>;
}

export interface ResultReportCardExportRetryPlanRepository {
  create(input: CreateExportRetryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportRetryPlan>;
  getById(exportRetryPlanId: string): Promise<ResultReportCardExportRetryPlan | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardExportRetryPlanPreview[]>;
  listByExportJobId(exportJobId: string): Promise<ResultReportCardExportRetryPlanPreview[]>;
  listByAttemptId(attemptId: string): Promise<ResultReportCardExportRetryPlanPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardExportRetryPlanStatus | string): Promise<ResultReportCardExportRetryPlanPreview[]>;
  update(exportRetryPlanId: string, data: Partial<ResultReportCardExportRetryPlan>): Promise<ResultReportCardExportRetryPlan>;
  updateStatus(exportRetryPlanId: string, status: ResultReportCardExportRetryPlanStatus | string): Promise<ResultReportCardExportRetryPlan>;
  markPlanned(exportRetryPlanId: string): Promise<ResultReportCardExportRetryPlan>;
  cancel(exportRetryPlanId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportRetryPlan>;
  exhaust(exportRetryPlanId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportRetryPlan>;
  void(exportRetryPlanId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardExportRetryPlan>;
}

export interface ResultReportCardArchiveManifestRepository {
  create(input: CreateArchiveManifestInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardArchiveManifest>;
  getById(archiveManifestId: string): Promise<ResultReportCardArchiveManifest | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardArchiveManifestPreview[]>;
  listByExportJobId(exportJobId: string): Promise<ResultReportCardArchiveManifestPreview[]>;
  listByStatus(schoolId: string, status: ResultReportCardArchiveManifestStatus | string): Promise<ResultReportCardArchiveManifestPreview[]>;
  update(archiveManifestId: string, data: Partial<ResultReportCardArchiveManifest>): Promise<ResultReportCardArchiveManifest>;
  updateStatus(archiveManifestId: string, status: ResultReportCardArchiveManifestStatus | string): Promise<ResultReportCardArchiveManifest>;
  seal(archiveManifestId: string): Promise<ResultReportCardArchiveManifest>;
  block(archiveManifestId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardArchiveManifest>;
  void(archiveManifestId: string, reasonCode: string, safeMessage: string): Promise<ResultReportCardArchiveManifest>;
}

export interface ResultReportCardExportAuditEvent {
  resultReportCardExportAuditId: string;
  schoolId: string;
  resultReportCardExportJobId: string | null;
  resultReportCardExportTargetId: string | null;
  resultReportCardExportEnvelopeId: string | null;
  resultReportCardMockExportAttemptId: string | null;
  resultReportCardExportReceiptId: string | null;
  resultReportCardExportSuppressionId: string | null;
  resultReportCardExportRetryPlanId: string | null;
  resultReportCardArchiveManifestId: string | null;
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

export interface ResultReportCardExportAuditRepository {
  create(event: ResultReportCardExportAuditEvent): Promise<ResultReportCardExportAuditEvent>;
  getById(auditId: string): Promise<ResultReportCardExportAuditEvent | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardExportAuditEvent[]>;
  listByExportJobId(exportJobId: string): Promise<ResultReportCardExportAuditEvent[]>;
  listByEventType(schoolId: string, eventType: string): Promise<ResultReportCardExportAuditEvent[]>;
  listByActorId(actorId: string): Promise<ResultReportCardExportAuditEvent[]>;
}

export interface ResultReportCardExportIdempotencyEntry {
  resultReportCardExportIdempotencyId: string;
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

export interface ResultReportCardExportIdempotencyRepository {
  create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<ResultReportCardExportIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardExportIdempotencyEntry | null>;
  updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<ResultReportCardExportIdempotencyEntry>;
  expire(idempotencyId: string): Promise<ResultReportCardExportIdempotencyEntry>;
}
