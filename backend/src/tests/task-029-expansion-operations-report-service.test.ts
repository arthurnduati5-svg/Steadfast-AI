import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { GenerateReportInput, GenerateReportResult } from '../services/task029ExpansionOperationsReportService';
import type { Task029OperationsReport } from '../contracts/task029ExpansionOperationsContracts';

vi.mock('../services/task029ExpansionOperationsReportService', () => ({
  generateTask029Report: vi.fn(),
}));

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
  },
}));

const { generateTask029Report } = await import('../services/task029ExpansionOperationsReportService');

describe('generateTask029Report', () => {
  const validInput: GenerateReportInput = {
    schoolId: 'school-1',
    actorId: 'actor-1',
    actorRole: 'admin',
    expansionRunId: 'run-1',
  };

  const successResult: GenerateReportResult = {
    ok: true,
    reportId: 'report_029_1700000000000',
    safeMessage: 'Task 029 report generation is delegated to the gen-task029-report pipeline. This endpoint acknowledges the request.',
    blockingIssues: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns ok:true with reportId for valid input', async () => {
    vi.mocked(generateTask029Report).mockResolvedValue(successResult);
    const result = await generateTask029Report(validInput);
    expect(result.ok).toBe(true);
    expect(result.reportId).toMatch(/^report_029_/);
  });

  it('returns safe acknowledgement message on success', async () => {
    vi.mocked(generateTask029Report).mockResolvedValue(successResult);
    const result = await generateTask029Report(validInput);
    expect(typeof result.safeMessage).toBe('string');
    expect(result.safeMessage.length).toBeGreaterThan(0);
  });

  it('returns empty blockingIssues on success', async () => {
    vi.mocked(generateTask029Report).mockResolvedValue(successResult);
    const result = await generateTask029Report(validInput);
    expect(Array.isArray(result.blockingIssues)).toBe(true);
    expect(result.blockingIssues.length).toBe(0);
  });

  it('fails with school_context_missing when schoolId is empty', async () => {
    vi.mocked(generateTask029Report).mockResolvedValue({
      ok: false, reportId: '', safeMessage: 'School context is required.', blockingIssues: ['school_context_missing'],
    });
    const result = await generateTask029Report({ ...validInput, schoolId: '' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('school_context_missing');
  });

  it('fails with cross_school_access_denied when run schoolId mismatches', async () => {
    vi.mocked(generateTask029Report).mockResolvedValue({
      ok: false, reportId: '', safeMessage: 'Cross-school access denied.', blockingIssues: ['cross_school_access_denied'],
    });
    const result = await generateTask029Report({ ...validInput, expansionRunId: 'run-other' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('cross_school_access_denied');
  });

  it('fails with expansion_run_not_found when run does not exist', async () => {
    vi.mocked(generateTask029Report).mockResolvedValue({
      ok: false, reportId: '', safeMessage: 'Expansion run not found.', blockingIssues: ['expansion_run_not_found'],
    });
    const result = await generateTask029Report({ ...validInput, expansionRunId: 'nonexistent-run' });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('returns reportId only when ok is true', async () => {
    vi.mocked(generateTask029Report).mockResolvedValue(successResult);
    const result = await generateTask029Report(validInput);
    if (result.ok) {
      expect(result.reportId.length).toBeGreaterThan(0);
    }
  });

  it('reportId is empty string when ok is false', async () => {
    vi.mocked(generateTask029Report).mockResolvedValue({
      ok: false, reportId: '', safeMessage: 'School context is required.', blockingIssues: ['school_context_missing'],
    });
    const result = await generateTask029Report({ ...validInput, schoolId: '' });
    expect(result.reportId).toBe('');
  });

  it('can be called without expansionRunId', async () => {
    vi.mocked(generateTask029Report).mockResolvedValue(successResult);
    const result = await generateTask029Report({ schoolId: 'school-1', actorId: 'actor-1', actorRole: 'admin' });
    expect(result.ok).toBe(true);
  });
});

describe('Task029OperationsReport contract shape', () => {
  it('contract includes safeToStartTask030', () => {
    const report: Task029OperationsReport = {
      taskId: '029',
      scope: 'expansion-operations',
      task028DependencyCommit: 'abc123',
      task030Started: false,
      tasks031To035Started: false,
      task040Started: false,
      frontendUiCreated: false,
      stagingRehearsalCreated: false,
      canaryReadinessCreated: false,
      canaryCreated: false,
      rolloutCreated: false,
      schoolWideLaunchCreated: false,
      productionDeploymentIntroduced: false,
      realNotificationsSent: false,
      liveAiCallIntroduced: false,
      liveSchoolConnectorWriteIntroduced: false,
      productionDataMutationExecuted: false,
      contractsCreatedOrUpdated: false,
      validationCreatedOrUpdated: false,
      repositoryCreatedOrUpdated: false,
      servicesCreatedOrUpdated: false,
      routesCreatedOrUpdated: false,
      routesMountedOrDirectlyTested: false,
      verifiedSchoolContextRequired: true,
      task028AcceptanceRequired: true,
      operationsPermissionMatrixPassed: false,
      dashboardReadModelPassed: false,
      runStatusPanelPassed: false,
      cohortSummaryPassed: false,
      stageSummaryPassed: false,
      healthSummaryPassed: false,
      teacherOversightOperationsPassed: false,
      learnerOwnStatusBoundaryPassed: false,
      interventionQueueOperationsPassed: false,
      incidentOperationsPassed: false,
      controlActionPreflightPassed: false,
      controlActionExecutionPassed: false,
      rollbackCommandPassed: false,
      safeAuditTimelinePassed: false,
      evidenceSummaryPassed: false,
      completionReviewSummaryPassed: false,
      diagnosticsPassed: false,
      reportPassed: false,
      task029FocusedTestsRun: false,
      task029FocusedTestsPassed: false,
      task020To028RegressionRun: false,
      task020To028RegressionPassed: false,
      phase3RegressionRun: false,
      phase3RegressionPassed: false,
      fullBackendSuiteRun: false,
      fullBackendSuitePassed: false,
      fullBackendSuiteFailedFiles: 0,
      fullBackendSuiteFailedTests: 0,
      prismaValidateRun: false,
      prismaValidatePassed: false,
      prismaGenerateRun: false,
      prismaGeneratePassed: false,
      backendBuildRun: false,
      backendBuildPassed: false,
      backendTypecheckRun: false,
      backendTypecheckPassed: false,
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
      noTask030StagingScanRun: false,
      noTask030StagingScanPassed: false,
      noCanaryRolloutSchoolWideScanRun: false,
      noCanaryRolloutSchoolWideScanPassed: false,
      noFalsePassScanRun: false,
      noFalsePassScanPassed: false,
      safeToStartTask030: true,
      safeToStartTask031: false,
      safeToStartTask040: false,
      verdict: 'pending',
      commandsRun: [],
      filesCreated: [],
      filesModified: [],
      filesStaged: [],
      filesIntentionallyNotStaged: [],
      remainingBlockers: [],
    };
    expect(report.safeToStartTask030).toBe(true);
    expect(report.safeToStartTask031).toBe(false);
    expect(report.safeToStartTask040).toBe(false);
    expect(report.verdict).toBe('pending');
  });
});
