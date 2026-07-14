import type {
  ResultReportCardExportEnvelopeStatus,
  ResultReportCardExportEnvelopeMode,
} from './resultReportCardExportContracts';

export interface ResultReportCardExportEnvelope {
  resultReportCardExportEnvelopeId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string;
  resultReportCardAudienceProjectionId: string;
  resultReportCardRenderManifestId: string;
  envelopeStatus: ResultReportCardExportEnvelopeStatus | string;
  envelopeMode: ResultReportCardExportEnvelopeMode | string;
  safeEnvelopeSummary: string;
  safePayloadJson: Record<string, unknown> | null;
  redactionRulesJson: Record<string, unknown> | null;
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

export interface CreateExportEnvelopeInput {
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string;
  resultReportCardAudienceProjectionId: string;
  resultReportCardRenderManifestId: string;
  envelopeMode: ResultReportCardExportEnvelopeMode | string;
  safeEnvelopeSummary: string;
  safePayloadJson?: Record<string, unknown>;
  redactionRulesJson?: Record<string, unknown>;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardExportEnvelopePreview {
  resultReportCardExportEnvelopeId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string;
  envelopeStatus: string;
  envelopeMode: string;
  safeEnvelopeSummary: string;
  createdAt: string;
}
