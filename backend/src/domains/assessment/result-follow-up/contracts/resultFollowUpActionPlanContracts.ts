import type { ResultFollowUpActionPlanStatus } from './resultFollowUpContracts';

export interface ResultFollowUpActionPlan {
  resultFollowUpActionPlanId: string;
  schoolId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  planStatus: ResultFollowUpActionPlanStatus;
  planMode: string;
  safePlanSummary: string;
  recommendedActionsJson: Record<string, unknown> | null;
  teacherReviewNotesJson: Record<string, unknown> | null;
  parentSafeGuidanceRefsJson: Record<string, unknown> | null;
  studentReflectionRefsJson: Record<string, unknown> | null;
  reviewWindowRefsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  draftedAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface CreateActionPlanInput {
  resultFollowUpCaseId: string;
  studentRef: string;
  safePlanSummary: string;
  planMode?: string;
  recommendedActions?: Record<string, unknown>;
  teacherReviewNotes?: Record<string, unknown>;
}

export interface UpdateActionPlanStatusInput {
  planStatus: string;
  reasonCode: string;
  safeMessage: string;
}

export interface ResultFollowUpActionPlanPreview {
  resultFollowUpActionPlanId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  planStatus: string;
  planMode: string;
  safePlanSummary: string;
  createdAt: string;
}
