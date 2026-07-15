import type { StudentReflectionTaskDraftStatus } from './resultFollowUpContracts';

export interface StudentReflectionTaskDraft {
  studentReflectionTaskDraftId: string;
  schoolId: string;
  resultFollowUpCaseId: string;
  resultFollowUpActionPlanId: string | null;
  studentRef: string;
  draftStatus: StudentReflectionTaskDraftStatus;
  draftMode: string;
  safeReflectionPrompt: string;
  reflectionObjectiveRefsJson: Record<string, unknown> | null;
  scaffoldStepsJson: Record<string, unknown> | null;
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

export interface CreateStudentReflectionTaskDraftInput {
  resultFollowUpCaseId: string;
  resultFollowUpActionPlanId?: string;
  studentRef: string;
  safeReflectionPrompt: string;
  draftMode?: string;
  reflectionObjectiveRefs?: Record<string, unknown>;
  scaffoldSteps?: Record<string, unknown>;
}

export interface UpdateStudentReflectionDraftStatusInput {
  draftStatus: string;
  reasonCode: string;
  safeMessage: string;
}

export interface StudentReflectionTaskDraftPreview {
  studentReflectionTaskDraftId: string;
  resultFollowUpCaseId: string;
  studentRef: string;
  draftStatus: string;
  safeReflectionPrompt: string;
  createdAt: string;
}
