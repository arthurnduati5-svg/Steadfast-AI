import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import type {
  ResultFollowUpCase,
  CreateFollowUpCaseInput,
  ResultFollowUpCasePreview,
  UpdateFollowUpCaseStatusInput,
} from '../contracts/resultFollowUpCaseContracts';
import type {
  ResultFollowUpSignal,
  CreateFollowUpSignalInput,
  ResultFollowUpSignalPreview,
  UpdateFollowUpSignalStatusInput,
} from '../contracts/resultFollowUpSignalContracts';
import type {
  ResultFollowUpActionPlan,
  CreateActionPlanInput,
  ResultFollowUpActionPlanPreview,
  UpdateActionPlanStatusInput,
} from '../contracts/resultFollowUpActionPlanContracts';
import type {
  TeacherFollowUpQueueItem,
  CreateTeacherQueueItemInput,
  TeacherFollowUpQueueItemPreview,
  UpdateTeacherQueueStatusInput,
} from '../contracts/teacherFollowUpQueueContracts';
import type {
  ParentGuidanceDraft,
  CreateParentGuidanceDraftInput,
  ParentGuidanceDraftPreview,
  UpdateParentGuidanceDraftStatusInput,
} from '../contracts/parentGuidanceDraftContracts';
import type {
  StudentReflectionTaskDraft,
  CreateStudentReflectionTaskDraftInput,
  StudentReflectionTaskDraftPreview,
  UpdateStudentReflectionDraftStatusInput,
} from '../contracts/studentReflectionTaskDraftContracts';
import type {
  FollowUpReviewWindow,
  CreateReviewWindowInput,
  FollowUpReviewWindowPreview,
  UpdateReviewWindowStatusInput,
} from '../contracts/followUpReviewWindowContracts';
import type {
  FollowUpEscalationPlan,
  CreateEscalationPlanInput,
  FollowUpEscalationPlanPreview,
  UpdateEscalationPlanStatusInput,
} from '../contracts/followUpEscalationPlanContracts';
import type {
  FollowUpSummary,
  CreateFollowUpSummaryInput,
  FollowUpSummaryPreview,
  UpdateFollowUpSummaryStatusInput,
} from '../contracts/followUpSummaryContracts';
import type {
  FollowUpAuditEvent,
  FollowUpIdempotencyEntry,
  ResultFollowUpCaseStatus,
  ResultFollowUpCaseType,
  ResultFollowUpCasePriority,
  ResultFollowUpSignalStatus,
  ResultFollowUpSignalType,
  ResultFollowUpSignalSeverity,
  ResultFollowUpActionPlanStatus,
  TeacherFollowUpQueueStatus,
  ParentGuidanceDraftStatus,
  StudentReflectionTaskDraftStatus,
  FollowUpReviewWindowStatus,
  FollowUpEscalationPlanStatus,
  FollowUpSummaryStatus,
} from '../contracts';
import type {
  ResultFollowUpCaseRepository,
  ResultFollowUpSignalRepository,
  ResultFollowUpActionPlanRepository,
  TeacherFollowUpQueueRepository,
  ParentGuidanceDraftRepository,
  StudentReflectionTaskDraftRepository,
  FollowUpReviewWindowRepository,
  FollowUpEscalationPlanRepository,
  FollowUpSummaryRepository,
  FollowUpAuditRepository,
  FollowUpIdempotencyRepository,
} from '../contracts';

function mapFollowUpCaseFromPrisma(row: any): ResultFollowUpCase {
  return {
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    schoolId: row.schoolId,
    studentRef: row.studentRef,
    resultFinalizationDecisionId: row.resultFinalizationDecisionId || null,
    resultReleaseReadinessId: row.resultReleaseReadinessId || null,
    resultReleasePacketId: row.resultReleasePacketId || null,
    resultReportCardAssemblyId: row.resultReportCardAssemblyId || null,
    resultReportCardAudienceProjectionId: row.resultReportCardAudienceProjectionId || null,
    resultReportCardAccessGrantId: row.resultReportCardAccessGrantId || null,
    resultReportCardAccessSummaryId: row.resultReportCardAccessSummaryId || null,
    caseStatus: row.caseStatus,
    caseType: row.caseType,
    casePriority: row.casePriority,
    caseMode: row.caseMode,
    safeCaseSummary: row.safeCaseSummary,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    triggerReasonsJson: (row.triggerReasonsJson as Record<string, unknown>) || null,
    allowedActionsJson: (row.allowedActionsJson as Record<string, unknown>) || null,
    blockedActionsJson: (row.blockedActionsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    openedAt: row.openedAt?.toISOString() || null,
    triagedAt: row.triagedAt?.toISOString() || null,
    plannedAt: row.plannedAt?.toISOString() || null,
    reviewedAt: row.reviewedAt?.toISOString() || null,
    closedAt: row.closedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapFollowUpCasePreviewFromPrisma(row: any): ResultFollowUpCasePreview {
  return {
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    schoolId: row.schoolId,
    studentRef: row.studentRef,
    caseStatus: row.caseStatus,
    caseType: row.caseType,
    casePriority: row.casePriority,
    caseMode: row.caseMode,
    safeCaseSummary: row.safeCaseSummary,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
  };
}

function mapFollowUpSignalFromPrisma(row: any): ResultFollowUpSignal {
  return {
    resultFollowUpSignalId: row.resultFollowUpSignalId,
    schoolId: row.schoolId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    signalStatus: row.signalStatus,
    signalType: row.signalType,
    signalSeverity: row.signalSeverity,
    signalSource: row.signalSource,
    safeSignalSummary: row.safeSignalSummary,
    evidenceRefsJson: (row.evidenceRefsJson as Record<string, unknown>) || null,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapFollowUpSignalPreviewFromPrisma(row: any): ResultFollowUpSignalPreview {
  return {
    resultFollowUpSignalId: row.resultFollowUpSignalId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    signalStatus: row.signalStatus,
    signalType: row.signalType,
    signalSeverity: row.signalSeverity,
    safeSignalSummary: row.safeSignalSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapActionPlanFromPrisma(row: any): ResultFollowUpActionPlan {
  return {
    resultFollowUpActionPlanId: row.resultFollowUpActionPlanId,
    schoolId: row.schoolId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    planStatus: row.planStatus,
    planMode: row.planMode,
    safePlanSummary: row.safePlanSummary,
    recommendedActionsJson: (row.recommendedActionsJson as Record<string, unknown>) || null,
    teacherReviewNotesJson: (row.teacherReviewNotesJson as Record<string, unknown>) || null,
    parentSafeGuidanceRefsJson: (row.parentSafeGuidanceRefsJson as Record<string, unknown>) || null,
    studentReflectionRefsJson: (row.studentReflectionRefsJson as Record<string, unknown>) || null,
    reviewWindowRefsJson: (row.reviewWindowRefsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    draftedAt: row.draftedAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapActionPlanPreviewFromPrisma(row: any): ResultFollowUpActionPlanPreview {
  return {
    resultFollowUpActionPlanId: row.resultFollowUpActionPlanId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    planStatus: row.planStatus,
    planMode: row.planMode,
    safePlanSummary: row.safePlanSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapTeacherQueueItemFromPrisma(row: any): TeacherFollowUpQueueItem {
  return {
    teacherFollowUpQueueItemId: row.teacherFollowUpQueueItemId,
    schoolId: row.schoolId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    resultFollowUpActionPlanId: row.resultFollowUpActionPlanId || null,
    studentRef: row.studentRef,
    teacherRef: row.teacherRef,
    queueStatus: row.queueStatus,
    queueMode: row.queueMode,
    queuePriority: row.queuePriority,
    safeQueueSummary: row.safeQueueSummary,
    suggestedNextActionsJson: (row.suggestedNextActionsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    queuedAt: row.queuedAt?.toISOString() || null,
    acknowledgedAt: row.acknowledgedAt?.toISOString() || null,
    completedAt: row.completedAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapTeacherQueueItemPreviewFromPrisma(row: any): TeacherFollowUpQueueItemPreview {
  return {
    teacherFollowUpQueueItemId: row.teacherFollowUpQueueItemId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    teacherRef: row.teacherRef,
    queueStatus: row.queueStatus,
    queuePriority: row.queuePriority,
    safeQueueSummary: row.safeQueueSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapParentGuidanceDraftFromPrisma(row: any): ParentGuidanceDraft {
  return {
    parentGuidanceDraftId: row.parentGuidanceDraftId,
    schoolId: row.schoolId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    resultFollowUpActionPlanId: row.resultFollowUpActionPlanId || null,
    studentRef: row.studentRef,
    audienceType: row.audienceType,
    draftStatus: row.draftStatus,
    draftMode: row.draftMode,
    safeGuidanceSummary: row.safeGuidanceSummary,
    safeGuidanceBodyJson: (row.safeGuidanceBodyJson as Record<string, unknown>) || null,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    reviewedAt: row.reviewedAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapParentGuidanceDraftPreviewFromPrisma(row: any): ParentGuidanceDraftPreview {
  return {
    parentGuidanceDraftId: row.parentGuidanceDraftId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    draftStatus: row.draftStatus,
    safeGuidanceSummary: row.safeGuidanceSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapStudentReflectionDraftFromPrisma(row: any): StudentReflectionTaskDraft {
  return {
    studentReflectionTaskDraftId: row.studentReflectionTaskDraftId,
    schoolId: row.schoolId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    resultFollowUpActionPlanId: row.resultFollowUpActionPlanId || null,
    studentRef: row.studentRef,
    draftStatus: row.draftStatus,
    draftMode: row.draftMode,
    safeReflectionPrompt: row.safeReflectionPrompt,
    reflectionObjectiveRefsJson: (row.reflectionObjectiveRefsJson as Record<string, unknown>) || null,
    scaffoldStepsJson: (row.scaffoldStepsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    reviewedAt: row.reviewedAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapStudentReflectionDraftPreviewFromPrisma(row: any): StudentReflectionTaskDraftPreview {
  return {
    studentReflectionTaskDraftId: row.studentReflectionTaskDraftId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    draftStatus: row.draftStatus,
    safeReflectionPrompt: row.safeReflectionPrompt,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapReviewWindowFromPrisma(row: any): FollowUpReviewWindow {
  return {
    followUpReviewWindowId: row.followUpReviewWindowId,
    schoolId: row.schoolId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    windowStatus: row.windowStatus,
    windowMode: row.windowMode,
    reviewWindowStartAt: row.reviewWindowStartAt?.toISOString() || null,
    reviewWindowEndAt: row.reviewWindowEndAt?.toISOString() || null,
    safeWindowSummary: row.safeWindowSummary,
    reviewCriteriaJson: (row.reviewCriteriaJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    scheduledMockAt: row.scheduledMockAt?.toISOString() || null,
    completedMockAt: row.completedMockAt?.toISOString() || null,
    cancelledAt: row.cancelledAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapReviewWindowPreviewFromPrisma(row: any): FollowUpReviewWindowPreview {
  return {
    followUpReviewWindowId: row.followUpReviewWindowId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    windowStatus: row.windowStatus,
    safeWindowSummary: row.safeWindowSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapEscalationPlanFromPrisma(row: any): FollowUpEscalationPlan {
  return {
    followUpEscalationPlanId: row.followUpEscalationPlanId,
    schoolId: row.schoolId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    escalationStatus: row.escalationStatus,
    escalationMode: row.escalationMode,
    escalationLevel: row.escalationLevel,
    safeEscalationSummary: row.safeEscalationSummary,
    reviewerRoleTargetsJson: (row.reviewerRoleTargetsJson as Record<string, unknown>) || null,
    allowedDisclosureJson: (row.allowedDisclosureJson as Record<string, unknown>) || null,
    blockedDisclosureJson: (row.blockedDisclosureJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    reviewedAt: row.reviewedAt?.toISOString() || null,
    approvedForFutureUseAt: row.approvedForFutureUseAt?.toISOString() || null,
    suppressedAt: row.suppressedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapEscalationPlanPreviewFromPrisma(row: any): FollowUpEscalationPlanPreview {
  return {
    followUpEscalationPlanId: row.followUpEscalationPlanId,
    resultFollowUpCaseId: row.resultFollowUpCaseId,
    studentRef: row.studentRef,
    escalationStatus: row.escalationStatus,
    escalationLevel: row.escalationLevel,
    safeEscalationSummary: row.safeEscalationSummary,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapFollowUpSummaryFromPrisma(row: any): FollowUpSummary {
  return {
    followUpSummaryId: row.followUpSummaryId,
    schoolId: row.schoolId,
    studentRef: row.studentRef || null,
    summaryScope: row.summaryScope,
    summaryStatus: row.summaryStatus,
    safeSummary: row.safeSummary,
    caseCountsJson: (row.caseCountsJson as Record<string, unknown>) || null,
    priorityCountsJson: (row.priorityCountsJson as Record<string, unknown>) || null,
    statusCountsJson: (row.statusCountsJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    refreshedAt: row.refreshedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapFollowUpSummaryPreviewFromPrisma(row: any): FollowUpSummaryPreview {
  return {
    followUpSummaryId: row.followUpSummaryId,
    schoolId: row.schoolId,
    studentRef: row.studentRef || null,
    summaryScope: row.summaryScope,
    summaryStatus: row.summaryStatus,
    safeSummary: row.safeSummary,
    createdAt: row.createdAt?.toISOString() || '',
    refreshedAt: row.refreshedAt?.toISOString() || null,
  };
}

function mapFollowUpAuditFromPrisma(row: any): FollowUpAuditEvent {
  return {
    followUpAuditId: row.followUpAuditId,
    schoolId: row.schoolId,
    resultFollowUpCaseId: row.resultFollowUpCaseId || null,
    resultFollowUpSignalId: row.resultFollowUpSignalId || null,
    resultFollowUpActionPlanId: row.resultFollowUpActionPlanId || null,
    teacherFollowUpQueueItemId: row.teacherFollowUpQueueItemId || null,
    parentGuidanceDraftId: row.parentGuidanceDraftId || null,
    studentReflectionTaskDraftId: row.studentReflectionTaskDraftId || null,
    followUpReviewWindowId: row.followUpReviewWindowId || null,
    followUpEscalationPlanId: row.followUpEscalationPlanId || null,
    followUpSummaryId: row.followUpSummaryId || null,
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

function mapFollowUpIdempotencyFromPrisma(row: any): FollowUpIdempotencyEntry {
  return {
    followUpIdempotencyId: row.followUpIdempotencyId,
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

export class PrismaResultFollowUpCaseRepository implements ResultFollowUpCaseRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateFollowUpCaseInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultFollowUpCase> {
    const row = await this.prisma.resultFollowUpCaseRecord.create({
      data: {
        resultFollowUpCaseId: uuidv4(),
        schoolId: input.schoolId,
        studentRef: input.studentRef,
        resultFinalizationDecisionId: input.resultFinalizationDecisionId || null,
        resultReleaseReadinessId: input.resultReleaseReadinessId || null,
        resultReleasePacketId: input.resultReleasePacketId || null,
        resultReportCardAssemblyId: input.resultReportCardAssemblyId || null,
        resultReportCardAudienceProjectionId: input.resultReportCardAudienceProjectionId || null,
        resultReportCardAccessGrantId: input.resultReportCardAccessGrantId || null,
        resultReportCardAccessSummaryId: input.resultReportCardAccessSummaryId || null,
        caseStatus: 'draft',
        caseType: input.caseType ?? 'general_growth_support',
        casePriority: input.casePriority ?? 'medium',
        caseMode: input.caseMode ?? 'mock_action_only',
        safeCaseSummary: input.safeCaseSummary,
        sourceRefsJson: (input.sourceRefs as any) || undefined,
        triggerReasonsJson: (input.triggerReasons as any) || undefined,
        allowedActionsJson: (input.allowedActions as any) || undefined,
        blockedActionsJson: (input.blockedActions as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodes as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    return mapFollowUpCaseFromPrisma(row);
  }

  async getById(caseId: string): Promise<ResultFollowUpCase | null> {
    const row = await this.prisma.resultFollowUpCaseRecord.findUnique({ where: { resultFollowUpCaseId: caseId } });
    return row ? mapFollowUpCaseFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultFollowUpCasePreview[]> {
    const rows = await this.prisma.resultFollowUpCaseRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpCasePreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultFollowUpCasePreview[]> {
    const rows = await this.prisma.resultFollowUpCaseRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpCasePreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultFollowUpCaseStatus | string): Promise<ResultFollowUpCasePreview[]> {
    const rows = await this.prisma.resultFollowUpCaseRecord.findMany({ where: { schoolId, caseStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpCasePreviewFromPrisma);
  }

  async listByPriority(schoolId: string, priority: ResultFollowUpCasePriority | string): Promise<ResultFollowUpCasePreview[]> {
    const rows = await this.prisma.resultFollowUpCaseRecord.findMany({ where: { schoolId, casePriority: priority as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpCasePreviewFromPrisma);
  }

  async listByType(schoolId: string, type: ResultFollowUpCaseType | string): Promise<ResultFollowUpCasePreview[]> {
    const rows = await this.prisma.resultFollowUpCaseRecord.findMany({ where: { schoolId, caseType: type as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpCasePreviewFromPrisma);
  }

  async update(caseId: string, data: Partial<ResultFollowUpCase>): Promise<ResultFollowUpCase> {
    const row = await this.prisma.resultFollowUpCaseRecord.update({
      where: { resultFollowUpCaseId: caseId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapFollowUpCaseFromPrisma(row);
  }

  async updateStatus(caseId: string, input: UpdateFollowUpCaseStatusInput): Promise<ResultFollowUpCase> {
    const data: any = { caseStatus: input.caseStatus, updatedAt: new Date() };
    if (input.caseStatus === 'opened') data.openedAt = new Date();
    if (input.caseStatus === 'triaged') data.triagedAt = new Date();
    if (input.caseStatus === 'planned') data.plannedAt = new Date();
    if (input.caseStatus === 'under_review') data.reviewedAt = new Date();
    if (input.caseStatus === 'closed') data.closedAt = new Date();
    if (input.caseStatus === 'blocked') data.blockedAt = new Date();
    if (input.caseStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultFollowUpCaseRecord.update({
      where: { resultFollowUpCaseId: caseId },
      data,
    });
    return mapFollowUpCaseFromPrisma(row);
  }

  async open(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'opened', reasonCode, safeMessage });
  }

  async triage(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'triaged', reasonCode, safeMessage });
  }

  async markPlanned(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'planned', reasonCode, safeMessage });
  }

  async markUnderReview(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'under_review', reasonCode, safeMessage });
  }

  async close(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'closed', reasonCode, safeMessage });
  }

  async block(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(caseId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpCase> {
    return this.updateStatus(caseId, { caseStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultFollowUpSignalRepository implements ResultFollowUpSignalRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateFollowUpSignalInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultFollowUpSignal> {
    const row = await this.prisma.resultFollowUpSignalRecord.create({
      data: {
        resultFollowUpSignalId: uuidv4(),
        schoolId: input.schoolId,
        resultFollowUpCaseId: input.resultFollowUpCaseId,
        studentRef: input.studentRef,
        signalStatus: 'active',
        signalType: input.signalType ?? 'teacher_review_requested',
        signalSeverity: input.signalSeverity ?? 'medium',
        signalSource: input.signalSource,
        safeSignalSummary: input.safeSignalSummary,
        evidenceRefsJson: (input.evidenceRefs as any) || undefined,
        reasonCodesJson: (input.reasonCodes as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapFollowUpSignalFromPrisma(row);
  }

  async getById(signalId: string): Promise<ResultFollowUpSignal | null> {
    const row = await this.prisma.resultFollowUpSignalRecord.findUnique({ where: { resultFollowUpSignalId: signalId } });
    return row ? mapFollowUpSignalFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultFollowUpSignalPreview[]> {
    const rows = await this.prisma.resultFollowUpSignalRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSignalPreviewFromPrisma);
  }

  async listByCaseId(caseId: string): Promise<ResultFollowUpSignalPreview[]> {
    const rows = await this.prisma.resultFollowUpSignalRecord.findMany({ where: { resultFollowUpCaseId: caseId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSignalPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultFollowUpSignalPreview[]> {
    const rows = await this.prisma.resultFollowUpSignalRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSignalPreviewFromPrisma);
  }

  async listBySeverity(schoolId: string, severity: ResultFollowUpSignalSeverity | string): Promise<ResultFollowUpSignalPreview[]> {
    const rows = await this.prisma.resultFollowUpSignalRecord.findMany({ where: { schoolId, signalSeverity: severity as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSignalPreviewFromPrisma);
  }

  async listByType(schoolId: string, type: ResultFollowUpSignalType | string): Promise<ResultFollowUpSignalPreview[]> {
    const rows = await this.prisma.resultFollowUpSignalRecord.findMany({ where: { schoolId, signalType: type as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSignalPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultFollowUpSignalStatus | string): Promise<ResultFollowUpSignalPreview[]> {
    const rows = await this.prisma.resultFollowUpSignalRecord.findMany({ where: { schoolId, signalStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSignalPreviewFromPrisma);
  }

  async update(signalId: string, data: Partial<ResultFollowUpSignal>): Promise<ResultFollowUpSignal> {
    const row = await this.prisma.resultFollowUpSignalRecord.update({
      where: { resultFollowUpSignalId: signalId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapFollowUpSignalFromPrisma(row);
  }

  async updateStatus(signalId: string, input: UpdateFollowUpSignalStatusInput): Promise<ResultFollowUpSignal> {
    const data: any = { signalStatus: input.signalStatus, updatedAt: new Date() };
    if (input.signalStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.signalStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultFollowUpSignalRecord.update({
      where: { resultFollowUpSignalId: signalId },
      data,
    });
    return mapFollowUpSignalFromPrisma(row);
  }

  async suppress(signalId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpSignal> {
    return this.updateStatus(signalId, { signalStatus: 'suppressed', reasonCode, safeMessage });
  }

  async void(signalId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpSignal> {
    return this.updateStatus(signalId, { signalStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaResultFollowUpActionPlanRepository implements ResultFollowUpActionPlanRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateActionPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultFollowUpActionPlan> {
    const row = await this.prisma.resultFollowUpActionPlanRecord.create({
      data: {
        resultFollowUpActionPlanId: uuidv4(),
        schoolId: input.schoolId,
        resultFollowUpCaseId: input.resultFollowUpCaseId,
        studentRef: input.studentRef,
        planStatus: 'draft',
        planMode: input.planMode ?? 'mock_action_only',
        safePlanSummary: input.safePlanSummary,
        recommendedActionsJson: (input.recommendedActions as any) || undefined,
        teacherReviewNotesJson: (input.teacherReviewNotes as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
        draftedAt: new Date(),
      },
    });
    return mapActionPlanFromPrisma(row);
  }

  async getById(planId: string): Promise<ResultFollowUpActionPlan | null> {
    const row = await this.prisma.resultFollowUpActionPlanRecord.findUnique({ where: { resultFollowUpActionPlanId: planId } });
    return row ? mapActionPlanFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultFollowUpActionPlanPreview[]> {
    const rows = await this.prisma.resultFollowUpActionPlanRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapActionPlanPreviewFromPrisma);
  }

  async listByCaseId(caseId: string): Promise<ResultFollowUpActionPlanPreview[]> {
    const rows = await this.prisma.resultFollowUpActionPlanRecord.findMany({ where: { resultFollowUpCaseId: caseId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapActionPlanPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultFollowUpActionPlanPreview[]> {
    const rows = await this.prisma.resultFollowUpActionPlanRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapActionPlanPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ResultFollowUpActionPlanStatus | string): Promise<ResultFollowUpActionPlanPreview[]> {
    const rows = await this.prisma.resultFollowUpActionPlanRecord.findMany({ where: { schoolId, planStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapActionPlanPreviewFromPrisma);
  }

  async update(planId: string, data: Partial<ResultFollowUpActionPlan>): Promise<ResultFollowUpActionPlan> {
    const row = await this.prisma.resultFollowUpActionPlanRecord.update({
      where: { resultFollowUpActionPlanId: planId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapActionPlanFromPrisma(row);
  }

  async updateStatus(planId: string, input: UpdateActionPlanStatusInput): Promise<ResultFollowUpActionPlan> {
    const data: any = { planStatus: input.planStatus, updatedAt: new Date() };
    if (input.planStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.planStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.planStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.resultFollowUpActionPlanRecord.update({
      where: { resultFollowUpActionPlanId: planId },
      data,
    });
    return mapActionPlanFromPrisma(row);
  }

  async markReviewReady(planId: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'teacher_review_ready', reasonCode: 'review_ready', safeMessage: 'Action plan ready for review' });
  }

  async approveForFutureUse(planId: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Action plan approved for future use' });
  }

  async suppress(planId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(planId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(planId: string, reasonCode: string, safeMessage: string): Promise<ResultFollowUpActionPlan> {
    return this.updateStatus(planId, { planStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaTeacherFollowUpQueueRepository implements TeacherFollowUpQueueRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateTeacherQueueItemInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<TeacherFollowUpQueueItem> {
    const row = await this.prisma.teacherFollowUpQueueItemRecord.create({
      data: {
        teacherFollowUpQueueItemId: uuidv4(),
        schoolId: input.schoolId,
        resultFollowUpCaseId: input.resultFollowUpCaseId,
        resultFollowUpActionPlanId: input.resultFollowUpActionPlanId || null,
        studentRef: input.studentRef,
        teacherRef: input.teacherRef,
        queueStatus: 'draft',
        queueMode: input.queueMode ?? 'mock_review',
        queuePriority: input.queuePriority ?? 'medium',
        safeQueueSummary: input.safeQueueSummary,
        suggestedNextActionsJson: (input.suggestedNextActions as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapTeacherQueueItemFromPrisma(row);
  }

  async getById(queueItemId: string): Promise<TeacherFollowUpQueueItem | null> {
    const row = await this.prisma.teacherFollowUpQueueItemRecord.findUnique({ where: { teacherFollowUpQueueItemId: queueItemId } });
    return row ? mapTeacherQueueItemFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    const rows = await this.prisma.teacherFollowUpQueueItemRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapTeacherQueueItemPreviewFromPrisma);
  }

  async listByCaseId(caseId: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    const rows = await this.prisma.teacherFollowUpQueueItemRecord.findMany({ where: { resultFollowUpCaseId: caseId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapTeacherQueueItemPreviewFromPrisma);
  }

  async listByActionPlanId(planId: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    const rows = await this.prisma.teacherFollowUpQueueItemRecord.findMany({ where: { resultFollowUpActionPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapTeacherQueueItemPreviewFromPrisma);
  }

  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    const rows = await this.prisma.teacherFollowUpQueueItemRecord.findMany({ where: { schoolId, teacherRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapTeacherQueueItemPreviewFromPrisma);
  }

  async listByPriority(schoolId: string, priority: string): Promise<TeacherFollowUpQueueItemPreview[]> {
    const rows = await this.prisma.teacherFollowUpQueueItemRecord.findMany({ where: { schoolId, queuePriority: priority }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapTeacherQueueItemPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: TeacherFollowUpQueueStatus | string): Promise<TeacherFollowUpQueueItemPreview[]> {
    const rows = await this.prisma.teacherFollowUpQueueItemRecord.findMany({ where: { schoolId, queueStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapTeacherQueueItemPreviewFromPrisma);
  }

  async update(queueItemId: string, data: Partial<TeacherFollowUpQueueItem>): Promise<TeacherFollowUpQueueItem> {
    const row = await this.prisma.teacherFollowUpQueueItemRecord.update({
      where: { teacherFollowUpQueueItemId: queueItemId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapTeacherQueueItemFromPrisma(row);
  }

  async updateStatus(queueItemId: string, input: UpdateTeacherQueueStatusInput): Promise<TeacherFollowUpQueueItem> {
    const data: any = { queueStatus: input.queueStatus, updatedAt: new Date() };
    if (input.queueStatus === 'queued_for_review') data.queuedAt = new Date();
    if (input.queueStatus === 'acknowledged_mock') data.acknowledgedAt = new Date();
    if (input.queueStatus === 'completed_mock') data.completedAt = new Date();
    if (input.queueStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.queueStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.teacherFollowUpQueueItemRecord.update({
      where: { teacherFollowUpQueueItemId: queueItemId },
      data,
    });
    return mapTeacherQueueItemFromPrisma(row);
  }

  async markQueued(queueItemId: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'queued_for_review', reasonCode: 'queued', safeMessage: 'Queue item queued for review' });
  }

  async acknowledge(queueItemId: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'acknowledged_mock', reasonCode: 'acknowledged', safeMessage: 'Queue item acknowledged' });
  }

  async complete(queueItemId: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'completed_mock', reasonCode: 'completed', safeMessage: 'Queue item completed' });
  }

  async suppress(queueItemId: string, reasonCode: string, safeMessage: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(queueItemId: string, reasonCode: string, safeMessage: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(queueItemId: string, reasonCode: string, safeMessage: string): Promise<TeacherFollowUpQueueItem> {
    return this.updateStatus(queueItemId, { queueStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaParentGuidanceDraftRepository implements ParentGuidanceDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateParentGuidanceDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ParentGuidanceDraft> {
    const row = await this.prisma.parentGuidanceDraftRecord.create({
      data: {
        parentGuidanceDraftId: uuidv4(),
        schoolId: input.schoolId,
        resultFollowUpCaseId: input.resultFollowUpCaseId,
        resultFollowUpActionPlanId: input.resultFollowUpActionPlanId || null,
        studentRef: input.studentRef,
        audienceType: input.audienceType ?? 'parent',
        draftStatus: 'draft',
        draftMode: input.draftMode ?? 'mock_only',
        safeGuidanceSummary: input.safeGuidanceSummary,
        safeGuidanceBodyJson: (input.safeGuidanceBody as any) || undefined,
        allowedFieldNamesJson: (input.allowedFieldNames as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNames as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapParentGuidanceDraftFromPrisma(row);
  }

  async getById(draftId: string): Promise<ParentGuidanceDraft | null> {
    const row = await this.prisma.parentGuidanceDraftRecord.findUnique({ where: { parentGuidanceDraftId: draftId } });
    return row ? mapParentGuidanceDraftFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ParentGuidanceDraftPreview[]> {
    const rows = await this.prisma.parentGuidanceDraftRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapParentGuidanceDraftPreviewFromPrisma);
  }

  async listByCaseId(caseId: string): Promise<ParentGuidanceDraftPreview[]> {
    const rows = await this.prisma.parentGuidanceDraftRecord.findMany({ where: { resultFollowUpCaseId: caseId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapParentGuidanceDraftPreviewFromPrisma);
  }

  async listByActionPlanId(planId: string): Promise<ParentGuidanceDraftPreview[]> {
    const rows = await this.prisma.parentGuidanceDraftRecord.findMany({ where: { resultFollowUpActionPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapParentGuidanceDraftPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: ParentGuidanceDraftStatus | string): Promise<ParentGuidanceDraftPreview[]> {
    const rows = await this.prisma.parentGuidanceDraftRecord.findMany({ where: { schoolId, draftStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapParentGuidanceDraftPreviewFromPrisma);
  }

  async update(draftId: string, data: Partial<ParentGuidanceDraft>): Promise<ParentGuidanceDraft> {
    const row = await this.prisma.parentGuidanceDraftRecord.update({
      where: { parentGuidanceDraftId: draftId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapParentGuidanceDraftFromPrisma(row);
  }

  async updateStatus(draftId: string, input: UpdateParentGuidanceDraftStatusInput): Promise<ParentGuidanceDraft> {
    const data: any = { draftStatus: input.draftStatus, updatedAt: new Date() };
    if (input.draftStatus === 'review_ready') data.reviewedAt = new Date();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.draftStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.draftStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.parentGuidanceDraftRecord.update({
      where: { parentGuidanceDraftId: draftId },
      data,
    });
    return mapParentGuidanceDraftFromPrisma(row);
  }

  async markReviewReady(draftId: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Parent guidance draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Parent guidance draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<ParentGuidanceDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaStudentReflectionTaskDraftRepository implements StudentReflectionTaskDraftRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateStudentReflectionTaskDraftInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<StudentReflectionTaskDraft> {
    const row = await this.prisma.studentReflectionTaskDraftRecord.create({
      data: {
        studentReflectionTaskDraftId: uuidv4(),
        schoolId: input.schoolId,
        resultFollowUpCaseId: input.resultFollowUpCaseId,
        resultFollowUpActionPlanId: input.resultFollowUpActionPlanId || null,
        studentRef: input.studentRef,
        draftStatus: 'draft',
        draftMode: input.draftMode ?? 'mock_only',
        safeReflectionPrompt: input.safeReflectionPrompt,
        reflectionObjectiveRefsJson: (input.reflectionObjectiveRefs as any) || undefined,
        scaffoldStepsJson: (input.scaffoldSteps as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapStudentReflectionDraftFromPrisma(row);
  }

  async getById(draftId: string): Promise<StudentReflectionTaskDraft | null> {
    const row = await this.prisma.studentReflectionTaskDraftRecord.findUnique({ where: { studentReflectionTaskDraftId: draftId } });
    return row ? mapStudentReflectionDraftFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<StudentReflectionTaskDraftPreview[]> {
    const rows = await this.prisma.studentReflectionTaskDraftRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapStudentReflectionDraftPreviewFromPrisma);
  }

  async listByCaseId(caseId: string): Promise<StudentReflectionTaskDraftPreview[]> {
    const rows = await this.prisma.studentReflectionTaskDraftRecord.findMany({ where: { resultFollowUpCaseId: caseId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapStudentReflectionDraftPreviewFromPrisma);
  }

  async listByActionPlanId(planId: string): Promise<StudentReflectionTaskDraftPreview[]> {
    const rows = await this.prisma.studentReflectionTaskDraftRecord.findMany({ where: { resultFollowUpActionPlanId: planId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapStudentReflectionDraftPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: StudentReflectionTaskDraftStatus | string): Promise<StudentReflectionTaskDraftPreview[]> {
    const rows = await this.prisma.studentReflectionTaskDraftRecord.findMany({ where: { schoolId, draftStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapStudentReflectionDraftPreviewFromPrisma);
  }

  async update(draftId: string, data: Partial<StudentReflectionTaskDraft>): Promise<StudentReflectionTaskDraft> {
    const row = await this.prisma.studentReflectionTaskDraftRecord.update({
      where: { studentReflectionTaskDraftId: draftId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapStudentReflectionDraftFromPrisma(row);
  }

  async updateStatus(draftId: string, input: UpdateStudentReflectionDraftStatusInput): Promise<StudentReflectionTaskDraft> {
    const data: any = { draftStatus: input.draftStatus, updatedAt: new Date() };
    if (input.draftStatus === 'review_ready') data.reviewedAt = new Date();
    if (input.draftStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.draftStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.draftStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.studentReflectionTaskDraftRecord.update({
      where: { studentReflectionTaskDraftId: draftId },
      data,
    });
    return mapStudentReflectionDraftFromPrisma(row);
  }

  async markReviewReady(draftId: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Student reflection draft ready for review' });
  }

  async approveForFutureUse(draftId: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Student reflection draft approved for future use' });
  }

  async suppress(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(draftId: string, reasonCode: string, safeMessage: string): Promise<StudentReflectionTaskDraft> {
    return this.updateStatus(draftId, { draftStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaFollowUpReviewWindowRepository implements FollowUpReviewWindowRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateReviewWindowInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<FollowUpReviewWindow> {
    const row = await this.prisma.followUpReviewWindowRecord.create({
      data: {
        followUpReviewWindowId: uuidv4(),
        schoolId: input.schoolId,
        resultFollowUpCaseId: input.resultFollowUpCaseId,
        studentRef: input.studentRef,
        windowStatus: 'draft',
        windowMode: input.windowMode ?? 'mock_only',
        reviewWindowStartAt: input.reviewWindowStartAt ? new Date(input.reviewWindowStartAt) : null,
        reviewWindowEndAt: input.reviewWindowEndAt ? new Date(input.reviewWindowEndAt) : null,
        safeWindowSummary: input.safeWindowSummary,
        reviewCriteriaJson: (input.reviewCriteria as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapReviewWindowFromPrisma(row);
  }

  async getById(windowId: string): Promise<FollowUpReviewWindow | null> {
    const row = await this.prisma.followUpReviewWindowRecord.findUnique({ where: { followUpReviewWindowId: windowId } });
    return row ? mapReviewWindowFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<FollowUpReviewWindowPreview[]> {
    const rows = await this.prisma.followUpReviewWindowRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapReviewWindowPreviewFromPrisma);
  }

  async listByCaseId(caseId: string): Promise<FollowUpReviewWindowPreview[]> {
    const rows = await this.prisma.followUpReviewWindowRecord.findMany({ where: { resultFollowUpCaseId: caseId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapReviewWindowPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<FollowUpReviewWindowPreview[]> {
    const rows = await this.prisma.followUpReviewWindowRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapReviewWindowPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: FollowUpReviewWindowStatus | string): Promise<FollowUpReviewWindowPreview[]> {
    const rows = await this.prisma.followUpReviewWindowRecord.findMany({ where: { schoolId, windowStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapReviewWindowPreviewFromPrisma);
  }

  async update(windowId: string, data: Partial<FollowUpReviewWindow>): Promise<FollowUpReviewWindow> {
    const row = await this.prisma.followUpReviewWindowRecord.update({
      where: { followUpReviewWindowId: windowId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapReviewWindowFromPrisma(row);
  }

  async updateStatus(windowId: string, input: UpdateReviewWindowStatusInput): Promise<FollowUpReviewWindow> {
    const data: any = { windowStatus: input.windowStatus, updatedAt: new Date() };
    if (input.windowStatus === 'scheduled_mock') data.scheduledMockAt = new Date();
    if (input.windowStatus === 'completed_mock') data.completedMockAt = new Date();
    if (input.windowStatus === 'cancelled') data.cancelledAt = new Date();
    if (input.windowStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.followUpReviewWindowRecord.update({
      where: { followUpReviewWindowId: windowId },
      data,
    });
    return mapReviewWindowFromPrisma(row);
  }

  async scheduleMock(windowId: string): Promise<FollowUpReviewWindow> {
    return this.updateStatus(windowId, { windowStatus: 'scheduled_mock', reasonCode: 'scheduled', safeMessage: 'Review window mock scheduled' });
  }

  async completeMock(windowId: string): Promise<FollowUpReviewWindow> {
    return this.updateStatus(windowId, { windowStatus: 'completed_mock', reasonCode: 'completed', safeMessage: 'Review window mock completed' });
  }

  async cancel(windowId: string, reasonCode: string, safeMessage: string): Promise<FollowUpReviewWindow> {
    return this.updateStatus(windowId, { windowStatus: 'cancelled', reasonCode, safeMessage });
  }

  async void(windowId: string, reasonCode: string, safeMessage: string): Promise<FollowUpReviewWindow> {
    return this.updateStatus(windowId, { windowStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaFollowUpEscalationPlanRepository implements FollowUpEscalationPlanRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateEscalationPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<FollowUpEscalationPlan> {
    const row = await this.prisma.followUpEscalationPlanRecord.create({
      data: {
        followUpEscalationPlanId: uuidv4(),
        schoolId: input.schoolId,
        resultFollowUpCaseId: input.resultFollowUpCaseId,
        studentRef: input.studentRef,
        escalationStatus: 'draft',
        escalationMode: input.escalationMode ?? 'mock_preparation',
        escalationLevel: input.escalationLevel ?? 'teacher_level_1',
        safeEscalationSummary: input.safeEscalationSummary,
        reviewerRoleTargetsJson: (input.reviewerRoleTargets as any) || undefined,
        allowedDisclosureJson: (input.allowedDisclosure as any) || undefined,
        blockedDisclosureJson: (input.blockedDisclosure as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapEscalationPlanFromPrisma(row);
  }

  async getById(planId: string): Promise<FollowUpEscalationPlan | null> {
    const row = await this.prisma.followUpEscalationPlanRecord.findUnique({ where: { followUpEscalationPlanId: planId } });
    return row ? mapEscalationPlanFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<FollowUpEscalationPlanPreview[]> {
    const rows = await this.prisma.followUpEscalationPlanRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapEscalationPlanPreviewFromPrisma);
  }

  async listByCaseId(caseId: string): Promise<FollowUpEscalationPlanPreview[]> {
    const rows = await this.prisma.followUpEscalationPlanRecord.findMany({ where: { resultFollowUpCaseId: caseId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapEscalationPlanPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<FollowUpEscalationPlanPreview[]> {
    const rows = await this.prisma.followUpEscalationPlanRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapEscalationPlanPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: FollowUpEscalationPlanStatus | string): Promise<FollowUpEscalationPlanPreview[]> {
    const rows = await this.prisma.followUpEscalationPlanRecord.findMany({ where: { schoolId, escalationStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapEscalationPlanPreviewFromPrisma);
  }

  async listByLevel(schoolId: string, level: string): Promise<FollowUpEscalationPlanPreview[]> {
    const rows = await this.prisma.followUpEscalationPlanRecord.findMany({ where: { schoolId, escalationLevel: level }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapEscalationPlanPreviewFromPrisma);
  }

  async update(planId: string, data: Partial<FollowUpEscalationPlan>): Promise<FollowUpEscalationPlan> {
    const row = await this.prisma.followUpEscalationPlanRecord.update({
      where: { followUpEscalationPlanId: planId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapEscalationPlanFromPrisma(row);
  }

  async updateStatus(planId: string, input: UpdateEscalationPlanStatusInput): Promise<FollowUpEscalationPlan> {
    const data: any = { escalationStatus: input.escalationStatus, updatedAt: new Date() };
    if (input.escalationStatus === 'review_ready') data.reviewedAt = new Date();
    if (input.escalationStatus === 'approved_for_future_use') data.approvedForFutureUseAt = new Date();
    if (input.escalationStatus === 'suppressed') data.suppressedAt = new Date();
    if (input.escalationStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.followUpEscalationPlanRecord.update({
      where: { followUpEscalationPlanId: planId },
      data,
    });
    return mapEscalationPlanFromPrisma(row);
  }

  async markReviewReady(planId: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'review_ready', reasonCode: 'review_ready', safeMessage: 'Escalation plan ready for review' });
  }

  async approveForFutureUse(planId: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'approved_for_future_use', reasonCode: 'approved', safeMessage: 'Escalation plan approved for future use' });
  }

  async suppress(planId: string, reasonCode: string, safeMessage: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'suppressed', reasonCode, safeMessage });
  }

  async block(planId: string, reasonCode: string, safeMessage: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(planId: string, reasonCode: string, safeMessage: string): Promise<FollowUpEscalationPlan> {
    return this.updateStatus(planId, { escalationStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaFollowUpSummaryRepository implements FollowUpSummaryRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: CreateFollowUpSummaryInput & { createdByActorId: string; createdByRole: string }): Promise<FollowUpSummary> {
    const row = await this.prisma.followUpSummaryRecord.create({
      data: {
        followUpSummaryId: uuidv4(),
        schoolId: input.schoolId,
        studentRef: input.studentRef || null,
        summaryScope: (input.summaryScope as string) ?? 'school',
        summaryStatus: 'active',
        safeSummary: input.safeSummary,
        caseCountsJson: (input.caseCounts as any) || undefined,
        priorityCountsJson: (input.priorityCounts as any) || undefined,
        statusCountsJson: (input.statusCounts as any) || undefined,
      },
    });
    return mapFollowUpSummaryFromPrisma(row);
  }

  async getById(summaryId: string): Promise<FollowUpSummary | null> {
    const row = await this.prisma.followUpSummaryRecord.findUnique({ where: { followUpSummaryId: summaryId } });
    return row ? mapFollowUpSummaryFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<FollowUpSummaryPreview[]> {
    const rows = await this.prisma.followUpSummaryRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSummaryPreviewFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<FollowUpSummaryPreview[]> {
    const rows = await this.prisma.followUpSummaryRecord.findMany({ where: { schoolId, studentRef }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSummaryPreviewFromPrisma);
  }

  async listByScope(schoolId: string, scope: string): Promise<FollowUpSummaryPreview[]> {
    const rows = await this.prisma.followUpSummaryRecord.findMany({ where: { schoolId, summaryScope: scope }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSummaryPreviewFromPrisma);
  }

  async listByStatus(schoolId: string, status: FollowUpSummaryStatus | string): Promise<FollowUpSummaryPreview[]> {
    const rows = await this.prisma.followUpSummaryRecord.findMany({ where: { schoolId, summaryStatus: status as string }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpSummaryPreviewFromPrisma);
  }

  async update(summaryId: string, data: Partial<FollowUpSummary>): Promise<FollowUpSummary> {
    const row = await this.prisma.followUpSummaryRecord.update({
      where: { followUpSummaryId: summaryId },
      data: { ...data as any, updatedAt: new Date() },
    });
    return mapFollowUpSummaryFromPrisma(row);
  }

  async updateStatus(summaryId: string, input: UpdateFollowUpSummaryStatusInput): Promise<FollowUpSummary> {
    const data: any = { summaryStatus: input.summaryStatus, updatedAt: new Date() };
    if (input.summaryStatus === 'void') data.voidedAt = new Date();
    const row = await this.prisma.followUpSummaryRecord.update({
      where: { followUpSummaryId: summaryId },
      data,
    });
    return mapFollowUpSummaryFromPrisma(row);
  }

  async refresh(summaryId: string): Promise<FollowUpSummary> {
    const row = await this.prisma.followUpSummaryRecord.update({
      where: { followUpSummaryId: summaryId },
      data: { refreshedAt: new Date(), updatedAt: new Date() },
    });
    return mapFollowUpSummaryFromPrisma(row);
  }

  async markStale(summaryId: string): Promise<FollowUpSummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'stale', reasonCode: 'stale', safeMessage: 'Summary marked stale' });
  }

  async block(summaryId: string, reasonCode: string, safeMessage: string): Promise<FollowUpSummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'blocked', reasonCode, safeMessage });
  }

  async void(summaryId: string, reasonCode: string, safeMessage: string): Promise<FollowUpSummary> {
    return this.updateStatus(summaryId, { summaryStatus: 'void', reasonCode, safeMessage });
  }
}

export class PrismaFollowUpAuditRepository implements FollowUpAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(event: FollowUpAuditEvent): Promise<FollowUpAuditEvent> {
    const row = await this.prisma.followUpAuditRecord.create({
      data: {
        followUpAuditId: uuidv4(),
        schoolId: event.schoolId,
        resultFollowUpCaseId: event.resultFollowUpCaseId || null,
        resultFollowUpSignalId: event.resultFollowUpSignalId || null,
        resultFollowUpActionPlanId: event.resultFollowUpActionPlanId || null,
        teacherFollowUpQueueItemId: event.teacherFollowUpQueueItemId || null,
        parentGuidanceDraftId: event.parentGuidanceDraftId || null,
        studentReflectionTaskDraftId: event.studentReflectionTaskDraftId || null,
        followUpReviewWindowId: event.followUpReviewWindowId || null,
        followUpEscalationPlanId: event.followUpEscalationPlanId || null,
        followUpSummaryId: event.followUpSummaryId || null,
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
    return mapFollowUpAuditFromPrisma(row);
  }

  async getById(auditId: string): Promise<FollowUpAuditEvent | null> {
    const row = await this.prisma.followUpAuditRecord.findUnique({ where: { followUpAuditId: auditId } });
    return row ? mapFollowUpAuditFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<FollowUpAuditEvent[]> {
    const rows = await this.prisma.followUpAuditRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpAuditFromPrisma);
  }

  async listByCaseId(caseId: string): Promise<FollowUpAuditEvent[]> {
    const rows = await this.prisma.followUpAuditRecord.findMany({ where: { resultFollowUpCaseId: caseId }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpAuditFromPrisma);
  }

  async listByEventType(schoolId: string, eventType: string): Promise<FollowUpAuditEvent[]> {
    const rows = await this.prisma.followUpAuditRecord.findMany({ where: { schoolId, eventType }, orderBy: { createdAt: 'desc' } });
    return rows.map(mapFollowUpAuditFromPrisma);
  }
}

export class PrismaFollowUpIdempotencyRepository implements FollowUpIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(input: { schoolId: string; operation: string; idempotencyKey: string; requestHash: string; status?: string; resourceType?: string | null; resourceId?: string | null; safeResultSummary?: string | null; expiresAt?: string }): Promise<FollowUpIdempotencyEntry> {
    const row = await this.prisma.followUpIdempotencyRecord.create({
      data: {
        followUpIdempotencyId: uuidv4(),
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
    return mapFollowUpIdempotencyFromPrisma(row);
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<FollowUpIdempotencyEntry | null> {
    const row = await this.prisma.followUpIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    }).catch(() => null);
    return row ? mapFollowUpIdempotencyFromPrisma(row) : null;
  }

  async updateStatus(idempotencyId: string, status: string, safeResultSummary?: string): Promise<FollowUpIdempotencyEntry> {
    const data: any = { status, updatedAt: new Date() };
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const row = await this.prisma.followUpIdempotencyRecord.update({
      where: { followUpIdempotencyId: idempotencyId },
      data,
    });
    return mapFollowUpIdempotencyFromPrisma(row);
  }

  async expire(idempotencyId: string): Promise<FollowUpIdempotencyEntry> {
    return this.updateStatus(idempotencyId, 'expired');
  }
}
