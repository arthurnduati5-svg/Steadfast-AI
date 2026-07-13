import { describe, it, expect, beforeEach } from 'vitest';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';
import { buildFreezeManifest, getFreezeManifest } from '../services/task040FreezeManifestService';

describe('Task 040 - Freeze Manifest Service', () => {
  beforeEach(() => {
    task040Repository.clearTask040StoresForTests();
  });

  it('returns null when no manifest has been built', () => {
    expect(getFreezeManifest()).toBeNull();
  });

  it('builds freeze manifest with expected structure', () => {
    task040Repository.saveTask036Proof({
      verified: true, taskId: '036', commitHash: 'abc', handoffPath: '', reportPath: '', jsonReportPath: '',
      acceptanceVerdict: 'ACCEPTED_READY_YES', safeToStartTask040: true,
      finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040', remainingBlockersEmpty: true,
      dependencyProof: {} as any, checkedAt: '', notes: '',
    });
    task040Repository.saveAcceptedTaskLedger({ taskId: '040', entries: [], taskCount: 0, complete: false, generatedAt: '' });
    task040Repository.saveBackendSurfaceManifest({ taskId: '040', routeEntries: [], routeCount: 0, generatedAt: '' });
    task040Repository.saveContractInventory([]);
    task040Repository.saveServiceInventory([]);
    task040Repository.saveRepositoryInventory([]);
    task040Repository.saveTestInventory([]);
    task040Repository.saveScriptInventory([]);
    task040Repository.saveReportInventory([]);
    task040Repository.saveDirtyWorkspaceClassification([]);
    task040Repository.saveFutureTaskContaminationManifest([]);
    task040Repository.saveOutOfScopeManifest({ frontendFiles: [], aiFiles: [], futureTaskFiles: [], generatedOutputFiles: [], logFiles: [], cacheTempFiles: [], notes: '' });
    task040Repository.saveNoDriftCheck({ ok: true, task036ReportStillAccepted: true, task036SafeToStartTask040StillTrue: true, task040ModifiedTask036Runtime: false, task040ModifiedFrontend: false, task040ModifiedAiRuntime: false, task040ModifiedDeploymentLogic: false, task040IntroducedLiveIntegrations: false, details: [] });
    task040Repository.saveRegressionCheck({ ok: true, task020To036RegressionPassed: true, phase3RegressionPassed: true, fullBackendSuitePassed: true, typeScriptPassed: true, backendBuildPassed: true, prismaValidatePassed: true, prismaGeneratePassed: true, details: [] });
    task040Repository.saveChangeControlPolicy({ policyName: 'Task 040 Backend Change Control Policy', createdAt: '', backendFrozen: true, rules: [], statement: '' });

    const manifest = buildFreezeManifest();
    expect(manifest.taskId).toBe('040');
    expect(manifest.taskName).toBe('Final Backend Logic Freeze');
    expect(manifest.freezeVersion).toBe('1.0.0');
    expect(manifest.scope).toBe('backend_freeze_only');
  });

  it('is retrievable after build', async () => {
    await buildFreezeManifest();
    const retrieved = getFreezeManifest();
    expect(retrieved).not.toBeNull();
    expect(retrieved!.taskId).toBe('040');
  });
});
