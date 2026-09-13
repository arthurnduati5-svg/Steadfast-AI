import type { Task033IncidentSignalObservationResult, Task033ObservationEventRecord } from '../contracts/task033ControlledCanaryObservationContracts';
import { task033Repository } from '../repositories/task033ControlledCanaryObservationRepository';

export async function observeTask033IncidentSignals(sessionId: string): Promise<Task033IncidentSignalObservationResult> {
  const events = await task033Repository.listEvents(sessionId);
  const blockingIssues: string[] = [];

  const incidentEvents = events.filter(e => e.eventType === 'incident_signal');
  const criticalIncidents = incidentEvents.filter(e => e.errorCategory === 'critical');

  const incidentSignalCount = incidentEvents.length;
  const criticalSignalCount = criticalIncidents.length;

  const safeSeverity = criticalSignalCount > 0 ? 'critical' : incidentSignalCount > 0 ? 'warning' : 'info';

  const safeReasonCodes: string[] = [];
  for (const e of incidentEvents) {
    safeReasonCodes.push(...e.safeReasonCodes.filter(c => !safeReasonCodes.includes(c)));
  }

  const safeCategory = criticalSignalCount > 0
    ? 'critical_observation_violation'
    : incidentSignalCount > 0
      ? 'minor_observation_violation'
      : 'no_incidents';

  const safeSummary = incidentSignalCount === 0
    ? 'No incident signals observed during observation session'
    : `${incidentSignalCount} incident signal(s) observed, ${criticalSignalCount} critical`;

  const rollbackRecommended = criticalSignalCount >= 3;
  const pauseRecommended = incidentSignalCount >= 5 || criticalSignalCount >= 1;
  const killSwitchRecommended = criticalSignalCount >= 5;

  const result: Task033IncidentSignalObservationResult = {
    ok: criticalSignalCount === 0,
    incidentSignalCount,
    criticalSignalCount,
    safeReasonCodes,
    safeSeverity,
    safeCategory,
    safeSummary,
    rollbackRecommended,
    pauseRecommended,
    killSwitchRecommended,
    realAlertSent: false,
    realEmailSent: false,
    realSmsSent: false,
    realWhatsappSent: false,
    externalTicketCreated: false,
    webhookCalled: false,
    rawIncidentDetailsExposed: false,
    safeguardingRawExposed: false,
    blockingIssues,
  };

  if (criticalSignalCount > 0) {
    blockingIssues.push(`critical_incident_signals_detected: ${criticalSignalCount}`);
  }

  await task033Repository.recordIncidentSignalObservation(result);
  return result;
}
