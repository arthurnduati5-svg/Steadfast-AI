import { describe, it, expect } from 'vitest';
import { validateReportTruth, validateFinalLaunchDecision } from '../lib/task036LiveSchoolLaunchValidation';
import { calculateTask036FinalLaunchDecision } from '../contracts/task036LiveSchoolLaunchContracts';
import { Task036LiveSchoolLaunchReport } from '../contracts/task036LiveSchoolLaunchContracts';

function createTruthfulReport(): Task036LiveSchoolLaunchReport {
  return {
    taskId: 'task036', scope: 'live_school_launch',
    task035DependencyVerified: true, task036Started: true, task040Started: false,
    frontendUiCreated: false, publicLaunchCreated: false,
    multiSchoolRolloutCreated: false, backendFreezeCreated: false,
    productionDeploymentIntroduced: false, realNotificationsSent: false,
    liveAiExpansionIntroduced: false, liveSchoolConnectorWriteExpansionIntroduced: false,
    productionDataMutationExecuted: false, rawPrivateDataStored: false,
    controlledLiveSchoolLaunchCreated: true, contractsCreatedOrUpdated: true,
    validationCreatedOrUpdated: true, repositoryCreatedOrUpdated: true,
    servicesCreatedOrUpdated: true, routesCreatedOrUpdated: true,
    routesMountedOrDirectlyTested: true, verifiedSchoolContextRequired: true,
    task035AcceptanceRequired: true, launchEnvironmentGatePassed: true,
    launchWindowControlPassed: true, launchApprovalPassed: true,
    singleSchoolScopePassed: true, liveLaunchStateMachinePassed: true,
    runtimeMonitoringPassed: true, healthBudgetPassed: true,
    incidentReadinessPassed: true, pauseControlPassed: true,
    rollbackControlPassed: true, killSwitchControlPassed: true,
    privacyBoundaryPassed: true, contentGovernancePassed: true,
    socraticIntegrityPassed: true, deenBoundaryPassed: true,
    schoolIdentityPassed: true, crossSchoolDenialPassed: true,
    safeLaunchReadModelPassed: true, evidenceLedgerPassed: true,
    diagnosticsPassed: true, finalLaunchDecisionPassed: true, reportPassed: true,
    task036FocusedTestsRun: true, task036FocusedTestsPassed: true,
    task036FocusedTestFiles: 70, task036FocusedTestsPassedCount: 70,
    task036FocusedTestsFailedCount: 0,
    task020To035RegressionRun: true, task020To035RegressionPassed: true,
    phase3RegressionRun: true, phase3RegressionPassed: true,
    fullBackendSuiteRun: true, fullBackendSuitePassed: true,
    fullBackendSuiteFailedFiles: [], fullBackendSuiteFailedTests: [],
    prismaValidateRun: true, prismaValidatePassed: true,
    prismaGenerateRun: true, prismaGeneratePassed: true,
    backendBuildRun: true, backendBuildPassed: true,
    backendTypecheckRun: true, backendTypecheckPassed: true,
    task036VerificationScriptRun: true, task036VerificationScriptPassed: true,
    privacyScanRun: true, privacyScanPassed: true,
    noProductionMutationScanRun: true, noProductionMutationScanPassed: true,
    noLiveConnectorAiScanRun: true, noLiveConnectorAiScanPassed: true,
    noLiveNotificationScanRun: true, noLiveNotificationScanPassed: true,
    noFrontendUiScanRun: true, noFrontendUiScanPassed: true,
    noTask040ScanRun: true, noTask040ScanPassed: true,
    noFalsePassScanRun: true, noFalsePassScanPassed: true,
    safeToStartTask040: true, verdict: 'ACCEPTED_READY_YES',
    commandsRun: [], filesCreated: [], filesModified: [],
    filesStaged: [], filesIntentionallyNotStaged: [],
    remainingBlockers: [], generatedAt: new Date().toISOString(),
  };
}

describe('Task036 Report Truth Smoke', () => {
  it('truthful report passes validation', () => {
    const report = createTruthfulReport();
    expect(validateReportTruth(report)).toEqual([]);
  });

  it('lies are detected: safeToStartTask040 true with blockers', () => {
    const report = createTruthfulReport();
    report.remainingBlockers = ['environmentGatePassed'];
    report.safeToStartTask040 = true;
    const errors = validateReportTruth(report);
    expect(errors).toContain('report_safe_to_start_true_with_blockers');
  });

  it('lies are detected: ACCEPTED_READY_YES with blockers', () => {
    const report = createTruthfulReport();
    report.remainingBlockers = ['something'];
    report.verdict = 'ACCEPTED_READY_YES';
    const errors = validateReportTruth(report);
    expect(errors).toContain('report_verdict_accepted_with_blockers');
  });

  it('lies are detected: ACCEPTED_READY_YES but not safe', () => {
    const report = createTruthfulReport();
    report.safeToStartTask040 = false;
    report.verdict = 'ACCEPTED_READY_YES';
    const errors = validateReportTruth(report);
    expect(errors).toContain('report_verdict_accepted_but_not_safe');
  });

  it('decision validation detects inconsistencies', () => {
    const gates: Record<string, boolean> = {
      environmentGatePassed: true, launchWindowPassed: true,
      launchApprovalPassed: true, singleSchoolScopePassed: true,
      privacyBoundaryPassed: true, contentGovernancePassed: true,
      socraticIntegrityPassed: true, deenBoundaryPassed: true,
      schoolIdentityPassed: true, crossSchoolDenialPassed: true,
      runtimeMonitoringPassed: true, healthBudgetPassed: true,
      incidentReadinessPassed: true, dependencyProofPassed: true,
    };
    const decision = calculateTask036FinalLaunchDecision(gates);
    expect(validateFinalLaunchDecision(decision)).toEqual([]);
  });

  it('truthful report has consistent scan results', () => {
    const report = createTruthfulReport();
    expect(report.privacyScanRun).toBe(true);
    expect(report.privacyScanPassed).toBe(true);
    expect(report.noProductionMutationScanRun).toBe(true);
    expect(report.noLiveConnectorAiScanRun).toBe(true);
    expect(report.noLiveNotificationScanRun).toBe(true);
    expect(report.noFrontendUiScanRun).toBe(true);
    expect(report.noTask040ScanRun).toBe(true);
    expect(report.noFalsePassScanRun).toBe(true);
  });

  it('truthful report has no blockers and accepted verdict', () => {
    const report = createTruthfulReport();
    expect(report.verdict).toBe('ACCEPTED_READY_YES');
    expect(report.remainingBlockers).toEqual([]);
    expect(report.safeToStartTask040).toBe(true);
  });
});
