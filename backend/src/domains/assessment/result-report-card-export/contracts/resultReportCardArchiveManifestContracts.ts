import type {
  ResultReportCardArchiveManifestStatus,
  ResultReportCardArchiveManifestMode,
} from './resultReportCardExportContracts';

export interface ResultReportCardArchiveManifest {
  resultReportCardArchiveManifestId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  resultReportCardExportEnvelopeId: string | null;
  resultReportCardExportReceiptId: string | null;
  manifestStatus: ResultReportCardArchiveManifestStatus | string;
  manifestMode: ResultReportCardArchiveManifestMode | string;
  safeArchiveSummary: string;
  archiveMetadataJson: Record<string, unknown> | null;
  retentionPolicyJson: Record<string, unknown> | null;
  allowedFieldNamesJson: Record<string, unknown> | null;
  blockedFieldNamesJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  sealedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateArchiveManifestInput {
  resultReportCardExportJobId: string;
  resultReportCardExportEnvelopeId?: string;
  resultReportCardExportReceiptId?: string;
  manifestMode: ResultReportCardArchiveManifestMode | string;
  safeArchiveSummary: string;
  archiveMetadataJson?: Record<string, unknown>;
  retentionPolicyJson?: Record<string, unknown>;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardArchiveManifestPreview {
  resultReportCardArchiveManifestId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  manifestStatus: string;
  manifestMode: string;
  safeArchiveSummary: string;
  createdAt: string;
}
