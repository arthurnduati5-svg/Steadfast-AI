import type { ResultReportCardTemplateStatus, ResultReportCardTemplateVersionStatus, ResultReportCardAudienceType, ResultReportCardLayoutMode } from './resultReportCardContracts';

export interface ResultReportCardTemplate {
  resultReportCardTemplateId: string;
  schoolId: string;
  templateKey: string;
  templateName: string;
  templateStatus: ResultReportCardTemplateStatus;
  templateAudience: ResultReportCardAudienceType | string;
  templatePurpose: string;
  safeTemplateSummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  disabledAt: string | null;
  voidedAt: string | null;
}

export interface CreateReportCardTemplateInput {
  templateKey: string;
  templateName: string;
  templateAudience: ResultReportCardAudienceType | string;
  templatePurpose: string;
  safeTemplateSummary: string;
}

export interface ResultReportCardTemplateVersion {
  resultReportCardTemplateVersionId: string;
  schoolId: string;
  resultReportCardTemplateId: string;
  templateVersion: string;
  versionStatus: ResultReportCardTemplateVersionStatus;
  layoutMode: ResultReportCardLayoutMode | string;
  sectionSchemaJson: Record<string, unknown> | null;
  allowedSectionTypesJson: Record<string, unknown> | null;
  blockedFieldNamesJson: Record<string, unknown> | null;
  redactionRulesJson: Record<string, unknown> | null;
  safeVersionSummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
  retiredAt: string | null;
  voidedAt: string | null;
}

export interface CreateReportCardTemplateVersionInput {
  resultReportCardTemplateId: string;
  templateVersion: string;
  layoutMode: ResultReportCardLayoutMode | string;
  sectionSchemaJson?: Record<string, unknown>;
  allowedSectionTypesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  redactionRulesJson?: Record<string, unknown>;
  safeVersionSummary: string;
}
