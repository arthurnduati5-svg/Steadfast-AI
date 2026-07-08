import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { validateTask026IncidentWatchInput } from '../lib/task026ControlledPilotExecutionValidation';
import type { Task026IncidentWatchInput, Task026IncidentWatchResult } from '../contracts/task026ControlledPilotExecutionContracts';

const SEVERITY_RECOMMENDED_ACTIONS: Record<string, string> = {
  low: 'continue_monitoring',
  medium: 'manual_review',
  high: 'pause_pilot',
  critical: 'block_execution',
};

export async function recordIncident(
  input: Task026IncidentWatchInput
): Promise<Task026IncidentWatchResult> {
  const validation = validateTask026IncidentWatchInput(input);
  if (!validation.valid) {
    return {
      recorded: false,
      incidentId: '',
      recommendedAction: 'continue_monitoring',
      safeMessage: validation.safeMessage,
    };
  }

  const { schoolId, pilotRunId, severity, category, safeSummary, metadataSafeJson } = validation.data;

  const run = await task026PilotExecutionRepository.getPilotRun(pilotRunId);
  if (!run) {
    return {
      recorded: false,
      incidentId: '',
      recommendedAction: 'continue_monitoring',
      safeMessage: 'Pilot run not found.',
    };
  }

  if (run.schoolId !== schoolId) {
    return {
      recorded: false,
      incidentId: '',
      recommendedAction: 'continue_monitoring',
      safeMessage: 'School mismatch for incident record.',
    };
  }

  const recommendedAction = SEVERITY_RECOMMENDED_ACTIONS[severity] || 'manual_review';

  const incident = await task026PilotExecutionRepository.recordIncidentSignal({
    schoolId,
    pilotRunId,
    severity,
    category,
    safeSummary,
    metadataSafeJson: metadataSafeJson || {},
    recommendedAction,
  });

  const incidentId = (incident as any).id || '';

  await task026PilotExecutionRepository.recordAuditEvent({
    runId: pilotRunId,
    schoolId,
    actorRole: 'system',
    action: 'incident_watch_recorded',
    safeSummary: `Incident ${incidentId} recorded (severity: ${severity}, category: ${category}). Recommended: ${recommendedAction}.`,
    metadataSafeJson: { incidentId, severity, category, recommendedAction },
  });

  return {
    recorded: true,
    incidentId,
    recommendedAction,
    safeMessage: `Incident recorded (ID: ${incidentId}, severity: ${severity}). Recommended action: ${recommendedAction}.`,
  };
}
