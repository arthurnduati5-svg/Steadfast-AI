import type { Task034IncidentEscalationBridgeResult, Task034IncidentSignal } from '../contracts/task034ControlledRolloutContracts';

export interface IncidentSignalInput {
  signals: Task034IncidentSignal[];
  safeSummaries: string[];
}

export function evaluateIncidentSignals(input: IncidentSignalInput): Task034IncidentEscalationBridgeResult {
  const blockingIssues: string[] = [];

  const pauseRecommended = input.signals.includes('performance_risk') || input.signals.includes('system_error_risk');
  const killSwitchRecommended = input.signals.includes('privacy_risk') || input.signals.includes('safeguarding_risk');
  const rollbackRecommended = input.signals.includes('rollback_needed') ||
    input.signals.includes('open_rollout_risk') ||
    input.signals.includes('school_wide_rollout_risk') ||
    input.signals.includes('hundred_percent_rollout_risk');

  const adminReviewRequired = input.signals.length > 0;
  const safeguardingEscalationRequired = input.signals.includes('safeguarding_risk');
  const privacyEscalationRequired = input.signals.includes('privacy_risk');
  const deenReviewRequired = input.signals.includes('deen_governance_risk');

  const safeSummaries: string[] = [];
  for (const s of input.safeSummaries) {
    const forbiddenPatterns = ['raw student chat', 'private memory', 'teacher name',
      'family private', 'safeguarding raw', 'Deen-sensitive'];
    let hasForbidden = false;
    for (const p of forbiddenPatterns) {
      if (s.toLowerCase().includes(p)) {
        hasForbidden = true;
        break;
      }
    }
    if (!hasForbidden) {
      safeSummaries.push(s);
    }
  }

  const ok = blockingIssues.length === 0;

  return {
    ok,
    signals: input.signals,
    safeSummaries,
    pauseRecommended,
    killSwitchRecommended,
    rollbackRecommended,
    adminReviewRequired,
    safeguardingEscalationRequired,
    privacyEscalationRequired,
    deenReviewRequired,
    rawPrivateDataExposed: false,
    blockingIssues,
  };
}
