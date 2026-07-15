import type { FollowUpEscalationPlanStatus } from './resultFollowUpContracts';

export interface FollowUpEscalationPlan {
  followUpEscalationPlanId: string;
  schoolId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  escalationStatus: FollowUpEscalationPlanStatus;
  escalationMode: string;
  escalationLevel: string;
  safeEscalationSummary: string;
  reviewerRoleTargetsJson: Record<string, unknown> | null;
  allowedDisclosureJson: Record<string, unknown> | null;
  blockedDisclosureJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface CreateEscalationPlanInput {
  resultFollowUpCaseId: string;
  studentRef: string;
  safeEscalationSummary: string;
  escalationMode?: string;
  escalationLevel?: string;
  reviewerRoleTargets?: Record<string, unknown>;
  allowedDisclosure?: Record<string, unknown>;
  blockedDisclosure?: Record<string, unknown>;
}

export interface UpdateEscalationPlanStatusInput {
  escalationStatus: string;
  reasonCode: string;
  safeMessage: string;
}

export interface FollowUpEscalationPlanPreview {
  followUpEscalationPlanId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  escalationStatus: string;
  escalationLevel: string;
  safeEscalationSummary: string;
  createdAt: string;
}
