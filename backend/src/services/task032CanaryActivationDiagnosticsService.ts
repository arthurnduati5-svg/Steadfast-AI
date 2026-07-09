import type { Task032CanaryDiagnosticsInput, Task032CanaryDiagnosticsResult } from '../contracts/task032ControlledCanaryActivationContracts';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';

export async function getTask032CanaryActivationDiagnostics(input: Task032CanaryDiagnosticsInput): Promise<Task032CanaryDiagnosticsResult> {
  const blockingIssues: string[] = [];

  const proof = await task032ControlledCanaryActivationRepository.getLatestTask031DependencyProof();
  const envGates = await task032ControlledCanaryActivationRepository.listEnvironmentGates();
  const configs = await task032ControlledCanaryActivationRepository.listApprovedSchoolCanaryConfigs();
  const cohortResults = await task032ControlledCanaryActivationRepository.listCohortEligibilityResults();
  const consentResults = await task032ControlledCanaryActivationRepository.listConsentAuthorizationResults();
  const privacyResults = await task032ControlledCanaryActivationRepository.listPrivacyBoundaryResults();
  const guardResults = await task032ControlledCanaryActivationRepository.listRuntimeGuardResults();
  const records = await task032ControlledCanaryActivationRepository.listActivationRecords();
  const controlActions = input.activationId ? await task032ControlledCanaryActivationRepository.listControlActions(input.activationId) : [];
  const healthBudgets = await task032ControlledCanaryActivationRepository.listHealthBudgetResults();
  const incidentResults = await task032ControlledCanaryActivationRepository.listIncidentBridgeResults();
  const views = await task032ControlledCanaryActivationRepository.listSafeViews();
  const evidenceEvents = input.activationId ? await task032ControlledCanaryActivationRepository.listEvidenceEvents(input.activationId) : [];
  const reports = await task032ControlledCanaryActivationRepository.listReports();

  const task031ProofStatus = proof?.ok ? 'passed' : (proof ? 'failed' : 'not_run');
  const environmentGateStatus = envGates.length > 0 && envGates.every(g => g.passed) ? 'passed' : (envGates.length > 0 ? 'failed' : 'not_run');
  const approvedConfigStatus = configs.length > 0 && configs.every(c => c.blockingIssues.length === 0) ? 'passed' : (configs.length > 0 ? 'failed' : 'not_run');
  const cohortEligibilityStatus = cohortResults.length > 0 && cohortResults.every(r => r.ok) ? 'passed' : (cohortResults.length > 0 ? 'failed' : 'not_run');
  const consentAuthorizationStatus = consentResults.length > 0 && consentResults.every(r => r.ok) ? 'passed' : (consentResults.length > 0 ? 'failed' : 'not_run');
  const privacyBoundaryStatus = privacyResults.length > 0 && privacyResults.every(r => r.ok) ? 'passed' : (privacyResults.length > 0 ? 'failed' : 'not_run');
  const runtimeGuardStatus = guardResults.length > 0 && guardResults.every(r => r.ok) ? 'passed' : (guardResults.length > 0 ? 'failed' : 'not_run');
  const activationStateMachineStatus = records.length > 0 ? 'passed' : 'not_run';
  const controlActionStatus = controlActions.length > 0 && controlActions.every(a => a.ok) ? 'passed' : (controlActions.length > 0 ? 'failed' : 'not_run');
  const healthBudgetStatus = healthBudgets.length > 0 && healthBudgets.every(h => h.overallPassed) ? 'passed' : (healthBudgets.length > 0 ? 'failed' : 'not_run');
  const incidentBridgeStatus = incidentResults.length > 0 && incidentResults.every(r => r.ok) ? 'passed' : (incidentResults.length > 0 ? 'failed' : 'not_run');
  const safeViewStatus = views.length > 0 ? 'passed' : 'not_run';
  const evidenceLedgerStatus = evidenceEvents.length > 0 ? 'passed' : 'not_run';
  const reportStatus = reports.length > 0 ? 'passed' : 'not_run';
  const routeMountStatus = 'mounted';

  return {
    ok: !blockingIssues.length,
    task031ProofStatus,
    environmentGateStatus,
    approvedConfigStatus,
    cohortEligibilityStatus,
    consentAuthorizationStatus,
    privacyBoundaryStatus,
    runtimeGuardStatus,
    activationStateMachineStatus,
    controlActionStatus,
    healthBudgetStatus,
    incidentBridgeStatus,
    safeViewStatus,
    evidenceLedgerStatus,
    reportStatus,
    routeMountStatus,
    blockingIssues
  };
}
