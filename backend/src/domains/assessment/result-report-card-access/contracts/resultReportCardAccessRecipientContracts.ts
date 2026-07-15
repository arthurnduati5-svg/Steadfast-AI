import type {
  ResultReportCardAccessRecipientStatus,
} from './resultReportCardAccessContracts';
import type { ResultReportCardAudienceType } from '../../result-report-card/contracts/resultReportCardContracts';

export interface ResultReportCardAccessRecipient {
  resultReportCardAccessRecipientId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  recipientStatus: ResultReportCardAccessRecipientStatus | string;
  audienceType: ResultReportCardAudienceType | string;
  safeRecipientSummary: string;
  recipientDescriptorJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  suppressedAt: string | null;
  revokedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateAccessRecipientInput {
  resultReportCardAccessGrantId: string;
  audienceType: ResultReportCardAudienceType | string;
  safeRecipientSummary: string;
  recipientDescriptorJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardAccessRecipientPreview {
  resultReportCardAccessRecipientId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  recipientStatus: string;
  audienceType: string;
  safeRecipientSummary: string;
  createdAt: string;
}

export interface UpdateAccessRecipientStatusInput {
  status: ResultReportCardAccessRecipientStatus | string;
  reasonCode: string;
  safeMessage: string;
}
