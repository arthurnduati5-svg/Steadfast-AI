import { RecoveryOutcomeActionPolicyEnforcer } from '../policies/recoveryOutcomeActionPolicyDefinitions';
import { RecoveryOutcomeActionPolicyDecision } from '../contracts/recoveryOutcomeActionContracts';

export class RecoveryOutcomeActionSafetyService {
  private policyEnforcer: RecoveryOutcomeActionPolicyEnforcer;

  constructor(policyEnforcer?: RecoveryOutcomeActionPolicyEnforcer) {
    this.policyEnforcer = policyEnforcer ?? new RecoveryOutcomeActionPolicyEnforcer();
  }

  enforce(role: string, policyName: string): RecoveryOutcomeActionPolicyDecision {
    const result = this.policyEnforcer.enforce(role, policyName);
    return {
      allowed: result.allowed,
      denied: result.denied,
      reasonCodes: result.reasonCodes,
      actorRole: role,
      action: policyName,
    };
  }

  enforceOrThrow(role: string, policyName: string): void {
    const decision = this.enforce(role, policyName);
    if (decision.denied) {
      throw new Error(`Access denied: ${decision.reasonCodes.join(', ')}`);
    }
  }

  validateSchoolContext(schoolId?: string): void {
    if (!schoolId) {
      throw new Error('Missing schoolId');
    }
  }

  validatePackage19Ref(ref: string | undefined | null, fieldName: string): void {
    if (!ref) {
      throw new Error(`Missing Package 19 reference: ${fieldName}`);
    }
  }

  validateForbiddenFields(data: Record<string, unknown>): string[] {
    const forbidden = [
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
    return forbidden.filter(f => f in data);
  }
}
