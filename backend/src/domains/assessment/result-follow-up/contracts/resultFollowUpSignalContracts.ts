import type { ResultFollowUpSignalStatus, ResultFollowUpSignalType, ResultFollowUpSignalSeverity } from './resultFollowUpContracts';

export interface ResultFollowUpSignal {
  resultFollowUpSignalId: string;
  schoolId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  signalStatus: ResultFollowUpSignalStatus;
  signalType: ResultFollowUpSignalType;
  signalSeverity: ResultFollowUpSignalSeverity;
  signalSource: string;
  safeSignalSummary: string;
  evidenceRefsJson: Record<string, unknown> | null;
  reasonCodesJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface CreateFollowUpSignalInput {
  resultFollowUpCaseId: string;
  studentRef: string;
  signalType?: ResultFollowUpSignalType;
  signalSeverity?: ResultFollowUpSignalSeverity;
  signalSource: string;
  safeSignalSummary: string;
  evidenceRefs?: Record<string, unknown>;
  reasonCodes?: Record<string, unknown>;
}

export interface UpdateFollowUpSignalStatusInput {
  signalStatus: string;
  reasonCode: string;
  safeMessage: string;
}

export interface ResultFollowUpSignalPreview {
  resultFollowUpSignalId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  signalStatus: string;
  signalType: string;
  signalSeverity: string;
  safeSignalSummary: string;
  createdAt: string;
}
