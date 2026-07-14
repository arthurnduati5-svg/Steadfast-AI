import type { StudentResultReportSnapshotStatus, StudentResultReportSnapshotType, ParentSafeResultSummaryStatus, StudentSafeResultSummaryStatus } from './resultReleaseContracts';

export interface StudentResultReportSnapshot {
  studentResultReportSnapshotId: string;
  schoolId: string;
  resultReleasePacketId: string;
  resultAudienceProjectionId: string;
  studentRef: string;
  snapshotStatus: StudentResultReportSnapshotStatus;
  snapshotType: StudentResultReportSnapshotType;
  safeReportTitle: string;
  safeReportSummary: string;
  safeStrengthsJson?: Record<string, unknown>;
  safeGrowthAreasJson?: Record<string, unknown>;
  safeNextStepsJson?: Record<string, unknown>;
  safeSupportGuidanceJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  voidedAt?: string;
}

export interface CreateReportSnapshotInput {
  schoolId: string;
  resultReleasePacketId: string;
  resultAudienceProjectionId: string;
  studentRef: string;
  snapshotType: StudentResultReportSnapshotType;
  safeReportTitle: string;
  safeReportSummary: string;
  safeStrengthsJson?: Record<string, unknown>;
  safeGrowthAreasJson?: Record<string, unknown>;
  safeNextStepsJson?: Record<string, unknown>;
  safeSupportGuidanceJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}

export interface ParentSafeResultSummary {
  parentSafeResultSummaryId: string;
  schoolId: string;
  resultReleasePacketId: string;
  resultAudienceProjectionId: string;
  studentRef: string;
  summaryStatus: ParentSafeResultSummaryStatus;
  safeProgressSummary: string;
  safeSupportSummary: string;
  safeStrengthsJson?: Record<string, unknown>;
  safeGrowthAreasJson?: Record<string, unknown>;
  safeRecommendedSupportJson?: Record<string, unknown>;
  notYetReleasedReason?: string;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  voidedAt?: string;
}

export interface CreateParentSafeSummaryInput {
  schoolId: string;
  resultReleasePacketId: string;
  resultAudienceProjectionId: string;
  studentRef: string;
  safeProgressSummary: string;
  safeSupportSummary: string;
  safeStrengthsJson?: Record<string, unknown>;
  safeGrowthAreasJson?: Record<string, unknown>;
  safeRecommendedSupportJson?: Record<string, unknown>;
  notYetReleasedReason?: string;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}

export interface StudentSafeResultSummary {
  studentSafeResultSummaryId: string;
  schoolId: string;
  resultReleasePacketId: string;
  resultAudienceProjectionId: string;
  studentRef: string;
  summaryStatus: StudentSafeResultSummaryStatus;
  safeAchievementSummary: string;
  safeLearningProgressSummary: string;
  safeNextPracticeSummary: string;
  safeConfidenceGuidanceJson?: Record<string, unknown>;
  safeRevisionGuidanceJson?: Record<string, unknown>;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  voidedAt?: string;
}

export interface CreateStudentSafeSummaryInput {
  schoolId: string;
  resultReleasePacketId: string;
  resultAudienceProjectionId: string;
  studentRef: string;
  safeAchievementSummary: string;
  safeLearningProgressSummary: string;
  safeNextPracticeSummary: string;
  safeConfidenceGuidanceJson?: Record<string, unknown>;
  safeRevisionGuidanceJson?: Record<string, unknown>;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
}
