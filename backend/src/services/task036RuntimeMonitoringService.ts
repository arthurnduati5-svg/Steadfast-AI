import {
  Task036RuntimeMonitoringResult,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function computeRuntimeMonitoring(
  sessionId: string
): Promise<Task036RuntimeMonitoringResult> {
  const allSessions = task036Repository.listLaunchSessions();
  const activeLaunchSessionCount = allSessions.filter(
    s => s.status === 'launch_active_controlled' || s.status === 'launch_ready'
  ).length;

  const result: Task036RuntimeMonitoringResult = {
    ok: true,
    activeLaunchSessionCount,
    safeRequestCount: 0,
    safeDeniedRequestCount: 0,
    runtimeGuardDenialCount: 0,
    schoolContextBypassAttemptCount: 0,
    crossSchoolAttemptCount: 0,
    privacyBoundaryFailureCount: 0,
    contentGovernanceFailureCount: 0,
    socraticIntegrityFailureCount: 0,
    deenBoundaryFailureCount: 0,
    incidentSignalCount: 0,
    criticalIncidentSignalCount: 0,
    pauseRecommended: false,
    rollbackRecommended: false,
    killSwitchRecommended: false,
    generatedAt: createTask036SafeTimestamp(),
    blockingIssues: [],
  };

  task036Repository.saveRuntimeMonitoring(sessionId, result);
  return result;
}

export const evaluateRuntimeMonitoring = computeRuntimeMonitoring;
