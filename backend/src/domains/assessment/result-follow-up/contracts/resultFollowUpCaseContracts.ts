import type { ResultFollowUpCaseStatus, ResultFollowUpCaseType, ResultFollowUpCasePriority, ResultFollowUpCaseMode } from './resultFollowUpContracts';

export interface ResultFollowUpCase {
  resultFollowUpCaseId: string;
  schoolId: string;
  studentRef: string;
  resultFinalizationDecisionId: string | null;
  resultReleaseReadinessId: string | null;
  resultReleasePacketId: string | null;
  resultReportCardAssemblyId: string | null;
  resultReportCardAudienceProjectionId: string | null;
  resultReportCardAccessGrantId: string | null;
  resultReportCardAccessSummaryId: string | null;
  caseStatus: ResultFollowUpCaseStatus;
  caseType: ResultFollowUpCaseType;
  casePriority: ResultFollowUpCasePriority;
  caseMode: ResultFollowUpCaseMode;
  safeCaseSummary: string;
  sourceRefsJson: Record<string, unknown> | null;
  triggerReasonsJson: Record<string, unknown> | null;
  allowedActionsJson: Record<string, unknown> | null;
  blockedActionsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  openedAt: string | null;
  triagedAt: string | null;
  plannedAt: string | null;
  reviewedAt: string | null;
  closedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateFollowUpCaseInput {
  studentRef: string;
  resultFinalizationDecisionId?: string;
  resultReleaseReadinessId?: string;
  resultReleasePacketId?: string;
  resultReportCardAssemblyId?: string;
  resultReportCardAudienceProjectionId?: string;
  resultReportCardAccessGrantId?: string;
  resultReportCardAccessSummaryId?: string;
  caseType?: ResultFollowUpCaseType;
  casePriority?: ResultFollowUpCasePriority;
  caseMode?: ResultFollowUpCaseMode;
  safeCaseSummary: string;
  sourceRefs?: Record<string, unknown>;
  triggerReasons?: Record<string, unknown>;
  allowedActions?: Record<string, unknown>;
  blockedActions?: Record<string, unknown>;
  blockedReasonCodes?: Record<string, unknown>;
}

export interface UpdateFollowUpCaseStatusInput {
  caseStatus: string;
  reasonCode: string;
  safeMessage: string;
}

export interface ResultFollowUpCasePreview {
  resultFollowUpCaseId: string;
  schoolId: string;
  studentRef: string;
  caseStatus: string;
  caseType: string;
  casePriority: string;
  caseMode: string;
  safeCaseSummary: string;
  createdAt: string;
  updatedAt: string;
}
