import type {
  ResultReportCardTemplate, CreateReportCardTemplateInput, ResultReportCardTemplateVersion, CreateReportCardTemplateVersionInput
} from './resultReportCardTemplateContracts';
import type { ResultReportCardAssembly, CreateAssemblyFromReleasePacketInput, ResultReportCardAssemblyPreview } from './resultReportCardAssemblyContracts';
import type { ResultReportCardSection, CreateReportCardSectionInput } from './resultReportCardSectionContracts';
import type { ResultReportCardEvidenceLink, CreateEvidenceLinkInput } from './resultReportCardEvidenceContracts';
import type { ResultReportCardAudienceProjection, CreateAudienceProjectionInput } from './resultReportCardProjectionContracts';
import type { ResultReportCardReview, CreateReviewInput } from './resultReportCardReviewContracts';
import type { ResultReportCardExportIntent, CreateExportIntentInput, ResultReportCardExportIntentPreview } from './resultReportCardExportContracts';
import type { ResultReportCardRenderManifest, CreateRenderManifestInput } from './resultReportCardRenderContracts';

export interface ResultReportCardTemplateRepository {
  create(input: CreateReportCardTemplateInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardTemplate>;
  getById(templateId: string): Promise<ResultReportCardTemplate | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardTemplate[]>;
  listByStatus(schoolId: string, status: string): Promise<ResultReportCardTemplate[]>;
  update(templateId: string, data: Partial<ResultReportCardTemplate>): Promise<ResultReportCardTemplate>;
  updateStatus(templateId: string, status: string): Promise<ResultReportCardTemplate>;
}

export interface ResultReportCardTemplateVersionRepository {
  create(input: CreateReportCardTemplateVersionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardTemplateVersion>;
  getById(versionId: string): Promise<ResultReportCardTemplateVersion | null>;
  listByTemplateId(templateId: string): Promise<ResultReportCardTemplateVersion[]>;
  listBySchool(schoolId: string): Promise<ResultReportCardTemplateVersion[]>;
  update(versionId: string, data: Partial<ResultReportCardTemplateVersion>): Promise<ResultReportCardTemplateVersion>;
  updateStatus(versionId: string, status: string): Promise<ResultReportCardTemplateVersion>;
}

export interface ResultReportCardAssemblyRepository {
  create(input: CreateAssemblyFromReleasePacketInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAssembly>;
  getById(assemblyId: string): Promise<ResultReportCardAssembly | null>;
  listBySchool(schoolId: string): Promise<ResultReportCardAssemblyPreview[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReportCardAssemblyPreview[]>;
  listByReleasePacketId(releasePacketId: string): Promise<ResultReportCardAssemblyPreview[]>;
  listByStatus(schoolId: string, status: string): Promise<ResultReportCardAssemblyPreview[]>;
  update(assemblyId: string, data: Partial<ResultReportCardAssembly>): Promise<ResultReportCardAssembly>;
  updateStatus(assemblyId: string, status: string): Promise<ResultReportCardAssembly>;
}

export interface ResultReportCardSectionRepository {
  create(input: CreateReportCardSectionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardSection>;
  getById(sectionId: string): Promise<ResultReportCardSection | null>;
  listByAssemblyId(assemblyId: string): Promise<ResultReportCardSection[]>;
  listBySchool(schoolId: string): Promise<ResultReportCardSection[]>;
  update(sectionId: string, data: Partial<ResultReportCardSection>): Promise<ResultReportCardSection>;
  updateStatus(sectionId: string, status: string): Promise<ResultReportCardSection>;
}

export interface ResultReportCardEvidenceLinkRepository {
  create(input: CreateEvidenceLinkInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardEvidenceLink>;
  getById(evidenceLinkId: string): Promise<ResultReportCardEvidenceLink | null>;
  listByAssemblyId(assemblyId: string): Promise<ResultReportCardEvidenceLink[]>;
  listBySectionId(sectionId: string): Promise<ResultReportCardEvidenceLink[]>;
  listBySchool(schoolId: string): Promise<ResultReportCardEvidenceLink[]>;
  updateStatus(evidenceLinkId: string, status: string): Promise<ResultReportCardEvidenceLink>;
}

export interface ResultReportCardAudienceProjectionRepository {
  create(input: CreateAudienceProjectionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardAudienceProjection>;
  getById(projectionId: string): Promise<ResultReportCardAudienceProjection | null>;
  listByAssemblyId(assemblyId: string): Promise<ResultReportCardAudienceProjection[]>;
  listBySchool(schoolId: string): Promise<ResultReportCardAudienceProjection[]>;
  listByAudienceType(schoolId: string, audienceType: string): Promise<ResultReportCardAudienceProjection[]>;
  update(projectionId: string, data: Partial<ResultReportCardAudienceProjection>): Promise<ResultReportCardAudienceProjection>;
  updateStatus(projectionId: string, status: string): Promise<ResultReportCardAudienceProjection>;
}

export interface ResultReportCardReviewRepository {
  create(input: CreateReviewInput & { reviewedByActorId: string; reviewedByRole: string; schoolId: string }): Promise<ResultReportCardReview>;
  getById(reviewId: string): Promise<ResultReportCardReview | null>;
  listByAssemblyId(assemblyId: string): Promise<ResultReportCardReview[]>;
  listBySchool(schoolId: string): Promise<ResultReportCardReview[]>;
  update(reviewId: string, data: Partial<ResultReportCardReview>): Promise<ResultReportCardReview>;
  updateStatus(reviewId: string, status: string): Promise<ResultReportCardReview>;
}

export interface ResultReportCardExportIntentRepository {
  create(input: CreateExportIntentInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardExportIntent>;
  getById(exportIntentId: string): Promise<ResultReportCardExportIntent | null>;
  listByAssemblyId(assemblyId: string): Promise<ResultReportCardExportIntentPreview[]>;
  listBySchool(schoolId: string): Promise<ResultReportCardExportIntentPreview[]>;
  update(exportIntentId: string, data: Partial<ResultReportCardExportIntent>): Promise<ResultReportCardExportIntent>;
  updateStatus(exportIntentId: string, status: string): Promise<ResultReportCardExportIntent>;
}

export interface ResultReportCardRenderManifestRepository {
  create(input: CreateRenderManifestInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultReportCardRenderManifest>;
  getById(manifestId: string): Promise<ResultReportCardRenderManifest | null>;
  listByAssemblyId(assemblyId: string): Promise<ResultReportCardRenderManifest[]>;
  listBySchool(schoolId: string): Promise<ResultReportCardRenderManifest[]>;
  update(manifestId: string, data: Partial<ResultReportCardRenderManifest>): Promise<ResultReportCardRenderManifest>;
  updateStatus(manifestId: string, status: string): Promise<ResultReportCardRenderManifest>;
}

export interface ResultReportCardAuditEvent {
  resultReportCardAuditId: string;
  schoolId: string;
  resultReportCardTemplateId: string | null;
  resultReportCardTemplateVersionId: string | null;
  resultReportCardAssemblyId: string | null;
  resultReportCardSectionId: string | null;
  resultReportCardEvidenceLinkId: string | null;
  resultReportCardAudienceProjectionId: string | null;
  resultReportCardReviewId: string | null;
  resultReportCardExportIntentId: string | null;
  resultReportCardRenderManifestId: string | null;
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

export interface ResultReportCardAuditRepository {
  create(event: Omit<ResultReportCardAuditEvent, 'resultReportCardAuditId' | 'createdAt'>): Promise<ResultReportCardAuditEvent>;
}

export interface ResultReportCardIdempotencyEntry {
  resultReportCardIdempotencyId: string;
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

export interface ResultReportCardIdempotencyRepository {
  create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; expiresAt?: string }): Promise<ResultReportCardIdempotencyEntry>;
  getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReportCardIdempotencyEntry | null>;
  update(idempotencyId: string, data: Partial<ResultReportCardIdempotencyEntry>): Promise<ResultReportCardIdempotencyEntry>;
}
