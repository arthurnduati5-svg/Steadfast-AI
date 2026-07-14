import type { ResultReleaseApprovalStatus, ResultReleaseApprovalType } from './resultReleaseContracts';

export interface ResultReleaseApproval {
  resultReleaseApprovalId: string;
  schoolId: string;
  resultReleasePacketId: string;
  resultFinalizationDecisionId: string;
  studentRef: string;
  approvalStatus: ResultReleaseApprovalStatus;
  approvalType: ResultReleaseApprovalType;
  approvedAudience: string;
  approvedByActorId: string;
  approvedByRole: string;
  safeApprovalSummary: string;
  reasonCodesJson?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  voidedAt?: string;
}

export interface CreateReleaseApprovalInput {
  schoolId: string;
  resultReleasePacketId: string;
  resultFinalizationDecisionId: string;
  studentRef: string;
  approvalType: ResultReleaseApprovalType;
  approvedAudience: string;
  approvedByActorId: string;
  approvedByRole: string;
  safeApprovalSummary: string;
  reasonCodesJson?: Record<string, unknown>;
}
