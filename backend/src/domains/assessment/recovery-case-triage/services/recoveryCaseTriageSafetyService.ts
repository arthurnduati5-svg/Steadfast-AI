import { RecoveryCaseTriageSafeEnvelope } from '../contracts/recoveryCaseTriageContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';

export interface SafetyCheckSummary {
  totalChecks: number;
  deniedCount: number;
  details: { checkName: string; status: string; message: string }[];
}

function deniedEnvelope(checkName: string): RecoveryCaseTriageSafeEnvelope {
  return { success: false, status: 'DENIED', message: `policy blocks this action: ${checkName}` };
}

export class RecoveryCaseTriageSafetyService {

  async assertNoLiveAssignment(): Promise<RecoveryCaseTriageSafeEnvelope> {
    const policy = checkPolicy('RECOVERY_CASE_TRIAGE_NO_LIVE_ASSIGNMENT', 'system_job');
    if (policy.denied) return deniedEnvelope('live_assignment');
    return deniedEnvelope('live_assignment');
  }

  async assertNoEscalationDispatch(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('escalation_dispatch');
  }

  async assertNoNotification(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('notification');
  }

  async assertNoCalendarEvent(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('calendar_event');
  }

  async assertNoPortalPublish(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('portal_publish');
  }

  async assertNoExternalSync(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('external_sync');
  }

  async assertNoLiveExecution(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('live_execution');
  }

  async assertNoLiveAuthorization(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('live_authorization');
  }

  async assertNoLiveClosure(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('live_closure');
  }

  async assertNoScoreMutation(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('score_mutation');
  }

  async assertNoMasteryMutation(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('mastery_mutation');
  }

  async assertNoRegradeExecution(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('regrade_execution');
  }

  async assertNoAIScoring(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('ai_scoring');
  }

  async assertNoGeneratedQuestion(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('generated_question');
  }

  async assertNoOCR(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('ocr');
  }

  async assertNoPDF(): Promise<RecoveryCaseTriageSafeEnvelope> {
    return deniedEnvelope('pdf');
  }

  async assertNoSensitiveFactorRanking(): Promise<RecoveryCaseTriageSafeEnvelope> {
    const policy = checkPolicy('RECOVERY_CASE_TRIAGE_NO_SENSITIVE_FACTOR_RANKING', 'system_job');
    if (policy.denied) return deniedEnvelope('sensitive_factor_ranking');
    return deniedEnvelope('sensitive_factor_ranking');
  }

  async runAllSafetyChecks(): Promise<SafetyCheckSummary> {
    const checks: { checkName: string; status: string; message: string }[] = [];
    const safetyMethods = [
      { name: 'assertNoLiveAssignment', fn: this.assertNoLiveAssignment.bind(this) },
      { name: 'assertNoEscalationDispatch', fn: this.assertNoEscalationDispatch.bind(this) },
      { name: 'assertNoNotification', fn: this.assertNoNotification.bind(this) },
      { name: 'assertNoCalendarEvent', fn: this.assertNoCalendarEvent.bind(this) },
      { name: 'assertNoPortalPublish', fn: this.assertNoPortalPublish.bind(this) },
      { name: 'assertNoExternalSync', fn: this.assertNoExternalSync.bind(this) },
      { name: 'assertNoLiveExecution', fn: this.assertNoLiveExecution.bind(this) },
      { name: 'assertNoLiveAuthorization', fn: this.assertNoLiveAuthorization.bind(this) },
      { name: 'assertNoLiveClosure', fn: this.assertNoLiveClosure.bind(this) },
      { name: 'assertNoScoreMutation', fn: this.assertNoScoreMutation.bind(this) },
      { name: 'assertNoMasteryMutation', fn: this.assertNoMasteryMutation.bind(this) },
      { name: 'assertNoRegradeExecution', fn: this.assertNoRegradeExecution.bind(this) },
      { name: 'assertNoAIScoring', fn: this.assertNoAIScoring.bind(this) },
      { name: 'assertNoGeneratedQuestion', fn: this.assertNoGeneratedQuestion.bind(this) },
      { name: 'assertNoOCR', fn: this.assertNoOCR.bind(this) },
      { name: 'assertNoPDF', fn: this.assertNoPDF.bind(this) },
      { name: 'assertNoSensitiveFactorRanking', fn: this.assertNoSensitiveFactorRanking.bind(this) },
    ];

    for (const { name, fn } of safetyMethods) {
      try {
        const result = await fn();
        checks.push({ checkName: name, status: result.status, message: result.message ?? '' });
      } catch {
        checks.push({ checkName: name, status: 'DENIED', message: 'policy blocks this action' });
      }
    }

    const deniedCount = checks.filter(c => c.status === 'DENIED').length;
    return {
      totalChecks: checks.length,
      deniedCount,
      details: checks,
    };
  }
}
