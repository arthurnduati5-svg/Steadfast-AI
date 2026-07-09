import { describe, it, expect, beforeEach } from 'vitest';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Repository', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should record and get latest Task 029 dependency proof', async () => {
    const proof = {
      ok: true,
      commit029Acceptance: 'abc123',
      commit029Implementation: 'def456',
      reportFound: true,
      safeToStartTask030: true,
      finalDecision: 'TASK_029_PASS_SAFE_TO_START_TASK_030',
      blockingIssuesEmpty: true,
      focusedTestsPassed: true,
      regressionsPassed: true,
      fullBackendSuitePassed: true,
      typecheckPassed: true,
      buildPassed: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      safetyScansPassed: true,
      reportsRepaired: true,
      remainingBlockers: [],
      safeMessage: 'ok',
    };
    await task030ControlledStagingRehearsalRepository.recordTask029DependencyProof(proof);
    const latest = await task030ControlledStagingRehearsalRepository.getLatestTask029DependencyProof();
    expect(latest).not.toBeNull();
    expect(latest!.ok).toBe(true);
  });

  it('should return null when no proof recorded', async () => {
    const latest = await task030ControlledStagingRehearsalRepository.getLatestTask029DependencyProof();
    expect(latest).toBeNull();
  });

  it('should record and list environment gates', async () => {
    const gate = { ok: true, environmentType: 'staging', dataMode: 'synthetic', executionMode: 'dry_run', blockingIssues: [], safeSummary: 'ok' };
    await task030ControlledStagingRehearsalRepository.recordEnvironmentGate(gate);
    const gates = await task030ControlledStagingRehearsalRepository.listEnvironmentGates();
    expect(gates).toHaveLength(1);
    expect(gates[0].ok).toBe(true);
  });

  it('should record and get synthetic school fixture', async () => {
    const fixture = {
      schoolId: 'synthetic_school_001',
      adminId: 'admin_001',
      operatorId: 'op_001',
      teacherIds: ['t1'],
      learnerIds: ['l1'],
      parentIds: ['p1'],
      classIds: ['c1'],
      subjectIds: ['s1'],
      cohortIds: ['co1'],
      approvedCurriculumSource: 'cambridge',
      safeLessonMetadata: {},
      safeObjectiveMetadata: {},
      createdAt: new Date().toISOString(),
    };
    await task030ControlledStagingRehearsalRepository.recordSyntheticSchoolFixture(fixture);
    const fetched = await task030ControlledStagingRehearsalRepository.getSyntheticSchoolFixture('synthetic_school_001');
    expect(fetched).not.toBeNull();
    expect(fetched!.adminId).toBe('admin_001');
  });

  it('should return null for missing fixture', async () => {
    const fetched = await task030ControlledStagingRehearsalRepository.getSyntheticSchoolFixture('nonexistent');
    expect(fetched).toBeNull();
  });

  it('should list synthetic school fixtures', async () => {
    const fixture = {
      schoolId: 'synthetic_school_001',
      adminId: 'admin_001',
      operatorId: 'op_001',
      teacherIds: ['t1'],
      learnerIds: ['l1'],
      parentIds: ['p1'],
      classIds: ['c1'],
      subjectIds: ['s1'],
      cohortIds: ['co1'],
      approvedCurriculumSource: 'cambridge',
      safeLessonMetadata: {},
      safeObjectiveMetadata: {},
      createdAt: new Date().toISOString(),
    };
    await task030ControlledStagingRehearsalRepository.recordSyntheticSchoolFixture(fixture);
    const fixtures = await task030ControlledStagingRehearsalRepository.listSyntheticSchoolFixtures();
    expect(fixtures.length).toBeGreaterThanOrEqual(1);
  });

  it('should record and get role token matrix', async () => {
    const matrix = { matrixId: 'matrix_001', tokens: [], createdAt: new Date().toISOString() };
    await task030ControlledStagingRehearsalRepository.recordRoleTokenMatrix(matrix);
    const fetched = await task030ControlledStagingRehearsalRepository.getRoleTokenMatrix('matrix_001');
    expect(fetched).not.toBeNull();
    expect(fetched!.matrixId).toBe('matrix_001');
  });

  it('should create and get rehearsal run', async () => {
    const run = {
      runId: 'run_001', schoolId: 'school_001', environmentType: 'staging', dataMode: 'synthetic',
      executionMode: 'dry_run', status: 'created' as const, preflightResult: null,
      adminOperatorJourneyResult: null, teacherJourneyResult: null, studentJourneyResult: null,
      unknownRoleDenialResult: null, operationsConsoleRehearsalResult: null,
      controlActionRehearsalResult: null, rollbackDrillResult: null, staffTrainingPack: null,
      decision: null, blockingIssues: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await task030ControlledStagingRehearsalRepository.createRehearsalRun(run);
    const fetched = await task030ControlledStagingRehearsalRepository.getRehearsalRun('run_001');
    expect(fetched).not.toBeNull();
  });

  it('should return null for missing rehearsal run', async () => {
    const fetched = await task030ControlledStagingRehearsalRepository.getRehearsalRun('nonexistent');
    expect(fetched).toBeNull();
  });

  it('should update rehearsal run', async () => {
    const run = {
      runId: 'run_001', schoolId: 'school_001', environmentType: 'staging', dataMode: 'synthetic',
      executionMode: 'dry_run', status: 'created' as const, preflightResult: null,
      adminOperatorJourneyResult: null, teacherJourneyResult: null, studentJourneyResult: null,
      unknownRoleDenialResult: null, operationsConsoleRehearsalResult: null,
      controlActionRehearsalResult: null, rollbackDrillResult: null, staffTrainingPack: null,
      decision: null, blockingIssues: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await task030ControlledStagingRehearsalRepository.createRehearsalRun(run);
    await task030ControlledStagingRehearsalRepository.updateRehearsalRun('run_001', { status: 'preflight_running' });
    const fetched = await task030ControlledStagingRehearsalRepository.getRehearsalRun('run_001');
    expect(fetched!.status).toBe('preflight_running');
  });

  it('should list rehearsal runs', async () => {
    const run = {
      runId: 'run_001', schoolId: 'school_001', environmentType: 'staging', dataMode: 'synthetic',
      executionMode: 'dry_run', status: 'created' as const, preflightResult: null,
      adminOperatorJourneyResult: null, teacherJourneyResult: null, studentJourneyResult: null,
      unknownRoleDenialResult: null, operationsConsoleRehearsalResult: null,
      controlActionRehearsalResult: null, rollbackDrillResult: null, staffTrainingPack: null,
      decision: null, blockingIssues: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    await task030ControlledStagingRehearsalRepository.createRehearsalRun(run);
    const runs = await task030ControlledStagingRehearsalRepository.listRehearsalRuns();
    expect(runs.length).toBeGreaterThanOrEqual(1);
  });

  it('should record and list stage results', async () => {
    const stage = { stageId: 'stage_001', runId: 'run_001', status: 'passed' as const, ok: true, blockingIssues: [], safeSummary: 'ok', details: {} };
    await task030ControlledStagingRehearsalRepository.recordStageResult('run_001', stage);
    const stages = await task030ControlledStagingRehearsalRepository.listStageResults('run_001');
    expect(stages).toHaveLength(1);
  });

  it('should record admin operator journey', async () => {
    const result = { ok: true, journeySteps: [], allPassed: true, blockingIssues: [], safeSummary: 'ok' };
    await task030ControlledStagingRehearsalRepository.recordAdminOperatorJourney(result);
    const journeys = (await task030ControlledStagingRehearsalRepository as any).adminOperatorJourneys;
    expect(journeys).toHaveLength(1);
  });

  it('should record teacher journey', async () => {
    const result = { ok: true, journeySteps: [], allPassed: true, blockingIssues: [], safeSummary: 'ok' };
    await task030ControlledStagingRehearsalRepository.recordTeacherJourney(result);
  });

  it('should record student journey', async () => {
    const result = { ok: true, journeySteps: [], allPassed: true, blockingIssues: [], safeSummary: 'ok' };
    await task030ControlledStagingRehearsalRepository.recordStudentJourney(result);
  });

  it('should record unknown role denial', async () => {
    const result = { ok: true, deniedRoutes: [], allDenied: true, blockingIssues: [], safeSummary: 'ok' };
    await task030ControlledStagingRehearsalRepository.recordUnknownRoleDenial(result);
  });

  it('should record operations console rehearsal', async () => {
    const result = { ok: true, consoleComponents: [], allPassed: true, blockingIssues: [], safeSummary: 'ok' };
    await task030ControlledStagingRehearsalRepository.recordOperationsConsoleRehearsal(result);
  });

  it('should record control action rehearsal', async () => {
    const result = { ok: true, actions: [], allPassed: true, blockingIssues: [], safeSummary: 'ok' };
    await task030ControlledStagingRehearsalRepository.recordControlActionRehearsal(result);
  });

  it('should record rollback drill', async () => {
    const result = { ok: true, drillSteps: [], allPassed: true, destructiveDeletePrevented: true, auditPreserved: true, blockingIssues: [], safeSummary: 'ok' };
    await task030ControlledStagingRehearsalRepository.recordRollbackDrill(result);
  });

  it('should record staff training pack', async () => {
    const pack = { packId: 'pack_001', runId: 'run_001', checklists: [], generatedAt: new Date().toISOString() };
    await task030ControlledStagingRehearsalRepository.recordStaffTrainingPack(pack);
  });

  it('should record and list evidence events', async () => {
    const event = { eventId: 'evt_001', runId: 'run_001', scenarioId: 'sc_001', stageId: 'stg_001', actorRole: 'admin', syntheticRole: 'synthetic_admin', status: 'passed', safeSummary: 'ok', reasonCodes: [], createdAt: new Date().toISOString() };
    await task030ControlledStagingRehearsalRepository.recordEvidenceEvent(event);
    const events = await task030ControlledStagingRehearsalRepository.listEvidenceEvents('run_001');
    expect(events).toHaveLength(1);
  });

  it('should record and list diagnostics', async () => {
    const diag = {
      ok: true, task029ProofLoaderStatus: 'passed' as const, stagingEnvironmentGateStatus: 'passed' as const,
      fixtureServiceStatus: 'passed' as const, roleTokenMatrixStatus: 'passed' as const, journeyServicesStatus: 'passed' as const,
      operationsConsoleRehearsalStatus: 'passed' as const, rollbackDrillStatus: 'passed' as const, reportStatus: 'not_checked' as const,
      safetyScanReadiness: 'passed' as const, routeMountStatus: 'passed' as const, blockingIssues: [], safeSummary: 'ok',
    };
    await task030ControlledStagingRehearsalRepository.recordDiagnostics(diag);
    const list = await task030ControlledStagingRehearsalRepository.listDiagnostics();
    expect(list).toHaveLength(1);
  });

  it('should record and get latest report', async () => {
    const report = { taskId: '030', scope: 'test', task029AcceptanceCommit: '', task029ImplementationCommit: '', task029DependencyVerified: true, task030Started: true, task031Started: false, task032Started: false, task033Started: false, task034Started: false, task035Started: false, task040Started: false, frontendUiCreated: false, productionDeploymentIntroduced: false, realNotificationsSent: false, liveAiCallIntroduced: false, liveSchoolConnectorWriteIntroduced: false, productionDataMutationExecuted: false, realStudentDataUsed: false, syntheticDataOnly: true, stagingEnvironmentOnly: true, dryRunOnly: true, contractsCreatedOrUpdated: true, validationCreatedOrUpdated: true, repositoryCreatedOrUpdated: true, servicesCreatedOrUpdated: true, routesCreatedOrUpdated: false, routesMountedOrDirectlyTested: false, verifiedSchoolContextRequired: true, task029AcceptanceRequired: true, stagingEnvironmentGatePassed: true, syntheticSchoolFixturePassed: true, roleTokenMatrixPassed: true, rehearsalRunStateMachinePassed: true, adminOperatorJourneyPassed: true, teacherJourneyPassed: true, studentJourneyPassed: true, unknownRoleDenialPassed: true, operationsConsoleRehearsalPassed: true, controlActionRehearsalPassed: true, rollbackDrillPassed: true, staffTrainingPackPassed: true, evidenceLedgerPassed: true, diagnosticsPassed: true, reportPassed: true, task030FocusedTestsRun: true, task030FocusedTestsPassed: true, task030FocusedTestFiles: 0, task030FocusedTestsPassedCount: 1, task030FocusedTestsFailedCount: 0, task020To029RegressionRun: true, task020To029RegressionPassed: true, phase3RegressionRun: true, phase3RegressionPassed: true, fullBackendSuiteRun: true, fullBackendSuitePassed: true, fullBackendSuiteFailedFiles: 0, fullBackendSuiteFailedTests: 0, prismaValidateRun: true, prismaValidatePassed: true, prismaGenerateRun: true, prismaGeneratePassed: true, backendBuildRun: true, backendBuildPassed: true, backendTypecheckRun: true, backendTypecheckPassed: true, task030VerificationScriptRun: true, task030VerificationScriptPassed: true, privacyScanRun: true, privacyScanPassed: true, noProductionMutationScanRun: true, noProductionMutationScanPassed: true, noLiveConnectorAiScanRun: true, noLiveConnectorAiScanPassed: true, noLiveNotificationScanRun: true, noLiveNotificationScanPassed: true, noFrontendUiScanRun: true, noFrontendUiScanPassed: true, noTask031ToTask040ScanRun: true, noTask031ToTask040ScanPassed: true, noFalsePassScanRun: true, noFalsePassScanPassed: true, safeToStartTask031: true, safeToStartTask032: false, safeToStartTask033: false, safeToStartTask034: false, safeToStartTask035: false, safeToStartTask040: false, verdict: 'ACCEPTED_READY_YES' as const, commandsRun: [], filesCreated: [], filesModified: [], filesStaged: [], filesIntentionallyNotStaged: [], remainingBlockers: [] };
    await task030ControlledStagingRehearsalRepository.recordReport(report);
    const latest = await task030ControlledStagingRehearsalRepository.getLatestReport();
    expect(latest).not.toBeNull();
    expect(latest!.taskId).toBe('030');
  });

  it('should list reports', async () => {
    const report = { taskId: '030', scope: 'test', task029AcceptanceCommit: '', task029ImplementationCommit: '', task029DependencyVerified: true, task030Started: true, task031Started: false, task032Started: false, task033Started: false, task034Started: false, task035Started: false, task040Started: false, frontendUiCreated: false, productionDeploymentIntroduced: false, realNotificationsSent: false, liveAiCallIntroduced: false, liveSchoolConnectorWriteIntroduced: false, productionDataMutationExecuted: false, realStudentDataUsed: false, syntheticDataOnly: true, stagingEnvironmentOnly: true, dryRunOnly: true, contractsCreatedOrUpdated: true, validationCreatedOrUpdated: true, repositoryCreatedOrUpdated: true, servicesCreatedOrUpdated: true, routesCreatedOrUpdated: false, routesMountedOrDirectlyTested: false, verifiedSchoolContextRequired: true, task029AcceptanceRequired: true, stagingEnvironmentGatePassed: true, syntheticSchoolFixturePassed: true, roleTokenMatrixPassed: true, rehearsalRunStateMachinePassed: true, adminOperatorJourneyPassed: true, teacherJourneyPassed: true, studentJourneyPassed: true, unknownRoleDenialPassed: true, operationsConsoleRehearsalPassed: true, controlActionRehearsalPassed: true, rollbackDrillPassed: true, staffTrainingPackPassed: true, evidenceLedgerPassed: true, diagnosticsPassed: true, reportPassed: true, task030FocusedTestsRun: true, task030FocusedTestsPassed: true, task030FocusedTestFiles: 0, task030FocusedTestsPassedCount: 1, task030FocusedTestsFailedCount: 0, task020To029RegressionRun: true, task020To029RegressionPassed: true, phase3RegressionRun: true, phase3RegressionPassed: true, fullBackendSuiteRun: true, fullBackendSuitePassed: true, fullBackendSuiteFailedFiles: 0, fullBackendSuiteFailedTests: 0, prismaValidateRun: true, prismaValidatePassed: true, prismaGenerateRun: true, prismaGeneratePassed: true, backendBuildRun: true, backendBuildPassed: true, backendTypecheckRun: true, backendTypecheckPassed: true, task030VerificationScriptRun: true, task030VerificationScriptPassed: true, privacyScanRun: true, privacyScanPassed: true, noProductionMutationScanRun: true, noProductionMutationScanPassed: true, noLiveConnectorAiScanRun: true, noLiveConnectorAiScanPassed: true, noLiveNotificationScanRun: true, noLiveNotificationScanPassed: true, noFrontendUiScanRun: true, noFrontendUiScanPassed: true, noTask031ToTask040ScanRun: true, noTask031ToTask040ScanPassed: true, noFalsePassScanRun: true, noFalsePassScanPassed: true, safeToStartTask031: true, safeToStartTask032: false, safeToStartTask033: false, safeToStartTask034: false, safeToStartTask035: false, safeToStartTask040: false, verdict: 'ACCEPTED_READY_YES' as const, commandsRun: [], filesCreated: [], filesModified: [], filesStaged: [], filesIntentionallyNotStaged: [], remainingBlockers: [] };
    await task030ControlledStagingRehearsalRepository.recordReport(report);
    const reports = await task030ControlledStagingRehearsalRepository.listReports();
    expect(reports.length).toBeGreaterThanOrEqual(1);
  });

  it('should return null for latest report when none exist', async () => {
    const latest = await task030ControlledStagingRehearsalRepository.getLatestReport();
    expect(latest).toBeNull();
  });

  it('should clear all stores', async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
    const latest = await task030ControlledStagingRehearsalRepository.getLatestReport();
    expect(latest).toBeNull();
  });

  it('should update rehearsal run only if exists', async () => {
    await task030ControlledStagingRehearsalRepository.updateRehearsalRun('nonexistent', { status: 'blocked' });
    const fetched = await task030ControlledStagingRehearsalRepository.getRehearsalRun('nonexistent');
    expect(fetched).toBeNull();
  });
});
