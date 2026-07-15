import { RecoveryLifecycleClosurePolicyEnforcer } from '../policies/recoveryLifecycleClosurePolicyDefinitions';
import { CreateRecoveryLifecycleClosureReadinessRequest } from '../contracts/recoveryLifecycleClosureReadinessContracts';
import { CreateRecoveryPostSimulationHandoffPacketRequest } from '../contracts/recoveryPostSimulationHandoffPacketContracts';
import { CreateRecoveryNextCycleRecommendationDraftRequest } from '../contracts/recoveryNextCycleRecommendationContracts';
import { CreateRecoveryDeferredIntegrationTicketRequest } from '../contracts/recoveryDeferredIntegrationTicketContracts';
import { CreateRecoveryUnresolvedRiskRegisterRequest } from '../contracts/recoveryUnresolvedRiskRegisterContracts';
import { CreateRecoveryTeacherClosureReviewPacketRequest, CreateRecoveryAdminGovernanceReviewPacketRequest } from '../contracts/recoveryClosureReviewPacketContracts';
import { CreateRecoveryStudentClosureReflectionDraftRequest, CreateRecoveryParentClosureGuidanceDraftRequest } from '../contracts/recoveryStakeholderClosureDraftContracts';
import { CreateRecoveryArchiveManifestRequest } from '../contracts/recoveryArchiveManifestContracts';
import { CreateRecoveryFinalLifecycleSummaryRequest } from '../contracts/recoveryFinalLifecycleSummaryContracts';

const FORBIDDEN_FIELDS = [
  'answerKeyText', 'correctAnswerSummary', 'rubricInternal', 'rawRubric',
  'rawStudentAnswer', 'hiddenReasoning', 'chainOfThought', 'teacherOnlyNotes',
  'unreleasedScore', 'unreleasedGrade', 'diagnosis', 'medicalAssessment',
  'psychologicalAssessment', 'parentNotificationPayload', 'studentNotificationPayload',
  'teacherNotificationPayload', 'emailPayload', 'smsPayload', 'pushPayload',
  'whatsAppPayload', 'liveAssignmentPayload', 'homeworkAssignmentPayload',
  'practiceAssignmentPayload', 'revisionTaskPayload', 'calendarEventPayload',
  'portalPublishPayload', 'externalSyncPayload', 'aiNarrative', 'generatedNarrative',
  'modelOutput', 'generatedQuestionText', 'generatedAnswerKey', 'ocrText', 'pdfBinary',
  'pdfBuffer', 'pdfBase64', 'htmlExport', 'scoreMutationPayload', 'masteryMutationPayload',
  'regradeExecutionPayload', 'liveRecoveryActivationPayload', 'liveRecoveryCompletionPayload',
  'liveRecoveryClosurePayload',
];

export class RecoveryLifecycleClosureSafetyService {
  constructor(private policyEnforcer: RecoveryLifecycleClosurePolicyEnforcer) {}

  private checkForbiddenFields(obj: Record<string, unknown>): string[] {
    const codes: string[] = [];
    for (const field of FORBIDDEN_FIELDS) {
      if (field in obj && obj[field] !== undefined && obj[field] !== null) {
        codes.push(`FORBIDDEN_FIELD:${field}`);
      }
    }
    return codes;
  }

  validateClosureReadinessContent(request: CreateRecoveryLifecycleClosureReadinessRequest): string[] {
    const codes: string[] = [];
    if (!request.safeReadinessSummary || request.safeReadinessSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    if (!request.studentRef || request.studentRef.trim().length === 0) {
      codes.push('MISSING_STUDENT_REF');
    }
    if (!request.resultRecoveryPlanId || request.resultRecoveryPlanId.trim().length === 0) {
      codes.push('MISSING_RECOVERY_PLAN_ID');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.readinessChecksJson) codes.push(...this.checkForbiddenFields(request.readinessChecksJson));
    return codes;
  }

  validateHandoffPacketContent(request: CreateRecoveryPostSimulationHandoffPacketRequest): string[] {
    const codes: string[] = [];
    if (!request.safeHandoffSummary || request.safeHandoffSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.handoffContentsJson) codes.push(...this.checkForbiddenFields(request.handoffContentsJson));
    if (request.nextStepsJson) codes.push(...this.checkForbiddenFields(request.nextStepsJson));
    return codes;
  }

  validateNextCycleRecommendationContent(request: CreateRecoveryNextCycleRecommendationDraftRequest): string[] {
    const codes: string[] = [];
    if (!request.safeRecommendationSummary || request.safeRecommendationSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.recommendationDetailsJson) codes.push(...this.checkForbiddenFields(request.recommendationDetailsJson));
    return codes;
  }

  validateDeferredIntegrationTicketContent(request: CreateRecoveryDeferredIntegrationTicketRequest): string[] {
    const codes: string[] = [];
    if (!request.safeTicketSummary || request.safeTicketSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.ticketDetailsJson) codes.push(...this.checkForbiddenFields(request.ticketDetailsJson));
    return codes;
  }

  validateUnresolvedRiskRegisterContent(request: CreateRecoveryUnresolvedRiskRegisterRequest): string[] {
    const codes: string[] = [];
    if (!request.safeRiskSummary || request.safeRiskSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.riskDetailsJson) codes.push(...this.checkForbiddenFields(request.riskDetailsJson));
    return codes;
  }

  validateTeacherClosureReviewPacketContent(request: CreateRecoveryTeacherClosureReviewPacketRequest): string[] {
    const codes: string[] = [];
    if (!request.safeTeacherReviewSummary || request.safeTeacherReviewSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.teacherReviewNotesJson) codes.push(...this.checkForbiddenFields(request.teacherReviewNotesJson));
    return codes;
  }

  validateAdminGovernanceReviewPacketContent(request: CreateRecoveryAdminGovernanceReviewPacketRequest): string[] {
    const codes: string[] = [];
    if (!request.safeAdminReviewSummary || request.safeAdminReviewSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.governanceReviewNotesJson) codes.push(...this.checkForbiddenFields(request.governanceReviewNotesJson));
    return codes;
  }

  validateStudentClosureReflectionContent(request: CreateRecoveryStudentClosureReflectionDraftRequest): string[] {
    const codes: string[] = [];
    if (!request.safeStudentReflectionSummary || request.safeStudentReflectionSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.reflectionContentJson) codes.push(...this.checkForbiddenFields(request.reflectionContentJson));
    return codes;
  }

  validateParentClosureGuidanceContent(request: CreateRecoveryParentClosureGuidanceDraftRequest): string[] {
    const codes: string[] = [];
    if (!request.safeParentGuidanceSummary || request.safeParentGuidanceSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.guidanceContentJson) codes.push(...this.checkForbiddenFields(request.guidanceContentJson));
    return codes;
  }

  validateArchiveManifestContent(request: CreateRecoveryArchiveManifestRequest): string[] {
    const codes: string[] = [];
    if (!request.safeManifestSummary || request.safeManifestSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.manifestContentsJson) codes.push(...this.checkForbiddenFields(request.manifestContentsJson));
    if (request.recordCountsJson) codes.push(...this.checkForbiddenFields(request.recordCountsJson));
    return codes;
  }

  validateFinalLifecycleSummaryContent(request: CreateRecoveryFinalLifecycleSummaryRequest): string[] {
    const codes: string[] = [];
    if (!request.safeSummary || request.safeSummary.trim().length === 0) {
      codes.push('EMPTY_SAFE_SUMMARY');
    }
    codes.push(...this.checkForbiddenFields(request as any));
    if (request.lifecycleOverviewJson) codes.push(...this.checkForbiddenFields(request.lifecycleOverviewJson));
    if (request.outcomesJson) codes.push(...this.checkForbiddenFields(request.outcomesJson));
    if (request.nextStepsJson) codes.push(...this.checkForbiddenFields(request.nextStepsJson));
    return codes;
  }

  validateNoLiveClosure(): string[] {
    const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_NO_LIVE_CLOSURE', 'system');
    return decision.allowed ? [] : ['no_live_closure'];
  }

  validateNoLiveExecution(): string[] {
    const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_NO_LIVE_EXECUTION', 'system');
    return decision.allowed ? [] : ['no_live_execution'];
  }

  validateNoLiveActivation(): string[] {
    const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_NO_LIVE_ACTIVATION', 'system');
    return decision.allowed ? [] : ['no_live_activation'];
  }

  validateNoScoreMutation(): string[] {
    const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_NO_SCORE_MUTATION', 'system');
    return decision.allowed ? [] : ['no_score_mutation'];
  }

  validateNoMasteryMutation(): string[] {
    const decision = this.policyEnforcer.enforce('RECOVERY_LIFECYCLE_NO_MASTERY_MUTATION', 'system');
    return decision.allowed ? [] : ['no_mastery_mutation'];
  }
}
