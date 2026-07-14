import type { ResultReportCardAudienceProjectionStatus, ResultReportCardAudienceType } from './resultReportCardContracts';

export interface ResultReportCardAudienceProjection {
  resultReportCardAudienceProjectionId: string;
  schoolId: string;
  resultReportCardAssemblyId: string;
  audienceType: ResultReportCardAudienceType | string;
  projectionStatus: ResultReportCardAudienceProjectionStatus | string;
  projectionVersion: string;
  safeProjectionJson: Record<string, unknown> | null;
  allowedFieldNamesJson: Record<string, unknown> | null;
  blockedFieldNamesJson: Record<string, unknown> | null;
  redactionRulesJson: Record<string, unknown> | null;
  safeProjectionSummary: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  sealedAt: string | null;
  blockedAt: string | null;
  voidedAt: string | null;
}

export interface CreateAudienceProjectionInput {
  resultReportCardAssemblyId: string;
  audienceType: ResultReportCardAudienceType | string;
  safeProjectionJson?: Record<string, unknown>;
  allowedFieldNamesJson?: Record<string, unknown>;
  blockedFieldNamesJson?: Record<string, unknown>;
  redactionRulesJson?: Record<string, unknown>;
  safeProjectionSummary: string;
}

export interface ResultReportCardTeacherProjection {
  audienceType: 'teacher';
  safeProjectionJson: Record<string, unknown> | null;
  safeProjectionSummary: string;
  allowedFieldNames: string[];
}

export interface ResultReportCardAdminProjection {
  audienceType: 'admin';
  safeProjectionJson: Record<string, unknown> | null;
  safeProjectionSummary: string;
  allowedFieldNames: string[];
}

export interface ResultReportCardStudentSafeProjection {
  audienceType: 'student';
  safeProjectionJson: Record<string, unknown> | null;
  safeProjectionSummary: string;
  allowedFieldNames: string[];
}

export interface ResultReportCardParentBoundaryProjection {
  audienceType: 'parent';
  safeProjectionJson: Record<string, unknown> | null;
  safeProjectionSummary: string;
  allowedFieldNames: string[];
}
