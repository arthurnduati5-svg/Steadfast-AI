import { RecoveryOutcomeExecutionSimulationPolicyEnforcer } from '../policies/recoveryOutcomeExecutionSimulationPolicyDefinitions';

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

export class RecoveryOutcomeExecutionSimulationSafetyService {
  private policyEnforcer: RecoveryOutcomeExecutionSimulationPolicyEnforcer;

  constructor(policyEnforcer?: RecoveryOutcomeExecutionSimulationPolicyEnforcer) {
    this.policyEnforcer = policyEnforcer ?? new RecoveryOutcomeExecutionSimulationPolicyEnforcer();
  }

  validateSchoolContext(schoolId?: string): void {
    if (!schoolId) {
      throw new Error('Missing schoolId');
    }
  }

  validatePackage21Ref(ref: string | undefined | null, fieldName: string): void {
    if (!ref) {
      throw new Error(`Missing Package 21 reference: ${fieldName}`);
    }
  }

  enforceOrThrow(role: string, policyName: string): void {
    const decision = this.policyEnforcer.enforce(policyName, role);
    if (decision.denied) {
      throw new Error(`Access denied: ${decision.reasonCodes.join(', ')}`);
    }
  }

  validateContent(safeSummary: string, detailsJson: Record<string, unknown>): string[] {
    const blockedReasonCodes: string[] = [];
    if (!safeSummary || safeSummary.trim().length === 0) {
      blockedReasonCodes.push('EMPTY_SAFE_SUMMARY');
    }
    for (const field of FORBIDDEN_FIELDS) {
      if (field in detailsJson && detailsJson[field] !== undefined && detailsJson[field] !== null) {
        blockedReasonCodes.push(`FORBIDDEN_FIELD:${field}`);
      }
    }
    return blockedReasonCodes;
  }

  validateNoLiveExecution(actionType: string): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_LIVE_EXECUTION', actionType);
    return decision.allowed;
  }

  validateNoLiveActivation(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_LIVE_ACTIVATION', 'system');
    return decision.allowed;
  }

  validateNoLiveCompletion(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_LIVE_COMPLETION', 'system');
    return decision.allowed;
  }

  validateNoLiveClosure(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_LIVE_CLOSURE', 'system');
    return decision.allowed;
  }

  validateNoLiveAssignment(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_LIVE_ASSIGNMENT', 'system');
    return decision.allowed;
  }

  validateNoLiveNotification(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_LIVE_NOTIFICATION', 'system');
    return decision.allowed;
  }

  validateNoPortalPublish(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_PORTAL_PUBLISH', 'system');
    return decision.allowed;
  }

  validateNoScoreMutation(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_SCORE_MUTATION', 'system');
    return decision.allowed;
  }

  validateNoMasteryMutation(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_MASTERY_MUTATION', 'system');
    return decision.allowed;
  }

  validateNoRegradeExecution(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_REGRADE_EXECUTION', 'system');
    return decision.allowed;
  }

  validateNoGeneratedQuestion(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_GENERATED_QUESTION', 'system');
    return decision.allowed;
  }

  validateNoAINarrative(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_AI_NARRATIVE', 'system');
    return decision.allowed;
  }

  validateNoOCR(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_OCR', 'system');
    return decision.allowed;
  }

  validateNoPDF(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_PDF', 'system');
    return decision.allowed;
  }

  validateNoExternalSync(): boolean {
    const decision = this.policyEnforcer.enforce('RECOVERY_OUTCOME_EXECUTION_NO_EXTERNAL_SYNC', 'system');
    return decision.allowed;
  }
}
