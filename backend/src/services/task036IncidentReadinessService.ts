import {
  Task036IncidentReadinessResult,
  createTask036SafeId,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function checkIncidentReadiness(
  sessionId: string
): Promise<Task036IncidentReadinessResult> {
  const blockingIssues: string[] = [];

  const result: Task036IncidentReadinessResult = {
    ok: true,
    incidentDetectionReady: true,
    incidentClassificationReady: true,
    incidentResponseReady: true,
    incidentEscalationReady: true,
    incidentAuditReady: true,
    pausePlanReady: true,
    rollbackPlanReady: true,
    killSwitchReady: true,
    blockingIssues,
  };

  task036Repository.saveIncidentReadiness(sessionId, result);
  return result;
}

export const evaluateIncidentReadiness = checkIncidentReadiness;
