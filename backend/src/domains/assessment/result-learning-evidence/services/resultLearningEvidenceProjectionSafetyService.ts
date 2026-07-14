import type {
  ResultLearningEvidenceTeacherProjection,
  ResultLearningEvidenceAdminProjection,
  ResultLearningEvidenceStudentSafeProjection,
  ResultLearningEvidenceParentBoundaryProjection,
  FinalizedResultEvidencePreview,
  MasteryMutationPlanPreview,
  RevisionSignalPreview,
  GrowthSignalPreview,
} from '../contracts/resultLearningEvidenceProjectionContracts';
import { FORBIDDEN_FIELDS_STUDENT_PARENT } from '../contracts/resultLearningEvidenceProjectionContracts';
import type { ResultLearningEvidenceBridge } from '../contracts/resultEvidenceBridgeContracts';

export class ResultLearningEvidenceProjectionSafetyService {
  toTeacherProjection(bridge: ResultLearningEvidenceBridge, impactCount: number, planStatus?: string, revisionCount?: number, growthCount?: number): ResultLearningEvidenceTeacherProjection {
    return {
      bridgeId: bridge.resultLearningEvidenceBridgeId,
      schoolId: bridge.schoolId,
      bridgeStatus: bridge.bridgeStatus,
      bridgeMode: bridge.bridgeMode,
      studentRef: bridge.studentRef,
      safeEvidenceSummary: bridge.safeEvidenceSummary,
      objectiveImpactCount: impactCount,
      planStatus,
      revisionSignalCount: revisionCount ?? 0,
      growthSignalCount: growthCount ?? 0,
      reasonCodes: [],
      createdAt: bridge.createdAt,
      updatedAt: bridge.updatedAt,
    };
  }

  toAdminProjection(
    totalBridges: number,
    totalPlans: number,
    totalImpacts: number,
    totalRevisionSignals: number,
    totalGrowthSignals: number,
    bridgesByStatus: Record<string, number>,
    plansByStatus: Record<string, number>,
    schoolId: string,
  ): ResultLearningEvidenceAdminProjection {
    return {
      totalBridges,
      totalPlans,
      totalImpacts,
      totalRevisionSignals,
      totalGrowthSignals,
      bridgesByStatus,
      plansByStatus,
      schoolId,
      safeSummary: 'Admin projection with aggregate counts only. No answer keys, rubrics, or raw student data exposed.',
    };
  }

  toStudentSafeProjection(
    actorId: string,
    bridge: ResultLearningEvidenceBridge,
    planStatus?: string,
    impactSummary?: string,
  ): ResultLearningEvidenceStudentSafeProjection {
    if (bridge.studentRef !== actorId) {
      return {
        studentRef: bridge.studentRef,
        learningObjectiveId: '',
        safeEvidenceSummary: 'Access restricted: student identity does not match',
        safeMasteryMovementSummary: '',
        safeNextPracticeSummary: '',
        safeStatusSummary: 'Access restricted',
        availableNextActions: [],
      };
    }
    return {
      studentRef: bridge.studentRef,
      learningObjectiveId: '',
      safeEvidenceSummary: bridge.safeEvidenceSummary,
      safeMasteryMovementSummary: impactSummary || 'Evidence recorded',
      safeNextPracticeSummary: 'Revision signals may be available for flagged objectives',
      safeStatusSummary: planStatus || bridge.bridgeStatus,
      availableNextActions: ['view_safe_projection'],
    };
  }

  toParentBoundaryProjection(
    actorId: string,
    bridge: ResultLearningEvidenceBridge,
  ): ResultLearningEvidenceParentBoundaryProjection {
    return {
      studentRef: bridge.studentRef,
      safeProgressSummary: 'Progress evidence recorded internally',
      safeSupportSummary: 'Contact school for detailed academic support information',
      notYetReleasedReason: 'Parent release is boundary-only. No scores, answer keys, or raw rubrics are released to parents.',
      allowedFieldNames: ['studentRef', 'safeProgressSummary', 'safeSupportSummary'],
      blockedFieldNames: [...FORBIDDEN_FIELDS_STUDENT_PARENT],
    };
  }

  toFinalizedResultEvidencePreview(bridge: ResultLearningEvidenceBridge, impactCount: number): FinalizedResultEvidencePreview {
    return {
      bridgeId: bridge.resultLearningEvidenceBridgeId,
      resultFinalizationDecisionId: bridge.resultFinalizationDecisionId,
      markingResultVersionId: bridge.markingResultVersionId,
      studentRef: bridge.studentRef,
      bridgeStatus: bridge.bridgeStatus,
      safeEvidenceSummary: bridge.safeEvidenceSummary,
      objectiveImpactCount: impactCount,
      createdAt: bridge.createdAt,
    };
  }

  toMasteryMutationPlanPreview(plan: any): MasteryMutationPlanPreview {
    return {
      planId: plan.resultMasteryMutationPlanId,
      bridgeId: plan.resultLearningEvidenceBridgeId,
      planStatus: plan.planStatus,
      planMode: plan.planMode,
      safePlanSummary: plan.safePlanSummary,
      studentRef: plan.studentRef,
      impactCount: plan.objectiveImpactRefsJson?.impactCount || 0,
      approvalRequired: plan.approvalRequired,
      approvedByActorId: plan.approvedByActorId,
      createdAt: plan.createdAt,
    };
  }

  toRevisionSignalPreview(signal: any): RevisionSignalPreview {
    return {
      signalId: signal.resultRevisionSignalId,
      planId: signal.resultMasteryMutationPlanId,
      signalStatus: signal.signalStatus,
      signalType: signal.signalType,
      priority: signal.priority,
      safeSignalSummary: signal.safeSignalSummary,
      learningObjectiveId: signal.learningObjectiveId,
      createdAt: signal.createdAt,
    };
  }

  toGrowthSignalPreview(signal: any): GrowthSignalPreview {
    return {
      signalId: signal.resultGrowthSignalId,
      planId: signal.resultMasteryMutationPlanId,
      signalStatus: signal.signalStatus,
      signalType: signal.signalType,
      safeGrowthSummary: signal.safeGrowthSummary,
      learningObjectiveId: signal.learningObjectiveId,
      createdAt: signal.createdAt,
    };
  }

  assertNoAnswerKeyLeakage(data: Record<string, unknown>): void {
    if (data.answerKeySafeRef !== undefined || data.answerKeyText !== undefined || data.correctAnswerSummary !== undefined) {
      throw new Error('FORBIDDEN_FIELD: answer key leakage detected');
    }
  }

  assertNoRubricLeakage(data: Record<string, unknown>): void {
    if (data.rubricInternal !== undefined || data.rubricText !== undefined || data.rawRubric !== undefined) {
      throw new Error('FORBIDDEN_FIELD: rubric leakage detected');
    }
  }

  assertNoRawStudentAnswerLeakage(data: Record<string, unknown>): void {
    if (data.rawStudentAnswer !== undefined) {
      throw new Error('FORBIDDEN_FIELD: raw student answer leakage detected');
    }
  }

  assertNoTeacherOnlyLeakage(data: Record<string, unknown>): void {
    if (data.markingNotesTeacherOnly !== undefined || data.teacherOnlyNotes !== undefined) {
      throw new Error('FORBIDDEN_FIELD: teacher-only notes leakage detected');
    }
  }

  assertNoHiddenReasoningLeakage(data: Record<string, unknown>): void {
    if (data.hiddenReasoning !== undefined || data.chainOfThought !== undefined) {
      throw new Error('FORBIDDEN_FIELD: hidden reasoning leakage detected');
    }
  }

  assertNoUnreleasedGradeLeakage(data: Record<string, unknown>): void {
    if (data.scoreBeforeFinalization !== undefined || data.unreleasedScore !== undefined || data.finalGradeBeforeRelease !== undefined) {
      throw new Error('FORBIDDEN_FIELD: unreleased grade leakage detected');
    }
  }

  assertNoParentDeliveryPayloadLeakage(data: Record<string, unknown>): void {
    if (data.parentDeliveryPayload !== undefined) {
      throw new Error('FORBIDDEN_FIELD: parent delivery payload leakage detected');
    }
  }

  assertNoReportCardPayloadLeakage(data: Record<string, unknown>): void {
    if (data.reportCardPayload !== undefined) {
      throw new Error('FORBIDDEN_FIELD: report card payload leakage detected');
    }
  }

  assertNoRawMasteryDeltaLeakage(data: Record<string, unknown>): void {
    if (data.rawMasteryDelta !== undefined || data.beforeStateJson !== undefined || data.afterStateJson !== undefined || data.deltaJson !== undefined) {
      throw new Error('FORBIDDEN_FIELD: raw mastery delta leakage detected');
    }
  }
}
