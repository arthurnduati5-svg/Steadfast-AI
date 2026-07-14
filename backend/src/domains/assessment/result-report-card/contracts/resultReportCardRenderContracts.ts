import type { ResultReportCardRenderManifestStatus, ResultReportCardRenderMode } from './resultReportCardContracts';

export interface ResultReportCardRenderManifest {
  resultReportCardRenderManifestId: string;
  schoolId: string;
  resultReportCardAssemblyId: string;
  resultReportCardTemplateVersionId: string;
  manifestStatus: ResultReportCardRenderManifestStatus | string;
  renderMode: ResultReportCardRenderMode | string;
  safeManifestSummary: string;
  layoutJson: Record<string, unknown> | null;
  sectionOrderJson: Record<string, unknown> | null;
  assetRefsJson: Record<string, unknown> | null;
  blockedFieldNamesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  sealedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateRenderManifestInput {
  resultReportCardAssemblyId: string;
  resultReportCardTemplateVersionId: string;
  renderMode: ResultReportCardRenderMode | string;
  safeManifestSummary: string;
  layoutJson?: Record<string, unknown>;
  sectionOrderJson?: Record<string, unknown>;
  assetRefsJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
}
