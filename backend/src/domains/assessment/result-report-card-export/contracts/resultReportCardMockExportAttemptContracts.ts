import type {
  ResultReportCardMockExportAttemptStatus,
  ResultReportCardExportAttemptMode,
  ResultReportCardExportTargetType,
} from './resultReportCardExportContracts';

export interface ResultReportCardMockExportAttempt {
  resultReportCardMockExportAttemptId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string;
  resultReportCardExportEnvelopeId: string;
  attemptStatus: ResultReportCardMockExportAttemptStatus | string;
  attemptMode: ResultReportCardExportAttemptMode | string;
  mockProviderName: string;
  targetType: ResultReportCardExportTargetType | string;
  attemptNumber: number;
  safeAttemptSummary: string;
  providerSimulationJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateMockExportAttemptInput {
  resultReportCardExportJobId: string;
  resultReportCardExportTargetId: string;
  resultReportCardExportEnvelopeId: string;
  attemptMode: ResultReportCardExportAttemptMode | string;
  mockProviderName: string;
  targetType: ResultReportCardExportTargetType | string;
  attemptNumber?: number;
  safeAttemptSummary: string;
  providerSimulationJson?: Record<string, unknown>;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardMockExportAttemptPreview {
  resultReportCardMockExportAttemptId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  attemptStatus: string;
  attemptMode: string;
  mockProviderName: string;
  attemptNumber: number;
  safeAttemptSummary: string;
  createdAt: string;
}
