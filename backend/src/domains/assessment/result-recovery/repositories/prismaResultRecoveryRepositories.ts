import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import type {
  ResultRecoveryPlan,
  CreateRecoveryPlanInput,
  ResultRecoveryPlanPreview,
  UpdateRecoveryPlanStatusInput,
} from '../contracts/resultRecoveryPlanContracts';
import type {
  ResultRecoveryObjective,
  CreateRecoveryObjectiveInput,
  ResultRecoveryObjectivePreview,
  UpdateRecoveryObjectiveStatusInput,
} from '../contracts/resultRecoveryObjectiveContracts';
import type {
  ResultRecoveryStep,
  CreateRecoveryStepInput,
  ResultRecoveryStepPreview,
  UpdateRecoveryStepStatusInput,
} from '../contracts/resultRecoveryStepContracts';
import type {
  ResultRecoveryPracticeDraft,
  CreatePracticeDraftInput,
  ResultRecoveryPracticeDraftPreview,
  UpdateRecoveryPracticeDraftStatusInput,
} from '../contracts/resultRecoveryPracticeDraftContracts';
import type {
  ResultRecoveryResourceRecommendation,
  CreateResourceRecommendationInput,
  ResultRecoveryResourceRecommendationPreview,
  UpdateRecoveryResourceRecommendationStatusInput,
} from '../contracts/resultRecoveryResourceRecommendationContracts';
import type {
  ResultRecoveryTeacherReviewPacket,
  CreateTeacherReviewPacketInput,
  ResultRecoveryTeacherReviewPacketPreview,
  UpdateRecoveryTeacherReviewPacketStatusInput,
} from '../contracts/resultRecoveryTeacherReviewPacketContracts';
import type {
  ResultRecoveryStudentSupportDraft,
  CreateStudentSupportDraftInput,
  ResultRecoveryStudentSupportDraftPreview,
  UpdateRecoveryStudentSupportDraftStatusInput,
} from '../contracts/resultRecoveryStudentSupportDraftContracts';
import type {
  ResultRecoveryParentSupportNoteDraft,
  CreateParentSupportNoteDraftInput,
  ResultRecoveryParentSupportNoteDraftPreview,
  UpdateRecoveryParentSupportNoteDraftStatusInput,
} from '../contracts/resultRecoveryParentSupportNoteDraftContracts';
import type {
  ResultRecoveryCheckpoint,
  CreateRecoveryCheckpointInput,
  ResultRecoveryCheckpointPreview,
  UpdateRecoveryCheckpointStatusInput,
} from '../contracts/resultRecoveryCheckpointContracts';
import type {
  ResultRecoverySummary,
  CreateRecoverySummaryInput,
  ResultRecoverySummaryPreview,
  UpdateRecoverySummaryStatusInput,
} from '../contracts/resultRecoverySummaryContracts';
import type {
  ResultRecoveryAuditEvent,
  ResultRecoveryIdempotencyEntry,
  ResultRecoveryPlanStatus,
  ResultRecoveryPlanMode,
  ResultRecoveryPlanPriority,
  ResultRecoveryObjectiveStatus,
  ResultRecoveryObjectiveType,
  ResultRecoveryStepStatus,
  ResultRecoveryStepType,
  ResultRecoveryPracticeDraftStatus,
  ResultRecoveryResourceRecommendationStatus,
  ResultRecoveryTeacherReviewPacketStatus,
  ResultRecoveryStudentSupportDraftStatus,
  ResultRecoveryParentSupportNoteDraftStatus,
  ResultRecoveryCheckpointStatus,
  ResultRecoverySummaryStatus,
  ResultRecoverySummaryScope,
} from '../contracts';
import type {
  ResultRecoveryPlanRepository,
  ResultRecoveryObjectiveRepository,
  ResultRecoveryStepRepository,
  ResultRecoveryPracticeDraftRepository,
  ResultRecoveryResourceRecommendationRepository,
  ResultRecoveryTeacherReviewPacketRepository,
  ResultRecoveryStudentSupportDraftRepository,
  ResultRecoveryParentSupportNoteDraftRepository,
  ResultRecoveryCheckpointRepository,
  ResultRecoverySummaryRepository,
  ResultRecoveryAuditRepository,
  ResultRecoveryIdempotencyRepository,
} from '../contracts';

function mapRecoveryPlanFromPrisma(row: any): ResultRecoveryPlan {
  return {
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    schoolId: row.schoolId,
    studentRef: row.studentRef,
    resultFollowUpCaseId: row.resultFollowUpCaseId || null,
    resultFollowUpActionPlanId: row.resultFollowUpActionPlanId || null,
    resultFollowUpSummaryId: row.resultFollowUpSummaryId || null,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId || null,
    resultReportCardAudienceProjectionId: row.resultReportCardAudienceProjectionId || null,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId || null,
    resultLearningEvidenceSnapshotId: row.resultLearningEvidenceSnapshotId || null,
    planStatus: row.planStatus,
    planMode: row.planMode,
    planPriority: row.planPriority,
    safePlanSummary: row.safePlanSummary,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    objectiveRefsJson: (row.objectiveRefsJson as Record<string, unknown>) || null,
    recommendedSequenceJson: (row.recommendedSequenceJson as Record<string, unknown>) || null,
    allowedActionsJson: (row.allowedActionsJson as Record<string, unknown>) || null,
    blockedActionsJson: (row.blockedActionsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    draftedAt: row.draftedAt?.toISOString() || null,
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryPlanPreviewFromPrisma(row: any): ResultRecoveryPlanPreview {
  return {
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    schoolId: row.schoolId,
    studentRef: row.studentRef,
    planStatus: row.planStatus,
    planMode: row.planMode,
    planPriority: row.planPriority,
    safePlanSummary: row.safePlanSummary,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryObjectiveFromPrisma(row: any): ResultRecoveryObjective {
  return {
    resultRecoveryObjectiveId: row.resultRecoveryObjectiveId,
    schoolId: row.schoolId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    studentRef: row.studentRef,
    objectiveStatus: row.objectiveStatus,
    objectiveType: row.objectiveType,
    objectivePriority: row.objectivePriority,
    learningObjectiveRef: row.learningObjectiveRef || null,
    skillRef: row.skillRef || null,
    topicRef: row.topicRef || null,
    safeObjectiveSummary: row.safeObjectiveSummary,
    evidenceRefsJson: (row.evidenceRefsJson as Record<string, unknown>) || null,
    successCriteriaJson: (row.successCriteriaJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    readyAt: row.readyAt?.toISOString() || null,
    completedMockAt: row.completedMockAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryObjectivePreviewFromPrisma(row: any): ResultRecoveryObjectivePreview {
  return {
    resultRecoveryObjectiveId: row.resultRecoveryObjectiveId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    studentRef: row.studentRef,
    objectiveStatus: row.objectiveStatus,
    objectiveType: row.objectiveType,
    safeObjectiveSummary: row.safeObjectiveSummary,
    readyAt: row.readyAt?.toISOString() || null,
    completedMockAt: row.completedMockAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoveryStepFromPrisma(row: any): ResultRecoveryStep {
  return {
    resultRecoveryStepId: row.resultRecoveryStepId,
    schoolId: row.schoolId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    resultRecoveryObjectiveId: row.resultRecoveryObjectiveId || null,
    studentRef: row.studentRef,
    stepStatus: row.stepStatus,
    stepType: row.stepType,
    stepOrder: row.stepOrder,
    stepMode: row.stepMode,
    safeStepSummary: row.safeStepSummary,
    stepInstructionsJson: (row.stepInstructionsJson as Record<string, unknown>) || null,
    teacherNotesJson: (row.teacherNotesJson as Record<string, unknown>) || null,
    studentSafeNotesJson: (row.studentSafeNotesJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    completedMockAt: row.completedMockAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryStepPreviewFromPrisma(row: any): ResultRecoveryStepPreview {
  return {
    resultRecoveryStepId: row.resultRecoveryStepId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    stepOrder: row.stepOrder,
    stepStatus: row.stepStatus,
    stepType: row.stepType,
    safeStepSummary: row.safeStepSummary,
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    completedMockAt: row.completedMockAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoveryPracticeDraftFromPrisma(row: any): ResultRecoveryPracticeDraft {
  return {
    resultRecoveryPracticeDraftId: row.resultRecoveryPracticeDraftId,
    schoolId: row.schoolId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    resultRecoveryObjectiveId: row.resultRecoveryObjectiveId || null,
    resultRecoveryStepId: row.resultRecoveryStepId || null,
    studentRef: row.studentRef,
    draftStatus: row.draftStatus,
    draftMode: row.draftMode,
    practiceType: row.practiceType,
    safePracticeSummary: row.safePracticeSummary,
    questionRefsJson: (row.questionRefsJson as Record<string, unknown>) || null,
    objectiveRefsJson: (row.objectiveRefsJson as Record<string, unknown>) || null,
    difficultyHintsJson: (row.difficultyHintsJson as Record<string, unknown>) || null,
    selectionReasonCodesJson: (row.selectionReasonCodesJson as string[]) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryPracticeDraftPreviewFromPrisma(row: any): ResultRecoveryPracticeDraftPreview {
  return {
    resultRecoveryPracticeDraftId: row.resultRecoveryPracticeDraftId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    practiceType: row.practiceType,
    draftStatus: row.draftStatus,
    safePracticeSummary: row.safePracticeSummary,
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoveryResourceRecommendationFromPrisma(row: any): ResultRecoveryResourceRecommendation {
  return {
    resultRecoveryResourceRecommendationId: row.resultRecoveryResourceRecommendationId,
    schoolId: row.schoolId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    resultRecoveryObjectiveId: row.resultRecoveryObjectiveId || null,
    studentRef: row.studentRef,
    recommendationStatus: row.recommendationStatus,
    recommendationMode: row.recommendationMode,
    resourceType: row.resourceType,
    safeResourceSummary: row.safeResourceSummary,
    resourceRefsJson: (row.resourceRefsJson as Record<string, unknown>) || null,
    selectionReasonCodesJson: (row.selectionReasonCodesJson as string[]) || null,
    allowedAudienceJson: (row.allowedAudienceJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryResourceRecommendationPreviewFromPrisma(row: any): ResultRecoveryResourceRecommendationPreview {
  return {
    resultRecoveryResourceRecommendationId: row.resultRecoveryResourceRecommendationId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    resourceType: row.resourceType,
    recommendationStatus: row.recommendationStatus,
    safeResourceSummary: row.safeResourceSummary,
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoveryTeacherReviewPacketFromPrisma(row: any): ResultRecoveryTeacherReviewPacket {
  return {
    resultRecoveryTeacherReviewPacketId: row.resultRecoveryTeacherReviewPacketId,
    schoolId: row.schoolId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    studentRef: row.studentRef,
    teacherRef: row.teacherRef,
    packetStatus: row.packetStatus,
    packetMode: row.packetMode,
    safePacketSummary: row.safePacketSummary,
    caseRefsJson: (row.caseRefsJson as Record<string, unknown>) || null,
    objectiveRefsJson: (row.objectiveRefsJson as Record<string, unknown>) || null,
    stepRefsJson: (row.stepRefsJson as Record<string, unknown>) || null,
    practiceDraftRefsJson: (row.practiceDraftRefsJson as Record<string, unknown>) || null,
    resourceRecommendationRefsJson: (row.resourceRecommendationRefsJson as Record<string, unknown>) || null,
    reviewQuestionsJson: (row.reviewQuestionsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    acknowledgedMockAt: row.acknowledgedMockAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryTeacherReviewPacketPreviewFromPrisma(row: any): ResultRecoveryTeacherReviewPacketPreview {
  return {
    resultRecoveryTeacherReviewPacketId: row.resultRecoveryTeacherReviewPacketId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    teacherRef: row.teacherRef,
    packetStatus: row.packetStatus,
    safePacketSummary: row.safePacketSummary,
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    acknowledgedMockAt: row.acknowledgedMockAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoveryStudentSupportDraftFromPrisma(row: any): ResultRecoveryStudentSupportDraft {
  return {
    resultRecoveryStudentSupportDraftId: row.resultRecoveryStudentSupportDraftId,
    schoolId: row.schoolId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    studentRef: row.studentRef,
    draftStatus: row.draftStatus,
    draftMode: row.draftMode,
    safeSupportSummary: row.safeSupportSummary,
    studentSupportBodyJson: (row.studentSupportBodyJson as Record<string, unknown>) || null,
    reflectionPromptRefsJson: (row.reflectionPromptRefsJson as Record<string, unknown>) || null,
    practiceDraftRefsJson: (row.practiceDraftRefsJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as string[]) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryStudentSupportDraftPreviewFromPrisma(row: any): ResultRecoveryStudentSupportDraftPreview {
  return {
    resultRecoveryStudentSupportDraftId: row.resultRecoveryStudentSupportDraftId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    draftStatus: row.draftStatus,
    safeSupportSummary: row.safeSupportSummary,
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoveryParentSupportNoteDraftFromPrisma(row: any): ResultRecoveryParentSupportNoteDraft {
  return {
    resultRecoveryParentSupportNoteDraftId: row.resultRecoveryParentSupportNoteDraftId,
    schoolId: row.schoolId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    studentRef: row.studentRef,
    audienceType: row.audienceType,
    draftStatus: row.draftStatus,
    draftMode: row.draftMode,
    safeSupportSummary: row.safeSupportSummary,
    parentSupportBodyJson: (row.parentSupportBodyJson as Record<string, unknown>) || null,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as string[]) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as string[]) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryParentSupportNoteDraftPreviewFromPrisma(row: any): ResultRecoveryParentSupportNoteDraftPreview {
  return {
    resultRecoveryParentSupportNoteDraftId: row.resultRecoveryParentSupportNoteDraftId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    audienceType: row.audienceType,
    draftStatus: row.draftStatus,
    safeSupportSummary: row.safeSupportSummary,
    reviewReadyAt: row.reviewReadyAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoveryCheckpointFromPrisma(row: any): ResultRecoveryCheckpoint {
  return {
    resultRecoveryCheckpointId: row.resultRecoveryCheckpointId,
    schoolId: row.schoolId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    studentRef: row.studentRef,
    checkpointStatus: row.checkpointStatus,
    checkpointMode: row.checkpointMode,
    checkpointType: row.checkpointType,
    safeCheckpointSummary: row.safeCheckpointSummary,
    checkpointCriteriaJson: (row.checkpointCriteriaJson as Record<string, unknown>) || null,
    scheduledMockAt: row.scheduledMockAt?.toISOString() || null,
    completedMockAt: row.completedMockAt?.toISOString() || null,
    cancelledAt: row.cancelledAt?.toISOString() || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoveryCheckpointPreviewFromPrisma(row: any): ResultRecoveryCheckpointPreview {
  return {
    resultRecoveryCheckpointId: row.resultRecoveryCheckpointId,
    resultRecoveryPlanId: row.resultRecoveryPlanId,
    checkpointStatus: row.checkpointStatus,
    checkpointType: row.checkpointType,
    safeCheckpointSummary: row.safeCheckpointSummary,
    scheduledMockAt: row.scheduledMockAt?.toISOString() || null,
    completedMockAt: row.completedMockAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoverySummaryFromPrisma(row: any): ResultRecoverySummary {
  return {
    resultRecoverySummaryId: row.resultRecoverySummaryId,
    schoolId: row.schoolId,
    studentRef: row.studentRef || null,
    summaryScope: row.summaryScope,
    summaryStatus: row.summaryStatus,
    safeSummary: row.safeSummary,
    planCountsJson: (row.planCountsJson as Record<string, unknown>) || null,
    objectiveCountsJson: (row.objectiveCountsJson as Record<string, unknown>) || null,
    checkpointCountsJson: (row.checkpointCountsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as string[]) || null,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    refreshedAt: row.refreshedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecoverySummaryPreviewFromPrisma(row: any): ResultRecoverySummaryPreview {
  return {
    resultRecoverySummaryId: row.resultRecoverySummaryId,
    schoolId: row.schoolId,
    summaryScope: row.summaryScope,
    summaryStatus: row.summaryStatus,
    safeSummary: row.safeSummary,
    refreshedAt: row.refreshedAt?.toISOString() || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoveryAuditFromPrisma(row: any): ResultRecoveryAuditEvent {
  return {
    resultRecoveryAuditId: row.resultRecoveryAuditId,
    schoolId: row.schoolId,
    resultRecoveryPlanId: row.resultRecoveryPlanId || null,
    resultRecoveryObjectiveId: row.resultRecoveryObjectiveId || null,
    resultRecoveryStepId: row.resultRecoveryStepId || null,
    resultRecoveryPracticeDraftId: row.resultRecoveryPracticeDraftId || null,
    resultRecoveryResourceRecommendationId: row.resultRecoveryResourceRecommendationId || null,
    resultRecoveryTeacherReviewPacketId: row.resultRecoveryTeacherReviewPacketId || null,
    resultRecoveryStudentSupportDraftId: row.resultRecoveryStudentSupportDraftId || null,
    resultRecoveryParentSupportNoteDraftId: row.resultRecoveryParentSupportNoteDraftId || null,
    resultRecoveryCheckpointId: row.resultRecoveryCheckpointId || null,
    resultRecoverySummaryId: row.resultRecoverySummaryId || null,
    actorId: row.actorId,
    actorRole: row.actorRole,
    eventType: row.eventType,
    decision: row.decision,
    safeSummary: row.safeSummary,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || null,
    metadataJson: (row.metadataJson as Record<string, unknown>) || null,
    requestId: row.requestId || null,
    correlationId: row.correlationId || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapRecoveryIdempotencyFromPrisma(row: any): ResultRecoveryIdempotencyEntry {
  return {
    resultRecoveryIdempotencyId: row.resultRecoveryIdempotencyId,
    schoolId: row.schoolId,
    operation: row.operation,
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    status: row.status,
    resourceType: row.resourceType || null,
    resourceId: row.resourceId || null,
    safeResultSummary: row.safeResultSummary || null,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    expiresAt: row.expiresAt?.toISOString() || null,
  };
}

export class PrismaResultRecoveryPlanRepository implements ResultRecoveryPlanRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateRecoveryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryPlan> {
    const row = await this.prisma.resultRecoveryPlanRecord.create({
      data: {
        resultRecoveryPlanId: uuidv4(),
        schoolId: input.schoolId,
        studentRef: input.studentRef,
        resultFollowUpCaseId: input.resultFollowUpCaseId || null,
        resultFollowUpActionPlanId: input.resultFollowUpActionPlanId || null,
        resultFollowUpSummaryId: input.resultFollowUpSummaryId || null,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId || null,
        resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId || null,
        resultReportCardAccessGrantId: input.resultReportCardAccessGrantId || null,
        resultLearningEvidenceSnapshotId: input.resultLearningEvidenceSnapshotId || null,
        planStatus: 'draft',
        planMode: input.planMode ?? 'mock_plan_only',
        planPriority: input.planPriority ?? 'medium',
        safePlanSummary: input.safePlanSummary,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        objectiveRefsJson: (input.objectiveRefsJson as any) || undefined,
        recommendedSequenceJson: (input.recommendedSequenceJson as any) || undefined,
        allowedActionsJson: (input.allowedActionsJson as any) || undefined,
        blockedActionsJson: (input.blockedActionsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
        createdAt: new Date(),
        updatedAt: new Date(),
        draftedAt: new Date(),
      },
    });
    return mapRecoveryPlanFromPrisma(row);
  }

  async getById(planId: string): Promise<ResultRecoveryPlan | null> {
    const row = await this.prisma.resultRecoveryPlanRecord.findUnique({ where: { resultRecoveryPlanId: planId } });
    return row ? mapRecoveryPlanFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryPlanPreview[]> {
    const rows = await this.prisma.resultRecoveryPlanRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPlanPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryPlanPreview[]> {
    const rows = await this.prisma.resultRecoveryPlanRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPlanPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoveryPlanStatus | string): Promise<ResultRecoveryPlanPreview[]> {
    const rows = await this.prisma.resultRecoveryPlanRecord.findMany({ where: { schoolId, planStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPlanPreviewFromPrisma);
  }

  async listByPriority(schoolId: string, priority: ResultRecoveryPlanPriority | string): Promise<ResultRecoveryPlanPreview[]> {
    const rows = await this.prisma.resultRecoveryPlanRecord.findMany({ where: { schoolId, planPriority: priority as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPlanPreviewFromPrisma);
  }

  async listByMode(schoolId: string, mode: ResultRecoveryPlanMode | string): Promise<ResultRecoveryPlanPreview[]> {
    const rows = await this.prisma.resultRecoveryPlanRecord.findMany({ where: { schoolId, planMode: mode as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPlanPreviewFromPrisma);
  }

  async update(planId: string, data: Partial<ResultRecoveryPlan>): Promise<ResultRecoveryPlan> {
    const row = await this.prisma.resultRecoveryPlanRecord.update({
      where: { resultRecoveryPlanId: planId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoveryPlanFromPrisma(row);
  }

  async updateStatus(planId: string, input: UpdateRecoveryPlanStatusInput): Promise<ResultRecoveryPlan> {
    const data: any = { planStatus: input.planStatus, updatedAt: new Date() };
    if (input.planStatus === 'review_ready') data.reviewReadyAt = new Date();
    if (input.planStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.planStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.planStatus === 'blocked') data.blockedAt = new Date();
    if (input.planStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoveryPlanRecord.update({
      where: { resultRecoveryPlanId: planId },
      data,
    });
    return mapRecoveryPlanFromPrisma(row);
  }

  async markReviewReady(planId: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Recovery plan ready for review' });
  }

  async approveForFutureUse(planId: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Recovery plan approved for future use' });
  }

  async suppress(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(planId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPlan> {
    return this.updateStatus(planId, { planStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoveryObjectiveRepository implements ResultRecoveryObjectiveRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateRecoveryObjectiveInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryObjective> {
    const row = await this.prisma.resultRecoveryObjectiveRecord.create({
      data: {
        resultRecoveryObjectiveId: uuidv4(),
        schoolId: input.schoolId,
        resultRecoveryPlanId: input.resultRecoveryPlanId,
        studentRef: input.studentRef,
        objectiveStatus: 'draft',
        objectiveType: input.objectiveType ?? 'concept_repair',
        objectivePriority: input.objectivePriority ?? 'medium',
        learningObjectiveRef: input.learningObjectiveRef || null,
        skillRef: input.skillRef || null,
        topicRef: input.topicRef || null,
        safeObjectiveSummary: input.safeObjectiveSummary,
        evidenceRefsJson: (input.evidenceRefsJson as any) || undefined,
        successCriteriaJson: (input.successCriteriaJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRecoveryObjectiveFromPrisma(row);
  }

  async getById(objectiveId: string): Promise<ResultRecoveryObjective | null> {
    const row = await this.prisma.resultRecoveryObjectiveRecord.findUnique({ where: { resultRecoveryObjectiveId: objectiveId } });
    return row ? mapRecoveryObjectiveFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryObjectivePreview[]> {
    const rows = await this.prisma.resultRecoveryObjectiveRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryObjectivePreviewFromPrisma);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryObjectivePreview[]> {
    const rows = await this.prisma.resultRecoveryObjectiveRecord.findMany({ where: { resultRecoveryPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryObjectivePreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryObjectivePreview[]> {
    const rows = await this.prisma.resultRecoveryObjectiveRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryObjectivePreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoveryObjectiveStatus | string): Promise<ResultRecoveryObjectivePreview[]> {
    const rows = await this.prisma.resultRecoveryObjectiveRecord.findMany({ where: { schoolId, objectiveStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryObjectivePreviewFromPrisma);
  }

  async listByType(schoolId: string, type: ResultRecoveryObjectiveType | string): Promise<ResultRecoveryObjectivePreview[]> {
    const rows = await this.prisma.resultRecoveryObjectiveRecord.findMany({ where: { schoolId, objectiveType: type as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryObjectivePreviewFromPrisma);
  }

  async update(objectiveId: string, data: Partial<ResultRecoveryObjective>): Promise<ResultRecoveryObjective> {
    const row = await this.prisma.resultRecoveryObjectiveRecord.update({
      where: { resultRecoveryObjectiveId: objectiveId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoveryObjectiveFromPrisma(row);
  }

  async updateStatus(objectiveId: string, input: UpdateRecoveryObjectiveStatusInput): Promise<ResultRecoveryObjective> {
    const data: any = { objectiveStatus: input.objectiveStatus, updatedAt: new Date() };
    if (input.objectiveStatus === 'ready') data.readyAt = new Date();
    if (input.objectiveStatus === 'completed_mock') data.completedMockAt = new Date();
    if (input.objectiveStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.objectiveStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoveryObjectiveRecord.update({
      where: { resultRecoveryObjectiveId: objectiveId },
      data,
    });
    return mapRecoveryObjectiveFromPrisma(row);
  }

  async markReady(objectiveId: string): Promise<ResultRecoveryObjective> {
    return this.updateStatus(objectiveId, { objectiveStatus: 'ready', reasonCode: 'ready', safeMessage: 'Objective ready' });
  }

  async completeMock(objectiveId: string): Promise<ResultRecoveryObjective> {
    return this.updateStatus(objectiveId, { objectiveStatus: 'completed_mock', reasonCode: 'completed_mock', safeMessage: 'Objective mock completed' });
  }

  async suppress(objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryObjective> {
    return this.updateStatus(objectiveId, { objectiveStatus: 'suppressed', reasonCode, safeMessage });
  }

  async void(objectiveId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryObjective> {
    return this.updateStatus(objectiveId, { objectiveStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoveryStepRepository implements ResultRecoveryStepRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateRecoveryStepInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryStep> {
    const row = await this.prisma.resultRecoveryStepRecord.create({
      data: {
        resultRecoveryStepId: uuidv4(),
        schoolId: input.schoolId,
        resultRecoveryPlanId: input.resultRecoveryPlanId,
        resultRecoveryObjectiveId: input.resultRecoveryObjectiveId || null,
        studentRef: input.studentRef,
        stepStatus: 'draft',
        stepType: input.stepType ?? 'review_concept',
        stepOrder: input.stepOrder ?? 0,
        stepMode: input.stepMode ?? 'mock',
        safeStepSummary: input.safeStepSummary,
        stepInstructionsJson: (input.stepInstructionsJson as any) || undefined,
        teacherNotesJson: (input.teacherNotesJson as any) || undefined,
        studentSafeNotesJson: (input.studentSafeNotesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRecoveryStepFromPrisma(row);
  }

  async getById(stepId: string): Promise<ResultRecoveryStep | null> {
    const row = await this.prisma.resultRecoveryStepRecord.findUnique({ where: { resultRecoveryStepId: stepId } });
    return row ? mapRecoveryStepFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryStepPreview[]> {
    const rows = await this.prisma.resultRecoveryStepRecord.findMany({ where: { schoolId }, orderBy: { stepOrder: 'asc' } });
    return rows.map(mapRecoveryStepPreviewFromPrisma);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryStepPreview[]> {
    const rows = await this.prisma.resultRecoveryStepRecord.findMany({ where: { resultRecoveryPlanId: planId }, orderBy: { stepOrder: 'asc' } });
    return rows.map(mapRecoveryStepPreviewFromPrisma);
  }

  async listByObjectiveId(objectiveId: string): Promise<ResultRecoveryStepPreview[]> {
    const rows = await this.prisma.resultRecoveryStepRecord.findMany({ where: { resultRecoveryObjectiveId: objectiveId }, orderBy: { stepOrder: 'asc' } });
    return rows.map(mapRecoveryStepPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryStepPreview[]> {
    const rows = await this.prisma.resultRecoveryStepRecord.findMany({ where: { schoolId, studentRef }, orderBy: { stepOrder: 'asc' } });
    return rows.map(mapRecoveryStepPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoveryStepStatus | string): Promise<ResultRecoveryStepPreview[]> {
    const rows = await this.prisma.resultRecoveryStepRecord.findMany({ where: { schoolId, stepStatus: status as string }, orderBy: { stepOrder: 'asc' } });
    return rows.map(mapRecoveryStepPreviewFromPrisma);
  }

  async listByType(schoolId: string, type: ResultRecoveryStepType | string): Promise<ResultRecoveryStepPreview[]> {
    const rows = await this.prisma.resultRecoveryStepRecord.findMany({ where: { schoolId, stepType: type as string }, orderBy: { stepOrder: 'asc' } });
    return rows.map(mapRecoveryStepPreviewFromPrisma);
  }

  async update(stepId: string, data: Partial<ResultRecoveryStep>): Promise<ResultRecoveryStep> {
    const row = await this.prisma.resultRecoveryStepRecord.update({
      where: { resultRecoveryStepId: stepId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoveryStepFromPrisma(row);
  }

  async updateStatus(stepId: string, input: UpdateRecoveryStepStatusInput): Promise<ResultRecoveryStep> {
    const data: any = { stepStatus: input.stepStatus, updatedAt: new Date() };
    if (input.stepStatus === 'review_ready') data.reviewReadyAt = new Date();
    if (input.stepStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.stepStatus === 'completed_mock') data.completedMockAt = new Date();
    if (input.stepStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.stepStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoveryStepRecord.update({
      where: { resultRecoveryStepId: stepId },
      data,
    });
    return mapRecoveryStepFromPrisma(row);
  }

  async markReviewReady(stepId: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Step ready for review' });
  }

  async approveForFutureUse(stepId: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Step approved for future use' });
  }

  async completeMock(stepId: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'completed_mock', reasonCode: 'completed_mock', safeMessage: 'Step mock completed' });
  }

  async suppress(stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'suppressed', reasonCode, safeMessage });
  }

  async void(stepId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStep> {
    return this.updateStatus(stepId, { stepStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoveryPracticeDraftRepository implements ResultRecoveryPracticeDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreatePracticeDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryPracticeDraft> {
    const row = await this.prisma.resultRecoveryPracticeDraftRecord.create({
      data: {
        resultRecoveryPracticeDraftId: uuidv4(),
        schoolId: input.schoolId,
        resultRecoveryPlanId: input.resultRecoveryPlanId,
        resultRecoveryObjectiveId: input.resultRecoveryObjectiveId || null,
        resultRecoveryStepId: input.resultRecoveryStepId || null,
        studentRef: input.studentRef,
        draftStatus: 'draft',
        draftMode: input.draftMode ?? 'mock',
        practiceType: input.practiceType ?? 'general_practice',
        safePracticeSummary: input.safePracticeSummary,
        questionRefsJson: (input.questionRefsJson as any) || undefined,
        objectiveRefsJson: (input.objectiveRefsJson as any) || undefined,
        difficultyHintsJson: (input.difficultyHintsJson as any) || undefined,
        selectionReasonCodesJson: (input.selectionReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRecoveryPracticeDraftFromPrisma(row);
  }

  async getById(draftId: string): Promise<ResultRecoveryPracticeDraft | null> {
    const row = await this.prisma.resultRecoveryPracticeDraftRecord.findUnique({ where: { resultRecoveryPracticeDraftId: draftId } });
    return row ? mapRecoveryPracticeDraftFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryPracticeDraftRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPracticeDraftPreviewFromPrisma);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryPracticeDraftRecord.findMany({ where: { resultRecoveryPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPracticeDraftPreviewFromPrisma);
  }

  async listByObjectiveId(objectiveId: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryPracticeDraftRecord.findMany({ where: { resultRecoveryObjectiveId: objectiveId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPracticeDraftPreviewFromPrisma);
  }

  async listByStepId(stepId: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryPracticeDraftRecord.findMany({ where: { resultRecoveryStepId: stepId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPracticeDraftPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryPracticeDraftRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPracticeDraftPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoveryPracticeDraftStatus | string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryPracticeDraftRecord.findMany({ where: { schoolId, draftStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPracticeDraftPreviewFromPrisma);
  }

  async listByPracticeType(schoolId: string, practiceType: string): Promise<ResultRecoveryPracticeDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryPracticeDraftRecord.findMany({ where: { schoolId, practiceType }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryPracticeDraftPreviewFromPrisma);
  }

  async update(draftId: string, data: Partial<ResultRecoveryPracticeDraft>): Promise<ResultRecoveryPracticeDraft> {
    const row = await this.prisma.resultRecoveryPracticeDraftRecord.update({
      where: { resultRecoveryPracticeDraftId: draftId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoveryPracticeDraftFromPrisma(row);
  }

  async updateStatus(draftId: string, input: UpdateRecoveryPracticeDraftStatusInput): Promise<ResultRecoveryPracticeDraft> {
    const data: any = { draftStatus: input.draftStatus, updatedAt: new Date() };
    if (input.draftStatus === 'review_ready') data.reviewReadyAt = new Date();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.draftStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.draftStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoveryPracticeDraftRecord.update({
      where: { resultRecoveryPracticeDraftId: draftId },
      data,
    });
    return mapRecoveryPracticeDraftFromPrisma(row);
  }

  async markReviewReady(draftId: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Practice draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Practice draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryPracticeDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoveryResourceRecommendationRepository implements ResultRecoveryResourceRecommendationRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateResourceRecommendationInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryResourceRecommendation> {
    const row = await this.prisma.resultRecoveryResourceRecommendationRecord.create({
      data: {
        resultRecoveryResourceRecommendationId: uuidv4(),
        schoolId: input.schoolId,
        resultRecoveryPlanId: input.resultRecoveryPlanId,
        resultRecoveryObjectiveId: input.resultRecoveryObjectiveId || null,
        studentRef: input.studentRef,
        recommendationStatus: 'draft',
        recommendationMode: input.recommendationMode ?? 'mock',
        resourceType: input.resourceType ?? 'practice',
        safeResourceSummary: input.safeResourceSummary,
        resourceRefsJson: (input.resourceRefsJson as any) || undefined,
        selectionReasonCodesJson: (input.selectionReasonCodesJson as any) || undefined,
        allowedAudienceJson: (input.allowedAudienceJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRecoveryResourceRecommendationFromPrisma(row);
  }

  async getById(recommendationId: string): Promise<ResultRecoveryResourceRecommendation | null> {
    const row = await this.prisma.resultRecoveryResourceRecommendationRecord.findUnique({ where: { resultRecoveryResourceRecommendationId: recommendationId } });
    return row ? mapRecoveryResourceRecommendationFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    const rows = await this.prisma.resultRecoveryResourceRecommendationRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryResourceRecommendationPreviewFromPrisma);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    const rows = await this.prisma.resultRecoveryResourceRecommendationRecord.findMany({ where: { resultRecoveryPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryResourceRecommendationPreviewFromPrisma);
  }

  async listByObjectiveId(objectiveId: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    const rows = await this.prisma.resultRecoveryResourceRecommendationRecord.findMany({ where: { resultRecoveryObjectiveId: objectiveId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryResourceRecommendationPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    const rows = await this.prisma.resultRecoveryResourceRecommendationRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryResourceRecommendationPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoveryResourceRecommendationStatus | string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    const rows = await this.prisma.resultRecoveryResourceRecommendationRecord.findMany({ where: { schoolId, recommendationStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryResourceRecommendationPreviewFromPrisma);
  }

  async listByResourceType(schoolId: string, resourceType: string): Promise<ResultRecoveryResourceRecommendationPreview[]> {
    const rows = await this.prisma.resultRecoveryResourceRecommendationRecord.findMany({ where: { schoolId, resourceType }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryResourceRecommendationPreviewFromPrisma);
  }

  async update(recommendationId: string, data: Partial<ResultRecoveryResourceRecommendation>): Promise<ResultRecoveryResourceRecommendation> {
    const row = await this.prisma.resultRecoveryResourceRecommendationRecord.update({
      where: { resultRecoveryResourceRecommendationId: recommendationId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoveryResourceRecommendationFromPrisma(row);
  }

  async updateStatus(recommendationId: string, input: UpdateRecoveryResourceRecommendationStatusInput): Promise<ResultRecoveryResourceRecommendation> {
    const data: any = { recommendationStatus: input.recommendationStatus, updatedAt: new Date() };
    if (input.recommendationStatus === 'review_ready') data.reviewReadyAt = new Date();
    if (input.recommendationStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.recommendationStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.recommendationStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoveryResourceRecommendationRecord.update({
      where: { resultRecoveryResourceRecommendationId: recommendationId },
      data,
    });
    return mapRecoveryResourceRecommendationFromPrisma(row);
  }

  async markReviewReady(recommendationId: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Resource recommendation ready for review' });
  }

  async approveForFutureUse(recommendationId: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Resource recommendation approved for future use' });
  }

  async suppress(recommendationId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(recommendationId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(recommendationId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryResourceRecommendation> {
    return this.updateStatus(recommendationId, { recommendationStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoveryTeacherReviewPacketRepository implements ResultRecoveryTeacherReviewPacketRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateTeacherReviewPacketInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryTeacherReviewPacket> {
    const row = await this.prisma.resultRecoveryTeacherReviewPacketRecord.create({
      data: {
        resultRecoveryTeacherReviewPacketId: uuidv4(),
        schoolId: input.schoolId,
        resultRecoveryPlanId: input.resultRecoveryPlanId,
        studentRef: input.studentRef,
        teacherRef: input.teacherRef,
        packetStatus: 'draft',
        packetMode: input.packetMode ?? 'review',
        safePacketSummary: input.safePacketSummary,
        caseRefsJson: (input.caseRefsJson as any) || undefined,
        objectiveRefsJson: (input.objectiveRefsJson as any) || undefined,
        stepRefsJson: (input.stepRefsJson as any) || undefined,
        practiceDraftRefsJson: (input.practiceDraftRefsJson as any) || undefined,
        resourceRecommendationRefsJson: (input.resourceRecommendationRefsJson as any) || undefined,
        reviewQuestionsJson: (input.reviewQuestionsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRecoveryTeacherReviewPacketFromPrisma(row);
  }

  async getById(packetId: string): Promise<ResultRecoveryTeacherReviewPacket | null> {
    const row = await this.prisma.resultRecoveryTeacherReviewPacketRecord.findUnique({ where: { resultRecoveryTeacherReviewPacketId: packetId } });
    return row ? mapRecoveryTeacherReviewPacketFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    const rows = await this.prisma.resultRecoveryTeacherReviewPacketRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryTeacherReviewPacketPreviewFromPrisma);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    const rows = await this.prisma.resultRecoveryTeacherReviewPacketRecord.findMany({ where: { resultRecoveryPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryTeacherReviewPacketPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    const rows = await this.prisma.resultRecoveryTeacherReviewPacketRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryTeacherReviewPacketPreviewFromPrisma);
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    const rows = await this.prisma.resultRecoveryTeacherReviewPacketRecord.findMany({ where: { schoolId, teacherRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryTeacherReviewPacketPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoveryTeacherReviewPacketStatus | string): Promise<ResultRecoveryTeacherReviewPacketPreview[]> {
    const rows = await this.prisma.resultRecoveryTeacherReviewPacketRecord.findMany({ where: { schoolId, packetStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryTeacherReviewPacketPreviewFromPrisma);
  }

  async update(packetId: string, data: Partial<ResultRecoveryTeacherReviewPacket>): Promise<ResultRecoveryTeacherReviewPacket> {
    const row = await this.prisma.resultRecoveryTeacherReviewPacketRecord.update({
      where: { resultRecoveryTeacherReviewPacketId: packetId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoveryTeacherReviewPacketFromPrisma(row);
  }

  async updateStatus(packetId: string, input: UpdateRecoveryTeacherReviewPacketStatusInput): Promise<ResultRecoveryTeacherReviewPacket> {
    const data: any = { packetStatus: input.packetStatus, updatedAt: new Date() };
    if (input.packetStatus === 'ready') data.reviewReadyAt = new Date();
    if (input.packetStatus === 'acknowledged_mock') data.acknowledgedMockAt = new Date();
    if (input.packetStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.packetStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.packetStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoveryTeacherReviewPacketRecord.update({
      where: { resultRecoveryTeacherReviewPacketId: packetId },
      data,
    });
    return mapRecoveryTeacherReviewPacketFromPrisma(row);
  }

  async markReady(packetId: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'ready', reasonCode: 'ready', safeMessage: 'Review packet ready' });
  }

  async acknowledgeMock(packetId: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'acknowledged_mock', reasonCode: 'acknowledged_mock', safeMessage: 'Review packet mock acknowledged' });
  }

  async approveForFutureUse(packetId: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Review packet approved for future use' });
  }

  async suppress(packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'suppressed', reasonCode, safeMessage });
  }

  async void(packetId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryTeacherReviewPacket> {
    return this.updateStatus(packetId, { packetStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoveryStudentSupportDraftRepository implements ResultRecoveryStudentSupportDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateStudentSupportDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryStudentSupportDraft> {
    const row = await this.prisma.resultRecoveryStudentSupportDraftRecord.create({
      data: {
        resultRecoveryStudentSupportDraftId: uuidv4(),
        schoolId: input.schoolId,
        resultRecoveryPlanId: input.resultRecoveryPlanId,
        studentRef: input.studentRef,
        draftStatus: 'draft',
        draftMode: input.draftMode ?? 'mock',
        safeSupportSummary: input.safeSupportSummary,
        studentSupportBodyJson: (input.studentSupportBodyJson as any) || undefined,
        reflectionPromptRefsJson: (input.reflectionPromptRefsJson as any) || undefined,
        practiceDraftRefsJson: (input.practiceDraftRefsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRecoveryStudentSupportDraftFromPrisma(row);
  }

  async getById(draftId: string): Promise<ResultRecoveryStudentSupportDraft | null> {
    const row = await this.prisma.resultRecoveryStudentSupportDraftRecord.findUnique({ where: { resultRecoveryStudentSupportDraftId: draftId } });
    return row ? mapRecoveryStudentSupportDraftFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryStudentSupportDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryStudentSupportDraftRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryStudentSupportDraftPreviewFromPrisma);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryStudentSupportDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryStudentSupportDraftRecord.findMany({ where: { resultRecoveryPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryStudentSupportDraftPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryStudentSupportDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryStudentSupportDraftRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryStudentSupportDraftPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoveryStudentSupportDraftStatus | string): Promise<ResultRecoveryStudentSupportDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryStudentSupportDraftRecord.findMany({ where: { schoolId, draftStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryStudentSupportDraftPreviewFromPrisma);
  }

  async update(draftId: string, data: Partial<ResultRecoveryStudentSupportDraft>): Promise<ResultRecoveryStudentSupportDraft> {
    const row = await this.prisma.resultRecoveryStudentSupportDraftRecord.update({
      where: { resultRecoveryStudentSupportDraftId: draftId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoveryStudentSupportDraftFromPrisma(row);
  }

  async updateStatus(draftId: string, input: UpdateRecoveryStudentSupportDraftStatusInput): Promise<ResultRecoveryStudentSupportDraft> {
    const data: any = { draftStatus: input.draftStatus, updatedAt: new Date() };
    if (input.draftStatus === 'review_ready') data.reviewReadyAt = new Date();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.draftStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.draftStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoveryStudentSupportDraftRecord.update({
      where: { resultRecoveryStudentSupportDraftId: draftId },
      data,
    });
    return mapRecoveryStudentSupportDraftFromPrisma(row);
  }

  async markReviewReady(draftId: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Student support draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Student support draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryStudentSupportDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoveryParentSupportNoteDraftRepository implements ResultRecoveryParentSupportNoteDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateParentSupportNoteDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryParentSupportNoteDraft> {
    const row = await this.prisma.resultRecoveryParentSupportNoteDraftRecord.create({
      data: {
        resultRecoveryParentSupportNoteDraftId: uuidv4(),
        schoolId: input.schoolId,
        resultRecoveryPlanId: input.resultRecoveryPlanId,
        studentRef: input.studentRef,
        audienceType: input.audienceType ?? 'parent',
        draftStatus: 'draft',
        draftMode: input.draftMode ?? 'mock',
        safeSupportSummary: input.safeSupportSummary,
        parentSupportBodyJson: (input.parentSupportBodyJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRecoveryParentSupportNoteDraftFromPrisma(row);
  }

  async getById(draftId: string): Promise<ResultRecoveryParentSupportNoteDraft | null> {
    const row = await this.prisma.resultRecoveryParentSupportNoteDraftRecord.findUnique({ where: { resultRecoveryParentSupportNoteDraftId: draftId } });
    return row ? mapRecoveryParentSupportNoteDraftFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryParentSupportNoteDraftRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryParentSupportNoteDraftPreviewFromPrisma);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryParentSupportNoteDraftRecord.findMany({ where: { resultRecoveryPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryParentSupportNoteDraftPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryParentSupportNoteDraftRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryParentSupportNoteDraftPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoveryParentSupportNoteDraftStatus | string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryParentSupportNoteDraftRecord.findMany({ where: { schoolId, draftStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryParentSupportNoteDraftPreviewFromPrisma);
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultRecoveryParentSupportNoteDraftPreview[]> {
    const rows = await this.prisma.resultRecoveryParentSupportNoteDraftRecord.findMany({ where: { schoolId, audienceType }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryParentSupportNoteDraftPreviewFromPrisma);
  }

  async update(draftId: string, data: Partial<ResultRecoveryParentSupportNoteDraft>): Promise<ResultRecoveryParentSupportNoteDraft> {
    const row = await this.prisma.resultRecoveryParentSupportNoteDraftRecord.update({
      where: { resultRecoveryParentSupportNoteDraftId: draftId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoveryParentSupportNoteDraftFromPrisma(row);
  }

  async updateStatus(draftId: string, input: UpdateRecoveryParentSupportNoteDraftStatusInput): Promise<ResultRecoveryParentSupportNoteDraft> {
    const data: any = { draftStatus: input.draftStatus, updatedAt: new Date() };
    if (input.draftStatus === 'review_ready') data.reviewReadyAt = new Date();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.draftStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.draftStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoveryParentSupportNoteDraftRecord.update({
      where: { resultRecoveryParentSupportNoteDraftId: draftId },
      data,
    });
    return mapRecoveryParentSupportNoteDraftFromPrisma(row);
  }

  async markReviewReady(draftId: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Parent support note draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Parent support note draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryParentSupportNoteDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoveryCheckpointRepository implements ResultRecoveryCheckpointRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateRecoveryCheckpointInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoveryCheckpoint> {
    const row = await this.prisma.resultRecoveryCheckpointRecord.create({
      data: {
        resultRecoveryCheckpointId: uuidv4(),
        schoolId: input.schoolId,
        resultRecoveryPlanId: input.resultRecoveryPlanId,
        studentRef: input.studentRef,
        checkpointStatus: 'draft',
        checkpointMode: input.checkpointMode ?? 'mock',
        checkpointType: input.checkpointType ?? 'progress_check',
        safeCheckpointSummary: input.safeCheckpointSummary,
        checkpointCriteriaJson: (input.checkpointCriteriaJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRecoveryCheckpointFromPrisma(row);
  }

  async getById(checkpointId: string): Promise<ResultRecoveryCheckpoint | null> {
    const row = await this.prisma.resultRecoveryCheckpointRecord.findUnique({ where: { resultRecoveryCheckpointId: checkpointId } });
    return row ? mapRecoveryCheckpointFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryCheckpointPreview[]> {
    const rows = await this.prisma.resultRecoveryCheckpointRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryCheckpointPreviewFromPrisma);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryCheckpointPreview[]> {
    const rows = await this.prisma.resultRecoveryCheckpointRecord.findMany({ where: { resultRecoveryPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryCheckpointPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoveryCheckpointPreview[]> {
    const rows = await this.prisma.resultRecoveryCheckpointRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryCheckpointPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoveryCheckpointStatus | string): Promise<ResultRecoveryCheckpointPreview[]> {
    const rows = await this.prisma.resultRecoveryCheckpointRecord.findMany({ where: { schoolId, checkpointStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryCheckpointPreviewFromPrisma);
  }

  async listByType(schoolId: string, type: string): Promise<ResultRecoveryCheckpointPreview[]> {
    const rows = await this.prisma.resultRecoveryCheckpointRecord.findMany({ where: { schoolId, checkpointType: type }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryCheckpointPreviewFromPrisma);
  }

  async update(checkpointId: string, data: Partial<ResultRecoveryCheckpoint>): Promise<ResultRecoveryCheckpoint> {
    const row = await this.prisma.resultRecoveryCheckpointRecord.update({
      where: { resultRecoveryCheckpointId: checkpointId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoveryCheckpointFromPrisma(row);
  }

  async updateStatus(checkpointId: string, input: UpdateRecoveryCheckpointStatusInput): Promise<ResultRecoveryCheckpoint> {
    const data: any = { checkpointStatus: input.checkpointStatus, updatedAt: new Date() };
    if (input.checkpointStatus === 'scheduled_mock') data.scheduledMockAt = new Date();
    if (input.checkpointStatus === 'completed_mock') data.completedMockAt = new Date();
    if (input.checkpointStatus === 'cancelled') data.cancelledAt = new Date();
    if (input.checkpointStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoveryCheckpointRecord.update({
      where: { resultRecoveryCheckpointId: checkpointId },
      data,
    });
    return mapRecoveryCheckpointFromPrisma(row);
  }

  async scheduleMock(checkpointId: string): Promise<ResultRecoveryCheckpoint> {
    return this.updateStatus(checkpointId, { checkpointStatus: 'scheduled_mock', reasonCode: 'scheduled', safeMessage: 'Checkpoint mock scheduled' });
  }

  async completeMock(checkpointId: string): Promise<ResultRecoveryCheckpoint> {
    return this.updateStatus(checkpointId, { checkpointStatus: 'completed_mock', reasonCode: 'completed', safeMessage: 'Checkpoint mock completed' });
  }

  async cancel(checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryCheckpoint> {
    return this.updateStatus(checkpointId, { checkpointStatus: 'cancelled', reasonCode, safeMessage });
  }

  async void(checkpointId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoveryCheckpoint> {
    return this.updateStatus(checkpointId, { checkpointStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoverySummaryRepository implements ResultRecoverySummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateRecoverySummaryInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultRecoverySummary> {
    const row = await this.prisma.resultRecoverySummaryRecord.create({
      data: {
        resultRecoverySummaryId: uuidv4(),
        schoolId: input.schoolId,
        studentRef: input.studentRef || null,
        summaryScope: (input.summaryScope as string) ?? 'school',
        summaryStatus: 'active',
        safeSummary: input.safeSummary,
        planCountsJson: (input.planCountsJson as any) || undefined,
        objectiveCountsJson: (input.objectiveCountsJson as any) || undefined,
        checkpointCountsJson: (input.checkpointCountsJson as any) || undefined,
      },
    });
    return mapRecoverySummaryFromPrisma(row);
  }

  async getById(summaryId: string): Promise<ResultRecoverySummary | null> {
    const row = await this.prisma.resultRecoverySummaryRecord.findUnique({ where: { resultRecoverySummaryId: summaryId } });
    return row ? mapRecoverySummaryFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoverySummaryPreview[]> {
    const rows = await this.prisma.resultRecoverySummaryRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoverySummaryPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultRecoverySummaryPreview[]> {
    const rows = await this.prisma.resultRecoverySummaryRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoverySummaryPreviewFromPrisma);
  }

  async listByScope(schoolId: string, scope: ResultRecoverySummaryScope | string): Promise<ResultRecoverySummaryPreview[]> {
    const rows = await this.prisma.resultRecoverySummaryRecord.findMany({ where: { schoolId, summaryScope: scope as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoverySummaryPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultRecoverySummaryStatus | string): Promise<ResultRecoverySummaryPreview[]> {
    const rows = await this.prisma.resultRecoverySummaryRecord.findMany({ where: { schoolId, summaryStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoverySummaryPreviewFromPrisma);
  }

  async update(summaryId: string, data: Partial<ResultRecoverySummary>): Promise<ResultRecoverySummary> {
    const row = await this.prisma.resultRecoverySummaryRecord.update({
      where: { resultRecoverySummaryId: summaryId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapRecoverySummaryFromPrisma(row);
  }

  async updateStatus(summaryId: string, input: UpdateRecoverySummaryStatusInput): Promise<ResultRecoverySummary> {
    const data: any = { summaryStatus: input.summaryStatus, updatedAt: new Date() };
    if (input.summaryStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultRecoverySummaryRecord.update({
      where: { resultRecoverySummaryId: summaryId },
      data,
    });
    return mapRecoverySummaryFromPrisma(row);
  }

  async refresh(summaryId: string): Promise<ResultRecoverySummary> {
    const row = await this.prisma.resultRecoverySummaryRecord.update({
      where: { resultRecoverySummaryId: summaryId },
      data: { refreshedAt: new Date(), updatedAt: new Date() },
    });
    return mapRecoverySummaryFromPrisma(row);
  }

  async markStale(summaryId: string): Promise<ResultRecoverySummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'stale', reasonCode: 'stale', safeMessage: 'Summary marked stale' });
  }

  async block(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(summaryId: string, reasonCode: string, safeMessage: string): Promise<ResultRecoverySummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultRecoveryAuditRepository implements ResultRecoveryAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(event: ResultRecoveryAuditEvent): Promise<ResultRecoveryAuditEvent> {
    const row = await this.prisma.resultRecoveryAuditRecord.create({
      data: {
        resultRecoveryAuditId: uuidv4(),
        schoolId: event.schoolId,
        resultRecoveryPlanId: event.resultRecoveryPlanId || null,
        resultRecoveryObjectiveId: event.resultRecoveryObjectiveId || null,
        resultRecoveryStepId: event.resultRecoveryStepId || null,
        resultRecoveryPracticeDraftId: event.resultRecoveryPracticeDraftId || null,
        resultRecoveryResourceRecommendationId: event.resultRecoveryResourceRecommendationId || null,
        resultRecoveryTeacherReviewPacketId: event.resultRecoveryTeacherReviewPacketId || null,
        resultRecoveryStudentSupportDraftId: event.resultRecoveryStudentSupportDraftId || null,
        resultRecoveryParentSupportNoteDraftId: event.resultRecoveryParentSupportNoteDraftId || null,
        resultRecoveryCheckpointId: event.resultRecoveryCheckpointId || null,
        resultRecoverySummaryId: event.resultRecoverySummaryId || null,
        actorId: event.actorId,
        actorRole: event.actorRole,
        eventType: event.eventType,
        decision: event.decision,
        safeSummary: event.safeSummary,
        reasonCodesJson: (event.reasonCodesJson as any) || undefined,
        metadataJson: (event.metadataJson as any) || undefined,
        requestId: event.requestId || null,
        correlationId: event.correlationId || null,
      },
    });
    return mapRecoveryAuditFromPrisma(row);
  }

  async getById(auditId: string): Promise<ResultRecoveryAuditEvent | null> {
    const row = await this.prisma.resultRecoveryAuditRecord.findUnique({ where: { resultRecoveryAuditId: auditId } });
    return row ? mapRecoveryAuditFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultRecoveryAuditEvent[]> {
    const rows = await this.prisma.resultRecoveryAuditRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryAuditFromPrisma);
  }

  async listByPlanId(planId: string): Promise<ResultRecoveryAuditEvent[]> {
    const rows = await this.prisma.resultRecoveryAuditRecord.findMany({ where: { resultRecoveryPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryAuditFromPrisma);
  }

  async listByObjectiveId(objectiveId: string): Promise<ResultRecoveryAuditEvent[]> {
    const rows = await this.prisma.resultRecoveryAuditRecord.findMany({ where: { resultRecoveryObjectiveId: objectiveId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryAuditFromPrisma);
  }

  async listByStepId(stepId: string): Promise<ResultRecoveryAuditEvent[]> {
    const rows = await this.prisma.resultRecoveryAuditRecord.findMany({ where: { resultRecoveryStepId: stepId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryAuditFromPrisma);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultRecoveryAuditEvent[]> {
    const rows = await this.prisma.resultRecoveryAuditRecord.findMany({ where: { schoolId, eventType }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapRecoveryAuditFromPrisma);
  }
}

export class PrismaResultRecoveryIdempotencyRepository implements ResultRecoveryIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<ResultRecoveryIdempotencyEntry> {
    const row = await this.prisma.resultRecoveryIdempotencyRecord.create({
      data: {
        resultRecoveryIdempotencyId: uuidv4(),
        schoolId: input.schoolId,
        operation: input.operation,
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        status: input.status || 'in_progress',
        resourceType: input.resourceType ?? null,
        resourceId: input.resourceId ?? null,
        safeResultSummary: input.safeResultSummary ?? null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      },
    });
    return mapRecoveryIdempotencyFromPrisma(row);
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultRecoveryIdempotencyEntry | null> {
    const row = await this.prisma.resultRecoveryIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    }).catch(() => null);
    return row ? mapRecoveryIdempotencyFromPrisma(row) : null;
  }

  async updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<ResultRecoveryIdempotencyEntry> {
    const data: any = { status, updatedAt: new Date() };
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const row = await this.prisma.resultRecoveryIdempotencyRecord.update({
      where: { resultRecoveryIdempotencyId: idempotencyId },
      data,
    });
    return mapRecoveryIdempotencyFromPrisma(row);
  }

  async expire(idempotencyId: string): Promise<ResultRecoveryIdempotencyEntry> {
    return this.updateStatus(idempotencyId, 'expired');
  }
}
