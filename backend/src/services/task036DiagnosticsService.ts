import {
  Task036DiagnosticsResult,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function computeDiagnostics(
  sessionId: string
): Promise<Task036DiagnosticsResult> {
  const session = task036Repository.getLaunchSession(sessionId);

  const gates: Record<string, boolean | undefined> = {
    environmentGatePassed: task036Repository.getEnvironmentGate(sessionId)?.passed,
    launchWindowPassed: task036Repository.getLaunchWindow(sessionId)?.passed,
    launchApprovalPassed: task036Repository.getLaunchApproval(sessionId)?.passed,
    singleSchoolScopePassed: task036Repository.getSingleSchoolScope(sessionId)?.passed,
    privacyBoundaryPassed: task036Repository.getPrivacyBoundary(sessionId)?.passed,
    contentGovernancePassed: task036Repository.getContentGovernance(sessionId)?.passed,
    socraticIntegrityPassed: task036Repository.getSocraticIntegrity(sessionId)?.passed,
    deenBoundaryPassed: task036Repository.getDeenBoundary(sessionId)?.passed,
    schoolIdentityPassed: task036Repository.getSchoolIdentity(sessionId)?.passed,
    crossSchoolDenialPassed: task036Repository.getCrossSchoolDenial(sessionId)?.passed,
  };

  const totalGates = Object.keys(gates).length;
  const gatesPassed = Object.values(gates).filter(Boolean).length;
  const gatesFailed = Object.values(gates).filter(v => v === false).length;
  const gatesPending = Object.values(gates).filter(v => v === undefined).length;

  const healthBudget = task036Repository.getHealthBudget(sessionId);
  const incidentReadiness = task036Repository.getIncidentReadiness(sessionId);
  const pauseControl = task036Repository.getPauseControl(sessionId);
  const rollbackControl = task036Repository.getRollbackControl(sessionId);
  const killSwitch = task036Repository.getKillSwitchControl(sessionId);

  const result: Task036DiagnosticsResult = {
    ok: true,
    sessionId,
    status: session?.status || 'unknown',
    totalGates,
    gatesPassed,
    gatesFailed,
    gatesPending,
    blockingIssueCount: session?.blockingIssues.length || 0,
    healthBudgetPassed: healthBudget?.healthBudgetPassed ?? false,
    incidentReadinessPassed: incidentReadiness?.ok ?? false,
    pauseReady: pauseControl?.paused ?? false,
    rollbackReady: rollbackControl?.rollbackRequested ?? false,
    killSwitchReady: killSwitch?.killSwitchEnabled ?? false,
    generatedAt: createTask036SafeTimestamp(),
  };

  task036Repository.saveDiagnostics(sessionId, result);
  return result;
}

export function buildDiagnostics(sessionId: string): Task036DiagnosticsResult {
  const session = task036Repository.getLaunchSession(sessionId);

  const gates: Record<string, boolean | undefined> = {
    environmentGatePassed: task036Repository.getEnvironmentGate(sessionId)?.passed,
    launchWindowPassed: task036Repository.getLaunchWindow(sessionId)?.passed,
    launchApprovalPassed: task036Repository.getLaunchApproval(sessionId)?.passed,
    singleSchoolScopePassed: task036Repository.getSingleSchoolScope(sessionId)?.passed,
    privacyBoundaryPassed: task036Repository.getPrivacyBoundary(sessionId)?.passed,
    contentGovernancePassed: task036Repository.getContentGovernance(sessionId)?.passed,
    socraticIntegrityPassed: task036Repository.getSocraticIntegrity(sessionId)?.passed,
    deenBoundaryPassed: task036Repository.getDeenBoundary(sessionId)?.passed,
    schoolIdentityPassed: task036Repository.getSchoolIdentity(sessionId)?.passed,
    crossSchoolDenialPassed: task036Repository.getCrossSchoolDenial(sessionId)?.passed,
  };

  const totalGates = Object.keys(gates).length;
  const gatesPassed = Object.values(gates).filter(Boolean).length;
  const gatesFailed = Object.values(gates).filter(v => v === false).length;
  const gatesPending = Object.values(gates).filter(v => v === undefined).length;

  const healthBudget = task036Repository.getHealthBudget(sessionId);
  const incidentReadiness = task036Repository.getIncidentReadiness(sessionId);
  const pauseControl = task036Repository.getPauseControl(sessionId);
  const rollbackControl = task036Repository.getRollbackControl(sessionId);
  const killSwitch = task036Repository.getKillSwitchControl(sessionId);

  return {
    ok: true,
    sessionId,
    status: session?.status || 'unknown',
    totalGates,
    gatesPassed,
    gatesFailed,
    gatesPending,
    blockingIssueCount: session?.blockingIssues.length || 0,
    healthBudgetPassed: healthBudget?.healthBudgetPassed ?? false,
    incidentReadinessPassed: incidentReadiness?.ok ?? false,
    pauseReady: pauseControl?.paused ?? false,
    rollbackReady: rollbackControl?.rollbackRequested ?? false,
    killSwitchReady: killSwitch?.killSwitchEnabled ?? false,
    generatedAt: createTask036SafeTimestamp(),
  };
}
