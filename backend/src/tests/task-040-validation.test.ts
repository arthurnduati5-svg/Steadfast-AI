import { describe, it, expect } from 'vitest';
import {
  validateTask036Proof,
  validateAcceptedTaskLedger,
  validateBackendSurfaceManifest,
  validateContractInventory,
  validateServiceInventory,
  validateRepositoryInventory,
  validateTestInventory,
  validateScriptInventory,
  validateReportInventory,
  validateDirtyWorkspaceClassification,
  validateFutureTaskContamination,
  validateOutOfScopeManifest,
  validateNoDriftCheck,
  validateRegressionCheck,
  validateSafetyScanResults,
  validateChangeControlPolicy,
  validateFreezeManifest,
  validateFreezeDecision,
  validateFreezeReport,
  validateForbiddenOutputFields,
  validateForbiddenSideEffects,
  validateForbiddenMutationPatterns,
  validateForbiddenStagedPaths,
  validateAllowedStagedPaths,
} from '../lib/task040BackendFreezeValidation';

describe('Task 040 - Validation', () => {
  describe('validateTask036Proof', () => {
    it('rejects null proof', () => {
      const result = validateTask036Proof(null);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects unverified proof', () => {
      const result = validateTask036Proof({
        verified: false,
        taskId: '036',
        commitHash: '',
        handoffPath: '',
        reportPath: '',
        jsonReportPath: '',
        acceptanceVerdict: 'NOT_VERIFIED',
        safeToStartTask040: false,
        finalDecision: 'TASK_036_BLOCKED',
        remainingBlockersEmpty: false,
        dependencyProof: { ok: false, taskId: '036', commitExists: false, commitHash: '', commitMessage: '', handoffExists: false, reportExists: false, jsonReportExists: false, verdictIsAcceptedReadyYes: false, safeToStartTask040: false, finalDecision: '', remainingBlockersEmpty: false, focusedTestsPassed: false, focusedTestFileCount: 0, focusedAssertionCount: 0, fullBackendSuitePassed: false, typeScriptPassed: false, backendBuildPassed: false, prismaValidatePassed: false, prismaGeneratePassed: false, safetyScansPassed: false, noFrontendUiCommitted: true, noAiFilesCommitted: true, noTask040ImplementationCommitted: true, noBackendDistCommitted: true, noLogsCommitted: true, noGeneratedCacheTempCommitted: true, verificationScriptPassed: false, notes: '' },
        checkedAt: '',
        notes: '',
      });
      expect(result.valid).toBe(false);
    });

    it('passes with valid verified proof', () => {
      const result = validateTask036Proof({
        verified: true,
        taskId: '036',
        commitHash: '45f361c',
        handoffPath: 'handoff.md',
        reportPath: 'report.md',
        jsonReportPath: 'report.json',
        acceptanceVerdict: 'ACCEPTED_READY_YES',
        safeToStartTask040: true,
        finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040',
        remainingBlockersEmpty: true,
        dependencyProof: { ok: true, taskId: '036', commitExists: true, commitHash: '45f361c', commitMessage: '', handoffExists: true, reportExists: true, jsonReportExists: true, verdictIsAcceptedReadyYes: true, safeToStartTask040: true, finalDecision: '', remainingBlockersEmpty: true, focusedTestsPassed: true, focusedTestFileCount: 70, focusedAssertionCount: 650, fullBackendSuitePassed: true, typeScriptPassed: true, backendBuildPassed: true, prismaValidatePassed: true, prismaGeneratePassed: true, safetyScansPassed: true, noFrontendUiCommitted: true, noAiFilesCommitted: true, noTask040ImplementationCommitted: true, noBackendDistCommitted: true, noLogsCommitted: true, noGeneratedCacheTempCommitted: true, verificationScriptPassed: true, notes: '' },
        checkedAt: new Date().toISOString(),
        notes: '',
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateAcceptedTaskLedger', () => {
    it('rejects null ledger', () => {
      const result = validateAcceptedTaskLedger(null);
      expect(result.valid).toBe(false);
    });

    it('rejects empty ledger', () => {
      const result = validateAcceptedTaskLedger({
        taskId: '040',
        entries: [],
        taskCount: 0,
        complete: false,
        generatedAt: '',
      });
      expect(result.valid).toBe(false);
    });

    it('passes with full ledger', () => {
      const entries = ['020', '021', '022', '023', '024', '025', '026', '027', '028', '029', '030', '031', '032', '033', '034', '035', '036'].map(id => ({
        taskId: id,
        taskName: `Task ${id}`,
        status: 'accepted',
        acceptedCommit: 'commit',
        safeToStartNextTask: true,
        safeToStartTask040ValueAtThatStage: true,
        reportPath: '',
        jsonReportPath: '',
        handoffPath: '',
        focusedTestsPassed: true,
        regressionPassed: true,
        fullBackendSuitePassed: true,
        typeScriptPassed: true,
        backendBuildPassed: true,
        prismaValidatePassed: true,
        prismaGeneratePassed: true,
        safetyScansPassed: true,
        frontendUiCreated: false,
        liveAiIntroduced: false,
        liveConnectorWriteIntroduced: false,
        realNotificationsSent: false,
        productionDeploymentPerformed: false,
        productionMutationPerformed: false,
        remainingBlockers: [],
        notes: '',
      }));

      const result = validateAcceptedTaskLedger({
        taskId: '040',
        entries,
        taskCount: 17,
        complete: true,
        generatedAt: new Date().toISOString(),
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateBackendSurfaceManifest', () => {
    it('rejects null manifest', () => {
      expect(validateBackendSurfaceManifest(null).valid).toBe(false);
    });

    it('passes with valid manifest', () => {
      const result = validateBackendSurfaceManifest({
        taskId: '040',
        routeEntries: [{ routePrefix: '/api/test', routeFile: 'test.ts', mountedInIndex: true, middlewareUsed: [], requiresVerifiedSchoolContext: true, requiresRoleScope: true, safeReadOnly: false, taskOwner: '040', acceptedTaskId: '040', status: 'mounted', notes: '' }],
        routeCount: 1,
        generatedAt: new Date().toISOString(),
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateContractInventory', () => {
    it('rejects empty inventory', () => {
      expect(validateContractInventory([]).valid).toBe(false);
    });

    it('rejects null', () => {
      expect(validateContractInventory(null).valid).toBe(false);
    });

    it('passes with entries', () => {
      const result = validateContractInventory([{
        path: 'test.ts', taskOwner: '040', category: 'contract', isAcceptedBackendFreezeSurface: true,
        isGeneratedOutput: false, isLogOutput: false, isFrontend: false, isAI: false, isFutureTask: false,
        classification: 'task040_freeze_artifact', notes: '',
      }]);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateServiceInventory', () => {
    it('rejects empty', () => {
      expect(validateServiceInventory(null).valid).toBe(false);
    });
  });

  describe('validateRepositoryInventory', () => {
    it('rejects empty', () => {
      expect(validateRepositoryInventory(null).valid).toBe(false);
    });
  });

  describe('validateTestInventory', () => {
    it('rejects empty', () => {
      expect(validateTestInventory(null).valid).toBe(false);
    });
  });

  describe('validateScriptInventory', () => {
    it('rejects empty', () => {
      expect(validateScriptInventory(null).valid).toBe(false);
    });
  });

  describe('validateReportInventory', () => {
    it('rejects empty', () => {
      expect(validateReportInventory(null).valid).toBe(false);
    });
  });

  describe('validateDirtyWorkspaceClassification', () => {
    it('rejects null', () => {
      expect(validateDirtyWorkspaceClassification(null).valid).toBe(false);
    });

    it('rejects unknown entries', () => {
      const result = validateDirtyWorkspaceClassification([
        { path: 'unknown.txt', classification: 'unknown', isStaged: false, isTrackedModified: false, isUntracked: true },
      ]);
      expect(result.valid).toBe(false);
    });

    it('passes with classified entries', () => {
      const result = validateDirtyWorkspaceClassification([
        { path: 'test.ts', classification: 'task040_freeze_artifact', isStaged: false, isTrackedModified: false, isUntracked: true },
      ]);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateFutureTaskContamination', () => {
    it('rejects null', () => {
      expect(validateFutureTaskContamination(null).valid).toBe(false);
    });

    it('passes with empty entries', () => {
      expect(validateFutureTaskContamination([]).valid).toBe(true);
    });
  });

  describe('validateOutOfScopeManifest', () => {
    it('rejects null', () => {
      expect(validateOutOfScopeManifest(null).valid).toBe(false);
    });

    it('passes with valid manifest', () => {
      const result = validateOutOfScopeManifest({
        frontendFiles: [],
        aiFiles: [],
        futureTaskFiles: [],
        generatedOutputFiles: [],
        logFiles: [],
        cacheTempFiles: [],
        notes: '',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateNoDriftCheck', () => {
    it('rejects null', () => {
      expect(validateNoDriftCheck(null).valid).toBe(false);
    });

    it('rejects drift', () => {
      const result = validateNoDriftCheck({
        ok: false, task036ReportStillAccepted: true, task036SafeToStartTask040StillTrue: true,
        task040ModifiedTask036Runtime: false, task040ModifiedFrontend: true, task040ModifiedAiRuntime: false,
        task040ModifiedDeploymentLogic: false, task040IntroducedLiveIntegrations: false, details: ['frontend drift'],
      });
      expect(result.valid).toBe(false);
    });

    it('passes with no drift', () => {
      const result = validateNoDriftCheck({
        ok: true, task036ReportStillAccepted: true, task036SafeToStartTask040StillTrue: true,
        task040ModifiedTask036Runtime: false, task040ModifiedFrontend: false, task040ModifiedAiRuntime: false,
        task040ModifiedDeploymentLogic: false, task040IntroducedLiveIntegrations: false, details: [],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateRegressionCheck', () => {
    it('rejects null', () => {
      expect(validateRegressionCheck(null).valid).toBe(false);
    });

    it('passes with ok result', () => {
      const result = validateRegressionCheck({
        ok: true, task020To036RegressionPassed: true, phase3RegressionPassed: true,
        fullBackendSuitePassed: true, typeScriptPassed: true, backendBuildPassed: true,
        prismaValidatePassed: true, prismaGeneratePassed: true, details: [],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateSafetyScanResults', () => {
    it('rejects null', () => {
      expect(validateSafetyScanResults(null).valid).toBe(false);
    });

    it('rejects failed scans', () => {
      const result = validateSafetyScanResults([
        { scanName: 'privacy', passed: false, matchesFound: 1, allowedMatches: 0, forbiddenMatches: 1, details: ['violation'] },
      ]);
      expect(result.valid).toBe(false);
    });

    it('passes with all passing scans', () => {
      const result = validateSafetyScanResults([
        { scanName: 'privacy', passed: true, matchesFound: 0, allowedMatches: 0, forbiddenMatches: 0, details: [] },
      ]);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateChangeControlPolicy', () => {
    it('rejects null', () => {
      expect(validateChangeControlPolicy(null).valid).toBe(false);
    });

    it('passes with valid policy', () => {
      const result = validateChangeControlPolicy({
        policyName: 'Task 040 Backend Change Control Policy',
        createdAt: new Date().toISOString(),
        backendFrozen: true,
        rules: [{ ruleName: 'test', description: 'test', required: true }],
        statement: 'Backend is frozen.',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateFreezeManifest', () => {
    it('rejects null', () => {
      expect(validateFreezeManifest(null).valid).toBe(false);
    });

    it('passes with complete manifest', () => {
      const manifest = {
        taskId: '040',
        taskName: 'Final Backend Logic Freeze',
        freezeVersion: '1.0.0',
        createdAt: new Date().toISOString(),
        scope: 'backend_freeze_only',
        task036DependencyVerified: true,
        acceptedTaskLedgerCreated: true,
        acceptedTaskLedgerTaskCount: 17,
        backendSurfaceManifestCreated: true,
        contractInventoryCreated: true,
        serviceInventoryCreated: true,
        repositoryInventoryCreated: true,
        testInventoryCreated: true,
        scriptInventoryCreated: true,
        reportInventoryCreated: true,
        dirtyWorkspaceClassified: true,
        futureTaskContaminationClassified: true,
        outOfScopeManifestCreated: true,
        noDriftCheckPassed: true,
        regressionCheckPassed: true,
        safetyScansPassed: true,
        changeControlPolicyCreated: true,
      };
      expect(validateFreezeManifest(manifest).valid).toBe(true);
    });
  });

  describe('validateFreezeDecision', () => {
    it('rejects null', () => {
      expect(validateFreezeDecision(null).valid).toBe(false);
    });

    it('passes with accepted decision', () => {
      const result = validateFreezeDecision({
        backendFreezeCreated: true,
        backendFrozenThroughTask036: true,
        safeToStartFrontendIntegrationOrNextPhase: true,
        safeToModifyBackendWithoutChangeControl: false,
        finalDecision: 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED',
        remainingBlockers: [],
        proof: [],
      });
      expect(result.valid).toBe(true);
    });

    it('rejects blocked decision', () => {
      const result = validateFreezeDecision({
        backendFreezeCreated: false,
        backendFrozenThroughTask036: false,
        safeToStartFrontendIntegrationOrNextPhase: false,
        safeToModifyBackendWithoutChangeControl: false,
        finalDecision: 'TASK_040_BLOCKED',
        remainingBlockers: ['blocker'],
        proof: [],
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFreezeReport', () => {
    it('rejects null', () => {
      expect(validateFreezeReport(null).valid).toBe(false);
    });

    it('rejects verdict with forbidden phrases', () => {
      const result = validateFreezeReport({
        taskId: '040', taskName: 'test', scope: '',
        task036DependencyVerified: true, task040Started: '', backendFreezeCreated: true,
        backendFrozenThroughTask036: true, safeToStartFrontendIntegrationOrNextPhase: true,
        safeToModifyBackendWithoutChangeControl: false,
        newProductBehaviorCreated: false, frontendUiCreated: false, aiRuntimeChanged: false,
        liveAiCallIntroduced: false, liveConnectorWriteIntroduced: false, realNotificationsSent: false,
        productionDeploymentPerformed: false, prismaMigrationRun: false, productionDataMutationExecuted: false,
        rawPrivateDataStored: false, acceptedTaskLedgerCreated: true, acceptedTaskLedgerTaskCount: 17,
        acceptedTaskIds: ['020'], backendSurfaceManifestCreated: true, backendSurfaceRouteCount: 1,
        contractInventoryCreated: true, serviceInventoryCreated: true, repositoryInventoryCreated: true,
        testInventoryCreated: true, scriptInventoryCreated: true, reportInventoryCreated: true,
        dirtyWorkspaceClassified: true, dirtyWorkspaceEntryCount: 0, futureTaskContaminationClassified: true,
        futureTaskContaminationCount: 0, outOfScopeManifestCreated: true,
        noDriftCheckRun: true, noDriftCheckPassed: true,
        task020To036RegressionRun: true, task020To036RegressionPassed: true,
        phase3RegressionRun: true, phase3RegressionPassed: true,
        fullBackendSuiteRun: true, fullBackendSuitePassed: true,
        fullBackendSuiteFailedFiles: [], fullBackendSuiteFailedTests: [],
        backendTypecheckRun: true, backendTypecheckPassed: true,
        backendBuildRun: true, backendBuildPassed: true,
        prismaValidateRun: true, prismaValidatePassed: true,
        prismaGenerateRun: true, prismaGeneratePassed: true,
        task040FocusedTestsRun: true, task040FocusedTestsPassed: true,
        task040FocusedTestFiles: 45, task040FocusedAssertions: 400,
        task040VerificationScriptRun: true, task040VerificationScriptPassed: true,
        privacyScanRun: true, privacyScanPassed: true,
        noProductionMutationScanRun: true, noProductionMutationScanPassed: true,
        noLiveAiConnectorScanRun: true, noLiveAiConnectorScanPassed: true,
        noLiveNotificationScanRun: true, noLiveNotificationScanPassed: true,
        noFrontendUiScanRun: true, noFrontendUiScanPassed: true,
        noFutureTaskScanRun: true, noFutureTaskScanPassed: true,
        noFalsePassScanRun: true, noFalsePassScanPassed: true,
        changeControlPolicyCreated: true, freezeManifestCreated: true, freezeDecisionPassed: true,
        finalDecision: 'PENDING_VERIFICATION', verdict: 'PENDING_VERIFICATION',
        commandsRun: [], filesCreated: [], filesModified: [], filesStaged: [], filesIntentionallyNotStaged: [],
        remainingBlockers: [], generatedAt: '',
      });
      expect(result.valid).toBe(false);
    });

    it('passes with valid report', () => {
      const result = validateFreezeReport({
        taskId: '040', taskName: 'test', scope: '',
        task036DependencyVerified: true, task040Started: '', backendFreezeCreated: true,
        backendFrozenThroughTask036: true, safeToStartFrontendIntegrationOrNextPhase: true,
        safeToModifyBackendWithoutChangeControl: false,
        newProductBehaviorCreated: false, frontendUiCreated: false, aiRuntimeChanged: false,
        liveAiCallIntroduced: false, liveConnectorWriteIntroduced: false, realNotificationsSent: false,
        productionDeploymentPerformed: false, prismaMigrationRun: false, productionDataMutationExecuted: false,
        rawPrivateDataStored: false, acceptedTaskLedgerCreated: true, acceptedTaskLedgerTaskCount: 17,
        acceptedTaskIds: ['020', '021', '022', '023', '024', '025', '026', '027', '028', '029', '030', '031', '032', '033', '034', '035', '036'],
        backendSurfaceManifestCreated: true, backendSurfaceRouteCount: 1,
        contractInventoryCreated: true, serviceInventoryCreated: true, repositoryInventoryCreated: true,
        testInventoryCreated: true, scriptInventoryCreated: true, reportInventoryCreated: true,
        dirtyWorkspaceClassified: true, dirtyWorkspaceEntryCount: 0, futureTaskContaminationClassified: true,
        futureTaskContaminationCount: 0, outOfScopeManifestCreated: true,
        noDriftCheckRun: true, noDriftCheckPassed: true,
        task020To036RegressionRun: true, task020To036RegressionPassed: true,
        phase3RegressionRun: true, phase3RegressionPassed: true,
        fullBackendSuiteRun: true, fullBackendSuitePassed: true,
        fullBackendSuiteFailedFiles: [], fullBackendSuiteFailedTests: [],
        backendTypecheckRun: true, backendTypecheckPassed: true,
        backendBuildRun: true, backendBuildPassed: true,
        prismaValidateRun: true, prismaValidatePassed: true,
        prismaGenerateRun: true, prismaGeneratePassed: true,
        task040FocusedTestsRun: true, task040FocusedTestsPassed: true,
        task040FocusedTestFiles: 45, task040FocusedAssertions: 400,
        task040VerificationScriptRun: true, task040VerificationScriptPassed: true,
        privacyScanRun: true, privacyScanPassed: true,
        noProductionMutationScanRun: true, noProductionMutationScanPassed: true,
        noLiveAiConnectorScanRun: true, noLiveAiConnectorScanPassed: true,
        noLiveNotificationScanRun: true, noLiveNotificationScanPassed: true,
        noFrontendUiScanRun: true, noFrontendUiScanPassed: true,
        noFutureTaskScanRun: true, noFutureTaskScanPassed: true,
        noFalsePassScanRun: true, noFalsePassScanPassed: true,
        changeControlPolicyCreated: true, freezeManifestCreated: true, freezeDecisionPassed: true,
        finalDecision: 'TASK_040_FINAL_BACKEND_FREEZE_ACCEPTED', verdict: 'ACCEPTED_READY_YES',
        commandsRun: [], filesCreated: [], filesModified: [], filesStaged: [], filesIntentionallyNotStaged: [],
        remainingBlockers: [], generatedAt: '',
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateForbiddenOutputFields', () => {
    it('rejects if rawLearnerData is present', () => {
      const result = validateForbiddenOutputFields({ rawLearnerData: 'sensitive' });
      expect(result.valid).toBe(false);
    });

    it('passes if no forbidden fields', () => {
      const result = validateForbiddenOutputFields({ status: 'ok' });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateForbiddenSideEffects', () => {
    it('detects fetch() in code', () => {
      const result = validateForbiddenSideEffects('const x = fetch("http://example.com")');
      expect(result.valid).toBe(false);
    });

    it('passes with clean code', () => {
      const result = validateForbiddenSideEffects('const x = 1 + 2');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateForbiddenMutationPatterns', () => {
    it('detects prisma migrate deploy', () => {
      const result = validateForbiddenMutationPatterns('prisma migrate deploy --preview-feature');
      expect(result.valid).toBe(false);
    });

    it('passes with clean code', () => {
      const result = validateForbiddenMutationPatterns('prisma findMany()');
      expect(result.valid).toBe(true);
    });
  });

  describe('validateForbiddenStagedPaths', () => {
    it('detects AI/ path', () => {
      const result = validateForbiddenStagedPaths(['AI/ai/flows/test.ts']);
      expect(result.valid).toBe(false);
    });

    it('passes with allowed paths', () => {
      const result = validateForbiddenStagedPaths(['backend/src/contracts/task040BackendFreezeContracts.ts']);
      expect(result.valid).toBe(true);
    });
  });

  describe('validateAllowedStagedPaths', () => {
    it('allows known paths', () => {
      const result = validateAllowedStagedPaths(['backend/src/contracts/task040BackendFreezeContracts.ts']);
      expect(result.valid).toBe(true);
    });
  });
});
