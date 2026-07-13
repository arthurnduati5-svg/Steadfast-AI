import {
  Task036FinalLaunchDecision,
  calculateTask036FinalLaunchDecision,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function computeFinalLaunchDecision(
  sessionId: string
): Promise<Task036FinalLaunchDecision> {
  const gates: Record<string, boolean> = {
    dependencyProofPassed: task036Repository.getTask035DependencyProof()?.ok ?? false,
    environmentGatePassed: task036Repository.getEnvironmentGate(sessionId)?.passed ?? false,
    launchWindowPassed: task036Repository.getLaunchWindow(sessionId)?.passed ?? false,
    launchApprovalPassed: task036Repository.getLaunchApproval(sessionId)?.passed ?? false,
    singleSchoolScopePassed: task036Repository.getSingleSchoolScope(sessionId)?.passed ?? false,
    privacyBoundaryPassed: task036Repository.getPrivacyBoundary(sessionId)?.passed ?? false,
    contentGovernancePassed: task036Repository.getContentGovernance(sessionId)?.passed ?? false,
    socraticIntegrityPassed: task036Repository.getSocraticIntegrity(sessionId)?.passed ?? false,
    deenBoundaryPassed: task036Repository.getDeenBoundary(sessionId)?.passed ?? false,
    schoolIdentityPassed: task036Repository.getSchoolIdentity(sessionId)?.passed ?? false,
    crossSchoolDenialPassed: task036Repository.getCrossSchoolDenial(sessionId)?.passed ?? false,
    runtimeMonitoringPassed: task036Repository.getRuntimeMonitoring(sessionId)?.ok ?? false,
    healthBudgetPassed: task036Repository.getHealthBudget(sessionId)?.healthBudgetPassed ?? false,
    incidentReadinessPassed: task036Repository.getIncidentReadiness(sessionId)?.ok ?? false,
  };

  const decision = calculateTask036FinalLaunchDecision(gates);

  task036Repository.saveFinalLaunchDecision(sessionId, decision);
  return decision;
}
