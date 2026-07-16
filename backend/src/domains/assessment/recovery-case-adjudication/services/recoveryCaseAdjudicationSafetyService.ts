import type { RecoveryCaseAdjudicationPolicyDecision } from '../contracts';

export class RecoveryCaseAdjudicationSafetyService {
  checkNoLiveAssignment(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_live_assignment'] };
  }

  checkNoReviewDispatch(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_review_dispatch'] };
  }

  checkNoNotification(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_notification'] };
  }

  checkNoEscalationDispatch(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_escalation_dispatch'] };
  }

  checkNoCalendarEvent(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_calendar_event'] };
  }

  checkNoPortalPublish(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_portal_publish'] };
  }

  checkNoExternalSync(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_external_sync'] };
  }

  checkNoPriorityMutation(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_priority_mutation'] };
  }

  checkNoQueueMutation(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_queue_mutation'] };
  }

  checkNoScoreMutation(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_score_mutation'] };
  }

  checkNoMasteryMutation(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_mastery_mutation'] };
  }

  checkNoRegradeExecution(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_regrade_execution'] };
  }

  checkNoAIDecision(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_ai_decision'] };
  }

  checkNoGeneratedQuestion(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_generated_question'] };
  }

  checkNoOcrOrPdf(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_ocr', 'no_pdf'] };
  }

  checkNoSensitiveFactorUse(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_sensitive_factor_use'] };
  }

  checkNoLiveExecution(
    _schoolId: string,
    _actorId: string,
    _actorRole: string,
    _correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    return { allowed: false, denied: true, reasonCodes: ['no_live_execution'] };
  }

  checkAllNoLiveActions(
    schoolId: string,
    actorId: string,
    actorRole: string,
    correlationId: string,
  ): RecoveryCaseAdjudicationPolicyDecision {
    const checks = [
      this.checkNoLiveAssignment(schoolId, actorId, actorRole, correlationId),
      this.checkNoReviewDispatch(schoolId, actorId, actorRole, correlationId),
      this.checkNoNotification(schoolId, actorId, actorRole, correlationId),
      this.checkNoEscalationDispatch(schoolId, actorId, actorRole, correlationId),
      this.checkNoCalendarEvent(schoolId, actorId, actorRole, correlationId),
      this.checkNoPortalPublish(schoolId, actorId, actorRole, correlationId),
      this.checkNoExternalSync(schoolId, actorId, actorRole, correlationId),
      this.checkNoPriorityMutation(schoolId, actorId, actorRole, correlationId),
      this.checkNoQueueMutation(schoolId, actorId, actorRole, correlationId),
      this.checkNoScoreMutation(schoolId, actorId, actorRole, correlationId),
      this.checkNoMasteryMutation(schoolId, actorId, actorRole, correlationId),
      this.checkNoRegradeExecution(schoolId, actorId, actorRole, correlationId),
      this.checkNoAIDecision(schoolId, actorId, actorRole, correlationId),
      this.checkNoGeneratedQuestion(schoolId, actorId, actorRole, correlationId),
      this.checkNoOcrOrPdf(schoolId, actorId, actorRole, correlationId),
      this.checkNoSensitiveFactorUse(schoolId, actorId, actorRole, correlationId),
      this.checkNoLiveExecution(schoolId, actorId, actorRole, correlationId),
    ];

    const allReasonCodes: string[] = [];
    for (const c of checks) {
      for (const code of c.reasonCodes) {
        if (!allReasonCodes.includes(code)) {
          allReasonCodes.push(code);
        }
      }
    }

    return { allowed: false, denied: true, reasonCodes: allReasonCodes };
  }
}
