import type {
  ResultReportCardAccessTokenIntentStatus,
  ResultReportCardAccessTokenIntentMode,
} from './resultReportCardAccessContracts';

export interface ResultReportCardAccessTokenIntent {
  resultReportCardAccessTokenIntentId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  tokenIntentStatus: ResultReportCardAccessTokenIntentStatus | string;
  tokenIntentMode: ResultReportCardAccessTokenIntentMode | string;
  safeTokenIntentSummary: string;
  tokenDescriptorJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  validatedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateAccessTokenIntentInput {
  resultReportCardAccessGrantId: string;
  tokenIntentMode: ResultReportCardAccessTokenIntentMode | string;
  safeTokenIntentSummary: string;
  tokenDescriptorJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardAccessTokenIntentPreview {
  resultReportCardAccessTokenIntentId: string;
  schoolId: string;
  resultReportCardAccessGrantId: string;
  tokenIntentStatus: string;
  tokenIntentMode: string;
  safeTokenIntentSummary: string;
  createdAt: string;
}

export interface UpdateAccessTokenIntentStatusInput {
  status: ResultReportCardAccessTokenIntentStatus | string;
  reasonCode: string;
  safeMessage: string;
}
