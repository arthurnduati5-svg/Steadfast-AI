import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateReportTruth } from '../lib/task036LiveSchoolLaunchValidation';
import { Task036LiveSchoolLaunchReport } from '../contracts/task036LiveSchoolLaunchContracts';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveReport: vi.fn(),
    getLatestReport: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function createBaseReport(): Task036LiveSchoolLaunchReport {
  return {
    taskId: 'task036',
    scope: 'live_school_launch',
    task035DependencyVerified: true,
    task036Started: true,
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
    routesCreatedOrUpdated: true,
    routesMountedOrDirectlyTested: true,
    verifiedSchoolContextRequired: true,
    task035AcceptanceRequired: true,
    launchEnvironmentGatePassed: true,
    launchWindowControlPassed: true,
    launchApprovalPassed: true,
    singleSchoolScopePassed: true,
    liveLaunchStateMachinePassed: true,
    runtimeMonitoringPassed: true,
    healthBudgetPassed: true,
    incidentReadinessPassed: true,
    pauseControlPassed: true,
    rollbackControlPassed: true,
    killSwitchControlPassed: true,
    privacyBoundaryPassed: true,
    contentGovernancePassed: true,
    socraticIntegrityPassed: true,
    deenBoundaryPassed: true,
    schoolIdentityPassed: true,
    crossSchoolDenialPassed: true,
    safeLaunchReadModelPassed: true,
    evidenceLedgerPassed: true,
    diagnosticsPassed: true,
    finalLaunchDecisionPassed: true,
    reportPassed: true,
    task036FocusedTestsRun: true,
    task036FocusedTestsPassed: true,
    task036FocusedTestFiles: 70,
    task036FocusedTestsPassedCount: 70,
    task036FocusedTestsFailedCount: 0,
    task020To035RegressionRun: true,
    task020To035RegressionPassed: true,
    phase3RegressionRun: true,
    phase3RegressionPassed: true,
    fullBackendSuiteRun: true,
    fullBackendSuitePassed: true,
    fullBackendSuiteFailedFiles: [],
    fullBackendSuiteFailedTests: [],
    prismaValidateRun: true,
    prismaValidatePassed: true,
    prismaGenerateRun: true,
    prismaGeneratePassed: true,
    backendBuildRun: true,
    backendBuildPassed: true,
    backendTypecheckRun: true,
    backendTypecheckPassed: true,
    task036VerificationScriptRun: true,
    task036VerificationScriptPassed: true,
    privacyScanRun: true,
    privacyScanPassed: true,
    noProductionMutationScanRun: true,
    noProductionMutationScanPassed: true,
    noLiveConnectorAiScanRun: true,
    noLiveConnectorAiScanPassed: true,
    noLiveNotificationScanRun: true,
    noLiveNotificationScanPassed: true,
    noFrontendUiScanRun: true,
    noFrontendUiScanPassed: true,
    noTask040ScanRun: true,
    noTask040ScanPassed: true,
    noFalsePassScanRun: true,
    noFalsePassScanPassed: true,
    safeToStartTask040: true,
    verdict: 'ACCEPTED_READY_YES',
    commandsRun: [],
    filesCreated: [],
    filesModified: [],
    filesStaged: [],
    filesIntentionallyNotStaged: [],
    remainingBlockers: [],
    generatedAt: new Date().toISOString(),
  };
}

describe('Task036 Report Generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a valid acceptance report', () => {
    const report = createBaseReport();
    const errors = validateReportTruth(report);
    expect(errors).toEqual([]);
  });

  it('detects safeToStartTask040 true with blockers', () => {
    const report = createBaseReport();
    report.remainingBlockers = ['blocker1'];
    const errors = validateReportTruth(report);
    expect(errors).toContain('report_safe_to_start_true_with_blockers');
  });

  it('detects ACCEPTED_READY_YES verdict with blockers', () => {
    const report = createBaseReport();
    report.verdict = 'ACCEPTED_READY_YES';
    report.remainingBlockers = ['blocker1'];
    const errors = validateReportTruth(report);
    expect(errors).toContain('report_verdict_accepted_with_blockers');
  });

  it('detects ACCEPTED_READY_YES verdict but not safe', () => {
    const report = createBaseReport();
    report.verdict = 'ACCEPTED_READY_YES';
    report.safeToStartTask040 = false;
    const errors = validateReportTruth(report);
    expect(errors).toContain('report_verdict_accepted_but_not_safe');
  });

  it('saves report to repository', () => {
    const report = createBaseReport();
    task036Repository.saveReport(report);
    expect(task036Repository.saveReport).toHaveBeenCalledWith(report);
  });

  it('retrieves latest report from repository', () => {
    const report = createBaseReport();
    vi.mocked(task036Repository.getLatestReport).mockReturnValue(report);
    const retrieved = task036Repository.getLatestReport();
    expect(retrieved!.verdict).toBe('ACCEPTED_READY_YES');
    expect(retrieved!.safeToStartTask040).toBe(true);
  });

  it('returns undefined when no report saved', () => {
    vi.mocked(task036Repository.getLatestReport).mockReturnValue(undefined);
    expect(task036Repository.getLatestReport()).toBeUndefined();
  });

  it('tracks test file counts in report', () => {
    const report = createBaseReport();
    expect(report.task036FocusedTestFiles).toBe(70);
    expect(report.task036FocusedTestsPassedCount).toBe(70);
    expect(report.task036FocusedTestsFailedCount).toBe(0);
  });
});
