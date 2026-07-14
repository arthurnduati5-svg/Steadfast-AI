import type { ResultReportCardSectionStatus, ResultReportCardSectionType } from './resultReportCardContracts';

export interface ResultReportCardSection {
  resultReportCardSectionId: string;
  schoolId: string;
  resultReportCardAssemblyId: string;
  sectionKey: string;
  sectionType: ResultReportCardSectionType | string;
  sectionStatus: ResultReportCardSectionStatus | string;
  sectionOrder: number;
  safeHeading: string;
  safeSummary: string;
  safeBodyJson: Record<string, unknown> | null;
  sourceRefsJson: Record<string, unknown> | null;
  allowedFieldNamesJson: Record<string, unknown> | null;
  blockedFieldNamesJson: Record<string, unknown> | null;
  redactionRulesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  sealedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateReportCardSectionInput {
  resultReportCardAssemblyId: string;
  sectionKey: string;
  sectionType: ResultReportCardSectionType | string;
  sectionOrder: number;
  safeHeading: string;
  safeSummary: string;
  safeBodyJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  redactionRulesJson?: Record<string, unknown>;
}
