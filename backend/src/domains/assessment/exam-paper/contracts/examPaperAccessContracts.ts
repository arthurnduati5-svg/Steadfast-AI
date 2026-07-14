export type ExamAccessPolicyStatus =
  | 'draft'
  | 'configured'
  | 'delivery_ready'
  | 'blocked'
  | 'archived';

export type ExamAvailabilityMode =
  | 'manual_teacher_activation'
  | 'scheduled_future_release_deferred'
  | 'paper_only'
  | 'mock_window';

export interface ExamAccessPolicy {
  accessPolicyId: string;
  schoolId: string;
  paperId: string;
  paperVersionId: string;
  status: ExamAccessPolicyStatus;
  intendedAudienceType: string;
  classScopeRefsJson: Record<string, unknown> | null;
  roleScopeRefsJson: Record<string, unknown> | null;
  availabilityMode: ExamAvailabilityMode;
  requiresTeacherActivation: boolean;
  allowStudentSelfStart: boolean;
  allowRetake: boolean;
  maxAttempts: number;
  safePolicySummary: string;
  createdByActorId: string;
  createdAt: string;
  updatedAt: string;
}
