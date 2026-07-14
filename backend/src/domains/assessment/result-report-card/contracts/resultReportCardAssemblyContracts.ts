import type { ResultReportCardAssemblyStatus, ResultReportCardAssemblyMode, ResultReportCardAudienceType } from './resultReportCardContracts';

export interface ResultReportCardAssembly {
  resultReportCardAssemblyId: string;
  schoolId: string;
  resultReportCardTemplateId: string;
  resultReportCardTemplateVersionId: string;
  resultReleasePacketId: string;
  resultReleaseApprovalId: string;
  resultAudienceProjectionId: string;
  studentResultReportSnapshotId: string;
  parentSafeResultSummaryId: string | null;
  studentSafeResultSummaryId: string | null;
  resultDeliveryJobId: string | null;
  resultDeliveryReceiptId: string | null;
  resultFinalizationDecisionId: string;
  resultReleaseBoundaryId: string;
  resultLearningEvidenceBridgeId: string | null;
  markingResultVersionId: string;
  studentRef: string;
  paperId: string;
  paperVersionId: string;
  deliverySessionId: string;
  assemblyStatus: ResultReportCardAssemblyStatus | string;
  assemblyMode: ResultReportCardAssemblyMode | string;
  audienceType: ResultReportCardAudienceType | string;
  safeReportTitle: string;
  safeReportSummary: string;
  sourceRefsJson: Record<string, unknown> | null;
  allowedFieldsJson: Record<string, unknown> | null;
  blockedFieldsJson: Record<string, unknown> | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  assembledAt: string | null;
  safetyCheckedAt: string | null;
  sealedAt: string | null;
  blockedAt: string | null;
  cancelledAt: string | null;
  voidedAt: string | null;
}

export interface CreateAssemblyFromReleasePacketInput {
  resultReportCardTemplateId: string;
  resultReportCardTemplateVersionId: string;
  resultReleasePacketId: string;
  resultReleaseApprovalId: string;
  resultAudienceProjectionId: string;
  studentResultReportSnapshotId: string;
  parentSafeResultSummaryId?: string;
  studentSafeResultSummaryId?: string;
  resultDeliveryJobId?: string;
  resultDeliveryReceiptId?: string;
  resultFinalizationDecisionId: string;
  resultReleaseBoundaryId: string;
  resultLearningEvidenceBridgeId?: string;
  markingResultVersionId: string;
  studentRef: string;
  paperId: string;
  paperVersionId: string;
  deliverySessionId: string;
  assemblyMode: ResultReportCardAssemblyMode | string;
  audienceType: ResultReportCardAudienceType | string;
  safeReportTitle: string;
  safeReportSummary: string;
  sourceRefsJson?: Record<string, unknown>;
  allowedFieldsJson?: Record<string, unknown>;
  blockedFieldsJson?: Record<string, unknown>;
}

export interface ResultReportCardAssemblyPreview {
  resultReportCardAssemblyId: string;
  schoolId: string;
  assemblyStatus: string;
  assemblyMode: string;
  audienceType: string;
  safeReportTitle: string;
  safeReportSummary: string;
  studentRef: string;
  createdAt: string;
  updatedAt: string;
}
