import type { Task034IncidentEscalationBridgeResult } from '../contracts/task034ControlledLimitedRolloutContracts';

const FORBIDDEN_ALERT_PATTERNS = [
  /real alert/i,
  /send email/i,
  /send sms/i,
  /send whatsapp/i,
  /external ticket/i,
  /webhook/i,
  /pagerduty/i,
  /opsgenie/i,
];

export function evaluateTask034IncidentSignals(signals: string[], safeSummaries: string[]): Task034IncidentEscalationBridgeResult {
  const blockingIssues: string[] = [];

  for (const summary of safeSummaries) {
    for (const pattern of FORBIDDEN_ALERT_PATTERNS) {
      if (pattern.test(summary)) {
        blockingIssues.push(`forbidden_real_alert_pattern_in_summary: ${pattern}`);
      }
    }
  }

  const realAlertSent = false;
  const realEmailSent = false;
  const realSmsSent = false;
  const realWhatsappSent = false;
  const externalTicketCreated = false;
  const webhookCalled = false;

  const rawIncidentDetailsExposed = blockingIssues.length > 0;
  const pauseRecommended = signals.length > 0;
  const operatorReviewRequired = signals.length > 0;

  return {
    ok: blockingIssues.length === 0,
    safeSeverity: signals.length > 0 ? 'info' : 'none',
    safeCategory: signals.length > 0 ? 'controlled_limited_rollout_internal' : 'no_incident',
    safeReasonCodes: signals,
    safeSummary: safeSummaries.join('; ') || 'no_incident_signals',
    pauseRecommended,
    rollbackRecommended: false,
    killSwitchRecommended: false,
    operatorReviewRequired,
    realAlertSent,
    realEmailSent,
    realSmsSent,
    realWhatsappSent,
    externalTicketCreated,
    webhookCalled,
    rawIncidentDetailsExposed,
    blockingIssues,
  };
}
