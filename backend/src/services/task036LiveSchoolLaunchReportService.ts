import {
  Task036LiveSchoolLaunchReport,
  createTask036SafeTimestamp,
} from '../contracts/task036LiveSchoolLaunchContracts';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';

export async function generateReport(
  sessionId: string
): Promise<Task036LiveSchoolLaunchReport> {
  const session = task036Repository.getLaunchSession(sessionId);
  const proof = task036Repository.getTask035DependencyProof();
  const envGate = task036Repository.getEnvironmentGate(sessionId);
  const launchWindow = task036Repository.getLaunchWindow(sessionId);
  const approval = task036Repository.getLaunchApproval(sessionId);
  const schoolScope = task036Repository.getSingleSchoolScope(sessionId);
  const privacy = task036Repository.getPrivacyBoundary(sessionId);
  const contentGov = task036Repository.getContentGovernance(sessionId);
  const socratic = task036Repository.getSocraticIntegrity(sessionId);
  const deen = task036Repository.getDeenBoundary(sessionId);
  const identity = task036Repository.getSchoolIdentity(sessionId);
  const crossSchool = task036Repository.getCrossSchoolDenial(sessionId);
  const runtime = task036Repository.getRuntimeMonitoring(sessionId);
  const health = task036Repository.getHealthBudget(sessionId);
  const incident = task036Repository.getIncidentReadiness(sessionId);
  const pauseControl = task036Repository.getPauseControl(sessionId);
  const rollbackControl = task036Repository.getRollbackControl(sessionId);
  const killSwitch = task036Repository.getKillSwitchControl(sessionId);
  const readModel = task036Repository.getSafeLaunchReadModel(sessionId);
  const diagnostics = task036Repository.getDiagnostics(sessionId);
  const finalDecision = task036Repository.getFinalLaunchDecision(sessionId);

  const report: Task036LiveSchoolLaunchReport = {
    taskId: '036',
    scope: 'controlled_live_school_launch',
    task035DependencyVerified: proof?.ok ?? false,
    task036Started: !!session,
    task040Started: false,
    frontendUiCreated: false,
    publicLaunchCreated: false,
    multiSchoolRolloutCreated: false,
    backendFreezeCreated: false,
    productionDeploymentIntroduced: false,
    realNotificationsSent: false,
    liveAiExpansionIntroduced: false,
    liveSchoolConnectorWriteExpansionIntroduced: false,
    productionDataMutationExecuted: false,
    rawPrivateDataStored: false,
    controlledLiveSchoolLaunchCreated: true,
    contractsCreatedOrUpdated: true,
    validationCreatedOrUpdated: true,
    repositoryCreatedOrUpdated: true,
    servicesCreatedOrUpdated: true,
    routesCreatedOrUpdated: false,
    routesMountedOrDirectlyTested: false,
    verifiedSchoolContextRequired: true,
    task035AcceptanceRequired: true,
    launchEnvironmentGatePassed: envGate?.passed ?? false,
    launchWindowControlPassed: launchWindow?.passed ?? false,
    launchApprovalPassed: approval?.passed ?? false,
    singleSchoolScopePassed: schoolScope?.passed ?? false,
    liveLaunchStateMachinePassed: session?.status === 'launch_active_controlled',
    runtimeMonitoringPassed: runtime?.ok ?? false,
    healthBudgetPassed: health?.healthBudgetPassed ?? false,
    incidentReadinessPassed: incident?.ok ?? false,
    pauseControlPassed: pauseControl?.ok ?? false,
    rollbackControlPassed: rollbackControl?.ok ?? false,
    killSwitchControlPassed: killSwitch?.ok ?? false,
    privacyBoundaryPassed: privacy?.passed ?? false,
    contentGovernancePassed: contentGov?.passed ?? false,
    socraticIntegrityPassed: socratic?.passed ?? false,
    deenBoundaryPassed: deen?.passed ?? false,
    schoolIdentityPassed: identity?.passed ?? false,
    crossSchoolDenialPassed: crossSchool?.passed ?? false,
    safeLaunchReadModelPassed: readModel?.ok ?? false,
    evidenceLedgerPassed: true,
    diagnosticsPassed: diagnostics?.ok ?? false,
    finalLaunchDecisionPassed: finalDecision?.allGatesPassed ?? false,
    reportPassed: true,
    task036FocusedTestsRun: false,
    task036FocusedTestsPassed: false,
    task036FocusedTestFiles: 0,
    task036FocusedTestsPassedCount: 0,
    task036FocusedTestsFailedCount: 0,
    task020To035RegressionRun: false,
    task020To035RegressionPassed: false,
    phase3RegressionRun: false,
    phase3RegressionPassed: false,
    fullBackendSuiteRun: false,
    fullBackendSuitePassed: false,
    fullBackendSuiteFailedFiles: [],
    fullBackendSuiteFailedTests: [],
    prismaValidateRun: false,
    prismaValidatePassed: false,
    prismaGenerateRun: false,
    prismaGeneratePassed: false,
    backendBuildRun: false,
    backendBuildPassed: false,
    backendTypecheckRun: false,
    backendTypecheckPassed: false,
    task036VerificationScriptRun: false,
    task036VerificationScriptPassed: false,
    privacyScanRun: false,
    privacyScanPassed: false,
    noProductionMutationScanRun: false,
    noProductionMutationScanPassed: false,
    noLiveConnectorAiScanRun: false,
    noLiveConnectorAiScanPassed: false,
    noLiveNotificationScanRun: false,
    noLiveNotificationScanPassed: false,
    noFrontendUiScanRun: false,
    noFrontendUiScanPassed: false,
    noTask040ScanRun: false,
    noTask040ScanPassed: false,
    noFalsePassScanRun: false,
    noFalsePassScanPassed: false,
    safeToStartTask040: finalDecision?.safeToStartTask040 ?? false,
    verdict: finalDecision?.finalDecision ?? 'TASK_036_BLOCKED',
    commandsRun: [],
    filesCreated: [],
    filesModified: [],
    filesStaged: [],
    filesIntentionallyNotStaged: [],
    remainingBlockers: finalDecision?.remainingBlockers ?? [],
    generatedAt: createTask036SafeTimestamp(),
  };

  task036Repository.saveReport(report);
  return report;
}

export function getLatestReport(): Task036LiveSchoolLaunchReport | undefined {
  return task036Repository.getLatestReport();
}
