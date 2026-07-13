import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

describe('Task 040 - Repository', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('starts with empty stores', () => {
    expect(task040Repository.getTask036Proof()).toBeNull();
    expect(task040Repository.getAcceptedTaskLedger()).toBeNull();
    expect(task040Repository.getBackendSurfaceManifest()).toBeNull();
    expect(task040Repository.getContractInventory()).toEqual([]);
    expect(task040Repository.getServiceInventory()).toEqual([]);
    expect(task040Repository.getRepositoryInventory()).toEqual([]);
    expect(task040Repository.getTestInventory()).toEqual([]);
    expect(task040Repository.getScriptInventory()).toEqual([]);
    expect(task040Repository.getReportInventory()).toEqual([]);
    expect(task040Repository.getDirtyWorkspaceClassification()).toEqual([]);
    expect(task040Repository.getFutureTaskContaminationManifest()).toEqual([]);
    expect(task040Repository.getOutOfScopeManifest()).toBeNull();
    expect(task040Repository.getNoDriftCheck()).toBeNull();
    expect(task040Repository.getRegressionCheck()).toBeNull();
    expect(task040Repository.getSafetyScanResults()).toEqual([]);
    expect(task040Repository.getChangeControlPolicy()).toBeNull();
    expect(task040Repository.getFreezeManifest()).toBeNull();
    expect(task040Repository.getFreezeDecision()).toBeNull();
    expect(task040Repository.getLatestFreezeReport()).toBeNull();
  });

  it('clearTask040StoresForTests clears all stores', () => {
    const proof = { verified: true, taskId: '036' as const, commitHash: 'abc', handoffPath: '', reportPath: '', jsonReportPath: '', acceptanceVerdict: '', safeToStartTask040: true, finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040', remainingBlockersEmpty: true, dependencyProof: {} as any, checkedAt: '', notes: '' };
    task040Repository.saveTask036Proof(proof);
    task040Repository.clearTask040StoresForTests();
    expect(task040Repository.getTask036Proof()).toBeNull();
  });

  it('saves and retrieves Task 036 proof', () => {
    const proof = { verified: true, taskId: '036' as const, commitHash: 'abc', handoffPath: '', reportPath: '', jsonReportPath: '', acceptanceVerdict: '', safeToStartTask040: true, finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040', remainingBlockersEmpty: true, dependencyProof: {} as any, checkedAt: '', notes: '' };
    task040Repository.saveTask036Proof(proof);
    expect(task040Repository.getTask036Proof()).toEqual(proof);
  });

  it('saves and retrieves accepted task ledger', () => {
    const ledger = { taskId: '040' as const, entries: [], taskCount: 0, complete: false, generatedAt: '' };
    task040Repository.saveAcceptedTaskLedger(ledger);
    expect(task040Repository.getAcceptedTaskLedger()).toEqual(ledger);
  });

  it('saves and retrieves backend surface manifest', () => {
    const manifest = { taskId: '040' as const, routeEntries: [], routeCount: 0, generatedAt: '' };
    task040Repository.saveBackendSurfaceManifest(manifest);
    expect(task040Repository.getBackendSurfaceManifest()).toEqual(manifest);
  });

  it('saves and retrieves contract inventory', () => {
    const entries = [{ path: 'test.ts', taskOwner: '040', category: 'contract' as const, isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }];
    task040Repository.saveContractInventory(entries);
    expect(task040Repository.getContractInventory()).toEqual(entries);
  });

  it('saves and retrieves service inventory', () => {
    const entries = [{ path: 'test.ts', taskOwner: '040', category: 'service' as const, isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }];
    task040Repository.saveServiceInventory(entries);
    expect(task040Repository.getServiceInventory()).toEqual(entries);
  });

  it('saves and retrieves repository inventory', () => {
    const entries = [{ path: 'test.ts', taskOwner: '040', category: 'repository' as const, isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }];
    task040Repository.saveRepositoryInventory(entries);
    expect(task040Repository.getRepositoryInventory()).toEqual(entries);
  });

  it('saves and retrieves test inventory', () => {
    const entries = [{ path: 'test.ts', taskOwner: '040', category: 'test' as const, isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }];
    task040Repository.saveTestInventory(entries);
    expect(task040Repository.getTestInventory()).toEqual(entries);
  });

  it('saves and retrieves script inventory', () => {
    const entries = [{ path: 'test.ts', taskOwner: '040', category: 'script' as const, isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }];
    task040Repository.saveScriptInventory(entries);
    expect(task040Repository.getScriptInventory()).toEqual(entries);
  });

  it('saves and retrieves report inventory', () => {
    const entries = [{ path: 'test.ts', taskOwner: '040', category: 'report' as const, isAcceptedBackendFreezeSurface: true, isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false, classification: 'task040_freeze_artifact', notes: '' }];
    task040Repository.saveReportInventory(entries);
    expect(task040Repository.getReportInventory()).toEqual(entries);
  });

  it('saves and retrieves dirty workspace classification', () => {
    const entries = [{ path: 'test.ts', classification: 'task040_freeze_artifact' as const, isStaged: false, isTrackedModified: false, isUntracked: true }];
    task040Repository.saveDirtyWorkspaceClassification(entries);
    expect(task040Repository.getDirtyWorkspaceClassification()).toEqual(entries);
  });

  it('saves and retrieves future task contamination manifest', () => {
    const entries = [{ path: 'test.ts', pattern: 'task041', classification: '' }];
    task040Repository.saveFutureTaskContaminationManifest(entries);
    expect(task040Repository.getFutureTaskContaminationManifest()).toEqual(entries);
  });

  it('saves and retrieves out-of-scope manifest', () => {
    const manifest = { frontendFiles: [], aiFiles: [], futureTaskFiles: [], generatedOutputFiles: [], logFiles: [], cacheTempFiles: [], notes: '' };
    task040Repository.saveOutOfScopeManifest(manifest);
    expect(task040Repository.getOutOfScopeManifest()).toEqual(manifest);
  });

  it('saves and retrieves no-drift check', () => {
    const result = { ok: true, task036ReportStillAccepted: true, task036SafeToStartTask040StillTrue: true, task040ModifiedTask036Runtime: false, task040ModifiedFrontend: false, task040ModifiedAiRuntime: false, task040ModifiedDeploymentLogic: false, task040IntroducedLiveIntegrations: false, details: [] };
    task040Repository.saveNoDriftCheck(result);
    expect(task040Repository.getNoDriftCheck()).toEqual(result);
  });

  it('saves and retrieves regression check', () => {
    const result = { ok: true, task020To036RegressionPassed: true, phase3RegressionPassed: true, fullBackendSuitePassed: true, typeScriptPassed: true, backendBuildPassed: true, prismaValidatePassed: true, prismaGeneratePassed: true, details: [] };
    task040Repository.saveRegressionCheck(result);
    expect(task040Repository.getRegressionCheck()).toEqual(result);
  });

  it('saves safety scan results and retrieves them', () => {
    const result = { scanName: 'privacy', passed: true, matchesFound: 0, allowedMatches: 0, forbiddenMatches: 0, details: [] };
    task040Repository.saveSafetyScanResult(result);
    const results = task040Repository.getSafetyScanResults();
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(result);
  });

  it('saves and retrieves change control policy', () => {
    const policy = { policyName: 'Task 040 Backend Change Control Policy' as const, createdAt: '', backendFrozen: true, rules: [], statement: '' };
    task040Repository.saveChangeControlPolicy(policy);
    expect(task040Repository.getChangeControlPolicy()).toEqual(policy);
  });

  it('saves and retrieves freeze manifest', () => {
    const manifest = { taskId: '040' as const, taskName: 'Final Backend Logic Freeze' as const, freezeVersion: '', createdAt: '', scope: '', task036DependencyVerified: true, acceptedTaskLedgerCreated: true, acceptedTaskLedgerTaskCount: 0, backendSurfaceManifestCreated: true, contractInventoryCreated: true, serviceInventoryCreated: true, repositoryInventoryCreated: true, testInventoryCreated: true, scriptInventoryCreated: true, reportInventoryCreated: true, dirtyWorkspaceClassified: true, futureTaskContaminationClassified: true, outOfScopeManifestCreated: true, noDriftCheckPassed: true, regressionCheckPassed: true, safetyScansPassed: true, changeControlPolicyCreated: true };
    task040Repository.saveFreezeManifest(manifest);
    expect(task040Repository.getFreezeManifest()).toEqual(manifest);
  });

  it('saves and retrieves freeze decision', () => {
    const decision = { backendFreezeCreated: true, backendFrozenThroughTask036: true, safeToStartFrontendIntegrationOrNextPhase: true, safeToModifyBackendWithoutChangeControl: false, finalDecision: 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED' as const, remainingBlockers: [], proof: [] };
    task040Repository.saveFreezeDecision(decision);
    expect(task040Repository.getFreezeDecision()).toEqual(decision);
  });

  it('saves freeze reports and retrieves latest', () => {
    const r1 = { taskId: '040' as const, taskName: 'test' as const, scope: '', task036DependencyVerified: true, task040Started: '', backendFreezeCreated: true, backendFrozenThroughTask036: true, safeToStartFrontendIntegrationOrNextPhase: true, safeToModifyBackendWithoutChangeControl: false, newProductBehaviorCreated: false, frontendUiCreated: false, aiRuntimeChanged: false, liveAiCallIntroduced: false, liveConnectorWriteIntroduced: false, realNotificationsSent: false, productionDeploymentPerformed: false, prismaMigrationRun: false, productionDataMutationExecuted: false, rawPrivateDataStored: false, acceptedTaskLedgerCreated: true, acceptedTaskLedgerTaskCount: 0, acceptedTaskIds: [], backendSurfaceManifestCreated: true, backendSurfaceRouteCount: 0, contractInventoryCreated: true, serviceInventoryCreated: true, repositoryInventoryCreated: true, testInventoryCreated: true, scriptInventoryCreated: true, reportInventoryCreated: true, dirtyWorkspaceClassified: true, dirtyWorkspaceEntryCount: 0, futureTaskContaminationClassified: true, futureTaskContaminationCount: 0, outOfScopeManifestCreated: true, noDriftCheckRun: true, noDriftCheckPassed: true, task020To036RegressionRun: true, task020To036RegressionPassed: true, phase3RegressionRun: true, phase3RegressionPassed: true, fullBackendSuiteRun: true, fullBackendSuitePassed: true, fullBackendSuiteFailedFiles: [], fullBackendSuiteFailedTests: [], backendTypecheckRun: true, backendTypecheckPassed: true, backendBuildRun: true, backendBuildPassed: true, prismaValidateRun: true, prismaValidatePassed: true, prismaGenerateRun: true, prismaGeneratePassed: true, task040FocusedTestsRun: true, task040FocusedTestsPassed: true, task040FocusedTestFiles: 0, task040FocusedAssertions: 0, task040VerificationScriptRun: true, task040VerificationScriptPassed: true, privacyScanRun: true, privacyScanPassed: true, noProductionMutationScanRun: true, noProductionMutationScanPassed: true, noLiveAiConnectorScanRun: true, noLiveAiConnectorScanPassed: true, noLiveNotificationScanRun: true, noLiveNotificationScanPassed: true, noFrontendUiScanRun: true, noFrontendUiScanPassed: true, noFutureTaskScanRun: true, noFutureTaskScanPassed: true, noFalsePassScanRun: true, noFalsePassScanPassed: true, changeControlPolicyCreated: true, freezeManifestCreated: true, freezeDecisionPassed: true, finalDecision: '', verdict: '', commandsRun: [], filesCreated: [], filesModified: [], filesStaged: [], filesIntentionallyNotStaged: [], remainingBlockers: [], generatedAt: '' };
    task040Repository.saveFreezeReport(r1);
    expect(task040Repository.getLatestFreezeReport()).toEqual(r1);
    const r2 = { ...r1, scope: 'v2' };
    task040Repository.saveFreezeReport(r2);
    expect(task040Repository.getLatestFreezeReport()).toEqual(r2);
  });

  it('getAllFreezeReports returns all reports', () => {
    expect(task040Repository.getAllFreezeReports()).toHaveLength(0);
    const r = { taskId: '040' as const, taskName: 'test' as const, scope: '', task036DependencyVerified: true, task040Started: '', backendFreezeCreated: true, backendFrozenThroughTask036: true, safeToStartFrontendIntegrationOrNextPhase: true, safeToModifyBackendWithoutChangeControl: false, newProductBehaviorCreated: false, frontendUiCreated: false, aiRuntimeChanged: false, liveAiCallIntroduced: false, liveConnectorWriteIntroduced: false, realNotificationsSent: false, productionDeploymentPerformed: false, prismaMigrationRun: false, productionDataMutationExecuted: false, rawPrivateDataStored: false, acceptedTaskLedgerCreated: true, acceptedTaskLedgerTaskCount: 0, acceptedTaskIds: [], backendSurfaceManifestCreated: true, backendSurfaceRouteCount: 0, contractInventoryCreated: true, serviceInventoryCreated: true, repositoryInventoryCreated: true, testInventoryCreated: true, scriptInventoryCreated: true, reportInventoryCreated: true, dirtyWorkspaceClassified: true, dirtyWorkspaceEntryCount: 0, futureTaskContaminationClassified: true, futureTaskContaminationCount: 0, outOfScopeManifestCreated: true, noDriftCheckRun: true, noDriftCheckPassed: true, task020To036RegressionRun: true, task020To036RegressionPassed: true, phase3RegressionRun: true, phase3RegressionPassed: true, fullBackendSuiteRun: true, fullBackendSuitePassed: true, fullBackendSuiteFailedFiles: [], fullBackendSuiteFailedTests: [], backendTypecheckRun: true, backendTypecheckPassed: true, backendBuildRun: true, backendBuildPassed: true, prismaValidateRun: true, prismaValidatePassed: true, prismaGenerateRun: true, prismaGeneratePassed: true, task040FocusedTestsRun: true, task040FocusedTestsPassed: true, task040FocusedTestFiles: 0, task040FocusedAssertions: 0, task040VerificationScriptRun: true, task040VerificationScriptPassed: true, privacyScanRun: true, privacyScanPassed: true, noProductionMutationScanRun: true, noProductionMutationScanPassed: true, noLiveAiConnectorScanRun: true, noLiveAiConnectorScanPassed: true, noLiveNotificationScanRun: true, noLiveNotificationScanPassed: true, noFrontendUiScanRun: true, noFrontendUiScanPassed: true, noFutureTaskScanRun: true, noFutureTaskScanPassed: true, noFalsePassScanRun: true, noFalsePassScanPassed: true, changeControlPolicyCreated: true, freezeManifestCreated: true, freezeDecisionPassed: true, finalDecision: '', verdict: '', commandsRun: [], filesCreated: [], filesModified: [], filesStaged: [], filesIntentionallyNotStaged: [], remainingBlockers: [], generatedAt: '' };
    task040Repository.saveFreezeReport(r);
    expect(task040Repository.getAllFreezeReports()).toHaveLength(1);
  });
});
