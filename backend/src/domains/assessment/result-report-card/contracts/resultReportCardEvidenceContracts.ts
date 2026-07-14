import type { ResultReportCardEvidenceStatus, ResultReportCardSourcePackage } from './resultReportCardContracts';

export interface ResultReportCardEvidenceLink {
  resultReportCardEvidenceLinkId: string;
  schoolId: string;
  resultReportCardAssemblyId: string;
  resultReportCardSectionId: string | null;
  sourceRecordType: string;
  sourceRecordId: string;
  sourcePackage: ResultReportCardSourcePackage | string;
  evidenceStatus: ResultReportCardEvidenceStatus | string;
  evidenceUse: string;
  safeEvidenceSummary: string;
  allowedUseJson: Record<string, unknown> | null;
  blockedUseJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  voidedAt: string | null;
}

export interface CreateEvidenceLinkInput {
  resultReportCardAssemblyId: string;
  resultReportCardSectionId?: string;
  sourceRecordType: string;
  sourceRecordId: string;
  sourcePackage: ResultReportCardSourcePackage | string;
  evidenceUse: string;
  safeEvidenceSummary: string;
  allowedUseJson?: Record<string, unknown>;
  blockedUseJson?: Record<string, unknown>;
}
