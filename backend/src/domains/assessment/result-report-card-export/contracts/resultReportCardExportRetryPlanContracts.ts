import type {
  ResultReportCardExportRetryPlanStatus,
} from './resultReportCardExportContracts';

export interface ResultReportCardExportRetryPlan {
  resultReportCardExportRetryPlanId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  resultReportCardMockExportAttemptId: string;
  retryStatus: ResultReportCardExportRetryPlanStatus | string;
  retryPolicy: string;
  nextMockRetryAt: string | null;
  maxMockAttempts: number;
  attemptsUsed: number;
  safeRetrySummary: string;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
  voidedAt: string | null;
}

export interface CreateExportRetryPlanInput {
  resultReportCardExportJobId: string;
  resultReportCardMockExportAttemptId: string;
  retryPolicy?: string;
  nextMockRetryAt?: string;
  maxMockAttempts?: number;
  attemptsUsed?: number;
  safeRetrySummary: string;
  blockedReasonCodesJson?: Record<string, unknown>;
}

export interface ResultReportCardExportRetryPlanPreview {
  resultReportCardExportRetryPlanId: string;
  schoolId: string;
  resultReportCardExportJobId: string;
  retryStatus: string;
  retryPolicy: string;
  maxMockAttempts: number;
  attemptsUsed: number;
  safeRetrySummary: string;
  createdAt: string;
}
